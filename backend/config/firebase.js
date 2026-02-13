import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let bucket = null;

const initializeFirebase = () => {
  try {
    // Check if Firebase credentials are provided
    if (!process.env.FIREBASE_PROJECT_ID || 
        !process.env.FIREBASE_PRIVATE_KEY || 
        !process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('Firebase credentials not found. File upload will use local storage.');
      return null;
    }

    // Initialize Firebase Admin
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    bucket = admin.storage().bucket();
    console.log('Firebase Storage initialized successfully');
    return bucket;
  } catch (error) {
    console.error('Error initializing Firebase:', error.message);
    console.log('Falling back to local storage');
    return null;
  }
};

// Initialize on import
bucket = initializeFirebase();

export const getStorageBucket = () => bucket;

export const uploadFileToFirebase = async (file, shortId) => {
  if (!bucket) {
    throw new Error('Firebase Storage not initialized');
  }

  const fileName = `${shortId}/${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  await fileUpload.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });

  // Make the file publicly accessible
  await fileUpload.makePublic();

  // Get the public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  
  return publicUrl;
};

export const deleteFileFromFirebase = async (fileUrl) => {
  if (!bucket) {
    return;
  }

  try {
    // Extract file path from URL
    const fileName = fileUrl.split(`${bucket.name}/`)[1];
    if (fileName) {
      await bucket.file(fileName).delete();
      console.log(`Deleted file: ${fileName}`);
    }
  } catch (error) {
    console.error('Error deleting file from Firebase:', error.message);
  }
};

export default { getStorageBucket, uploadFileToFirebase, deleteFileFromFirebase };
