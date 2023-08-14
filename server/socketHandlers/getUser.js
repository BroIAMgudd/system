const pool = require('./mysqlPool'); // Adjust the path accordingly

module.exports = function (socket, usersOnline) {
  socket.on('getUser', async () => {
    try {
      const conn = await pool.getConnection();
      try {
        const [userInfo] = await getUserInfo(conn, socket.id);

        let user = userInfo[0];
        const [sysInfo] = await getSystemInfo(conn, user.username);

        if (sysInfo.length === 1) {
          let system = sysInfo[0];
          updateUserList(usersOnline, socket, user, system);
          console.log('User Login:', user.username, 'Socket ID:', socket.id);
        }
      } finally {
        conn.release();
      }
    } catch (err) {
      throw err;
    }
  });
};

async function getUserInfo(conn, sessionId) {
  return conn.query('SELECT id, username FROM users WHERE sessionID = ?', [sessionId]);
}

async function getSystemInfo(conn, username) {
  return conn.query('SELECT nick, ip, cpu, ram, netName, upload, download, harddrive, usb FROM system WHERE username = ?', [username]);
}

function updateUserList(usersOnline, socket, user, system) {
  const existingUserIndex = Object.values(usersOnline).findIndex(u => u.username === user.username);

  let addUpTime = 0;
  if (existingUserIndex !== -1) {
    const existingUserKey = Object.keys(usersOnline)[existingUserIndex];
    addUpTime = usersOnline[existingUserKey].uptime;

    delete usersOnline[existingUserKey];
  }

  usersOnline[socket.id] = {
    id: user.id,
    username: user.username,
    nick: system.nick,
    ip: system.ip,
    path: system.nick,
    connTo: '',
    lastHeartbeat: Date.now(),
    uptime: addUpTime
  };

  socket.emit('receiveUser', { user, system });
  socket.emit('setNick', { nick: system.nick });
  socket.emit('setPath', { path: `C:\\${system.nick}` });
}