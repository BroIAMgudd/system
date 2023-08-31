const pool = require('../mysqlPool');
const { bankBuy, getFinances } = require('../Functions/Finances');
const { addStat } = require('../Functions/Stats');

module.exports = function (socket, usersOnline) {
  socket.on('buyItem', async (itemShortName) => {
    const items = {
      'LLLB': { type: 'computer', name: 'Lack Luster Lap Book', cpu: 10, ram: 2560, drive: 50, price: 6969.69 },
      'test': {},
      'test2': {}
    };

    try {
      const { username } = usersOnline[socket.id];
      const item = items[itemShortName];
      let total = 0;

      const [bankRows] = await getFinances(username);
      bankRows.forEach(account => { total += parseFloat(account.amount); });

      if ( total >= item.price ) {
        await bankBuy(username, bankRows, item.price);

        if (item.type === 'computer') {
          if (item.cpu) { await addStat(username, 'cpu', item.cpu); }
          if (item.ram) { await addStat(username, 'ram', item.ram); }
          if (item.drive) { await addStat(username, 'harddrive', item.drive); }
        }

        const [newBankRows] = await getFinances(username);
        newBankRows.forEach(account => { account.showDetails = false; });
        socket.emit('updateBanks', newBankRows);

        socket.emit('print', `Bought: ${item.name} for ${item.price}`);
      } else {
        socket.emit('print', 'Not Enough Mon Monz');
      }
    } catch (err) {
      throw err;
    }
  });
};