/**
 * manage all tools of white board.
 */

import Ellipse from './Ellipse';
import Rectangle from './Rectangle';
import Triangle from './Triangle';
import Pen from './Pen';
import Selector from './Selector';
import Arrow from './Arrow';
import Line from './Line';
import Pointer from './Pointer';
import Text from './Text';
import HelperRect from './HelperRect';
import Marker from './Marker';
import Eraser from './Eraser';
import Image from './Image';
import Dashed from './Dashed';
import RightTriangle from './RightTriangle';
import Circle from './Circle';
import Noop from './Noop';
import MOVER from './mover';
import Click from './Click';
import Cone from './Cone';
import Cuboid from './Cuboid';
import Cylinder from './Cylinder';
import Sector from './Sector';
import { toolTypes } from '../const';

const tools = {};
let currentTool = Selector;

//add tool
const register = function register(toolList, canvas, textContainer, options) {
  for (var i = 0, len = toolList.length; i < len; i++) {
    var tool = toolList[i];
    tool.canvas = canvas;
    tool.wrapper = options.wrapper;
    tool.zoom = options.zoom;
    tool.textContainer = textContainer;
    tools[tool.type] = tool;
  }
};

//
export default {
  init(canvas, textContainer, options) {
    register(
      [
        Selector,
        Triangle,
        Line,
        Arrow,
        Pen,
        Ellipse,
        Rectangle,
        Pointer,
        Text,
        HelperRect,
        Marker,
        Eraser,
        Image,
        Noop,
        Dashed,
        RightTriangle,
        Circle,
        MOVER,
        Click,
        Cone,
        Cuboid,
        Cylinder,
        Sector,
      ],
      canvas,
      textContainer,
      options
    );
  },

  /**
   * //还原到以基数为准的倍数，因为白板是按照上一次的结果为基数，
   * 而text的 input position 却不可以，其实也可以只在text tool中写入zoom
   */
  setZoom(zoom) {
    for (let tool in tools) {
      // if (tools[tool].zoom) {
      //   tools[tool].zoom = tools[tool].zoom * zoom;
      // } else {
      tools[tool].zoom = zoom;
      // }
    }
  },

  get(type) {
    return tools[type] || {};
  },

  get tools() {
    return tools;
  },

  setCurrentTool(val, style) {
    // Set tool & update the view;
    // if (currentTool.type === val.tool) return;
    currentTool.setSelected(false);
    currentTool = this.get(val.tool);

    currentTool.setStyle({
      strokeWidth: val.strokeWidth || 5,
      strokeColor: val.strokeColor || 'red',
      fontSize: val.fontSize || 20,
      fillColor: val.tool === toolTypes.ARROW || val.fill ? val.strokeColor || 'red' : null,
      fontLanguage: val.tool === toolTypes.TEXT ? val.fontLanguage : null,
    });
    currentTool.setSelected(true);
    if (typeof currentTool.setTheme === 'function' && val.theme) {
      currentTool.setTheme(val.theme);
    }
  },

  get currentTool() {
    return currentTool;
  },
};
