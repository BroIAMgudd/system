import React, { Component } from 'react';
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

  // Handle localLogListUpdate event
  handleLocalLogListUpdate = (logs) => {
    this.setState({ localLogs: logs });
  };

  // Handle remoteLogListUpdate event
  handleRemoteLogListUpdate = (logs) => {
    this.setState({ remoteLogs: logs });
  };

  // Handle LocalLogUpdate event
  handleLocalLogUpdate = (log) => {
    this.setState((prevState) => ({
      localLogs: [log, ...prevState.localLogs]
    }));
  };

  // Handle remotelLogUpdate event
  handleRemoteLogUpdate = (log) => {
    this.setState((prevState) => ({
      remoteLogs: [log, ...prevState.remoteLogs]
    }));
  };

  render() {
    const { localLogs, remoteLogs } = this.state;

    return (
      <div>
        <h2>Local Logs</h2>
        <ul>
          {localLogs.map((log, index) => (
            <li key={log.id}>
              <strong>Log {index + 1}</strong><br />
              Target IP: {log.targetIP}<br />
              Logged IP: {log.loggedIP}<br />
              Action Type: {log.actionType}<br />
              Extra Details: {log.extraDetails || 'N/A'}
            </li>
          ))}
        </ul>

        <h2>Remote Logs</h2>
        <ul>
          {remoteLogs.map((log, index) => (
            <li key={log.id}>
              <strong>Log {index + 1}</strong><br />
              Target IP: {log.targetIP}<br />
              Logged IP: {log.loggedIP}<br />
              Action Type: {log.actionType}<br />
              Extra Details: {log.extraDetails || 'N/A'}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default LogViewer;