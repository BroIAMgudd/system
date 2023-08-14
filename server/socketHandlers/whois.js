const pool = require('./mysqlPool'); // Adjust the path accordingly
const { isValidIPAddress } = require('./helper');

module.exports = function (socket, usersOnline) {
  socket.on('whois', async (data) => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    const { ip } = data;

    if (!isValidIPAddress(ip)) {
      socket.emit('print', { msg: 'wtf dude stop sending manual requests' });
      return;
    }

    try {
      const conn = await pool.getConnection();

      try {
        const [whoisQuery] = await getWhoisInfo(conn, ip);

        if (whoisQuery.length === 1) {
          const { username, cpu, ram, netName, harddrive, playtime } = whoisQuery[0];
          const existingUserIndex = Object.values(usersOnline).findIndex(name => name.username === username);
          let uptime = 0;

          if (existingUserIndex !== -1) {
            const objKey = Object.keys(usersOnline)[existingUserIndex];
            uptime = usersOnline[objKey].uptime;
          }
          uptime += playtime;

          socket.emit('whois', { username, cpu, ram, netName, harddrive, uptime });
        } else {
          socket.emit('print', { msg: `Invalid IP Address: ${ip}` });
        }
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Get Whois Error:', error.message);
    }
  });
};

async function getWhoisInfo(conn, ip) {
  return conn.query('SELECT username, cpu, ram, netName, harddrive, playtime FROM system WHERE ip = ?', [ip]);
}