import { useState } from 'react';
import './App.css'
import Whiteboard from './components/Whiteboard'
import { toolTypes } from './components/Whiteboard/libs/const'

function App() {
  const [currentTool, setCurrentTool] = useState({
    tool: toolTypes.PEN,
    strokeColor: '#000000',
    strokeWidth: 2
  });

  const tools = [
    { name: '筆', type: toolTypes.PEN },
    { name: '橡皮擦', type: toolTypes.ERASER },
    { name: '選擇', type: toolTypes.SELECTOR },
    { name: '矩形', type: toolTypes.RECTANGLE },
    { name: '圓形', type: toolTypes.CIRCLE },
    { name: '三角形', type: toolTypes.TRIANGLE },
    { name: '箭頭', type: toolTypes.ARROW },
    { name: '文字', type: toolTypes.TEXT },
  ];


  return (
    <div className="app">
      <div className="toolbar">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => setCurrentTool({ ...currentTool, tool: tool.type })}
            className={currentTool.tool === tool.type ? 'active' : ''}
          >
            {tool.name}
          </button>
        ))}
        <input
          type="color"
          value={currentTool.strokeColor}
          onChange={(e) => setCurrentTool({ ...currentTool, strokeColor: e.target.value })}
        />
        <input
          type="range"
          min="1"
          max="20"
          value={currentTool.strokeWidth}
          onChange={(e) => setCurrentTool({ ...currentTool, strokeWidth: parseInt(e.target.value) })}
        />
      </div>
      <Whiteboard 
        width={800}
        height={600}
        zoom={1}
        currentTool={currentTool}
      />
    </div>
  )
}

export default App
