import { createFreeHandTool } from './Tool'
import { toolTypes } from '../const'
import penPointer from '@/assets/images/pen.png'
import { MouseImage } from '../utils'

let mouseInstance = new MouseImage('pen', penPointer)

export default createFreeHandTool(toolTypes.PEN, {
  handMove(hash) {
    if (!mouseInstance.instance) {
      mouseInstance.render({}, this.wrapper)
    }
    let pointerX = hash[0] * this.zoom
    let pointerY = hash[1] * this.zoom
    pointerX += 3
    pointerY -= 22 //pen 图片的偏移 使笔尖对准轨迹
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
