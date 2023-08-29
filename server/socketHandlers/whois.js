const pool = require('./mysqlPool');
const { isValidIPAddress, findUser } = require('./helper');
const { findSystem, findWhoWas } = require('./Functions/System');

module.exports = function (socket, usersOnline) {
  socket.on('whois', async (targetIP) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    if (!isValidIPAddress(targetIP)) {
      socket.emit('print', { msg: 'Invalid target IP address.' });
      return;
    }

    try {
      const conn = await pool.getConnection();

      try {
        let targetSys = await findSystem(conn, 'ip', targetIP);
        let oldIP = false;

        if (!targetSys) { targetSys = await findWhoWas(conn, targetIP); oldIP = true; }
        
        if (!targetSys) {
          socket.emit('print', { msg: `Target IP not found: ${targetIP}` });
          return;
        }

        const { username, cpu, ram, netName, harddrive, playtime } = targetSys;
        const existingUserIndex = Object.values(usersOnline).findIndex(name => name.username === username);
        let uptime = playtime;
        if (existingUserIndex !== -1) {
          const objKey = Object.keys(usersOnline)[existingUserIndex];
          uptime += usersOnline[objKey].uptime;
        }

        socket.emit('whois', { username, cpu, ram, netName, harddrive, uptime, oldIP });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Get Whois Error:', error.message);
    }
  });
};

