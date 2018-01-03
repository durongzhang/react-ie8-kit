
if (typeof Promise === 'undefined') {
  //拒绝跟踪可以防止React进入一个常见问题
  //由于错误而导致状态不一致，但被Promise吞噬，
  //并且不知道是什么导致了React的不稳定的行为。
  require('promise/lib/rejection-tracking').enable();
  window.Promise = require('promise/lib/es6-extensions.js');
}

// fetch()
require('whatwg-fetch');

// Object.assign（）通常与React一起使用。
//如果它存在，它将使用本地实现，而不是bug。
Object.assign = require('object-assign');