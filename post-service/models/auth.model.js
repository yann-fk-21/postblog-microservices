const mongoose = require('mongoose');

const { Schema } = mongoose;
const authConnection = mongoose.createConnection();

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

const Auth = authConnection.model('Auth', AuthSchema);

module.exports = { Auth, authConnection };
