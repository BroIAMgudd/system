const pool = require('./mysqlPool');
const { addTask } = require('./dbRequests');

module.exports = function (socket, usersOnline, io) {
  socket.on('rm', async (data) => {
    const { ip, connTo, path } = usersOnline[socket.id];
    const { fileInfo, search } = data;
    
    const targetIP = (!connTo) ? ip : connTo;
    const conn = await pool.getConnection();
    let rows;
  
    label: try {
      if (search === 'id') {
        [rows] = await conn.query('SELECT * FROM filesystem WHERE ip = ? AND id = ?', [targetIP, parseInt(fileInfo)]);
      } else if (search === 'name') {
        [rows] = await conn.query('SELECT * FROM filesystem WHERE ip = ? AND filename = ? AND path = ?', [targetIP, fileInfo, path]);
      }

      if (rows.length === 0) {
        socket.emit('print', { msg: 'File not found.' });
        break label;
      } if (rows.length > 1) {
        socket.emit('print', { msg: 'Multiple files found with that name use rmid instead.' });
        break label;
      }

      addTask('Remove', rows[0], usersOnline[socket.id], targetIP, socket);
    } catch (error) {
      console.error('Remove Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while removing the file.' });
    } finally {
      conn.release();
    }
  });
};