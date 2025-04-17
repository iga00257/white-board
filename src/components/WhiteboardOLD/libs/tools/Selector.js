import paper from 'paper';
import { createTool } from './Tool';
import store from '../store';
import helperRect from './HelperRect';
import commands from '../commands';
import { actions } from '../const';

import { isInSelectBound, isClose, createDragRect, removeDragRect, antiDir, isValidMouseup } from '../utils';

import { toolTypes } from '../const';
// 缩放时，如果选中项里有图片，就等比缩放
let LOCK_RATIO = false;

const cursor = {
  [actions.MOVE]: 'move',
  [actions.SCALE]: 'pointer',
  text: 'text',
};

export const setCursor = function(mode) {
  const $canvas = document.querySelector('.canvas');
  $canvas && ($canvas.style.cursor = mode ? cursor[mode] : 'default');
};

const hitOptions = {
  segments: true,
  stroke: true,
  curves: true,
  fill: true,
  guide: false,
  tolerance: 5,
};

let hoveredRect;
let createHoverRect = function(bounds) {
  hoveredRect = new paper.Path.Rectangle(bounds);
  hoveredRect.strokeColor = '#009dec';
  hoveredRect.strokeWidth = 1;
  hoveredRect.data.helper = true;
};

let clearHoveredRect = function() {
  if (hoveredRect !== undefined) {
    hoveredRect.remove();
    hoveredRect = undefined;
  }
  paper.view.update();
};

let getManaged = item => {
  if (item && item.data.managed) return item;
  if (!item) return null;
  return getManaged(item.parent);
};

let mode = actions.MOVE;
let helperGroup;
let lastSelected = [];
let corner, pivot, resizeDir, basePoint, realTimeSize, origSize;

export default createTool(toolTypes.SELECTOR, {
  setSelected(val) {
    if (!val) {
      store.removeHelper();
      store.deselectAll();
      // document.querySelector('.canvas').style.cursor = 'none';
    }
  },

  mouseMoveHandler(event) {
    let hitResult = paper.project.hitTest(event.point, hitOptions);
    if (hitResult) {
      if (hitResult !== hoveredRect) clearHoveredRect();

      let hitItem = getManaged(hitResult.item);

      if (hitItem && hitItem.selected === false) {
        createHoverRect(hitResult.item.bounds);
        removeDragRect();
      } else if (hitItem) {
        if (hitItem.data.helper) {
          let action = isClose(hitItem.bounds, event.point);
          if (action.type === actions.SCALE) return setCursor(actions.SCALE);
        }
      }
      return setCursor(actions.MOVE);
    }
    setCursor();
    clearHoveredRect();
  },

  mouseDownHandler(event) {
    if (event.event.button > 0) return; // only first mouse button
    clearHoveredRect();

    let hitResult = paper.project.hitTest(event.point, hitOptions);
    let hitItem = hitResult && getManaged(hitResult.item);

    if (hitResult && hitItem) {
      if (!hitItem.selected) {
        paper.project.deselectAll();
        hitItem.selected = true;
        helperRect.draw([hitItem]);
      }

      if (hitItem.data.helper) {
        let action = isClose(hitItem.bounds, event.point);

        mode = action.type;
        if (mode === actions.SCALE) {
          // 有图片时等比缩放
          LOCK_RATIO = store.selectedItems.some(x => !!x.path.data.url);
          helperGroup = new paper.Group(
            store.selectedItems
              .filter(item => {
                return !item.path.data.textItem;
              })
              .map(item => item.path)
          );
          resizeDir = action.corner;

          helperGroup.addChild(store.helper.path);
          helperGroup.strokeScaling = false;

          corner = helperGroup.bounds[resizeDir];
          pivot = helperGroup.bounds[antiDir[resizeDir]];
          origSize = realTimeSize = corner.subtract(pivot);
        }
      } else {
        mode = actions.MOVE;
      }
    } else {
      paper.project.deselectAll();
      helperRect.remove();
      mode = actions.SELECT;
    }
  },

  mouseDragHandler(event) {
    if (mode === actions.SELECT) {
      createDragRect(event.downPoint, event.point);

      let selected = store.items.filter(
        item => (item.path.selected = isInSelectBound(item.path.bounds, event.downPoint, event.point))
      );

      if (store.diff(selected, lastSelected)) {
        lastSelected = selected;
        helperRect.draw(selected.map(item => item.path));
      }
    } else if (mode === actions.SCALE) {
      corner = corner.add(event.delta);
      let size = corner.subtract(pivot);

      let sx = 1.0,
        sy = 1.0;
      if (Math.abs(realTimeSize.x) > 0.0000001 && resizeDir !== 'topCenter' && resizeDir !== 'bottomCenter')
        sx = size.x / realTimeSize.x;
      if (Math.abs(realTimeSize.y) > 0.0000001 && resizeDir !== 'leftCenter' && resizeDir !== 'rightCenter')
        sy = size.y / realTimeSize.y;

      basePoint = {
        x: pivot.x,
        y: pivot.y,
      };
      if (LOCK_RATIO) {
        helperGroup.scale(sx, sx, basePoint);
      } else {
        helperGroup.scale(sx, sy, basePoint);
      }
      realTimeSize = corner.subtract(pivot);
    } else if (mode === actions.MOVE) {
      store.selectedItems.forEach(item => item.move(event.delta));
      store.helper && store.helper.move(event.delta);
    }
  },

  mouseUpHandler(event) {
    //reset status & fire events
    removeDragRect();

    if (!isValidMouseup(event.downPoint, event.point)) return;

    if (mode === actions.SCALE) {
      let sx = 1.0,
        sy = 1.0;
      if (Math.abs(realTimeSize.x) > 0.0000001 && resizeDir !== 'topCenter' && resizeDir !== 'bottomCenter')
        sx = realTimeSize.x / origSize.x;
      if (Math.abs(realTimeSize.y) > 0.0000001 && resizeDir !== 'leftCenter' && resizeDir !== 'rightCenter')
        sy = realTimeSize.y / origSize.y;

      let scale = {
        sx,
        sy: LOCK_RATIO ? sx : sy,
        basePoint,
      };

      const ids = store.selectedItems.map(item => {
        item.mutateHash(actions.SCALE, scale);
        return item.id;
      });

      commands.send(actions.SCALE, { ids, scale });

      helperGroup.layer && helperGroup.layer.addChildren(helperGroup.children); //release all items out off helper group
      helperGroup.remove();
    } else if (mode === actions.MOVE) {
      const offset = {
        x: event.point.x - event.downPoint.x,
        y: event.point.y - event.downPoint.y,
      };

      const ids = store.selectedItems.map(item => {
        item.mutateHash(actions.MOVE, offset);
        return item.id;
      });
      commands.send(actions.MOVE, { ids, offset });
    }
  },
});
