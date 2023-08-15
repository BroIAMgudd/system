const pool = require('./mysqlPool');
const { listLogs } = require('./helper');

module.exports = function (socket, usersOnline) {
  socket.on('localLogListUpdate', async (data) => {
    console.log('test');
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    try {
      const ip = usersOnline[socket.id].ip;
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