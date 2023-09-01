const pool = require('../mysqlPool');

function generateRandomIP() {
  return Array(4).fill(0).map((_, i) => Math.floor(Math.random() * 255) + (i === 0 ? 1 : 0)).join('.');
}

function isValidIPAddress(ipAddress) {
  // Regular expression pattern for IPv4 and IPv6 addresses
  const ipPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9A-Fa-f]{1,4}::?)+$/;
  return ipPattern.test(ipAddress);
}

function parsePath(currentPath, newPath) {
  const isAbsolutePath = newPath.toLowerCase().startsWith('c:/');
  
  if (isAbsolutePath) {
    return newPath.slice(3);
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

function addSeconds(date, seconds) {
  let futureDate = new Date(date + seconds*1000);
  return futureDate;
}

function calcMBSpeed(sizeMB, speed) { return sizeMB * (1 / speed); }

function findUser(usersOnline, search, data) {
  if (search === 'id') { return (usersOnline[data]) ? usersOnline[data] : null; }
  for (const socketID in onlineUsers) {
    if (onlineUsers[socketID][search] === data) {
      return onlineUsers[socketID];
    }
  }
  return null;
}

function formatMoney(amount) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  return formatter.format(amount);
}

module.exports = {
  generateRandomIP,
  isValidIPAddress,
  parsePath,
  isValidPath,
  addSeconds,
  calcMBSpeed,
  findUser,
  formatMoney
};