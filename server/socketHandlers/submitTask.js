const pool = require('./mysqlPool');
const { deleteFile } = require('./dbRequests');

module.exports = function (socket, usersOnline, io) {
  socket.on('submitTask', async (id) => {
    const { username, ip, connTo } = usersOnline[socket.id];
    const conn = await pool.getConnection();
  
    lable: try {
      const [row] = await conn.query('SELECT * FROM tasks WHERE id = ?', [id]);
      if (!row[0]) { socket.emit('print', { msg: 'Task not found.' }); break lable; }
      await conn.query('DELETE FROM tasks WHERE id = ?', [id]);

      const { username, filename, ext, targetIP, path, actionType, targetID, extraDetails, endTime } = row[0]

      const currentDate = new Date();
      if (endTime.getTime() > currentDate.getTime()) {
        socket.emit('print', { msg: 'Task Not Finished' });
        break lable;
      }

      if (actionType === 'Remove') {
        const file = { id: targetID, targetIP: targetIP, filename: filename, ext: ext, path: path };
        deleteFile(socket, file, ip, connTo, usersOnline, io);
      } 
      // else if (actionType === 'Upload' || actionType === 'Download') {
      //   transfer();
      // }

    } catch (error) {
      console.error('Task submit Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while submitting the task' });
      throw err;
    } finally {
      conn.release();
    }
  });
};