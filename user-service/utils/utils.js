const bcrypt = require('bcrypt');
const { status } = require('http-status');

const saltRounds = 10;

const hashPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    const hashError = new Error('password hashing failed!');
    hashError.statusCode = status.INTERNAL_SERVER_ERROR;
  }
};

const returnError = (reply, error, message) => {
  return reply
    .code(error.statusCode || status.INTERNAL_SERVER_ERROR)
    .send({ message: message, error: error });
};

module.exports = { hashPassword, returnError };
