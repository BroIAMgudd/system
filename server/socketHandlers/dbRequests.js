const pool = require('./mysqlPool');
const { addSeconds, calcMBSpeed } = require('./helper');

async function addFileTask(socket, taskType, file, user, targetIP, info = null) {
  try {
    const { username } = user;
    const { id, filename, ext, size, path } = file;
    const conn = await pool.getConnection();
    try {
      const taskTypeMap = { //determines what stat to use for speed
        'Remove': 'cpu',
        'Upload': 'upload',
        'Download': 'download',
        'Restore': 'download',
        'Backup': 'upload'
      };
      
      const stats = await getStats(username);
      const speed = parseFloat(stats[taskTypeMap[taskType]]).toFixed(2);
      const timer = Math.max(calcMBSpeed(size, speed), 5);
      const endDate = addSeconds(Date.now(), timer);
      const [result] = await conn.query('INSERT INTO tasks (targetID, username, filename, ext, targetIP, path, actionType, extraDetails, endTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, username, filename, ext, targetIP, path, taskType, info, endDate]
      );

      socket.emit('addNetworkProcess', {
        id: id,
        actionType: taskType,
        filename: filename,
        ext: ext,
        targetIP: targetIP,
        path: path,
        duration: timer,
        taskid: result.insertId
      });

    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function addCrackTask(socket, username, targetIP, crc, speed) {
  try {
    const conn = await pool.getConnection();
    try {
      const { id, filename, ext, path } = crc;
      const timer = Math.max(Math.round(speed), 5);

      const endDate = addSeconds(Date.now(), timer);
      const [result] = await conn.query('INSERT INTO tasks (targetID, username, filename, ext, targetIP, path, actionType, endTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, username, filename, ext, targetIP, path, 'Crack', endDate]
      );

      socket.emit('addNetworkProcess', {
        id: id,
        actionType: 'Crack',
        filename: filename,
        ext: ext,
        targetIP: targetIP,
        path: path,
        duration: timer,
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
  addFileTask,
  getStats,
  addCrackTask,
};