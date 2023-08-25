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
    let wIndex = JSON.parse(localStorage.getItem("wIndex"));
    wIndex = wIndex.filter(item => !['Metasploit'].includes(item));
    localStorage.setItem("wIndex", JSON.stringify(wIndex));
    const setState = this.setState.bind(this);

    if (windows && wIndex) {
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
          if (window.render === false) {
            const wIndex = JSON.parse(localStorage.getItem("wIndex")) || [];
            const updatedWIndex = wIndex.filter(item => item !== name);
            updatedWIndex.push(name);
            localStorage.setItem("wIndex", JSON.stringify(updatedWIndex));
          } else if (window.render === true && window.temp === true) {
            let wIndex = JSON.parse(localStorage.getItem("wIndex")) || [];
            wIndex = wIndex.filter(item => item !== name);
            localStorage.setItem("wIndex", JSON.stringify(wIndex));
            return {
              ...window,
              temp: 'delete'
            };
          }

          return {
            ...window,
            render: !window.render
          };
        }
        return window;
      });

      localStorage.setItem("windows", JSON.stringify(updatedWindows.filter(window => (window.temp === false))));

      return { windows: updatedWindows.filter(window => (window.temp !== 'delete')) };
    });
  };

  update = () => {
    this.setState({
      toggle: !this.state.toggle
    });
  }

  mkWin = (name) => {
    this.setState(prevState => {
      const wIndex = JSON.parse(localStorage.getItem("wIndex")) || [];
      const found = wIndex.includes(name);
  
      if (found) {
        // Move the name to the last element of wIndex
        const updatedWIndex = wIndex.filter(item => item !== name);
        updatedWIndex.push(name);
        localStorage.setItem("wIndex", JSON.stringify(updatedWIndex));
      } else {
        // Add the name to wIndex and create a new window
        const windows = [...prevState.windows, {
          render: true,
          name: name,
          posX: 0,
          posY: 0,
          width: 300,
          height: 200,
          temp: true
        }];
        
        const updatedWIndex = [...wIndex, name];
        localStorage.setItem("wIndex", JSON.stringify(updatedWIndex));
        
        return { windows: windows };
      }
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
        {windows.map((window, i) => (
          window.render && <DragComp key={i} window={window} openClose={openClose} mkWin={mkWin} update={update} socket={socket}/>
        ))}
      </>
    )
  }
}

export default Game

