import React, { Component } from 'react';
import DOMPurify from 'dompurify'
import '../css/terminal.css'

class Terminal extends Component {
  constructor(props) {
    super(props);
    this.promptRef = React.createRef();
    this.inputRef = React.createRef();
    this.terminalRef = React.createRef();

    this.state = {
      nick: 'Anon',
      path: 'C:\\Anon',
      os: 'windows',
      input: '',
      output: [],
      rmWidth: 0
    };
  }

  componentDidMount() {
    this.terminalRef.current.addEventListener('click', this.focusInput);
    this.handleRef();
    // Add event listener for login success and error
    const { socket } = this.props;

    if (socket) {
      socket.on('setNick', (data) => {
        this.setState({
          nick: data.nick
        }, () => {
          this.handleRef();
        });
      });

      socket.on('setPath', (data) => {
        this.setState({
          path: data.path
        }, () => {
          this.handleRef();
        });
      });
      
      socket.on('print', (data) => {
        this.print(data.msg)
      });

      socket.on('whois', (data) => {
        const { username, cpu, ram, netName, harddrive, uptime } = data;
      
        const text = (
          `Username: ${username}<br>
          Network: ${netName}<br>
          Cpu: ${cpu} kHz<br>
          Ram: ${ram} bytes <br>
          Disk Space: ${harddrive} MB<br>
          Time played: ${uptime} sec`
        );
      
        this.print(text);
      });
    }
  }

  handleEnter = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      const inputCommands = this.state.input.trim().replace(/ +(?= )/g, '').split(";");
      this.setState({ input: '' });
  
      inputCommands.forEach(command => {
        const args = command.split(" ");
        this.processCommand(args);
      });
    }
  };

  processCommand = async (args) => {
    const { nick, os, path } = this.state;
    const { socket } = this.props;
    const [command, ...params] = args;

    if (os === 'windows') {
      this.print(`${path}> ${args.join(' ')}`);
    } else if (os === 'linux'){
      this.print(`${path.replace('root', `${nick}@linux-desktop:`)}$ ${args.join(' ')}`);
    } else if (os === 'mac'){
      if (path === 'root') {
        this.print(`${nick}@MacBook ~ % ${args.join(' ')}`);
      } else {
        const folders = path.split('/'); // Split the path into an array of folders
        const lastFolder = folders[folders.length - 1];
        this.print(`${nick}@MacBook ~ ${lastFolder}$ ${args.join(' ')}`);
      }
    }
    
    const cmdList = [
      "clear",
      "whois",
      "ssh",
      "setnick",
      "cd",
      "mkdir",
      "exit",
      "dir",
      "rm",
      "rmid",
      "ul",
      "ulid",
      "dl",
      "dlid",
      "move",
      "say",
      "install",
      "recovery",
      "mine",
      "whois",
      "format",
      "grep",
      "rename",
      "touch"
    ];
    
    if (cmdList.includes(command)) {
      if (command === 'say') {
        this.print(`${params.join(' ')}`);
      } else if (command === 'clear') {
        this.setState({ output: [] });
      } else if (command === 'cd') {
        socket.emit('cd', { path: params[0] });
      } else if (command === 'dir') {
        socket.emit('dir');
      } else if (['ul', 'ulid', 'dl', 'dlid', 'rm', 'rmid'].includes(command)) {
        if (!params[0]) { this.print('Need a little more info bud'); }
        const type = command.slice(0, 2);
        const search = command.slice(2);
        if (type === 'rm') {
          socket.emit('rm', { fileInfo: params[0], search: search });
        } else {
          socket.emit('transfer', { fileInfo: params[0], type: type, search: search });
        }
      } else if (command === 'whois') {
        if (this.isValidIPAddress(params[0])) {
          socket.emit('whois', { ip: params[0] });
        } else {
          this.print(`Invalid IP Address: ${params[0]}`);
        }
      } else if (command === 'ssh') {
        if (this.isValidIPAddress(params[0])) {
          socket.emit('ssh', { targetIp: params[0] });
        } else {
          this.print(`Invalid target IP Address: ${params[0]}`);
        }
      } else if (command === 'exit') {
        socket.emit('exit');
      } else if (command === 'mkdir') {
        socket.emit('mkdir', { name: params[0] });
      } else if (command === 'move') {
        if (!params[0] || !params[1]) { this.print('Need a little more info bud'); return;}
        socket.emit('move', { filename: params[0], updatePath: params[1] });
      } else if (command === 'setnick') {
        if (params[0].length > 6 || params[0].length < 3) { 
          this.print(`Nickname needs to be over 3 characters and less than 6 characters: ${params[0]}<br><br>`)
        } else {
          socket.emit('setNick', { nick: params[0] });
        }
      } else if (command === 'touch') {
        socket.emit('touch', { name: params[0] });
      } else {
        this.print(`I have not implemented: ${command}`);
      }
    } else {
      this.print(`Unknown command: ${command}`);
    }
  };

  isValidIPAddress = (ipAddress) => {
    // Regular expression pattern for IPv4 and IPv6 addresses
    const ipPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9A-Fa-f]{1,4}::?)+$/;

    return ipPattern.test(ipAddress);
  }

  print = (text) => {
    this.setState((prevState) => ({
      output: [...prevState.output, { type: 'output', text }],
    }), () => {
      this.promptRef.current.scrollIntoView();
    });
  };

  handleRef = () => {
    const promptWidth = this.promptRef.current.offsetWidth;
    const rmWidth = promptWidth + 7;
    
    this.setState({
      rmWidth: rmWidth
    });
  };

  focusInput = () => {
    this.inputRef.current.focus({ preventScroll: true });
  };

  handleInputChange = (e) => {
    this.setState({ input: e.target.value });
  };

  render() {
    const { input, output, rmWidth, path } = this.state;

    return (
      <div ref={this.terminalRef} className='terminal'>
        <div className='output'>
          {output.map((item, index) => (
            <div key={index} className={item.type} dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(item.text)}} />
          ))}
        </div>
        <div ref={this.promptRef} className="prompt">{path}{'>'}</div>
        <input
          ref={this.inputRef}
          style={{ width: `calc(100% - ${rmWidth}px` }}
          className='input'
          type="text"
          value={input}
          onChange={this.handleInputChange}
          onKeyDown={this.handleEnter}
        />
      </div>
    );
  }
}

export default Terminal;