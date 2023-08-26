const { getModuleBy } = require('../Functions/msfReq');
const { findUser } = require('../helper');
const pool = require('../mysqlPool');

module.exports = function (socket, usersOnline, io) {
  socket.on('use', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    const { fileInfo, modType, search } = data;

    try {
      const { username } = user;
      const conn = await pool.getConnection();

      use: try {
        const [moduleQuery] = await getModuleBy(conn, username, { search: search, info: fileInfo }, modType);
        
        if (moduleQuery.length === 0) {
					socket.emit('msfprint', { msg: `Module ${search} ${fileInfo} Not Found` });
					break use;
				} else if (moduleQuery.length > 1) {
					socket.emit('msfprint', { msg: 'Multiple modules found select by id instead' });
					break use;
        }

				const { id, name, type } = moduleQuery[0];
				const formatModType = type.charAt(0).toLowerCase() + type.slice(1).slice(0, -1);
				socket.emit('setModule', { id: id, name: name, modType: formatModType });
				socket.emit('msfprint', { msg: `SET MODULE ${formatModType} = '${name}' WHERE id = ${id};` });
      } finally {
        conn.release();
      }
    } catch (err) {
      throw err;
    }
  });
};