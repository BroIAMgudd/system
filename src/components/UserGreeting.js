import React, { Component } from 'react'
import Login from './Login'
import Register from './Register'
import Game from './Game'
import io from "socket.io-client";

const socket = io.connect("http://localhost:5000");

class UserGreeting extends Component {

  constructor(props) {
    super(props)

    this.state = {
      isLoggedIn: false,
      toggleRegister: false
    }
  }

  handleRegToggle = () => {
    this.setState({
      toggleRegister: !this.state.toggleRegister
    })
  }

  handleLogToggle = () => {
    this.setState({
      isLoggedIn: !this.state.isLoggedIn
    })
  }

  render() {
    if (this.state.isLoggedIn) { 
      return <Game socket={socket}/>
    } else if (!this.state.toggleRegister) {
      return <Login socket={socket} logToggle={this.handleLogToggle} regToggle={this.handleRegToggle}/>
    } else {
      return <Register socket={socket} regToggle={this.handleRegToggle}/>
    }
  }
}

export default UserGreeting