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
      winRender: {
        term: true,
        task: true,
        log: true
      }
    }
  }

  componentDidMount() {
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
        }, () => {
          console.log(this.state);
        });
      });
    }
  }

  openClose = (name) => {
    this.setState(prevState => {
      let winRender = Object.assign({}, prevState.winRender);  // creating copy of state variable jasper
      winRender[name] = !winRender[name];                     // update the name property, assign a new value                 
      return { winRender };  
    })
  }

  render() {
    return (
      <>
        {this.state.winRender.term ? <DragComp name='Terminal' short='term' openClose={this.openClose} socket={this.props.socket}/> : null}
        {this.state.winRender.task ? <DragComp name='Task Manager' short='task' openClose={this.openClose}/> : null}
        {this.state.winRender.log ? <DragComp name='Log Manager' short='log' openClose={this.openClose}/> : null}
      </>
    )
  }
}

export default Game

