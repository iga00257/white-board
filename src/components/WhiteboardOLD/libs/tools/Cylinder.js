import paper, { Path, Point } from 'paper';
import { createShapeTool } from './Tool';

import { toolTypes } from '../const';

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
export default createShapeTool(toolTypes.CYLINDER, {
  renderCylinder(startPoint, endPoint) {
    let ellipse, ellipseClone, line, lineClone; // 当个圆弧
    let vector = endPoint.subtract(startPoint);
    let width = vector.x;

    ellipse = new paper.Shape.Ellipse({
      center: [endPoint.x - width / 2, endPoint.y],
      radius: [width / 2, width / 6],
    });

    ellipseClone = ellipse.clone();
    ellipseClone.translate(new Point(0, -vector.y));

    ellipse.dashArray = [8, 2];

    line = new Path(new Point(startPoint), new Point(startPoint).add(new Point(0, vector.y)));

    lineClone = line.clone().translate(new Point(vector.x, 0));

    let to = endPoint.subtract(new Point(vector.x + 6, 0));

    // dash ellipse
    let rectangle = new Path.Rectangle(to, new paper.Size(Math.abs(width) + 10, Math.abs(width / 6) + 14));

    if (vector.x < 0) {
      rectangle.translate(new Point(vector.x + 6, 0));
    }

    let ellipseSolid = ellipse.clone();
    ellipseSolid.dashArray = [];

    let compoundPath = new paper.Group(rectangle, ellipseSolid);
    compoundPath.clipped = true;

    if (vector.y < 0) {
      const translateVector = new Point(0, -vector.y);
      ellipseClone.translate(new Point(0, vector.y));
      ellipse.translate(translateVector); // dash
      compoundPath.translate(translateVector);
    }

    return new paper.Group([ellipseClone, line, lineClone, ellipse, compoundPath]);
  },

  renderPath(startPoint, endPoint) {
    return this.renderCylinder(startPoint, endPoint);
  },
});
