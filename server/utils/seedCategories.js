// Seed script to create default categories
const mongoose = require('mongoose');
const Category = require('../models/Category');
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

    // Clear existing categories (optional - comment out to keep existing)
    // await Category.deleteMany({});
    // console.log('Cleared existing categories');

    for (const cat of categories) {
      // Check if category already exists
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        await Category.create(cat);
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
    }

    console.log('Category seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
