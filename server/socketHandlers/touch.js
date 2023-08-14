const pool = require('./mysqlPool'); // Adjust the path accordingly

module.exports = function (socket, usersOnline) {
  socket.on('touch', async (data) => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    const user = usersOnline[socket.id];
    const ip = (user.connTo === '') ? user.ip : user.connTo;

    try {
      const conn = await pool.getConnection();
      try {
        await createNewFile(conn, user, ip, data.name);
        socket.emit('print', { msg: `Created new file: ${data.name}.txt` });
        
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Error:', error);
      socket.emit('print', { msg: 'An error occurred while creating the file.' });
    }
  });
};

async function createNewFile(conn, user, ip, filename) {
  await conn.query(
    'INSERT INTO filesystem (owner, ip, filename, ext, path) VALUES (?, ?, ?, ?, ?)',
    [user.username, ip, filename, 'txt', user.path]
  );
}