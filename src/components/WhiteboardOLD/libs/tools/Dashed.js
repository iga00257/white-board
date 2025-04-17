import paper from 'paper';
import { createShapeTool } from './Tool';
import { toolTypes } from '../const';

export default createShapeTool(toolTypes.DASHED, {
  renderPath(startPoint, endPoint) {
    const start = new paper.Segment(endPoint);
    const end = new paper.Segment(startPoint);
    const path = new paper.Path([start, end]);
    path.dashArray = [10, 12]; //虚线
    return path;
  },
});
