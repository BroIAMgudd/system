const pool = require('../mysqlPool');
const {
  bankBuy,
  getFinances, 
  updateBankAmt,
  getPrimary,
  getWallet,
  updateWallet,
  createPacket,
  getPacket
} = require('../Functions/Finances');

module.exports = function (socket, usersOnline, price) {
  socket.on('btcRequest', async (data) => {
    try {
      const { username } = usersOnline[socket.id];
      const { option, input } = data;

      const [row] = await getWallet(username);
      const wallet = row[0];
      const walletAmt = parseFloat(wallet.amount);

      if (option === 'buy') {
        const buyAmt = parseFloat(input).toFixed(4);
        let cost = parseFloat(buyAmt * price);
        let total = 0;

        const [bankRows] = await getFinances(username);
        bankRows.forEach(account => { total += parseFloat(account.amount); });

        if ( total >= cost ) {
          await bankBuy(username, bankRows, cost);

          const [newBankRows] = await getFinances(username);
          newBankRows.forEach(account => { account.showDetails = false; });
          socket.emit('updateBanks', newBankRows);

          const newBtcTotal = (parseFloat(buyAmt) + walletAmt).toFixed(4);
          updateWallet(username, newBtcTotal);
          socket.emit('updateBtcAmt', newBtcTotal);
          socket.emit('btcInfo', `Bought ${buyAmt} BTC`);
        } else {
          socket.emit('btcInfo', 'Not Enough Mon Monz');
        }
      } else if (option === 'sell') {
        const sellAmt = parseFloat(input);
        const money = parseFloat((sellAmt * price).toFixed(2));

        if (walletAmt >= sellAmt) {
          const primary = await getPrimary(username);
          const newBankAmt = (money + parseFloat(primary.amount)).toFixed(2);

          await updateBankAmt(username, primary.ip, newBankAmt);

          const [bankRows] = await getFinances(username);
          bankRows.forEach(account => { account.showDetails = false; });
          socket.emit('updateBanks', bankRows);

          const newBtcTotal = (walletAmt-sellAmt).toFixed(4);
          await updateWallet(username, newBtcTotal);
          socket.emit('updateBtcAmt', newBtcTotal);
          socket.emit('btcInfo', `Sold ${sellAmt.toFixed(4)} BTC`);
        } else {
          socket.emit('btcInfo', `Not enough BTC`);
        }
      } else if (option === 'create') {
        const storeAmt = parseFloat(input);

        if (walletAmt >= storeAmt && storeAmt > 0) {
          const newBtcTotal = (walletAmt-storeAmt).toFixed(4);
          const result = genCode(15);

          await updateWallet(username, newBtcTotal);
          await createPacket(result, storeAmt);

          socket.emit('updateBtcAmt', newBtcTotal);
          socket.emit('btcInfo', `Created Packet for ${storeAmt.toFixed(4)} BTC => ${result}`);
        } else {
          socket.emit('btcInfo', `Not enoughs BTC`);
        }
      } else if (option === 'redeem') {
        const code = input.trim();
        const packAmt = await getPacket(code);

        if (packAmt) {
          const newBtcTotal = (walletAmt+parseFloat(packAmt)).toFixed(4);
          await updateWallet(username, newBtcTotal);
          socket.emit('updateBtcAmt', newBtcTotal);
          socket.emit('btcInfo', `Claimed ${packAmt} BTC`);
        } else {
          socket.emit('btcInfo', 'Packet has Expired');
        }
      }
    } catch (err) {
      throw err;
    }
  });
};

function genCode(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}