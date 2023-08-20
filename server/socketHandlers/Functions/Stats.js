const pool = require('../mysqlPool');

async function getStats(username) {
  try {
    const conn = await pool.getConnection();
    try {
      return conn.query('SELECT * FROM system WHERE username = ?', [username]);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function addStat(username, type, amt) {
  try {
    const conn = await pool.getConnection();
    try {
      return conn.query(`UPDATE system SET ${type} = ${type} + ? WHERE username = ?`, [amt, username]);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

module.exports = {
  getStats,
  addStat
};