const pool = require('../mysqlPool');
const { isValidIPAddress, findUser } = require('../Functions/helper');
const { listLogs, addLog } = require('../Functions/Logs');
const { findSystem } = require('../Functions/System');
const { getIPList, findIPFromList } = require('../Functions/ipList');

module.exports = function (socket, usersOnline, io) {
  socket.on('nmap', async (data) => {
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
        socket.emit('print', { msg: `Network Scanning Report` });
        break target;
      }

      const conn = await pool.getConnection();
      nmap: try {

        const [nmapQuery] =  await conn.query('SELECT * FROM filesystem WHERE owner = ? AND ip = ? AND ext = ?', [username, ip, 'map']);

        if (!nmapQuery.length === 0) {
          socket.emit('print', { msg: 'Nmap not found please reinstall application' });
          break nmap;
        }

        const targetSys = await findSystem(conn, 'ip', targetIP);

        if (!targetSys) {
          socket.emit('print', { msg: 'Target user changed IP' });
          break nmap;
        }

        const portQuery = await getPorts(conn, targetSys.username);
        const ports = portQuery.length > 0 ? portQuery : null;

        let output = `Network Scanning Report<br>
        ------------------------<br>
                
        Scanning Target: ${targetIP}<br><br>
                
        Host Status:<br>
        &nbsp;&nbsp;- Host: ${targetIP} - Up<br><br>
                
        Open Ports:<br>`;
        if (ports) {
          for (const portInfo of ports) {
            output += `&nbsp;&nbsp;- Port ${portInfo.number} (${portInfo.service}) - ${(portInfo.vulnerable === 0) ? 'Open' : 'Vulnerable'}<br>`;
          }
        } else {
          output += `&nbsp;&nbsp;- No Open Ports Found<br>`;
        }
        output += `<br>Detected Services:<br>`;
        for (const portInfo of ports) {
          output += `&nbsp;&nbsp;- Port ${portInfo.number} (${portInfo.service}) - ${portInfo.application}<br>`;
        }

        output += `<br>Potential Vulnerabilities:<br>`;
        for (const portInfo of ports) {
          output += `&nbsp;&nbsp;- Port ${portInfo.number} (${portInfo.service}) - ${genVulnerability(portInfo.service)}<br>`;
        }

        socket.emit('print', { msg: output } );
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('nmap Error:', err.message);
      socket.emit('print', { msg: 'An error occurred while scanning.' });
      throw err;
    }
  });
};

async function getPorts(conn, username) {
  const query = 'SELECT * FROM ports WHERE username = ?';
  const [rows] = await conn.query(query, [username]);
  return rows;
}

function version() {
  return `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 99) + 1}.${Math.floor(Math.random() * 99) + 1}`
}

function genVulnerability(service) {
  const genVulns = [
    `Outdated ${service} version.`,
    `Weak or default credentials set for ${service}.`,
    `Missing security patches for ${service}.`,
    `Insecure root configurations set for ${service}.`,
    'Lack of SSL/TLS data encryption.',
    'User with limitless privileges has weak password.',
    'Excessive information exposure.',
    'No intrusion detection system for this port.',
    'Service offline port is open without purpose.',
    'Inadequate logging and auditing limitless brute forcing possible.'
  ];

  const specVulns = {
    'SSH': 'OpenSSH with limited open access',
    'HTTP': 'Possible outdated Apache version.',
    'HTTPS': 'Possible SSL/TLS vulnerability.',
    'FTP': 'Anonymous access enabled. Consider disabling it.',
    'SMTP': 'Open relay detected. Secure SMTP configuration needed.',
    'MySQL': 'Weak password for \'root\' user.',
    'PostgreSQL': 'User with limitless privileges to all databases',
    'DNS': 'Recursive DNS resolver open. Potential DDoS amplification risk.',
    'Telnet': 'Clear text communication. Use SSH for secure remote access.',
    'VNC': 'No password set for VNC server.'
  };
  
  if (parseFloat(Math.random().toFixed(2)) <= 0.05) {
    return specVulns[service];
  } else {
    return genVulns[Math.floor(Math.random() * 10)];
  }
}

function generateRandomPortInfo(randomFactor) {
  const serviceNames = [
    'SSH', 'HTTP', 'HTTPS', 'FTP', 'SMTP', 'MySQL', 'PostgreSQL', 'DNS', 'Telnet', 'VNC'
  ]; 

  const portInfo = [];
  
  const numPorts = Math.min(Math.max(Math.ceil(randomFactor * 10), 3), 10);

  for (let i = 0; i < numPorts; i++) {
    const serviceName = serviceNames[Math.floor(Math.random() * serviceNames.length)];
    const port = Math.floor(Math.random() * 65535) + 1;
    const isOpen = Math.random() < randomFactor;
    const serviceVersion = isOpen ? version() : 'Closed Port';
    const vulnerability = isOpen ? genVulnerability(serviceName) : '';

    portInfo.push({
      port,
      isOpen,
      serviceName,
      serviceVersion,
      vulnerability
    });
  }
  
  return portInfo;
}