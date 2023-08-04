import React from 'react'
import Person from './Person'

function NameList() {
  const haxors = [
    {
      id: 1,
      name: 'Hi_Guys',
      age: 18,
      skill: 'Eating'
    }, {
      id: 2,
      name: 'Winfinity',
      age: 69,
      skill: "Penitration"
    }, {
      id: 3,
      name: 'Drazard',
      age: 9001,
      skill: "Being red"
    }
  ]
  const haxorList = haxors.map(haxor => <Person key={haxor.id} haxor={haxor} />)
  return ( <div>
      <h1 className='primary'>bro1</h1>
      {haxorList}
    </div> )
}

export default NameList