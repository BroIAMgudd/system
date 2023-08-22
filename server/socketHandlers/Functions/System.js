async function findSystem(conn, search, data) {
  const [rows] = await conn.query(`SELECT * FROM system WHERE ${search} = ?`, [data]);
  return (rows.length === 1) ? rows[0] : null;
}

module.exports = {
  findSystem
};