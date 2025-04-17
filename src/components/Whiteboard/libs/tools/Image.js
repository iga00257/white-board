import paper from 'paper'
import { createShapeTool } from './Tool'

import { toolTypes } from '../const'
import commands from '../commands'
import { Loggerabc, TYPE_MAP } from '@decorators/logger'

const DEFAULT_WIDTH = 75

export default createShapeTool(toolTypes.IMAGE, {
  draw(hash) {
    if (!hash[2].r) hash[2].r = 1
    return this.render(hash[2].u, (hash[2].w / 2) * hash[2].r, (hash[2].h / 2) * hash[2].r, hash)
  },

  render(url = '', startPoint = 0, endPoint = 0, hash = [], initWidth) {
    let path = new paper.Raster({
      source: url,
      crossOrigin: 'anonymous',
      position: new paper.Point(startPoint, endPoint),
      visible: !!window.GDATA.isPlayback ? false : true,
    })
    path.data.url = url

    path.onLoad = data => {
      //走缓存的图片 event 为空 尴尬！！！
      let width = (data.event && data.event.target.width) || path.width || initWidth
      let height = (data.event && data.event.target.height) || path.height || initWidth
      let ratio = 1

      if (hash && hash[2]) {
        path.width = hash[2].w
        path.height = hash[2].h
        if (hash[2].r && hash[2].r !== ratio) {
          ratio = hash[2].r
          path.scale(ratio)
        }
      } else if (!path.width || !path.height) {
        path.width = width
        path.height = height
      }

      path.data.width = path.width
      path.data.height = path.height
      path.data.ratio = ratio

      if (!hash) {
        if (path.width > 1000 || path.height > 700) {
          let wRatio = (1000 / path.width).toFixed(2) * 1
          let hRatio = (700 / path.height).toFixed(2) * 1
          ratio = wRatio < hRatio ? wRatio : hRatio
          path.data.ratio = ratio
          path.scale(ratio)
        }

        path.position = new paper.Point((path.width / 2) * ratio, (path.height / 2) * ratio)
        commands.send('ADD', [this.createInstance(path)])
      }
      // 生成教材，当前页canvas图片是否添加完成
      if (window.trackImageCount) {
        requestAnimationFrame(() => {
          window.trackImageCount--
        })
      }
    }
    path.onError = e => {
      console.warn('网络图片加载失败')
      // TODO: 打点上报
      Loggerabc.sendInfo(
        TYPE_MAP.LOAD_REPORT.code,
        {},
        `type:imgError,url:${path.source},sessionRoomId:${GDATA.sessionRoomId}`
      )
      if (window.trackImageCount) {
        requestAnimationFrame(() => {
          window.trackImageCount--
        })
      }
    }
    if (hash) {
      return this.createInstance(path, hash[1])
    }
  },

  getHash(path, id) {
    return [
      this.type,
      id,
      {
        u: path.data.url,
        w: path.data.width,
        h: path.data.height,
        r: path.data.ratio,
      },
    ]
  },
})
