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
const handlers = [
  require('./socketHandlers/register'),
  require('./socketHandlers/login'),
  require('./socketHandlers/getUser'),
  require('./socketHandlers/loadLocalLogs'),
  require('./socketHandlers/loadIPs'),
  require('./socketHandlers/getFinances'),
  require('./socketHandlers/btcRequest'),
  require('./socketHandlers/rmLog'),
  require('./socketHandlers/ssh'),
  require('./socketHandlers/crack'),
  require('./socketHandlers/changeDir'),
  require('./socketHandlers/exit'),
  require('./socketHandlers/whois'),
  require('./socketHandlers/setNick'),
  require('./socketHandlers/mkdir'),
  require('./socketHandlers/dir'),
  require('./socketHandlers/message'),
  require('./socketHandlers/touch'),
  require('./socketHandlers/transfer'),
  require('./socketHandlers/remove'),
  require('./socketHandlers/move'),
  require('./socketHandlers/submitTask'),
  require('./socketHandlers/buyItem'),
  require('./socketHandlers/nmap'),
  require('./socketHandlers/MSFConsole/modules'),
  require('./socketHandlers/test'),
  require('./socketHandlers/heartbeat'),
  require('./socketHandlers/disconnect')
];

const usersOnline = {};
const btcPrice = 15798;

io.on('connection', (socket) => {
  handlers.forEach(handler => handler(socket, usersOnline, io, btcPrice));
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