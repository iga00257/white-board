import Icon from '@components/Icon'
import Modal from '@components/Modal'
import Toast from '@components/Toast'
import { CONSULTANT } from '@constants/constants'
import { getLang } from '@utils/string'
import URL from '@utils/url'
import axios from 'axios'
import paper from 'paper'
import React, { useCallback, useState } from 'react'
import './feedback.scss'

const btnRight = 24
const btnBottom = 22
const hasCheckedUrl = []

export default (path, url, hash) => {
  const lang = getLang(navigator.language)
  let localForbiddenUrl = require(`@/assets/images/image_forbidden_en.png`)
  try {
    localForbiddenUrl = require(`@/assets/images/image_forbidden_${lang}.png`)
  } catch (e) {
    console.error(e)
  }

  // 是图库图片，非顾问
  if (
    window.GDATA.role !== CONSULTANT &&
    (url.includes('matrix-stage.tutormeet.com') || url.includes('matrix.tutormeet.com'))
  ) {
    const btnPath = new paper.Raster({
      source: require('@/assets/images/image_feedback.png'),
      crossOrigin: 'anonymous',
      visible: false,
      onMouseEnter: () => {
        paper.view.element.style.setProperty('cursor', 'pointer')
      },
      onMouseLeave: () => {
        paper.view.element.style.setProperty('cursor', null)
      },
      onClick: () => {
        imageFeedbackClick(hash[2].u)
      },
    })

    path.onLoad = () => {
      // playback,检测图片是否下架
      if (!!window.GDATA.isPlayback || !!window.GDATA.isMaterialGenerator) {
        if (!hasCheckedUrl.includes(url)) {
          hasCheckedUrl.push(url)
          axios
            .head(url)
            .then(res => {
              if (
                res.headers['x-oss-meta-forbidden'] &&
                res.headers['x-oss-meta-forbidden'] === 'true'
              ) {
                // 图片被下架，更换本地图片，不显示举报按钮
                if (path.source !== localForbiddenUrl) {
                  path.source = localForbiddenUrl
                  path.visible = true
                }
              } else {
                // 图片未下架，显示举报按钮
                path.visible = true
                btnPath.position = new paper.Point(
                  path.bounds.right - btnRight,
                  path.bounds.bottom - btnBottom
                )
                btnPath.visible = !!window.GDATA.isMaterialGenerator ? false : true
              }
            })
            .catch(err => {
              // 图片未加载到
              if (path.source !== localForbiddenUrl) {
                path.source = localForbiddenUrl
                path.visible = true
              }
            })
        }
      } else {
        // 不是录影档，不检查图片是否下架，显示举报按钮
        btnPath.position = new paper.Point(
          path.bounds.right - btnRight,
          path.bounds.bottom - btnBottom
        )
        btnPath.visible = true
      }

      if (window.trackImageCount) {
        requestAnimationFrame(() => {
          window.trackImageCount--
        })
      }
    }
    path.onscale = () => {
      if (btnPath) {
        btnPath.position = new paper.Point(
          path.bounds.right - btnRight,
          path.bounds.bottom - btnBottom
        )
      }
    }
    path.onremove = () => {
      if (btnPath) {
        btnPath.remove()
      }
    }
    path.onmove = () => {
      if (btnPath) {
        btnPath.position = new paper.Point(
          path.bounds.right - btnRight,
          path.bounds.bottom - btnBottom
        )
      }
    }
  } else {
    // 不是图库图片，取消隐藏
    path.visible = true
  }
}

const imageFeedbackClick = src => {
  const url = URL.imgFeedback
  let detail = ''
  const { destroy } = Modal.confirm({
    title: (global && global.LANG_PKG && global.LANG_PKG.lblSearchPhotosReport) || '举报图片',
    cancelText: (global && global.LANG_PKG && global.LANG_PKG.lblSearchPhotosCancelText) || '取消',
    okText: (global && global.LANG_PKG && global.LANG_PKG.lblSearchPhotosOkText) || '举报与反馈',
    width: 600,
    autoClose: false,
    content: (
      <IssueSelect
        onSelected={issue => {
          detail = issue
        }}
      />
    ),
    onOk: () => {
      if (!!detail) {
        const data = {
          detail,
          imgID: src,
          marker: `${window.GDATA.identityId}`,
          sid: window.GDATA.sessionRoomId,
          source: src,
        }
        axios.post(url, data)
        Toast.success({
          content:
            (global && global.LANG_PKG && global.LANG_PKG.lblSearchPhotosReportSuccess) ||
            '举报已提交',
        })
        destroy()
      } else {
        Toast.warn({
          content:
            (global && global.LANG_PKG && global.LANG_PKG.lblSearchPhotosSelectIssue) ||
            '请选择您要反馈的问题',
        })
      }
    },
  })
}

const IssueSelect = props => {
  const [selected, setSelected] = useState('')
  const [optionsHeight, setOptionsHeight] = useState(0)
  const lineHeight = 40
  const issueList =
    global && global.LANG_PKG
      ? [
          { localContent: global.LANG_PKG.lblSearchReportIssue1, zhContent: '版权侵犯' },
          { localContent: global.LANG_PKG.lblSearchReportIssue2, zhContent: '隐私问题' },
          {
            localContent: global.LANG_PKG.lblSearchReportIssue3,
            zhContent: '色情暴力等其他不适宜内容',
          },
        ]
      : [
          { localContent: '版权侵犯', zhContent: '版权侵犯' },
          { localContent: '隐私问题', zhContent: '隐私问题' },
          { localContent: '色情暴力等其他不适宜内容', zhContent: '色情暴力等其他不适宜内容' },
        ]
  const handleSelectClick = useCallback(() => {
    setOptionsHeight(optionsHeight === 0 ? issueList.length * lineHeight : 0)
  }, [optionsHeight, issueList])
  const handleIssueClick = useCallback(item => {
    setSelected(item.localContent)
    props.onSelected && props.onSelected(item.zhContent)
    setOptionsHeight(0)
  }, [])
  return (
    <div>
      <div className="image-feedback-title">
        {(global && global.LANG_PKG && global.LANG_PKG.lblSearchPhotosSelectIssue) ||
          '请选择您要反馈的问题'}
      </div>
      <div
        className="image-feedback-select"
        style={{ height: `${(issueList.length + 1) * lineHeight}px` }}
      >
        <div className="image-feedback-selected" onClick={handleSelectClick}>
          {selected || (
            <span className="image-feedback-default">
              ----{(global && global.LANG_PKG && global.LANG_PKG.lblSearchPleaseSelect) || '请选择'}
              ----
            </span>
          )}
          <Icon
            name="bottom-arrow"
            className={`select-arrow ${optionsHeight > 0 ? 'rotate' : ''}`}
          />
        </div>
        <div
          className="image-feedback-option-list"
          style={{
            height: `${optionsHeight}px`,
            border: optionsHeight === 0 ? 'none' : '1px solid #ddd',
          }}
        >
          {issueList.map((item, index) => (
            <div
              className="image-feedback-option"
              key={index}
              onClick={() => {
                handleIssueClick(item)
              }}
            >
              {item.localContent}
              <Icon name="done" className="image-feedback-option-icon" size={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
