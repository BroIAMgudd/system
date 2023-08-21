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

    reqIPListHandler(socket);
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
              <td> {ip.name} </td>
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
        <div onClick={() => this.toggleCollapse('npc')} style={{ textAlign: 'center' }}>
          NPC IPs
        </div>
        <table>
          <tbody>
            {this.renderIPList('npc')}
          </tbody>
        </table>
        <div onClick={() => this.toggleCollapse('player')} style={{ textAlign: 'center' }}>
          Player IPs
        </div>
        <table>
          <tbody>
            {this.renderIPList('player')}
          </tbody>
        </table>
      </>
    );
  }
}

export default IPList;