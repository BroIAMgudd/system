const { createFile } = require('./Functions/Filesystem');
const { addLog } = require('./Functions/Logs');
const { findUser } = require('./helper');
const pool = require('./mysqlPool');

module.exports = function (socket, usersOnline, io) {
  socket.on('touch', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }
    const filename = data.name;
    const { username, ip, connTo, path } = user;
    const targetIP = (!connTo) ? ip : connTo;
    const actionType = 'Create File';
    const fileExt = `${filename}.txt`;

    try {
      const conn = await pool.getConnection();
      try {
        const file = {
          status: 0, 
          owner: username, 
          filename: filename, 
          ext: 'txt', 
          contents: '', 
          size: 0,
          version: 1
        }
        await createFile(conn, file, targetIP, path);
        
        socket.emit('print', { msg: `Created new file: ${fileExt}` });
        
        if (!connTo) {
          addLog(conn, ip, ip, actionType, fileExt, usersOnline, io);
        } else {
          addLog(conn, targetIP, ip, actionType, fileExt, usersOnline, io);
          addLog(conn, ip, targetIP, actionType, fileExt, usersOnline, io);
        }
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('Error:', err);
      socket.emit('print', { msg: 'An error occurred while creating the file.' });
      throw err;
    }
  });
};