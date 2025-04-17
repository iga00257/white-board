/**
 * communicate between whiteboard & it's enveriament
 * 1)
 * 2) recv external action and do something.
 */
import paper from 'paper'
import store from './store'
import History from './history'
import isEmpty from 'lodash/isEmpty'

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
      },
    })
  },

  send(action, data = {}, ignoreRecord = false) {
    let record = data

    if (action === 'ADD') {
      store.add(data)
      record = data.map(item => item.hash)
    } else if (action === 'DELETE') {
      record = store.deleteSelect()
      if (record.length === 0) return
    } else if (action === 'DELETE_ALL') {
      store.deleteAll()
    } else if (action === 'MOVE') {
      move(data.ids, data.offset)
    } else if (action === 'SCALE') {
      scale(data.ids, data.scale)
    }

    !ignoreRecord &&
      this.history.record({
        action,
        data: record,
      })
  },

  recv(action, data) {
    if (action === 'ADD' && Array.isArray(data)) {
      const items = data.map(hash => {
        return store.createItem(hash)
      })
      store.add(items)
    } else if (action === 'DELETE') {
      store.delete(data)
    } else if (action === 'DELETE_ALL') {
      store.deleteAll()
    } else if (action === 'MOVE') {
      move(data.ids, data.offset)
    } else if (action === 'SCALE') {
      scale(data.ids, data.scale)
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

  deleteAll() {
    const $textContainer = document.querySelector('#text-container')
    $textContainer && ($textContainer.innerHTML = '')
    this.send('DELETE_ALL')
  },

  // 基本的匯出功能
  exportImage() {
    return paper.view.element.toDataURL('image/png')
  },
}
