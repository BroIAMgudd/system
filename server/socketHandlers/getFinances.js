const pool = require('./mysqlPool'); // Adjust the path accordingly

module.exports = function (socket, usersOnline, btcPrice) {
  socket.on('getFinances', async () => {
    try {
      const { username } = usersOnline[socket.id];
      const conn = await pool.getConnection();
      try {
        const [bankRows] = await getFinances(conn, username);
        bankRows.forEach(account => { account.showDetails = false; });
        socket.emit('updateBanks', bankRows);

        const [row] = await getWallet(conn, username);
        const btcAmt = row[0].amount

        socket.emit('updateBtcAmt', btcAmt);
      } finally {
        conn.release();
      }
    } catch (err) {
      throw err;
    }
  });
};

async function getFinances(conn, username) {
  return conn.query('SELECT * FROM finances WHERE username = ?', [username]);
}

async function getWallet(conn, username) {
  return conn.query('SELECT * FROM btcwallet WHERE username = ?', [username]);
}