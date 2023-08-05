import React, { Component } from 'react'
import styles from './css/auth.module.css'

export class Login extends Component {

  constructor(props) {
    super(props)
    this.inputRef = React.createRef()

    this.state = {
      username: '',
      password: ''
    }
  }

  componentDidMount() {
    this.inputRef.current.focus()
  }

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  submitLogin = (event) => {
    // const { username, password } = this.states
    this.props.logToggle()
    event.preventDefault()
  };

  render() {
    const { username, password } = this.state
    return (
      <div className={styles.login}>
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.1.1/css/all.css"></link>
        <h1 className={styles.header}>Login</h1>
        <form className={styles.form} onSubmit={this.submitLogin}>
          <label className={styles.label} htmlFor="username">
            <i className="fa-solid fa-user"></i>
          </label>
          <input 
            ref={this.inputRef}
            className={styles.inputInfo}
            type='text'
            name='username'
            placeholder="Enter your username"
            value={username} 
            onChange={this.handleInputChange} 
            required 
          />
          <label className={styles.label} htmlFor="password">
            <i className="fa-solid fa-lock"></i>
          </label>
          <input
            className={styles.inputInfo}
            type="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={this.handleInputChange}
            required
          />
          <input className={styles.submit} type="submit" value="Login" />
        </form>
        <button className={styles.submit} onClick={this.props.regToggle}>Create an Account</button>
        {/* TODO: Create a lost passoword button */}
      </div>
    );
  }
}

export default Login;