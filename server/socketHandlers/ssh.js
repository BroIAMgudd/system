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

          let blocked = false;
          let reason = '';

          if (!ipAddressFound) {
            blocked = true;
            reason = 'Password has not been cracked';
          }

          if (!blocked) {
            blocked = await firewall(conn,  user.ip, targetIp);
            if (blocked) { reason = 'Bypass script not found'; }
          }

          if (blocked) {
            let hasProtection = false;
            if (hasProtection) {
              socket.emit('print', { msg: `Connection Forceably Haulted: ${reason}` });
            } else {
              await addLog(targetIp, user.ip, 'Blocked Connection', null, usersOnline, io);
              socket.emit('print', { msg: `Connection Failed and attempt logged: ${reason}` });
            }
            break ssh;
          }

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

async function firewall(conn, ip, targetIP) {
  const [firewalls] = await conn.query('SELECT * FROM filesystem WHERE ext = ? AND ip = ?', ['fwl', targetIP]);
  const fwlFound = (firewalls.length > 0) ? true : false;
  if (!fwlFound) { return false; }

  const [bypassScripts] = await conn.query('SELECT contents FROM filesystem WHERE ext = ? AND ip = ?', ['bypass', ip]);
  let scriptFound = false;
  if (bypassScripts.length > 0) {
    for (const script in bypassScripts) {
      if (bypassScripts[script].contents === targetIP) {
        scriptFound = true;
        break;
      }
    }
  }

  if (scriptFound) { return false; }
  else { return true; }
}
