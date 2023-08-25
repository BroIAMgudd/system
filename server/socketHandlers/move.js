const { parsePath, isValidPath } = require('./helper');
const { getFile } = require('./Functions/Filesystem');
const { findSystem } = require('./Functions/System');
const { addLog } = require('./Functions/Logs');
const { findUser } = require('./helper');
const pool = require('./mysqlPool');

module.exports = function (socket, usersOnline, io) {
  socket.on('move', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    const { fileInfo, updatePath, search } = data;
    const { ip, connTo, path } = user;
    const targetIP = (connTo === '') ? ip : connTo;
    let targetNick;
    
    const conn = await pool.getConnection();

    move: try {
      const targetSys = await findSystem(conn, 'ip', targetIP);

      if (!targetSys) {
        socket.emit('print', { msg: 'Target user changed IP' });
        break move;
      }

      const targetNick = targetSys.nick;
    
      const fileRows = await getFile(conn, search, fileInfo, targetIP, path);
      
      if (!fileRows) {
        socket.emit('print', { msg: 'File not found.' });
        break move;
      } else if (fileRows.length > 1) {
        socket.emit('print', { msg: 'Multiple files with same name use moveid' });
        break move;
      }

      const { filename, ext } = fileRows[0];
    
      const newPath = parsePath(
        path,
        updatePath.replace(/\\/g, '/').replace(/^\.\/(?!\.\/)/, '').replace(/^\/|\/$/g, '')
      );
    
      if (!newPath) {
        socket.emit('print', { msg: `Invalid path - Cannot go back beyond the root folder: ${updatePath}` });
        break move;
      }

      const validPath = await isValidPath(targetNick, targetIP, newPath);
      if (!validPath) { socket.emit('print', { msg: `Invalid path: ${path}` }); }

      const [findDupFolder] = await conn.query('SELECT * FROM filesystem WHERE filename = ? AND ip = ? AND path = ?', [filename, targetIP, newPath]);
      if (findDupFolder.length === 1) {
        socket.emit('print', { msg: 'Folder with same name already exists' });
        break move;
      }

      const oldFilePath = `${path}/${filename}`;
      const newFilePath = `${newPath}/${filename}`;
      if (`${newPath}/`.includes(`${oldFilePath}/`)) {
        socket.emit('print', { msg: 'Cant move a folder into itself' });
        break move;
      }

      await conn.query('UPDATE filesystem SET path = ? WHERE filename = ? AND ip = ?', [newPath, filename, targetIP]);
      if (ext === 'folder') {
        await conn.query('UPDATE filesystem SET path = REPLACE(path, ?, ?) WHERE ip = ? AND path LIKE ?', [oldFilePath, newFilePath, targetIP, `${oldFilePath}%`]);
        socket.emit('print', { msg: `Moved folder ${filename}` });
      } else {
        socket.emit('print', { msg: `Moved file ${filename}` });
      }

      const actionType = (ext === 'folder') ? 'Moved Folder' : 'Moved File';
      const fileName = (ext === 'folder') ? filename : `${filename}.${ext}`;

      if (!connTo) {
        addLog(conn, ip, ip, actionType, fileName, usersOnline, io);
      } else {
        addLog(conn, targetIP, ip, actionType, fileName, usersOnline, io);
        addLog(conn, ip, targetIP, actionType, fileName, usersOnline, io);
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