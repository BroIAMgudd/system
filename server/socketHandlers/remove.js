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
  
    remove: try {
      const fileRows = await getFile(conn, search, fileInfo, targetIP, path);

      if (!fileRows) {
        socket.emit('print', { msg: 'File not found.' });
        break remove;
      } if (fileRows.length > 1) {
        socket.emit('print', { msg: 'Multiple files found with that name use file id instead.' });
        break remove;
      }
      addFileTask('Remove', fileRows[0], user, targetIP, socket);
    } catch (error) {
      console.error('Remove Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while removing the file.' });
    } finally {
      conn.release();
    }
  });
};