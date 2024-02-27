const express = require('express');
const path = require('path');
const morgan = require('morgan'); // Logging middleware

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for logging requests
app.use(morgan('combined')); // Use combined logging format

// Serve static files from the build folder
app.use(express.static(path.join(__dirname, 'build')));

// Route all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Log server start-up
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Log server shut down
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit(0);
});

// Error logging middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).send('Internal Server Error');
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Security events logging middleware
app.use((req, res, next) => {
  if (req.path === '/admin' && !req.isAuthenticated()) {
    console.log(`Unauthorized access attempt to ${req.path} from ${req.ip}`);
  }
  next();
});

// Access logging middleware
app.use((req, res, next) => {
  if (req.path === '/admin' || req.path === '/modify-data') {
    console.log(`Access to ${req.path} from ${req.ip}`);
  }
  next();
});

// Application-specific event logging
// You can add your custom logging logic here based on your application's requirements
