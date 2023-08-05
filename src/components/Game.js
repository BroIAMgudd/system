import React, { Component } from 'react'
import DragComp from './DragComp'

class Game extends Component {

  constructor(props) {
    super(props)
  
    this.state = {
      winRender: {
        term: true,
        task: true,
        log: true
      }
    }
  }

  openClose = (name) => {
    this.setState(prevState => {
      let winRender = Object.assign({}, prevState.winRender);  // creating copy of state variable jasper
      winRender[name] = !winRender[name];                     // update the name property, assign a new value                 
      return { winRender };  
    })
  }

  render() {
    return (
      <>
        {this.state.winRender.term ? <DragComp name='Terminal' short='term' openClose={this.openClose}/> : null}
        {this.state.winRender.task ? <DragComp name='Task Manager' short='task' openClose={this.openClose}/> : null}
        {this.state.winRender.log ? <DragComp name='Log Manager' short='log' openClose={this.openClose}/> : null}
      </>
    )
  }
}

export default Game