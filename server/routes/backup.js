const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const Post = require('../models/Post');
const Category = require('../models/Category');
const User = require('../models/User');

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const router = express.Router();

const authCheck = (req) => {
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${process.env.CRON_SECRET_KEY}`;
};

router.all('/backup', async (req, res) => {
  try {
    if (!authCheck(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    const [posts, categories, users] = await Promise.all([
      Post.find({}).lean(),
      Category.find({}).lean(),
      User.find({}).select('-password').lean(),
    ]);

    const backup = {
      timestamp: new Date().toISOString(),
      version: 1,
      posts,
      categories,
      users,
    };

    const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const result = await cloudinary.uploader.upload(`data:application/json;base64,${Buffer.from(JSON.stringify(backup)).toString('base64')}`, {
      resource_type: 'raw',
      folder: 'blog-backups',
      public_id: filename.replace('.json', ''),
    });

    res.json({ success: true, backupUrl: result.secure_url, timestamp: backup.timestamp });
  } catch (err) {
    console.error('Backup API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/restore', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { backupUrl } = req.body;
    if (!backupUrl) {
      return res.status(400).json({ success: false, error: 'backupUrl required' });
    }

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    const response = await fetch(backupUrl);
    const backup = await response.json();

    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Category.deleteMany({}),
    ]);

    if (backup.categories?.length) await Category.insertMany(backup.categories);
    if (backup.posts?.length) await Post.insertMany(backup.posts);
    if (backup.users?.length) await User.insertMany(backup.users);

    res.json({ success: true, restored: backup.timestamp });
  } catch (err) {
    console.error('Restore API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;