const pool = require('./mysqlPool');
const { findUser, parsePath, isValidPath } = require('./helper');

module.exports = function (socket, usersOnline) {
  socket.on('dir', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    try {
      const { setPath, local } = data;
      const { ip, connTo, nick, path } = user;
      const targetIP = (connTo === '' || local === true) ? ip : connTo;
      const conn = await pool.getConnection();

      try {
        const sanitizedPath = setPath.replace(/\\/g, '/').replace(/^\.\/(?!\.\/)/, '').replace(/^\/|\/$/g, '');
        const updatedPath = parsePath(path, sanitizedPath);

        if (!updatedPath) {
          socket.emit('print', { msg: `Invalid path - Cannot go back beyond the root folder: ${path}` });
          return;
        }
        
        const [files] = await getFilesList(conn, targetIP, updatedPath);

        if (files.length === 0) {
          socket.emit('print', { msg: 'No files or folders found in the current directory.' });
          return;
        }

        const { folders, filesList } = separateFilesAndFolders(files);
  
        sortEntriesAlphabetically(folders);
        sortEntriesAlphabetically(filesList);
  
        const entries = [...folders, ...filesList];
        const table = createTable(entries);
  
        socket.emit('print', { msg: table });
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