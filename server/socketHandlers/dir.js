const pool = require('./mysqlPool');

module.exports = function (socket, usersOnline) {
  socket.on('dir', async () => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }

    try {
      const user = usersOnline[socket.id];
      const ip = user.connTo === '' ? user.ip : user.connTo;
      const conn = await pool.getConnection();

      try {
        const [files] = await getFilesList(conn, ip, user.path);

        if (files.length > 0) {
          const { folders, filesList } = separateFilesAndFolders(files);
    
          sortEntriesAlphabetically(folders);
          sortEntriesAlphabetically(filesList);
    
          const entries = [...folders, ...filesList];
          const table = createTable(entries);
    
          socket.emit('print', { msg: table });
        } else {
          socket.emit('print', { msg: 'No files or folders found in the current directory.' });
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

function separateFilesAndFolders(files) {
  const folders = [];
  const filesList = [];

  files.forEach(file => {
    const formattedModification = new Date(file.modification).toLocaleString();
    const entry = {
      id: file.id,
      name: file.ext === 'folder' ? file.filename : `${file.filename}.${file.ext}`,
      type: file.ext === 'folder' ? 'Folder' : 'File',
      size: file.ext === 'folder' ? '' : file.size,
      modification: formattedModification,
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