import React, { Component } from 'react';
import styles from './css/auth.module.css';

class Login extends Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();

    this.state = {
      username: '',
      password: '',
    };
  }

  submitLogin = (event) => {
    const { username, password } = this.state;
    const { socket } = this.props;
  
    // Check if the socket exists before emitting the event
    if (socket) {
      // Emit the login event to the server
      socket.emit('login', { username, password });
    }
  
    event.preventDefault();
  };  

  componentDidMount() {
    this.inputRef.current.focus();
    // Add event listener for login success and error
    const { socket } = this.props;
    if (socket) {
      socket.on('loginSuccess', (data) => {
        this.props.logToggle(data);
      });
  
      socket.on('loginError', (data) => {
        console.error(data.error); // Handle login error
      });
    }
  }

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  render() {
    const { socket } = this.props;
    socket.emit('login', { username: 'doireallyexist', password: '123456' });
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