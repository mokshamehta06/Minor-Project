const dotenv = require('dotenv');
dotenv.config();

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadOnCloudinary(fileOrPath) {
  if (!fileOrPath) throw new Error('No file provided for upload');

  // if a buffer (e.g. memory storage) is provided, use upload_stream
  if (fileOrPath.buffer) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      stream.end(fileOrPath.buffer);
    });
  }

  const filePath = typeof fileOrPath === 'string'
    ? fileOrPath
    : (fileOrPath.path || (fileOrPath.destination && fileOrPath.filename ? path.join(fileOrPath.destination, fileOrPath.filename) : undefined));

  if (!filePath) throw new Error('No file path available for upload');

  try {
    const result = await cloudinary.uploader.upload(filePath, { resource_type: 'auto' });
    // cleanup local temp file if exists
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e){ console.warn('cleanup failed', e.message); }
    return result;
  } catch (err) {
    try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e){}
    throw err;
  }
}

module.exports = { uploadOnCloudinary };

