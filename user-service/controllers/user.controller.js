const { status } = require('http-status');

const { User } = require('../models/user.model');
const { hashPassword, returnError } = require('../utils/utils');

const getUsers = async (request, reply) => {
  try {
    const retrievedUsers = await User.findAll();

    if (!retrievedUsers) {
      return reply
        .code(status.OK)
        .send({ message: 'There is no users', users: [] });
    }

    return reply
      .code(status.OK)
      .send({ message: 'Users retrieved successfully', users: retrievedUsers });
  } catch (error) {
    returnError(reply, error, 'Users fetching failed');
  }
};

const getUser = async (request, reply) => {
  try {
    const { id } = request.params;
    const retrievedUser = await User.findByPk(id);

    if (!retrievedUser) {
      return reply
        .code(status.NOT_FOUND)
        .send({ message: `User ${id} not found!` });
    }

    return reply
      .code(status.OK)
      .send({ message: 'User retrieved successfully', user: retrievedUser });
  } catch (error) {
    returnError(reply, error, 'User fetching failed');
  }
};

const createUser = async (request, reply) => {
  try {
    const userInformations = request.body;
    if (!userInformations) {
      return reply
        .code(status.BAD_GATEWAY)
        .send({ message: 'Invalid user inputs' });
    }

    const hashedPassword = await hashPassword(userInformations.password);
    userInformations.password = hashedPassword;

    const userCreates = await User.create(userInformations);
    reply
      .code(status.CREATED)
      .send({ message: 'user has been created', userCreates: userCreates });
  } catch (error) {
    returnError(reply, error, 'User creation failed');
  }
};

const updateUser = async (request, reply) => {
  try {
    const { id } = request.params;
    const userSought = await User.findByPk(id);

    if (!userSought) {
      return reply.code(status.NOT_FOUND).send({
        message: `User ${id} not found`,
      });
    }

    const updatedUser = await userSought.update(request.body);
    return reply
      .code(status.OK)
      .send({ message: `User ${id} is updated`, updatedUser: updatedUser });
  } catch (error) {
    returnError(reply, error, 'User updating failed');
  }
};

const deleteUser = async (request, reply) => {
  try {
    const { id } = request.params;
    const userSought = await User.findByPk(id);

    if (!userSought) {
      return reply.code(status.NOT_FOUND).send({
        message: `User ${id} not found`,
      });
    }

    await userSought.destroy();
    return reply.code(status.OK).send({ message: `User ${id} is deleted` });
  } catch (error) {
    returnError(reply, error, 'User deleting failed');
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
