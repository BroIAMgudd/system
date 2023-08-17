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
const loadLocalLogsHandler = require('./socketHandlers/loadLocalLogs');
const removeLogHandler = require('./socketHandlers/rmLog');
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
const submitTaskHandler = require('./socketHandlers/submitTask');
const testHandler = require('./socketHandlers/test');
const heartbeatHandler = require('./socketHandlers/heartbeat');
const disconnectHandler = require('./socketHandlers/disconnect');

const usersOnline = {};

io.on('connection', (socket) => {
  registerHandler(socket);
  loginHandler(socket);
  getUserHandler(socket, usersOnline);
  loadLocalLogsHandler(socket, usersOnline);
  removeLogHandler(socket, usersOnline, io);
  sshHandler(socket, usersOnline, io);
  cdHandler(socket, usersOnline);
  exitHandler(socket, usersOnline);
  whoisHandler(socket, usersOnline);
  nickHandler(socket, usersOnline);
  makeDirHandler(socket, usersOnline, io);
  dirHandler(socket, usersOnline);
  messageHandler(socket, usersOnline);
  touchHandler(socket, usersOnline, io);
  transferHandler(socket, usersOnline, io);
  rmHandler(socket, usersOnline, io);
  moveHandler(socket, usersOnline, io);
  submitTaskHandler(socket, usersOnline, io);
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