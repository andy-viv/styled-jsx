'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.visitor = undefined

var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i]
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key]
        }
      }
    }
    return target
  }

exports.processTaggedTemplateExpression = processTaggedTemplateExpression

exports.default = function() {
  return _extends(
    {
      Program: function Program(path, state) {
        ;(0, _utils.setStateOptions)(state)
      }
    },
    visitor
  )
}

var _babelTypes = require('babel-types')

var t = _interopRequireWildcard(_babelTypes)

var _constants = require('./_constants')

var _utils = require('./_utils')

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj
  } else {
    var newObj = {}
    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key))
          newObj[key] = obj[key]
      }
    }
    newObj.default = obj
    return newObj
  }
}

var isModuleExports = t.buildMatchMemberExpression('module.exports')

function processTaggedTemplateExpression(_ref) {
  var type = _ref.type,
    path = _ref.path,
    fileInfo = _ref.fileInfo,
    splitRules = _ref.splitRules,
    plugins = _ref.plugins,
    vendorPrefix = _ref.vendorPrefix

  var templateLiteral = path.get('quasi')
  var scope = void 0

  // Check whether there are undefined references or
  // references to this.something (e.g. props or state).
  // We allow dynamic styles only when resolving styles.
  if (type !== 'resolve') {
    ;(0, _utils.validateExternalExpressions)(templateLiteral)
  } else if (!path.scope.path.isProgram()) {
    scope = (0, _utils.getScope)(path)
  }

  var stylesInfo = (0, _utils.getJSXStyleInfo)(templateLiteral, scope)

  var _computeClassNames = (0, _utils.computeClassNames)([stylesInfo]),
    staticClassName = _computeClassNames.staticClassName,
    className = _computeClassNames.className

  var styles = (0, _utils.processCss)(
    _extends({}, stylesInfo, {
      staticClassName: staticClassName,
      fileInfo: fileInfo,
      isGlobal: type === 'global',
      plugins: plugins,
      vendorPrefix: vendorPrefix
    }),
    { splitRules: splitRules }
  )

  if (type === 'resolve') {
    var hash = styles.hash,
      _css = styles.css,
      expressions = styles.expressions

    path.replaceWith(
      // {
      //   styles: <_JSXStyle ... />,
      //   className: 'jsx-123'
      // }
      t.objectExpression([
        t.objectProperty(
          t.identifier('styles'),
          (0, _utils.makeStyledJsxTag)(hash, _css, expressions)
        ),
        t.objectProperty(t.identifier('className'), className)
      ])
    )
    return
  }

  var id = path.parentPath.node.id
  var baseExportName = id ? id.name : 'default'
  var parentPath =
    baseExportName === 'default'
      ? path.parentPath
      : path.findParent(function(path) {
          return (
            path.isVariableDeclaration() ||
            (path.isAssignmentExpression() &&
              isModuleExports(path.get('left').node))
          )
        })

  if (baseExportName !== 'default' && !parentPath.parentPath.isProgram()) {
    parentPath = parentPath.parentPath
  }

  var css = (0, _utils.cssToBabelType)(styles.css)
  var newPath = t.isArrayExpression(css)
    ? css
    : t.newExpression(t.identifier('String'), [css])

  // default exports

  if (baseExportName === 'default') {
    var defaultExportIdentifier = path.scope.generateUidIdentifier(
      'defaultExport'
    )
    parentPath.insertBefore(
      t.variableDeclaration('const', [
        t.variableDeclarator(defaultExportIdentifier, newPath)
      ])
    )

    parentPath.insertBefore(addHash(defaultExportIdentifier, styles.hash))
    path.replaceWith(defaultExportIdentifier)
    return
  }

  // local and named exports

  parentPath.insertAfter(addHash(t.identifier(baseExportName), styles.hash))
  path.replaceWith(newPath)
}

function addHash(exportIdentifier, hash) {
  var value = typeof hash === 'string' ? t.stringLiteral(hash) : hash
  return t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(exportIdentifier, t.identifier('__hash')),
      value
    )
  )
}

var visitor = (exports.visitor = {
  ImportDeclaration: function ImportDeclaration(path, state) {
    // import css from 'styled-jsx/css'
    if (path.node.source.value !== 'styled-jsx/css') {
      return
    }

    // Find all the imported specifiers.
    // e.g import css, { global, resolve } from 'styled-jsx/css'
    // -> ['css', 'global', 'resolve']
    var specifiersNames = path.node.specifiers.map(function(specifier) {
      return specifier.local.name
    })
    specifiersNames.forEach(function(tagName) {
      // Get all the reference paths i.e. the places that use the tagName above
      // eg.
      // css`div { color: red }`
      // css.global`div { color: red }`
      // global`div { color: red `
      var binding = path.scope.getBinding(tagName)

      if (!binding || !Array.isArray(binding.referencePaths)) {
        return
      }

      // Produces an object containing all the TaggedTemplateExpression paths detected.
      // The object contains { scoped, global, resolve }
      var taggedTemplateExpressions = binding.referencePaths
        .map(function(ref) {
          return ref.parentPath
        })
        .reduce(
          function(result, path) {
            var taggedTemplateExpression = void 0
            if (path.isTaggedTemplateExpression()) {
              // css`` global`` resolve``
              taggedTemplateExpression = path
            } else if (
              path.parentPath &&
              path.isMemberExpression() &&
              path.parentPath.isTaggedTemplateExpression()
            ) {
              // This part is for css.global`` or css.resolve``
              // using the default import css
              taggedTemplateExpression = path.parentPath
            } else {
              return result
            }

            var tag = taggedTemplateExpression.get('tag')
            var id = tag.isIdentifier()
              ? tag.node.name
              : tag.get('property').node.name

            if (result[id]) {
              result[id].push(taggedTemplateExpression)
            } else {
              result.scoped.push(taggedTemplateExpression)
            }
            return result
          },
          {
            scoped: [],
            global: [],
            resolve: []
          }
        )

      var hasJSXStyle = false

      var _state$opts = state.opts,
        vendorPrefix = _state$opts.vendorPrefix,
        sourceMaps = _state$opts.sourceMaps

      Object.keys(taggedTemplateExpressions).forEach(function(type) {
        return taggedTemplateExpressions[type].forEach(function(path) {
          hasJSXStyle = true
          // Process each css block
          processTaggedTemplateExpression({
            type: type,
            path: path,
            fileInfo: {
              file: state.file,
              sourceFileName: state.file.opts.sourceFileName,
              sourceMaps: sourceMaps
            },
            splitRules:
              typeof state.opts.optimizeForSpeed === 'boolean'
                ? state.opts.optimizeForSpeed
                : process.env.NODE_ENV === 'production',
            plugins: state.plugins,
            vendorPrefix: vendorPrefix
          })
        })
      })

      // When using the `resolve` helper we need to add an import
      // for the _JSXStyle component `styled-jsx/style`
      if (
        hasJSXStyle &&
        taggedTemplateExpressions.resolve.length > 0 &&
        !state.hasInjectedJSXStyle &&
        !path.scope.hasBinding(_constants.STYLE_COMPONENT)
      ) {
        state.hasInjectedJSXStyle = true
        var importDeclaration = (0,
        _utils.createReactComponentImportDeclaration)()
        path.scope.path.node.body.unshift(importDeclaration)
      }
    })

    // Finally remove the import
    path.remove()
  }
})
