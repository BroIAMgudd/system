const { getFile } = require('./Functions/Filesystem');
const { addFileTask } = require('./dbRequests');
const { findUser } = require('./helper');
const pool = require('./mysqlPool');

module.exports = function (socket, usersOnline, io) {
  socket.on('transfer', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }
    const { ip, connTo, path, nick } = user;

    if (!connTo) {
      socket.emit('print', { msg: 'You need to be currently connected to someone.' });
      return;
    }

    const { fileInfo, type, search } = data;
    const sender = (type === 'ul') ? ip : connTo;
    const taskType = (type === 'ul') ? 'Upload' : 'Download';
    const conn = await pool.getConnection();

    transfer: try {
      const filePath = (type === 'ul') ? nick : path;
      const fileRows = await getFile(conn, search, fileInfo, sender, filePath);

      if (!fileRows) {
        socket.emit('print', { msg: 'File not found.' });
        break transfer;
      } if (fileRows.length > 1) {
        socket.emit('print', { msg: 'Multiple files found with that name use file id instead.' });
        break transfer;
      }

      addFileTask(taskType, fileRows[0], user, connTo, socket);
    } catch (err) {
      console.error('Upload Error:', err.message);
      socket.emit('print', { msg: 'An error occurred during file upload.' });
      throw err;
    } finally {
      conn.release();
    }
  });
};