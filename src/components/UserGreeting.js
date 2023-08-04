import React, { Component } from 'react'
import Login from './Login'
import Register from './Register'

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

  render() {
    if (this.state.isLoggedIn) { 
      return <div></div>
    } else if (!this.state.toggleRegister) {
      return <Login toggle={this.handleRegToggle}/>
    } else {
      return <Register toggle={this.handleRegToggle}/>
    }
  }
}

export default UserGreeting