const { Auth } = require('../models/auth.model');
const { status } = require('http-status');
const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../events/user-auth.client');

const loginUser = async (request, reply) => {
  try {
    const { email, password } = request.body || {};
    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return reply.code(status.BAD_REQUEST).send({
        message: 'email and password are required',
      });
    }

    const user = await authenticateUser(email.trim(), password);
    if (!user) {
      return reply.code(status.UNAUTHORIZED).send({
        message: 'Invalid email or password',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign({ sub: user.id }, secret, { expiresIn: '1h' });
    await Auth.create({ userId: user.id, token });

    return reply.code(status.OK).send({
      message: 'Login successful',
      user: { id: user.id },
      token,
    });
  } catch (error) {
    request.log.error({ err: error }, 'Login failed');
    return reply.code(status.INTERNAL_SERVER_ERROR).send({
      message: 'Login user failed',
    });
  }
};

module.exports = { loginUser };
