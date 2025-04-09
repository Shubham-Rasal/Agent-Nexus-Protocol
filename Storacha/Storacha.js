import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { create } from '@web3-storage/w3up-client';
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

console.log(`Environment Variables: ${JSON.stringify(process.env)}`);

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
(async () => {
  try {
    await fs.mkdir('./uploads', { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
})();

// Handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    
    // Initialize web3.storage client
    const client = await create();
    
    // Login with your account
    await client.login('singhabhayjit07@gmail.com');
    
    // Set current space
    const current_space = process.env.STORACHA_SPACE;
    await client.setCurrentSpace(current_space);
    console.log(`Current space set to: ${current_space}`);
    
    // Read the uploaded file
    const fileContent = await fs.readFile(filePath);
    
    // Create a File object
    const file = new File([fileContent], req.file.originalname);
    
    // Upload to web3.storage
    const cid = await client.uploadFile(file);
    console.log(`File uploaded with CID: ${cid}`);


    // Clean up the temporary file
    await fs.unlink(filePath);
    
    // Return success response with CID
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      cid: cid.toString(),
      filename: req.file.originalname
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('File Upload API is running. Use POST /upload to upload files.');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});