// Seed script to create default categories and fix existing posts
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Post = require('../models/Post');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const categories = [
  { name: 'Startup Advice', description: 'Tips and guidance for building startups' },
  { name: 'Venture Capital', description: 'Insights about VC funding and investors' },
  { name: 'Software', description: 'Software development and engineering' },
  { name: 'Websites', description: 'Web development and design' },
  { name: 'Branding', description: 'Brand strategy and identity' },
  { name: 'Marketing', description: 'Digital marketing strategies' },
  { name: 'Product', description: 'Product development and management' },
  { name: 'Growth', description: 'Growth hacking and scaling' },
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blog-app');
    console.log('Connected to MongoDB');

    // Create categories
    const createdCategories = {};
    for (const cat of categories) {
      let existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        existing = await Category.create(cat);
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
      createdCategories[cat.name] = existing._id;
    }

    // Find posts with invalid categories (categories that don't exist in Category collection)
    const posts = await Post.find({});
    let fixedCount = 0;
    
    for (const post of posts) {
      // Check if category is a valid ObjectId that exists in Category collection
      if (post.category) {
        const categoryExists = await Category.findById(post.category);
        if (!categoryExists) {
          // Category doesn't exist, assign a default category
          post.category = createdCategories['Software']; // Default to 'Software'
          await post.save();
          console.log(`Fixed post: ${post.title} (assigned to 'Software' category)`);
          fixedCount++;
        }
      }
    }

    console.log(`\nSeeding complete! Created ${Object.keys(createdCategories).length} categories, fixed ${fixedCount} posts.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
