'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.default = flushToReact
exports.flushToHTML = flushToHTML

var _react = require('react')

var _react2 = _interopRequireDefault(_react)

var _style = require('./style')

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

function flushToReact() {
  return (0, _style.flush)().map(function(args) {
    var id = args[0]
    var css = args[1]
    return _react2.default.createElement('style', {
      id: '__' + id,
      // Avoid warnings upon render with a key
      key: '__' + id,
      dangerouslySetInnerHTML: {
        __html: css
      }
    })
  })
}

function flushToHTML() {
  return (0, _style.flush)().reduce(function(html, args) {
    var id = args[0]
    var css = args[1]
    html += '<style id="__' + id + '">' + css + '</style>'
    return html
  }, '')
}
