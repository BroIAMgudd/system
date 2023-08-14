const pool = require('./mysqlPool'); // Adjust the path accordingly

module.exports = function (socket, usersOnline) {
  socket.on('rm', async (data) => {
    const { ip, connTo, path } = usersOnline[socket.id];
    let { fileInfo, search } = data;
    
    const targetIp = (connTo === '') ? ip : connTo;
    
    const conn = await pool.getConnection();
  
    try {
      console.log(parseInt(fileInfo), fileInfo);
      if (search === 'id') {
        console.log(parseInt(fileInfo), fileInfo);
        // Search for file by id
        const [rows] = await conn.query('SELECT filename, ext FROM filesystem WHERE ip = ? AND id = ?', [targetIp, parseInt(fileInfo)]);
        var file = rows[0];
  
        if (!file) {
          socket.emit('print', { msg: 'File not found.' });
          conn.release();
          return;
        }
        console.log(parseInt(fileInfo), fileInfo);
        await conn.query('DELETE FROM filesystem WHERE ip = ? AND id = ?', [targetIp, parseInt(fileInfo)]);
        socket.emit('print', { msg: `File removed: ${file.filename}` });
      } else {
        // Search for file by name
        const [rows] = await conn.query('SELECT filename, ext FROM filesystem WHERE ip = ? AND filename = ? AND path = ?', [targetIp, fileInfo, path]);
        var file = rows[0];
  
        if (!file) {
          socket.emit('print', { msg: 'File not found.' });
          conn.release();
          return;
        } if (rows.length > 1) {
          socket.emit('print', { msg: 'Multiple files found with that name use rmid instead.' });
          conn.release();
          return;
        }
        
        await conn.query('DELETE FROM filesystem WHERE ip = ? AND filename = ? AND path = ?', [targetIp, fileInfo, path]);
        socket.emit('print', { msg: `File removed: ${file.filename}` });
      }

      if (file.ext === 'folder') {
        await conn.query('DELETE FROM filesystem WHERE ip = ? AND path LIKE ?', [targetIp, `${path}/${file.filename}%`]);
      }
    } catch (error) {
      console.error('Remove Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while removing the file.' });
    } finally {
      conn.release();
    }
  });
};