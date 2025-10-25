// Utility script to fix existing categories that might be missing slugs
const mongoose = require('mongoose');
const Category = require('../models/Category');

const fixCategories = async () => {
  try {
    // Find all categories without slugs
    const categoriesWithoutSlugs = await Category.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });

    console.log(`Found ${categoriesWithoutSlugs.length} categories without slugs`);

    for (const category of categoriesWithoutSlugs) {
      // Generate slug from name
      const slug = category.name
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');

      // Update the category with the slug
      await Category.findByIdAndUpdate(category._id, { slug });
      console.log(`Fixed category: ${category.name} -> ${slug}`);
    }

    console.log('All categories fixed!');
  } catch (error) {
    console.error('Error fixing categories:', error);
  }
};

module.exports = fixCategories;
