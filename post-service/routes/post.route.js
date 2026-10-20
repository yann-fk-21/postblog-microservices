const postController = require('../controllers/post.controller');

const routes = async (fastify) => {
  fastify.get('/api/v1/posts', postController.getPosts);

  fastify.get('/api/v1/posts/:id', postController.getPost);

  fastify.post('/api/v1/posts', postController.createPost);

  fastify.put('/api/v1/posts/:id', postController.updatePost);

  fastify.delete('/api/v1/posts/:id', postController.deletePost);
};

module.exports = routes;
