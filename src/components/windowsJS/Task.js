import React, { Component } from 'react';

class Task extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeLeft: this.props.task.timer,
      isCompleted: false,
    };
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState(prevState => ({
        timeLeft: prevState.timeLeft - 1,
      }), () => {
        if (this.state.timeLeft <= 0) {
          clearInterval(this.interval);
          this.setState({ isCompleted: true });
        }
      });
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  handleTaskSubmit = () => {
    if (!this.state.isCompleted) {
      // Prevent submitting if the task is still running
      return;
    }

    // Emit task completion event to server
    // This can be customized based on your server-side logic
    console.log('Task completed:', this.props.task);
  };

  render() {
    const { timeLeft, isCompleted } = this.state;
    const { file, type } = this.props.task;

    return (
      <div className={`task ${type}`}>
        <div className="task-details">
          <div className="task-name">{file}</div>
          <div className="task-type">{type}</div>
          <div className="task-timer">{timeLeft} seconds left</div>
        </div>
        {!isCompleted && <button onClick={this.handleTaskSubmit} disabled>Submit</button>}
        {isCompleted && <button onClick={this.handleTaskSubmit}>Submit</button>}
      </div>
    );
  }
}

export default Task;