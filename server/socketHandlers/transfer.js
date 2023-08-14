const pool = require('./mysqlPool'); // Adjust the path accordingly

module.exports = function (socket, usersOnline) {
  socket.on('transfer', async (data) => {
    const { ip, connTo, path, nick } = usersOnline[socket.id];
    const { fileInfo, type, search } = data;

    if (!connTo) {
      socket.emit('print', { msg: 'You need to be currently connected to someone.' });
      return;
    }
  
    const conn = await pool.getConnection();
    const sender = (type === 'ul') ? ip : connTo;
    const receiver = (type === 'ul') ? connTo : ip;
    let file;

    try {
      if (search === 'id') {
        // Search for file by id
        const [rows] = await conn.query('SELECT * FROM filesystem WHERE ip = ? AND id = ?', [sender, parseInt(fileInfo)]);
        file = rows[0];
      } else {
        const filePath = (type === 'ul') ? nick : path;
        // Search for file by name
        const [rows] = await conn.query('SELECT * FROM filesystem WHERE ip = ? AND filename = ? AND path = ?', [sender, fileInfo, filePath]);
        if (rows.length > 1) {
          // Handle multiple files with the same name
          socket.emit('print', { msg: 'Multiple files with the same name found. Specify by ID.' });
          conn.release();
          return;
        }
        file = rows[0];
      }

      if (!file) {
        socket.emit('print', { msg: 'File not found.' });
        conn.release();
        return;
      }
      
      if (file.ext === 'folder') {
        const filePath = (type === 'ul') ? path : nick;
        const [folderDup] = await conn.query('SELECT * FROM filesystem WHERE ip = ? AND filename = ? AND path = ?', [receiver, file.filename, filePath]);

        if (folderDup.length > 0) {
          socket.emit('print', { msg: 'Folder with same name already exists.' });
          conn.release();
          return;
        }
        await conn.query(
          'INSERT INTO filesystem (status, owner, ip, filename, ext, contents, size, path, permission, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [file.status, file.owner, receiver, file.filename, file.ext, file.contents, file.size, filePath, file.permission, file.version]
        );
        
        const [folderContents] = await conn.query(
          'SELECT * FROM filesystem WHERE ip = ? AND path LIKE ?',
          [sender, `${file.path}/${file.filename}%`]
        );
        
        folderContents.forEach(async item => {
          const parts = item.path.split('/');
          parts.shift();
          const itemPath = parts.join('/');

          await conn.query(
            'INSERT INTO filesystem (status, owner, ip, filename, ext, contents, size, path, permission, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item.status, item.owner, receiver, item.filename, item.ext, item.contents, item.size, `${filePath}/${itemPath}`, item.permission, item.version]
          );
        });
      } else {
        // Insert file details on their IP
        const filePath = (type === 'ul') ? path : nick;
        await conn.query(
          'INSERT INTO filesystem (status, owner, ip, filename, ext, size, path, permission, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [file.status, file.owner, receiver, file.filename, file.ext, file.size, filePath, file.permission, file.version]
        );
      }
  
      socket.emit('print', { msg: 'File transferred.' });
    } catch (error) {
      console.error('Upload Error:', error.message);
      socket.emit('print', { msg: 'An error occurred during file upload.' });
    } finally {
      conn.release();
    }
  });
};

async function findFile(conn, sender, fileInfo, type, search, path, nick) {
  if (search === 'id') {
    const [rows] = await conn.query('SELECT * FROM filesystem WHERE ip = ? AND id = ?', [sender, parseInt(fileInfo)]);
    return rows[0];
  } else {
    const filePath = (type === 'ul') ? nick : path;
    const [rows] = await conn.query('SELECT * FROM filesystem WHERE ip = ? AND filename = ? AND path = ?', [sender, fileInfo, filePath]);
    return rows;
  }
}

async function findDuplicateFolder(conn, receiver, filename, filePath) {
  return conn.query('SELECT * FROM filesystem WHERE ip = ? AND filename = ? AND path = ?', [receiver, filename, filePath]);
}

async function insertFolder(conn, file, receiver, filePath) {
  return conn.query(
    'INSERT INTO filesystem (status, owner, ip, filename, ext, contents, size, path, permission, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [file.status, file.owner, receiver, file.filename, file.ext, file.contents, file.size, filePath, file.permission, file.version]
  );
}

async function insertFolderContents(conn, sender, receiver, file) {
  const folderContents = await conn.query(
    'SELECT * FROM filesystem WHERE ip = ? AND path LIKE ?',
    [sender, `${file.path}/${file.filename}%`]
  );

  console.log(`${file.path}/${file.filename}%`, folderContents);

  for (const item of folderContents) {
    const parts = item.path.split('/');
    parts.shift();
    const itemPath = parts.join('/');

    await conn.query(
      'INSERT INTO filesystem (status, owner, ip, filename, ext, contents, size, path, permission, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [item.status, item.owner, receiver, item.filename, item.ext, item.contents, item.size, `${file.path}/${itemPath}`, item.permission, item.version]
    );
  }
}

async function insertFile(conn, file, receiver, filePath) {
  return conn.query(
    'INSERT INTO filesystem (status, owner, ip, filename, ext, size, path, permission, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [file.status, file.owner, receiver, file.filename, file.ext, file.size, filePath, file.permission, file.version]
  );
}