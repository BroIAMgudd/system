const pool = require('./mysqlPool');
const { isValidIPAddress, findUser } = require('./helper');
const { listLogs, addLog } = require('./Functions/Logs');
const { findSystem } = require('./Functions/System');
const { getIPList, findIPFromList } = require('./Functions/ipList');

module.exports = function (socket, usersOnline, io) {
  socket.on('ssh', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    if (!isValidIPAddress(data.targetIP)) {
      socket.emit('print', { msg: 'Invalid target IP address.' });
      return;
    }

    target: try {
      const { username, ip } = user;
      const { targetIP } = data;

      if (targetIP === ip) {
        socket.emit('print', { msg: "Why travel far when you're already here?" });
        break target;
      }

      const conn = await pool.getConnection();
      ssh: try {
        const { nick } = await findSystem(conn, 'ip', targetIP);

        if (!nick) {
          socket.emit('print', { msg: `Target IP not found: ${targetIP}` });
          break ssh;
        }
        
        const ipList = getIPList(conn, username);
        let ipAddressFound = findIPFromList(ipList, targetIP);

        let blocked = false;
        let reason = '';

        if (!ipAddressFound) {
          blocked = true;
          reason = 'Password has not been cracked';
        } else {
          blocked = await firewall(conn, user.ip, targetIP);
          if (blocked) { reason = 'Bypass script not found'; }
        }

        if (blocked) {
          let hasProtection = false; //TODO: Implement protection software

          if (hasProtection) {
            socket.emit('print', { msg: `Connection Forceably Haulted: ${reason}` });
          } else {
            addLog(conn, targetIP, user.ip, 'Blocked Connection', null, usersOnline, io);
            socket.emit('print', { msg: `Connection Failed and attempt logged: ${reason}` });
          }

          break ssh;
        }


        user.connTo = targetIP;
        user.path = nick;
        //           targetIP, loggedIP, actionType, extraDetails
        addLog(conn, targetIP, ip, 'Authentication', null, usersOnline, io);
        addLog(conn, ip, targetIP, 'Authentication', null, usersOnline, io);

        const remoteLogs = await listLogs(conn, targetIP);

        socket.emit('remoteLogListUpdate', remoteLogs);
        socket.emit('setPath', { path: `C:\\${nick}` });
        socket.emit('print', { msg: `Connected to IP: ${targetIP}` });
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('SSH Error:', err.message);
      socket.emit('print', { msg: 'An error occurred while connecting.' });
      throw err;
    }
  });
};

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
