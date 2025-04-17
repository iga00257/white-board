import paper from 'paper';
import { createShapeTool } from './Tool';

import { toolTypes } from '../const';

export default createShapeTool(toolTypes.TRIANGLE, {
  renderPath(startPoint, endPoint) {
    let path = new paper.Path(endPoint);
    path.lineTo(startPoint.x, endPoint.y);
    path.lineTo((startPoint.x + endPoint.x) / 2, startPoint.y);
    path.lineTo(endPoint.x, endPoint.y);
    path.closed = true;

    return path;
  },
});
