const pool = require('./mysqlPool');

module.exports = function (socket) {
  socket.on('test', async (data) => {
    socket.emit('testFinish', { test: data.test });
  });
};