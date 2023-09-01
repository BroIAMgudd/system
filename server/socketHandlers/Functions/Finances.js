const pool = require('../mysqlPool');

async function bankBuy(username, bankRows, cost) {
  try {
    const conn = await pool.getConnection();
    try {
      for (let i = 0; i < bankRows.length; i++) {
        const account = bankRows[i];
        const bankAmt = parseFloat(account.amount);
        if (bankAmt <= cost) {
          cost -= bankAmt;
          await updateBankAmt(username, account.ip, 0);
        } else {
          const newAmt = bankAmt - cost;
          cost = 0;
          await updateBankAmt(username, account.ip, newAmt);
        }
        if (cost === 0) { break; }
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function getFinances(username) {
  try {
    const conn = await pool.getConnection();
    try {
      return conn.query('SELECT * FROM finances WHERE username = ?', [username]);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function updateBankAmt(username, ip, amt) {
  try {
    const conn = await pool.getConnection();
    try {
      return conn.query('UPDATE finances SET amount = ? WHERE username = ? AND ip = ?', [amt, username, ip]);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function getPrimary(username) {
  try {
    const conn = await pool.getConnection();
    try {
      const [primary] = await conn.query('SELECT * FROM finances WHERE username = ? AND mainAcc = 1', [username]);
      return primary[0];
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function getWallet(username) {
  try {
    const conn = await pool.getConnection();
    try {
      return conn.query('SELECT * FROM btcwallet WHERE username = ?', [username]);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function updateWallet(username, amt) {
  try {
    const conn = await pool.getConnection();
    try {
      return conn.query('UPDATE btcwallet SET amount = ? WHERE username = ?', [amt, username]);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function createPacket(code, amount) {
  try {
    const conn = await pool.getConnection();
    try {
      return conn.query('INSERT INTO btcpackets (code, amount) VALUES (?, ?)', [code, amount]);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function getPacket(code) {
  try {
    const conn = await pool.getConnection();
    try {
      const [row] = await conn.query('SELECT * FROM btcpackets WHERE code = ?', [code]);
      const packet = row[0];
      if (packet && packet.expired === 0) {
        await conn.query('UPDATE btcpackets SET expired = ? WHERE code = ?', [1, code]);
        return packet.amount;
      } else {
        return false;
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

module.exports = {
  bankBuy,
  getFinances, 
  updateBankAmt,
  getPrimary,
  getWallet,
  updateWallet,
  createPacket,
  getPacket
};