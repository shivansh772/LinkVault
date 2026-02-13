// Validation middleware for content upload
export const validateUpload = (req, res, next) => {
  const { type, textContent, expiresAt } = req.body;
  const file = req.file;

  // Check if type is provided
  if (!type || !['text', 'file'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing content type. Must be "text" or "file".'
    });
  }

  // Validate text upload
  if (type === 'text') {
    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text content is required for text uploads.'
      });
    }
    if (textContent.length > 1000000) { // 1MB text limit
      return res.status(400).json({
        success: false,
        message: 'Text content is too large. Maximum 1MB.'
      });
    }
  }

  // Validate file upload
  if (type === 'file') {
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File is required for file uploads.'
      });
    }
  }

  // Validate expiry date if provided
  if (expiresAt) {
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expiry date format.'
      });
    }
    if (expiryDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be in the future.'
      });
    }
  }

  next();
};

// Validation for password-protected content
export const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (password && password.length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 4 characters long.'
    });
  }

  next();
};

export default { validateUpload, validatePassword };
