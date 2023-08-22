async function getIPList(conn, username) {
  const [ipQuery] = await conn.query('SELECT ips FROM iplist WHERE username = ?', [username]);
  return JSON.parse(String(ipQuery[0].ips));
}

async function findIPFromList(ipList, targetIP) {
  for (const key in ipList) {
    if (ipList[key].includes(targetIP)) {
      ipAddressFound = true;
      break;
    }
  }
}

async function setIPList(conn, username, newIPList) {
  await conn.query('UPDATE iplist SET ips = ? WHERE username = ?', [newIPList, username]);
}

module.exports = {
  getIPList,
  findIPFromList,
  setIPList
};