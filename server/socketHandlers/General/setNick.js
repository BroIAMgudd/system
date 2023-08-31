const pool = require('../mysqlPool'); // Adjust the path accordingly

module.exports = function (socket, usersOnline) {
  socket.on('setNick', async (data) => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }
    
    try {
      const user = usersOnline[socket.id];
      const newNick = data.nick;
      const oldNick = user.nick;
      const conn = await pool.getConnection();
      try {
        await updateNickAndPath(conn, user.username, user.ip, newNick, user.nick);
        user.nick = newNick;
        user.path = user.path.replace(oldNick, newNick);

        const setNickData = { nick: newNick };
        const setPathData = { path: `C:\\${user.path.replace(/\//g, '\\')}` };

        socket.emit('setNick', setNickData);
        if (user.connTo === '') {
          socket.emit('setPath', setPathData);
        }
      } finally {
        conn.release();
      }
    } catch (err) {
      throw err;
    }
  });
};

async function updateNickAndPath(conn, username, ip, newNick, oldNick) {
  await conn.query('UPDATE system SET nick = ? WHERE username = ?', [newNick, username]);
  await conn.query('UPDATE filesystem SET path = REPLACE(path, ?, ?) WHERE ip = ?', [oldNick, newNick, ip]);
}