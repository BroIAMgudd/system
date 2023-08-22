import React, { Component } from 'react';
import '../css/IPList.css'
import {
  reqIPListHandler,
  setIPListHandler,
  appendIPHandler,
  removeIPHandler
} from './Handlers/IPListHandlers';

class IPList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ipList: [
        {
          type: 'npc',
          ip: '1.1.1.1',
          name: 'localhost'
        },{
          type: 'player',
          ip: '12.12.12.12',
          name: 'DoIReallyExist'
        },{
          type: 'npc',
          ip: '31.31.31.31',
          name: 'localhost'
        },
      ],
      npcCollapsed: false,
      playerCollapsed: false
    };
  }

  componentDidMount() {
    const setState = this.setState.bind(this);
    const { socket } = this.props;

    socket.on('receiveUser', () => socket.emit('LoadIPs'));
    setIPListHandler(socket, setState);
    appendIPHandler(socket, setState);
    removeIPHandler(socket, setState, this.removeIP);
  }
  
  toggleCollapse = section => {
    this.setState(prevState => ({
      [`${section}Collapsed`]: !prevState[`${section}Collapsed`]
    }));
  };

  renderIPList = (section) => {
    const filteredIPs = this.state.ipList.filter(ip => ip.type === section);

    if (!this.state[`${section}Collapsed`]) {
      return (
        <>
          {filteredIPs.map((ip, i) => (
            <tr key={i}>
              <td> {ip.username} </td>
              <td> {ip.ip} </td>
            </tr>
          ))}
        </>
      );
    }
    return null;
  };

  render() {
    return (
      <>
        <div onClick={() => this.toggleCollapse('NPC')} style={{ textAlign: 'center' }}>
          NPC IPs
        </div>
        <table>
          <tbody>
            {this.renderIPList('NPC')}
          </tbody>
        </table>
        <div onClick={() => this.toggleCollapse('Player')} style={{ textAlign: 'center' }}>
          Player IPs
        </div>
        <table>
          <tbody>
            {this.renderIPList('Player')}
          </tbody>
        </table>
        <div onClick={() => this.toggleCollapse('Server')} style={{ textAlign: 'center' }}>
          Server IPs
        </div>
        <table>
          <tbody>
            {this.renderIPList('Server')}
          </tbody>
        </table>
      </>
    );
  }
}

export default IPList;