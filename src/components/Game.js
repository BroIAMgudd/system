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
      idk: false
    }
  }

  componentDidMount() {
    const windows = JSON.parse(localStorage.getItem("windows"));
    const setState = this.setState.bind(this);

    if (windows) {
      setState({
        windows: windows
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
            zIndex: 4
          },
          {
            render: true,
            name: 'Network Dashboard',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            zIndex: 3
          },
          {
            render: true,
            name: 'Log Manager',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            zIndex: 2
          },
          {
            render: true,
            name: 'Finances',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            zIndex: 1
          },
          {
            render: true,
            name: 'Tor',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            zIndex: 0
          }
        ]
      }, () => {
        localStorage.setItem("windows", JSON.stringify(this.state.windows));
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
      localStorage.setItem("windows", JSON.stringify(updatedWindows));
  
      return { windows: updatedWindows }; // Update the state with the new windows array
    });
  };

  getZIndex = (name) => {
    const windows = JSON.parse(localStorage.getItem("windows"));
    const window = windows.find(window => window.name === name);
    if (!window) return 0;
    return window.zIndex;
  }

  update = () => {
    this.setState({
      idk: !this.state.idk
    });
  }

  render() {
    const windows = this.state.windows;
    const elementsToFind = ['Terminal', 'Network Dashboard', 'Log Manager', 'Finances', 'Tor'];
    const foundWindows = elementsToFind.map(element => windows.find(window => window.name === element));
    const [term, net, log, monz, tor] = foundWindows;
    const { socket } = this.props;
    const getZIndex = this.getZIndex;
    const openClose = this.openClose;
    const update = this.update;

    if (!term) {
      return null;
    }

    return (
      <>
        {term.render && <DragComp window={term} openClose={openClose} getZIndex={getZIndex} update={update} socket={socket}/>}
        {net.render && <DragComp window={net} openClose={openClose} getZIndex={getZIndex} update={update} socket={socket}/>}
        {log.render && <DragComp window={log} openClose={openClose} getZIndex={getZIndex} update={update} socket={socket}/>}
        {monz.render && <DragComp window={monz} openClose={openClose} getZIndex={getZIndex} update={update} socket={socket}/>}
        {tor.render && <DragComp window={tor} openClose={openClose} getZIndex={getZIndex} update={update} socket={socket}/>}
      </>
    )
  }
}

export default Game

