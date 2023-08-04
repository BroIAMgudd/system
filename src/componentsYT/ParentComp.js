import React, { Component } from 'react'
import ChildComponent from './ChildComponent'

class ParentComp extends Component {

  constructor(props) {
    super(props)
  
    this.state = {
      parentName: 'Parent'
    }
  }

  greetParent = (childName) => {
    alert(`Hello ${this.state.parentName} from ${childName}`)
  }

  render() {
    return (
      <ChildComponent greetHandler={this.greetParent}/>
    )
  }
}

export default ParentComp