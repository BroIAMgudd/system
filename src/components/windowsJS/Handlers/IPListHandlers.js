export const reqIPListHandler = (socket) => {
  socket.on('receiveUser', () => socket.emit('reqIPList'));
};

export const setIPListHandler = (socket, setState) => {
  socket.on('LoadIPs', ips => setState({ ipList: ips }));
};

export const appendIPHandler = (socket, setState) => {
  socket.on('appendIP', ip => setState((prevState) => (
    { ips: [ip, ...prevState.ips] }
  )));
};

export const removeIPHandler = (socket, setState, removeIP) => {
  socket.on('removeIP', ip => removeIP(ip));
};