import './App.css'
import Whiteboard from './components/WhiteBoard'

function App() {
  return (
    <div className="app">
      <Whiteboard aspectRatio={16 / 9} />
    </div>
  )
}

export default App
