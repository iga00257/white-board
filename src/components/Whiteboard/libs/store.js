import find from 'lodash/find';
import includes from 'lodash/includes';
import isEmpty from 'lodash/isEmpty';
import compact from 'lodash/compact';
/**
 * store & manage all paper.js items
 */
let items = [];
let helper = null;

export default {
  /**
   * add instances
   */
  add(instances) {
    if (!instances || !instances[0]) return; //暂时处理text tool  传空数组过来的bug
    const instanceList = compact(instances);
    items.push(...instanceList);
  },

  /**
   * delete by ids
   */
  delete(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    items = items.filter(item => {
      if (includes(ids, item.id)) {
        item.remove();
        return false;
      }
      return true;
    });
  },

  diff(leftList, rightList) {
    if (leftList.length !== rightList.length) return true;

    for (let i = 0, len = leftList.length; i < len; i++) {
      if (leftList[i].id !== rightList[i].id) return true;
    }
    return false;
  },

  selectAll() {
    items.forEach(item => (item.path.selected = true));
  },

  antiSelectAll(id) {
    items.forEach(item => (item.path.selected = !item.path.selected));
  },

  deselectAll(id) {
    items.forEach(item => {
      if (!isEmpty(item)) {
        item.path.selected = false;
      }
    });
  },

  /**
   * delete selected items and return hash
   */
  deleteSelect() {
    let deletedItems = [];
    items = items.filter(item => {
      if (item.path.selected === true) {
        deletedItems.push(item.hash);
        item.remove();
        return false;
      }
      return true;
    });
    this.removeHelper();
    return deletedItems;
  },

  deleteAll() {
    items.forEach(item => {
      item.path.onremove && item.path.onremove();
      item.path.remove();
    });
    items = [];
    this.removeHelper();
  },

  find(id) {
    return find(items, item => item && item.id === id);
  },

  get selectedItems() {
    return items.filter(item => item.path.selected);
  },

  get items() {
    return items;
  },

  get helper() {
    return helper;
  },

  set helper(val) {
    helper = val;
  },

  removeHelper() {
    helper && helper.path.remove();
    helper = null;
  },
};
