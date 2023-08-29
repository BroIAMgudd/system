const pool = require('./mysqlPool');
const { findUser } = require('./helper');
const { getFilesList } = require('./Functions/Filesystem');
const { deleteTaskByUser, deleteTaskByIP } = require('./Functions/Tasks');

module.exports = function (socket, usersOnline) {
  socket.on('nas', async (data) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    try {
      const { username, ip, path } = user;
      const { fileInfo, type, search } = data;
      const conn = await pool.getConnection();

      try {
        const fileRows = await getFile(conn, search, fileInfo, ip, path);

        if (!fileRows) {
          socket.emit('print', { msg: 'File not found.' });
          return;
        } if (fileRows.length > 1) {
          socket.emit('print', { msg: 'Multiple files found with that name use file id instead.' });
          return;
        }

        //do ul/dl for nas restore/backup
        addFileTask(type, fileRows[0], user, targetIP, socket);
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('IP Reset Error:', error.message);
      throw error;
    }
  });
};

async function updateIP(conn, username, newIP) {
  await conn.query('UPDATE system SET ip = ? WHERE username = ?', [
    newIP,
    username
  ]);
}

async function addWhoWas(conn, targetSys) {
  const { username, ip, cpu, ram, netName, harddrive, type, playtime } = targetSys;
  await conn.query('INSERT INTO whowas (username, ip, cpu, ram, netName, harddrive, type, playtime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [username, ip, cpu, ram, netName, harddrive, type, playtime]
  );
}