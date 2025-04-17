const chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');

export function strFormat(str, ...params) {
  if (params.length === 0) return str;
  for (var s = str, i = 0; i < params.length; i++) s = s.replace(new RegExp('\\{{' + i + '\\}}', 'g'), params[i]);
  return s;
}

export function generateMixed(n) {
  var res = '';
  for (var i = 0; i < n; i++) {
    var id = Math.ceil(Math.random() * 35);
    res += chars[id];
  }
  return res;
}

export function Escape(str) {
  let s = '';
  if (str.length === 0) return '';
  s = str.replace(' ', '&nbsp;');
  s = s.replace(/'/g, '&#39;');
  s = s.replace(/"/g, '&quot;');
  s = s.replace(/\n/g, '<br/>');
  return s;
}

export function Unescape(str) {
  let s = '';
  if (str.length === 0) return '';
  s = str.replace(/&nbsp;/g, ' ');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/<br\/>/g, '\n');
  return s;
}

/**
 * 将英文名字改为 名➕姓首字母大写
 * @param {string} name 名字
 */
export function parseName(name) {
  const reg = /^([a-zA-Z0-9]+\s)(.+)$/;
  if (!reg.test(name)) return name;
  return name.replace(reg, ($1, $2, $3) => {
    return $2 + $3.substring(0, 1).toUpperCase();
  });
}

//解析多语言字符串或对象
export const parseLangs = desclist => {
  //desclist="en-us=Please speak a bit slower.&zh-tw=講話速度太快&ja-jp=もう少しゆっくり話してください。&zh-cn=讲话速度太快"
  let langs = {};
  if (typeof desclist === 'object') {
    langs = { ...desclist };
  } else {
    const list = (desclist && desclist.split('&')) || [];
    list.forEach(item => {
      const temp = item.split('=');
      if (temp && temp.length === 2) {
        langs[temp[0]] = temp[1];
      }
    });
  }
  return {
    ...langs,
    en: langs['en-us'],
    ja: langs['ja-jp'],
    tr: langs['tr-tr'],
    ko: langs['ko-kr'],
    id: langs['id-id'],
  };
};

export function getLang(language) {
  let lang = 'en';
  language = (language || '').toLowerCase();
  if (language === 'zh' || language === 'zh-cn' || language === 'zh_cn') lang = 'zh-cn';
  if (language === 'zh-tw' || language === 'zh_tw') lang = 'zh-tw';
  if (language === 'ja' || language === 'ja-jp' || language === 'ja_jp') lang = 'ja';
  if (language === 'tr' || language === 'tr-tr' || language === 'tr_tr') lang = 'tr';
  if (language === 'en-hk' || language === 'en_hk') lang = 'en-hk';
  if (language === 'zh-hk' || language === 'zh_hk') lang = 'zh-hk';
  if (language === 'ko' || language === 'ko-kr' || language === 'ko_kr') lang = 'ko';
  if (language === 'id' || language === 'id-id' || language === 'id_id') lang = 'id';
  if (language === 'es-pe' || language === 'es_pe') lang = 'es-pe';
  if (language === 'es-es' || language === 'es_es') lang = 'es-es';
  if (language === 'es-co' || language === 'es_co') lang = 'es-co';
  return lang;
}

export function toCanmsgLang(language) {
  let lang = language;
  if (lang === 'id' || lang === 'id-id' || lang === 'id_id') lang = 'id-id';
  return lang;
}

export const getLocale = language => {
  let locale = 'en_us';
  language = (language || '').toLowerCase();
  if (language === 'zh' || language === 'zh-cn' || language === 'zh_cn') locale = 'zh_cn';
  if (language === 'en-hk' || language === 'en_hk') locale = 'en_hk';
  if (language === 'zh-hk' || language === 'zh_hk') locale = 'zh_hk';
  if (language === 'zh-tw' || language === 'zh_tw') locale = 'zh_tw';
  if (language === 'ja' || language === 'ja-jp' || language === 'ja_jp') locale = 'ja_jp';
  if (language === 'tr' || language === 'tr-tr' || language === 'tr_tr') locale = 'tr_tr';
  if (language === 'ko' || language === 'ko-kr' || language === 'ko_kr') locale = 'ko_kr';
  if (language === 'id' || language === 'id-id' || language === 'id_id') locale = 'id_id';
  if (language === 'es-pe' || language === 'es_pe') locale = 'es_pe';
  if (language === 'es-es' || language === 'es_es') locale = 'es_es';
  if (language === 'es-co' || language === 'es_co') locale = 'es_co';
  return locale;
};

export const isExistParam = url => {
  return /[?&].+=/.test(url);
};

export const supLocale = (url = '', language) => {
  if (!url) return url;
  let locale = getLocale(language);
  return url + (isExistParam(url) ? '&' : '?') + 'locale=' + locale;
};

export const subFmt = (msg, isLimit, limit, suffix = '') => {
  return isLimit && msg.length > limit ? (suffix ? msg.substring(0, limit) + suffix : msg.substring(0, limit)) : msg;
};
