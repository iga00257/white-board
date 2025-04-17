/**
 * It's a runtime status of current tutormeet session
 *
 */

//Playback & SessionRoom context
const context = {
  cid: '',
  roomCid: '',
  profile: {},
  whiteboard: null,
  socket: {},
  playbackEventManager: null,
  log: null,
  get whiteboardItems() {
    return this.whiteboard.toolbarHandler._itemManager._items
  },
  get materials() {
    return this.whiteboard._materials
  },
  get whiteboardTool() {
    return this.whiteboard.toolbarHandler._tool
  },
  enableLog: true,
  enableReceive: true,
  language: 'zh',
  room: {},
  // 是否開啟 學生端 默認麥克風靜音
  defaultMuteStudent: true,
  // 設定下方控制列顯示周期
  // 1 = 1 day; 0.5 = half day
  // new Date(new Date().getTime() + 1 * 60 * 1000) = 1 minute
  // ref:https://github.com/js-cookie/js-cookie/wiki/Frequently-Asked-Questions#expire-cookies-in-less-than-a-day
  mediaHintExpireTime: 1,
  playbackRate: 1,
}

context.toJSON = function () {
  return {}
}

context.toString = function () {}

window._milkyway_context = context
export default context
