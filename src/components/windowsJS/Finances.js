import React, { Component } from 'react';
import '../css/finances.css';

class Finances extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accounts: [{
        id: 1,
        number: 1234567890,
        password: 'qwertyuiop[]',
        ip: '192.168.255.255',
        total: 100000000.25
      }],
      btc: 25.9999,
      btcDropdown: '',
      btcInput: ''
    };  
  }

  componentDidMount() {
    const { socket } = this.props;

    socket.on('updateFinances', (accounts) => {
      this.setState({ 
        accounts: [accounts]
      });
    });
  }

  handleDropdownChange = (event) => {
    this.setState({ btcDropdown: event.target.value });
  };

  handleBtcAmountChange = (event) => {
    this.setState({ btcDropdown: event.target.value });
  };

  handleSubmit = () => {
    const { btcDropdown, btcAmt } = this.state;
    const { socket } = this.props;

    // Send request to the server based on the selected option and BTC amount
    socket.emit('btcRequest', {
      option: btcDropdown,
      amount: btcAmt
    });

    // Clear the input fields
    this.setState({
      btcDropdown: '',
      btcAmt: ''
    });
  };

  formatMoney = (amount) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  
    return formatter.format(amount);
  }

  render() {
    const { accounts, btc } = this.state;

    return (
      <>
        <div className="finances">
          <table className="bank-accounts-list">
            <thead>
              <tr>
                <th>Account</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.id}>
                  <td>
                    <div className='bank-account'>
                      <div className='account-#'>{account.number}</div>
                      <div className='account-pass'>{account.password}</div>
                      <div className='account-ip'>{account.ip}</div>
                    </div>
                  </td>
                  <td>{ this.formatMoney(account.total) }</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="btc-wallet">
          Bitcoin Total
          <div className='btc-total'>{btc}</div>
          <div>
            <select className='btc-dropdown' onChange={this.handleDropdownChange} value={this.state.selectedOption}>
              <option value=''>Select an option</option>
              <option value='redeem'>Redeem Packet</option>
              <option value='create'>Create Packet</option>
              <option value='sell'>Sell BTC</option>
            </select>
            <textarea
              className='btc-amount'
              placeholder='Enter BTC amount'
              value={this.state.btcAmount}
              onChange={this.handleBtcAmountChange}
            />
            <button className='btc-submit' onClick={this.handleSubmit}>Submit</button>
          </div>
        </div>
      </>
    );
  }
}

export default Finances;