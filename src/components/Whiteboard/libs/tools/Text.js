import paper from 'paper'
import commands from '../commands'
import { isNaN, each, includes } from 'lodash'
import { createTool, PaperItem } from './Tool'
import store from '../store'

import { toolTypes, keyCode, actions } from '../const'
import { Escape, Unescape } from '@/utils/string'
import { isOnSelectBound, transformPinZin } from '../utils'

import { setCursor } from './Selector'
import { formatToNumber } from './Tool'
import { fontSize as DefaultFontSize } from '@constants/whiteboard'

// const FONT_SIZE = [12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 48, 72];
let scale = 1.0
// let fontSizeIndex = 2;
let lastTypedText = ''

let lastSentId = ''

const debounce = function () {
  let inputTimer = null
  const GAP = 500
  return fn => {
    let isChange = true
    clearTimeout(inputTimer)
    inputTimer = setTimeout(function () {
      fn && fn()
      isChange = false
      inputTimer = null
    }, GAP)
    return {
      clearInputTimer: () => {
        clearTimeout(inputTimer)
      },
      getStatus: () => {
        return isChange
      },
    }
  }
}

class PaperTextItem extends PaperItem {
  constructor(tool, path, input, id) {
    super(tool, path, id)
    this.inputbox = input
  }

  update(text) {
    return this.tool.updateText(this, text)
  }

  updatePosition() {
    const { width, height, x, y } = this.path.bounds
    const fontSize = this.path.fontSize
    Object.assign(this.inputbox.style, {
      left: x * this.tool.zoom + 'px',
      top: y * this.tool.zoom + 'px',
      width: width * this.tool.zoom + 'px',
      height: height * this.tool.zoom + 'px',
      'font-size': fontSize * this.tool.zoom + 'px',
      'line-height': fontSize * this.tool.zoom * 1.2 + 'px',
    })
  }
}

const cursor = {
  setPosition(style) {
    this.style = style

    const cursor = new paper.Path()
    cursor.style = { ...cursor.style, strokeColor: style.strokeColor, strokeWidth: 1 }
    this.cursorView = cursor
    this.setTimer()
  },

  destroy() {
    this.clearTimer()
    this.cursorView && this.cursorView.remove()
    this.cursorView = null
  },

  setTimer() {
    if (!this.timer) {
      this.timer = setInterval(() => {
        const strokeWidth = this.cursorView.strokeWidth
        this.cursorView.strokeWidth = strokeWidth ? 0 : 1
      }, 500)
    }
  },

  clearTimer() {
    clearInterval(this.timer)
    this.timer = null
  },

  updatePosition(instance) {
    if (!this.cursorView) return
    const { path, lines, cursorInfo } = instance

    const { start = 0, lineIndex = 0 } = cursorInfo
    this.cursorView.style.strokeColor = path.style.fillColor
    const hasWrite = lines.length > 0
    const currentString = lines[lineIndex]
    const cursorLineWidth = paper.view.getTextWidth(path._style.getFontStyle(), [
      currentString && currentString.substring(0, start),
    ])
    const width = hasWrite ? cursorLineWidth : path.bounds.width
    const height = hasWrite
      ? path.bounds.height * ((lineIndex + 1) / lines.length)
      : path.bounds.height
    const oneLineHeight = hasWrite ? path.bounds.height / lines.length : path.bounds.height
    const cursorHeight = oneLineHeight
    const startSeg = new paper.Segment([0, 0])
    const endSeg = new paper.Segment([0, cursorHeight])

    // update segments because fontSize might be changed
    this.cursorView.removeSegments()
    this.cursorView.addSegments([startSeg, endSeg])

    // bounds (x, y, width, height) is the rectangle related to parent
    // position (x, y) is the center of bounds related to parent
    this.cursorView.position.x = path.bounds.x + width + 2
    this.cursorView.position.y = path.bounds.y + height - oneLineHeight / 2
  },
}

export default createTool(toolTypes.TEXT, {
  hasSelected: false,

  draw(hash) {
    const style = Object.assign({}, this.style, {
      strokeColor: hash[3].c,
      fontSize: hash[3].f,
    })
    this.render(hash[2], hash[1], style)
  },

  setSelected(setSelected) {
    if (setSelected && !cursor.cursorView) {
      cursor.setPosition({ fontSize: this.style.fontSize, strokeColor: this.style.strokeColor })
    } else {
      cursor.destroy()
    }
  },

  lastInstance: {},

  style: {
    fontFamily:
      '"Pingfang SC", "Microsoft YaHei", 微软雅黑, Helvetica, Arial, Lucida, Verdana, sans-serif',
    bold: 'normal',
    strokeColor: '#000000',
    italic: false,
    underline: false,
    fontSize: DefaultFontSize.SMALL,
  },

  createInput(style) {
    let input = document.createElement('TEXTAREA')
    input.setAttribute('style', '')
    input.setAttribute('autocapitalize', 'off')
    input.setAttribute('autocorrect', 'off')
    input.setAttribute('autocomplete', 'off')
    input.setAttribute('spellcheck', 'false')
    input.setAttribute('wrap', 'off')

    Object.assign(input.style, {
      fontFamily: style.fontFamily,
      'font-weight': 400,
      'text-decoration': style.underline ? 'underline' : 'none',
      'font-style': style.italic ? 'italic' : 'normal',
      'font-size': style.fontSize * this.zoom + 'px',
    })
    lastTypedText = ''
    return input
  },

  updateText(instance, text) {
    instance.inputbox.value = text.replace('\\n', '\n')
    console.log('[text] update text', instance.inputbox.value)
    instance.lastSentText = instance.inputbox.value
    this.handleTextChanged(instance, true)
  },

  _splitTextIntoLines: function (text) {
    var lines = text.split(/\r?\n/),
      newLines = new Array(lines.length),
      newLine = ['\n'],
      newText = []
    for (var i = 0; i < lines.length; i++) {
      newLines[i] = this.graphemeSplit(lines[i]).concat(newLine)
      newText = newText.concat(newLines[i], newLine)
    }
    newLines[lines.length - 1].pop()
    newText.pop()
    return { lines: lines, graphemeText: newText, graphemeLines: newLines }
  },

  graphemeSplit(textstring) {
    var i = 0,
      chr,
      graphemes = []
    for (i = 0, chr; i < textstring.length; i++) {
      if ((chr = this.getWholeChar(textstring, i)) === false) {
        continue
      }
      graphemes.push(chr)
    }
    return graphemes
  },

  getWholeChar(str, i) {
    var code = str.charCodeAt(i)
    if (isNaN(code)) {
      return '' // Position not found
    }
    if (code < 0xd800 || code > 0xdfff) {
      return str.charAt(i)
    }
    // High surrogate (could change last hex to 0xDB7F to treat high private
    // surrogates as single characters)
    if (0xd800 <= code && code <= 0xdbff) {
      if (str.length <= i + 1) {
        throw new Error('High surrogate without following low surrogate')
      }
      var next = str.charCodeAt(i + 1)
      if (0xdc00 > next || next > 0xdfff) {
        throw new Error('High surrogate without following low surrogate')
      }
      return str.charAt(i) + str.charAt(i + 1)
    }
    // Low surrogate (0xDC00 <= code && code <= 0xDFFF)
    if (i === 0) {
      throw new Error('Low surrogate without preceding high surrogate')
    }
    var prev = str.charCodeAt(i - 1)
    // (could change last hex to 0xDB7F to treat high private
    // surrogates as single characters)
    if (0xd800 > prev || prev > 0xdbff) {
      throw new Error('Low surrogate without preceding high surrogate')
    }
    // We can pass over low surrogates now as the second component
    // in a pair which we have already processed
    return false
  },

  handleTextChanged(instance, ignore = false) {
    instance.inputbox.style.height = '1px'
    let len = 0
    const height =
      instance.inputbox.scrollHeight / scale > 50 ? instance.inputbox.scrollHeight / scale : 50
    const linesInfo = this._splitTextIntoLines(instance.inputbox.value)
    const cursorPos = instance.inputbox.selectionStart
    instance.path.content = instance.inputbox.value + ' ' //撑开宽度 放光标
    instance.lines = linesInfo.lines
    each(linesInfo.graphemeLines, (item, index) => {
      len = item.length + len
      if (len >= cursorPos) {
        instance.cursorInfo.lineIndex = index
        instance.cursorInfo.start = item.length - (len - cursorPos)
        if (/\r?\n/.test(instance.inputbox.value[cursorPos - 1])) {
          //回车换行
          instance.cursorInfo.lineIndex = index + 1
          instance.cursorInfo.start = 0
        }
        return false
      }
    })
    const point = {
      x: instance.path.bounds.x,
      y: instance.path.bounds.y,
    }
    this.update(instance, point, {
      width: instance.path.bounds.width,
      height,
    })
    cursor.updatePosition(instance)
    if (!ignore) {
      const { clearInputTimer, getStatus } = instance.inputbox.debounceInput(() => {
        this.sendText(instance)
      }, instance)

      instance.inputbox.clearInputTimer = clearInputTimer
      instance.inputbox.getStatus = getStatus
    }
  },

  handleCursorChangedByArrow(instance, arrow) {
    let len = 0
    const linesInfo = this._splitTextIntoLines(instance.inputbox.value)
    const cursorPos = instance.inputbox.selectionStart
    each(linesInfo.graphemeLines, (item, index) => {
      len = item.length + len
      if (len >= cursorPos) {
        instance.cursorInfo.lineIndex = index
        instance.cursorInfo.start = item.length - (len - cursorPos)
        if (/\r?\n/.test(instance.inputbox.value[cursorPos - 1])) {
          instance.cursorInfo.lineIndex = index + 1
          instance.cursorInfo.start = 0
        }
        return false
      }
    })
    cursor.updatePosition(instance)
  },

  // @throttle(500)
  sendText(instance) {
    if (!instance || !instance.inputbox) return

    if (instance.inputbox.cpLock) return // 支持看到 繁体字打字过程， 拼字过程中不发送数据

    const value = Escape(instance.inputbox.value.replace('\n', '\\n'))

    console.log('[text] sendText: lastSentText', instance.lastSentText, ', current value', value)
    //空字符不发送
    if (!value && !instance.lastSentText) {
      // need to send emtpy text when user deletes a text with length from > 0 to 0
      console.log('[text] sendText: ignore sending empty text')
      return
    }

    //不重复发送
    if (instance.id === lastSentId && instance.inputbox.value === instance.lastSentText) {
      console.log('[text] sendText: ignore sending duplicated text')
      return
    }

    commands.send('TYPING', {
      id: instance.id,
      lastTypedText,
      value,
      f: this.style.fontSize,
      c: this.style.strokeColor,
    })
    lastTypedText = instance.inputbox.value
    lastSentId = instance.id
    instance.lastSentText = instance.inputbox.value
    this.lastInstance = instance
  },

  createTextItemArea(point, id, style) {
    let placeholder

    if (this.lastInstance.path && this.lastInstance.path.content.trim() === '') {
      this.lastInstance.remove()
    }

    placeholder = new paper.PointText(point)
    placeholder.data.textItem = true
    // id && (placeholder.data.locked = true);  //暂时不做锁死   学生端也可以对老师的笔记进行更改
    //placeholder.setBounds(new paper.Rectangle(point, new paper.Size(size)));
    placeholder.fillColor = style.strokeColor //暂存
    placeholder.fontSize = style.fontSize
    placeholder.content = ''
    placeholder.fontFamily = style.fontFamily
    // placeholder.leading = style.fontSize * this.zoom;

    return placeholder
  },

  select(instance, val) {
    if (val) {
      instance.path.selected = true
      this.focusWithoutScroll(instance.inputbox)
    } else {
      instance.path.selected = false
      instance.inputbox.blur()
    }
  },

  remove(instance) {
    instance.path.remove()
    instance.inputbox.parentNode && instance.inputbox.parentNode.removeChild(instance.inputbox)
  },

  move(instance, offset) {
    let left = parseInt(instance.inputbox.style.left, 10) + offset.x * this.zoom + 'px'
    let top = parseInt(instance.inputbox.style.top, 10) + offset.y * this.zoom + 'px'

    // let left = instance.path.position.x + offset.x + 'px';
    // let top = instance.path.position.y + offset.y + 'px';
    let x = instance.path.position.x + offset.x
    let y = instance.path.position.y + offset.y

    Object.assign(instance.inputbox.style, { left, top })
    instance.path.setPosition(x, y)
  },

  scale(/*DO NOT SCALE TEXT ITEM*/) {
    return false
  },

  setTextareaPosition(instance, size) {
    const { width, height, x = 0, y = 0 } = instance.path.bounds
    const fontSize = instance.path.fontSize
    Object.assign(instance.inputbox.style, {
      left: x * this.zoom + 'px',
      top: y * this.zoom + 'px',
      width: (width || size.width || 0) * this.zoom + 'px',
      height: (height || size.height || 0) * this.zoom + 'px',
      'font-size': fontSize * this.zoom + 'px',
      'line-height': fontSize * this.zoom * 1.2 + 'px',
      transform: `translateY(-${(fontSize * this.zoom * 1.2 - fontSize * this.zoom) / 2}px)`,
    })
  },

  update(instance, point, size) {
    if (instance.inputbox.cpLock || instance.cursorInfo.isDelete) return
    this.setTextareaPosition(instance, size)

    //如果任意一行长度超过可用范围，则换行
    const availableWidth = Math.floor(paper.view.size.width - point.x)
    const maxLineWidth = Math.ceil(
      paper.view.getTextWidth(instance.path._style.getFontStyle(), instance.lines)
    )
    const oldSelectionStart = instance.inputbox.selectionStart
    const oldValue = instance.inputbox.value
    const whiteSpace = /[\s]+/g
    if (maxLineWidth > availableWidth) {
      let lines = []
      let offsetEnterKeys = 0

      // new logic: 改逐行判斷
      instance.lines.forEach(a => {
        const line = a.replace(whiteSpace, ' ')
        const lineWidth = Math.ceil(
          paper.view.getTextWidth(instance.path._style.getFontStyle(), [line])
        )
        if (lineWidth > availableWidth) {
          if (line) {
            const lineInfo = this.newline(instance, line, availableWidth)
            const breakIdx = lineInfo.newLine.indexOf('\n')
            if (breakIdx > -1) {
              const breakStart = breakIdx + (lines.length > 0 ? lines.join('\n').length + 1 : 0)
              if (oldSelectionStart >= breakStart) {
                offsetEnterKeys++
                instance.cursorInfo.lineIndex++
                instance.cursorInfo.start =
                  oldSelectionStart === breakStart ? 0 : oldSelectionStart - breakStart
              }
            }
            lines.push(lineInfo.newLine)
          }
        } else {
          lines.push(line)
        }
      })

      //// old logic: 全部行文字合併後判斷長度 缺點是斷行會消失
      // const line = instance.lines.join(' ').replace(whiteSpace, ' ');
      // const lineWidth = Math.ceil(paper.view.getTextWidth(instance.path._style.getFontStyle(), [line]));
      // if (lineWidth > availableWidth) {
      //   if (line) {
      //     const lineInfo = this.newline(instance, line, availableWidth);
      //     lines.push(lineInfo.newLine);
      //   }
      // } else {
      //   line && lines.push(line);
      // }

      instance.inputbox.value = lines.join('\n')
      instance.path.content = instance.inputbox.value + ' '
      const linesInfo = this._splitTextIntoLines(instance.inputbox.value)
      instance.lines = linesInfo.lines

      // const value = instance.inputbox.value;
      // const lettersBeforeSelectionStart = oldValue.slice(0, oldSelectionStart);
      // const lettersInfo = this.newline(instance, lettersBeforeSelectionStart.replace(whiteSpace, ' '), availableWidth);
      // const offsetEnterKeys = lettersInfo.newLine.length - lettersBeforeSelectionStart.length;
      instance.inputbox.selectionStart = instance.inputbox.selectionEnd =
        oldSelectionStart + offsetEnterKeys
    }
  },

  //如果文字长度超过可用范围则换行
  newline(instance, line, availableWidth) {
    const lineLength = line.length
    const english = /^[a-zA-Z]+$/
    const enter = /^[\n\r]+$/
    let newLine = '',
      startIndex = 0,
      enterKeys = 0
    for (let i = 1; i <= lineLength; i++) {
      const sliceStr = line.slice(startIndex, i)
      const sliceWidth = Math.ceil(
        paper.view.getTextWidth(instance.path._style.getFontStyle(), [sliceStr])
      )
      if (sliceWidth >= availableWidth) {
        if (english.test(line[i - 1])) {
          for (let m = i - 1; m > 0; m--) {
            const word = line.slice(m + 1, i - 1)
            const wordWidth = Math.ceil(
              paper.view.getTextWidth(instance.path._style.getFontStyle(), [word])
            )
            if (english.test(word) && wordWidth > availableWidth) {
              break
            }
            if (
              !english.test(line[m]) &&
              !enter.test(newLine[m + enterKeys]) &&
              english.test(word) &&
              wordWidth < availableWidth
            ) {
              startIndex = m + 1
              newLine =
                newLine.slice(0, startIndex + enterKeys) +
                '\n' +
                newLine.slice(startIndex + enterKeys, i + enterKeys - 1)
              enterKeys++
              break
            }
          }
        } else {
          newLine += '\n'
          startIndex = i - 1
          enterKeys++
        }
      }
      newLine += line[i - 1]
    }
    return { newLine, enterKeys }
  },

  createInstance(path, input, id) {
    return new PaperTextItem(this, path, input, id)
  },

  //focus时不滚动页面的实现的两种方法
  //1.preventScroll(兼容性较差)
  //2.记录初始位置，focus后定位到初始位置
  focusWithoutScroll(input) {
    if (!this.wbBox) this.wbBox = document.querySelector('#whiteboard-box')
    const wbBox_scrollTop = this.wbBox.scrollTop
    const wbBox_scrollLeft = this.wbBox.scrollLeft
    //input.focus();
    input.focus({ preventScroll: true })
    this.wbBox.scrollTop = wbBox_scrollTop
    this.wbBox.scrollLeft = wbBox_scrollLeft
  },

  render(downPoint, id, hashStyle) {
    const style = hashStyle || this.style

    let point =
      id && downPoint[0]
        ? {
            x: downPoint[0] - 5,
            y: downPoint[1] - 25,
          }
        : {
            x: downPoint.x - 5,
            y: downPoint.y - 25,
          }

    const input = this.createInput(style)
    input.debounceInput = debounce()
    if (!this.textContainer) {
      this.textContainer = document.querySelector('#text-container')
    }
    this.textContainer.appendChild(input)

    const path = this.createTextItemArea(new paper.Point(point), id, style)
    const inst = this.createInstance(path, input, id)

    inst.lines = []
    inst.cursorInfo = {}
    cursor.updatePosition(inst)
    if (!id) {
      input.cpLock = false
      input.isChange = false
      input.addEventListener('compositionstart', event => (input.cpLock = true))
      input.addEventListener('compositionend', event => (input.cpLock = false))
      input.oninput = event =>
        setTimeout(() => {
          input.isChange = true
          //临时性修复oninput 比 compositionend触发早的问题
          // if (cpLock) return;
          inst.cursorInfo.isBreak = event.inputType === 'insertLineBreak'
          inst.cursorInfo.isDelete = event.inputType === 'deleteContentBackward'
          this.handleTextChanged(inst)
        }, 0)
      input.onfocus = event => {
        this.handleTextChanged(inst)
      }
      input.onblur = event => {
        if (input.cpLock) return
        this.handleTextChanged(inst)
        input.clearInputTimer && input.clearInputTimer()
        input.getStatus && input.getStatus() && this.sendText(inst)
        this.select(inst, false)
        !!this.style.fontLanguage &&
          !!inst.inputbox.value &&
          input.isChange &&
          transformPinZin(this.style.fontLanguage, inst.inputbox.value, data => {
            inst.inputbox.value = data.text
            this.handleTextChanged(inst)
            this.sendText(inst)
          })
        input.isChange = false
      }
      this.focusWithoutScroll(input)
      this.update(
        inst,
        {
          x: point.x,
          y: point.y,
        },
        {
          width: 10,
          height: 50,
        }
      )
      this.select(inst, true)
    } else {
      input.oninput = event => {
        input.isChange = true
        inst.cursorInfo.isBreak = event.inputType === 'insertLineBreak'
        inst.cursorInfo.isDelete = event.inputType === 'deleteContentBackward'
        this.handleTextChanged(inst)
      }
      input.onblur = event => {
        this.handleTextChanged(inst)
        input.clearInputTimer && input.clearInputTimer()
        input.getStatus && input.getStatus() && this.sendText(inst)
        this.select(inst, false)
        !!this.style.fontLanguage &&
          !!inst.inputbox.value &&
          input.isChange &&
          transformPinZin(this.style.fontLanguage, inst.inputbox.value, data => {
            inst.inputbox.value = data.text
            this.handleTextChanged(inst)
            this.sendText(inst)
          })
        input.isChange = false
      }
      this.select(inst, false)
    }
    this.inputBindEvent(input, inst)
    if (inst.heigh !== inst.path.bounds.height) {
      inst.path.bounds.y = inst.path.bounds.y + inst.path.bounds.height / 2 + 10
      inst.heigh = inst.path.bounds.height
    }
    cursor.updatePosition(inst)
    path.data.json = [formatToNumber(downPoint.x), formatToNumber(downPoint.y)]
    commands.send('ADD', [inst], !!id, !!id)
  },

  inputBindEvent(target, instance) {
    target.addEventListener('click', event => {
      this.handleTextChanged(instance)
    })
    target.addEventListener('keyup', event => {
      const triggerKeyCode = [keyCode.LEFT, keyCode.UP, keyCode.RIGHT, keyCode.DOWN]
      if (includes(triggerKeyCode, event.keyCode)) {
        this.handleCursorChangedByArrow(instance, event.keyCode)
      }
    })
  },

  mouseDownHandler(event) {
    if (!this.hasSelected && !this.readyMoved) {
      this.render(event.point)
    } else if (this.readyMoved) {
      this.canMoved = true
    }
  },

  mouseDragHandler(event) {
    if (this.canMoved) {
      store.selectedItems.forEach(item => {
        item.move(event.delta)
      })
      store.helper && store.helper.move(event.delta)
    }
  },

  mouseUpHandler(event) {
    if (this.readyMoved) {
      const offset = {
        x: event.point.x - event.downPoint.x,
        y: event.point.y - event.downPoint.y,
      }
      const ids = store.selectedItems.map(item => {
        item.mutateHash(actions.MOVE, offset)
        return item.id
      })
      commands.send(actions.MOVE, { ids, offset })
    }
  },

  mouseMoveHandler(event) {
    const hitOptions = {
      segments: true,
      stroke: true,
      curves: true,
      fill: true,
      guide: false,
      tolerance: 5,
    }

    const hitResult = paper.project.hitTest(event.point, hitOptions)
    if (hitResult && hitResult.item && hitResult.item.data.locked) return

    if (hitResult && hitResult.item && hitResult.item.data.textItem) {
      const isMatch = isOnSelectBound(hitResult.item.bounds, event.point)
      this.readyMoved = isMatch
      if (!isMatch) {
        this.select(hitResult.item.instance, true)
        this.hasSelected = true
        this.textContainer.style.zIndex = 3
        cursor.updatePosition(hitResult.item.instance)
        setCursor()
      } else {
        this.select(hitResult.item.instance, true)
        cursor.updatePosition(hitResult.item.instance)
        setCursor(actions.MOVE)
      }
    } else {
      setCursor()
      this.readyMoved = false
      this.hasSelected = false
      this.textContainer.style.zIndex = 1
    }
  },
})
