const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Lazy load sequelize to avoid sqlite3 binding issues if DB is not needed (e.g. for screenshots)
let sequelize;
try {
  sequelize = require('./config/database');
} catch (err) {
  console.warn('Could not load database configuration:', err.message);
}

const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
const screenshotRoutes = require('./routes/screenshotRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/screenshots', screenshotRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

let server;

// Function to start server
const startServer = async () => {
  if (sequelize) {
    try {
      await sequelize.sync();
      console.log('Database synced successfully');
    } catch (err) {
      console.warn('Database sync failed, continuing without DB:', err.message);
    }
  } else {
    console.warn('Continuing without database functionality');
  }
  
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  return server;
};

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => console.error('Server start error:', err));
}

// Export for testing
module.exports = { app, startServer }; 