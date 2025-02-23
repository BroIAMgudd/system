import React, { Component } from 'react';
import '../css/logs.css'
import {
  localLogListUpdate,
  remoteLogListUpdate,
  localLogUpdate,
  remotelLogUpdate,
  deleteLogHandle,
  reqLocalListUpdate
} from './Handlers/logHandlers';
import { formatTimestamp } from './Handlers/commandHandlers';

class LogViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      localLogs: [],
      remoteLogs: []
    };
  }

  componentDidMount() {
    const setState = this.setState.bind(this);
    const { socket } = this.props;

    //Onload Request Local Logs list
    reqLocalListUpdate(socket);

    //Replace Local/Remote Logs with new list
    localLogListUpdate(socket, setState);
    remoteLogListUpdate(socket, setState);

    //Append Log
    localLogUpdate(socket, setState);
    remotelLogUpdate(socket, setState);

    //Remove Logs
    deleteLogHandle(socket, this.removeLog);
  }

  //Send delete log event
  handleDeleteLog = (id) => {
    const { socket } = this.props;
    socket.emit('deleteLog', id);
  };

  //Preform delete log event on server response
  removeLog = (id) => {
    const { localLogs, remoteLogs } = this.state;

    // Update state to remove the deleted log
    this.setState({
      localLogs: localLogs.filter(log => log.id !== id),
      remoteLogs: remoteLogs.filter(log => log.id !== id)
    });
  };

  render() {
    const { localLogs, remoteLogs } = this.state;

    return (
      <div className="log-list">
        <div className="log-item">
          <div className="log-title">Remote Logs</div>
          {remoteLogs.map((log) => (
            <div key={log.id}
            className='remote'>
              <i className="fa-solid fa-wifi fa-xs"></i>
              <i className="fa-solid fa-xmark delete" onClick={() => this.handleDeleteLog(log.id)}></i>
              <strong>&nbsp;{log.actionType}</strong>: {log.extraDetails || ''}<br/>
              <i className="fa-solid fa-arrow-right-to-bracket fa-xs"></i>
              &nbsp;{log.loggedIP}<br/>
              <i className="fa-solid fa-clock fa-xs"></i>
              &nbsp;{formatTimestamp(log.timestamp)}<br/>
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
              <i className="fa-solid fa-arrow-right-to-bracket fa-xs"></i>
              &nbsp;{log.loggedIP}<br/>
              <i className="fa-solid fa-clock fa-xs"></i>
              &nbsp;{formatTimestamp(log.timestamp)}<br/>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default LogViewer;