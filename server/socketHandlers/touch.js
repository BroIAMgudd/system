const pool = require('./mysqlPool');
const { addLog } = require('./dbRequests');

module.exports = function (socket, usersOnline, io) {
  socket.on('touch', async (data) => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    const fileName = data.name;
    const { username, ip, connTo, path } = usersOnline[socket.id];
    const targetIP = (!connTo) ? ip : connTo;
    const actionType = 'Create File';
    const file = `${fileName}.txt`;

    try {
      const conn = await pool.getConnection();
      try {
        await createNewFile(conn, username, targetIP, path, fileName);
        
        socket.emit('print', { msg: `Created new file: ${file}` });
        
        if (!connTo) {
          await addLog(ip, ip, actionType, file, usersOnline, io);
        } else {
          await addLog(targetIP, ip, actionType, file, usersOnline, io);
          await addLog(ip, targetIP, actionType, file, usersOnline, io);
        }
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('Error:', err);
      socket.emit('print', { msg: 'An error occurred while creating the file.' });
    }
  });
};

async function createNewFile(conn, username, targetIP, path, filename) {
  await conn.query(
    'INSERT INTO filesystem (owner, ip, filename, ext, path) VALUES (?, ?, ?, ?, ?)',
    [username, targetIP, filename, 'txt', path]
  );
}