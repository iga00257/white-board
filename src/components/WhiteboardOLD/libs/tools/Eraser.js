import paper from 'paper'
import { createTool } from './Tool'
import store from '../store'

import { toolTypes } from '../const'

import eraserPointer from '@/assets/images/eraser.png'

import commands from '../commands'

import { isInSelectBound, createDragRect, removeDragRect } from '../utils'

const hitOptions = {
  segments: true,
  stroke: true,
  curves: true,
  fill: true,
  guide: false,
  tolerance: 5,
}

let hoveredRect
const createHoverRect = function (bounds) {
  hoveredRect = new paper.Path.Rectangle(bounds)
  hoveredRect.strokeColor = '#009dec'
  hoveredRect.strokeWidth = 1
  hoveredRect.data.helperssss = true
}

const clearHoveredRect = function () {
  if (hoveredRect !== undefined) {
    hoveredRect.remove()
    hoveredRect = undefined
  }
  paper.view.update()
}

const getManaged = item => {
  if (item && item.data.managed) return item
  if (!item) return null
  return getManaged(item.parent)
}

let instance

const getPointer = function (hash) {
  //singleton
  if (instance) return instance
  instance = new paper.Raster({
    source: eraserPointer,
  })
  return instance
}

export default createTool(toolTypes.ERASER, {
  setSelected(val) {
    if (!val) {
      this.handleRemove()
      store.removeHelper()
      store.deselectAll()
    }
  },

  handleMove(hash) {
    const pointer = getPointer(hash)
    hash[0] += 15
    hash[1] -= 10
    pointer.setPosition(hash)
  },

  onMove(point) {
    const { x, y } = point
    this.handleMove([x, y])
  },

  handleRemove() {
    instance && instance.remove()
    instance = null
  },

  mouseMoveHandler(event) {
    this.onMove(event.point)
    const hitResult = paper.project.hitTest(event.point, hitOptions)

    if (hitResult) {
      if (hitResult !== hoveredRect) clearHoveredRect()
      const hitItem = getManaged(hitResult.item)
      if (!hitItem) return

      if (hitItem.selected === false) {
        createHoverRect(hitResult.item.bounds)
      }
    }
  },

  mouseDragHandler(event) {
    this.onMove(event.point)
    createDragRect(event.downPoint, event.point)
    store.items.filter(
      item => (item.path.selected = isInSelectBound(item.path.bounds, event.downPoint, event.point))
    )
  },

  mouseDownHandler(event) {
    if (event.event.button > 0) return // only first mouse button
    clearHoveredRect()
    const hitResult = paper.project.hitTest(event.point, hitOptions)
    let hitItem

    hitResult && (hitItem = getManaged(hitResult.item))

    if (hitItem) {
      hitItem.selected = true
    }
  },

  mouseUpHandler(event) {
    commands.send('DELETE')
    clearHoveredRect()
    removeDragRect()
  },
})
