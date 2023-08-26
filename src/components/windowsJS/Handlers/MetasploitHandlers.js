export const isIPAddress = (ipAddress) => {
  // Regular expression pattern for IPv4 and IPv6 addresses
  const ipPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9A-Fa-f]{1,4}::?)+$/;
  return ipPattern.test(ipAddress);
};

const between = (x, min, max) => {
  return x >= min && x <= max;
}

const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
}

export const processCommand = (args, socket, print, setState, state) => {
  print(`msf6> ${args.join(' ')}`);

  const commands = {
    'modules': () => {
      socket.emit('modules');
    },
    'set': (params) => {
      const paramString = params[0].toLowerCase();
      const setTarget = params[1];
      if (!['rhost', 'rport'].includes(paramString)) { print('Must choose to either set RHOST or RPORT'); return;  }
      if (paramString === 'rhost' && !isIPAddress(setTarget)) { print('Invalid IP Address'); return; }
      if (paramString === 'rport' && !between(setTarget, 1, 65535)) { print('Invalid Port Number Range is 1-65,535'); return; }
      setState({ [paramString]: setTarget });
      const type = (paramString === 'rhost') ? 'HOST' : 'PORT';
      const targetFormat = (paramString === 'rhost') ? `'${setTarget}'` : `${setTarget}`;
      print(`SET TARGET ${type} = ${targetFormat};`);
    },
    'use': (params) => {
      const paramString = params[0].trim().toLowerCase();
      let modType = '';
      if (paramString === 'exploit') { modType = 'Exploits'; }
      if (paramString === 'payload') { modType = 'Payloads'; }
      const filename = params[1];
      if (!modType) { print('Must choose to either use a EXPLOIT or a PAYLOAD file'); return; }
      if (!filename) { print('Must choose to a file to use EX. use exploit reverse_shell'); return; }
      socket.emit('use', { fileInfo: filename, modType: modType, search: 'name' });
    },
    'useid': (params) => {
      const fileid = parseInt(params[0]);
      if (!fileid) { print('Must choose to a file to use EX. useid 69'); return; }
      socket.emit('use', { fileInfo: fileid, modType: null, search: 'id' });
    },
    'exploit': () => {
      if(!state.rhost) { print('RHOST is not SET'); return; }
      if(!state.rport) { print('RPORT is not SET'); return; }
      if(isEmpty(state.exploit)) { print('EXPLOIT is not SET'); return; }
      if(isEmpty(state.payload)) { print('PAYLOAD is not SET'); return; }
      socket.emit('exploit', { host: state.rhost, port: state.rport, exploitID: state.exploit.id, payloadID: state.payload.id });
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
  socket.on('msfprint', data => print(data.msg));
};

export const setModuleHandler = (socket, setState) => {
  socket.on('setModule', data => {
    const { id, name, modType } = data;
    setState({ [modType]: { id: id, name: name } });
  });
};