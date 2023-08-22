const { getFile, createFile } = require('./Functions/Filesystem');
const { addLog } = require('./Functions/Logs');
const { findUser } = require('./helper');
const pool = require('./mysqlPool');

module.exports = function (socket, usersOnline, io) {
  socket.on('mkdir', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    try {
      const { username, ip, path, connTo } = user;
      const targetIP = (!connTo) ? ip : connTo;
      const filename = data.name;
      const actionType = 'Created Folder'
      const conn = await pool.getConnection();
      try {
        const folderDup = await getFile(conn, 'name', filename, targetIP, path);

        if (folderDup) {
          socket.emit('print', { msg: 'Folder with same name already exists.' });
          return;
        }

        const file = {
          status: 0, 
          owner: username, 
          filename: filename, 
          ext: 'folder', 
          contents: '', 
          size: 0,
          version: 1
        }

        await createFile(conn, file, targetIP, path);
        socket.emit('print', { msg: `Created new folder: ${filename}` });

        if (!connTo) {
          addLog(conn, ip, ip, actionType, filename, usersOnline, io);
        } else {
          addLog(conn, targetIP, ip, actionType, filename, usersOnline, io);
          addLog(conn, ip, targetIP, actionType, filename, usersOnline, io);
        }
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('Mkdir Error:', err.message);
      socket.emit('print', { msg: 'An error occurred while creating the folder.' });
      throw err;
    }
  });
};