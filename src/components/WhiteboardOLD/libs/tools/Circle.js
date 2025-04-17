import paper from 'paper'
import { createShapeTool } from './Tool'
import commands from '../commands'
import { toolTypes } from '../const'
import {
  getDistanceBetweenTwoPoint,
  getAngleByThreePoint,
  getAngleByThreeLine,
  MouseImage,
  drawGrid,
  Breath,
} from '../utils'

import compass_pen1_l from '@/assets/images/compass_pen_left1.png'
import compass_pen1_r from '@/assets/images/compass_pen_right1.png'
import compass_header1 from '@/assets/images/compass_header1.png'
import compass_pen2_l from '@/assets/images/compass_pen_left2.png'
import compass_pen2_r from '@/assets/images/compass_pen_right2.png'
import compass_header2 from '@/assets/images/compass_header2.png'

const theme = {
  // 1: {
  //   left: compass_pen,
  //   right: compass_pen,
  //   header: compass_header
  // },
  2: {
    left: compass_pen1_l,
    right: compass_pen1_r,
    header: compass_header1,
  },
  3: {
    left: compass_pen2_l,
    right: compass_pen2_r,
    header: compass_header2,
  },
}

const compassHeight = 220
const compassHeaderHeight = 60

const compassRightInstance = new MouseImage('compass', theme[2].right)
const compassLeftInstance = new MouseImage('compass', theme[2].left)
const compassHeaderInstance = new MouseImage('compass-header', theme[2].header)
let isMouseDown = false

function renderArcByRadian(origin, end, radian) {
  const radianOffset = Math.atan((end.y - origin.y) / (end.x - origin.x))
  const distance = getDistanceBetweenTwoPoint(origin, end)
  const otherRadian = radianOffset + radian
  const x1 = origin.x + distance * Math.cos(otherRadian)
  const y1 = origin.y + distance * Math.sin(otherRadian)
  let path = null
  if (Math.abs(radian) > 2 * Math.PI) {
    const distance = getDistanceBetweenTwoPoint(origin, end)
    path = new paper.Path.Circle(origin, distance)
  } else {
    const otherRadian2 = radianOffset + radian / 2
    const x2 = origin.x + distance * Math.cos(otherRadian2)
    const y2 = origin.y + distance * Math.sin(otherRadian2)
    path = new paper.Path.Arc(end, new paper.Point(x2, y2), new paper.Point(x1, y1))
  }
  path.radian = radian
  path.data.json = [[origin.x, origin.y], [end.x, end.y], radian]
  return {
    path,
    point: { x: x1, y: y1 },
  }
}

export default createShapeTool(toolTypes.CIRCLE, {
  lastRadian: 0,

  hasDash: false,

  setTheme(index) {
    compassRightInstance.changeImage(theme[index].right)
    compassLeftInstance.changeImage(theme[index].left)
    compassHeaderInstance.changeImage(theme[index].header)
  },

  draw(hash) {
    const [[originX, originY], [endX, endY], radian] = hash[2]
    const path = this.renderPath({ x: originX, y: originY }, { x: endX, y: endY }, radian)
    this.applyStyle(path, hash[3])
    path.data.json = hash[2]
    return this.createInstance(path, hash[1], hash[3])
  },

  setSelected(val) {
    if (!val) {
      this.compassRemove()
      this.grid && this.grid.remove()
      this.breath && this.breath.remove()
      document.removeEventListener('mousedown', this.listenMousedown)
      document.removeEventListener('mouseup', this.listenMouseup)
      document.removeEventListener('mousemove', this.listenMousemove)
    } else {
      this.breath = new Breath(this.wrapper)
      this.listenMousedown = event => {
        if (this.wrapper.contains(event.target)) {
          isMouseDown = true
          this.customizeMouseDownHandler(new paper.ToolEvent(paper.tool, 'mousedown', event))
        }
      }
      this.listenMouseup = event => {
        isMouseDown = false
        this.customizeMouseUpHandler(new paper.ToolEvent(paper.tool, 'mouseup', event))
      }
      this.listenMousemove = event => {
        if (isMouseDown) {
          this.customizeMouseDragHandler(new paper.ToolEvent(paper.tool, 'mousedrag', event))
        } else {
          this.customizeMouseMoveHandler(new paper.ToolEvent(paper.tool, 'mousemove', event))
        }
      }
      document.addEventListener('mousedown', this.listenMousedown, { passive: false })
      document.addEventListener('mouseup', this.listenMouseup, { passive: false })
      document.addEventListener('mousemove', this.listenMousemove, { passive: false })
      this.grid = drawGrid(40, 40, paper.view.bounds)
    }
  },

  compassRemove() {
    try {
      compassRightInstance.remove()
      compassLeftInstance.remove()
      compassHeaderInstance.remove()
    } catch (error) {}
  },

  customizeMouseDownHandler(event) {
    const { x, y } = event.point
    this.hasDash = !!this.dash
    if (!this.hasDash) {
      this.originPoint = event.point
      this.breath.setPosition({
        left: x * this.zoom - 10 + 'px',
        top: y * this.zoom - 10 + 'px',
      })
      this.renderCompass({ x, y }, { x: x + 2, y })
    }
  },

  customizeMouseUpHandler(event) {
    if (this.arc) {
      this.dash && this.dash.remove()
      this.dash = null
      this.compassRemove()
      const point = this.applyStyle(new paper.Shape.Circle(this.originPoint, 1))
      const group = new paper.Group([this.arc, point])
      group.data.json = this.arc.data.json
      commands.send('ADD', [this.createInstance(group)])
      this.arc = null
      this.originPoint = null
    }
  },

  mouseDragHandler(event) {},

  customizeMouseMoveHandler(event) {
    if (this.originPoint) return
    const { x, y } = event.point
    this.breath.setPosition({
      left: x * this.zoom - 10 + 'px',
      top: y * this.zoom - 10 + 'px',
    })
    this.renderCompass({ x, y }, { x: x + 2, y })
  },

  customizeMouseDragHandler(event) {
    if (this.originPoint) {
      event.deltaAngle = getAngleByThreePoint(this.originPoint, event.point, {
        x: event.point.x + event.delta.x,
        y: event.point.y + event.delta.y,
      })
    }
    if (!this.hasDash) {
      // this.originPoint = event.downPoint;
      this.endPoint = event.point
      this.lastRadian = 0
      this.dash && this.dash.remove()
      this.dash = this.applyStyle(this.renderDash(this.originPoint, event.point), {
        c: '#bcbcbc',
        w: 1,
      })
    } else {
      if (event.deltaAngle === 0) return
      this.lastRadian = this.lastRadian + event.deltaAngle
      this.arc && this.arc.remove()
      this.arc = this.renderArc2(this.originPoint, this.dash.endPoint, this.lastRadian)
    }
  },

  renderArc2(origin, end, radian) {
    const arcInfo = renderArcByRadian(origin, end, radian)
    this.renderCompass(this.originPoint, arcInfo.point)
    return this.applyStyle(arcInfo.path)
  },

  getPointWhenBeyondDistance(startPoint, endPoint) {
    const lengthAB = getDistanceBetweenTwoPoint(startPoint, endPoint)
    const angleResetA = this.getAtanAngle(startPoint, endPoint)
    let pointer = endPoint
    const dashMaxWidth = compassHeight * 2 - 40
    if (lengthAB > dashMaxWidth) {
      pointer = new paper.Point(
        Math.sin(angleResetA * (Math.PI / 180)) * dashMaxWidth + startPoint.x,
        Math.cos(angleResetA * (Math.PI / 180)) * dashMaxWidth + startPoint.y
      )
    }
    return pointer
  },

  renderDash(startPoint, endPoint) {
    const start = new paper.Segment(startPoint)
    const pointer = this.getPointWhenBeyondDistance(startPoint, endPoint)
    const end = new paper.Segment(pointer)
    const path = new paper.Path([start, end])
    path.dashArray = [10, 12] //虚线
    path.endPoint = pointer
    this.renderCompass(startPoint, pointer)
    return path
  },

  getAtanAngle(startPoint, endPoint) {
    return Math.round(
      (Math.atan((endPoint.x - startPoint.x) / (endPoint.y - startPoint.y)) * 180) / Math.PI
    )
  },

  // 渲染圆规图片
  renderCompass(startPoint, endPoint) {
    if (!compassRightInstance.instance) {
      compassRightInstance.render(
        {
          height: compassHeight * this.zoom + 'px',
        },
        this.wrapper
      )
    }
    if (!compassLeftInstance.instance) {
      compassLeftInstance.render(
        {
          height: compassHeight * this.zoom + 'px',
        },
        this.wrapper
      )
    }
    if (!compassHeaderInstance.instance) {
      compassHeaderInstance.render(
        {
          height: compassHeaderHeight * this.zoom + 'px',
        },
        this.wrapper
      )
    }
    compassRightInstance.setPosition(
      (endPoint.x - 2) * this.zoom,
      (endPoint.y - compassHeight + 2) * this.zoom
    ) //2 是为了使圆规针尖接近圆心
    compassLeftInstance.setPosition(
      (startPoint.x - 2) * this.zoom,
      (startPoint.y - compassHeight + 2) * this.zoom
    )
    const lengthAB = getDistanceBetweenTwoPoint(startPoint, endPoint)
    const angleA = getAngleByThreeLine(lengthAB, compassHeight, compassHeight)
    const customAngleA = getAngleByThreeLine(lengthAB, compassHeight - 12, compassHeight - 12)
    const angleResetA = this.getAtanAngle(startPoint, endPoint)
    let rotateA = 180 - angleA - angleResetA
    let rotateB = angleA - angleResetA
    let headerDeg = 180 - customAngleA - angleResetA - 90
    if (endPoint.y < startPoint.y) {
      //1,2象限  angleResetA < 0
      rotateA = -angleResetA - angleA
      rotateB = -180 + angleA - angleResetA
      headerDeg = -angleResetA - customAngleA - 90
    }

    const angleC = 180 - 2 * angleA
    const pointHeader = new paper.Point(
      Math.cos(headerDeg * (Math.PI / 180)) * (compassHeight - 12) + startPoint.x,
      Math.sin(headerDeg * (Math.PI / 180)) * (compassHeight - 12) + startPoint.y
    )
    compassHeaderInstance.setPosition(
      pointHeader.x * this.zoom - (36 - 20) / 2,
      (pointHeader.y - compassHeaderHeight) * this.zoom
    )
    compassLeftInstance.rotate(rotateA)
    compassRightInstance.rotate(rotateB)
    compassHeaderInstance.rotate(rotateB + angleC / 2)
  },

  renderPath(origin, end, radian) {
    const point = this.applyStyle(new paper.Shape.Circle(origin, 1))
    const arcInfo = renderArcByRadian(origin, end, radian)
    return new paper.Group([arcInfo.path, point])
  },
})
