import admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid';

let bucket;

const initializeFirebase = () => {
  const getPrivateKey = () => {
    const key = process.env.FIREBASE_PRIVATE_KEY;
    if (!key) {
      throw new Error('FIREBASE_PRIVATE_KEY is not set in environment variables');
    }
    return key.replace(/\\n/g, '\n');
  };

  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: getPrivateKey(),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: "googleapis.com",
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  bucket = admin.storage().bucket();
};

const uploadFileToFirebase = async (file, folder) => {
  if (!bucket) {
    throw new Error('Firebase not initialized');
  }

  const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (error) => reject(error));
    blobStream.on('finish', async () => {
      await fileUpload.makePublic();

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileUpload.name)}?alt=media`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

export { initializeFirebase, uploadFileToFirebase }