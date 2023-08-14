const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { uptime } = require('process');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ["GET", "POST"]
  }
});

// Import socket event handlers
const registerHandler = require('./socketHandlers/register');
const loginHandler = require('./socketHandlers/login');
const getUserHandler = require('./socketHandlers/getUser');
const sshHandler = require('./socketHandlers/ssh');
const cdHandler = require('./socketHandlers/changeDir');
const exitHandler = require('./socketHandlers/exit');
const whoisHandler = require('./socketHandlers/whois');
const nickHandler = require('./socketHandlers/setNick');
const makeDirHandler = require('./socketHandlers/mkdir');
const dirHandler = require('./socketHandlers/dir');
const messageHandler = require('./socketHandlers/message');
const touchHandler = require('./socketHandlers/touch');
const transferHandler = require('./socketHandlers/transfer');
const rmHandler = require('./socketHandlers/remove');
const moveHandler = require('./socketHandlers/move');
const testHandler = require('./socketHandlers/test');
const heartbeatHandler = require('./socketHandlers/heartbeat');
const disconnectHandler = require('./socketHandlers/disconnect');

const usersOnline = {};

async function addLog(logType, targetIP, loggedIP, actionType, extraDetails) {
  const pool = await mysql.createPool({
    host: 'your-db-host',
    user: 'your-db-user',
    password: 'your-db-password',
    database: 'your-db-name'
  });

  try {
    const conn = await pool.getConnection();
    const query = 'INSERT INTO logs (log_type, target_ip, logged_ip, action_type, extra_details) VALUES (?, ?, ?, ?, ?)';
    const values = [logType, targetIP, loggedIP, actionType, extraDetails];

    await conn.query(query, values);
  } catch (error) {
    console.error('Error adding log:', error);
  } finally {
    conn.release();
  }
}

// WebSocket event handling
io.on('connection', (socket) => {
  registerHandler(socket);
  loginHandler(socket);
  getUserHandler(socket, usersOnline);
  sshHandler(socket, usersOnline);
  cdHandler(socket, usersOnline);
  exitHandler(socket, usersOnline);
  whoisHandler(socket, usersOnline);
  nickHandler(socket, usersOnline);
  makeDirHandler(socket, usersOnline);
  dirHandler(socket, usersOnline);
  messageHandler(socket, usersOnline);
  touchHandler(socket, usersOnline);
  transferHandler(socket, usersOnline);
  rmHandler(socket, usersOnline);
  moveHandler(socket, usersOnline);
  testHandler(socket);
  heartbeatHandler(socket, usersOnline);
  disconnectHandler(socket, usersOnline);
});

setInterval(() => {
  const now = Date.now();
  Object.keys(usersOnline).forEach(socketId => {
    const user = usersOnline[socketId];
    if (now - user.lastHeartbeat > 60000) { // Consider socket offline if no heartbeat in the last 60 seconds
      delete usersOnline[socketId];
    }
  });
}, 90000); // Check heartbeats every 90 seconds

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});