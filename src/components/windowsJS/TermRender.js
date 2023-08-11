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
      username: 'Anonymous',
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
          username: data.nick
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
          Time played: ${uptime} sec<br>
          <br>`
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
    const { socket } = this.props;
    const [command, ...params] = args;
    this.print(`C:\\Users\\${this.state.username}> ${args.join(' ')}`);
    
    const cmdList = [
      "clear",
      "whois",
      "connect",
      "setnick",
      "bye",
      "ls",
      "rm",
      "ul",
      "dl",
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
      switch (command) {
        case 'say':
          this.print(`${params.join(' ')} <br><br>`);
          break;
        case 'clear':
          this.setState({ output: [] });
          break;
        case 'whois':
          if (this.isValidIPAddress(params[0])) {
            socket.emit('whois', { ip: params[0] });
          } else {
            this.print(`Invalid IP Address: ${params[0]}`);
          }
          break;
        case 'setnick':
          if (params[0].length > 6 || params[0].length < 3) { 
            this.print(`Nickname needs to be over 3 characters and less than 6 characters: ${params[0]}<br><br>`)
          } else {
            socket.emit('setNick', { nick: params[0] });
          }
          break;
        case 'connect':
          socket.emit('connect', { ip: params[0] });
          break;
        case 'touch':
          socket.emit('touch', { name: params[0] });
          break;
        default:
          this.print(`I have not implemented: ${command}`);
      }
    } else {
      this.print(`Unknown command: ${command}<br><br>`);
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

  scrollToBottom() {
    if (this.terminalRef.current) {
      this.terminalRef.current.scrollTop = this.terminalRef.current.scrollHeight;
      console.log('testbptpt,')
    }
  }

  handleInputChange = (e) => {
    this.setState({ input: e.target.value });
  };

  render() {
    const { input, output, rmWidth, username } = this.state;

    return (
      <div ref={this.terminalRef} className='terminal'>
        <div className='output'>
          {output.map((item, index) => (
            <div key={index} className={item.type} dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(item.text)}} />
          ))}
        </div>
        <div ref={this.promptRef} className="prompt">C:\Users\{username}{'>'}</div>
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