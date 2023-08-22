export const reqIPListHandler = (socket) => {
  socket.on('receiveUser', () => socket.emit('LoadIPs'));
};

export const setIPListHandler = (socket, setState) => {
  socket.on('LoadIPs', ips => setState({ ipList: ips }));
};

export const appendIPHandler = (socket, setState) => {
  socket.on('appendIP', ip => setState((prevState) => (
    { ipList: [...prevState.ipList, ip] }
  )));
};

export const removeIPHandler = (socket, setState, removeIP) => {
  socket.on('removeIP', ip => removeIP(ip));
};