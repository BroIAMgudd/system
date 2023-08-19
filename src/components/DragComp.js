import React, { Component } from 'react';
import './css/window.css';
import WindowRenderer from './windowsJS/WindowRenderer.js';

class ResizableComp extends Component {
  constructor(props) {
    super(props);
    this.windowRef = React.createRef();

    this.state = {
      name: '',
      isDragging: false,
      isResizing: false,
      startOffsetX: 0,
      startOffsetY: 0,
      startX: 0,
      startY: 0,
      width: 200,
      height: 300,
      positionX: 0,
      positionY: 0,
      zIndex: 0
    };
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);

    const { name, posX, posY, width, height, zIndex } = this.props.window;
    const setState = this.setState.bind(this);
    
    setState({
      name: name,
      posX: posX,
      posY: posY,
      width: width,
      height: height,
      zIndex: zIndex
    })
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
  
    // Retrieve windows from local storage
    const windows = JSON.parse(localStorage.getItem("windows"));
  
    // Get the current window's name from state
    const currentWindowName = this.state.name;
  
    // Find the current window in the array
    const currentWindow = windows.find((window) => window.name === currentWindowName);

    const maxZIndex = Math.max(...windows.map((window) => window.zIndex || 0));
  
    // Lower the zIndex for other windows greater than the current window's zIndex
    windows.forEach((window) => {
      if (window.name !== currentWindowName && window.zIndex > currentWindow.zIndex) {
        window.zIndex--;
      }
    });

    currentWindow.zIndex = maxZIndex;

    // Update the windows array in local storage
    localStorage.setItem("windows", JSON.stringify(windows));

    // Update the state to initiate dragging
    this.setState({
      zIndex: maxZIndex, 
      isDragging: true,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
    }, () => {
      this.props.update();
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
    const { name, positionX, positionY, width, height } = this.state;
    const windows = JSON.parse(localStorage.getItem("windows"));

    const updatedWindows = windows.map(window => {
      if (window.name === name) {
        return {
          ...window,
          posX: positionX,
          posY: positionY,
          width: width,
          height: height
        };
      }
      return window;
    });

    localStorage.setItem("windows", JSON.stringify(updatedWindows));

    this.setState({
      isDragging: false,
      isResizing: false
    });
  };

  render() {
    const { name, positionX, positionY, width, height } = this.state;
    const { openClose, socket } = this.props;
    const zIndex = this.props.getZIndex(name);

    return (
      <div
        ref={this.windowRef}
        className="window"
        style={{
          transform: `translate(${positionX}px, ${positionY}px)`,
          width: `${width}px`,
          height: `${height}px`,
          zIndex: zIndex
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
            <i className="close fa-solid fa-xmark fa-lg" onClick={() => openClose(name)}></i>
          </div>
        </div>
        <div className="content">
          <WindowRenderer name={name} openClose={this.props.openClose} socket={socket}/>
        </div>
      </div>
    );
  }
}

export default ResizableComp;
