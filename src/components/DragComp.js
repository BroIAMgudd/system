import React, { Component } from 'react';
import './css/window.css';
import WindowRenderer from './windowsJS/WindowRenderer.js';

class ResizableComp extends Component {
  constructor(props) {
    super(props);
    this.windowRef = React.createRef();

    this.state = {
      name: this.props.name,
      isDragging: false,
      isResizing: false,
      startOffsetX: 0,
      startOffsetY: 0,
      startX: 0,
      startY: 0,
      width: 300,
      height: 200,
      positionX: 0,
      positionY: 0,
    };
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
      startOffsetY: offsetY,
    });
  };

  handleResizeMouseDown = (event, direction) => {
    event.preventDefault();
    this.setState({
      isResizing: direction,
      startX: event.clientX,
      startY: event.clientY,
    });
  };

  handleMouseMove = (event) => {
    if (this.state.isDragging) {
      const newPositionX = event.clientX - this.state.startOffsetX;
      const newPositionY = event.clientY - this.state.startOffsetY;

      this.setState({
        positionX: newPositionX,
        positionY: newPositionY,
      });
    }

    if (this.state.isResizing) {
      const { startX, startY, width, height, isResizing } = this.state;
      const offsetX = event.clientX - startX;
      const offsetY = event.clientY - startY;

      const minWidth = 200; // Minimum width
      const minHeight = 100; // Minimum height

      if (isResizing === 'se') {
        const newWidth = Math.max(width + offsetX, minWidth);
        const newHeight = Math.max(height + offsetY, minHeight);

        this.setState({
          width: newWidth,
          height: newHeight,
        });
      } else if (isResizing === 'ne') {
        const newWidth = Math.max(width + offsetX, minWidth);
        let newHeight = Math.max(height - offsetY, minHeight);
        let newPositionY = this.state.positionY + offsetY
        if (newHeight <= minHeight) { newPositionY = this.state.positionY; newHeight = height; }

        this.setState({
          width: newWidth,
          height: newHeight,
          positionY: newPositionY,
        });
      } else if (isResizing === 'sw') {
        let newWidth = Math.max(width - offsetX, minWidth);
        const newHeight = Math.max(height + offsetY, minHeight);
        let newPositionX = this.state.positionX + offsetX
        if (newWidth <= minWidth) { newPositionX = this.state.positionX; newWidth = width; }

        this.setState({
          width: newWidth,
          height: newHeight,
          positionX: newPositionX,
        });
      } else if (isResizing === 'nw') {
        let newWidth = Math.max(width - offsetX, minWidth);
        let newHeight = Math.max(height - offsetY, minHeight);
        let newPositionX = this.state.positionX + offsetX
        let newPositionY = this.state.positionY + offsetY
        if (newHeight <= minHeight) { newPositionY = this.state.positionY; newHeight = height; }
        if (newWidth <= minWidth) { newPositionX = this.state.positionX; newWidth = width; }

        this.setState({
          width: newWidth,
          height: newHeight,
          positionX: newPositionX,
          positionY: newPositionY,
        });
      }

      // Update the resize handler position
      this.setState({
        startX: event.clientX,
        startY: event.clientY,
      });
    }
  };

  handleMouseUp = () => {
    this.setState({
      isDragging: false,
      isResizing: false,
    });
  };

  render() {
    const { positionX, positionY, width, height, name } = this.state;
    const { openClose, short, socket } = this.props;

    return (
      <div
        ref={this.windowRef}
        className="window"
        style={{
          transform: `translate(${positionX}px, ${positionY}px)`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.4.2/css/all.css"></link>
        <div
          className="resize"
          onMouseDown={(e) => this.handleResizeMouseDown(e, 'nw')}
        />
        <div
          className="resize"
          style={{ right: 0 }}
          onMouseDown={(e) => this.handleResizeMouseDown(e, 'ne')}
        />
        <div
          className="resize"
          style={{ bottom: 0 }}
          onMouseDown={(e) => this.handleResizeMouseDown(e, 'sw')}
        />
        <div
          className="resize"
          style={{ bottom: 0, right: 0 }}
          onMouseDown={(e) => this.handleResizeMouseDown(e, 'se')}
        />
        <div
          className="header"
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}
        >
          <div className='title'>{ name }</div>
          <div className="buttons-container">
            <i className="minimize fa-solid fa-window-minimize" onClick={() => this.props.minimize(this.props.short)}></i>
            <i className="maximize fa-solid fa-window-restore fa-lg" onClick={() => this.props.maximize(this.props.short)}></i>
            <i className="close fa-solid fa-xmark fa-lg" onClick={() => openClose(short)}></i>
          </div>
        </div>
        <div className="content">
          <WindowRenderer name={name} socket={socket}/>
        </div>
      </div>
    );
  }
}

export default ResizableComp;
