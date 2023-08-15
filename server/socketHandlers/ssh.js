const pool = require('./mysqlPool');
const { isValidIPAddress, addLog, listLogs } = require('./helper');

module.exports = function (io, socket, usersOnline) {
  socket.on('ssh', async (data) => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    const { targetIp } = data;

    if (!isValidIPAddress(targetIp)) {
      socket.emit('print', { msg: 'Invalid target IP address.' });
      return;
    }

    lable: try {
      const user = usersOnline[socket.id];

      if (targetIp === user.ip) {
        socket.emit('print', { msg: "Why travel far when you're already here?" });
        break lable;
      }

      const conn = await pool.getConnection();
      try {
        const nick = await getTargetUserInfo(conn, targetIp);

        if (nick) {
          user.connTo = targetIp; // Update the connection info
          user.path = nick; // Update the user's path to the root of the connected target
          const auth = 'Authentication'
          //           targetIP, loggedIP, actionType, extraDetails
          const localLogResult = await addLog(targetIp, user.ip, auth, null);
          const remoteLogResult = await addLog(user.ip, targetIp, auth, null);
          console.log(localLogResult);

          for (const socketID in usersOnline) {
            const newUser = usersOnline[socketID];

            if (socketID === socket.id) {
              const remoteLogs = await listLogs(conn, targetIp);
              const localLogs = await listLogs(conn, user.ip);
      
              socket.emit('remoteLogListUpdate', remoteLogs);
              socket.emit('localLogListUpdate', localLogs);
            } else if (newUser.ip === targetIp) {
              const localLogs = await listLogs(conn, user.ip);
              io.to(socketID).emit('localLogListUpdate', localLogs);
            } else if (newUser.connTo === user.ip || newUser.connTo === targetIp) {
              const remoteLogs = await listLogs(conn, newUser.connTo);
              io.to(socketID).emit('remoteLogListUpdate', remoteLogs);
            }
          }
          
          socket.emit('setPath', { path: `C:\\${nick}` });
          socket.emit('print', { msg: `Connected to IP: ${targetIp}` });
        } else {
          socket.emit('print', { msg: `Target IP not found: ${targetIp}` });
        }
      } finally {
        conn.release();
      }
    } catch (err) {
      socket.emit('print', { msg: 'An error occurred while connecting.' });
      throw err;
    }
  });
};

async function getTargetUserInfo(conn, targetIp) {
  const [targetUser] = await conn.query('SELECT nick FROM system WHERE ip = ?', [targetIp]);
  return targetUser.length === 1 ? targetUser[0].nick : null;
}
