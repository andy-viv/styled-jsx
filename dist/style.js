'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})

var _createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i]
      descriptor.enumerable = descriptor.enumerable || false
      descriptor.configurable = true
      if ('value' in descriptor) descriptor.writable = true
      Object.defineProperty(target, descriptor.key, descriptor)
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps)
    if (staticProps) defineProperties(Constructor, staticProps)
    return Constructor
  }
})()

exports.flush = flush

var _react = require('react')

var _stylesheetRegistry = require('./stylesheet-registry')

var _stylesheetRegistry2 = _interopRequireDefault(_stylesheetRegistry)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function')
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    )
  }
  return call && (typeof call === 'object' || typeof call === 'function')
    ? call
    : self
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError(
      'Super expression must either be null or a function, not ' +
        typeof superClass
    )
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  })
  if (superClass)
    Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      : (subClass.__proto__ = superClass)
}

var styleSheetRegistry = new _stylesheetRegistry2.default()

var JSXStyle = (function(_Component) {
  _inherits(JSXStyle, _Component)

  function JSXStyle() {
    _classCallCheck(this, JSXStyle)

    return _possibleConstructorReturn(
      this,
      (JSXStyle.__proto__ || Object.getPrototypeOf(JSXStyle)).apply(
        this,
        arguments
      )
    )
  }

  _createClass(
    JSXStyle,
    [
      {
        key: 'componentWillMount',
        value: function componentWillMount() {
          styleSheetRegistry.add(this.props)
        }
      },
      {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps) {
          return this.props.css !== nextProps.css
        }

        // To avoid FOUC, we process new changes
        // on `componentWillUpdate` rather than `componentDidUpdate`.
      },
      {
        key: 'componentWillUpdate',
        value: function componentWillUpdate(nextProps) {
          styleSheetRegistry.update(this.props, nextProps)
        }
      },
      {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          styleSheetRegistry.remove(this.props)
        }
      },
      {
        key: 'render',
        value: function render() {
          return null
        }
      }
    ],
    [
      {
        key: 'dynamic',
        value: function dynamic(info) {
          return info
            .map(function(tagInfo) {
              var baseId = tagInfo[0]
              var props = tagInfo[1]
              return styleSheetRegistry.computeId(baseId, props)
            })
            .join(' ')
        }
      }
    ]
  )

  return JSXStyle
})(_react.Component)

exports.default = JSXStyle
function flush() {
  var cssRules = styleSheetRegistry.cssRules()
  styleSheetRegistry.flush()
  return cssRules
}
