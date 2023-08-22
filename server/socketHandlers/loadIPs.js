const pool = require('./mysqlPool');
const { listLogs } = require('./helper');

module.exports = function (socket, usersOnline) {
  socket.on('LoadIPs', async (data) => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    try {
      const { username } = usersOnline[socket.id];
      const conn = await pool.getConnection();
      try {
        const ipList = await listIPs(conn, username);

        socket.emit('LoadIPs', ipList);
      } finally {
        conn.release();
      }
    } catch (err) {
      socket.emit('print', { msg: 'An error occurred while getting local logs.' });
      throw err;
    }
  });
};

async function listIPs(conn, username) {
  try {
    const [ipListQuery] = await conn.query('SELECT ips FROM iplist WHERE username = ?', [username]);
    const { NPC, Player, Server } = JSON.parse(String(ipListQuery[0].ips));
    const ipArray = NPC.concat(Player).concat(Server);
    
    const [systemRows] = await conn.query('SELECT username, ip, type FROM system WHERE ip IN (?)', [ipArray]);
    
    return systemRows;
  } catch (err) {
    throw err;
  }
}