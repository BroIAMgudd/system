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

const randIP = () => Array(4).fill(0).map((_, i) => Math.floor(Math.random() * 255) + (i === 0 ? 1 : 0)).join('.');

// WebSocket event handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle register event
  socket.on('register', async (data) => {
    const { username, email, password } = data;

    // Additional checks for username and password
    if (!username || username.length < 4) {
      return socket.emit('registerError', { error: 'Username must be at least 8 characters long' });
    }

    if (!email || email.length < 6) {
      return socket.emit('registerError', { error: 'Email must be at least 8 characters long' });
    }

    if (!password || password.length < 6) {
      return socket.emit('registerError', { error: 'Password must be at least 8 characters long' });
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

      await connection.query('INSERT INTO system (username, ip, cpu, network, harddrive, usb) VALUES (?, ?, ?, ?, ?, ?)', [
        username,
        randIP(),
        5.00,
        5.00,
        5.00,
        5.00
      ]);
      
      // Release the connection
      connection.release();

      socket.emit('registerSuccess', { message: `${username} registered successfully!` });
    } catch (error) {
      console.error('Error:', error.message);
      socket.emit('registerError', { error: 'Something went wrong' });
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

      if (rows.length === 1) {
        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
          await connection.query('UPDATE users SET sessionID = ? WHERE username = ?', [
            socket.id,
            username
          ]);

          socket.emit('loginSuccess', { message: 'Login successful!',  id: user.id, username: user.username });
        } else {
          socket.emit('loginError', { error: 'Invalid credentials' });
        }
        // Release the connection
        connection.release();
      } else {
        socket.emit('loginError', { error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Error:', error.message);
      socket.emit('loginError', { error: 'Something went wrong' });
    }
  });

  socket.on('getUser', async () => {
    // Fetch the user from the database based on the sessionID (socket.id)
    try {
      // Create a MySQL connection pool
      const pool = mysql.createPool(dbConfig);

      // Get a connection from the pool
      const connection = await pool.getConnection();

      // Fetch the user from the database based on the sessionID (socket.id)
      const [userInfo] = await connection.query('SELECT id, username FROM users WHERE sessionID = ?', [socket.id]);

      if (userInfo.length === 1) {
        user = userInfo[0];
        const [sysInfo] = await connection.query('SELECT ip, cpu, network, harddrive, usb FROM system WHERE id = ?', [user.id]);
        if (sysInfo.length === 1) {
          system = sysInfo[0];
          socket.emit('receiveUser', { user, system });
        }
      }

      // Release the connection
      connection.release();
    } catch (error) {
      console.error('Get User Error:', error.message);
    }
  });

  socket.on('test', async (data) => {
    socket.emit('testFinish', { test: data.test });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});