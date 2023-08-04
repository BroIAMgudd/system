import React, { Component } from 'react'
import RegComponent from './RegComponent'
import PureComp from './PureComp'
import MemoComp from './MemoComp'

class ParentComponent extends Component {

  constructor(props) {
    super(props)
  
    this.state = {
      name: 'Hi_Guys'
    }
  }

  componentDidMount() {
    setInterval(() => {
      this.setState({
        name: 'Hi_Guys'
      })
    }, 2000)
  }

  render() {
    return (
      <div>
        ParentComponent
        <MemoComp name={this.state.name}/>
        {/* <RegComponent name={this.state.name}/>
        <PureComp name={this.state.name}/> */}
      </div>
    )
  }
}

export default ParentComponent