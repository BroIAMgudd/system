import React, { Component } from 'react';
import DOMPurify from 'dompurify'
import '../css/terminal.css'
import {
  formatTimestamp,
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
    const setState = this.setState.bind(this);
    processCommand(this.state.path, args, this.props.socket, this.print, setState);
  };

  isValidIPAddress = isValidIPAddress

  print = (output) => {
  
    this.setState((prevState) => {
      let updatedOutput = [...prevState.output];
  
      if (typeof output === 'string') {
        // Check if the string represents an HTML table
        const isTable = output.trim().startsWith('<table>');
  
        if (isTable) {
          // Parse the table string and format timestamp cells
          const parser = new DOMParser();
          const tableDoc = parser.parseFromString(output, 'text/html');
          const tableElement = tableDoc.querySelector('table');
  
          const formattedTableRows = Array.from(tableElement.querySelectorAll('tr')).map((row, rowIndex) => {
            const formattedCells = Array.from(row.children).map((cell, index) => {
              if (index === row.children.length - 1 && cell.tagName.toLowerCase() === 'td') {
                const timestamp = new Date(cell.textContent).toString();
                return <td key={index}>{formatTimestamp(timestamp)}</td>;
              } else if (index === 1 && cell.textContent === 'Tor.exe') {
                return (
                  <td key={index} onClick={() => this.props.openClose('tor')}>
                    {cell.textContent}2
                  </td>
                );
              }
              return <td key={index} dangerouslySetInnerHTML={{ __html: cell.outerHTML }} />;
            });
  
            return <tr key={rowIndex}>{formattedCells}</tr>;
          });
  
          const formattedTable = (
            <table>
              <tbody>{formattedTableRows}</tbody>
            </table>
          );
          updatedOutput.push({ jsx: formattedTable });
        } else {
          updatedOutput.push({ text: output });
        }
      }
  
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
    const { input, output, rmWidth, path } = this.state;

    return (
      <div ref={this.terminalRef} className='terminal'>
        <div className='output'>
          {output.map((item, index) => (
            <div key={index} className={item.type}>
              {item.jsx ? (
                item.jsx
              ) : (
                <div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(item.text)}} />
              )}
            </div>
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