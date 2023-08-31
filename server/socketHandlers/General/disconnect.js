const pool = require('../mysqlPool'); // Adjust the path accordingly

module.exports = function (socket, usersOnline) {
  socket.on('disconnect', async () => {
    if (usersOnline[socket.id]) {
      const user = usersOnline[socket.id].username;
      console.log('User Offline:', user, 'Socket ID:', socket.id);
      const uptime = usersOnline[socket.id].uptime;
      delete usersOnline[socket.id];

      if (uptime > 60) {
        await updatePlaytime(user, uptime);
      }
    } else {
      console.log('Socket Offline:', socket.id);
    }
  });
};

async function updatePlaytime(username, uptime) {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('UPDATE system SET playtime = playtime + ? WHERE username = ?', [
        uptime,
        username
      ]);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}
