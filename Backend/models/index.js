const User = require('./User');
const Role = require('./Role');

// Set up associations only if models are real Sequelize models
if (Role.hasMany && User.belongsTo) {
  Role.hasMany(User);
  User.belongsTo(Role);
}

module.exports = {
  User,
  Role
}; 