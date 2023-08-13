import React, { Component } from 'react';

class GlobalChat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [],
      newMessage: '',
    };
  }

  componentDidMount() {
    const { socket } = this.props;
  
    socket.on('message', (data) => {
      this.setState((prevState) => ({
        messages: [...prevState.messages, data.message ],
      }));
    });
  }  

  handleInputChange = (event) => {
    this.setState({ newMessage: event.target.value });
  };

  sendMessage = () => {
    const { newMessage } = this.state;
    const { socket } = this.props;
    if (newMessage.trim() !== '') {
      socket.emit('message', newMessage);
      this.setState({ newMessage: '' });
    }
  };

  render() {
    const { messages, newMessage } = this.state;

    return (
      <div>
        <h1>Global Chat</h1>
        <div>
          {messages.map((message, index) => (
            <div key={index}>{message}</div>
          ))}
        </div>
        <input
          type="text"
          value={newMessage}
          onChange={this.handleInputChange}
          placeholder="Type your message..."
        />
        <button onClick={this.sendMessage}>Send</button>
      </div>
    );
  }
}

export default GlobalChat;