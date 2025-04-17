/**
 * internal tool to handle helper reatangle(辅助线矩形, 用于resize和显示选择边界).
 */
import paper from 'paper';
import { createShapeTool } from './Tool';
import store from '../store';

let boundsPath = null;

export default createShapeTool('HelperRect', {
  draw(items) {
    this.remove();
    if (items.length <= 0) return;

    let rect;
    items.forEach(item => {
      if (rect) {
        rect = rect.unite(item.bounds);
      } else {
        rect = item.bounds;
      }
    });

    let startPoint = {
      x: rect.x,
      y: rect.y,
    };

    let endPoint = {
      x: rect.x + rect.width,
      y: rect.y + rect.height,
    };

    let path = this.render(startPoint, endPoint);

    return (store.helper = this.createInstance(path));
  },

  render(startPoint, endPoint) {
    if (!boundsPath) {
      boundsPath = new paper.Path.Rectangle(startPoint, endPoint);

      boundsPath.curves[0].divideAtTime(0.5);
      boundsPath.curves[2].divideAtTime(0.5);
      boundsPath.curves[4].divideAtTime(0.5);
      boundsPath.curves[6].divideAtTime(0.5);
    }

    boundsPath.data.helper = true;
    boundsPath.data.managed = true; // marked as managed by whiteboard;
    boundsPath.strokeColor = '#009dec';
    boundsPath.strokeScaling = false;
    boundsPath.fullySelected = true;

    return boundsPath;
  },

  remove() {
    boundsPath && boundsPath.remove();
    store.helper = null;
    boundsPath = null;
  },
});
