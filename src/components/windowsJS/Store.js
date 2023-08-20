import React, { Component } from 'react';
import '../css/store.css'
import LacklusterLapBook from './images/LacklusterLapBook.png';

class Store extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    // const setState = this.setState.bind(this);
    // const { socket } = this.props;
    
    // socket.on('loadSite', site => setState({ loadedSite: site }));
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

  buyItem = () => {
    const { socket } = this.props;

    socket.emit('buyItem', 'LLLB');
  }
  
  render() {
    // const {  } = this.state;

    return (
      <div className='store-area'>
        <h2>"The Lack Luster Lap Book"</h2>
        <div className='display'>
          <img className='lap-book' src={LacklusterLapBook} alt="Lack luster lap Book"/>
          <div style={{width: '100px'}}>
            Only $6969.69
            <button className='store-buy' onClick={this.buyItem}>Buy Now!</button>
          </div>
        </div>
        <div className='store-info'>
          <p>This state-of-the-art disasterpiece flaunts a design philosophy that appears to have been inspired by a parallel universe where usability and efficiency were mere afterthoughts.</p>
          <h2>Display</h2>
          <p>A fusion of washed-out colors and erratic flickering encased in a repurposed plastic bottle. The minuscule 0.6x0.9-definition screen presents pixels generously scattered across its TFT canvas in a manner reminiscent of a Jackson Pollock masterpiece, providing ample opportunities to question your ocular faculties.</p>
          <h2>Networking</h2>
          <p>Networking capabilities? The LacklusterLap Book thrives in solitude, as  Wi-Fi signals are mere whispers that elude its grasp, and Bluetooth connections are akin to your attempts at telepathy with a mirror.</p>
          <h2>Layout</h2>
          <p>It's asymmetrical keyboard layout and touchpad seems to interpret gestures as cryptic dance moves, every interaction with this technological oddity is an exercise of patience.</p>
          <h2>Summary</h2>
          <p>In a world where seamless performance and intuitive design have become the norm, the LacklusterLap Book stands tall as a defiant anomaly. Is it a practical tool or an abstract work of art?</p>
        </div>
      </div>
    );
  }
}

export default Store;