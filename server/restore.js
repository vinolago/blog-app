const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const stream = require('stream');
const { promisify } = require('util');
require('dotenv').config();

const Post = require('./models/Post');
const Category = require('./models/Category');
const User = require('./models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadStream = promisify(cloudinary.uploader.upload_stream);

const restore = async (backupUrl) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let backup;
    if (backupUrl) {
      const response = await fetch(backupUrl);
      backup = await response.json();
    } else {
      const backups = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'blog-backups',
        resource_type: 'raw',
      });
      if (!backups.resources.length) throw new Error('No backups found');
      const latest = backups.resources[backups.resources.length - 1];
      const response = await fetch(latest.secure_url);
      backup = await response.json();
    }

    console.log(`Restoring backup from: ${backup.timestamp}`);

    await User.deleteMany({});
    await Post.deleteMany({});
    await Category.deleteMany({});

    if (backup.categories?.length) {
      await Category.insertMany(backup.categories);
      console.log(`Restored ${backup.categories.length} categories`);
    }
    if (backup.posts?.length) {
      await Post.insertMany(backup.posts);
      console.log(`Restored ${backup.posts.length} posts`);
    }
    if (backup.users?.length) {
      await User.insertMany(backup.users);
      console.log(`Restored ${backup.users.length} users`);
    }

    console.log('Restore complete');
    process.exit(0);
  } catch (err) {
    console.error('Restore failed:', err);
    process.exit(1);
  }
};

const args = process.argv.slice(2);
if (args[0] === 'restore' || require.main === module) {
  restore(args[1]).catch(console.error);
}

module.exports = restore;