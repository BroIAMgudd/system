import React, { Component } from 'react'
import './css/window.css'
import WindowRenderer from './windowsJS/WindowRenderer.js'

class DragComp extends Component {
  constructor(props) {
    super(props)
    this.windowRef = React.createRef()
  
    this.state = {
      name: this.props.name,
      isDragging: false,
      startOffsetX: 0,
      startOffsetY: 0,
      positionX: 0,
      positionY: 0
    }
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseDown = (event) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    this.setState({
      isDragging: true,
      startOffsetX: offsetX,
      startOffsetY: offsetY
    });
  };

  handleMouseMove = (event) => {
    if (this.state.isDragging) {
      const newPositionX = event.clientX - this.state.startOffsetX;
      const newPositionY = event.clientY - this.state.startOffsetY;

      this.setState({
        positionX: newPositionX,
        positionY: newPositionY
      });
    }
  };

  handleMouseUp = () => {
    this.setState({
      isDragging: false
    });
  };

  render() {
    const { positionX, positionY, name } = this.state
    const { openClose, short } = this.props

    return (
      <div
        ref={this.windowRef}
        className="draggable-component"
        style={{ transform: `translate(${positionX}px, ${positionY}px)` }}
      >
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.1.1/css/all.css"></link>
        <div
          className="header"
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}
        >
          {name}
          <div className="buttons-container">
            {/* <i className="minimize-btn fa-solid fa-window-minimize fa-xl" onClick={() => this.props.minimize(this.props.short)}></i> */}
            {/* <i className="maximize-btn fa-solid fa-window-maximize fa-xl" onClick={() => this.props.maximize(this.props.short)}></i> */}
            <i className="close-btn fa-solid fa-xmark fa-xl" onClick={() => openClose(short)}></i>
          </div>
        </div>
        <div className="content">
          <WindowRenderer name={name}/>
        </div>
      </div>
    );
  }
}

export default DragComp;