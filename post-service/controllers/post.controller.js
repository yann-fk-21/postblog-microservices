const {
  uploadImageToRemoteStorage,
  checkTokenValidity,
  checkAuthorization,
} = require('../utils/utils');
const { status } = require('http-status');
const { Post } = require('../models/post.model');
const { userExists } = require('../events/user-check.client');

const returnError = (reply, error) => {
  return reply
    .code(error.statusCode || status.INTERNAL_SERVER_ERROR)
    .send({ message: error.message, error: error });
};

const getPosts = async (request, reply) => {
  try {
    const posts = await Post.find();

    if (!posts) {
      return reply.code(status.OK).send({ posts: [] });
    }

    return reply.code(status.OK).send({ posts: posts });
  } catch (error) {
    returnError(reply, error);
  }
};

const getPostsByUserId = async (request, reply) => {
  try {
    const { userId } = request.params;
    const token = request.headers.authorization;

    if (!(await checkTokenValidity(reply, request.headers.authorization))) {
      return;
    }

    if (!(await userExists(userId))) {
      return reply
        .code(status.NOT_FOUND)
        .send({ message: `user ${userId} not found` });
    }

    if (!(await checkAuthorization(token, userId))) {
      return reply
        .code(status.UNAUTHORIZED)
        .send({ message: `User ${userId} is not authorized` });
    }

    const userPosts = await Post.find({ userId });

    if (!userPosts) {
      return reply
        .code(status.NOT_FOUND)
        .send({ message: 'User has not posts yet', posts: [] });
    }

    return reply.code(status.OK).send({
      message: "user's posts has found successfully",
      posts: userPosts,
    });
  } catch (error) {
    returnError(reply, error);
  }
};

const getPost = async (request, reply) => {
  const { id } = request.params;
  try {
    const post = await Post.findById(id);
    if (!post) {
      return reply
        .code(status.NOT_FOUND)
        .send({ message: `post ${id} not found` });
    }

    return reply
      .code(status.OK)
      .send({ message: 'Getting post successfully', post: post });
  } catch (error) {
    returnError(reply, error);
  }
};

const createPost = async (request, reply) => {
  try {
    const token = request.headers.authorization;
    if (!(await checkTokenValidity(reply, token))) {
      return;
    }

    const file = await request.file();
    const { title, description, userId } = Object.fromEntries(
      Object.entries(file.fields).map(([key, field]) => [key, field.value]),
    );

    if (!userId) {
      return reply
        .code(status.BAD_REQUEST)
        .send({ message: 'userId is required' });
    }

    if (!(await userExists(userId))) {
      return reply
        .code(status.BAD_REQUEST)
        .send({ message: `User ${userId} does not exist` });
    }

    if (!(await checkAuthorization(token, userId))) {
      return reply
        .code(status.UNAUTHORIZED)
        .send({ message: `User ${userId} is not authorized` });
    }

    const imageLink = await uploadImageToRemoteStorage(file);

    if (!imageLink) {
      return reply.code(status.BAD_REQUEST).send('upload image failed!');
    }

    const newPost = await Post.create({
      title,
      description,
      userId,
      imageLink,
    });

    return reply
      .code(status.CREATED)
      .send({ message: 'Post is created successfully!', post: newPost });
  } catch (error) {
    returnError(reply, error);
  }
};

const updatePost = async (request, reply) => {
  try {
    const { id } = request.params;
    const postData = request.body;

    if (!(await checkTokenValidity(reply, request.headers.authorization))) {
      return;
    }

    if (!(await checkAuthorization(token, userId))) {
      return reply
        .code(status.UNAUTHORIZED)
        .send({ message: `User ${userId} is not authorized` });
    }

    const post = await Post.findByIdAndUpdate(id, postData);

    if (!post) {
      return reply.code(status.NOT_FOUND).send({ message: 'post not found!' });
    }

    return reply.code(status.OK).send({ message: `Post ${id} is updated!` });
  } catch (error) {
    returnError(reply, error);
  }
};

const deletePost = async (request, reply) => {
  try {
    const { id } = request.params;

    if (!(await checkTokenValidity(reply, request.headers.authorization))) {
      return;
    }

    if (!(await checkAuthorization(token, userId))) {
      return reply
        .code(status.UNAUTHORIZED)
        .send({ message: `User ${userId} is not authorized` });
    }

    const post = await Post.findByIdAndDelete(id);

    if (!post) {
      return reply
        .code(status.NOT_FOUND)
        .send({ message: `Post ${id} not found!` });
    }

    return reply.code(status.OK).send({ message: `Post ${id} is deleted!` });
  } catch (error) {
    returnError(reply, error);
  }
};

module.exports = {
  getPosts,
  createPost,
  getPostsByUserId,
  getPost,
  updatePost,
  deletePost,
};
