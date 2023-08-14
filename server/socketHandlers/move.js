const pool = require('./mysqlPool');
const { parsePath, isValidPath } = require('./helper');

module.exports = function (socket, usersOnline) {
  socket.on('move', async (data) => {
    const { filename, updatePath } = data;
    const { ip, connTo, path, nick } = usersOnline[socket.id];
    const targetip = (connTo === '') ? ip : connTo;
    let targetnick;
    const conn = await pool.getConnection();

    try {
      if (connTo !== '') {
        const [row] = await conn.query('SELECT nick FROM system WHERE ip = ?', [ip]);
        targetnick = row.nick;
      } else {
        targetnick = nick;
      }
    
      const [currentPathRow] = await conn.query('SELECT ext FROM filesystem WHERE filename = ? AND ip = ? AND path = ?', [filename, targetip, path]);
      const fileType = currentPathRow[0].ext;
    
      const newPath = parsePath(
        path,
        updatePath.replace(/\\/g, '/').replace(/^\//, '').replace(/\/$/, '')
      );
    
      if (!newPath) {
        socket.emit('print', { msg: `Invalid path - Cannot go back beyond the root folder: ${updatePath}` });
        return;
      }
    
      if (await isValidPath(targetnick, targetip, newPath)) {
        await conn.query('UPDATE filesystem SET path = ? WHERE filename = ? AND ip = ?', [newPath, filename, targetip]);
        if (fileType === 'folder') {
          await conn.query('UPDATE filesystem SET path = ? WHERE ip = ? AND path LIKE ?', [`${newPath}/${filename}`, targetip, `${path}/${filename}%`]);
          socket.emit('print', { msg: `Moved folder ${filename}` });
        } else {
          socket.emit('print', { msg: `Moved file ${filename}` });
        }
      } else {
        // Handle invalid path
        socket.emit('print', { msg: `Invalid path: ${path}` });
      }
    } catch (error) {
      console.error('Move Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while move the file.' });
    } finally {
      conn.release();
    }
  });
};