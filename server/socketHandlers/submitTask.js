const { getFile, createFile, rmFile, rmFilePath } = require('./Functions/Filesystem');
const { getIPList, setIPList } = require('./Functions/ipList');
const { findTaskByID } = require('./Functions/Tasks');
const { findSystem } = require('./Functions/System');
const { addLog } = require('./Functions/Logs');
const { findUser } = require('./helper');
const pool = require('./mysqlPool');

module.exports = function (socket, usersOnline, io) {
  socket.on('submitTask', async (taskid) => {
    const user = findUser(usersOnline, 'id', socket.id);
    if (!user) { socket.disconnect(); return; }

    try {
      const conn = await pool.getConnection();
      submitTask: try {
        const task = await findTaskByID(conn, taskid);
        if (!task) { socket.emit('print', { msg: 'Task not found.' }); break submitTask; }

        const { actionType, endTime } = task;
        const currentDate = new Date();

        if (endTime.getTime() > currentDate.getTime()) {
          socket.emit('print', { msg: 'Task Not Finished' });
          break submitTask;
        }

        switch (actionType) {
          case 'Remove':
            deleteFile(conn, socket, task, user, usersOnline, io);
            break;
            case 'Upload':
            case 'Download':
            case 'Restore':
            case 'Backup':
            transfer(conn, socket, task, user, usersOnline, io);
            break;
          case 'Crack':
           crackIP(conn, socket, task, user, usersOnline, io);
            break;
          default:
            console.log('Unknown action:', actionType);
            break;
        }
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('Task submit Error:', err.message);
      socket.emit('print', { msg: 'An error occurred while submitting the task' });
      throw err;
    }
  });
};

async function rmTask(conn, id, socket) {
  conn.query('DELETE FROM tasks WHERE id = ?', [id]);
  socket.emit('deleteTask', id);
  return;
}

async function deleteFile(conn, socket, task, user, usersOnline, io) {
  const { ip, connTo } = user;
  const { id, targetID, targetIP, filename, ext, path } = task;
  const fileRows = await getFile(conn, 'id', targetID, targetIP);
  if (!fileRows) { socket.emit('print', { msg: 'File not found.' }); return; }

  rmFile(conn, 'id', targetID);
  if (ext === 'folder') { rmFilePath(conn, targetIP, `${path}/${filename}%`); }
  rmTask(conn, id, socket);

  const actionType = (ext === 'folder') ? 'Deleted Folder' : 'Deleted File';
  const fileName = (ext === 'folder') ? filename : `${filename}.${ext}`;
  socket.emit('print', { msg: `${actionType}: ${fileName}` });
  
  if (!connTo) {
    addLog(conn, ip, ip, actionType, fileName, usersOnline, io);
  } else {
    addLog(conn, targetIP, ip, actionType, fileName, usersOnline, io);
    addLog(conn, ip, targetIP, actionType, fileName, usersOnline, io);
  }
}

async function transfer(conn, socket, task, user, usersOnline, io) {
  const { id, targetIP, targetID, actionType, extraDetails } = task;
  const { ip } = user;

  const sender = (actionType === 'Upload') ? ip : targetIP;
  const receiver = (actionType === 'Upload') ? targetIP : ip;

  const fileRows = await getFile(conn, 'id', targetID, sender);
  const targetSys = await findSystem(conn, 'ip', receiver);

  if (!fileRows) {
    socket.emit('print', { msg: 'File not found.' });
    return;
  } else if (!targetSys) {
    socket.emit('print', { msg: 'Target user changed IP' });
    return;
  }

  const file = fileRows[0];
  let receiverPath = (actionType !== 'Backup') ? targetSys.nick : `nas/${targetSys.nick}`;
  if (extraDetails) { receiverPath = extraDetails; }
  const { filename, ext } = file;
  const path = (actionType !== 'Restore') ? file.path : file.path.replace('nas/', '');

  if (ext === 'folder') {
    const folderDup = await getFile(conn, 'name', filename, receiver, receiverPath, 'folder');

    if (folderDup) {
      socket.emit('print', { msg: 'Folder with same name already exists.' });
      return;
    }

    await createFile(conn, file, receiver, receiverPath);
    
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

      await createFile(conn, contentFile, receiver, `${receiverPath}/${itemPath}`);
    });
  } else {
    await createFile(conn, file, receiver, receiverPath);
  }

  await rmTask(conn, id, socket);

  const fileType = (file.ext === 'folder') ? 'Folder' : 'File';
  const fileName = (file.ext === 'folder') ? filename : `${filename}.${ext}`;
  socket.emit('print', { msg: `${actionType} ${fileType}: ${fileName}` });

  addLog(conn, receiver, sender, `${actionType} ${fileType}`, fileName, usersOnline, io);
  if (actionType === 'Backup' || actionType === 'Restore') { return; }
  addLog(conn, sender, receiver, `${actionType} ${fileType}`, fileName, usersOnline, io);
}

async function crackIP(conn, socket, task, user) {
  const { username, ip } = user;
  const { id, targetID, targetIP } = task;
  crc = await getFile(conn, 'id', targetID, ip);

  if (crc.length === 0) {
    socket.emit('print', { msg: 'Crc not found please reinstall application.' });
    return;
  }

  rmTask(conn, id, socket);

  const targetSys = await findSystem(conn, 'ip', targetIP);
  const targetType = (targetSys) ? targetSys.type : null;
  if (!targetType) {
    socket.emit('print', { msg: 'Target has changed IP' });
    return;
  }

  const ipList = await getIPList(conn, username);
  ipList[targetType].push(targetIP);
  const newIPList = JSON.stringify(ipList);

  setIPList(conn, username, newIPList);
  socket.emit('print', { msg: `Cracked ${targetType}: ${targetIP}` });
  socket.emit('appendIP', { username: targetSys.username, ip: targetIP, type: targetType });
}