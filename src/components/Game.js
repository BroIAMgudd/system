import React, { Component } from 'react'
import DragComp from './DragComp'
import Notification from './Notification';
import './css/Notification.css';

class Game extends Component {
  constructor(props) {
    super(props)
    this.state = {
      id: 69,
      username: 'Anonymous',
      ip: '127.0.0.1',
      cpu: 5.00,
      network: 5.00,
      harddrive: 5.00,
      usb: 5.00,
      windows: [],
      wIndex: [],
      notify: [{title: 'test', color:'red', text:'testtestetasdsdas'}],
      toggle: false,
    }
  }

  componentDidMount() {
    const windows = JSON.parse(localStorage.getItem("windows"));
    let wIndex = JSON.parse(localStorage.getItem("wIndex"));
    // wIndex = wIndex.filter(item => !['Metasploit'].includes(item));
    localStorage.setItem("wIndex", JSON.stringify(wIndex));
    const setState = this.setState.bind(this);

    if (windows && wIndex) {
      setState({
        windows: windows,
        wIndex: wIndex
      });
    } else {
      setState({
        windows: [
          {
            render: true,
            name: 'Terminal',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          },
          {
            render: true,
            name: 'Network Dashboard',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          },
          {
            render: true,
            name: 'Log Manager',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          },
          {
            render: true,
            name: 'Finances',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          },
          {
            render: true,
            name: 'Tor',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          },
          {
            render: true,
            name: 'IPList',
            posX: 0,
            posY: 0,
            width: 300,
            height: 200,
            temp: false
          }
        ],
        wIndex: ['IPList', 'Tor', 'Finances', 'Log Manager', 'Network Dashboard', 'Terminal' ]
      }, () => {
        localStorage.setItem("windows", JSON.stringify(this.state.windows));
        localStorage.setItem("wIndex", JSON.stringify(this.state.wIndex));
      });
    }

    // Add event listener for login success and error
    const { socket, id, username } = this.props;

    if (socket) {
      socket.emit('getUser');
      socket.on('receiveUser', (data) => {
        const { ip, cpu, network, harddrive, usb } = data.system;

        this.setState({
          id: id,
          username: username,
          ip: ip,
          cpu: cpu,
          network: network,
          harddrive: harddrive,
          usb: usb
        });
      });
    }

    setInterval(() => {
      socket.emit('heartbeat');
    }, 60000);
  }

  openClose = (name) => {
    this.setState(prevState => {
      const windows = JSON.parse(localStorage.getItem("windows"));
      const updatedWindows = prevState.windows.map(window => {
        if (window.name === name) {
          const localW = windows.find(window => window.name === name);
          return {
            ...window,
            render: !window.render,
            posX: localW.posX,
            posY: localW.posY,
            width: localW.width,
            height: localW.height
          };
        }

        return window;
      });

      const nonTempW = updatedWindows.filter(window => window.temp !== true);
      localStorage.setItem("windows", JSON.stringify(nonTempW));

      return { windows: updatedWindows }
    });
  };

  update = () => {
    this.setState({
      toggle: !this.state.toggle
    });
  }

  mkWin = (name, temp = false) => {
    this.setState(prevState => {
      const wIndex = JSON.parse(localStorage.getItem("wIndex")) || [];
      const found = wIndex.includes(name);

      if (found) {
        // Move the name to the last element of wIndex
        const updatedWIndex = wIndex.filter(item => item !== name);
        updatedWIndex.push(name);
        localStorage.setItem("wIndex", JSON.stringify(updatedWIndex));
  
        const windows = prevState.windows.map(window => {
          if (window.name === name) {
            return {
              ...window,
              render: true
            };
          }
          return window;
        });
        const nonTempW = windows.filter(window => (window.temp !== true));
        localStorage.setItem("windows", JSON.stringify(nonTempW));

        return { windows: windows };
      } else {
        // Add the name to wIndex and create a new window
        const windows = [...prevState.windows, {
          render: true,
          name: name,
          posX: 0,
          posY: 0,
          width: 300,
          height: 200,
          temp: temp
        }];

        const updatedWIndex = [...wIndex, name];
        localStorage.setItem("wIndex", JSON.stringify(updatedWIndex));
  
        if (!temp) {
          localStorage.setItem("windows", JSON.stringify(windows));
        }
  
        return { windows: windows };
      }
    }, () => {
      this.update();
    });
  }

  removeNotify = (index) => this.setState(
    { notify: this.state.notify.filter((_, i) => i !== index) }
  );

  render() {
    const { openClose, update, mkWin } = this;
    const { windows, notify } = this.state;
    const { socket } = this.props;

    if (!windows) { return null; }

    return (
      <>
        {windows.map((window, i) => (
          window.render && <DragComp key={i} window={window} openClose={openClose} mkWin={mkWin} update={update} socket={socket}/>
        ))}

        Display Notifications
        <div className="notify-container">
          {notify.map((notif, index) => (
            <Notification
              key={index}
              title={notif.title}
              text={notif.text}
              color={notif.color}
              onClose={() => this.removeNotify(index)}
            />
          ))}
        </div>
      </>
    )
  }
}

export default Game

