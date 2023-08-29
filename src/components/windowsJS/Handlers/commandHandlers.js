//Proccess commands
export const isValidIPAddress = (ipAddress) => {
  // Regular expression pattern for IPv4 and IPv6 addresses
  const ipPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9A-Fa-f]{1,4}::?)+$/;
  return ipPattern.test(ipAddress);
};

export const processCommand = (path, args, socket, print, mkWin, state, setState) => {
  print(`${path}> ${args.join(' ')}`);

  const commands = {
    'ipreset': () => {
      socket.emit('ipreset');
    },
    'clear': () => {
      setState({ output: [] });
    },
    'cd': (params) => {
      if (!params[0]) {
        print('Need a little more info bud');
      } else {
        socket.emit('cd', { path: params[0] });
      }
    },
    'dir': (params) => {
      const path = params[0] || state.path;
      socket.emit('dir', path);
    },
    'ul': (params) => {
      socket.emit('transfer', { fileInfo: params[0], type: 'ul', search: 'name' });
    },
    'ulid': (params) => {
      socket.emit('transfer', { fileInfo: params[0], type: 'ul', search: 'id' });
    },
    'dl': (params) => {
      socket.emit('transfer', { fileInfo: params[0], type: 'dl', search: 'name' });
    },
    'dlid': (params) => {
      socket.emit('transfer', { fileInfo: params[0], type: 'dl', search: 'id' });
    },
    'rm': (params) => {
      socket.emit('rm', { fileInfo: params[0], search: 'name' });
    },
    'rmid': (params) => {
      socket.emit('rm', { fileInfo: params[0], search: 'id' });
    },
    'whois': (params) => {
      if (isValidIPAddress(params[0])) {
        socket.emit('whois', params[0]);
      } else {
        print(`Invalid IP Address: ${params[0]}`);
      }
    },
    'ssh': (params) => {
      if (isValidIPAddress(params[0])) {
        socket.emit('ssh', { targetIP: params[0] });
      } else {
        print(`Invalid target IP Address: ${params[0]}`);
      }
    },
    'crack': (params) => {
      if (isValidIPAddress(params[0])) {
        socket.emit('crack', { targetIP: params[0] });
      } else {
        print(`Invalid target IP Address: ${params[0]}`);
      }
    },
    'exit': () => {
      socket.emit('exit');
    },
    'mkdir': (params) => {
      if (!params[0]) {
        print('Need a little more info bud');
      } else {
        socket.emit('mkdir', { name: params[0] });
      }
    },
    'nas': (params) => {
      const type = params[0].slice(0,7).toLowerCase().replace('rm', 'remove') || '';
      const search = params[0].replace('rm', 'remove').slice(7,9) || 'name';
      const targetFile = params[1] || '';

      if (type === 'ls') {
        socket.emit('dir', `C:/nas/${state.nick}/${targetFile}`);
        return;
      }

      if (!['restore', 'backup', 'remove'].includes(type)) { print('Must choose to either Restore or Backup a file'); return; }
      if (!targetFile) { print(`Must choose a file to ${type}`); return; }
      socket.emit('nas', { fileInfo: targetFile, type: type, search: search });
    },
    'move': (params) => {
      if (!params[0] || !params[1]) {
        print('Need a little more info bud');
      } else {
        socket.emit('move', { fileInfo: params[0], updatePath: params[1], search: 'name' });
      }
    },
    'moveid': (params) => {
      if (!params[0] || !params[1]) {
        print('Need a little more info bud');
      } else {
        socket.emit('move', { fileInfo: params[0], updatePath: params[1], search: 'id' });
      }
    },
    'setnick': (params) => {
      if (params[0].length > 6 || params[0].length < 3) {
        print(`Nickname needs to be over 3 characters and less than 6 characters: ${params[0]}<br><br>`);
      } else {
        socket.emit('setNick', { nick: params[0] });
      }
    },
    'touch': (params) => {
      if (!params[0]) {
        print('Need a little more info bud');
      } else {
        socket.emit('touch', { name: params[0] });
      }
    },
    'nmap': (params) => {
      socket.emit('nmap', { targetIP: params[0] });
    },
    'open': (params) => {
      //TODO: makes a window weather its valid or not so fix plz
      mkWin(params.join(' '));
    }
  };

  const [command, ...params] = args;

  if (commands[command]) {
    commands[command](params);
  } else {
    print(`I have not implemented: ${command}`);
  }
};
//Socket Requests
export const setNickHandler = (socket, setState, handleRef) => {
  socket.on('setNick', (data) => {
    setState({
      nick: data.nick
    }, () => {
      handleRef();
    });
  });
};

export const setPathHandler = (socket, setState, handleRef) => {
  socket.on('setPath', (data) => {
    setState({
      path: data.path
    }, () => {
      handleRef();
    });
  });
};

export const printHandler = (socket, print) => {
  socket.on('print', (data) => {
    const openC = (data.openClose) ? data.openClose : false;
    print(data.msg, openC);
  });
};

export const whoisHandler = (socket, print) => {
  socket.on('whois', (data) => {
    const { username, cpu, ram, netName, harddrive, uptime, oldIP } = data;

    const text = `Username: ${username}<br>Network: ${netName}<br>Cpu: ${cpu} kHz<br>Ram: ${ram} bytes <br>Disk Space: ${harddrive} MB<br>Time played: ${uptime} sec`;

    print(text);
    if (oldIP) { print('This IP is no longer valid') }
  });
};
//TODO: Format Timestamp options Ex. DD/MM/YYYY
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}