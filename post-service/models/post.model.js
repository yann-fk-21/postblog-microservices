const mongoose = require('mongoose');

const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
    },
    description: {
      type: String,
    },
    imageLink: String,
    userId: {
      type: Number,
      required: [true, 'userId is required'],
      default: '1',
    },
  },
  {
    timestamps: true,
  },
);

const Post = mongoose.model('Post', PostSchema);

module.exports = { Post };
