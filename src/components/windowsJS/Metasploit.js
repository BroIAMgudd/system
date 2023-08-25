import React, { Component } from 'react';
import DOMPurify from 'dompurify';
import '../css/terminal.css';
import { processCommand, printHandler } from './Handlers/MetasploitHandlers';

class Terminal extends Component {
  constructor(props) {
    super(props);
    this.promptRef = React.createRef();
    this.inputRef = React.createRef();
    this.terminalRef = React.createRef();

    this.state = {
      input: '',
      output: [],
      rmWidth: 0
    };
  }

  componentDidMount() {
    this.terminalRef.current.addEventListener('click', this.focusInput);
    this.handleRef();

    const { socket } = this.props;
    // const setState = this.setState.bind(this);

    printHandler(socket, this.print);
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
    const setState = this.setState.bind(this);
    processCommand(args, this.props.socket, this.print, setState);
  };

  print = (output) => {
    this.setState((prevState) => {
      let updatedOutput = [...prevState.output];
      updatedOutput.push({ text: output });
      return { output: updatedOutput };
    }, () => {
      this.promptRef.current.scrollIntoView();
    });
  };  

  handleRef = () => {
    const promptWidth = this.promptRef.current.offsetWidth;
    const rmWidth = promptWidth + 10;
    
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
    const { input, output, rmWidth } = this.state;

    return (
      <div ref={this.terminalRef} className='terminal'>
        <div className='output'>
          {output.map((item, index) => (
            <div key={index} className={item.type}>
              <div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(item.text)}} />
            </div>
          ))}
        </div>
        <div ref={this.promptRef} className="prompt">{'msf6>'}</div>
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