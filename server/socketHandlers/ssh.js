const pool = require('./mysqlPool');
const { isValidIPAddress, listLogs } = require('./helper');
const { addLog } = require('./dbRequests');

module.exports = function (socket, usersOnline, io) {
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
      ssh: try {
        
        const nick = await getTargetUserInfo(conn, targetIp);

        if (nick) {
          const [ipQuery] = await conn.query('SELECT ips FROM iplist WHERE username = ?', [user.username]);
          const ipList = JSON.parse(String(ipQuery[0].ips));
          let ipAddressFound = false;

          for (const key in ipList) {
            if (ipList[key].includes(targetIp)) {
              ipAddressFound = true;
              break;
            }
          }

          console.log(ipAddressFound);

          if (!ipAddressFound) {
            await addLog(targetIp, user.ip, 'Blocked Connection', null, usersOnline, io);
            socket.emit('print', { msg: 'Connection Failed and attempt logged' });
            break ssh;
          }

          //TODO: check for firewall

          user.connTo = targetIp; // Update the connection info
          user.path = nick;
          const auth = 'Authentication'
          //           targetIP, loggedIP, actionType, extraDetails
          await addLog(targetIp, user.ip, auth, null, usersOnline, io);
          await addLog(user.ip, targetIp, auth, null, usersOnline, io);

          const remoteLogs = await listLogs(conn, targetIp);
          let logs = [];
          remoteLogs.forEach(row => {
            logs.unshift({
              id: row.id,
              actionType: row.actionType,
              extraDetails: row.extraDetails,
              loggedIP: row.loggedIP,
              timestamp: row.timestamp,
            });
          });
          socket.emit('remoteLogListUpdate', logs);

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
