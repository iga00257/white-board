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
export default createShapeTool(toolTypes.CONE, {
  renderCone(startPoint, endPoint) {
    let ellipse, // 当个圆弧
      line, // 单个边
      radius; // 半径

    let vector = endPoint.subtract(startPoint);
    let width = vector.x;
    let from = new paper.Point(width / 2, 0);
    let to = from.rotate(180);
    radius = new paper.Point(endPoint.x - width / 2, endPoint.y);

    ellipse = new paper.Shape.Ellipse({
      center: [endPoint.x - width / 2, endPoint.y],
      radius: [width / 2, width / 6],
    });
    ellipse.dashArray = [8, 2];

    line = new paper.Path();

    line.add(radius.add(to));
    line.add(startPoint.add(from));
    line.add(endPoint);

    if (vector.y < 0) {
      ellipse.dashArray = [];
      return new paper.Group([ellipse, line]);
    }

    if (vector.y > 0) {
      width = Math.abs(width);
      let rectangle = new Path.Rectangle(
        new Point(startPoint.x - 6, endPoint.y),
        new paper.Size(width + 20, width / 6 + 14)
      );
      vector.x < 0 && rectangle.translate(new Point(vector.x, 0));

      let ellipseSolid = ellipse.clone();
      ellipseSolid.dashArray = [];

      let compoundPath = new paper.Group(rectangle, ellipseSolid);
      compoundPath.clipped = true;

      return new paper.Group([ellipse, line, compoundPath]);
    }
  },

  renderPath(startPoint, endPoint) {
    return this.renderCone(startPoint, endPoint);
  },
});
