import React from 'react'
import TermRender from './TermRender'
import TaskRender from './TaskRender'
import LogRender from './LogRender'

function WindowRenderer({ name, socket }) {
  if (name === 'Terminal') return <TermRender socket={socket}/>
  if (name === 'Task Manager') return <TaskRender socket={socket}/>
  if (name === 'Log Manager') return <LogRender socket={socket}/>
}

export default WindowRenderer