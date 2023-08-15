export const localLogListUpdate = (socket, setState) => {
  socket.on('localLogListUpdate', (logs) => {
    console.log(logs);
    setState({ localLogs: logs });
  });
};

export const remoteLogListUpdate = (socket, setState) => {
  socket.on('remoteLogListUpdate', (logs) => {
    setState({ remoteLogs: logs });
  });
};

export const localLogUpdate = (socket, setState) => {
  socket.on('localLogUpdate', (log) => {
    setState((prevState) => ({
      localLogs: [log, ...prevState.localLogs]
    }));
  });
};

export const remotelLogUpdate = (socket, setState) => {
  socket.on('remotelLogUpdate', (log) => {
    setState((prevState) => ({
      remoteLogs: [log, ...prevState.remoteLogs]
    }));
  });
};
