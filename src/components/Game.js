import React, { Component } from 'react'
import DragComp from './DragComp'

class Game extends Component {
  constructor(props) {
    super(props)
    this.state = {
      id: 69,
      username: 'Anonymous',
      ip: '127.0.0.1',
      cpu: 5.00,
      network: 5.00,
      harddrive: 5.00,
      usb: 5.00,
      windows: [],
      wIndex: [],
      toggle: false
    }
  }

  componentDidMount() {
    const windows = JSON.parse(localStorage.getItem("windows"));
    const wIndex = JSON.parse(localStorage.getItem("wIndex"));
    const setState = this.setState.bind(this);

    if (windows) {
      setState({
        windows: windows,
        wIndex: wIndex
      });
    } else {
      setState({
        windows: [
          {
            render: true,
            name: 'Terminal',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          },
          {
            render: true,
            name: 'Network Dashboard',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          },
          {
            render: true,
            name: 'Log Manager',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          },
          {
            render: true,
            name: 'Finances',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          },
          {
            render: true,
            name: 'Tor',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          },
          {
            render: true,
            name: 'IPList',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          }
        ],
        wIndex: ['IPList', 'Tor', 'Finances', 'Log Manager', 'Network Dashboard', 'Terminal' ]
      }, () => {
        localStorage.setItem("windows", JSON.stringify(this.state.windows));
        localStorage.setItem("wIndex", JSON.stringify(this.state.wIndex));
      });
    }

    // Add event listener for login success and error
    const { socket, id, username } = this.props;

    if (socket) {
      socket.emit('getUser');
      socket.on('receiveUser', (data) => {
        const { ip, cpu, network, harddrive, usb } = data.system;

        this.setState({
          id: id,
          username: username,
          ip: ip,
          cpu: cpu,
          network: network,
          harddrive: harddrive,
          usb: usb
        });
      });
    }

    setInterval(() => {
      socket.emit('heartbeat');
    }, 60000); // Send a heartbeat every 30 seconds  
  }

  openClose = (name) => {
    this.setState(prevState => {
      const updatedWindows = prevState.windows.map(window => {
        if (window.name === name) {
          return {
            ...window,
            render: !window.render // Set the render property to false for the matched window
          };
        }
        return window;
      });
  
      // Update local storage with the updated windows array
      localStorage.setItem("windows", JSON.stringify(updatedWindows.filter(window => window.temp === false)));
  
      return { windows: updatedWindows }; // Update the state with the new windows array
    });
  };

  update = () => {
    this.setState({
      toggle: !this.state.toggle
    });
  }

  mkWin = (name, ) => {
    this.setState(prevState => {
      const windows = [...prevState.windows, {
        render: true,
        name: name,
        posX: 0,
        posY: 0,
        width: 300,
        height: 200,
        temp: true
      }];

      const wIndex = JSON.parse(localStorage.getItem("wIndex"));
      localStorage.setItem("wIndex", JSON.stringify([...wIndex, name]));

      return { windows: windows }; // Update the state with the new windows array
    }, () => {
      this.update();
    });
  }

  render() {
    const windows = this.state.windows;
    const { socket } = this.props;
    const { openClose, update, mkWin } = this;

    if (!windows) { return null; }

    return (
      <>
        {windows.map((window) => (
          window.render && <DragComp window={window} openClose={openClose} mkWin={mkWin} update={update} socket={socket}/>
        ))}
      </>
    )
  }
}

export default Game

