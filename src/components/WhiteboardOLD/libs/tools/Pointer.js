import paper from 'paper';
import { createTool } from './Tool';
import commands from '../commands';

import { toolTypes } from '../const';
import pointer from '@/assets/images/mouse_pointer.png';

import regulator from '@decorators/regulator';
import throttle from '@decorators/throttle';

import { createDragRect, removeDragRect, MouseImage } from '../utils';
import context from '@libs/context';

let mouseInstance = new MouseImage('pointer', pointer);

export default createTool(toolTypes.POINTER, {
  move(hash) {
    if (hash.length === 0) {
      this.remove(true);
      return false;
    }
    let pointerIMGUrl = pointer;
    context.theme && context.theme.pointer && (pointerIMGUrl = context.theme.pointer);
    mouseInstance = new MouseImage('pointer', pointerIMGUrl);
    if (!mouseInstance.instance) {
      mouseInstance.render({}, this.wrapper);
      mouseInstance.setInstanceWidth(40);
    }
    let pointerX = hash[0] * this.zoom;
    let pointerY = hash[1] * this.zoom;
    pointerX += 3;
    pointerY -= 10;
    mouseInstance.setPosition(pointerX, pointerY);
    if (hash[2]) {
      createDragRect(new paper.Point(hash[2][0], hash[2][1]), new paper.Point(hash[0], hash[1]), '#F1293B');
    }
  },

  onMove(point, downPoint) {
    const { x, y } = point;
    this.move([x, y, downPoint]);
    this.getPosition(point, downPoint);
  },

  @throttle(100)
  getPosition(point, downPoint) {
    const { x, y } = point;
    let data = downPoint
      ? [Number(x.toFixed(0)), Number(y.toFixed(0)), downPoint]
      : [Number(x.toFixed(0)), Number(y.toFixed(0))];
    this.sendData(data);
  },

  @regulator(1000)
  sendData(data) {
    commands.send('POINTER', data, true);
  },

  setSelected(val) {
    if (!val) this.remove();
  },

  remove(ignore) {
    try {
      mouseInstance.remove();
    } catch (e) {}
    removeDragRect();
    !ignore && this.sendData([]);
  },

  mouseMoveHandler(event) {
    this.onMove(event.point);
  },

  // mouseUpHandler(event) {
  //   removeDragRect();
  // },

  mouseDownHandler() {
    removeDragRect();
    this.sendData([]);
  },

  mouseDragHandler(event) {
    // createDragRect(event.downPoint, event.point, '#F1293B');
    this.onMove(event.point, [Number(event.downPoint.x.toFixed(0)), Number(event.downPoint.y.toFixed(0))]);
  },
});
