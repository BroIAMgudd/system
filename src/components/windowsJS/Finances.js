import React, { Component } from 'react';
import '../css/finances.css';

class Finances extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accounts: [],
      btc: 25.9999,
      btcDropdown: '',
      btcInput: ''
    };  
  }

  componentDidMount() {
    const { socket } = this.props;

    socket.on('updateBanks', (accounts) => {
      this.setState({ 
        accounts: accounts
      });
    });

    socket.on('updateBtcAmt', (amt) => {
      this.setState({ 
        btc: amt
      });
    });

    socket.on('updateBtcPrice', (price) => {
      this.setState({
        btcPrice: price
      });
    });

    socket.on('btcInfo', (info) => {
      console.log(info);
    });

    socket.on('receiveUser', () => {
      socket.emit('getFinances');
    });
  }

  handleDropdownChange = (event) => {
    this.setState({ btcDropdown: event.target.value });
  };

  handleBtcAmountChange = (event) => {
    this.setState({ btcAmt: event.target.value });
  };

  handleSubmit = () => {
    const { btcDropdown, btcAmt } = this.state;
    const { socket } = this.props;

    if (!btcDropdown || !btcAmt) { return; }

    socket.emit('btcRequest', {
      option: btcDropdown,
      input: btcAmt
    });

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

  toggleDetails = (id) => {
    this.setState(prevState => {
      const accCopy = [...prevState.accounts]; // Use spread operator to create a copy
      const accIndex = accCopy.findIndex(account => account.id === id); // Use === for comparison
      accCopy[accIndex].showDetails = !accCopy[accIndex].showDetails;
      return { accounts: accCopy }; // Return updated accounts array
    });
  };  

  render() {
    const { accounts, btc, btcDropdown, btcAmt } = this.state;
    let total = 0;

    accounts.forEach((account) => {
      total += parseFloat(account.amount);
    });

    return (
      <>
        <div className="finances">
          <div className='bank-accounts-header'>
            <div className='bank-accounts-total-title'>Bank Accounts</div>
            <div className='bank-accounts-total'>{this.formatMoney(total)}</div>  
          </div>
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
                      {account.showDetails ? (
                        <>
                          <i className="fa-solid fa-minus fa-2xs hideView" onClick={() => this.toggleDetails(account.id)}></i>
                          <div className='account-#'>
                            {account.number}
                          </div>
                          <div className='account-pass'>
                            {account.password}
                          </div>
                        </>
                      ) : <span onClick={() => this.toggleDetails(account.id)}>[Click to View]</span>}
                      <div className='account-ip'>{account.ip}</div>
                    </div>
                  </td>
                  <td>{ this.formatMoney(account.amount) }</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="btc-wallet">
        <div className="btc-title">Bitcoin</div>
          <i className="fa-solid fa-bitcoin-sign fa-xs btc-sign"></i>&nbsp;
          <div className='btc-total'>{btc}</div>
          <div>
            <select className='btc-dropdown' onChange={this.handleDropdownChange} value={btcDropdown}>
              <option value=''></option>
              <option value='redeem'>Redeem</option>
              <option value='create'>Create</option>
              <option value='buy'>Buy</option>
              <option value='sell'>Sell</option>
            </select>
            <textarea
              className='btc-amount'
              placeholder={(btcDropdown !== 'redeem') ? 'Enter Amount' : 'Enter Code'}
              value={btcAmt}
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