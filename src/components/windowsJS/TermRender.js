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
      inputWidth: 0
    };
  }

  componentDidUpdate() {
    // Scroll the terminal to the bottom
    this.scrollToBottom();
  }

  componentDidMount() {
    this.terminalRef.current.addEventListener('click', this.focusInput);
    this.handleRef();
    // Add event listener for login success and error
    const { socket } = this.props;

    if (socket) {
      socket.on('receiveUser', (data) => {
        this.setState({
          username: data.user.username
        });
      });
      
      socket.on('print', (data) => {
        this.print(data.msg)
      });

      socket.on('whois', (data) => {
        const { username, cpu, network, harddrive } = data;
      
        const text = (
          `Username: ${username}<br>
          Cpu: ${cpu}<br>
          Network: ${network}<br>
          HardDrive: ${harddrive}<br>
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
    
    const cmdList = [
      "whois",
      "connect",
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
          this.print(params.join(' '));
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
    }));
  };

  handleRef = () => {
    const promptWidth = this.promptRef.current.offsetWidth;
    const setWidth = promptWidth + 5
    
    this.setState({
      inputWidth: setWidth
    });
  };

  focusInput = () => {
    this.inputRef.current.focus({ preventScroll: true });
  };

  scrollToBottom() {
    if (this.terminalRef.current) {
      this.terminalRef.current.scrollTop = this.terminalRef.current.scrollHeight;
    }
  }

  handleInputChange = (e) => {
    this.setState({ input: e.target.value });
  };

  render() {
    const { input, output, inputWidth, username } = this.state;

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
          style={{ width: `calc(100% - ${inputWidth}px)` }}
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
{/* <div className="terminal-container">
        <div className="terminal-prompt">C:\Users\{username}{'>'}</div>
        <div className="terminal-content">
          <pre className="terminal-output">{output}</pre>
          <form onSubmit={this.handleInputSubmit}>
            <div className="terminal-prompt">{'>'}</div>
            <input
              className="terminal-input"
              type="text"
              value={input}
              onChange={this.handleInputChange}
              autoFocus
            />
          </form>
        </div>
      </div> */}