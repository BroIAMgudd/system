module.exports = function (socket, usersOnline) {
  socket.on('exit', () => {
    if (!usersOnline[socket.id]) {
      socket.disconnect();
      return;
    }
  
    const user = usersOnline[socket.id];
    if (user.connTo) {
      user.connTo = ''; // Clear the connection info
      user.path = user.nick; // Reset the path to the user's root path
      socket.emit('setPath', { path: `C:\\${user.nick}` });
      socket.emit('remoteLogListUpdate', []);
      socket.emit('print', { msg: 'Disconnected.' });
    } else {
      socket.emit('print', { msg: "There's no place like 127.0.0.1" });
    }
  });
};
