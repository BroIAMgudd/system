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

async function deleteFile(socket, file, ip, connTo, usersOnline, io) {
  try {
    const conn = await pool.getConnection();
    deleteFile: try {
      const { id, targetIP, filename, ext, path } = file;
      [rows] = await getFile('id', id, targetIP);

      if (rows.length === 0) {
        socket.emit('print', { msg: 'File not found.' });
        break deleteFile;
      }

      await conn.query('DELETE FROM filesystem WHERE id = ? AND ip = ?', [id, targetIP]);

      if (ext === 'folder') {
        await conn.query('DELETE FROM filesystem WHERE ip = ? AND path LIKE ?', [targetIP, `${path}/${filename}%`]);
        socket.emit('print', { msg: `Folder Deleted: ${filename}` });
      } else {
        socket.emit('print', { msg: `File Deleted: ${filename}` });
      }

      const actionType = (file.ext === 'folder') ? 'Deleted Folder' : 'Deleted File';
      const fileName = (file.ext === 'folder') ? file.filename : `${file.filename}.${file.ext}`;

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
    const { username, ip } = user;
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
  addLog,
  addTask
};