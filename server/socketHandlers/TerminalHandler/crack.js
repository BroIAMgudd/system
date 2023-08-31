const pool = require('../mysqlPool');
const { addCrackTask } = require('../Functions/dbRequests');

module.exports = function(socket, usersOnline) {
  socket.on('crack', async (data) => {
    try {
      const { username, ip } = usersOnline[socket.id];
      const targetIP = data.targetIP;
      const conn = await pool.getConnection();

      crack: try {
        const [crcQuery] = await conn.query('SELECT id, filename, ext, path FROM filesystem WHERE owner = ? AND ip = ? AND ext = ?', [username, ip, 'crc']);
        const crc = crcQuery.length > 0 ? crcQuery[0] : null;

        if (!crc) {
          socket.emit('print', { msg: "The term 'crack' is not recognized as the name of a cmdlet, function, script file, or operable program. Verify that the program is installed on your local system." });
          break crack;
        }

        const [cpuQuery] = await conn.query('SELECT cpu FROM system WHERE username = ?', [username]);
        const userCPU = parseFloat(cpuQuery[0].cpu);

        const [passlistQuery] = await conn.query('SELECT * FROM filesystem WHERE owner = ? AND ip = ? AND ext = ?', [username, targetIP, 'pass']);
        const passlistSpeed = passlistQuery.length > 0 ? passlistQuery[0].contents : 0;

        const [securityQuery] = await conn.query('SELECT security FROM system WHERE ip = ?', [targetIP]);
        const targetSecurity = securityQuery[0].security;
        const speed = (100 - parseInt(passlistSpeed) / 100) * ((targetSecurity / (userCPU / 100)) * 10);

        addCrackTask(socket, username, targetIP, crc, speed);

        socket.emit('print', { msg: `Cracking password for ${targetIP}` });
      } finally {
        conn.release();
      }
    } catch (err) {
      throw err;
    }
  });
};
