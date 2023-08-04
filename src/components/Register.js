import React, { Component } from 'react'

class Register extends Component {
  constructor(props) {
    super(props)
  
    this.state = {
      username: '',
      email: '',
      password: ''
    }
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
    console.log(this.props)
    return (
      <div className="register">
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.1.1/css/all.css"></link>
        <h1>Register</h1>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="username">
            <i className="fa-solid fa-user"></i>
          </label>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            value={this.state.username}
            onChange={this.handleInputChange}
            required
          />
          <label htmlFor="email">
            <i class="fa-solid fa-envelope"></i>
          </label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={this.state.email}
            onChange={this.handleInputChange}
            required
          />
          <label htmlFor="password">
            <i className="fa-solid fa-lock"></i>
          </label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={this.state.password}
            onChange={this.handleInputChange}
            required
          />
          <input type="submit" value="Register" />
        </form>
        <button onClick={this.props.toggle}>Back to Login</button>
      </div>
    );
  }
}

export default Register;
