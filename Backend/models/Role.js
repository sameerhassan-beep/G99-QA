const { DataTypes } = require('sequelize');

// Lazy load database to avoid binding errors if sqlite3 fails
let sequelize;
try {
  sequelize = require('../config/database');
} catch (err) {
  console.warn('Role model: Database configuration not available');
}

const Role = sequelize ? sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  }
}) : {
  findOne: async () => null,
  findByPk: async () => null,
  create: async () => { throw new Error('Database not available') },
  findAll: async () => []
};

module.exports = Role; 