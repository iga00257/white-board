import paper from 'paper';
import { createShapeTool } from './Tool';

import { toolTypes } from '../const';

export default createShapeTool(toolTypes.ELLIPSE, {
  renderPath(startPoint, endPoint) {
    return new paper.Path.Ellipse(startPoint, endPoint);
  },
});
