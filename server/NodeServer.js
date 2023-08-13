const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { uptime } = require('process');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ["GET", "POST"]
  }
});

// MySQL database connection configuration
const dbConfig = {
  //ROOT: Ijj7&b5FcF=2
  host: "localhost",
  user: "HaxerAdmin",
  password: "9rR3h*b5V2QQ",
  database: "haxdb"
};

const pool = mysql.createPool(dbConfig);
const usersOnline = {};

const randIP = () => Array(4).fill(0).map((_, i) => Math.floor(Math.random() * 255) + (i === 0 ? 1 : 0)).join('.');

isValidIPAddress = (ipAddress) => {
  // Regular expression pattern for IPv4 and IPv6 addresses
  const ipPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9A-Fa-f]{1,4}::?)+$/;

  return ipPattern.test(ipAddress);
}

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

function parsePath(currentPath, newPath) {
  const isAbsolutePath = newPath.startsWith('C:/');
  
  if (isAbsolutePath) {
    return newPath.replace('C:/', '');
  } else if (newPath.includes('..')) {
    return manipulateDirectory(currentPath, newPath)
  } else {
    // Traverse forward (e.g., 'cd Test' or 'cd Blender\Test')
    return currentPath + '/' + newPath;
  }
}

isValidPath = async (nick, ip, path) => {
  if (path === nick) { return true; }

  try {
    const parts = path.split('/');
    const lastFolder = parts.pop();
    let newPath = parts.join('/');
    if (newPath.endsWith('/')) { newPath = newPath.slice(0, -1); }

    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      'SELECT * FROM filesystem WHERE ip = ? AND filename = ? AND ext = ? AND path = ?',
      [ip, lastFolder, 'folder', newPath]
    );

    conn.release();

    if (rows.length === 1) { return true; } else { return false; }
  } catch (error) {
    console.error('Error in isValidPath:', error.message);
    return false;
  }
}

// WebSocket event handling
io.on('connection', (socket) => {
  console.log('Socket Online:', socket.id);

  // Handle register event
  socket.on('register', async (data) => {
    const { username, email, password } = data;

    // Additional checks for username and password
    if (!username || username.length < 4) {
      return socket.emit('registerError', { error: 'Username must be at least 8 characters long' });
    }

    if (!email || email.length < 6) {
      return socket.emit('registerError', { error: 'Email must be at least 8 characters long' });
    }

    if (!password || password.length < 6) {
      return socket.emit('registerError', { error: 'Password must be at least 8 characters long' });
    }

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Get a connection from the pool
      const conn = await pool.getConnection();

      // Insert the user into the database with the hashed password
      await conn.query('INSERT INTO users (username, email, password, sessionID) VALUES (?, ?, ?, ?)', [
        username,
        email,
        hashedPassword,
        socket.id
      ]);

      const ip = randIP();
      await conn.query('INSERT INTO system (username, nick, ip, cpu, ram, harddrive) VALUES (?, ?, ?, ?, ?, ?)', [
        username,
        username.slice(0, 6),
        ip,
        750,
        2560,
        5
      ]);

      await conn.query('INSERT INTO filesystem (owner, ip, filename, ext, size, path) VALUES (?, ?, ?, ?, ?, ?)', [
        username,
        ip,
        'netCrawler',
        'wifi',
        1,
        username.slice(0, 6)
      ]);
      
      // Release the connection
      conn.release();

      socket.emit('registerSuccess', { message: `${username} registered successfully!` });
      console.log("Register New User: ", username);
    } catch (error) {
      console.error('Error:', error.message);
      socket.emit('registerError', { error: 'Something went wrong' });
    }
  });

  // Handle login event
  socket.on('login', async (data) => {
    const { username, password } = data;

    try {
      // Get a connection from the pool
      const conn = await pool.getConnection();

      // Fetch the user from the database based on the username
      const [rows] = await conn.query('SELECT id, username, password FROM users WHERE username = ?', [username]);

      if (rows.length === 1) {
        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
          await conn.query('UPDATE users SET sessionID = ?, lastOnline = ? WHERE username = ?', [
            socket.id,
            formatTimestamp(Date.now()),
            username
          ]);
          socket.emit('loginSuccess', { message: 'Login successful!',  id: user.id, username: user.username });
        } else {
          socket.emit('loginError', { error: 'Invalid credentials' });
        }
        // Release the connection
        conn.release();
      } else {
        socket.emit('loginError', { error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login Error:', error.message);
      socket.emit('loginError', { error: 'Something went wrong' });
    }
  });

  socket.on('getUser', async () => {
    // Fetch the user from the database based on the sessionID (socket.id)
    try {
      // Get a connection from the pool
      const conn = await pool.getConnection();

      // Fetch the user from the database based on the sessionID (socket.id)
      const [userInfo] = await conn.query('SELECT id, username FROM users WHERE sessionID = ?', [socket.id]);

      if (userInfo.length === 1) {
        user = userInfo[0];
        const [sysInfo] = await conn.query('SELECT nick, ip, cpu, ram, netName, upload, download, harddrive, usb FROM system WHERE username = ?', [user.username]);
        conn.release();

        if (sysInfo.length === 1) {
          system = sysInfo[0];
          socket.emit('receiveUser', { user, system });
          socket.emit('setNick', { nick: system.nick });
          socket.emit('setPath', { path: `C:\\${system.nick}` });
        }

        //If user makes a new windows and logs in remove old socket from userlist and replace with new instance
        const existingUserIndex = Object.values(usersOnline).findIndex(name => name.username === user.username);
        var addUpTime = 0;
        if (existingUserIndex !== -1) {
          const objKey = Object.keys(usersOnline)[existingUserIndex];
          addUpTime = usersOnline[objKey].uptime;

          // Remove the existing user entry
          delete usersOnline[objKey];
        }
        usersOnline[socket.id] = {
          id: user.id,
          username: user.username,
          nick: system.nick,
          ip: system.ip,
          path: system.nick,
          connTo: '',
          lastHeartbeat: Date.now(),
          uptime: addUpTime
        };
        console.log('User Login:', user.username, 'Socket ID:', socket.id);
      } else { conn.release(); socket.disconnect();}
    } catch (error) {
      console.error('Get User Error:', error.message);
    }
  });

  socket.on('cd', async (data) => {
    if (!usersOnline[socket.id]) { socket.disconnect(); return; }
    
    try {    
      const { path } = data;
      const user = usersOnline[socket.id];
      const currentPath = user.path;

      const ip = (user.connTo === '') ? user.ip : user.connTo;
      var nick = '';

      if (user.connTo !== '') {
        const conn = await pool.getConnection();
        const [sysInfo] = await conn.query('SELECT nick FROM system WHERE ip = ?', [ip]);
        conn.release();

        nick = sysInfo[0].nick;
      } else {
        nick = user.nick;
      }
    
      // Parse the new path and calculate the updated path
      const updatedPath = parsePath(currentPath, path.replace(/\\/g, '/').replace(/^\//, '').replace(/\/$/, ''));

      if (!updatedPath) { socket.emit('print', { msg: `Invalid path - Cannot go back beyond the root folder: ${path}` }); return; }

      if (await isValidPath(nick, ip, updatedPath)) {
        user.path = updatedPath;

        socket.emit('setPath', { path: `C:\\${updatedPath.replace(/\//g, '\\')}` });
        return
      } else {
        // Handle invalid path
        socket.emit('print', { msg: `Invalid path: ${path}` });
        return;
      }
    } catch (error) {
      console.error('Get cd Error:', error.message);
    }
  });

  socket.on('ssh', async (data) => {
    if (!usersOnline[socket.id]) { socket.disconnect(); return; }

    const { targetIp } = data;

    

    if (!isValidIPAddress(targetIp)) { socket.emit('print', { msg: 'Invalid target IP address.' }); return; }

    try {
      const user = usersOnline[socket.id];

      if (targetIp === user.ip) {
        socket.emit('print', { msg: "Why travel far when you're already here?" });
        return;
      }

      const conn = await pool.getConnection();

      // Fetch the target user's information
      const [targetUser] = await conn.query( 'SELECT nick FROM system WHERE ip = ?', 
        [targetIp]
      );

      if (targetUser.length === 1) {
        const { nick } = targetUser[0];
        user.connTo = targetIp; // Update the connection info

        // Update the user's path to the root path of the connected target
        user.path = nick;
        socket.emit('setPath', { path: `C:\\${nick}` });

        socket.emit('print', { msg: `Connected to IP: ${targetIp}` });
      } else {
        socket.emit('print', { msg: `Target IP not found: ${targetIp}` });
      }

      conn.release();
    } catch (error) {
      console.error('Error in ssh:', error.message);
      socket.emit('print', { msg: 'An error occurred while connecting.' });
    }
  });

  socket.on('exit', () => {
    if (!usersOnline[socket.id]) { socket.disconnect(); return; }

    const user = usersOnline[socket.id];
    if (user.connTo === '') {
      socket.emit('print', { msg: "There's no place like 127.0.0.1" });
      return;
    }
    user.connTo = ''; // Clear the connection info
    user.path = user.nick; // Reset the path to the user's root path
    socket.emit('setPath', { path: `C:\\${user.nick}` });

    socket.emit('print', { msg: 'Disconnected.' });
  });

  socket.on('whois', async (data) => {
    if (!usersOnline[socket.id]) { socket.disconnect(); return; }
    const { ip } = data;

    if (!isValidIPAddress(ip)) { socket.emit('print', { msg: 'wtf dude stop sending manual requests' }); return; }
    
    try {
      const conn = await pool.getConnection();
      
      const [whoisQuery] = await conn.query('SELECT username, cpu, ram, netName, harddrive, playtime FROM system WHERE ip = ?', [ip]);

      if (whoisQuery.length === 1) {
        const { username, cpu, ram, netName, harddrive, playtime } = whoisQuery[0];
        const existingUserIndex = Object.values(usersOnline).findIndex(name => name.username === username);
        var uptime = 0;
        
        if (existingUserIndex !== -1) {
          const objKey = Object.keys(usersOnline)[existingUserIndex];
          uptime = usersOnline[objKey].uptime;
        }
        uptime += playtime;

        socket.emit('whois', { username, cpu, ram, netName, harddrive, uptime });
      } else {
        socket.emit('print', { msg: `Invalid IP Address: ${ip}` });
      }

      conn.release();
    } catch (error) {
      console.error('Get Whios Error:', error.message);
    }
  });

  socket.on('setNick', async (data) => {
    if (!usersOnline[socket.id]) { socket.disconnect(); return; }
    
    const user = usersOnline[socket.id];
    const oldNick = user.nick;
    const conn = await pool.getConnection();

    await conn.query('UPDATE system SET nick = ? WHERE username = ?', [ data.nick, user.username ]);
    await conn.query('UPDATE filesystem SET path = REGEXP_REPLACE(path, ?, ?) WHERE path LIKE ?', [ `^${oldNick}`, data.nick, `${oldNick}%` ]);
    conn.release();

    user.nick = data.nick;
    user.path = user.path.replace(oldNick, data.nick);
    socket.emit('setNick', { nick: data.nick });
    if (user.connTo === '') {
      socket.emit('setPath', { path: `C:\\${user.path.replace(/\//g, '\\')}` });
    }
  });

  socket.on('mkdir', async (data) => {
    if (!usersOnline[socket.id]) { socket.disconnect(); return; }
    
    const user = usersOnline[socket.id];
    const ip = (user.connTo === '') ? user.ip : user.connTo;
    const conn = await pool.getConnection();
    
    await conn.query('INSERT INTO filesystem (owner, ip, filename, ext, path) VALUES (?, ?, ?, ?, ?)', [
      user.username,
      ip,
      data.name,
      'folder',
      user.path
    ]);
    conn.release();

    socket.emit('print', { msg: `Created new folder: ${data.name}` });
  });

  socket.on('dir', async () => {
    try {
      const user = usersOnline[socket.id];
      const ip = (user.connTo === '') ? user.ip : user.connTo;
      const conn = await pool.getConnection();

      // Fetch the list of files and folders in the current directory
      const [files] = await conn.query(
        'SELECT id, filename, ext, size, modification, version FROM filesystem WHERE ip = ? AND path = ?',
        [ip, user.path]
      );

      conn.release();

      if (files.length > 0) {
        const folders = [];
        const filesList = [];

        // Separate folders and files, format the last modified date
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

        // Sort folders and files alphabetically
        folders.sort((a, b) => a.name.localeCompare(b.name));
        filesList.sort((a, b) => a.name.localeCompare(b.name));

        const entries = [...folders, ...filesList];

        const tableHeader = '<table><tr><th>ID</th><th>Name</th><th>Type</th><th>Size</th><th>Version</th><th>Last Modified</th></tr>';
        const tableRows = entries.map(entry => {
          return `<tr><td>${entry.id}</td><td>${entry.name}</td><td>${entry.type}</td><td>${entry.size}</td><td>${entry.version}</td><td>${entry.modification}</td></tr>`;
        }).join('');
        const tableFooter = '</table>';

        const table = tableHeader + tableRows + tableFooter;
        socket.emit('print', { msg: table });
      } else {
        socket.emit('print', { msg: 'No files or folders found in the current directory.' });
      }
    } catch (error) {
      console.error('Error in dir:', error.message);
      socket.emit('print', { msg: 'An error occurred while listing the directory.' });
    }
  });

  socket.on('touch', async (data) => {
    if (!usersOnline[socket.id]) { socket.disconnect(); return; }

    const user = usersOnline[socket.id];
    const ip = (user.connTo === '') ? user.ip : user.connTo;
    const conn = await pool.getConnection();

    await conn.query('INSERT INTO filesystem (owner, ip, filename, ext, path) VALUES (?, ?, ?, ?, ?)', [
      user.username,
      ip,
      data.name,
      'txt',
      user.path,
    ]);
    conn.release();

    socket.emit('print', { msg: `Created new file: ${data.name}.txt` });
  });

  socket.on('transfer', async (data) => {
    const { ip, connTo, path, nick } = usersOnline[socket.id];
    const { fileInfo, type, search } = data;
    let sender, receiver, filePath;

    if (!connTo) {
      socket.emit('print', { msg: 'You need to be currently connected to someone.' });
      return;
    } else if (type === 'ul') {
      // MyIP => File => connTo
      sender = ip;
      receiver = connTo;
      filePath = path;
    } else {
      // connTo => File => MyIP
      sender = connTo;
      receiver = ip;
      filePath = nick;
    }
  
    const conn = await pool.getConnection();
    let file;

    try {
      if (search === 'id') {
        // Search for file by id
        const [rows] = await conn.query('SELECT * FROM filesystem WHERE ip = ? AND id = ?', [sender, parseInt(fileInfo)]);
        file = rows[0];
      } else {
        // Search for file by name
        const [rows] = await conn.query('SELECT * FROM filesystem WHERE ip = ? AND filename = ?', [sender, fileInfo]);
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
        const [folderDup] = await conn.query('SELECT * FROM filesystem WHERE ip = ? AND filename = ?', [receiver, file.filename]);

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
          'SELECT * FROM filesystem WHERE ip = ? AND path = ?',
          [sender, `${file.path}/${file.filename}`]
        );

        folderContents.forEach(async item => {
          await conn.query(
            'INSERT INTO filesystem (status, owner, ip, filename, ext, contents, size, path, permission, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item.status, item.owner, receiver, item.filename, item.ext, item.contents, item.size, `${filePath}/${file.filename}`, item.permission, item.version]
          );
        });
      } else {
        // Insert file details on their IP
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

  socket.on('rm', async (data) => {
    const { ip, connTo, path } = usersOnline[socket.id];
    let { fileInfo, search } = data;
    
    const targetIp = (connTo === '') ? ip : connTo;
    
    const conn = await pool.getConnection();
  
    try {
      if (search === 'id') {
        // Search for file by id
        const [rows] = await conn.query('SELECT filename, ext FROM filesystem WHERE ip = ? AND id = ?', [targetIp, parseInt(fileInfo)]);
        var file = rows[0];
  
        if (!file) {
          socket.emit('print', { msg: 'File not found.' });
          conn.release();
          return;
        }
        
        await conn.query('DELETE FROM filesystem WHERE ip = ? AND id = ?', [targetIp, parseInt(fileInfo)]);
        socket.emit('print', { msg: `File removed: ${file.filename}` });
      } else {
        // Search for file by name
        const [rows] = await conn.query('SELECT filename, ext FROM filesystem WHERE ip = ? AND filename = ?', [targetIp, fileInfo]);
        var file = rows[0];
  
        if (!file) {
          socket.emit('print', { msg: 'File not found.' });
          conn.release();
          return;
        }
        
        await conn.query('DELETE FROM filesystem WHERE ip = ? AND filename = ?', [targetIp, fileInfo]);
        socket.emit('print', { msg: `File removed: ${file.filename}` });
      }

      if (file.ext === 'folder') {
        await conn.query('DELETE FROM filesystem WHERE ip = ? AND path LIKE ?', [targetIp, `${path}/${file.filename}%`]);
      }
    } catch (error) {
      console.error('Remove Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while removing the file.' });
    } finally {
      conn.release();
    }
  });

  socket.on('move', async (data) => {
    const { filename, updatePath } = data;
    const { ip, connTo, path, nick } = usersOnline[socket.id];
    const targetip = (connTo === '') ? ip : connTo;
    let targetnick;
    const conn = await pool.getConnection();

    try {
      if (connTo !== '') {
        const [row] = await conn.query('SELECT nick FROM system WHERE ip = ?', [ip]);
        targetnick = row.nick;
      } else {
        targetnick = nick;
      }
    
      const [currentPathRow] = await conn.query('SELECT ext FROM filesystem WHERE filename = ? AND ip = ? AND path = ?', [filename, targetip, path]);
      const fileType = currentPathRow[0].ext;
    
      const newPath = parsePath(
        path,
        updatePath.replace(/\\/g, '/').replace(/^\//, '').replace(/\/$/, '')
      );

      console.log(newPath);
    
      if (!newPath) {
        socket.emit('print', { msg: `Invalid path - Cannot go back beyond the root folder: ${updatePath}` });
        return;
      }
    
      if (await isValidPath(targetnick, targetip, newPath)) {
        await conn.query('UPDATE filesystem SET path = ? WHERE filename = ? AND ip = ?', [newPath, filename, targetip]);
        if (fileType === 'folder') {
          await conn.query('UPDATE filesystem SET path = ? WHERE ip = ? AND path LIKE ?', [`${newPath}/${filename}`, targetip, `${path}/${filename}%`]);
          socket.emit('print', { msg: `Moved folder ${filename}` });
        } else {
          socket.emit('print', { msg: `Moved file ${filename}` });
        }
      } else {
        // Handle invalid path
        socket.emit('print', { msg: `Invalid path: ${path}` });
      }
    } catch (error) {
      console.error('Move Error:', error.message);
      socket.emit('print', { msg: 'An error occurred while move the file.' });
    } finally {
      conn.release();
    }
  });  

  socket.on('test', async (data) => {
    socket.emit('testFinish', { test: data.test });
  });

  socket.on('heartbeat', () => {
    if (!usersOnline[socket.id]) { socket.disconnect(); return; }
    if (usersOnline[socket.id]) {
      usersOnline[socket.id].lastHeartbeat = Date.now();
      usersOnline[socket.id].uptime += 30;
    }
  });

  socket.on('disconnect', async () => {
    if (usersOnline[socket.id]) {
      const user = usersOnline[socket.id].username;
      console.log('User Offline:', user, 'Socket ID:', socket.id);
      const uptime = usersOnline[socket.id].uptime;
      delete usersOnline[socket.id];

      if (uptime > 60) {
        const conn = await pool.getConnection();
        await conn.query('UPDATE system SET playtime = playtime + ? WHERE username = ?', [
          uptime,
          user
        ]);
        conn.release();
      }
    } else {
      console.log('Socket Offline:', socket.id);
    }
  });
});

setInterval(() => {
  const now = Date.now();
  Object.keys(usersOnline).forEach(socketId => {
    const user = usersOnline[socketId];
    if (now - user.lastHeartbeat > 60000) { // Consider socket offline if no heartbeat in the last 60 seconds
      delete usersOnline[socketId];
    }
  });
}, 90000); // Check heartbeats every 90 seconds

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});