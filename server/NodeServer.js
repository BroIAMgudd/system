const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { uptime } = require('process');
// UPDATE `iplist` SET `ips`= JSON_ARRAY_APPEND(`ips`, '$.NPC', '2.2.2.2') WHERE `id` = 1;
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
const registerH = require('./socketHandlers/register');
const loginH = require('./socketHandlers/login');
const getUserH = require('./socketHandlers/getUser');
const loadLocalLogsH = require('./socketHandlers/loadLocalLogs');
const loadIPsH = require('./socketHandlers/loadIPs');
const getFinancesH = require('./socketHandlers/getFinances');
const btcRequestH = require('./socketHandlers/btcRequest');
const removeLogH = require('./socketHandlers/rmLog');
const sshH = require('./socketHandlers/ssh');
const crackH = require('./socketHandlers/crack');
const cdH = require('./socketHandlers/changeDir');
const exitH = require('./socketHandlers/exit');
const whoisH = require('./socketHandlers/whois');
const nickH = require('./socketHandlers/setNick');
const makeDirH = require('./socketHandlers/mkdir');
const dirH = require('./socketHandlers/dir');
const messageH = require('./socketHandlers/message');
const touchH = require('./socketHandlers/touch');
const transferH = require('./socketHandlers/transfer');
const rmH = require('./socketHandlers/remove');
const moveH = require('./socketHandlers/move');
const submitTaskH = require('./socketHandlers/submitTask');
const buyItemH = require('./socketHandlers/buyItem');
const testH = require('./socketHandlers/test');
const heartbeatH = require('./socketHandlers/heartbeat');
const disconnectH = require('./socketHandlers/disconnect');

const usersOnline = {};
const btcPrice = 15798;

io.on('connection', (socket) => {
  registerH(socket);
  loginH(socket);
  getUserH(socket, usersOnline);
  loadLocalLogsH(socket, usersOnline);
  loadIPsH(socket, usersOnline);
  getFinancesH(socket, usersOnline, btcPrice);
  btcRequestH(socket, usersOnline, btcPrice);
  removeLogH(socket, usersOnline, io);
  sshH(socket, usersOnline, io);
  crackH(socket, usersOnline);
  cdH(socket, usersOnline);
  exitH(socket, usersOnline);
  whoisH(socket, usersOnline);
  nickH(socket, usersOnline);
  makeDirH(socket, usersOnline, io);
  dirH(socket, usersOnline);
  messageH(socket, usersOnline);
  touchH(socket, usersOnline, io);
  transferH(socket, usersOnline, io);
  rmH(socket, usersOnline, io);
  moveH(socket, usersOnline, io);
  submitTaskH(socket, usersOnline, io);
  buyItemH(socket, usersOnline)
  testH(socket);
  heartbeatH(socket, usersOnline);
  disconnectH(socket, usersOnline);

  socket.on('search', (site) => {
    socket.emit('loadSite', 'store');
  });
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