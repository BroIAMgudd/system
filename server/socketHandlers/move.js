const pool = require('./mysqlPool');
const { parsePath, isValidPath, addLog } = require('./helper');

module.exports = function (socket, usersOnline, io) {
  socket.on('move', async (data) => {
    const { fileInfo, updatePath, search } = data;
    const { ip, connTo, path, nick } = usersOnline[socket.id];
    const targetip = (connTo === '') ? ip : connTo;
    let targetnick;
    const conn = await pool.getConnection();

    lable: try {
      if (connTo) {
        const [row] = await conn.query('SELECT nick FROM system WHERE ip = ?', [ip]);
        targetnick = row.nick;
      } else {
        targetnick = nick;
      }
    
      let sql = '';
      if (search === 'id') {
        sql = 'SELECT filename, ext FROM filesystem WHERE id = ? AND ip = ? AND path = ?'
      } else {
        sql = 'SELECT filename, ext FROM filesystem WHERE filename = ? AND ip = ? AND path = ?'
      }

      const [currentPathRow] = await conn.query(sql, [fileInfo, targetip, path]);
      
      if (currentPathRow === 0) {
        socket.emit('print', { msg: 'You need to be in current directory of the file you are moving' });
        break lable;
      } else if (currentPathRow > 1) {
        socket.emit('print', { msg: 'Multiple files with same name use moveid' });
        break lable;
      }

      const { filename, ext } = currentPathRow[0];
    
      const newPath = parsePath(
        path,
        updatePath.replace(/\\/g, '/').replace(/^\.\/(?!\.\/)/, '').replace(/^\/|\/$/g, '')
      );
    
      if (!newPath) {
        socket.emit('print', { msg: `Invalid path - Cannot go back beyond the root folder: ${updatePath}` });
        break lable;
      }

      if (await isValidPath(targetnick, targetip, newPath)) {
        const [findDupFolder] = await conn.query('SELECT * FROM filesystem WHERE filename = ? AND ip = ? AND path = ?', [filename, targetip, newPath]);
        if (findDupFolder.length === 1) {
          socket.emit('print', { msg: 'Folder with same name already exists' });
          break lable;
        }
        const oldFilePath = `${path}/${filename}`;
        const newFilePath = `${newPath}/${filename}`;

        if (`${newPath}/`.includes(`${oldFilePath}/`)) {
          socket.emit('print', { msg: 'Cant move a folder into itself' });
          break lable;
        } 
        await conn.query('UPDATE filesystem SET path = ? WHERE filename = ? AND ip = ?', [newPath, filename, targetip]);
        if (ext === 'folder') {
          await conn.query('UPDATE filesystem SET path = REPLACE(path, ?, ?) WHERE ip = ? AND path LIKE ?', [oldFilePath, newFilePath, targetip, `${oldFilePath}%`]);
          socket.emit('print', { msg: `Moved folder ${filename}` });
        } else {
          socket.emit('print', { msg: `Moved file ${filename}` });
        }
  
        const actionType = (ext === 'folder') ? 'Moved Folder' : 'Moved File';
        const fileName = (ext === 'folder') ? filename : `${filename}.${ext}`;
  
        if (!connTo) {
          await addLog(ip, ip, actionType, fileName, usersOnline, io);
        } else {
          await addLog(targetip, ip, actionType, fileName, usersOnline, io);
          await addLog(ip, targetip, actionType, fileName, usersOnline, io);
        }
      } else {
        // Handle invalid path
        socket.emit('print', { msg: `Invalid path: ${path}` });
      }
    } catch (err) {
      console.error('Move Error:', err.message);
      socket.emit('print', { msg: 'An error occurred while move the file.' });
      throw err;
    } finally {
      conn.release();
    }
  });
};