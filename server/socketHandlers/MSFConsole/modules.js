const { getModuleList, findModuleFromList } = require('../Functions/msfReq');
const { findUser } = require('../helper');
const pool = require('../mysqlPool');

module.exports = function (socket, usersOnline, io) {
  socket.on('modules', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    try {
      const { username } = user;
      const conn = await pool.getConnection();

      try {
        const list = await getModuleList(conn, username);

        console.log(list);
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

function separateFilesAndFolders(files) {
  const folders = [];
  const filesList = [];

  files.forEach(file => {
    const entry = {
      id: file.id,
      name: file.ext === 'folder' ? file.filename : `${file.filename}.${file.ext}`,
      type: file.ext === 'folder' ? 'Folder' : 'File',
      size: file.ext === 'folder' ? '' : file.size,
      modification: file.modification,
      version: file.ext === 'folder' ? '' : `v${file.version}`
    };

    if (file.ext === 'folder') {
      folders.push(entry);
    } else {
      filesList.push(entry);
    }
  });

  return { folders, filesList };
}

function sortEntriesAlphabetically(entries) {
  entries.sort((a, b) => a.name.localeCompare(b.name));
}

function createTable(entries) {
  const tableHeader = '<table><tr><th>ID</th><th>Name</th><th>Type</th><th>Size</th><th>Version</th><th>Last Modified</th></tr>';
  const tableRows = entries.map(entry => {
    return `<tr><td>${entry.id}</td><td>${entry.name}</td><td>${entry.type}</td><td>${entry.size}</td><td>${entry.version}</td><td>${entry.modification}</td></tr>`;
  }).join('');
  const tableFooter = '</table>';

  return tableHeader + tableRows + tableFooter;
}