//entry of whiteborad
import paper, { Layer } from 'paper';
import store from './store';
import tools from './tools';
import commands from './commands';
import { drawGrid, appendMaterial, appendWatermark } from './utils';
import { toolTypes } from './const';
import { userLogger } from '@libs/analysis/loglake';
import { WHITEBOARD_TOOL } from '@libs/analysis/code';
import { getParameterByName } from '@utils/url';

const TOKEN = getParameterByName('token');
const keyModifiers = {};
let currentSlide = null;
let watermarkLayer = null;
let toolAvailable = true;

let whiteboard = {
  init(canvas, textContainer, options) {
    paper.setup(canvas);

    tools.init(canvas, textContainer, options);
    commands.init();
    this.commands = commands;
    this.watermark = options.watermark;
    this.options = options;

    if (typeof options.zoom === 'number') {
      paper.view.scale(options.zoom, paper.view.bounds.topLeft);
    }

    paper.view.viewSize = new paper.Size(options.width, options.height);
    const mouseTool = new paper.Tool();
    if (!!ISSTORYBOOK) {
      drawGrid(40, 40, paper.view.bounds);
    }

    // mouseTool.minDistance = 3; //reduce the frequency of 'mousemove' & 'mousedrag'.
    mouseTool.onMouseMove = this.mouseMoveHandler;
    mouseTool.onMouseDown = this.mouseDownHandler;
    mouseTool.onMouseUp = this.mouseUpHandler;
    mouseTool.onKeyDown = this.keyDownHandler;
    mouseTool.onKeyUp = this.keyUpHandler;
    // paper.view.onMouseLeave = this.mouseUpHandler; //leave 事件中 event少一个downpoint
    this._canvas = canvas;
    mouseTool.onMouseDrag = this.mouseDragHandler;
  },

  set zoom({ zoom, pre }) {
    tools.setZoom(zoom);
    paper.view.scale(zoom / pre, paper.view.bounds.topLeft); //放大倍数是基于现在的  并不是基于初始的1000
    paper.view.viewSize = new paper.Size(this.options.width * zoom, this.options.height * zoom);
    store.items
      .filter(item => item && !!item.path.data.textItem)
      .forEach(item => {
        item.updatePosition();
      });
  },

  setToolZoom(val) {
    tools.setZoom(val);
    store.items
      .filter(item => {
        return item.path.data.textItem;
      })
      .forEach(item => {
        item.updatePosition();
      });
  },

  get currentTool() {
    return tools.currentTool;
  },

  set action(val) {
    commands[val]();
  },

  set tool(val) {
    userLogger(WHITEBOARD_TOOL, { t: TOKEN, tool: val.tool }); // 切换工具的时候打点
    tools.setCurrentTool(val);
    toolAvailable = val && val.tool !== toolTypes.NOOP;
  },

  set watermark(watermark) {
    if (!watermarkLayer) {
      this.watermarkLayer = new Layer();
    }
    this.watermarkItem && this.watermarkItem.remove();
    this.watermarkItem = appendWatermark(watermark);
    this.watermarkLayer.addChild(this.watermarkItem);
  },

  set slideUrl(url) {
    currentSlide && currentSlide.remove();
    currentSlide = appendMaterial(url, [360, 270], (_, error) => this.options.onSlideLoad(url, error));
    if (!url && url.indexOf('blank') > -1) {
      // TODO: add blank watermark
    }
  },

  draw(hash) {
    let tool = tools.get(hash.type);
    return tool.draw(hash);
  },

  drawImgByTool(url, width) {
    let tool = tools.get(toolTypes.IMAGE);
    tool.render(url, 0, 0, null, width);
  },

  mouseUpTrigger() {
    let tool = tools.currentTool;
    tool.mouseUpHandler &&
      tool.mouseUpHandler({
        downPoint: {},
        point: {},
      });
  },

  keyDownHandler(event) {
    keyModifiers[event.key] = true;
    const eventKey = ['z', 'y', 'a'];
    // windows keyboard
    if (keyModifiers.control) {
      if (!toolAvailable && eventKey.includes(event.key)) return false;
      if (event.key === 'z') {
        commands.undo();
      } else if (event.key === 'y') {
        commands.redo();
      } else if (event.key === 'a') {
        store.selectAll();
        event.preventDefault();
      }
    }

    // mac keyboard
    if (keyModifiers.meta) {
      if (!toolAvailable && eventKey.includes(event.key)) return false;
      if (keyModifiers.shift && event.key === 'z') {
        commands.redo();
      } else if (event.key === 'z') {
        commands.undo();
      } else if (event.key === 'a') {
        store.selectAll();
        event.preventDefault();
      }
    }
  },

  keyUpHandler(event) {
    if ((event.key === 'delete' || event.key === 'backspace') && tools.currentTool.type === toolTypes.SELECTOR) {
      if (!toolAvailable) return false;
      commands.delete();
    }
    keyModifiers[event.key] = false;
  },

  clearFocus(){
    paper.project.activeLayer.selected = false;
    store.removeHelper();
  },

};

['mouseDownHandler', 'mouseUpHandler', 'mouseMoveHandler', 'mouseDragHandler'].forEach(handler => {
  whiteboard[handler] = event => {
    let tool = tools.currentTool;
    if (!tool) return;
    //取消对超出边界的检查，因为画笔到达边界之外 mousUp 的时候也需要产生一条path
    // if (
    //   !isInBoundary(event.point, {
    //     width: whiteboard.options.width,
    //     height: whiteboard.options.height,
    //   })
    // )
    //   return;f

    if (typeof tool[handler] === 'function') {
      tool[handler](event);
    }
  };
});

//for debug
window.whiteboard = whiteboard;
window.commands = commands;
window.store = store;
window.paper = paper;
window.items = store.items;

export default whiteboard;
