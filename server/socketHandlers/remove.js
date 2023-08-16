const pool = require('./mysqlPool');
const { addLog } = require('./helper');

module.exports = function (socket, usersOnline, io) {
  socket.on('rm', async (data) => {
    const { ip, connTo, path } = usersOnline[socket.id];
    let { fileInfo, search } = data;
    
    const targetIp = (!connTo) ? ip : connTo;
    
    const conn = await pool.getConnection();
  
    label: try {
      if (search === 'id') {
        // Search for file by id
        const [rows] = await conn.query('SELECT filename, ext FROM filesystem WHERE ip = ? AND id = ?', [targetIp, parseInt(fileInfo)]);
        var file = rows[0];

        if (!file) {
          socket.emit('print', { msg: 'File not found.' });
          break label;
        }

        await conn.query('DELETE FROM filesystem WHERE ip = ? AND id = ?', [targetIp, parseInt(fileInfo)]);
      } else {
        // Search for file by name
        const [rows] = await conn.query('SELECT filename, ext FROM filesystem WHERE ip = ? AND filename = ? AND path = ?', [targetIp, fileInfo, path]);
        var file = rows[0];
  
        if (!file) {
          socket.emit('print', { msg: 'File not found.' });
          break label;
        } if (rows.length > 1) {
          socket.emit('print', { msg: 'Multiple files found with that name use rmid instead.' });
          break label;
        }
        
        await conn.query('DELETE FROM filesystem WHERE ip = ? AND filename = ? AND path = ?', [targetIp, fileInfo, path]);
      }

      if (file.ext === 'folder') {
        await conn.query('DELETE FROM filesystem WHERE ip = ? AND path LIKE ?', [targetIp, `${path}/${file.filename}%`]);
        socket.emit('print', { msg: `Folder Deleted: ${file.filename}` });
      } else {
        socket.emit('print', { msg: `File Deleted: ${file.filename}` });
      }

      const actionType = (file.ext === 'folder') ? 'Deleted Folder' : 'Deleted File';
      const fileName = (file.ext === 'folder') ? file.filename : `${file.filename}.${file.ext}`;

      if (!connTo) {
        await addLog(ip, ip, actionType, fileName, usersOnline, io);
      } else {
        await addLog(targetIp, ip, actionType, fileName, usersOnline, io);
        await addLog(ip, targetIp, actionType, fileName, usersOnline, io);
      }
    } catch (error) {
      console.error('Remove Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while removing the file.' });
    } finally {
      conn.release();
    }
  });
};