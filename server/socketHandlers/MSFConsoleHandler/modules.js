const { getModuleList } = require('../Functions/msfReq');
const { findUser } = require('../Functions/helper');
const pool = require('../mysqlPool');

module.exports = function (socket, usersOnline) {
  socket.on('modules', async () => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    try {
      const { username } = user;
      const conn = await pool.getConnection();

      try {
        const list = await getModuleList(conn, username);

        if (list.length > 0) {
          const types = separateByType(list);

          let html = types.map((type) => {
            if (type.length > 0) {
              sortByServices(type);
              return `${createTable(type)}`;
            }
            return '';
          }).join('');

          socket.emit('msfprint', { msg: html });
        } else {
          socket.emit('msfprint', { msg: 'No modules found.' });
        }

      } finally {
        conn.release();
      }
    } catch (err) {
      throw err;
    }
  });
};

async function getFilesList(conn, ip, path) {
  return conn.query(
    'SELECT id, filename, ext, size, modification, version FROM filesystem WHERE ip = ? AND path = ?',
    [ip, path]
  );
}

function separateByType(modules) {
  const Exploits = [];
  const Payloads = [];
  const Encoders = [];
  const Nops = [];
  const Auxiliary = [];

  modules.forEach(item => {
    if (item.type === 'Exploits') {
      Exploits.push(item);
    } else if (item.type === 'Payloads') {
      Payloads.push(item);
    } else if (item.type === 'Encoders') {
      Encoders.push(item);
    } else if (item.type === 'Nops') {
      Nops.push(item);
    } else if (item.type === 'Auxiliary') {
      Auxiliary.push(item);
    }
  });

  return [Exploits, Payloads, Encoders, Nops, Auxiliary];
}

function sortByServices(items) {
  items.sort((a, b) => a.service.localeCompare(b.service));
}

function createTable(entries) {
  const tableType = `<h3 style="margin: 0;">${entries[0].type}<br/>========</h3>`
  const tableHeader = '<table><tr><th>ID</th><th>Name</th><th>Service</th><th>Level</th></tr>';
  const tableRows = entries.map(entry => {
    return `<tr><td>${entry.id}</td><td>${entry.name}</td><td>${entry.service}</td><td>${entry.level}</td></tr>`;
  }).join('');
  const tableFooter = '</table>';

  return tableType + tableHeader + tableRows + tableFooter;
}