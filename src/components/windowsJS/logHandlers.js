export const localLogListUpdate = (socket, setState) => {
  socket.on('localLogListUpdate', (logs) => {
    setState({ localLogs: logs });
    console.log('localLogListUpdate');
  });
};

export const remoteLogListUpdate = (socket, setState) => {
  socket.on('remoteLogListUpdate', (logs) => {
    setState({ remoteLogs: logs });
    console.log('remoteLogListUpdate');
  });
};

export const localLogUpdate = (socket, setState) => {
  socket.on('localLogUpdate', (log) => {
    console.log('localLogUpdate2', log);
    setState((prevState) => ({
      localLogs: [log, ...prevState.localLogs]
    }));
  });
};

export const remotelLogUpdate = (socket, setState) => {
  socket.on('remoteLogUpdate', (log) => {
    console.log('remoteLogUpdate', log);
    setState((prevState) => ({
      remoteLogs: [log, ...prevState.remoteLogs]
    }));
  });
};

export const deleteLogHandle = (socket, setState, removeLog) => {
  socket.on('deleteLog', (deletedLogId) => {
    removeLog(deletedLogId);
  });
};