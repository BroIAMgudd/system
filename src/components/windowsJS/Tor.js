import React, { Component } from 'react';
import '../css/tor.css'
import Store from './Store';

class Tor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      input: '',
      loadedSite: ''
    };
  }

  componentDidMount() {
    const setState = this.setState.bind(this);
    const { socket } = this.props;
    
    socket.on('loadSite', site => setState({ loadedSite: site }));
  }

  handleInputChange = (e) => {
    this.setState({ input: e.target.value });
  };

  handleEnter = (e) => {
    const { socket } = this.props;

    if (e.keyCode === 13) {
      e.preventDefault();
      const input = this.state.input.trim();
      this.setState({ input: '' });

      socket.emit('search', input);
    }
  };
  
  render() {
    const { input, loadedSite } = this.state;

    return (
      <>
        <div className='search-area'>
          <i className="fa-solid fa-arrow-left"></i>
          <i className="fa-solid fa-arrow-right search-arrow"></i>
          <input
            className='input'
            type='text'
            value={input}
            onChange={this.handleInputChange}
            onKeyDown={this.handleEnter}
          />
          <i className="fa-regular fa-heart search-heart"></i>
          <i className="fa-regular fa-user search-user"></i>
        </div>
        {(loadedSite === 'store') && (
          <Store socket={this.props.socket}/>
        )}
      </>
    );
  }
}

export default Tor;