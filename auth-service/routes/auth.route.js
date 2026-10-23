const fastify = require('fastify');
const authController = require('../controllers/auth.controller');

const routes = async (fastify) => {
  fastify.post('/api/v1/auth/login', authController.loginUser);
};

module.exports = routes;
