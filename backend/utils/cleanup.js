import cron from 'node-cron';
import Content from '../models/Content.js';
import { deleteFileFromFirebase, getStorageBucket } from '../config/firebase.js';
import fs from 'fs';
import path from 'path';

// Clean up expired content
export const cleanupExpiredContent = async () => {
  try {
    const now = new Date();
    
    // Find all expired content that hasn't been deleted yet
    const expiredContent = await Content.find({
      expiresAt: { $lt: now },
      isDeleted: false
    });

    console.log(`Found ${expiredContent.length} expired items to clean up`);

    for (const content of expiredContent) {
      // Delete file if it's a file upload
      if (content.type === 'file' && content.fileUrl) {
        const bucket = getStorageBucket();
        
        if (bucket && content.fileUrl.includes('storage.googleapis.com')) {
          // Delete from Firebase
          try {
            await deleteFileFromFirebase(content.fileUrl);
            console.log(`Deleted Firebase file: ${content.shortId}`);
          } catch (error) {
            console.error(`Error deleting Firebase file ${content.shortId}:`, error.message);
          }
        } else if (content.fileUrl.startsWith('/uploads/')) {
          // Delete local file
          const filePath = path.join('./uploads', path.basename(content.fileUrl));
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              console.log(`Deleted local file: ${content.shortId}`);
            } catch (error) {
              console.error(`Error deleting local file ${content.shortId}:`, error.message);
            }
          }
        }
      }

      // Mark as deleted
      content.isDeleted = true;
      content.deletedAt = now;
      await content.save();
    }

    console.log(`Cleanup completed: ${expiredContent.length} items processed`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Schedule cleanup job to run every 5 minutes
export const scheduleCleanup = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running scheduled cleanup...');
    await cleanupExpiredContent();
  });

  console.log('Cleanup job scheduled (runs every 5 minutes)');
};

// Manual cleanup endpoint
export const manualCleanup = async (req, res) => {
  try {
    await cleanupExpiredContent();
    res.status(200).json({
      success: true,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
};

export default { cleanupExpiredContent, scheduleCleanup, manualCleanup };
