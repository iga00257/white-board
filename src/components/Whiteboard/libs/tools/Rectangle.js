import paper from 'paper';
import { createShapeTool } from './Tool';

import { toolTypes } from '../const';
export default createShapeTool(toolTypes.RECTANGLE, {
  renderPath(startPoint, endPoint) {
    return new paper.Path.Rectangle(startPoint, endPoint);
  },
});
