const { getFile } = require('../Functions/Filesystem');
const { addFileTask } = require('../Functions/dbRequests');
const { findUser } = require('../Functions/helper');
const pool = require('../mysqlPool');

module.exports = function (socket, usersOnline, io) {
  socket.on('transfer', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }
    const { ip, connTo, path, nick } = user;

    if (!connTo) {
      socket.emit('print', { msg: 'You need to be currently connected to someone.' });
      return;
    }

    let sendPath = data.sendPath;
    const { fileInfo, type, search } = data;
    const sender = (type === 'ul') ? ip : connTo;
    const receiver = (type === 'ul') ? connTo : ip;
    const taskType = (type === 'ul') ? 'Upload' : 'Download';
    const conn = await pool.getConnection();

    transfer: try {
      let fileRows;
      if (fileInfo.startsWith('C:') && search === 'name') {
        const fullPath = fileInfo.slice(3);
        const lastSlashIndex = fullPath.lastIndexOf('/');
        const dirPath = fullPath.substring(0, lastSlashIndex);
        const filename = fullPath.substring(lastSlashIndex + 1);
        fileRows = await getFile(conn, search, filename, sender, dirPath);
      } else {
        const filePath = (type === 'ul') ? nick : path;
        fileRows = await getFile(conn, search, fileInfo, sender, filePath);
      }

      if (!fileRows) {
        socket.emit('print', { msg: 'File not found.' });
        break transfer;
      } if (fileRows.length > 1) {
        socket.emit('print', { msg: 'Multiple files found with that name use file id instead.' });
        break transfer;
      }

      let validPath = false;
      if (sendPath) {
        if (sendPath.startsWith('C:')) {
          sendPath = sendPath.slice(3);
          const lastSlashIndex = sendPath.lastIndexOf('/');
          const dirPath = sendPath.substring(0, lastSlashIndex);
          const foldername = sendPath.substring(lastSlashIndex + 1);
          folder = await getFile(conn, 'name', foldername, receiver, dirPath) || [];
          if (folder.length === 1) {
            validPath = true;
          } else {
            socket.emit('print', { msg: 'Path does not exist' });
          }
        } else {
          socket.emit('print', { msg: 'Send Path must be a absolute path Ex. C:\\HiGuys\\test1' });
        }
      }

      addFileTask(socket, taskType, fileRows[0], user, connTo, (validPath) ? sendPath : null);
    } catch (err) {
      console.error('Upload Error:', err.message);
      socket.emit('print', { msg: 'An error occurred during file upload.' });
      throw err;
    } finally {
      conn.release();
    }
  });
};