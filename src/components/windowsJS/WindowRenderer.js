import React from 'react'
import TermRender from './TermRender'
import TaskRender from './TaskRender'
import LogRender from './LogRender'

function WindowRenderer({ name }) {
  if (name === 'Terminal') return <TermRender/>
  if (name === 'Task Manager') return <TaskRender/>
  if (name === 'Log Manager') return <LogRender/>
}

export default WindowRenderer