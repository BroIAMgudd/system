import React from 'react'
import TermRender from './TermRender'
import NetworkDashboard from './NetworkDashboard'
import LogViewer from './LogRender'
import Finances from './Finances'

function WindowRenderer({ name, socket }) {
  if (name === 'Terminal') return <TermRender socket={socket}/>
  if (name === 'Network Dashboard') return <NetworkDashboard socket={socket}/>
  if (name === 'Log Manager') return <LogViewer socket={socket}/>
  if (name === 'Finances') return <Finances socket={socket}/>
}

export default WindowRenderer