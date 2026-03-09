const { DataTypes } = require('sequelize');
const path = require('path');

// Lazy load database to avoid binding errors if sqlite3 fails
let sequelize;
try {
  sequelize = require('../config/database');
} catch (err) {
  console.warn('User model: Database configuration not available');
}

// Lazy load bcrypt to avoid binding errors
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (err) {
  console.warn('User model: bcrypt not available');
}

const User = sequelize ? sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}) : {
  findOne: async () => null,
  findByPk: async () => null,
  create: async () => { throw new Error('Database not available') },
  findAll: async () => []
};

if (sequelize && User.beforeCreate) {
  // Hash password before saving
  User.beforeCreate(async (user) => {
    user.password = await bcrypt.hash(user.password, 10);
  });
}

module.exports = User; 