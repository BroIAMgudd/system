import React, { Component } from 'react';
import './css/window.css';
import WindowRenderer from './windowsJS/WindowRenderer.js';

class ResizableComp extends Component {
  constructor(props) {
    super(props);
    this.windowRef = React.createRef();
    const { name, posX, posY, width, height, temp } = this.props.window;

    this.state = {
      name: name,
      isDragging: false,
      isResizing: false,
      startOffsetX: 0,
      startOffsetY: 0,
      startX: 0,
      startY: 0,
      width: width,
      height: height,
      positionX: posX,
      positionY: posY,
      temp: temp,
      zIndex: 0
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

    let update = false;
    const wIndex = JSON.parse(localStorage.getItem("wIndex"));
    const maxZIndex = wIndex.length;

    if (wIndex.slice(-1)[0] !== this.state.name) {
      const windowName = wIndex.splice(wIndex.indexOf(this.state.name), 1);
      localStorage.setItem("wIndex", JSON.stringify([...wIndex, ...windowName]));
      update = true;
    }

    let isDragging = false, rect, offsetX, offsetY;
    const targetClass = event.target.className;
    if (targetClass === 'header' || targetClass === 'title') {
      rect = event.currentTarget.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      isDragging = true;
      update = true;
    }

    if (update) {
      this.setState({
        zIndex: maxZIndex, 
        isDragging: isDragging,
        startOffsetX: offsetX,
        startOffsetY: offsetY,
      }, () => {
        this.props.update();
      });
    }
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
    if (!this.state.temp) {
      const { name, positionX, positionY, width, height, temp } = this.state;
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
    }

    if (this.state.isDragging || this.state.isResizing) {
      this.setState({
        isDragging: false,
        isResizing: false
      });
    }
  };

  getZIndex = (name) => {
    const wIndex = JSON.parse(localStorage.getItem("wIndex"));
    if (!wIndex) return 0;
    const zIndex = wIndex.indexOf(name);
    return (zIndex >= 0) ? zIndex : 0;
  }

  render() {
    const { name, positionX, positionY, width, height } = this.state;
    const { openClose, mkWin, socket } = this.props;
    const zIndex = this.getZIndex(name);

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
        <div className="content" onClick={this.handleMouseDown}>
          <WindowRenderer name={name} openClose={openClose} mkWin={mkWin} socket={socket}/>
        </div>
      </div>
    );
  }
}

export default ResizableComp;
