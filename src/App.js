import './App.css';
import './components/Greet'
import Greet from './components/Greet';
import Welcome from './components/Welcome';
import Hello from './components/Hello';
import Message from './components/Message';
import Counter from './components/Counter';
import FunctionClick from './components/FunctionClick';
import ClassClick from './components/ClassClick';
import EventBind from './components/EventBind';

function App() {
  return (
    <div className="App">
      <EventBind/>
      {/* <FunctionClick/> */}
      {/* <ClassClick/> */}
      {/* <Counter/> */}
      {/* <Message name="Hi_Guys"/> */}
      {/* <Welcome name="Winfinity" heroName="Pentester"/> */}
      {/* <Greet/> */}
    </div>
  );
}

export default App;
