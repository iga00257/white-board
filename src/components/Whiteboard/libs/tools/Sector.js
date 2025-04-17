import paper, { Path, Point, Group } from 'paper';
import { createShapeTool, formatToNumber } from './Tool';
import { isValidMouseup } from '../utils';
import commands from '../commands';

import { toolTypes } from '../const';

// 1. 先拉一把
// 2. 按住 alt key
// 3. up 抬起
export default createShapeTool(toolTypes.SECTOR, {
  renderSector(startPoint, endPoint) {
    return new paper.Group([]);
  },
  items: [],
  startLine: null, // start line
  middlePoint: null, //扇形第二个节点
  finished: false,

  draw(hash) {
    const [startPoint, endPoint, middlePoint_c] = hash[2];

    let path = this.render(new paper.Point(startPoint), new paper.Point(endPoint), new paper.Point(middlePoint_c));

    this.applyStyle(path, hash[3]);
    /**
     * custom data json store startpoint & end point of this shape
     */
    path.data.json = [startPoint, endPoint, middlePoint_c];
    return this.createInstance(path, hash[1], hash[3]);
  },

  mouseDragHandler(event) {
    const altDowned = event.modifiers.alt;
    const startPoint = event.downPoint,
      endPoint = event.point;

    // 如果 ALT 没有按下并且数组里只有两个点的时候
    if (!altDowned && this.items.length <= 2) {
      this.eventItem && this.eventItem.remove();
    }

    if (altDowned) {
      this.eventItem && this.eventItem.remove();
    }

    if (altDowned && !this.middlePoint && this.startLine) {
      this.middlePoint = event.point;
    }

    if (altDowned && this.middlePoint) {
      this.items = [startPoint, endPoint, this.middlePoint];
      this.eventItem = this.drawSector(startPoint, endPoint, this.middlePoint);
      this.finished = true;
      this.startPoint = startPoint;
      this.endPoint = endPoint;
      return this.applyStyle(this.eventItem);
    }

    if (!altDowned && !this.middlePoint) {
      this.startLine = new Path(startPoint, endPoint); // start line
      this.eventItem = this.startLine;
      this.items = [startPoint, endPoint];
      this.applyStyle(this.eventItem);
    }
  },

  render(startPoint, endPoint, _middlePoint) {
    if (startPoint && endPoint && _middlePoint) {
      let eventItem = this.drawSector(startPoint, endPoint, _middlePoint);
      return this.applyStyle(eventItem);
    }
    return null;
  },

  drawSector(_s, _e, _m) {
    let startVector = _m.subtract(_s),
      endVector = _e.subtract(_s);
    let _startLine = new Path(_s, _m);
    let endAngle = endVector.angle,
      startAngle = startVector.angle;
    if (endAngle < 0) {
      endAngle = 360 + endVector.angle;
    }
    if (startAngle < 0) {
      startAngle = 360 + startVector.angle;
    }

    let angle = endAngle - startAngle; // 角度差

    let pathEnd = _startLine.clone().rotate(angle, _s); // end line
    let through = startVector.rotate(angle / 2); // through point

    let endPointNormalize = endVector.normalize(startVector.length);
    let endPointArc = _s.add(endPointNormalize); //
    let Arc = new Path.Arc(_m, _s.add(through), endPointArc);

    let eventItem = new Group([_startLine, pathEnd, Arc]);
    eventItem.strokeJoin = 'bevel';
    eventItem.strokeCap = 'square';
    return eventItem;
  },

  mouseUpHandler(event) {
    if (!this.eventItem) return;

    if (this.eventItem === this.startLine) {
      this.eventItem && this.eventItem.remove();
      this.eventItem = null;
      this.items = [];
      return;
    }

    if (!isValidMouseup(event.downPoint, event.point)) {
      this.eventItem.remove();
      this.eventItem = null;
      this.middlePoint = null;
      this.startLine = null; // start line
      this.items = [];
      return;
    }
    this.sendMessage();
  },

  sendMessage() {
    let startPoint = this.startPoint,
      endPoint = this.endPoint;
    if (startPoint && endPoint) {
      this.eventItem.data.json = [
        [formatToNumber(startPoint.x), formatToNumber(startPoint.y)],
        [formatToNumber(endPoint.x), formatToNumber(endPoint.y)],
        [formatToNumber(this.middlePoint.x), formatToNumber(this.middlePoint.y)],
      ];

      commands.send('ADD', [this.createInstance(this.eventItem)]);
    }
    this.eventItem = null;
    this.middlePoint = null;
    this.startLine = null; // start line
    this.startPoint = null;
    this.endPoint = null;
    this.items = [];
  },
});
