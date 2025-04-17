import React, { useEffect, useRef } from 'react'
import paper from 'paper'
import tools from './libs/tools'
import classnames from 'classnames'
import { toolTypes } from './libs/const'

const Whiteboard = ({
  width = 1000,
  height = 700,
  zoom = 1,
  className = '',
  currentTool = { tool: toolTypes.PEN, strokeColor: '#000000', strokeWidth: 2 },
}) => {
  const canvasRef = useRef < HTMLCanvasElement > null
  const textContainerRef = useRef < HTMLDivElement > null

  // 初始化 Paper.js 和工具
  useEffect(() => {
    if (!canvasRef.current || !textContainerRef.current) return

    // 設置 Paper.js
    paper.setup(canvasRef.current)

    // 設置畫布大小
    paper.view.viewSize = new paper.Size(width, height)

    // 設置縮放
    paper.view.zoom = zoom

    // 初始化工具
    tools.init(canvasRef.current, textContainerRef.current, {
      wrapper: canvasRef.current.parentElement,
      zoom: zoom,
    })

    // 設置當前工具
    tools.setCurrentTool(currentTool)

    // 清理函數
    return () => {
      paper.project.clear()
      if (paper.projects[0]) {
        paper.projects[0].remove()
      }
    }
  }, [width, height])

  // 處理縮放變化
  useEffect(() => {
    if (!paper.view) return
    paper.view.zoom = zoom
    tools.setZoom(zoom)
  }, [zoom])

  // 處理工具變化
  useEffect(() => {
    tools.setCurrentTool(currentTool)
  }, [currentTool])

  return (
    <div className={classnames('whiteboard-container', className)} style={{ width, height }}>
      <div
        ref={textContainerRef}
        className="text-container"
        style={{
          width: width,
          height: height,
          position: 'absolute',
          left: 0,
          top: 0,
          overflow: 'hidden',
          transformOrigin: 'top left',
        }}
      />
      <canvas ref={canvasRef} className="canvas" width={width} height={height} />
    </div>
  )
}

export default Whiteboard
