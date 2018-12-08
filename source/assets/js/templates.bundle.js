function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n.default || n;
}

var fs = {};

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;

  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];

    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  } // if the path is allowed to go above the root, restore leading ..s


  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
} // Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.


var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;

var splitPath = function (filename) {
  return splitPathRe.exec(filename).slice(1);
}; // path.resolve([from ...], to)
// posix version


function resolve() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = i >= 0 ? arguments[i] : '/'; // Skip empty and invalid entries

    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  } // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)
  // Normalize the path


  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function (p) {
    return !!p;
  }), !resolvedAbsolute).join('/');
  return (resolvedAbsolute ? '/' : '') + resolvedPath || '.';
}
// posix version

function normalize(path) {
  var isPathAbsolute = isAbsolute(path),
      trailingSlash = substr(path, -1) === '/'; // Normalize the path

  path = normalizeArray(filter(path.split('/'), function (p) {
    return !!p;
  }), !isPathAbsolute).join('/');

  if (!path && !isPathAbsolute) {
    path = '.';
  }

  if (path && trailingSlash) {
    path += '/';
  }

  return (isPathAbsolute ? '/' : '') + path;
}

function isAbsolute(path) {
  return path.charAt(0) === '/';
} // posix version

function join() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return normalize(filter(paths, function (p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }

    return p;
  }).join('/'));
} // path.relative(from, to)
// posix version

function relative(from, to) {
  from = resolve(from).substr(1);
  to = resolve(to).substr(1);

  function trim(arr) {
    var start = 0;

    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;

    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;

  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];

  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join('/');
}
var sep = '/';
var delimiter = ':';
function dirname(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
}
function basename(path, ext) {
  var f = splitPath(path)[2]; // TODO: make this comparison case-insensitive on windows?

  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }

  return f;
}
function extname(path) {
  return splitPath(path)[3];
}
var path = {
  extname: extname,
  basename: basename,
  dirname: dirname,
  sep: sep,
  delimiter: delimiter,
  relative: relative,
  join: join,
  isAbsolute: isAbsolute,
  normalize: normalize,
  resolve: resolve
};

function filter(xs, f) {
  if (xs.filter) return xs.filter(f);
  var res = [];

  for (var i = 0; i < xs.length; i++) {
    if (f(xs[i], i, xs)) res.push(xs[i]);
  }

  return res;
} // String.prototype.substr - negative index don't work in IE8


var substr = 'ab'.substr(-1) === 'b' ? function (str, start, len) {
  return str.substr(start, len);
} : function (str, start, len) {
  if (start < 0) start = str.length + start;
  return str.substr(start, len);
};

var utils = createCommonjsModule(function (module, exports) {

  var regExpChars = /[|\\{}()[\]^$+*?.]/g;
  /**
   * Escape characters reserved in regular expressions.
   *
   * If `string` is `undefined` or `null`, the empty string is returned.
   *
   * @param {String} string Input string
   * @return {String} Escaped string
   * @static
   * @private
   */

  exports.escapeRegExpChars = function (string) {
    // istanbul ignore if
    if (!string) {
      return '';
    }

    return String(string).replace(regExpChars, '\\$&');
  };

  var _ENCODE_HTML_RULES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&#34;',
    "'": '&#39;'
  };
  var _MATCH_HTML = /[&<>'"]/g;

  function encode_char(c) {
    return _ENCODE_HTML_RULES[c] || c;
  }
  /**
   * Stringified version of constants used by {@link module:utils.escapeXML}.
   *
   * It is used in the process of generating {@link ClientFunction}s.
   *
   * @readonly
   * @type {String}
   */


  var escapeFuncStr = 'var _ENCODE_HTML_RULES = {\n' + '      "&": "&amp;"\n' + '    , "<": "&lt;"\n' + '    , ">": "&gt;"\n' + '    , \'"\': "&#34;"\n' + '    , "\'": "&#39;"\n' + '    }\n' + '  , _MATCH_HTML = /[&<>\'"]/g;\n' + 'function encode_char(c) {\n' + '  return _ENCODE_HTML_RULES[c] || c;\n' + '};\n';
  /**
   * Escape characters reserved in XML.
   *
   * If `markup` is `undefined` or `null`, the empty string is returned.
   *
   * @implements {EscapeCallback}
   * @param {String} markup Input string
   * @return {String} Escaped string
   * @static
   * @private
   */

  exports.escapeXML = function (markup) {
    return markup == undefined ? '' : String(markup).replace(_MATCH_HTML, encode_char);
  };

  exports.escapeXML.toString = function () {
    return Function.prototype.toString.call(this) + ';\n' + escapeFuncStr;
  };
  /**
   * Naive copy of properties from one object to another.
   * Does not recurse into non-scalar properties
   * Does not check to see if the property has a value before copying
   *
   * @param  {Object} to   Destination object
   * @param  {Object} from Source object
   * @return {Object}      Destination object
   * @static
   * @private
   */


  exports.shallowCopy = function (to, from) {
    from = from || {};

    for (var p in from) {
      to[p] = from[p];
    }

    return to;
  };
  /**
   * Naive copy of a list of key names, from one object to another.
   * Only copies property if it is actually defined
   * Does not recurse into non-scalar properties
   *
   * @param  {Object} to   Destination object
   * @param  {Object} from Source object
   * @param  {Array} list List of properties to copy
   * @return {Object}      Destination object
   * @static
   * @private
   */


  exports.shallowCopyFromList = function (to, from, list) {
    for (var i = 0; i < list.length; i++) {
      var p = list[i];

      if (typeof from[p] != 'undefined') {
        to[p] = from[p];
      }
    }

    return to;
  };
  /**
   * Simple in-process cache implementation. Does not implement limits of any
   * sort.
   *
   * @implements Cache
   * @static
   * @private
   */


  exports.cache = {
    _data: {},
    set: function (key, val) {
      this._data[key] = val;
    },
    get: function (key) {
      return this._data[key];
    },
    reset: function () {
      this._data = {};
    }
  };
});
var utils_1 = utils.escapeRegExpChars;
var utils_2 = utils.escapeXML;
var utils_3 = utils.shallowCopy;
var utils_4 = utils.shallowCopyFromList;
var utils_5 = utils.cache;

var _args = [
	[
		"ejs@2.6.1",
		"/Users/oncletom/workspace/hexo-theme"
	]
];
var _development = true;
var _from = "ejs@2.6.1";
var _id = "ejs@2.6.1";
var _inBundle = false;
var _integrity = "sha512-0xy4A/twfrRCnkhfk8ErDi5DqdAsAqeGxht4xkCUrsvhhbQNs7E+4jV0CN7+NKIY0aHE72+XvqtBIXzD31ZbXQ==";
var _location = "/ejs";
var _phantomChildren = {
};
var _requested = {
	type: "version",
	registry: true,
	raw: "ejs@2.6.1",
	name: "ejs",
	escapedName: "ejs",
	rawSpec: "2.6.1",
	saveSpec: null,
	fetchSpec: "2.6.1"
};
var _requiredBy = [
	"#DEV:/"
];
var _resolved = "https://registry.npmjs.org/ejs/-/ejs-2.6.1.tgz";
var _spec = "2.6.1";
var _where = "/Users/oncletom/workspace/hexo-theme";
var author = {
	name: "Matthew Eernisse",
	email: "mde@fleegix.org",
	url: "http://fleegix.org"
};
var bugs = {
	url: "https://github.com/mde/ejs/issues"
};
var contributors = [
	{
		name: "Timothy Gu",
		email: "timothygu99@gmail.com",
		url: "https://timothygu.github.io"
	}
];
var dependencies = {
};
var description = "Embedded JavaScript templates";
var devDependencies = {
	browserify: "^13.1.1",
	eslint: "^4.14.0",
	"git-directory-deploy": "^1.5.1",
	istanbul: "~0.4.3",
	jake: "^8.0.16",
	jsdoc: "^3.4.0",
	"lru-cache": "^4.0.1",
	mocha: "^5.0.5",
	"uglify-js": "^3.3.16"
};
var engines = {
	node: ">=0.10.0"
};
var homepage = "https://github.com/mde/ejs";
var keywords = [
	"template",
	"engine",
	"ejs"
];
var license = "Apache-2.0";
var main = "./lib/ejs.js";
var name = "ejs";
var repository = {
	type: "git",
	url: "git://github.com/mde/ejs.git"
};
var scripts = {
	coverage: "istanbul cover node_modules/mocha/bin/_mocha",
	devdoc: "jake doc[dev]",
	doc: "jake doc",
	lint: "eslint \"**/*.js\" Jakefile",
	test: "jake test"
};
var version = "2.6.1";
var _package = {
	_args: _args,
	_development: _development,
	_from: _from,
	_id: _id,
	_inBundle: _inBundle,
	_integrity: _integrity,
	_location: _location,
	_phantomChildren: _phantomChildren,
	_requested: _requested,
	_requiredBy: _requiredBy,
	_resolved: _resolved,
	_spec: _spec,
	_where: _where,
	author: author,
	bugs: bugs,
	contributors: contributors,
	dependencies: dependencies,
	description: description,
	devDependencies: devDependencies,
	engines: engines,
	homepage: homepage,
	keywords: keywords,
	license: license,
	main: main,
	name: name,
	repository: repository,
	scripts: scripts,
	version: version
};

var _package$1 = /*#__PURE__*/Object.freeze({
	_args: _args,
	_development: _development,
	_from: _from,
	_id: _id,
	_inBundle: _inBundle,
	_integrity: _integrity,
	_location: _location,
	_phantomChildren: _phantomChildren,
	_requested: _requested,
	_requiredBy: _requiredBy,
	_resolved: _resolved,
	_spec: _spec,
	_where: _where,
	author: author,
	bugs: bugs,
	contributors: contributors,
	dependencies: dependencies,
	description: description,
	devDependencies: devDependencies,
	engines: engines,
	homepage: homepage,
	keywords: keywords,
	license: license,
	main: main,
	name: name,
	repository: repository,
	scripts: scripts,
	version: version,
	default: _package
});

var require$$0 = getCjsExportFromNamespace(_package$1);

var ejs = createCommonjsModule(function (module, exports) {
  /**
   * @file Embedded JavaScript templating engine. {@link http://ejs.co}
   * @author Matthew Eernisse <mde@fleegix.org>
   * @author Tiancheng "Timothy" Gu <timothygu99@gmail.com>
   * @project EJS
   * @license {@link http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0}
   */

  /**
   * EJS internal functions.
   *
   * Technically this "module" lies in the same file as {@link module:ejs}, for
   * the sake of organization all the private functions re grouped into this
   * module.
   *
   * @module ejs-internal
   * @private
   */

  /**
   * Embedded JavaScript templating engine.
   *
   * @module ejs
   * @public
   */

  var scopeOptionWarned = false;
  var _VERSION_STRING = require$$0.version;
  var _DEFAULT_DELIMITER = '%';
  var _DEFAULT_LOCALS_NAME = 'locals';
  var _NAME = 'ejs';
  var _REGEX_STRING = '(<%%|%%>|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)';
  var _OPTS_PASSABLE_WITH_DATA = ['delimiter', 'scope', 'context', 'debug', 'compileDebug', 'client', '_with', 'rmWhitespace', 'strict', 'filename', 'async']; // We don't allow 'cache' option to be passed in the data obj for
  // the normal `render` call, but this is where Express 2 & 3 put it
  // so we make an exception for `renderFile`

  var _OPTS_PASSABLE_WITH_DATA_EXPRESS = _OPTS_PASSABLE_WITH_DATA.concat('cache');

  var _BOM = /^\uFEFF/;
  /**
   * EJS template function cache. This can be a LRU object from lru-cache NPM
   * module. By default, it is {@link module:utils.cache}, a simple in-process
   * cache that grows continuously.
   *
   * @type {Cache}
   */

  exports.cache = utils.cache;
  /**
   * Custom file loader. Useful for template preprocessing or restricting access
   * to a certain part of the filesystem.
   *
   * @type {fileLoader}
   */

  exports.fileLoader = fs.readFileSync;
  /**
   * Name of the object containing the locals.
   *
   * This variable is overridden by {@link Options}`.localsName` if it is not
   * `undefined`.
   *
   * @type {String}
   * @public
   */

  exports.localsName = _DEFAULT_LOCALS_NAME;
  /**
   * Promise implementation -- defaults to the native implementation if available
   * This is mostly just for testability
   *
   * @type {Function}
   * @public
   */

  exports.promiseImpl = new Function('return this;')().Promise;
  /**
   * Get the path to the included file from the parent file path and the
   * specified path.
   *
   * @param {String}  name     specified path
   * @param {String}  filename parent file path
   * @param {Boolean} isDir    parent file path whether is directory
   * @return {String}
   */

  exports.resolveInclude = function (name, filename, isDir) {
    var dirname = path.dirname;
    var extname = path.extname;
    var resolve = path.resolve;
    var includePath = resolve(isDir ? filename : dirname(filename), name);
    var ext = extname(name);

    if (!ext) {
      includePath += '.ejs';
    }

    return includePath;
  };
  /**
   * Get the path to the included file by Options
   *
   * @param  {String}  path    specified path
   * @param  {Options} options compilation options
   * @return {String}
   */


  function getIncludePath(path$$1, options) {
    var includePath;
    var filePath;
    var views = options.views; // Abs path

    if (path$$1.charAt(0) == '/') {
      includePath = exports.resolveInclude(path$$1.replace(/^\/*/, ''), options.root || '/', true);
    } // Relative paths
    else {
        // Look relative to a passed filename first
        if (options.filename) {
          filePath = exports.resolveInclude(path$$1, options.filename);

          if (fs.existsSync(filePath)) {
            includePath = filePath;
          }
        } // Then look in any views directories


        if (!includePath) {
          if (Array.isArray(views) && views.some(function (v) {
            filePath = exports.resolveInclude(path$$1, v, true);
            return fs.existsSync(filePath);
          })) {
            includePath = filePath;
          }
        }

        if (!includePath) {
          throw new Error('Could not find the include file "' + options.escapeFunction(path$$1) + '"');
        }
      }

    return includePath;
  }
  /**
   * Get the template from a string or a file, either compiled on-the-fly or
   * read from cache (if enabled), and cache the template if needed.
   *
   * If `template` is not set, the file specified in `options.filename` will be
   * read.
   *
   * If `options.cache` is true, this function reads the file from
   * `options.filename` so it must be set prior to calling this function.
   *
   * @memberof module:ejs-internal
   * @param {Options} options   compilation options
   * @param {String} [template] template source
   * @return {(TemplateFunction|ClientFunction)}
   * Depending on the value of `options.client`, either type might be returned.
   * @static
   */


  function handleCache(options, template) {
    var func;
    var filename = options.filename;
    var hasTemplate = arguments.length > 1;

    if (options.cache) {
      if (!filename) {
        throw new Error('cache option requires a filename');
      }

      func = exports.cache.get(filename);

      if (func) {
        return func;
      }

      if (!hasTemplate) {
        template = fileLoader(filename).toString().replace(_BOM, '');
      }
    } else if (!hasTemplate) {
      // istanbul ignore if: should not happen at all
      if (!filename) {
        throw new Error('Internal EJS error: no file name or template ' + 'provided');
      }

      template = fileLoader(filename).toString().replace(_BOM, '');
    }

    func = exports.compile(template, options);

    if (options.cache) {
      exports.cache.set(filename, func);
    }

    return func;
  }
  /**
   * Try calling handleCache with the given options and data and call the
   * callback with the result. If an error occurs, call the callback with
   * the error. Used by renderFile().
   *
   * @memberof module:ejs-internal
   * @param {Options} options    compilation options
   * @param {Object} data        template data
   * @param {RenderFileCallback} cb callback
   * @static
   */


  function tryHandleCache(options, data, cb) {
    var result;

    if (!cb) {
      if (typeof exports.promiseImpl == 'function') {
        return new exports.promiseImpl(function (resolve, reject) {
          try {
            result = handleCache(options)(data);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
      } else {
        throw new Error('Please provide a callback function');
      }
    } else {
      try {
        result = handleCache(options)(data);
      } catch (err) {
        return cb(err);
      }

      cb(null, result);
    }
  }
  /**
   * fileLoader is independent
   *
   * @param {String} filePath ejs file path.
   * @return {String} The contents of the specified file.
   * @static
   */


  function fileLoader(filePath) {
    return exports.fileLoader(filePath);
  }
  /**
   * Get the template function.
   *
   * If `options.cache` is `true`, then the template is cached.
   *
   * @memberof module:ejs-internal
   * @param {String}  path    path for the specified file
   * @param {Options} options compilation options
   * @return {(TemplateFunction|ClientFunction)}
   * Depending on the value of `options.client`, either type might be returned
   * @static
   */


  function includeFile(path$$1, options) {
    var opts = utils.shallowCopy({}, options);
    opts.filename = getIncludePath(path$$1, opts);
    return handleCache(opts);
  }
  /**
   * Get the JavaScript source of an included file.
   *
   * @memberof module:ejs-internal
   * @param {String}  path    path for the specified file
   * @param {Options} options compilation options
   * @return {Object}
   * @static
   */


  function includeSource(path$$1, options) {
    var opts = utils.shallowCopy({}, options);
    var includePath;
    var template;
    includePath = getIncludePath(path$$1, opts);
    template = fileLoader(includePath).toString().replace(_BOM, '');
    opts.filename = includePath;
    var templ = new Template(template, opts);
    templ.generateSource();
    return {
      source: templ.source,
      filename: includePath,
      template: template
    };
  }
  /**
   * Re-throw the given `err` in context to the `str` of ejs, `filename`, and
   * `lineno`.
   *
   * @implements RethrowCallback
   * @memberof module:ejs-internal
   * @param {Error}  err      Error object
   * @param {String} str      EJS source
   * @param {String} filename file name of the EJS file
   * @param {String} lineno   line number of the error
   * @static
   */


  function rethrow(err, str, flnm, lineno, esc) {
    var lines = str.split('\n');
    var start = Math.max(lineno - 3, 0);
    var end = Math.min(lines.length, lineno + 3);
    var filename = esc(flnm); // eslint-disable-line
    // Error context

    var context = lines.slice(start, end).map(function (line, i) {
      var curr = i + start + 1;
      return (curr == lineno ? ' >> ' : '    ') + curr + '| ' + line;
    }).join('\n'); // Alter exception message

    err.path = filename;
    err.message = (filename || 'ejs') + ':' + lineno + '\n' + context + '\n\n' + err.message;
    throw err;
  }

  function stripSemi(str) {
    return str.replace(/;(\s*$)/, '$1');
  }
  /**
   * Compile the given `str` of ejs into a template function.
   *
   * @param {String}  template EJS template
   *
   * @param {Options} opts     compilation options
   *
   * @return {(TemplateFunction|ClientFunction)}
   * Depending on the value of `opts.client`, either type might be returned.
   * Note that the return type of the function also depends on the value of `opts.async`.
   * @public
   */


  exports.compile = function compile(template, opts) {
    var templ; // v1 compat
    // 'scope' is 'context'
    // FIXME: Remove this in a future version

    if (opts && opts.scope) {
      if (!scopeOptionWarned) {
        console.warn('`scope` option is deprecated and will be removed in EJS 3');
        scopeOptionWarned = true;
      }

      if (!opts.context) {
        opts.context = opts.scope;
      }

      delete opts.scope;
    }

    templ = new Template(template, opts);
    return templ.compile();
  };
  /**
   * Render the given `template` of ejs.
   *
   * If you would like to include options but not data, you need to explicitly
   * call this function with `data` being an empty object or `null`.
   *
   * @param {String}   template EJS template
   * @param {Object}  [data={}] template data
   * @param {Options} [opts={}] compilation and rendering options
   * @return {(String|Promise<String>)}
   * Return value type depends on `opts.async`.
   * @public
   */


  exports.render = function (template, d, o) {
    var data = d || {};
    var opts = o || {}; // No options object -- if there are optiony names
    // in the data, copy them to options

    if (arguments.length == 2) {
      utils.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA);
    }

    return handleCache(opts, template)(data);
  };
  /**
   * Render an EJS file at the given `path` and callback `cb(err, str)`.
   *
   * If you would like to include options but not data, you need to explicitly
   * call this function with `data` being an empty object or `null`.
   *
   * @param {String}             path     path to the EJS file
   * @param {Object}            [data={}] template data
   * @param {Options}           [opts={}] compilation and rendering options
   * @param {RenderFileCallback} cb callback
   * @public
   */


  exports.renderFile = function () {
    var args = Array.prototype.slice.call(arguments);
    var filename = args.shift();
    var cb;
    var opts = {
      filename: filename
    };
    var data;
    var viewOpts; // Do we have a callback?

    if (typeof arguments[arguments.length - 1] == 'function') {
      cb = args.pop();
    } // Do we have data/opts?


    if (args.length) {
      // Should always have data obj
      data = args.shift(); // Normal passed opts (data obj + opts obj)

      if (args.length) {
        // Use shallowCopy so we don't pollute passed in opts obj with new vals
        utils.shallowCopy(opts, args.pop());
      } // Special casing for Express (settings + opts-in-data)
      else {
          // Express 3 and 4
          if (data.settings) {
            // Pull a few things from known locations
            if (data.settings.views) {
              opts.views = data.settings.views;
            }

            if (data.settings['view cache']) {
              opts.cache = true;
            } // Undocumented after Express 2, but still usable, esp. for
            // items that are unsafe to be passed along with data, like `root`


            viewOpts = data.settings['view options'];

            if (viewOpts) {
              utils.shallowCopy(opts, viewOpts);
            }
          } // Express 2 and lower, values set in app.locals, or people who just
          // want to pass options in their data. NOTE: These values will override
          // anything previously set in settings  or settings['view options']


          utils.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA_EXPRESS);
        }

      opts.filename = filename;
    } else {
      data = {};
    }

    return tryHandleCache(opts, data, cb);
  };
  /**
   * Clear intermediate JavaScript cache. Calls {@link Cache#reset}.
   * @public
   */


  exports.clearCache = function () {
    exports.cache.reset();
  };

  function Template(text, opts) {
    opts = opts || {};
    var options = {};
    this.templateText = text;
    this.mode = null;
    this.truncate = false;
    this.currentLine = 1;
    this.source = '';
    this.dependencies = [];
    options.client = opts.client || false;
    options.escapeFunction = opts.escape || utils.escapeXML;
    options.compileDebug = opts.compileDebug !== false;
    options.debug = !!opts.debug;
    options.filename = opts.filename;
    options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
    options.strict = opts.strict || false;
    options.context = opts.context;
    options.cache = opts.cache || false;
    options.rmWhitespace = opts.rmWhitespace;
    options.root = opts.root;
    options.outputFunctionName = opts.outputFunctionName;
    options.localsName = opts.localsName || exports.localsName || _DEFAULT_LOCALS_NAME;
    options.views = opts.views;
    options.async = opts.async;

    if (options.strict) {
      options._with = false;
    } else {
      options._with = typeof opts._with != 'undefined' ? opts._with : true;
    }

    this.opts = options;
    this.regex = this.createRegex();
  }

  Template.modes = {
    EVAL: 'eval',
    ESCAPED: 'escaped',
    RAW: 'raw',
    COMMENT: 'comment',
    LITERAL: 'literal'
  };
  Template.prototype = {
    createRegex: function () {
      var str = _REGEX_STRING;
      var delim = utils.escapeRegExpChars(this.opts.delimiter);
      str = str.replace(/%/g, delim);
      return new RegExp(str);
    },
    compile: function () {
      var src;
      var fn;
      var opts = this.opts;
      var prepended = '';
      var appended = '';
      var escapeFn = opts.escapeFunction;
      var asyncCtor;

      if (!this.source) {
        this.generateSource();
        prepended += '  var __output = [], __append = __output.push.bind(__output);' + '\n';

        if (opts.outputFunctionName) {
          prepended += '  var ' + opts.outputFunctionName + ' = __append;' + '\n';
        }

        if (opts._with !== false) {
          prepended += '  with (' + opts.localsName + ' || {}) {' + '\n';
          appended += '  }' + '\n';
        }

        appended += '  return __output.join("");' + '\n';
        this.source = prepended + this.source + appended;
      }

      if (opts.compileDebug) {
        src = 'var __line = 1' + '\n' + '  , __lines = ' + JSON.stringify(this.templateText) + '\n' + '  , __filename = ' + (opts.filename ? JSON.stringify(opts.filename) : 'undefined') + ';' + '\n' + 'try {' + '\n' + this.source + '} catch (e) {' + '\n' + '  rethrow(e, __lines, __filename, __line, escapeFn);' + '\n' + '}' + '\n';
      } else {
        src = this.source;
      }

      if (opts.client) {
        src = 'escapeFn = escapeFn || ' + escapeFn.toString() + ';' + '\n' + src;

        if (opts.compileDebug) {
          src = 'rethrow = rethrow || ' + rethrow.toString() + ';' + '\n' + src;
        }
      }

      if (opts.strict) {
        src = '"use strict";\n' + src;
      }

      if (opts.debug) {
        console.log(src);
      }

      try {
        if (opts.async) {
          // Have to use generated function for this, since in envs without support,
          // it breaks in parsing
          try {
            asyncCtor = new Function('return (async function(){}).constructor;')();
          } catch (e) {
            if (e instanceof SyntaxError) {
              throw new Error('This environment does not support async/await');
            } else {
              throw e;
            }
          }
        } else {
          asyncCtor = Function;
        }

        fn = new asyncCtor(opts.localsName + ', escapeFn, include, rethrow', src);
      } catch (e) {
        // istanbul ignore else
        if (e instanceof SyntaxError) {
          if (opts.filename) {
            e.message += ' in ' + opts.filename;
          }

          e.message += ' while compiling ejs\n\n';
          e.message += 'If the above error is not helpful, you may want to try EJS-Lint:\n';
          e.message += 'https://github.com/RyanZim/EJS-Lint';

          if (!e.async) {
            e.message += '\n';
            e.message += 'Or, if you meant to create an async function, pass async: true as an option.';
          }
        }

        throw e;
      }

      if (opts.client) {
        fn.dependencies = this.dependencies;
        return fn;
      } // Return a callable function which will execute the function
      // created by the source-code, with the passed data as locals
      // Adds a local `include` function which allows full recursive include


      var returnedFn = function (data) {
        var include = function (path$$1, includeData) {
          var d = utils.shallowCopy({}, data);

          if (includeData) {
            d = utils.shallowCopy(d, includeData);
          }

          return includeFile(path$$1, opts)(d);
        };

        return fn.apply(opts.context, [data || {}, escapeFn, include, rethrow]);
      };

      returnedFn.dependencies = this.dependencies;
      return returnedFn;
    },
    generateSource: function () {
      var opts = this.opts;

      if (opts.rmWhitespace) {
        // Have to use two separate replace here as `^` and `$` operators don't
        // work well with `\r`.
        this.templateText = this.templateText.replace(/\r/g, '').replace(/^\s+|\s+$/gm, '');
      } // Slurp spaces and tabs before <%_ and after _%>


      this.templateText = this.templateText.replace(/[ \t]*<%_/gm, '<%_').replace(/_%>[ \t]*/gm, '_%>');
      var self = this;
      var matches = this.parseTemplateText();
      var d = this.opts.delimiter;

      if (matches && matches.length) {
        matches.forEach(function (line, index) {
          var opening;
          var closing;
          var include;
          var includeOpts;
          var includeObj;
          var includeSrc; // If this is an opening tag, check for closing tags
          // FIXME: May end up with some false positives here
          // Better to store modes as k/v with '<' + delimiter as key
          // Then this can simply check against the map

          if (line.indexOf('<' + d) === 0 // If it is a tag
          && line.indexOf('<' + d + d) !== 0) {
            // and is not escaped
            closing = matches[index + 2];

            if (!(closing == d + '>' || closing == '-' + d + '>' || closing == '_' + d + '>')) {
              throw new Error('Could not find matching close tag for "' + line + '".');
            }
          } // HACK: backward-compat `include` preprocessor directives


          if (include = line.match(/^\s*include\s+(\S+)/)) {
            opening = matches[index - 1]; // Must be in EVAL or RAW mode

            if (opening && (opening == '<' + d || opening == '<' + d + '-' || opening == '<' + d + '_')) {
              includeOpts = utils.shallowCopy({}, self.opts);
              includeObj = includeSource(include[1], includeOpts);

              if (self.opts.compileDebug) {
                includeSrc = '    ; (function(){' + '\n' + '      var __line = 1' + '\n' + '      , __lines = ' + JSON.stringify(includeObj.template) + '\n' + '      , __filename = ' + JSON.stringify(includeObj.filename) + ';' + '\n' + '      try {' + '\n' + includeObj.source + '      } catch (e) {' + '\n' + '        rethrow(e, __lines, __filename, __line, escapeFn);' + '\n' + '      }' + '\n' + '    ; }).call(this)' + '\n';
              } else {
                includeSrc = '    ; (function(){' + '\n' + includeObj.source + '    ; }).call(this)' + '\n';
              }

              self.source += includeSrc;
              self.dependencies.push(exports.resolveInclude(include[1], includeOpts.filename));
              return;
            }
          }

          self.scanLine(line);
        });
      }
    },
    parseTemplateText: function () {
      var str = this.templateText;
      var pat = this.regex;
      var result = pat.exec(str);
      var arr = [];
      var firstPos;

      while (result) {
        firstPos = result.index;

        if (firstPos !== 0) {
          arr.push(str.substring(0, firstPos));
          str = str.slice(firstPos);
        }

        arr.push(result[0]);
        str = str.slice(result[0].length);
        result = pat.exec(str);
      }

      if (str) {
        arr.push(str);
      }

      return arr;
    },
    _addOutput: function (line) {
      if (this.truncate) {
        // Only replace single leading linebreak in the line after
        // -%> tag -- this is the single, trailing linebreak
        // after the tag that the truncation mode replaces
        // Handle Win / Unix / old Mac linebreaks -- do the \r\n
        // combo first in the regex-or
        line = line.replace(/^(?:\r\n|\r|\n)/, '');
        this.truncate = false;
      } else if (this.opts.rmWhitespace) {
        // rmWhitespace has already removed trailing spaces, just need
        // to remove linebreaks
        line = line.replace(/^\n/, '');
      }

      if (!line) {
        return line;
      } // Preserve literal slashes


      line = line.replace(/\\/g, '\\\\'); // Convert linebreaks

      line = line.replace(/\n/g, '\\n');
      line = line.replace(/\r/g, '\\r'); // Escape double-quotes
      // - this will be the delimiter during execution

      line = line.replace(/"/g, '\\"');
      this.source += '    ; __append("' + line + '")' + '\n';
    },
    scanLine: function (line) {
      var self = this;
      var d = this.opts.delimiter;
      var newLineCount = 0;
      newLineCount = line.split('\n').length - 1;

      switch (line) {
        case '<' + d:
        case '<' + d + '_':
          this.mode = Template.modes.EVAL;
          break;

        case '<' + d + '=':
          this.mode = Template.modes.ESCAPED;
          break;

        case '<' + d + '-':
          this.mode = Template.modes.RAW;
          break;

        case '<' + d + '#':
          this.mode = Template.modes.COMMENT;
          break;

        case '<' + d + d:
          this.mode = Template.modes.LITERAL;
          this.source += '    ; __append("' + line.replace('<' + d + d, '<' + d) + '")' + '\n';
          break;

        case d + d + '>':
          this.mode = Template.modes.LITERAL;
          this.source += '    ; __append("' + line.replace(d + d + '>', d + '>') + '")' + '\n';
          break;

        case d + '>':
        case '-' + d + '>':
        case '_' + d + '>':
          if (this.mode == Template.modes.LITERAL) {
            this._addOutput(line);
          }

          this.mode = null;
          this.truncate = line.indexOf('-') === 0 || line.indexOf('_') === 0;
          break;

        default:
          // In script mode, depends on type of tag
          if (this.mode) {
            // If '//' is found without a line break, add a line break.
            switch (this.mode) {
              case Template.modes.EVAL:
              case Template.modes.ESCAPED:
              case Template.modes.RAW:
                if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
                  line += '\n';
                }

            }

            switch (this.mode) {
              // Just executing code
              case Template.modes.EVAL:
                this.source += '    ; ' + line + '\n';
                break;
              // Exec, esc, and output

              case Template.modes.ESCAPED:
                this.source += '    ; __append(escapeFn(' + stripSemi(line) + '))' + '\n';
                break;
              // Exec and output

              case Template.modes.RAW:
                this.source += '    ; __append(' + stripSemi(line) + ')' + '\n';
                break;

              case Template.modes.COMMENT:
                // Do nothing
                break;
              // Literal <%% mode, append as raw output

              case Template.modes.LITERAL:
                this._addOutput(line);

                break;
            }
          } // In string mode, just add the output
          else {
              this._addOutput(line);
            }

      }

      if (self.opts.compileDebug && newLineCount) {
        this.currentLine += newLineCount;
        this.source += '    ; __line = ' + this.currentLine + '\n';
      }
    }
  };
  /**
   * Escape characters reserved in XML.
   *
   * This is simply an export of {@link module:utils.escapeXML}.
   *
   * If `markup` is `undefined` or `null`, the empty string is returned.
   *
   * @param {String} markup Input string
   * @return {String} Escaped string
   * @public
   * @func
   * */

  exports.escapeXML = utils.escapeXML;
  /**
   * Express.js support.
   *
   * This is an alias for {@link module:ejs.renderFile}, in order to support
   * Express.js out-of-the-box.
   *
   * @func
   */

  exports.__express = exports.renderFile; // Add require support

  /* istanbul ignore else */

  if (commonjsRequire.extensions) {
    commonjsRequire.extensions['.ejs'] = function (module, flnm) {
      var filename = flnm ||
      /* istanbul ignore next */
      module.filename;
      var options = {
        filename: filename,
        client: true
      };
      var template = fileLoader(filename).toString();
      var fn = exports.compile(template, options);

      module._compile('module.exports = ' + fn.toString() + ';', filename);
    };
  }
  /**
   * Version of EJS.
   *
   * @readonly
   * @type {String}
   * @public
   */


  exports.VERSION = _VERSION_STRING;
  /**
   * Name for detection of EJS.
   *
   * @readonly
   * @type {String}
   * @public
   */

  exports.name = _NAME;
  /* istanbul ignore if */

  if (typeof window != 'undefined') {
    window.ejs = exports;
  }
});
var ejs_1 = ejs.cache;
var ejs_2 = ejs.fileLoader;
var ejs_3 = ejs.localsName;
var ejs_4 = ejs.promiseImpl;
var ejs_5 = ejs.resolveInclude;
var ejs_6 = ejs.compile;
var ejs_7 = ejs.render;
var ejs_8 = ejs.renderFile;
var ejs_9 = ejs.clearCache;
var ejs_10 = ejs.escapeXML;
var ejs_11 = ejs.__express;
var ejs_12 = ejs.VERSION;
var ejs_13 = ejs.name;

var searchResult = "<time class=\"metadata\" datetime=\"<%= post.date %>\"><%= new Date(post.date_as_int * 1000).toLocaleDateString(post.lang, {month: 'long', year: 'numeric'}) %></time>\n<div>\n  <a href=\"<%= post.permalink %>\" rel=\"permalink\"><%= post.title %></a>\n  <details>\n    <summary>Display summary</summary>\n    <%- post.excerpt %>\n  </details>\n<div>\n";

var photographyTile = "<article class=\"tile\">\n  <aside class=\"cover is-square is-empty\">\n    <img src=\"<%= post.image %>\" alt=\"\">\n  </aside>\n  <a href=\"<%= post.permalink %>\" rel=\"permalink\"><%= post.title %></a>\n</article>\n";

var searchResultTemplate = ejs.compile(searchResult, {
  client: false
});
var photographyTileTemplate = ejs.compile(photographyTile, {
  client: false
});
var search = function search(data) {
  return searchResultTemplate(data, {});
};
var photography = function photography(data) {
  return photographyTileTemplate(data, {});
};

export { search, photography };
