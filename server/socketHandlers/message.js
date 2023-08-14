const pool = require('./mysqlPool'); // Adjust the path accordingly

module.exports = function (socket, usersOnline, io) {
  socket.on('message', async (msg) => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    const user = usersOnline[socket.id];
    try {
      const conn = await pool.getConnection();
      try {
        await insertMessage(conn, user.username, msg);
        conn.release();
  
        io.emit('message', { message: msg });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Message Error:', error.message);
      socket.emit('print', { msg: 'An error occurred during messaging' });
    }
  });
};

async function insertMessage(conn, username, message) {
  await conn.query('INSERT INTO messages (username, message) VALUES (?, ?)', [username, message]);
}