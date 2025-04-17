import React, { Component } from 'react';
import paper from 'paper';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import includes from 'lodash/includes';
import isEmpty from 'lodash/isEmpty';
import { FormattedMessage } from 'react-intl';

//
import whiteboard from './libs';
import Spokesman from '@container/Spokesman';
import PPJNEW from '@container/PPJNEW';
import js_bridge from '@utils/js-bridge';
import * as constants from './libs/const';
import { CONSULTANT, DYNC_MATERIAL, INTERACTIVE_MATERIAL } from '@constants/constants';
import InteractiveMaterial from '@container/InteractiveMaterial';
import InteractiveResult from '@container/InteractiveResult';
import DraggableModal from '@components/DraggableModal';
import Dice from '@components/Dice';
import CountDown from '@components/CountDown';

import './index.scss';

let toolTypes = constants.toolTypes;

class Whiteboard extends Component {
  static propTypes = {
    className: PropTypes.string,
    slideUrl: PropTypes.string,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    zoom: PropTypes.number.isRequired,
    currentTool: PropTypes.object,
    onSlideLoad: PropTypes.func,
  };

  static defaultProps = {
    className: '',
    width: 1000,
    height: 700,
    slideUrl: '',
    zoom: 1,
    currentTool: {},
    test: false,
    onSlideLoad: () => {},
  };

  state = {
    translate: { x: 0, y: 0 },
  };

  canvasPos = { x: 0, y: 0 };
  touchStartPos = {};
  touchEndPos = {};
  componentDidMount() {
    const { width, height, zoom, watermark } = this.props;

    document.addEventListener('mousedown', this.handleFocus);

    whiteboard.init(this._canvas, this._textContainer, {
      width,
      height,
      zoom,
      watermark,
      onSlideLoad: (url, error) => {
        this.props.onSlideLoad(url, error);

        whiteboard.watermark = this.props.watermark;
      }, // 教材图片onload callback
      wrapper: this._wb,
    });
    whiteboard.zoom = {
      zoom: this.props.zoom,
      pre: this.props.zoom,
    };
    if (this.props.slideUrl) whiteboard.slideUrl = this.props.slideUrl;
    this.initWbPos();
  }

  componentDidUpdate(prevProps) {
    const { material } = this.props;
    if (
      !isEmpty(this.props.currentTool) &&
      JSON.stringify(prevProps.currentTool) !== JSON.stringify(this.props.currentTool)
    ) {
      if (includes([0, 1, 2, 11], this.props.currentTool.tool)) {
        document.querySelector('.canvas').style.cursor = 'none';
      } else {
        document.querySelector('.canvas').style.cursor = 'default';
      }
      whiteboard.tool = this.props.currentTool;
    }
    if (prevProps.zoom !== this.props.zoom) {
      this.sendWbPosToApp();
      whiteboard.zoom = {
        zoom: this.props.zoom,
        pre: prevProps.zoom,
      };
    }
    if (prevProps.slideUrl !== this.props.slideUrl) {
      whiteboard.slideUrl = this.props.slideUrl;
    }
    if (prevProps.watermark !== this.props.watermark) {
      whiteboard.watermark = this.props.watermark;
    }
  }

  componentWillUnmount() {
    if (this.wbTimer) {
      clearInterval(this.wbTimer);
      this.wbTimer = null;
    }

    document.removeEventListener('mousedown', this.handleFocus);
  }

  handleFocus = (event) => {
    if (!this._canvas.contains(event.target)) {
      whiteboard.clearFocus();
    }
  }

  initWbPos = () => {
    if (this.wbTimer) return;
    this.wbCount = 0;
    this.wbTimer = setInterval(() => {
      if (this.wbCount >= 5) {
        clearInterval(this.wbTimer);
        this.wbTimer = null;
        return;
      }
      this.sendWbPosToApp();
      this.wbCount++;
    }, 1000);
  };

  addBlankTag(content) {
    const { width, height } = this.props;
    this.blankTag && this.blankTag.remove();
    this.blankTag = new paper.PointText(0, 0);
    this.blankTag.fillColor = '#E6E6E6';
    this.blankTag.fontSize = 36;
    this.blankTag.content = content;
    const lineWidth = paper.view.getTextWidth(this.blankTag._style.getFontStyle(), [content]);
    this.blankTag.setPosition(width - lineWidth / 2 - 20, height - 20 - 36 / 2);
  }

  removeBlankTag() {
    this.blankTag && this.blankTag.remove();
  }

  drawImgByTool(url, width) {
    whiteboard.drawImgByTool(url, width);
  }

  setToolZoom(val) {
    whiteboard.setToolZoom(val);
  }

  redo() {
    whiteboard.commands.redo();
  }

  undo() {
    whiteboard.commands.undo();
  }

  delete() {
    whiteboard.commands.delete();
  }

  deleteAll(ignoreSend) {
    whiteboard.commands.deleteAll(ignoreSend);
  }

  exportImage(linkElement, watermarkText = '') {
    whiteboard.commands.exportImage(linkElement, watermarkText);
  }

  exportCanvasImage() {
    return whiteboard.commands.exportCanvasImage();
  }

  drawMaterialImage(url) {
    whiteboard.slideUrl = url;
  }

  exportPdf = async (images, watermarkText, style, cb) => {
    // for support magic comments, `comments` must be true in .babelrc.
    // https://github.com/vuejs-templates/webpack/issues/730
    const { saveImages } = await import(/* webpackChunkName: "pdf-make" */ '@libs/pdf-make');
    saveImages(images, watermarkText, style, cb);
  };

  legalMove = viewEndPoint => {
    const eleWidth = this._wbBox.clientWidth;
    const eleHeight = this._wbBox.clientHeight;
    const scaleWidth = this._canvas.clientWidth;
    const scaleHeight = this._canvas.clientHeight;
    let { x: endX, y: endY } = viewEndPoint;

    if (eleWidth >= scaleWidth && eleHeight >= scaleHeight) {
      return { x: 0, y: 0 };
    }
    // x 方向
    if (endX > 0) {
      endX = 0;
    }
    if (endX <= eleWidth - scaleWidth) {
      endX = eleWidth - scaleWidth;
    }
    // y方向
    if (endY > 0) {
      endY = 0;
    }
    if (endY <= eleHeight - scaleHeight) {
      endY = eleHeight - scaleHeight;
    }

    if (eleWidth >= scaleWidth) endX = 0;
    if (eleHeight >= scaleHeight) endY = 0;

    return { x: endX, y: endY };
  };

  getMoveGate = _ => {
    const {
      currentTool: { tool },
    } = this.props;
    if (tool === -1 || (tool !== -1 && tool === 15)) return true;
    return false;
  };

  sendWbPosToApp = () => {
    js_bridge.abilityInvoke(
      'media',
      {
        type: 'wbPos',
        options: {
          x: this.canvasPos.x,
          y: this.canvasPos.y,
          w: this._wb.offsetWidth,
          h: this._wb.offsetHeight,
        },
      },
      () => {
        //success
        if (this.wbTimer) {
          clearInterval(this.wbTimer);
          this.wbTimer = null;
        }
      }
    );
  };
  handleMouseLeaveTip = () => {
    whiteboard.mouseUpTrigger();
  };

  handleTouchStart = e => {
    if (!this.getMoveGate()) return;
    const { clientX, clientY } = e.touches && e.touches[0];
    this.touchStartPos = { x: clientX, y: clientY };
    this.touchEndPos = { x: clientX, y: clientY };
  };
  handleTouchMove = e => {
    if (!this.getMoveGate()) return;
    const { clientX, clientY } = e.touches && e.touches[0];
    const { x, y } = this.touchStartPos;
    this.touchEndPos = { x: clientX, y: clientY };
    const endX = clientX - x + this.canvasPos.x;
    const endY = clientY - y + this.canvasPos.y;
    const legalPoint = this.legalMove({ x: endX, y: endY });

    this.setState({
      translate: { x: legalPoint.x, y: legalPoint.y },
    });
  };
  handleTouchEnd = e => {
    if (!this.getMoveGate()) return;
    const { x, y } = this.touchStartPos;
    const endX = this.touchEndPos.x - x + this.canvasPos.x;
    const endY = this.touchEndPos.y - y + this.canvasPos.y;
    const legalPoint = this.legalMove({ x: endX, y: endY });
    if (this.canvasPos.x === legalPoint.x && this.canvasPos.y === legalPoint.y) return;
    this.canvasPos = { x: legalPoint.x, y: legalPoint.y };
    this.sendWbPosToApp();
  };

  handleStep = next => {
    const { material } = this.props;

    if (!material || !material.iframe) return;

    const { stepAnimationSize: stepSize, stepAnimationIndex: stepIndex } = material;

    const prevDisable = !stepSize || !stepIndex;
    const nextDisable = !stepSize || stepIndex > stepSize - 1;

    if (next && nextDisable) return;
    if (!next && prevDisable) return;

    //调用一次forward2/backward2不一定只走一步，可能是多步
    if (next) {
      material.iframe.forward2();
    } else {
      material.iframe.backward2();
    }
    material.iframe.nextTick(() => {
      const steps = material.iframe.getPauseProgress();
      this.props.updateStepAnimationIndex && this.props.updateStepAnimationIndex(steps[0]);
    });
  };

  resetPosition = () => {
    this.setState({ translate: { x: 0, y: 0 } });
    this.canvasPos = { x: 0, y: 0 };
    this.sendWbPosToApp();
  };

  handleContextMenu = event => {
    event.preventDefault(); // Prevent right-click menu
    return false;
  };

  render() {
    const { translate } = this.state;
    const { width, height, zoom, spokesmen, session, material = {}, diceProps, countDownProps } = this.props;
    const { stepAnimationSize: stepSize, stepAnimationIndex: stepIndex, dyncUrl, type: materialType } = material;
    const canvasProps = {
      width,
      height,
      ref: ref => (this._canvas = ref),
      onContextMenu: this.handleContextMenu,
    };

    const prevDisable = !stepSize || !stepIndex;
    const nextDisable = !stepSize || stepIndex > stepSize - 1;

    return (
      <div
        className="whiteboard-box"
        id="whiteboard-box"
        ref={ref => (this._wbBox = ref)}
        onDoubleClick={this.props.onDoubleTap}
      >
        <div
          className="whiteboard"
          id="whiteboard"
          onMouseLeave={this.handleMouseLeaveTip}
          onTouchStart={this.handleTouchStart}
          onTouchMove={this.handleTouchMove}
          onTouchEnd={this.handleTouchEnd}
          ref={ref => (this._wb = ref)}
          style={{
            width: width * zoom,
            height: height * zoom,
            left: `${translate.x}px`,
            top: `${translate.y}px`,
          }}
        >
          {dyncUrl && materialType === DYNC_MATERIAL && <PPJNEW />}
          {dyncUrl && materialType === DYNC_MATERIAL && GDATA.role === CONSULTANT && !!stepSize && (
            <div className={classnames('steps', { isABC: session && session.isABCSession })}>
              <div
                className={classnames('step prev', { disable: prevDisable })}
                onClick={() => this.handleStep(false)}
              />
              <div
                className={classnames('step next', { disable: nextDisable })}
                onClick={() => this.handleStep(true)}
              />
            </div>
          )}
          {dyncUrl && materialType === INTERACTIVE_MATERIAL && <InteractiveMaterial />}
          <div
            className="text-container"
            id="text-container"
            style={{
              width: width * zoom,
              height: height * zoom,
              pointerEvents: this.props.currentTool.tool === toolTypes.CLICK ? 'none' : 'auto',
            }}
            ref={ref => (this._textContainer = ref)}
          />
          <canvas
            className="canvas"
            {...canvasProps}
            style={{ pointerEvents: this.props.currentTool.tool === toolTypes.CLICK ? 'none' : 'auto' }}
          />
          {!!spokesmen &&
            !!spokesmen.length &&
            spokesmen.map((item, index) => {
              return (
                <Spokesman
                  key={item.token || index}
                  userInfo={item}
                  onCheckoutPlayStatus={this.props.onCheckoutPlayStatus}
                  onChangeAllPlayerSeeked={this.props.onChangeAllPlayerSeeked}
                />
              );
            })}
          {dyncUrl && materialType === INTERACTIVE_MATERIAL && GDATA.role === CONSULTANT && <InteractiveResult />}
          {diceProps.show && (
            <DraggableModal
              title={<FormattedMessage id="lblDice" defaultMessage="擲骰子" />}
              onClose={diceProps.handleDiceClose}
              allowDrag={diceProps.allowDrag}
              showClose={diceProps.showClose}
              onMove={diceProps.handleDiceMove}
              move={diceProps.move}
              isLocalShow={diceProps.isLocalShow}
              serverPosition={diceProps.serverPosition}
            >
              <div className="dice-wrapper" onClick={diceProps.handleDiceClick}>
                <Dice value={diceProps.diceValue} now={diceProps.now} />
              </div>
            </DraggableModal>
          )}
          {countDownProps.show && (
            <DraggableModal
              title={<FormattedMessage id="lblTimer" defaultMessage="倒數計時" />}
              btnText={countDownProps.btnText}
              onBtnClick={countDownProps.handleCountDownStart}
              onClose={countDownProps.handleCountDownClose}
              onMove={countDownProps.handleCountDownMove}
              position={countDownProps.position}
              allowDrag={countDownProps.allowDrag}
              showClose={countDownProps.showClose}
              move={countDownProps.move}
              isLocalShow={countDownProps.isLocalShow}
              serverPosition={countDownProps.serverPosition}
            >
              <div className="count-down-wrapper">
                <CountDown
                  onInitSecondChange={countDownProps.handleInitSecondChange}
                  seconds={countDownProps.seconds}
                  theme={session.isABCSession ? 'default' : 'cartoon'}
                  playStatus={countDownProps.playStatus}
                  playbackRate={countDownProps.playbackRate}
                />
              </div>
            </DraggableModal>
          )}
        </div>
      </div>
    );
  }
}

export default Whiteboard;
