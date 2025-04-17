import { createFreeHandTool } from './Tool'

import { toolTypes } from '../const'

import markPointer from '@/assets/images/mark_pen.png'
import { MouseImage } from '../utils'

let mouseInstance = new MouseImage('marker', markPointer)

export default createFreeHandTool(toolTypes.MARKER, {
  style: {
    strokeCap: 'round',
    strokeJoin: 'round',
  },

  applyStyle(path, style) {
    if (style) {
      path.strokeColor = style.c
      path.strokeWidth = style.w
    } else {
      path.strokeColor = this.style.strokeColor
      path.strokeWidth = this.style.strokeWidth
    }
    path.strokeCap = this.style.strokeCap
    path.strokeJoin = this.style.strokeJoin
    path.strokeColor && (path.strokeColor.alpha = 0.5)
    return path
  },

  handMove(hash) {
    if (!mouseInstance.instance) {
      mouseInstance.render({}, this.wrapper)
    }
    let pointerX = hash[0] * this.zoom
    let pointerY = hash[1] * this.zoom
    pointerX += 3
    pointerY -= 20
    mouseInstance.setPosition(pointerX, pointerY)
  },

  onMove(point) {
    const { x, y } = point
    this.handMove([x, y])
  },

  setSelected(val) {
    if (!val) this.handRemove()
  },

  handRemove() {
    try {
      mouseInstance.remove()
    } catch (e) {}
  },
})
