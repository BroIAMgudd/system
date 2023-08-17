const bcrypt = require('bcrypt');
const pool = require('./mysqlPool'); // Adjust the path accordingly
const { generateRandomIP } = require('./helper');

module.exports = function (socket) {
  socket.on('register', async (data) => {
    const { username, email, password } = data;

    try {
      await handleRegistration(socket, username, email, password);
      socket.emit('registerSuccess', { message: `${username} registered successfully!` });
      console.log("Register New User: ", username);
    } catch (error) {
      console.error('Error:', error.message);
      socket.emit('registerError', { error: 'Something went wrong' });
    }
  });
};

async function handleRegistration(socket, username, email, password) {
  if (!isValidField(username, 4) || !isValidField(email, 6) || !isValidField(password, 6)) {
    throw new Error('Invalid input fields');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const conn = await pool.getConnection();

    try {
      const ip = generateRandomIP();
      
      await insertUser(conn, username, email, hashedPassword, socket.id);
      await insertSystem(conn, username, ip);
      await insertFilesystem(conn, username, ip);

    } finally {
      conn.release();
    }
  } catch (err) {
    throw err;
  }
}

async function isValidField(value, minLength) {
  return value && value.length >= minLength;
}

async function insertUser(conn, username, email, hashedPassword, sessionId) {
  await conn.query('INSERT INTO users (username, email, password, sessionID) VALUES (?, ?, ?, ?)', [
    username,
    email,
    hashedPassword,
    sessionId
  ]);
}

async function insertSystem(conn, username, ip) {
  await conn.query('INSERT INTO system (username, nick, ip, cpu, ram, harddrive) VALUES (?, ?, ?, ?, ?, ?)', [
    username,
    username.slice(0, 6),
    ip,
    2.75,
    2560,
    250
  ]);
}

async function insertFilesystem(conn, username, ip) {
  await conn.query('INSERT INTO filesystem (owner, ip, filename, ext, size, path) VALUES (?, ?, ?, ?, ?, ?)', [
    username,
    ip,
    'netCrawler',
    'wifi',
    1,
    username.slice(0, 6)
  ]);
}