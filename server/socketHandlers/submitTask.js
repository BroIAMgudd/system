const pool = require('./mysqlPool');
const { deleteFile, transfer, crackIP } = require('./dbRequests');

module.exports = function (socket, usersOnline, io) {
  socket.on('submitTask', async (id) => {
    const user = usersOnline[socket.id];
    const conn = await pool.getConnection();
  
    submitTask: try {
      const [row] = await conn.query('SELECT * FROM tasks WHERE id = ?', [id]);
      const task = row[0];
      if (!task) { socket.emit('print', { msg: 'Task not found.' }); break submitTask; }

      const { filename, ext, targetIP, path, actionType, targetID, endTime } = task;

      const currentDate = new Date();
      if (endTime.getTime() > currentDate.getTime()) {
        socket.emit('print', { msg: 'Task Not Finished' });
        break submitTask;
      }

      switch (actionType) {
        case 'Remove':
          deleteFile(socket, task, user, usersOnline, io);
          break;
        case 'Upload':
        case 'Download':
          transfer(socket, task, user, usersOnline, io);
          break;
        case 'Crack':
          crackIP(socket, task, user, usersOnline, io);
          break;
        default:
          console.log('Unknown action:', actionType);
          break;
      }      

    } catch (error) {
      console.error('Task submit Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while submitting the task' });
      throw error;
    } finally {
      conn.release();
    }
  });
};