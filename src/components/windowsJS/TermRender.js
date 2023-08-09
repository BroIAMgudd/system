import React, { Component } from 'react';
// import '../css/terminal.css'

class Terminal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      input: '',
      output: [],
    };
  }

  componentDidMount() {
    // Add event listener for login success and error
    const { socket } = this.props;

    if (socket) {
      socket.on('print', (data) => {
        this.print(data.msg)
      });

      socket.on('whois', (data) => {
        console.log(data);
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
          // socket.emit('say', { message });
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

  handleChange = (e) => {
    this.setState({ input: e.target.value });
  };

  render() {
    const { input, output } = this.state;

    return (
      <div className='terminal'>
        <div>
          {output.map((item, index) => (
            <div key={index} className={item.type}>
              {item.text}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={input}
          onChange={this.handleChange}
          onKeyDown={this.handleEnter}
        />
      </div>
    );
  }
}

export default Terminal;