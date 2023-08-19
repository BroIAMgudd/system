import React, { Component } from 'react';
import '../css/NetworkComponent.css';
import { 
  deleteTaskHandle,
  addTaskHandle,
  setTasksHandle
} from './Handlers/netHandlers';

class NetworkDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      originIp: '192.168.1.1',
      destinationIp: '127.0.0.1',
      online: 0,
      selectedTask: 2,
      networkProcesses: [],
    };  
  }

  componentDidMount() {
    const setState = this.setState.bind(this);
    const { socket } = this.props;
    this.startCountdowns();
    //Remove task from task list
    deleteTaskHandle(socket, this.removeTask);
    //Add task to task list
    addTaskHandle(socket, setState);
    //Set task list
    setTasksHandle(socket, setState);
  }
  
  componentWillUnmount() {
    clearInterval(this.countdownInterval);
  }

  //Remove from process time/Add to online time
  startCountdowns = () => {
    this.countdownInterval = setInterval(() => {
      this.setState(prevState => {
        const updatedProcesses = prevState.networkProcesses.map(process => {
          if (process.duration > 0) {
            return { ...process, duration: process.duration - 1 };
          }
          return process;
        });
        return { online: prevState.online + 1, networkProcesses: updatedProcesses };
      });
    }, 1000);
  }

  //Format HH:MM:SS
  formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
  
    let formattedTime = '';
  
    if (hours > 0) {
      formattedTime += `${String(hours).padStart(2, '0')}:`;
    }
  
    formattedTime += `${String(minutes).padStart(2, '0')}:`;
    formattedTime += `${String(remainingSeconds).padStart(2, '0')}`;
  
    return formattedTime;
  }

  selectTask = (id) => {
    const setID = (this.state.selectedTask === id) ? 0 : id
    console.log(setID);
    this.setState({
      selectedTask: setID
    })
  }

  submitTask = (id) => {
    const { socket } = this.props;
    socket.emit('submitTask', id);
  }

  removeTask = (id) => {
    const { networkProcesses } = this.state;

    // Update state to remove the deleted task
    this.setState({
      networkProcesses: networkProcesses.filter(task => task.taskid !== id),
    });
  };
  
  renderSummary = (selectedTask) => {
    const { online } = this.state;

    return (
      <>
        <div className='dashboard-title'>Summary</div>
        <div className="summary">
          <div className="net-left">
            Origin&nbsp;<div className='ip'><i className="fa-solid fa-globe fa-xs"></i> localhost</div>
          </div>
          {(selectedTask && selectedTask.targetIP !== 'localhost') ? (
            <div className="net-right">
              Target&nbsp;<div className='ip'><i className="fa-solid fa-wifi fa-xs"></i> {selectedTask.targetIP}</div>
            </div>
          ) : (
            <div className="connection">
              Online&nbsp;<div className='duration'><i className="fa-solid fa-wifi fa-xs" style={{ marginRight: (online <= 3599) ? '25px' : '45px'}}></i>&nbsp;<div style= {{ position: 'relative', top: '-16.5px', right: '-13px', marginRight: '8px'}}>{this.formatTime(online)}</div></div>
            </div>
          )}
        </div>
        {selectedTask && (
          <div className="summary">
            <div className="net-left">
              <div className='file'><i className={(selectedTask.ext === 'folder') ? "fa-solid fa-folder" : "fa-solid fa-file"}></i> {(selectedTask.ext === 'folder') ? selectedTask.filename : `${selectedTask.filename}.${selectedTask.ext}`}</div>
            </div>
            <div className="net-right">
              <div className='path'><i className="fa-solid fa-folder"></i> C:/{selectedTask.path}</div>
            </div>
          </div>
        )}
      </>
    )
  }

  render() {
    const { networkProcesses } = this.state;
    const selectedTask = networkProcesses.find(obj => obj.id === this.state.selectedTask);

    if (networkProcesses.length === 0) {
      return (
        <div className="network-dashboard">
          {this.renderSummary(selectedTask)}
        </div>
      );
    } else {
      return (
        <div className="network-dashboard">
          <div className='dashboard-title'>Network Processes</div>
          <div className="network-processes">
            <table>
              <thead>
                <tr>
                  <th>Process</th>
                  <th style={{width: '25%'}}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {networkProcesses.map(process => (
                  <tr key={process.id}>
                    <td style={{textAlign: 'left', padding: '0 0 5px 5px'}}>
                      <div className='taskElem' onClick={() => this.selectTask(process.id)}>
                        <div className='actionType'>{process.actionType}</div>
                        <div className='taskInfo'>{(process.actionType === 'Upload') ? 'To: ' : 'From: '}
                        {process.targetIP}</div>
                        <div className='taskInfo'>{(process.ext === 'folder') ? 'Folder: ' : 'File: '}
                        {(process.ext === 'folder') ? process.filename : `${process.filename}.${process.ext}`}</div>
                      </div>
                    </td>
                    {(process.duration > 0) ? 
                      (<td>{ this.formatTime(process.duration) }</td>)
                      :
                      (<td onClick={() => this.submitTask(process.taskid)}><i className="fa-solid fa-check"></i></td>)
                    }
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {this.renderSummary(selectedTask)}
        </div>
      );
    }
  }
}

export default NetworkDashboard;