const sequelize = require('sequelize');
const path = require('node:path');

const { Sequelize, DataTypes } = sequelize;

const squelizeDB = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', '/db/database.sqlite'),
});

const User = squelizeDB.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
  },
  { timestamps: true },
);

module.exports = { User, squelizeDB };
