import React, { Component } from 'react'
import './login.css'

export class Login extends Component {

  constructor(props) {
    super(props)

    this.state = {
      username: '',
      password: '',
      showRegister: false
    }
  }

  toggleRegister = () => {
    this.setState((prevState) => ({ showRegister: !prevState.showRegister }));
  };

  handleUsernameChange = (event) => {
    this.setState({
      username: event.target.value
    })
  }

  handlePasswordChange = (event) => {
    this.setState({
      password: event.target.value
    })
  }

  submitLogin = (event) => {
    alert(`${this.state.username}, ${this.state.password}`)
    event.preventDefault()
  };

  render() {
    const { username, password } = this.state
    console.log(this.props.toggle)
    return (
      <div className="login">
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.1.1/css/all.css"></link>
        <h1>Login</h1>
        <form onSubmit={this.submitLogin}>
          <label htmlFor="username">
            <i className="fa-solid fa-user"></i>
          </label>
          <input type='text' placeholder="Username" value={username} onChange={this.handleUsernameChange} required />
          <label htmlFor="password">
            <i className="fa-solid fa-lock"></i>
          </label>
          <input type="password" placeholder="Password" value={password} onChange={this.handlePasswordChange} required />
          <input type="submit" value="Login" />
        </form>
        <button onClick={this.props.toggle}>Create an Account</button>
        {/* TODO: Create a lost passoword button */}
      </div>
    );
  }
}

export default Login;