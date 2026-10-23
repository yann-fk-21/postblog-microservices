const mongoose = require('mongoose');

const { Schema } = mongoose;

const AuthSchema = new Schema(
  {
    userId: {
      type: Number,
      required: [true, 'userId is required'],
    },
    token: {
      type: String,
      required: [true, 'token is required'],
    },
  },
  { timestamps: true },
);

const Auth = mongoose.model('Auth', AuthSchema);

module.exports = { Auth };
