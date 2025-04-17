import paper from 'paper';
import { createShapeTool } from './Tool';

import { toolTypes } from '../const';

paper.Shape.ArrowLine = function(sx, sy, ex, ey) {
  function calcArrow(px0, py0, px, py) {
    let points = [];
    let l = Math.sqrt(Math.pow(px - px0, 2) + Math.pow(py - py0, 2));
    points[0] = px - ((px - px0) * Math.cos(0.5) - (py - py0) * Math.sin(0.5)) * 10 / l;
    points[1] = py - ((py - py0) * Math.cos(0.5) + (px - px0) * Math.sin(0.5)) * 10 / l;
    points[2] = px - ((px - px0) * Math.cos(0.5) + (py - py0) * Math.sin(0.5)) * 10 / l;
    points[3] = py - ((py - py0) * Math.cos(0.5) - (px - px0) * Math.sin(0.5)) * 10 / l;
    return points;
  }

  let endPoints = calcArrow(sx, sy, ex, ey);

  let e0 = endPoints[0],
    e1 = endPoints[1],
    e2 = endPoints[2],
    e3 = endPoints[3];

  let line = new paper.Path({
    segments: [new paper.Point(sx, sy), new paper.Point(ex, ey)],
    strokeWidth: 1,
  });
  let arrow = new paper.Path({
    segments: [new paper.Point(e0, e1), new paper.Point(ex, ey), new paper.Point(e2, e3)],
    closed: true,
  });

  return new paper.Group([line, arrow]);
};

export default createShapeTool(toolTypes.ARROW, {
  renderPath(start, end) {
    return new paper.Shape.ArrowLine(start.x, start.y, end.x, end.y);
  },
});
