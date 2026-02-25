// Post.js - Mongoose model for blog posts

const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide content'],
    },
    featuredImage: {
      type: String,
      default: 'default-post.jpg',
    },
    slug: {
      type: String,
      unique: true,
    },
    excerpt: {
      type: String,
      required: true,
      maxlength: [200, 'Excerpt cannot be more than 200 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    tags: [String],
    isPublished: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Create slug from title before saving
PostSchema.pre('save', async function (next) {
  if (!this.isModified('title') && this.slug) {
    return next();
  }
  
  // Generate initial slug from title
  let baseSlug = this.title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
  
  // Check if slug already exists
  let slug = baseSlug;
  let counter = 1;
  
  // Find existing posts with similar slug
  const query = this._id 
    ? { slug: { $regex: `^${baseSlug}` }, _id: { $ne: this._id } }
    : { slug: { $regex: `^${baseSlug}` } };
  
  const existingPost = await this.constructor.findOne(query).sort({ slug: -1 });
  
  if (existingPost) {
    // If the exact slug exists, append a counter
    const existingSlugParts = existingPost.slug.split('-');
    const lastPart = existingSlugParts[existingSlugParts.length - 1];
    if (/^\d+$/.test(lastPart)) {
      counter = parseInt(lastPart) + 1;
      slug = `${baseSlug}-${counter}`;
    } else {
      slug = `${baseSlug}-${counter}`;
    }
  }
  
  this.slug = slug;
  next();
});

// Virtual for post URL
PostSchema.virtual('url').get(function () {
  return `/posts/${this.slug}`;
});

// Method to add a comment
PostSchema.methods.addComment = function (userId, content) {
  this.comments.push({ user: userId, content });
  return this.save();
};

// Method to increment view count
PostSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

module.exports = mongoose.model('Post', PostSchema); 