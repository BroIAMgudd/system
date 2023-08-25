export const processCommand = (args, socket, print, setState) => {
  print(`msf6> ${args.join(' ')}`);

  const commands = {
    'modules': () => {
      socket.emit('modules');
    },
    'clear': () => {
      setState({ output: [] });
    }
  };

  const [command, ...params] = args;

  if (commands[command]) {
    commands[command](params);
  } else {
    print(`I have not implemented: ${command}`);
  }
};

export const printHandler = (socket, print) => {
  socket.on('msfprint', (data) => {
    print(data.msg);
  });
};