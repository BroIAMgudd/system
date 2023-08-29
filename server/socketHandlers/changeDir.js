const pool = require('./mysqlPool');
const { findUser, parsePath, isValidPath } = require('./helper');

module.exports = function (socket, usersOnline) {
  socket.on('cd', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    try {
      const { path } = data;
      const currentPath = user.path;
      const ip = (user.connTo === '') ? user.ip : user.connTo;
      let nick = '';

      if (user.connTo !== '') {
        const conn = await pool.getConnection();
        const [sysInfo] = await conn.query('SELECT nick FROM system WHERE ip = ?', [ip]);
        conn.release();

        nick = sysInfo[0].nick;
      } else {
        nick = user.nick;
      }

      const sanitizedPath = path.replace(/\\/g, '/').replace(/^\.\/(?!\.\/)/, '').replace(/^\/|\/$/g, '');
      const updatedPath = parsePath(currentPath, sanitizedPath);

      if (!updatedPath) {
        socket.emit('print', { msg: `Invalid path - Cannot go back beyond the root folder: ${path}` });
        return;
      }

      if (await isValidPath(nick, ip, updatedPath)) {
        user.path = updatedPath;

        const displatyPath = updatedPath.replace(/\//g, '\\');
        socket.emit('setPath', { path: `C:\\${displatyPath}` });
      } else {
        // Handle invalid path
        socket.emit('print', { msg: `Invalid path: ${path}` });
      }
    } catch (err) {
      throw err;
    }
  });
};