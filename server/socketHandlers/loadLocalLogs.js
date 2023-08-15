const pool = require('./mysqlPool');
const { formatTimestamp, listLogs } = require('./helper');

module.exports = function (socket, usersOnline) {
  socket.on('localLogListUpdate', async (data) => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    try {
      const ip = usersOnline[socket.id].ip;
      const conn = await pool.getConnection();
      let logs = [];

      try {
        localLogs = await listLogs(conn, ip);
        localLogs.forEach(row => {
          logs.push({
            id: row.id,
            actionType: row.actionType,
            extraDetails: row.extraDetails,
            loggedIP: row.loggedIP,
            timestamp: formatTimestamp(row.timestamp),
          });
        });
        socket.emit('localLogListUpdate', logs);
      } finally {
        conn.release();
      }
    } catch (err) {
      socket.emit('print', { msg: 'An error occurred while getting local logs.' });
      throw err;
    }
  });
};