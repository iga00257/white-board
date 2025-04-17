import paper, { Point } from 'paper';
import { createShapeTool } from './Tool';

import { toolTypes } from '../const';

const XBaseVector = new paper.Point(20, 0);
const itemBaseVector = XBaseVector.rotate(-30); // base vector for add

/**
 * 坐标轴
 *          |
 *          |
 *          |
 *  {-x,-y} |{x, -y}
 * ---------------------> x
 *    {-x,y}|{x,y}
 *          |
 *          |
 *          |
 *          v
 *          y
 * vector 代表向量
 */
export default createShapeTool(toolTypes.CUBOID, {
  renderCuboid(startPoint, endPoint) {
    let tmpStartPoint = startPoint,
      tmpEndPoint = endPoint;
    const vector = endPoint.subtract(startPoint);

    if (vector.x < 0 && vector.y > 0) {
      startPoint = new Point(tmpEndPoint.x, tmpStartPoint.y);
      endPoint = new Point(tmpStartPoint.x, tmpEndPoint.y);
    }

    if (vector.x < 0 && vector.y < 0) {
      startPoint = tmpEndPoint;
      endPoint = tmpStartPoint;
    }

    if (vector.x > 0 && vector.y < 0) {
      startPoint = new Point(tmpStartPoint.x, tmpEndPoint.y);
      endPoint = new Point(tmpEndPoint.x, tmpStartPoint.y);
    }

    const dashArray = [10, 4];
    const frontRectangle = new paper.Path.Rectangle(startPoint, endPoint);
    const cor = endPoint.subtract(startPoint);

    const yVector = itemBaseVector.normalize(cor.y * 2 / 3); // y vector
    const xVector = XBaseVector.normalize(cor.x); // x vector

    const topPath = new paper.Path();
    topPath.add(startPoint);
    topPath.add(startPoint.add(yVector));
    topPath.add(startPoint.add(yVector).add(xVector));
    topPath.add(startPoint.add(xVector));

    topPath.strokeColor = 'blue';
    topPath.strokeWidth = '2';
    topPath.strokeJoin = 'bevel';

    const rightPath = new paper.Path();
    rightPath.add(endPoint);
    rightPath.add(endPoint.add(yVector));
    rightPath.add(startPoint.add(xVector).add(yVector));

    const dashPath1 = new paper.Path();
    dashPath1.add(startPoint.add(yVector));
    dashPath1.add(endPoint.add(yVector).subtract(xVector));
    dashPath1.add(endPoint.add(yVector));
    dashPath1.dashArray = dashArray;

    const dashPath2 = new paper.Path();
    dashPath2.add(endPoint.add(yVector).subtract(xVector));
    dashPath2.add(endPoint.subtract(xVector));
    dashPath2.dashArray = dashArray;

    return new paper.Group([frontRectangle, topPath, rightPath, dashPath1, dashPath2]);
  },

  renderPath(startPoint, endPoint) {
    return this.renderCuboid(startPoint, endPoint);
    // return new paper.Path.Rectangle(startPoint, endPoint);
  },
});
