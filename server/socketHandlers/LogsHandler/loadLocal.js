const pool = require('../mysqlPool');
const { listLogs } = require('../Functions/Logs');
const { findUser } = require('../Functions/helper');

module.exports = function (socket, usersOnline) {
  socket.on('localLogListUpdate', async () => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    try {
      const { ip } = user;
      const conn = await pool.getConnection();
      try {
        localLogs = await listLogs(conn, ip);
        socket.emit('localLogListUpdate', localLogs);
      } finally {
        conn.release();
      }
    } catch (err) {
      socket.emit('print', { msg: 'An error occurred while getting local logs.' });
      throw err;
    }
  });
};