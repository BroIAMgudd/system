import React, { Component } from 'react'

class userGreeting extends Component {

  constructor(props) {
    super(props)

    this.state = {
      isLoggedIn: true
    }
  }

  render() {
    return this.state.isLoggedIn && <div>Welcome Guy!</div>
    //return this.state.isLoggedIn ? (<div>Welcome Guy!</div>) : (<div>Welcome Guest!</div>)
    /////////////////////////////////////////////
    // let msg
    // if (this.state.isLoggedIn) {
    //   msg = <div>Welcome Guy!</div>
    // } else {
    //   msg = <div>Welcome Guest!</div>
    // }
    // return <div>{msg}</div>
    /////////////////////////////////////////////
    // if (this.state.isLoggedIn) {
    //   return <div>Welcome Guy!</div>
    // } else {
    //   return <div>Welcome Guest!</div>
    // }
  }
}

export default userGreeting