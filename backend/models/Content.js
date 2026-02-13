import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['text', 'file'],
    required: true
  },
  // For text content
  textContent: {
    type: String,
    default: null
  },
  // For file content
  fileName: {
    type: String,
    default: null
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  mimeType: {
    type: String,
    default: null
  },
  // Access control
  password: {
    type: String,
    default: null
  },
  oneTimeView: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  maxViews: {
    type: Number,
    default: null
  },
  // Expiry
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Tracking
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
});

// Index for automatic cleanup
contentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if content is expired
contentSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to check if content can be viewed
contentSchema.methods.canView = function() {
  if (this.isDeleted) return false;
  if (this.isExpired()) return false;
  if (this.maxViews && this.viewCount >= this.maxViews) return false;
  return true;
};

// Method to increment view count
contentSchema.methods.incrementView = async function() {
  this.viewCount += 1;
  
  // If one-time view, mark as deleted
  if (this.oneTimeView || (this.maxViews && this.viewCount >= this.maxViews)) {
    this.isDeleted = true;
    this.deletedAt = new Date();
  }
  
  await this.save();
};

const Content = mongoose.model('Content', contentSchema);

export default Content;
