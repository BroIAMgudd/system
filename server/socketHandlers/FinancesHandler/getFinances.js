const pool = require('../mysqlPool');
const { getFinances, getWallet } = require('../Functions/Finances');

module.exports = function (socket, usersOnline, btcPrice) {
  socket.on('getFinances', async () => {
    try {
      const { username } = usersOnline[socket.id];
      const [bankRows] = await getFinances(username);
      bankRows.forEach(account => { account.showDetails = false; });
      socket.emit('updateBanks', bankRows);

      const [row] = await getWallet(username);
      const btcAmt = row[0].amount

      socket.emit('updateBtcAmt', btcAmt);
    } catch (err) {
      throw err;
    }
  });
};