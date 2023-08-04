import React from 'react'

const Hello = (props) => {
    return (
        <div id = 'hello' className='Classical'>
            <h1>Hello {props.name}!</h1>
            {props.children}
        </div>
    )
    // return React.createElement(
    //     'div', 
    //     {id:'hello', className:'Classical'}, 
    //     React.createElement('h1', null, "Hello World!")
    // )
}

export default Hello;