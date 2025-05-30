import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { fabric } from 'fabric'
import PdfReader from '../PdfReader'
import { saveAs } from 'file-saver'
import getCursor from './cursors'
import SelectIcon from './images/select.svg'
import EraserIcon from './images/eraser.svg'
import TextIcon from './images/text.svg'
import RectangleIcon from './images/rectangle.svg'
import LineIcon from './images/line.svg'
import EllipseIcon from './images/ellipse.svg'
import TriangleIcon from './images/triangle.svg'
import PencilIcon from './images/pencil.svg'
import DeleteIcon from './images/delete.svg'

import './eraserBrush'

import styles from './index.module.scss'

let drawInstance = null
let origX
let origY
let mouseDown = false

const options = {
  currentMode: '',
  currentColor: '#000000',
  currentWidth: 5,
  fill: false,
  group: {},
}

const modes = {
  RECTANGLE: 'RECTANGLE',
  TRIANGLE: 'TRIANGLE',
  ELLIPSE: 'ELLIPSE',
  LINE: 'LINE',
  PENCIL: 'PENCIL',
  ERASER: 'ERASER',
}

const initCanvas = (width, height) => {
  const canvas = new fabric.Canvas('canvas', { height, width })
  fabric.Object.prototype.transparentCorners = false
  fabric.Object.prototype.cornerStyle = 'circle'
  fabric.Object.prototype.borderColor = '#4447A9'
  fabric.Object.prototype.cornerColor = '#4447A9'
  fabric.Object.prototype.cornerSize = 6
  fabric.Object.prototype.padding = 10
  fabric.Object.prototype.borderDashArray = [5, 5]

  canvas.on('object:added', e => {
    e.target.on('mousedown', removeObject(canvas))
  })
  canvas.on('path:created', e => {
    e.path.on('mousedown', removeObject(canvas))
  })

  return canvas
}

function removeObject(canvas) {
  return e => {
    if (options.currentMode === modes.ERASER) {
      canvas.remove(e.target)
    }
  }
}

function stopDrawing() {
  console.log('stopDrawing', mouseDown)
  mouseDown = false
}

function removeCanvasListener(canvas) {
  canvas.off({
    'mouse:down': null,
    'mouse:move': null,
    'mouse:up': null,
  })
}

/*  ==== line  ==== */
function createLine(canvas) {
  console.log('createLine start', {
    version: fabric.version,
    currentMode: options.currentMode,
    canvasEvents: canvas.__eventListeners,
  })

  options.currentMode = modes.LINE
  removeCanvasListener(canvas)

  // 4.6 版本應該使用這種事件名稱
  canvas.on({
    'mouse:down': function (opt) {
      console.log('mouse:down triggered', opt)
      mouseDown = true
      const pointer = canvas.getPointer(opt.e)
      drawInstance = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
        strokeWidth: options.currentWidth,
        stroke: options.currentColor,
        selectable: false,
      })
      canvas.add(drawInstance)
    },
    'mouse:move': function (opt) {
      if (!mouseDown) return
      const pointer = canvas.getPointer(opt.e)
      drawInstance.set({
        x2: pointer.x,
        y2: pointer.y,
      })
      canvas.requestRenderAll()
    },
    'mouse:up': function () {
      mouseDown = false
    },
  })

  canvas.selection = false
  canvas.hoverCursor = 'crosshair'
  canvas.isDrawingMode = false
  canvas.getObjects().forEach(item => item.set({ selectable: false }))
  canvas.requestRenderAll()
}

function startAddLine(canvas) {
  console.log('startAddLine', modes.currentMode, 'canvas', canvas)
  return ({ e }) => {
    mouseDown = true

    let pointer = canvas.getPointer(e)
    drawInstance = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      strokeWidth: options.currentWidth,
      stroke: options.currentColor,
      selectable: false,
    })

    canvas.add(drawInstance)
    canvas.requestRenderAll()
  }
}

function startDrawingLine(canvas) {
  return ({ e }) => {
    if (mouseDown) {
      const pointer = canvas.getPointer(e)
      drawInstance.set({
        x2: pointer.x,
        y2: pointer.y,
      })
      drawInstance.setCoords()
      canvas.requestRenderAll()
    }
  }
}

/* ==== rectangle ==== */
function createRect(canvas) {
  if (options.currentMode !== modes.RECTANGLE) {
    options.currentMode = modes.RECTANGLE

    removeCanvasListener(canvas)

    canvas.on('mouse:down', startAddRect(canvas))
    canvas.on('mouse:move', startDrawingRect(canvas))
    canvas.on('mouse:up', stopDrawing)

    canvas.selection = false
    canvas.hoverCursor = 'auto'
    canvas.isDrawingMode = false
    canvas.getObjects().map(item => item.set({ selectable: false }))
    canvas.discardActiveObject().requestRenderAll()
  }
}

function startAddRect(canvas) {
  return ({ e }) => {
    mouseDown = true

    const pointer = canvas.getPointer(e)
    origX = pointer.x
    origY = pointer.y

    drawInstance = new fabric.Rect({
      stroke: options.currentColor,
      strokeWidth: options.currentWidth,
      fill: options.fill ? options.currentColor : 'transparent',
      left: origX,
      top: origY,
      width: 0,
      height: 0,
      selectable: false,
    })

    canvas.add(drawInstance)

    drawInstance.on('mousedown', e => {
      if (options.currentMode === modes.ERASER) {
        console.log('刪除', e)
        canvas.remove(e.target)
      }
    })
  }
}

function startDrawingRect(canvas) {
  return ({ e }) => {
    if (mouseDown) {
      const pointer = canvas.getPointer(e)

      if (pointer.x < origX) {
        drawInstance.set('left', pointer.x)
      }
      if (pointer.y < origY) {
        drawInstance.set('top', pointer.y)
      }
      drawInstance.set({
        width: Math.abs(pointer.x - origX),
        height: Math.abs(pointer.y - origY),
      })
      drawInstance.setCoords()
      canvas.renderAll()
    }
  }
}

/* ==== Ellipse ==== */
function createEllipse(canvas) {
  if (options.currentMode !== modes.ELLIPSE) {
    options.currentMode = modes.ELLIPSE

    removeCanvasListener(canvas)

    canvas.on('mouse:down', startAddEllipse(canvas))
    canvas.on('mouse:move', startDrawingEllipse(canvas))
    canvas.on('mouse:up', stopDrawing)

    canvas.selection = false
    canvas.hoverCursor = 'auto'
    canvas.isDrawingMode = false
    canvas.getObjects().map(item => item.set({ selectable: false }))
    canvas.discardActiveObject().requestRenderAll()
  }
}

function startAddEllipse(canvas) {
  return ({ e }) => {
    mouseDown = true

    const pointer = canvas.getPointer(e)
    origX = pointer.x
    origY = pointer.y
    drawInstance = new fabric.Ellipse({
      stroke: options.currentColor,
      strokeWidth: options.currentWidth,
      fill: options.fill ? options.currentColor : 'transparent',
      left: origX,
      top: origY,
      cornerSize: 7,
      objectCaching: false,
      selectable: false,
    })

    canvas.add(drawInstance)
  }
}

function startDrawingEllipse(canvas) {
  return ({ e }) => {
    if (mouseDown) {
      const pointer = canvas.getPointer(e)
      if (pointer.x < origX) {
        drawInstance.set('left', pointer.x)
      }
      if (pointer.y < origY) {
        drawInstance.set('top', pointer.y)
      }
      drawInstance.set({
        rx: Math.abs(pointer.x - origX) / 2,
        ry: Math.abs(pointer.y - origY) / 2,
      })
      drawInstance.setCoords()
      canvas.renderAll()
    }
  }
}

/* === triangle === */
function createTriangle(canvas) {
  removeCanvasListener(canvas)

  canvas.on('mouse:down', startAddTriangle(canvas))
  canvas.on('mouse:move', startDrawingTriangle(canvas))
  canvas.on('mouse:up', stopDrawing)

  canvas.selection = false
  canvas.hoverCursor = 'auto'
  canvas.isDrawingMode = false
  canvas.getObjects().map(item => item.set({ selectable: false }))
  canvas.discardActiveObject().requestRenderAll()
}

function startAddTriangle(canvas) {
  return ({ e }) => {
    mouseDown = true
    options.currentMode = modes.TRIANGLE

    const pointer = canvas.getPointer(e)
    origX = pointer.x
    origY = pointer.y
    drawInstance = new fabric.Triangle({
      stroke: options.currentColor,
      strokeWidth: options.currentWidth,
      fill: options.fill ? options.currentColor : 'transparent',
      left: origX,
      top: origY,
      width: 0,
      height: 0,
      selectable: false,
    })

    canvas.add(drawInstance)
  }
}

function startDrawingTriangle(canvas) {
  return ({ e }) => {
    if (mouseDown) {
      const pointer = canvas.getPointer(e)
      if (pointer.x < origX) {
        drawInstance.set('left', pointer.x)
      }
      if (pointer.y < origY) {
        drawInstance.set('top', pointer.y)
      }
      drawInstance.set({
        width: Math.abs(pointer.x - origX),
        height: Math.abs(pointer.y - origY),
      })

      drawInstance.setCoords()
      canvas.renderAll()
    }
  }
}

function createText(canvas) {
  removeCanvasListener(canvas)

  canvas.isDrawingMode = false

  const text = new fabric.Textbox('text', {
    left: 100,
    top: 100,
    fill: options.currentColor,
    editable: true,
  })

  canvas.add(text)
  canvas.renderAll()
}

function changeToErasingMode(canvas) {
  if (options.currentMode !== modes.ERASER) {
    removeCanvasListener(canvas)

    canvas.isDrawingMode = false

    options.currentMode = modes.ERASER
    canvas.hoverCursor = `url(${getCursor({ type: 'eraser' })}), default`
  }
}

function onSelectMode(canvas) {
  options.currentMode = ''
  canvas.isDrawingMode = false

  removeCanvasListener(canvas)

  canvas.getObjects().map(item => item.set({ selectable: true }))
  canvas.hoverCursor = 'all-scroll'
}

function clearCanvas(canvas) {
  canvas.getObjects().forEach(item => {
    if (item !== canvas.backgroundImage) {
      canvas.remove(item)
    }
  })
}
function canvasToJson(canvas) {
  alert(JSON.stringify(canvas.toJSON()))
}

function draw(canvas) {
  if (options.currentMode !== modes.PENCIL) {
    removeCanvasListener(canvas)

    options.currentMode = modes.PENCIL
    // canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = parseInt(options.currentWidth, 10) || 1
    canvas.isDrawingMode = true
  }
}

function handleResize(callback) {
  const resize_ob = new ResizeObserver(callback)

  return resize_ob
}

function resizeCanvas(canvas, whiteboard) {
  return () => {
    const ratio = canvas.getWidth() / canvas.getHeight()
    const whiteboardWidth = whiteboard.clientWidth

    const scale = whiteboardWidth / canvas.getWidth()
    const zoom = canvas.getZoom() * scale
    canvas.setDimensions({ width: whiteboardWidth, height: whiteboardWidth / ratio })
    canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0])
  }
}

const Whiteboard = ({ aspectRatio = 4 / 3 }) => {
  const [canvas, setCanvas] = useState(null)
  const [brushWidth, setBrushWidth] = useState(5)
  const [isFill, setIsFill] = useState(false)
  const [fileReaderInfo, setFileReaderInfo] = useState({
    file: '',
    totalPages: null,
    currentPageNumber: 1,
    currentPage: '',
  })
  const canvasRef = useRef(null)
  const whiteboardRef = useRef(null)
  const uploadImageRef = useRef(null)
  const uploadPdfRef = useRef(null)

  useEffect(() => {
    const canvasContainerElement = document.querySelector('.canvas-container')
    if (!canvas && canvasRef.current && !canvasContainerElement) {
      console.log('初始化 canvas')
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: whiteboardRef.current.clientWidth,
        height: whiteboardRef.current.clientWidth / aspectRatio,
        selection: true,
      })

      // 測試事件系統
      fabricCanvas.on('mouse:down', function () {})

      setCanvas(fabricCanvas)
      handleResize(resizeCanvas(fabricCanvas, whiteboardRef.current)).observe(whiteboardRef.current)
    }
  }, [canvasRef.current])

  useEffect(() => {
    if (canvas) {
      const center = canvas.getCenter()
      fabric.Image.fromURL(fileReaderInfo.currentPage, img => {
        img.scaleToHeight(canvas.height)
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          top: center.top,
          left: center.left,
          originX: 'center',
          originY: 'center',
        })

        canvas.renderAll()
      })
    }
  }, [fileReaderInfo.currentPage])

  function uploadImage(e) {
    const reader = new FileReader()
    const file = e.target.files[0]

    reader.addEventListener('load', () => {
      fabric.Image.fromURL(reader.result, img => {
        img.scaleToHeight(canvas.height)
        canvas.add(img)
      })
    })

    reader.readAsDataURL(file)
  }

  function changeCurrentWidth(e) {
    const intValue = parseInt(e.target.value)
    options.currentWidth = intValue
    canvas.freeDrawingBrush.width = intValue
    setBrushWidth(() => intValue)
  }

  function changeCurrentColor(e) {
    options.currentColor = e.target.value
    canvas.freeDrawingBrush.color = e.target.value
  }

  function changeFill(e) {
    options.fill = e.target.checked
    setIsFill(() => e.target.checked)
  }

  function onSaveCanvasAsImage() {
    canvasRef.current.toBlob(function (blob) {
      saveAs(blob, 'image.png')
    })
  }

  function onFileChange(event) {
    updateFileReaderInfo({ file: event.target.files[0], currentPageNumber: 1 })
  }

  function updateFileReaderInfo(data) {
    setFileReaderInfo({ ...fileReaderInfo, ...data })
  }
  console.log('fabric.version', fabric.version)

  return (
    <div ref={whiteboardRef} className={styles.whiteboard}>
      <div className={styles.toolbar}>
        <button type="button" onClick={() => createLine(canvas)}>
          <img src={LineIcon} alt="line" />
        </button>
        <button type="button" onClick={() => createRect(canvas)}>
          <img src={RectangleIcon} alt="Rectangle" />
        </button>
        <button type="button" onClick={() => createEllipse(canvas)}>
          <img src={EllipseIcon} alt="Ellipse" />
        </button>
        <button type="button" onClick={() => createTriangle(canvas)}>
          <img src={TriangleIcon} alt="Triangle" />
        </button>
        <button type="button" onClick={() => draw(canvas)}>
          <img src={PencilIcon} alt="Pencil" />
        </button>
        <button type="button" onClick={() => createText(canvas)}>
          <img src={TextIcon} alt="Text" />
        </button>
        <button type="button" onClick={() => onSelectMode(canvas)}>
          <img src={SelectIcon} alt="Selection mode" />
        </button>
        <button type="button" onClick={() => changeToErasingMode(canvas)}>
          <img src={EraserIcon} alt="Eraser" />
        </button>
        <button type="button" onClick={() => clearCanvas(canvas)}>
          <img src={DeleteIcon} alt="Delete" />
        </button>
        <div>
          <input type="checkbox" name="fill" id="fill" checked={isFill} onChange={changeFill} />
          <label htmlFor="fill">fill</label>
        </div>
        <div>
          <input type="color" name="color" id="color" onChange={changeCurrentColor} />
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={brushWidth}
          onChange={changeCurrentWidth}
        />
        <div className={styles.uploadDropdown}>
          <input ref={uploadImageRef} accept="image/*" type="file" onChange={uploadImage} />
          <input ref={uploadPdfRef} accept=".pdf" type="file" onChange={onFileChange} />
          <button className={styles.dropdownButton}>+Upload</button>
          <div className={styles.dropdownContent}>
            <span onClick={() => uploadImageRef.current.click()}>Image</span>
            <span onClick={() => uploadPdfRef.current.click()}>PDF</span>
          </div>
        </div>

        <button onClick={() => canvasToJson(canvas)}>To Json</button>
        <button onClick={onSaveCanvasAsImage}>Save as image</button>
      </div>
      <canvas ref={canvasRef} id="canvas" />
      <div>
        <PdfReader fileReaderInfo={fileReaderInfo} updateFileReaderInfo={updateFileReaderInfo} />
      </div>
    </div>
  )
}

Whiteboard.propTypes = {
  aspectRatio: PropTypes.number,
}

export default Whiteboard
