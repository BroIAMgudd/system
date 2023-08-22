async function listLogs(conn, ip) {
  // Fetch the last 25 local logs of the target IP from the 'logs' table
  const [logRows] = await conn.query(
    'SELECT id, actionType, extraDetails, loggedIP, timestamp FROM logs WHERE targetIP = ? ORDER BY id ASC LIMIT 25',
    [ip]
  );
  logRows.reverse();

  return logRows;
}

async function addLog(conn, targetIP, loggedIP, actionType, extraDetails, usersOnline, io) {
  // Usage example addLog(conn, 'remote', '192.168.1.2', '127.0.0.1', 'upload', 'File.txt');
  const query = 'INSERT INTO logs (targetIP, loggedIP, actionType, extraDetails) VALUES (?, ?, ?, ?)';
  const values = [targetIP, loggedIP, actionType, extraDetails];

  const [row] = await conn.query(query, values);

  const log = {
    id: row.insertId,
    actionType: actionType,
    extraDetails: extraDetails,
    loggedIP: loggedIP,
    timestamp: Date.now()
  }

  for (const socketID in usersOnline) {
    const newUser = usersOnline[socketID];

    if (newUser.ip === targetIP) {
      io.to(socketID).emit('localLogUpdate', log);
    }
    
    if (newUser.connTo === targetIP) {
      io.to(socketID).emit('remoteLogUpdate', log);
    }
  };
}

module.exports = {
  listLogs,
  addLog
};