import React, { Component } from 'react';
import DOMPurify from 'dompurify'
import '../css/terminal.css'
import { 
  isValidIPAddress, 
  processCommand,
  setNickHandler,
  setPathHandler,
  printHandler,
  whoisHandler
} from './commandHandlers';

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

    const { socket } = this.props;
    const setState = this.setState.bind(this);

    if (socket) {
      setNickHandler(socket, setState, this.handleRef);
      setPathHandler(socket, setState, this.handleRef);
      printHandler(socket, this.print);
      whoisHandler(socket, this.print);
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

  processCommand = (args) => {
    processCommand(this.state.path, args, this.props.socket, this.print, this.setState);
  };

  isValidIPAddress = isValidIPAddress

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