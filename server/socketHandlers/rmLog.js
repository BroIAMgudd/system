const pool = require('./mysqlPool');

module.exports = function (socket, usersOnline, io) {
  socket.on('deleteLog', async (logId) => {
    try {
      const user = usersOnline[socket.id];
      const conn = await pool.getConnection();

      try {
        // Delete log by ID
        await conn.query('DELETE FROM logs WHERE id = ?', [logId]);
      } finally {
        conn.release();
      }

      // Notify the user that the log has been deleted
      socket.emit('print', { msg: `Log with ID ${logId} has been deleted.` });

      // Emit updates to users
      for (const socketID in usersOnline) {
        const newUser = usersOnline[socketID];

        if (socketID === socket.id) {
          socket.emit('deleteLog', logId);
        } else if (newUser.ip === user.connTo) {
          io.to(socketID).emit('deleteLog', logId);
        } else if (newUser.connTo === user.ip) {
          io.to(socketID).emit('deleteLog', logId);
        } else if (newUser.connTo === user.connTo) {
          io.to(socketID).emit('deleteLog', logId);
        }
      }
    } catch (err) {
      console.error('Delete Log Error:', err.message);
      socket.emit('print', { msg: 'An error occurred while deleting the log.' });
      throw err;
    }
  });
};
