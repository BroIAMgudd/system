const pool = require('./mysqlPool'); // Adjust the path accordingly

module.exports = function (socket, usersOnline) {
  socket.on('heartbeat', () => {
    if (!usersOnline[socket.id]) { socket.disconnect(); return; }

    const user = usersOnline[socket.id];
    if (user) {
      user.lastHeartbeat = Date.now();
      user.uptime += 30;
    }
  });
};