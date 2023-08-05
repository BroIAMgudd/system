import React, { Component } from 'react'
import styles from './css/auth.module.css'

class Register extends Component {
  constructor(props) {
    super(props)
    this.inputRef = React.createRef()
  
    this.state = {
      username: '',
      email: '',
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

  handleSubmit = (event) => {
    event.preventDefault();
    // Add your registration logic here
    // For example, you can handle form submission or API calls to register the user.
    console.log('Registration details:', this.state);
  };

  render() {
    const { username, email, password } = this.state
    return (
      <div className={styles.register}>
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.1.1/css/all.css"></link>
        <h1 className={styles.header}>Register</h1>
        <form className={styles.form} onSubmit={this.handleSubmit}>
          <label className={styles.label} htmlFor="username">
            <i className="fa-solid fa-user"></i>
          </label>
          <input
            ref={this.inputRef}
            className={styles.inputInfo}
            type="text"
            name="username"
            placeholder="Enter your username"
            value={username}
            onChange={this.handleInputChange}
            required
          />
          <label className={styles.label} htmlFor="email">
            <i class="fa-solid fa-envelope"></i>
          </label>
          <input
            className={styles.inputInfo}
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
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
          <input className={styles.submit} type="submit" value="Register" />
        </form>
        <button className={styles.submit} onClick={this.props.toggle}>Back to Login</button>
      </div>
    );
  }
}

export default Register;
