import React, { Component } from 'react'
import Login from './Login'
import Register from './Register'
import Game from './Game'

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
      return <Game/>
    } else if (!this.state.toggleRegister) {
      return <Login logToggle={this.handleLogToggle} regToggle={this.handleRegToggle}/>
    } else {
      return <Register toggle={this.handleRegToggle}/>
    }
  }
}

export default UserGreeting