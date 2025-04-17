import paper from 'paper';
import { createShapeTool } from './Tool';

import { toolTypes } from '../const';

export default createShapeTool(toolTypes.RIGHTTRIANGLE, {
  renderPath(startPoint, endPoint) {
    let path = new paper.Path(endPoint);
    path.lineTo(startPoint.x, endPoint.y);
    path.lineTo(startPoint.x, startPoint.y);
    path.lineTo(endPoint.x, endPoint.y);
    path.closed = true;

    return path;
  },
});
