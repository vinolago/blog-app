const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const Post = require('./models/Post');
const Category = require('./models/Category');
const User = require('./models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const backup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const posts = await Post.find({}).lean();
    const categories = await Category.find({}).lean();
    const users = await User.find({}).select('-password').lean();

    const backup = {
      timestamp: new Date().toISOString(),
      posts,
      categories,
      users,
    };

    const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(__dirname, 'backups', filename);
    
    if (!fs.existsSync(path.join(__dirname, 'backups'))) {
      fs.mkdirSync(path.join(__dirname, 'backups'));
    }

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    console.log(`Backup saved: ${filename}`);

    const result = await cloudinary.uploader.upload(filepath, {
      resource_type: 'raw',
      folder: 'blog-backups',
      public_id: filename.replace('.json', ''),
    });
    console.log(`Uploaded to Cloudinary: ${result.secure_url}`);

    fs.unlinkSync(filepath);
    console.log('Backup complete');

    process.exit(0);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  backup();
}

module.exports = backup;