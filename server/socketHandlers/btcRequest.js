const pool = require('./mysqlPool');

module.exports = function (socket, usersOnline, price) {
  socket.on('btcRequest', async (data) => {
    try {
      const { username } = usersOnline[socket.id];
      const { option, input } = data;
      const conn = await pool.getConnection();
      try {
        const [row] = await getWallet(conn, username);
        const wallet = row[0];

        if (option === 'buy') {
          const buyAmt = parseFloat(input).toFixed(4);
          let cost = parseFloat(buyAmt * price).toFixed(2);
          let total = 0;

          const [bankRows] = await getFinances(conn, username);
          bankRows.forEach(account => { total += parseFloat(account.amount); });

          if ( total >= cost ) {
            for (let i = 0; i < bankRows.length; i++) {
              const account = bankRows[i];
              if (parseFloat(account.amount) <= parseFloat(cost)) {
                cost = parseFloat(cost) - parseFloat(account.amount);
                updateBankAmt(conn, username, account.ip, 0);
              } else {
                const newAmt = parseFloat(account.amount) - parseFloat(cost);
                cost = 0;
                updateBankAmt(conn, username, account.ip, newAmt);
              }
              if (cost === 0) { break; }
            }

            const [newBankRows] = await getFinances(conn, username);
            newBankRows.forEach(account => { account.showDetails = false; });
            socket.emit('updateBanks', newBankRows);

            const newBtcTotal = (parseFloat(buyAmt)+parseFloat(wallet.amount)).toFixed(4);
            updateWallet(conn, username, newBtcTotal);
            socket.emit('updateBtcAmt', newBtcTotal);
            socket.emit('btcInfo', `Bought ${buyAmt} BTC`);
          } else {
            socket.emit('btcInfo', 'Not Enough Mon Monz');
          }
        } else if (option === 'sell') {
          const sellAmt = parseFloat(input).toFixed(4);
          const money = (sellAmt * price).toFixed(2);

          const [row1] = await getWallet(conn, username);
          const wallet = row1[0];
          if (parseFloat(wallet.amount) >= sellAmt) {
            const [row2] = await getPrimary(conn, username);
            const ip = row2[0].ip;
            const amt = row2[0].amount;
            const newBankAmt = parseFloat(money) + parseFloat(amt);

            await updateBankAmt(conn, username, ip, newBankAmt.toFixed(2));

            const [bankRows] = await getFinances(conn, username);
            bankRows.forEach(account => { account.showDetails = false; });
            socket.emit('updateBanks', bankRows);

            const newBtcTotal = (parseFloat(wallet.amount)-parseFloat(sellAmt)).toFixed(4);
            await updateWallet(conn, username, newBtcTotal);
            socket.emit('updateBtcAmt', newBtcTotal);
            socket.emit('btcInfo', `Sold ${sellAmt} BTC`);
          } else {
            socket.emit('btcInfo', `Not enough BTC`);
          }

        } else if (option === 'create') {
          const storeAmt = parseFloat(input).toFixed(4);

          const [row1] = await getWallet(conn, username);
          const wallet = row1[0];
          if (parseFloat(wallet.amount) >= storeAmt) {
            const result = genCode(15);
            await createPacket(conn, result, storeAmt);

            const newBtcTotal = (parseFloat(wallet.amount)-parseFloat(storeAmt)).toFixed(4);
            await updateWallet(conn, username, newBtcTotal);
            socket.emit('updateBtcAmt', newBtcTotal);
            socket.emit('btcInfo', `Created Packet for ${storeAmt} BTC => ${result}`);
          } else {
            socket.emit('btcInfo', `Not enoughs BTC`);
          }
        } else if (option === 'redeem') {
          const code = input.trim();
          const packAmt = await getPacket(conn, code);

          if (packAmt) {
            const newBtcTotal = (parseFloat(wallet.amount)+parseFloat(packAmt)).toFixed(4);
            await updateWallet(conn, username, newBtcTotal);
            socket.emit('updateBtcAmt', newBtcTotal);
            socket.emit('btcInfo', `Claimed ${packAmt} BTC`);
          } else {
            socket.emit('btcInfo', 'Packet has Expired');
          }
        }

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

async function getPrimary(conn, username) {
  return conn.query('SELECT * FROM finances WHERE username = ? AND mainAcc = 1', [username]);
}

async function getWallet(conn, username) {
  return conn.query('SELECT * FROM btcwallet WHERE username = ?', [username]);
}

async function updateWallet(conn, username, amt) {
  return conn.query('UPDATE btcwallet SET amount = ? WHERE username = ?', [amt, username]);
}

async function updateBankAmt(conn, username, ip, amt) {
  return conn.query('UPDATE finances SET amount = ? WHERE username = ? AND ip = ?', [amt, username, ip]);
}

async function createPacket(conn, code, amount) {
  return conn.query('INSERT INTO btcpackets (code, amount) VALUES (?, ?)', [code, amount]);
}

async function getPacket(conn, code) {
  const [row] = await conn.query('SELECT * FROM btcpackets WHERE code = ?', [code]);
  const packet = row[0];
  if (packet.expired === 0) {
    await conn.query('UPDATE btcpackets SET expired = ? WHERE code = ?', [1, code]);
    return packet.amount;
  } else {
    return false;
  }
}

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