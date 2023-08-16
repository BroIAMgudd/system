const pool = require('./mysqlPool');
const { addLog } = require('./helper');

module.exports = function (socket, usersOnline, io) {
  socket.on('mkdir', async (data) => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    try {
      const { username, ip, path, connTo } = usersOnline[socket.id];
      const targetIP = (!connTo) ? ip : connTo;
      const fileName = data.name;
      const actionType = 'Created Folder'
      const conn = await pool.getConnection();
      try {
        await insertNewFolder(conn, username, path, targetIP, fileName);
        socket.emit('print', { msg: `Created new folder: ${fileName}` });

        if (!connTo) {
          await addLog(ip, ip, actionType, fileName, usersOnline, io);
        } else {
          await addLog(targetIP, ip, actionType, fileName, usersOnline, io);
          await addLog(ip, targetIP, actionType, fileName, usersOnline, io);
        }
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Mkdir Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while creating the folder.' });
    }
  });
};

async function insertNewFolder(conn, username, path, ip, folderName) {
  await conn.query('INSERT INTO filesystem (owner, ip, filename, ext, path) VALUES (?, ?, ?, ?, ?)', [
    username,
    ip,
    folderName,
    'folder',
    path
  ]);
}