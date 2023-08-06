const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ["GET", "POST"]
  }
});

// MySQL database connection configuration
const dbConfig = {
  //ROOT: Ijj7&b5FcF=2
  host: "localhost",
  user: "HaxerAdmin",
  password: "9rR3h*b5V2QQ",
  database: "haxdb"
};

// WebSocket event handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle register event
  socket.on('register', async (data) => {
    const { username, email, password } = data;

    // Additional checks for username and password
    if (!username || username.length < 8) {
      return socket.emit('registrationError', { error: 'Username must be at least 8 characters long' });
    }

    if (!email || email.length < 8) {
      return socket.emit('registrationError', { error: 'Email must be at least 8 characters long' });
    }

    if (!password || password.length < 8) {
      return socket.emit('registrationError', { error: 'Password must be at least 8 characters long' });
    }

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a MySQL connection pool
      const pool = mysql.createPool(dbConfig);

      // Get a connection from the pool
      const connection = await pool.getConnection();

      // Insert the user into the database with the hashed password
      await connection.query('INSERT INTO users (username, email, password, sessionID) VALUES (?, ?, ?, ?)', [
        username,
        email,
        hashedPassword,
        socket.id
      ]);

      // Release the connection
      connection.release();

      socket.emit('registrationSuccess', { message: `${username} registered successfully!` });
    } catch (error) {
      console.error('Error:', error.message);
      socket.emit('registrationError', { error: 'Something went wrong' });
    }
  });

  // Handle login event
  socket.on('login', async (data) => {
    const { username, password } = data;

    try {
      // Create a MySQL connection pool
      const pool = mysql.createPool(dbConfig);

      // Get a connection from the pool
      const connection = await pool.getConnection();

      // Fetch the user from the database based on the username
      const [rows] = await connection.query('SELECT id, username, password FROM users WHERE username = ?', [username]);

      // Release the connection
      connection.release();

      if (rows.length === 1) {
        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
          socket.emit('loginSuccess', { message: 'Login successful!', user });
        } else {
          socket.emit('loginError', { error: 'Invalid credentials' });
        }
      } else {
        socket.emit('loginError', { error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Error:', error.message);
      socket.emit('loginError', { error: 'Something went wrong' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});