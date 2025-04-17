/**
 * paper.js Utilities for core drawing functionalities
 */
import paper from 'paper'

let dragRect
/**
 * Draw drag helper line
 */
export function createDragRect(start, end, color) {
  dragRect && dragRect.remove()
  dragRect = new paper.Path.Rectangle({
    from: start,
    to: end,
    strokeColor: color ? color : '#ccc',
    strokeWidth: 1,
    dashArray: [5, 2],
  })

  dragRect.data.isDragBound = true
  dragRect.data.isHelperItem = true
}

export function removeDragRect() {
  dragRect && dragRect.remove()
  dragRect = null
}

const threshold = 3
/**
 * Check if mouse event is valid when mouseup
 */
export function isValidMouseup(start, end) {
  return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)) > threshold
}

/**
 * Check if point is within boundary
 */
export function isInBoundary(point, boundary) {
  return 0 <= point.x && point.x <= boundary.width && 0 <= point.y && point.y <= boundary.height
}

export const antiDir = {
  bottomRight: 'topLeft',
  topLeft: 'bottomRight',
  bottomLeft: 'topRight',
  topRight: 'bottomLeft',
  rightCenter: 'leftCenter',
  leftCenter: 'rightCenter',
  bottomCenter: 'topCenter',
  topCenter: 'bottomCenter',
}

/**
 * Check if point is close to boundary corners
 */
export function isClose(bound, point, torrance = 5) {
  let p = new paper.Point(point)
  if (p.isClose({ x: bound.x, y: bound.y }, torrance)) {
    return {
      type: 'SCALE',
      corner: 'topLeft',
    }
  } else if (p.isClose({ x: bound.x + bound.width, y: bound.y }, torrance)) {
    return {
      type: 'SCALE',
      corner: 'topRight',
    }
  } else if (p.isClose({ x: bound.x + bound.width, y: bound.y + bound.height }, torrance)) {
    return {
      type: 'SCALE',
      corner: 'bottomRight',
    }
  } else if (p.isClose({ x: bound.x, y: bound.y + bound.height }, torrance)) {
    return {
      type: 'SCALE',
      corner: 'bottomLeft',
    }
  } else if (p.isClose({ x: bound.x + bound.width / 2, y: bound.y + bound.height }, torrance)) {
    return {
      type: 'SCALE',
      corner: 'bottomCenter',
    }
  } else if (p.isClose({ x: bound.x + bound.width / 2, y: bound.y }, torrance)) {
    return {
      type: 'SCALE',
      corner: 'topCenter',
    }
  } else if (p.isClose({ x: bound.x, y: bound.y + bound.height / 2 }, torrance)) {
    return {
      type: 'SCALE',
      corner: 'leftCenter',
    }
  } else if (p.isClose({ x: bound.x + bound.width, y: bound.y + bound.height / 2 }, torrance)) {
    return {
      type: 'SCALE',
      corner: 'rightCenter',
    }
  }

  return {
    type: 'MOVE',
  }
}

/**
 * Draw grid-baseline
 */
export function drawGrid(hDivide, vDivide, bounds) {
  let cellWidth = bounds.width / hDivide
  let cellHeight = bounds.height / vDivide
  let pathGroup = []

  for (let i = 0; i <= hDivide; i++) {
    let xPos = bounds.left + i * cellWidth
    let topPoint = new paper.Point(xPos, bounds.top)
    let bottomPoint = new paper.Point(xPos, bounds.bottom)
    let aLine = new paper.Path.Line(topPoint, bottomPoint)
    aLine.strokeColor = 'black'
    aLine.strokeColor.alpha = 0.15
    pathGroup.push(aLine)
  }

  for (let i = 0; i <= vDivide; i++) {
    let yPos = bounds.top + i * cellHeight
    let leftPoint = new paper.Point(bounds.left, yPos)
    let rightPoint = new paper.Point(bounds.right, yPos)
    let aLine = new paper.Path.Line(leftPoint, rightPoint)
    aLine.strokeColor = 'black'
    aLine.strokeColor.alpha = 0.15
    pathGroup.push(aLine)
  }

  return new paper.Group(pathGroup)
}

/**
 * Get all paper.js items
 */
export function getAllPaperItems() {
  var allItems = []
  for (var i = 0; i < paper.project.layers.length; i++) {
    var layer = paper.project.layers[i]
    for (var j = 0; j < layer.children.length; j++) {
      var child = layer.children[j]
      allItems.push(child)
    }
  }
  return allItems
}

/**
 * Check if bound is within selection area
 */
export function isInSelectBound(bound, startPoint, endPoint) {
  let minX = startPoint.x < endPoint.x ? startPoint.x : endPoint.x
  let maxX = startPoint.x > endPoint.x ? startPoint.x : endPoint.x
  let minY = startPoint.y < endPoint.y ? startPoint.y : endPoint.y
  let maxY = startPoint.y > endPoint.y ? startPoint.y : endPoint.y

  if (bound.x < minX || bound.x > maxX || bound.y < minY || bound.y > maxY) return false
  if (
    bound.x + bound.width < minX ||
    bound.x + bound.width > maxX ||
    bound.y + bound.height < minY ||
    bound.y + bound.height > maxY
  )
    return false

  return true
}

/**
 * Check if point is on selection boundary
 */
export function isOnSelectBound(bound, point) {
  const { x, y } = point
  const check1 = Math.abs(x - bound.x) <= 10 && bound.y + bound.height >= y && y >= bound.y
  const check2 =
    Math.abs(x - (bound.x + bound.width)) <= 10 && bound.y + bound.height >= y && y >= bound.y
  const check3 = Math.abs(y - bound.y) <= 10 && bound.x + bound.width >= x && x >= bound.x
  const check4 =
    Math.abs(y - (bound.y + bound.height)) <= 10 && bound.x + bound.width >= x && x >= bound.x
  return check1 || check2 || check3 || check4
}

/**
 * Get distance between two points
 */
export function getDistanceBetweenTwoPoint(startPoint = { x: 0, y: 0 }, endPoint = { x: 0, y: 0 }) {
  return Math.sqrt(Math.pow(startPoint.x - endPoint.x, 2) + Math.pow(startPoint.y - endPoint.y, 2))
}

/**
 * Get angle between three points
 */
export function getAngleByThreePoint(
  p1 = { x: 0, y: 0 },
  p2 = { x: 0, y: 0 },
  p3 = { x: 0, y: 0 }
) {
  function getAngle(x, y) {
    const v = Math.atan2(y, x)
    if (v < 0) return v + 2 * Math.PI
    return v
  }
  const p12AngleOffset = getAngle(p2.x - p1.x, p2.y - p1.y)
  const p13AngleOffset = getAngle(p3.x - p1.x, p3.y - p1.y)

  if (Math.PI / 2 > p13AngleOffset && p12AngleOffset > (3 * Math.PI) / 2) {
    return p13AngleOffset + 2 * Math.PI - p12AngleOffset
  }
  if (p13AngleOffset > (3 * Math.PI) / 2 && p12AngleOffset < Math.PI / 2) {
    return -(p12AngleOffset + 2 * Math.PI - p13AngleOffset)
  }
  return p13AngleOffset - p12AngleOffset
}
