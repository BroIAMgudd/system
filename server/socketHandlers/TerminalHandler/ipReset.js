const pool = require('../mysqlPool');
const { findUser, generateRandomIP } = require('../Functions/helper');
const { findSystem } = require('../Functions/System');
const { updateFileIPs } = require('../Functions/Filesystem');
const { deleteTaskByUser, deleteTaskByIP } = require('../Functions/Tasks');

module.exports = function (socket, usersOnline, io) {
  socket.on('ipreset', async () => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    try {
      const { username, ip } = user;
      const conn = await pool.getConnection();

      try {
        const targetSys = await findSystem(conn, 'ip', ip);
        const newIP = generateRandomIP();

        await updateIP(conn, username, newIP);
        await updateFileIPs(conn, ip, newIP);
        user.ip = newIP;
        user.connTo = '';
        user.path = user.nick;
        socket.emit('setPath', { path: `C:\\${user.nick}` });

        await deleteTaskByUser(conn, username);
        await deleteTaskByIP(conn, ip);
        socket.emit('setNetworkProcesses', []);
        socket.emit('remoteLogListUpdate', []);

        for (const socketID in usersOnline) {
          const newUser = usersOnline[socketID];
          
          if (newUser.connTo === ip) {
            newUser.connTo = '';
            newUser.path = newUser.nick;
            io.to(socketID).emit('print', { msg: `Forcfully Disconnected From: ${ip}` });
            io.to(socketID).emit('setPath', { path: `C:\\${newUser.nick}` });
            io.to(socketID).emit('remoteLogListUpdate', []);
          }
        };

        socket.emit('print', { msg: 'IP Reset Successful' });

        await addWhoWas(conn, targetSys);
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('IP Reset Error:', error.message);
      throw error;
    }
  });
};

async function updateIP(conn, username, newIP) {
  await conn.query('UPDATE system SET ip = ? WHERE username = ?', [
    newIP,
    username
  ]);
}

async function addWhoWas(conn, targetSys) {
  const { username, ip, cpu, ram, netName, harddrive, type, playtime } = targetSys;
  await conn.query('INSERT INTO whowas (username, ip, cpu, ram, netName, harddrive, type, playtime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [username, ip, cpu, ram, netName, harddrive, type, playtime]
  );
}