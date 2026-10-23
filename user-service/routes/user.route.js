const userController = require('../controllers/user.controller');

const routes = async (fastify) => {
  fastify.get('/api/v1/users', userController.getUsers);
  fastify.get('/api/v1/users/:id', userController.getUser);
  fastify.post('/api/v1/users', userController.createUser);
  fastify.put('/api/v1/users/:id', userController.updateUser);
  fastify.delete('/api/v1/users/:id', userController.deleteUser);
};

module.exports = routes;
