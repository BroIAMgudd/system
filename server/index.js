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

const path = require('path');

const socketHandlersPath = path.join(__dirname, 'socketHandlers');
const getHandlerPath = (handlerName) => path.join(socketHandlersPath, handlerName);

// General Handlers
const generalHandlers = [
  'register', 'login', 'getUser', 'loadIPs', 'setNick', 'heartbeat', 'disconnect'
];

// Terminal Handlers
const terminalHandlers = [
  'exit', 'ssh', 'crack', 'dir', 'mkdir', 'changeDir', 'move', 'remove',
  'transfer', 'nas', 'nmap', 'whois', 'ipReset', 'touch'
];

// MSFConsole Handlers
const msfHandlers = ['modules', 'exploit', 'use'];

// Finances Handlers
const financesHandlers = ['btcReq', 'buyItem', 'getFinances'];

// Tasks Handlers
const tasksHandlers = ['submitTask'];

// Logs Handlers
const logsHandlers = ['loadLocal', 'rmLog'];

// Chat Handlers
const chatHandlers = ['message'];

const handlers = [
  ...generalHandlers.map(handler => require(getHandlerPath(`General/${handler}`))),
  ...terminalHandlers.map(handler => require(getHandlerPath(`TerminalHandler/${handler}`))),
  ...msfHandlers.map(handler => require(getHandlerPath(`MSFConsoleHandler/${handler}`))),
  ...financesHandlers.map(handler => require(getHandlerPath(`FinancesHandler/${handler}`))),
  ...tasksHandlers.map(handler => require(getHandlerPath(`TasksHandler/${handler}`))),
  ...logsHandlers.map(handler => require(getHandlerPath(`LogsHandler/${handler}`))),
  ...chatHandlers.map(handler => require(getHandlerPath(`ChatHandler/${handler}`)))
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