/**
 * paper.js Utilities
 */
import paper from 'paper'
import axios from 'axios'
import { actions } from './const'
import host from '@utils/url'
import { textLanguage } from '@constants/whiteboard'

let materialBoundTopRight = 0

let dragRect
/**
 * 绘制拖拽辅助线
 * @param {*} start
 * @param {*} end
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
 * 判断当mouseup时, 整串mouse事件是否有效
 * @param {*} start
 * @param {*} end
 */
export function isValidMouseup(start, end) {
  return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)) > threshold
}

/**
 * 判断点是否在边界内
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
 * 获取point是否靠近边界的四个角，并返回靠近哪一个角
 * @param {object} bound 边界 {x, y, width, height}
 * @param {object} point 点，{x, y}
 * @param {object} torrance 阈值
 */
export function isClose(bound, point, torrance = 5) {
  let p = new paper.Point(point)
  if (
    p.isClose(
      {
        x: bound.x,
        y: bound.y,
      },
      torrance
    )
  ) {
    return {
      type: actions.SCALE,
      corner: 'topLeft',
    }
  } else if (
    p.isClose(
      {
        x: bound.x + bound.width,
        y: bound.y,
      },
      torrance
    )
  ) {
    return {
      type: actions.SCALE,
      corner: 'topRight',
    }
  } else if (
    p.isClose(
      {
        x: bound.x + bound.width,
        y: bound.y + bound.height,
      },
      torrance
    )
  ) {
    return {
      type: actions.SCALE,
      corner: 'bottomRight',
    }
  } else if (
    p.isClose(
      {
        x: bound.x,
        y: bound.y + bound.height,
      },
      torrance
    )
  ) {
    return {
      type: actions.SCALE,
      corner: 'bottomLeft',
    }
  } else if (
    p.isClose(
      {
        /* DO NOT DELETE !need fix bug on h & v direction SCALE*/
        x: bound.x + bound.width / 2,
        y: bound.y + bound.height,
      },
      torrance
    )
  ) {
    return {
      type: actions.SCALE,
      corner: 'bottomCenter',
    }
  } else if (
    p.isClose(
      {
        x: bound.x + bound.width / 2,
        y: bound.y,
      },
      torrance
    )
  ) {
    return {
      type: actions.SCALE,
      corner: 'topCenter',
    }
  } else if (
    p.isClose(
      {
        x: bound.x,
        y: bound.y + bound.height / 2,
      },
      torrance
    )
  ) {
    return {
      type: actions.SCALE,
      corner: 'leftCenter',
    }
  } else if (
    p.isClose(
      {
        x: bound.x + bound.width,
        y: bound.y + bound.height / 2,
      },
      torrance
    )
  ) {
    return {
      type: actions.SCALE,
      corner: 'rightCenter',
    }
  }

  /* DO NOT DELETE !need fix bug on h & v direction SCALE*/
  return {
    type: actions.MOVE,
  }
}

/**
 * Draw grid-baseline of paper.js canvas.
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

    let text = new paper.PointText(new paper.Point(xPos + 10, 10))
    text.justification = 'center'
    text.fillColor = 'black'
    // text.fillColor.alpha = 0.15;
    text.content = parseInt(i * cellWidth, 10)
    text.fontSize = 9

    pathGroup.push(aLine, text)
  }

  for (let i = 0; i <= vDivide; i++) {
    let yPos = bounds.top + i * cellHeight
    let leftPoint = new paper.Point(bounds.left, yPos)
    let rightPoint = new paper.Point(bounds.right, yPos)
    let aLine = new paper.Path.Line(leftPoint, rightPoint)
    aLine.strokeColor = 'black'
    aLine.strokeColor.alpha = 0.15

    let text = new paper.PointText(new paper.Point(10, yPos))
    text.justification = 'center'
    text.fillColor = 'black'
    // text.fillColor.alpha = 0.15;
    text.content = parseInt(i * cellHeight, 10)
    text.fontSize = 9

    pathGroup.push(aLine, text)
  }
  return new paper.Group(pathGroup)
}

export function appendMaterial(source, point, onLocalCallback) {
  if (!source) return
  let item = new paper.Raster({
    source,
    crossOrigin: 'anonymous',
    position: new paper.Point(point),
  })
  const resetItem = (w, h) => {
    const { width: widthM, height: heightM } = getMaterialInfo()
    const point = new paper.Point(0, 0)
    const width = w || widthM
    const height = h || heightM
    item.position = new paper.Point(width / 2, height / 2)
    // 如果教材为竖行教材
    if (width / height <= 1) {
      item.scale(heightM / height, point)
    } else {
      item.scale(widthM / width, point)
    }

    materialBoundTopRight = item.bounds.topRight

    // HACK: wait for image has been draw
    onLocalCallback && requestAnimationFrame(() => onLocalCallback(source))
  }
  item.onLoad = data => {
    if (!data.event) {
      const img = new Image()
      img.src = source
      img.onload = e => {
        resetItem(e.target.width, e.target.height)
      }
      return
    }
    resetItem(data.event.target.width, data.event.target.height)
  }

  item.onError = error => {
    console.warn('material load failed!')
    onLocalCallback && requestAnimationFrame(() => onLocalCallback(source, error))
  }
  item.sendToBack()

  return item
}

/**
 * 添加水印 原服务端的水印取消了
 * @param {*} pointer
 */
export function appendWatermark(source) {
  let item = new paper.Raster({
    source,
    crossOrigin: 'anonymous',
  })
  item.onLoad = data => {
    const watermarkWidth = item.width
    const watermarkHeight = item.height
    const marginRight = 15
    const marginTop = 12
    const topRightPositionX = materialBoundTopRight._x - watermarkWidth / 2 - marginRight
    const positionY = watermarkHeight / 2 + marginTop

    item.position = new paper.Point(topRightPositionX, positionY)
  }
  return item
}

/**
 * 获取边界是否在起止点之内
 *
 * @param {object} bound 边界 {sx, sy, ex, ey}
 * @param {object} startPoint 起始点 {x, y}
 * @param {object} endPoint 终止点 {x, y}
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
 * 获取paper.js 所有的item.
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

export function getDistanceBetweenTwoPoint(startPoint = { x: 0, y: 0 }, endPoint = { x: 0, y: 0 }) {
  return Math.sqrt(Math.pow(startPoint.x - endPoint.x, 2) + Math.pow(startPoint.y - endPoint.y, 2))
}

export function getAngleByThreeLine(ab, ac, bc) {
  //求 A 角
  const cosA = (Math.pow(ab, 2) + Math.pow(ac, 2) - Math.pow(bc, 2)) / (2 * ab * ac)
  return (Math.acos(cosA) * 180) / Math.PI
}

/**
 * @param { object } p1 { x: 0, y: 0 } center
 * @param { object } p2 { x: 0, y: 0 } start point
 * @param { object } p3 { x: 0, y: 0 } end point
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
    //针对一条边与x轴夹角359 另一边1 类似的情况
    return p13AngleOffset + 2 * Math.PI - p12AngleOffset
  }
  if (p13AngleOffset > (3 * Math.PI) / 2 && p12AngleOffset < Math.PI / 2) {
    return -(p12AngleOffset + 2 * Math.PI - p13AngleOffset)
  }
  return p13AngleOffset - p12AngleOffset
}

/**
 *  使用图片作为鼠标点
 */
export class MouseImage {
  constructor(className, imageUrl) {
    this.instance = null
    this.className = className
    this.imageUrl = imageUrl
  }

  render = (initStyle = {}, wrapper) => {
    const { className, imageUrl } = this
    let pre = document.querySelector('.whiteboard-pointer')
    pre && wrapper.removeChild(pre)
    this.instance = document.createElement('div')
    this.instance.setAttribute('class', `whiteboard-${className} mouse-image`)
    let img = document.createElement('img')
    img.setAttribute('src', this.nextImg || imageUrl)
    img.setAttribute('draggable', false)
    img.classList.add('img')
    wrapper.appendChild(this.instance)
    this.instance.appendChild(img)
    for (const key in initStyle) {
      this.instance.style[key] = initStyle[key]
    }
  }

  changeImage = img => {
    this.nextImg = img
  }

  setPosition = (left = 0, top = 0) => {
    let { instance } = this
    if (!instance) return false
    instance.style.left = left + 'px'
    instance.style.top = top + 'px'
  }

  remove = () => {
    this.instance.parentNode.removeChild(this.instance)
    this.instance = null
  }

  setInstanceWidth(width) {
    this.instance.style.width = `${width}px`
  }

  rotate(deg, origin = 'bottom center') {
    if (!this.instance) return
    this.instance.style.transform = `rotate(${deg}deg)`
    this.instance.style['transform-origin'] = origin
  }
}

export class Breath {
  constructor(wrapper) {
    if (!wrapper) return
    this.wrapper = wrapper
    this.$breath = document.createElement('div')
    this.$breath.classList.add('breath-wrapper')
    const $breathInner = document.createElement('div')
    $breathInner.classList.add('breath')
    this.$breath.appendChild($breathInner)
    this.wrapper.appendChild(this.$breath)
    this.wrapperInfo = this.wrapper.getBoundingClientRect()
  }

  get isHide() {
    return this.$breath.classList.contains('hide')
  }

  remove() {
    this.wrapper.removeChild(this.$breath)
  }

  hide() {
    this.$breath.classList.add('hide')
  }

  show() {
    this.$breath.classList.remove('hide')
  }
  setPosition({ left, top }) {
    this.$breath.style.left = left
    this.$breath.style.top = top
  }
}

export const getTransformPinyin = (type, paramData) => {
  let transformUrl = type === 'pinyin' ? host.transformPinyinUrl : host.transformPinyinTranslateUrl
  return axios({
    method: 'post',
    url: host.forward,
    data: {
      method: 'post',
      url: transformUrl,
      body: JSON.stringify(paramData),
    },
  })
    .then(res => res.data)
    .then(res => {
      if (!res.code) {
        return Promise.resolve(res.data)
      } else {
        return Promise.reject(res)
      }
    })
}

export const getTransformPinZin = paramData => {
  return axios({
    method: 'post',
    url: host.forward,
    data: {
      method: 'post',
      url: host.transformPinZinUrl,
      body: JSON.stringify(paramData),
    },
  })
    .then(res => res.data)
    .then(res => {
      if (!res.code) {
        return Promise.resolve(res.data)
      } else {
        return Promise.reject(res)
      }
    })
}

export const transformPinyin = (fontLanguage, text, cb) => {
  let outPutType = '',
    fontLanguageType = ''
  switch (fontLanguage) {
    case textLanguage.Simplified_Chinese:
      outPutType = ''
      break
    case textLanguage.Traditional_Chinese:
      outPutType = 'tradpinyin'
      break
    case textLanguage.Simplified_Chinese_pinyin:
      outPutType = ''
      fontLanguageType = 'pinyin'
      break
    case textLanguage.Traditional_Chinese_pinyin:
      outPutType = 'tradpinyin'
      fontLanguageType = 'pinyin'
      break
    default:
      break
  }
  getTransformPinyin(fontLanguageType, {
    outPutType,
    text,
  })
    .then(data => {
      cb && cb(data)
    })
    .catch(e => {
      throw new Error(`${e} transform pinyin got error`)
    })
}

export const transformPinZin = (fontLanguage, text, cb) => {
  let fontType = 0,
    outPutType = 0

  switch (fontLanguage) {
    case textLanguage.Traditional_Chinese:
      fontType = 1
      break
    case textLanguage.Simplified_Chinese:
      fontType = 2
      break
    case textLanguage.Traditional_Chinese_pinyin:
      fontType = 1
      outPutType = 1
      break
    case textLanguage.Traditional_Chinese_zhuyin:
      fontType = 1
      outPutType = 2
      break
    case textLanguage.Simplified_Chinese_pinyin:
      fontType = 2
      outPutType = 1
      break
    case textLanguage.Simplified_Chinese_zhuyin:
      fontType = 2
      outPutType = 2
      break
    default:
      break
  }
  getTransformPinZin({
    fontType,
    outPutType,
    text,
  })
    .then(data => {
      cb && cb(data)
    })
    .catch(e => {
      throw new Error(`${e} transform pinyin got error`)
    })
}
