import { nanoid } from 'nanoid';
import Content from '../models/Content.js';
import { uploadFileToFirebase, deleteFileFromFirebase, getStorageBucket } from '../config/firebase.js';
import fs from 'fs';
import path from 'path';

// Helper to calculate expiry date
const calculateExpiryDate = (expiresAt) => {
  if (expiresAt) {
    return new Date(expiresAt);
  }
  // Default: 10 minutes from now
  const defaultExpiry = parseInt(process.env.DEFAULT_EXPIRY_MINUTES) || 10;
  return new Date(Date.now() + defaultExpiry * 60 * 1000);
};

// Upload content (text or file)
export const uploadContent = async (req, res) => {
  try {
    const { type, textContent, expiresAt, password, oneTimeView, maxViews } = req.body;
    const file = req.file;

    // Generate unique short ID
    const shortId = nanoid(10);

    // Calculate expiry
    const expiryDate = calculateExpiryDate(expiresAt);

    // Prepare content data
    const contentData = {
      shortId,
      type,
      expiresAt: expiryDate,
      password: password || null,
      oneTimeView: oneTimeView === 'true' || oneTimeView === true,
      maxViews: maxViews ? parseInt(maxViews) : null
    };

    // Handle text content
    if (type === 'text') {
      contentData.textContent = textContent;
    }

    // Handle file content
    if (type === 'file' && file) {
      const bucket = getStorageBucket();
      
      if (bucket) {
        // Upload to Firebase
        try {
          const fileUrl = await uploadFileToFirebase(file, shortId);
          contentData.fileUrl = fileUrl;
          contentData.fileName = file.originalname;
          contentData.fileSize = file.size;
          contentData.mimeType = file.mimetype;

          // Delete local file after uploading to Firebase
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (firebaseError) {
          console.error('Firebase upload error:', firebaseError);
          // Fall back to local storage
          contentData.fileUrl = `/uploads/${file.filename}`;
          contentData.fileName = file.originalname;
          contentData.fileSize = file.size;
          contentData.mimeType = file.mimetype;
        }
      } else {
        // Use local storage
        contentData.fileUrl = `/uploads/${file.filename}`;
        contentData.fileName = file.originalname;
        contentData.fileSize = file.size;
        contentData.mimeType = file.mimetype;
      }
    }

    // Save to database
    const content = new Content(contentData);
    await content.save();

    // Generate shareable URL
    const shareUrl = `${process.env.BASE_URL}/view/${shortId}`;

    res.status(201).json({
      success: true,
      message: 'Content uploaded successfully',
      data: {
        shortId,
        shareUrl,
        expiresAt: expiryDate,
        type,
        hasPassword: !!password,
        oneTimeView: contentData.oneTimeView,
        maxViews: contentData.maxViews
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload content',
      error: error.message
    });
  }
};

// Get content by short ID
export const getContent = async (req, res) => {
  try {
    const { shortId } = req.params;
    const { password } = req.query;

    // Find content
    const content = await Content.findOne({ shortId });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Check if content can be viewed
    if (!content.canView()) {
      return res.status(403).json({
        success: false,
        message: 'Content is no longer available',
        reason: content.isDeleted ? 'deleted' : 
                content.isExpired() ? 'expired' : 
                'max_views_reached'
      });
    }

    // Check password if required
    if (content.password) {
      if (!password || password !== content.password) {
        return res.status(401).json({
          success: false,
          message: 'Password required or incorrect',
          requiresPassword: true
        });
      }
    }

    // Increment view count
    await content.incrementView();

    // Prepare response data
    const responseData = {
      shortId: content.shortId,
      type: content.type,
      createdAt: content.createdAt,
      expiresAt: content.expiresAt,
      viewCount: content.viewCount,
      oneTimeView: content.oneTimeView,
      maxViews: content.maxViews
    };

    if (content.type === 'text') {
      responseData.textContent = content.textContent;
    } else if (content.type === 'file') {
      responseData.fileName = content.fileName;
      responseData.fileUrl = content.fileUrl;
      responseData.fileSize = content.fileSize;
      responseData.mimeType = content.mimeType;
    }

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content',
      error: error.message
    });
  }
};

// Delete content manually
export const deleteContent = async (req, res) => {
  try {
    const { shortId } = req.params;

    const content = await Content.findOne({ shortId });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Delete file from Firebase if exists
    if (content.type === 'file' && content.fileUrl) {
      const bucket = getStorageBucket();
      if (bucket && content.fileUrl.includes('storage.googleapis.com')) {
        await deleteFileFromFirebase(content.fileUrl);
      } else if (content.fileUrl.startsWith('/uploads/')) {
        // Delete local file
        const filePath = path.join('./uploads', path.basename(content.fileUrl));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Mark as deleted instead of removing from DB (for audit trail)
    content.isDeleted = true;
    content.deletedAt = new Date();
    await content.save();

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete content',
      error: error.message
    });
  }
};

// Get content metadata (without incrementing view count)
export const getContentMetadata = async (req, res) => {
  try {
    const { shortId } = req.params;

    const content = await Content.findOne({ shortId });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        type: content.type,
        fileName: content.fileName,
        requiresPassword: !!content.password,
        expiresAt: content.expiresAt,
        isExpired: content.isExpired(),
        canView: content.canView()
      }
    });

  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metadata',
      error: error.message
    });
  }
};

export default { uploadContent, getContent, deleteContent, getContentMetadata };
