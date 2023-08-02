import React, { Component } from 'react'

export class Form extends Component {

  constructor(props) {
    super(props)
  
    this.state = {
      username: '',
      comments: '',
      topic: 'cum'
    }
  }

  handleUsernameChange = (event) => {
    this.setState({
      username: event.target.value
    })
  }

  handleCommentsChange = (event) => {
    this.setState({
      comments: event.target.value
    })
  }

  handleTopicsChange = (event) => {
    this.setState({
      topic: event.target.value
    })
  }

  handleSubmit = (event) => {
    alert(`${this.state.username}, ${this.state.comments}, ${this.state.topic}`)
    event.preventDefault()
  }

  render() {
    const {username, comments, topic} = this.state
    return (
      <form onSubmit={this.handleSubmit}>
        <div>
          <label>Username</label>
          <input type='text' value={username} onChange={this.handleUsernameChange} />
        </div>
        <div>
          <label>Comments</label>
          <textarea value={comments} onChange={this.handleCommentsChange} />
        </div>
        <div>
          <label>Topic</label>
          <select value={topic} onChange={this.handleTopicsChange}>
            <option value="cum">Cum</option>
            <option value="femboys">Femboys</option>
            <option value="balls">Balls</option>
          </select>
        </div>
        <button type='submit'>Submit</button>
      </form>
    )
  }
}

export default Form