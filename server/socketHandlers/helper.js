const pool = require('./mysqlPool');

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function generateRandomIP() {
  return Array(4).fill(0).map((_, i) => Math.floor(Math.random() * 255) + (i === 0 ? 1 : 0)).join('.');
}

function isValidIPAddress(ipAddress) {
  // Regular expression pattern for IPv4 and IPv6 addresses
  const ipPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9A-Fa-f]{1,4}::?)+$/;
  return ipPattern.test(ipAddress);
}

function parsePath(currentPath, newPath) {
  const isAbsolutePath = newPath.startsWith('C:/');
  
  if (isAbsolutePath) {
    return newPath.replace('C:/', '');
  } else if (newPath.includes('..')) {
    return manipulateDirectory(currentPath, newPath)
  } else {
    return currentPath + '/' + newPath;
  }
}

function manipulateDirectory(baseDirectory, manipulationString) {
  // Split the baseDirectory and manipulationString into arrays of folder names
  const baseFolders = baseDirectory.split('/');
  const manipulationFolders = manipulationString.split('/');

  // Process the manipulationFolders array
  for (const folder of manipulationFolders) {
    if (folder === '..') {
      // Go back one folder in the baseFolders array
      if (baseFolders.length > 1) {
        baseFolders.pop();
      } else {
        return false;
      }
    } else if (folder !== '.') {
      // Add the folder to the baseFolders array
      baseFolders.push(folder);
    }
  }

  // Construct the final directory string
  let finalDirectory = baseFolders.join('/');

  // Remove trailing slash if present
  if (finalDirectory.endsWith('/')) {
    finalDirectory = finalDirectory.slice(0, -1);
  }

  return finalDirectory;
}

async function isValidPath(nick, ip, path) {
  if (path === nick) {
    return true;
  }

  try {
    const parts = path.split('/');
    const lastFolder = parts.pop();
    let newPath = parts.join('/');
    if (newPath.endsWith('/')) {
      newPath = newPath.slice(0, -1);
    }

    const conn = await pool.getConnection();

    try {
      const rows = await fetchFileSystemRows(conn, ip, lastFolder, newPath);

      return rows.length === 1;
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function fetchFileSystemRows(conn, ip, lastFolder, newPath) {
  const [rows] = await conn.query(
    'SELECT * FROM filesystem WHERE ip = ? AND filename = ? AND ext = ? AND path = ?',
    [ip, lastFolder, 'folder', newPath]
  );
  return rows;
}

async function addLog(targetIP, loggedIP, actionType, extraDetails) {
  // Usage example addLog('remote', '192.168.1.2', '127.0.0.1', 'upload', 'File.txt');
  try {
    const conn = await pool.getConnection();
    try {
      const query = 'INSERT INTO logs (targetIP, loggedIP, actionType, extraDetails) VALUES (?, ?, ?, ?)';
      const values = [targetIP, loggedIP, actionType, extraDetails];

      await conn.query(query, values);
    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function listLogs(conn, ip) {
  try {
    // Fetch the last 25 local logs of the target IP from the 'logs' table
    const [logRows] = await conn.query(
      'SELECT * FROM logs WHERE targetIP = ? ORDER BY id ASC LIMIT 15', [ip] );

    return logRows;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  formatTimestamp,
  generateRandomIP,
  isValidIPAddress,
  parsePath,
  isValidPath,
  addLog,
  listLogs
};