const pool = require('./mysqlPool');
const { getFile, addFileTask } = require('./dbRequests');

module.exports = function (socket, usersOnline, io) {
  socket.on('transfer', async (data) => {
    const user = usersOnline[socket.id];
    const { ip, connTo, path, nick } = user;

    if (!connTo) {
      socket.emit('print', { msg: 'You need to be currently connected to someone.' });
      return;
    }

    const { fileInfo, type, search } = data;
    const sender = (type === 'ul') ? ip : connTo;
    const taskType = (type === 'ul') ? 'Upload' : 'Download';
    const conn = await pool.getConnection();

    lable: try {
      const filePath = (type === 'ul') ? nick : path;
      const [rows] = await getFile(search, fileInfo, sender, filePath);

      if (rows.length === 0) {
        socket.emit('print', { msg: 'File not found.' });
        break lable;
      } if (rows.length > 1) {
        socket.emit('print', { msg: 'Multiple files found with that name use file id instead.' });
        break lable;
      }

      addFileTask(taskType, rows[0], user, connTo, socket);
    } catch (error) {
      console.error('Upload Error:', error.message);
      socket.emit('print', { msg: 'An error occurred during file upload.' });
    } finally {
      conn.release();
    }
  });
};