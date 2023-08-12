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
      toggleRegister: false,
      id: 69,
      username: 'Anonymous'
    }
  }

  handleRegToggle = () => {
    this.setState({
      toggleRegister: !this.state.toggleRegister
    })
  }

  handleLogToggle = (data) => {
    const { message, id, username } = data;
    
    this.setState({
      isLoggedIn: !this.state.isLoggedIn,
      id: id,
      username: username
    })
  }

  render() {
    if (this.state.isLoggedIn) { 
      return <Game socket={socket} id={this.state.id} username={this.state.username}/>
    } else if (!this.state.toggleRegister) {
      return <Login socket={socket} logToggle={this.handleLogToggle} regToggle={this.handleRegToggle}/>
    } else {
      return <Register socket={socket} regToggle={this.handleRegToggle}/>
    }
  }
}

export default UserGreeting