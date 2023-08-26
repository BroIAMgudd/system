async function getModuleList(conn, username) {
  const [msfQuery] = await conn.query('SELECT * FROM metasploit WHERE username = ?', [username]);
  return msfQuery;
}

async function getModuleBy(conn, username, fileInfo = null, type = null, service = null) {
  let sql = 'SELECT * FROM metasploit WHERE username = ?';
  sql += (fileInfo && fileInfo.search === 'id') ? ' AND id = ?' : ' AND name = ?';
  sql += (type) ? ' AND type = ?' : '';
  sql += (service) ? ' AND service = ?' : '';

  let values = [username];
  if (fileInfo) values.push(fileInfo.info);
  if (type) values.push(type);
  if (service) values.push(service);
  return await conn.query(sql, values);
}

async function findModulesByService(conn, username, service) {
  const [msfQuery] = await conn.query('SELECT * FROM metasploit WHERE username = ? AND service = ?', [username, service]);
  return msfQuery;
}

async function getModulesByType(conn, username, type) {
  const [msfQuery] = await conn.query('SELECT * FROM metasploit WHERE username = ? AND type = ?', [username, type]);
  return msfQuery;
}

async function getModulesByName(conn, username, type) {
  const [msfQuery] = await conn.query('SELECT * FROM metasploit WHERE username = ? AND type = ?', [username, type]);
  return msfQuery;
}

module.exports = {
  getModuleList,
  getModuleBy
};