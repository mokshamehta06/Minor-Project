// Require the cloudinary library
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path')
// Return "https" URLs by setting secure: true
cloudinary.config({
  secure: true,
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET
});

// Log the configuration
console.log(cloudinary.config());
async function uploadOnCloudinary(fileOrPath) {
  // accept either req.file object or a raw path string
  const filePath = typeof fileOrPath === 'string'
    ? fileOrPath
    : (fileOrPath && (fileOrPath.path || path.join(fileOrPath.destination || 'public/temp', fileOrPath.filename)));

  if(!filePath) {
    throw new Error('No file path provided for upload');
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, { resource_type: 'auto' });

    // try delete the temp file if exists
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) { console.warn('Cleanup failed', e.message); }

    return result; // result.secure_url etc.
  } catch (err) {
    // cleanup if exists, then rethrow
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) { /* ignore */ }
    throw err;
  }
}

module.exports = {uploadOnCloudinary};

