/**
 * extract const of whiteboard for other component
 */
import * as constants from '@/components/Whiteboard/libs/const'

export default constants

export const strokeWidth = {
  LIGHT: 2,
  BOLD: 5,
  BOLDER: 15,
}

export const strokeColor = {
  BLACK: '#282828',
  RED: '#ff4b59',
  GREEN: '#8ecf54',
  ORANGE: '#ffa300',
  BLUE: '#00b8fc',
  KIDS_BLUE: '#1B3EB2',
  PURPLE: '#da64e2',
  KIDS_PURPLE: '#8A26BD',
  WHITE: '#fff',
  YELLOW: '#f4d10c',
  BROWN: '#6A3906',
  GREY: '#848484',
  SKIN: '#FCF6D0',
}
export const kidsStrokeColor = {
  RED: '#E52819',
  YELLOW: '#FBD517',
  GREEN: '#1B982C',
  BLUE: '#1B3EB2',
  BLACK: '#282828',
  ORANGE: '#F2770B',
  BROWN: '#994E14',
  PURPLE: '#8A26BD',
}
export const textLanguage = {
  Simplified_Chinese: 'zh',
  Traditional_Chinese: 'tw',
  Simplified_Chinese_pinyin: 'zh_pin',
  Traditional_Chinese_pinyin: 'tw_pin',
  Simplified_Chinese_zhuyin: 'zh_zin',
  Traditional_Chinese_zhuyin: 'tw_zin',
}

export const fontSize = {
  SMALL: 20,
  MIDDLE: 38,
  BIG: 48,
}

export const theme = {
  theme1: 1,
  theme2: 2,
  theme3: 3,
}

export const PARTICIPANT_LIST_MODE = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
}

export const WB_ACTIVE_WINDOW = 'activeWindow'
