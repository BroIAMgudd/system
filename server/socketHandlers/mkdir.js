const pool = require('./mysqlPool'); // Adjust the path accordingly

module.exports = function (socket, usersOnline) {
  socket.on('mkdir', async (data) => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    try {
      const user = usersOnline[socket.id];
      const ip = (user.connTo === '') ? user.ip : user.connTo;
      const conn = await pool.getConnection();
      try {
        await insertNewFolder(conn, user, ip, data.name);
        socket.emit('print', { msg: `Created new folder: ${data.name}` });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Mkdir Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while creating the folder.' });
    }
  });
};

async function insertNewFolder(conn, user, ip, folderName) {
  await conn.query('INSERT INTO filesystem (owner, ip, filename, ext, path) VALUES (?, ?, ?, ?, ?)', [
    user.username,
    ip,
    folderName,
    'folder',
    user.path
  ]);
}