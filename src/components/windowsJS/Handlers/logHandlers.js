export const reqLocalListUpdate = (socket) => {
  socket.on('receiveUser', () => socket.emit('localLogListUpdate'));
};

export const localLogListUpdate = (socket, setState) => {
  socket.on('localLogListUpdate', logs => setState({ localLogs: logs }));
};

export const remoteLogListUpdate = (socket, setState) => {
  socket.on('remoteLogListUpdate', logs => setState({ remoteLogs: logs }));
};

export const localLogUpdate = (socket, setState) => {
  socket.on('localLogUpdate', log => setState((prevState) => (
    { localLogs: [log, ...prevState.localLogs] }
  )));
};

export const remotelLogUpdate = (socket, setState) => {
  socket.on('remoteLogUpdate', log => setState((prevState) => (
    { remoteLogs: [log, ...prevState.remoteLogs] }
  )));
};

export const deleteLogHandle = (socket, removeLog) => {
  socket.on('deleteLog', id => removeLog(id));
};