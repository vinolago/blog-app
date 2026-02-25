// Utility to fix posts without slugs
// Run this once to generate slugs for existing posts

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const Post = require('../models/Post');

async function fixPostSlugs() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blog-app');
    console.log('Connected to MongoDB');

    // Find all posts without slugs
    const postsWithoutSlugs = await Post.find({ slug: { $exists: false } });
    console.log(`Found ${postsWithoutSlugs.length} posts without slugs`);

    for (const post of postsWithoutSlugs) {
      // Generate slug from title
      let baseSlug = post.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      
      // Check for existing slugs
      let slug = baseSlug;
      let counter = 1;
      
      const existingPost = await Post.findOne({ slug: { $regex: `^${baseSlug}` } }).sort({ slug: -1 });
      
      if (existingPost) {
        const existingSlugParts = existingPost.slug.split('-');
        const lastPart = existingSlugParts[existingSlugParts.length - 1];
        if (/^\d+$/.test(lastPart)) {
          counter = parseInt(lastPart) + 1;
          slug = `${baseSlug}-${counter}`;
        } else {
          slug = `${baseSlug}-${counter}`;
        }
      }
      
      post.slug = slug;
      await post.save();
      console.log(`Fixed post: ${post.title} -> ${slug}`);
    }

    console.log('Done fixing post slugs!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing post slugs:', error);
    process.exit(1);
  }
}

fixPostSlugs();
