import React from 'react'

function Person({haxor}) {
  return (
    <div id={haxor.id}>
      <h2>
        I am {haxor.name} being {haxor.age} years old with a skillset of {haxor.skill}
      </h2>
    </div>
  )
}

export default Person