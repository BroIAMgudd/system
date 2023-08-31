import React from 'react'
import TermRender from './TermRender'
import NetworkDashboard from './NetworkDashboard'
import LogViewer from './LogRender'
import Finances from './Finances'
import Tor from './Tor'
import IPList from './IPList'
import Metasploit from './Metasploit'

const windowComponents = {
  'Terminal': TermRender,
  'Network Dashboard': NetworkDashboard,
  'Log Manager': LogViewer,
  'Finances': Finances,
  'Tor': Tor,
  'IPList': IPList,
  'Metasploit' : Metasploit
};

const WindowRenderer = ({ name, openClose, mkWin, socket }) => {
  const Component = windowComponents[name] || null;

  return Component ? <Component openClose={openClose} mkWin={mkWin} socket={socket} /> : null;
}

export default WindowRenderer