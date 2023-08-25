async function getModuleList(conn, username) {
  const [msfQuery] = await conn.query('SELECT * FROM metasploit WHERE username = ?', [username]);
  return msfQuery;
}

async function findModuleFromList(conn, username, service) {
  const [msfQuery] = await conn.query('SELECT * FROM metasploit WHERE username = ? AND service = ?', [username, service]);
  const module = msfQuery.find(module => module.service === service);
  if (module) { return true; } else { return false; }
}

module.exports = {
  getModuleList,
  findModuleFromList
};