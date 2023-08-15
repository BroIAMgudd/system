import React, { Component } from 'react';
import '../css/logs.css'
import {
  localLogListUpdate,
  remoteLogListUpdate,
  localLogUpdate,
  remotelLogUpdate
} from './logHandlers';

class LogViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      localLogs: [],   // Array to hold local logs
      remoteLogs: []   // Array to hold remote logs
    };
  }

  componentDidMount() {
    const setState = this.setState.bind(this);
    const { socket } = this.props;
    localLogListUpdate(socket, setState);
    remoteLogListUpdate(socket, setState);
    localLogUpdate(socket, setState);
    remotelLogUpdate(socket, setState);
    socket.on('receiveUser', () => {
      socket.emit('localLogListUpdate');
    });
  }

  handleDeleteLog = (id) => {
    const { socket } = this.props;
    socket.emit('deleteLog', id);
  };

  render() {
    const { localLogs, remoteLogs } = this.state;

    return (
      <div>
        <div className="log-list">
          <div className="log-item">
          <div className="log-title">Remote Logs</div>
            {remoteLogs.map((log, index) => (
              <div key={log.id}
              className='remote'>
                <i className="fa-solid fa-wifi fa-xs"></i>
                <i className="fa-solid fa-xmark delete" onClick={() => this.handleDeleteLog(log.id)}></i>
                <strong>&nbsp;{log.actionType}</strong>: {log.extraDetails || ''}<br/>
                <i class="fa-solid fa-arrow-right-to-bracket fa-xs"></i>
                &nbsp;{log.loggedIP}<br/>
                <i class="fa-solid fa-clock fa-xs"></i>
                &nbsp;{log.timestamp}<br/>
              </div>
            ))}
          </div>
          <div className="log-item">
            <div className="log-title">Local Logs</div>
            {localLogs.map((log) => (
              <div key={log.id}
              className='local'>
                <i className="fa-solid fa-wifi fa-xs"></i>
                <i className="fa-solid fa-xmark delete" onClick={() => this.handleDeleteLog(log.id)}></i>
                <strong>&nbsp;{log.actionType}</strong>: {log.extraDetails || ''}<br/>
                <i class="fa-solid fa-arrow-right-to-bracket fa-xs"></i>
                &nbsp;{log.loggedIP}<br/>
                <i class="fa-solid fa-clock fa-xs"></i>
                &nbsp;{log.timestamp}<br/>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default LogViewer;