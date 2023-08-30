const { getFile } = require('./Functions/Filesystem');
const { addFileTask } = require('./dbRequests');
const { findUser } = require('./helper');
const pool = require('./mysqlPool');

module.exports = function (socket, usersOnline, io) {
  socket.on('rm', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }
    const { ip, connTo, path } = user;
    const { fileInfo, search } = data;
    
    const targetIP = (!connTo) ? ip : connTo;
    const conn = await pool.getConnection();
  
    try {
      let fileRows;
      if (search === 'name') {
        const absPath = fileInfo.startsWith('C:');
        let fullPath = fileInfo.replace(/\\/g, '/');
        let dirPath = '', filename = '';
        if (absPath) { fullPath = fullPath.slice(3); }
        const lastSlashIndex = fullPath.lastIndexOf('/');

        if ( lastSlashIndex > -1 ) {
          if (!absPath) dirPath += path+'/';
          dirPath += fullPath.substring(0, lastSlashIndex);
          filename = fullPath.substring(lastSlashIndex + 1);
        } else {
          dirPath = path;
          filename = fullPath;
        }

        fileRows = await getFile(conn, search, filename, targetIP, dirPath);
      } else {
        fileRows = await getFile(conn, search, fileInfo, targetIP, path);
      }

      if (!fileRows) {
        socket.emit('print', { msg: 'File not found.' });
        return;
      } if (fileRows.length > 1) {
        socket.emit('print', { msg: 'Multiple files found with that name use file id instead.' });
        return;
      }
      addFileTask(socket, 'Remove', fileRows[0], user, targetIP);
    } catch (error) {
      console.error('Remove Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while removing the file.' });
    } finally {
      conn.release();
    }
  });
};