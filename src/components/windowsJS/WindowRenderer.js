import React from 'react'
import TermRender from './TermRender'
import NetworkDashboard from './NetworkDashboard'
import LogViewer from './LogRender'
import Finances from './Finances'
import Tor from './Tor'
import IPList from './IPList'

function WindowRenderer({ name, openClose, socket }) {
  if (name === 'Terminal') return <TermRender openClose={openClose} socket={socket}/>
  if (name === 'Network Dashboard') return <NetworkDashboard socket={socket}/>
  if (name === 'Log Manager') return <LogViewer socket={socket}/>
  if (name === 'Finances') return <Finances socket={socket}/>
  if (name === 'Tor') return <Tor socket={socket}/>
  if (name === 'IPList') {return <IPList socket={socket}/>}
}

export default WindowRenderer