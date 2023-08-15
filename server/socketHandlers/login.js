const pool = require('./mysqlPool');
const bcrypt = require('bcrypt');
const { formatTimestamp } = require('./helper');

module.exports = function (socket) {
  socket.on('login', async (data) => {
    const { username, password } = data;

    try {
      const conn = await pool.getConnection();
      try {
        const user = await fetchUser(conn, username);

        if (user && await isPasswordValid(password, user.password)) {
          await updateSessionAndLastOnline(conn, socket.id, username);
          socket.emit('loginSuccess', { message: 'Login successful!', id: user.id, username: user.username });
        } else {
          socket.emit('loginError', { error: 'Invalid credentials' });
        }
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Login Error:', error.message);
      socket.emit('loginError', { error: 'Something went wrong' });
    }
  });
};

async function fetchUser(conn, username) {
  const [rows] = await conn.query('SELECT id, username, password FROM users WHERE username = ?', [username]);
  return rows.length === 1 ? rows[0] : null;
}

async function isPasswordValid(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

async function updateSessionAndLastOnline(conn, sessionId, username) {
  await conn.query('UPDATE users SET sessionID = ?, lastOnline = ? WHERE username = ?', [
    sessionId,
    formatTimestamp(Date.now()),
    username
  ]);
}