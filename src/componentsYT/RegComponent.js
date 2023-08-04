import React, { Component } from 'react'

export class RegComponent extends Component {
  render() {
    return (
      <div>
        RegComponent {this.props.name}
      </div>
    )
  }
}

export default RegComponent