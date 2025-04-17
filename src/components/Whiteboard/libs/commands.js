/**
 * communicate between whiteboard & it's enveriament
 * 1)
 * 2) recv external action and do something.
 */
import paper from 'paper'
import store from './store'
import History from './history'
import tools from './tools'
import isEmpty from 'lodash/isEmpty'
import context from '@libs/context'
import * as ActionTypes from '@constants/ActionTypes'
import { drawWatermark } from '@utils/material'

let preTool = null

const move = function (ids, offset) {
  if (!ids) return

  if (Array.isArray(ids)) {
    ids.forEach(id => store.find(id) && store.find(id).move(offset))
    store.helper && store.helper.move(offset)
  }
}

const scale = function (ids, hash) {
  if (!ids) return
  if (Array.isArray(ids)) {
    ids.forEach(id => {
      let item = store.find(id)
      item && item.scale(hash)
      store.helper && store.helper.scale(hash)
    })
  }
}

export default {
  init() {
    this.history = new History({
      change: data => {
        if (!data.action || isEmpty(data.delta.data)) return
        this.recv(data.delta.action, data.delta.data)

        this.sendMessage(data.delta.action, data.delta.data)
      },
    })
  },

  /**
   * handle action after action finished
   * @param {*} action
   * @param {*} data
   * @param {bool} ignoreRecord , determine if this action should record in history stack.
   */
  send(action, data = {}, ignoreRecord = false, ignoreSend = false) {
    let record = data,
      hash = data

    if (action === 'ADD') {
      store.add(data)
      record = hash = data.map(item => item.hash)
    } else if (action === 'DELETE') {
      record = store.deleteSelect()
      if (record.length === 0) return
      hash = record.map(item => item[1])
    } else if (action === 'DELETE_ALL') {
      store.deleteAll()
    } else if (action === 'TYPING') {
      hash = [
        data.id,
        data.value,
        {
          f: data.f,
          c: data.c,
        },
      ]
    }

    if (action === 'TYPING') {
      context.dispatch({ type: ActionTypes.SENT_TEXT }) // 统计顾问的板书
    }

    !ignoreRecord &&
      this.history.record({
        action,
        data: record,
      })
    !ignoreSend && this.sendMessage(action, hash)
  },

  sendMessage(action, hash) {},

  /**
   * dosomthing after recv actions(socket msg, redo, undo)
   * @param {*} action
   * @param {*} data
   */
  recv(action, data) {
    if (action === 'ADD' && Array.isArray(data)) {
      let ret = data.map(hash => {
        let tool = tools.get(hash[0])
        if (preTool && preTool.type !== tool.type) {
          preTool && preTool.setSelected(false)
        }
        preTool = tool
        return tool && tool.draw(hash)
      })
      store.add(ret)
    } else if (action === 'DELETE') {
      store.delete(data.map(hash => hash[1]))
      store.delete(data)
    } else if (action === 'DELETE_ALL') {
      store.deleteAll()
    } else if (action === 'MOVE') {
      move(data.ids, data.offset)
    } else if (action === 'SCALE') {
      scale(data.ids, data.scale)
    } else if (action === 'TYPING') {
      if (data.id) {
        const path = store.find(data.id)
        path && path.update(data.value)
        return false
      }
      store.find(data[0]) && store.find(data[0]).update(data[1])
    } else if (action === 'POINTER') {
      let tool = tools.get(0)
      if (preTool && preTool.type !== tool.type) {
        preTool && preTool.setSelected(false)
      }
      preTool = tool
      // if (data && Array.isArray(data[0])) {
      //   loopPlay(data, tool.move.bind(tool))
      // } else {
      //   tool.move(data) //兼容老版本
      // }
    }
  },

  redo() {
    this.history.redo()
  },

  undo() {
    this.history.undo()
  },

  delete() {
    this.send('DELETE')
  },

  deleteAll(ignoreSend = false) {
    const $textContainer = document.querySelector('#text-container')
    $textContainer && ($textContainer.innerHTML = '')
    this.send('DELETE_ALL', '', false, ignoreSend)
  },

  /**
   * 导出当前页面所有图形的hash值, hash由简化显示
   */
  exportHash() {
    return JSON.stringify(store.items.map(item => item.hash))
  },

  /**
   * 导出当前页面所有图形的hash值
   * @param {*} jsonStr
   */
  importHash(jsonStr) {
    let paths = JSON.parse(jsonStr)

    return store.add(
      paths.map(item => {
        let tool = tools.get(item[0])
        return tool.draw(item)
      })
    )
  },

  exportJSON() {
    return JSON.stringify(store.items.map(item => item.json))
  },

  importJSON(jsonStr) {
    let paths = JSON.parse(jsonStr)

    return store.add(
      paths.map(item => {
        let tool = tools.get(item[0])
        return tool.drawViaJSON(item)
      })
    )
  },

  /**
   * This is the function that will take care of image extracting and
   * setting proper filename for the download.
   * IMPORTANT: Call it from within a onclick event.
   * @param {*} linkElement
   * @param {string} watermarkText
   */
  exportImage(linkElement, watermarkText) {
    function dataURLtoBlob(dataurl) {
      let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new Blob([u8arr], { type: mime })
    }

    function downloadCanvas(link, canvasId, filename, watermarkText, style) {
      var canvas = document.getElementById(canvasId)
      if (watermarkText) {
        var tempCanvas = document.createElement('canvas')
        var tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        tempCtx.drawImage(canvas, 0, 0)
        drawWatermark(tempCtx, tempCanvas.width, tempCanvas.height, watermarkText, style)

        canvas = tempCanvas
      }

      const imgData = canvas.toDataURL('image/png')
      const blob = dataURLtoBlob(imgData)
      const objurl = window.URL.createObjectURL(blob)
      link.href = objurl
      link.download = filename
    }

    const style = { font: '24px Courier', spacingW: 50, spacingH: 100 }
    downloadCanvas(linkElement, paper.view.element.id, 'material.png', watermarkText, style)
  },

  dataURLtoBlob(dataurl) {
    let arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  },

  exportCanvasImage({ newCanvas = false }) {
    return new Promise((res, rej) => {
      try {
        if (newCanvas) {
          const _w = 320,
            _h = 240
          const canvas = document.getElementById(paper.view.element.id)
          const originalImage = canvas.toDataURL('image/png', 0.8)
          const newCanvas = document.createElement('canvas')
          newCanvas.width = _w
          newCanvas.height = _h
          const ctx = newCanvas.getContext('2d')
          ctx.beginPath()
          ctx.rect(0, 0, _w, _h)
          ctx.fillStyle = 'white'
          ctx.fill()
          const image = new Image()
          image.onload = () => {
            ctx.drawImage(image, 0, 0, _w, _h)
            const base64 = newCanvas.toDataURL('image/jpeg', 0.3)
            const base64str = base64.split(',')
            console.log(`base64`, base64)
            console.log(`lob`, base64str[1])
            res(base64)
          }
          image.src = originalImage
        } else {
          const canvas = document.getElementById(paper.view.element.id)
          const image = canvas.toDataURL('image/png', 0.1)
          res(image)
        }
      } catch (e) {
        rej(e)
        throw new Error(e)
      }
    })
  },
}
