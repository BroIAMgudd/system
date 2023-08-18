const pool = require('./mysqlPool');
const { addSeconds, calcMBSpeed } = require('./helper');

async function getFile(searchType, fileInfo, targetIP = null, path = null) {
  try {
    const conn = await pool.getConnection();
    try {
      let sql = 'SELECT * FROM filesystem WHERE';
      sql += (searchType === 'id') ? ' id = ?' : ' filename = ?';
      sql += (targetIP) ? ' AND ip = ?' : '';
      sql += (path) ? ' AND path = ?' : '';

      let values = [fileInfo];
      if (targetIP) values.push(targetIP);
      if (path) values.push(path);

      return await conn.query(sql, values);

    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function deleteFile(socket, task, user, usersOnline, io) {
  try {
    const conn = await pool.getConnection();
    deleteFile: try {
      const { ip, connTo } = user;
      const { id, targetID, targetIP, filename, ext, path } = task;
      [rows] = await getFile('id', targetID, targetIP);

      if (rows.length === 0) {
        socket.emit('print', { msg: 'File not found.' });
        break deleteFile;
      }

      await conn.query('DELETE FROM filesystem WHERE id = ? AND ip = ?', [targetID, targetIP]);

      if (ext === 'folder') {
        await conn.query(
          'DELETE FROM filesystem WHERE ip = ? AND path LIKE ?',
          [targetIP, `${path}/${filename}%`]
        );
      }

      await rmTask(id, socket);

      const actionType = (ext === 'folder') ? 'Deleted Folder' : 'Deleted File';
      const fileName = (ext === 'folder') ? filename : `${filename}.${ext}`;
      
      socket.emit('print', { msg: `${actionType}: ${fileName}` });
      
      if (!connTo) {
        await addLog(ip, ip, actionType, fileName, usersOnline, io);
      } else {
        await addLog(targetIP, ip, actionType, fileName, usersOnline, io);
        await addLog(ip, targetIP, actionType, fileName, usersOnline, io);
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function createFile(file, ip, path) {
  try {
    const { status, owner, filename, ext, contents, size, permission, version  } = file 
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'INSERT INTO filesystem (status, owner, ip, filename, ext, contents, size, path, permission, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [status, owner, ip, filename, ext, contents, size, path, permission, version]
      );
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function transfer(socket, task, user, usersOnline, io) {
  try {
    const conn = await pool.getConnection();
    transfer: try {
      const { ip, nick } = user;
      const { id, targetIP, targetID, actionType } = task;

      const sender = (actionType === 'Upload') ? ip : targetIP;
      const receiver = (actionType === 'Upload') ? targetIP : ip;

      const [row] = await getFile('id', targetID, sender);
      const [getNick] = await conn.query('SELECT nick FROM system WHERE ip = ?', [receiver]);

      if (row.length === 0) {
        socket.emit('print', { msg: 'File not found.' });
        break transfer;
      }

      if (getNick.length === 0) {
        socket.emit('print', { msg: 'Target user changed IP' });
        break transfer;
      }

      const file = row[0];
      const receiverNick = getNick[0].nick;
      const { filename, ext, path } = file;

      if (ext === 'folder') {
        const [folderDup] = await getFile('name', filename, receiver, receiverNick);

        if (folderDup.length > 0) {
          socket.emit('print', { msg: 'Folder with same name already exists.' });
          break transfer;
        }

        await createFile(file, receiver, receiverNick);
        
        const [folderContents] = await conn.query(
          'SELECT * FROM filesystem WHERE ip = ? AND path LIKE ?',
          [sender, `${path}/${filename}%`]
        );
        
        folderContents.forEach(async item => {
          const parts = item.path.split('/');
          parts.shift();
          const itemPath = parts.join('/');

          let contentFile = {
            status: item.status, 
            owner: item.owner, 
            filename: item.filename, 
            ext: item.ext, 
            contents: item.contents, 
            size: item.size, 
            permission: item.permission, 
            version: item.version
          }

          await createFile(contentFile, receiver, `${receiverNick}/${itemPath}`);
        });
      } else {
        await createFile(file, receiver, receiverNick);
      }

      await rmTask(id, socket);

      const fileType = (file.ext === 'folder') ? 'Folder' : 'File';
      const fileName = (file.ext === 'folder') ? filename : `${filename}.${ext}`;

      await addLog(receiver, sender, `${actionType} ${fileType}`, fileName, usersOnline, io);
      await addLog(sender, receiver, `${actionType} ${fileType}`, fileName, usersOnline, io);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function addLog(targetIP, loggedIP, actionType, extraDetails, usersOnline, io) {
  // Usage example addLog('remote', '192.168.1.2', '127.0.0.1', 'upload', 'File.txt');
  try {
    const conn = await pool.getConnection();
    try {
      const query = 'INSERT INTO logs (targetIP, loggedIP, actionType, extraDetails) VALUES (?, ?, ?, ?)';
      const values = [targetIP, loggedIP, actionType, extraDetails];

      const [row] = await conn.query(query, values);

      const log = {
        id: row.insertId,
        actionType: actionType,
        extraDetails: extraDetails,
        loggedIP: loggedIP,
        timestamp: Date.now()
      }

      for (const socketID in usersOnline) {
        const newUser = usersOnline[socketID];

        if (newUser.ip === targetIP) {
          io.to(socketID).emit('localLogUpdate', log);
        }
        
        if (newUser.connTo === targetIP) {
          io.to(socketID).emit('remoteLogUpdate', log);
        }
      };
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function addTask(taskType, file, user, targetIP, socket) {
  try {
    const { username } = user;
    const { id, filename, ext, size, path } = file;
    const conn = await pool.getConnection();
    try {
      const taskTypeMap = {
        'Remove': 'cpu',
        'Upload': 'upload',
        'Download': 'download'
      };
      
      const stats = await getStats(username);
      const speed = parseFloat(stats[taskTypeMap[taskType]]).toFixed(2);
      const timer = Math.max(calcMBSpeed(size, speed), 5);
      const endDate = addSeconds(Date.now(), timer);
      const [result] = await conn.query('INSERT INTO tasks (targetID, username, filename, ext, targetIP, path, actionType, endTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, username, filename, ext, targetIP, path, taskType, endDate]
      );

      socket.emit('addNetworkProcess', {
        id: id,
        actionType: taskType,
        filename: filename,
        ext: ext,
        targetIP: targetIP,
        path: path,
        duration: timer, // Duration in seconds
        taskid: result.insertId
      });

    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function rmTask(id, socket) {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('DELETE FROM tasks WHERE id = ?', [id]);
      socket.emit('deleteTask', id);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function getStats(username) {
  try {
    const conn = await pool.getConnection();
    try {
      [row] = await conn.query('SELECT * FROM system WHERE username = ?', [username]);
      return row[0];
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

module.exports = {
  getFile,
  deleteFile,
  transfer,
  addLog,
  addTask
};