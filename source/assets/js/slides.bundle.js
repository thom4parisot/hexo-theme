(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
Syntax highlighting with language autodetection.
https://highlightjs.org/
*/

(function(factory) {

  // Find the global object for export to both the browser and web workers.
  var globalObject = typeof window === 'object' && window ||
                     typeof self === 'object' && self;

  // Setup highlight.js for different environments. First is Node.js or
  // CommonJS.
  if(typeof exports !== 'undefined') {
    factory(exports);
  } else if(globalObject) {
    // Export hljs globally even when using AMD for cases when this script
    // is loaded with others that may still expect a global hljs.
    globalObject.hljs = factory({});

    // Finally register the global hljs with AMD.
    if(typeof define === 'function' && define.amd) {
      define([], function() {
        return globalObject.hljs;
      });
    }
  }

}(function(hljs) {
  // Convenience variables for build-in objects
  var ArrayProto = [],
      objectKeys = Object.keys;

  // Global internal variables used within the highlight.js library.
  var languages = {},
      aliases   = {};

  // Regular expressions used throughout the highlight.js library.
  var noHighlightRe    = /^(no-?highlight|plain|text)$/i,
      languagePrefixRe = /\blang(?:uage)?-([\w-]+)\b/i,
      fixMarkupRe      = /((^(<[^>]+>|\t|)+|(?:\n)))/gm;

  var spanEndTag = '</span>';

  // Global options used when within external APIs. This is modified when
  // calling the `hljs.configure` function.
  var options = {
    classPrefix: 'hljs-',
    tabReplace: null,
    useBR: false,
    languages: undefined
  };


  /* Utility functions */

  function escape(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function tag(node) {
    return node.nodeName.toLowerCase();
  }

  function testRe(re, lexeme) {
    var match = re && re.exec(lexeme);
    return match && match.index === 0;
  }

  function isNotHighlighted(language) {
    return noHighlightRe.test(language);
  }

  function blockLanguage(block) {
    var i, match, length, _class;
    var classes = block.className + ' ';

    classes += block.parentNode ? block.parentNode.className : '';

    // language-* takes precedence over non-prefixed class names.
    match = languagePrefixRe.exec(classes);
    if (match) {
      return getLanguage(match[1]) ? match[1] : 'no-highlight';
    }

    classes = classes.split(/\s+/);

    for (i = 0, length = classes.length; i < length; i++) {
      _class = classes[i]

      if (isNotHighlighted(_class) || getLanguage(_class)) {
        return _class;
      }
    }
  }

  function inherit(parent) {  // inherit(parent, override_obj, override_obj, ...)
    var key;
    var result = {};
    var objects = Array.prototype.slice.call(arguments, 1);

    for (key in parent)
      result[key] = parent[key];
    objects.forEach(function(obj) {
      for (key in obj)
        result[key] = obj[key];
    });
    return result;
  }

  /* Stream merging */

  function nodeStream(node) {
    var result = [];
    (function _nodeStream(node, offset) {
      for (var child = node.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 3)
          offset += child.nodeValue.length;
        else if (child.nodeType === 1) {
          result.push({
            event: 'start',
            offset: offset,
            node: child
          });
          offset = _nodeStream(child, offset);
          // Prevent void elements from having an end tag that would actually
          // double them in the output. There are more void elements in HTML
          // but we list only those realistically expected in code display.
          if (!tag(child).match(/br|hr|img|input/)) {
            result.push({
              event: 'stop',
              offset: offset,
              node: child
            });
          }
        }
      }
      return offset;
    })(node, 0);
    return result;
  }

  function mergeStreams(original, highlighted, value) {
    var processed = 0;
    var result = '';
    var nodeStack = [];

    function selectStream() {
      if (!original.length || !highlighted.length) {
        return original.length ? original : highlighted;
      }
      if (original[0].offset !== highlighted[0].offset) {
        return (original[0].offset < highlighted[0].offset) ? original : highlighted;
      }

      /*
      To avoid starting the stream just before it should stop the order is
      ensured that original always starts first and closes last:

      if (event1 == 'start' && event2 == 'start')
        return original;
      if (event1 == 'start' && event2 == 'stop')
        return highlighted;
      if (event1 == 'stop' && event2 == 'start')
        return original;
      if (event1 == 'stop' && event2 == 'stop')
        return highlighted;

      ... which is collapsed to:
      */
      return highlighted[0].event === 'start' ? original : highlighted;
    }

    function open(node) {
      function attr_str(a) {return ' ' + a.nodeName + '="' + escape(a.value).replace('"', '&quot;') + '"';}
      result += '<' + tag(node) + ArrayProto.map.call(node.attributes, attr_str).join('') + '>';
    }

    function close(node) {
      result += '</' + tag(node) + '>';
    }

    function render(event) {
      (event.event === 'start' ? open : close)(event.node);
    }

    while (original.length || highlighted.length) {
      var stream = selectStream();
      result += escape(value.substring(processed, stream[0].offset));
      processed = stream[0].offset;
      if (stream === original) {
        /*
        On any opening or closing tag of the original markup we first close
        the entire highlighted node stack, then render the original tag along
        with all the following original tags at the same offset and then
        reopen all the tags on the highlighted stack.
        */
        nodeStack.reverse().forEach(close);
        do {
          render(stream.splice(0, 1)[0]);
          stream = selectStream();
        } while (stream === original && stream.length && stream[0].offset === processed);
        nodeStack.reverse().forEach(open);
      } else {
        if (stream[0].event === 'start') {
          nodeStack.push(stream[0].node);
        } else {
          nodeStack.pop();
        }
        render(stream.splice(0, 1)[0]);
      }
    }
    return result + escape(value.substr(processed));
  }

  /* Initialization */

  function expand_mode(mode) {
    if (mode.variants && !mode.cached_variants) {
      mode.cached_variants = mode.variants.map(function(variant) {
        return inherit(mode, {variants: null}, variant);
      });
    }
    return mode.cached_variants || (mode.endsWithParent && [inherit(mode)]) || [mode];
  }

  function compileLanguage(language) {

    function reStr(re) {
        return (re && re.source) || re;
    }

    function langRe(value, global) {
      return new RegExp(
        reStr(value),
        'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : '')
      );
    }

    function compileMode(mode, parent) {
      if (mode.compiled)
        return;
      mode.compiled = true;

      mode.keywords = mode.keywords || mode.beginKeywords;
      if (mode.keywords) {
        var compiled_keywords = {};

        var flatten = function(className, str) {
          if (language.case_insensitive) {
            str = str.toLowerCase();
          }
          str.split(' ').forEach(function(kw) {
            var pair = kw.split('|');
            compiled_keywords[pair[0]] = [className, pair[1] ? Number(pair[1]) : 1];
          });
        };

        if (typeof mode.keywords === 'string') { // string
          flatten('keyword', mode.keywords);
        } else {
          objectKeys(mode.keywords).forEach(function (className) {
            flatten(className, mode.keywords[className]);
          });
        }
        mode.keywords = compiled_keywords;
      }
      mode.lexemesRe = langRe(mode.lexemes || /\w+/, true);

      if (parent) {
        if (mode.beginKeywords) {
          mode.begin = '\\b(' + mode.beginKeywords.split(' ').join('|') + ')\\b';
        }
        if (!mode.begin)
          mode.begin = /\B|\b/;
        mode.beginRe = langRe(mode.begin);
        if (!mode.end && !mode.endsWithParent)
          mode.end = /\B|\b/;
        if (mode.end)
          mode.endRe = langRe(mode.end);
        mode.terminator_end = reStr(mode.end) || '';
        if (mode.endsWithParent && parent.terminator_end)
          mode.terminator_end += (mode.end ? '|' : '') + parent.terminator_end;
      }
      if (mode.illegal)
        mode.illegalRe = langRe(mode.illegal);
      if (mode.relevance == null)
        mode.relevance = 1;
      if (!mode.contains) {
        mode.contains = [];
      }
      mode.contains = Array.prototype.concat.apply([], mode.contains.map(function(c) {
        return expand_mode(c === 'self' ? mode : c)
      }));
      mode.contains.forEach(function(c) {compileMode(c, mode);});

      if (mode.starts) {
        compileMode(mode.starts, parent);
      }

      var terminators =
        mode.contains.map(function(c) {
          return c.beginKeywords ? '\\.?(' + c.begin + ')\\.?' : c.begin;
        })
        .concat([mode.terminator_end, mode.illegal])
        .map(reStr)
        .filter(Boolean);
      mode.terminators = terminators.length ? langRe(terminators.join('|'), true) : {exec: function(/*s*/) {return null;}};
    }

    compileMode(language);
  }

  /*
  Core highlighting function. Accepts a language name, or an alias, and a
  string with the code to highlight. Returns an object with the following
  properties:

  - relevance (int)
  - value (an HTML string with highlighting markup)

  */
  function highlight(name, value, ignore_illegals, continuation) {

    function subMode(lexeme, mode) {
      var i, length;

      for (i = 0, length = mode.contains.length; i < length; i++) {
        if (testRe(mode.contains[i].beginRe, lexeme)) {
          return mode.contains[i];
        }
      }
    }

    function endOfMode(mode, lexeme) {
      if (testRe(mode.endRe, lexeme)) {
        while (mode.endsParent && mode.parent) {
          mode = mode.parent;
        }
        return mode;
      }
      if (mode.endsWithParent) {
        return endOfMode(mode.parent, lexeme);
      }
    }

    function isIllegal(lexeme, mode) {
      return !ignore_illegals && testRe(mode.illegalRe, lexeme);
    }

    function keywordMatch(mode, match) {
      var match_str = language.case_insensitive ? match[0].toLowerCase() : match[0];
      return mode.keywords.hasOwnProperty(match_str) && mode.keywords[match_str];
    }

    function buildSpan(classname, insideSpan, leaveOpen, noPrefix) {
      var classPrefix = noPrefix ? '' : options.classPrefix,
          openSpan    = '<span class="' + classPrefix,
          closeSpan   = leaveOpen ? '' : spanEndTag

      openSpan += classname + '">';

      return openSpan + insideSpan + closeSpan;
    }

    function processKeywords() {
      var keyword_match, last_index, match, result;

      if (!top.keywords)
        return escape(mode_buffer);

      result = '';
      last_index = 0;
      top.lexemesRe.lastIndex = 0;
      match = top.lexemesRe.exec(mode_buffer);

      while (match) {
        result += escape(mode_buffer.substring(last_index, match.index));
        keyword_match = keywordMatch(top, match);
        if (keyword_match) {
          relevance += keyword_match[1];
          result += buildSpan(keyword_match[0], escape(match[0]));
        } else {
          result += escape(match[0]);
        }
        last_index = top.lexemesRe.lastIndex;
        match = top.lexemesRe.exec(mode_buffer);
      }
      return result + escape(mode_buffer.substr(last_index));
    }

    function processSubLanguage() {
      var explicit = typeof top.subLanguage === 'string';
      if (explicit && !languages[top.subLanguage]) {
        return escape(mode_buffer);
      }

      var result = explicit ?
                   highlight(top.subLanguage, mode_buffer, true, continuations[top.subLanguage]) :
                   highlightAuto(mode_buffer, top.subLanguage.length ? top.subLanguage : undefined);

      // Counting embedded language score towards the host language may be disabled
      // with zeroing the containing mode relevance. Usecase in point is Markdown that
      // allows XML everywhere and makes every XML snippet to have a much larger Markdown
      // score.
      if (top.relevance > 0) {
        relevance += result.relevance;
      }
      if (explicit) {
        continuations[top.subLanguage] = result.top;
      }
      return buildSpan(result.language, result.value, false, true);
    }

    function processBuffer() {
      result += (top.subLanguage != null ? processSubLanguage() : processKeywords());
      mode_buffer = '';
    }

    function startNewMode(mode) {
      result += mode.className? buildSpan(mode.className, '', true): '';
      top = Object.create(mode, {parent: {value: top}});
    }

    function processLexeme(buffer, lexeme) {

      mode_buffer += buffer;

      if (lexeme == null) {
        processBuffer();
        return 0;
      }

      var new_mode = subMode(lexeme, top);
      if (new_mode) {
        if (new_mode.skip) {
          mode_buffer += lexeme;
        } else {
          if (new_mode.excludeBegin) {
            mode_buffer += lexeme;
          }
          processBuffer();
          if (!new_mode.returnBegin && !new_mode.excludeBegin) {
            mode_buffer = lexeme;
          }
        }
        startNewMode(new_mode, lexeme);
        return new_mode.returnBegin ? 0 : lexeme.length;
      }

      var end_mode = endOfMode(top, lexeme);
      if (end_mode) {
        var origin = top;
        if (origin.skip) {
          mode_buffer += lexeme;
        } else {
          if (!(origin.returnEnd || origin.excludeEnd)) {
            mode_buffer += lexeme;
          }
          processBuffer();
          if (origin.excludeEnd) {
            mode_buffer = lexeme;
          }
        }
        do {
          if (top.className) {
            result += spanEndTag;
          }
          if (!top.skip) {
            relevance += top.relevance;
          }
          top = top.parent;
        } while (top !== end_mode.parent);
        if (end_mode.starts) {
          startNewMode(end_mode.starts, '');
        }
        return origin.returnEnd ? 0 : lexeme.length;
      }

      if (isIllegal(lexeme, top))
        throw new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.className || '<unnamed>') + '"');

      /*
      Parser should not reach this point as all types of lexemes should be caught
      earlier, but if it does due to some bug make sure it advances at least one
      character forward to prevent infinite looping.
      */
      mode_buffer += lexeme;
      return lexeme.length || 1;
    }

    var language = getLanguage(name);
    if (!language) {
      throw new Error('Unknown language: "' + name + '"');
    }

    compileLanguage(language);
    var top = continuation || language;
    var continuations = {}; // keep continuations for sub-languages
    var result = '', current;
    for(current = top; current !== language; current = current.parent) {
      if (current.className) {
        result = buildSpan(current.className, '', true) + result;
      }
    }
    var mode_buffer = '';
    var relevance = 0;
    try {
      var match, count, index = 0;
      while (true) {
        top.terminators.lastIndex = index;
        match = top.terminators.exec(value);
        if (!match)
          break;
        count = processLexeme(value.substring(index, match.index), match[0]);
        index = match.index + count;
      }
      processLexeme(value.substr(index));
      for(current = top; current.parent; current = current.parent) { // close dangling modes
        if (current.className) {
          result += spanEndTag;
        }
      }
      return {
        relevance: relevance,
        value: result,
        language: name,
        top: top
      };
    } catch (e) {
      if (e.message && e.message.indexOf('Illegal') !== -1) {
        return {
          relevance: 0,
          value: escape(value)
        };
      } else {
        throw e;
      }
    }
  }

  /*
  Highlighting with language detection. Accepts a string with the code to
  highlight. Returns an object with the following properties:

  - language (detected language)
  - relevance (int)
  - value (an HTML string with highlighting markup)
  - second_best (object with the same structure for second-best heuristically
    detected language, may be absent)

  */
  function highlightAuto(text, languageSubset) {
    languageSubset = languageSubset || options.languages || objectKeys(languages);
    var result = {
      relevance: 0,
      value: escape(text)
    };
    var second_best = result;
    languageSubset.filter(getLanguage).forEach(function(name) {
      var current = highlight(name, text, false);
      current.language = name;
      if (current.relevance > second_best.relevance) {
        second_best = current;
      }
      if (current.relevance > result.relevance) {
        second_best = result;
        result = current;
      }
    });
    if (second_best.language) {
      result.second_best = second_best;
    }
    return result;
  }

  /*
  Post-processing of the highlighted markup:

  - replace TABs with something more useful
  - replace real line-breaks with '<br>' for non-pre containers

  */
  function fixMarkup(value) {
    return !(options.tabReplace || options.useBR)
      ? value
      : value.replace(fixMarkupRe, function(match, p1) {
          if (options.useBR && match === '\n') {
            return '<br>';
          } else if (options.tabReplace) {
            return p1.replace(/\t/g, options.tabReplace);
          }
          return '';
      });
  }

  function buildClassName(prevClassName, currentLang, resultLang) {
    var language = currentLang ? aliases[currentLang] : resultLang,
        result   = [prevClassName.trim()];

    if (!prevClassName.match(/\bhljs\b/)) {
      result.push('hljs');
    }

    if (prevClassName.indexOf(language) === -1) {
      result.push(language);
    }

    return result.join(' ').trim();
  }

  /*
  Applies highlighting to a DOM node containing code. Accepts a DOM node and
  two optional parameters for fixMarkup.
  */
  function highlightBlock(block) {
    var node, originalStream, result, resultNode, text;
    var language = blockLanguage(block);

    if (isNotHighlighted(language))
        return;

    if (options.useBR) {
      node = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
      node.innerHTML = block.innerHTML.replace(/\n/g, '').replace(/<br[ \/]*>/g, '\n');
    } else {
      node = block;
    }
    text = node.textContent;
    result = language ? highlight(language, text, true) : highlightAuto(text);

    originalStream = nodeStream(node);
    if (originalStream.length) {
      resultNode = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
      resultNode.innerHTML = result.value;
      result.value = mergeStreams(originalStream, nodeStream(resultNode), text);
    }
    result.value = fixMarkup(result.value);

    block.innerHTML = result.value;
    block.className = buildClassName(block.className, language, result.language);
    block.result = {
      language: result.language,
      re: result.relevance
    };
    if (result.second_best) {
      block.second_best = {
        language: result.second_best.language,
        re: result.second_best.relevance
      };
    }
  }

  /*
  Updates highlight.js global options with values passed in the form of an object.
  */
  function configure(user_options) {
    options = inherit(options, user_options);
  }

  /*
  Applies highlighting to all <pre><code>..</code></pre> blocks on a page.
  */
  function initHighlighting() {
    if (initHighlighting.called)
      return;
    initHighlighting.called = true;

    var blocks = document.querySelectorAll('pre code');
    ArrayProto.forEach.call(blocks, highlightBlock);
  }

  /*
  Attaches highlighting to the page load event.
  */
  function initHighlightingOnLoad() {
    addEventListener('DOMContentLoaded', initHighlighting, false);
    addEventListener('load', initHighlighting, false);
  }

  function registerLanguage(name, language) {
    var lang = languages[name] = language(hljs);
    if (lang.aliases) {
      lang.aliases.forEach(function(alias) {aliases[alias] = name;});
    }
  }

  function listLanguages() {
    return objectKeys(languages);
  }

  function getLanguage(name) {
    name = (name || '').toLowerCase();
    return languages[name] || languages[aliases[name]];
  }

  /* Interface definition */

  hljs.highlight = highlight;
  hljs.highlightAuto = highlightAuto;
  hljs.fixMarkup = fixMarkup;
  hljs.highlightBlock = highlightBlock;
  hljs.configure = configure;
  hljs.initHighlighting = initHighlighting;
  hljs.initHighlightingOnLoad = initHighlightingOnLoad;
  hljs.registerLanguage = registerLanguage;
  hljs.listLanguages = listLanguages;
  hljs.getLanguage = getLanguage;
  hljs.inherit = inherit;

  // Common regexps
  hljs.IDENT_RE = '[a-zA-Z]\\w*';
  hljs.UNDERSCORE_IDENT_RE = '[a-zA-Z_]\\w*';
  hljs.NUMBER_RE = '\\b\\d+(\\.\\d+)?';
  hljs.C_NUMBER_RE = '(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)'; // 0x..., 0..., decimal, float
  hljs.BINARY_NUMBER_RE = '\\b(0b[01]+)'; // 0b...
  hljs.RE_STARTERS_RE = '!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~';

  // Common modes
  hljs.BACKSLASH_ESCAPE = {
    begin: '\\\\[\\s\\S]', relevance: 0
  };
  hljs.APOS_STRING_MODE = {
    className: 'string',
    begin: '\'', end: '\'',
    illegal: '\\n',
    contains: [hljs.BACKSLASH_ESCAPE]
  };
  hljs.QUOTE_STRING_MODE = {
    className: 'string',
    begin: '"', end: '"',
    illegal: '\\n',
    contains: [hljs.BACKSLASH_ESCAPE]
  };
  hljs.PHRASAL_WORDS_MODE = {
    begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
  };
  hljs.COMMENT = function (begin, end, inherits) {
    var mode = hljs.inherit(
      {
        className: 'comment',
        begin: begin, end: end,
        contains: []
      },
      inherits || {}
    );
    mode.contains.push(hljs.PHRASAL_WORDS_MODE);
    mode.contains.push({
      className: 'doctag',
      begin: '(?:TODO|FIXME|NOTE|BUG|XXX):',
      relevance: 0
    });
    return mode;
  };
  hljs.C_LINE_COMMENT_MODE = hljs.COMMENT('//', '$');
  hljs.C_BLOCK_COMMENT_MODE = hljs.COMMENT('/\\*', '\\*/');
  hljs.HASH_COMMENT_MODE = hljs.COMMENT('#', '$');
  hljs.NUMBER_MODE = {
    className: 'number',
    begin: hljs.NUMBER_RE,
    relevance: 0
  };
  hljs.C_NUMBER_MODE = {
    className: 'number',
    begin: hljs.C_NUMBER_RE,
    relevance: 0
  };
  hljs.BINARY_NUMBER_MODE = {
    className: 'number',
    begin: hljs.BINARY_NUMBER_RE,
    relevance: 0
  };
  hljs.CSS_NUMBER_MODE = {
    className: 'number',
    begin: hljs.NUMBER_RE + '(' +
      '%|em|ex|ch|rem'  +
      '|vw|vh|vmin|vmax' +
      '|cm|mm|in|pt|pc|px' +
      '|deg|grad|rad|turn' +
      '|s|ms' +
      '|Hz|kHz' +
      '|dpi|dpcm|dppx' +
      ')?',
    relevance: 0
  };
  hljs.REGEXP_MODE = {
    className: 'regexp',
    begin: /\//, end: /\/[gimuy]*/,
    illegal: /\n/,
    contains: [
      hljs.BACKSLASH_ESCAPE,
      {
        begin: /\[/, end: /\]/,
        relevance: 0,
        contains: [hljs.BACKSLASH_ESCAPE]
      }
    ]
  };
  hljs.TITLE_MODE = {
    className: 'title',
    begin: hljs.IDENT_RE,
    relevance: 0
  };
  hljs.UNDERSCORE_TITLE_MODE = {
    className: 'title',
    begin: hljs.UNDERSCORE_IDENT_RE,
    relevance: 0
  };
  hljs.METHOD_GUARD = {
    // excludes method names from keyword processing
    begin: '\\.\\s*' + hljs.UNDERSCORE_IDENT_RE,
    relevance: 0
  };

  return hljs;
}));

},{}],2:[function(require,module,exports){
module.exports = function(hljs) {
  return {
    aliases: ['adoc'],
    contains: [
      // block comment
      hljs.COMMENT(
        '^/{4,}\\n',
        '\\n/{4,}$',
        // can also be done as...
        //'^/{4,}$',
        //'^/{4,}$',
        {
          relevance: 10
        }
      ),
      // line comment
      hljs.COMMENT(
        '^//',
        '$',
        {
          relevance: 0
        }
      ),
      // title
      {
        className: 'title',
        begin: '^\\.\\w.*$'
      },
      // example, admonition & sidebar blocks
      {
        begin: '^[=\\*]{4,}\\n',
        end: '\\n^[=\\*]{4,}$',
        relevance: 10
      },
      // headings
      {
        className: 'section',
        relevance: 10,
        variants: [
          {begin: '^(={1,5}) .+?( \\1)?$'},
          {begin: '^[^\\[\\]\\n]+?\\n[=\\-~\\^\\+]{2,}$'},
        ]
      },
      // document attributes
      {
        className: 'meta',
        begin: '^:.+?:',
        end: '\\s',
        excludeEnd: true,
        relevance: 10
      },
      // block attributes
      {
        className: 'meta',
        begin: '^\\[.+?\\]$',
        relevance: 0
      },
      // quoteblocks
      {
        className: 'quote',
        begin: '^_{4,}\\n',
        end: '\\n_{4,}$',
        relevance: 10
      },
      // listing and literal blocks
      {
        className: 'code',
        begin: '^[\\-\\.]{4,}\\n',
        end: '\\n[\\-\\.]{4,}$',
        relevance: 10
      },
      // passthrough blocks
      {
        begin: '^\\+{4,}\\n',
        end: '\\n\\+{4,}$',
        contains: [
          {
            begin: '<', end: '>',
            subLanguage: 'xml',
            relevance: 0
          }
        ],
        relevance: 10
      },
      // lists (can only capture indicators)
      {
        className: 'bullet',
        begin: '^(\\*+|\\-+|\\.+|[^\\n]+?::)\\s+'
      },
      // admonition
      {
        className: 'symbol',
        begin: '^(NOTE|TIP|IMPORTANT|WARNING|CAUTION):\\s+',
        relevance: 10
      },
      // inline strong
      {
        className: 'strong',
        // must not follow a word character or be followed by an asterisk or space
        begin: '\\B\\*(?![\\*\\s])',
        end: '(\\n{2}|\\*)',
        // allow escaped asterisk followed by word char
        contains: [
          {
            begin: '\\\\*\\w',
            relevance: 0
          }
        ]
      },
      // inline emphasis
      {
        className: 'emphasis',
        // must not follow a word character or be followed by a single quote or space
        begin: '\\B\'(?![\'\\s])',
        end: '(\\n{2}|\')',
        // allow escaped single quote followed by word char
        contains: [
          {
            begin: '\\\\\'\\w',
            relevance: 0
          }
        ],
        relevance: 0
      },
      // inline emphasis (alt)
      {
        className: 'emphasis',
        // must not follow a word character or be followed by an underline or space
        begin: '_(?![_\\s])',
        end: '(\\n{2}|_)',
        relevance: 0
      },
      // inline smart quotes
      {
        className: 'string',
        variants: [
          {begin: "``.+?''"},
          {begin: "`.+?'"}
        ]
      },
      // inline code snippets (TODO should get same treatment as strong and emphasis)
      {
        className: 'code',
        begin: '(`.+?`|\\+.+?\\+)',
        relevance: 0
      },
      // indented literal block
      {
        className: 'code',
        begin: '^[ \\t]',
        end: '$',
        relevance: 0
      },
      // horizontal rules
      {
        begin: '^\'{3,}[ \\t]*$',
        relevance: 10
      },
      // images and links
      {
        begin: '(link:)?(http|https|ftp|file|irc|image:?):\\S+\\[.*?\\]',
        returnBegin: true,
        contains: [
          {
            begin: '(link|image:?):',
            relevance: 0
          },
          {
            className: 'link',
            begin: '\\w',
            end: '[^\\[]+',
            relevance: 0
          },
          {
            className: 'string',
            begin: '\\[',
            end: '\\]',
            excludeBegin: true,
            excludeEnd: true,
            relevance: 0
          }
        ],
        relevance: 10
      }
    ]
  };
};
},{}],3:[function(require,module,exports){
module.exports = function(hljs) {
  var VAR = {
    className: 'variable',
    variants: [
      {begin: /\$[\w\d#@][\w\d_]*/},
      {begin: /\$\{(.*?)}/}
    ]
  };
  var QUOTE_STRING = {
    className: 'string',
    begin: /"/, end: /"/,
    contains: [
      hljs.BACKSLASH_ESCAPE,
      VAR,
      {
        className: 'variable',
        begin: /\$\(/, end: /\)/,
        contains: [hljs.BACKSLASH_ESCAPE]
      }
    ]
  };
  var APOS_STRING = {
    className: 'string',
    begin: /'/, end: /'/
  };

  return {
    aliases: ['sh', 'zsh'],
    lexemes: /\b-?[a-z\._]+\b/,
    keywords: {
      keyword:
        'if then else elif fi for while in do done case esac function',
      literal:
        'true false',
      built_in:
        // Shell built-ins
        // http://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
        'break cd continue eval exec exit export getopts hash pwd readonly return shift test times ' +
        'trap umask unset ' +
        // Bash built-ins
        'alias bind builtin caller command declare echo enable help let local logout mapfile printf ' +
        'read readarray source type typeset ulimit unalias ' +
        // Shell modifiers
        'set shopt ' +
        // Zsh built-ins
        'autoload bg bindkey bye cap chdir clone comparguments compcall compctl compdescribe compfiles ' +
        'compgroups compquote comptags comptry compvalues dirs disable disown echotc echoti emulate ' +
        'fc fg float functions getcap getln history integer jobs kill limit log noglob popd print ' +
        'pushd pushln rehash sched setcap setopt stat suspend ttyctl unfunction unhash unlimit ' +
        'unsetopt vared wait whence where which zcompile zformat zftp zle zmodload zparseopts zprof ' +
        'zpty zregexparse zsocket zstyle ztcp',
      _:
        '-ne -eq -lt -gt -f -d -e -s -l -a' // relevance booster
    },
    contains: [
      {
        className: 'meta',
        begin: /^#![^\n]+sh\s*$/,
        relevance: 10
      },
      {
        className: 'function',
        begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
        returnBegin: true,
        contains: [hljs.inherit(hljs.TITLE_MODE, {begin: /\w[\w\d_]*/})],
        relevance: 0
      },
      hljs.HASH_COMMENT_MODE,
      QUOTE_STRING,
      APOS_STRING,
      VAR
    ]
  };
};
},{}],4:[function(require,module,exports){
module.exports = function(hljs) {
  var IDENT_RE = '[A-Za-z$_][0-9A-Za-z$_]*';
  var KEYWORDS = {
    keyword:
      'in of if for while finally var new function do return void else break catch ' +
      'instanceof with throw case default try this switch continue typeof delete ' +
      'let yield const export super debugger as async await static ' +
      // ECMAScript 6 modules import
      'import from as'
    ,
    literal:
      'true false null undefined NaN Infinity',
    built_in:
      'eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent ' +
      'encodeURI encodeURIComponent escape unescape Object Function Boolean Error ' +
      'EvalError InternalError RangeError ReferenceError StopIteration SyntaxError ' +
      'TypeError URIError Number Math Date String RegExp Array Float32Array ' +
      'Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array ' +
      'Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require ' +
      'module console window document Symbol Set Map WeakSet WeakMap Proxy Reflect ' +
      'Promise'
  };
  var EXPRESSIONS;
  var NUMBER = {
    className: 'number',
    variants: [
      { begin: '\\b(0[bB][01]+)' },
      { begin: '\\b(0[oO][0-7]+)' },
      { begin: hljs.C_NUMBER_RE }
    ],
    relevance: 0
  };
  var SUBST = {
    className: 'subst',
    begin: '\\$\\{', end: '\\}',
    keywords: KEYWORDS,
    contains: []  // defined later
  };
  var TEMPLATE_STRING = {
    className: 'string',
    begin: '`', end: '`',
    contains: [
      hljs.BACKSLASH_ESCAPE,
      SUBST
    ]
  };
  SUBST.contains = [
    hljs.APOS_STRING_MODE,
    hljs.QUOTE_STRING_MODE,
    TEMPLATE_STRING,
    NUMBER,
    hljs.REGEXP_MODE
  ]
  var PARAMS_CONTAINS = SUBST.contains.concat([
    hljs.C_BLOCK_COMMENT_MODE,
    hljs.C_LINE_COMMENT_MODE
  ]);

  return {
    aliases: ['js', 'jsx'],
    keywords: KEYWORDS,
    contains: [
      {
        className: 'meta',
        relevance: 10,
        begin: /^\s*['"]use (strict|asm)['"]/
      },
      {
        className: 'meta',
        begin: /^#!/, end: /$/
      },
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      TEMPLATE_STRING,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      NUMBER,
      { // object attr container
        begin: /[{,]\s*/, relevance: 0,
        contains: [
          {
            begin: IDENT_RE + '\\s*:', returnBegin: true,
            relevance: 0,
            contains: [{className: 'attr', begin: IDENT_RE, relevance: 0}]
          }
        ]
      },
      { // "value" container
        begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
        keywords: 'return throw case',
        contains: [
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          hljs.REGEXP_MODE,
          {
            className: 'function',
            begin: '(\\(.*?\\)|' + IDENT_RE + ')\\s*=>', returnBegin: true,
            end: '\\s*=>',
            contains: [
              {
                className: 'params',
                variants: [
                  {
                    begin: IDENT_RE
                  },
                  {
                    begin: /\(\s*\)/,
                  },
                  {
                    begin: /\(/, end: /\)/,
                    excludeBegin: true, excludeEnd: true,
                    keywords: KEYWORDS,
                    contains: PARAMS_CONTAINS
                  }
                ]
              }
            ]
          },
          { // E4X / JSX
            begin: /</, end: /(\/\w+|\w+\/)>/,
            subLanguage: 'xml',
            contains: [
              {begin: /<\w+\s*\/>/, skip: true},
              {
                begin: /<\w+/, end: /(\/\w+|\w+\/)>/, skip: true,
                contains: [
                  {begin: /<\w+\s*\/>/, skip: true},
                  'self'
                ]
              }
            ]
          }
        ],
        relevance: 0
      },
      {
        className: 'function',
        beginKeywords: 'function', end: /\{/, excludeEnd: true,
        contains: [
          hljs.inherit(hljs.TITLE_MODE, {begin: IDENT_RE}),
          {
            className: 'params',
            begin: /\(/, end: /\)/,
            excludeBegin: true,
            excludeEnd: true,
            contains: PARAMS_CONTAINS
          }
        ],
        illegal: /\[|%/
      },
      {
        begin: /\$[(.]/ // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      },
      hljs.METHOD_GUARD,
      { // ES6 class
        className: 'class',
        beginKeywords: 'class', end: /[{;=]/, excludeEnd: true,
        illegal: /[:"\[\]]/,
        contains: [
          {beginKeywords: 'extends'},
          hljs.UNDERSCORE_TITLE_MODE
        ]
      },
      {
        beginKeywords: 'constructor', end: /\{/, excludeEnd: true
      }
    ],
    illegal: /#(?!!)/
  };
};
},{}],5:[function(require,module,exports){
module.exports = function(hljs) {
  return {
    aliases: ['console'],
    contains: [
      {
        className: 'meta',
        begin: '^\\s{0,3}[\\w\\d\\[\\]()@-]*[>%$#]',
        starts: {
          end: '$', subLanguage: 'bash'
        }
      },
    ]
  }
};
},{}],6:[function(require,module,exports){
module.exports = function(hljs) {
  var XML_IDENT_RE = '[A-Za-z0-9\\._:-]+';
  var TAG_INTERNALS = {
    endsWithParent: true,
    illegal: /</,
    relevance: 0,
    contains: [
      {
        className: 'attr',
        begin: XML_IDENT_RE,
        relevance: 0
      },
      {
        begin: /=\s*/,
        relevance: 0,
        contains: [
          {
            className: 'string',
            endsParent: true,
            variants: [
              {begin: /"/, end: /"/},
              {begin: /'/, end: /'/},
              {begin: /[^\s"'=<>`]+/}
            ]
          }
        ]
      }
    ]
  };
  return {
    aliases: ['html', 'xhtml', 'rss', 'atom', 'xjb', 'xsd', 'xsl', 'plist'],
    case_insensitive: true,
    contains: [
      {
        className: 'meta',
        begin: '<!DOCTYPE', end: '>',
        relevance: 10,
        contains: [{begin: '\\[', end: '\\]'}]
      },
      hljs.COMMENT(
        '<!--',
        '-->',
        {
          relevance: 10
        }
      ),
      {
        begin: '<\\!\\[CDATA\\[', end: '\\]\\]>',
        relevance: 10
      },
      {
        begin: /<\?(php)?/, end: /\?>/,
        subLanguage: 'php',
        contains: [{begin: '/\\*', end: '\\*/', skip: true}]
      },
      {
        className: 'tag',
        /*
        The lookahead pattern (?=...) ensures that 'begin' only matches
        '<style' as a single word, followed by a whitespace or an
        ending braket. The '$' is needed for the lexeme to be recognized
        by hljs.subMode() that tests lexemes outside the stream.
        */
        begin: '<style(?=\\s|>|$)', end: '>',
        keywords: {name: 'style'},
        contains: [TAG_INTERNALS],
        starts: {
          end: '</style>', returnEnd: true,
          subLanguage: ['css', 'xml']
        }
      },
      {
        className: 'tag',
        // See the comment in the <style tag about the lookahead pattern
        begin: '<script(?=\\s|>|$)', end: '>',
        keywords: {name: 'script'},
        contains: [TAG_INTERNALS],
        starts: {
          end: '\<\/script\>', returnEnd: true,
          subLanguage: ['actionscript', 'javascript', 'handlebars', 'xml']
        }
      },
      {
        className: 'meta',
        variants: [
          {begin: /<\?xml/, end: /\?>/, relevance: 10},
          {begin: /<\?\w+/, end: /\?>/}
        ]
      },
      {
        className: 'tag',
        begin: '</?', end: '/?>',
        contains: [
          {
            className: 'name', begin: /[^\/><\s]+/, relevance: 0
          },
          TAG_INTERNALS
        ]
      }
    ]
  };
};
},{}],7:[function(require,module,exports){
/*!
 * reveal.js
 * http://lab.hakim.se/reveal-js
 * MIT licensed
 *
 * Copyright (C) 2017 Hakim El Hattab, http://hakim.se
 */
(function( root, factory ) {
	if( typeof define === 'function' && define.amd ) {
		// AMD. Register as an anonymous module.
		define( function() {
			root.Reveal = factory();
			return root.Reveal;
		} );
	} else if( typeof exports === 'object' ) {
		// Node. Does not work with strict CommonJS.
		module.exports = factory();
	} else {
		// Browser globals.
		root.Reveal = factory();
	}
}( this, function() {

	'use strict';

	var Reveal;

	// The reveal.js version
	var VERSION = '3.5.0';

	var SLIDES_SELECTOR = '.slides section',
		HORIZONTAL_SLIDES_SELECTOR = '.slides>section',
		VERTICAL_SLIDES_SELECTOR = '.slides>section.present>section',
		HOME_SLIDE_SELECTOR = '.slides>section:first-of-type',
		UA = navigator.userAgent,

		// Configuration defaults, can be overridden at initialization time
		config = {

			// The "normal" size of the presentation, aspect ratio will be preserved
			// when the presentation is scaled to fit different resolutions
			width: 960,
			height: 700,

			// Factor of the display size that should remain empty around the content
			margin: 0.04,

			// Bounds for smallest/largest possible scale to apply to content
			minScale: 0.2,
			maxScale: 2.0,

			// Display controls in the bottom right corner
			controls: true,

			// Display a presentation progress bar
			progress: true,

			// Display the page number of the current slide
			slideNumber: false,

			// Determine which displays to show the slide number on
			showSlideNumber: 'all',

			// Push each slide change to the browser history
			history: false,

			// Enable keyboard shortcuts for navigation
			keyboard: true,

			// Optional function that blocks keyboard events when retuning false
			keyboardCondition: null,

			// Enable the slide overview mode
			overview: true,

			// Vertical centering of slides
			center: true,

			// Enables touch navigation on devices with touch input
			touch: true,

			// Loop the presentation
			loop: false,

			// Change the presentation direction to be RTL
			rtl: false,

			// Randomizes the order of slides each time the presentation loads
			shuffle: false,

			// Turns fragments on and off globally
			fragments: true,

			// Flags if the presentation is running in an embedded mode,
			// i.e. contained within a limited portion of the screen
			embedded: false,

			// Flags if we should show a help overlay when the question-mark
			// key is pressed
			help: true,

			// Flags if it should be possible to pause the presentation (blackout)
			pause: true,

			// Flags if speaker notes should be visible to all viewers
			showNotes: false,

			// Global override for autolaying embedded media (video/audio/iframe)
			// - null: Media will only autoplay if data-autoplay is present
			// - true: All media will autoplay, regardless of individual setting
			// - false: No media will autoplay, regardless of individual setting
			autoPlayMedia: null,

			// Number of milliseconds between automatically proceeding to the
			// next slide, disabled when set to 0, this value can be overwritten
			// by using a data-autoslide attribute on your slides
			autoSlide: 0,

			// Stop auto-sliding after user input
			autoSlideStoppable: true,

			// Use this method for navigation when auto-sliding (defaults to navigateNext)
			autoSlideMethod: null,

			// Enable slide navigation via mouse wheel
			mouseWheel: false,

			// Apply a 3D roll to links on hover
			rollingLinks: false,

			// Hides the address bar on mobile devices
			hideAddressBar: true,

			// Opens links in an iframe preview overlay
			previewLinks: false,

			// Exposes the reveal.js API through window.postMessage
			postMessage: true,

			// Dispatches all reveal.js events to the parent window through postMessage
			postMessageEvents: false,

			// Focuses body when page changes visibility to ensure keyboard shortcuts work
			focusBodyOnPageVisibilityChange: true,

			// Transition style
			transition: 'slide', // none/fade/slide/convex/concave/zoom

			// Transition speed
			transitionSpeed: 'default', // default/fast/slow

			// Transition style for full page slide backgrounds
			backgroundTransition: 'fade', // none/fade/slide/convex/concave/zoom

			// Parallax background image
			parallaxBackgroundImage: '', // CSS syntax, e.g. "a.jpg"

			// Parallax background size
			parallaxBackgroundSize: '', // CSS syntax, e.g. "3000px 2000px"

			// Amount of pixels to move the parallax background per slide step
			parallaxBackgroundHorizontal: null,
			parallaxBackgroundVertical: null,

			// The maximum number of pages a single slide can expand onto when printing
			// to PDF, unlimited by default
			pdfMaxPagesPerSlide: Number.POSITIVE_INFINITY,

			// Offset used to reduce the height of content within exported PDF pages.
			// This exists to account for environment differences based on how you
			// print to PDF. CLI printing options, like phantomjs and wkpdf, can end
			// on precisely the total height of the document whereas in-browser
			// printing has to end one pixel before.
			pdfPageHeightOffset: -1,

			// Number of slides away from the current that are visible
			viewDistance: 3,

			// The display mode that will be used to show slides
			display: 'block',

			// Script dependencies to load
			dependencies: []

		},

		// Flags if Reveal.initialize() has been called
		initialized = false,

		// Flags if reveal.js is loaded (has dispatched the 'ready' event)
		loaded = false,

		// Flags if the overview mode is currently active
		overview = false,

		// Holds the dimensions of our overview slides, including margins
		overviewSlideWidth = null,
		overviewSlideHeight = null,

		// The horizontal and vertical index of the currently active slide
		indexh,
		indexv,

		// The previous and current slide HTML elements
		previousSlide,
		currentSlide,

		previousBackground,

		// Slides may hold a data-state attribute which we pick up and apply
		// as a class to the body. This list contains the combined state of
		// all current slides.
		state = [],

		// The current scale of the presentation (see width/height config)
		scale = 1,

		// CSS transform that is currently applied to the slides container,
		// split into two groups
		slidesTransform = { layout: '', overview: '' },

		// Cached references to DOM elements
		dom = {},

		// Features supported by the browser, see #checkCapabilities()
		features = {},

		// Client is a mobile device, see #checkCapabilities()
		isMobileDevice,

		// Client is a desktop Chrome, see #checkCapabilities()
		isChrome,

		// Throttles mouse wheel navigation
		lastMouseWheelStep = 0,

		// Delays updates to the URL due to a Chrome thumbnailer bug
		writeURLTimeout = 0,

		// Flags if the interaction event listeners are bound
		eventsAreBound = false,

		// The current auto-slide duration
		autoSlide = 0,

		// Auto slide properties
		autoSlidePlayer,
		autoSlideTimeout = 0,
		autoSlideStartTime = -1,
		autoSlidePaused = false,

		// Holds information about the currently ongoing touch input
		touch = {
			startX: 0,
			startY: 0,
			startSpan: 0,
			startCount: 0,
			captured: false,
			threshold: 40
		},

		// Holds information about the keyboard shortcuts
		keyboardShortcuts = {
			'N  ,  SPACE':			'Next slide',
			'P':					'Previous slide',
			'&#8592;  ,  H':		'Navigate left',
			'&#8594;  ,  L':		'Navigate right',
			'&#8593;  ,  K':		'Navigate up',
			'&#8595;  ,  J':		'Navigate down',
			'Home':					'First slide',
			'End':					'Last slide',
			'B  ,  .':				'Pause',
			'F':					'Fullscreen',
			'ESC, O':				'Slide overview'
		};

	/**
	 * Starts up the presentation if the client is capable.
	 */
	function initialize( options ) {

		// Make sure we only initialize once
		if( initialized === true ) return;

		initialized = true;

		checkCapabilities();

		if( !features.transforms2d && !features.transforms3d ) {
			document.body.setAttribute( 'class', 'no-transforms' );

			// Since JS won't be running any further, we load all lazy
			// loading elements upfront
			var images = toArray( document.getElementsByTagName( 'img' ) ),
				iframes = toArray( document.getElementsByTagName( 'iframe' ) );

			var lazyLoadable = images.concat( iframes );

			for( var i = 0, len = lazyLoadable.length; i < len; i++ ) {
				var element = lazyLoadable[i];
				if( element.getAttribute( 'data-src' ) ) {
					element.setAttribute( 'src', element.getAttribute( 'data-src' ) );
					element.removeAttribute( 'data-src' );
				}
			}

			// If the browser doesn't support core features we won't be
			// using JavaScript to control the presentation
			return;
		}

		// Cache references to key DOM elements
		dom.wrapper = document.querySelector( '.reveal' );
		dom.slides = document.querySelector( '.reveal .slides' );

		// Force a layout when the whole page, incl fonts, has loaded
		window.addEventListener( 'load', layout, false );

		var query = Reveal.getQueryHash();

		// Do not accept new dependencies via query config to avoid
		// the potential of malicious script injection
		if( typeof query['dependencies'] !== 'undefined' ) delete query['dependencies'];

		// Copy options over to our config object
		extend( config, options );
		extend( config, query );

		// Hide the address bar in mobile browsers
		hideAddressBar();

		// Loads the dependencies and continues to #start() once done
		load();

	}

	/**
	 * Inspect the client to see what it's capable of, this
	 * should only happens once per runtime.
	 */
	function checkCapabilities() {

		isMobileDevice = /(iphone|ipod|ipad|android)/gi.test( UA );
		isChrome = /chrome/i.test( UA ) && !/edge/i.test( UA );

		var testElement = document.createElement( 'div' );

		features.transforms3d = 'WebkitPerspective' in testElement.style ||
								'MozPerspective' in testElement.style ||
								'msPerspective' in testElement.style ||
								'OPerspective' in testElement.style ||
								'perspective' in testElement.style;

		features.transforms2d = 'WebkitTransform' in testElement.style ||
								'MozTransform' in testElement.style ||
								'msTransform' in testElement.style ||
								'OTransform' in testElement.style ||
								'transform' in testElement.style;

		features.requestAnimationFrameMethod = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
		features.requestAnimationFrame = typeof features.requestAnimationFrameMethod === 'function';

		features.canvas = !!document.createElement( 'canvas' ).getContext;

		// Transitions in the overview are disabled in desktop and
		// Safari due to lag
		features.overviewTransitions = !/Version\/[\d\.]+.*Safari/.test( UA );

		// Flags if we should use zoom instead of transform to scale
		// up slides. Zoom produces crisper results but has a lot of
		// xbrowser quirks so we only use it in whitelsited browsers.
		features.zoom = 'zoom' in testElement.style && !isMobileDevice &&
						( isChrome || /Version\/[\d\.]+.*Safari/.test( UA ) );

	}

    /**
     * Loads the dependencies of reveal.js. Dependencies are
     * defined via the configuration option 'dependencies'
     * and will be loaded prior to starting/binding reveal.js.
     * Some dependencies may have an 'async' flag, if so they
     * will load after reveal.js has been started up.
     */
	function load() {

		var scripts = [],
			scriptsAsync = [],
			scriptsToPreload = 0;

		// Called once synchronous scripts finish loading
		function proceed() {
			if( scriptsAsync.length ) {
				// Load asynchronous scripts
				head.js.apply( null, scriptsAsync );
			}

			start();
		}

		function loadScript( s ) {
			head.ready( s.src.match( /([\w\d_\-]*)\.?js$|[^\\\/]*$/i )[0], function() {
				// Extension may contain callback functions
				if( typeof s.callback === 'function' ) {
					s.callback.apply( this );
				}

				if( --scriptsToPreload === 0 ) {
					proceed();
				}
			});
		}

		for( var i = 0, len = config.dependencies.length; i < len; i++ ) {
			var s = config.dependencies[i];

			// Load if there's no condition or the condition is truthy
			if( !s.condition || s.condition() ) {
				if( s.async ) {
					scriptsAsync.push( s.src );
				}
				else {
					scripts.push( s.src );
				}

				loadScript( s );
			}
		}

		if( scripts.length ) {
			scriptsToPreload = scripts.length;

			// Load synchronous scripts
			head.js.apply( null, scripts );
		}
		else {
			proceed();
		}

	}

	/**
	 * Starts up reveal.js by binding input events and navigating
	 * to the current URL deeplink if there is one.
	 */
	function start() {

		// Make sure we've got all the DOM elements we need
		setupDOM();

		// Listen to messages posted to this window
		setupPostMessage();

		// Prevent the slides from being scrolled out of view
		setupScrollPrevention();

		// Resets all vertical slides so that only the first is visible
		resetVerticalSlides();

		// Updates the presentation to match the current configuration values
		configure();

		// Read the initial hash
		readURL();

		// Update all backgrounds
		updateBackground( true );

		// Notify listeners that the presentation is ready but use a 1ms
		// timeout to ensure it's not fired synchronously after #initialize()
		setTimeout( function() {
			// Enable transitions now that we're loaded
			dom.slides.classList.remove( 'no-transition' );

			loaded = true;

			dom.wrapper.classList.add( 'ready' );

			dispatchEvent( 'ready', {
				'indexh': indexh,
				'indexv': indexv,
				'currentSlide': currentSlide
			} );
		}, 1 );

		// Special setup and config is required when printing to PDF
		if( isPrintingPDF() ) {
			removeEventListeners();

			// The document needs to have loaded for the PDF layout
			// measurements to be accurate
			if( document.readyState === 'complete' ) {
				setupPDF();
			}
			else {
				window.addEventListener( 'load', setupPDF );
			}
		}

	}

	/**
	 * Finds and stores references to DOM elements which are
	 * required by the presentation. If a required element is
	 * not found, it is created.
	 */
	function setupDOM() {

		// Prevent transitions while we're loading
		dom.slides.classList.add( 'no-transition' );

		// Background element
		dom.background = createSingletonNode( dom.wrapper, 'div', 'backgrounds', null );

		// Progress bar
		dom.progress = createSingletonNode( dom.wrapper, 'div', 'progress', '<span></span>' );
		dom.progressbar = dom.progress.querySelector( 'span' );

		// Arrow controls
		createSingletonNode( dom.wrapper, 'aside', 'controls',
			'<button class="navigate-left" aria-label="previous slide"></button>' +
			'<button class="navigate-right" aria-label="next slide"></button>' +
			'<button class="navigate-up" aria-label="above slide"></button>' +
			'<button class="navigate-down" aria-label="below slide"></button>' );

		// Slide number
		dom.slideNumber = createSingletonNode( dom.wrapper, 'div', 'slide-number', '' );

		// Element containing notes that are visible to the audience
		dom.speakerNotes = createSingletonNode( dom.wrapper, 'div', 'speaker-notes', null );
		dom.speakerNotes.setAttribute( 'data-prevent-swipe', '' );
		dom.speakerNotes.setAttribute( 'tabindex', '0' );

		// Overlay graphic which is displayed during the paused mode
		createSingletonNode( dom.wrapper, 'div', 'pause-overlay', null );

		// Cache references to elements
		dom.controls = document.querySelector( '.reveal .controls' );

		dom.wrapper.setAttribute( 'role', 'application' );

		// There can be multiple instances of controls throughout the page
		dom.controlsLeft = toArray( document.querySelectorAll( '.navigate-left' ) );
		dom.controlsRight = toArray( document.querySelectorAll( '.navigate-right' ) );
		dom.controlsUp = toArray( document.querySelectorAll( '.navigate-up' ) );
		dom.controlsDown = toArray( document.querySelectorAll( '.navigate-down' ) );
		dom.controlsPrev = toArray( document.querySelectorAll( '.navigate-prev' ) );
		dom.controlsNext = toArray( document.querySelectorAll( '.navigate-next' ) );

		dom.statusDiv = createStatusDiv();
	}

	/**
	 * Creates a hidden div with role aria-live to announce the
	 * current slide content. Hide the div off-screen to make it
	 * available only to Assistive Technologies.
	 *
	 * @return {HTMLElement}
	 */
	function createStatusDiv() {

		var statusDiv = document.getElementById( 'aria-status-div' );
		if( !statusDiv ) {
			statusDiv = document.createElement( 'div' );
			statusDiv.style.position = 'absolute';
			statusDiv.style.height = '1px';
			statusDiv.style.width = '1px';
			statusDiv.style.overflow = 'hidden';
			statusDiv.style.clip = 'rect( 1px, 1px, 1px, 1px )';
			statusDiv.setAttribute( 'id', 'aria-status-div' );
			statusDiv.setAttribute( 'aria-live', 'polite' );
			statusDiv.setAttribute( 'aria-atomic','true' );
			dom.wrapper.appendChild( statusDiv );
		}
		return statusDiv;

	}

	/**
	 * Converts the given HTML element into a string of text
	 * that can be announced to a screen reader. Hidden
	 * elements are excluded.
	 */
	function getStatusText( node ) {

		var text = '';

		// Text node
		if( node.nodeType === 3 ) {
			text += node.textContent;
		}
		// Element node
		else if( node.nodeType === 1 ) {

			var isAriaHidden = node.getAttribute( 'aria-hidden' );
			var isDisplayHidden = window.getComputedStyle( node )['display'] === 'none';
			if( isAriaHidden !== 'true' && !isDisplayHidden ) {

				toArray( node.childNodes ).forEach( function( child ) {
					text += getStatusText( child );
				} );

			}

		}

		return text;

	}

	/**
	 * Configures the presentation for printing to a static
	 * PDF.
	 */
	function setupPDF() {

		var slideSize = getComputedSlideSize( window.innerWidth, window.innerHeight );

		// Dimensions of the PDF pages
		var pageWidth = Math.floor( slideSize.width * ( 1 + config.margin ) ),
			pageHeight = Math.floor( slideSize.height * ( 1 + config.margin ) );

		// Dimensions of slides within the pages
		var slideWidth = slideSize.width,
			slideHeight = slideSize.height;

		// Let the browser know what page size we want to print
		injectStyleSheet( '@page{size:'+ pageWidth +'px '+ pageHeight +'px; margin: 0px;}' );

		// Limit the size of certain elements to the dimensions of the slide
		injectStyleSheet( '.reveal section>img, .reveal section>video, .reveal section>iframe{max-width: '+ slideWidth +'px; max-height:'+ slideHeight +'px}' );

		document.body.classList.add( 'print-pdf' );
		document.body.style.width = pageWidth + 'px';
		document.body.style.height = pageHeight + 'px';

		// Make sure stretch elements fit on slide
		layoutSlideContents( slideWidth, slideHeight );

		// Add each slide's index as attributes on itself, we need these
		// indices to generate slide numbers below
		toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ).forEach( function( hslide, h ) {
			hslide.setAttribute( 'data-index-h', h );

			if( hslide.classList.contains( 'stack' ) ) {
				toArray( hslide.querySelectorAll( 'section' ) ).forEach( function( vslide, v ) {
					vslide.setAttribute( 'data-index-h', h );
					vslide.setAttribute( 'data-index-v', v );
				} );
			}
		} );

		// Slide and slide background layout
		toArray( dom.wrapper.querySelectorAll( SLIDES_SELECTOR ) ).forEach( function( slide ) {

			// Vertical stacks are not centred since their section
			// children will be
			if( slide.classList.contains( 'stack' ) === false ) {
				// Center the slide inside of the page, giving the slide some margin
				var left = ( pageWidth - slideWidth ) / 2,
					top = ( pageHeight - slideHeight ) / 2;

				var contentHeight = slide.scrollHeight;
				var numberOfPages = Math.max( Math.ceil( contentHeight / pageHeight ), 1 );

				// Adhere to configured pages per slide limit
				numberOfPages = Math.min( numberOfPages, config.pdfMaxPagesPerSlide );

				// Center slides vertically
				if( numberOfPages === 1 && config.center || slide.classList.contains( 'center' ) ) {
					top = Math.max( ( pageHeight - contentHeight ) / 2, 0 );
				}

				// Wrap the slide in a page element and hide its overflow
				// so that no page ever flows onto another
				var page = document.createElement( 'div' );
				page.className = 'pdf-page';
				page.style.height = ( ( pageHeight + config.pdfPageHeightOffset ) * numberOfPages ) + 'px';
				slide.parentNode.insertBefore( page, slide );
				page.appendChild( slide );

				// Position the slide inside of the page
				slide.style.left = left + 'px';
				slide.style.top = top + 'px';
				slide.style.width = slideWidth + 'px';

				if( slide.slideBackgroundElement ) {
					page.insertBefore( slide.slideBackgroundElement, slide );
				}

				// Inject notes if `showNotes` is enabled
				if( config.showNotes ) {

					// Are there notes for this slide?
					var notes = getSlideNotes( slide );
					if( notes ) {

						var notesSpacing = 8;
						var notesLayout = typeof config.showNotes === 'string' ? config.showNotes : 'inline';
						var notesElement = document.createElement( 'div' );
						notesElement.classList.add( 'speaker-notes' );
						notesElement.classList.add( 'speaker-notes-pdf' );
						notesElement.setAttribute( 'data-layout', notesLayout );
						notesElement.innerHTML = notes;

						if( notesLayout === 'separate-page' ) {
							page.parentNode.insertBefore( notesElement, page.nextSibling );
						}
						else {
							notesElement.style.left = notesSpacing + 'px';
							notesElement.style.bottom = notesSpacing + 'px';
							notesElement.style.width = ( pageWidth - notesSpacing*2 ) + 'px';
							page.appendChild( notesElement );
						}

					}

				}

				// Inject slide numbers if `slideNumbers` are enabled
				if( config.slideNumber && /all|print/i.test( config.showSlideNumber ) ) {
					var slideNumberH = parseInt( slide.getAttribute( 'data-index-h' ), 10 ) + 1,
						slideNumberV = parseInt( slide.getAttribute( 'data-index-v' ), 10 ) + 1;

					var numberElement = document.createElement( 'div' );
					numberElement.classList.add( 'slide-number' );
					numberElement.classList.add( 'slide-number-pdf' );
					numberElement.innerHTML = formatSlideNumber( slideNumberH, '.', slideNumberV );
					page.appendChild( numberElement );
				}
			}

		} );

		// Show all fragments
		toArray( dom.wrapper.querySelectorAll( SLIDES_SELECTOR + ' .fragment' ) ).forEach( function( fragment ) {
			fragment.classList.add( 'visible' );
		} );

		// Notify subscribers that the PDF layout is good to go
		dispatchEvent( 'pdf-ready' );

	}

	/**
	 * This is an unfortunate necessity. Some actions – such as
	 * an input field being focused in an iframe or using the
	 * keyboard to expand text selection beyond the bounds of
	 * a slide – can trigger our content to be pushed out of view.
	 * This scrolling can not be prevented by hiding overflow in
	 * CSS (we already do) so we have to resort to repeatedly
	 * checking if the slides have been offset :(
	 */
	function setupScrollPrevention() {

		setInterval( function() {
			if( dom.wrapper.scrollTop !== 0 || dom.wrapper.scrollLeft !== 0 ) {
				dom.wrapper.scrollTop = 0;
				dom.wrapper.scrollLeft = 0;
			}
		}, 1000 );

	}

	/**
	 * Creates an HTML element and returns a reference to it.
	 * If the element already exists the existing instance will
	 * be returned.
	 *
	 * @param {HTMLElement} container
	 * @param {string} tagname
	 * @param {string} classname
	 * @param {string} innerHTML
	 *
	 * @return {HTMLElement}
	 */
	function createSingletonNode( container, tagname, classname, innerHTML ) {

		// Find all nodes matching the description
		var nodes = container.querySelectorAll( '.' + classname );

		// Check all matches to find one which is a direct child of
		// the specified container
		for( var i = 0; i < nodes.length; i++ ) {
			var testNode = nodes[i];
			if( testNode.parentNode === container ) {
				return testNode;
			}
		}

		// If no node was found, create it now
		var node = document.createElement( tagname );
		node.classList.add( classname );
		if( typeof innerHTML === 'string' ) {
			node.innerHTML = innerHTML;
		}
		container.appendChild( node );

		return node;

	}

	/**
	 * Creates the slide background elements and appends them
	 * to the background container. One element is created per
	 * slide no matter if the given slide has visible background.
	 */
	function createBackgrounds() {

		var printMode = isPrintingPDF();

		// Clear prior backgrounds
		dom.background.innerHTML = '';
		dom.background.classList.add( 'no-transition' );

		// Iterate over all horizontal slides
		toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ).forEach( function( slideh ) {

			var backgroundStack = createBackground( slideh, dom.background );

			// Iterate over all vertical slides
			toArray( slideh.querySelectorAll( 'section' ) ).forEach( function( slidev ) {

				createBackground( slidev, backgroundStack );

				backgroundStack.classList.add( 'stack' );

			} );

		} );

		// Add parallax background if specified
		if( config.parallaxBackgroundImage ) {

			dom.background.style.backgroundImage = 'url("' + config.parallaxBackgroundImage + '")';
			dom.background.style.backgroundSize = config.parallaxBackgroundSize;

			// Make sure the below properties are set on the element - these properties are
			// needed for proper transitions to be set on the element via CSS. To remove
			// annoying background slide-in effect when the presentation starts, apply
			// these properties after short time delay
			setTimeout( function() {
				dom.wrapper.classList.add( 'has-parallax-background' );
			}, 1 );

		}
		else {

			dom.background.style.backgroundImage = '';
			dom.wrapper.classList.remove( 'has-parallax-background' );

		}

	}

	/**
	 * Creates a background for the given slide.
	 *
	 * @param {HTMLElement} slide
	 * @param {HTMLElement} container The element that the background
	 * should be appended to
	 * @return {HTMLElement} New background div
	 */
	function createBackground( slide, container ) {

		var data = {
			background: slide.getAttribute( 'data-background' ),
			backgroundSize: slide.getAttribute( 'data-background-size' ),
			backgroundImage: slide.getAttribute( 'data-background-image' ),
			backgroundVideo: slide.getAttribute( 'data-background-video' ),
			backgroundIframe: slide.getAttribute( 'data-background-iframe' ),
			backgroundColor: slide.getAttribute( 'data-background-color' ),
			backgroundRepeat: slide.getAttribute( 'data-background-repeat' ),
			backgroundPosition: slide.getAttribute( 'data-background-position' ),
			backgroundTransition: slide.getAttribute( 'data-background-transition' )
		};

		var element = document.createElement( 'div' );

		// Carry over custom classes from the slide to the background
		element.className = 'slide-background ' + slide.className.replace( /present|past|future/, '' );

		if( data.background ) {
			// Auto-wrap image urls in url(...)
			if( /^(http|file|\/\/)/gi.test( data.background ) || /\.(svg|png|jpg|jpeg|gif|bmp)([?#]|$)/gi.test( data.background ) ) {
				slide.setAttribute( 'data-background-image', data.background );
			}
			else {
				element.style.background = data.background;
			}
		}

		// Create a hash for this combination of background settings.
		// This is used to determine when two slide backgrounds are
		// the same.
		if( data.background || data.backgroundColor || data.backgroundImage || data.backgroundVideo || data.backgroundIframe ) {
			element.setAttribute( 'data-background-hash', data.background +
															data.backgroundSize +
															data.backgroundImage +
															data.backgroundVideo +
															data.backgroundIframe +
															data.backgroundColor +
															data.backgroundRepeat +
															data.backgroundPosition +
															data.backgroundTransition );
		}

		// Additional and optional background properties
		if( data.backgroundSize ) element.style.backgroundSize = data.backgroundSize;
		if( data.backgroundSize ) element.setAttribute( 'data-background-size', data.backgroundSize );
		if( data.backgroundColor ) element.style.backgroundColor = data.backgroundColor;
		if( data.backgroundRepeat ) element.style.backgroundRepeat = data.backgroundRepeat;
		if( data.backgroundPosition ) element.style.backgroundPosition = data.backgroundPosition;
		if( data.backgroundTransition ) element.setAttribute( 'data-background-transition', data.backgroundTransition );

		container.appendChild( element );

		// If backgrounds are being recreated, clear old classes
		slide.classList.remove( 'has-dark-background' );
		slide.classList.remove( 'has-light-background' );

		slide.slideBackgroundElement = element;

		// If this slide has a background color, add a class that
		// signals if it is light or dark. If the slide has no background
		// color, no class will be set
		var computedBackgroundStyle = window.getComputedStyle( element );
		if( computedBackgroundStyle && computedBackgroundStyle.backgroundColor ) {
			var rgb = colorToRgb( computedBackgroundStyle.backgroundColor );

			// Ignore fully transparent backgrounds. Some browsers return
			// rgba(0,0,0,0) when reading the computed background color of
			// an element with no background
			if( rgb && rgb.a !== 0 ) {
				if( colorBrightness( computedBackgroundStyle.backgroundColor ) < 128 ) {
					slide.classList.add( 'has-dark-background' );
				}
				else {
					slide.classList.add( 'has-light-background' );
				}
			}
		}

		return element;

	}

	/**
	 * Registers a listener to postMessage events, this makes it
	 * possible to call all reveal.js API methods from another
	 * window. For example:
	 *
	 * revealWindow.postMessage( JSON.stringify({
	 *   method: 'slide',
	 *   args: [ 2 ]
	 * }), '*' );
	 */
	function setupPostMessage() {

		if( config.postMessage ) {
			window.addEventListener( 'message', function ( event ) {
				var data = event.data;

				// Make sure we're dealing with JSON
				if( typeof data === 'string' && data.charAt( 0 ) === '{' && data.charAt( data.length - 1 ) === '}' ) {
					data = JSON.parse( data );

					// Check if the requested method can be found
					if( data.method && typeof Reveal[data.method] === 'function' ) {
						Reveal[data.method].apply( Reveal, data.args );
					}
				}
			}, false );
		}

	}

	/**
	 * Applies the configuration settings from the config
	 * object. May be called multiple times.
	 *
	 * @param {object} options
	 */
	function configure( options ) {

		var numberOfSlides = dom.wrapper.querySelectorAll( SLIDES_SELECTOR ).length;

		dom.wrapper.classList.remove( config.transition );

		// New config options may be passed when this method
		// is invoked through the API after initialization
		if( typeof options === 'object' ) extend( config, options );

		// Force linear transition based on browser capabilities
		if( features.transforms3d === false ) config.transition = 'linear';

		dom.wrapper.classList.add( config.transition );

		dom.wrapper.setAttribute( 'data-transition-speed', config.transitionSpeed );
		dom.wrapper.setAttribute( 'data-background-transition', config.backgroundTransition );

		dom.controls.style.display = config.controls ? 'block' : 'none';
		dom.progress.style.display = config.progress ? 'block' : 'none';

		if( config.shuffle ) {
			shuffle();
		}

		if( config.rtl ) {
			dom.wrapper.classList.add( 'rtl' );
		}
		else {
			dom.wrapper.classList.remove( 'rtl' );
		}

		if( config.center ) {
			dom.wrapper.classList.add( 'center' );
		}
		else {
			dom.wrapper.classList.remove( 'center' );
		}

		// Exit the paused mode if it was configured off
		if( config.pause === false ) {
			resume();
		}

		if( config.showNotes ) {
			dom.speakerNotes.classList.add( 'visible' );
			dom.speakerNotes.setAttribute( 'data-layout', typeof config.showNotes === 'string' ? config.showNotes : 'inline' );
		}
		else {
			dom.speakerNotes.classList.remove( 'visible' );
		}

		if( config.mouseWheel ) {
			document.addEventListener( 'DOMMouseScroll', onDocumentMouseScroll, false ); // FF
			document.addEventListener( 'mousewheel', onDocumentMouseScroll, false );
		}
		else {
			document.removeEventListener( 'DOMMouseScroll', onDocumentMouseScroll, false ); // FF
			document.removeEventListener( 'mousewheel', onDocumentMouseScroll, false );
		}

		// Rolling 3D links
		if( config.rollingLinks ) {
			enableRollingLinks();
		}
		else {
			disableRollingLinks();
		}

		// Iframe link previews
		if( config.previewLinks ) {
			enablePreviewLinks();
			disablePreviewLinks( '[data-preview-link=false]' );
		}
		else {
			disablePreviewLinks();
			enablePreviewLinks( '[data-preview-link]:not([data-preview-link=false])' );
		}

		// Remove existing auto-slide controls
		if( autoSlidePlayer ) {
			autoSlidePlayer.destroy();
			autoSlidePlayer = null;
		}

		// Generate auto-slide controls if needed
		if( numberOfSlides > 1 && config.autoSlide && config.autoSlideStoppable && features.canvas && features.requestAnimationFrame ) {
			autoSlidePlayer = new Playback( dom.wrapper, function() {
				return Math.min( Math.max( ( Date.now() - autoSlideStartTime ) / autoSlide, 0 ), 1 );
			} );

			autoSlidePlayer.on( 'click', onAutoSlidePlayerClick );
			autoSlidePaused = false;
		}

		// When fragments are turned off they should be visible
		if( config.fragments === false ) {
			toArray( dom.slides.querySelectorAll( '.fragment' ) ).forEach( function( element ) {
				element.classList.add( 'visible' );
				element.classList.remove( 'current-fragment' );
			} );
		}

		// Slide numbers
		var slideNumberDisplay = 'none';
		if( config.slideNumber && !isPrintingPDF() ) {
			if( config.showSlideNumber === 'all' ) {
				slideNumberDisplay = 'block';
			}
			else if( config.showSlideNumber === 'speaker' && isSpeakerNotes() ) {
				slideNumberDisplay = 'block';
			}
		}

		dom.slideNumber.style.display = slideNumberDisplay;

		sync();

	}

	/**
	 * Binds all event listeners.
	 */
	function addEventListeners() {

		eventsAreBound = true;

		window.addEventListener( 'hashchange', onWindowHashChange, false );
		window.addEventListener( 'resize', onWindowResize, false );

		if( config.touch ) {
			dom.wrapper.addEventListener( 'touchstart', onTouchStart, false );
			dom.wrapper.addEventListener( 'touchmove', onTouchMove, false );
			dom.wrapper.addEventListener( 'touchend', onTouchEnd, false );

			// Support pointer-style touch interaction as well
			if( window.navigator.pointerEnabled ) {
				// IE 11 uses un-prefixed version of pointer events
				dom.wrapper.addEventListener( 'pointerdown', onPointerDown, false );
				dom.wrapper.addEventListener( 'pointermove', onPointerMove, false );
				dom.wrapper.addEventListener( 'pointerup', onPointerUp, false );
			}
			else if( window.navigator.msPointerEnabled ) {
				// IE 10 uses prefixed version of pointer events
				dom.wrapper.addEventListener( 'MSPointerDown', onPointerDown, false );
				dom.wrapper.addEventListener( 'MSPointerMove', onPointerMove, false );
				dom.wrapper.addEventListener( 'MSPointerUp', onPointerUp, false );
			}
		}

		if( config.keyboard ) {
			document.addEventListener( 'keydown', onDocumentKeyDown, false );
			document.addEventListener( 'keypress', onDocumentKeyPress, false );
		}

		if( config.progress && dom.progress ) {
			dom.progress.addEventListener( 'click', onProgressClicked, false );
		}

		if( config.focusBodyOnPageVisibilityChange ) {
			var visibilityChange;

			if( 'hidden' in document ) {
				visibilityChange = 'visibilitychange';
			}
			else if( 'msHidden' in document ) {
				visibilityChange = 'msvisibilitychange';
			}
			else if( 'webkitHidden' in document ) {
				visibilityChange = 'webkitvisibilitychange';
			}

			if( visibilityChange ) {
				document.addEventListener( visibilityChange, onPageVisibilityChange, false );
			}
		}

		// Listen to both touch and click events, in case the device
		// supports both
		var pointerEvents = [ 'touchstart', 'click' ];

		// Only support touch for Android, fixes double navigations in
		// stock browser
		if( UA.match( /android/gi ) ) {
			pointerEvents = [ 'touchstart' ];
		}

		pointerEvents.forEach( function( eventName ) {
			dom.controlsLeft.forEach( function( el ) { el.addEventListener( eventName, onNavigateLeftClicked, false ); } );
			dom.controlsRight.forEach( function( el ) { el.addEventListener( eventName, onNavigateRightClicked, false ); } );
			dom.controlsUp.forEach( function( el ) { el.addEventListener( eventName, onNavigateUpClicked, false ); } );
			dom.controlsDown.forEach( function( el ) { el.addEventListener( eventName, onNavigateDownClicked, false ); } );
			dom.controlsPrev.forEach( function( el ) { el.addEventListener( eventName, onNavigatePrevClicked, false ); } );
			dom.controlsNext.forEach( function( el ) { el.addEventListener( eventName, onNavigateNextClicked, false ); } );
		} );

	}

	/**
	 * Unbinds all event listeners.
	 */
	function removeEventListeners() {

		eventsAreBound = false;

		document.removeEventListener( 'keydown', onDocumentKeyDown, false );
		document.removeEventListener( 'keypress', onDocumentKeyPress, false );
		window.removeEventListener( 'hashchange', onWindowHashChange, false );
		window.removeEventListener( 'resize', onWindowResize, false );

		dom.wrapper.removeEventListener( 'touchstart', onTouchStart, false );
		dom.wrapper.removeEventListener( 'touchmove', onTouchMove, false );
		dom.wrapper.removeEventListener( 'touchend', onTouchEnd, false );

		// IE11
		if( window.navigator.pointerEnabled ) {
			dom.wrapper.removeEventListener( 'pointerdown', onPointerDown, false );
			dom.wrapper.removeEventListener( 'pointermove', onPointerMove, false );
			dom.wrapper.removeEventListener( 'pointerup', onPointerUp, false );
		}
		// IE10
		else if( window.navigator.msPointerEnabled ) {
			dom.wrapper.removeEventListener( 'MSPointerDown', onPointerDown, false );
			dom.wrapper.removeEventListener( 'MSPointerMove', onPointerMove, false );
			dom.wrapper.removeEventListener( 'MSPointerUp', onPointerUp, false );
		}

		if ( config.progress && dom.progress ) {
			dom.progress.removeEventListener( 'click', onProgressClicked, false );
		}

		[ 'touchstart', 'click' ].forEach( function( eventName ) {
			dom.controlsLeft.forEach( function( el ) { el.removeEventListener( eventName, onNavigateLeftClicked, false ); } );
			dom.controlsRight.forEach( function( el ) { el.removeEventListener( eventName, onNavigateRightClicked, false ); } );
			dom.controlsUp.forEach( function( el ) { el.removeEventListener( eventName, onNavigateUpClicked, false ); } );
			dom.controlsDown.forEach( function( el ) { el.removeEventListener( eventName, onNavigateDownClicked, false ); } );
			dom.controlsPrev.forEach( function( el ) { el.removeEventListener( eventName, onNavigatePrevClicked, false ); } );
			dom.controlsNext.forEach( function( el ) { el.removeEventListener( eventName, onNavigateNextClicked, false ); } );
		} );

	}

	/**
	 * Extend object a with the properties of object b.
	 * If there's a conflict, object b takes precedence.
	 *
	 * @param {object} a
	 * @param {object} b
	 */
	function extend( a, b ) {

		for( var i in b ) {
			a[ i ] = b[ i ];
		}

	}

	/**
	 * Converts the target object to an array.
	 *
	 * @param {object} o
	 * @return {object[]}
	 */
	function toArray( o ) {

		return Array.prototype.slice.call( o );

	}

	/**
	 * Utility for deserializing a value.
	 *
	 * @param {*} value
	 * @return {*}
	 */
	function deserialize( value ) {

		if( typeof value === 'string' ) {
			if( value === 'null' ) return null;
			else if( value === 'true' ) return true;
			else if( value === 'false' ) return false;
			else if( value.match( /^[\d\.]+$/ ) ) return parseFloat( value );
		}

		return value;

	}

	/**
	 * Measures the distance in pixels between point a
	 * and point b.
	 *
	 * @param {object} a point with x/y properties
	 * @param {object} b point with x/y properties
	 *
	 * @return {number}
	 */
	function distanceBetween( a, b ) {

		var dx = a.x - b.x,
			dy = a.y - b.y;

		return Math.sqrt( dx*dx + dy*dy );

	}

	/**
	 * Applies a CSS transform to the target element.
	 *
	 * @param {HTMLElement} element
	 * @param {string} transform
	 */
	function transformElement( element, transform ) {

		element.style.WebkitTransform = transform;
		element.style.MozTransform = transform;
		element.style.msTransform = transform;
		element.style.transform = transform;

	}

	/**
	 * Applies CSS transforms to the slides container. The container
	 * is transformed from two separate sources: layout and the overview
	 * mode.
	 *
	 * @param {object} transforms
	 */
	function transformSlides( transforms ) {

		// Pick up new transforms from arguments
		if( typeof transforms.layout === 'string' ) slidesTransform.layout = transforms.layout;
		if( typeof transforms.overview === 'string' ) slidesTransform.overview = transforms.overview;

		// Apply the transforms to the slides container
		if( slidesTransform.layout ) {
			transformElement( dom.slides, slidesTransform.layout + ' ' + slidesTransform.overview );
		}
		else {
			transformElement( dom.slides, slidesTransform.overview );
		}

	}

	/**
	 * Injects the given CSS styles into the DOM.
	 *
	 * @param {string} value
	 */
	function injectStyleSheet( value ) {

		var tag = document.createElement( 'style' );
		tag.type = 'text/css';
		if( tag.styleSheet ) {
			tag.styleSheet.cssText = value;
		}
		else {
			tag.appendChild( document.createTextNode( value ) );
		}
		document.getElementsByTagName( 'head' )[0].appendChild( tag );

	}

	/**
	 * Find the closest parent that matches the given
	 * selector.
	 *
	 * @param {HTMLElement} target The child element
	 * @param {String} selector The CSS selector to match
	 * the parents against
	 *
	 * @return {HTMLElement} The matched parent or null
	 * if no matching parent was found
	 */
	function closestParent( target, selector ) {

		var parent = target.parentNode;

		while( parent ) {

			// There's some overhead doing this each time, we don't
			// want to rewrite the element prototype but should still
			// be enough to feature detect once at startup...
			var matchesMethod = parent.matches || parent.matchesSelector || parent.msMatchesSelector;

			// If we find a match, we're all set
			if( matchesMethod && matchesMethod.call( parent, selector ) ) {
				return parent;
			}

			// Keep searching
			parent = parent.parentNode;

		}

		return null;

	}

	/**
	 * Converts various color input formats to an {r:0,g:0,b:0} object.
	 *
	 * @param {string} color The string representation of a color
	 * @example
	 * colorToRgb('#000');
	 * @example
	 * colorToRgb('#000000');
	 * @example
	 * colorToRgb('rgb(0,0,0)');
	 * @example
	 * colorToRgb('rgba(0,0,0)');
	 *
	 * @return {{r: number, g: number, b: number, [a]: number}|null}
	 */
	function colorToRgb( color ) {

		var hex3 = color.match( /^#([0-9a-f]{3})$/i );
		if( hex3 && hex3[1] ) {
			hex3 = hex3[1];
			return {
				r: parseInt( hex3.charAt( 0 ), 16 ) * 0x11,
				g: parseInt( hex3.charAt( 1 ), 16 ) * 0x11,
				b: parseInt( hex3.charAt( 2 ), 16 ) * 0x11
			};
		}

		var hex6 = color.match( /^#([0-9a-f]{6})$/i );
		if( hex6 && hex6[1] ) {
			hex6 = hex6[1];
			return {
				r: parseInt( hex6.substr( 0, 2 ), 16 ),
				g: parseInt( hex6.substr( 2, 2 ), 16 ),
				b: parseInt( hex6.substr( 4, 2 ), 16 )
			};
		}

		var rgb = color.match( /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i );
		if( rgb ) {
			return {
				r: parseInt( rgb[1], 10 ),
				g: parseInt( rgb[2], 10 ),
				b: parseInt( rgb[3], 10 )
			};
		}

		var rgba = color.match( /^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\,\s*([\d]+|[\d]*.[\d]+)\s*\)$/i );
		if( rgba ) {
			return {
				r: parseInt( rgba[1], 10 ),
				g: parseInt( rgba[2], 10 ),
				b: parseInt( rgba[3], 10 ),
				a: parseFloat( rgba[4] )
			};
		}

		return null;

	}

	/**
	 * Calculates brightness on a scale of 0-255.
	 *
	 * @param {string} color See colorToRgb for supported formats.
	 * @see {@link colorToRgb}
	 */
	function colorBrightness( color ) {

		if( typeof color === 'string' ) color = colorToRgb( color );

		if( color ) {
			return ( color.r * 299 + color.g * 587 + color.b * 114 ) / 1000;
		}

		return null;

	}

	/**
	 * Returns the remaining height within the parent of the
	 * target element.
	 *
	 * remaining height = [ configured parent height ] - [ current parent height ]
	 *
	 * @param {HTMLElement} element
	 * @param {number} [height]
	 */
	function getRemainingHeight( element, height ) {

		height = height || 0;

		if( element ) {
			var newHeight, oldHeight = element.style.height;

			// Change the .stretch element height to 0 in order find the height of all
			// the other elements
			element.style.height = '0px';
			newHeight = height - element.parentNode.offsetHeight;

			// Restore the old height, just in case
			element.style.height = oldHeight + 'px';

			return newHeight;
		}

		return height;

	}

	/**
	 * Checks if this instance is being used to print a PDF.
	 */
	function isPrintingPDF() {

		return ( /print-pdf/gi ).test( window.location.search );

	}

	/**
	 * Hides the address bar if we're on a mobile device.
	 */
	function hideAddressBar() {

		if( config.hideAddressBar && isMobileDevice ) {
			// Events that should trigger the address bar to hide
			window.addEventListener( 'load', removeAddressBar, false );
			window.addEventListener( 'orientationchange', removeAddressBar, false );
		}

	}

	/**
	 * Causes the address bar to hide on mobile devices,
	 * more vertical space ftw.
	 */
	function removeAddressBar() {

		setTimeout( function() {
			window.scrollTo( 0, 1 );
		}, 10 );

	}

	/**
	 * Dispatches an event of the specified type from the
	 * reveal DOM element.
	 */
	function dispatchEvent( type, args ) {

		var event = document.createEvent( 'HTMLEvents', 1, 2 );
		event.initEvent( type, true, true );
		extend( event, args );
		dom.wrapper.dispatchEvent( event );

		// If we're in an iframe, post each reveal.js event to the
		// parent window. Used by the notes plugin
		if( config.postMessageEvents && window.parent !== window.self ) {
			window.parent.postMessage( JSON.stringify({ namespace: 'reveal', eventName: type, state: getState() }), '*' );
		}

	}

	/**
	 * Wrap all links in 3D goodness.
	 */
	function enableRollingLinks() {

		if( features.transforms3d && !( 'msPerspective' in document.body.style ) ) {
			var anchors = dom.wrapper.querySelectorAll( SLIDES_SELECTOR + ' a' );

			for( var i = 0, len = anchors.length; i < len; i++ ) {
				var anchor = anchors[i];

				if( anchor.textContent && !anchor.querySelector( '*' ) && ( !anchor.className || !anchor.classList.contains( anchor, 'roll' ) ) ) {
					var span = document.createElement('span');
					span.setAttribute('data-title', anchor.text);
					span.innerHTML = anchor.innerHTML;

					anchor.classList.add( 'roll' );
					anchor.innerHTML = '';
					anchor.appendChild(span);
				}
			}
		}

	}

	/**
	 * Unwrap all 3D links.
	 */
	function disableRollingLinks() {

		var anchors = dom.wrapper.querySelectorAll( SLIDES_SELECTOR + ' a.roll' );

		for( var i = 0, len = anchors.length; i < len; i++ ) {
			var anchor = anchors[i];
			var span = anchor.querySelector( 'span' );

			if( span ) {
				anchor.classList.remove( 'roll' );
				anchor.innerHTML = span.innerHTML;
			}
		}

	}

	/**
	 * Bind preview frame links.
	 *
	 * @param {string} [selector=a] - selector for anchors
	 */
	function enablePreviewLinks( selector ) {

		var anchors = toArray( document.querySelectorAll( selector ? selector : 'a' ) );

		anchors.forEach( function( element ) {
			if( /^(http|www)/gi.test( element.getAttribute( 'href' ) ) ) {
				element.addEventListener( 'click', onPreviewLinkClicked, false );
			}
		} );

	}

	/**
	 * Unbind preview frame links.
	 */
	function disablePreviewLinks( selector ) {

		var anchors = toArray( document.querySelectorAll( selector ? selector : 'a' ) );

		anchors.forEach( function( element ) {
			if( /^(http|www)/gi.test( element.getAttribute( 'href' ) ) ) {
				element.removeEventListener( 'click', onPreviewLinkClicked, false );
			}
		} );

	}

	/**
	 * Opens a preview window for the target URL.
	 *
	 * @param {string} url - url for preview iframe src
	 */
	function showPreview( url ) {

		closeOverlay();

		dom.overlay = document.createElement( 'div' );
		dom.overlay.classList.add( 'overlay' );
		dom.overlay.classList.add( 'overlay-preview' );
		dom.wrapper.appendChild( dom.overlay );

		dom.overlay.innerHTML = [
			'<header>',
				'<a class="close" href="#"><span class="icon"></span></a>',
				'<a class="external" href="'+ url +'" target="_blank"><span class="icon"></span></a>',
			'</header>',
			'<div class="spinner"></div>',
			'<div class="viewport">',
				'<iframe src="'+ url +'"></iframe>',
				'<small class="viewport-inner">',
					'<span class="x-frame-error">Unable to load iframe. This is likely due to the site\'s policy (x-frame-options).</span>',
				'</small>',
			'</div>'
		].join('');

		dom.overlay.querySelector( 'iframe' ).addEventListener( 'load', function( event ) {
			dom.overlay.classList.add( 'loaded' );
		}, false );

		dom.overlay.querySelector( '.close' ).addEventListener( 'click', function( event ) {
			closeOverlay();
			event.preventDefault();
		}, false );

		dom.overlay.querySelector( '.external' ).addEventListener( 'click', function( event ) {
			closeOverlay();
		}, false );

		setTimeout( function() {
			dom.overlay.classList.add( 'visible' );
		}, 1 );

	}

	/**
	 * Open or close help overlay window.
	 *
	 * @param {Boolean} [override] Flag which overrides the
	 * toggle logic and forcibly sets the desired state. True means
	 * help is open, false means it's closed.
	 */
	function toggleHelp( override ){

		if( typeof override === 'boolean' ) {
			override ? showHelp() : closeOverlay();
		}
		else {
			if( dom.overlay ) {
				closeOverlay();
			}
			else {
				showHelp();
			}
		}
	}

	/**
	 * Opens an overlay window with help material.
	 */
	function showHelp() {

		if( config.help ) {

			closeOverlay();

			dom.overlay = document.createElement( 'div' );
			dom.overlay.classList.add( 'overlay' );
			dom.overlay.classList.add( 'overlay-help' );
			dom.wrapper.appendChild( dom.overlay );

			var html = '<p class="title">Keyboard Shortcuts</p><br/>';

			html += '<table><th>KEY</th><th>ACTION</th>';
			for( var key in keyboardShortcuts ) {
				html += '<tr><td>' + key + '</td><td>' + keyboardShortcuts[ key ] + '</td></tr>';
			}

			html += '</table>';

			dom.overlay.innerHTML = [
				'<header>',
					'<a class="close" href="#"><span class="icon"></span></a>',
				'</header>',
				'<div class="viewport">',
					'<div class="viewport-inner">'+ html +'</div>',
				'</div>'
			].join('');

			dom.overlay.querySelector( '.close' ).addEventListener( 'click', function( event ) {
				closeOverlay();
				event.preventDefault();
			}, false );

			setTimeout( function() {
				dom.overlay.classList.add( 'visible' );
			}, 1 );

		}

	}

	/**
	 * Closes any currently open overlay.
	 */
	function closeOverlay() {

		if( dom.overlay ) {
			dom.overlay.parentNode.removeChild( dom.overlay );
			dom.overlay = null;
		}

	}

	/**
	 * Applies JavaScript-controlled layout rules to the
	 * presentation.
	 */
	function layout() {

		if( dom.wrapper && !isPrintingPDF() ) {

			var size = getComputedSlideSize();

			// Layout the contents of the slides
			layoutSlideContents( config.width, config.height );

			dom.slides.style.width = size.width + 'px';
			dom.slides.style.height = size.height + 'px';

			// Determine scale of content to fit within available space
			scale = Math.min( size.presentationWidth / size.width, size.presentationHeight / size.height );

			// Respect max/min scale settings
			scale = Math.max( scale, config.minScale );
			scale = Math.min( scale, config.maxScale );

			// Don't apply any scaling styles if scale is 1
			if( scale === 1 ) {
				dom.slides.style.zoom = '';
				dom.slides.style.left = '';
				dom.slides.style.top = '';
				dom.slides.style.bottom = '';
				dom.slides.style.right = '';
				transformSlides( { layout: '' } );
			}
			else {
				// Prefer zoom for scaling up so that content remains crisp.
				// Don't use zoom to scale down since that can lead to shifts
				// in text layout/line breaks.
				if( scale > 1 && features.zoom ) {
					dom.slides.style.zoom = scale;
					dom.slides.style.left = '';
					dom.slides.style.top = '';
					dom.slides.style.bottom = '';
					dom.slides.style.right = '';
					transformSlides( { layout: '' } );
				}
				// Apply scale transform as a fallback
				else {
					dom.slides.style.zoom = '';
					dom.slides.style.left = '50%';
					dom.slides.style.top = '50%';
					dom.slides.style.bottom = 'auto';
					dom.slides.style.right = 'auto';
					transformSlides( { layout: 'translate(-50%, -50%) scale('+ scale +')' } );
				}
			}

			// Select all slides, vertical and horizontal
			var slides = toArray( dom.wrapper.querySelectorAll( SLIDES_SELECTOR ) );

			for( var i = 0, len = slides.length; i < len; i++ ) {
				var slide = slides[ i ];

				// Don't bother updating invisible slides
				if( slide.style.display === 'none' ) {
					continue;
				}

				if( config.center || slide.classList.contains( 'center' ) ) {
					// Vertical stacks are not centred since their section
					// children will be
					if( slide.classList.contains( 'stack' ) ) {
						slide.style.top = 0;
					}
					else {
						slide.style.top = Math.max( ( size.height - slide.scrollHeight ) / 2, 0 ) + 'px';
					}
				}
				else {
					slide.style.top = '';
				}

			}

			updateProgress();
			updateParallax();

			if( isOverview() ) {
				updateOverview();
			}

		}

	}

	/**
	 * Applies layout logic to the contents of all slides in
	 * the presentation.
	 *
	 * @param {string|number} width
	 * @param {string|number} height
	 */
	function layoutSlideContents( width, height ) {

		// Handle sizing of elements with the 'stretch' class
		toArray( dom.slides.querySelectorAll( 'section > .stretch' ) ).forEach( function( element ) {

			// Determine how much vertical space we can use
			var remainingHeight = getRemainingHeight( element, height );

			// Consider the aspect ratio of media elements
			if( /(img|video)/gi.test( element.nodeName ) ) {
				var nw = element.naturalWidth || element.videoWidth,
					nh = element.naturalHeight || element.videoHeight;

				var es = Math.min( width / nw, remainingHeight / nh );

				element.style.width = ( nw * es ) + 'px';
				element.style.height = ( nh * es ) + 'px';

			}
			else {
				element.style.width = width + 'px';
				element.style.height = remainingHeight + 'px';
			}

		} );

	}

	/**
	 * Calculates the computed pixel size of our slides. These
	 * values are based on the width and height configuration
	 * options.
	 *
	 * @param {number} [presentationWidth=dom.wrapper.offsetWidth]
	 * @param {number} [presentationHeight=dom.wrapper.offsetHeight]
	 */
	function getComputedSlideSize( presentationWidth, presentationHeight ) {

		var size = {
			// Slide size
			width: config.width,
			height: config.height,

			// Presentation size
			presentationWidth: presentationWidth || dom.wrapper.offsetWidth,
			presentationHeight: presentationHeight || dom.wrapper.offsetHeight
		};

		// Reduce available space by margin
		size.presentationWidth -= ( size.presentationWidth * config.margin );
		size.presentationHeight -= ( size.presentationHeight * config.margin );

		// Slide width may be a percentage of available width
		if( typeof size.width === 'string' && /%$/.test( size.width ) ) {
			size.width = parseInt( size.width, 10 ) / 100 * size.presentationWidth;
		}

		// Slide height may be a percentage of available height
		if( typeof size.height === 'string' && /%$/.test( size.height ) ) {
			size.height = parseInt( size.height, 10 ) / 100 * size.presentationHeight;
		}

		return size;

	}

	/**
	 * Stores the vertical index of a stack so that the same
	 * vertical slide can be selected when navigating to and
	 * from the stack.
	 *
	 * @param {HTMLElement} stack The vertical stack element
	 * @param {string|number} [v=0] Index to memorize
	 */
	function setPreviousVerticalIndex( stack, v ) {

		if( typeof stack === 'object' && typeof stack.setAttribute === 'function' ) {
			stack.setAttribute( 'data-previous-indexv', v || 0 );
		}

	}

	/**
	 * Retrieves the vertical index which was stored using
	 * #setPreviousVerticalIndex() or 0 if no previous index
	 * exists.
	 *
	 * @param {HTMLElement} stack The vertical stack element
	 */
	function getPreviousVerticalIndex( stack ) {

		if( typeof stack === 'object' && typeof stack.setAttribute === 'function' && stack.classList.contains( 'stack' ) ) {
			// Prefer manually defined start-indexv
			var attributeName = stack.hasAttribute( 'data-start-indexv' ) ? 'data-start-indexv' : 'data-previous-indexv';

			return parseInt( stack.getAttribute( attributeName ) || 0, 10 );
		}

		return 0;

	}

	/**
	 * Displays the overview of slides (quick nav) by scaling
	 * down and arranging all slide elements.
	 */
	function activateOverview() {

		// Only proceed if enabled in config
		if( config.overview && !isOverview() ) {

			overview = true;

			dom.wrapper.classList.add( 'overview' );
			dom.wrapper.classList.remove( 'overview-deactivating' );

			if( features.overviewTransitions ) {
				setTimeout( function() {
					dom.wrapper.classList.add( 'overview-animated' );
				}, 1 );
			}

			// Don't auto-slide while in overview mode
			cancelAutoSlide();

			// Move the backgrounds element into the slide container to
			// that the same scaling is applied
			dom.slides.appendChild( dom.background );

			// Clicking on an overview slide navigates to it
			toArray( dom.wrapper.querySelectorAll( SLIDES_SELECTOR ) ).forEach( function( slide ) {
				if( !slide.classList.contains( 'stack' ) ) {
					slide.addEventListener( 'click', onOverviewSlideClicked, true );
				}
			} );

			// Calculate slide sizes
			var margin = 70;
			var slideSize = getComputedSlideSize();
			overviewSlideWidth = slideSize.width + margin;
			overviewSlideHeight = slideSize.height + margin;

			// Reverse in RTL mode
			if( config.rtl ) {
				overviewSlideWidth = -overviewSlideWidth;
			}

			updateSlidesVisibility();
			layoutOverview();
			updateOverview();

			layout();

			// Notify observers of the overview showing
			dispatchEvent( 'overviewshown', {
				'indexh': indexh,
				'indexv': indexv,
				'currentSlide': currentSlide
			} );

		}

	}

	/**
	 * Uses CSS transforms to position all slides in a grid for
	 * display inside of the overview mode.
	 */
	function layoutOverview() {

		// Layout slides
		toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ).forEach( function( hslide, h ) {
			hslide.setAttribute( 'data-index-h', h );
			transformElement( hslide, 'translate3d(' + ( h * overviewSlideWidth ) + 'px, 0, 0)' );

			if( hslide.classList.contains( 'stack' ) ) {

				toArray( hslide.querySelectorAll( 'section' ) ).forEach( function( vslide, v ) {
					vslide.setAttribute( 'data-index-h', h );
					vslide.setAttribute( 'data-index-v', v );

					transformElement( vslide, 'translate3d(0, ' + ( v * overviewSlideHeight ) + 'px, 0)' );
				} );

			}
		} );

		// Layout slide backgrounds
		toArray( dom.background.childNodes ).forEach( function( hbackground, h ) {
			transformElement( hbackground, 'translate3d(' + ( h * overviewSlideWidth ) + 'px, 0, 0)' );

			toArray( hbackground.querySelectorAll( '.slide-background' ) ).forEach( function( vbackground, v ) {
				transformElement( vbackground, 'translate3d(0, ' + ( v * overviewSlideHeight ) + 'px, 0)' );
			} );
		} );

	}

	/**
	 * Moves the overview viewport to the current slides.
	 * Called each time the current slide changes.
	 */
	function updateOverview() {

		var vmin = Math.min( window.innerWidth, window.innerHeight );
		var scale = Math.max( vmin / 5, 150 ) / vmin;

		transformSlides( {
			overview: [
				'scale('+ scale +')',
				'translateX('+ ( -indexh * overviewSlideWidth ) +'px)',
				'translateY('+ ( -indexv * overviewSlideHeight ) +'px)'
			].join( ' ' )
		} );

	}

	/**
	 * Exits the slide overview and enters the currently
	 * active slide.
	 */
	function deactivateOverview() {

		// Only proceed if enabled in config
		if( config.overview ) {

			overview = false;

			dom.wrapper.classList.remove( 'overview' );
			dom.wrapper.classList.remove( 'overview-animated' );

			// Temporarily add a class so that transitions can do different things
			// depending on whether they are exiting/entering overview, or just
			// moving from slide to slide
			dom.wrapper.classList.add( 'overview-deactivating' );

			setTimeout( function () {
				dom.wrapper.classList.remove( 'overview-deactivating' );
			}, 1 );

			// Move the background element back out
			dom.wrapper.appendChild( dom.background );

			// Clean up changes made to slides
			toArray( dom.wrapper.querySelectorAll( SLIDES_SELECTOR ) ).forEach( function( slide ) {
				transformElement( slide, '' );

				slide.removeEventListener( 'click', onOverviewSlideClicked, true );
			} );

			// Clean up changes made to backgrounds
			toArray( dom.background.querySelectorAll( '.slide-background' ) ).forEach( function( background ) {
				transformElement( background, '' );
			} );

			transformSlides( { overview: '' } );

			slide( indexh, indexv );

			layout();

			cueAutoSlide();

			// Notify observers of the overview hiding
			dispatchEvent( 'overviewhidden', {
				'indexh': indexh,
				'indexv': indexv,
				'currentSlide': currentSlide
			} );

		}
	}

	/**
	 * Toggles the slide overview mode on and off.
	 *
	 * @param {Boolean} [override] Flag which overrides the
	 * toggle logic and forcibly sets the desired state. True means
	 * overview is open, false means it's closed.
	 */
	function toggleOverview( override ) {

		if( typeof override === 'boolean' ) {
			override ? activateOverview() : deactivateOverview();
		}
		else {
			isOverview() ? deactivateOverview() : activateOverview();
		}

	}

	/**
	 * Checks if the overview is currently active.
	 *
	 * @return {Boolean} true if the overview is active,
	 * false otherwise
	 */
	function isOverview() {

		return overview;

	}

	/**
	 * Checks if the current or specified slide is vertical
	 * (nested within another slide).
	 *
	 * @param {HTMLElement} [slide=currentSlide] The slide to check
	 * orientation of
	 * @return {Boolean}
	 */
	function isVerticalSlide( slide ) {

		// Prefer slide argument, otherwise use current slide
		slide = slide ? slide : currentSlide;

		return slide && slide.parentNode && !!slide.parentNode.nodeName.match( /section/i );

	}

	/**
	 * Handling the fullscreen functionality via the fullscreen API
	 *
	 * @see http://fullscreen.spec.whatwg.org/
	 * @see https://developer.mozilla.org/en-US/docs/DOM/Using_fullscreen_mode
	 */
	function enterFullscreen() {

		var element = document.documentElement;

		// Check which implementation is available
		var requestMethod = element.requestFullscreen ||
							element.webkitRequestFullscreen ||
							element.webkitRequestFullScreen ||
							element.mozRequestFullScreen ||
							element.msRequestFullscreen;

		if( requestMethod ) {
			requestMethod.apply( element );
		}

	}

	/**
	 * Enters the paused mode which fades everything on screen to
	 * black.
	 */
	function pause() {

		if( config.pause ) {
			var wasPaused = dom.wrapper.classList.contains( 'paused' );

			cancelAutoSlide();
			dom.wrapper.classList.add( 'paused' );

			if( wasPaused === false ) {
				dispatchEvent( 'paused' );
			}
		}

	}

	/**
	 * Exits from the paused mode.
	 */
	function resume() {

		var wasPaused = dom.wrapper.classList.contains( 'paused' );
		dom.wrapper.classList.remove( 'paused' );

		cueAutoSlide();

		if( wasPaused ) {
			dispatchEvent( 'resumed' );
		}

	}

	/**
	 * Toggles the paused mode on and off.
	 */
	function togglePause( override ) {

		if( typeof override === 'boolean' ) {
			override ? pause() : resume();
		}
		else {
			isPaused() ? resume() : pause();
		}

	}

	/**
	 * Checks if we are currently in the paused mode.
	 *
	 * @return {Boolean}
	 */
	function isPaused() {

		return dom.wrapper.classList.contains( 'paused' );

	}

	/**
	 * Toggles the auto slide mode on and off.
	 *
	 * @param {Boolean} [override] Flag which sets the desired state.
	 * True means autoplay starts, false means it stops.
	 */

	function toggleAutoSlide( override ) {

		if( typeof override === 'boolean' ) {
			override ? resumeAutoSlide() : pauseAutoSlide();
		}

		else {
			autoSlidePaused ? resumeAutoSlide() : pauseAutoSlide();
		}

	}

	/**
	 * Checks if the auto slide mode is currently on.
	 *
	 * @return {Boolean}
	 */
	function isAutoSliding() {

		return !!( autoSlide && !autoSlidePaused );

	}

	/**
	 * Steps from the current point in the presentation to the
	 * slide which matches the specified horizontal and vertical
	 * indices.
	 *
	 * @param {number} [h=indexh] Horizontal index of the target slide
	 * @param {number} [v=indexv] Vertical index of the target slide
	 * @param {number} [f] Index of a fragment within the
	 * target slide to activate
	 * @param {number} [o] Origin for use in multimaster environments
	 */
	function slide( h, v, f, o ) {

		// Remember where we were at before
		previousSlide = currentSlide;

		// Query all horizontal slides in the deck
		var horizontalSlides = dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR );

		// Abort if there are no slides
		if( horizontalSlides.length === 0 ) return;

		// If no vertical index is specified and the upcoming slide is a
		// stack, resume at its previous vertical index
		if( v === undefined && !isOverview() ) {
			v = getPreviousVerticalIndex( horizontalSlides[ h ] );
		}

		// If we were on a vertical stack, remember what vertical index
		// it was on so we can resume at the same position when returning
		if( previousSlide && previousSlide.parentNode && previousSlide.parentNode.classList.contains( 'stack' ) ) {
			setPreviousVerticalIndex( previousSlide.parentNode, indexv );
		}

		// Remember the state before this slide
		var stateBefore = state.concat();

		// Reset the state array
		state.length = 0;

		var indexhBefore = indexh || 0,
			indexvBefore = indexv || 0;

		// Activate and transition to the new slide
		indexh = updateSlides( HORIZONTAL_SLIDES_SELECTOR, h === undefined ? indexh : h );
		indexv = updateSlides( VERTICAL_SLIDES_SELECTOR, v === undefined ? indexv : v );

		// Update the visibility of slides now that the indices have changed
		updateSlidesVisibility();

		layout();

		// Apply the new state
		stateLoop: for( var i = 0, len = state.length; i < len; i++ ) {
			// Check if this state existed on the previous slide. If it
			// did, we will avoid adding it repeatedly
			for( var j = 0; j < stateBefore.length; j++ ) {
				if( stateBefore[j] === state[i] ) {
					stateBefore.splice( j, 1 );
					continue stateLoop;
				}
			}

			document.documentElement.classList.add( state[i] );

			// Dispatch custom event matching the state's name
			dispatchEvent( state[i] );
		}

		// Clean up the remains of the previous state
		while( stateBefore.length ) {
			document.documentElement.classList.remove( stateBefore.pop() );
		}

		// Update the overview if it's currently active
		if( isOverview() ) {
			updateOverview();
		}

		// Find the current horizontal slide and any possible vertical slides
		// within it
		var currentHorizontalSlide = horizontalSlides[ indexh ],
			currentVerticalSlides = currentHorizontalSlide.querySelectorAll( 'section' );

		// Store references to the previous and current slides
		currentSlide = currentVerticalSlides[ indexv ] || currentHorizontalSlide;

		// Show fragment, if specified
		if( typeof f !== 'undefined' ) {
			navigateFragment( f );
		}

		// Dispatch an event if the slide changed
		var slideChanged = ( indexh !== indexhBefore || indexv !== indexvBefore );
		if( slideChanged ) {
			dispatchEvent( 'slidechanged', {
				'indexh': indexh,
				'indexv': indexv,
				'previousSlide': previousSlide,
				'currentSlide': currentSlide,
				'origin': o
			} );
		}
		else {
			// Ensure that the previous slide is never the same as the current
			previousSlide = null;
		}

		// Solves an edge case where the previous slide maintains the
		// 'present' class when navigating between adjacent vertical
		// stacks
		if( previousSlide ) {
			previousSlide.classList.remove( 'present' );
			previousSlide.setAttribute( 'aria-hidden', 'true' );

			// Reset all slides upon navigate to home
			// Issue: #285
			if ( dom.wrapper.querySelector( HOME_SLIDE_SELECTOR ).classList.contains( 'present' ) ) {
				// Launch async task
				setTimeout( function () {
					var slides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR + '.stack') ), i;
					for( i in slides ) {
						if( slides[i] ) {
							// Reset stack
							setPreviousVerticalIndex( slides[i], 0 );
						}
					}
				}, 0 );
			}
		}

		// Handle embedded content
		if( slideChanged || !previousSlide ) {
			stopEmbeddedContent( previousSlide );
			startEmbeddedContent( currentSlide );
		}

		// Announce the current slide contents, for screen readers
		dom.statusDiv.textContent = getStatusText( currentSlide );

		updateControls();
		updateProgress();
		updateBackground();
		updateParallax();
		updateSlideNumber();
		updateNotes();

		// Update the URL hash
		writeURL();

		cueAutoSlide();

	}

	/**
	 * Syncs the presentation with the current DOM. Useful
	 * when new slides or control elements are added or when
	 * the configuration has changed.
	 */
	function sync() {

		// Subscribe to input
		removeEventListeners();
		addEventListeners();

		// Force a layout to make sure the current config is accounted for
		layout();

		// Reflect the current autoSlide value
		autoSlide = config.autoSlide;

		// Start auto-sliding if it's enabled
		cueAutoSlide();

		// Re-create the slide backgrounds
		createBackgrounds();

		// Write the current hash to the URL
		writeURL();

		sortAllFragments();

		updateControls();
		updateProgress();
		updateSlideNumber();
		updateSlidesVisibility();
		updateBackground( true );
		updateNotes();

		formatEmbeddedContent();

		// Start or stop embedded content depending on global config
		if( config.autoPlayMedia === false ) {
			stopEmbeddedContent( currentSlide );
		}
		else {
			startEmbeddedContent( currentSlide );
		}

		if( isOverview() ) {
			layoutOverview();
		}

	}

	/**
	 * Resets all vertical slides so that only the first
	 * is visible.
	 */
	function resetVerticalSlides() {

		var horizontalSlides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );
		horizontalSlides.forEach( function( horizontalSlide ) {

			var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) );
			verticalSlides.forEach( function( verticalSlide, y ) {

				if( y > 0 ) {
					verticalSlide.classList.remove( 'present' );
					verticalSlide.classList.remove( 'past' );
					verticalSlide.classList.add( 'future' );
					verticalSlide.setAttribute( 'aria-hidden', 'true' );
				}

			} );

		} );

	}

	/**
	 * Sorts and formats all of fragments in the
	 * presentation.
	 */
	function sortAllFragments() {

		var horizontalSlides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );
		horizontalSlides.forEach( function( horizontalSlide ) {

			var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) );
			verticalSlides.forEach( function( verticalSlide, y ) {

				sortFragments( verticalSlide.querySelectorAll( '.fragment' ) );

			} );

			if( verticalSlides.length === 0 ) sortFragments( horizontalSlide.querySelectorAll( '.fragment' ) );

		} );

	}

	/**
	 * Randomly shuffles all slides in the deck.
	 */
	function shuffle() {

		var slides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );

		slides.forEach( function( slide ) {

			// Insert this slide next to another random slide. This may
			// cause the slide to insert before itself but that's fine.
			dom.slides.insertBefore( slide, slides[ Math.floor( Math.random() * slides.length ) ] );

		} );

	}

	/**
	 * Updates one dimension of slides by showing the slide
	 * with the specified index.
	 *
	 * @param {string} selector A CSS selector that will fetch
	 * the group of slides we are working with
	 * @param {number} index The index of the slide that should be
	 * shown
	 *
	 * @return {number} The index of the slide that is now shown,
	 * might differ from the passed in index if it was out of
	 * bounds.
	 */
	function updateSlides( selector, index ) {

		// Select all slides and convert the NodeList result to
		// an array
		var slides = toArray( dom.wrapper.querySelectorAll( selector ) ),
			slidesLength = slides.length;

		var printMode = isPrintingPDF();

		if( slidesLength ) {

			// Should the index loop?
			if( config.loop ) {
				index %= slidesLength;

				if( index < 0 ) {
					index = slidesLength + index;
				}
			}

			// Enforce max and minimum index bounds
			index = Math.max( Math.min( index, slidesLength - 1 ), 0 );

			for( var i = 0; i < slidesLength; i++ ) {
				var element = slides[i];

				var reverse = config.rtl && !isVerticalSlide( element );

				element.classList.remove( 'past' );
				element.classList.remove( 'present' );
				element.classList.remove( 'future' );

				// http://www.w3.org/html/wg/drafts/html/master/editing.html#the-hidden-attribute
				element.setAttribute( 'hidden', '' );
				element.setAttribute( 'aria-hidden', 'true' );

				// If this element contains vertical slides
				if( element.querySelector( 'section' ) ) {
					element.classList.add( 'stack' );
				}

				// If we're printing static slides, all slides are "present"
				if( printMode ) {
					element.classList.add( 'present' );
					continue;
				}

				if( i < index ) {
					// Any element previous to index is given the 'past' class
					element.classList.add( reverse ? 'future' : 'past' );

					if( config.fragments ) {
						var pastFragments = toArray( element.querySelectorAll( '.fragment' ) );

						// Show all fragments on prior slides
						while( pastFragments.length ) {
							var pastFragment = pastFragments.pop();
							pastFragment.classList.add( 'visible' );
							pastFragment.classList.remove( 'current-fragment' );
						}
					}
				}
				else if( i > index ) {
					// Any element subsequent to index is given the 'future' class
					element.classList.add( reverse ? 'past' : 'future' );

					if( config.fragments ) {
						var futureFragments = toArray( element.querySelectorAll( '.fragment.visible' ) );

						// No fragments in future slides should be visible ahead of time
						while( futureFragments.length ) {
							var futureFragment = futureFragments.pop();
							futureFragment.classList.remove( 'visible' );
							futureFragment.classList.remove( 'current-fragment' );
						}
					}
				}
			}

			// Mark the current slide as present
			slides[index].classList.add( 'present' );
			slides[index].removeAttribute( 'hidden' );
			slides[index].removeAttribute( 'aria-hidden' );

			// If this slide has a state associated with it, add it
			// onto the current state of the deck
			var slideState = slides[index].getAttribute( 'data-state' );
			if( slideState ) {
				state = state.concat( slideState.split( ' ' ) );
			}

		}
		else {
			// Since there are no slides we can't be anywhere beyond the
			// zeroth index
			index = 0;
		}

		return index;

	}

	/**
	 * Optimization method; hide all slides that are far away
	 * from the present slide.
	 */
	function updateSlidesVisibility() {

		// Select all slides and convert the NodeList result to
		// an array
		var horizontalSlides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ),
			horizontalSlidesLength = horizontalSlides.length,
			distanceX,
			distanceY;

		if( horizontalSlidesLength && typeof indexh !== 'undefined' ) {

			// The number of steps away from the present slide that will
			// be visible
			var viewDistance = isOverview() ? 10 : config.viewDistance;

			// Limit view distance on weaker devices
			if( isMobileDevice ) {
				viewDistance = isOverview() ? 6 : 2;
			}

			// All slides need to be visible when exporting to PDF
			if( isPrintingPDF() ) {
				viewDistance = Number.MAX_VALUE;
			}

			for( var x = 0; x < horizontalSlidesLength; x++ ) {
				var horizontalSlide = horizontalSlides[x];

				var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) ),
					verticalSlidesLength = verticalSlides.length;

				// Determine how far away this slide is from the present
				distanceX = Math.abs( ( indexh || 0 ) - x ) || 0;

				// If the presentation is looped, distance should measure
				// 1 between the first and last slides
				if( config.loop ) {
					distanceX = Math.abs( ( ( indexh || 0 ) - x ) % ( horizontalSlidesLength - viewDistance ) ) || 0;
				}

				// Show the horizontal slide if it's within the view distance
				if( distanceX < viewDistance ) {
					showSlide( horizontalSlide );
				}
				else {
					hideSlide( horizontalSlide );
				}

				if( verticalSlidesLength ) {

					var oy = getPreviousVerticalIndex( horizontalSlide );

					for( var y = 0; y < verticalSlidesLength; y++ ) {
						var verticalSlide = verticalSlides[y];

						distanceY = x === ( indexh || 0 ) ? Math.abs( ( indexv || 0 ) - y ) : Math.abs( y - oy );

						if( distanceX + distanceY < viewDistance ) {
							showSlide( verticalSlide );
						}
						else {
							hideSlide( verticalSlide );
						}
					}

				}
			}

		}

	}

	/**
	 * Pick up notes from the current slide and display them
	 * to the viewer.
	 *
	 * @see {@link config.showNotes}
	 */
	function updateNotes() {

		if( config.showNotes && dom.speakerNotes && currentSlide && !isPrintingPDF() ) {

			dom.speakerNotes.innerHTML = getSlideNotes() || '';

		}

	}

	/**
	 * Updates the progress bar to reflect the current slide.
	 */
	function updateProgress() {

		// Update progress if enabled
		if( config.progress && dom.progressbar ) {

			dom.progressbar.style.width = getProgress() * dom.wrapper.offsetWidth + 'px';

		}

	}

	/**
	 * Updates the slide number div to reflect the current slide.
	 *
	 * The following slide number formats are available:
	 *  "h.v":	horizontal . vertical slide number (default)
	 *  "h/v":	horizontal / vertical slide number
	 *    "c":	flattened slide number
	 *  "c/t":	flattened slide number / total slides
	 */
	function updateSlideNumber() {

		// Update slide number if enabled
		if( config.slideNumber && dom.slideNumber ) {

			var value = [];
			var format = 'h.v';

			// Check if a custom number format is available
			if( typeof config.slideNumber === 'string' ) {
				format = config.slideNumber;
			}

			switch( format ) {
				case 'c':
					value.push( getSlidePastCount() + 1 );
					break;
				case 'c/t':
					value.push( getSlidePastCount() + 1, '/', getTotalSlides() );
					break;
				case 'h/v':
					value.push( indexh + 1 );
					if( isVerticalSlide() ) value.push( '/', indexv + 1 );
					break;
				default:
					value.push( indexh + 1 );
					if( isVerticalSlide() ) value.push( '.', indexv + 1 );
			}

			dom.slideNumber.innerHTML = formatSlideNumber( value[0], value[1], value[2] );
		}

	}

	/**
	 * Applies HTML formatting to a slide number before it's
	 * written to the DOM.
	 *
	 * @param {number} a Current slide
	 * @param {string} delimiter Character to separate slide numbers
	 * @param {(number|*)} b Total slides
	 * @return {string} HTML string fragment
	 */
	function formatSlideNumber( a, delimiter, b ) {

		if( typeof b === 'number' && !isNaN( b ) ) {
			return  '<span class="slide-number-a">'+ a +'</span>' +
					'<span class="slide-number-delimiter">'+ delimiter +'</span>' +
					'<span class="slide-number-b">'+ b +'</span>';
		}
		else {
			return '<span class="slide-number-a">'+ a +'</span>';
		}

	}

	/**
	 * Updates the state of all control/navigation arrows.
	 */
	function updateControls() {

		var routes = availableRoutes();
		var fragments = availableFragments();

		// Remove the 'enabled' class from all directions
		dom.controlsLeft.concat( dom.controlsRight )
						.concat( dom.controlsUp )
						.concat( dom.controlsDown )
						.concat( dom.controlsPrev )
						.concat( dom.controlsNext ).forEach( function( node ) {
			node.classList.remove( 'enabled' );
			node.classList.remove( 'fragmented' );

			// Set 'disabled' attribute on all directions
			node.setAttribute( 'disabled', 'disabled' );
		} );

		// Add the 'enabled' class to the available routes; remove 'disabled' attribute to enable buttons
		if( routes.left ) dom.controlsLeft.forEach( function( el ) { el.classList.add( 'enabled' ); el.removeAttribute( 'disabled' ); } );
		if( routes.right ) dom.controlsRight.forEach( function( el ) { el.classList.add( 'enabled' ); el.removeAttribute( 'disabled' ); } );
		if( routes.up ) dom.controlsUp.forEach( function( el ) { el.classList.add( 'enabled' ); el.removeAttribute( 'disabled' ); } );
		if( routes.down ) dom.controlsDown.forEach( function( el ) { el.classList.add( 'enabled' ); el.removeAttribute( 'disabled' ); } );

		// Prev/next buttons
		if( routes.left || routes.up ) dom.controlsPrev.forEach( function( el ) { el.classList.add( 'enabled' ); el.removeAttribute( 'disabled' ); } );
		if( routes.right || routes.down ) dom.controlsNext.forEach( function( el ) { el.classList.add( 'enabled' ); el.removeAttribute( 'disabled' ); } );

		// Highlight fragment directions
		if( currentSlide ) {

			// Always apply fragment decorator to prev/next buttons
			if( fragments.prev ) dom.controlsPrev.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); el.removeAttribute( 'disabled' ); } );
			if( fragments.next ) dom.controlsNext.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); el.removeAttribute( 'disabled' ); } );

			// Apply fragment decorators to directional buttons based on
			// what slide axis they are in
			if( isVerticalSlide( currentSlide ) ) {
				if( fragments.prev ) dom.controlsUp.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); el.removeAttribute( 'disabled' ); } );
				if( fragments.next ) dom.controlsDown.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); el.removeAttribute( 'disabled' ); } );
			}
			else {
				if( fragments.prev ) dom.controlsLeft.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); el.removeAttribute( 'disabled' ); } );
				if( fragments.next ) dom.controlsRight.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); el.removeAttribute( 'disabled' ); } );
			}

		}

	}

	/**
	 * Updates the background elements to reflect the current
	 * slide.
	 *
	 * @param {boolean} includeAll If true, the backgrounds of
	 * all vertical slides (not just the present) will be updated.
	 */
	function updateBackground( includeAll ) {

		var currentBackground = null;

		// Reverse past/future classes when in RTL mode
		var horizontalPast = config.rtl ? 'future' : 'past',
			horizontalFuture = config.rtl ? 'past' : 'future';

		// Update the classes of all backgrounds to match the
		// states of their slides (past/present/future)
		toArray( dom.background.childNodes ).forEach( function( backgroundh, h ) {

			backgroundh.classList.remove( 'past' );
			backgroundh.classList.remove( 'present' );
			backgroundh.classList.remove( 'future' );

			if( h < indexh ) {
				backgroundh.classList.add( horizontalPast );
			}
			else if ( h > indexh ) {
				backgroundh.classList.add( horizontalFuture );
			}
			else {
				backgroundh.classList.add( 'present' );

				// Store a reference to the current background element
				currentBackground = backgroundh;
			}

			if( includeAll || h === indexh ) {
				toArray( backgroundh.querySelectorAll( '.slide-background' ) ).forEach( function( backgroundv, v ) {

					backgroundv.classList.remove( 'past' );
					backgroundv.classList.remove( 'present' );
					backgroundv.classList.remove( 'future' );

					if( v < indexv ) {
						backgroundv.classList.add( 'past' );
					}
					else if ( v > indexv ) {
						backgroundv.classList.add( 'future' );
					}
					else {
						backgroundv.classList.add( 'present' );

						// Only if this is the present horizontal and vertical slide
						if( h === indexh ) currentBackground = backgroundv;
					}

				} );
			}

		} );

		// Stop content inside of previous backgrounds
		if( previousBackground ) {

			stopEmbeddedContent( previousBackground );

		}

		// Start content in the current background
		if( currentBackground ) {

			startEmbeddedContent( currentBackground );

			var backgroundImageURL = currentBackground.style.backgroundImage || '';

			// Restart GIFs (doesn't work in Firefox)
			if( /\.gif/i.test( backgroundImageURL ) ) {
				currentBackground.style.backgroundImage = '';
				window.getComputedStyle( currentBackground ).opacity;
				currentBackground.style.backgroundImage = backgroundImageURL;
			}

			// Don't transition between identical backgrounds. This
			// prevents unwanted flicker.
			var previousBackgroundHash = previousBackground ? previousBackground.getAttribute( 'data-background-hash' ) : null;
			var currentBackgroundHash = currentBackground.getAttribute( 'data-background-hash' );
			if( currentBackgroundHash && currentBackgroundHash === previousBackgroundHash && currentBackground !== previousBackground ) {
				dom.background.classList.add( 'no-transition' );
			}

			previousBackground = currentBackground;

		}

		// If there's a background brightness flag for this slide,
		// bubble it to the .reveal container
		if( currentSlide ) {
			[ 'has-light-background', 'has-dark-background' ].forEach( function( classToBubble ) {
				if( currentSlide.classList.contains( classToBubble ) ) {
					dom.wrapper.classList.add( classToBubble );
				}
				else {
					dom.wrapper.classList.remove( classToBubble );
				}
			} );
		}

		// Allow the first background to apply without transition
		setTimeout( function() {
			dom.background.classList.remove( 'no-transition' );
		}, 1 );

	}

	/**
	 * Updates the position of the parallax background based
	 * on the current slide index.
	 */
	function updateParallax() {

		if( config.parallaxBackgroundImage ) {

			var horizontalSlides = dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ),
				verticalSlides = dom.wrapper.querySelectorAll( VERTICAL_SLIDES_SELECTOR );

			var backgroundSize = dom.background.style.backgroundSize.split( ' ' ),
				backgroundWidth, backgroundHeight;

			if( backgroundSize.length === 1 ) {
				backgroundWidth = backgroundHeight = parseInt( backgroundSize[0], 10 );
			}
			else {
				backgroundWidth = parseInt( backgroundSize[0], 10 );
				backgroundHeight = parseInt( backgroundSize[1], 10 );
			}

			var slideWidth = dom.background.offsetWidth,
				horizontalSlideCount = horizontalSlides.length,
				horizontalOffsetMultiplier,
				horizontalOffset;

			if( typeof config.parallaxBackgroundHorizontal === 'number' ) {
				horizontalOffsetMultiplier = config.parallaxBackgroundHorizontal;
			}
			else {
				horizontalOffsetMultiplier = horizontalSlideCount > 1 ? ( backgroundWidth - slideWidth ) / ( horizontalSlideCount-1 ) : 0;
			}

			horizontalOffset = horizontalOffsetMultiplier * indexh * -1;

			var slideHeight = dom.background.offsetHeight,
				verticalSlideCount = verticalSlides.length,
				verticalOffsetMultiplier,
				verticalOffset;

			if( typeof config.parallaxBackgroundVertical === 'number' ) {
				verticalOffsetMultiplier = config.parallaxBackgroundVertical;
			}
			else {
				verticalOffsetMultiplier = ( backgroundHeight - slideHeight ) / ( verticalSlideCount-1 );
			}

			verticalOffset = verticalSlideCount > 0 ?  verticalOffsetMultiplier * indexv : 0;

			dom.background.style.backgroundPosition = horizontalOffset + 'px ' + -verticalOffset + 'px';

		}

	}

	/**
	 * Called when the given slide is within the configured view
	 * distance. Shows the slide element and loads any content
	 * that is set to load lazily (data-src).
	 *
	 * @param {HTMLElement} slide Slide to show
	 */
	/**
	 * Called when the given slide is within the configured view
	 * distance. Shows the slide element and loads any content
	 * that is set to load lazily (data-src).
	 *
	 * @param {HTMLElement} slide Slide to show
	 */
	function showSlide( slide ) {

		// Show the slide element
		slide.style.display = config.display;

		// Media elements with data-src attributes
		toArray( slide.querySelectorAll( 'img[data-src], video[data-src], audio[data-src]' ) ).forEach( function( element ) {
			element.setAttribute( 'src', element.getAttribute( 'data-src' ) );
			element.removeAttribute( 'data-src' );
		} );

		// Media elements with <source> children
		toArray( slide.querySelectorAll( 'video, audio' ) ).forEach( function( media ) {
			var sources = 0;

			toArray( media.querySelectorAll( 'source[data-src]' ) ).forEach( function( source ) {
				source.setAttribute( 'src', source.getAttribute( 'data-src' ) );
				source.removeAttribute( 'data-src' );
				sources += 1;
			} );

			// If we rewrote sources for this video/audio element, we need
			// to manually tell it to load from its new origin
			if( sources > 0 ) {
				media.load();
			}
		} );


		// Show the corresponding background element
		var indices = getIndices( slide );
		var background = getSlideBackground( indices.h, indices.v );
		if( background ) {
			background.style.display = 'block';

			// If the background contains media, load it
			if( background.hasAttribute( 'data-loaded' ) === false ) {
				background.setAttribute( 'data-loaded', 'true' );

				var backgroundImage = slide.getAttribute( 'data-background-image' ),
					backgroundVideo = slide.getAttribute( 'data-background-video' ),
					backgroundVideoLoop = slide.hasAttribute( 'data-background-video-loop' ),
					backgroundVideoMuted = slide.hasAttribute( 'data-background-video-muted' ),
					backgroundIframe = slide.getAttribute( 'data-background-iframe' );

				// Images
				if( backgroundImage ) {
					background.style.backgroundImage = 'url('+ backgroundImage +')';
				}
				// Videos
				else if ( backgroundVideo && !isSpeakerNotes() ) {
					var video = document.createElement( 'video' );

					if( backgroundVideoLoop ) {
						video.setAttribute( 'loop', '' );
					}

					if( backgroundVideoMuted ) {
						video.muted = true;
					}

					// Inline video playback works (at least in Mobile Safari) as
					// long as the video is muted and the `playsinline` attribute is
					// present
					if( isMobileDevice ) {
						video.muted = true;
						video.autoplay = true;
						video.setAttribute( 'playsinline', '' );
					}

					// Support comma separated lists of video sources
					backgroundVideo.split( ',' ).forEach( function( source ) {
						video.innerHTML += '<source src="'+ source +'">';
					} );

					background.appendChild( video );
				}
				// Iframes
				else if( backgroundIframe ) {
					var iframe = document.createElement( 'iframe' );
					iframe.setAttribute( 'allowfullscreen', '' );
					iframe.setAttribute( 'mozallowfullscreen', '' );
					iframe.setAttribute( 'webkitallowfullscreen', '' );

					// Only load autoplaying content when the slide is shown to
					// avoid having it play in the background
					if( /autoplay=(1|true|yes)/gi.test( backgroundIframe ) ) {
						iframe.setAttribute( 'data-src', backgroundIframe );
					}
					else {
						iframe.setAttribute( 'src', backgroundIframe );
					}

					iframe.style.width  = '100%';
					iframe.style.height = '100%';
					iframe.style.maxHeight = '100%';
					iframe.style.maxWidth = '100%';

					background.appendChild( iframe );
				}
			}

		}

	}

	/**
	 * Called when the given slide is moved outside of the
	 * configured view distance.
	 *
	 * @param {HTMLElement} slide
	 */
	function hideSlide( slide ) {

		// Hide the slide element
		slide.style.display = 'none';

		// Hide the corresponding background element
		var indices = getIndices( slide );
		var background = getSlideBackground( indices.h, indices.v );
		if( background ) {
			background.style.display = 'none';
		}

	}

	/**
	 * Determine what available routes there are for navigation.
	 *
	 * @return {{left: boolean, right: boolean, up: boolean, down: boolean}}
	 */
	function availableRoutes() {

		var horizontalSlides = dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ),
			verticalSlides = dom.wrapper.querySelectorAll( VERTICAL_SLIDES_SELECTOR );

		var routes = {
			left: indexh > 0 || config.loop,
			right: indexh < horizontalSlides.length - 1 || config.loop,
			up: indexv > 0,
			down: indexv < verticalSlides.length - 1
		};

		// reverse horizontal controls for rtl
		if( config.rtl ) {
			var left = routes.left;
			routes.left = routes.right;
			routes.right = left;
		}

		return routes;

	}

	/**
	 * Returns an object describing the available fragment
	 * directions.
	 *
	 * @return {{prev: boolean, next: boolean}}
	 */
	function availableFragments() {

		if( currentSlide && config.fragments ) {
			var fragments = currentSlide.querySelectorAll( '.fragment' );
			var hiddenFragments = currentSlide.querySelectorAll( '.fragment:not(.visible)' );

			return {
				prev: fragments.length - hiddenFragments.length > 0,
				next: !!hiddenFragments.length
			};
		}
		else {
			return { prev: false, next: false };
		}

	}

	/**
	 * Enforces origin-specific format rules for embedded media.
	 */
	function formatEmbeddedContent() {

		var _appendParamToIframeSource = function( sourceAttribute, sourceURL, param ) {
			toArray( dom.slides.querySelectorAll( 'iframe['+ sourceAttribute +'*="'+ sourceURL +'"]' ) ).forEach( function( el ) {
				var src = el.getAttribute( sourceAttribute );
				if( src && src.indexOf( param ) === -1 ) {
					el.setAttribute( sourceAttribute, src + ( !/\?/.test( src ) ? '?' : '&' ) + param );
				}
			});
		};

		// YouTube frames must include "?enablejsapi=1"
		_appendParamToIframeSource( 'src', 'youtube.com/embed/', 'enablejsapi=1' );
		_appendParamToIframeSource( 'data-src', 'youtube.com/embed/', 'enablejsapi=1' );

		// Vimeo frames must include "?api=1"
		_appendParamToIframeSource( 'src', 'player.vimeo.com/', 'api=1' );
		_appendParamToIframeSource( 'data-src', 'player.vimeo.com/', 'api=1' );

	}

	/**
	 * Start playback of any embedded content inside of
	 * the given element.
	 *
	 * @param {HTMLElement} element
	 */
	function startEmbeddedContent( element ) {

		if( element && !isSpeakerNotes() ) {

			// Restart GIFs
			toArray( element.querySelectorAll( 'img[src$=".gif"]' ) ).forEach( function( el ) {
				// Setting the same unchanged source like this was confirmed
				// to work in Chrome, FF & Safari
				el.setAttribute( 'src', el.getAttribute( 'src' ) );
			} );

			// HTML5 media elements
			toArray( element.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
				if( closestParent( el, '.fragment' ) && !closestParent( el, '.fragment.visible' ) ) {
					return;
				}

				// Prefer an explicit global autoplay setting
				var autoplay = config.autoPlayMedia;

				// If no global setting is available, fall back on the element's
				// own autoplay setting
				if( typeof autoplay !== 'boolean' ) {
					autoplay = el.hasAttribute( 'data-autoplay' ) || !!closestParent( el, '.slide-background' );
				}

				if( autoplay && typeof el.play === 'function' ) {

					if( el.readyState > 1 ) {
						startEmbeddedMedia( { target: el } );
					}
					else {
						el.removeEventListener( 'loadeddata', startEmbeddedMedia ); // remove first to avoid dupes
						el.addEventListener( 'loadeddata', startEmbeddedMedia );
					}

				}
			} );

			// Normal iframes
			toArray( element.querySelectorAll( 'iframe[src]' ) ).forEach( function( el ) {
				if( closestParent( el, '.fragment' ) && !closestParent( el, '.fragment.visible' ) ) {
					return;
				}

				startEmbeddedIframe( { target: el } );
			} );

			// Lazy loading iframes
			toArray( element.querySelectorAll( 'iframe[data-src]' ) ).forEach( function( el ) {
				if( closestParent( el, '.fragment' ) && !closestParent( el, '.fragment.visible' ) ) {
					return;
				}

				if( el.getAttribute( 'src' ) !== el.getAttribute( 'data-src' ) ) {
					el.removeEventListener( 'load', startEmbeddedIframe ); // remove first to avoid dupes
					el.addEventListener( 'load', startEmbeddedIframe );
					el.setAttribute( 'src', el.getAttribute( 'data-src' ) );
				}
			} );

		}

	}

	/**
	 * Starts playing an embedded video/audio element after
	 * it has finished loading.
	 *
	 * @param {object} event
	 */
	function startEmbeddedMedia( event ) {

		var isAttachedToDOM = !!closestParent( event.target, 'html' ),
			isVisible  		= !!closestParent( event.target, '.present' );

		if( isAttachedToDOM && isVisible ) {
			event.target.currentTime = 0;
			event.target.play();
		}

		event.target.removeEventListener( 'loadeddata', startEmbeddedMedia );

	}

	/**
	 * "Starts" the content of an embedded iframe using the
	 * postMessage API.
	 *
	 * @param {object} event
	 */
	function startEmbeddedIframe( event ) {

		var iframe = event.target;

		if( iframe && iframe.contentWindow ) {

			var isAttachedToDOM = !!closestParent( event.target, 'html' ),
				isVisible  		= !!closestParent( event.target, '.present' );

			if( isAttachedToDOM && isVisible ) {

				// Prefer an explicit global autoplay setting
				var autoplay = config.autoPlayMedia;

				// If no global setting is available, fall back on the element's
				// own autoplay setting
				if( typeof autoplay !== 'boolean' ) {
					autoplay = iframe.hasAttribute( 'data-autoplay' ) || !!closestParent( iframe, '.slide-background' );
				}

				// YouTube postMessage API
				if( /youtube\.com\/embed\//.test( iframe.getAttribute( 'src' ) ) && autoplay ) {
					iframe.contentWindow.postMessage( '{"event":"command","func":"playVideo","args":""}', '*' );
				}
				// Vimeo postMessage API
				else if( /player\.vimeo\.com\//.test( iframe.getAttribute( 'src' ) ) && autoplay ) {
					iframe.contentWindow.postMessage( '{"method":"play"}', '*' );
				}
				// Generic postMessage API
				else {
					iframe.contentWindow.postMessage( 'slide:start', '*' );
				}

			}

		}

	}

	/**
	 * Stop playback of any embedded content inside of
	 * the targeted slide.
	 *
	 * @param {HTMLElement} element
	 */
	function stopEmbeddedContent( element ) {

		if( element && element.parentNode ) {
			// HTML5 media elements
			toArray( element.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
				if( !el.hasAttribute( 'data-ignore' ) && typeof el.pause === 'function' ) {
					el.setAttribute('data-paused-by-reveal', '');
					el.pause();
				}
			} );

			// Generic postMessage API for non-lazy loaded iframes
			toArray( element.querySelectorAll( 'iframe' ) ).forEach( function( el ) {
				if( el.contentWindow ) el.contentWindow.postMessage( 'slide:stop', '*' );
				el.removeEventListener( 'load', startEmbeddedIframe );
			});

			// YouTube postMessage API
			toArray( element.querySelectorAll( 'iframe[src*="youtube.com/embed/"]' ) ).forEach( function( el ) {
				if( !el.hasAttribute( 'data-ignore' ) && el.contentWindow && typeof el.contentWindow.postMessage === 'function' ) {
					el.contentWindow.postMessage( '{"event":"command","func":"pauseVideo","args":""}', '*' );
				}
			});

			// Vimeo postMessage API
			toArray( element.querySelectorAll( 'iframe[src*="player.vimeo.com/"]' ) ).forEach( function( el ) {
				if( !el.hasAttribute( 'data-ignore' ) && el.contentWindow && typeof el.contentWindow.postMessage === 'function' ) {
					el.contentWindow.postMessage( '{"method":"pause"}', '*' );
				}
			});

			// Lazy loading iframes
			toArray( element.querySelectorAll( 'iframe[data-src]' ) ).forEach( function( el ) {
				// Only removing the src doesn't actually unload the frame
				// in all browsers (Firefox) so we set it to blank first
				el.setAttribute( 'src', 'about:blank' );
				el.removeAttribute( 'src' );
			} );
		}

	}

	/**
	 * Returns the number of past slides. This can be used as a global
	 * flattened index for slides.
	 *
	 * @return {number} Past slide count
	 */
	function getSlidePastCount() {

		var horizontalSlides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );

		// The number of past slides
		var pastCount = 0;

		// Step through all slides and count the past ones
		mainLoop: for( var i = 0; i < horizontalSlides.length; i++ ) {

			var horizontalSlide = horizontalSlides[i];
			var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) );

			for( var j = 0; j < verticalSlides.length; j++ ) {

				// Stop as soon as we arrive at the present
				if( verticalSlides[j].classList.contains( 'present' ) ) {
					break mainLoop;
				}

				pastCount++;

			}

			// Stop as soon as we arrive at the present
			if( horizontalSlide.classList.contains( 'present' ) ) {
				break;
			}

			// Don't count the wrapping section for vertical slides
			if( horizontalSlide.classList.contains( 'stack' ) === false ) {
				pastCount++;
			}

		}

		return pastCount;

	}

	/**
	 * Returns a value ranging from 0-1 that represents
	 * how far into the presentation we have navigated.
	 *
	 * @return {number}
	 */
	function getProgress() {

		// The number of past and total slides
		var totalCount = getTotalSlides();
		var pastCount = getSlidePastCount();

		if( currentSlide ) {

			var allFragments = currentSlide.querySelectorAll( '.fragment' );

			// If there are fragments in the current slide those should be
			// accounted for in the progress.
			if( allFragments.length > 0 ) {
				var visibleFragments = currentSlide.querySelectorAll( '.fragment.visible' );

				// This value represents how big a portion of the slide progress
				// that is made up by its fragments (0-1)
				var fragmentWeight = 0.9;

				// Add fragment progress to the past slide count
				pastCount += ( visibleFragments.length / allFragments.length ) * fragmentWeight;
			}

		}

		return pastCount / ( totalCount - 1 );

	}

	/**
	 * Checks if this presentation is running inside of the
	 * speaker notes window.
	 *
	 * @return {boolean}
	 */
	function isSpeakerNotes() {

		return !!window.location.search.match( /receiver/gi );

	}

	/**
	 * Reads the current URL (hash) and navigates accordingly.
	 */
	function readURL() {

		var hash = window.location.hash;

		// Attempt to parse the hash as either an index or name
		var bits = hash.slice( 2 ).split( '/' ),
			name = hash.replace( /#|\//gi, '' );

		// If the first bit is invalid and there is a name we can
		// assume that this is a named link
		if( isNaN( parseInt( bits[0], 10 ) ) && name.length ) {
			var element;

			// Ensure the named link is a valid HTML ID attribute
			if( /^[a-zA-Z][\w:.-]*$/.test( name ) ) {
				// Find the slide with the specified ID
				element = document.getElementById( name );
			}

			if( element ) {
				// Find the position of the named slide and navigate to it
				var indices = Reveal.getIndices( element );
				slide( indices.h, indices.v );
			}
			// If the slide doesn't exist, navigate to the current slide
			else {
				slide( indexh || 0, indexv || 0 );
			}
		}
		else {
			// Read the index components of the hash
			var h = parseInt( bits[0], 10 ) || 0,
				v = parseInt( bits[1], 10 ) || 0;

			if( h !== indexh || v !== indexv ) {
				slide( h, v );
			}
		}

	}

	/**
	 * Updates the page URL (hash) to reflect the current
	 * state.
	 *
	 * @param {number} delay The time in ms to wait before
	 * writing the hash
	 */
	function writeURL( delay ) {

		if( config.history ) {

			// Make sure there's never more than one timeout running
			clearTimeout( writeURLTimeout );

			// If a delay is specified, timeout this call
			if( typeof delay === 'number' ) {
				writeURLTimeout = setTimeout( writeURL, delay );
			}
			else if( currentSlide ) {
				var url = '/';

				// Attempt to create a named link based on the slide's ID
				var id = currentSlide.getAttribute( 'id' );
				if( id ) {
					id = id.replace( /[^a-zA-Z0-9\-\_\:\.]/g, '' );
				}

				// If the current slide has an ID, use that as a named link
				if( typeof id === 'string' && id.length ) {
					url = '/' + id;
				}
				// Otherwise use the /h/v index
				else {
					if( indexh > 0 || indexv > 0 ) url += indexh;
					if( indexv > 0 ) url += '/' + indexv;
				}

				window.location.hash = url;
			}
		}

	}
	/**
	 * Retrieves the h/v location and fragment of the current,
	 * or specified, slide.
	 *
	 * @param {HTMLElement} [slide] If specified, the returned
	 * index will be for this slide rather than the currently
	 * active one
	 *
	 * @return {{h: number, v: number, f: number}}
	 */
	function getIndices( slide ) {

		// By default, return the current indices
		var h = indexh,
			v = indexv,
			f;

		// If a slide is specified, return the indices of that slide
		if( slide ) {
			var isVertical = isVerticalSlide( slide );
			var slideh = isVertical ? slide.parentNode : slide;

			// Select all horizontal slides
			var horizontalSlides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );

			// Now that we know which the horizontal slide is, get its index
			h = Math.max( horizontalSlides.indexOf( slideh ), 0 );

			// Assume we're not vertical
			v = undefined;

			// If this is a vertical slide, grab the vertical index
			if( isVertical ) {
				v = Math.max( toArray( slide.parentNode.querySelectorAll( 'section' ) ).indexOf( slide ), 0 );
			}
		}

		if( !slide && currentSlide ) {
			var hasFragments = currentSlide.querySelectorAll( '.fragment' ).length > 0;
			if( hasFragments ) {
				var currentFragment = currentSlide.querySelector( '.current-fragment' );
				if( currentFragment && currentFragment.hasAttribute( 'data-fragment-index' ) ) {
					f = parseInt( currentFragment.getAttribute( 'data-fragment-index' ), 10 );
				}
				else {
					f = currentSlide.querySelectorAll( '.fragment.visible' ).length - 1;
				}
			}
		}

		return { h: h, v: v, f: f };

	}

	/**
	 * Retrieves all slides in this presentation.
	 */
	function getSlides() {

		return toArray( dom.wrapper.querySelectorAll( SLIDES_SELECTOR + ':not(.stack)' ));

	}

	/**
	 * Retrieves the total number of slides in this presentation.
	 *
	 * @return {number}
	 */
	function getTotalSlides() {

		return getSlides().length;

	}

	/**
	 * Returns the slide element matching the specified index.
	 *
	 * @return {HTMLElement}
	 */
	function getSlide( x, y ) {

		var horizontalSlide = dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR )[ x ];
		var verticalSlides = horizontalSlide && horizontalSlide.querySelectorAll( 'section' );

		if( verticalSlides && verticalSlides.length && typeof y === 'number' ) {
			return verticalSlides ? verticalSlides[ y ] : undefined;
		}

		return horizontalSlide;

	}

	/**
	 * Returns the background element for the given slide.
	 * All slides, even the ones with no background properties
	 * defined, have a background element so as long as the
	 * index is valid an element will be returned.
	 *
	 * @param {number} x Horizontal background index
	 * @param {number} y Vertical background index
	 * @return {(HTMLElement[]|*)}
	 */
	function getSlideBackground( x, y ) {

		// When printing to PDF the slide backgrounds are nested
		// inside of the slides
		if( isPrintingPDF() ) {
			var slide = getSlide( x, y );
			if( slide ) {
				return slide.slideBackgroundElement;
			}

			return undefined;
		}

		var horizontalBackground = dom.wrapper.querySelectorAll( '.backgrounds>.slide-background' )[ x ];
		var verticalBackgrounds = horizontalBackground && horizontalBackground.querySelectorAll( '.slide-background' );

		if( verticalBackgrounds && verticalBackgrounds.length && typeof y === 'number' ) {
			return verticalBackgrounds ? verticalBackgrounds[ y ] : undefined;
		}

		return horizontalBackground;

	}

	/**
	 * Retrieves the speaker notes from a slide. Notes can be
	 * defined in two ways:
	 * 1. As a data-notes attribute on the slide <section>
	 * 2. As an <aside class="notes"> inside of the slide
	 *
	 * @param {HTMLElement} [slide=currentSlide]
	 * @return {(string|null)}
	 */
	function getSlideNotes( slide ) {

		// Default to the current slide
		slide = slide || currentSlide;

		// Notes can be specified via the data-notes attribute...
		if( slide.hasAttribute( 'data-notes' ) ) {
			return slide.getAttribute( 'data-notes' );
		}

		// ... or using an <aside class="notes"> element
		var notesElement = slide.querySelector( 'aside.notes' );
		if( notesElement ) {
			return notesElement.innerHTML;
		}

		return null;

	}

	/**
	 * Retrieves the current state of the presentation as
	 * an object. This state can then be restored at any
	 * time.
	 *
	 * @return {{indexh: number, indexv: number, indexf: number, paused: boolean, overview: boolean}}
	 */
	function getState() {

		var indices = getIndices();

		return {
			indexh: indices.h,
			indexv: indices.v,
			indexf: indices.f,
			paused: isPaused(),
			overview: isOverview()
		};

	}

	/**
	 * Restores the presentation to the given state.
	 *
	 * @param {object} state As generated by getState()
	 * @see {@link getState} generates the parameter `state`
	 */
	function setState( state ) {

		if( typeof state === 'object' ) {
			slide( deserialize( state.indexh ), deserialize( state.indexv ), deserialize( state.indexf ) );

			var pausedFlag = deserialize( state.paused ),
				overviewFlag = deserialize( state.overview );

			if( typeof pausedFlag === 'boolean' && pausedFlag !== isPaused() ) {
				togglePause( pausedFlag );
			}

			if( typeof overviewFlag === 'boolean' && overviewFlag !== isOverview() ) {
				toggleOverview( overviewFlag );
			}
		}

	}

	/**
	 * Return a sorted fragments list, ordered by an increasing
	 * "data-fragment-index" attribute.
	 *
	 * Fragments will be revealed in the order that they are returned by
	 * this function, so you can use the index attributes to control the
	 * order of fragment appearance.
	 *
	 * To maintain a sensible default fragment order, fragments are presumed
	 * to be passed in document order. This function adds a "fragment-index"
	 * attribute to each node if such an attribute is not already present,
	 * and sets that attribute to an integer value which is the position of
	 * the fragment within the fragments list.
	 *
	 * @param {object[]|*} fragments
	 * @return {object[]} sorted Sorted array of fragments
	 */
	function sortFragments( fragments ) {

		fragments = toArray( fragments );

		var ordered = [],
			unordered = [],
			sorted = [];

		// Group ordered and unordered elements
		fragments.forEach( function( fragment, i ) {
			if( fragment.hasAttribute( 'data-fragment-index' ) ) {
				var index = parseInt( fragment.getAttribute( 'data-fragment-index' ), 10 );

				if( !ordered[index] ) {
					ordered[index] = [];
				}

				ordered[index].push( fragment );
			}
			else {
				unordered.push( [ fragment ] );
			}
		} );

		// Append fragments without explicit indices in their
		// DOM order
		ordered = ordered.concat( unordered );

		// Manually count the index up per group to ensure there
		// are no gaps
		var index = 0;

		// Push all fragments in their sorted order to an array,
		// this flattens the groups
		ordered.forEach( function( group ) {
			group.forEach( function( fragment ) {
				sorted.push( fragment );
				fragment.setAttribute( 'data-fragment-index', index );
			} );

			index ++;
		} );

		return sorted;

	}

	/**
	 * Navigate to the specified slide fragment.
	 *
	 * @param {?number} index The index of the fragment that
	 * should be shown, -1 means all are invisible
	 * @param {number} offset Integer offset to apply to the
	 * fragment index
	 *
	 * @return {boolean} true if a change was made in any
	 * fragments visibility as part of this call
	 */
	function navigateFragment( index, offset ) {

		if( currentSlide && config.fragments ) {

			var fragments = sortFragments( currentSlide.querySelectorAll( '.fragment' ) );
			if( fragments.length ) {

				// If no index is specified, find the current
				if( typeof index !== 'number' ) {
					var lastVisibleFragment = sortFragments( currentSlide.querySelectorAll( '.fragment.visible' ) ).pop();

					if( lastVisibleFragment ) {
						index = parseInt( lastVisibleFragment.getAttribute( 'data-fragment-index' ) || 0, 10 );
					}
					else {
						index = -1;
					}
				}

				// If an offset is specified, apply it to the index
				if( typeof offset === 'number' ) {
					index += offset;
				}

				var fragmentsShown = [],
					fragmentsHidden = [];

				toArray( fragments ).forEach( function( element, i ) {

					if( element.hasAttribute( 'data-fragment-index' ) ) {
						i = parseInt( element.getAttribute( 'data-fragment-index' ), 10 );
					}

					// Visible fragments
					if( i <= index ) {
						if( !element.classList.contains( 'visible' ) ) fragmentsShown.push( element );
						element.classList.add( 'visible' );
						element.classList.remove( 'current-fragment' );

						// Announce the fragments one by one to the Screen Reader
						dom.statusDiv.textContent = getStatusText( element );

						if( i === index ) {
							element.classList.add( 'current-fragment' );
							startEmbeddedContent( element );
						}
					}
					// Hidden fragments
					else {
						if( element.classList.contains( 'visible' ) ) fragmentsHidden.push( element );
						element.classList.remove( 'visible' );
						element.classList.remove( 'current-fragment' );
					}

				} );

				if( fragmentsHidden.length ) {
					dispatchEvent( 'fragmenthidden', { fragment: fragmentsHidden[0], fragments: fragmentsHidden } );
				}

				if( fragmentsShown.length ) {
					dispatchEvent( 'fragmentshown', { fragment: fragmentsShown[0], fragments: fragmentsShown } );
				}

				updateControls();
				updateProgress();

				return !!( fragmentsShown.length || fragmentsHidden.length );

			}

		}

		return false;

	}

	/**
	 * Navigate to the next slide fragment.
	 *
	 * @return {boolean} true if there was a next fragment,
	 * false otherwise
	 */
	function nextFragment() {

		return navigateFragment( null, 1 );

	}

	/**
	 * Navigate to the previous slide fragment.
	 *
	 * @return {boolean} true if there was a previous fragment,
	 * false otherwise
	 */
	function previousFragment() {

		return navigateFragment( null, -1 );

	}

	/**
	 * Cues a new automated slide if enabled in the config.
	 */
	function cueAutoSlide() {

		cancelAutoSlide();

		if( currentSlide ) {

			var fragment = currentSlide.querySelector( '.current-fragment' );

			// When the slide first appears there is no "current" fragment so
			// we look for a data-autoslide timing on the first fragment
			if( !fragment ) fragment = currentSlide.querySelector( '.fragment' );

			var fragmentAutoSlide = fragment ? fragment.getAttribute( 'data-autoslide' ) : null;
			var parentAutoSlide = currentSlide.parentNode ? currentSlide.parentNode.getAttribute( 'data-autoslide' ) : null;
			var slideAutoSlide = currentSlide.getAttribute( 'data-autoslide' );

			// Pick value in the following priority order:
			// 1. Current fragment's data-autoslide
			// 2. Current slide's data-autoslide
			// 3. Parent slide's data-autoslide
			// 4. Global autoSlide setting
			if( fragmentAutoSlide ) {
				autoSlide = parseInt( fragmentAutoSlide, 10 );
			}
			else if( slideAutoSlide ) {
				autoSlide = parseInt( slideAutoSlide, 10 );
			}
			else if( parentAutoSlide ) {
				autoSlide = parseInt( parentAutoSlide, 10 );
			}
			else {
				autoSlide = config.autoSlide;
			}

			// If there are media elements with data-autoplay,
			// automatically set the autoSlide duration to the
			// length of that media. Not applicable if the slide
			// is divided up into fragments.
			// playbackRate is accounted for in the duration.
			if( currentSlide.querySelectorAll( '.fragment' ).length === 0 ) {
				toArray( currentSlide.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
					if( el.hasAttribute( 'data-autoplay' ) ) {
						if( autoSlide && (el.duration * 1000 / el.playbackRate ) > autoSlide ) {
							autoSlide = ( el.duration * 1000 / el.playbackRate ) + 1000;
						}
					}
				} );
			}

			// Cue the next auto-slide if:
			// - There is an autoSlide value
			// - Auto-sliding isn't paused by the user
			// - The presentation isn't paused
			// - The overview isn't active
			// - The presentation isn't over
			if( autoSlide && !autoSlidePaused && !isPaused() && !isOverview() && ( !Reveal.isLastSlide() || availableFragments().next || config.loop === true ) ) {
				autoSlideTimeout = setTimeout( function() {
					typeof config.autoSlideMethod === 'function' ? config.autoSlideMethod() : navigateNext();
					cueAutoSlide();
				}, autoSlide );
				autoSlideStartTime = Date.now();
			}

			if( autoSlidePlayer ) {
				autoSlidePlayer.setPlaying( autoSlideTimeout !== -1 );
			}

		}

	}

	/**
	 * Cancels any ongoing request to auto-slide.
	 */
	function cancelAutoSlide() {

		clearTimeout( autoSlideTimeout );
		autoSlideTimeout = -1;

	}

	function pauseAutoSlide() {

		if( autoSlide && !autoSlidePaused ) {
			autoSlidePaused = true;
			dispatchEvent( 'autoslidepaused' );
			clearTimeout( autoSlideTimeout );

			if( autoSlidePlayer ) {
				autoSlidePlayer.setPlaying( false );
			}
		}

	}

	function resumeAutoSlide() {

		if( autoSlide && autoSlidePaused ) {
			autoSlidePaused = false;
			dispatchEvent( 'autoslideresumed' );
			cueAutoSlide();
		}

	}

	function navigateLeft() {

		// Reverse for RTL
		if( config.rtl ) {
			if( ( isOverview() || nextFragment() === false ) && availableRoutes().left ) {
				slide( indexh + 1 );
			}
		}
		// Normal navigation
		else if( ( isOverview() || previousFragment() === false ) && availableRoutes().left ) {
			slide( indexh - 1 );
		}

	}

	function navigateRight() {

		// Reverse for RTL
		if( config.rtl ) {
			if( ( isOverview() || previousFragment() === false ) && availableRoutes().right ) {
				slide( indexh - 1 );
			}
		}
		// Normal navigation
		else if( ( isOverview() || nextFragment() === false ) && availableRoutes().right ) {
			slide( indexh + 1 );
		}

	}

	function navigateUp() {

		// Prioritize hiding fragments
		if( ( isOverview() || previousFragment() === false ) && availableRoutes().up ) {
			slide( indexh, indexv - 1 );
		}

	}

	function navigateDown() {

		// Prioritize revealing fragments
		if( ( isOverview() || nextFragment() === false ) && availableRoutes().down ) {
			slide( indexh, indexv + 1 );
		}

	}

	/**
	 * Navigates backwards, prioritized in the following order:
	 * 1) Previous fragment
	 * 2) Previous vertical slide
	 * 3) Previous horizontal slide
	 */
	function navigatePrev() {

		// Prioritize revealing fragments
		if( previousFragment() === false ) {
			if( availableRoutes().up ) {
				navigateUp();
			}
			else {
				// Fetch the previous horizontal slide, if there is one
				var previousSlide;

				if( config.rtl ) {
					previousSlide = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR + '.future' ) ).pop();
				}
				else {
					previousSlide = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR + '.past' ) ).pop();
				}

				if( previousSlide ) {
					var v = ( previousSlide.querySelectorAll( 'section' ).length - 1 ) || undefined;
					var h = indexh - 1;
					slide( h, v );
				}
			}
		}

	}

	/**
	 * The reverse of #navigatePrev().
	 */
	function navigateNext() {

		// Prioritize revealing fragments
		if( nextFragment() === false ) {
			if( availableRoutes().down ) {
				navigateDown();
			}
			else if( config.rtl ) {
				navigateLeft();
			}
			else {
				navigateRight();
			}
		}

	}

	/**
	 * Checks if the target element prevents the triggering of
	 * swipe navigation.
	 */
	function isSwipePrevented( target ) {

		while( target && typeof target.hasAttribute === 'function' ) {
			if( target.hasAttribute( 'data-prevent-swipe' ) ) return true;
			target = target.parentNode;
		}

		return false;

	}


	// --------------------------------------------------------------------//
	// ----------------------------- EVENTS -------------------------------//
	// --------------------------------------------------------------------//

	/**
	 * Called by all event handlers that are based on user
	 * input.
	 *
	 * @param {object} [event]
	 */
	function onUserInput( event ) {

		if( config.autoSlideStoppable ) {
			pauseAutoSlide();
		}

	}

	/**
	 * Handler for the document level 'keypress' event.
	 *
	 * @param {object} event
	 */
	function onDocumentKeyPress( event ) {

		// Check if the pressed key is question mark
		if( event.shiftKey && event.charCode === 63 ) {
			toggleHelp();
		}

	}

	/**
	 * Handler for the document level 'keydown' event.
	 *
	 * @param {object} event
	 */
	function onDocumentKeyDown( event ) {

		// If there's a condition specified and it returns false,
		// ignore this event
		if( typeof config.keyboardCondition === 'function' && config.keyboardCondition() === false ) {
			return true;
		}

		// Remember if auto-sliding was paused so we can toggle it
		var autoSlideWasPaused = autoSlidePaused;

		onUserInput( event );

		// Check if there's a focused element that could be using
		// the keyboard
		var activeElementIsCE = document.activeElement && document.activeElement.contentEditable !== 'inherit';
		var activeElementIsInput = document.activeElement && document.activeElement.tagName && /input|textarea/i.test( document.activeElement.tagName );
		var activeElementIsNotes = document.activeElement && document.activeElement.className && /speaker-notes/i.test( document.activeElement.className);

		// Disregard the event if there's a focused element or a
		// keyboard modifier key is present
		if( activeElementIsCE || activeElementIsInput || activeElementIsNotes || (event.shiftKey && event.keyCode !== 32) || event.altKey || event.ctrlKey || event.metaKey ) return;

		// While paused only allow resume keyboard events; 'b', 'v', '.'
		var resumeKeyCodes = [66,86,190,191];
		var key;

		// Custom key bindings for togglePause should be able to resume
		if( typeof config.keyboard === 'object' ) {
			for( key in config.keyboard ) {
				if( config.keyboard[key] === 'togglePause' ) {
					resumeKeyCodes.push( parseInt( key, 10 ) );
				}
			}
		}

		if( isPaused() && resumeKeyCodes.indexOf( event.keyCode ) === -1 ) {
			return false;
		}

		var triggered = false;

		// 1. User defined key bindings
		if( typeof config.keyboard === 'object' ) {

			for( key in config.keyboard ) {

				// Check if this binding matches the pressed key
				if( parseInt( key, 10 ) === event.keyCode ) {

					var value = config.keyboard[ key ];

					// Callback function
					if( typeof value === 'function' ) {
						value.apply( null, [ event ] );
					}
					// String shortcuts to reveal.js API
					else if( typeof value === 'string' && typeof Reveal[ value ] === 'function' ) {
						Reveal[ value ].call();
					}

					triggered = true;

				}

			}

		}

		// 2. System defined key bindings
		if( triggered === false ) {

			// Assume true and try to prove false
			triggered = true;

			switch( event.keyCode ) {
				// p, page up
				case 80: case 33: navigatePrev(); break;
				// n, page down
				case 78: case 34: navigateNext(); break;
				// h, left
				case 72: case 37: navigateLeft(); break;
				// l, right
				case 76: case 39: navigateRight(); break;
				// k, up
				case 75: case 38: navigateUp(); break;
				// j, down
				case 74: case 40: navigateDown(); break;
				// home
				case 36: slide( 0 ); break;
				// end
				case 35: slide( Number.MAX_VALUE ); break;
				// space
				case 32: isOverview() ? deactivateOverview() : event.shiftKey ? navigatePrev() : navigateNext(); break;
				// return
				case 13: isOverview() ? deactivateOverview() : triggered = false; break;
				// two-spot, semicolon, b, v, period, Logitech presenter tools "black screen" button
				case 58: case 59: case 66: case 86: case 190: case 191: togglePause(); break;
				// f
				case 70: enterFullscreen(); break;
				// a
				case 65: if ( config.autoSlideStoppable ) toggleAutoSlide( autoSlideWasPaused ); break;
				default:
					triggered = false;
			}

		}

		// If the input resulted in a triggered action we should prevent
		// the browsers default behavior
		if( triggered ) {
			event.preventDefault && event.preventDefault();
		}
		// ESC or O key
		else if ( ( event.keyCode === 27 || event.keyCode === 79 ) && features.transforms3d ) {
			if( dom.overlay ) {
				closeOverlay();
			}
			else {
				toggleOverview();
			}

			event.preventDefault && event.preventDefault();
		}

		// If auto-sliding is enabled we need to cue up
		// another timeout
		cueAutoSlide();

	}

	/**
	 * Handler for the 'touchstart' event, enables support for
	 * swipe and pinch gestures.
	 *
	 * @param {object} event
	 */
	function onTouchStart( event ) {

		if( isSwipePrevented( event.target ) ) return true;

		touch.startX = event.touches[0].clientX;
		touch.startY = event.touches[0].clientY;
		touch.startCount = event.touches.length;

		// If there's two touches we need to memorize the distance
		// between those two points to detect pinching
		if( event.touches.length === 2 && config.overview ) {
			touch.startSpan = distanceBetween( {
				x: event.touches[1].clientX,
				y: event.touches[1].clientY
			}, {
				x: touch.startX,
				y: touch.startY
			} );
		}

	}

	/**
	 * Handler for the 'touchmove' event.
	 *
	 * @param {object} event
	 */
	function onTouchMove( event ) {

		if( isSwipePrevented( event.target ) ) return true;

		// Each touch should only trigger one action
		if( !touch.captured ) {
			onUserInput( event );

			var currentX = event.touches[0].clientX;
			var currentY = event.touches[0].clientY;

			// If the touch started with two points and still has
			// two active touches; test for the pinch gesture
			if( event.touches.length === 2 && touch.startCount === 2 && config.overview ) {

				// The current distance in pixels between the two touch points
				var currentSpan = distanceBetween( {
					x: event.touches[1].clientX,
					y: event.touches[1].clientY
				}, {
					x: touch.startX,
					y: touch.startY
				} );

				// If the span is larger than the desire amount we've got
				// ourselves a pinch
				if( Math.abs( touch.startSpan - currentSpan ) > touch.threshold ) {
					touch.captured = true;

					if( currentSpan < touch.startSpan ) {
						activateOverview();
					}
					else {
						deactivateOverview();
					}
				}

				event.preventDefault();

			}
			// There was only one touch point, look for a swipe
			else if( event.touches.length === 1 && touch.startCount !== 2 ) {

				var deltaX = currentX - touch.startX,
					deltaY = currentY - touch.startY;

				if( deltaX > touch.threshold && Math.abs( deltaX ) > Math.abs( deltaY ) ) {
					touch.captured = true;
					navigateLeft();
				}
				else if( deltaX < -touch.threshold && Math.abs( deltaX ) > Math.abs( deltaY ) ) {
					touch.captured = true;
					navigateRight();
				}
				else if( deltaY > touch.threshold ) {
					touch.captured = true;
					navigateUp();
				}
				else if( deltaY < -touch.threshold ) {
					touch.captured = true;
					navigateDown();
				}

				// If we're embedded, only block touch events if they have
				// triggered an action
				if( config.embedded ) {
					if( touch.captured || isVerticalSlide( currentSlide ) ) {
						event.preventDefault();
					}
				}
				// Not embedded? Block them all to avoid needless tossing
				// around of the viewport in iOS
				else {
					event.preventDefault();
				}

			}
		}
		// There's a bug with swiping on some Android devices unless
		// the default action is always prevented
		else if( UA.match( /android/gi ) ) {
			event.preventDefault();
		}

	}

	/**
	 * Handler for the 'touchend' event.
	 *
	 * @param {object} event
	 */
	function onTouchEnd( event ) {

		touch.captured = false;

	}

	/**
	 * Convert pointer down to touch start.
	 *
	 * @param {object} event
	 */
	function onPointerDown( event ) {

		if( event.pointerType === event.MSPOINTER_TYPE_TOUCH || event.pointerType === "touch" ) {
			event.touches = [{ clientX: event.clientX, clientY: event.clientY }];
			onTouchStart( event );
		}

	}

	/**
	 * Convert pointer move to touch move.
	 *
	 * @param {object} event
	 */
	function onPointerMove( event ) {

		if( event.pointerType === event.MSPOINTER_TYPE_TOUCH || event.pointerType === "touch" )  {
			event.touches = [{ clientX: event.clientX, clientY: event.clientY }];
			onTouchMove( event );
		}

	}

	/**
	 * Convert pointer up to touch end.
	 *
	 * @param {object} event
	 */
	function onPointerUp( event ) {

		if( event.pointerType === event.MSPOINTER_TYPE_TOUCH || event.pointerType === "touch" )  {
			event.touches = [{ clientX: event.clientX, clientY: event.clientY }];
			onTouchEnd( event );
		}

	}

	/**
	 * Handles mouse wheel scrolling, throttled to avoid skipping
	 * multiple slides.
	 *
	 * @param {object} event
	 */
	function onDocumentMouseScroll( event ) {

		if( Date.now() - lastMouseWheelStep > 600 ) {

			lastMouseWheelStep = Date.now();

			var delta = event.detail || -event.wheelDelta;
			if( delta > 0 ) {
				navigateNext();
			}
			else if( delta < 0 ) {
				navigatePrev();
			}

		}

	}

	/**
	 * Clicking on the progress bar results in a navigation to the
	 * closest approximate horizontal slide using this equation:
	 *
	 * ( clickX / presentationWidth ) * numberOfSlides
	 *
	 * @param {object} event
	 */
	function onProgressClicked( event ) {

		onUserInput( event );

		event.preventDefault();

		var slidesTotal = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ).length;
		var slideIndex = Math.floor( ( event.clientX / dom.wrapper.offsetWidth ) * slidesTotal );

		if( config.rtl ) {
			slideIndex = slidesTotal - slideIndex;
		}

		slide( slideIndex );

	}

	/**
	 * Event handler for navigation control buttons.
	 */
	function onNavigateLeftClicked( event ) { event.preventDefault(); onUserInput(); navigateLeft(); }
	function onNavigateRightClicked( event ) { event.preventDefault(); onUserInput(); navigateRight(); }
	function onNavigateUpClicked( event ) { event.preventDefault(); onUserInput(); navigateUp(); }
	function onNavigateDownClicked( event ) { event.preventDefault(); onUserInput(); navigateDown(); }
	function onNavigatePrevClicked( event ) { event.preventDefault(); onUserInput(); navigatePrev(); }
	function onNavigateNextClicked( event ) { event.preventDefault(); onUserInput(); navigateNext(); }

	/**
	 * Handler for the window level 'hashchange' event.
	 *
	 * @param {object} [event]
	 */
	function onWindowHashChange( event ) {

		readURL();

	}

	/**
	 * Handler for the window level 'resize' event.
	 *
	 * @param {object} [event]
	 */
	function onWindowResize( event ) {

		layout();

	}

	/**
	 * Handle for the window level 'visibilitychange' event.
	 *
	 * @param {object} [event]
	 */
	function onPageVisibilityChange( event ) {

		var isHidden =  document.webkitHidden ||
						document.msHidden ||
						document.hidden;

		// If, after clicking a link or similar and we're coming back,
		// focus the document.body to ensure we can use keyboard shortcuts
		if( isHidden === false && document.activeElement !== document.body ) {
			// Not all elements support .blur() - SVGs among them.
			if( typeof document.activeElement.blur === 'function' ) {
				document.activeElement.blur();
			}
			document.body.focus();
		}

	}

	/**
	 * Invoked when a slide is and we're in the overview.
	 *
	 * @param {object} event
	 */
	function onOverviewSlideClicked( event ) {

		// TODO There's a bug here where the event listeners are not
		// removed after deactivating the overview.
		if( eventsAreBound && isOverview() ) {
			event.preventDefault();

			var element = event.target;

			while( element && !element.nodeName.match( /section/gi ) ) {
				element = element.parentNode;
			}

			if( element && !element.classList.contains( 'disabled' ) ) {

				deactivateOverview();

				if( element.nodeName.match( /section/gi ) ) {
					var h = parseInt( element.getAttribute( 'data-index-h' ), 10 ),
						v = parseInt( element.getAttribute( 'data-index-v' ), 10 );

					slide( h, v );
				}

			}
		}

	}

	/**
	 * Handles clicks on links that are set to preview in the
	 * iframe overlay.
	 *
	 * @param {object} event
	 */
	function onPreviewLinkClicked( event ) {

		if( event.currentTarget && event.currentTarget.hasAttribute( 'href' ) ) {
			var url = event.currentTarget.getAttribute( 'href' );
			if( url ) {
				showPreview( url );
				event.preventDefault();
			}
		}

	}

	/**
	 * Handles click on the auto-sliding controls element.
	 *
	 * @param {object} [event]
	 */
	function onAutoSlidePlayerClick( event ) {

		// Replay
		if( Reveal.isLastSlide() && config.loop === false ) {
			slide( 0, 0 );
			resumeAutoSlide();
		}
		// Resume
		else if( autoSlidePaused ) {
			resumeAutoSlide();
		}
		// Pause
		else {
			pauseAutoSlide();
		}

	}


	// --------------------------------------------------------------------//
	// ------------------------ PLAYBACK COMPONENT ------------------------//
	// --------------------------------------------------------------------//


	/**
	 * Constructor for the playback component, which displays
	 * play/pause/progress controls.
	 *
	 * @param {HTMLElement} container The component will append
	 * itself to this
	 * @param {function} progressCheck A method which will be
	 * called frequently to get the current progress on a range
	 * of 0-1
	 */
	function Playback( container, progressCheck ) {

		// Cosmetics
		this.diameter = 100;
		this.diameter2 = this.diameter/2;
		this.thickness = 6;

		// Flags if we are currently playing
		this.playing = false;

		// Current progress on a 0-1 range
		this.progress = 0;

		// Used to loop the animation smoothly
		this.progressOffset = 1;

		this.container = container;
		this.progressCheck = progressCheck;

		this.canvas = document.createElement( 'canvas' );
		this.canvas.className = 'playback';
		this.canvas.width = this.diameter;
		this.canvas.height = this.diameter;
		this.canvas.style.width = this.diameter2 + 'px';
		this.canvas.style.height = this.diameter2 + 'px';
		this.context = this.canvas.getContext( '2d' );

		this.container.appendChild( this.canvas );

		this.render();

	}

	/**
	 * @param value
	 */
	Playback.prototype.setPlaying = function( value ) {

		var wasPlaying = this.playing;

		this.playing = value;

		// Start repainting if we weren't already
		if( !wasPlaying && this.playing ) {
			this.animate();
		}
		else {
			this.render();
		}

	};

	Playback.prototype.animate = function() {

		var progressBefore = this.progress;

		this.progress = this.progressCheck();

		// When we loop, offset the progress so that it eases
		// smoothly rather than immediately resetting
		if( progressBefore > 0.8 && this.progress < 0.2 ) {
			this.progressOffset = this.progress;
		}

		this.render();

		if( this.playing ) {
			features.requestAnimationFrameMethod.call( window, this.animate.bind( this ) );
		}

	};

	/**
	 * Renders the current progress and playback state.
	 */
	Playback.prototype.render = function() {

		var progress = this.playing ? this.progress : 0,
			radius = ( this.diameter2 ) - this.thickness,
			x = this.diameter2,
			y = this.diameter2,
			iconSize = 28;

		// Ease towards 1
		this.progressOffset += ( 1 - this.progressOffset ) * 0.1;

		var endAngle = ( - Math.PI / 2 ) + ( progress * ( Math.PI * 2 ) );
		var startAngle = ( - Math.PI / 2 ) + ( this.progressOffset * ( Math.PI * 2 ) );

		this.context.save();
		this.context.clearRect( 0, 0, this.diameter, this.diameter );

		// Solid background color
		this.context.beginPath();
		this.context.arc( x, y, radius + 4, 0, Math.PI * 2, false );
		this.context.fillStyle = 'rgba( 0, 0, 0, 0.4 )';
		this.context.fill();

		// Draw progress track
		this.context.beginPath();
		this.context.arc( x, y, radius, 0, Math.PI * 2, false );
		this.context.lineWidth = this.thickness;
		this.context.strokeStyle = '#666';
		this.context.stroke();

		if( this.playing ) {
			// Draw progress on top of track
			this.context.beginPath();
			this.context.arc( x, y, radius, startAngle, endAngle, false );
			this.context.lineWidth = this.thickness;
			this.context.strokeStyle = '#fff';
			this.context.stroke();
		}

		this.context.translate( x - ( iconSize / 2 ), y - ( iconSize / 2 ) );

		// Draw play/pause icons
		if( this.playing ) {
			this.context.fillStyle = '#fff';
			this.context.fillRect( 0, 0, iconSize / 2 - 4, iconSize );
			this.context.fillRect( iconSize / 2 + 4, 0, iconSize / 2 - 4, iconSize );
		}
		else {
			this.context.beginPath();
			this.context.translate( 4, 0 );
			this.context.moveTo( 0, 0 );
			this.context.lineTo( iconSize - 4, iconSize / 2 );
			this.context.lineTo( 0, iconSize );
			this.context.fillStyle = '#fff';
			this.context.fill();
		}

		this.context.restore();

	};

	Playback.prototype.on = function( type, listener ) {
		this.canvas.addEventListener( type, listener, false );
	};

	Playback.prototype.off = function( type, listener ) {
		this.canvas.removeEventListener( type, listener, false );
	};

	Playback.prototype.destroy = function() {

		this.playing = false;

		if( this.canvas.parentNode ) {
			this.container.removeChild( this.canvas );
		}

	};


	// --------------------------------------------------------------------//
	// ------------------------------- API --------------------------------//
	// --------------------------------------------------------------------//


	Reveal = {
		VERSION: VERSION,

		initialize: initialize,
		configure: configure,
		sync: sync,

		// Navigation methods
		slide: slide,
		left: navigateLeft,
		right: navigateRight,
		up: navigateUp,
		down: navigateDown,
		prev: navigatePrev,
		next: navigateNext,

		// Fragment methods
		navigateFragment: navigateFragment,
		prevFragment: previousFragment,
		nextFragment: nextFragment,

		// Deprecated aliases
		navigateTo: slide,
		navigateLeft: navigateLeft,
		navigateRight: navigateRight,
		navigateUp: navigateUp,
		navigateDown: navigateDown,
		navigatePrev: navigatePrev,
		navigateNext: navigateNext,

		// Forces an update in slide layout
		layout: layout,

		// Randomizes the order of slides
		shuffle: shuffle,

		// Returns an object with the available routes as booleans (left/right/top/bottom)
		availableRoutes: availableRoutes,

		// Returns an object with the available fragments as booleans (prev/next)
		availableFragments: availableFragments,

		// Toggles a help overlay with keyboard shortcuts
		toggleHelp: toggleHelp,

		// Toggles the overview mode on/off
		toggleOverview: toggleOverview,

		// Toggles the "black screen" mode on/off
		togglePause: togglePause,

		// Toggles the auto slide mode on/off
		toggleAutoSlide: toggleAutoSlide,

		// State checks
		isOverview: isOverview,
		isPaused: isPaused,
		isAutoSliding: isAutoSliding,

		// Adds or removes all internal event listeners (such as keyboard)
		addEventListeners: addEventListeners,
		removeEventListeners: removeEventListeners,

		// Facility for persisting and restoring the presentation state
		getState: getState,
		setState: setState,

		// Presentation progress
		getSlidePastCount: getSlidePastCount,

		// Presentation progress on range of 0-1
		getProgress: getProgress,

		// Returns the indices of the current, or specified, slide
		getIndices: getIndices,

		// Returns an Array of all slides
		getSlides: getSlides,

		// Returns the total number of slides
		getTotalSlides: getTotalSlides,

		// Returns the slide element at the specified index
		getSlide: getSlide,

		// Returns the slide background element at the specified index
		getSlideBackground: getSlideBackground,

		// Returns the speaker notes string for a slide, or null
		getSlideNotes: getSlideNotes,

		// Returns the previous slide element, may be null
		getPreviousSlide: function() {
			return previousSlide;
		},

		// Returns the current slide element
		getCurrentSlide: function() {
			return currentSlide;
		},

		// Returns the current scale of the presentation content
		getScale: function() {
			return scale;
		},

		// Returns the current configuration object
		getConfig: function() {
			return config;
		},

		// Helper method, retrieves query string as a key/value hash
		getQueryHash: function() {
			var query = {};

			location.search.replace( /[A-Z0-9]+?=([\w\.%-]*)/gi, function(a) {
				query[ a.split( '=' ).shift() ] = a.split( '=' ).pop();
			} );

			// Basic deserialization
			for( var i in query ) {
				var value = query[ i ];

				query[ i ] = deserialize( unescape( value ) );
			}

			return query;
		},

		// Returns true if we're currently on the first slide
		isFirstSlide: function() {
			return ( indexh === 0 && indexv === 0 );
		},

		// Returns true if we're currently on the last slide
		isLastSlide: function() {
			if( currentSlide ) {
				// Does this slide has next a sibling?
				if( currentSlide.nextElementSibling ) return false;

				// If it's vertical, does its parent have a next sibling?
				if( isVerticalSlide( currentSlide ) && currentSlide.parentNode.nextElementSibling ) return false;

				return true;
			}

			return false;
		},

		// Checks if reveal.js has been loaded and is ready for use
		isReady: function() {
			return loaded;
		},

		// Forward event binding to the reveal DOM element
		addEventListener: function( type, listener, useCapture ) {
			if( 'addEventListener' in window ) {
				( dom.wrapper || document.querySelector( '.reveal' ) ).addEventListener( type, listener, useCapture );
			}
		},
		removeEventListener: function( type, listener, useCapture ) {
			if( 'addEventListener' in window ) {
				( dom.wrapper || document.querySelector( '.reveal' ) ).removeEventListener( type, listener, useCapture );
			}
		},

		// Programatically triggers a keyboard event
		triggerKey: function( keyCode ) {
			onDocumentKeyDown( { keyCode: keyCode } );
		},

		// Registers a new shortcut to include in the help overlay
		registerKeyboardShortcut: function( key, value ) {
			keyboardShortcuts[key] = value;
		}
	};

	return Reveal;

}));

},{}],8:[function(require,module,exports){
/**
 * The reveal.js markdown plugin. Handles parsing of
 * markdown inside of presentations as well as loading
 * of external markdown documents.
 */
(function( root, factory ) {
	if (typeof define === 'function' && define.amd) {
		root.marked = require( './marked' );
		root.RevealMarkdown = factory( root.marked );
		root.RevealMarkdown.initialize();
	} else if( typeof exports === 'object' ) {
		module.exports = factory( require( './marked' ) );
	} else {
		// Browser globals (root is window)
		root.RevealMarkdown = factory( root.marked );
		root.RevealMarkdown.initialize();
	}
}( this, function( marked ) {

	var DEFAULT_SLIDE_SEPARATOR = '^\r?\n---\r?\n$',
		DEFAULT_NOTES_SEPARATOR = 'note:',
		DEFAULT_ELEMENT_ATTRIBUTES_SEPARATOR = '\\\.element\\\s*?(.+?)$',
		DEFAULT_SLIDE_ATTRIBUTES_SEPARATOR = '\\\.slide:\\\s*?(\\\S.+?)$';

	var SCRIPT_END_PLACEHOLDER = '__SCRIPT_END__';


	/**
	 * Retrieves the markdown contents of a slide section
	 * element. Normalizes leading tabs/whitespace.
	 */
	function getMarkdownFromSlide( section ) {

		// look for a <script> or <textarea data-template> wrapper
		var template = section.querySelector( '[data-template]' ) || section.querySelector( 'script' );

		// strip leading whitespace so it isn't evaluated as code
		var text = ( template || section ).textContent;

		// restore script end tags
		text = text.replace( new RegExp( SCRIPT_END_PLACEHOLDER, 'g' ), '</script>' );

		var leadingWs = text.match( /^\n?(\s*)/ )[1].length,
			leadingTabs = text.match( /^\n?(\t*)/ )[1].length;

		if( leadingTabs > 0 ) {
			text = text.replace( new RegExp('\\n?\\t{' + leadingTabs + '}','g'), '\n' );
		}
		else if( leadingWs > 1 ) {
			text = text.replace( new RegExp('\\n? {' + leadingWs + '}', 'g'), '\n' );
		}

		return text;

	}

	/**
	 * Given a markdown slide section element, this will
	 * return all arguments that aren't related to markdown
	 * parsing. Used to forward any other user-defined arguments
	 * to the output markdown slide.
	 */
	function getForwardedAttributes( section ) {

		var attributes = section.attributes;
		var result = [];

		for( var i = 0, len = attributes.length; i < len; i++ ) {
			var name = attributes[i].name,
				value = attributes[i].value;

			// disregard attributes that are used for markdown loading/parsing
			if( /data\-(markdown|separator|vertical|notes)/gi.test( name ) ) continue;

			if( value ) {
				result.push( name + '="' + value + '"' );
			}
			else {
				result.push( name );
			}
		}

		return result.join( ' ' );

	}

	/**
	 * Inspects the given options and fills out default
	 * values for what's not defined.
	 */
	function getSlidifyOptions( options ) {

		options = options || {};
		options.separator = options.separator || DEFAULT_SLIDE_SEPARATOR;
		options.notesSeparator = options.notesSeparator || DEFAULT_NOTES_SEPARATOR;
		options.attributes = options.attributes || '';

		return options;

	}

	/**
	 * Helper function for constructing a markdown slide.
	 */
	function createMarkdownSlide( content, options ) {

		options = getSlidifyOptions( options );

		var notesMatch = content.split( new RegExp( options.notesSeparator, 'mgi' ) );

		if( notesMatch.length === 2 ) {
			content = notesMatch[0] + '<aside class="notes">' + marked(notesMatch[1].trim()) + '</aside>';
		}

		// prevent script end tags in the content from interfering
		// with parsing
		content = content.replace( /<\/script>/g, SCRIPT_END_PLACEHOLDER );

		return '<script type="text/template">' + content + '</script>';

	}

	/**
	 * Parses a data string into multiple slides based
	 * on the passed in separator arguments.
	 */
	function slidify( markdown, options ) {

		options = getSlidifyOptions( options );

		var separatorRegex = new RegExp( options.separator + ( options.verticalSeparator ? '|' + options.verticalSeparator : '' ), 'mg' ),
			horizontalSeparatorRegex = new RegExp( options.separator );

		var matches,
			lastIndex = 0,
			isHorizontal,
			wasHorizontal = true,
			content,
			sectionStack = [];

		// iterate until all blocks between separators are stacked up
		while( matches = separatorRegex.exec( markdown ) ) {
			notes = null;

			// determine direction (horizontal by default)
			isHorizontal = horizontalSeparatorRegex.test( matches[0] );

			if( !isHorizontal && wasHorizontal ) {
				// create vertical stack
				sectionStack.push( [] );
			}

			// pluck slide content from markdown input
			content = markdown.substring( lastIndex, matches.index );

			if( isHorizontal && wasHorizontal ) {
				// add to horizontal stack
				sectionStack.push( content );
			}
			else {
				// add to vertical stack
				sectionStack[sectionStack.length-1].push( content );
			}

			lastIndex = separatorRegex.lastIndex;
			wasHorizontal = isHorizontal;
		}

		// add the remaining slide
		( wasHorizontal ? sectionStack : sectionStack[sectionStack.length-1] ).push( markdown.substring( lastIndex ) );

		var markdownSections = '';

		// flatten the hierarchical stack, and insert <section data-markdown> tags
		for( var i = 0, len = sectionStack.length; i < len; i++ ) {
			// vertical
			if( sectionStack[i] instanceof Array ) {
				markdownSections += '<section '+ options.attributes +'>';

				sectionStack[i].forEach( function( child ) {
					markdownSections += '<section data-markdown>' + createMarkdownSlide( child, options ) + '</section>';
				} );

				markdownSections += '</section>';
			}
			else {
				markdownSections += '<section '+ options.attributes +' data-markdown>' + createMarkdownSlide( sectionStack[i], options ) + '</section>';
			}
		}

		return markdownSections;

	}

	/**
	 * Parses any current data-markdown slides, splits
	 * multi-slide markdown into separate sections and
	 * handles loading of external markdown.
	 */
	function processSlides() {

		var sections = document.querySelectorAll( '[data-markdown]'),
			section;

		for( var i = 0, len = sections.length; i < len; i++ ) {

			section = sections[i];

			if( section.getAttribute( 'data-markdown' ).length ) {

				var xhr = new XMLHttpRequest(),
					url = section.getAttribute( 'data-markdown' );

				datacharset = section.getAttribute( 'data-charset' );

				// see https://developer.mozilla.org/en-US/docs/Web/API/element.getAttribute#Notes
				if( datacharset != null && datacharset != '' ) {
					xhr.overrideMimeType( 'text/html; charset=' + datacharset );
				}

				xhr.onreadystatechange = function() {
					if( xhr.readyState === 4 ) {
						// file protocol yields status code 0 (useful for local debug, mobile applications etc.)
						if ( ( xhr.status >= 200 && xhr.status < 300 ) || xhr.status === 0 ) {

							section.outerHTML = slidify( xhr.responseText, {
								separator: section.getAttribute( 'data-separator' ),
								verticalSeparator: section.getAttribute( 'data-separator-vertical' ),
								notesSeparator: section.getAttribute( 'data-separator-notes' ),
								attributes: getForwardedAttributes( section )
							});

						}
						else {

							section.outerHTML = '<section data-state="alert">' +
								'ERROR: The attempt to fetch ' + url + ' failed with HTTP status ' + xhr.status + '.' +
								'Check your browser\'s JavaScript console for more details.' +
								'<p>Remember that you need to serve the presentation HTML from a HTTP server.</p>' +
								'</section>';

						}
					}
				};

				xhr.open( 'GET', url, false );

				try {
					xhr.send();
				}
				catch ( e ) {
					alert( 'Failed to get the Markdown file ' + url + '. Make sure that the presentation and the file are served by a HTTP server and the file can be found there. ' + e );
				}

			}
			else if( section.getAttribute( 'data-separator' ) || section.getAttribute( 'data-separator-vertical' ) || section.getAttribute( 'data-separator-notes' ) ) {

				section.outerHTML = slidify( getMarkdownFromSlide( section ), {
					separator: section.getAttribute( 'data-separator' ),
					verticalSeparator: section.getAttribute( 'data-separator-vertical' ),
					notesSeparator: section.getAttribute( 'data-separator-notes' ),
					attributes: getForwardedAttributes( section )
				});

			}
			else {
				section.innerHTML = createMarkdownSlide( getMarkdownFromSlide( section ) );
			}
		}

	}

	/**
	 * Check if a node value has the attributes pattern.
	 * If yes, extract it and add that value as one or several attributes
	 * the the terget element.
	 *
	 * You need Cache Killer on Chrome to see the effect on any FOM transformation
	 * directly on refresh (F5)
	 * http://stackoverflow.com/questions/5690269/disabling-chrome-cache-for-website-development/7000899#answer-11786277
	 */
	function addAttributeInElement( node, elementTarget, separator ) {

		var mardownClassesInElementsRegex = new RegExp( separator, 'mg' );
		var mardownClassRegex = new RegExp( "([^\"= ]+?)=\"([^\"=]+?)\"", 'mg' );
		var nodeValue = node.nodeValue;
		if( matches = mardownClassesInElementsRegex.exec( nodeValue ) ) {

			var classes = matches[1];
			nodeValue = nodeValue.substring( 0, matches.index ) + nodeValue.substring( mardownClassesInElementsRegex.lastIndex );
			node.nodeValue = nodeValue;
			while( matchesClass = mardownClassRegex.exec( classes ) ) {
				elementTarget.setAttribute( matchesClass[1], matchesClass[2] );
			}
			return true;
		}
		return false;
	}

	/**
	 * Add attributes to the parent element of a text node,
	 * or the element of an attribute node.
	 */
	function addAttributes( section, element, previousElement, separatorElementAttributes, separatorSectionAttributes ) {

		if ( element != null && element.childNodes != undefined && element.childNodes.length > 0 ) {
			previousParentElement = element;
			for( var i = 0; i < element.childNodes.length; i++ ) {
				childElement = element.childNodes[i];
				if ( i > 0 ) {
					j = i - 1;
					while ( j >= 0 ) {
						aPreviousChildElement = element.childNodes[j];
						if ( typeof aPreviousChildElement.setAttribute == 'function' && aPreviousChildElement.tagName != "BR" ) {
							previousParentElement = aPreviousChildElement;
							break;
						}
						j = j - 1;
					}
				}
				parentSection = section;
				if( childElement.nodeName ==  "section" ) {
					parentSection = childElement ;
					previousParentElement = childElement ;
				}
				if ( typeof childElement.setAttribute == 'function' || childElement.nodeType == Node.COMMENT_NODE ) {
					addAttributes( parentSection, childElement, previousParentElement, separatorElementAttributes, separatorSectionAttributes );
				}
			}
		}

		if ( element.nodeType == Node.COMMENT_NODE ) {
			if ( addAttributeInElement( element, previousElement, separatorElementAttributes ) == false ) {
				addAttributeInElement( element, section, separatorSectionAttributes );
			}
		}
	}

	/**
	 * Converts any current data-markdown slides in the
	 * DOM to HTML.
	 */
	function convertSlides() {

		var sections = document.querySelectorAll( '[data-markdown]');

		for( var i = 0, len = sections.length; i < len; i++ ) {

			var section = sections[i];

			// Only parse the same slide once
			if( !section.getAttribute( 'data-markdown-parsed' ) ) {

				section.setAttribute( 'data-markdown-parsed', true )

				var notes = section.querySelector( 'aside.notes' );
				var markdown = getMarkdownFromSlide( section );

				section.innerHTML = marked( markdown );
				addAttributes( 	section, section, null, section.getAttribute( 'data-element-attributes' ) ||
								section.parentNode.getAttribute( 'data-element-attributes' ) ||
								DEFAULT_ELEMENT_ATTRIBUTES_SEPARATOR,
								section.getAttribute( 'data-attributes' ) ||
								section.parentNode.getAttribute( 'data-attributes' ) ||
								DEFAULT_SLIDE_ATTRIBUTES_SEPARATOR);

				// If there were notes, we need to re-add them after
				// having overwritten the section's HTML
				if( notes ) {
					section.appendChild( notes );
				}

			}

		}

	}

	// API
	return {

		initialize: function() {
			if( typeof marked === 'undefined' ) {
				throw 'The reveal.js Markdown plugin requires marked to be loaded';
			}

			if( typeof hljs !== 'undefined' ) {
				marked.setOptions({
					highlight: function( code, lang ) {
						return hljs.highlightAuto( code, [lang] ).value;
					}
				});
			}

			var options = Reveal.getConfig().markdown;

			if ( options ) {
				marked.setOptions( options );
			}

			processSlides();
			convertSlides();
		},

		// TODO: Do these belong in the API?
		processSlides: processSlides,
		convertSlides: convertSlides,
		slidify: slidify

	};

}));

},{"./marked":9}],9:[function(require,module,exports){
(function (global){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */
(function(){var block={newline:/^\n+/,code:/^( {4}[^\n]+\n*)+/,fences:noop,hr:/^( *[-*_]){3,} *(?:\n+|$)/,heading:/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,nptable:noop,lheading:/^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,blockquote:/^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,list:/^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,html:/^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,table:noop,paragraph:/^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,text:/^[^\n]+/};block.bullet=/(?:[*+-]|\d+\.)/;block.item=/^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;block.item=replace(block.item,"gm")(/bull/g,block.bullet)();block.list=replace(block.list)(/bull/g,block.bullet)("hr","\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))")("def","\\n+(?="+block.def.source+")")();block.blockquote=replace(block.blockquote)("def",block.def)();block._tag="(?!(?:"+"a|em|strong|small|s|cite|q|dfn|abbr|data|time|code"+"|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo"+"|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b";block.html=replace(block.html)("comment",/<!--[\s\S]*?-->/)("closed",/<(tag)[\s\S]+?<\/\1>/)("closing",/<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)(/tag/g,block._tag)();block.paragraph=replace(block.paragraph)("hr",block.hr)("heading",block.heading)("lheading",block.lheading)("blockquote",block.blockquote)("tag","<"+block._tag)("def",block.def)();block.normal=merge({},block);block.gfm=merge({},block.normal,{fences:/^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,paragraph:/^/,heading:/^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/});block.gfm.paragraph=replace(block.paragraph)("(?!","(?!"+block.gfm.fences.source.replace("\\1","\\2")+"|"+block.list.source.replace("\\1","\\3")+"|")();block.tables=merge({},block.gfm,{nptable:/^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,table:/^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/});function Lexer(options){this.tokens=[];this.tokens.links={};this.options=options||marked.defaults;this.rules=block.normal;if(this.options.gfm){if(this.options.tables){this.rules=block.tables}else{this.rules=block.gfm}}}Lexer.rules=block;Lexer.lex=function(src,options){var lexer=new Lexer(options);return lexer.lex(src)};Lexer.prototype.lex=function(src){src=src.replace(/\r\n|\r/g,"\n").replace(/\t/g,"    ").replace(/\u00a0/g," ").replace(/\u2424/g,"\n");return this.token(src,true)};Lexer.prototype.token=function(src,top,bq){var src=src.replace(/^ +$/gm,""),next,loose,cap,bull,b,item,space,i,l;while(src){if(cap=this.rules.newline.exec(src)){src=src.substring(cap[0].length);if(cap[0].length>1){this.tokens.push({type:"space"})}}if(cap=this.rules.code.exec(src)){src=src.substring(cap[0].length);cap=cap[0].replace(/^ {4}/gm,"");this.tokens.push({type:"code",text:!this.options.pedantic?cap.replace(/\n+$/,""):cap});continue}if(cap=this.rules.fences.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"code",lang:cap[2],text:cap[3]||""});continue}if(cap=this.rules.heading.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"heading",depth:cap[1].length,text:cap[2]});continue}if(top&&(cap=this.rules.nptable.exec(src))){src=src.substring(cap[0].length);item={type:"table",header:cap[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:cap[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:cap[3].replace(/\n$/,"").split("\n")};for(i=0;i<item.align.length;i++){if(/^ *-+: *$/.test(item.align[i])){item.align[i]="right"}else if(/^ *:-+: *$/.test(item.align[i])){item.align[i]="center"}else if(/^ *:-+ *$/.test(item.align[i])){item.align[i]="left"}else{item.align[i]=null}}for(i=0;i<item.cells.length;i++){item.cells[i]=item.cells[i].split(/ *\| */)}this.tokens.push(item);continue}if(cap=this.rules.lheading.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"heading",depth:cap[2]==="="?1:2,text:cap[1]});continue}if(cap=this.rules.hr.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"hr"});continue}if(cap=this.rules.blockquote.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"blockquote_start"});cap=cap[0].replace(/^ *> ?/gm,"");this.token(cap,top,true);this.tokens.push({type:"blockquote_end"});continue}if(cap=this.rules.list.exec(src)){src=src.substring(cap[0].length);bull=cap[2];this.tokens.push({type:"list_start",ordered:bull.length>1});cap=cap[0].match(this.rules.item);next=false;l=cap.length;i=0;for(;i<l;i++){item=cap[i];space=item.length;item=item.replace(/^ *([*+-]|\d+\.) +/,"");if(~item.indexOf("\n ")){space-=item.length;item=!this.options.pedantic?item.replace(new RegExp("^ {1,"+space+"}","gm"),""):item.replace(/^ {1,4}/gm,"")}if(this.options.smartLists&&i!==l-1){b=block.bullet.exec(cap[i+1])[0];if(bull!==b&&!(bull.length>1&&b.length>1)){src=cap.slice(i+1).join("\n")+src;i=l-1}}loose=next||/\n\n(?!\s*$)/.test(item);if(i!==l-1){next=item.charAt(item.length-1)==="\n";if(!loose)loose=next}this.tokens.push({type:loose?"loose_item_start":"list_item_start"});this.token(item,false,bq);this.tokens.push({type:"list_item_end"})}this.tokens.push({type:"list_end"});continue}if(cap=this.rules.html.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:this.options.sanitize?"paragraph":"html",pre:!this.options.sanitizer&&(cap[1]==="pre"||cap[1]==="script"||cap[1]==="style"),text:cap[0]});continue}if(!bq&&top&&(cap=this.rules.def.exec(src))){src=src.substring(cap[0].length);this.tokens.links[cap[1].toLowerCase()]={href:cap[2],title:cap[3]};continue}if(top&&(cap=this.rules.table.exec(src))){src=src.substring(cap[0].length);item={type:"table",header:cap[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:cap[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:cap[3].replace(/(?: *\| *)?\n$/,"").split("\n")};for(i=0;i<item.align.length;i++){if(/^ *-+: *$/.test(item.align[i])){item.align[i]="right"}else if(/^ *:-+: *$/.test(item.align[i])){item.align[i]="center"}else if(/^ *:-+ *$/.test(item.align[i])){item.align[i]="left"}else{item.align[i]=null}}for(i=0;i<item.cells.length;i++){item.cells[i]=item.cells[i].replace(/^ *\| *| *\| *$/g,"").split(/ *\| */)}this.tokens.push(item);continue}if(top&&(cap=this.rules.paragraph.exec(src))){src=src.substring(cap[0].length);this.tokens.push({type:"paragraph",text:cap[1].charAt(cap[1].length-1)==="\n"?cap[1].slice(0,-1):cap[1]});continue}if(cap=this.rules.text.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"text",text:cap[0]});continue}if(src){throw new Error("Infinite loop on byte: "+src.charCodeAt(0))}}return this.tokens};var inline={escape:/^\\([\\`*{}\[\]()#+\-.!_>])/,autolink:/^<([^ >]+(@|:\/)[^ >]+)>/,url:noop,tag:/^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,link:/^!?\[(inside)\]\(href\)/,reflink:/^!?\[(inside)\]\s*\[([^\]]*)\]/,nolink:/^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,strong:/^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,em:/^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,code:/^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,br:/^ {2,}\n(?!\s*$)/,del:noop,text:/^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/};inline._inside=/(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;inline._href=/\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;inline.link=replace(inline.link)("inside",inline._inside)("href",inline._href)();inline.reflink=replace(inline.reflink)("inside",inline._inside)();inline.normal=merge({},inline);inline.pedantic=merge({},inline.normal,{strong:/^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,em:/^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/});inline.gfm=merge({},inline.normal,{escape:replace(inline.escape)("])","~|])")(),url:/^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,del:/^~~(?=\S)([\s\S]*?\S)~~/,text:replace(inline.text)("]|","~]|")("|","|https?://|")()});inline.breaks=merge({},inline.gfm,{br:replace(inline.br)("{2,}","*")(),text:replace(inline.gfm.text)("{2,}","*")()});function InlineLexer(links,options){this.options=options||marked.defaults;this.links=links;this.rules=inline.normal;this.renderer=this.options.renderer||new Renderer;this.renderer.options=this.options;if(!this.links){throw new Error("Tokens array requires a `links` property.")}if(this.options.gfm){if(this.options.breaks){this.rules=inline.breaks}else{this.rules=inline.gfm}}else if(this.options.pedantic){this.rules=inline.pedantic}}InlineLexer.rules=inline;InlineLexer.output=function(src,links,options){var inline=new InlineLexer(links,options);return inline.output(src)};InlineLexer.prototype.output=function(src){var out="",link,text,href,cap;while(src){if(cap=this.rules.escape.exec(src)){src=src.substring(cap[0].length);out+=cap[1];continue}if(cap=this.rules.autolink.exec(src)){src=src.substring(cap[0].length);if(cap[2]==="@"){text=cap[1].charAt(6)===":"?this.mangle(cap[1].substring(7)):this.mangle(cap[1]);href=this.mangle("mailto:")+text}else{text=escape(cap[1]);href=text}out+=this.renderer.link(href,null,text);continue}if(!this.inLink&&(cap=this.rules.url.exec(src))){src=src.substring(cap[0].length);text=escape(cap[1]);href=text;out+=this.renderer.link(href,null,text);continue}if(cap=this.rules.tag.exec(src)){if(!this.inLink&&/^<a /i.test(cap[0])){this.inLink=true}else if(this.inLink&&/^<\/a>/i.test(cap[0])){this.inLink=false}src=src.substring(cap[0].length);out+=this.options.sanitize?this.options.sanitizer?this.options.sanitizer(cap[0]):escape(cap[0]):cap[0];continue}if(cap=this.rules.link.exec(src)){src=src.substring(cap[0].length);this.inLink=true;out+=this.outputLink(cap,{href:cap[2],title:cap[3]});this.inLink=false;continue}if((cap=this.rules.reflink.exec(src))||(cap=this.rules.nolink.exec(src))){src=src.substring(cap[0].length);link=(cap[2]||cap[1]).replace(/\s+/g," ");link=this.links[link.toLowerCase()];if(!link||!link.href){out+=cap[0].charAt(0);src=cap[0].substring(1)+src;continue}this.inLink=true;out+=this.outputLink(cap,link);this.inLink=false;continue}if(cap=this.rules.strong.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.strong(this.output(cap[2]||cap[1]));continue}if(cap=this.rules.em.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.em(this.output(cap[2]||cap[1]));continue}if(cap=this.rules.code.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.codespan(escape(cap[2],true));continue}if(cap=this.rules.br.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.br();continue}if(cap=this.rules.del.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.del(this.output(cap[1]));continue}if(cap=this.rules.text.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.text(escape(this.smartypants(cap[0])));continue}if(src){throw new Error("Infinite loop on byte: "+src.charCodeAt(0))}}return out};InlineLexer.prototype.outputLink=function(cap,link){var href=escape(link.href),title=link.title?escape(link.title):null;return cap[0].charAt(0)!=="!"?this.renderer.link(href,title,this.output(cap[1])):this.renderer.image(href,title,escape(cap[1]))};InlineLexer.prototype.smartypants=function(text){if(!this.options.smartypants)return text;return text.replace(/---/g,"—").replace(/--/g,"–").replace(/(^|[-\u2014/(\[{"\s])'/g,"$1‘").replace(/'/g,"’").replace(/(^|[-\u2014/(\[{\u2018\s])"/g,"$1“").replace(/"/g,"”").replace(/\.{3}/g,"…")};InlineLexer.prototype.mangle=function(text){if(!this.options.mangle)return text;var out="",l=text.length,i=0,ch;for(;i<l;i++){ch=text.charCodeAt(i);if(Math.random()>.5){ch="x"+ch.toString(16)}out+="&#"+ch+";"}return out};function Renderer(options){this.options=options||{}}Renderer.prototype.code=function(code,lang,escaped){if(this.options.highlight){var out=this.options.highlight(code,lang);if(out!=null&&out!==code){escaped=true;code=out}}if(!lang){return"<pre><code>"+(escaped?code:escape(code,true))+"\n</code></pre>"}return'<pre><code class="'+this.options.langPrefix+escape(lang,true)+'">'+(escaped?code:escape(code,true))+"\n</code></pre>\n"};Renderer.prototype.blockquote=function(quote){return"<blockquote>\n"+quote+"</blockquote>\n"};Renderer.prototype.html=function(html){return html};Renderer.prototype.heading=function(text,level,raw){return"<h"+level+' id="'+this.options.headerPrefix+raw.toLowerCase().replace(/[^\w]+/g,"-")+'">'+text+"</h"+level+">\n"};Renderer.prototype.hr=function(){return this.options.xhtml?"<hr/>\n":"<hr>\n"};Renderer.prototype.list=function(body,ordered){var type=ordered?"ol":"ul";return"<"+type+">\n"+body+"</"+type+">\n"};Renderer.prototype.listitem=function(text){return"<li>"+text+"</li>\n"};Renderer.prototype.paragraph=function(text){return"<p>"+text+"</p>\n"};Renderer.prototype.table=function(header,body){return"<table>\n"+"<thead>\n"+header+"</thead>\n"+"<tbody>\n"+body+"</tbody>\n"+"</table>\n"};Renderer.prototype.tablerow=function(content){return"<tr>\n"+content+"</tr>\n"};Renderer.prototype.tablecell=function(content,flags){var type=flags.header?"th":"td";var tag=flags.align?"<"+type+' style="text-align:'+flags.align+'">':"<"+type+">";return tag+content+"</"+type+">\n"};Renderer.prototype.strong=function(text){return"<strong>"+text+"</strong>"};Renderer.prototype.em=function(text){return"<em>"+text+"</em>"};Renderer.prototype.codespan=function(text){return"<code>"+text+"</code>"};Renderer.prototype.br=function(){return this.options.xhtml?"<br/>":"<br>"};Renderer.prototype.del=function(text){return"<del>"+text+"</del>"};Renderer.prototype.link=function(href,title,text){if(this.options.sanitize){try{var prot=decodeURIComponent(unescape(href)).replace(/[^\w:]/g,"").toLowerCase()}catch(e){return""}if(prot.indexOf("javascript:")===0||prot.indexOf("vbscript:")===0){return""}}var out='<a href="'+href+'"';if(title){out+=' title="'+title+'"'}out+=">"+text+"</a>";return out};Renderer.prototype.image=function(href,title,text){var out='<img src="'+href+'" alt="'+text+'"';if(title){out+=' title="'+title+'"'}out+=this.options.xhtml?"/>":">";return out};Renderer.prototype.text=function(text){return text};function Parser(options){this.tokens=[];this.token=null;this.options=options||marked.defaults;this.options.renderer=this.options.renderer||new Renderer;this.renderer=this.options.renderer;this.renderer.options=this.options}Parser.parse=function(src,options,renderer){var parser=new Parser(options,renderer);return parser.parse(src)};Parser.prototype.parse=function(src){this.inline=new InlineLexer(src.links,this.options,this.renderer);this.tokens=src.reverse();var out="";while(this.next()){out+=this.tok()}return out};Parser.prototype.next=function(){return this.token=this.tokens.pop()};Parser.prototype.peek=function(){return this.tokens[this.tokens.length-1]||0};Parser.prototype.parseText=function(){var body=this.token.text;while(this.peek().type==="text"){body+="\n"+this.next().text}return this.inline.output(body)};Parser.prototype.tok=function(){switch(this.token.type){case"space":{return""}case"hr":{return this.renderer.hr()}case"heading":{return this.renderer.heading(this.inline.output(this.token.text),this.token.depth,this.token.text)}case"code":{return this.renderer.code(this.token.text,this.token.lang,this.token.escaped)}case"table":{var header="",body="",i,row,cell,flags,j;cell="";for(i=0;i<this.token.header.length;i++){flags={header:true,align:this.token.align[i]};cell+=this.renderer.tablecell(this.inline.output(this.token.header[i]),{header:true,align:this.token.align[i]})}header+=this.renderer.tablerow(cell);for(i=0;i<this.token.cells.length;i++){row=this.token.cells[i];cell="";for(j=0;j<row.length;j++){cell+=this.renderer.tablecell(this.inline.output(row[j]),{header:false,align:this.token.align[j]})}body+=this.renderer.tablerow(cell)}return this.renderer.table(header,body)}case"blockquote_start":{var body="";while(this.next().type!=="blockquote_end"){body+=this.tok()}return this.renderer.blockquote(body)}case"list_start":{var body="",ordered=this.token.ordered;while(this.next().type!=="list_end"){body+=this.tok()}return this.renderer.list(body,ordered)}case"list_item_start":{var body="";while(this.next().type!=="list_item_end"){body+=this.token.type==="text"?this.parseText():this.tok()}return this.renderer.listitem(body)}case"loose_item_start":{var body="";while(this.next().type!=="list_item_end"){body+=this.tok()}return this.renderer.listitem(body)}case"html":{var html=!this.token.pre&&!this.options.pedantic?this.inline.output(this.token.text):this.token.text;return this.renderer.html(html)}case"paragraph":{return this.renderer.paragraph(this.inline.output(this.token.text))}case"text":{return this.renderer.paragraph(this.parseText())}}};function escape(html,encode){return html.replace(!encode?/&(?!#?\w+;)/g:/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function unescape(html){return html.replace(/&([#\w]+);/g,function(_,n){n=n.toLowerCase();if(n==="colon")return":";if(n.charAt(0)==="#"){return n.charAt(1)==="x"?String.fromCharCode(parseInt(n.substring(2),16)):String.fromCharCode(+n.substring(1))}return""})}function replace(regex,opt){regex=regex.source;opt=opt||"";return function self(name,val){if(!name)return new RegExp(regex,opt);val=val.source||val;val=val.replace(/(^|[^\[])\^/g,"$1");regex=regex.replace(name,val);return self}}function noop(){}noop.exec=noop;function merge(obj){var i=1,target,key;for(;i<arguments.length;i++){target=arguments[i];for(key in target){if(Object.prototype.hasOwnProperty.call(target,key)){obj[key]=target[key]}}}return obj}function marked(src,opt,callback){if(callback||typeof opt==="function"){if(!callback){callback=opt;opt=null}opt=merge({},marked.defaults,opt||{});var highlight=opt.highlight,tokens,pending,i=0;try{tokens=Lexer.lex(src,opt)}catch(e){return callback(e)}pending=tokens.length;var done=function(err){if(err){opt.highlight=highlight;return callback(err)}var out;try{out=Parser.parse(tokens,opt)}catch(e){err=e}opt.highlight=highlight;return err?callback(err):callback(null,out)};if(!highlight||highlight.length<3){return done()}delete opt.highlight;if(!pending)return done();for(;i<tokens.length;i++){(function(token){if(token.type!=="code"){return--pending||done()}return highlight(token.text,token.lang,function(err,code){if(err)return done(err);if(code==null||code===token.text){return--pending||done()}token.text=code;token.escaped=true;--pending||done()})})(tokens[i])}return}try{if(opt)opt=merge({},marked.defaults,opt);return Parser.parse(Lexer.lex(src,opt),opt)}catch(e){e.message+="\nPlease report this to https://github.com/chjj/marked.";if((opt||marked.defaults).silent){return"<p>An error occured:</p><pre>"+escape(e.message+"",true)+"</pre>"}throw e}}marked.options=marked.setOptions=function(opt){merge(marked.defaults,opt);return marked};marked.defaults={gfm:true,tables:true,breaks:false,pedantic:false,sanitize:false,sanitizer:null,mangle:true,smartLists:false,silent:false,highlight:null,langPrefix:"lang-",smartypants:false,headerPrefix:"",renderer:new Renderer,xhtml:false};marked.Parser=Parser;marked.parser=Parser.parse;marked.Renderer=Renderer;marked.Lexer=Lexer;marked.lexer=Lexer.lex;marked.InlineLexer=InlineLexer;marked.inlineLexer=InlineLexer.output;marked.parse=marked;if(typeof module!=="undefined"&&typeof exports==="object"){module.exports=marked}else if(typeof define==="function"&&define.amd){define(function(){return marked})}else{this.marked=marked}}).call(function(){return this||(typeof window!=="undefined"?window:global)}());
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],10:[function(require,module,exports){
(function (global){
'use strict';

var Reveal = global.Reveal = require('reveal.js');

var hljs = global.hljs = require('highlight.js/lib/highlight');
hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'));
hljs.registerLanguage('shell', require('highlight.js/lib/languages/shell'));
hljs.registerLanguage('shell', require('highlight.js/lib/languages/shell'));
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'));
hljs.registerLanguage('asciidoc', require('highlight.js/lib/languages/asciidoc'));
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));

var RevealMarkdown = require('reveal.js/plugin/markdown/markdown.js');

var toArray = function toArray(arr) {
  return Array.prototype.slice.call(arr);
};

RevealMarkdown.initialize();
Reveal.initialize({
  width: 1024,
  height: 728,

  controls: /(localhost|#live)/.test(location.href) !== true,
  progress: true,
  history: true,
  center: true,
  overview: false,
  rollingLinks: false,

  transition: 'linear'
});

// Reveal.addEventListener('ready', () => hljs.initHighlighting());
Reveal.addEventListener('ready', function () {
  toArray(document.querySelectorAll('a > img')).forEach(function (el) {
    el.parentNode.classList.add('image');
  });

  toArray(document.querySelectorAll('section[data-background]')).forEach(function (el) {
    var isEmpty = toArray(el.children).every(function (child) {
      return typeof child.nodeValue === 'text' && child.nodeValue.trim() === '' || child.classList.contains('notes');
    });

    if (isEmpty) {
      el.classList.add('empty');
    }
  });

  toArray(document.querySelectorAll('section[data-markdown] > h1, section[data-markdown] > h2, section[data-markdown] > h3')).forEach(function (el) {
    if (el.nextElementSibling && el.nextElementSibling.classList.contains('notes')) {
      el.classList.add('last-child');
    }
  });

  toArray(document.querySelectorAll('section[data-markdown]')).forEach(function (section) {
    if (section.querySelectorAll('pre > code').length) {
      section.setAttribute('data-state', 'code');
    }
  });
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"highlight.js/lib/highlight":1,"highlight.js/lib/languages/asciidoc":2,"highlight.js/lib/languages/bash":3,"highlight.js/lib/languages/javascript":4,"highlight.js/lib/languages/shell":5,"highlight.js/lib/languages/xml":6,"reveal.js":7,"reveal.js/plugin/markdown/markdown.js":8}]},{},[10])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzL2xpYi9oaWdobGlnaHQuanMiLCJub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzL2xpYi9sYW5ndWFnZXMvYXNjaWlkb2MuanMiLCJub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzL2xpYi9sYW5ndWFnZXMvYmFzaC5qcyIsIm5vZGVfbW9kdWxlcy9oaWdobGlnaHQuanMvbGliL2xhbmd1YWdlcy9qYXZhc2NyaXB0LmpzIiwibm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL3NoZWxsLmpzIiwibm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL3htbC5qcyIsIm5vZGVfbW9kdWxlcy9yZXZlYWwuanMvanMvcmV2ZWFsLmpzIiwibm9kZV9tb2R1bGVzL3JldmVhbC5qcy9wbHVnaW4vbWFya2Rvd24vbWFya2Rvd24uanMiLCJub2RlX21vZHVsZXMvcmV2ZWFsLmpzL3BsdWdpbi9tYXJrZG93bi9tYXJrZWQuanMiLCJzb3VyY2UvYXNzZXRzL2pzL3NsaWRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2h6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4L0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDTEE7O0FBRUEsSUFBTSxTQUFTLE9BQU8sTUFBUCxHQUFnQixRQUFRLFdBQVIsQ0FBL0I7O0FBRUEsSUFBTSxPQUFPLE9BQU8sSUFBUCxHQUFjLFFBQVEsNEJBQVIsQ0FBM0I7QUFDQSxLQUFLLGdCQUFMLENBQXNCLE1BQXRCLEVBQThCLFFBQVEsaUNBQVIsQ0FBOUI7QUFDQSxLQUFLLGdCQUFMLENBQXNCLE9BQXRCLEVBQStCLFFBQVEsa0NBQVIsQ0FBL0I7QUFDQSxLQUFLLGdCQUFMLENBQXNCLE9BQXRCLEVBQStCLFFBQVEsa0NBQVIsQ0FBL0I7QUFDQSxLQUFLLGdCQUFMLENBQXNCLEtBQXRCLEVBQTZCLFFBQVEsZ0NBQVIsQ0FBN0I7QUFDQSxLQUFLLGdCQUFMLENBQXNCLFVBQXRCLEVBQWtDLFFBQVEscUNBQVIsQ0FBbEM7QUFDQSxLQUFLLGdCQUFMLENBQXNCLFlBQXRCLEVBQW9DLFFBQVEsdUNBQVIsQ0FBcEM7O0FBRUEsSUFBTSxpQkFBaUIsUUFBUSx1Q0FBUixDQUF2Qjs7QUFFQSxJQUFJLFVBQVUsU0FBVixPQUFVLENBQVMsR0FBVCxFQUFhO0FBQ3pCLFNBQU8sTUFBTSxTQUFOLENBQWdCLEtBQWhCLENBQXNCLElBQXRCLENBQTJCLEdBQTNCLENBQVA7QUFDRCxDQUZEOztBQUlBLGVBQWUsVUFBZjtBQUNBLE9BQU8sVUFBUCxDQUFrQjtBQUNoQixTQUFPLElBRFM7QUFFaEIsVUFBUSxHQUZROztBQUloQixZQUFVLG9CQUFvQixJQUFwQixDQUF5QixTQUFTLElBQWxDLE1BQTRDLElBSnRDO0FBS2hCLFlBQVUsSUFMTTtBQU1oQixXQUFTLElBTk87QUFPaEIsVUFBUSxJQVBRO0FBUWhCLFlBQVUsS0FSTTtBQVNoQixnQkFBYyxLQVRFOztBQVdoQixjQUFZO0FBWEksQ0FBbEI7O0FBY0E7QUFDQSxPQUFPLGdCQUFQLENBQXdCLE9BQXhCLEVBQWlDLFlBQVc7QUFDMUMsVUFBUSxTQUFTLGdCQUFULENBQTBCLFNBQTFCLENBQVIsRUFBOEMsT0FBOUMsQ0FBc0QsVUFBUyxFQUFULEVBQVk7QUFDaEUsT0FBRyxVQUFILENBQWMsU0FBZCxDQUF3QixHQUF4QixDQUE0QixPQUE1QjtBQUNELEdBRkQ7O0FBSUEsVUFBUSxTQUFTLGdCQUFULENBQTBCLDBCQUExQixDQUFSLEVBQStELE9BQS9ELENBQXVFLFVBQVMsRUFBVCxFQUFZO0FBQ2pGLFFBQUksVUFBVSxRQUFRLEdBQUcsUUFBWCxFQUFxQixLQUFyQixDQUEyQixVQUFTLEtBQVQsRUFBZTtBQUN0RCxhQUFRLE9BQU8sTUFBTSxTQUFiLEtBQTJCLE1BQTNCLElBQXFDLE1BQU0sU0FBTixDQUFnQixJQUFoQixPQUEyQixFQUFqRSxJQUF3RSxNQUFNLFNBQU4sQ0FBZ0IsUUFBaEIsQ0FBeUIsT0FBekIsQ0FBL0U7QUFDRCxLQUZhLENBQWQ7O0FBSUEsUUFBSSxPQUFKLEVBQVk7QUFDVixTQUFHLFNBQUgsQ0FBYSxHQUFiLENBQWlCLE9BQWpCO0FBQ0Q7QUFDRixHQVJEOztBQVVBLFVBQVEsU0FBUyxnQkFBVCxDQUEwQix1RkFBMUIsQ0FBUixFQUE0SCxPQUE1SCxDQUFvSSxVQUFTLEVBQVQsRUFBWTtBQUM5SSxRQUFJLEdBQUcsa0JBQUgsSUFBeUIsR0FBRyxrQkFBSCxDQUFzQixTQUF0QixDQUFnQyxRQUFoQyxDQUF5QyxPQUF6QyxDQUE3QixFQUErRTtBQUM3RSxTQUFHLFNBQUgsQ0FBYSxHQUFiLENBQWlCLFlBQWpCO0FBQ0Q7QUFDRixHQUpEOztBQU1BLFVBQVEsU0FBUyxnQkFBVCxDQUEwQix3QkFBMUIsQ0FBUixFQUE2RCxPQUE3RCxDQUFxRSxVQUFTLE9BQVQsRUFBaUI7QUFDcEYsUUFBSSxRQUFRLGdCQUFSLENBQXlCLFlBQXpCLEVBQXVDLE1BQTNDLEVBQWtEO0FBQ2hELGNBQVEsWUFBUixDQUFxQixZQUFyQixFQUFtQyxNQUFuQztBQUNEO0FBQ0YsR0FKRDtBQUtELENBMUJEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXG5TeW50YXggaGlnaGxpZ2h0aW5nIHdpdGggbGFuZ3VhZ2UgYXV0b2RldGVjdGlvbi5cbmh0dHBzOi8vaGlnaGxpZ2h0anMub3JnL1xuKi9cblxuKGZ1bmN0aW9uKGZhY3RvcnkpIHtcblxuICAvLyBGaW5kIHRoZSBnbG9iYWwgb2JqZWN0IGZvciBleHBvcnQgdG8gYm90aCB0aGUgYnJvd3NlciBhbmQgd2ViIHdvcmtlcnMuXG4gIHZhciBnbG9iYWxPYmplY3QgPSB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyAmJiB3aW5kb3cgfHxcbiAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBzZWxmID09PSAnb2JqZWN0JyAmJiBzZWxmO1xuXG4gIC8vIFNldHVwIGhpZ2hsaWdodC5qcyBmb3IgZGlmZmVyZW50IGVudmlyb25tZW50cy4gRmlyc3QgaXMgTm9kZS5qcyBvclxuICAvLyBDb21tb25KUy5cbiAgaWYodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgZmFjdG9yeShleHBvcnRzKTtcbiAgfSBlbHNlIGlmKGdsb2JhbE9iamVjdCkge1xuICAgIC8vIEV4cG9ydCBobGpzIGdsb2JhbGx5IGV2ZW4gd2hlbiB1c2luZyBBTUQgZm9yIGNhc2VzIHdoZW4gdGhpcyBzY3JpcHRcbiAgICAvLyBpcyBsb2FkZWQgd2l0aCBvdGhlcnMgdGhhdCBtYXkgc3RpbGwgZXhwZWN0IGEgZ2xvYmFsIGhsanMuXG4gICAgZ2xvYmFsT2JqZWN0LmhsanMgPSBmYWN0b3J5KHt9KTtcblxuICAgIC8vIEZpbmFsbHkgcmVnaXN0ZXIgdGhlIGdsb2JhbCBobGpzIHdpdGggQU1ELlxuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbE9iamVjdC5obGpzO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbn0oZnVuY3Rpb24oaGxqcykge1xuICAvLyBDb252ZW5pZW5jZSB2YXJpYWJsZXMgZm9yIGJ1aWxkLWluIG9iamVjdHNcbiAgdmFyIEFycmF5UHJvdG8gPSBbXSxcbiAgICAgIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cztcblxuICAvLyBHbG9iYWwgaW50ZXJuYWwgdmFyaWFibGVzIHVzZWQgd2l0aGluIHRoZSBoaWdobGlnaHQuanMgbGlicmFyeS5cbiAgdmFyIGxhbmd1YWdlcyA9IHt9LFxuICAgICAgYWxpYXNlcyAgID0ge307XG5cbiAgLy8gUmVndWxhciBleHByZXNzaW9ucyB1c2VkIHRocm91Z2hvdXQgdGhlIGhpZ2hsaWdodC5qcyBsaWJyYXJ5LlxuICB2YXIgbm9IaWdobGlnaHRSZSAgICA9IC9eKG5vLT9oaWdobGlnaHR8cGxhaW58dGV4dCkkL2ksXG4gICAgICBsYW5ndWFnZVByZWZpeFJlID0gL1xcYmxhbmcoPzp1YWdlKT8tKFtcXHctXSspXFxiL2ksXG4gICAgICBmaXhNYXJrdXBSZSAgICAgID0gLygoXig8W14+XSs+fFxcdHwpK3woPzpcXG4pKSkvZ207XG5cbiAgdmFyIHNwYW5FbmRUYWcgPSAnPC9zcGFuPic7XG5cbiAgLy8gR2xvYmFsIG9wdGlvbnMgdXNlZCB3aGVuIHdpdGhpbiBleHRlcm5hbCBBUElzLiBUaGlzIGlzIG1vZGlmaWVkIHdoZW5cbiAgLy8gY2FsbGluZyB0aGUgYGhsanMuY29uZmlndXJlYCBmdW5jdGlvbi5cbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgY2xhc3NQcmVmaXg6ICdobGpzLScsXG4gICAgdGFiUmVwbGFjZTogbnVsbCxcbiAgICB1c2VCUjogZmFsc2UsXG4gICAgbGFuZ3VhZ2VzOiB1bmRlZmluZWRcbiAgfTtcblxuXG4gIC8qIFV0aWxpdHkgZnVuY3Rpb25zICovXG5cbiAgZnVuY3Rpb24gZXNjYXBlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhZyhub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRlc3RSZShyZSwgbGV4ZW1lKSB7XG4gICAgdmFyIG1hdGNoID0gcmUgJiYgcmUuZXhlYyhsZXhlbWUpO1xuICAgIHJldHVybiBtYXRjaCAmJiBtYXRjaC5pbmRleCA9PT0gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzTm90SGlnaGxpZ2h0ZWQobGFuZ3VhZ2UpIHtcbiAgICByZXR1cm4gbm9IaWdobGlnaHRSZS50ZXN0KGxhbmd1YWdlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJsb2NrTGFuZ3VhZ2UoYmxvY2spIHtcbiAgICB2YXIgaSwgbWF0Y2gsIGxlbmd0aCwgX2NsYXNzO1xuICAgIHZhciBjbGFzc2VzID0gYmxvY2suY2xhc3NOYW1lICsgJyAnO1xuXG4gICAgY2xhc3NlcyArPSBibG9jay5wYXJlbnROb2RlID8gYmxvY2sucGFyZW50Tm9kZS5jbGFzc05hbWUgOiAnJztcblxuICAgIC8vIGxhbmd1YWdlLSogdGFrZXMgcHJlY2VkZW5jZSBvdmVyIG5vbi1wcmVmaXhlZCBjbGFzcyBuYW1lcy5cbiAgICBtYXRjaCA9IGxhbmd1YWdlUHJlZml4UmUuZXhlYyhjbGFzc2VzKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIHJldHVybiBnZXRMYW5ndWFnZShtYXRjaFsxXSkgPyBtYXRjaFsxXSA6ICduby1oaWdobGlnaHQnO1xuICAgIH1cblxuICAgIGNsYXNzZXMgPSBjbGFzc2VzLnNwbGl0KC9cXHMrLyk7XG5cbiAgICBmb3IgKGkgPSAwLCBsZW5ndGggPSBjbGFzc2VzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBfY2xhc3MgPSBjbGFzc2VzW2ldXG5cbiAgICAgIGlmIChpc05vdEhpZ2hsaWdodGVkKF9jbGFzcykgfHwgZ2V0TGFuZ3VhZ2UoX2NsYXNzKSkge1xuICAgICAgICByZXR1cm4gX2NsYXNzO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaGVyaXQocGFyZW50KSB7ICAvLyBpbmhlcml0KHBhcmVudCwgb3ZlcnJpZGVfb2JqLCBvdmVycmlkZV9vYmosIC4uLilcbiAgICB2YXIga2V5O1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIgb2JqZWN0cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICBmb3IgKGtleSBpbiBwYXJlbnQpXG4gICAgICByZXN1bHRba2V5XSA9IHBhcmVudFtrZXldO1xuICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbihvYmopIHtcbiAgICAgIGZvciAoa2V5IGluIG9iailcbiAgICAgICAgcmVzdWx0W2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyogU3RyZWFtIG1lcmdpbmcgKi9cblxuICBmdW5jdGlvbiBub2RlU3RyZWFtKG5vZGUpIHtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgKGZ1bmN0aW9uIF9ub2RlU3RyZWFtKG5vZGUsIG9mZnNldCkge1xuICAgICAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gMylcbiAgICAgICAgICBvZmZzZXQgKz0gY2hpbGQubm9kZVZhbHVlLmxlbmd0aDtcbiAgICAgICAgZWxzZSBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICBldmVudDogJ3N0YXJ0JyxcbiAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICAgICAgbm9kZTogY2hpbGRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBvZmZzZXQgPSBfbm9kZVN0cmVhbShjaGlsZCwgb2Zmc2V0KTtcbiAgICAgICAgICAvLyBQcmV2ZW50IHZvaWQgZWxlbWVudHMgZnJvbSBoYXZpbmcgYW4gZW5kIHRhZyB0aGF0IHdvdWxkIGFjdHVhbGx5XG4gICAgICAgICAgLy8gZG91YmxlIHRoZW0gaW4gdGhlIG91dHB1dC4gVGhlcmUgYXJlIG1vcmUgdm9pZCBlbGVtZW50cyBpbiBIVE1MXG4gICAgICAgICAgLy8gYnV0IHdlIGxpc3Qgb25seSB0aG9zZSByZWFsaXN0aWNhbGx5IGV4cGVjdGVkIGluIGNvZGUgZGlzcGxheS5cbiAgICAgICAgICBpZiAoIXRhZyhjaGlsZCkubWF0Y2goL2JyfGhyfGltZ3xpbnB1dC8pKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgIGV2ZW50OiAnc3RvcCcsXG4gICAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICAgICAgICBub2RlOiBjaGlsZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb2Zmc2V0O1xuICAgIH0pKG5vZGUsIDApO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBtZXJnZVN0cmVhbXMob3JpZ2luYWwsIGhpZ2hsaWdodGVkLCB2YWx1ZSkge1xuICAgIHZhciBwcm9jZXNzZWQgPSAwO1xuICAgIHZhciByZXN1bHQgPSAnJztcbiAgICB2YXIgbm9kZVN0YWNrID0gW107XG5cbiAgICBmdW5jdGlvbiBzZWxlY3RTdHJlYW0oKSB7XG4gICAgICBpZiAoIW9yaWdpbmFsLmxlbmd0aCB8fCAhaGlnaGxpZ2h0ZWQubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbC5sZW5ndGggPyBvcmlnaW5hbCA6IGhpZ2hsaWdodGVkO1xuICAgICAgfVxuICAgICAgaWYgKG9yaWdpbmFsWzBdLm9mZnNldCAhPT0gaGlnaGxpZ2h0ZWRbMF0ub2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiAob3JpZ2luYWxbMF0ub2Zmc2V0IDwgaGlnaGxpZ2h0ZWRbMF0ub2Zmc2V0KSA/IG9yaWdpbmFsIDogaGlnaGxpZ2h0ZWQ7XG4gICAgICB9XG5cbiAgICAgIC8qXG4gICAgICBUbyBhdm9pZCBzdGFydGluZyB0aGUgc3RyZWFtIGp1c3QgYmVmb3JlIGl0IHNob3VsZCBzdG9wIHRoZSBvcmRlciBpc1xuICAgICAgZW5zdXJlZCB0aGF0IG9yaWdpbmFsIGFsd2F5cyBzdGFydHMgZmlyc3QgYW5kIGNsb3NlcyBsYXN0OlxuXG4gICAgICBpZiAoZXZlbnQxID09ICdzdGFydCcgJiYgZXZlbnQyID09ICdzdGFydCcpXG4gICAgICAgIHJldHVybiBvcmlnaW5hbDtcbiAgICAgIGlmIChldmVudDEgPT0gJ3N0YXJ0JyAmJiBldmVudDIgPT0gJ3N0b3AnKVxuICAgICAgICByZXR1cm4gaGlnaGxpZ2h0ZWQ7XG4gICAgICBpZiAoZXZlbnQxID09ICdzdG9wJyAmJiBldmVudDIgPT0gJ3N0YXJ0JylcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsO1xuICAgICAgaWYgKGV2ZW50MSA9PSAnc3RvcCcgJiYgZXZlbnQyID09ICdzdG9wJylcbiAgICAgICAgcmV0dXJuIGhpZ2hsaWdodGVkO1xuXG4gICAgICAuLi4gd2hpY2ggaXMgY29sbGFwc2VkIHRvOlxuICAgICAgKi9cbiAgICAgIHJldHVybiBoaWdobGlnaHRlZFswXS5ldmVudCA9PT0gJ3N0YXJ0JyA/IG9yaWdpbmFsIDogaGlnaGxpZ2h0ZWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb3Blbihub2RlKSB7XG4gICAgICBmdW5jdGlvbiBhdHRyX3N0cihhKSB7cmV0dXJuICcgJyArIGEubm9kZU5hbWUgKyAnPVwiJyArIGVzY2FwZShhLnZhbHVlKS5yZXBsYWNlKCdcIicsICcmcXVvdDsnKSArICdcIic7fVxuICAgICAgcmVzdWx0ICs9ICc8JyArIHRhZyhub2RlKSArIEFycmF5UHJvdG8ubWFwLmNhbGwobm9kZS5hdHRyaWJ1dGVzLCBhdHRyX3N0cikuam9pbignJykgKyAnPic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2Uobm9kZSkge1xuICAgICAgcmVzdWx0ICs9ICc8LycgKyB0YWcobm9kZSkgKyAnPic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVuZGVyKGV2ZW50KSB7XG4gICAgICAoZXZlbnQuZXZlbnQgPT09ICdzdGFydCcgPyBvcGVuIDogY2xvc2UpKGV2ZW50Lm5vZGUpO1xuICAgIH1cblxuICAgIHdoaWxlIChvcmlnaW5hbC5sZW5ndGggfHwgaGlnaGxpZ2h0ZWQubGVuZ3RoKSB7XG4gICAgICB2YXIgc3RyZWFtID0gc2VsZWN0U3RyZWFtKCk7XG4gICAgICByZXN1bHQgKz0gZXNjYXBlKHZhbHVlLnN1YnN0cmluZyhwcm9jZXNzZWQsIHN0cmVhbVswXS5vZmZzZXQpKTtcbiAgICAgIHByb2Nlc3NlZCA9IHN0cmVhbVswXS5vZmZzZXQ7XG4gICAgICBpZiAoc3RyZWFtID09PSBvcmlnaW5hbCkge1xuICAgICAgICAvKlxuICAgICAgICBPbiBhbnkgb3BlbmluZyBvciBjbG9zaW5nIHRhZyBvZiB0aGUgb3JpZ2luYWwgbWFya3VwIHdlIGZpcnN0IGNsb3NlXG4gICAgICAgIHRoZSBlbnRpcmUgaGlnaGxpZ2h0ZWQgbm9kZSBzdGFjaywgdGhlbiByZW5kZXIgdGhlIG9yaWdpbmFsIHRhZyBhbG9uZ1xuICAgICAgICB3aXRoIGFsbCB0aGUgZm9sbG93aW5nIG9yaWdpbmFsIHRhZ3MgYXQgdGhlIHNhbWUgb2Zmc2V0IGFuZCB0aGVuXG4gICAgICAgIHJlb3BlbiBhbGwgdGhlIHRhZ3Mgb24gdGhlIGhpZ2hsaWdodGVkIHN0YWNrLlxuICAgICAgICAqL1xuICAgICAgICBub2RlU3RhY2sucmV2ZXJzZSgpLmZvckVhY2goY2xvc2UpO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgcmVuZGVyKHN0cmVhbS5zcGxpY2UoMCwgMSlbMF0pO1xuICAgICAgICAgIHN0cmVhbSA9IHNlbGVjdFN0cmVhbSgpO1xuICAgICAgICB9IHdoaWxlIChzdHJlYW0gPT09IG9yaWdpbmFsICYmIHN0cmVhbS5sZW5ndGggJiYgc3RyZWFtWzBdLm9mZnNldCA9PT0gcHJvY2Vzc2VkKTtcbiAgICAgICAgbm9kZVN0YWNrLnJldmVyc2UoKS5mb3JFYWNoKG9wZW4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHN0cmVhbVswXS5ldmVudCA9PT0gJ3N0YXJ0Jykge1xuICAgICAgICAgIG5vZGVTdGFjay5wdXNoKHN0cmVhbVswXS5ub2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub2RlU3RhY2sucG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyKHN0cmVhbS5zcGxpY2UoMCwgMSlbMF0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0ICsgZXNjYXBlKHZhbHVlLnN1YnN0cihwcm9jZXNzZWQpKTtcbiAgfVxuXG4gIC8qIEluaXRpYWxpemF0aW9uICovXG5cbiAgZnVuY3Rpb24gZXhwYW5kX21vZGUobW9kZSkge1xuICAgIGlmIChtb2RlLnZhcmlhbnRzICYmICFtb2RlLmNhY2hlZF92YXJpYW50cykge1xuICAgICAgbW9kZS5jYWNoZWRfdmFyaWFudHMgPSBtb2RlLnZhcmlhbnRzLm1hcChmdW5jdGlvbih2YXJpYW50KSB7XG4gICAgICAgIHJldHVybiBpbmhlcml0KG1vZGUsIHt2YXJpYW50czogbnVsbH0sIHZhcmlhbnQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBtb2RlLmNhY2hlZF92YXJpYW50cyB8fCAobW9kZS5lbmRzV2l0aFBhcmVudCAmJiBbaW5oZXJpdChtb2RlKV0pIHx8IFttb2RlXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbXBpbGVMYW5ndWFnZShsYW5ndWFnZSkge1xuXG4gICAgZnVuY3Rpb24gcmVTdHIocmUpIHtcbiAgICAgICAgcmV0dXJuIChyZSAmJiByZS5zb3VyY2UpIHx8IHJlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxhbmdSZSh2YWx1ZSwgZ2xvYmFsKSB7XG4gICAgICByZXR1cm4gbmV3IFJlZ0V4cChcbiAgICAgICAgcmVTdHIodmFsdWUpLFxuICAgICAgICAnbScgKyAobGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSA/ICdpJyA6ICcnKSArIChnbG9iYWwgPyAnZycgOiAnJylcbiAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcGlsZU1vZGUobW9kZSwgcGFyZW50KSB7XG4gICAgICBpZiAobW9kZS5jb21waWxlZClcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbW9kZS5jb21waWxlZCA9IHRydWU7XG5cbiAgICAgIG1vZGUua2V5d29yZHMgPSBtb2RlLmtleXdvcmRzIHx8IG1vZGUuYmVnaW5LZXl3b3JkcztcbiAgICAgIGlmIChtb2RlLmtleXdvcmRzKSB7XG4gICAgICAgIHZhciBjb21waWxlZF9rZXl3b3JkcyA9IHt9O1xuXG4gICAgICAgIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oY2xhc3NOYW1lLCBzdHIpIHtcbiAgICAgICAgICBpZiAobGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSkge1xuICAgICAgICAgICAgc3RyID0gc3RyLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0ci5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24oa3cpIHtcbiAgICAgICAgICAgIHZhciBwYWlyID0ga3cuc3BsaXQoJ3wnKTtcbiAgICAgICAgICAgIGNvbXBpbGVkX2tleXdvcmRzW3BhaXJbMF1dID0gW2NsYXNzTmFtZSwgcGFpclsxXSA/IE51bWJlcihwYWlyWzFdKSA6IDFdO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0eXBlb2YgbW9kZS5rZXl3b3JkcyA9PT0gJ3N0cmluZycpIHsgLy8gc3RyaW5nXG4gICAgICAgICAgZmxhdHRlbigna2V5d29yZCcsIG1vZGUua2V5d29yZHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9iamVjdEtleXMobW9kZS5rZXl3b3JkcykuZm9yRWFjaChmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICBmbGF0dGVuKGNsYXNzTmFtZSwgbW9kZS5rZXl3b3Jkc1tjbGFzc05hbWVdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBtb2RlLmtleXdvcmRzID0gY29tcGlsZWRfa2V5d29yZHM7XG4gICAgICB9XG4gICAgICBtb2RlLmxleGVtZXNSZSA9IGxhbmdSZShtb2RlLmxleGVtZXMgfHwgL1xcdysvLCB0cnVlKTtcblxuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBpZiAobW9kZS5iZWdpbktleXdvcmRzKSB7XG4gICAgICAgICAgbW9kZS5iZWdpbiA9ICdcXFxcYignICsgbW9kZS5iZWdpbktleXdvcmRzLnNwbGl0KCcgJykuam9pbignfCcpICsgJylcXFxcYic7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFtb2RlLmJlZ2luKVxuICAgICAgICAgIG1vZGUuYmVnaW4gPSAvXFxCfFxcYi87XG4gICAgICAgIG1vZGUuYmVnaW5SZSA9IGxhbmdSZShtb2RlLmJlZ2luKTtcbiAgICAgICAgaWYgKCFtb2RlLmVuZCAmJiAhbW9kZS5lbmRzV2l0aFBhcmVudClcbiAgICAgICAgICBtb2RlLmVuZCA9IC9cXEJ8XFxiLztcbiAgICAgICAgaWYgKG1vZGUuZW5kKVxuICAgICAgICAgIG1vZGUuZW5kUmUgPSBsYW5nUmUobW9kZS5lbmQpO1xuICAgICAgICBtb2RlLnRlcm1pbmF0b3JfZW5kID0gcmVTdHIobW9kZS5lbmQpIHx8ICcnO1xuICAgICAgICBpZiAobW9kZS5lbmRzV2l0aFBhcmVudCAmJiBwYXJlbnQudGVybWluYXRvcl9lbmQpXG4gICAgICAgICAgbW9kZS50ZXJtaW5hdG9yX2VuZCArPSAobW9kZS5lbmQgPyAnfCcgOiAnJykgKyBwYXJlbnQudGVybWluYXRvcl9lbmQ7XG4gICAgICB9XG4gICAgICBpZiAobW9kZS5pbGxlZ2FsKVxuICAgICAgICBtb2RlLmlsbGVnYWxSZSA9IGxhbmdSZShtb2RlLmlsbGVnYWwpO1xuICAgICAgaWYgKG1vZGUucmVsZXZhbmNlID09IG51bGwpXG4gICAgICAgIG1vZGUucmVsZXZhbmNlID0gMTtcbiAgICAgIGlmICghbW9kZS5jb250YWlucykge1xuICAgICAgICBtb2RlLmNvbnRhaW5zID0gW107XG4gICAgICB9XG4gICAgICBtb2RlLmNvbnRhaW5zID0gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgbW9kZS5jb250YWlucy5tYXAoZnVuY3Rpb24oYykge1xuICAgICAgICByZXR1cm4gZXhwYW5kX21vZGUoYyA9PT0gJ3NlbGYnID8gbW9kZSA6IGMpXG4gICAgICB9KSk7XG4gICAgICBtb2RlLmNvbnRhaW5zLmZvckVhY2goZnVuY3Rpb24oYykge2NvbXBpbGVNb2RlKGMsIG1vZGUpO30pO1xuXG4gICAgICBpZiAobW9kZS5zdGFydHMpIHtcbiAgICAgICAgY29tcGlsZU1vZGUobW9kZS5zdGFydHMsIHBhcmVudCk7XG4gICAgICB9XG5cbiAgICAgIHZhciB0ZXJtaW5hdG9ycyA9XG4gICAgICAgIG1vZGUuY29udGFpbnMubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICByZXR1cm4gYy5iZWdpbktleXdvcmRzID8gJ1xcXFwuPygnICsgYy5iZWdpbiArICcpXFxcXC4/JyA6IGMuYmVnaW47XG4gICAgICAgIH0pXG4gICAgICAgIC5jb25jYXQoW21vZGUudGVybWluYXRvcl9lbmQsIG1vZGUuaWxsZWdhbF0pXG4gICAgICAgIC5tYXAocmVTdHIpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgICBtb2RlLnRlcm1pbmF0b3JzID0gdGVybWluYXRvcnMubGVuZ3RoID8gbGFuZ1JlKHRlcm1pbmF0b3JzLmpvaW4oJ3wnKSwgdHJ1ZSkgOiB7ZXhlYzogZnVuY3Rpb24oLypzKi8pIHtyZXR1cm4gbnVsbDt9fTtcbiAgICB9XG5cbiAgICBjb21waWxlTW9kZShsYW5ndWFnZSk7XG4gIH1cblxuICAvKlxuICBDb3JlIGhpZ2hsaWdodGluZyBmdW5jdGlvbi4gQWNjZXB0cyBhIGxhbmd1YWdlIG5hbWUsIG9yIGFuIGFsaWFzLCBhbmQgYVxuICBzdHJpbmcgd2l0aCB0aGUgY29kZSB0byBoaWdobGlnaHQuIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZ1xuICBwcm9wZXJ0aWVzOlxuXG4gIC0gcmVsZXZhbmNlIChpbnQpXG4gIC0gdmFsdWUgKGFuIEhUTUwgc3RyaW5nIHdpdGggaGlnaGxpZ2h0aW5nIG1hcmt1cClcblxuICAqL1xuICBmdW5jdGlvbiBoaWdobGlnaHQobmFtZSwgdmFsdWUsIGlnbm9yZV9pbGxlZ2FscywgY29udGludWF0aW9uKSB7XG5cbiAgICBmdW5jdGlvbiBzdWJNb2RlKGxleGVtZSwgbW9kZSkge1xuICAgICAgdmFyIGksIGxlbmd0aDtcblxuICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gbW9kZS5jb250YWlucy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGVzdFJlKG1vZGUuY29udGFpbnNbaV0uYmVnaW5SZSwgbGV4ZW1lKSkge1xuICAgICAgICAgIHJldHVybiBtb2RlLmNvbnRhaW5zW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZW5kT2ZNb2RlKG1vZGUsIGxleGVtZSkge1xuICAgICAgaWYgKHRlc3RSZShtb2RlLmVuZFJlLCBsZXhlbWUpKSB7XG4gICAgICAgIHdoaWxlIChtb2RlLmVuZHNQYXJlbnQgJiYgbW9kZS5wYXJlbnQpIHtcbiAgICAgICAgICBtb2RlID0gbW9kZS5wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1vZGU7XG4gICAgICB9XG4gICAgICBpZiAobW9kZS5lbmRzV2l0aFBhcmVudCkge1xuICAgICAgICByZXR1cm4gZW5kT2ZNb2RlKG1vZGUucGFyZW50LCBsZXhlbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzSWxsZWdhbChsZXhlbWUsIG1vZGUpIHtcbiAgICAgIHJldHVybiAhaWdub3JlX2lsbGVnYWxzICYmIHRlc3RSZShtb2RlLmlsbGVnYWxSZSwgbGV4ZW1lKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZXl3b3JkTWF0Y2gobW9kZSwgbWF0Y2gpIHtcbiAgICAgIHZhciBtYXRjaF9zdHIgPSBsYW5ndWFnZS5jYXNlX2luc2Vuc2l0aXZlID8gbWF0Y2hbMF0udG9Mb3dlckNhc2UoKSA6IG1hdGNoWzBdO1xuICAgICAgcmV0dXJuIG1vZGUua2V5d29yZHMuaGFzT3duUHJvcGVydHkobWF0Y2hfc3RyKSAmJiBtb2RlLmtleXdvcmRzW21hdGNoX3N0cl07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGRTcGFuKGNsYXNzbmFtZSwgaW5zaWRlU3BhbiwgbGVhdmVPcGVuLCBub1ByZWZpeCkge1xuICAgICAgdmFyIGNsYXNzUHJlZml4ID0gbm9QcmVmaXggPyAnJyA6IG9wdGlvbnMuY2xhc3NQcmVmaXgsXG4gICAgICAgICAgb3BlblNwYW4gICAgPSAnPHNwYW4gY2xhc3M9XCInICsgY2xhc3NQcmVmaXgsXG4gICAgICAgICAgY2xvc2VTcGFuICAgPSBsZWF2ZU9wZW4gPyAnJyA6IHNwYW5FbmRUYWdcblxuICAgICAgb3BlblNwYW4gKz0gY2xhc3NuYW1lICsgJ1wiPic7XG5cbiAgICAgIHJldHVybiBvcGVuU3BhbiArIGluc2lkZVNwYW4gKyBjbG9zZVNwYW47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0tleXdvcmRzKCkge1xuICAgICAgdmFyIGtleXdvcmRfbWF0Y2gsIGxhc3RfaW5kZXgsIG1hdGNoLCByZXN1bHQ7XG5cbiAgICAgIGlmICghdG9wLmtleXdvcmRzKVxuICAgICAgICByZXR1cm4gZXNjYXBlKG1vZGVfYnVmZmVyKTtcblxuICAgICAgcmVzdWx0ID0gJyc7XG4gICAgICBsYXN0X2luZGV4ID0gMDtcbiAgICAgIHRvcC5sZXhlbWVzUmUubGFzdEluZGV4ID0gMDtcbiAgICAgIG1hdGNoID0gdG9wLmxleGVtZXNSZS5leGVjKG1vZGVfYnVmZmVyKTtcblxuICAgICAgd2hpbGUgKG1hdGNoKSB7XG4gICAgICAgIHJlc3VsdCArPSBlc2NhcGUobW9kZV9idWZmZXIuc3Vic3RyaW5nKGxhc3RfaW5kZXgsIG1hdGNoLmluZGV4KSk7XG4gICAgICAgIGtleXdvcmRfbWF0Y2ggPSBrZXl3b3JkTWF0Y2godG9wLCBtYXRjaCk7XG4gICAgICAgIGlmIChrZXl3b3JkX21hdGNoKSB7XG4gICAgICAgICAgcmVsZXZhbmNlICs9IGtleXdvcmRfbWF0Y2hbMV07XG4gICAgICAgICAgcmVzdWx0ICs9IGJ1aWxkU3BhbihrZXl3b3JkX21hdGNoWzBdLCBlc2NhcGUobWF0Y2hbMF0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgKz0gZXNjYXBlKG1hdGNoWzBdKTtcbiAgICAgICAgfVxuICAgICAgICBsYXN0X2luZGV4ID0gdG9wLmxleGVtZXNSZS5sYXN0SW5kZXg7XG4gICAgICAgIG1hdGNoID0gdG9wLmxleGVtZXNSZS5leGVjKG1vZGVfYnVmZmVyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQgKyBlc2NhcGUobW9kZV9idWZmZXIuc3Vic3RyKGxhc3RfaW5kZXgpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzU3ViTGFuZ3VhZ2UoKSB7XG4gICAgICB2YXIgZXhwbGljaXQgPSB0eXBlb2YgdG9wLnN1Ykxhbmd1YWdlID09PSAnc3RyaW5nJztcbiAgICAgIGlmIChleHBsaWNpdCAmJiAhbGFuZ3VhZ2VzW3RvcC5zdWJMYW5ndWFnZV0pIHtcbiAgICAgICAgcmV0dXJuIGVzY2FwZShtb2RlX2J1ZmZlcik7XG4gICAgICB9XG5cbiAgICAgIHZhciByZXN1bHQgPSBleHBsaWNpdCA/XG4gICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0KHRvcC5zdWJMYW5ndWFnZSwgbW9kZV9idWZmZXIsIHRydWUsIGNvbnRpbnVhdGlvbnNbdG9wLnN1Ykxhbmd1YWdlXSkgOlxuICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodEF1dG8obW9kZV9idWZmZXIsIHRvcC5zdWJMYW5ndWFnZS5sZW5ndGggPyB0b3Auc3ViTGFuZ3VhZ2UgOiB1bmRlZmluZWQpO1xuXG4gICAgICAvLyBDb3VudGluZyBlbWJlZGRlZCBsYW5ndWFnZSBzY29yZSB0b3dhcmRzIHRoZSBob3N0IGxhbmd1YWdlIG1heSBiZSBkaXNhYmxlZFxuICAgICAgLy8gd2l0aCB6ZXJvaW5nIHRoZSBjb250YWluaW5nIG1vZGUgcmVsZXZhbmNlLiBVc2VjYXNlIGluIHBvaW50IGlzIE1hcmtkb3duIHRoYXRcbiAgICAgIC8vIGFsbG93cyBYTUwgZXZlcnl3aGVyZSBhbmQgbWFrZXMgZXZlcnkgWE1MIHNuaXBwZXQgdG8gaGF2ZSBhIG11Y2ggbGFyZ2VyIE1hcmtkb3duXG4gICAgICAvLyBzY29yZS5cbiAgICAgIGlmICh0b3AucmVsZXZhbmNlID4gMCkge1xuICAgICAgICByZWxldmFuY2UgKz0gcmVzdWx0LnJlbGV2YW5jZTtcbiAgICAgIH1cbiAgICAgIGlmIChleHBsaWNpdCkge1xuICAgICAgICBjb250aW51YXRpb25zW3RvcC5zdWJMYW5ndWFnZV0gPSByZXN1bHQudG9wO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJ1aWxkU3BhbihyZXN1bHQubGFuZ3VhZ2UsIHJlc3VsdC52YWx1ZSwgZmFsc2UsIHRydWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NCdWZmZXIoKSB7XG4gICAgICByZXN1bHQgKz0gKHRvcC5zdWJMYW5ndWFnZSAhPSBudWxsID8gcHJvY2Vzc1N1Ykxhbmd1YWdlKCkgOiBwcm9jZXNzS2V5d29yZHMoKSk7XG4gICAgICBtb2RlX2J1ZmZlciA9ICcnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YXJ0TmV3TW9kZShtb2RlKSB7XG4gICAgICByZXN1bHQgKz0gbW9kZS5jbGFzc05hbWU/IGJ1aWxkU3Bhbihtb2RlLmNsYXNzTmFtZSwgJycsIHRydWUpOiAnJztcbiAgICAgIHRvcCA9IE9iamVjdC5jcmVhdGUobW9kZSwge3BhcmVudDoge3ZhbHVlOiB0b3B9fSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0xleGVtZShidWZmZXIsIGxleGVtZSkge1xuXG4gICAgICBtb2RlX2J1ZmZlciArPSBidWZmZXI7XG5cbiAgICAgIGlmIChsZXhlbWUgPT0gbnVsbCkge1xuICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuXG4gICAgICB2YXIgbmV3X21vZGUgPSBzdWJNb2RlKGxleGVtZSwgdG9wKTtcbiAgICAgIGlmIChuZXdfbW9kZSkge1xuICAgICAgICBpZiAobmV3X21vZGUuc2tpcCkge1xuICAgICAgICAgIG1vZGVfYnVmZmVyICs9IGxleGVtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAobmV3X21vZGUuZXhjbHVkZUJlZ2luKSB7XG4gICAgICAgICAgICBtb2RlX2J1ZmZlciArPSBsZXhlbWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb2Nlc3NCdWZmZXIoKTtcbiAgICAgICAgICBpZiAoIW5ld19tb2RlLnJldHVybkJlZ2luICYmICFuZXdfbW9kZS5leGNsdWRlQmVnaW4pIHtcbiAgICAgICAgICAgIG1vZGVfYnVmZmVyID0gbGV4ZW1lO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGFydE5ld01vZGUobmV3X21vZGUsIGxleGVtZSk7XG4gICAgICAgIHJldHVybiBuZXdfbW9kZS5yZXR1cm5CZWdpbiA/IDAgOiBsZXhlbWUubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICB2YXIgZW5kX21vZGUgPSBlbmRPZk1vZGUodG9wLCBsZXhlbWUpO1xuICAgICAgaWYgKGVuZF9tb2RlKSB7XG4gICAgICAgIHZhciBvcmlnaW4gPSB0b3A7XG4gICAgICAgIGlmIChvcmlnaW4uc2tpcCkge1xuICAgICAgICAgIG1vZGVfYnVmZmVyICs9IGxleGVtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIShvcmlnaW4ucmV0dXJuRW5kIHx8IG9yaWdpbi5leGNsdWRlRW5kKSkge1xuICAgICAgICAgICAgbW9kZV9idWZmZXIgKz0gbGV4ZW1lO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgICAgaWYgKG9yaWdpbi5leGNsdWRlRW5kKSB7XG4gICAgICAgICAgICBtb2RlX2J1ZmZlciA9IGxleGVtZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZG8ge1xuICAgICAgICAgIGlmICh0b3AuY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gc3BhbkVuZFRhZztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCF0b3Auc2tpcCkge1xuICAgICAgICAgICAgcmVsZXZhbmNlICs9IHRvcC5yZWxldmFuY2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRvcCA9IHRvcC5wYXJlbnQ7XG4gICAgICAgIH0gd2hpbGUgKHRvcCAhPT0gZW5kX21vZGUucGFyZW50KTtcbiAgICAgICAgaWYgKGVuZF9tb2RlLnN0YXJ0cykge1xuICAgICAgICAgIHN0YXJ0TmV3TW9kZShlbmRfbW9kZS5zdGFydHMsICcnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3JpZ2luLnJldHVybkVuZCA/IDAgOiBsZXhlbWUubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNJbGxlZ2FsKGxleGVtZSwgdG9wKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIGxleGVtZSBcIicgKyBsZXhlbWUgKyAnXCIgZm9yIG1vZGUgXCInICsgKHRvcC5jbGFzc05hbWUgfHwgJzx1bm5hbWVkPicpICsgJ1wiJyk7XG5cbiAgICAgIC8qXG4gICAgICBQYXJzZXIgc2hvdWxkIG5vdCByZWFjaCB0aGlzIHBvaW50IGFzIGFsbCB0eXBlcyBvZiBsZXhlbWVzIHNob3VsZCBiZSBjYXVnaHRcbiAgICAgIGVhcmxpZXIsIGJ1dCBpZiBpdCBkb2VzIGR1ZSB0byBzb21lIGJ1ZyBtYWtlIHN1cmUgaXQgYWR2YW5jZXMgYXQgbGVhc3Qgb25lXG4gICAgICBjaGFyYWN0ZXIgZm9yd2FyZCB0byBwcmV2ZW50IGluZmluaXRlIGxvb3BpbmcuXG4gICAgICAqL1xuICAgICAgbW9kZV9idWZmZXIgKz0gbGV4ZW1lO1xuICAgICAgcmV0dXJuIGxleGVtZS5sZW5ndGggfHwgMTtcbiAgICB9XG5cbiAgICB2YXIgbGFuZ3VhZ2UgPSBnZXRMYW5ndWFnZShuYW1lKTtcbiAgICBpZiAoIWxhbmd1YWdlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGFuZ3VhZ2U6IFwiJyArIG5hbWUgKyAnXCInKTtcbiAgICB9XG5cbiAgICBjb21waWxlTGFuZ3VhZ2UobGFuZ3VhZ2UpO1xuICAgIHZhciB0b3AgPSBjb250aW51YXRpb24gfHwgbGFuZ3VhZ2U7XG4gICAgdmFyIGNvbnRpbnVhdGlvbnMgPSB7fTsgLy8ga2VlcCBjb250aW51YXRpb25zIGZvciBzdWItbGFuZ3VhZ2VzXG4gICAgdmFyIHJlc3VsdCA9ICcnLCBjdXJyZW50O1xuICAgIGZvcihjdXJyZW50ID0gdG9wOyBjdXJyZW50ICE9PSBsYW5ndWFnZTsgY3VycmVudCA9IGN1cnJlbnQucGFyZW50KSB7XG4gICAgICBpZiAoY3VycmVudC5jbGFzc05hbWUpIHtcbiAgICAgICAgcmVzdWx0ID0gYnVpbGRTcGFuKGN1cnJlbnQuY2xhc3NOYW1lLCAnJywgdHJ1ZSkgKyByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBtb2RlX2J1ZmZlciA9ICcnO1xuICAgIHZhciByZWxldmFuY2UgPSAwO1xuICAgIHRyeSB7XG4gICAgICB2YXIgbWF0Y2gsIGNvdW50LCBpbmRleCA9IDA7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICB0b3AudGVybWluYXRvcnMubGFzdEluZGV4ID0gaW5kZXg7XG4gICAgICAgIG1hdGNoID0gdG9wLnRlcm1pbmF0b3JzLmV4ZWModmFsdWUpO1xuICAgICAgICBpZiAoIW1hdGNoKVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjb3VudCA9IHByb2Nlc3NMZXhlbWUodmFsdWUuc3Vic3RyaW5nKGluZGV4LCBtYXRjaC5pbmRleCksIG1hdGNoWzBdKTtcbiAgICAgICAgaW5kZXggPSBtYXRjaC5pbmRleCArIGNvdW50O1xuICAgICAgfVxuICAgICAgcHJvY2Vzc0xleGVtZSh2YWx1ZS5zdWJzdHIoaW5kZXgpKTtcbiAgICAgIGZvcihjdXJyZW50ID0gdG9wOyBjdXJyZW50LnBhcmVudDsgY3VycmVudCA9IGN1cnJlbnQucGFyZW50KSB7IC8vIGNsb3NlIGRhbmdsaW5nIG1vZGVzXG4gICAgICAgIGlmIChjdXJyZW50LmNsYXNzTmFtZSkge1xuICAgICAgICAgIHJlc3VsdCArPSBzcGFuRW5kVGFnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWxldmFuY2U6IHJlbGV2YW5jZSxcbiAgICAgICAgdmFsdWU6IHJlc3VsdCxcbiAgICAgICAgbGFuZ3VhZ2U6IG5hbWUsXG4gICAgICAgIHRvcDogdG9wXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLm1lc3NhZ2UgJiYgZS5tZXNzYWdlLmluZGV4T2YoJ0lsbGVnYWwnKSAhPT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZWxldmFuY2U6IDAsXG4gICAgICAgICAgdmFsdWU6IGVzY2FwZSh2YWx1ZSlcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLypcbiAgSGlnaGxpZ2h0aW5nIHdpdGggbGFuZ3VhZ2UgZGV0ZWN0aW9uLiBBY2NlcHRzIGEgc3RyaW5nIHdpdGggdGhlIGNvZGUgdG9cbiAgaGlnaGxpZ2h0LiBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcblxuICAtIGxhbmd1YWdlIChkZXRlY3RlZCBsYW5ndWFnZSlcbiAgLSByZWxldmFuY2UgKGludClcbiAgLSB2YWx1ZSAoYW4gSFRNTCBzdHJpbmcgd2l0aCBoaWdobGlnaHRpbmcgbWFya3VwKVxuICAtIHNlY29uZF9iZXN0IChvYmplY3Qgd2l0aCB0aGUgc2FtZSBzdHJ1Y3R1cmUgZm9yIHNlY29uZC1iZXN0IGhldXJpc3RpY2FsbHlcbiAgICBkZXRlY3RlZCBsYW5ndWFnZSwgbWF5IGJlIGFic2VudClcblxuICAqL1xuICBmdW5jdGlvbiBoaWdobGlnaHRBdXRvKHRleHQsIGxhbmd1YWdlU3Vic2V0KSB7XG4gICAgbGFuZ3VhZ2VTdWJzZXQgPSBsYW5ndWFnZVN1YnNldCB8fCBvcHRpb25zLmxhbmd1YWdlcyB8fCBvYmplY3RLZXlzKGxhbmd1YWdlcyk7XG4gICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgIHZhbHVlOiBlc2NhcGUodGV4dClcbiAgICB9O1xuICAgIHZhciBzZWNvbmRfYmVzdCA9IHJlc3VsdDtcbiAgICBsYW5ndWFnZVN1YnNldC5maWx0ZXIoZ2V0TGFuZ3VhZ2UpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIGN1cnJlbnQgPSBoaWdobGlnaHQobmFtZSwgdGV4dCwgZmFsc2UpO1xuICAgICAgY3VycmVudC5sYW5ndWFnZSA9IG5hbWU7XG4gICAgICBpZiAoY3VycmVudC5yZWxldmFuY2UgPiBzZWNvbmRfYmVzdC5yZWxldmFuY2UpIHtcbiAgICAgICAgc2Vjb25kX2Jlc3QgPSBjdXJyZW50O1xuICAgICAgfVxuICAgICAgaWYgKGN1cnJlbnQucmVsZXZhbmNlID4gcmVzdWx0LnJlbGV2YW5jZSkge1xuICAgICAgICBzZWNvbmRfYmVzdCA9IHJlc3VsdDtcbiAgICAgICAgcmVzdWx0ID0gY3VycmVudDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoc2Vjb25kX2Jlc3QubGFuZ3VhZ2UpIHtcbiAgICAgIHJlc3VsdC5zZWNvbmRfYmVzdCA9IHNlY29uZF9iZXN0O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLypcbiAgUG9zdC1wcm9jZXNzaW5nIG9mIHRoZSBoaWdobGlnaHRlZCBtYXJrdXA6XG5cbiAgLSByZXBsYWNlIFRBQnMgd2l0aCBzb21ldGhpbmcgbW9yZSB1c2VmdWxcbiAgLSByZXBsYWNlIHJlYWwgbGluZS1icmVha3Mgd2l0aCAnPGJyPicgZm9yIG5vbi1wcmUgY29udGFpbmVyc1xuXG4gICovXG4gIGZ1bmN0aW9uIGZpeE1hcmt1cCh2YWx1ZSkge1xuICAgIHJldHVybiAhKG9wdGlvbnMudGFiUmVwbGFjZSB8fCBvcHRpb25zLnVzZUJSKVxuICAgICAgPyB2YWx1ZVxuICAgICAgOiB2YWx1ZS5yZXBsYWNlKGZpeE1hcmt1cFJlLCBmdW5jdGlvbihtYXRjaCwgcDEpIHtcbiAgICAgICAgICBpZiAob3B0aW9ucy51c2VCUiAmJiBtYXRjaCA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgIHJldHVybiAnPGJyPic7XG4gICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnRhYlJlcGxhY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBwMS5yZXBsYWNlKC9cXHQvZywgb3B0aW9ucy50YWJSZXBsYWNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBidWlsZENsYXNzTmFtZShwcmV2Q2xhc3NOYW1lLCBjdXJyZW50TGFuZywgcmVzdWx0TGFuZykge1xuICAgIHZhciBsYW5ndWFnZSA9IGN1cnJlbnRMYW5nID8gYWxpYXNlc1tjdXJyZW50TGFuZ10gOiByZXN1bHRMYW5nLFxuICAgICAgICByZXN1bHQgICA9IFtwcmV2Q2xhc3NOYW1lLnRyaW0oKV07XG5cbiAgICBpZiAoIXByZXZDbGFzc05hbWUubWF0Y2goL1xcYmhsanNcXGIvKSkge1xuICAgICAgcmVzdWx0LnB1c2goJ2hsanMnKTtcbiAgICB9XG5cbiAgICBpZiAocHJldkNsYXNzTmFtZS5pbmRleE9mKGxhbmd1YWdlKSA9PT0gLTEpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGxhbmd1YWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0LmpvaW4oJyAnKS50cmltKCk7XG4gIH1cblxuICAvKlxuICBBcHBsaWVzIGhpZ2hsaWdodGluZyB0byBhIERPTSBub2RlIGNvbnRhaW5pbmcgY29kZS4gQWNjZXB0cyBhIERPTSBub2RlIGFuZFxuICB0d28gb3B0aW9uYWwgcGFyYW1ldGVycyBmb3IgZml4TWFya3VwLlxuICAqL1xuICBmdW5jdGlvbiBoaWdobGlnaHRCbG9jayhibG9jaykge1xuICAgIHZhciBub2RlLCBvcmlnaW5hbFN0cmVhbSwgcmVzdWx0LCByZXN1bHROb2RlLCB0ZXh0O1xuICAgIHZhciBsYW5ndWFnZSA9IGJsb2NrTGFuZ3VhZ2UoYmxvY2spO1xuXG4gICAgaWYgKGlzTm90SGlnaGxpZ2h0ZWQobGFuZ3VhZ2UpKVxuICAgICAgICByZXR1cm47XG5cbiAgICBpZiAob3B0aW9ucy51c2VCUikge1xuICAgICAgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCcsICdkaXYnKTtcbiAgICAgIG5vZGUuaW5uZXJIVE1MID0gYmxvY2suaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnJykucmVwbGFjZSgvPGJyWyBcXC9dKj4vZywgJ1xcbicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlID0gYmxvY2s7XG4gICAgfVxuICAgIHRleHQgPSBub2RlLnRleHRDb250ZW50O1xuICAgIHJlc3VsdCA9IGxhbmd1YWdlID8gaGlnaGxpZ2h0KGxhbmd1YWdlLCB0ZXh0LCB0cnVlKSA6IGhpZ2hsaWdodEF1dG8odGV4dCk7XG5cbiAgICBvcmlnaW5hbFN0cmVhbSA9IG5vZGVTdHJlYW0obm9kZSk7XG4gICAgaWYgKG9yaWdpbmFsU3RyZWFtLmxlbmd0aCkge1xuICAgICAgcmVzdWx0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCcsICdkaXYnKTtcbiAgICAgIHJlc3VsdE5vZGUuaW5uZXJIVE1MID0gcmVzdWx0LnZhbHVlO1xuICAgICAgcmVzdWx0LnZhbHVlID0gbWVyZ2VTdHJlYW1zKG9yaWdpbmFsU3RyZWFtLCBub2RlU3RyZWFtKHJlc3VsdE5vZGUpLCB0ZXh0KTtcbiAgICB9XG4gICAgcmVzdWx0LnZhbHVlID0gZml4TWFya3VwKHJlc3VsdC52YWx1ZSk7XG5cbiAgICBibG9jay5pbm5lckhUTUwgPSByZXN1bHQudmFsdWU7XG4gICAgYmxvY2suY2xhc3NOYW1lID0gYnVpbGRDbGFzc05hbWUoYmxvY2suY2xhc3NOYW1lLCBsYW5ndWFnZSwgcmVzdWx0Lmxhbmd1YWdlKTtcbiAgICBibG9jay5yZXN1bHQgPSB7XG4gICAgICBsYW5ndWFnZTogcmVzdWx0Lmxhbmd1YWdlLFxuICAgICAgcmU6IHJlc3VsdC5yZWxldmFuY2VcbiAgICB9O1xuICAgIGlmIChyZXN1bHQuc2Vjb25kX2Jlc3QpIHtcbiAgICAgIGJsb2NrLnNlY29uZF9iZXN0ID0ge1xuICAgICAgICBsYW5ndWFnZTogcmVzdWx0LnNlY29uZF9iZXN0Lmxhbmd1YWdlLFxuICAgICAgICByZTogcmVzdWx0LnNlY29uZF9iZXN0LnJlbGV2YW5jZVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKlxuICBVcGRhdGVzIGhpZ2hsaWdodC5qcyBnbG9iYWwgb3B0aW9ucyB3aXRoIHZhbHVlcyBwYXNzZWQgaW4gdGhlIGZvcm0gb2YgYW4gb2JqZWN0LlxuICAqL1xuICBmdW5jdGlvbiBjb25maWd1cmUodXNlcl9vcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IGluaGVyaXQob3B0aW9ucywgdXNlcl9vcHRpb25zKTtcbiAgfVxuXG4gIC8qXG4gIEFwcGxpZXMgaGlnaGxpZ2h0aW5nIHRvIGFsbCA8cHJlPjxjb2RlPi4uPC9jb2RlPjwvcHJlPiBibG9ja3Mgb24gYSBwYWdlLlxuICAqL1xuICBmdW5jdGlvbiBpbml0SGlnaGxpZ2h0aW5nKCkge1xuICAgIGlmIChpbml0SGlnaGxpZ2h0aW5nLmNhbGxlZClcbiAgICAgIHJldHVybjtcbiAgICBpbml0SGlnaGxpZ2h0aW5nLmNhbGxlZCA9IHRydWU7XG5cbiAgICB2YXIgYmxvY2tzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgncHJlIGNvZGUnKTtcbiAgICBBcnJheVByb3RvLmZvckVhY2guY2FsbChibG9ja3MsIGhpZ2hsaWdodEJsb2NrKTtcbiAgfVxuXG4gIC8qXG4gIEF0dGFjaGVzIGhpZ2hsaWdodGluZyB0byB0aGUgcGFnZSBsb2FkIGV2ZW50LlxuICAqL1xuICBmdW5jdGlvbiBpbml0SGlnaGxpZ2h0aW5nT25Mb2FkKCkge1xuICAgIGFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBpbml0SGlnaGxpZ2h0aW5nLCBmYWxzZSk7XG4gICAgYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGluaXRIaWdobGlnaHRpbmcsIGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyTGFuZ3VhZ2UobmFtZSwgbGFuZ3VhZ2UpIHtcbiAgICB2YXIgbGFuZyA9IGxhbmd1YWdlc1tuYW1lXSA9IGxhbmd1YWdlKGhsanMpO1xuICAgIGlmIChsYW5nLmFsaWFzZXMpIHtcbiAgICAgIGxhbmcuYWxpYXNlcy5mb3JFYWNoKGZ1bmN0aW9uKGFsaWFzKSB7YWxpYXNlc1thbGlhc10gPSBuYW1lO30pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxpc3RMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIG9iamVjdEtleXMobGFuZ3VhZ2VzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldExhbmd1YWdlKG5hbWUpIHtcbiAgICBuYW1lID0gKG5hbWUgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgcmV0dXJuIGxhbmd1YWdlc1tuYW1lXSB8fCBsYW5ndWFnZXNbYWxpYXNlc1tuYW1lXV07XG4gIH1cblxuICAvKiBJbnRlcmZhY2UgZGVmaW5pdGlvbiAqL1xuXG4gIGhsanMuaGlnaGxpZ2h0ID0gaGlnaGxpZ2h0O1xuICBobGpzLmhpZ2hsaWdodEF1dG8gPSBoaWdobGlnaHRBdXRvO1xuICBobGpzLmZpeE1hcmt1cCA9IGZpeE1hcmt1cDtcbiAgaGxqcy5oaWdobGlnaHRCbG9jayA9IGhpZ2hsaWdodEJsb2NrO1xuICBobGpzLmNvbmZpZ3VyZSA9IGNvbmZpZ3VyZTtcbiAgaGxqcy5pbml0SGlnaGxpZ2h0aW5nID0gaW5pdEhpZ2hsaWdodGluZztcbiAgaGxqcy5pbml0SGlnaGxpZ2h0aW5nT25Mb2FkID0gaW5pdEhpZ2hsaWdodGluZ09uTG9hZDtcbiAgaGxqcy5yZWdpc3Rlckxhbmd1YWdlID0gcmVnaXN0ZXJMYW5ndWFnZTtcbiAgaGxqcy5saXN0TGFuZ3VhZ2VzID0gbGlzdExhbmd1YWdlcztcbiAgaGxqcy5nZXRMYW5ndWFnZSA9IGdldExhbmd1YWdlO1xuICBobGpzLmluaGVyaXQgPSBpbmhlcml0O1xuXG4gIC8vIENvbW1vbiByZWdleHBzXG4gIGhsanMuSURFTlRfUkUgPSAnW2EtekEtWl1cXFxcdyonO1xuICBobGpzLlVOREVSU0NPUkVfSURFTlRfUkUgPSAnW2EtekEtWl9dXFxcXHcqJztcbiAgaGxqcy5OVU1CRVJfUkUgPSAnXFxcXGJcXFxcZCsoXFxcXC5cXFxcZCspPyc7XG4gIGhsanMuQ19OVU1CRVJfUkUgPSAnKC0/KShcXFxcYjBbeFhdW2EtZkEtRjAtOV0rfChcXFxcYlxcXFxkKyhcXFxcLlxcXFxkKik/fFxcXFwuXFxcXGQrKShbZUVdWy0rXT9cXFxcZCspPyknOyAvLyAweC4uLiwgMC4uLiwgZGVjaW1hbCwgZmxvYXRcbiAgaGxqcy5CSU5BUllfTlVNQkVSX1JFID0gJ1xcXFxiKDBiWzAxXSspJzsgLy8gMGIuLi5cbiAgaGxqcy5SRV9TVEFSVEVSU19SRSA9ICchfCE9fCE9PXwlfCU9fCZ8JiZ8Jj18XFxcXCp8XFxcXCo9fFxcXFwrfFxcXFwrPXwsfC18LT18Lz18L3w6fDt8PDx8PDw9fDw9fDx8PT09fD09fD18Pj4+PXw+Pj18Pj18Pj4+fD4+fD58XFxcXD98XFxcXFt8XFxcXHt8XFxcXCh8XFxcXF58XFxcXF49fFxcXFx8fFxcXFx8PXxcXFxcfFxcXFx8fH4nO1xuXG4gIC8vIENvbW1vbiBtb2Rlc1xuICBobGpzLkJBQ0tTTEFTSF9FU0NBUEUgPSB7XG4gICAgYmVnaW46ICdcXFxcXFxcXFtcXFxcc1xcXFxTXScsIHJlbGV2YW5jZTogMFxuICB9O1xuICBobGpzLkFQT1NfU1RSSU5HX01PREUgPSB7XG4gICAgY2xhc3NOYW1lOiAnc3RyaW5nJyxcbiAgICBiZWdpbjogJ1xcJycsIGVuZDogJ1xcJycsXG4gICAgaWxsZWdhbDogJ1xcXFxuJyxcbiAgICBjb250YWluczogW2hsanMuQkFDS1NMQVNIX0VTQ0FQRV1cbiAgfTtcbiAgaGxqcy5RVU9URV9TVFJJTkdfTU9ERSA9IHtcbiAgICBjbGFzc05hbWU6ICdzdHJpbmcnLFxuICAgIGJlZ2luOiAnXCInLCBlbmQ6ICdcIicsXG4gICAgaWxsZWdhbDogJ1xcXFxuJyxcbiAgICBjb250YWluczogW2hsanMuQkFDS1NMQVNIX0VTQ0FQRV1cbiAgfTtcbiAgaGxqcy5QSFJBU0FMX1dPUkRTX01PREUgPSB7XG4gICAgYmVnaW46IC9cXGIoYXxhbnx0aGV8YXJlfEknbXxpc24ndHxkb24ndHxkb2Vzbid0fHdvbid0fGJ1dHxqdXN0fHNob3VsZHxwcmV0dHl8c2ltcGx5fGVub3VnaHxnb25uYXxnb2luZ3x3dGZ8c298c3VjaHx3aWxsfHlvdXx5b3VyfHRoZXl8bGlrZXxtb3JlKVxcYi9cbiAgfTtcbiAgaGxqcy5DT01NRU5UID0gZnVuY3Rpb24gKGJlZ2luLCBlbmQsIGluaGVyaXRzKSB7XG4gICAgdmFyIG1vZGUgPSBobGpzLmluaGVyaXQoXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ2NvbW1lbnQnLFxuICAgICAgICBiZWdpbjogYmVnaW4sIGVuZDogZW5kLFxuICAgICAgICBjb250YWluczogW11cbiAgICAgIH0sXG4gICAgICBpbmhlcml0cyB8fCB7fVxuICAgICk7XG4gICAgbW9kZS5jb250YWlucy5wdXNoKGhsanMuUEhSQVNBTF9XT1JEU19NT0RFKTtcbiAgICBtb2RlLmNvbnRhaW5zLnB1c2goe1xuICAgICAgY2xhc3NOYW1lOiAnZG9jdGFnJyxcbiAgICAgIGJlZ2luOiAnKD86VE9ET3xGSVhNRXxOT1RFfEJVR3xYWFgpOicsXG4gICAgICByZWxldmFuY2U6IDBcbiAgICB9KTtcbiAgICByZXR1cm4gbW9kZTtcbiAgfTtcbiAgaGxqcy5DX0xJTkVfQ09NTUVOVF9NT0RFID0gaGxqcy5DT01NRU5UKCcvLycsICckJyk7XG4gIGhsanMuQ19CTE9DS19DT01NRU5UX01PREUgPSBobGpzLkNPTU1FTlQoJy9cXFxcKicsICdcXFxcKi8nKTtcbiAgaGxqcy5IQVNIX0NPTU1FTlRfTU9ERSA9IGhsanMuQ09NTUVOVCgnIycsICckJyk7XG4gIGhsanMuTlVNQkVSX01PREUgPSB7XG4gICAgY2xhc3NOYW1lOiAnbnVtYmVyJyxcbiAgICBiZWdpbjogaGxqcy5OVU1CRVJfUkUsXG4gICAgcmVsZXZhbmNlOiAwXG4gIH07XG4gIGhsanMuQ19OVU1CRVJfTU9ERSA9IHtcbiAgICBjbGFzc05hbWU6ICdudW1iZXInLFxuICAgIGJlZ2luOiBobGpzLkNfTlVNQkVSX1JFLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuICBobGpzLkJJTkFSWV9OVU1CRVJfTU9ERSA9IHtcbiAgICBjbGFzc05hbWU6ICdudW1iZXInLFxuICAgIGJlZ2luOiBobGpzLkJJTkFSWV9OVU1CRVJfUkUsXG4gICAgcmVsZXZhbmNlOiAwXG4gIH07XG4gIGhsanMuQ1NTX05VTUJFUl9NT0RFID0ge1xuICAgIGNsYXNzTmFtZTogJ251bWJlcicsXG4gICAgYmVnaW46IGhsanMuTlVNQkVSX1JFICsgJygnICtcbiAgICAgICclfGVtfGV4fGNofHJlbScgICtcbiAgICAgICd8dnd8dmh8dm1pbnx2bWF4JyArXG4gICAgICAnfGNtfG1tfGlufHB0fHBjfHB4JyArXG4gICAgICAnfGRlZ3xncmFkfHJhZHx0dXJuJyArXG4gICAgICAnfHN8bXMnICtcbiAgICAgICd8SHp8a0h6JyArXG4gICAgICAnfGRwaXxkcGNtfGRwcHgnICtcbiAgICAgICcpPycsXG4gICAgcmVsZXZhbmNlOiAwXG4gIH07XG4gIGhsanMuUkVHRVhQX01PREUgPSB7XG4gICAgY2xhc3NOYW1lOiAncmVnZXhwJyxcbiAgICBiZWdpbjogL1xcLy8sIGVuZDogL1xcL1tnaW11eV0qLyxcbiAgICBpbGxlZ2FsOiAvXFxuLyxcbiAgICBjb250YWluczogW1xuICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAge1xuICAgICAgICBiZWdpbjogL1xcWy8sIGVuZDogL1xcXS8sXG4gICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgY29udGFpbnM6IFtobGpzLkJBQ0tTTEFTSF9FU0NBUEVdXG4gICAgICB9XG4gICAgXVxuICB9O1xuICBobGpzLlRJVExFX01PREUgPSB7XG4gICAgY2xhc3NOYW1lOiAndGl0bGUnLFxuICAgIGJlZ2luOiBobGpzLklERU5UX1JFLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuICBobGpzLlVOREVSU0NPUkVfVElUTEVfTU9ERSA9IHtcbiAgICBjbGFzc05hbWU6ICd0aXRsZScsXG4gICAgYmVnaW46IGhsanMuVU5ERVJTQ09SRV9JREVOVF9SRSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcbiAgaGxqcy5NRVRIT0RfR1VBUkQgPSB7XG4gICAgLy8gZXhjbHVkZXMgbWV0aG9kIG5hbWVzIGZyb20ga2V5d29yZCBwcm9jZXNzaW5nXG4gICAgYmVnaW46ICdcXFxcLlxcXFxzKicgKyBobGpzLlVOREVSU0NPUkVfSURFTlRfUkUsXG4gICAgcmVsZXZhbmNlOiAwXG4gIH07XG5cbiAgcmV0dXJuIGhsanM7XG59KSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGhsanMpIHtcbiAgcmV0dXJuIHtcbiAgICBhbGlhc2VzOiBbJ2Fkb2MnXSxcbiAgICBjb250YWluczogW1xuICAgICAgLy8gYmxvY2sgY29tbWVudFxuICAgICAgaGxqcy5DT01NRU5UKFxuICAgICAgICAnXi97NCx9XFxcXG4nLFxuICAgICAgICAnXFxcXG4vezQsfSQnLFxuICAgICAgICAvLyBjYW4gYWxzbyBiZSBkb25lIGFzLi4uXG4gICAgICAgIC8vJ14vezQsfSQnLFxuICAgICAgICAvLydeL3s0LH0kJyxcbiAgICAgICAge1xuICAgICAgICAgIHJlbGV2YW5jZTogMTBcbiAgICAgICAgfVxuICAgICAgKSxcbiAgICAgIC8vIGxpbmUgY29tbWVudFxuICAgICAgaGxqcy5DT01NRU5UKFxuICAgICAgICAnXi8vJyxcbiAgICAgICAgJyQnLFxuICAgICAgICB7XG4gICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICAvLyB0aXRsZVxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICd0aXRsZScsXG4gICAgICAgIGJlZ2luOiAnXlxcXFwuXFxcXHcuKiQnXG4gICAgICB9LFxuICAgICAgLy8gZXhhbXBsZSwgYWRtb25pdGlvbiAmIHNpZGViYXIgYmxvY2tzXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAnXls9XFxcXCpdezQsfVxcXFxuJyxcbiAgICAgICAgZW5kOiAnXFxcXG5eWz1cXFxcKl17NCx9JCcsXG4gICAgICAgIHJlbGV2YW5jZTogMTBcbiAgICAgIH0sXG4gICAgICAvLyBoZWFkaW5nc1xuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdzZWN0aW9uJyxcbiAgICAgICAgcmVsZXZhbmNlOiAxMCxcbiAgICAgICAgdmFyaWFudHM6IFtcbiAgICAgICAgICB7YmVnaW46ICdeKD17MSw1fSkgLis/KCBcXFxcMSk/JCd9LFxuICAgICAgICAgIHtiZWdpbjogJ15bXlxcXFxbXFxcXF1cXFxcbl0rP1xcXFxuWz1cXFxcLX5cXFxcXlxcXFwrXXsyLH0kJ30sXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICAvLyBkb2N1bWVudCBhdHRyaWJ1dGVzXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ21ldGEnLFxuICAgICAgICBiZWdpbjogJ146Lis/OicsXG4gICAgICAgIGVuZDogJ1xcXFxzJyxcbiAgICAgICAgZXhjbHVkZUVuZDogdHJ1ZSxcbiAgICAgICAgcmVsZXZhbmNlOiAxMFxuICAgICAgfSxcbiAgICAgIC8vIGJsb2NrIGF0dHJpYnV0ZXNcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnbWV0YScsXG4gICAgICAgIGJlZ2luOiAnXlxcXFxbLis/XFxcXF0kJyxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgLy8gcXVvdGVibG9ja3NcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAncXVvdGUnLFxuICAgICAgICBiZWdpbjogJ15fezQsfVxcXFxuJyxcbiAgICAgICAgZW5kOiAnXFxcXG5fezQsfSQnLFxuICAgICAgICByZWxldmFuY2U6IDEwXG4gICAgICB9LFxuICAgICAgLy8gbGlzdGluZyBhbmQgbGl0ZXJhbCBibG9ja3NcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnY29kZScsXG4gICAgICAgIGJlZ2luOiAnXltcXFxcLVxcXFwuXXs0LH1cXFxcbicsXG4gICAgICAgIGVuZDogJ1xcXFxuW1xcXFwtXFxcXC5dezQsfSQnLFxuICAgICAgICByZWxldmFuY2U6IDEwXG4gICAgICB9LFxuICAgICAgLy8gcGFzc3Rocm91Z2ggYmxvY2tzXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAnXlxcXFwrezQsfVxcXFxuJyxcbiAgICAgICAgZW5kOiAnXFxcXG5cXFxcK3s0LH0kJyxcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBiZWdpbjogJzwnLCBlbmQ6ICc+JyxcbiAgICAgICAgICAgIHN1Ykxhbmd1YWdlOiAneG1sJyxcbiAgICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgcmVsZXZhbmNlOiAxMFxuICAgICAgfSxcbiAgICAgIC8vIGxpc3RzIChjYW4gb25seSBjYXB0dXJlIGluZGljYXRvcnMpXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ2J1bGxldCcsXG4gICAgICAgIGJlZ2luOiAnXihcXFxcKit8XFxcXC0rfFxcXFwuK3xbXlxcXFxuXSs/OjopXFxcXHMrJ1xuICAgICAgfSxcbiAgICAgIC8vIGFkbW9uaXRpb25cbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnc3ltYm9sJyxcbiAgICAgICAgYmVnaW46ICdeKE5PVEV8VElQfElNUE9SVEFOVHxXQVJOSU5HfENBVVRJT04pOlxcXFxzKycsXG4gICAgICAgIHJlbGV2YW5jZTogMTBcbiAgICAgIH0sXG4gICAgICAvLyBpbmxpbmUgc3Ryb25nXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3N0cm9uZycsXG4gICAgICAgIC8vIG11c3Qgbm90IGZvbGxvdyBhIHdvcmQgY2hhcmFjdGVyIG9yIGJlIGZvbGxvd2VkIGJ5IGFuIGFzdGVyaXNrIG9yIHNwYWNlXG4gICAgICAgIGJlZ2luOiAnXFxcXEJcXFxcKig/IVtcXFxcKlxcXFxzXSknLFxuICAgICAgICBlbmQ6ICcoXFxcXG57Mn18XFxcXCopJyxcbiAgICAgICAgLy8gYWxsb3cgZXNjYXBlZCBhc3RlcmlzayBmb2xsb3dlZCBieSB3b3JkIGNoYXJcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBiZWdpbjogJ1xcXFxcXFxcKlxcXFx3JyxcbiAgICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIC8vIGlubGluZSBlbXBoYXNpc1xuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdlbXBoYXNpcycsXG4gICAgICAgIC8vIG11c3Qgbm90IGZvbGxvdyBhIHdvcmQgY2hhcmFjdGVyIG9yIGJlIGZvbGxvd2VkIGJ5IGEgc2luZ2xlIHF1b3RlIG9yIHNwYWNlXG4gICAgICAgIGJlZ2luOiAnXFxcXEJcXCcoPyFbXFwnXFxcXHNdKScsXG4gICAgICAgIGVuZDogJyhcXFxcbnsyfXxcXCcpJyxcbiAgICAgICAgLy8gYWxsb3cgZXNjYXBlZCBzaW5nbGUgcXVvdGUgZm9sbG93ZWQgYnkgd29yZCBjaGFyXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYmVnaW46ICdcXFxcXFxcXFxcJ1xcXFx3JyxcbiAgICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgLy8gaW5saW5lIGVtcGhhc2lzIChhbHQpXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ2VtcGhhc2lzJyxcbiAgICAgICAgLy8gbXVzdCBub3QgZm9sbG93IGEgd29yZCBjaGFyYWN0ZXIgb3IgYmUgZm9sbG93ZWQgYnkgYW4gdW5kZXJsaW5lIG9yIHNwYWNlXG4gICAgICAgIGJlZ2luOiAnXyg/IVtfXFxcXHNdKScsXG4gICAgICAgIGVuZDogJyhcXFxcbnsyfXxfKScsXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIC8vIGlubGluZSBzbWFydCBxdW90ZXNcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnc3RyaW5nJyxcbiAgICAgICAgdmFyaWFudHM6IFtcbiAgICAgICAgICB7YmVnaW46IFwiYGAuKz8nJ1wifSxcbiAgICAgICAgICB7YmVnaW46IFwiYC4rPydcIn1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIC8vIGlubGluZSBjb2RlIHNuaXBwZXRzIChUT0RPIHNob3VsZCBnZXQgc2FtZSB0cmVhdG1lbnQgYXMgc3Ryb25nIGFuZCBlbXBoYXNpcylcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnY29kZScsXG4gICAgICAgIGJlZ2luOiAnKGAuKz9gfFxcXFwrLis/XFxcXCspJyxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgLy8gaW5kZW50ZWQgbGl0ZXJhbCBibG9ja1xuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdjb2RlJyxcbiAgICAgICAgYmVnaW46ICdeWyBcXFxcdF0nLFxuICAgICAgICBlbmQ6ICckJyxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgLy8gaG9yaXpvbnRhbCBydWxlc1xuICAgICAge1xuICAgICAgICBiZWdpbjogJ15cXCd7Myx9WyBcXFxcdF0qJCcsXG4gICAgICAgIHJlbGV2YW5jZTogMTBcbiAgICAgIH0sXG4gICAgICAvLyBpbWFnZXMgYW5kIGxpbmtzXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAnKGxpbms6KT8oaHR0cHxodHRwc3xmdHB8ZmlsZXxpcmN8aW1hZ2U6Pyk6XFxcXFMrXFxcXFsuKj9cXFxcXScsXG4gICAgICAgIHJldHVybkJlZ2luOiB0cnVlLFxuICAgICAgICBjb250YWluczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJlZ2luOiAnKGxpbmt8aW1hZ2U6Pyk6JyxcbiAgICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnbGluaycsXG4gICAgICAgICAgICBiZWdpbjogJ1xcXFx3JyxcbiAgICAgICAgICAgIGVuZDogJ1teXFxcXFtdKycsXG4gICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJ3N0cmluZycsXG4gICAgICAgICAgICBiZWdpbjogJ1xcXFxbJyxcbiAgICAgICAgICAgIGVuZDogJ1xcXFxdJyxcbiAgICAgICAgICAgIGV4Y2x1ZGVCZWdpbjogdHJ1ZSxcbiAgICAgICAgICAgIGV4Y2x1ZGVFbmQ6IHRydWUsXG4gICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIHJlbGV2YW5jZTogMTBcbiAgICAgIH1cbiAgICBdXG4gIH07XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaGxqcykge1xuICB2YXIgVkFSID0ge1xuICAgIGNsYXNzTmFtZTogJ3ZhcmlhYmxlJyxcbiAgICB2YXJpYW50czogW1xuICAgICAge2JlZ2luOiAvXFwkW1xcd1xcZCNAXVtcXHdcXGRfXSovfSxcbiAgICAgIHtiZWdpbjogL1xcJFxceyguKj8pfS99XG4gICAgXVxuICB9O1xuICB2YXIgUVVPVEVfU1RSSU5HID0ge1xuICAgIGNsYXNzTmFtZTogJ3N0cmluZycsXG4gICAgYmVnaW46IC9cIi8sIGVuZDogL1wiLyxcbiAgICBjb250YWluczogW1xuICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAgVkFSLFxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICd2YXJpYWJsZScsXG4gICAgICAgIGJlZ2luOiAvXFwkXFwoLywgZW5kOiAvXFwpLyxcbiAgICAgICAgY29udGFpbnM6IFtobGpzLkJBQ0tTTEFTSF9FU0NBUEVdXG4gICAgICB9XG4gICAgXVxuICB9O1xuICB2YXIgQVBPU19TVFJJTkcgPSB7XG4gICAgY2xhc3NOYW1lOiAnc3RyaW5nJyxcbiAgICBiZWdpbjogLycvLCBlbmQ6IC8nL1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgYWxpYXNlczogWydzaCcsICd6c2gnXSxcbiAgICBsZXhlbWVzOiAvXFxiLT9bYS16XFwuX10rXFxiLyxcbiAgICBrZXl3b3Jkczoge1xuICAgICAga2V5d29yZDpcbiAgICAgICAgJ2lmIHRoZW4gZWxzZSBlbGlmIGZpIGZvciB3aGlsZSBpbiBkbyBkb25lIGNhc2UgZXNhYyBmdW5jdGlvbicsXG4gICAgICBsaXRlcmFsOlxuICAgICAgICAndHJ1ZSBmYWxzZScsXG4gICAgICBidWlsdF9pbjpcbiAgICAgICAgLy8gU2hlbGwgYnVpbHQtaW5zXG4gICAgICAgIC8vIGh0dHA6Ly93d3cuZ251Lm9yZy9zb2Z0d2FyZS9iYXNoL21hbnVhbC9odG1sX25vZGUvU2hlbGwtQnVpbHRpbi1Db21tYW5kcy5odG1sXG4gICAgICAgICdicmVhayBjZCBjb250aW51ZSBldmFsIGV4ZWMgZXhpdCBleHBvcnQgZ2V0b3B0cyBoYXNoIHB3ZCByZWFkb25seSByZXR1cm4gc2hpZnQgdGVzdCB0aW1lcyAnICtcbiAgICAgICAgJ3RyYXAgdW1hc2sgdW5zZXQgJyArXG4gICAgICAgIC8vIEJhc2ggYnVpbHQtaW5zXG4gICAgICAgICdhbGlhcyBiaW5kIGJ1aWx0aW4gY2FsbGVyIGNvbW1hbmQgZGVjbGFyZSBlY2hvIGVuYWJsZSBoZWxwIGxldCBsb2NhbCBsb2dvdXQgbWFwZmlsZSBwcmludGYgJyArXG4gICAgICAgICdyZWFkIHJlYWRhcnJheSBzb3VyY2UgdHlwZSB0eXBlc2V0IHVsaW1pdCB1bmFsaWFzICcgK1xuICAgICAgICAvLyBTaGVsbCBtb2RpZmllcnNcbiAgICAgICAgJ3NldCBzaG9wdCAnICtcbiAgICAgICAgLy8gWnNoIGJ1aWx0LWluc1xuICAgICAgICAnYXV0b2xvYWQgYmcgYmluZGtleSBieWUgY2FwIGNoZGlyIGNsb25lIGNvbXBhcmd1bWVudHMgY29tcGNhbGwgY29tcGN0bCBjb21wZGVzY3JpYmUgY29tcGZpbGVzICcgK1xuICAgICAgICAnY29tcGdyb3VwcyBjb21wcXVvdGUgY29tcHRhZ3MgY29tcHRyeSBjb21wdmFsdWVzIGRpcnMgZGlzYWJsZSBkaXNvd24gZWNob3RjIGVjaG90aSBlbXVsYXRlICcgK1xuICAgICAgICAnZmMgZmcgZmxvYXQgZnVuY3Rpb25zIGdldGNhcCBnZXRsbiBoaXN0b3J5IGludGVnZXIgam9icyBraWxsIGxpbWl0IGxvZyBub2dsb2IgcG9wZCBwcmludCAnICtcbiAgICAgICAgJ3B1c2hkIHB1c2hsbiByZWhhc2ggc2NoZWQgc2V0Y2FwIHNldG9wdCBzdGF0IHN1c3BlbmQgdHR5Y3RsIHVuZnVuY3Rpb24gdW5oYXNoIHVubGltaXQgJyArXG4gICAgICAgICd1bnNldG9wdCB2YXJlZCB3YWl0IHdoZW5jZSB3aGVyZSB3aGljaCB6Y29tcGlsZSB6Zm9ybWF0IHpmdHAgemxlIHptb2Rsb2FkIHpwYXJzZW9wdHMgenByb2YgJyArXG4gICAgICAgICd6cHR5IHpyZWdleHBhcnNlIHpzb2NrZXQgenN0eWxlIHp0Y3AnLFxuICAgICAgXzpcbiAgICAgICAgJy1uZSAtZXEgLWx0IC1ndCAtZiAtZCAtZSAtcyAtbCAtYScgLy8gcmVsZXZhbmNlIGJvb3N0ZXJcbiAgICB9LFxuICAgIGNvbnRhaW5zOiBbXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ21ldGEnLFxuICAgICAgICBiZWdpbjogL14jIVteXFxuXStzaFxccyokLyxcbiAgICAgICAgcmVsZXZhbmNlOiAxMFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnZnVuY3Rpb24nLFxuICAgICAgICBiZWdpbjogL1xcd1tcXHdcXGRfXSpcXHMqXFwoXFxzKlxcKVxccypcXHsvLFxuICAgICAgICByZXR1cm5CZWdpbjogdHJ1ZSxcbiAgICAgICAgY29udGFpbnM6IFtobGpzLmluaGVyaXQoaGxqcy5USVRMRV9NT0RFLCB7YmVnaW46IC9cXHdbXFx3XFxkX10qL30pXSxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgaGxqcy5IQVNIX0NPTU1FTlRfTU9ERSxcbiAgICAgIFFVT1RFX1NUUklORyxcbiAgICAgIEFQT1NfU1RSSU5HLFxuICAgICAgVkFSXG4gICAgXVxuICB9O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGhsanMpIHtcbiAgdmFyIElERU5UX1JFID0gJ1tBLVphLXokX11bMC05QS1aYS16JF9dKic7XG4gIHZhciBLRVlXT1JEUyA9IHtcbiAgICBrZXl3b3JkOlxuICAgICAgJ2luIG9mIGlmIGZvciB3aGlsZSBmaW5hbGx5IHZhciBuZXcgZnVuY3Rpb24gZG8gcmV0dXJuIHZvaWQgZWxzZSBicmVhayBjYXRjaCAnICtcbiAgICAgICdpbnN0YW5jZW9mIHdpdGggdGhyb3cgY2FzZSBkZWZhdWx0IHRyeSB0aGlzIHN3aXRjaCBjb250aW51ZSB0eXBlb2YgZGVsZXRlICcgK1xuICAgICAgJ2xldCB5aWVsZCBjb25zdCBleHBvcnQgc3VwZXIgZGVidWdnZXIgYXMgYXN5bmMgYXdhaXQgc3RhdGljICcgK1xuICAgICAgLy8gRUNNQVNjcmlwdCA2IG1vZHVsZXMgaW1wb3J0XG4gICAgICAnaW1wb3J0IGZyb20gYXMnXG4gICAgLFxuICAgIGxpdGVyYWw6XG4gICAgICAndHJ1ZSBmYWxzZSBudWxsIHVuZGVmaW5lZCBOYU4gSW5maW5pdHknLFxuICAgIGJ1aWx0X2luOlxuICAgICAgJ2V2YWwgaXNGaW5pdGUgaXNOYU4gcGFyc2VGbG9hdCBwYXJzZUludCBkZWNvZGVVUkkgZGVjb2RlVVJJQ29tcG9uZW50ICcgK1xuICAgICAgJ2VuY29kZVVSSSBlbmNvZGVVUklDb21wb25lbnQgZXNjYXBlIHVuZXNjYXBlIE9iamVjdCBGdW5jdGlvbiBCb29sZWFuIEVycm9yICcgK1xuICAgICAgJ0V2YWxFcnJvciBJbnRlcm5hbEVycm9yIFJhbmdlRXJyb3IgUmVmZXJlbmNlRXJyb3IgU3RvcEl0ZXJhdGlvbiBTeW50YXhFcnJvciAnICtcbiAgICAgICdUeXBlRXJyb3IgVVJJRXJyb3IgTnVtYmVyIE1hdGggRGF0ZSBTdHJpbmcgUmVnRXhwIEFycmF5IEZsb2F0MzJBcnJheSAnICtcbiAgICAgICdGbG9hdDY0QXJyYXkgSW50MTZBcnJheSBJbnQzMkFycmF5IEludDhBcnJheSBVaW50MTZBcnJheSBVaW50MzJBcnJheSAnICtcbiAgICAgICdVaW50OEFycmF5IFVpbnQ4Q2xhbXBlZEFycmF5IEFycmF5QnVmZmVyIERhdGFWaWV3IEpTT04gSW50bCBhcmd1bWVudHMgcmVxdWlyZSAnICtcbiAgICAgICdtb2R1bGUgY29uc29sZSB3aW5kb3cgZG9jdW1lbnQgU3ltYm9sIFNldCBNYXAgV2Vha1NldCBXZWFrTWFwIFByb3h5IFJlZmxlY3QgJyArXG4gICAgICAnUHJvbWlzZSdcbiAgfTtcbiAgdmFyIEVYUFJFU1NJT05TO1xuICB2YXIgTlVNQkVSID0ge1xuICAgIGNsYXNzTmFtZTogJ251bWJlcicsXG4gICAgdmFyaWFudHM6IFtcbiAgICAgIHsgYmVnaW46ICdcXFxcYigwW2JCXVswMV0rKScgfSxcbiAgICAgIHsgYmVnaW46ICdcXFxcYigwW29PXVswLTddKyknIH0sXG4gICAgICB7IGJlZ2luOiBobGpzLkNfTlVNQkVSX1JFIH1cbiAgICBdLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuICB2YXIgU1VCU1QgPSB7XG4gICAgY2xhc3NOYW1lOiAnc3Vic3QnLFxuICAgIGJlZ2luOiAnXFxcXCRcXFxceycsIGVuZDogJ1xcXFx9JyxcbiAgICBrZXl3b3JkczogS0VZV09SRFMsXG4gICAgY29udGFpbnM6IFtdICAvLyBkZWZpbmVkIGxhdGVyXG4gIH07XG4gIHZhciBURU1QTEFURV9TVFJJTkcgPSB7XG4gICAgY2xhc3NOYW1lOiAnc3RyaW5nJyxcbiAgICBiZWdpbjogJ2AnLCBlbmQ6ICdgJyxcbiAgICBjb250YWluczogW1xuICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAgU1VCU1RcbiAgICBdXG4gIH07XG4gIFNVQlNULmNvbnRhaW5zID0gW1xuICAgIGhsanMuQVBPU19TVFJJTkdfTU9ERSxcbiAgICBobGpzLlFVT1RFX1NUUklOR19NT0RFLFxuICAgIFRFTVBMQVRFX1NUUklORyxcbiAgICBOVU1CRVIsXG4gICAgaGxqcy5SRUdFWFBfTU9ERVxuICBdXG4gIHZhciBQQVJBTVNfQ09OVEFJTlMgPSBTVUJTVC5jb250YWlucy5jb25jYXQoW1xuICAgIGhsanMuQ19CTE9DS19DT01NRU5UX01PREUsXG4gICAgaGxqcy5DX0xJTkVfQ09NTUVOVF9NT0RFXG4gIF0pO1xuXG4gIHJldHVybiB7XG4gICAgYWxpYXNlczogWydqcycsICdqc3gnXSxcbiAgICBrZXl3b3JkczogS0VZV09SRFMsXG4gICAgY29udGFpbnM6IFtcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnbWV0YScsXG4gICAgICAgIHJlbGV2YW5jZTogMTAsXG4gICAgICAgIGJlZ2luOiAvXlxccypbJ1wiXXVzZSAoc3RyaWN0fGFzbSlbJ1wiXS9cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ21ldGEnLFxuICAgICAgICBiZWdpbjogL14jIS8sIGVuZDogLyQvXG4gICAgICB9LFxuICAgICAgaGxqcy5BUE9TX1NUUklOR19NT0RFLFxuICAgICAgaGxqcy5RVU9URV9TVFJJTkdfTU9ERSxcbiAgICAgIFRFTVBMQVRFX1NUUklORyxcbiAgICAgIGhsanMuQ19MSU5FX0NPTU1FTlRfTU9ERSxcbiAgICAgIGhsanMuQ19CTE9DS19DT01NRU5UX01PREUsXG4gICAgICBOVU1CRVIsXG4gICAgICB7IC8vIG9iamVjdCBhdHRyIGNvbnRhaW5lclxuICAgICAgICBiZWdpbjogL1t7LF1cXHMqLywgcmVsZXZhbmNlOiAwLFxuICAgICAgICBjb250YWluczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJlZ2luOiBJREVOVF9SRSArICdcXFxccyo6JywgcmV0dXJuQmVnaW46IHRydWUsXG4gICAgICAgICAgICByZWxldmFuY2U6IDAsXG4gICAgICAgICAgICBjb250YWluczogW3tjbGFzc05hbWU6ICdhdHRyJywgYmVnaW46IElERU5UX1JFLCByZWxldmFuY2U6IDB9XVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIHsgLy8gXCJ2YWx1ZVwiIGNvbnRhaW5lclxuICAgICAgICBiZWdpbjogJygnICsgaGxqcy5SRV9TVEFSVEVSU19SRSArICd8XFxcXGIoY2FzZXxyZXR1cm58dGhyb3cpXFxcXGIpXFxcXHMqJyxcbiAgICAgICAga2V5d29yZHM6ICdyZXR1cm4gdGhyb3cgY2FzZScsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgaGxqcy5DX0xJTkVfQ09NTUVOVF9NT0RFLFxuICAgICAgICAgIGhsanMuQ19CTE9DS19DT01NRU5UX01PREUsXG4gICAgICAgICAgaGxqcy5SRUdFWFBfTU9ERSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjbGFzc05hbWU6ICdmdW5jdGlvbicsXG4gICAgICAgICAgICBiZWdpbjogJyhcXFxcKC4qP1xcXFwpfCcgKyBJREVOVF9SRSArICcpXFxcXHMqPT4nLCByZXR1cm5CZWdpbjogdHJ1ZSxcbiAgICAgICAgICAgIGVuZDogJ1xcXFxzKj0+JyxcbiAgICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdwYXJhbXMnLFxuICAgICAgICAgICAgICAgIHZhcmlhbnRzOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luOiBJREVOVF9SRVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYmVnaW46IC9cXChcXHMqXFwpLyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luOiAvXFwoLywgZW5kOiAvXFwpLyxcbiAgICAgICAgICAgICAgICAgICAgZXhjbHVkZUJlZ2luOiB0cnVlLCBleGNsdWRlRW5kOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBrZXl3b3JkczogS0VZV09SRFMsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5zOiBQQVJBTVNfQ09OVEFJTlNcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgLy8gRTRYIC8gSlNYXG4gICAgICAgICAgICBiZWdpbjogLzwvLCBlbmQ6IC8oXFwvXFx3K3xcXHcrXFwvKT4vLFxuICAgICAgICAgICAgc3ViTGFuZ3VhZ2U6ICd4bWwnLFxuICAgICAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICAgICAge2JlZ2luOiAvPFxcdytcXHMqXFwvPi8sIHNraXA6IHRydWV9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYmVnaW46IC88XFx3Ky8sIGVuZDogLyhcXC9cXHcrfFxcdytcXC8pPi8sIHNraXA6IHRydWUsXG4gICAgICAgICAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICAgICAgICAgIHtiZWdpbjogLzxcXHcrXFxzKlxcLz4vLCBza2lwOiB0cnVlfSxcbiAgICAgICAgICAgICAgICAgICdzZWxmJ1xuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdmdW5jdGlvbicsXG4gICAgICAgIGJlZ2luS2V5d29yZHM6ICdmdW5jdGlvbicsIGVuZDogL1xcey8sIGV4Y2x1ZGVFbmQ6IHRydWUsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgaGxqcy5pbmhlcml0KGhsanMuVElUTEVfTU9ERSwge2JlZ2luOiBJREVOVF9SRX0pLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJ3BhcmFtcycsXG4gICAgICAgICAgICBiZWdpbjogL1xcKC8sIGVuZDogL1xcKS8sXG4gICAgICAgICAgICBleGNsdWRlQmVnaW46IHRydWUsXG4gICAgICAgICAgICBleGNsdWRlRW5kOiB0cnVlLFxuICAgICAgICAgICAgY29udGFpbnM6IFBBUkFNU19DT05UQUlOU1xuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgaWxsZWdhbDogL1xcW3wlL1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC9cXCRbKC5dLyAvLyByZWxldmFuY2UgYm9vc3RlciBmb3IgYSBwYXR0ZXJuIGNvbW1vbiB0byBKUyBsaWJzOiBgJChzb21ldGhpbmcpYCBhbmQgYCQuc29tZXRoaW5nYFxuICAgICAgfSxcbiAgICAgIGhsanMuTUVUSE9EX0dVQVJELFxuICAgICAgeyAvLyBFUzYgY2xhc3NcbiAgICAgICAgY2xhc3NOYW1lOiAnY2xhc3MnLFxuICAgICAgICBiZWdpbktleXdvcmRzOiAnY2xhc3MnLCBlbmQ6IC9bezs9XS8sIGV4Y2x1ZGVFbmQ6IHRydWUsXG4gICAgICAgIGlsbGVnYWw6IC9bOlwiXFxbXFxdXS8sXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAge2JlZ2luS2V5d29yZHM6ICdleHRlbmRzJ30sXG4gICAgICAgICAgaGxqcy5VTkRFUlNDT1JFX1RJVExFX01PREVcbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW5LZXl3b3JkczogJ2NvbnN0cnVjdG9yJywgZW5kOiAvXFx7LywgZXhjbHVkZUVuZDogdHJ1ZVxuICAgICAgfVxuICAgIF0sXG4gICAgaWxsZWdhbDogLyMoPyEhKS9cbiAgfTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihobGpzKSB7XG4gIHJldHVybiB7XG4gICAgYWxpYXNlczogWydjb25zb2xlJ10sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnbWV0YScsXG4gICAgICAgIGJlZ2luOiAnXlxcXFxzezAsM31bXFxcXHdcXFxcZFxcXFxbXFxcXF0oKUAtXSpbPiUkI10nLFxuICAgICAgICBzdGFydHM6IHtcbiAgICAgICAgICBlbmQ6ICckJywgc3ViTGFuZ3VhZ2U6ICdiYXNoJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIF1cbiAgfVxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGhsanMpIHtcbiAgdmFyIFhNTF9JREVOVF9SRSA9ICdbQS1aYS16MC05XFxcXC5fOi1dKyc7XG4gIHZhciBUQUdfSU5URVJOQUxTID0ge1xuICAgIGVuZHNXaXRoUGFyZW50OiB0cnVlLFxuICAgIGlsbGVnYWw6IC88LyxcbiAgICByZWxldmFuY2U6IDAsXG4gICAgY29udGFpbnM6IFtcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnYXR0cicsXG4gICAgICAgIGJlZ2luOiBYTUxfSURFTlRfUkUsXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC89XFxzKi8sXG4gICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjbGFzc05hbWU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW5kc1BhcmVudDogdHJ1ZSxcbiAgICAgICAgICAgIHZhcmlhbnRzOiBbXG4gICAgICAgICAgICAgIHtiZWdpbjogL1wiLywgZW5kOiAvXCIvfSxcbiAgICAgICAgICAgICAge2JlZ2luOiAvJy8sIGVuZDogLycvfSxcbiAgICAgICAgICAgICAge2JlZ2luOiAvW15cXHNcIic9PD5gXSsvfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIF1cbiAgfTtcbiAgcmV0dXJuIHtcbiAgICBhbGlhc2VzOiBbJ2h0bWwnLCAneGh0bWwnLCAncnNzJywgJ2F0b20nLCAneGpiJywgJ3hzZCcsICd4c2wnLCAncGxpc3QnXSxcbiAgICBjYXNlX2luc2Vuc2l0aXZlOiB0cnVlLFxuICAgIGNvbnRhaW5zOiBbXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ21ldGEnLFxuICAgICAgICBiZWdpbjogJzwhRE9DVFlQRScsIGVuZDogJz4nLFxuICAgICAgICByZWxldmFuY2U6IDEwLFxuICAgICAgICBjb250YWluczogW3tiZWdpbjogJ1xcXFxbJywgZW5kOiAnXFxcXF0nfV1cbiAgICAgIH0sXG4gICAgICBobGpzLkNPTU1FTlQoXG4gICAgICAgICc8IS0tJyxcbiAgICAgICAgJy0tPicsXG4gICAgICAgIHtcbiAgICAgICAgICByZWxldmFuY2U6IDEwXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAnPFxcXFwhXFxcXFtDREFUQVxcXFxbJywgZW5kOiAnXFxcXF1cXFxcXT4nLFxuICAgICAgICByZWxldmFuY2U6IDEwXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBiZWdpbjogLzxcXD8ocGhwKT8vLCBlbmQ6IC9cXD8+LyxcbiAgICAgICAgc3ViTGFuZ3VhZ2U6ICdwaHAnLFxuICAgICAgICBjb250YWluczogW3tiZWdpbjogJy9cXFxcKicsIGVuZDogJ1xcXFwqLycsIHNraXA6IHRydWV9XVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAndGFnJyxcbiAgICAgICAgLypcbiAgICAgICAgVGhlIGxvb2thaGVhZCBwYXR0ZXJuICg/PS4uLikgZW5zdXJlcyB0aGF0ICdiZWdpbicgb25seSBtYXRjaGVzXG4gICAgICAgICc8c3R5bGUnIGFzIGEgc2luZ2xlIHdvcmQsIGZvbGxvd2VkIGJ5IGEgd2hpdGVzcGFjZSBvciBhblxuICAgICAgICBlbmRpbmcgYnJha2V0LiBUaGUgJyQnIGlzIG5lZWRlZCBmb3IgdGhlIGxleGVtZSB0byBiZSByZWNvZ25pemVkXG4gICAgICAgIGJ5IGhsanMuc3ViTW9kZSgpIHRoYXQgdGVzdHMgbGV4ZW1lcyBvdXRzaWRlIHRoZSBzdHJlYW0uXG4gICAgICAgICovXG4gICAgICAgIGJlZ2luOiAnPHN0eWxlKD89XFxcXHN8PnwkKScsIGVuZDogJz4nLFxuICAgICAgICBrZXl3b3Jkczoge25hbWU6ICdzdHlsZSd9LFxuICAgICAgICBjb250YWluczogW1RBR19JTlRFUk5BTFNdLFxuICAgICAgICBzdGFydHM6IHtcbiAgICAgICAgICBlbmQ6ICc8L3N0eWxlPicsIHJldHVybkVuZDogdHJ1ZSxcbiAgICAgICAgICBzdWJMYW5ndWFnZTogWydjc3MnLCAneG1sJ11cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAndGFnJyxcbiAgICAgICAgLy8gU2VlIHRoZSBjb21tZW50IGluIHRoZSA8c3R5bGUgdGFnIGFib3V0IHRoZSBsb29rYWhlYWQgcGF0dGVyblxuICAgICAgICBiZWdpbjogJzxzY3JpcHQoPz1cXFxcc3w+fCQpJywgZW5kOiAnPicsXG4gICAgICAgIGtleXdvcmRzOiB7bmFtZTogJ3NjcmlwdCd9LFxuICAgICAgICBjb250YWluczogW1RBR19JTlRFUk5BTFNdLFxuICAgICAgICBzdGFydHM6IHtcbiAgICAgICAgICBlbmQ6ICdcXDxcXC9zY3JpcHRcXD4nLCByZXR1cm5FbmQ6IHRydWUsXG4gICAgICAgICAgc3ViTGFuZ3VhZ2U6IFsnYWN0aW9uc2NyaXB0JywgJ2phdmFzY3JpcHQnLCAnaGFuZGxlYmFycycsICd4bWwnXVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdtZXRhJyxcbiAgICAgICAgdmFyaWFudHM6IFtcbiAgICAgICAgICB7YmVnaW46IC88XFw/eG1sLywgZW5kOiAvXFw/Pi8sIHJlbGV2YW5jZTogMTB9LFxuICAgICAgICAgIHtiZWdpbjogLzxcXD9cXHcrLywgZW5kOiAvXFw/Pi99XG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3RhZycsXG4gICAgICAgIGJlZ2luOiAnPC8/JywgZW5kOiAnLz8+JyxcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjbGFzc05hbWU6ICduYW1lJywgYmVnaW46IC9bXlxcLz48XFxzXSsvLCByZWxldmFuY2U6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFRBR19JTlRFUk5BTFNcbiAgICAgICAgXVxuICAgICAgfVxuICAgIF1cbiAgfTtcbn07IiwiLyohXG4gKiByZXZlYWwuanNcbiAqIGh0dHA6Ly9sYWIuaGFraW0uc2UvcmV2ZWFsLWpzXG4gKiBNSVQgbGljZW5zZWRcbiAqXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTcgSGFraW0gRWwgSGF0dGFiLCBodHRwOi8vaGFraW0uc2VcbiAqL1xuKGZ1bmN0aW9uKCByb290LCBmYWN0b3J5ICkge1xuXHRpZiggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuXHRcdC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cblx0XHRkZWZpbmUoIGZ1bmN0aW9uKCkge1xuXHRcdFx0cm9vdC5SZXZlYWwgPSBmYWN0b3J5KCk7XG5cdFx0XHRyZXR1cm4gcm9vdC5SZXZlYWw7XG5cdFx0fSApO1xuXHR9IGVsc2UgaWYoIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyApIHtcblx0XHQvLyBOb2RlLiBEb2VzIG5vdCB3b3JrIHdpdGggc3RyaWN0IENvbW1vbkpTLlxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHR9IGVsc2Uge1xuXHRcdC8vIEJyb3dzZXIgZ2xvYmFscy5cblx0XHRyb290LlJldmVhbCA9IGZhY3RvcnkoKTtcblx0fVxufSggdGhpcywgZnVuY3Rpb24oKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBSZXZlYWw7XG5cblx0Ly8gVGhlIHJldmVhbC5qcyB2ZXJzaW9uXG5cdHZhciBWRVJTSU9OID0gJzMuNS4wJztcblxuXHR2YXIgU0xJREVTX1NFTEVDVE9SID0gJy5zbGlkZXMgc2VjdGlvbicsXG5cdFx0SE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgPSAnLnNsaWRlcz5zZWN0aW9uJyxcblx0XHRWRVJUSUNBTF9TTElERVNfU0VMRUNUT1IgPSAnLnNsaWRlcz5zZWN0aW9uLnByZXNlbnQ+c2VjdGlvbicsXG5cdFx0SE9NRV9TTElERV9TRUxFQ1RPUiA9ICcuc2xpZGVzPnNlY3Rpb246Zmlyc3Qtb2YtdHlwZScsXG5cdFx0VUEgPSBuYXZpZ2F0b3IudXNlckFnZW50LFxuXG5cdFx0Ly8gQ29uZmlndXJhdGlvbiBkZWZhdWx0cywgY2FuIGJlIG92ZXJyaWRkZW4gYXQgaW5pdGlhbGl6YXRpb24gdGltZVxuXHRcdGNvbmZpZyA9IHtcblxuXHRcdFx0Ly8gVGhlIFwibm9ybWFsXCIgc2l6ZSBvZiB0aGUgcHJlc2VudGF0aW9uLCBhc3BlY3QgcmF0aW8gd2lsbCBiZSBwcmVzZXJ2ZWRcblx0XHRcdC8vIHdoZW4gdGhlIHByZXNlbnRhdGlvbiBpcyBzY2FsZWQgdG8gZml0IGRpZmZlcmVudCByZXNvbHV0aW9uc1xuXHRcdFx0d2lkdGg6IDk2MCxcblx0XHRcdGhlaWdodDogNzAwLFxuXG5cdFx0XHQvLyBGYWN0b3Igb2YgdGhlIGRpc3BsYXkgc2l6ZSB0aGF0IHNob3VsZCByZW1haW4gZW1wdHkgYXJvdW5kIHRoZSBjb250ZW50XG5cdFx0XHRtYXJnaW46IDAuMDQsXG5cblx0XHRcdC8vIEJvdW5kcyBmb3Igc21hbGxlc3QvbGFyZ2VzdCBwb3NzaWJsZSBzY2FsZSB0byBhcHBseSB0byBjb250ZW50XG5cdFx0XHRtaW5TY2FsZTogMC4yLFxuXHRcdFx0bWF4U2NhbGU6IDIuMCxcblxuXHRcdFx0Ly8gRGlzcGxheSBjb250cm9scyBpbiB0aGUgYm90dG9tIHJpZ2h0IGNvcm5lclxuXHRcdFx0Y29udHJvbHM6IHRydWUsXG5cblx0XHRcdC8vIERpc3BsYXkgYSBwcmVzZW50YXRpb24gcHJvZ3Jlc3MgYmFyXG5cdFx0XHRwcm9ncmVzczogdHJ1ZSxcblxuXHRcdFx0Ly8gRGlzcGxheSB0aGUgcGFnZSBudW1iZXIgb2YgdGhlIGN1cnJlbnQgc2xpZGVcblx0XHRcdHNsaWRlTnVtYmVyOiBmYWxzZSxcblxuXHRcdFx0Ly8gRGV0ZXJtaW5lIHdoaWNoIGRpc3BsYXlzIHRvIHNob3cgdGhlIHNsaWRlIG51bWJlciBvblxuXHRcdFx0c2hvd1NsaWRlTnVtYmVyOiAnYWxsJyxcblxuXHRcdFx0Ly8gUHVzaCBlYWNoIHNsaWRlIGNoYW5nZSB0byB0aGUgYnJvd3NlciBoaXN0b3J5XG5cdFx0XHRoaXN0b3J5OiBmYWxzZSxcblxuXHRcdFx0Ly8gRW5hYmxlIGtleWJvYXJkIHNob3J0Y3V0cyBmb3IgbmF2aWdhdGlvblxuXHRcdFx0a2V5Ym9hcmQ6IHRydWUsXG5cblx0XHRcdC8vIE9wdGlvbmFsIGZ1bmN0aW9uIHRoYXQgYmxvY2tzIGtleWJvYXJkIGV2ZW50cyB3aGVuIHJldHVuaW5nIGZhbHNlXG5cdFx0XHRrZXlib2FyZENvbmRpdGlvbjogbnVsbCxcblxuXHRcdFx0Ly8gRW5hYmxlIHRoZSBzbGlkZSBvdmVydmlldyBtb2RlXG5cdFx0XHRvdmVydmlldzogdHJ1ZSxcblxuXHRcdFx0Ly8gVmVydGljYWwgY2VudGVyaW5nIG9mIHNsaWRlc1xuXHRcdFx0Y2VudGVyOiB0cnVlLFxuXG5cdFx0XHQvLyBFbmFibGVzIHRvdWNoIG5hdmlnYXRpb24gb24gZGV2aWNlcyB3aXRoIHRvdWNoIGlucHV0XG5cdFx0XHR0b3VjaDogdHJ1ZSxcblxuXHRcdFx0Ly8gTG9vcCB0aGUgcHJlc2VudGF0aW9uXG5cdFx0XHRsb29wOiBmYWxzZSxcblxuXHRcdFx0Ly8gQ2hhbmdlIHRoZSBwcmVzZW50YXRpb24gZGlyZWN0aW9uIHRvIGJlIFJUTFxuXHRcdFx0cnRsOiBmYWxzZSxcblxuXHRcdFx0Ly8gUmFuZG9taXplcyB0aGUgb3JkZXIgb2Ygc2xpZGVzIGVhY2ggdGltZSB0aGUgcHJlc2VudGF0aW9uIGxvYWRzXG5cdFx0XHRzaHVmZmxlOiBmYWxzZSxcblxuXHRcdFx0Ly8gVHVybnMgZnJhZ21lbnRzIG9uIGFuZCBvZmYgZ2xvYmFsbHlcblx0XHRcdGZyYWdtZW50czogdHJ1ZSxcblxuXHRcdFx0Ly8gRmxhZ3MgaWYgdGhlIHByZXNlbnRhdGlvbiBpcyBydW5uaW5nIGluIGFuIGVtYmVkZGVkIG1vZGUsXG5cdFx0XHQvLyBpLmUuIGNvbnRhaW5lZCB3aXRoaW4gYSBsaW1pdGVkIHBvcnRpb24gb2YgdGhlIHNjcmVlblxuXHRcdFx0ZW1iZWRkZWQ6IGZhbHNlLFxuXG5cdFx0XHQvLyBGbGFncyBpZiB3ZSBzaG91bGQgc2hvdyBhIGhlbHAgb3ZlcmxheSB3aGVuIHRoZSBxdWVzdGlvbi1tYXJrXG5cdFx0XHQvLyBrZXkgaXMgcHJlc3NlZFxuXHRcdFx0aGVscDogdHJ1ZSxcblxuXHRcdFx0Ly8gRmxhZ3MgaWYgaXQgc2hvdWxkIGJlIHBvc3NpYmxlIHRvIHBhdXNlIHRoZSBwcmVzZW50YXRpb24gKGJsYWNrb3V0KVxuXHRcdFx0cGF1c2U6IHRydWUsXG5cblx0XHRcdC8vIEZsYWdzIGlmIHNwZWFrZXIgbm90ZXMgc2hvdWxkIGJlIHZpc2libGUgdG8gYWxsIHZpZXdlcnNcblx0XHRcdHNob3dOb3RlczogZmFsc2UsXG5cblx0XHRcdC8vIEdsb2JhbCBvdmVycmlkZSBmb3IgYXV0b2xheWluZyBlbWJlZGRlZCBtZWRpYSAodmlkZW8vYXVkaW8vaWZyYW1lKVxuXHRcdFx0Ly8gLSBudWxsOiBNZWRpYSB3aWxsIG9ubHkgYXV0b3BsYXkgaWYgZGF0YS1hdXRvcGxheSBpcyBwcmVzZW50XG5cdFx0XHQvLyAtIHRydWU6IEFsbCBtZWRpYSB3aWxsIGF1dG9wbGF5LCByZWdhcmRsZXNzIG9mIGluZGl2aWR1YWwgc2V0dGluZ1xuXHRcdFx0Ly8gLSBmYWxzZTogTm8gbWVkaWEgd2lsbCBhdXRvcGxheSwgcmVnYXJkbGVzcyBvZiBpbmRpdmlkdWFsIHNldHRpbmdcblx0XHRcdGF1dG9QbGF5TWVkaWE6IG51bGwsXG5cblx0XHRcdC8vIE51bWJlciBvZiBtaWxsaXNlY29uZHMgYmV0d2VlbiBhdXRvbWF0aWNhbGx5IHByb2NlZWRpbmcgdG8gdGhlXG5cdFx0XHQvLyBuZXh0IHNsaWRlLCBkaXNhYmxlZCB3aGVuIHNldCB0byAwLCB0aGlzIHZhbHVlIGNhbiBiZSBvdmVyd3JpdHRlblxuXHRcdFx0Ly8gYnkgdXNpbmcgYSBkYXRhLWF1dG9zbGlkZSBhdHRyaWJ1dGUgb24geW91ciBzbGlkZXNcblx0XHRcdGF1dG9TbGlkZTogMCxcblxuXHRcdFx0Ly8gU3RvcCBhdXRvLXNsaWRpbmcgYWZ0ZXIgdXNlciBpbnB1dFxuXHRcdFx0YXV0b1NsaWRlU3RvcHBhYmxlOiB0cnVlLFxuXG5cdFx0XHQvLyBVc2UgdGhpcyBtZXRob2QgZm9yIG5hdmlnYXRpb24gd2hlbiBhdXRvLXNsaWRpbmcgKGRlZmF1bHRzIHRvIG5hdmlnYXRlTmV4dClcblx0XHRcdGF1dG9TbGlkZU1ldGhvZDogbnVsbCxcblxuXHRcdFx0Ly8gRW5hYmxlIHNsaWRlIG5hdmlnYXRpb24gdmlhIG1vdXNlIHdoZWVsXG5cdFx0XHRtb3VzZVdoZWVsOiBmYWxzZSxcblxuXHRcdFx0Ly8gQXBwbHkgYSAzRCByb2xsIHRvIGxpbmtzIG9uIGhvdmVyXG5cdFx0XHRyb2xsaW5nTGlua3M6IGZhbHNlLFxuXG5cdFx0XHQvLyBIaWRlcyB0aGUgYWRkcmVzcyBiYXIgb24gbW9iaWxlIGRldmljZXNcblx0XHRcdGhpZGVBZGRyZXNzQmFyOiB0cnVlLFxuXG5cdFx0XHQvLyBPcGVucyBsaW5rcyBpbiBhbiBpZnJhbWUgcHJldmlldyBvdmVybGF5XG5cdFx0XHRwcmV2aWV3TGlua3M6IGZhbHNlLFxuXG5cdFx0XHQvLyBFeHBvc2VzIHRoZSByZXZlYWwuanMgQVBJIHRocm91Z2ggd2luZG93LnBvc3RNZXNzYWdlXG5cdFx0XHRwb3N0TWVzc2FnZTogdHJ1ZSxcblxuXHRcdFx0Ly8gRGlzcGF0Y2hlcyBhbGwgcmV2ZWFsLmpzIGV2ZW50cyB0byB0aGUgcGFyZW50IHdpbmRvdyB0aHJvdWdoIHBvc3RNZXNzYWdlXG5cdFx0XHRwb3N0TWVzc2FnZUV2ZW50czogZmFsc2UsXG5cblx0XHRcdC8vIEZvY3VzZXMgYm9keSB3aGVuIHBhZ2UgY2hhbmdlcyB2aXNpYmlsaXR5IHRvIGVuc3VyZSBrZXlib2FyZCBzaG9ydGN1dHMgd29ya1xuXHRcdFx0Zm9jdXNCb2R5T25QYWdlVmlzaWJpbGl0eUNoYW5nZTogdHJ1ZSxcblxuXHRcdFx0Ly8gVHJhbnNpdGlvbiBzdHlsZVxuXHRcdFx0dHJhbnNpdGlvbjogJ3NsaWRlJywgLy8gbm9uZS9mYWRlL3NsaWRlL2NvbnZleC9jb25jYXZlL3pvb21cblxuXHRcdFx0Ly8gVHJhbnNpdGlvbiBzcGVlZFxuXHRcdFx0dHJhbnNpdGlvblNwZWVkOiAnZGVmYXVsdCcsIC8vIGRlZmF1bHQvZmFzdC9zbG93XG5cblx0XHRcdC8vIFRyYW5zaXRpb24gc3R5bGUgZm9yIGZ1bGwgcGFnZSBzbGlkZSBiYWNrZ3JvdW5kc1xuXHRcdFx0YmFja2dyb3VuZFRyYW5zaXRpb246ICdmYWRlJywgLy8gbm9uZS9mYWRlL3NsaWRlL2NvbnZleC9jb25jYXZlL3pvb21cblxuXHRcdFx0Ly8gUGFyYWxsYXggYmFja2dyb3VuZCBpbWFnZVxuXHRcdFx0cGFyYWxsYXhCYWNrZ3JvdW5kSW1hZ2U6ICcnLCAvLyBDU1Mgc3ludGF4LCBlLmcuIFwiYS5qcGdcIlxuXG5cdFx0XHQvLyBQYXJhbGxheCBiYWNrZ3JvdW5kIHNpemVcblx0XHRcdHBhcmFsbGF4QmFja2dyb3VuZFNpemU6ICcnLCAvLyBDU1Mgc3ludGF4LCBlLmcuIFwiMzAwMHB4IDIwMDBweFwiXG5cblx0XHRcdC8vIEFtb3VudCBvZiBwaXhlbHMgdG8gbW92ZSB0aGUgcGFyYWxsYXggYmFja2dyb3VuZCBwZXIgc2xpZGUgc3RlcFxuXHRcdFx0cGFyYWxsYXhCYWNrZ3JvdW5kSG9yaXpvbnRhbDogbnVsbCxcblx0XHRcdHBhcmFsbGF4QmFja2dyb3VuZFZlcnRpY2FsOiBudWxsLFxuXG5cdFx0XHQvLyBUaGUgbWF4aW11bSBudW1iZXIgb2YgcGFnZXMgYSBzaW5nbGUgc2xpZGUgY2FuIGV4cGFuZCBvbnRvIHdoZW4gcHJpbnRpbmdcblx0XHRcdC8vIHRvIFBERiwgdW5saW1pdGVkIGJ5IGRlZmF1bHRcblx0XHRcdHBkZk1heFBhZ2VzUGVyU2xpZGU6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcblxuXHRcdFx0Ly8gT2Zmc2V0IHVzZWQgdG8gcmVkdWNlIHRoZSBoZWlnaHQgb2YgY29udGVudCB3aXRoaW4gZXhwb3J0ZWQgUERGIHBhZ2VzLlxuXHRcdFx0Ly8gVGhpcyBleGlzdHMgdG8gYWNjb3VudCBmb3IgZW52aXJvbm1lbnQgZGlmZmVyZW5jZXMgYmFzZWQgb24gaG93IHlvdVxuXHRcdFx0Ly8gcHJpbnQgdG8gUERGLiBDTEkgcHJpbnRpbmcgb3B0aW9ucywgbGlrZSBwaGFudG9tanMgYW5kIHdrcGRmLCBjYW4gZW5kXG5cdFx0XHQvLyBvbiBwcmVjaXNlbHkgdGhlIHRvdGFsIGhlaWdodCBvZiB0aGUgZG9jdW1lbnQgd2hlcmVhcyBpbi1icm93c2VyXG5cdFx0XHQvLyBwcmludGluZyBoYXMgdG8gZW5kIG9uZSBwaXhlbCBiZWZvcmUuXG5cdFx0XHRwZGZQYWdlSGVpZ2h0T2Zmc2V0OiAtMSxcblxuXHRcdFx0Ly8gTnVtYmVyIG9mIHNsaWRlcyBhd2F5IGZyb20gdGhlIGN1cnJlbnQgdGhhdCBhcmUgdmlzaWJsZVxuXHRcdFx0dmlld0Rpc3RhbmNlOiAzLFxuXG5cdFx0XHQvLyBUaGUgZGlzcGxheSBtb2RlIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHNob3cgc2xpZGVzXG5cdFx0XHRkaXNwbGF5OiAnYmxvY2snLFxuXG5cdFx0XHQvLyBTY3JpcHQgZGVwZW5kZW5jaWVzIHRvIGxvYWRcblx0XHRcdGRlcGVuZGVuY2llczogW11cblxuXHRcdH0sXG5cblx0XHQvLyBGbGFncyBpZiBSZXZlYWwuaW5pdGlhbGl6ZSgpIGhhcyBiZWVuIGNhbGxlZFxuXHRcdGluaXRpYWxpemVkID0gZmFsc2UsXG5cblx0XHQvLyBGbGFncyBpZiByZXZlYWwuanMgaXMgbG9hZGVkIChoYXMgZGlzcGF0Y2hlZCB0aGUgJ3JlYWR5JyBldmVudClcblx0XHRsb2FkZWQgPSBmYWxzZSxcblxuXHRcdC8vIEZsYWdzIGlmIHRoZSBvdmVydmlldyBtb2RlIGlzIGN1cnJlbnRseSBhY3RpdmVcblx0XHRvdmVydmlldyA9IGZhbHNlLFxuXG5cdFx0Ly8gSG9sZHMgdGhlIGRpbWVuc2lvbnMgb2Ygb3VyIG92ZXJ2aWV3IHNsaWRlcywgaW5jbHVkaW5nIG1hcmdpbnNcblx0XHRvdmVydmlld1NsaWRlV2lkdGggPSBudWxsLFxuXHRcdG92ZXJ2aWV3U2xpZGVIZWlnaHQgPSBudWxsLFxuXG5cdFx0Ly8gVGhlIGhvcml6b250YWwgYW5kIHZlcnRpY2FsIGluZGV4IG9mIHRoZSBjdXJyZW50bHkgYWN0aXZlIHNsaWRlXG5cdFx0aW5kZXhoLFxuXHRcdGluZGV4dixcblxuXHRcdC8vIFRoZSBwcmV2aW91cyBhbmQgY3VycmVudCBzbGlkZSBIVE1MIGVsZW1lbnRzXG5cdFx0cHJldmlvdXNTbGlkZSxcblx0XHRjdXJyZW50U2xpZGUsXG5cblx0XHRwcmV2aW91c0JhY2tncm91bmQsXG5cblx0XHQvLyBTbGlkZXMgbWF5IGhvbGQgYSBkYXRhLXN0YXRlIGF0dHJpYnV0ZSB3aGljaCB3ZSBwaWNrIHVwIGFuZCBhcHBseVxuXHRcdC8vIGFzIGEgY2xhc3MgdG8gdGhlIGJvZHkuIFRoaXMgbGlzdCBjb250YWlucyB0aGUgY29tYmluZWQgc3RhdGUgb2Zcblx0XHQvLyBhbGwgY3VycmVudCBzbGlkZXMuXG5cdFx0c3RhdGUgPSBbXSxcblxuXHRcdC8vIFRoZSBjdXJyZW50IHNjYWxlIG9mIHRoZSBwcmVzZW50YXRpb24gKHNlZSB3aWR0aC9oZWlnaHQgY29uZmlnKVxuXHRcdHNjYWxlID0gMSxcblxuXHRcdC8vIENTUyB0cmFuc2Zvcm0gdGhhdCBpcyBjdXJyZW50bHkgYXBwbGllZCB0byB0aGUgc2xpZGVzIGNvbnRhaW5lcixcblx0XHQvLyBzcGxpdCBpbnRvIHR3byBncm91cHNcblx0XHRzbGlkZXNUcmFuc2Zvcm0gPSB7IGxheW91dDogJycsIG92ZXJ2aWV3OiAnJyB9LFxuXG5cdFx0Ly8gQ2FjaGVkIHJlZmVyZW5jZXMgdG8gRE9NIGVsZW1lbnRzXG5cdFx0ZG9tID0ge30sXG5cblx0XHQvLyBGZWF0dXJlcyBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIsIHNlZSAjY2hlY2tDYXBhYmlsaXRpZXMoKVxuXHRcdGZlYXR1cmVzID0ge30sXG5cblx0XHQvLyBDbGllbnQgaXMgYSBtb2JpbGUgZGV2aWNlLCBzZWUgI2NoZWNrQ2FwYWJpbGl0aWVzKClcblx0XHRpc01vYmlsZURldmljZSxcblxuXHRcdC8vIENsaWVudCBpcyBhIGRlc2t0b3AgQ2hyb21lLCBzZWUgI2NoZWNrQ2FwYWJpbGl0aWVzKClcblx0XHRpc0Nocm9tZSxcblxuXHRcdC8vIFRocm90dGxlcyBtb3VzZSB3aGVlbCBuYXZpZ2F0aW9uXG5cdFx0bGFzdE1vdXNlV2hlZWxTdGVwID0gMCxcblxuXHRcdC8vIERlbGF5cyB1cGRhdGVzIHRvIHRoZSBVUkwgZHVlIHRvIGEgQ2hyb21lIHRodW1ibmFpbGVyIGJ1Z1xuXHRcdHdyaXRlVVJMVGltZW91dCA9IDAsXG5cblx0XHQvLyBGbGFncyBpZiB0aGUgaW50ZXJhY3Rpb24gZXZlbnQgbGlzdGVuZXJzIGFyZSBib3VuZFxuXHRcdGV2ZW50c0FyZUJvdW5kID0gZmFsc2UsXG5cblx0XHQvLyBUaGUgY3VycmVudCBhdXRvLXNsaWRlIGR1cmF0aW9uXG5cdFx0YXV0b1NsaWRlID0gMCxcblxuXHRcdC8vIEF1dG8gc2xpZGUgcHJvcGVydGllc1xuXHRcdGF1dG9TbGlkZVBsYXllcixcblx0XHRhdXRvU2xpZGVUaW1lb3V0ID0gMCxcblx0XHRhdXRvU2xpZGVTdGFydFRpbWUgPSAtMSxcblx0XHRhdXRvU2xpZGVQYXVzZWQgPSBmYWxzZSxcblxuXHRcdC8vIEhvbGRzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50bHkgb25nb2luZyB0b3VjaCBpbnB1dFxuXHRcdHRvdWNoID0ge1xuXHRcdFx0c3RhcnRYOiAwLFxuXHRcdFx0c3RhcnRZOiAwLFxuXHRcdFx0c3RhcnRTcGFuOiAwLFxuXHRcdFx0c3RhcnRDb3VudDogMCxcblx0XHRcdGNhcHR1cmVkOiBmYWxzZSxcblx0XHRcdHRocmVzaG9sZDogNDBcblx0XHR9LFxuXG5cdFx0Ly8gSG9sZHMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGtleWJvYXJkIHNob3J0Y3V0c1xuXHRcdGtleWJvYXJkU2hvcnRjdXRzID0ge1xuXHRcdFx0J04gICwgIFNQQUNFJzpcdFx0XHQnTmV4dCBzbGlkZScsXG5cdFx0XHQnUCc6XHRcdFx0XHRcdCdQcmV2aW91cyBzbGlkZScsXG5cdFx0XHQnJiM4NTkyOyAgLCAgSCc6XHRcdCdOYXZpZ2F0ZSBsZWZ0Jyxcblx0XHRcdCcmIzg1OTQ7ICAsICBMJzpcdFx0J05hdmlnYXRlIHJpZ2h0Jyxcblx0XHRcdCcmIzg1OTM7ICAsICBLJzpcdFx0J05hdmlnYXRlIHVwJyxcblx0XHRcdCcmIzg1OTU7ICAsICBKJzpcdFx0J05hdmlnYXRlIGRvd24nLFxuXHRcdFx0J0hvbWUnOlx0XHRcdFx0XHQnRmlyc3Qgc2xpZGUnLFxuXHRcdFx0J0VuZCc6XHRcdFx0XHRcdCdMYXN0IHNsaWRlJyxcblx0XHRcdCdCICAsICAuJzpcdFx0XHRcdCdQYXVzZScsXG5cdFx0XHQnRic6XHRcdFx0XHRcdCdGdWxsc2NyZWVuJyxcblx0XHRcdCdFU0MsIE8nOlx0XHRcdFx0J1NsaWRlIG92ZXJ2aWV3J1xuXHRcdH07XG5cblx0LyoqXG5cdCAqIFN0YXJ0cyB1cCB0aGUgcHJlc2VudGF0aW9uIGlmIHRoZSBjbGllbnQgaXMgY2FwYWJsZS5cblx0ICovXG5cdGZ1bmN0aW9uIGluaXRpYWxpemUoIG9wdGlvbnMgKSB7XG5cblx0XHQvLyBNYWtlIHN1cmUgd2Ugb25seSBpbml0aWFsaXplIG9uY2Vcblx0XHRpZiggaW5pdGlhbGl6ZWQgPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRpbml0aWFsaXplZCA9IHRydWU7XG5cblx0XHRjaGVja0NhcGFiaWxpdGllcygpO1xuXG5cdFx0aWYoICFmZWF0dXJlcy50cmFuc2Zvcm1zMmQgJiYgIWZlYXR1cmVzLnRyYW5zZm9ybXMzZCApIHtcblx0XHRcdGRvY3VtZW50LmJvZHkuc2V0QXR0cmlidXRlKCAnY2xhc3MnLCAnbm8tdHJhbnNmb3JtcycgKTtcblxuXHRcdFx0Ly8gU2luY2UgSlMgd29uJ3QgYmUgcnVubmluZyBhbnkgZnVydGhlciwgd2UgbG9hZCBhbGwgbGF6eVxuXHRcdFx0Ly8gbG9hZGluZyBlbGVtZW50cyB1cGZyb250XG5cdFx0XHR2YXIgaW1hZ2VzID0gdG9BcnJheSggZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoICdpbWcnICkgKSxcblx0XHRcdFx0aWZyYW1lcyA9IHRvQXJyYXkoIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCAnaWZyYW1lJyApICk7XG5cblx0XHRcdHZhciBsYXp5TG9hZGFibGUgPSBpbWFnZXMuY29uY2F0KCBpZnJhbWVzICk7XG5cblx0XHRcdGZvciggdmFyIGkgPSAwLCBsZW4gPSBsYXp5TG9hZGFibGUubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHRcdHZhciBlbGVtZW50ID0gbGF6eUxvYWRhYmxlW2ldO1xuXHRcdFx0XHRpZiggZWxlbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLXNyYycgKSApIHtcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZSggJ3NyYycsIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1zcmMnICkgKTtcblx0XHRcdFx0XHRlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSggJ2RhdGEtc3JjJyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCBjb3JlIGZlYXR1cmVzIHdlIHdvbid0IGJlXG5cdFx0XHQvLyB1c2luZyBKYXZhU2NyaXB0IHRvIGNvbnRyb2wgdGhlIHByZXNlbnRhdGlvblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIENhY2hlIHJlZmVyZW5jZXMgdG8ga2V5IERPTSBlbGVtZW50c1xuXHRcdGRvbS53cmFwcGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJy5yZXZlYWwnICk7XG5cdFx0ZG9tLnNsaWRlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoICcucmV2ZWFsIC5zbGlkZXMnICk7XG5cblx0XHQvLyBGb3JjZSBhIGxheW91dCB3aGVuIHRoZSB3aG9sZSBwYWdlLCBpbmNsIGZvbnRzLCBoYXMgbG9hZGVkXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgbGF5b3V0LCBmYWxzZSApO1xuXG5cdFx0dmFyIHF1ZXJ5ID0gUmV2ZWFsLmdldFF1ZXJ5SGFzaCgpO1xuXG5cdFx0Ly8gRG8gbm90IGFjY2VwdCBuZXcgZGVwZW5kZW5jaWVzIHZpYSBxdWVyeSBjb25maWcgdG8gYXZvaWRcblx0XHQvLyB0aGUgcG90ZW50aWFsIG9mIG1hbGljaW91cyBzY3JpcHQgaW5qZWN0aW9uXG5cdFx0aWYoIHR5cGVvZiBxdWVyeVsnZGVwZW5kZW5jaWVzJ10gIT09ICd1bmRlZmluZWQnICkgZGVsZXRlIHF1ZXJ5WydkZXBlbmRlbmNpZXMnXTtcblxuXHRcdC8vIENvcHkgb3B0aW9ucyBvdmVyIHRvIG91ciBjb25maWcgb2JqZWN0XG5cdFx0ZXh0ZW5kKCBjb25maWcsIG9wdGlvbnMgKTtcblx0XHRleHRlbmQoIGNvbmZpZywgcXVlcnkgKTtcblxuXHRcdC8vIEhpZGUgdGhlIGFkZHJlc3MgYmFyIGluIG1vYmlsZSBicm93c2Vyc1xuXHRcdGhpZGVBZGRyZXNzQmFyKCk7XG5cblx0XHQvLyBMb2FkcyB0aGUgZGVwZW5kZW5jaWVzIGFuZCBjb250aW51ZXMgdG8gI3N0YXJ0KCkgb25jZSBkb25lXG5cdFx0bG9hZCgpO1xuXG5cdH1cblxuXHQvKipcblx0ICogSW5zcGVjdCB0aGUgY2xpZW50IHRvIHNlZSB3aGF0IGl0J3MgY2FwYWJsZSBvZiwgdGhpc1xuXHQgKiBzaG91bGQgb25seSBoYXBwZW5zIG9uY2UgcGVyIHJ1bnRpbWUuXG5cdCAqL1xuXHRmdW5jdGlvbiBjaGVja0NhcGFiaWxpdGllcygpIHtcblxuXHRcdGlzTW9iaWxlRGV2aWNlID0gLyhpcGhvbmV8aXBvZHxpcGFkfGFuZHJvaWQpL2dpLnRlc3QoIFVBICk7XG5cdFx0aXNDaHJvbWUgPSAvY2hyb21lL2kudGVzdCggVUEgKSAmJiAhL2VkZ2UvaS50ZXN0KCBVQSApO1xuXG5cdFx0dmFyIHRlc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblxuXHRcdGZlYXR1cmVzLnRyYW5zZm9ybXMzZCA9ICdXZWJraXRQZXJzcGVjdGl2ZScgaW4gdGVzdEVsZW1lbnQuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQnTW96UGVyc3BlY3RpdmUnIGluIHRlc3RFbGVtZW50LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J21zUGVyc3BlY3RpdmUnIGluIHRlc3RFbGVtZW50LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J09QZXJzcGVjdGl2ZScgaW4gdGVzdEVsZW1lbnQuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQncGVyc3BlY3RpdmUnIGluIHRlc3RFbGVtZW50LnN0eWxlO1xuXG5cdFx0ZmVhdHVyZXMudHJhbnNmb3JtczJkID0gJ1dlYmtpdFRyYW5zZm9ybScgaW4gdGVzdEVsZW1lbnQuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQnTW96VHJhbnNmb3JtJyBpbiB0ZXN0RWxlbWVudC5zdHlsZSB8fFxuXHRcdFx0XHRcdFx0XHRcdCdtc1RyYW5zZm9ybScgaW4gdGVzdEVsZW1lbnQuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQnT1RyYW5zZm9ybScgaW4gdGVzdEVsZW1lbnQuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQndHJhbnNmb3JtJyBpbiB0ZXN0RWxlbWVudC5zdHlsZTtcblxuXHRcdGZlYXR1cmVzLnJlcXVlc3RBbmltYXRpb25GcmFtZU1ldGhvZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuXHRcdGZlYXR1cmVzLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHR5cGVvZiBmZWF0dXJlcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVNZXRob2QgPT09ICdmdW5jdGlvbic7XG5cblx0XHRmZWF0dXJlcy5jYW52YXMgPSAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICkuZ2V0Q29udGV4dDtcblxuXHRcdC8vIFRyYW5zaXRpb25zIGluIHRoZSBvdmVydmlldyBhcmUgZGlzYWJsZWQgaW4gZGVza3RvcCBhbmRcblx0XHQvLyBTYWZhcmkgZHVlIHRvIGxhZ1xuXHRcdGZlYXR1cmVzLm92ZXJ2aWV3VHJhbnNpdGlvbnMgPSAhL1ZlcnNpb25cXC9bXFxkXFwuXSsuKlNhZmFyaS8udGVzdCggVUEgKTtcblxuXHRcdC8vIEZsYWdzIGlmIHdlIHNob3VsZCB1c2Ugem9vbSBpbnN0ZWFkIG9mIHRyYW5zZm9ybSB0byBzY2FsZVxuXHRcdC8vIHVwIHNsaWRlcy4gWm9vbSBwcm9kdWNlcyBjcmlzcGVyIHJlc3VsdHMgYnV0IGhhcyBhIGxvdCBvZlxuXHRcdC8vIHhicm93c2VyIHF1aXJrcyBzbyB3ZSBvbmx5IHVzZSBpdCBpbiB3aGl0ZWxzaXRlZCBicm93c2Vycy5cblx0XHRmZWF0dXJlcy56b29tID0gJ3pvb20nIGluIHRlc3RFbGVtZW50LnN0eWxlICYmICFpc01vYmlsZURldmljZSAmJlxuXHRcdFx0XHRcdFx0KCBpc0Nocm9tZSB8fCAvVmVyc2lvblxcL1tcXGRcXC5dKy4qU2FmYXJpLy50ZXN0KCBVQSApICk7XG5cblx0fVxuXG4gICAgLyoqXG4gICAgICogTG9hZHMgdGhlIGRlcGVuZGVuY2llcyBvZiByZXZlYWwuanMuIERlcGVuZGVuY2llcyBhcmVcbiAgICAgKiBkZWZpbmVkIHZpYSB0aGUgY29uZmlndXJhdGlvbiBvcHRpb24gJ2RlcGVuZGVuY2llcydcbiAgICAgKiBhbmQgd2lsbCBiZSBsb2FkZWQgcHJpb3IgdG8gc3RhcnRpbmcvYmluZGluZyByZXZlYWwuanMuXG4gICAgICogU29tZSBkZXBlbmRlbmNpZXMgbWF5IGhhdmUgYW4gJ2FzeW5jJyBmbGFnLCBpZiBzbyB0aGV5XG4gICAgICogd2lsbCBsb2FkIGFmdGVyIHJldmVhbC5qcyBoYXMgYmVlbiBzdGFydGVkIHVwLlxuICAgICAqL1xuXHRmdW5jdGlvbiBsb2FkKCkge1xuXG5cdFx0dmFyIHNjcmlwdHMgPSBbXSxcblx0XHRcdHNjcmlwdHNBc3luYyA9IFtdLFxuXHRcdFx0c2NyaXB0c1RvUHJlbG9hZCA9IDA7XG5cblx0XHQvLyBDYWxsZWQgb25jZSBzeW5jaHJvbm91cyBzY3JpcHRzIGZpbmlzaCBsb2FkaW5nXG5cdFx0ZnVuY3Rpb24gcHJvY2VlZCgpIHtcblx0XHRcdGlmKCBzY3JpcHRzQXN5bmMubGVuZ3RoICkge1xuXHRcdFx0XHQvLyBMb2FkIGFzeW5jaHJvbm91cyBzY3JpcHRzXG5cdFx0XHRcdGhlYWQuanMuYXBwbHkoIG51bGwsIHNjcmlwdHNBc3luYyApO1xuXHRcdFx0fVxuXG5cdFx0XHRzdGFydCgpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGxvYWRTY3JpcHQoIHMgKSB7XG5cdFx0XHRoZWFkLnJlYWR5KCBzLnNyYy5tYXRjaCggLyhbXFx3XFxkX1xcLV0qKVxcLj9qcyR8W15cXFxcXFwvXSokL2kgKVswXSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vIEV4dGVuc2lvbiBtYXkgY29udGFpbiBjYWxsYmFjayBmdW5jdGlvbnNcblx0XHRcdFx0aWYoIHR5cGVvZiBzLmNhbGxiYWNrID09PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0XHRcdHMuY2FsbGJhY2suYXBwbHkoIHRoaXMgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCAtLXNjcmlwdHNUb1ByZWxvYWQgPT09IDAgKSB7XG5cdFx0XHRcdFx0cHJvY2VlZCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gY29uZmlnLmRlcGVuZGVuY2llcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdHZhciBzID0gY29uZmlnLmRlcGVuZGVuY2llc1tpXTtcblxuXHRcdFx0Ly8gTG9hZCBpZiB0aGVyZSdzIG5vIGNvbmRpdGlvbiBvciB0aGUgY29uZGl0aW9uIGlzIHRydXRoeVxuXHRcdFx0aWYoICFzLmNvbmRpdGlvbiB8fCBzLmNvbmRpdGlvbigpICkge1xuXHRcdFx0XHRpZiggcy5hc3luYyApIHtcblx0XHRcdFx0XHRzY3JpcHRzQXN5bmMucHVzaCggcy5zcmMgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRzY3JpcHRzLnB1c2goIHMuc3JjICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsb2FkU2NyaXB0KCBzICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoIHNjcmlwdHMubGVuZ3RoICkge1xuXHRcdFx0c2NyaXB0c1RvUHJlbG9hZCA9IHNjcmlwdHMubGVuZ3RoO1xuXG5cdFx0XHQvLyBMb2FkIHN5bmNocm9ub3VzIHNjcmlwdHNcblx0XHRcdGhlYWQuanMuYXBwbHkoIG51bGwsIHNjcmlwdHMgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRwcm9jZWVkKCk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogU3RhcnRzIHVwIHJldmVhbC5qcyBieSBiaW5kaW5nIGlucHV0IGV2ZW50cyBhbmQgbmF2aWdhdGluZ1xuXHQgKiB0byB0aGUgY3VycmVudCBVUkwgZGVlcGxpbmsgaWYgdGhlcmUgaXMgb25lLlxuXHQgKi9cblx0ZnVuY3Rpb24gc3RhcnQoKSB7XG5cblx0XHQvLyBNYWtlIHN1cmUgd2UndmUgZ290IGFsbCB0aGUgRE9NIGVsZW1lbnRzIHdlIG5lZWRcblx0XHRzZXR1cERPTSgpO1xuXG5cdFx0Ly8gTGlzdGVuIHRvIG1lc3NhZ2VzIHBvc3RlZCB0byB0aGlzIHdpbmRvd1xuXHRcdHNldHVwUG9zdE1lc3NhZ2UoKTtcblxuXHRcdC8vIFByZXZlbnQgdGhlIHNsaWRlcyBmcm9tIGJlaW5nIHNjcm9sbGVkIG91dCBvZiB2aWV3XG5cdFx0c2V0dXBTY3JvbGxQcmV2ZW50aW9uKCk7XG5cblx0XHQvLyBSZXNldHMgYWxsIHZlcnRpY2FsIHNsaWRlcyBzbyB0aGF0IG9ubHkgdGhlIGZpcnN0IGlzIHZpc2libGVcblx0XHRyZXNldFZlcnRpY2FsU2xpZGVzKCk7XG5cblx0XHQvLyBVcGRhdGVzIHRoZSBwcmVzZW50YXRpb24gdG8gbWF0Y2ggdGhlIGN1cnJlbnQgY29uZmlndXJhdGlvbiB2YWx1ZXNcblx0XHRjb25maWd1cmUoKTtcblxuXHRcdC8vIFJlYWQgdGhlIGluaXRpYWwgaGFzaFxuXHRcdHJlYWRVUkwoKTtcblxuXHRcdC8vIFVwZGF0ZSBhbGwgYmFja2dyb3VuZHNcblx0XHR1cGRhdGVCYWNrZ3JvdW5kKCB0cnVlICk7XG5cblx0XHQvLyBOb3RpZnkgbGlzdGVuZXJzIHRoYXQgdGhlIHByZXNlbnRhdGlvbiBpcyByZWFkeSBidXQgdXNlIGEgMW1zXG5cdFx0Ly8gdGltZW91dCB0byBlbnN1cmUgaXQncyBub3QgZmlyZWQgc3luY2hyb25vdXNseSBhZnRlciAjaW5pdGlhbGl6ZSgpXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBFbmFibGUgdHJhbnNpdGlvbnMgbm93IHRoYXQgd2UncmUgbG9hZGVkXG5cdFx0XHRkb20uc2xpZGVzLmNsYXNzTGlzdC5yZW1vdmUoICduby10cmFuc2l0aW9uJyApO1xuXG5cdFx0XHRsb2FkZWQgPSB0cnVlO1xuXG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QuYWRkKCAncmVhZHknICk7XG5cblx0XHRcdGRpc3BhdGNoRXZlbnQoICdyZWFkeScsIHtcblx0XHRcdFx0J2luZGV4aCc6IGluZGV4aCxcblx0XHRcdFx0J2luZGV4dic6IGluZGV4dixcblx0XHRcdFx0J2N1cnJlbnRTbGlkZSc6IGN1cnJlbnRTbGlkZVxuXHRcdFx0fSApO1xuXHRcdH0sIDEgKTtcblxuXHRcdC8vIFNwZWNpYWwgc2V0dXAgYW5kIGNvbmZpZyBpcyByZXF1aXJlZCB3aGVuIHByaW50aW5nIHRvIFBERlxuXHRcdGlmKCBpc1ByaW50aW5nUERGKCkgKSB7XG5cdFx0XHRyZW1vdmVFdmVudExpc3RlbmVycygpO1xuXG5cdFx0XHQvLyBUaGUgZG9jdW1lbnQgbmVlZHMgdG8gaGF2ZSBsb2FkZWQgZm9yIHRoZSBQREYgbGF5b3V0XG5cdFx0XHQvLyBtZWFzdXJlbWVudHMgdG8gYmUgYWNjdXJhdGVcblx0XHRcdGlmKCBkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnICkge1xuXHRcdFx0XHRzZXR1cFBERigpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIHNldHVwUERGICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogRmluZHMgYW5kIHN0b3JlcyByZWZlcmVuY2VzIHRvIERPTSBlbGVtZW50cyB3aGljaCBhcmVcblx0ICogcmVxdWlyZWQgYnkgdGhlIHByZXNlbnRhdGlvbi4gSWYgYSByZXF1aXJlZCBlbGVtZW50IGlzXG5cdCAqIG5vdCBmb3VuZCwgaXQgaXMgY3JlYXRlZC5cblx0ICovXG5cdGZ1bmN0aW9uIHNldHVwRE9NKCkge1xuXG5cdFx0Ly8gUHJldmVudCB0cmFuc2l0aW9ucyB3aGlsZSB3ZSdyZSBsb2FkaW5nXG5cdFx0ZG9tLnNsaWRlcy5jbGFzc0xpc3QuYWRkKCAnbm8tdHJhbnNpdGlvbicgKTtcblxuXHRcdC8vIEJhY2tncm91bmQgZWxlbWVudFxuXHRcdGRvbS5iYWNrZ3JvdW5kID0gY3JlYXRlU2luZ2xldG9uTm9kZSggZG9tLndyYXBwZXIsICdkaXYnLCAnYmFja2dyb3VuZHMnLCBudWxsICk7XG5cblx0XHQvLyBQcm9ncmVzcyBiYXJcblx0XHRkb20ucHJvZ3Jlc3MgPSBjcmVhdGVTaW5nbGV0b25Ob2RlKCBkb20ud3JhcHBlciwgJ2RpdicsICdwcm9ncmVzcycsICc8c3Bhbj48L3NwYW4+JyApO1xuXHRcdGRvbS5wcm9ncmVzc2JhciA9IGRvbS5wcm9ncmVzcy5xdWVyeVNlbGVjdG9yKCAnc3BhbicgKTtcblxuXHRcdC8vIEFycm93IGNvbnRyb2xzXG5cdFx0Y3JlYXRlU2luZ2xldG9uTm9kZSggZG9tLndyYXBwZXIsICdhc2lkZScsICdjb250cm9scycsXG5cdFx0XHQnPGJ1dHRvbiBjbGFzcz1cIm5hdmlnYXRlLWxlZnRcIiBhcmlhLWxhYmVsPVwicHJldmlvdXMgc2xpZGVcIj48L2J1dHRvbj4nICtcblx0XHRcdCc8YnV0dG9uIGNsYXNzPVwibmF2aWdhdGUtcmlnaHRcIiBhcmlhLWxhYmVsPVwibmV4dCBzbGlkZVwiPjwvYnV0dG9uPicgK1xuXHRcdFx0JzxidXR0b24gY2xhc3M9XCJuYXZpZ2F0ZS11cFwiIGFyaWEtbGFiZWw9XCJhYm92ZSBzbGlkZVwiPjwvYnV0dG9uPicgK1xuXHRcdFx0JzxidXR0b24gY2xhc3M9XCJuYXZpZ2F0ZS1kb3duXCIgYXJpYS1sYWJlbD1cImJlbG93IHNsaWRlXCI+PC9idXR0b24+JyApO1xuXG5cdFx0Ly8gU2xpZGUgbnVtYmVyXG5cdFx0ZG9tLnNsaWRlTnVtYmVyID0gY3JlYXRlU2luZ2xldG9uTm9kZSggZG9tLndyYXBwZXIsICdkaXYnLCAnc2xpZGUtbnVtYmVyJywgJycgKTtcblxuXHRcdC8vIEVsZW1lbnQgY29udGFpbmluZyBub3RlcyB0aGF0IGFyZSB2aXNpYmxlIHRvIHRoZSBhdWRpZW5jZVxuXHRcdGRvbS5zcGVha2VyTm90ZXMgPSBjcmVhdGVTaW5nbGV0b25Ob2RlKCBkb20ud3JhcHBlciwgJ2RpdicsICdzcGVha2VyLW5vdGVzJywgbnVsbCApO1xuXHRcdGRvbS5zcGVha2VyTm90ZXMuc2V0QXR0cmlidXRlKCAnZGF0YS1wcmV2ZW50LXN3aXBlJywgJycgKTtcblx0XHRkb20uc3BlYWtlck5vdGVzLnNldEF0dHJpYnV0ZSggJ3RhYmluZGV4JywgJzAnICk7XG5cblx0XHQvLyBPdmVybGF5IGdyYXBoaWMgd2hpY2ggaXMgZGlzcGxheWVkIGR1cmluZyB0aGUgcGF1c2VkIG1vZGVcblx0XHRjcmVhdGVTaW5nbGV0b25Ob2RlKCBkb20ud3JhcHBlciwgJ2RpdicsICdwYXVzZS1vdmVybGF5JywgbnVsbCApO1xuXG5cdFx0Ly8gQ2FjaGUgcmVmZXJlbmNlcyB0byBlbGVtZW50c1xuXHRcdGRvbS5jb250cm9scyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoICcucmV2ZWFsIC5jb250cm9scycgKTtcblxuXHRcdGRvbS53cmFwcGVyLnNldEF0dHJpYnV0ZSggJ3JvbGUnLCAnYXBwbGljYXRpb24nICk7XG5cblx0XHQvLyBUaGVyZSBjYW4gYmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIGNvbnRyb2xzIHRocm91Z2hvdXQgdGhlIHBhZ2Vcblx0XHRkb20uY29udHJvbHNMZWZ0ID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5uYXZpZ2F0ZS1sZWZ0JyApICk7XG5cdFx0ZG9tLmNvbnRyb2xzUmlnaHQgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLm5hdmlnYXRlLXJpZ2h0JyApICk7XG5cdFx0ZG9tLmNvbnRyb2xzVXAgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLm5hdmlnYXRlLXVwJyApICk7XG5cdFx0ZG9tLmNvbnRyb2xzRG93biA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcubmF2aWdhdGUtZG93bicgKSApO1xuXHRcdGRvbS5jb250cm9sc1ByZXYgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLm5hdmlnYXRlLXByZXYnICkgKTtcblx0XHRkb20uY29udHJvbHNOZXh0ID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5uYXZpZ2F0ZS1uZXh0JyApICk7XG5cblx0XHRkb20uc3RhdHVzRGl2ID0gY3JlYXRlU3RhdHVzRGl2KCk7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIGhpZGRlbiBkaXYgd2l0aCByb2xlIGFyaWEtbGl2ZSB0byBhbm5vdW5jZSB0aGVcblx0ICogY3VycmVudCBzbGlkZSBjb250ZW50LiBIaWRlIHRoZSBkaXYgb2ZmLXNjcmVlbiB0byBtYWtlIGl0XG5cdCAqIGF2YWlsYWJsZSBvbmx5IHRvIEFzc2lzdGl2ZSBUZWNobm9sb2dpZXMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlU3RhdHVzRGl2KCkge1xuXG5cdFx0dmFyIHN0YXR1c0RpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnYXJpYS1zdGF0dXMtZGl2JyApO1xuXHRcdGlmKCAhc3RhdHVzRGl2ICkge1xuXHRcdFx0c3RhdHVzRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHRcdHN0YXR1c0Rpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRzdGF0dXNEaXYuc3R5bGUuaGVpZ2h0ID0gJzFweCc7XG5cdFx0XHRzdGF0dXNEaXYuc3R5bGUud2lkdGggPSAnMXB4Jztcblx0XHRcdHN0YXR1c0Rpdi5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXHRcdFx0c3RhdHVzRGl2LnN0eWxlLmNsaXAgPSAncmVjdCggMXB4LCAxcHgsIDFweCwgMXB4ICknO1xuXHRcdFx0c3RhdHVzRGl2LnNldEF0dHJpYnV0ZSggJ2lkJywgJ2FyaWEtc3RhdHVzLWRpdicgKTtcblx0XHRcdHN0YXR1c0Rpdi5zZXRBdHRyaWJ1dGUoICdhcmlhLWxpdmUnLCAncG9saXRlJyApO1xuXHRcdFx0c3RhdHVzRGl2LnNldEF0dHJpYnV0ZSggJ2FyaWEtYXRvbWljJywndHJ1ZScgKTtcblx0XHRcdGRvbS53cmFwcGVyLmFwcGVuZENoaWxkKCBzdGF0dXNEaXYgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHN0YXR1c0RpdjtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIHRoZSBnaXZlbiBIVE1MIGVsZW1lbnQgaW50byBhIHN0cmluZyBvZiB0ZXh0XG5cdCAqIHRoYXQgY2FuIGJlIGFubm91bmNlZCB0byBhIHNjcmVlbiByZWFkZXIuIEhpZGRlblxuXHQgKiBlbGVtZW50cyBhcmUgZXhjbHVkZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRTdGF0dXNUZXh0KCBub2RlICkge1xuXG5cdFx0dmFyIHRleHQgPSAnJztcblxuXHRcdC8vIFRleHQgbm9kZVxuXHRcdGlmKCBub2RlLm5vZGVUeXBlID09PSAzICkge1xuXHRcdFx0dGV4dCArPSBub2RlLnRleHRDb250ZW50O1xuXHRcdH1cblx0XHQvLyBFbGVtZW50IG5vZGVcblx0XHRlbHNlIGlmKCBub2RlLm5vZGVUeXBlID09PSAxICkge1xuXG5cdFx0XHR2YXIgaXNBcmlhSGlkZGVuID0gbm9kZS5nZXRBdHRyaWJ1dGUoICdhcmlhLWhpZGRlbicgKTtcblx0XHRcdHZhciBpc0Rpc3BsYXlIaWRkZW4gPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSggbm9kZSApWydkaXNwbGF5J10gPT09ICdub25lJztcblx0XHRcdGlmKCBpc0FyaWFIaWRkZW4gIT09ICd0cnVlJyAmJiAhaXNEaXNwbGF5SGlkZGVuICkge1xuXG5cdFx0XHRcdHRvQXJyYXkoIG5vZGUuY2hpbGROb2RlcyApLmZvckVhY2goIGZ1bmN0aW9uKCBjaGlsZCApIHtcblx0XHRcdFx0XHR0ZXh0ICs9IGdldFN0YXR1c1RleHQoIGNoaWxkICk7XG5cdFx0XHRcdH0gKTtcblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRleHQ7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDb25maWd1cmVzIHRoZSBwcmVzZW50YXRpb24gZm9yIHByaW50aW5nIHRvIGEgc3RhdGljXG5cdCAqIFBERi5cblx0ICovXG5cdGZ1bmN0aW9uIHNldHVwUERGKCkge1xuXG5cdFx0dmFyIHNsaWRlU2l6ZSA9IGdldENvbXB1dGVkU2xpZGVTaXplKCB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0ICk7XG5cblx0XHQvLyBEaW1lbnNpb25zIG9mIHRoZSBQREYgcGFnZXNcblx0XHR2YXIgcGFnZVdpZHRoID0gTWF0aC5mbG9vciggc2xpZGVTaXplLndpZHRoICogKCAxICsgY29uZmlnLm1hcmdpbiApICksXG5cdFx0XHRwYWdlSGVpZ2h0ID0gTWF0aC5mbG9vciggc2xpZGVTaXplLmhlaWdodCAqICggMSArIGNvbmZpZy5tYXJnaW4gKSApO1xuXG5cdFx0Ly8gRGltZW5zaW9ucyBvZiBzbGlkZXMgd2l0aGluIHRoZSBwYWdlc1xuXHRcdHZhciBzbGlkZVdpZHRoID0gc2xpZGVTaXplLndpZHRoLFxuXHRcdFx0c2xpZGVIZWlnaHQgPSBzbGlkZVNpemUuaGVpZ2h0O1xuXG5cdFx0Ly8gTGV0IHRoZSBicm93c2VyIGtub3cgd2hhdCBwYWdlIHNpemUgd2Ugd2FudCB0byBwcmludFxuXHRcdGluamVjdFN0eWxlU2hlZXQoICdAcGFnZXtzaXplOicrIHBhZ2VXaWR0aCArJ3B4ICcrIHBhZ2VIZWlnaHQgKydweDsgbWFyZ2luOiAwcHg7fScgKTtcblxuXHRcdC8vIExpbWl0IHRoZSBzaXplIG9mIGNlcnRhaW4gZWxlbWVudHMgdG8gdGhlIGRpbWVuc2lvbnMgb2YgdGhlIHNsaWRlXG5cdFx0aW5qZWN0U3R5bGVTaGVldCggJy5yZXZlYWwgc2VjdGlvbj5pbWcsIC5yZXZlYWwgc2VjdGlvbj52aWRlbywgLnJldmVhbCBzZWN0aW9uPmlmcmFtZXttYXgtd2lkdGg6ICcrIHNsaWRlV2lkdGggKydweDsgbWF4LWhlaWdodDonKyBzbGlkZUhlaWdodCArJ3B4fScgKTtcblxuXHRcdGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCggJ3ByaW50LXBkZicgKTtcblx0XHRkb2N1bWVudC5ib2R5LnN0eWxlLndpZHRoID0gcGFnZVdpZHRoICsgJ3B4Jztcblx0XHRkb2N1bWVudC5ib2R5LnN0eWxlLmhlaWdodCA9IHBhZ2VIZWlnaHQgKyAncHgnO1xuXG5cdFx0Ly8gTWFrZSBzdXJlIHN0cmV0Y2ggZWxlbWVudHMgZml0IG9uIHNsaWRlXG5cdFx0bGF5b3V0U2xpZGVDb250ZW50cyggc2xpZGVXaWR0aCwgc2xpZGVIZWlnaHQgKTtcblxuXHRcdC8vIEFkZCBlYWNoIHNsaWRlJ3MgaW5kZXggYXMgYXR0cmlidXRlcyBvbiBpdHNlbGYsIHdlIG5lZWQgdGhlc2Vcblx0XHQvLyBpbmRpY2VzIHRvIGdlbmVyYXRlIHNsaWRlIG51bWJlcnMgYmVsb3dcblx0XHR0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApICkuZm9yRWFjaCggZnVuY3Rpb24oIGhzbGlkZSwgaCApIHtcblx0XHRcdGhzbGlkZS5zZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LWgnLCBoICk7XG5cblx0XHRcdGlmKCBoc2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAnc3RhY2snICkgKSB7XG5cdFx0XHRcdHRvQXJyYXkoIGhzbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKSApLmZvckVhY2goIGZ1bmN0aW9uKCB2c2xpZGUsIHYgKSB7XG5cdFx0XHRcdFx0dnNsaWRlLnNldEF0dHJpYnV0ZSggJ2RhdGEtaW5kZXgtaCcsIGggKTtcblx0XHRcdFx0XHR2c2xpZGUuc2V0QXR0cmlidXRlKCAnZGF0YS1pbmRleC12JywgdiApO1xuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0Ly8gU2xpZGUgYW5kIHNsaWRlIGJhY2tncm91bmQgbGF5b3V0XG5cdFx0dG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggc2xpZGUgKSB7XG5cblx0XHRcdC8vIFZlcnRpY2FsIHN0YWNrcyBhcmUgbm90IGNlbnRyZWQgc2luY2UgdGhlaXIgc2VjdGlvblxuXHRcdFx0Ly8gY2hpbGRyZW4gd2lsbCBiZVxuXHRcdFx0aWYoIHNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ3N0YWNrJyApID09PSBmYWxzZSApIHtcblx0XHRcdFx0Ly8gQ2VudGVyIHRoZSBzbGlkZSBpbnNpZGUgb2YgdGhlIHBhZ2UsIGdpdmluZyB0aGUgc2xpZGUgc29tZSBtYXJnaW5cblx0XHRcdFx0dmFyIGxlZnQgPSAoIHBhZ2VXaWR0aCAtIHNsaWRlV2lkdGggKSAvIDIsXG5cdFx0XHRcdFx0dG9wID0gKCBwYWdlSGVpZ2h0IC0gc2xpZGVIZWlnaHQgKSAvIDI7XG5cblx0XHRcdFx0dmFyIGNvbnRlbnRIZWlnaHQgPSBzbGlkZS5zY3JvbGxIZWlnaHQ7XG5cdFx0XHRcdHZhciBudW1iZXJPZlBhZ2VzID0gTWF0aC5tYXgoIE1hdGguY2VpbCggY29udGVudEhlaWdodCAvIHBhZ2VIZWlnaHQgKSwgMSApO1xuXG5cdFx0XHRcdC8vIEFkaGVyZSB0byBjb25maWd1cmVkIHBhZ2VzIHBlciBzbGlkZSBsaW1pdFxuXHRcdFx0XHRudW1iZXJPZlBhZ2VzID0gTWF0aC5taW4oIG51bWJlck9mUGFnZXMsIGNvbmZpZy5wZGZNYXhQYWdlc1BlclNsaWRlICk7XG5cblx0XHRcdFx0Ly8gQ2VudGVyIHNsaWRlcyB2ZXJ0aWNhbGx5XG5cdFx0XHRcdGlmKCBudW1iZXJPZlBhZ2VzID09PSAxICYmIGNvbmZpZy5jZW50ZXIgfHwgc2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAnY2VudGVyJyApICkge1xuXHRcdFx0XHRcdHRvcCA9IE1hdGgubWF4KCAoIHBhZ2VIZWlnaHQgLSBjb250ZW50SGVpZ2h0ICkgLyAyLCAwICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBXcmFwIHRoZSBzbGlkZSBpbiBhIHBhZ2UgZWxlbWVudCBhbmQgaGlkZSBpdHMgb3ZlcmZsb3dcblx0XHRcdFx0Ly8gc28gdGhhdCBubyBwYWdlIGV2ZXIgZmxvd3Mgb250byBhbm90aGVyXG5cdFx0XHRcdHZhciBwYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHRcdFx0cGFnZS5jbGFzc05hbWUgPSAncGRmLXBhZ2UnO1xuXHRcdFx0XHRwYWdlLnN0eWxlLmhlaWdodCA9ICggKCBwYWdlSGVpZ2h0ICsgY29uZmlnLnBkZlBhZ2VIZWlnaHRPZmZzZXQgKSAqIG51bWJlck9mUGFnZXMgKSArICdweCc7XG5cdFx0XHRcdHNsaWRlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKCBwYWdlLCBzbGlkZSApO1xuXHRcdFx0XHRwYWdlLmFwcGVuZENoaWxkKCBzbGlkZSApO1xuXG5cdFx0XHRcdC8vIFBvc2l0aW9uIHRoZSBzbGlkZSBpbnNpZGUgb2YgdGhlIHBhZ2Vcblx0XHRcdFx0c2xpZGUuc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnO1xuXHRcdFx0XHRzbGlkZS5zdHlsZS50b3AgPSB0b3AgKyAncHgnO1xuXHRcdFx0XHRzbGlkZS5zdHlsZS53aWR0aCA9IHNsaWRlV2lkdGggKyAncHgnO1xuXG5cdFx0XHRcdGlmKCBzbGlkZS5zbGlkZUJhY2tncm91bmRFbGVtZW50ICkge1xuXHRcdFx0XHRcdHBhZ2UuaW5zZXJ0QmVmb3JlKCBzbGlkZS5zbGlkZUJhY2tncm91bmRFbGVtZW50LCBzbGlkZSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gSW5qZWN0IG5vdGVzIGlmIGBzaG93Tm90ZXNgIGlzIGVuYWJsZWRcblx0XHRcdFx0aWYoIGNvbmZpZy5zaG93Tm90ZXMgKSB7XG5cblx0XHRcdFx0XHQvLyBBcmUgdGhlcmUgbm90ZXMgZm9yIHRoaXMgc2xpZGU/XG5cdFx0XHRcdFx0dmFyIG5vdGVzID0gZ2V0U2xpZGVOb3Rlcyggc2xpZGUgKTtcblx0XHRcdFx0XHRpZiggbm90ZXMgKSB7XG5cblx0XHRcdFx0XHRcdHZhciBub3Rlc1NwYWNpbmcgPSA4O1xuXHRcdFx0XHRcdFx0dmFyIG5vdGVzTGF5b3V0ID0gdHlwZW9mIGNvbmZpZy5zaG93Tm90ZXMgPT09ICdzdHJpbmcnID8gY29uZmlnLnNob3dOb3RlcyA6ICdpbmxpbmUnO1xuXHRcdFx0XHRcdFx0dmFyIG5vdGVzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdFx0XHRcdFx0XHRub3Rlc0VsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ3NwZWFrZXItbm90ZXMnICk7XG5cdFx0XHRcdFx0XHRub3Rlc0VsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ3NwZWFrZXItbm90ZXMtcGRmJyApO1xuXHRcdFx0XHRcdFx0bm90ZXNFbGVtZW50LnNldEF0dHJpYnV0ZSggJ2RhdGEtbGF5b3V0Jywgbm90ZXNMYXlvdXQgKTtcblx0XHRcdFx0XHRcdG5vdGVzRWxlbWVudC5pbm5lckhUTUwgPSBub3RlcztcblxuXHRcdFx0XHRcdFx0aWYoIG5vdGVzTGF5b3V0ID09PSAnc2VwYXJhdGUtcGFnZScgKSB7XG5cdFx0XHRcdFx0XHRcdHBhZ2UucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoIG5vdGVzRWxlbWVudCwgcGFnZS5uZXh0U2libGluZyApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdG5vdGVzRWxlbWVudC5zdHlsZS5sZWZ0ID0gbm90ZXNTcGFjaW5nICsgJ3B4Jztcblx0XHRcdFx0XHRcdFx0bm90ZXNFbGVtZW50LnN0eWxlLmJvdHRvbSA9IG5vdGVzU3BhY2luZyArICdweCc7XG5cdFx0XHRcdFx0XHRcdG5vdGVzRWxlbWVudC5zdHlsZS53aWR0aCA9ICggcGFnZVdpZHRoIC0gbm90ZXNTcGFjaW5nKjIgKSArICdweCc7XG5cdFx0XHRcdFx0XHRcdHBhZ2UuYXBwZW5kQ2hpbGQoIG5vdGVzRWxlbWVudCApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBJbmplY3Qgc2xpZGUgbnVtYmVycyBpZiBgc2xpZGVOdW1iZXJzYCBhcmUgZW5hYmxlZFxuXHRcdFx0XHRpZiggY29uZmlnLnNsaWRlTnVtYmVyICYmIC9hbGx8cHJpbnQvaS50ZXN0KCBjb25maWcuc2hvd1NsaWRlTnVtYmVyICkgKSB7XG5cdFx0XHRcdFx0dmFyIHNsaWRlTnVtYmVySCA9IHBhcnNlSW50KCBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LWgnICksIDEwICkgKyAxLFxuXHRcdFx0XHRcdFx0c2xpZGVOdW1iZXJWID0gcGFyc2VJbnQoIHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtaW5kZXgtdicgKSwgMTAgKSArIDE7XG5cblx0XHRcdFx0XHR2YXIgbnVtYmVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdFx0XHRcdFx0bnVtYmVyRWxlbWVudC5jbGFzc0xpc3QuYWRkKCAnc2xpZGUtbnVtYmVyJyApO1xuXHRcdFx0XHRcdG51bWJlckVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ3NsaWRlLW51bWJlci1wZGYnICk7XG5cdFx0XHRcdFx0bnVtYmVyRWxlbWVudC5pbm5lckhUTUwgPSBmb3JtYXRTbGlkZU51bWJlciggc2xpZGVOdW1iZXJILCAnLicsIHNsaWRlTnVtYmVyViApO1xuXHRcdFx0XHRcdHBhZ2UuYXBwZW5kQ2hpbGQoIG51bWJlckVsZW1lbnQgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0fSApO1xuXG5cdFx0Ly8gU2hvdyBhbGwgZnJhZ21lbnRzXG5cdFx0dG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICsgJyAuZnJhZ21lbnQnICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZnJhZ21lbnQgKSB7XG5cdFx0XHRmcmFnbWVudC5jbGFzc0xpc3QuYWRkKCAndmlzaWJsZScgKTtcblx0XHR9ICk7XG5cblx0XHQvLyBOb3RpZnkgc3Vic2NyaWJlcnMgdGhhdCB0aGUgUERGIGxheW91dCBpcyBnb29kIHRvIGdvXG5cdFx0ZGlzcGF0Y2hFdmVudCggJ3BkZi1yZWFkeScgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFRoaXMgaXMgYW4gdW5mb3J0dW5hdGUgbmVjZXNzaXR5LiBTb21lIGFjdGlvbnMg4oCTIHN1Y2ggYXNcblx0ICogYW4gaW5wdXQgZmllbGQgYmVpbmcgZm9jdXNlZCBpbiBhbiBpZnJhbWUgb3IgdXNpbmcgdGhlXG5cdCAqIGtleWJvYXJkIHRvIGV4cGFuZCB0ZXh0IHNlbGVjdGlvbiBiZXlvbmQgdGhlIGJvdW5kcyBvZlxuXHQgKiBhIHNsaWRlIOKAkyBjYW4gdHJpZ2dlciBvdXIgY29udGVudCB0byBiZSBwdXNoZWQgb3V0IG9mIHZpZXcuXG5cdCAqIFRoaXMgc2Nyb2xsaW5nIGNhbiBub3QgYmUgcHJldmVudGVkIGJ5IGhpZGluZyBvdmVyZmxvdyBpblxuXHQgKiBDU1MgKHdlIGFscmVhZHkgZG8pIHNvIHdlIGhhdmUgdG8gcmVzb3J0IHRvIHJlcGVhdGVkbHlcblx0ICogY2hlY2tpbmcgaWYgdGhlIHNsaWRlcyBoYXZlIGJlZW4gb2Zmc2V0IDooXG5cdCAqL1xuXHRmdW5jdGlvbiBzZXR1cFNjcm9sbFByZXZlbnRpb24oKSB7XG5cblx0XHRzZXRJbnRlcnZhbCggZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiggZG9tLndyYXBwZXIuc2Nyb2xsVG9wICE9PSAwIHx8IGRvbS53cmFwcGVyLnNjcm9sbExlZnQgIT09IDAgKSB7XG5cdFx0XHRcdGRvbS53cmFwcGVyLnNjcm9sbFRvcCA9IDA7XG5cdFx0XHRcdGRvbS53cmFwcGVyLnNjcm9sbExlZnQgPSAwO1xuXHRcdFx0fVxuXHRcdH0sIDEwMDAgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYW4gSFRNTCBlbGVtZW50IGFuZCByZXR1cm5zIGEgcmVmZXJlbmNlIHRvIGl0LlxuXHQgKiBJZiB0aGUgZWxlbWVudCBhbHJlYWR5IGV4aXN0cyB0aGUgZXhpc3RpbmcgaW5zdGFuY2Ugd2lsbFxuXHQgKiBiZSByZXR1cm5lZC5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gY29udGFpbmVyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0YWduYW1lXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc25hbWVcblx0ICogQHBhcmFtIHtzdHJpbmd9IGlubmVySFRNTFxuXHQgKlxuXHQgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZVNpbmdsZXRvbk5vZGUoIGNvbnRhaW5lciwgdGFnbmFtZSwgY2xhc3NuYW1lLCBpbm5lckhUTUwgKSB7XG5cblx0XHQvLyBGaW5kIGFsbCBub2RlcyBtYXRjaGluZyB0aGUgZGVzY3JpcHRpb25cblx0XHR2YXIgbm9kZXMgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCggJy4nICsgY2xhc3NuYW1lICk7XG5cblx0XHQvLyBDaGVjayBhbGwgbWF0Y2hlcyB0byBmaW5kIG9uZSB3aGljaCBpcyBhIGRpcmVjdCBjaGlsZCBvZlxuXHRcdC8vIHRoZSBzcGVjaWZpZWQgY29udGFpbmVyXG5cdFx0Zm9yKCB2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKyApIHtcblx0XHRcdHZhciB0ZXN0Tm9kZSA9IG5vZGVzW2ldO1xuXHRcdFx0aWYoIHRlc3ROb2RlLnBhcmVudE5vZGUgPT09IGNvbnRhaW5lciApIHtcblx0XHRcdFx0cmV0dXJuIHRlc3ROb2RlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIElmIG5vIG5vZGUgd2FzIGZvdW5kLCBjcmVhdGUgaXQgbm93XG5cdFx0dmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCB0YWduYW1lICk7XG5cdFx0bm9kZS5jbGFzc0xpc3QuYWRkKCBjbGFzc25hbWUgKTtcblx0XHRpZiggdHlwZW9mIGlubmVySFRNTCA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHRub2RlLmlubmVySFRNTCA9IGlubmVySFRNTDtcblx0XHR9XG5cdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKCBub2RlICk7XG5cblx0XHRyZXR1cm4gbm9kZTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgdGhlIHNsaWRlIGJhY2tncm91bmQgZWxlbWVudHMgYW5kIGFwcGVuZHMgdGhlbVxuXHQgKiB0byB0aGUgYmFja2dyb3VuZCBjb250YWluZXIuIE9uZSBlbGVtZW50IGlzIGNyZWF0ZWQgcGVyXG5cdCAqIHNsaWRlIG5vIG1hdHRlciBpZiB0aGUgZ2l2ZW4gc2xpZGUgaGFzIHZpc2libGUgYmFja2dyb3VuZC5cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZUJhY2tncm91bmRzKCkge1xuXG5cdFx0dmFyIHByaW50TW9kZSA9IGlzUHJpbnRpbmdQREYoKTtcblxuXHRcdC8vIENsZWFyIHByaW9yIGJhY2tncm91bmRzXG5cdFx0ZG9tLmJhY2tncm91bmQuaW5uZXJIVE1MID0gJyc7XG5cdFx0ZG9tLmJhY2tncm91bmQuY2xhc3NMaXN0LmFkZCggJ25vLXRyYW5zaXRpb24nICk7XG5cblx0XHQvLyBJdGVyYXRlIG92ZXIgYWxsIGhvcml6b250YWwgc2xpZGVzXG5cdFx0dG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBzbGlkZWggKSB7XG5cblx0XHRcdHZhciBiYWNrZ3JvdW5kU3RhY2sgPSBjcmVhdGVCYWNrZ3JvdW5kKCBzbGlkZWgsIGRvbS5iYWNrZ3JvdW5kICk7XG5cblx0XHRcdC8vIEl0ZXJhdGUgb3ZlciBhbGwgdmVydGljYWwgc2xpZGVzXG5cdFx0XHR0b0FycmF5KCBzbGlkZWgucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggc2xpZGV2ICkge1xuXG5cdFx0XHRcdGNyZWF0ZUJhY2tncm91bmQoIHNsaWRldiwgYmFja2dyb3VuZFN0YWNrICk7XG5cblx0XHRcdFx0YmFja2dyb3VuZFN0YWNrLmNsYXNzTGlzdC5hZGQoICdzdGFjaycgKTtcblxuXHRcdFx0fSApO1xuXG5cdFx0fSApO1xuXG5cdFx0Ly8gQWRkIHBhcmFsbGF4IGJhY2tncm91bmQgaWYgc3BlY2lmaWVkXG5cdFx0aWYoIGNvbmZpZy5wYXJhbGxheEJhY2tncm91bmRJbWFnZSApIHtcblxuXHRcdFx0ZG9tLmJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gJ3VybChcIicgKyBjb25maWcucGFyYWxsYXhCYWNrZ3JvdW5kSW1hZ2UgKyAnXCIpJztcblx0XHRcdGRvbS5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRTaXplID0gY29uZmlnLnBhcmFsbGF4QmFja2dyb3VuZFNpemU7XG5cblx0XHRcdC8vIE1ha2Ugc3VyZSB0aGUgYmVsb3cgcHJvcGVydGllcyBhcmUgc2V0IG9uIHRoZSBlbGVtZW50IC0gdGhlc2UgcHJvcGVydGllcyBhcmVcblx0XHRcdC8vIG5lZWRlZCBmb3IgcHJvcGVyIHRyYW5zaXRpb25zIHRvIGJlIHNldCBvbiB0aGUgZWxlbWVudCB2aWEgQ1NTLiBUbyByZW1vdmVcblx0XHRcdC8vIGFubm95aW5nIGJhY2tncm91bmQgc2xpZGUtaW4gZWZmZWN0IHdoZW4gdGhlIHByZXNlbnRhdGlvbiBzdGFydHMsIGFwcGx5XG5cdFx0XHQvLyB0aGVzZSBwcm9wZXJ0aWVzIGFmdGVyIHNob3J0IHRpbWUgZGVsYXlcblx0XHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QuYWRkKCAnaGFzLXBhcmFsbGF4LWJhY2tncm91bmQnICk7XG5cdFx0XHR9LCAxICk7XG5cblx0XHR9XG5cdFx0ZWxzZSB7XG5cblx0XHRcdGRvbS5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICcnO1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ2hhcy1wYXJhbGxheC1iYWNrZ3JvdW5kJyApO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIGJhY2tncm91bmQgZm9yIHRoZSBnaXZlbiBzbGlkZS5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gc2xpZGVcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gY29udGFpbmVyIFRoZSBlbGVtZW50IHRoYXQgdGhlIGJhY2tncm91bmRcblx0ICogc2hvdWxkIGJlIGFwcGVuZGVkIHRvXG5cdCAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSBOZXcgYmFja2dyb3VuZCBkaXZcblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZUJhY2tncm91bmQoIHNsaWRlLCBjb250YWluZXIgKSB7XG5cblx0XHR2YXIgZGF0YSA9IHtcblx0XHRcdGJhY2tncm91bmQ6IHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZCcgKSxcblx0XHRcdGJhY2tncm91bmRTaXplOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtc2l6ZScgKSxcblx0XHRcdGJhY2tncm91bmRJbWFnZTogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWltYWdlJyApLFxuXHRcdFx0YmFja2dyb3VuZFZpZGVvOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtdmlkZW8nICksXG5cdFx0XHRiYWNrZ3JvdW5kSWZyYW1lOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtaWZyYW1lJyApLFxuXHRcdFx0YmFja2dyb3VuZENvbG9yOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtY29sb3InICksXG5cdFx0XHRiYWNrZ3JvdW5kUmVwZWF0OiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtcmVwZWF0JyApLFxuXHRcdFx0YmFja2dyb3VuZFBvc2l0aW9uOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtcG9zaXRpb24nICksXG5cdFx0XHRiYWNrZ3JvdW5kVHJhbnNpdGlvbjogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb24nIClcblx0XHR9O1xuXG5cdFx0dmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXG5cdFx0Ly8gQ2Fycnkgb3ZlciBjdXN0b20gY2xhc3NlcyBmcm9tIHRoZSBzbGlkZSB0byB0aGUgYmFja2dyb3VuZFxuXHRcdGVsZW1lbnQuY2xhc3NOYW1lID0gJ3NsaWRlLWJhY2tncm91bmQgJyArIHNsaWRlLmNsYXNzTmFtZS5yZXBsYWNlKCAvcHJlc2VudHxwYXN0fGZ1dHVyZS8sICcnICk7XG5cblx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kICkge1xuXHRcdFx0Ly8gQXV0by13cmFwIGltYWdlIHVybHMgaW4gdXJsKC4uLilcblx0XHRcdGlmKCAvXihodHRwfGZpbGV8XFwvXFwvKS9naS50ZXN0KCBkYXRhLmJhY2tncm91bmQgKSB8fCAvXFwuKHN2Z3xwbmd8anBnfGpwZWd8Z2lmfGJtcCkoWz8jXXwkKS9naS50ZXN0KCBkYXRhLmJhY2tncm91bmQgKSApIHtcblx0XHRcdFx0c2xpZGUuc2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWltYWdlJywgZGF0YS5iYWNrZ3JvdW5kICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0ZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kID0gZGF0YS5iYWNrZ3JvdW5kO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIENyZWF0ZSBhIGhhc2ggZm9yIHRoaXMgY29tYmluYXRpb24gb2YgYmFja2dyb3VuZCBzZXR0aW5ncy5cblx0XHQvLyBUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZW4gdHdvIHNsaWRlIGJhY2tncm91bmRzIGFyZVxuXHRcdC8vIHRoZSBzYW1lLlxuXHRcdGlmKCBkYXRhLmJhY2tncm91bmQgfHwgZGF0YS5iYWNrZ3JvdW5kQ29sb3IgfHwgZGF0YS5iYWNrZ3JvdW5kSW1hZ2UgfHwgZGF0YS5iYWNrZ3JvdW5kVmlkZW8gfHwgZGF0YS5iYWNrZ3JvdW5kSWZyYW1lICkge1xuXHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtaGFzaCcsIGRhdGEuYmFja2dyb3VuZCArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmJhY2tncm91bmRTaXplICtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuYmFja2dyb3VuZEltYWdlICtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuYmFja2dyb3VuZFZpZGVvICtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuYmFja2dyb3VuZElmcmFtZSArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmJhY2tncm91bmRDb2xvciArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmJhY2tncm91bmRSZXBlYXQgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5iYWNrZ3JvdW5kUG9zaXRpb24gK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5iYWNrZ3JvdW5kVHJhbnNpdGlvbiApO1xuXHRcdH1cblxuXHRcdC8vIEFkZGl0aW9uYWwgYW5kIG9wdGlvbmFsIGJhY2tncm91bmQgcHJvcGVydGllc1xuXHRcdGlmKCBkYXRhLmJhY2tncm91bmRTaXplICkgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9IGRhdGEuYmFja2dyb3VuZFNpemU7XG5cdFx0aWYoIGRhdGEuYmFja2dyb3VuZFNpemUgKSBlbGVtZW50LnNldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC1zaXplJywgZGF0YS5iYWNrZ3JvdW5kU2l6ZSApO1xuXHRcdGlmKCBkYXRhLmJhY2tncm91bmRDb2xvciApIGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gZGF0YS5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0aWYoIGRhdGEuYmFja2dyb3VuZFJlcGVhdCApIGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9IGRhdGEuYmFja2dyb3VuZFJlcGVhdDtcblx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kUG9zaXRpb24gKSBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9IGRhdGEuYmFja2dyb3VuZFBvc2l0aW9uO1xuXHRcdGlmKCBkYXRhLmJhY2tncm91bmRUcmFuc2l0aW9uICkgZWxlbWVudC5zZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbicsIGRhdGEuYmFja2dyb3VuZFRyYW5zaXRpb24gKTtcblxuXHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZCggZWxlbWVudCApO1xuXG5cdFx0Ly8gSWYgYmFja2dyb3VuZHMgYXJlIGJlaW5nIHJlY3JlYXRlZCwgY2xlYXIgb2xkIGNsYXNzZXNcblx0XHRzbGlkZS5jbGFzc0xpc3QucmVtb3ZlKCAnaGFzLWRhcmstYmFja2dyb3VuZCcgKTtcblx0XHRzbGlkZS5jbGFzc0xpc3QucmVtb3ZlKCAnaGFzLWxpZ2h0LWJhY2tncm91bmQnICk7XG5cblx0XHRzbGlkZS5zbGlkZUJhY2tncm91bmRFbGVtZW50ID0gZWxlbWVudDtcblxuXHRcdC8vIElmIHRoaXMgc2xpZGUgaGFzIGEgYmFja2dyb3VuZCBjb2xvciwgYWRkIGEgY2xhc3MgdGhhdFxuXHRcdC8vIHNpZ25hbHMgaWYgaXQgaXMgbGlnaHQgb3IgZGFyay4gSWYgdGhlIHNsaWRlIGhhcyBubyBiYWNrZ3JvdW5kXG5cdFx0Ly8gY29sb3IsIG5vIGNsYXNzIHdpbGwgYmUgc2V0XG5cdFx0dmFyIGNvbXB1dGVkQmFja2dyb3VuZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoIGVsZW1lbnQgKTtcblx0XHRpZiggY29tcHV0ZWRCYWNrZ3JvdW5kU3R5bGUgJiYgY29tcHV0ZWRCYWNrZ3JvdW5kU3R5bGUuYmFja2dyb3VuZENvbG9yICkge1xuXHRcdFx0dmFyIHJnYiA9IGNvbG9yVG9SZ2IoIGNvbXB1dGVkQmFja2dyb3VuZFN0eWxlLmJhY2tncm91bmRDb2xvciApO1xuXG5cdFx0XHQvLyBJZ25vcmUgZnVsbHkgdHJhbnNwYXJlbnQgYmFja2dyb3VuZHMuIFNvbWUgYnJvd3NlcnMgcmV0dXJuXG5cdFx0XHQvLyByZ2JhKDAsMCwwLDApIHdoZW4gcmVhZGluZyB0aGUgY29tcHV0ZWQgYmFja2dyb3VuZCBjb2xvciBvZlxuXHRcdFx0Ly8gYW4gZWxlbWVudCB3aXRoIG5vIGJhY2tncm91bmRcblx0XHRcdGlmKCByZ2IgJiYgcmdiLmEgIT09IDAgKSB7XG5cdFx0XHRcdGlmKCBjb2xvckJyaWdodG5lc3MoIGNvbXB1dGVkQmFja2dyb3VuZFN0eWxlLmJhY2tncm91bmRDb2xvciApIDwgMTI4ICkge1xuXHRcdFx0XHRcdHNsaWRlLmNsYXNzTGlzdC5hZGQoICdoYXMtZGFyay1iYWNrZ3JvdW5kJyApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHNsaWRlLmNsYXNzTGlzdC5hZGQoICdoYXMtbGlnaHQtYmFja2dyb3VuZCcgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBlbGVtZW50O1xuXG5cdH1cblxuXHQvKipcblx0ICogUmVnaXN0ZXJzIGEgbGlzdGVuZXIgdG8gcG9zdE1lc3NhZ2UgZXZlbnRzLCB0aGlzIG1ha2VzIGl0XG5cdCAqIHBvc3NpYmxlIHRvIGNhbGwgYWxsIHJldmVhbC5qcyBBUEkgbWV0aG9kcyBmcm9tIGFub3RoZXJcblx0ICogd2luZG93LiBGb3IgZXhhbXBsZTpcblx0ICpcblx0ICogcmV2ZWFsV2luZG93LnBvc3RNZXNzYWdlKCBKU09OLnN0cmluZ2lmeSh7XG5cdCAqICAgbWV0aG9kOiAnc2xpZGUnLFxuXHQgKiAgIGFyZ3M6IFsgMiBdXG5cdCAqIH0pLCAnKicgKTtcblx0ICovXG5cdGZ1bmN0aW9uIHNldHVwUG9zdE1lc3NhZ2UoKSB7XG5cblx0XHRpZiggY29uZmlnLnBvc3RNZXNzYWdlICkge1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdtZXNzYWdlJywgZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRcdFx0dmFyIGRhdGEgPSBldmVudC5kYXRhO1xuXG5cdFx0XHRcdC8vIE1ha2Ugc3VyZSB3ZSdyZSBkZWFsaW5nIHdpdGggSlNPTlxuXHRcdFx0XHRpZiggdHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnICYmIGRhdGEuY2hhckF0KCAwICkgPT09ICd7JyAmJiBkYXRhLmNoYXJBdCggZGF0YS5sZW5ndGggLSAxICkgPT09ICd9JyApIHtcblx0XHRcdFx0XHRkYXRhID0gSlNPTi5wYXJzZSggZGF0YSApO1xuXG5cdFx0XHRcdFx0Ly8gQ2hlY2sgaWYgdGhlIHJlcXVlc3RlZCBtZXRob2QgY2FuIGJlIGZvdW5kXG5cdFx0XHRcdFx0aWYoIGRhdGEubWV0aG9kICYmIHR5cGVvZiBSZXZlYWxbZGF0YS5tZXRob2RdID09PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0XHRcdFx0UmV2ZWFsW2RhdGEubWV0aG9kXS5hcHBseSggUmV2ZWFsLCBkYXRhLmFyZ3MgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sIGZhbHNlICk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQXBwbGllcyB0aGUgY29uZmlndXJhdGlvbiBzZXR0aW5ncyBmcm9tIHRoZSBjb25maWdcblx0ICogb2JqZWN0LiBNYXkgYmUgY2FsbGVkIG11bHRpcGxlIHRpbWVzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuXHQgKi9cblx0ZnVuY3Rpb24gY29uZmlndXJlKCBvcHRpb25zICkge1xuXG5cdFx0dmFyIG51bWJlck9mU2xpZGVzID0gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICkubGVuZ3RoO1xuXG5cdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggY29uZmlnLnRyYW5zaXRpb24gKTtcblxuXHRcdC8vIE5ldyBjb25maWcgb3B0aW9ucyBtYXkgYmUgcGFzc2VkIHdoZW4gdGhpcyBtZXRob2Rcblx0XHQvLyBpcyBpbnZva2VkIHRocm91Z2ggdGhlIEFQSSBhZnRlciBpbml0aWFsaXphdGlvblxuXHRcdGlmKCB0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcgKSBleHRlbmQoIGNvbmZpZywgb3B0aW9ucyApO1xuXG5cdFx0Ly8gRm9yY2UgbGluZWFyIHRyYW5zaXRpb24gYmFzZWQgb24gYnJvd3NlciBjYXBhYmlsaXRpZXNcblx0XHRpZiggZmVhdHVyZXMudHJhbnNmb3JtczNkID09PSBmYWxzZSApIGNvbmZpZy50cmFuc2l0aW9uID0gJ2xpbmVhcic7XG5cblx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QuYWRkKCBjb25maWcudHJhbnNpdGlvbiApO1xuXG5cdFx0ZG9tLndyYXBwZXIuc2V0QXR0cmlidXRlKCAnZGF0YS10cmFuc2l0aW9uLXNwZWVkJywgY29uZmlnLnRyYW5zaXRpb25TcGVlZCApO1xuXHRcdGRvbS53cmFwcGVyLnNldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uJywgY29uZmlnLmJhY2tncm91bmRUcmFuc2l0aW9uICk7XG5cblx0XHRkb20uY29udHJvbHMuc3R5bGUuZGlzcGxheSA9IGNvbmZpZy5jb250cm9scyA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0ZG9tLnByb2dyZXNzLnN0eWxlLmRpc3BsYXkgPSBjb25maWcucHJvZ3Jlc3MgPyAnYmxvY2snIDogJ25vbmUnO1xuXG5cdFx0aWYoIGNvbmZpZy5zaHVmZmxlICkge1xuXHRcdFx0c2h1ZmZsZSgpO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcucnRsICkge1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ3J0bCcgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCAncnRsJyApO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcuY2VudGVyICkge1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ2NlbnRlcicgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCAnY2VudGVyJyApO1xuXHRcdH1cblxuXHRcdC8vIEV4aXQgdGhlIHBhdXNlZCBtb2RlIGlmIGl0IHdhcyBjb25maWd1cmVkIG9mZlxuXHRcdGlmKCBjb25maWcucGF1c2UgPT09IGZhbHNlICkge1xuXHRcdFx0cmVzdW1lKCk7XG5cdFx0fVxuXG5cdFx0aWYoIGNvbmZpZy5zaG93Tm90ZXMgKSB7XG5cdFx0XHRkb20uc3BlYWtlck5vdGVzLmNsYXNzTGlzdC5hZGQoICd2aXNpYmxlJyApO1xuXHRcdFx0ZG9tLnNwZWFrZXJOb3Rlcy5zZXRBdHRyaWJ1dGUoICdkYXRhLWxheW91dCcsIHR5cGVvZiBjb25maWcuc2hvd05vdGVzID09PSAnc3RyaW5nJyA/IGNvbmZpZy5zaG93Tm90ZXMgOiAnaW5saW5lJyApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGRvbS5zcGVha2VyTm90ZXMuY2xhc3NMaXN0LnJlbW92ZSggJ3Zpc2libGUnICk7XG5cdFx0fVxuXG5cdFx0aWYoIGNvbmZpZy5tb3VzZVdoZWVsICkge1xuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ0RPTU1vdXNlU2Nyb2xsJywgb25Eb2N1bWVudE1vdXNlU2Nyb2xsLCBmYWxzZSApOyAvLyBGRlxuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ21vdXNld2hlZWwnLCBvbkRvY3VtZW50TW91c2VTY3JvbGwsIGZhbHNlICk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ0RPTU1vdXNlU2Nyb2xsJywgb25Eb2N1bWVudE1vdXNlU2Nyb2xsLCBmYWxzZSApOyAvLyBGRlxuXHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ21vdXNld2hlZWwnLCBvbkRvY3VtZW50TW91c2VTY3JvbGwsIGZhbHNlICk7XG5cdFx0fVxuXG5cdFx0Ly8gUm9sbGluZyAzRCBsaW5rc1xuXHRcdGlmKCBjb25maWcucm9sbGluZ0xpbmtzICkge1xuXHRcdFx0ZW5hYmxlUm9sbGluZ0xpbmtzKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZGlzYWJsZVJvbGxpbmdMaW5rcygpO1xuXHRcdH1cblxuXHRcdC8vIElmcmFtZSBsaW5rIHByZXZpZXdzXG5cdFx0aWYoIGNvbmZpZy5wcmV2aWV3TGlua3MgKSB7XG5cdFx0XHRlbmFibGVQcmV2aWV3TGlua3MoKTtcblx0XHRcdGRpc2FibGVQcmV2aWV3TGlua3MoICdbZGF0YS1wcmV2aWV3LWxpbms9ZmFsc2VdJyApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGRpc2FibGVQcmV2aWV3TGlua3MoKTtcblx0XHRcdGVuYWJsZVByZXZpZXdMaW5rcyggJ1tkYXRhLXByZXZpZXctbGlua106bm90KFtkYXRhLXByZXZpZXctbGluaz1mYWxzZV0pJyApO1xuXHRcdH1cblxuXHRcdC8vIFJlbW92ZSBleGlzdGluZyBhdXRvLXNsaWRlIGNvbnRyb2xzXG5cdFx0aWYoIGF1dG9TbGlkZVBsYXllciApIHtcblx0XHRcdGF1dG9TbGlkZVBsYXllci5kZXN0cm95KCk7XG5cdFx0XHRhdXRvU2xpZGVQbGF5ZXIgPSBudWxsO1xuXHRcdH1cblxuXHRcdC8vIEdlbmVyYXRlIGF1dG8tc2xpZGUgY29udHJvbHMgaWYgbmVlZGVkXG5cdFx0aWYoIG51bWJlck9mU2xpZGVzID4gMSAmJiBjb25maWcuYXV0b1NsaWRlICYmIGNvbmZpZy5hdXRvU2xpZGVTdG9wcGFibGUgJiYgZmVhdHVyZXMuY2FudmFzICYmIGZlYXR1cmVzLnJlcXVlc3RBbmltYXRpb25GcmFtZSApIHtcblx0XHRcdGF1dG9TbGlkZVBsYXllciA9IG5ldyBQbGF5YmFjayggZG9tLndyYXBwZXIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gTWF0aC5taW4oIE1hdGgubWF4KCAoIERhdGUubm93KCkgLSBhdXRvU2xpZGVTdGFydFRpbWUgKSAvIGF1dG9TbGlkZSwgMCApLCAxICk7XG5cdFx0XHR9ICk7XG5cblx0XHRcdGF1dG9TbGlkZVBsYXllci5vbiggJ2NsaWNrJywgb25BdXRvU2xpZGVQbGF5ZXJDbGljayApO1xuXHRcdFx0YXV0b1NsaWRlUGF1c2VkID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gV2hlbiBmcmFnbWVudHMgYXJlIHR1cm5lZCBvZmYgdGhleSBzaG91bGQgYmUgdmlzaWJsZVxuXHRcdGlmKCBjb25maWcuZnJhZ21lbnRzID09PSBmYWxzZSApIHtcblx0XHRcdHRvQXJyYXkoIGRvbS5zbGlkZXMucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQoICd2aXNpYmxlJyApO1xuXHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdjdXJyZW50LWZyYWdtZW50JyApO1xuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdC8vIFNsaWRlIG51bWJlcnNcblx0XHR2YXIgc2xpZGVOdW1iZXJEaXNwbGF5ID0gJ25vbmUnO1xuXHRcdGlmKCBjb25maWcuc2xpZGVOdW1iZXIgJiYgIWlzUHJpbnRpbmdQREYoKSApIHtcblx0XHRcdGlmKCBjb25maWcuc2hvd1NsaWRlTnVtYmVyID09PSAnYWxsJyApIHtcblx0XHRcdFx0c2xpZGVOdW1iZXJEaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoIGNvbmZpZy5zaG93U2xpZGVOdW1iZXIgPT09ICdzcGVha2VyJyAmJiBpc1NwZWFrZXJOb3RlcygpICkge1xuXHRcdFx0XHRzbGlkZU51bWJlckRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGRvbS5zbGlkZU51bWJlci5zdHlsZS5kaXNwbGF5ID0gc2xpZGVOdW1iZXJEaXNwbGF5O1xuXG5cdFx0c3luYygpO1xuXG5cdH1cblxuXHQvKipcblx0ICogQmluZHMgYWxsIGV2ZW50IGxpc3RlbmVycy5cblx0ICovXG5cdGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuXG5cdFx0ZXZlbnRzQXJlQm91bmQgPSB0cnVlO1xuXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdoYXNoY2hhbmdlJywgb25XaW5kb3dIYXNoQ2hhbmdlLCBmYWxzZSApO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlICk7XG5cblx0XHRpZiggY29uZmlnLnRvdWNoICkge1xuXHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQsIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUsIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSApO1xuXG5cdFx0XHQvLyBTdXBwb3J0IHBvaW50ZXItc3R5bGUgdG91Y2ggaW50ZXJhY3Rpb24gYXMgd2VsbFxuXHRcdFx0aWYoIHdpbmRvdy5uYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQgKSB7XG5cdFx0XHRcdC8vIElFIDExIHVzZXMgdW4tcHJlZml4ZWQgdmVyc2lvbiBvZiBwb2ludGVyIGV2ZW50c1xuXHRcdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAncG9pbnRlcmRvd24nLCBvblBvaW50ZXJEb3duLCBmYWxzZSApO1xuXHRcdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAncG9pbnRlcm1vdmUnLCBvblBvaW50ZXJNb3ZlLCBmYWxzZSApO1xuXHRcdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAncG9pbnRlcnVwJywgb25Qb2ludGVyVXAsIGZhbHNlICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKCB3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgKSB7XG5cdFx0XHRcdC8vIElFIDEwIHVzZXMgcHJlZml4ZWQgdmVyc2lvbiBvZiBwb2ludGVyIGV2ZW50c1xuXHRcdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAnTVNQb2ludGVyRG93bicsIG9uUG9pbnRlckRvd24sIGZhbHNlICk7XG5cdFx0XHRcdGRvbS53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoICdNU1BvaW50ZXJNb3ZlJywgb25Qb2ludGVyTW92ZSwgZmFsc2UgKTtcblx0XHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ01TUG9pbnRlclVwJywgb25Qb2ludGVyVXAsIGZhbHNlICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoIGNvbmZpZy5rZXlib2FyZCApIHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgb25Eb2N1bWVudEtleURvd24sIGZhbHNlICk7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCAna2V5cHJlc3MnLCBvbkRvY3VtZW50S2V5UHJlc3MsIGZhbHNlICk7XG5cdFx0fVxuXG5cdFx0aWYoIGNvbmZpZy5wcm9ncmVzcyAmJiBkb20ucHJvZ3Jlc3MgKSB7XG5cdFx0XHRkb20ucHJvZ3Jlc3MuYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgb25Qcm9ncmVzc0NsaWNrZWQsIGZhbHNlICk7XG5cdFx0fVxuXG5cdFx0aWYoIGNvbmZpZy5mb2N1c0JvZHlPblBhZ2VWaXNpYmlsaXR5Q2hhbmdlICkge1xuXHRcdFx0dmFyIHZpc2liaWxpdHlDaGFuZ2U7XG5cblx0XHRcdGlmKCAnaGlkZGVuJyBpbiBkb2N1bWVudCApIHtcblx0XHRcdFx0dmlzaWJpbGl0eUNoYW5nZSA9ICd2aXNpYmlsaXR5Y2hhbmdlJztcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoICdtc0hpZGRlbicgaW4gZG9jdW1lbnQgKSB7XG5cdFx0XHRcdHZpc2liaWxpdHlDaGFuZ2UgPSAnbXN2aXNpYmlsaXR5Y2hhbmdlJztcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoICd3ZWJraXRIaWRkZW4nIGluIGRvY3VtZW50ICkge1xuXHRcdFx0XHR2aXNpYmlsaXR5Q2hhbmdlID0gJ3dlYmtpdHZpc2liaWxpdHljaGFuZ2UnO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggdmlzaWJpbGl0eUNoYW5nZSApIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggdmlzaWJpbGl0eUNoYW5nZSwgb25QYWdlVmlzaWJpbGl0eUNoYW5nZSwgZmFsc2UgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBMaXN0ZW4gdG8gYm90aCB0b3VjaCBhbmQgY2xpY2sgZXZlbnRzLCBpbiBjYXNlIHRoZSBkZXZpY2Vcblx0XHQvLyBzdXBwb3J0cyBib3RoXG5cdFx0dmFyIHBvaW50ZXJFdmVudHMgPSBbICd0b3VjaHN0YXJ0JywgJ2NsaWNrJyBdO1xuXG5cdFx0Ly8gT25seSBzdXBwb3J0IHRvdWNoIGZvciBBbmRyb2lkLCBmaXhlcyBkb3VibGUgbmF2aWdhdGlvbnMgaW5cblx0XHQvLyBzdG9jayBicm93c2VyXG5cdFx0aWYoIFVBLm1hdGNoKCAvYW5kcm9pZC9naSApICkge1xuXHRcdFx0cG9pbnRlckV2ZW50cyA9IFsgJ3RvdWNoc3RhcnQnIF07XG5cdFx0fVxuXG5cdFx0cG9pbnRlckV2ZW50cy5mb3JFYWNoKCBmdW5jdGlvbiggZXZlbnROYW1lICkge1xuXHRcdFx0ZG9tLmNvbnRyb2xzTGVmdC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZUxlZnRDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNSaWdodC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZVJpZ2h0Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzVXAuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5hZGRFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVVcENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc0Rvd24uZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5hZGRFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVEb3duQ2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzUHJldi5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZVByZXZDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNOZXh0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuYWRkRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlTmV4dENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVbmJpbmRzIGFsbCBldmVudCBsaXN0ZW5lcnMuXG5cdCAqL1xuXHRmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycygpIHtcblxuXHRcdGV2ZW50c0FyZUJvdW5kID0gZmFsc2U7XG5cblx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAna2V5ZG93bicsIG9uRG9jdW1lbnRLZXlEb3duLCBmYWxzZSApO1xuXHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdrZXlwcmVzcycsIG9uRG9jdW1lbnRLZXlQcmVzcywgZmFsc2UgKTtcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2hhc2hjaGFuZ2UnLCBvbldpbmRvd0hhc2hDaGFuZ2UsIGZhbHNlICk7XG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSwgZmFsc2UgKTtcblxuXHRcdGRvbS53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0LCBmYWxzZSApO1xuXHRcdGRvbS53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoICd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSwgZmFsc2UgKTtcblx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSApO1xuXG5cdFx0Ly8gSUUxMVxuXHRcdGlmKCB3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkICkge1xuXHRcdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3BvaW50ZXJkb3duJywgb25Qb2ludGVyRG93biwgZmFsc2UgKTtcblx0XHRcdGRvbS53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdwb2ludGVybW92ZScsIG9uUG9pbnRlck1vdmUsIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAncG9pbnRlcnVwJywgb25Qb2ludGVyVXAsIGZhbHNlICk7XG5cdFx0fVxuXHRcdC8vIElFMTBcblx0XHRlbHNlIGlmKCB3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgKSB7XG5cdFx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAnTVNQb2ludGVyRG93bicsIG9uUG9pbnRlckRvd24sIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAnTVNQb2ludGVyTW92ZScsIG9uUG9pbnRlck1vdmUsIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAnTVNQb2ludGVyVXAnLCBvblBvaW50ZXJVcCwgZmFsc2UgKTtcblx0XHR9XG5cblx0XHRpZiAoIGNvbmZpZy5wcm9ncmVzcyAmJiBkb20ucHJvZ3Jlc3MgKSB7XG5cdFx0XHRkb20ucHJvZ3Jlc3MucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgb25Qcm9ncmVzc0NsaWNrZWQsIGZhbHNlICk7XG5cdFx0fVxuXG5cdFx0WyAndG91Y2hzdGFydCcsICdjbGljaycgXS5mb3JFYWNoKCBmdW5jdGlvbiggZXZlbnROYW1lICkge1xuXHRcdFx0ZG9tLmNvbnRyb2xzTGVmdC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZUxlZnRDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNSaWdodC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZVJpZ2h0Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzVXAuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVVcENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc0Rvd24uZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVEb3duQ2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzUHJldi5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZVByZXZDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNOZXh0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlTmV4dENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFeHRlbmQgb2JqZWN0IGEgd2l0aCB0aGUgcHJvcGVydGllcyBvZiBvYmplY3QgYi5cblx0ICogSWYgdGhlcmUncyBhIGNvbmZsaWN0LCBvYmplY3QgYiB0YWtlcyBwcmVjZWRlbmNlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gYVxuXHQgKiBAcGFyYW0ge29iamVjdH0gYlxuXHQgKi9cblx0ZnVuY3Rpb24gZXh0ZW5kKCBhLCBiICkge1xuXG5cdFx0Zm9yKCB2YXIgaSBpbiBiICkge1xuXHRcdFx0YVsgaSBdID0gYlsgaSBdO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIHRoZSB0YXJnZXQgb2JqZWN0IHRvIGFuIGFycmF5LlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gb1xuXHQgKiBAcmV0dXJuIHtvYmplY3RbXX1cblx0ICovXG5cdGZ1bmN0aW9uIHRvQXJyYXkoIG8gKSB7XG5cblx0XHRyZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIG8gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFV0aWxpdHkgZm9yIGRlc2VyaWFsaXppbmcgYSB2YWx1ZS5cblx0ICpcblx0ICogQHBhcmFtIHsqfSB2YWx1ZVxuXHQgKiBAcmV0dXJuIHsqfVxuXHQgKi9cblx0ZnVuY3Rpb24gZGVzZXJpYWxpemUoIHZhbHVlICkge1xuXG5cdFx0aWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHRpZiggdmFsdWUgPT09ICdudWxsJyApIHJldHVybiBudWxsO1xuXHRcdFx0ZWxzZSBpZiggdmFsdWUgPT09ICd0cnVlJyApIHJldHVybiB0cnVlO1xuXHRcdFx0ZWxzZSBpZiggdmFsdWUgPT09ICdmYWxzZScgKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRlbHNlIGlmKCB2YWx1ZS5tYXRjaCggL15bXFxkXFwuXSskLyApICkgcmV0dXJuIHBhcnNlRmxvYXQoIHZhbHVlICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHZhbHVlO1xuXG5cdH1cblxuXHQvKipcblx0ICogTWVhc3VyZXMgdGhlIGRpc3RhbmNlIGluIHBpeGVscyBiZXR3ZWVuIHBvaW50IGFcblx0ICogYW5kIHBvaW50IGIuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBhIHBvaW50IHdpdGggeC95IHByb3BlcnRpZXNcblx0ICogQHBhcmFtIHtvYmplY3R9IGIgcG9pbnQgd2l0aCB4L3kgcHJvcGVydGllc1xuXHQgKlxuXHQgKiBAcmV0dXJuIHtudW1iZXJ9XG5cdCAqL1xuXHRmdW5jdGlvbiBkaXN0YW5jZUJldHdlZW4oIGEsIGIgKSB7XG5cblx0XHR2YXIgZHggPSBhLnggLSBiLngsXG5cdFx0XHRkeSA9IGEueSAtIGIueTtcblxuXHRcdHJldHVybiBNYXRoLnNxcnQoIGR4KmR4ICsgZHkqZHkgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEFwcGxpZXMgYSBDU1MgdHJhbnNmb3JtIHRvIHRoZSB0YXJnZXQgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdHJhbnNmb3JtXG5cdCAqL1xuXHRmdW5jdGlvbiB0cmFuc2Zvcm1FbGVtZW50KCBlbGVtZW50LCB0cmFuc2Zvcm0gKSB7XG5cblx0XHRlbGVtZW50LnN0eWxlLldlYmtpdFRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblx0XHRlbGVtZW50LnN0eWxlLk1velRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblx0XHRlbGVtZW50LnN0eWxlLm1zVHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXHRcdGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXG5cdH1cblxuXHQvKipcblx0ICogQXBwbGllcyBDU1MgdHJhbnNmb3JtcyB0byB0aGUgc2xpZGVzIGNvbnRhaW5lci4gVGhlIGNvbnRhaW5lclxuXHQgKiBpcyB0cmFuc2Zvcm1lZCBmcm9tIHR3byBzZXBhcmF0ZSBzb3VyY2VzOiBsYXlvdXQgYW5kIHRoZSBvdmVydmlld1xuXHQgKiBtb2RlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gdHJhbnNmb3Jtc1xuXHQgKi9cblx0ZnVuY3Rpb24gdHJhbnNmb3JtU2xpZGVzKCB0cmFuc2Zvcm1zICkge1xuXG5cdFx0Ly8gUGljayB1cCBuZXcgdHJhbnNmb3JtcyBmcm9tIGFyZ3VtZW50c1xuXHRcdGlmKCB0eXBlb2YgdHJhbnNmb3Jtcy5sYXlvdXQgPT09ICdzdHJpbmcnICkgc2xpZGVzVHJhbnNmb3JtLmxheW91dCA9IHRyYW5zZm9ybXMubGF5b3V0O1xuXHRcdGlmKCB0eXBlb2YgdHJhbnNmb3Jtcy5vdmVydmlldyA9PT0gJ3N0cmluZycgKSBzbGlkZXNUcmFuc2Zvcm0ub3ZlcnZpZXcgPSB0cmFuc2Zvcm1zLm92ZXJ2aWV3O1xuXG5cdFx0Ly8gQXBwbHkgdGhlIHRyYW5zZm9ybXMgdG8gdGhlIHNsaWRlcyBjb250YWluZXJcblx0XHRpZiggc2xpZGVzVHJhbnNmb3JtLmxheW91dCApIHtcblx0XHRcdHRyYW5zZm9ybUVsZW1lbnQoIGRvbS5zbGlkZXMsIHNsaWRlc1RyYW5zZm9ybS5sYXlvdXQgKyAnICcgKyBzbGlkZXNUcmFuc2Zvcm0ub3ZlcnZpZXcgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0cmFuc2Zvcm1FbGVtZW50KCBkb20uc2xpZGVzLCBzbGlkZXNUcmFuc2Zvcm0ub3ZlcnZpZXcgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBJbmplY3RzIHRoZSBnaXZlbiBDU1Mgc3R5bGVzIGludG8gdGhlIERPTS5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG5cdCAqL1xuXHRmdW5jdGlvbiBpbmplY3RTdHlsZVNoZWV0KCB2YWx1ZSApIHtcblxuXHRcdHZhciB0YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc3R5bGUnICk7XG5cdFx0dGFnLnR5cGUgPSAndGV4dC9jc3MnO1xuXHRcdGlmKCB0YWcuc3R5bGVTaGVldCApIHtcblx0XHRcdHRhZy5zdHlsZVNoZWV0LmNzc1RleHQgPSB2YWx1ZTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0YWcuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCB2YWx1ZSApICk7XG5cdFx0fVxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCAnaGVhZCcgKVswXS5hcHBlbmRDaGlsZCggdGFnICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBGaW5kIHRoZSBjbG9zZXN0IHBhcmVudCB0aGF0IG1hdGNoZXMgdGhlIGdpdmVuXG5cdCAqIHNlbGVjdG9yLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgVGhlIGNoaWxkIGVsZW1lbnRcblx0ICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIFRoZSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2hcblx0ICogdGhlIHBhcmVudHMgYWdhaW5zdFxuXHQgKlxuXHQgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gVGhlIG1hdGNoZWQgcGFyZW50IG9yIG51bGxcblx0ICogaWYgbm8gbWF0Y2hpbmcgcGFyZW50IHdhcyBmb3VuZFxuXHQgKi9cblx0ZnVuY3Rpb24gY2xvc2VzdFBhcmVudCggdGFyZ2V0LCBzZWxlY3RvciApIHtcblxuXHRcdHZhciBwYXJlbnQgPSB0YXJnZXQucGFyZW50Tm9kZTtcblxuXHRcdHdoaWxlKCBwYXJlbnQgKSB7XG5cblx0XHRcdC8vIFRoZXJlJ3Mgc29tZSBvdmVyaGVhZCBkb2luZyB0aGlzIGVhY2ggdGltZSwgd2UgZG9uJ3Rcblx0XHRcdC8vIHdhbnQgdG8gcmV3cml0ZSB0aGUgZWxlbWVudCBwcm90b3R5cGUgYnV0IHNob3VsZCBzdGlsbFxuXHRcdFx0Ly8gYmUgZW5vdWdoIHRvIGZlYXR1cmUgZGV0ZWN0IG9uY2UgYXQgc3RhcnR1cC4uLlxuXHRcdFx0dmFyIG1hdGNoZXNNZXRob2QgPSBwYXJlbnQubWF0Y2hlcyB8fCBwYXJlbnQubWF0Y2hlc1NlbGVjdG9yIHx8IHBhcmVudC5tc01hdGNoZXNTZWxlY3RvcjtcblxuXHRcdFx0Ly8gSWYgd2UgZmluZCBhIG1hdGNoLCB3ZSdyZSBhbGwgc2V0XG5cdFx0XHRpZiggbWF0Y2hlc01ldGhvZCAmJiBtYXRjaGVzTWV0aG9kLmNhbGwoIHBhcmVudCwgc2VsZWN0b3IgKSApIHtcblx0XHRcdFx0cmV0dXJuIHBhcmVudDtcblx0XHRcdH1cblxuXHRcdFx0Ly8gS2VlcCBzZWFyY2hpbmdcblx0XHRcdHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlO1xuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGw7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyB2YXJpb3VzIGNvbG9yIGlucHV0IGZvcm1hdHMgdG8gYW4ge3I6MCxnOjAsYjowfSBvYmplY3QuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgY29sb3Jcblx0ICogQGV4YW1wbGVcblx0ICogY29sb3JUb1JnYignIzAwMCcpO1xuXHQgKiBAZXhhbXBsZVxuXHQgKiBjb2xvclRvUmdiKCcjMDAwMDAwJyk7XG5cdCAqIEBleGFtcGxlXG5cdCAqIGNvbG9yVG9SZ2IoJ3JnYigwLDAsMCknKTtcblx0ICogQGV4YW1wbGVcblx0ICogY29sb3JUb1JnYigncmdiYSgwLDAsMCknKTtcblx0ICpcblx0ICogQHJldHVybiB7e3I6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIsIFthXTogbnVtYmVyfXxudWxsfVxuXHQgKi9cblx0ZnVuY3Rpb24gY29sb3JUb1JnYiggY29sb3IgKSB7XG5cblx0XHR2YXIgaGV4MyA9IGNvbG9yLm1hdGNoKCAvXiMoWzAtOWEtZl17M30pJC9pICk7XG5cdFx0aWYoIGhleDMgJiYgaGV4M1sxXSApIHtcblx0XHRcdGhleDMgPSBoZXgzWzFdO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cjogcGFyc2VJbnQoIGhleDMuY2hhckF0KCAwICksIDE2ICkgKiAweDExLFxuXHRcdFx0XHRnOiBwYXJzZUludCggaGV4My5jaGFyQXQoIDEgKSwgMTYgKSAqIDB4MTEsXG5cdFx0XHRcdGI6IHBhcnNlSW50KCBoZXgzLmNoYXJBdCggMiApLCAxNiApICogMHgxMVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR2YXIgaGV4NiA9IGNvbG9yLm1hdGNoKCAvXiMoWzAtOWEtZl17Nn0pJC9pICk7XG5cdFx0aWYoIGhleDYgJiYgaGV4NlsxXSApIHtcblx0XHRcdGhleDYgPSBoZXg2WzFdO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cjogcGFyc2VJbnQoIGhleDYuc3Vic3RyKCAwLCAyICksIDE2ICksXG5cdFx0XHRcdGc6IHBhcnNlSW50KCBoZXg2LnN1YnN0ciggMiwgMiApLCAxNiApLFxuXHRcdFx0XHRiOiBwYXJzZUludCggaGV4Ni5zdWJzdHIoIDQsIDIgKSwgMTYgKVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR2YXIgcmdiID0gY29sb3IubWF0Y2goIC9ecmdiXFxzKlxcKFxccyooXFxkKylcXHMqLFxccyooXFxkKylcXHMqLFxccyooXFxkKylcXHMqXFwpJC9pICk7XG5cdFx0aWYoIHJnYiApIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHI6IHBhcnNlSW50KCByZ2JbMV0sIDEwICksXG5cdFx0XHRcdGc6IHBhcnNlSW50KCByZ2JbMl0sIDEwICksXG5cdFx0XHRcdGI6IHBhcnNlSW50KCByZ2JbM10sIDEwIClcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dmFyIHJnYmEgPSBjb2xvci5tYXRjaCggL15yZ2JhXFxzKlxcKFxccyooXFxkKylcXHMqLFxccyooXFxkKylcXHMqLFxccyooXFxkKylcXHMqXFwsXFxzKihbXFxkXSt8W1xcZF0qLltcXGRdKylcXHMqXFwpJC9pICk7XG5cdFx0aWYoIHJnYmEgKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRyOiBwYXJzZUludCggcmdiYVsxXSwgMTAgKSxcblx0XHRcdFx0ZzogcGFyc2VJbnQoIHJnYmFbMl0sIDEwICksXG5cdFx0XHRcdGI6IHBhcnNlSW50KCByZ2JhWzNdLCAxMCApLFxuXHRcdFx0XHRhOiBwYXJzZUZsb2F0KCByZ2JhWzRdIClcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGw7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxjdWxhdGVzIGJyaWdodG5lc3Mgb24gYSBzY2FsZSBvZiAwLTI1NS5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIFNlZSBjb2xvclRvUmdiIGZvciBzdXBwb3J0ZWQgZm9ybWF0cy5cblx0ICogQHNlZSB7QGxpbmsgY29sb3JUb1JnYn1cblx0ICovXG5cdGZ1bmN0aW9uIGNvbG9yQnJpZ2h0bmVzcyggY29sb3IgKSB7XG5cblx0XHRpZiggdHlwZW9mIGNvbG9yID09PSAnc3RyaW5nJyApIGNvbG9yID0gY29sb3JUb1JnYiggY29sb3IgKTtcblxuXHRcdGlmKCBjb2xvciApIHtcblx0XHRcdHJldHVybiAoIGNvbG9yLnIgKiAyOTkgKyBjb2xvci5nICogNTg3ICsgY29sb3IuYiAqIDExNCApIC8gMTAwMDtcblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHJlbWFpbmluZyBoZWlnaHQgd2l0aGluIHRoZSBwYXJlbnQgb2YgdGhlXG5cdCAqIHRhcmdldCBlbGVtZW50LlxuXHQgKlxuXHQgKiByZW1haW5pbmcgaGVpZ2h0ID0gWyBjb25maWd1cmVkIHBhcmVudCBoZWlnaHQgXSAtIFsgY3VycmVudCBwYXJlbnQgaGVpZ2h0IF1cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuXHQgKiBAcGFyYW0ge251bWJlcn0gW2hlaWdodF1cblx0ICovXG5cdGZ1bmN0aW9uIGdldFJlbWFpbmluZ0hlaWdodCggZWxlbWVudCwgaGVpZ2h0ICkge1xuXG5cdFx0aGVpZ2h0ID0gaGVpZ2h0IHx8IDA7XG5cblx0XHRpZiggZWxlbWVudCApIHtcblx0XHRcdHZhciBuZXdIZWlnaHQsIG9sZEhlaWdodCA9IGVsZW1lbnQuc3R5bGUuaGVpZ2h0O1xuXG5cdFx0XHQvLyBDaGFuZ2UgdGhlIC5zdHJldGNoIGVsZW1lbnQgaGVpZ2h0IHRvIDAgaW4gb3JkZXIgZmluZCB0aGUgaGVpZ2h0IG9mIGFsbFxuXHRcdFx0Ly8gdGhlIG90aGVyIGVsZW1lbnRzXG5cdFx0XHRlbGVtZW50LnN0eWxlLmhlaWdodCA9ICcwcHgnO1xuXHRcdFx0bmV3SGVpZ2h0ID0gaGVpZ2h0IC0gZWxlbWVudC5wYXJlbnROb2RlLm9mZnNldEhlaWdodDtcblxuXHRcdFx0Ly8gUmVzdG9yZSB0aGUgb2xkIGhlaWdodCwganVzdCBpbiBjYXNlXG5cdFx0XHRlbGVtZW50LnN0eWxlLmhlaWdodCA9IG9sZEhlaWdodCArICdweCc7XG5cblx0XHRcdHJldHVybiBuZXdIZWlnaHQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGhlaWdodDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiB0aGlzIGluc3RhbmNlIGlzIGJlaW5nIHVzZWQgdG8gcHJpbnQgYSBQREYuXG5cdCAqL1xuXHRmdW5jdGlvbiBpc1ByaW50aW5nUERGKCkge1xuXG5cdFx0cmV0dXJuICggL3ByaW50LXBkZi9naSApLnRlc3QoIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEhpZGVzIHRoZSBhZGRyZXNzIGJhciBpZiB3ZSdyZSBvbiBhIG1vYmlsZSBkZXZpY2UuXG5cdCAqL1xuXHRmdW5jdGlvbiBoaWRlQWRkcmVzc0JhcigpIHtcblxuXHRcdGlmKCBjb25maWcuaGlkZUFkZHJlc3NCYXIgJiYgaXNNb2JpbGVEZXZpY2UgKSB7XG5cdFx0XHQvLyBFdmVudHMgdGhhdCBzaG91bGQgdHJpZ2dlciB0aGUgYWRkcmVzcyBiYXIgdG8gaGlkZVxuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgcmVtb3ZlQWRkcmVzc0JhciwgZmFsc2UgKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnb3JpZW50YXRpb25jaGFuZ2UnLCByZW1vdmVBZGRyZXNzQmFyLCBmYWxzZSApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENhdXNlcyB0aGUgYWRkcmVzcyBiYXIgdG8gaGlkZSBvbiBtb2JpbGUgZGV2aWNlcyxcblx0ICogbW9yZSB2ZXJ0aWNhbCBzcGFjZSBmdHcuXG5cdCAqL1xuXHRmdW5jdGlvbiByZW1vdmVBZGRyZXNzQmFyKCkge1xuXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHR3aW5kb3cuc2Nyb2xsVG8oIDAsIDEgKTtcblx0XHR9LCAxMCApO1xuXG5cdH1cblxuXHQvKipcblx0ICogRGlzcGF0Y2hlcyBhbiBldmVudCBvZiB0aGUgc3BlY2lmaWVkIHR5cGUgZnJvbSB0aGVcblx0ICogcmV2ZWFsIERPTSBlbGVtZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gZGlzcGF0Y2hFdmVudCggdHlwZSwgYXJncyApIHtcblxuXHRcdHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCAnSFRNTEV2ZW50cycsIDEsIDIgKTtcblx0XHRldmVudC5pbml0RXZlbnQoIHR5cGUsIHRydWUsIHRydWUgKTtcblx0XHRleHRlbmQoIGV2ZW50LCBhcmdzICk7XG5cdFx0ZG9tLndyYXBwZXIuZGlzcGF0Y2hFdmVudCggZXZlbnQgKTtcblxuXHRcdC8vIElmIHdlJ3JlIGluIGFuIGlmcmFtZSwgcG9zdCBlYWNoIHJldmVhbC5qcyBldmVudCB0byB0aGVcblx0XHQvLyBwYXJlbnQgd2luZG93LiBVc2VkIGJ5IHRoZSBub3RlcyBwbHVnaW5cblx0XHRpZiggY29uZmlnLnBvc3RNZXNzYWdlRXZlbnRzICYmIHdpbmRvdy5wYXJlbnQgIT09IHdpbmRvdy5zZWxmICkge1xuXHRcdFx0d2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSggSlNPTi5zdHJpbmdpZnkoeyBuYW1lc3BhY2U6ICdyZXZlYWwnLCBldmVudE5hbWU6IHR5cGUsIHN0YXRlOiBnZXRTdGF0ZSgpIH0pLCAnKicgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBXcmFwIGFsbCBsaW5rcyBpbiAzRCBnb29kbmVzcy5cblx0ICovXG5cdGZ1bmN0aW9uIGVuYWJsZVJvbGxpbmdMaW5rcygpIHtcblxuXHRcdGlmKCBmZWF0dXJlcy50cmFuc2Zvcm1zM2QgJiYgISggJ21zUGVyc3BlY3RpdmUnIGluIGRvY3VtZW50LmJvZHkuc3R5bGUgKSApIHtcblx0XHRcdHZhciBhbmNob3JzID0gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICsgJyBhJyApO1xuXG5cdFx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gYW5jaG9ycy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdFx0dmFyIGFuY2hvciA9IGFuY2hvcnNbaV07XG5cblx0XHRcdFx0aWYoIGFuY2hvci50ZXh0Q29udGVudCAmJiAhYW5jaG9yLnF1ZXJ5U2VsZWN0b3IoICcqJyApICYmICggIWFuY2hvci5jbGFzc05hbWUgfHwgIWFuY2hvci5jbGFzc0xpc3QuY29udGFpbnMoIGFuY2hvciwgJ3JvbGwnICkgKSApIHtcblx0XHRcdFx0XHR2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblx0XHRcdFx0XHRzcGFuLnNldEF0dHJpYnV0ZSgnZGF0YS10aXRsZScsIGFuY2hvci50ZXh0KTtcblx0XHRcdFx0XHRzcGFuLmlubmVySFRNTCA9IGFuY2hvci5pbm5lckhUTUw7XG5cblx0XHRcdFx0XHRhbmNob3IuY2xhc3NMaXN0LmFkZCggJ3JvbGwnICk7XG5cdFx0XHRcdFx0YW5jaG9yLmlubmVySFRNTCA9ICcnO1xuXHRcdFx0XHRcdGFuY2hvci5hcHBlbmRDaGlsZChzcGFuKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFVud3JhcCBhbGwgM0QgbGlua3MuXG5cdCAqL1xuXHRmdW5jdGlvbiBkaXNhYmxlUm9sbGluZ0xpbmtzKCkge1xuXG5cdFx0dmFyIGFuY2hvcnMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBTTElERVNfU0VMRUNUT1IgKyAnIGEucm9sbCcgKTtcblxuXHRcdGZvciggdmFyIGkgPSAwLCBsZW4gPSBhbmNob3JzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0dmFyIGFuY2hvciA9IGFuY2hvcnNbaV07XG5cdFx0XHR2YXIgc3BhbiA9IGFuY2hvci5xdWVyeVNlbGVjdG9yKCAnc3BhbicgKTtcblxuXHRcdFx0aWYoIHNwYW4gKSB7XG5cdFx0XHRcdGFuY2hvci5jbGFzc0xpc3QucmVtb3ZlKCAncm9sbCcgKTtcblx0XHRcdFx0YW5jaG9yLmlubmVySFRNTCA9IHNwYW4uaW5uZXJIVE1MO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEJpbmQgcHJldmlldyBmcmFtZSBsaW5rcy5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IFtzZWxlY3Rvcj1hXSAtIHNlbGVjdG9yIGZvciBhbmNob3JzXG5cdCAqL1xuXHRmdW5jdGlvbiBlbmFibGVQcmV2aWV3TGlua3MoIHNlbGVjdG9yICkge1xuXG5cdFx0dmFyIGFuY2hvcnMgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBzZWxlY3RvciA/IHNlbGVjdG9yIDogJ2EnICkgKTtcblxuXHRcdGFuY2hvcnMuZm9yRWFjaCggZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHRpZiggL14oaHR0cHx3d3cpL2dpLnRlc3QoIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnaHJlZicgKSApICkge1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdjbGljaycsIG9uUHJldmlld0xpbmtDbGlja2VkLCBmYWxzZSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFVuYmluZCBwcmV2aWV3IGZyYW1lIGxpbmtzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGlzYWJsZVByZXZpZXdMaW5rcyggc2VsZWN0b3IgKSB7XG5cblx0XHR2YXIgYW5jaG9ycyA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIHNlbGVjdG9yID8gc2VsZWN0b3IgOiAnYScgKSApO1xuXG5cdFx0YW5jaG9ycy5mb3JFYWNoKCBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdGlmKCAvXihodHRwfHd3dykvZ2kudGVzdCggZWxlbWVudC5nZXRBdHRyaWJ1dGUoICdocmVmJyApICkgKSB7XG5cdFx0XHRcdGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgb25QcmV2aWV3TGlua0NsaWNrZWQsIGZhbHNlICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogT3BlbnMgYSBwcmV2aWV3IHdpbmRvdyBmb3IgdGhlIHRhcmdldCBVUkwuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSB1cmwgZm9yIHByZXZpZXcgaWZyYW1lIHNyY1xuXHQgKi9cblx0ZnVuY3Rpb24gc2hvd1ByZXZpZXcoIHVybCApIHtcblxuXHRcdGNsb3NlT3ZlcmxheSgpO1xuXG5cdFx0ZG9tLm92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRcdGRvbS5vdmVybGF5LmNsYXNzTGlzdC5hZGQoICdvdmVybGF5JyApO1xuXHRcdGRvbS5vdmVybGF5LmNsYXNzTGlzdC5hZGQoICdvdmVybGF5LXByZXZpZXcnICk7XG5cdFx0ZG9tLndyYXBwZXIuYXBwZW5kQ2hpbGQoIGRvbS5vdmVybGF5ICk7XG5cblx0XHRkb20ub3ZlcmxheS5pbm5lckhUTUwgPSBbXG5cdFx0XHQnPGhlYWRlcj4nLFxuXHRcdFx0XHQnPGEgY2xhc3M9XCJjbG9zZVwiIGhyZWY9XCIjXCI+PHNwYW4gY2xhc3M9XCJpY29uXCI+PC9zcGFuPjwvYT4nLFxuXHRcdFx0XHQnPGEgY2xhc3M9XCJleHRlcm5hbFwiIGhyZWY9XCInKyB1cmwgKydcIiB0YXJnZXQ9XCJfYmxhbmtcIj48c3BhbiBjbGFzcz1cImljb25cIj48L3NwYW4+PC9hPicsXG5cdFx0XHQnPC9oZWFkZXI+Jyxcblx0XHRcdCc8ZGl2IGNsYXNzPVwic3Bpbm5lclwiPjwvZGl2PicsXG5cdFx0XHQnPGRpdiBjbGFzcz1cInZpZXdwb3J0XCI+Jyxcblx0XHRcdFx0JzxpZnJhbWUgc3JjPVwiJysgdXJsICsnXCI+PC9pZnJhbWU+Jyxcblx0XHRcdFx0JzxzbWFsbCBjbGFzcz1cInZpZXdwb3J0LWlubmVyXCI+Jyxcblx0XHRcdFx0XHQnPHNwYW4gY2xhc3M9XCJ4LWZyYW1lLWVycm9yXCI+VW5hYmxlIHRvIGxvYWQgaWZyYW1lLiBUaGlzIGlzIGxpa2VseSBkdWUgdG8gdGhlIHNpdGVcXCdzIHBvbGljeSAoeC1mcmFtZS1vcHRpb25zKS48L3NwYW4+Jyxcblx0XHRcdFx0Jzwvc21hbGw+Jyxcblx0XHRcdCc8L2Rpdj4nXG5cdFx0XS5qb2luKCcnKTtcblxuXHRcdGRvbS5vdmVybGF5LnF1ZXJ5U2VsZWN0b3IoICdpZnJhbWUnICkuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRkb20ub3ZlcmxheS5jbGFzc0xpc3QuYWRkKCAnbG9hZGVkJyApO1xuXHRcdH0sIGZhbHNlICk7XG5cblx0XHRkb20ub3ZlcmxheS5xdWVyeVNlbGVjdG9yKCAnLmNsb3NlJyApLmFkZEV2ZW50TGlzdGVuZXIoICdjbGljaycsIGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdGNsb3NlT3ZlcmxheSgpO1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9LCBmYWxzZSApO1xuXG5cdFx0ZG9tLm92ZXJsYXkucXVlcnlTZWxlY3RvciggJy5leHRlcm5hbCcgKS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRjbG9zZU92ZXJsYXkoKTtcblx0XHR9LCBmYWxzZSApO1xuXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRkb20ub3ZlcmxheS5jbGFzc0xpc3QuYWRkKCAndmlzaWJsZScgKTtcblx0XHR9LCAxICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBPcGVuIG9yIGNsb3NlIGhlbHAgb3ZlcmxheSB3aW5kb3cuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gW292ZXJyaWRlXSBGbGFnIHdoaWNoIG92ZXJyaWRlcyB0aGVcblx0ICogdG9nZ2xlIGxvZ2ljIGFuZCBmb3JjaWJseSBzZXRzIHRoZSBkZXNpcmVkIHN0YXRlLiBUcnVlIG1lYW5zXG5cdCAqIGhlbHAgaXMgb3BlbiwgZmFsc2UgbWVhbnMgaXQncyBjbG9zZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b2dnbGVIZWxwKCBvdmVycmlkZSApe1xuXG5cdFx0aWYoIHR5cGVvZiBvdmVycmlkZSA9PT0gJ2Jvb2xlYW4nICkge1xuXHRcdFx0b3ZlcnJpZGUgPyBzaG93SGVscCgpIDogY2xvc2VPdmVybGF5KCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYoIGRvbS5vdmVybGF5ICkge1xuXHRcdFx0XHRjbG9zZU92ZXJsYXkoKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRzaG93SGVscCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBPcGVucyBhbiBvdmVybGF5IHdpbmRvdyB3aXRoIGhlbHAgbWF0ZXJpYWwuXG5cdCAqL1xuXHRmdW5jdGlvbiBzaG93SGVscCgpIHtcblxuXHRcdGlmKCBjb25maWcuaGVscCApIHtcblxuXHRcdFx0Y2xvc2VPdmVybGF5KCk7XG5cblx0XHRcdGRvbS5vdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHRcdGRvbS5vdmVybGF5LmNsYXNzTGlzdC5hZGQoICdvdmVybGF5JyApO1xuXHRcdFx0ZG9tLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCggJ292ZXJsYXktaGVscCcgKTtcblx0XHRcdGRvbS53cmFwcGVyLmFwcGVuZENoaWxkKCBkb20ub3ZlcmxheSApO1xuXG5cdFx0XHR2YXIgaHRtbCA9ICc8cCBjbGFzcz1cInRpdGxlXCI+S2V5Ym9hcmQgU2hvcnRjdXRzPC9wPjxici8+JztcblxuXHRcdFx0aHRtbCArPSAnPHRhYmxlPjx0aD5LRVk8L3RoPjx0aD5BQ1RJT048L3RoPic7XG5cdFx0XHRmb3IoIHZhciBrZXkgaW4ga2V5Ym9hcmRTaG9ydGN1dHMgKSB7XG5cdFx0XHRcdGh0bWwgKz0gJzx0cj48dGQ+JyArIGtleSArICc8L3RkPjx0ZD4nICsga2V5Ym9hcmRTaG9ydGN1dHNbIGtleSBdICsgJzwvdGQ+PC90cj4nO1xuXHRcdFx0fVxuXG5cdFx0XHRodG1sICs9ICc8L3RhYmxlPic7XG5cblx0XHRcdGRvbS5vdmVybGF5LmlubmVySFRNTCA9IFtcblx0XHRcdFx0JzxoZWFkZXI+Jyxcblx0XHRcdFx0XHQnPGEgY2xhc3M9XCJjbG9zZVwiIGhyZWY9XCIjXCI+PHNwYW4gY2xhc3M9XCJpY29uXCI+PC9zcGFuPjwvYT4nLFxuXHRcdFx0XHQnPC9oZWFkZXI+Jyxcblx0XHRcdFx0JzxkaXYgY2xhc3M9XCJ2aWV3cG9ydFwiPicsXG5cdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJ2aWV3cG9ydC1pbm5lclwiPicrIGh0bWwgKyc8L2Rpdj4nLFxuXHRcdFx0XHQnPC9kaXY+J1xuXHRcdFx0XS5qb2luKCcnKTtcblxuXHRcdFx0ZG9tLm92ZXJsYXkucXVlcnlTZWxlY3RvciggJy5jbG9zZScgKS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRcdGNsb3NlT3ZlcmxheSgpO1xuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0fSwgZmFsc2UgKTtcblxuXHRcdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGRvbS5vdmVybGF5LmNsYXNzTGlzdC5hZGQoICd2aXNpYmxlJyApO1xuXHRcdFx0fSwgMSApO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2xvc2VzIGFueSBjdXJyZW50bHkgb3BlbiBvdmVybGF5LlxuXHQgKi9cblx0ZnVuY3Rpb24gY2xvc2VPdmVybGF5KCkge1xuXG5cdFx0aWYoIGRvbS5vdmVybGF5ICkge1xuXHRcdFx0ZG9tLm92ZXJsYXkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggZG9tLm92ZXJsYXkgKTtcblx0XHRcdGRvbS5vdmVybGF5ID0gbnVsbDtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBsaWVzIEphdmFTY3JpcHQtY29udHJvbGxlZCBsYXlvdXQgcnVsZXMgdG8gdGhlXG5cdCAqIHByZXNlbnRhdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGxheW91dCgpIHtcblxuXHRcdGlmKCBkb20ud3JhcHBlciAmJiAhaXNQcmludGluZ1BERigpICkge1xuXG5cdFx0XHR2YXIgc2l6ZSA9IGdldENvbXB1dGVkU2xpZGVTaXplKCk7XG5cblx0XHRcdC8vIExheW91dCB0aGUgY29udGVudHMgb2YgdGhlIHNsaWRlc1xuXHRcdFx0bGF5b3V0U2xpZGVDb250ZW50cyggY29uZmlnLndpZHRoLCBjb25maWcuaGVpZ2h0ICk7XG5cblx0XHRcdGRvbS5zbGlkZXMuc3R5bGUud2lkdGggPSBzaXplLndpZHRoICsgJ3B4Jztcblx0XHRcdGRvbS5zbGlkZXMuc3R5bGUuaGVpZ2h0ID0gc2l6ZS5oZWlnaHQgKyAncHgnO1xuXG5cdFx0XHQvLyBEZXRlcm1pbmUgc2NhbGUgb2YgY29udGVudCB0byBmaXQgd2l0aGluIGF2YWlsYWJsZSBzcGFjZVxuXHRcdFx0c2NhbGUgPSBNYXRoLm1pbiggc2l6ZS5wcmVzZW50YXRpb25XaWR0aCAvIHNpemUud2lkdGgsIHNpemUucHJlc2VudGF0aW9uSGVpZ2h0IC8gc2l6ZS5oZWlnaHQgKTtcblxuXHRcdFx0Ly8gUmVzcGVjdCBtYXgvbWluIHNjYWxlIHNldHRpbmdzXG5cdFx0XHRzY2FsZSA9IE1hdGgubWF4KCBzY2FsZSwgY29uZmlnLm1pblNjYWxlICk7XG5cdFx0XHRzY2FsZSA9IE1hdGgubWluKCBzY2FsZSwgY29uZmlnLm1heFNjYWxlICk7XG5cblx0XHRcdC8vIERvbid0IGFwcGx5IGFueSBzY2FsaW5nIHN0eWxlcyBpZiBzY2FsZSBpcyAxXG5cdFx0XHRpZiggc2NhbGUgPT09IDEgKSB7XG5cdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUuem9vbSA9ICcnO1xuXHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLmxlZnQgPSAnJztcblx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS50b3AgPSAnJztcblx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS5ib3R0b20gPSAnJztcblx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS5yaWdodCA9ICcnO1xuXHRcdFx0XHR0cmFuc2Zvcm1TbGlkZXMoIHsgbGF5b3V0OiAnJyB9ICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly8gUHJlZmVyIHpvb20gZm9yIHNjYWxpbmcgdXAgc28gdGhhdCBjb250ZW50IHJlbWFpbnMgY3Jpc3AuXG5cdFx0XHRcdC8vIERvbid0IHVzZSB6b29tIHRvIHNjYWxlIGRvd24gc2luY2UgdGhhdCBjYW4gbGVhZCB0byBzaGlmdHNcblx0XHRcdFx0Ly8gaW4gdGV4dCBsYXlvdXQvbGluZSBicmVha3MuXG5cdFx0XHRcdGlmKCBzY2FsZSA+IDEgJiYgZmVhdHVyZXMuem9vbSApIHtcblx0XHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLnpvb20gPSBzY2FsZTtcblx0XHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLmxlZnQgPSAnJztcblx0XHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLnRvcCA9ICcnO1xuXHRcdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUuYm90dG9tID0gJyc7XG5cdFx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS5yaWdodCA9ICcnO1xuXHRcdFx0XHRcdHRyYW5zZm9ybVNsaWRlcyggeyBsYXlvdXQ6ICcnIH0gKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBBcHBseSBzY2FsZSB0cmFuc2Zvcm0gYXMgYSBmYWxsYmFja1xuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLnpvb20gPSAnJztcblx0XHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLmxlZnQgPSAnNTAlJztcblx0XHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLnRvcCA9ICc1MCUnO1xuXHRcdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUuYm90dG9tID0gJ2F1dG8nO1xuXHRcdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUucmlnaHQgPSAnYXV0byc7XG5cdFx0XHRcdFx0dHJhbnNmb3JtU2xpZGVzKCB7IGxheW91dDogJ3RyYW5zbGF0ZSgtNTAlLCAtNTAlKSBzY2FsZSgnKyBzY2FsZSArJyknIH0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBTZWxlY3QgYWxsIHNsaWRlcywgdmVydGljYWwgYW5kIGhvcml6b250YWxcblx0XHRcdHZhciBzbGlkZXMgPSB0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBTTElERVNfU0VMRUNUT1IgKSApO1xuXG5cdFx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gc2xpZGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0XHR2YXIgc2xpZGUgPSBzbGlkZXNbIGkgXTtcblxuXHRcdFx0XHQvLyBEb24ndCBib3RoZXIgdXBkYXRpbmcgaW52aXNpYmxlIHNsaWRlc1xuXHRcdFx0XHRpZiggc2xpZGUuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnICkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIGNvbmZpZy5jZW50ZXIgfHwgc2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAnY2VudGVyJyApICkge1xuXHRcdFx0XHRcdC8vIFZlcnRpY2FsIHN0YWNrcyBhcmUgbm90IGNlbnRyZWQgc2luY2UgdGhlaXIgc2VjdGlvblxuXHRcdFx0XHRcdC8vIGNoaWxkcmVuIHdpbGwgYmVcblx0XHRcdFx0XHRpZiggc2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAnc3RhY2snICkgKSB7XG5cdFx0XHRcdFx0XHRzbGlkZS5zdHlsZS50b3AgPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdHNsaWRlLnN0eWxlLnRvcCA9IE1hdGgubWF4KCAoIHNpemUuaGVpZ2h0IC0gc2xpZGUuc2Nyb2xsSGVpZ2h0ICkgLyAyLCAwICkgKyAncHgnO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRzbGlkZS5zdHlsZS50b3AgPSAnJztcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdHVwZGF0ZVByb2dyZXNzKCk7XG5cdFx0XHR1cGRhdGVQYXJhbGxheCgpO1xuXG5cdFx0XHRpZiggaXNPdmVydmlldygpICkge1xuXHRcdFx0XHR1cGRhdGVPdmVydmlldygpO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQXBwbGllcyBsYXlvdXQgbG9naWMgdG8gdGhlIGNvbnRlbnRzIG9mIGFsbCBzbGlkZXMgaW5cblx0ICogdGhlIHByZXNlbnRhdGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSB3aWR0aFxuXHQgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGhlaWdodFxuXHQgKi9cblx0ZnVuY3Rpb24gbGF5b3V0U2xpZGVDb250ZW50cyggd2lkdGgsIGhlaWdodCApIHtcblxuXHRcdC8vIEhhbmRsZSBzaXppbmcgb2YgZWxlbWVudHMgd2l0aCB0aGUgJ3N0cmV0Y2gnIGNsYXNzXG5cdFx0dG9BcnJheSggZG9tLnNsaWRlcy5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbiA+IC5zdHJldGNoJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cblx0XHRcdC8vIERldGVybWluZSBob3cgbXVjaCB2ZXJ0aWNhbCBzcGFjZSB3ZSBjYW4gdXNlXG5cdFx0XHR2YXIgcmVtYWluaW5nSGVpZ2h0ID0gZ2V0UmVtYWluaW5nSGVpZ2h0KCBlbGVtZW50LCBoZWlnaHQgKTtcblxuXHRcdFx0Ly8gQ29uc2lkZXIgdGhlIGFzcGVjdCByYXRpbyBvZiBtZWRpYSBlbGVtZW50c1xuXHRcdFx0aWYoIC8oaW1nfHZpZGVvKS9naS50ZXN0KCBlbGVtZW50Lm5vZGVOYW1lICkgKSB7XG5cdFx0XHRcdHZhciBudyA9IGVsZW1lbnQubmF0dXJhbFdpZHRoIHx8IGVsZW1lbnQudmlkZW9XaWR0aCxcblx0XHRcdFx0XHRuaCA9IGVsZW1lbnQubmF0dXJhbEhlaWdodCB8fCBlbGVtZW50LnZpZGVvSGVpZ2h0O1xuXG5cdFx0XHRcdHZhciBlcyA9IE1hdGgubWluKCB3aWR0aCAvIG53LCByZW1haW5pbmdIZWlnaHQgLyBuaCApO1xuXG5cdFx0XHRcdGVsZW1lbnQuc3R5bGUud2lkdGggPSAoIG53ICogZXMgKSArICdweCc7XG5cdFx0XHRcdGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gKCBuaCAqIGVzICkgKyAncHgnO1xuXG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0ZWxlbWVudC5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4Jztcblx0XHRcdFx0ZWxlbWVudC5zdHlsZS5oZWlnaHQgPSByZW1haW5pbmdIZWlnaHQgKyAncHgnO1xuXHRcdFx0fVxuXG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ2FsY3VsYXRlcyB0aGUgY29tcHV0ZWQgcGl4ZWwgc2l6ZSBvZiBvdXIgc2xpZGVzLiBUaGVzZVxuXHQgKiB2YWx1ZXMgYXJlIGJhc2VkIG9uIHRoZSB3aWR0aCBhbmQgaGVpZ2h0IGNvbmZpZ3VyYXRpb25cblx0ICogb3B0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtudW1iZXJ9IFtwcmVzZW50YXRpb25XaWR0aD1kb20ud3JhcHBlci5vZmZzZXRXaWR0aF1cblx0ICogQHBhcmFtIHtudW1iZXJ9IFtwcmVzZW50YXRpb25IZWlnaHQ9ZG9tLndyYXBwZXIub2Zmc2V0SGVpZ2h0XVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0Q29tcHV0ZWRTbGlkZVNpemUoIHByZXNlbnRhdGlvbldpZHRoLCBwcmVzZW50YXRpb25IZWlnaHQgKSB7XG5cblx0XHR2YXIgc2l6ZSA9IHtcblx0XHRcdC8vIFNsaWRlIHNpemVcblx0XHRcdHdpZHRoOiBjb25maWcud2lkdGgsXG5cdFx0XHRoZWlnaHQ6IGNvbmZpZy5oZWlnaHQsXG5cblx0XHRcdC8vIFByZXNlbnRhdGlvbiBzaXplXG5cdFx0XHRwcmVzZW50YXRpb25XaWR0aDogcHJlc2VudGF0aW9uV2lkdGggfHwgZG9tLndyYXBwZXIub2Zmc2V0V2lkdGgsXG5cdFx0XHRwcmVzZW50YXRpb25IZWlnaHQ6IHByZXNlbnRhdGlvbkhlaWdodCB8fCBkb20ud3JhcHBlci5vZmZzZXRIZWlnaHRcblx0XHR9O1xuXG5cdFx0Ly8gUmVkdWNlIGF2YWlsYWJsZSBzcGFjZSBieSBtYXJnaW5cblx0XHRzaXplLnByZXNlbnRhdGlvbldpZHRoIC09ICggc2l6ZS5wcmVzZW50YXRpb25XaWR0aCAqIGNvbmZpZy5tYXJnaW4gKTtcblx0XHRzaXplLnByZXNlbnRhdGlvbkhlaWdodCAtPSAoIHNpemUucHJlc2VudGF0aW9uSGVpZ2h0ICogY29uZmlnLm1hcmdpbiApO1xuXG5cdFx0Ly8gU2xpZGUgd2lkdGggbWF5IGJlIGEgcGVyY2VudGFnZSBvZiBhdmFpbGFibGUgd2lkdGhcblx0XHRpZiggdHlwZW9mIHNpemUud2lkdGggPT09ICdzdHJpbmcnICYmIC8lJC8udGVzdCggc2l6ZS53aWR0aCApICkge1xuXHRcdFx0c2l6ZS53aWR0aCA9IHBhcnNlSW50KCBzaXplLndpZHRoLCAxMCApIC8gMTAwICogc2l6ZS5wcmVzZW50YXRpb25XaWR0aDtcblx0XHR9XG5cblx0XHQvLyBTbGlkZSBoZWlnaHQgbWF5IGJlIGEgcGVyY2VudGFnZSBvZiBhdmFpbGFibGUgaGVpZ2h0XG5cdFx0aWYoIHR5cGVvZiBzaXplLmhlaWdodCA9PT0gJ3N0cmluZycgJiYgLyUkLy50ZXN0KCBzaXplLmhlaWdodCApICkge1xuXHRcdFx0c2l6ZS5oZWlnaHQgPSBwYXJzZUludCggc2l6ZS5oZWlnaHQsIDEwICkgLyAxMDAgKiBzaXplLnByZXNlbnRhdGlvbkhlaWdodDtcblx0XHR9XG5cblx0XHRyZXR1cm4gc2l6ZTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFN0b3JlcyB0aGUgdmVydGljYWwgaW5kZXggb2YgYSBzdGFjayBzbyB0aGF0IHRoZSBzYW1lXG5cdCAqIHZlcnRpY2FsIHNsaWRlIGNhbiBiZSBzZWxlY3RlZCB3aGVuIG5hdmlnYXRpbmcgdG8gYW5kXG5cdCAqIGZyb20gdGhlIHN0YWNrLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBzdGFjayBUaGUgdmVydGljYWwgc3RhY2sgZWxlbWVudFxuXHQgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFt2PTBdIEluZGV4IHRvIG1lbW9yaXplXG5cdCAqL1xuXHRmdW5jdGlvbiBzZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIHN0YWNrLCB2ICkge1xuXG5cdFx0aWYoIHR5cGVvZiBzdGFjayA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHN0YWNrLnNldEF0dHJpYnV0ZSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdHN0YWNrLnNldEF0dHJpYnV0ZSggJ2RhdGEtcHJldmlvdXMtaW5kZXh2JywgdiB8fCAwICk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSB2ZXJ0aWNhbCBpbmRleCB3aGljaCB3YXMgc3RvcmVkIHVzaW5nXG5cdCAqICNzZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoKSBvciAwIGlmIG5vIHByZXZpb3VzIGluZGV4XG5cdCAqIGV4aXN0cy5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gc3RhY2sgVGhlIHZlcnRpY2FsIHN0YWNrIGVsZW1lbnRcblx0ICovXG5cdGZ1bmN0aW9uIGdldFByZXZpb3VzVmVydGljYWxJbmRleCggc3RhY2sgKSB7XG5cblx0XHRpZiggdHlwZW9mIHN0YWNrID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygc3RhY2suc2V0QXR0cmlidXRlID09PSAnZnVuY3Rpb24nICYmIHN0YWNrLmNsYXNzTGlzdC5jb250YWlucyggJ3N0YWNrJyApICkge1xuXHRcdFx0Ly8gUHJlZmVyIG1hbnVhbGx5IGRlZmluZWQgc3RhcnQtaW5kZXh2XG5cdFx0XHR2YXIgYXR0cmlidXRlTmFtZSA9IHN0YWNrLmhhc0F0dHJpYnV0ZSggJ2RhdGEtc3RhcnQtaW5kZXh2JyApID8gJ2RhdGEtc3RhcnQtaW5kZXh2JyA6ICdkYXRhLXByZXZpb3VzLWluZGV4dic7XG5cblx0XHRcdHJldHVybiBwYXJzZUludCggc3RhY2suZ2V0QXR0cmlidXRlKCBhdHRyaWJ1dGVOYW1lICkgfHwgMCwgMTAgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gMDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIERpc3BsYXlzIHRoZSBvdmVydmlldyBvZiBzbGlkZXMgKHF1aWNrIG5hdikgYnkgc2NhbGluZ1xuXHQgKiBkb3duIGFuZCBhcnJhbmdpbmcgYWxsIHNsaWRlIGVsZW1lbnRzLlxuXHQgKi9cblx0ZnVuY3Rpb24gYWN0aXZhdGVPdmVydmlldygpIHtcblxuXHRcdC8vIE9ubHkgcHJvY2VlZCBpZiBlbmFibGVkIGluIGNvbmZpZ1xuXHRcdGlmKCBjb25maWcub3ZlcnZpZXcgJiYgIWlzT3ZlcnZpZXcoKSApIHtcblxuXHRcdFx0b3ZlcnZpZXcgPSB0cnVlO1xuXG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QuYWRkKCAnb3ZlcnZpZXcnICk7XG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCAnb3ZlcnZpZXctZGVhY3RpdmF0aW5nJyApO1xuXG5cdFx0XHRpZiggZmVhdHVyZXMub3ZlcnZpZXdUcmFuc2l0aW9ucyApIHtcblx0XHRcdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ292ZXJ2aWV3LWFuaW1hdGVkJyApO1xuXHRcdFx0XHR9LCAxICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIERvbid0IGF1dG8tc2xpZGUgd2hpbGUgaW4gb3ZlcnZpZXcgbW9kZVxuXHRcdFx0Y2FuY2VsQXV0b1NsaWRlKCk7XG5cblx0XHRcdC8vIE1vdmUgdGhlIGJhY2tncm91bmRzIGVsZW1lbnQgaW50byB0aGUgc2xpZGUgY29udGFpbmVyIHRvXG5cdFx0XHQvLyB0aGF0IHRoZSBzYW1lIHNjYWxpbmcgaXMgYXBwbGllZFxuXHRcdFx0ZG9tLnNsaWRlcy5hcHBlbmRDaGlsZCggZG9tLmJhY2tncm91bmQgKTtcblxuXHRcdFx0Ly8gQ2xpY2tpbmcgb24gYW4gb3ZlcnZpZXcgc2xpZGUgbmF2aWdhdGVzIHRvIGl0XG5cdFx0XHR0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBTTElERVNfU0VMRUNUT1IgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBzbGlkZSApIHtcblx0XHRcdFx0aWYoICFzbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoICdzdGFjaycgKSApIHtcblx0XHRcdFx0XHRzbGlkZS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvbk92ZXJ2aWV3U2xpZGVDbGlja2VkLCB0cnVlICk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gQ2FsY3VsYXRlIHNsaWRlIHNpemVzXG5cdFx0XHR2YXIgbWFyZ2luID0gNzA7XG5cdFx0XHR2YXIgc2xpZGVTaXplID0gZ2V0Q29tcHV0ZWRTbGlkZVNpemUoKTtcblx0XHRcdG92ZXJ2aWV3U2xpZGVXaWR0aCA9IHNsaWRlU2l6ZS53aWR0aCArIG1hcmdpbjtcblx0XHRcdG92ZXJ2aWV3U2xpZGVIZWlnaHQgPSBzbGlkZVNpemUuaGVpZ2h0ICsgbWFyZ2luO1xuXG5cdFx0XHQvLyBSZXZlcnNlIGluIFJUTCBtb2RlXG5cdFx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdFx0b3ZlcnZpZXdTbGlkZVdpZHRoID0gLW92ZXJ2aWV3U2xpZGVXaWR0aDtcblx0XHRcdH1cblxuXHRcdFx0dXBkYXRlU2xpZGVzVmlzaWJpbGl0eSgpO1xuXHRcdFx0bGF5b3V0T3ZlcnZpZXcoKTtcblx0XHRcdHVwZGF0ZU92ZXJ2aWV3KCk7XG5cblx0XHRcdGxheW91dCgpO1xuXG5cdFx0XHQvLyBOb3RpZnkgb2JzZXJ2ZXJzIG9mIHRoZSBvdmVydmlldyBzaG93aW5nXG5cdFx0XHRkaXNwYXRjaEV2ZW50KCAnb3ZlcnZpZXdzaG93bicsIHtcblx0XHRcdFx0J2luZGV4aCc6IGluZGV4aCxcblx0XHRcdFx0J2luZGV4dic6IGluZGV4dixcblx0XHRcdFx0J2N1cnJlbnRTbGlkZSc6IGN1cnJlbnRTbGlkZVxuXHRcdFx0fSApO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVXNlcyBDU1MgdHJhbnNmb3JtcyB0byBwb3NpdGlvbiBhbGwgc2xpZGVzIGluIGEgZ3JpZCBmb3Jcblx0ICogZGlzcGxheSBpbnNpZGUgb2YgdGhlIG92ZXJ2aWV3IG1vZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiBsYXlvdXRPdmVydmlldygpIHtcblxuXHRcdC8vIExheW91dCBzbGlkZXNcblx0XHR0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApICkuZm9yRWFjaCggZnVuY3Rpb24oIGhzbGlkZSwgaCApIHtcblx0XHRcdGhzbGlkZS5zZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LWgnLCBoICk7XG5cdFx0XHR0cmFuc2Zvcm1FbGVtZW50KCBoc2xpZGUsICd0cmFuc2xhdGUzZCgnICsgKCBoICogb3ZlcnZpZXdTbGlkZVdpZHRoICkgKyAncHgsIDAsIDApJyApO1xuXG5cdFx0XHRpZiggaHNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ3N0YWNrJyApICkge1xuXG5cdFx0XHRcdHRvQXJyYXkoIGhzbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKSApLmZvckVhY2goIGZ1bmN0aW9uKCB2c2xpZGUsIHYgKSB7XG5cdFx0XHRcdFx0dnNsaWRlLnNldEF0dHJpYnV0ZSggJ2RhdGEtaW5kZXgtaCcsIGggKTtcblx0XHRcdFx0XHR2c2xpZGUuc2V0QXR0cmlidXRlKCAnZGF0YS1pbmRleC12JywgdiApO1xuXG5cdFx0XHRcdFx0dHJhbnNmb3JtRWxlbWVudCggdnNsaWRlLCAndHJhbnNsYXRlM2QoMCwgJyArICggdiAqIG92ZXJ2aWV3U2xpZGVIZWlnaHQgKSArICdweCwgMCknICk7XG5cdFx0XHRcdH0gKTtcblxuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdC8vIExheW91dCBzbGlkZSBiYWNrZ3JvdW5kc1xuXHRcdHRvQXJyYXkoIGRvbS5iYWNrZ3JvdW5kLmNoaWxkTm9kZXMgKS5mb3JFYWNoKCBmdW5jdGlvbiggaGJhY2tncm91bmQsIGggKSB7XG5cdFx0XHR0cmFuc2Zvcm1FbGVtZW50KCBoYmFja2dyb3VuZCwgJ3RyYW5zbGF0ZTNkKCcgKyAoIGggKiBvdmVydmlld1NsaWRlV2lkdGggKSArICdweCwgMCwgMCknICk7XG5cblx0XHRcdHRvQXJyYXkoIGhiYWNrZ3JvdW5kLnF1ZXJ5U2VsZWN0b3JBbGwoICcuc2xpZGUtYmFja2dyb3VuZCcgKSApLmZvckVhY2goIGZ1bmN0aW9uKCB2YmFja2dyb3VuZCwgdiApIHtcblx0XHRcdFx0dHJhbnNmb3JtRWxlbWVudCggdmJhY2tncm91bmQsICd0cmFuc2xhdGUzZCgwLCAnICsgKCB2ICogb3ZlcnZpZXdTbGlkZUhlaWdodCApICsgJ3B4LCAwKScgKTtcblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBNb3ZlcyB0aGUgb3ZlcnZpZXcgdmlld3BvcnQgdG8gdGhlIGN1cnJlbnQgc2xpZGVzLlxuXHQgKiBDYWxsZWQgZWFjaCB0aW1lIHRoZSBjdXJyZW50IHNsaWRlIGNoYW5nZXMuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVPdmVydmlldygpIHtcblxuXHRcdHZhciB2bWluID0gTWF0aC5taW4oIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKTtcblx0XHR2YXIgc2NhbGUgPSBNYXRoLm1heCggdm1pbiAvIDUsIDE1MCApIC8gdm1pbjtcblxuXHRcdHRyYW5zZm9ybVNsaWRlcygge1xuXHRcdFx0b3ZlcnZpZXc6IFtcblx0XHRcdFx0J3NjYWxlKCcrIHNjYWxlICsnKScsXG5cdFx0XHRcdCd0cmFuc2xhdGVYKCcrICggLWluZGV4aCAqIG92ZXJ2aWV3U2xpZGVXaWR0aCApICsncHgpJyxcblx0XHRcdFx0J3RyYW5zbGF0ZVkoJysgKCAtaW5kZXh2ICogb3ZlcnZpZXdTbGlkZUhlaWdodCApICsncHgpJ1xuXHRcdFx0XS5qb2luKCAnICcgKVxuXHRcdH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEV4aXRzIHRoZSBzbGlkZSBvdmVydmlldyBhbmQgZW50ZXJzIHRoZSBjdXJyZW50bHlcblx0ICogYWN0aXZlIHNsaWRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGVhY3RpdmF0ZU92ZXJ2aWV3KCkge1xuXG5cdFx0Ly8gT25seSBwcm9jZWVkIGlmIGVuYWJsZWQgaW4gY29uZmlnXG5cdFx0aWYoIGNvbmZpZy5vdmVydmlldyApIHtcblxuXHRcdFx0b3ZlcnZpZXcgPSBmYWxzZTtcblxuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ292ZXJ2aWV3JyApO1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ292ZXJ2aWV3LWFuaW1hdGVkJyApO1xuXG5cdFx0XHQvLyBUZW1wb3JhcmlseSBhZGQgYSBjbGFzcyBzbyB0aGF0IHRyYW5zaXRpb25zIGNhbiBkbyBkaWZmZXJlbnQgdGhpbmdzXG5cdFx0XHQvLyBkZXBlbmRpbmcgb24gd2hldGhlciB0aGV5IGFyZSBleGl0aW5nL2VudGVyaW5nIG92ZXJ2aWV3LCBvciBqdXN0XG5cdFx0XHQvLyBtb3ZpbmcgZnJvbSBzbGlkZSB0byBzbGlkZVxuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ292ZXJ2aWV3LWRlYWN0aXZhdGluZycgKTtcblxuXHRcdFx0c2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCAnb3ZlcnZpZXctZGVhY3RpdmF0aW5nJyApO1xuXHRcdFx0fSwgMSApO1xuXG5cdFx0XHQvLyBNb3ZlIHRoZSBiYWNrZ3JvdW5kIGVsZW1lbnQgYmFjayBvdXRcblx0XHRcdGRvbS53cmFwcGVyLmFwcGVuZENoaWxkKCBkb20uYmFja2dyb3VuZCApO1xuXG5cdFx0XHQvLyBDbGVhbiB1cCBjaGFuZ2VzIG1hZGUgdG8gc2xpZGVzXG5cdFx0XHR0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBTTElERVNfU0VMRUNUT1IgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBzbGlkZSApIHtcblx0XHRcdFx0dHJhbnNmb3JtRWxlbWVudCggc2xpZGUsICcnICk7XG5cblx0XHRcdFx0c2xpZGUucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgb25PdmVydmlld1NsaWRlQ2xpY2tlZCwgdHJ1ZSApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHQvLyBDbGVhbiB1cCBjaGFuZ2VzIG1hZGUgdG8gYmFja2dyb3VuZHNcblx0XHRcdHRvQXJyYXkoIGRvbS5iYWNrZ3JvdW5kLnF1ZXJ5U2VsZWN0b3JBbGwoICcuc2xpZGUtYmFja2dyb3VuZCcgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBiYWNrZ3JvdW5kICkge1xuXHRcdFx0XHR0cmFuc2Zvcm1FbGVtZW50KCBiYWNrZ3JvdW5kLCAnJyApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHR0cmFuc2Zvcm1TbGlkZXMoIHsgb3ZlcnZpZXc6ICcnIH0gKTtcblxuXHRcdFx0c2xpZGUoIGluZGV4aCwgaW5kZXh2ICk7XG5cblx0XHRcdGxheW91dCgpO1xuXG5cdFx0XHRjdWVBdXRvU2xpZGUoKTtcblxuXHRcdFx0Ly8gTm90aWZ5IG9ic2VydmVycyBvZiB0aGUgb3ZlcnZpZXcgaGlkaW5nXG5cdFx0XHRkaXNwYXRjaEV2ZW50KCAnb3ZlcnZpZXdoaWRkZW4nLCB7XG5cdFx0XHRcdCdpbmRleGgnOiBpbmRleGgsXG5cdFx0XHRcdCdpbmRleHYnOiBpbmRleHYsXG5cdFx0XHRcdCdjdXJyZW50U2xpZGUnOiBjdXJyZW50U2xpZGVcblx0XHRcdH0gKTtcblxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBUb2dnbGVzIHRoZSBzbGlkZSBvdmVydmlldyBtb2RlIG9uIGFuZCBvZmYuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gW292ZXJyaWRlXSBGbGFnIHdoaWNoIG92ZXJyaWRlcyB0aGVcblx0ICogdG9nZ2xlIGxvZ2ljIGFuZCBmb3JjaWJseSBzZXRzIHRoZSBkZXNpcmVkIHN0YXRlLiBUcnVlIG1lYW5zXG5cdCAqIG92ZXJ2aWV3IGlzIG9wZW4sIGZhbHNlIG1lYW5zIGl0J3MgY2xvc2VkLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9nZ2xlT3ZlcnZpZXcoIG92ZXJyaWRlICkge1xuXG5cdFx0aWYoIHR5cGVvZiBvdmVycmlkZSA9PT0gJ2Jvb2xlYW4nICkge1xuXHRcdFx0b3ZlcnJpZGUgPyBhY3RpdmF0ZU92ZXJ2aWV3KCkgOiBkZWFjdGl2YXRlT3ZlcnZpZXcoKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpc092ZXJ2aWV3KCkgPyBkZWFjdGl2YXRlT3ZlcnZpZXcoKSA6IGFjdGl2YXRlT3ZlcnZpZXcoKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgaWYgdGhlIG92ZXJ2aWV3IGlzIGN1cnJlbnRseSBhY3RpdmUuXG5cdCAqXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgdGhlIG92ZXJ2aWV3IGlzIGFjdGl2ZSxcblx0ICogZmFsc2Ugb3RoZXJ3aXNlXG5cdCAqL1xuXHRmdW5jdGlvbiBpc092ZXJ2aWV3KCkge1xuXG5cdFx0cmV0dXJuIG92ZXJ2aWV3O1xuXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IG9yIHNwZWNpZmllZCBzbGlkZSBpcyB2ZXJ0aWNhbFxuXHQgKiAobmVzdGVkIHdpdGhpbiBhbm90aGVyIHNsaWRlKS5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW3NsaWRlPWN1cnJlbnRTbGlkZV0gVGhlIHNsaWRlIHRvIGNoZWNrXG5cdCAqIG9yaWVudGF0aW9uIG9mXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59XG5cdCAqL1xuXHRmdW5jdGlvbiBpc1ZlcnRpY2FsU2xpZGUoIHNsaWRlICkge1xuXG5cdFx0Ly8gUHJlZmVyIHNsaWRlIGFyZ3VtZW50LCBvdGhlcndpc2UgdXNlIGN1cnJlbnQgc2xpZGVcblx0XHRzbGlkZSA9IHNsaWRlID8gc2xpZGUgOiBjdXJyZW50U2xpZGU7XG5cblx0XHRyZXR1cm4gc2xpZGUgJiYgc2xpZGUucGFyZW50Tm9kZSAmJiAhIXNsaWRlLnBhcmVudE5vZGUubm9kZU5hbWUubWF0Y2goIC9zZWN0aW9uL2kgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsaW5nIHRoZSBmdWxsc2NyZWVuIGZ1bmN0aW9uYWxpdHkgdmlhIHRoZSBmdWxsc2NyZWVuIEFQSVxuXHQgKlxuXHQgKiBAc2VlIGh0dHA6Ly9mdWxsc2NyZWVuLnNwZWMud2hhdHdnLm9yZy9cblx0ICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0RPTS9Vc2luZ19mdWxsc2NyZWVuX21vZGVcblx0ICovXG5cdGZ1bmN0aW9uIGVudGVyRnVsbHNjcmVlbigpIHtcblxuXHRcdHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXG5cdFx0Ly8gQ2hlY2sgd2hpY2ggaW1wbGVtZW50YXRpb24gaXMgYXZhaWxhYmxlXG5cdFx0dmFyIHJlcXVlc3RNZXRob2QgPSBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuIHx8XG5cdFx0XHRcdFx0XHRcdGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4gfHxcblx0XHRcdFx0XHRcdFx0ZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbiB8fFxuXHRcdFx0XHRcdFx0XHRlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuIHx8XG5cdFx0XHRcdFx0XHRcdGVsZW1lbnQubXNSZXF1ZXN0RnVsbHNjcmVlbjtcblxuXHRcdGlmKCByZXF1ZXN0TWV0aG9kICkge1xuXHRcdFx0cmVxdWVzdE1ldGhvZC5hcHBseSggZWxlbWVudCApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEVudGVycyB0aGUgcGF1c2VkIG1vZGUgd2hpY2ggZmFkZXMgZXZlcnl0aGluZyBvbiBzY3JlZW4gdG9cblx0ICogYmxhY2suXG5cdCAqL1xuXHRmdW5jdGlvbiBwYXVzZSgpIHtcblxuXHRcdGlmKCBjb25maWcucGF1c2UgKSB7XG5cdFx0XHR2YXIgd2FzUGF1c2VkID0gZG9tLndyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCAncGF1c2VkJyApO1xuXG5cdFx0XHRjYW5jZWxBdXRvU2xpZGUoKTtcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoICdwYXVzZWQnICk7XG5cblx0XHRcdGlmKCB3YXNQYXVzZWQgPT09IGZhbHNlICkge1xuXHRcdFx0XHRkaXNwYXRjaEV2ZW50KCAncGF1c2VkJyApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEV4aXRzIGZyb20gdGhlIHBhdXNlZCBtb2RlLlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVzdW1lKCkge1xuXG5cdFx0dmFyIHdhc1BhdXNlZCA9IGRvbS53cmFwcGVyLmNsYXNzTGlzdC5jb250YWlucyggJ3BhdXNlZCcgKTtcblx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCAncGF1c2VkJyApO1xuXG5cdFx0Y3VlQXV0b1NsaWRlKCk7XG5cblx0XHRpZiggd2FzUGF1c2VkICkge1xuXHRcdFx0ZGlzcGF0Y2hFdmVudCggJ3Jlc3VtZWQnICk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVG9nZ2xlcyB0aGUgcGF1c2VkIG1vZGUgb24gYW5kIG9mZi5cblx0ICovXG5cdGZ1bmN0aW9uIHRvZ2dsZVBhdXNlKCBvdmVycmlkZSApIHtcblxuXHRcdGlmKCB0eXBlb2Ygb3ZlcnJpZGUgPT09ICdib29sZWFuJyApIHtcblx0XHRcdG92ZXJyaWRlID8gcGF1c2UoKSA6IHJlc3VtZSgpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlzUGF1c2VkKCkgPyByZXN1bWUoKSA6IHBhdXNlKCk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIHdlIGFyZSBjdXJyZW50bHkgaW4gdGhlIHBhdXNlZCBtb2RlLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHQgKi9cblx0ZnVuY3Rpb24gaXNQYXVzZWQoKSB7XG5cblx0XHRyZXR1cm4gZG9tLndyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCAncGF1c2VkJyApO1xuXG5cdH1cblxuXHQvKipcblx0ICogVG9nZ2xlcyB0aGUgYXV0byBzbGlkZSBtb2RlIG9uIGFuZCBvZmYuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gW292ZXJyaWRlXSBGbGFnIHdoaWNoIHNldHMgdGhlIGRlc2lyZWQgc3RhdGUuXG5cdCAqIFRydWUgbWVhbnMgYXV0b3BsYXkgc3RhcnRzLCBmYWxzZSBtZWFucyBpdCBzdG9wcy5cblx0ICovXG5cblx0ZnVuY3Rpb24gdG9nZ2xlQXV0b1NsaWRlKCBvdmVycmlkZSApIHtcblxuXHRcdGlmKCB0eXBlb2Ygb3ZlcnJpZGUgPT09ICdib29sZWFuJyApIHtcblx0XHRcdG92ZXJyaWRlID8gcmVzdW1lQXV0b1NsaWRlKCkgOiBwYXVzZUF1dG9TbGlkZSgpO1xuXHRcdH1cblxuXHRcdGVsc2Uge1xuXHRcdFx0YXV0b1NsaWRlUGF1c2VkID8gcmVzdW1lQXV0b1NsaWRlKCkgOiBwYXVzZUF1dG9TbGlkZSgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiB0aGUgYXV0byBzbGlkZSBtb2RlIGlzIGN1cnJlbnRseSBvbi5cblx0ICpcblx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0ICovXG5cdGZ1bmN0aW9uIGlzQXV0b1NsaWRpbmcoKSB7XG5cblx0XHRyZXR1cm4gISEoIGF1dG9TbGlkZSAmJiAhYXV0b1NsaWRlUGF1c2VkICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTdGVwcyBmcm9tIHRoZSBjdXJyZW50IHBvaW50IGluIHRoZSBwcmVzZW50YXRpb24gdG8gdGhlXG5cdCAqIHNsaWRlIHdoaWNoIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbFxuXHQgKiBpbmRpY2VzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge251bWJlcn0gW2g9aW5kZXhoXSBIb3Jpem9udGFsIGluZGV4IG9mIHRoZSB0YXJnZXQgc2xpZGVcblx0ICogQHBhcmFtIHtudW1iZXJ9IFt2PWluZGV4dl0gVmVydGljYWwgaW5kZXggb2YgdGhlIHRhcmdldCBzbGlkZVxuXHQgKiBAcGFyYW0ge251bWJlcn0gW2ZdIEluZGV4IG9mIGEgZnJhZ21lbnQgd2l0aGluIHRoZVxuXHQgKiB0YXJnZXQgc2xpZGUgdG8gYWN0aXZhdGVcblx0ICogQHBhcmFtIHtudW1iZXJ9IFtvXSBPcmlnaW4gZm9yIHVzZSBpbiBtdWx0aW1hc3RlciBlbnZpcm9ubWVudHNcblx0ICovXG5cdGZ1bmN0aW9uIHNsaWRlKCBoLCB2LCBmLCBvICkge1xuXG5cdFx0Ly8gUmVtZW1iZXIgd2hlcmUgd2Ugd2VyZSBhdCBiZWZvcmVcblx0XHRwcmV2aW91c1NsaWRlID0gY3VycmVudFNsaWRlO1xuXG5cdFx0Ly8gUXVlcnkgYWxsIGhvcml6b250YWwgc2xpZGVzIGluIHRoZSBkZWNrXG5cdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApO1xuXG5cdFx0Ly8gQWJvcnQgaWYgdGhlcmUgYXJlIG5vIHNsaWRlc1xuXHRcdGlmKCBob3Jpem9udGFsU2xpZGVzLmxlbmd0aCA9PT0gMCApIHJldHVybjtcblxuXHRcdC8vIElmIG5vIHZlcnRpY2FsIGluZGV4IGlzIHNwZWNpZmllZCBhbmQgdGhlIHVwY29taW5nIHNsaWRlIGlzIGFcblx0XHQvLyBzdGFjaywgcmVzdW1lIGF0IGl0cyBwcmV2aW91cyB2ZXJ0aWNhbCBpbmRleFxuXHRcdGlmKCB2ID09PSB1bmRlZmluZWQgJiYgIWlzT3ZlcnZpZXcoKSApIHtcblx0XHRcdHYgPSBnZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIGhvcml6b250YWxTbGlkZXNbIGggXSApO1xuXHRcdH1cblxuXHRcdC8vIElmIHdlIHdlcmUgb24gYSB2ZXJ0aWNhbCBzdGFjaywgcmVtZW1iZXIgd2hhdCB2ZXJ0aWNhbCBpbmRleFxuXHRcdC8vIGl0IHdhcyBvbiBzbyB3ZSBjYW4gcmVzdW1lIGF0IHRoZSBzYW1lIHBvc2l0aW9uIHdoZW4gcmV0dXJuaW5nXG5cdFx0aWYoIHByZXZpb3VzU2xpZGUgJiYgcHJldmlvdXNTbGlkZS5wYXJlbnROb2RlICYmIHByZXZpb3VzU2xpZGUucGFyZW50Tm9kZS5jbGFzc0xpc3QuY29udGFpbnMoICdzdGFjaycgKSApIHtcblx0XHRcdHNldFByZXZpb3VzVmVydGljYWxJbmRleCggcHJldmlvdXNTbGlkZS5wYXJlbnROb2RlLCBpbmRleHYgKTtcblx0XHR9XG5cblx0XHQvLyBSZW1lbWJlciB0aGUgc3RhdGUgYmVmb3JlIHRoaXMgc2xpZGVcblx0XHR2YXIgc3RhdGVCZWZvcmUgPSBzdGF0ZS5jb25jYXQoKTtcblxuXHRcdC8vIFJlc2V0IHRoZSBzdGF0ZSBhcnJheVxuXHRcdHN0YXRlLmxlbmd0aCA9IDA7XG5cblx0XHR2YXIgaW5kZXhoQmVmb3JlID0gaW5kZXhoIHx8IDAsXG5cdFx0XHRpbmRleHZCZWZvcmUgPSBpbmRleHYgfHwgMDtcblxuXHRcdC8vIEFjdGl2YXRlIGFuZCB0cmFuc2l0aW9uIHRvIHRoZSBuZXcgc2xpZGVcblx0XHRpbmRleGggPSB1cGRhdGVTbGlkZXMoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SLCBoID09PSB1bmRlZmluZWQgPyBpbmRleGggOiBoICk7XG5cdFx0aW5kZXh2ID0gdXBkYXRlU2xpZGVzKCBWRVJUSUNBTF9TTElERVNfU0VMRUNUT1IsIHYgPT09IHVuZGVmaW5lZCA/IGluZGV4diA6IHYgKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgdmlzaWJpbGl0eSBvZiBzbGlkZXMgbm93IHRoYXQgdGhlIGluZGljZXMgaGF2ZSBjaGFuZ2VkXG5cdFx0dXBkYXRlU2xpZGVzVmlzaWJpbGl0eSgpO1xuXG5cdFx0bGF5b3V0KCk7XG5cblx0XHQvLyBBcHBseSB0aGUgbmV3IHN0YXRlXG5cdFx0c3RhdGVMb29wOiBmb3IoIHZhciBpID0gMCwgbGVuID0gc3RhdGUubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHQvLyBDaGVjayBpZiB0aGlzIHN0YXRlIGV4aXN0ZWQgb24gdGhlIHByZXZpb3VzIHNsaWRlLiBJZiBpdFxuXHRcdFx0Ly8gZGlkLCB3ZSB3aWxsIGF2b2lkIGFkZGluZyBpdCByZXBlYXRlZGx5XG5cdFx0XHRmb3IoIHZhciBqID0gMDsgaiA8IHN0YXRlQmVmb3JlLmxlbmd0aDsgaisrICkge1xuXHRcdFx0XHRpZiggc3RhdGVCZWZvcmVbal0gPT09IHN0YXRlW2ldICkge1xuXHRcdFx0XHRcdHN0YXRlQmVmb3JlLnNwbGljZSggaiwgMSApO1xuXHRcdFx0XHRcdGNvbnRpbnVlIHN0YXRlTG9vcDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCggc3RhdGVbaV0gKTtcblxuXHRcdFx0Ly8gRGlzcGF0Y2ggY3VzdG9tIGV2ZW50IG1hdGNoaW5nIHRoZSBzdGF0ZSdzIG5hbWVcblx0XHRcdGRpc3BhdGNoRXZlbnQoIHN0YXRlW2ldICk7XG5cdFx0fVxuXG5cdFx0Ly8gQ2xlYW4gdXAgdGhlIHJlbWFpbnMgb2YgdGhlIHByZXZpb3VzIHN0YXRlXG5cdFx0d2hpbGUoIHN0YXRlQmVmb3JlLmxlbmd0aCApIHtcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCBzdGF0ZUJlZm9yZS5wb3AoKSApO1xuXHRcdH1cblxuXHRcdC8vIFVwZGF0ZSB0aGUgb3ZlcnZpZXcgaWYgaXQncyBjdXJyZW50bHkgYWN0aXZlXG5cdFx0aWYoIGlzT3ZlcnZpZXcoKSApIHtcblx0XHRcdHVwZGF0ZU92ZXJ2aWV3KCk7XG5cdFx0fVxuXG5cdFx0Ly8gRmluZCB0aGUgY3VycmVudCBob3Jpem9udGFsIHNsaWRlIGFuZCBhbnkgcG9zc2libGUgdmVydGljYWwgc2xpZGVzXG5cdFx0Ly8gd2l0aGluIGl0XG5cdFx0dmFyIGN1cnJlbnRIb3Jpem9udGFsU2xpZGUgPSBob3Jpem9udGFsU2xpZGVzWyBpbmRleGggXSxcblx0XHRcdGN1cnJlbnRWZXJ0aWNhbFNsaWRlcyA9IGN1cnJlbnRIb3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICk7XG5cblx0XHQvLyBTdG9yZSByZWZlcmVuY2VzIHRvIHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCBzbGlkZXNcblx0XHRjdXJyZW50U2xpZGUgPSBjdXJyZW50VmVydGljYWxTbGlkZXNbIGluZGV4diBdIHx8IGN1cnJlbnRIb3Jpem9udGFsU2xpZGU7XG5cblx0XHQvLyBTaG93IGZyYWdtZW50LCBpZiBzcGVjaWZpZWRcblx0XHRpZiggdHlwZW9mIGYgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0bmF2aWdhdGVGcmFnbWVudCggZiApO1xuXHRcdH1cblxuXHRcdC8vIERpc3BhdGNoIGFuIGV2ZW50IGlmIHRoZSBzbGlkZSBjaGFuZ2VkXG5cdFx0dmFyIHNsaWRlQ2hhbmdlZCA9ICggaW5kZXhoICE9PSBpbmRleGhCZWZvcmUgfHwgaW5kZXh2ICE9PSBpbmRleHZCZWZvcmUgKTtcblx0XHRpZiggc2xpZGVDaGFuZ2VkICkge1xuXHRcdFx0ZGlzcGF0Y2hFdmVudCggJ3NsaWRlY2hhbmdlZCcsIHtcblx0XHRcdFx0J2luZGV4aCc6IGluZGV4aCxcblx0XHRcdFx0J2luZGV4dic6IGluZGV4dixcblx0XHRcdFx0J3ByZXZpb3VzU2xpZGUnOiBwcmV2aW91c1NsaWRlLFxuXHRcdFx0XHQnY3VycmVudFNsaWRlJzogY3VycmVudFNsaWRlLFxuXHRcdFx0XHQnb3JpZ2luJzogb1xuXHRcdFx0fSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIEVuc3VyZSB0aGF0IHRoZSBwcmV2aW91cyBzbGlkZSBpcyBuZXZlciB0aGUgc2FtZSBhcyB0aGUgY3VycmVudFxuXHRcdFx0cHJldmlvdXNTbGlkZSA9IG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gU29sdmVzIGFuIGVkZ2UgY2FzZSB3aGVyZSB0aGUgcHJldmlvdXMgc2xpZGUgbWFpbnRhaW5zIHRoZVxuXHRcdC8vICdwcmVzZW50JyBjbGFzcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBhZGphY2VudCB2ZXJ0aWNhbFxuXHRcdC8vIHN0YWNrc1xuXHRcdGlmKCBwcmV2aW91c1NsaWRlICkge1xuXHRcdFx0cHJldmlvdXNTbGlkZS5jbGFzc0xpc3QucmVtb3ZlKCAncHJlc2VudCcgKTtcblx0XHRcdHByZXZpb3VzU2xpZGUuc2V0QXR0cmlidXRlKCAnYXJpYS1oaWRkZW4nLCAndHJ1ZScgKTtcblxuXHRcdFx0Ly8gUmVzZXQgYWxsIHNsaWRlcyB1cG9uIG5hdmlnYXRlIHRvIGhvbWVcblx0XHRcdC8vIElzc3VlOiAjMjg1XG5cdFx0XHRpZiAoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3IoIEhPTUVfU0xJREVfU0VMRUNUT1IgKS5jbGFzc0xpc3QuY29udGFpbnMoICdwcmVzZW50JyApICkge1xuXHRcdFx0XHQvLyBMYXVuY2ggYXN5bmMgdGFza1xuXHRcdFx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dmFyIHNsaWRlcyA9IHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICsgJy5zdGFjaycpICksIGk7XG5cdFx0XHRcdFx0Zm9yKCBpIGluIHNsaWRlcyApIHtcblx0XHRcdFx0XHRcdGlmKCBzbGlkZXNbaV0gKSB7XG5cdFx0XHRcdFx0XHRcdC8vIFJlc2V0IHN0YWNrXG5cdFx0XHRcdFx0XHRcdHNldFByZXZpb3VzVmVydGljYWxJbmRleCggc2xpZGVzW2ldLCAwICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAwICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSGFuZGxlIGVtYmVkZGVkIGNvbnRlbnRcblx0XHRpZiggc2xpZGVDaGFuZ2VkIHx8ICFwcmV2aW91c1NsaWRlICkge1xuXHRcdFx0c3RvcEVtYmVkZGVkQ29udGVudCggcHJldmlvdXNTbGlkZSApO1xuXHRcdFx0c3RhcnRFbWJlZGRlZENvbnRlbnQoIGN1cnJlbnRTbGlkZSApO1xuXHRcdH1cblxuXHRcdC8vIEFubm91bmNlIHRoZSBjdXJyZW50IHNsaWRlIGNvbnRlbnRzLCBmb3Igc2NyZWVuIHJlYWRlcnNcblx0XHRkb20uc3RhdHVzRGl2LnRleHRDb250ZW50ID0gZ2V0U3RhdHVzVGV4dCggY3VycmVudFNsaWRlICk7XG5cblx0XHR1cGRhdGVDb250cm9scygpO1xuXHRcdHVwZGF0ZVByb2dyZXNzKCk7XG5cdFx0dXBkYXRlQmFja2dyb3VuZCgpO1xuXHRcdHVwZGF0ZVBhcmFsbGF4KCk7XG5cdFx0dXBkYXRlU2xpZGVOdW1iZXIoKTtcblx0XHR1cGRhdGVOb3RlcygpO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSBVUkwgaGFzaFxuXHRcdHdyaXRlVVJMKCk7XG5cblx0XHRjdWVBdXRvU2xpZGUoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFN5bmNzIHRoZSBwcmVzZW50YXRpb24gd2l0aCB0aGUgY3VycmVudCBET00uIFVzZWZ1bFxuXHQgKiB3aGVuIG5ldyBzbGlkZXMgb3IgY29udHJvbCBlbGVtZW50cyBhcmUgYWRkZWQgb3Igd2hlblxuXHQgKiB0aGUgY29uZmlndXJhdGlvbiBoYXMgY2hhbmdlZC5cblx0ICovXG5cdGZ1bmN0aW9uIHN5bmMoKSB7XG5cblx0XHQvLyBTdWJzY3JpYmUgdG8gaW5wdXRcblx0XHRyZW1vdmVFdmVudExpc3RlbmVycygpO1xuXHRcdGFkZEV2ZW50TGlzdGVuZXJzKCk7XG5cblx0XHQvLyBGb3JjZSBhIGxheW91dCB0byBtYWtlIHN1cmUgdGhlIGN1cnJlbnQgY29uZmlnIGlzIGFjY291bnRlZCBmb3Jcblx0XHRsYXlvdXQoKTtcblxuXHRcdC8vIFJlZmxlY3QgdGhlIGN1cnJlbnQgYXV0b1NsaWRlIHZhbHVlXG5cdFx0YXV0b1NsaWRlID0gY29uZmlnLmF1dG9TbGlkZTtcblxuXHRcdC8vIFN0YXJ0IGF1dG8tc2xpZGluZyBpZiBpdCdzIGVuYWJsZWRcblx0XHRjdWVBdXRvU2xpZGUoKTtcblxuXHRcdC8vIFJlLWNyZWF0ZSB0aGUgc2xpZGUgYmFja2dyb3VuZHNcblx0XHRjcmVhdGVCYWNrZ3JvdW5kcygpO1xuXG5cdFx0Ly8gV3JpdGUgdGhlIGN1cnJlbnQgaGFzaCB0byB0aGUgVVJMXG5cdFx0d3JpdGVVUkwoKTtcblxuXHRcdHNvcnRBbGxGcmFnbWVudHMoKTtcblxuXHRcdHVwZGF0ZUNvbnRyb2xzKCk7XG5cdFx0dXBkYXRlUHJvZ3Jlc3MoKTtcblx0XHR1cGRhdGVTbGlkZU51bWJlcigpO1xuXHRcdHVwZGF0ZVNsaWRlc1Zpc2liaWxpdHkoKTtcblx0XHR1cGRhdGVCYWNrZ3JvdW5kKCB0cnVlICk7XG5cdFx0dXBkYXRlTm90ZXMoKTtcblxuXHRcdGZvcm1hdEVtYmVkZGVkQ29udGVudCgpO1xuXG5cdFx0Ly8gU3RhcnQgb3Igc3RvcCBlbWJlZGRlZCBjb250ZW50IGRlcGVuZGluZyBvbiBnbG9iYWwgY29uZmlnXG5cdFx0aWYoIGNvbmZpZy5hdXRvUGxheU1lZGlhID09PSBmYWxzZSApIHtcblx0XHRcdHN0b3BFbWJlZGRlZENvbnRlbnQoIGN1cnJlbnRTbGlkZSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHN0YXJ0RW1iZWRkZWRDb250ZW50KCBjdXJyZW50U2xpZGUgKTtcblx0XHR9XG5cblx0XHRpZiggaXNPdmVydmlldygpICkge1xuXHRcdFx0bGF5b3V0T3ZlcnZpZXcoKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNldHMgYWxsIHZlcnRpY2FsIHNsaWRlcyBzbyB0aGF0IG9ubHkgdGhlIGZpcnN0XG5cdCAqIGlzIHZpc2libGUuXG5cdCAqL1xuXHRmdW5jdGlvbiByZXNldFZlcnRpY2FsU2xpZGVzKCkge1xuXG5cdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSB0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApICk7XG5cdFx0aG9yaXpvbnRhbFNsaWRlcy5mb3JFYWNoKCBmdW5jdGlvbiggaG9yaXpvbnRhbFNsaWRlICkge1xuXG5cdFx0XHR2YXIgdmVydGljYWxTbGlkZXMgPSB0b0FycmF5KCBob3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkgKTtcblx0XHRcdHZlcnRpY2FsU2xpZGVzLmZvckVhY2goIGZ1bmN0aW9uKCB2ZXJ0aWNhbFNsaWRlLCB5ICkge1xuXG5cdFx0XHRcdGlmKCB5ID4gMCApIHtcblx0XHRcdFx0XHR2ZXJ0aWNhbFNsaWRlLmNsYXNzTGlzdC5yZW1vdmUoICdwcmVzZW50JyApO1xuXHRcdFx0XHRcdHZlcnRpY2FsU2xpZGUuY2xhc3NMaXN0LnJlbW92ZSggJ3Bhc3QnICk7XG5cdFx0XHRcdFx0dmVydGljYWxTbGlkZS5jbGFzc0xpc3QuYWRkKCAnZnV0dXJlJyApO1xuXHRcdFx0XHRcdHZlcnRpY2FsU2xpZGUuc2V0QXR0cmlidXRlKCAnYXJpYS1oaWRkZW4nLCAndHJ1ZScgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9ICk7XG5cblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTb3J0cyBhbmQgZm9ybWF0cyBhbGwgb2YgZnJhZ21lbnRzIGluIHRoZVxuXHQgKiBwcmVzZW50YXRpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBzb3J0QWxsRnJhZ21lbnRzKCkge1xuXG5cdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSB0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApICk7XG5cdFx0aG9yaXpvbnRhbFNsaWRlcy5mb3JFYWNoKCBmdW5jdGlvbiggaG9yaXpvbnRhbFNsaWRlICkge1xuXG5cdFx0XHR2YXIgdmVydGljYWxTbGlkZXMgPSB0b0FycmF5KCBob3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkgKTtcblx0XHRcdHZlcnRpY2FsU2xpZGVzLmZvckVhY2goIGZ1bmN0aW9uKCB2ZXJ0aWNhbFNsaWRlLCB5ICkge1xuXG5cdFx0XHRcdHNvcnRGcmFnbWVudHMoIHZlcnRpY2FsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKSApO1xuXG5cdFx0XHR9ICk7XG5cblx0XHRcdGlmKCB2ZXJ0aWNhbFNsaWRlcy5sZW5ndGggPT09IDAgKSBzb3J0RnJhZ21lbnRzKCBob3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKSApO1xuXG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmFuZG9tbHkgc2h1ZmZsZXMgYWxsIHNsaWRlcyBpbiB0aGUgZGVjay5cblx0ICovXG5cdGZ1bmN0aW9uIHNodWZmbGUoKSB7XG5cblx0XHR2YXIgc2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApO1xuXG5cdFx0c2xpZGVzLmZvckVhY2goIGZ1bmN0aW9uKCBzbGlkZSApIHtcblxuXHRcdFx0Ly8gSW5zZXJ0IHRoaXMgc2xpZGUgbmV4dCB0byBhbm90aGVyIHJhbmRvbSBzbGlkZS4gVGhpcyBtYXlcblx0XHRcdC8vIGNhdXNlIHRoZSBzbGlkZSB0byBpbnNlcnQgYmVmb3JlIGl0c2VsZiBidXQgdGhhdCdzIGZpbmUuXG5cdFx0XHRkb20uc2xpZGVzLmluc2VydEJlZm9yZSggc2xpZGUsIHNsaWRlc1sgTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqIHNsaWRlcy5sZW5ndGggKSBdICk7XG5cblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIG9uZSBkaW1lbnNpb24gb2Ygc2xpZGVzIGJ5IHNob3dpbmcgdGhlIHNsaWRlXG5cdCAqIHdpdGggdGhlIHNwZWNpZmllZCBpbmRleC5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yIEEgQ1NTIHNlbGVjdG9yIHRoYXQgd2lsbCBmZXRjaFxuXHQgKiB0aGUgZ3JvdXAgb2Ygc2xpZGVzIHdlIGFyZSB3b3JraW5nIHdpdGhcblx0ICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFRoZSBpbmRleCBvZiB0aGUgc2xpZGUgdGhhdCBzaG91bGQgYmVcblx0ICogc2hvd25cblx0ICpcblx0ICogQHJldHVybiB7bnVtYmVyfSBUaGUgaW5kZXggb2YgdGhlIHNsaWRlIHRoYXQgaXMgbm93IHNob3duLFxuXHQgKiBtaWdodCBkaWZmZXIgZnJvbSB0aGUgcGFzc2VkIGluIGluZGV4IGlmIGl0IHdhcyBvdXQgb2Zcblx0ICogYm91bmRzLlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlU2xpZGVzKCBzZWxlY3RvciwgaW5kZXggKSB7XG5cblx0XHQvLyBTZWxlY3QgYWxsIHNsaWRlcyBhbmQgY29udmVydCB0aGUgTm9kZUxpc3QgcmVzdWx0IHRvXG5cdFx0Ly8gYW4gYXJyYXlcblx0XHR2YXIgc2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggc2VsZWN0b3IgKSApLFxuXHRcdFx0c2xpZGVzTGVuZ3RoID0gc2xpZGVzLmxlbmd0aDtcblxuXHRcdHZhciBwcmludE1vZGUgPSBpc1ByaW50aW5nUERGKCk7XG5cblx0XHRpZiggc2xpZGVzTGVuZ3RoICkge1xuXG5cdFx0XHQvLyBTaG91bGQgdGhlIGluZGV4IGxvb3A/XG5cdFx0XHRpZiggY29uZmlnLmxvb3AgKSB7XG5cdFx0XHRcdGluZGV4ICU9IHNsaWRlc0xlbmd0aDtcblxuXHRcdFx0XHRpZiggaW5kZXggPCAwICkge1xuXHRcdFx0XHRcdGluZGV4ID0gc2xpZGVzTGVuZ3RoICsgaW5kZXg7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gRW5mb3JjZSBtYXggYW5kIG1pbmltdW0gaW5kZXggYm91bmRzXG5cdFx0XHRpbmRleCA9IE1hdGgubWF4KCBNYXRoLm1pbiggaW5kZXgsIHNsaWRlc0xlbmd0aCAtIDEgKSwgMCApO1xuXG5cdFx0XHRmb3IoIHZhciBpID0gMDsgaSA8IHNsaWRlc0xlbmd0aDsgaSsrICkge1xuXHRcdFx0XHR2YXIgZWxlbWVudCA9IHNsaWRlc1tpXTtcblxuXHRcdFx0XHR2YXIgcmV2ZXJzZSA9IGNvbmZpZy5ydGwgJiYgIWlzVmVydGljYWxTbGlkZSggZWxlbWVudCApO1xuXG5cdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ3Bhc3QnICk7XG5cdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ3ByZXNlbnQnICk7XG5cdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ2Z1dHVyZScgKTtcblxuXHRcdFx0XHQvLyBodHRwOi8vd3d3LnczLm9yZy9odG1sL3dnL2RyYWZ0cy9odG1sL21hc3Rlci9lZGl0aW5nLmh0bWwjdGhlLWhpZGRlbi1hdHRyaWJ1dGVcblx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUoICdoaWRkZW4nLCAnJyApO1xuXHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZSggJ2FyaWEtaGlkZGVuJywgJ3RydWUnICk7XG5cblx0XHRcdFx0Ly8gSWYgdGhpcyBlbGVtZW50IGNvbnRhaW5zIHZlcnRpY2FsIHNsaWRlc1xuXHRcdFx0XHRpZiggZWxlbWVudC5xdWVyeVNlbGVjdG9yKCAnc2VjdGlvbicgKSApIHtcblx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQoICdzdGFjaycgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIElmIHdlJ3JlIHByaW50aW5nIHN0YXRpYyBzbGlkZXMsIGFsbCBzbGlkZXMgYXJlIFwicHJlc2VudFwiXG5cdFx0XHRcdGlmKCBwcmludE1vZGUgKSB7XG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCAncHJlc2VudCcgKTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCBpIDwgaW5kZXggKSB7XG5cdFx0XHRcdFx0Ly8gQW55IGVsZW1lbnQgcHJldmlvdXMgdG8gaW5kZXggaXMgZ2l2ZW4gdGhlICdwYXN0JyBjbGFzc1xuXHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCggcmV2ZXJzZSA/ICdmdXR1cmUnIDogJ3Bhc3QnICk7XG5cblx0XHRcdFx0XHRpZiggY29uZmlnLmZyYWdtZW50cyApIHtcblx0XHRcdFx0XHRcdHZhciBwYXN0RnJhZ21lbnRzID0gdG9BcnJheSggZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50JyApICk7XG5cblx0XHRcdFx0XHRcdC8vIFNob3cgYWxsIGZyYWdtZW50cyBvbiBwcmlvciBzbGlkZXNcblx0XHRcdFx0XHRcdHdoaWxlKCBwYXN0RnJhZ21lbnRzLmxlbmd0aCApIHtcblx0XHRcdFx0XHRcdFx0dmFyIHBhc3RGcmFnbWVudCA9IHBhc3RGcmFnbWVudHMucG9wKCk7XG5cdFx0XHRcdFx0XHRcdHBhc3RGcmFnbWVudC5jbGFzc0xpc3QuYWRkKCAndmlzaWJsZScgKTtcblx0XHRcdFx0XHRcdFx0cGFzdEZyYWdtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdjdXJyZW50LWZyYWdtZW50JyApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKCBpID4gaW5kZXggKSB7XG5cdFx0XHRcdFx0Ly8gQW55IGVsZW1lbnQgc3Vic2VxdWVudCB0byBpbmRleCBpcyBnaXZlbiB0aGUgJ2Z1dHVyZScgY2xhc3Ncblx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQoIHJldmVyc2UgPyAncGFzdCcgOiAnZnV0dXJlJyApO1xuXG5cdFx0XHRcdFx0aWYoIGNvbmZpZy5mcmFnbWVudHMgKSB7XG5cdFx0XHRcdFx0XHR2YXIgZnV0dXJlRnJhZ21lbnRzID0gdG9BcnJheSggZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50LnZpc2libGUnICkgKTtcblxuXHRcdFx0XHRcdFx0Ly8gTm8gZnJhZ21lbnRzIGluIGZ1dHVyZSBzbGlkZXMgc2hvdWxkIGJlIHZpc2libGUgYWhlYWQgb2YgdGltZVxuXHRcdFx0XHRcdFx0d2hpbGUoIGZ1dHVyZUZyYWdtZW50cy5sZW5ndGggKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBmdXR1cmVGcmFnbWVudCA9IGZ1dHVyZUZyYWdtZW50cy5wb3AoKTtcblx0XHRcdFx0XHRcdFx0ZnV0dXJlRnJhZ21lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ3Zpc2libGUnICk7XG5cdFx0XHRcdFx0XHRcdGZ1dHVyZUZyYWdtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdjdXJyZW50LWZyYWdtZW50JyApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBNYXJrIHRoZSBjdXJyZW50IHNsaWRlIGFzIHByZXNlbnRcblx0XHRcdHNsaWRlc1tpbmRleF0uY2xhc3NMaXN0LmFkZCggJ3ByZXNlbnQnICk7XG5cdFx0XHRzbGlkZXNbaW5kZXhdLnJlbW92ZUF0dHJpYnV0ZSggJ2hpZGRlbicgKTtcblx0XHRcdHNsaWRlc1tpbmRleF0ucmVtb3ZlQXR0cmlidXRlKCAnYXJpYS1oaWRkZW4nICk7XG5cblx0XHRcdC8vIElmIHRoaXMgc2xpZGUgaGFzIGEgc3RhdGUgYXNzb2NpYXRlZCB3aXRoIGl0LCBhZGQgaXRcblx0XHRcdC8vIG9udG8gdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGRlY2tcblx0XHRcdHZhciBzbGlkZVN0YXRlID0gc2xpZGVzW2luZGV4XS5nZXRBdHRyaWJ1dGUoICdkYXRhLXN0YXRlJyApO1xuXHRcdFx0aWYoIHNsaWRlU3RhdGUgKSB7XG5cdFx0XHRcdHN0YXRlID0gc3RhdGUuY29uY2F0KCBzbGlkZVN0YXRlLnNwbGl0KCAnICcgKSApO1xuXHRcdFx0fVxuXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gU2luY2UgdGhlcmUgYXJlIG5vIHNsaWRlcyB3ZSBjYW4ndCBiZSBhbnl3aGVyZSBiZXlvbmQgdGhlXG5cdFx0XHQvLyB6ZXJvdGggaW5kZXhcblx0XHRcdGluZGV4ID0gMDtcblx0XHR9XG5cblx0XHRyZXR1cm4gaW5kZXg7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBPcHRpbWl6YXRpb24gbWV0aG9kOyBoaWRlIGFsbCBzbGlkZXMgdGhhdCBhcmUgZmFyIGF3YXlcblx0ICogZnJvbSB0aGUgcHJlc2VudCBzbGlkZS5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZVNsaWRlc1Zpc2liaWxpdHkoKSB7XG5cblx0XHQvLyBTZWxlY3QgYWxsIHNsaWRlcyBhbmQgY29udmVydCB0aGUgTm9kZUxpc3QgcmVzdWx0IHRvXG5cdFx0Ly8gYW4gYXJyYXlcblx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlcyA9IHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKSxcblx0XHRcdGhvcml6b250YWxTbGlkZXNMZW5ndGggPSBob3Jpem9udGFsU2xpZGVzLmxlbmd0aCxcblx0XHRcdGRpc3RhbmNlWCxcblx0XHRcdGRpc3RhbmNlWTtcblxuXHRcdGlmKCBob3Jpem9udGFsU2xpZGVzTGVuZ3RoICYmIHR5cGVvZiBpbmRleGggIT09ICd1bmRlZmluZWQnICkge1xuXG5cdFx0XHQvLyBUaGUgbnVtYmVyIG9mIHN0ZXBzIGF3YXkgZnJvbSB0aGUgcHJlc2VudCBzbGlkZSB0aGF0IHdpbGxcblx0XHRcdC8vIGJlIHZpc2libGVcblx0XHRcdHZhciB2aWV3RGlzdGFuY2UgPSBpc092ZXJ2aWV3KCkgPyAxMCA6IGNvbmZpZy52aWV3RGlzdGFuY2U7XG5cblx0XHRcdC8vIExpbWl0IHZpZXcgZGlzdGFuY2Ugb24gd2Vha2VyIGRldmljZXNcblx0XHRcdGlmKCBpc01vYmlsZURldmljZSApIHtcblx0XHRcdFx0dmlld0Rpc3RhbmNlID0gaXNPdmVydmlldygpID8gNiA6IDI7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFsbCBzbGlkZXMgbmVlZCB0byBiZSB2aXNpYmxlIHdoZW4gZXhwb3J0aW5nIHRvIFBERlxuXHRcdFx0aWYoIGlzUHJpbnRpbmdQREYoKSApIHtcblx0XHRcdFx0dmlld0Rpc3RhbmNlID0gTnVtYmVyLk1BWF9WQUxVRTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yKCB2YXIgeCA9IDA7IHggPCBob3Jpem9udGFsU2xpZGVzTGVuZ3RoOyB4KysgKSB7XG5cdFx0XHRcdHZhciBob3Jpem9udGFsU2xpZGUgPSBob3Jpem9udGFsU2xpZGVzW3hdO1xuXG5cdFx0XHRcdHZhciB2ZXJ0aWNhbFNsaWRlcyA9IHRvQXJyYXkoIGhvcml6b250YWxTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKSApLFxuXHRcdFx0XHRcdHZlcnRpY2FsU2xpZGVzTGVuZ3RoID0gdmVydGljYWxTbGlkZXMubGVuZ3RoO1xuXG5cdFx0XHRcdC8vIERldGVybWluZSBob3cgZmFyIGF3YXkgdGhpcyBzbGlkZSBpcyBmcm9tIHRoZSBwcmVzZW50XG5cdFx0XHRcdGRpc3RhbmNlWCA9IE1hdGguYWJzKCAoIGluZGV4aCB8fCAwICkgLSB4ICkgfHwgMDtcblxuXHRcdFx0XHQvLyBJZiB0aGUgcHJlc2VudGF0aW9uIGlzIGxvb3BlZCwgZGlzdGFuY2Ugc2hvdWxkIG1lYXN1cmVcblx0XHRcdFx0Ly8gMSBiZXR3ZWVuIHRoZSBmaXJzdCBhbmQgbGFzdCBzbGlkZXNcblx0XHRcdFx0aWYoIGNvbmZpZy5sb29wICkge1xuXHRcdFx0XHRcdGRpc3RhbmNlWCA9IE1hdGguYWJzKCAoICggaW5kZXhoIHx8IDAgKSAtIHggKSAlICggaG9yaXpvbnRhbFNsaWRlc0xlbmd0aCAtIHZpZXdEaXN0YW5jZSApICkgfHwgMDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFNob3cgdGhlIGhvcml6b250YWwgc2xpZGUgaWYgaXQncyB3aXRoaW4gdGhlIHZpZXcgZGlzdGFuY2Vcblx0XHRcdFx0aWYoIGRpc3RhbmNlWCA8IHZpZXdEaXN0YW5jZSApIHtcblx0XHRcdFx0XHRzaG93U2xpZGUoIGhvcml6b250YWxTbGlkZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGhpZGVTbGlkZSggaG9yaXpvbnRhbFNsaWRlICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiggdmVydGljYWxTbGlkZXNMZW5ndGggKSB7XG5cblx0XHRcdFx0XHR2YXIgb3kgPSBnZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIGhvcml6b250YWxTbGlkZSApO1xuXG5cdFx0XHRcdFx0Zm9yKCB2YXIgeSA9IDA7IHkgPCB2ZXJ0aWNhbFNsaWRlc0xlbmd0aDsgeSsrICkge1xuXHRcdFx0XHRcdFx0dmFyIHZlcnRpY2FsU2xpZGUgPSB2ZXJ0aWNhbFNsaWRlc1t5XTtcblxuXHRcdFx0XHRcdFx0ZGlzdGFuY2VZID0geCA9PT0gKCBpbmRleGggfHwgMCApID8gTWF0aC5hYnMoICggaW5kZXh2IHx8IDAgKSAtIHkgKSA6IE1hdGguYWJzKCB5IC0gb3kgKTtcblxuXHRcdFx0XHRcdFx0aWYoIGRpc3RhbmNlWCArIGRpc3RhbmNlWSA8IHZpZXdEaXN0YW5jZSApIHtcblx0XHRcdFx0XHRcdFx0c2hvd1NsaWRlKCB2ZXJ0aWNhbFNsaWRlICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0aGlkZVNsaWRlKCB2ZXJ0aWNhbFNsaWRlICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFBpY2sgdXAgbm90ZXMgZnJvbSB0aGUgY3VycmVudCBzbGlkZSBhbmQgZGlzcGxheSB0aGVtXG5cdCAqIHRvIHRoZSB2aWV3ZXIuXG5cdCAqXG5cdCAqIEBzZWUge0BsaW5rIGNvbmZpZy5zaG93Tm90ZXN9XG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVOb3RlcygpIHtcblxuXHRcdGlmKCBjb25maWcuc2hvd05vdGVzICYmIGRvbS5zcGVha2VyTm90ZXMgJiYgY3VycmVudFNsaWRlICYmICFpc1ByaW50aW5nUERGKCkgKSB7XG5cblx0XHRcdGRvbS5zcGVha2VyTm90ZXMuaW5uZXJIVE1MID0gZ2V0U2xpZGVOb3RlcygpIHx8ICcnO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyB0aGUgcHJvZ3Jlc3MgYmFyIHRvIHJlZmxlY3QgdGhlIGN1cnJlbnQgc2xpZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVQcm9ncmVzcygpIHtcblxuXHRcdC8vIFVwZGF0ZSBwcm9ncmVzcyBpZiBlbmFibGVkXG5cdFx0aWYoIGNvbmZpZy5wcm9ncmVzcyAmJiBkb20ucHJvZ3Jlc3NiYXIgKSB7XG5cblx0XHRcdGRvbS5wcm9ncmVzc2Jhci5zdHlsZS53aWR0aCA9IGdldFByb2dyZXNzKCkgKiBkb20ud3JhcHBlci5vZmZzZXRXaWR0aCArICdweCc7XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBzbGlkZSBudW1iZXIgZGl2IHRvIHJlZmxlY3QgdGhlIGN1cnJlbnQgc2xpZGUuXG5cdCAqXG5cdCAqIFRoZSBmb2xsb3dpbmcgc2xpZGUgbnVtYmVyIGZvcm1hdHMgYXJlIGF2YWlsYWJsZTpcblx0ICogIFwiaC52XCI6XHRob3Jpem9udGFsIC4gdmVydGljYWwgc2xpZGUgbnVtYmVyIChkZWZhdWx0KVxuXHQgKiAgXCJoL3ZcIjpcdGhvcml6b250YWwgLyB2ZXJ0aWNhbCBzbGlkZSBudW1iZXJcblx0ICogICAgXCJjXCI6XHRmbGF0dGVuZWQgc2xpZGUgbnVtYmVyXG5cdCAqICBcImMvdFwiOlx0ZmxhdHRlbmVkIHNsaWRlIG51bWJlciAvIHRvdGFsIHNsaWRlc1xuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlU2xpZGVOdW1iZXIoKSB7XG5cblx0XHQvLyBVcGRhdGUgc2xpZGUgbnVtYmVyIGlmIGVuYWJsZWRcblx0XHRpZiggY29uZmlnLnNsaWRlTnVtYmVyICYmIGRvbS5zbGlkZU51bWJlciApIHtcblxuXHRcdFx0dmFyIHZhbHVlID0gW107XG5cdFx0XHR2YXIgZm9ybWF0ID0gJ2gudic7XG5cblx0XHRcdC8vIENoZWNrIGlmIGEgY3VzdG9tIG51bWJlciBmb3JtYXQgaXMgYXZhaWxhYmxlXG5cdFx0XHRpZiggdHlwZW9mIGNvbmZpZy5zbGlkZU51bWJlciA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHRcdGZvcm1hdCA9IGNvbmZpZy5zbGlkZU51bWJlcjtcblx0XHRcdH1cblxuXHRcdFx0c3dpdGNoKCBmb3JtYXQgKSB7XG5cdFx0XHRcdGNhc2UgJ2MnOlxuXHRcdFx0XHRcdHZhbHVlLnB1c2goIGdldFNsaWRlUGFzdENvdW50KCkgKyAxICk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ2MvdCc6XG5cdFx0XHRcdFx0dmFsdWUucHVzaCggZ2V0U2xpZGVQYXN0Q291bnQoKSArIDEsICcvJywgZ2V0VG90YWxTbGlkZXMoKSApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdoL3YnOlxuXHRcdFx0XHRcdHZhbHVlLnB1c2goIGluZGV4aCArIDEgKTtcblx0XHRcdFx0XHRpZiggaXNWZXJ0aWNhbFNsaWRlKCkgKSB2YWx1ZS5wdXNoKCAnLycsIGluZGV4diArIDEgKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHR2YWx1ZS5wdXNoKCBpbmRleGggKyAxICk7XG5cdFx0XHRcdFx0aWYoIGlzVmVydGljYWxTbGlkZSgpICkgdmFsdWUucHVzaCggJy4nLCBpbmRleHYgKyAxICk7XG5cdFx0XHR9XG5cblx0XHRcdGRvbS5zbGlkZU51bWJlci5pbm5lckhUTUwgPSBmb3JtYXRTbGlkZU51bWJlciggdmFsdWVbMF0sIHZhbHVlWzFdLCB2YWx1ZVsyXSApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEFwcGxpZXMgSFRNTCBmb3JtYXR0aW5nIHRvIGEgc2xpZGUgbnVtYmVyIGJlZm9yZSBpdCdzXG5cdCAqIHdyaXR0ZW4gdG8gdGhlIERPTS5cblx0ICpcblx0ICogQHBhcmFtIHtudW1iZXJ9IGEgQ3VycmVudCBzbGlkZVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gZGVsaW1pdGVyIENoYXJhY3RlciB0byBzZXBhcmF0ZSBzbGlkZSBudW1iZXJzXG5cdCAqIEBwYXJhbSB7KG51bWJlcnwqKX0gYiBUb3RhbCBzbGlkZXNcblx0ICogQHJldHVybiB7c3RyaW5nfSBIVE1MIHN0cmluZyBmcmFnbWVudFxuXHQgKi9cblx0ZnVuY3Rpb24gZm9ybWF0U2xpZGVOdW1iZXIoIGEsIGRlbGltaXRlciwgYiApIHtcblxuXHRcdGlmKCB0eXBlb2YgYiA9PT0gJ251bWJlcicgJiYgIWlzTmFOKCBiICkgKSB7XG5cdFx0XHRyZXR1cm4gICc8c3BhbiBjbGFzcz1cInNsaWRlLW51bWJlci1hXCI+JysgYSArJzwvc3Bhbj4nICtcblx0XHRcdFx0XHQnPHNwYW4gY2xhc3M9XCJzbGlkZS1udW1iZXItZGVsaW1pdGVyXCI+JysgZGVsaW1pdGVyICsnPC9zcGFuPicgK1xuXHRcdFx0XHRcdCc8c3BhbiBjbGFzcz1cInNsaWRlLW51bWJlci1iXCI+JysgYiArJzwvc3Bhbj4nO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiAnPHNwYW4gY2xhc3M9XCJzbGlkZS1udW1iZXItYVwiPicrIGEgKyc8L3NwYW4+Jztcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBhbGwgY29udHJvbC9uYXZpZ2F0aW9uIGFycm93cy5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZUNvbnRyb2xzKCkge1xuXG5cdFx0dmFyIHJvdXRlcyA9IGF2YWlsYWJsZVJvdXRlcygpO1xuXHRcdHZhciBmcmFnbWVudHMgPSBhdmFpbGFibGVGcmFnbWVudHMoKTtcblxuXHRcdC8vIFJlbW92ZSB0aGUgJ2VuYWJsZWQnIGNsYXNzIGZyb20gYWxsIGRpcmVjdGlvbnNcblx0XHRkb20uY29udHJvbHNMZWZ0LmNvbmNhdCggZG9tLmNvbnRyb2xzUmlnaHQgKVxuXHRcdFx0XHRcdFx0LmNvbmNhdCggZG9tLmNvbnRyb2xzVXAgKVxuXHRcdFx0XHRcdFx0LmNvbmNhdCggZG9tLmNvbnRyb2xzRG93biApXG5cdFx0XHRcdFx0XHQuY29uY2F0KCBkb20uY29udHJvbHNQcmV2IClcblx0XHRcdFx0XHRcdC5jb25jYXQoIGRvbS5jb250cm9sc05leHQgKS5mb3JFYWNoKCBmdW5jdGlvbiggbm9kZSApIHtcblx0XHRcdG5vZGUuY2xhc3NMaXN0LnJlbW92ZSggJ2VuYWJsZWQnICk7XG5cdFx0XHRub2RlLmNsYXNzTGlzdC5yZW1vdmUoICdmcmFnbWVudGVkJyApO1xuXG5cdFx0XHQvLyBTZXQgJ2Rpc2FibGVkJyBhdHRyaWJ1dGUgb24gYWxsIGRpcmVjdGlvbnNcblx0XHRcdG5vZGUuc2V0QXR0cmlidXRlKCAnZGlzYWJsZWQnLCAnZGlzYWJsZWQnICk7XG5cdFx0fSApO1xuXG5cdFx0Ly8gQWRkIHRoZSAnZW5hYmxlZCcgY2xhc3MgdG8gdGhlIGF2YWlsYWJsZSByb3V0ZXM7IHJlbW92ZSAnZGlzYWJsZWQnIGF0dHJpYnV0ZSB0byBlbmFibGUgYnV0dG9uc1xuXHRcdGlmKCByb3V0ZXMubGVmdCApIGRvbS5jb250cm9sc0xlZnQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZW5hYmxlZCcgKTsgZWwucmVtb3ZlQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7IH0gKTtcblx0XHRpZiggcm91dGVzLnJpZ2h0ICkgZG9tLmNvbnRyb2xzUmlnaHQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZW5hYmxlZCcgKTsgZWwucmVtb3ZlQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7IH0gKTtcblx0XHRpZiggcm91dGVzLnVwICkgZG9tLmNvbnRyb2xzVXAuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZW5hYmxlZCcgKTsgZWwucmVtb3ZlQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7IH0gKTtcblx0XHRpZiggcm91dGVzLmRvd24gKSBkb20uY29udHJvbHNEb3duLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2VuYWJsZWQnICk7IGVsLnJlbW92ZUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApOyB9ICk7XG5cblx0XHQvLyBQcmV2L25leHQgYnV0dG9uc1xuXHRcdGlmKCByb3V0ZXMubGVmdCB8fCByb3V0ZXMudXAgKSBkb20uY29udHJvbHNQcmV2LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2VuYWJsZWQnICk7IGVsLnJlbW92ZUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApOyB9ICk7XG5cdFx0aWYoIHJvdXRlcy5yaWdodCB8fCByb3V0ZXMuZG93biApIGRvbS5jb250cm9sc05leHQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZW5hYmxlZCcgKTsgZWwucmVtb3ZlQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7IH0gKTtcblxuXHRcdC8vIEhpZ2hsaWdodCBmcmFnbWVudCBkaXJlY3Rpb25zXG5cdFx0aWYoIGN1cnJlbnRTbGlkZSApIHtcblxuXHRcdFx0Ly8gQWx3YXlzIGFwcGx5IGZyYWdtZW50IGRlY29yYXRvciB0byBwcmV2L25leHQgYnV0dG9uc1xuXHRcdFx0aWYoIGZyYWdtZW50cy5wcmV2ICkgZG9tLmNvbnRyb2xzUHJldi5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdmcmFnbWVudGVkJywgJ2VuYWJsZWQnICk7IGVsLnJlbW92ZUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApOyB9ICk7XG5cdFx0XHRpZiggZnJhZ21lbnRzLm5leHQgKSBkb20uY29udHJvbHNOZXh0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2ZyYWdtZW50ZWQnLCAnZW5hYmxlZCcgKTsgZWwucmVtb3ZlQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7IH0gKTtcblxuXHRcdFx0Ly8gQXBwbHkgZnJhZ21lbnQgZGVjb3JhdG9ycyB0byBkaXJlY3Rpb25hbCBidXR0b25zIGJhc2VkIG9uXG5cdFx0XHQvLyB3aGF0IHNsaWRlIGF4aXMgdGhleSBhcmUgaW5cblx0XHRcdGlmKCBpc1ZlcnRpY2FsU2xpZGUoIGN1cnJlbnRTbGlkZSApICkge1xuXHRcdFx0XHRpZiggZnJhZ21lbnRzLnByZXYgKSBkb20uY29udHJvbHNVcC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdmcmFnbWVudGVkJywgJ2VuYWJsZWQnICk7IGVsLnJlbW92ZUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApOyB9ICk7XG5cdFx0XHRcdGlmKCBmcmFnbWVudHMubmV4dCApIGRvbS5jb250cm9sc0Rvd24uZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZnJhZ21lbnRlZCcsICdlbmFibGVkJyApOyBlbC5yZW1vdmVBdHRyaWJ1dGUoICdkaXNhYmxlZCcgKTsgfSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGlmKCBmcmFnbWVudHMucHJldiApIGRvbS5jb250cm9sc0xlZnQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZnJhZ21lbnRlZCcsICdlbmFibGVkJyApOyBlbC5yZW1vdmVBdHRyaWJ1dGUoICdkaXNhYmxlZCcgKTsgfSApO1xuXHRcdFx0XHRpZiggZnJhZ21lbnRzLm5leHQgKSBkb20uY29udHJvbHNSaWdodC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdmcmFnbWVudGVkJywgJ2VuYWJsZWQnICk7IGVsLnJlbW92ZUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApOyB9ICk7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBiYWNrZ3JvdW5kIGVsZW1lbnRzIHRvIHJlZmxlY3QgdGhlIGN1cnJlbnRcblx0ICogc2xpZGUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaW5jbHVkZUFsbCBJZiB0cnVlLCB0aGUgYmFja2dyb3VuZHMgb2Zcblx0ICogYWxsIHZlcnRpY2FsIHNsaWRlcyAobm90IGp1c3QgdGhlIHByZXNlbnQpIHdpbGwgYmUgdXBkYXRlZC5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZUJhY2tncm91bmQoIGluY2x1ZGVBbGwgKSB7XG5cblx0XHR2YXIgY3VycmVudEJhY2tncm91bmQgPSBudWxsO1xuXG5cdFx0Ly8gUmV2ZXJzZSBwYXN0L2Z1dHVyZSBjbGFzc2VzIHdoZW4gaW4gUlRMIG1vZGVcblx0XHR2YXIgaG9yaXpvbnRhbFBhc3QgPSBjb25maWcucnRsID8gJ2Z1dHVyZScgOiAncGFzdCcsXG5cdFx0XHRob3Jpem9udGFsRnV0dXJlID0gY29uZmlnLnJ0bCA/ICdwYXN0JyA6ICdmdXR1cmUnO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSBjbGFzc2VzIG9mIGFsbCBiYWNrZ3JvdW5kcyB0byBtYXRjaCB0aGVcblx0XHQvLyBzdGF0ZXMgb2YgdGhlaXIgc2xpZGVzIChwYXN0L3ByZXNlbnQvZnV0dXJlKVxuXHRcdHRvQXJyYXkoIGRvbS5iYWNrZ3JvdW5kLmNoaWxkTm9kZXMgKS5mb3JFYWNoKCBmdW5jdGlvbiggYmFja2dyb3VuZGgsIGggKSB7XG5cblx0XHRcdGJhY2tncm91bmRoLmNsYXNzTGlzdC5yZW1vdmUoICdwYXN0JyApO1xuXHRcdFx0YmFja2dyb3VuZGguY2xhc3NMaXN0LnJlbW92ZSggJ3ByZXNlbnQnICk7XG5cdFx0XHRiYWNrZ3JvdW5kaC5jbGFzc0xpc3QucmVtb3ZlKCAnZnV0dXJlJyApO1xuXG5cdFx0XHRpZiggaCA8IGluZGV4aCApIHtcblx0XHRcdFx0YmFja2dyb3VuZGguY2xhc3NMaXN0LmFkZCggaG9yaXpvbnRhbFBhc3QgKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKCBoID4gaW5kZXhoICkge1xuXHRcdFx0XHRiYWNrZ3JvdW5kaC5jbGFzc0xpc3QuYWRkKCBob3Jpem9udGFsRnV0dXJlICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0YmFja2dyb3VuZGguY2xhc3NMaXN0LmFkZCggJ3ByZXNlbnQnICk7XG5cblx0XHRcdFx0Ly8gU3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgYmFja2dyb3VuZCBlbGVtZW50XG5cdFx0XHRcdGN1cnJlbnRCYWNrZ3JvdW5kID0gYmFja2dyb3VuZGg7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCBpbmNsdWRlQWxsIHx8IGggPT09IGluZGV4aCApIHtcblx0XHRcdFx0dG9BcnJheSggYmFja2dyb3VuZGgucXVlcnlTZWxlY3RvckFsbCggJy5zbGlkZS1iYWNrZ3JvdW5kJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGJhY2tncm91bmR2LCB2ICkge1xuXG5cdFx0XHRcdFx0YmFja2dyb3VuZHYuY2xhc3NMaXN0LnJlbW92ZSggJ3Bhc3QnICk7XG5cdFx0XHRcdFx0YmFja2dyb3VuZHYuY2xhc3NMaXN0LnJlbW92ZSggJ3ByZXNlbnQnICk7XG5cdFx0XHRcdFx0YmFja2dyb3VuZHYuY2xhc3NMaXN0LnJlbW92ZSggJ2Z1dHVyZScgKTtcblxuXHRcdFx0XHRcdGlmKCB2IDwgaW5kZXh2ICkge1xuXHRcdFx0XHRcdFx0YmFja2dyb3VuZHYuY2xhc3NMaXN0LmFkZCggJ3Bhc3QnICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKCB2ID4gaW5kZXh2ICkge1xuXHRcdFx0XHRcdFx0YmFja2dyb3VuZHYuY2xhc3NMaXN0LmFkZCggJ2Z1dHVyZScgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kdi5jbGFzc0xpc3QuYWRkKCAncHJlc2VudCcgKTtcblxuXHRcdFx0XHRcdFx0Ly8gT25seSBpZiB0aGlzIGlzIHRoZSBwcmVzZW50IGhvcml6b250YWwgYW5kIHZlcnRpY2FsIHNsaWRlXG5cdFx0XHRcdFx0XHRpZiggaCA9PT0gaW5kZXhoICkgY3VycmVudEJhY2tncm91bmQgPSBiYWNrZ3JvdW5kdjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXG5cdFx0fSApO1xuXG5cdFx0Ly8gU3RvcCBjb250ZW50IGluc2lkZSBvZiBwcmV2aW91cyBiYWNrZ3JvdW5kc1xuXHRcdGlmKCBwcmV2aW91c0JhY2tncm91bmQgKSB7XG5cblx0XHRcdHN0b3BFbWJlZGRlZENvbnRlbnQoIHByZXZpb3VzQmFja2dyb3VuZCApO1xuXG5cdFx0fVxuXG5cdFx0Ly8gU3RhcnQgY29udGVudCBpbiB0aGUgY3VycmVudCBiYWNrZ3JvdW5kXG5cdFx0aWYoIGN1cnJlbnRCYWNrZ3JvdW5kICkge1xuXG5cdFx0XHRzdGFydEVtYmVkZGVkQ29udGVudCggY3VycmVudEJhY2tncm91bmQgKTtcblxuXHRcdFx0dmFyIGJhY2tncm91bmRJbWFnZVVSTCA9IGN1cnJlbnRCYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRJbWFnZSB8fCAnJztcblxuXHRcdFx0Ly8gUmVzdGFydCBHSUZzIChkb2Vzbid0IHdvcmsgaW4gRmlyZWZveClcblx0XHRcdGlmKCAvXFwuZ2lmL2kudGVzdCggYmFja2dyb3VuZEltYWdlVVJMICkgKSB7XG5cdFx0XHRcdGN1cnJlbnRCYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICcnO1xuXHRcdFx0XHR3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSggY3VycmVudEJhY2tncm91bmQgKS5vcGFjaXR5O1xuXHRcdFx0XHRjdXJyZW50QmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBiYWNrZ3JvdW5kSW1hZ2VVUkw7XG5cdFx0XHR9XG5cblx0XHRcdC8vIERvbid0IHRyYW5zaXRpb24gYmV0d2VlbiBpZGVudGljYWwgYmFja2dyb3VuZHMuIFRoaXNcblx0XHRcdC8vIHByZXZlbnRzIHVud2FudGVkIGZsaWNrZXIuXG5cdFx0XHR2YXIgcHJldmlvdXNCYWNrZ3JvdW5kSGFzaCA9IHByZXZpb3VzQmFja2dyb3VuZCA/IHByZXZpb3VzQmFja2dyb3VuZC5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtaGFzaCcgKSA6IG51bGw7XG5cdFx0XHR2YXIgY3VycmVudEJhY2tncm91bmRIYXNoID0gY3VycmVudEJhY2tncm91bmQuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWhhc2gnICk7XG5cdFx0XHRpZiggY3VycmVudEJhY2tncm91bmRIYXNoICYmIGN1cnJlbnRCYWNrZ3JvdW5kSGFzaCA9PT0gcHJldmlvdXNCYWNrZ3JvdW5kSGFzaCAmJiBjdXJyZW50QmFja2dyb3VuZCAhPT0gcHJldmlvdXNCYWNrZ3JvdW5kICkge1xuXHRcdFx0XHRkb20uYmFja2dyb3VuZC5jbGFzc0xpc3QuYWRkKCAnbm8tdHJhbnNpdGlvbicgKTtcblx0XHRcdH1cblxuXHRcdFx0cHJldmlvdXNCYWNrZ3JvdW5kID0gY3VycmVudEJhY2tncm91bmQ7XG5cblx0XHR9XG5cblx0XHQvLyBJZiB0aGVyZSdzIGEgYmFja2dyb3VuZCBicmlnaHRuZXNzIGZsYWcgZm9yIHRoaXMgc2xpZGUsXG5cdFx0Ly8gYnViYmxlIGl0IHRvIHRoZSAucmV2ZWFsIGNvbnRhaW5lclxuXHRcdGlmKCBjdXJyZW50U2xpZGUgKSB7XG5cdFx0XHRbICdoYXMtbGlnaHQtYmFja2dyb3VuZCcsICdoYXMtZGFyay1iYWNrZ3JvdW5kJyBdLmZvckVhY2goIGZ1bmN0aW9uKCBjbGFzc1RvQnViYmxlICkge1xuXHRcdFx0XHRpZiggY3VycmVudFNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggY2xhc3NUb0J1YmJsZSApICkge1xuXHRcdFx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoIGNsYXNzVG9CdWJibGUgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCBjbGFzc1RvQnViYmxlICk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHQvLyBBbGxvdyB0aGUgZmlyc3QgYmFja2dyb3VuZCB0byBhcHBseSB3aXRob3V0IHRyYW5zaXRpb25cblx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcblx0XHRcdGRvbS5iYWNrZ3JvdW5kLmNsYXNzTGlzdC5yZW1vdmUoICduby10cmFuc2l0aW9uJyApO1xuXHRcdH0sIDEgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBwYXJhbGxheCBiYWNrZ3JvdW5kIGJhc2VkXG5cdCAqIG9uIHRoZSBjdXJyZW50IHNsaWRlIGluZGV4LlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlUGFyYWxsYXgoKSB7XG5cblx0XHRpZiggY29uZmlnLnBhcmFsbGF4QmFja2dyb3VuZEltYWdlICkge1xuXG5cdFx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlcyA9IGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICksXG5cdFx0XHRcdHZlcnRpY2FsU2xpZGVzID0gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggVkVSVElDQUxfU0xJREVTX1NFTEVDVE9SICk7XG5cblx0XHRcdHZhciBiYWNrZ3JvdW5kU2l6ZSA9IGRvbS5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRTaXplLnNwbGl0KCAnICcgKSxcblx0XHRcdFx0YmFja2dyb3VuZFdpZHRoLCBiYWNrZ3JvdW5kSGVpZ2h0O1xuXG5cdFx0XHRpZiggYmFja2dyb3VuZFNpemUubGVuZ3RoID09PSAxICkge1xuXHRcdFx0XHRiYWNrZ3JvdW5kV2lkdGggPSBiYWNrZ3JvdW5kSGVpZ2h0ID0gcGFyc2VJbnQoIGJhY2tncm91bmRTaXplWzBdLCAxMCApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGJhY2tncm91bmRXaWR0aCA9IHBhcnNlSW50KCBiYWNrZ3JvdW5kU2l6ZVswXSwgMTAgKTtcblx0XHRcdFx0YmFja2dyb3VuZEhlaWdodCA9IHBhcnNlSW50KCBiYWNrZ3JvdW5kU2l6ZVsxXSwgMTAgKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHNsaWRlV2lkdGggPSBkb20uYmFja2dyb3VuZC5vZmZzZXRXaWR0aCxcblx0XHRcdFx0aG9yaXpvbnRhbFNsaWRlQ291bnQgPSBob3Jpem9udGFsU2xpZGVzLmxlbmd0aCxcblx0XHRcdFx0aG9yaXpvbnRhbE9mZnNldE11bHRpcGxpZXIsXG5cdFx0XHRcdGhvcml6b250YWxPZmZzZXQ7XG5cblx0XHRcdGlmKCB0eXBlb2YgY29uZmlnLnBhcmFsbGF4QmFja2dyb3VuZEhvcml6b250YWwgPT09ICdudW1iZXInICkge1xuXHRcdFx0XHRob3Jpem9udGFsT2Zmc2V0TXVsdGlwbGllciA9IGNvbmZpZy5wYXJhbGxheEJhY2tncm91bmRIb3Jpem9udGFsO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGhvcml6b250YWxPZmZzZXRNdWx0aXBsaWVyID0gaG9yaXpvbnRhbFNsaWRlQ291bnQgPiAxID8gKCBiYWNrZ3JvdW5kV2lkdGggLSBzbGlkZVdpZHRoICkgLyAoIGhvcml6b250YWxTbGlkZUNvdW50LTEgKSA6IDA7XG5cdFx0XHR9XG5cblx0XHRcdGhvcml6b250YWxPZmZzZXQgPSBob3Jpem9udGFsT2Zmc2V0TXVsdGlwbGllciAqIGluZGV4aCAqIC0xO1xuXG5cdFx0XHR2YXIgc2xpZGVIZWlnaHQgPSBkb20uYmFja2dyb3VuZC5vZmZzZXRIZWlnaHQsXG5cdFx0XHRcdHZlcnRpY2FsU2xpZGVDb3VudCA9IHZlcnRpY2FsU2xpZGVzLmxlbmd0aCxcblx0XHRcdFx0dmVydGljYWxPZmZzZXRNdWx0aXBsaWVyLFxuXHRcdFx0XHR2ZXJ0aWNhbE9mZnNldDtcblxuXHRcdFx0aWYoIHR5cGVvZiBjb25maWcucGFyYWxsYXhCYWNrZ3JvdW5kVmVydGljYWwgPT09ICdudW1iZXInICkge1xuXHRcdFx0XHR2ZXJ0aWNhbE9mZnNldE11bHRpcGxpZXIgPSBjb25maWcucGFyYWxsYXhCYWNrZ3JvdW5kVmVydGljYWw7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dmVydGljYWxPZmZzZXRNdWx0aXBsaWVyID0gKCBiYWNrZ3JvdW5kSGVpZ2h0IC0gc2xpZGVIZWlnaHQgKSAvICggdmVydGljYWxTbGlkZUNvdW50LTEgKTtcblx0XHRcdH1cblxuXHRcdFx0dmVydGljYWxPZmZzZXQgPSB2ZXJ0aWNhbFNsaWRlQ291bnQgPiAwID8gIHZlcnRpY2FsT2Zmc2V0TXVsdGlwbGllciAqIGluZGV4diA6IDA7XG5cblx0XHRcdGRvbS5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9IGhvcml6b250YWxPZmZzZXQgKyAncHggJyArIC12ZXJ0aWNhbE9mZnNldCArICdweCc7XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsZWQgd2hlbiB0aGUgZ2l2ZW4gc2xpZGUgaXMgd2l0aGluIHRoZSBjb25maWd1cmVkIHZpZXdcblx0ICogZGlzdGFuY2UuIFNob3dzIHRoZSBzbGlkZSBlbGVtZW50IGFuZCBsb2FkcyBhbnkgY29udGVudFxuXHQgKiB0aGF0IGlzIHNldCB0byBsb2FkIGxhemlseSAoZGF0YS1zcmMpLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBzbGlkZSBTbGlkZSB0byBzaG93XG5cdCAqL1xuXHQvKipcblx0ICogQ2FsbGVkIHdoZW4gdGhlIGdpdmVuIHNsaWRlIGlzIHdpdGhpbiB0aGUgY29uZmlndXJlZCB2aWV3XG5cdCAqIGRpc3RhbmNlLiBTaG93cyB0aGUgc2xpZGUgZWxlbWVudCBhbmQgbG9hZHMgYW55IGNvbnRlbnRcblx0ICogdGhhdCBpcyBzZXQgdG8gbG9hZCBsYXppbHkgKGRhdGEtc3JjKS5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gc2xpZGUgU2xpZGUgdG8gc2hvd1xuXHQgKi9cblx0ZnVuY3Rpb24gc2hvd1NsaWRlKCBzbGlkZSApIHtcblxuXHRcdC8vIFNob3cgdGhlIHNsaWRlIGVsZW1lbnRcblx0XHRzbGlkZS5zdHlsZS5kaXNwbGF5ID0gY29uZmlnLmRpc3BsYXk7XG5cblx0XHQvLyBNZWRpYSBlbGVtZW50cyB3aXRoIGRhdGEtc3JjIGF0dHJpYnV0ZXNcblx0XHR0b0FycmF5KCBzbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnaW1nW2RhdGEtc3JjXSwgdmlkZW9bZGF0YS1zcmNdLCBhdWRpb1tkYXRhLXNyY10nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKCAnc3JjJywgZWxlbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLXNyYycgKSApO1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoICdkYXRhLXNyYycgKTtcblx0XHR9ICk7XG5cblx0XHQvLyBNZWRpYSBlbGVtZW50cyB3aXRoIDxzb3VyY2U+IGNoaWxkcmVuXG5cdFx0dG9BcnJheSggc2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3ZpZGVvLCBhdWRpbycgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBtZWRpYSApIHtcblx0XHRcdHZhciBzb3VyY2VzID0gMDtcblxuXHRcdFx0dG9BcnJheSggbWVkaWEucXVlcnlTZWxlY3RvckFsbCggJ3NvdXJjZVtkYXRhLXNyY10nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggc291cmNlICkge1xuXHRcdFx0XHRzb3VyY2Uuc2V0QXR0cmlidXRlKCAnc3JjJywgc291cmNlLmdldEF0dHJpYnV0ZSggJ2RhdGEtc3JjJyApICk7XG5cdFx0XHRcdHNvdXJjZS5yZW1vdmVBdHRyaWJ1dGUoICdkYXRhLXNyYycgKTtcblx0XHRcdFx0c291cmNlcyArPSAxO1xuXHRcdFx0fSApO1xuXG5cdFx0XHQvLyBJZiB3ZSByZXdyb3RlIHNvdXJjZXMgZm9yIHRoaXMgdmlkZW8vYXVkaW8gZWxlbWVudCwgd2UgbmVlZFxuXHRcdFx0Ly8gdG8gbWFudWFsbHkgdGVsbCBpdCB0byBsb2FkIGZyb20gaXRzIG5ldyBvcmlnaW5cblx0XHRcdGlmKCBzb3VyY2VzID4gMCApIHtcblx0XHRcdFx0bWVkaWEubG9hZCgpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXG5cdFx0Ly8gU2hvdyB0aGUgY29ycmVzcG9uZGluZyBiYWNrZ3JvdW5kIGVsZW1lbnRcblx0XHR2YXIgaW5kaWNlcyA9IGdldEluZGljZXMoIHNsaWRlICk7XG5cdFx0dmFyIGJhY2tncm91bmQgPSBnZXRTbGlkZUJhY2tncm91bmQoIGluZGljZXMuaCwgaW5kaWNlcy52ICk7XG5cdFx0aWYoIGJhY2tncm91bmQgKSB7XG5cdFx0XHRiYWNrZ3JvdW5kLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG5cdFx0XHQvLyBJZiB0aGUgYmFja2dyb3VuZCBjb250YWlucyBtZWRpYSwgbG9hZCBpdFxuXHRcdFx0aWYoIGJhY2tncm91bmQuaGFzQXR0cmlidXRlKCAnZGF0YS1sb2FkZWQnICkgPT09IGZhbHNlICkge1xuXHRcdFx0XHRiYWNrZ3JvdW5kLnNldEF0dHJpYnV0ZSggJ2RhdGEtbG9hZGVkJywgJ3RydWUnICk7XG5cblx0XHRcdFx0dmFyIGJhY2tncm91bmRJbWFnZSA9IHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC1pbWFnZScgKSxcblx0XHRcdFx0XHRiYWNrZ3JvdW5kVmlkZW8gPSBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtdmlkZW8nICksXG5cdFx0XHRcdFx0YmFja2dyb3VuZFZpZGVvTG9vcCA9IHNsaWRlLmhhc0F0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC12aWRlby1sb29wJyApLFxuXHRcdFx0XHRcdGJhY2tncm91bmRWaWRlb011dGVkID0gc2xpZGUuaGFzQXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXZpZGVvLW11dGVkJyApLFxuXHRcdFx0XHRcdGJhY2tncm91bmRJZnJhbWUgPSBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtaWZyYW1lJyApO1xuXG5cdFx0XHRcdC8vIEltYWdlc1xuXHRcdFx0XHRpZiggYmFja2dyb3VuZEltYWdlICkge1xuXHRcdFx0XHRcdGJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gJ3VybCgnKyBiYWNrZ3JvdW5kSW1hZ2UgKycpJztcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBWaWRlb3Ncblx0XHRcdFx0ZWxzZSBpZiAoIGJhY2tncm91bmRWaWRlbyAmJiAhaXNTcGVha2VyTm90ZXMoKSApIHtcblx0XHRcdFx0XHR2YXIgdmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAndmlkZW8nICk7XG5cblx0XHRcdFx0XHRpZiggYmFja2dyb3VuZFZpZGVvTG9vcCApIHtcblx0XHRcdFx0XHRcdHZpZGVvLnNldEF0dHJpYnV0ZSggJ2xvb3AnLCAnJyApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKCBiYWNrZ3JvdW5kVmlkZW9NdXRlZCApIHtcblx0XHRcdFx0XHRcdHZpZGVvLm11dGVkID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBJbmxpbmUgdmlkZW8gcGxheWJhY2sgd29ya3MgKGF0IGxlYXN0IGluIE1vYmlsZSBTYWZhcmkpIGFzXG5cdFx0XHRcdFx0Ly8gbG9uZyBhcyB0aGUgdmlkZW8gaXMgbXV0ZWQgYW5kIHRoZSBgcGxheXNpbmxpbmVgIGF0dHJpYnV0ZSBpc1xuXHRcdFx0XHRcdC8vIHByZXNlbnRcblx0XHRcdFx0XHRpZiggaXNNb2JpbGVEZXZpY2UgKSB7XG5cdFx0XHRcdFx0XHR2aWRlby5tdXRlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHR2aWRlby5hdXRvcGxheSA9IHRydWU7XG5cdFx0XHRcdFx0XHR2aWRlby5zZXRBdHRyaWJ1dGUoICdwbGF5c2lubGluZScsICcnICk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gU3VwcG9ydCBjb21tYSBzZXBhcmF0ZWQgbGlzdHMgb2YgdmlkZW8gc291cmNlc1xuXHRcdFx0XHRcdGJhY2tncm91bmRWaWRlby5zcGxpdCggJywnICkuZm9yRWFjaCggZnVuY3Rpb24oIHNvdXJjZSApIHtcblx0XHRcdFx0XHRcdHZpZGVvLmlubmVySFRNTCArPSAnPHNvdXJjZSBzcmM9XCInKyBzb3VyY2UgKydcIj4nO1xuXHRcdFx0XHRcdH0gKTtcblxuXHRcdFx0XHRcdGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoIHZpZGVvICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gSWZyYW1lc1xuXHRcdFx0XHRlbHNlIGlmKCBiYWNrZ3JvdW5kSWZyYW1lICkge1xuXHRcdFx0XHRcdHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaWZyYW1lJyApO1xuXHRcdFx0XHRcdGlmcmFtZS5zZXRBdHRyaWJ1dGUoICdhbGxvd2Z1bGxzY3JlZW4nLCAnJyApO1xuXHRcdFx0XHRcdGlmcmFtZS5zZXRBdHRyaWJ1dGUoICdtb3phbGxvd2Z1bGxzY3JlZW4nLCAnJyApO1xuXHRcdFx0XHRcdGlmcmFtZS5zZXRBdHRyaWJ1dGUoICd3ZWJraXRhbGxvd2Z1bGxzY3JlZW4nLCAnJyApO1xuXG5cdFx0XHRcdFx0Ly8gT25seSBsb2FkIGF1dG9wbGF5aW5nIGNvbnRlbnQgd2hlbiB0aGUgc2xpZGUgaXMgc2hvd24gdG9cblx0XHRcdFx0XHQvLyBhdm9pZCBoYXZpbmcgaXQgcGxheSBpbiB0aGUgYmFja2dyb3VuZFxuXHRcdFx0XHRcdGlmKCAvYXV0b3BsYXk9KDF8dHJ1ZXx5ZXMpL2dpLnRlc3QoIGJhY2tncm91bmRJZnJhbWUgKSApIHtcblx0XHRcdFx0XHRcdGlmcmFtZS5zZXRBdHRyaWJ1dGUoICdkYXRhLXNyYycsIGJhY2tncm91bmRJZnJhbWUgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRpZnJhbWUuc2V0QXR0cmlidXRlKCAnc3JjJywgYmFja2dyb3VuZElmcmFtZSApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmcmFtZS5zdHlsZS53aWR0aCAgPSAnMTAwJSc7XG5cdFx0XHRcdFx0aWZyYW1lLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRcdFx0XHRpZnJhbWUuc3R5bGUubWF4SGVpZ2h0ID0gJzEwMCUnO1xuXHRcdFx0XHRcdGlmcmFtZS5zdHlsZS5tYXhXaWR0aCA9ICcxMDAlJztcblxuXHRcdFx0XHRcdGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoIGlmcmFtZSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsZWQgd2hlbiB0aGUgZ2l2ZW4gc2xpZGUgaXMgbW92ZWQgb3V0c2lkZSBvZiB0aGVcblx0ICogY29uZmlndXJlZCB2aWV3IGRpc3RhbmNlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBzbGlkZVxuXHQgKi9cblx0ZnVuY3Rpb24gaGlkZVNsaWRlKCBzbGlkZSApIHtcblxuXHRcdC8vIEhpZGUgdGhlIHNsaWRlIGVsZW1lbnRcblx0XHRzbGlkZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG5cdFx0Ly8gSGlkZSB0aGUgY29ycmVzcG9uZGluZyBiYWNrZ3JvdW5kIGVsZW1lbnRcblx0XHR2YXIgaW5kaWNlcyA9IGdldEluZGljZXMoIHNsaWRlICk7XG5cdFx0dmFyIGJhY2tncm91bmQgPSBnZXRTbGlkZUJhY2tncm91bmQoIGluZGljZXMuaCwgaW5kaWNlcy52ICk7XG5cdFx0aWYoIGJhY2tncm91bmQgKSB7XG5cdFx0XHRiYWNrZ3JvdW5kLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIHdoYXQgYXZhaWxhYmxlIHJvdXRlcyB0aGVyZSBhcmUgZm9yIG5hdmlnYXRpb24uXG5cdCAqXG5cdCAqIEByZXR1cm4ge3tsZWZ0OiBib29sZWFuLCByaWdodDogYm9vbGVhbiwgdXA6IGJvb2xlYW4sIGRvd246IGJvb2xlYW59fVxuXHQgKi9cblx0ZnVuY3Rpb24gYXZhaWxhYmxlUm91dGVzKCkge1xuXG5cdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApLFxuXHRcdFx0dmVydGljYWxTbGlkZXMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBWRVJUSUNBTF9TTElERVNfU0VMRUNUT1IgKTtcblxuXHRcdHZhciByb3V0ZXMgPSB7XG5cdFx0XHRsZWZ0OiBpbmRleGggPiAwIHx8IGNvbmZpZy5sb29wLFxuXHRcdFx0cmlnaHQ6IGluZGV4aCA8IGhvcml6b250YWxTbGlkZXMubGVuZ3RoIC0gMSB8fCBjb25maWcubG9vcCxcblx0XHRcdHVwOiBpbmRleHYgPiAwLFxuXHRcdFx0ZG93bjogaW5kZXh2IDwgdmVydGljYWxTbGlkZXMubGVuZ3RoIC0gMVxuXHRcdH07XG5cblx0XHQvLyByZXZlcnNlIGhvcml6b250YWwgY29udHJvbHMgZm9yIHJ0bFxuXHRcdGlmKCBjb25maWcucnRsICkge1xuXHRcdFx0dmFyIGxlZnQgPSByb3V0ZXMubGVmdDtcblx0XHRcdHJvdXRlcy5sZWZ0ID0gcm91dGVzLnJpZ2h0O1xuXHRcdFx0cm91dGVzLnJpZ2h0ID0gbGVmdDtcblx0XHR9XG5cblx0XHRyZXR1cm4gcm91dGVzO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBhbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgYXZhaWxhYmxlIGZyYWdtZW50XG5cdCAqIGRpcmVjdGlvbnMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge3twcmV2OiBib29sZWFuLCBuZXh0OiBib29sZWFufX1cblx0ICovXG5cdGZ1bmN0aW9uIGF2YWlsYWJsZUZyYWdtZW50cygpIHtcblxuXHRcdGlmKCBjdXJyZW50U2xpZGUgJiYgY29uZmlnLmZyYWdtZW50cyApIHtcblx0XHRcdHZhciBmcmFnbWVudHMgPSBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKTtcblx0XHRcdHZhciBoaWRkZW5GcmFnbWVudHMgPSBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudDpub3QoLnZpc2libGUpJyApO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRwcmV2OiBmcmFnbWVudHMubGVuZ3RoIC0gaGlkZGVuRnJhZ21lbnRzLmxlbmd0aCA+IDAsXG5cdFx0XHRcdG5leHQ6ICEhaGlkZGVuRnJhZ21lbnRzLmxlbmd0aFxuXHRcdFx0fTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4geyBwcmV2OiBmYWxzZSwgbmV4dDogZmFsc2UgfTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFbmZvcmNlcyBvcmlnaW4tc3BlY2lmaWMgZm9ybWF0IHJ1bGVzIGZvciBlbWJlZGRlZCBtZWRpYS5cblx0ICovXG5cdGZ1bmN0aW9uIGZvcm1hdEVtYmVkZGVkQ29udGVudCgpIHtcblxuXHRcdHZhciBfYXBwZW5kUGFyYW1Ub0lmcmFtZVNvdXJjZSA9IGZ1bmN0aW9uKCBzb3VyY2VBdHRyaWJ1dGUsIHNvdXJjZVVSTCwgcGFyYW0gKSB7XG5cdFx0XHR0b0FycmF5KCBkb20uc2xpZGVzLnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWVbJysgc291cmNlQXR0cmlidXRlICsnKj1cIicrIHNvdXJjZVVSTCArJ1wiXScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0dmFyIHNyYyA9IGVsLmdldEF0dHJpYnV0ZSggc291cmNlQXR0cmlidXRlICk7XG5cdFx0XHRcdGlmKCBzcmMgJiYgc3JjLmluZGV4T2YoIHBhcmFtICkgPT09IC0xICkge1xuXHRcdFx0XHRcdGVsLnNldEF0dHJpYnV0ZSggc291cmNlQXR0cmlidXRlLCBzcmMgKyAoICEvXFw/Ly50ZXN0KCBzcmMgKSA/ICc/JyA6ICcmJyApICsgcGFyYW0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdC8vIFlvdVR1YmUgZnJhbWVzIG11c3QgaW5jbHVkZSBcIj9lbmFibGVqc2FwaT0xXCJcblx0XHRfYXBwZW5kUGFyYW1Ub0lmcmFtZVNvdXJjZSggJ3NyYycsICd5b3V0dWJlLmNvbS9lbWJlZC8nLCAnZW5hYmxlanNhcGk9MScgKTtcblx0XHRfYXBwZW5kUGFyYW1Ub0lmcmFtZVNvdXJjZSggJ2RhdGEtc3JjJywgJ3lvdXR1YmUuY29tL2VtYmVkLycsICdlbmFibGVqc2FwaT0xJyApO1xuXG5cdFx0Ly8gVmltZW8gZnJhbWVzIG11c3QgaW5jbHVkZSBcIj9hcGk9MVwiXG5cdFx0X2FwcGVuZFBhcmFtVG9JZnJhbWVTb3VyY2UoICdzcmMnLCAncGxheWVyLnZpbWVvLmNvbS8nLCAnYXBpPTEnICk7XG5cdFx0X2FwcGVuZFBhcmFtVG9JZnJhbWVTb3VyY2UoICdkYXRhLXNyYycsICdwbGF5ZXIudmltZW8uY29tLycsICdhcGk9MScgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFN0YXJ0IHBsYXliYWNrIG9mIGFueSBlbWJlZGRlZCBjb250ZW50IGluc2lkZSBvZlxuXHQgKiB0aGUgZ2l2ZW4gZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuXHQgKi9cblx0ZnVuY3Rpb24gc3RhcnRFbWJlZGRlZENvbnRlbnQoIGVsZW1lbnQgKSB7XG5cblx0XHRpZiggZWxlbWVudCAmJiAhaXNTcGVha2VyTm90ZXMoKSApIHtcblxuXHRcdFx0Ly8gUmVzdGFydCBHSUZzXG5cdFx0XHR0b0FycmF5KCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICdpbWdbc3JjJD1cIi5naWZcIl0nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdC8vIFNldHRpbmcgdGhlIHNhbWUgdW5jaGFuZ2VkIHNvdXJjZSBsaWtlIHRoaXMgd2FzIGNvbmZpcm1lZFxuXHRcdFx0XHQvLyB0byB3b3JrIGluIENocm9tZSwgRkYgJiBTYWZhcmlcblx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKCAnc3JjJywgZWwuZ2V0QXR0cmlidXRlKCAnc3JjJyApICk7XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIEhUTUw1IG1lZGlhIGVsZW1lbnRzXG5cdFx0XHR0b0FycmF5KCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICd2aWRlbywgYXVkaW8nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdGlmKCBjbG9zZXN0UGFyZW50KCBlbCwgJy5mcmFnbWVudCcgKSAmJiAhY2xvc2VzdFBhcmVudCggZWwsICcuZnJhZ21lbnQudmlzaWJsZScgKSApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBQcmVmZXIgYW4gZXhwbGljaXQgZ2xvYmFsIGF1dG9wbGF5IHNldHRpbmdcblx0XHRcdFx0dmFyIGF1dG9wbGF5ID0gY29uZmlnLmF1dG9QbGF5TWVkaWE7XG5cblx0XHRcdFx0Ly8gSWYgbm8gZ2xvYmFsIHNldHRpbmcgaXMgYXZhaWxhYmxlLCBmYWxsIGJhY2sgb24gdGhlIGVsZW1lbnQnc1xuXHRcdFx0XHQvLyBvd24gYXV0b3BsYXkgc2V0dGluZ1xuXHRcdFx0XHRpZiggdHlwZW9mIGF1dG9wbGF5ICE9PSAnYm9vbGVhbicgKSB7XG5cdFx0XHRcdFx0YXV0b3BsYXkgPSBlbC5oYXNBdHRyaWJ1dGUoICdkYXRhLWF1dG9wbGF5JyApIHx8ICEhY2xvc2VzdFBhcmVudCggZWwsICcuc2xpZGUtYmFja2dyb3VuZCcgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCBhdXRvcGxheSAmJiB0eXBlb2YgZWwucGxheSA9PT0gJ2Z1bmN0aW9uJyApIHtcblxuXHRcdFx0XHRcdGlmKCBlbC5yZWFkeVN0YXRlID4gMSApIHtcblx0XHRcdFx0XHRcdHN0YXJ0RW1iZWRkZWRNZWRpYSggeyB0YXJnZXQ6IGVsIH0gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRlbC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbG9hZGVkZGF0YScsIHN0YXJ0RW1iZWRkZWRNZWRpYSApOyAvLyByZW1vdmUgZmlyc3QgdG8gYXZvaWQgZHVwZXNcblx0XHRcdFx0XHRcdGVsLmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkZWRkYXRhJywgc3RhcnRFbWJlZGRlZE1lZGlhICk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gTm9ybWFsIGlmcmFtZXNcblx0XHRcdHRvQXJyYXkoIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJ2lmcmFtZVtzcmNdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRpZiggY2xvc2VzdFBhcmVudCggZWwsICcuZnJhZ21lbnQnICkgJiYgIWNsb3Nlc3RQYXJlbnQoIGVsLCAnLmZyYWdtZW50LnZpc2libGUnICkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c3RhcnRFbWJlZGRlZElmcmFtZSggeyB0YXJnZXQ6IGVsIH0gKTtcblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gTGF6eSBsb2FkaW5nIGlmcmFtZXNcblx0XHRcdHRvQXJyYXkoIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJ2lmcmFtZVtkYXRhLXNyY10nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdGlmKCBjbG9zZXN0UGFyZW50KCBlbCwgJy5mcmFnbWVudCcgKSAmJiAhY2xvc2VzdFBhcmVudCggZWwsICcuZnJhZ21lbnQudmlzaWJsZScgKSApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiggZWwuZ2V0QXR0cmlidXRlKCAnc3JjJyApICE9PSBlbC5nZXRBdHRyaWJ1dGUoICdkYXRhLXNyYycgKSApIHtcblx0XHRcdFx0XHRlbC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbG9hZCcsIHN0YXJ0RW1iZWRkZWRJZnJhbWUgKTsgLy8gcmVtb3ZlIGZpcnN0IHRvIGF2b2lkIGR1cGVzXG5cdFx0XHRcdFx0ZWwuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBzdGFydEVtYmVkZGVkSWZyYW1lICk7XG5cdFx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKCAnc3JjJywgZWwuZ2V0QXR0cmlidXRlKCAnZGF0YS1zcmMnICkgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogU3RhcnRzIHBsYXlpbmcgYW4gZW1iZWRkZWQgdmlkZW8vYXVkaW8gZWxlbWVudCBhZnRlclxuXHQgKiBpdCBoYXMgZmluaXNoZWQgbG9hZGluZy5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBzdGFydEVtYmVkZGVkTWVkaWEoIGV2ZW50ICkge1xuXG5cdFx0dmFyIGlzQXR0YWNoZWRUb0RPTSA9ICEhY2xvc2VzdFBhcmVudCggZXZlbnQudGFyZ2V0LCAnaHRtbCcgKSxcblx0XHRcdGlzVmlzaWJsZSAgXHRcdD0gISFjbG9zZXN0UGFyZW50KCBldmVudC50YXJnZXQsICcucHJlc2VudCcgKTtcblxuXHRcdGlmKCBpc0F0dGFjaGVkVG9ET00gJiYgaXNWaXNpYmxlICkge1xuXHRcdFx0ZXZlbnQudGFyZ2V0LmN1cnJlbnRUaW1lID0gMDtcblx0XHRcdGV2ZW50LnRhcmdldC5wbGF5KCk7XG5cdFx0fVxuXG5cdFx0ZXZlbnQudGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdsb2FkZWRkYXRhJywgc3RhcnRFbWJlZGRlZE1lZGlhICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBcIlN0YXJ0c1wiIHRoZSBjb250ZW50IG9mIGFuIGVtYmVkZGVkIGlmcmFtZSB1c2luZyB0aGVcblx0ICogcG9zdE1lc3NhZ2UgQVBJLlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcblx0ICovXG5cdGZ1bmN0aW9uIHN0YXJ0RW1iZWRkZWRJZnJhbWUoIGV2ZW50ICkge1xuXG5cdFx0dmFyIGlmcmFtZSA9IGV2ZW50LnRhcmdldDtcblxuXHRcdGlmKCBpZnJhbWUgJiYgaWZyYW1lLmNvbnRlbnRXaW5kb3cgKSB7XG5cblx0XHRcdHZhciBpc0F0dGFjaGVkVG9ET00gPSAhIWNsb3Nlc3RQYXJlbnQoIGV2ZW50LnRhcmdldCwgJ2h0bWwnICksXG5cdFx0XHRcdGlzVmlzaWJsZSAgXHRcdD0gISFjbG9zZXN0UGFyZW50KCBldmVudC50YXJnZXQsICcucHJlc2VudCcgKTtcblxuXHRcdFx0aWYoIGlzQXR0YWNoZWRUb0RPTSAmJiBpc1Zpc2libGUgKSB7XG5cblx0XHRcdFx0Ly8gUHJlZmVyIGFuIGV4cGxpY2l0IGdsb2JhbCBhdXRvcGxheSBzZXR0aW5nXG5cdFx0XHRcdHZhciBhdXRvcGxheSA9IGNvbmZpZy5hdXRvUGxheU1lZGlhO1xuXG5cdFx0XHRcdC8vIElmIG5vIGdsb2JhbCBzZXR0aW5nIGlzIGF2YWlsYWJsZSwgZmFsbCBiYWNrIG9uIHRoZSBlbGVtZW50J3Ncblx0XHRcdFx0Ly8gb3duIGF1dG9wbGF5IHNldHRpbmdcblx0XHRcdFx0aWYoIHR5cGVvZiBhdXRvcGxheSAhPT0gJ2Jvb2xlYW4nICkge1xuXHRcdFx0XHRcdGF1dG9wbGF5ID0gaWZyYW1lLmhhc0F0dHJpYnV0ZSggJ2RhdGEtYXV0b3BsYXknICkgfHwgISFjbG9zZXN0UGFyZW50KCBpZnJhbWUsICcuc2xpZGUtYmFja2dyb3VuZCcgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFlvdVR1YmUgcG9zdE1lc3NhZ2UgQVBJXG5cdFx0XHRcdGlmKCAveW91dHViZVxcLmNvbVxcL2VtYmVkXFwvLy50ZXN0KCBpZnJhbWUuZ2V0QXR0cmlidXRlKCAnc3JjJyApICkgJiYgYXV0b3BsYXkgKSB7XG5cdFx0XHRcdFx0aWZyYW1lLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoICd7XCJldmVudFwiOlwiY29tbWFuZFwiLFwiZnVuY1wiOlwicGxheVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBWaW1lbyBwb3N0TWVzc2FnZSBBUElcblx0XHRcdFx0ZWxzZSBpZiggL3BsYXllclxcLnZpbWVvXFwuY29tXFwvLy50ZXN0KCBpZnJhbWUuZ2V0QXR0cmlidXRlKCAnc3JjJyApICkgJiYgYXV0b3BsYXkgKSB7XG5cdFx0XHRcdFx0aWZyYW1lLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoICd7XCJtZXRob2RcIjpcInBsYXlcIn0nLCAnKicgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBHZW5lcmljIHBvc3RNZXNzYWdlIEFQSVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRpZnJhbWUuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSggJ3NsaWRlOnN0YXJ0JywgJyonICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogU3RvcCBwbGF5YmFjayBvZiBhbnkgZW1iZWRkZWQgY29udGVudCBpbnNpZGUgb2Zcblx0ICogdGhlIHRhcmdldGVkIHNsaWRlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBzdG9wRW1iZWRkZWRDb250ZW50KCBlbGVtZW50ICkge1xuXG5cdFx0aWYoIGVsZW1lbnQgJiYgZWxlbWVudC5wYXJlbnROb2RlICkge1xuXHRcdFx0Ly8gSFRNTDUgbWVkaWEgZWxlbWVudHNcblx0XHRcdHRvQXJyYXkoIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJ3ZpZGVvLCBhdWRpbycgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0aWYoICFlbC5oYXNBdHRyaWJ1dGUoICdkYXRhLWlnbm9yZScgKSAmJiB0eXBlb2YgZWwucGF1c2UgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKCdkYXRhLXBhdXNlZC1ieS1yZXZlYWwnLCAnJyk7XG5cdFx0XHRcdFx0ZWwucGF1c2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXG5cdFx0XHQvLyBHZW5lcmljIHBvc3RNZXNzYWdlIEFQSSBmb3Igbm9uLWxhenkgbG9hZGVkIGlmcmFtZXNcblx0XHRcdHRvQXJyYXkoIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJ2lmcmFtZScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0aWYoIGVsLmNvbnRlbnRXaW5kb3cgKSBlbC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCAnc2xpZGU6c3RvcCcsICcqJyApO1xuXHRcdFx0XHRlbC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbG9hZCcsIHN0YXJ0RW1iZWRkZWRJZnJhbWUgKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBZb3VUdWJlIHBvc3RNZXNzYWdlIEFQSVxuXHRcdFx0dG9BcnJheSggZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnaWZyYW1lW3NyYyo9XCJ5b3V0dWJlLmNvbS9lbWJlZC9cIl0nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdGlmKCAhZWwuaGFzQXR0cmlidXRlKCAnZGF0YS1pZ25vcmUnICkgJiYgZWwuY29udGVudFdpbmRvdyAmJiB0eXBlb2YgZWwuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0XHRlbC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCAne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBhdXNlVmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gVmltZW8gcG9zdE1lc3NhZ2UgQVBJXG5cdFx0XHR0b0FycmF5KCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWVbc3JjKj1cInBsYXllci52aW1lby5jb20vXCJdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRpZiggIWVsLmhhc0F0dHJpYnV0ZSggJ2RhdGEtaWdub3JlJyApICYmIGVsLmNvbnRlbnRXaW5kb3cgJiYgdHlwZW9mIGVsLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRcdFx0ZWwuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSggJ3tcIm1ldGhvZFwiOlwicGF1c2VcIn0nLCAnKicgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIExhenkgbG9hZGluZyBpZnJhbWVzXG5cdFx0XHR0b0FycmF5KCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWVbZGF0YS1zcmNdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHQvLyBPbmx5IHJlbW92aW5nIHRoZSBzcmMgZG9lc24ndCBhY3R1YWxseSB1bmxvYWQgdGhlIGZyYW1lXG5cdFx0XHRcdC8vIGluIGFsbCBicm93c2VycyAoRmlyZWZveCkgc28gd2Ugc2V0IGl0IHRvIGJsYW5rIGZpcnN0XG5cdFx0XHRcdGVsLnNldEF0dHJpYnV0ZSggJ3NyYycsICdhYm91dDpibGFuaycgKTtcblx0XHRcdFx0ZWwucmVtb3ZlQXR0cmlidXRlKCAnc3JjJyApO1xuXHRcdFx0fSApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIG51bWJlciBvZiBwYXN0IHNsaWRlcy4gVGhpcyBjYW4gYmUgdXNlZCBhcyBhIGdsb2JhbFxuXHQgKiBmbGF0dGVuZWQgaW5kZXggZm9yIHNsaWRlcy5cblx0ICpcblx0ICogQHJldHVybiB7bnVtYmVyfSBQYXN0IHNsaWRlIGNvdW50XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRTbGlkZVBhc3RDb3VudCgpIHtcblxuXHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApO1xuXG5cdFx0Ly8gVGhlIG51bWJlciBvZiBwYXN0IHNsaWRlc1xuXHRcdHZhciBwYXN0Q291bnQgPSAwO1xuXG5cdFx0Ly8gU3RlcCB0aHJvdWdoIGFsbCBzbGlkZXMgYW5kIGNvdW50IHRoZSBwYXN0IG9uZXNcblx0XHRtYWluTG9vcDogZm9yKCB2YXIgaSA9IDA7IGkgPCBob3Jpem9udGFsU2xpZGVzLmxlbmd0aDsgaSsrICkge1xuXG5cdFx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlID0gaG9yaXpvbnRhbFNsaWRlc1tpXTtcblx0XHRcdHZhciB2ZXJ0aWNhbFNsaWRlcyA9IHRvQXJyYXkoIGhvcml6b250YWxTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKSApO1xuXG5cdFx0XHRmb3IoIHZhciBqID0gMDsgaiA8IHZlcnRpY2FsU2xpZGVzLmxlbmd0aDsgaisrICkge1xuXG5cdFx0XHRcdC8vIFN0b3AgYXMgc29vbiBhcyB3ZSBhcnJpdmUgYXQgdGhlIHByZXNlbnRcblx0XHRcdFx0aWYoIHZlcnRpY2FsU2xpZGVzW2pdLmNsYXNzTGlzdC5jb250YWlucyggJ3ByZXNlbnQnICkgKSB7XG5cdFx0XHRcdFx0YnJlYWsgbWFpbkxvb3A7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRwYXN0Q291bnQrKztcblxuXHRcdFx0fVxuXG5cdFx0XHQvLyBTdG9wIGFzIHNvb24gYXMgd2UgYXJyaXZlIGF0IHRoZSBwcmVzZW50XG5cdFx0XHRpZiggaG9yaXpvbnRhbFNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ3ByZXNlbnQnICkgKSB7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBEb24ndCBjb3VudCB0aGUgd3JhcHBpbmcgc2VjdGlvbiBmb3IgdmVydGljYWwgc2xpZGVzXG5cdFx0XHRpZiggaG9yaXpvbnRhbFNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ3N0YWNrJyApID09PSBmYWxzZSApIHtcblx0XHRcdFx0cGFzdENvdW50Kys7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gcGFzdENvdW50O1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBhIHZhbHVlIHJhbmdpbmcgZnJvbSAwLTEgdGhhdCByZXByZXNlbnRzXG5cdCAqIGhvdyBmYXIgaW50byB0aGUgcHJlc2VudGF0aW9uIHdlIGhhdmUgbmF2aWdhdGVkLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtudW1iZXJ9XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRQcm9ncmVzcygpIHtcblxuXHRcdC8vIFRoZSBudW1iZXIgb2YgcGFzdCBhbmQgdG90YWwgc2xpZGVzXG5cdFx0dmFyIHRvdGFsQ291bnQgPSBnZXRUb3RhbFNsaWRlcygpO1xuXHRcdHZhciBwYXN0Q291bnQgPSBnZXRTbGlkZVBhc3RDb3VudCgpO1xuXG5cdFx0aWYoIGN1cnJlbnRTbGlkZSApIHtcblxuXHRcdFx0dmFyIGFsbEZyYWdtZW50cyA9IGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50JyApO1xuXG5cdFx0XHQvLyBJZiB0aGVyZSBhcmUgZnJhZ21lbnRzIGluIHRoZSBjdXJyZW50IHNsaWRlIHRob3NlIHNob3VsZCBiZVxuXHRcdFx0Ly8gYWNjb3VudGVkIGZvciBpbiB0aGUgcHJvZ3Jlc3MuXG5cdFx0XHRpZiggYWxsRnJhZ21lbnRzLmxlbmd0aCA+IDAgKSB7XG5cdFx0XHRcdHZhciB2aXNpYmxlRnJhZ21lbnRzID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQudmlzaWJsZScgKTtcblxuXHRcdFx0XHQvLyBUaGlzIHZhbHVlIHJlcHJlc2VudHMgaG93IGJpZyBhIHBvcnRpb24gb2YgdGhlIHNsaWRlIHByb2dyZXNzXG5cdFx0XHRcdC8vIHRoYXQgaXMgbWFkZSB1cCBieSBpdHMgZnJhZ21lbnRzICgwLTEpXG5cdFx0XHRcdHZhciBmcmFnbWVudFdlaWdodCA9IDAuOTtcblxuXHRcdFx0XHQvLyBBZGQgZnJhZ21lbnQgcHJvZ3Jlc3MgdG8gdGhlIHBhc3Qgc2xpZGUgY291bnRcblx0XHRcdFx0cGFzdENvdW50ICs9ICggdmlzaWJsZUZyYWdtZW50cy5sZW5ndGggLyBhbGxGcmFnbWVudHMubGVuZ3RoICkgKiBmcmFnbWVudFdlaWdodDtcblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdHJldHVybiBwYXN0Q291bnQgLyAoIHRvdGFsQ291bnQgLSAxICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgaWYgdGhpcyBwcmVzZW50YXRpb24gaXMgcnVubmluZyBpbnNpZGUgb2YgdGhlXG5cdCAqIHNwZWFrZXIgbm90ZXMgd2luZG93LlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtib29sZWFufVxuXHQgKi9cblx0ZnVuY3Rpb24gaXNTcGVha2VyTm90ZXMoKSB7XG5cblx0XHRyZXR1cm4gISF3aW5kb3cubG9jYXRpb24uc2VhcmNoLm1hdGNoKCAvcmVjZWl2ZXIvZ2kgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJlYWRzIHRoZSBjdXJyZW50IFVSTCAoaGFzaCkgYW5kIG5hdmlnYXRlcyBhY2NvcmRpbmdseS5cblx0ICovXG5cdGZ1bmN0aW9uIHJlYWRVUkwoKSB7XG5cblx0XHR2YXIgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuXG5cdFx0Ly8gQXR0ZW1wdCB0byBwYXJzZSB0aGUgaGFzaCBhcyBlaXRoZXIgYW4gaW5kZXggb3IgbmFtZVxuXHRcdHZhciBiaXRzID0gaGFzaC5zbGljZSggMiApLnNwbGl0KCAnLycgKSxcblx0XHRcdG5hbWUgPSBoYXNoLnJlcGxhY2UoIC8jfFxcLy9naSwgJycgKTtcblxuXHRcdC8vIElmIHRoZSBmaXJzdCBiaXQgaXMgaW52YWxpZCBhbmQgdGhlcmUgaXMgYSBuYW1lIHdlIGNhblxuXHRcdC8vIGFzc3VtZSB0aGF0IHRoaXMgaXMgYSBuYW1lZCBsaW5rXG5cdFx0aWYoIGlzTmFOKCBwYXJzZUludCggYml0c1swXSwgMTAgKSApICYmIG5hbWUubGVuZ3RoICkge1xuXHRcdFx0dmFyIGVsZW1lbnQ7XG5cblx0XHRcdC8vIEVuc3VyZSB0aGUgbmFtZWQgbGluayBpcyBhIHZhbGlkIEhUTUwgSUQgYXR0cmlidXRlXG5cdFx0XHRpZiggL15bYS16QS1aXVtcXHc6Li1dKiQvLnRlc3QoIG5hbWUgKSApIHtcblx0XHRcdFx0Ly8gRmluZCB0aGUgc2xpZGUgd2l0aCB0aGUgc3BlY2lmaWVkIElEXG5cdFx0XHRcdGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggbmFtZSApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggZWxlbWVudCApIHtcblx0XHRcdFx0Ly8gRmluZCB0aGUgcG9zaXRpb24gb2YgdGhlIG5hbWVkIHNsaWRlIGFuZCBuYXZpZ2F0ZSB0byBpdFxuXHRcdFx0XHR2YXIgaW5kaWNlcyA9IFJldmVhbC5nZXRJbmRpY2VzKCBlbGVtZW50ICk7XG5cdFx0XHRcdHNsaWRlKCBpbmRpY2VzLmgsIGluZGljZXMudiApO1xuXHRcdFx0fVxuXHRcdFx0Ly8gSWYgdGhlIHNsaWRlIGRvZXNuJ3QgZXhpc3QsIG5hdmlnYXRlIHRvIHRoZSBjdXJyZW50IHNsaWRlXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0c2xpZGUoIGluZGV4aCB8fCAwLCBpbmRleHYgfHwgMCApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFJlYWQgdGhlIGluZGV4IGNvbXBvbmVudHMgb2YgdGhlIGhhc2hcblx0XHRcdHZhciBoID0gcGFyc2VJbnQoIGJpdHNbMF0sIDEwICkgfHwgMCxcblx0XHRcdFx0diA9IHBhcnNlSW50KCBiaXRzWzFdLCAxMCApIHx8IDA7XG5cblx0XHRcdGlmKCBoICE9PSBpbmRleGggfHwgdiAhPT0gaW5kZXh2ICkge1xuXHRcdFx0XHRzbGlkZSggaCwgdiApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIHBhZ2UgVVJMIChoYXNoKSB0byByZWZsZWN0IHRoZSBjdXJyZW50XG5cdCAqIHN0YXRlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge251bWJlcn0gZGVsYXkgVGhlIHRpbWUgaW4gbXMgdG8gd2FpdCBiZWZvcmVcblx0ICogd3JpdGluZyB0aGUgaGFzaFxuXHQgKi9cblx0ZnVuY3Rpb24gd3JpdGVVUkwoIGRlbGF5ICkge1xuXG5cdFx0aWYoIGNvbmZpZy5oaXN0b3J5ICkge1xuXG5cdFx0XHQvLyBNYWtlIHN1cmUgdGhlcmUncyBuZXZlciBtb3JlIHRoYW4gb25lIHRpbWVvdXQgcnVubmluZ1xuXHRcdFx0Y2xlYXJUaW1lb3V0KCB3cml0ZVVSTFRpbWVvdXQgKTtcblxuXHRcdFx0Ly8gSWYgYSBkZWxheSBpcyBzcGVjaWZpZWQsIHRpbWVvdXQgdGhpcyBjYWxsXG5cdFx0XHRpZiggdHlwZW9mIGRlbGF5ID09PSAnbnVtYmVyJyApIHtcblx0XHRcdFx0d3JpdGVVUkxUaW1lb3V0ID0gc2V0VGltZW91dCggd3JpdGVVUkwsIGRlbGF5ICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKCBjdXJyZW50U2xpZGUgKSB7XG5cdFx0XHRcdHZhciB1cmwgPSAnLyc7XG5cblx0XHRcdFx0Ly8gQXR0ZW1wdCB0byBjcmVhdGUgYSBuYW1lZCBsaW5rIGJhc2VkIG9uIHRoZSBzbGlkZSdzIElEXG5cdFx0XHRcdHZhciBpZCA9IGN1cnJlbnRTbGlkZS5nZXRBdHRyaWJ1dGUoICdpZCcgKTtcblx0XHRcdFx0aWYoIGlkICkge1xuXHRcdFx0XHRcdGlkID0gaWQucmVwbGFjZSggL1teYS16QS1aMC05XFwtXFxfXFw6XFwuXS9nLCAnJyApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gSWYgdGhlIGN1cnJlbnQgc2xpZGUgaGFzIGFuIElELCB1c2UgdGhhdCBhcyBhIG5hbWVkIGxpbmtcblx0XHRcdFx0aWYoIHR5cGVvZiBpZCA9PT0gJ3N0cmluZycgJiYgaWQubGVuZ3RoICkge1xuXHRcdFx0XHRcdHVybCA9ICcvJyArIGlkO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIE90aGVyd2lzZSB1c2UgdGhlIC9oL3YgaW5kZXhcblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0aWYoIGluZGV4aCA+IDAgfHwgaW5kZXh2ID4gMCApIHVybCArPSBpbmRleGg7XG5cdFx0XHRcdFx0aWYoIGluZGV4diA+IDAgKSB1cmwgKz0gJy8nICsgaW5kZXh2O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0d2luZG93LmxvY2F0aW9uLmhhc2ggPSB1cmw7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgaC92IGxvY2F0aW9uIGFuZCBmcmFnbWVudCBvZiB0aGUgY3VycmVudCxcblx0ICogb3Igc3BlY2lmaWVkLCBzbGlkZS5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW3NsaWRlXSBJZiBzcGVjaWZpZWQsIHRoZSByZXR1cm5lZFxuXHQgKiBpbmRleCB3aWxsIGJlIGZvciB0aGlzIHNsaWRlIHJhdGhlciB0aGFuIHRoZSBjdXJyZW50bHlcblx0ICogYWN0aXZlIG9uZVxuXHQgKlxuXHQgKiBAcmV0dXJuIHt7aDogbnVtYmVyLCB2OiBudW1iZXIsIGY6IG51bWJlcn19XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRJbmRpY2VzKCBzbGlkZSApIHtcblxuXHRcdC8vIEJ5IGRlZmF1bHQsIHJldHVybiB0aGUgY3VycmVudCBpbmRpY2VzXG5cdFx0dmFyIGggPSBpbmRleGgsXG5cdFx0XHR2ID0gaW5kZXh2LFxuXHRcdFx0ZjtcblxuXHRcdC8vIElmIGEgc2xpZGUgaXMgc3BlY2lmaWVkLCByZXR1cm4gdGhlIGluZGljZXMgb2YgdGhhdCBzbGlkZVxuXHRcdGlmKCBzbGlkZSApIHtcblx0XHRcdHZhciBpc1ZlcnRpY2FsID0gaXNWZXJ0aWNhbFNsaWRlKCBzbGlkZSApO1xuXHRcdFx0dmFyIHNsaWRlaCA9IGlzVmVydGljYWwgPyBzbGlkZS5wYXJlbnROb2RlIDogc2xpZGU7XG5cblx0XHRcdC8vIFNlbGVjdCBhbGwgaG9yaXpvbnRhbCBzbGlkZXNcblx0XHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApO1xuXG5cdFx0XHQvLyBOb3cgdGhhdCB3ZSBrbm93IHdoaWNoIHRoZSBob3Jpem9udGFsIHNsaWRlIGlzLCBnZXQgaXRzIGluZGV4XG5cdFx0XHRoID0gTWF0aC5tYXgoIGhvcml6b250YWxTbGlkZXMuaW5kZXhPZiggc2xpZGVoICksIDAgKTtcblxuXHRcdFx0Ly8gQXNzdW1lIHdlJ3JlIG5vdCB2ZXJ0aWNhbFxuXHRcdFx0diA9IHVuZGVmaW5lZDtcblxuXHRcdFx0Ly8gSWYgdGhpcyBpcyBhIHZlcnRpY2FsIHNsaWRlLCBncmFiIHRoZSB2ZXJ0aWNhbCBpbmRleFxuXHRcdFx0aWYoIGlzVmVydGljYWwgKSB7XG5cdFx0XHRcdHYgPSBNYXRoLm1heCggdG9BcnJheSggc2xpZGUucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKSApLmluZGV4T2YoIHNsaWRlICksIDAgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiggIXNsaWRlICYmIGN1cnJlbnRTbGlkZSApIHtcblx0XHRcdHZhciBoYXNGcmFnbWVudHMgPSBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKS5sZW5ndGggPiAwO1xuXHRcdFx0aWYoIGhhc0ZyYWdtZW50cyApIHtcblx0XHRcdFx0dmFyIGN1cnJlbnRGcmFnbWVudCA9IGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yKCAnLmN1cnJlbnQtZnJhZ21lbnQnICk7XG5cdFx0XHRcdGlmKCBjdXJyZW50RnJhZ21lbnQgJiYgY3VycmVudEZyYWdtZW50Lmhhc0F0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnICkgKSB7XG5cdFx0XHRcdFx0ZiA9IHBhcnNlSW50KCBjdXJyZW50RnJhZ21lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1mcmFnbWVudC1pbmRleCcgKSwgMTAgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRmID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQudmlzaWJsZScgKS5sZW5ndGggLSAxO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgaDogaCwgdjogdiwgZjogZiB9O1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIGFsbCBzbGlkZXMgaW4gdGhpcyBwcmVzZW50YXRpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRTbGlkZXMoKSB7XG5cblx0XHRyZXR1cm4gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICsgJzpub3QoLnN0YWNrKScgKSk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIHRvdGFsIG51bWJlciBvZiBzbGlkZXMgaW4gdGhpcyBwcmVzZW50YXRpb24uXG5cdCAqXG5cdCAqIEByZXR1cm4ge251bWJlcn1cblx0ICovXG5cdGZ1bmN0aW9uIGdldFRvdGFsU2xpZGVzKCkge1xuXG5cdFx0cmV0dXJuIGdldFNsaWRlcygpLmxlbmd0aDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHNsaWRlIGVsZW1lbnQgbWF0Y2hpbmcgdGhlIHNwZWNpZmllZCBpbmRleC5cblx0ICpcblx0ICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRTbGlkZSggeCwgeSApIHtcblxuXHRcdHZhciBob3Jpem9udGFsU2xpZGUgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApWyB4IF07XG5cdFx0dmFyIHZlcnRpY2FsU2xpZGVzID0gaG9yaXpvbnRhbFNsaWRlICYmIGhvcml6b250YWxTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKTtcblxuXHRcdGlmKCB2ZXJ0aWNhbFNsaWRlcyAmJiB2ZXJ0aWNhbFNsaWRlcy5sZW5ndGggJiYgdHlwZW9mIHkgPT09ICdudW1iZXInICkge1xuXHRcdFx0cmV0dXJuIHZlcnRpY2FsU2xpZGVzID8gdmVydGljYWxTbGlkZXNbIHkgXSA6IHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRyZXR1cm4gaG9yaXpvbnRhbFNsaWRlO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYmFja2dyb3VuZCBlbGVtZW50IGZvciB0aGUgZ2l2ZW4gc2xpZGUuXG5cdCAqIEFsbCBzbGlkZXMsIGV2ZW4gdGhlIG9uZXMgd2l0aCBubyBiYWNrZ3JvdW5kIHByb3BlcnRpZXNcblx0ICogZGVmaW5lZCwgaGF2ZSBhIGJhY2tncm91bmQgZWxlbWVudCBzbyBhcyBsb25nIGFzIHRoZVxuXHQgKiBpbmRleCBpcyB2YWxpZCBhbiBlbGVtZW50IHdpbGwgYmUgcmV0dXJuZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSB4IEhvcml6b250YWwgYmFja2dyb3VuZCBpbmRleFxuXHQgKiBAcGFyYW0ge251bWJlcn0geSBWZXJ0aWNhbCBiYWNrZ3JvdW5kIGluZGV4XG5cdCAqIEByZXR1cm4geyhIVE1MRWxlbWVudFtdfCopfVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0U2xpZGVCYWNrZ3JvdW5kKCB4LCB5ICkge1xuXG5cdFx0Ly8gV2hlbiBwcmludGluZyB0byBQREYgdGhlIHNsaWRlIGJhY2tncm91bmRzIGFyZSBuZXN0ZWRcblx0XHQvLyBpbnNpZGUgb2YgdGhlIHNsaWRlc1xuXHRcdGlmKCBpc1ByaW50aW5nUERGKCkgKSB7XG5cdFx0XHR2YXIgc2xpZGUgPSBnZXRTbGlkZSggeCwgeSApO1xuXHRcdFx0aWYoIHNsaWRlICkge1xuXHRcdFx0XHRyZXR1cm4gc2xpZGUuc2xpZGVCYWNrZ3JvdW5kRWxlbWVudDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHR2YXIgaG9yaXpvbnRhbEJhY2tncm91bmQgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCAnLmJhY2tncm91bmRzPi5zbGlkZS1iYWNrZ3JvdW5kJyApWyB4IF07XG5cdFx0dmFyIHZlcnRpY2FsQmFja2dyb3VuZHMgPSBob3Jpem9udGFsQmFja2dyb3VuZCAmJiBob3Jpem9udGFsQmFja2dyb3VuZC5xdWVyeVNlbGVjdG9yQWxsKCAnLnNsaWRlLWJhY2tncm91bmQnICk7XG5cblx0XHRpZiggdmVydGljYWxCYWNrZ3JvdW5kcyAmJiB2ZXJ0aWNhbEJhY2tncm91bmRzLmxlbmd0aCAmJiB0eXBlb2YgeSA9PT0gJ251bWJlcicgKSB7XG5cdFx0XHRyZXR1cm4gdmVydGljYWxCYWNrZ3JvdW5kcyA/IHZlcnRpY2FsQmFja2dyb3VuZHNbIHkgXSA6IHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRyZXR1cm4gaG9yaXpvbnRhbEJhY2tncm91bmQ7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIHNwZWFrZXIgbm90ZXMgZnJvbSBhIHNsaWRlLiBOb3RlcyBjYW4gYmVcblx0ICogZGVmaW5lZCBpbiB0d28gd2F5czpcblx0ICogMS4gQXMgYSBkYXRhLW5vdGVzIGF0dHJpYnV0ZSBvbiB0aGUgc2xpZGUgPHNlY3Rpb24+XG5cdCAqIDIuIEFzIGFuIDxhc2lkZSBjbGFzcz1cIm5vdGVzXCI+IGluc2lkZSBvZiB0aGUgc2xpZGVcblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW3NsaWRlPWN1cnJlbnRTbGlkZV1cblx0ICogQHJldHVybiB7KHN0cmluZ3xudWxsKX1cblx0ICovXG5cdGZ1bmN0aW9uIGdldFNsaWRlTm90ZXMoIHNsaWRlICkge1xuXG5cdFx0Ly8gRGVmYXVsdCB0byB0aGUgY3VycmVudCBzbGlkZVxuXHRcdHNsaWRlID0gc2xpZGUgfHwgY3VycmVudFNsaWRlO1xuXG5cdFx0Ly8gTm90ZXMgY2FuIGJlIHNwZWNpZmllZCB2aWEgdGhlIGRhdGEtbm90ZXMgYXR0cmlidXRlLi4uXG5cdFx0aWYoIHNsaWRlLmhhc0F0dHJpYnV0ZSggJ2RhdGEtbm90ZXMnICkgKSB7XG5cdFx0XHRyZXR1cm4gc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1ub3RlcycgKTtcblx0XHR9XG5cblx0XHQvLyAuLi4gb3IgdXNpbmcgYW4gPGFzaWRlIGNsYXNzPVwibm90ZXNcIj4gZWxlbWVudFxuXHRcdHZhciBub3Rlc0VsZW1lbnQgPSBzbGlkZS5xdWVyeVNlbGVjdG9yKCAnYXNpZGUubm90ZXMnICk7XG5cdFx0aWYoIG5vdGVzRWxlbWVudCApIHtcblx0XHRcdHJldHVybiBub3Rlc0VsZW1lbnQuaW5uZXJIVE1MO1xuXHRcdH1cblxuXHRcdHJldHVybiBudWxsO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBwcmVzZW50YXRpb24gYXNcblx0ICogYW4gb2JqZWN0LiBUaGlzIHN0YXRlIGNhbiB0aGVuIGJlIHJlc3RvcmVkIGF0IGFueVxuXHQgKiB0aW1lLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHt7aW5kZXhoOiBudW1iZXIsIGluZGV4djogbnVtYmVyLCBpbmRleGY6IG51bWJlciwgcGF1c2VkOiBib29sZWFuLCBvdmVydmlldzogYm9vbGVhbn19XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRTdGF0ZSgpIHtcblxuXHRcdHZhciBpbmRpY2VzID0gZ2V0SW5kaWNlcygpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGluZGV4aDogaW5kaWNlcy5oLFxuXHRcdFx0aW5kZXh2OiBpbmRpY2VzLnYsXG5cdFx0XHRpbmRleGY6IGluZGljZXMuZixcblx0XHRcdHBhdXNlZDogaXNQYXVzZWQoKSxcblx0XHRcdG92ZXJ2aWV3OiBpc092ZXJ2aWV3KClcblx0XHR9O1xuXG5cdH1cblxuXHQvKipcblx0ICogUmVzdG9yZXMgdGhlIHByZXNlbnRhdGlvbiB0byB0aGUgZ2l2ZW4gc3RhdGUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBzdGF0ZSBBcyBnZW5lcmF0ZWQgYnkgZ2V0U3RhdGUoKVxuXHQgKiBAc2VlIHtAbGluayBnZXRTdGF0ZX0gZ2VuZXJhdGVzIHRoZSBwYXJhbWV0ZXIgYHN0YXRlYFxuXHQgKi9cblx0ZnVuY3Rpb24gc2V0U3RhdGUoIHN0YXRlICkge1xuXG5cdFx0aWYoIHR5cGVvZiBzdGF0ZSA9PT0gJ29iamVjdCcgKSB7XG5cdFx0XHRzbGlkZSggZGVzZXJpYWxpemUoIHN0YXRlLmluZGV4aCApLCBkZXNlcmlhbGl6ZSggc3RhdGUuaW5kZXh2ICksIGRlc2VyaWFsaXplKCBzdGF0ZS5pbmRleGYgKSApO1xuXG5cdFx0XHR2YXIgcGF1c2VkRmxhZyA9IGRlc2VyaWFsaXplKCBzdGF0ZS5wYXVzZWQgKSxcblx0XHRcdFx0b3ZlcnZpZXdGbGFnID0gZGVzZXJpYWxpemUoIHN0YXRlLm92ZXJ2aWV3ICk7XG5cblx0XHRcdGlmKCB0eXBlb2YgcGF1c2VkRmxhZyA9PT0gJ2Jvb2xlYW4nICYmIHBhdXNlZEZsYWcgIT09IGlzUGF1c2VkKCkgKSB7XG5cdFx0XHRcdHRvZ2dsZVBhdXNlKCBwYXVzZWRGbGFnICk7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCB0eXBlb2Ygb3ZlcnZpZXdGbGFnID09PSAnYm9vbGVhbicgJiYgb3ZlcnZpZXdGbGFnICE9PSBpc092ZXJ2aWV3KCkgKSB7XG5cdFx0XHRcdHRvZ2dsZU92ZXJ2aWV3KCBvdmVydmlld0ZsYWcgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm4gYSBzb3J0ZWQgZnJhZ21lbnRzIGxpc3QsIG9yZGVyZWQgYnkgYW4gaW5jcmVhc2luZ1xuXHQgKiBcImRhdGEtZnJhZ21lbnQtaW5kZXhcIiBhdHRyaWJ1dGUuXG5cdCAqXG5cdCAqIEZyYWdtZW50cyB3aWxsIGJlIHJldmVhbGVkIGluIHRoZSBvcmRlciB0aGF0IHRoZXkgYXJlIHJldHVybmVkIGJ5XG5cdCAqIHRoaXMgZnVuY3Rpb24sIHNvIHlvdSBjYW4gdXNlIHRoZSBpbmRleCBhdHRyaWJ1dGVzIHRvIGNvbnRyb2wgdGhlXG5cdCAqIG9yZGVyIG9mIGZyYWdtZW50IGFwcGVhcmFuY2UuXG5cdCAqXG5cdCAqIFRvIG1haW50YWluIGEgc2Vuc2libGUgZGVmYXVsdCBmcmFnbWVudCBvcmRlciwgZnJhZ21lbnRzIGFyZSBwcmVzdW1lZFxuXHQgKiB0byBiZSBwYXNzZWQgaW4gZG9jdW1lbnQgb3JkZXIuIFRoaXMgZnVuY3Rpb24gYWRkcyBhIFwiZnJhZ21lbnQtaW5kZXhcIlxuXHQgKiBhdHRyaWJ1dGUgdG8gZWFjaCBub2RlIGlmIHN1Y2ggYW4gYXR0cmlidXRlIGlzIG5vdCBhbHJlYWR5IHByZXNlbnQsXG5cdCAqIGFuZCBzZXRzIHRoYXQgYXR0cmlidXRlIHRvIGFuIGludGVnZXIgdmFsdWUgd2hpY2ggaXMgdGhlIHBvc2l0aW9uIG9mXG5cdCAqIHRoZSBmcmFnbWVudCB3aXRoaW4gdGhlIGZyYWdtZW50cyBsaXN0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdFtdfCp9IGZyYWdtZW50c1xuXHQgKiBAcmV0dXJuIHtvYmplY3RbXX0gc29ydGVkIFNvcnRlZCBhcnJheSBvZiBmcmFnbWVudHNcblx0ICovXG5cdGZ1bmN0aW9uIHNvcnRGcmFnbWVudHMoIGZyYWdtZW50cyApIHtcblxuXHRcdGZyYWdtZW50cyA9IHRvQXJyYXkoIGZyYWdtZW50cyApO1xuXG5cdFx0dmFyIG9yZGVyZWQgPSBbXSxcblx0XHRcdHVub3JkZXJlZCA9IFtdLFxuXHRcdFx0c29ydGVkID0gW107XG5cblx0XHQvLyBHcm91cCBvcmRlcmVkIGFuZCB1bm9yZGVyZWQgZWxlbWVudHNcblx0XHRmcmFnbWVudHMuZm9yRWFjaCggZnVuY3Rpb24oIGZyYWdtZW50LCBpICkge1xuXHRcdFx0aWYoIGZyYWdtZW50Lmhhc0F0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnICkgKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9IHBhcnNlSW50KCBmcmFnbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JyApLCAxMCApO1xuXG5cdFx0XHRcdGlmKCAhb3JkZXJlZFtpbmRleF0gKSB7XG5cdFx0XHRcdFx0b3JkZXJlZFtpbmRleF0gPSBbXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG9yZGVyZWRbaW5kZXhdLnB1c2goIGZyYWdtZW50ICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dW5vcmRlcmVkLnB1c2goIFsgZnJhZ21lbnQgXSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdC8vIEFwcGVuZCBmcmFnbWVudHMgd2l0aG91dCBleHBsaWNpdCBpbmRpY2VzIGluIHRoZWlyXG5cdFx0Ly8gRE9NIG9yZGVyXG5cdFx0b3JkZXJlZCA9IG9yZGVyZWQuY29uY2F0KCB1bm9yZGVyZWQgKTtcblxuXHRcdC8vIE1hbnVhbGx5IGNvdW50IHRoZSBpbmRleCB1cCBwZXIgZ3JvdXAgdG8gZW5zdXJlIHRoZXJlXG5cdFx0Ly8gYXJlIG5vIGdhcHNcblx0XHR2YXIgaW5kZXggPSAwO1xuXG5cdFx0Ly8gUHVzaCBhbGwgZnJhZ21lbnRzIGluIHRoZWlyIHNvcnRlZCBvcmRlciB0byBhbiBhcnJheSxcblx0XHQvLyB0aGlzIGZsYXR0ZW5zIHRoZSBncm91cHNcblx0XHRvcmRlcmVkLmZvckVhY2goIGZ1bmN0aW9uKCBncm91cCApIHtcblx0XHRcdGdyb3VwLmZvckVhY2goIGZ1bmN0aW9uKCBmcmFnbWVudCApIHtcblx0XHRcdFx0c29ydGVkLnB1c2goIGZyYWdtZW50ICk7XG5cdFx0XHRcdGZyYWdtZW50LnNldEF0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnLCBpbmRleCApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRpbmRleCArKztcblx0XHR9ICk7XG5cblx0XHRyZXR1cm4gc29ydGVkO1xuXG5cdH1cblxuXHQvKipcblx0ICogTmF2aWdhdGUgdG8gdGhlIHNwZWNpZmllZCBzbGlkZSBmcmFnbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHs/bnVtYmVyfSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGZyYWdtZW50IHRoYXRcblx0ICogc2hvdWxkIGJlIHNob3duLCAtMSBtZWFucyBhbGwgYXJlIGludmlzaWJsZVxuXHQgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IEludGVnZXIgb2Zmc2V0IHRvIGFwcGx5IHRvIHRoZVxuXHQgKiBmcmFnbWVudCBpbmRleFxuXHQgKlxuXHQgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGEgY2hhbmdlIHdhcyBtYWRlIGluIGFueVxuXHQgKiBmcmFnbWVudHMgdmlzaWJpbGl0eSBhcyBwYXJ0IG9mIHRoaXMgY2FsbFxuXHQgKi9cblx0ZnVuY3Rpb24gbmF2aWdhdGVGcmFnbWVudCggaW5kZXgsIG9mZnNldCApIHtcblxuXHRcdGlmKCBjdXJyZW50U2xpZGUgJiYgY29uZmlnLmZyYWdtZW50cyApIHtcblxuXHRcdFx0dmFyIGZyYWdtZW50cyA9IHNvcnRGcmFnbWVudHMoIGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50JyApICk7XG5cdFx0XHRpZiggZnJhZ21lbnRzLmxlbmd0aCApIHtcblxuXHRcdFx0XHQvLyBJZiBubyBpbmRleCBpcyBzcGVjaWZpZWQsIGZpbmQgdGhlIGN1cnJlbnRcblx0XHRcdFx0aWYoIHR5cGVvZiBpbmRleCAhPT0gJ251bWJlcicgKSB7XG5cdFx0XHRcdFx0dmFyIGxhc3RWaXNpYmxlRnJhZ21lbnQgPSBzb3J0RnJhZ21lbnRzKCBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudC52aXNpYmxlJyApICkucG9wKCk7XG5cblx0XHRcdFx0XHRpZiggbGFzdFZpc2libGVGcmFnbWVudCApIHtcblx0XHRcdFx0XHRcdGluZGV4ID0gcGFyc2VJbnQoIGxhc3RWaXNpYmxlRnJhZ21lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1mcmFnbWVudC1pbmRleCcgKSB8fCAwLCAxMCApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGluZGV4ID0gLTE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gSWYgYW4gb2Zmc2V0IGlzIHNwZWNpZmllZCwgYXBwbHkgaXQgdG8gdGhlIGluZGV4XG5cdFx0XHRcdGlmKCB0eXBlb2Ygb2Zmc2V0ID09PSAnbnVtYmVyJyApIHtcblx0XHRcdFx0XHRpbmRleCArPSBvZmZzZXQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgZnJhZ21lbnRzU2hvd24gPSBbXSxcblx0XHRcdFx0XHRmcmFnbWVudHNIaWRkZW4gPSBbXTtcblxuXHRcdFx0XHR0b0FycmF5KCBmcmFnbWVudHMgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWxlbWVudCwgaSApIHtcblxuXHRcdFx0XHRcdGlmKCBlbGVtZW50Lmhhc0F0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnICkgKSB7XG5cdFx0XHRcdFx0XHRpID0gcGFyc2VJbnQoIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1mcmFnbWVudC1pbmRleCcgKSwgMTAgKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBWaXNpYmxlIGZyYWdtZW50c1xuXHRcdFx0XHRcdGlmKCBpIDw9IGluZGV4ICkge1xuXHRcdFx0XHRcdFx0aWYoICFlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyggJ3Zpc2libGUnICkgKSBmcmFnbWVudHNTaG93bi5wdXNoKCBlbGVtZW50ICk7XG5cdFx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQoICd2aXNpYmxlJyApO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAnY3VycmVudC1mcmFnbWVudCcgKTtcblxuXHRcdFx0XHRcdFx0Ly8gQW5ub3VuY2UgdGhlIGZyYWdtZW50cyBvbmUgYnkgb25lIHRvIHRoZSBTY3JlZW4gUmVhZGVyXG5cdFx0XHRcdFx0XHRkb20uc3RhdHVzRGl2LnRleHRDb250ZW50ID0gZ2V0U3RhdHVzVGV4dCggZWxlbWVudCApO1xuXG5cdFx0XHRcdFx0XHRpZiggaSA9PT0gaW5kZXggKSB7XG5cdFx0XHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ2N1cnJlbnQtZnJhZ21lbnQnICk7XG5cdFx0XHRcdFx0XHRcdHN0YXJ0RW1iZWRkZWRDb250ZW50KCBlbGVtZW50ICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIEhpZGRlbiBmcmFnbWVudHNcblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGlmKCBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyggJ3Zpc2libGUnICkgKSBmcmFnbWVudHNIaWRkZW4ucHVzaCggZWxlbWVudCApO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAndmlzaWJsZScgKTtcblx0XHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ2N1cnJlbnQtZnJhZ21lbnQnICk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0gKTtcblxuXHRcdFx0XHRpZiggZnJhZ21lbnRzSGlkZGVuLmxlbmd0aCApIHtcblx0XHRcdFx0XHRkaXNwYXRjaEV2ZW50KCAnZnJhZ21lbnRoaWRkZW4nLCB7IGZyYWdtZW50OiBmcmFnbWVudHNIaWRkZW5bMF0sIGZyYWdtZW50czogZnJhZ21lbnRzSGlkZGVuIH0gKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCBmcmFnbWVudHNTaG93bi5sZW5ndGggKSB7XG5cdFx0XHRcdFx0ZGlzcGF0Y2hFdmVudCggJ2ZyYWdtZW50c2hvd24nLCB7IGZyYWdtZW50OiBmcmFnbWVudHNTaG93blswXSwgZnJhZ21lbnRzOiBmcmFnbWVudHNTaG93biB9ICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR1cGRhdGVDb250cm9scygpO1xuXHRcdFx0XHR1cGRhdGVQcm9ncmVzcygpO1xuXG5cdFx0XHRcdHJldHVybiAhISggZnJhZ21lbnRzU2hvd24ubGVuZ3RoIHx8IGZyYWdtZW50c0hpZGRlbi5sZW5ndGggKTtcblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdH1cblxuXHQvKipcblx0ICogTmF2aWdhdGUgdG8gdGhlIG5leHQgc2xpZGUgZnJhZ21lbnQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlcmUgd2FzIGEgbmV4dCBmcmFnbWVudCxcblx0ICogZmFsc2Ugb3RoZXJ3aXNlXG5cdCAqL1xuXHRmdW5jdGlvbiBuZXh0RnJhZ21lbnQoKSB7XG5cblx0XHRyZXR1cm4gbmF2aWdhdGVGcmFnbWVudCggbnVsbCwgMSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogTmF2aWdhdGUgdG8gdGhlIHByZXZpb3VzIHNsaWRlIGZyYWdtZW50LlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZXJlIHdhcyBhIHByZXZpb3VzIGZyYWdtZW50LFxuXHQgKiBmYWxzZSBvdGhlcndpc2Vcblx0ICovXG5cdGZ1bmN0aW9uIHByZXZpb3VzRnJhZ21lbnQoKSB7XG5cblx0XHRyZXR1cm4gbmF2aWdhdGVGcmFnbWVudCggbnVsbCwgLTEgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEN1ZXMgYSBuZXcgYXV0b21hdGVkIHNsaWRlIGlmIGVuYWJsZWQgaW4gdGhlIGNvbmZpZy5cblx0ICovXG5cdGZ1bmN0aW9uIGN1ZUF1dG9TbGlkZSgpIHtcblxuXHRcdGNhbmNlbEF1dG9TbGlkZSgpO1xuXG5cdFx0aWYoIGN1cnJlbnRTbGlkZSApIHtcblxuXHRcdFx0dmFyIGZyYWdtZW50ID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3IoICcuY3VycmVudC1mcmFnbWVudCcgKTtcblxuXHRcdFx0Ly8gV2hlbiB0aGUgc2xpZGUgZmlyc3QgYXBwZWFycyB0aGVyZSBpcyBubyBcImN1cnJlbnRcIiBmcmFnbWVudCBzb1xuXHRcdFx0Ly8gd2UgbG9vayBmb3IgYSBkYXRhLWF1dG9zbGlkZSB0aW1pbmcgb24gdGhlIGZpcnN0IGZyYWdtZW50XG5cdFx0XHRpZiggIWZyYWdtZW50ICkgZnJhZ21lbnQgPSBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvciggJy5mcmFnbWVudCcgKTtcblxuXHRcdFx0dmFyIGZyYWdtZW50QXV0b1NsaWRlID0gZnJhZ21lbnQgPyBmcmFnbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWF1dG9zbGlkZScgKSA6IG51bGw7XG5cdFx0XHR2YXIgcGFyZW50QXV0b1NsaWRlID0gY3VycmVudFNsaWRlLnBhcmVudE5vZGUgPyBjdXJyZW50U2xpZGUucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWF1dG9zbGlkZScgKSA6IG51bGw7XG5cdFx0XHR2YXIgc2xpZGVBdXRvU2xpZGUgPSBjdXJyZW50U2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1hdXRvc2xpZGUnICk7XG5cblx0XHRcdC8vIFBpY2sgdmFsdWUgaW4gdGhlIGZvbGxvd2luZyBwcmlvcml0eSBvcmRlcjpcblx0XHRcdC8vIDEuIEN1cnJlbnQgZnJhZ21lbnQncyBkYXRhLWF1dG9zbGlkZVxuXHRcdFx0Ly8gMi4gQ3VycmVudCBzbGlkZSdzIGRhdGEtYXV0b3NsaWRlXG5cdFx0XHQvLyAzLiBQYXJlbnQgc2xpZGUncyBkYXRhLWF1dG9zbGlkZVxuXHRcdFx0Ly8gNC4gR2xvYmFsIGF1dG9TbGlkZSBzZXR0aW5nXG5cdFx0XHRpZiggZnJhZ21lbnRBdXRvU2xpZGUgKSB7XG5cdFx0XHRcdGF1dG9TbGlkZSA9IHBhcnNlSW50KCBmcmFnbWVudEF1dG9TbGlkZSwgMTAgKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoIHNsaWRlQXV0b1NsaWRlICkge1xuXHRcdFx0XHRhdXRvU2xpZGUgPSBwYXJzZUludCggc2xpZGVBdXRvU2xpZGUsIDEwICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKCBwYXJlbnRBdXRvU2xpZGUgKSB7XG5cdFx0XHRcdGF1dG9TbGlkZSA9IHBhcnNlSW50KCBwYXJlbnRBdXRvU2xpZGUsIDEwICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0YXV0b1NsaWRlID0gY29uZmlnLmF1dG9TbGlkZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgdGhlcmUgYXJlIG1lZGlhIGVsZW1lbnRzIHdpdGggZGF0YS1hdXRvcGxheSxcblx0XHRcdC8vIGF1dG9tYXRpY2FsbHkgc2V0IHRoZSBhdXRvU2xpZGUgZHVyYXRpb24gdG8gdGhlXG5cdFx0XHQvLyBsZW5ndGggb2YgdGhhdCBtZWRpYS4gTm90IGFwcGxpY2FibGUgaWYgdGhlIHNsaWRlXG5cdFx0XHQvLyBpcyBkaXZpZGVkIHVwIGludG8gZnJhZ21lbnRzLlxuXHRcdFx0Ly8gcGxheWJhY2tSYXRlIGlzIGFjY291bnRlZCBmb3IgaW4gdGhlIGR1cmF0aW9uLlxuXHRcdFx0aWYoIGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50JyApLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdFx0dG9BcnJheSggY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICd2aWRlbywgYXVkaW8nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdFx0aWYoIGVsLmhhc0F0dHJpYnV0ZSggJ2RhdGEtYXV0b3BsYXknICkgKSB7XG5cdFx0XHRcdFx0XHRpZiggYXV0b1NsaWRlICYmIChlbC5kdXJhdGlvbiAqIDEwMDAgLyBlbC5wbGF5YmFja1JhdGUgKSA+IGF1dG9TbGlkZSApIHtcblx0XHRcdFx0XHRcdFx0YXV0b1NsaWRlID0gKCBlbC5kdXJhdGlvbiAqIDEwMDAgLyBlbC5wbGF5YmFja1JhdGUgKSArIDEwMDA7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEN1ZSB0aGUgbmV4dCBhdXRvLXNsaWRlIGlmOlxuXHRcdFx0Ly8gLSBUaGVyZSBpcyBhbiBhdXRvU2xpZGUgdmFsdWVcblx0XHRcdC8vIC0gQXV0by1zbGlkaW5nIGlzbid0IHBhdXNlZCBieSB0aGUgdXNlclxuXHRcdFx0Ly8gLSBUaGUgcHJlc2VudGF0aW9uIGlzbid0IHBhdXNlZFxuXHRcdFx0Ly8gLSBUaGUgb3ZlcnZpZXcgaXNuJ3QgYWN0aXZlXG5cdFx0XHQvLyAtIFRoZSBwcmVzZW50YXRpb24gaXNuJ3Qgb3ZlclxuXHRcdFx0aWYoIGF1dG9TbGlkZSAmJiAhYXV0b1NsaWRlUGF1c2VkICYmICFpc1BhdXNlZCgpICYmICFpc092ZXJ2aWV3KCkgJiYgKCAhUmV2ZWFsLmlzTGFzdFNsaWRlKCkgfHwgYXZhaWxhYmxlRnJhZ21lbnRzKCkubmV4dCB8fCBjb25maWcubG9vcCA9PT0gdHJ1ZSApICkge1xuXHRcdFx0XHRhdXRvU2xpZGVUaW1lb3V0ID0gc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dHlwZW9mIGNvbmZpZy5hdXRvU2xpZGVNZXRob2QgPT09ICdmdW5jdGlvbicgPyBjb25maWcuYXV0b1NsaWRlTWV0aG9kKCkgOiBuYXZpZ2F0ZU5leHQoKTtcblx0XHRcdFx0XHRjdWVBdXRvU2xpZGUoKTtcblx0XHRcdFx0fSwgYXV0b1NsaWRlICk7XG5cdFx0XHRcdGF1dG9TbGlkZVN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCBhdXRvU2xpZGVQbGF5ZXIgKSB7XG5cdFx0XHRcdGF1dG9TbGlkZVBsYXllci5zZXRQbGF5aW5nKCBhdXRvU2xpZGVUaW1lb3V0ICE9PSAtMSApO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2FuY2VscyBhbnkgb25nb2luZyByZXF1ZXN0IHRvIGF1dG8tc2xpZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiBjYW5jZWxBdXRvU2xpZGUoKSB7XG5cblx0XHRjbGVhclRpbWVvdXQoIGF1dG9TbGlkZVRpbWVvdXQgKTtcblx0XHRhdXRvU2xpZGVUaW1lb3V0ID0gLTE7XG5cblx0fVxuXG5cdGZ1bmN0aW9uIHBhdXNlQXV0b1NsaWRlKCkge1xuXG5cdFx0aWYoIGF1dG9TbGlkZSAmJiAhYXV0b1NsaWRlUGF1c2VkICkge1xuXHRcdFx0YXV0b1NsaWRlUGF1c2VkID0gdHJ1ZTtcblx0XHRcdGRpc3BhdGNoRXZlbnQoICdhdXRvc2xpZGVwYXVzZWQnICk7XG5cdFx0XHRjbGVhclRpbWVvdXQoIGF1dG9TbGlkZVRpbWVvdXQgKTtcblxuXHRcdFx0aWYoIGF1dG9TbGlkZVBsYXllciApIHtcblx0XHRcdFx0YXV0b1NsaWRlUGxheWVyLnNldFBsYXlpbmcoIGZhbHNlICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiByZXN1bWVBdXRvU2xpZGUoKSB7XG5cblx0XHRpZiggYXV0b1NsaWRlICYmIGF1dG9TbGlkZVBhdXNlZCApIHtcblx0XHRcdGF1dG9TbGlkZVBhdXNlZCA9IGZhbHNlO1xuXHRcdFx0ZGlzcGF0Y2hFdmVudCggJ2F1dG9zbGlkZXJlc3VtZWQnICk7XG5cdFx0XHRjdWVBdXRvU2xpZGUoKTtcblx0XHR9XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG5hdmlnYXRlTGVmdCgpIHtcblxuXHRcdC8vIFJldmVyc2UgZm9yIFJUTFxuXHRcdGlmKCBjb25maWcucnRsICkge1xuXHRcdFx0aWYoICggaXNPdmVydmlldygpIHx8IG5leHRGcmFnbWVudCgpID09PSBmYWxzZSApICYmIGF2YWlsYWJsZVJvdXRlcygpLmxlZnQgKSB7XG5cdFx0XHRcdHNsaWRlKCBpbmRleGggKyAxICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIE5vcm1hbCBuYXZpZ2F0aW9uXG5cdFx0ZWxzZSBpZiggKCBpc092ZXJ2aWV3KCkgfHwgcHJldmlvdXNGcmFnbWVudCgpID09PSBmYWxzZSApICYmIGF2YWlsYWJsZVJvdXRlcygpLmxlZnQgKSB7XG5cdFx0XHRzbGlkZSggaW5kZXhoIC0gMSApO1xuXHRcdH1cblxuXHR9XG5cblx0ZnVuY3Rpb24gbmF2aWdhdGVSaWdodCgpIHtcblxuXHRcdC8vIFJldmVyc2UgZm9yIFJUTFxuXHRcdGlmKCBjb25maWcucnRsICkge1xuXHRcdFx0aWYoICggaXNPdmVydmlldygpIHx8IHByZXZpb3VzRnJhZ21lbnQoKSA9PT0gZmFsc2UgKSAmJiBhdmFpbGFibGVSb3V0ZXMoKS5yaWdodCApIHtcblx0XHRcdFx0c2xpZGUoIGluZGV4aCAtIDEgKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gTm9ybWFsIG5hdmlnYXRpb25cblx0XHRlbHNlIGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBuZXh0RnJhZ21lbnQoKSA9PT0gZmFsc2UgKSAmJiBhdmFpbGFibGVSb3V0ZXMoKS5yaWdodCApIHtcblx0XHRcdHNsaWRlKCBpbmRleGggKyAxICk7XG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiBuYXZpZ2F0ZVVwKCkge1xuXG5cdFx0Ly8gUHJpb3JpdGl6ZSBoaWRpbmcgZnJhZ21lbnRzXG5cdFx0aWYoICggaXNPdmVydmlldygpIHx8IHByZXZpb3VzRnJhZ21lbnQoKSA9PT0gZmFsc2UgKSAmJiBhdmFpbGFibGVSb3V0ZXMoKS51cCApIHtcblx0XHRcdHNsaWRlKCBpbmRleGgsIGluZGV4diAtIDEgKTtcblx0XHR9XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG5hdmlnYXRlRG93bigpIHtcblxuXHRcdC8vIFByaW9yaXRpemUgcmV2ZWFsaW5nIGZyYWdtZW50c1xuXHRcdGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBuZXh0RnJhZ21lbnQoKSA9PT0gZmFsc2UgKSAmJiBhdmFpbGFibGVSb3V0ZXMoKS5kb3duICkge1xuXHRcdFx0c2xpZGUoIGluZGV4aCwgaW5kZXh2ICsgMSApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIE5hdmlnYXRlcyBiYWNrd2FyZHMsIHByaW9yaXRpemVkIGluIHRoZSBmb2xsb3dpbmcgb3JkZXI6XG5cdCAqIDEpIFByZXZpb3VzIGZyYWdtZW50XG5cdCAqIDIpIFByZXZpb3VzIHZlcnRpY2FsIHNsaWRlXG5cdCAqIDMpIFByZXZpb3VzIGhvcml6b250YWwgc2xpZGVcblx0ICovXG5cdGZ1bmN0aW9uIG5hdmlnYXRlUHJldigpIHtcblxuXHRcdC8vIFByaW9yaXRpemUgcmV2ZWFsaW5nIGZyYWdtZW50c1xuXHRcdGlmKCBwcmV2aW91c0ZyYWdtZW50KCkgPT09IGZhbHNlICkge1xuXHRcdFx0aWYoIGF2YWlsYWJsZVJvdXRlcygpLnVwICkge1xuXHRcdFx0XHRuYXZpZ2F0ZVVwKCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly8gRmV0Y2ggdGhlIHByZXZpb3VzIGhvcml6b250YWwgc2xpZGUsIGlmIHRoZXJlIGlzIG9uZVxuXHRcdFx0XHR2YXIgcHJldmlvdXNTbGlkZTtcblxuXHRcdFx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdFx0XHRwcmV2aW91c1NsaWRlID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKyAnLmZ1dHVyZScgKSApLnBvcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHByZXZpb3VzU2xpZGUgPSB0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiArICcucGFzdCcgKSApLnBvcCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIHByZXZpb3VzU2xpZGUgKSB7XG5cdFx0XHRcdFx0dmFyIHYgPSAoIHByZXZpb3VzU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkubGVuZ3RoIC0gMSApIHx8IHVuZGVmaW5lZDtcblx0XHRcdFx0XHR2YXIgaCA9IGluZGV4aCAtIDE7XG5cdFx0XHRcdFx0c2xpZGUoIGgsIHYgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSByZXZlcnNlIG9mICNuYXZpZ2F0ZVByZXYoKS5cblx0ICovXG5cdGZ1bmN0aW9uIG5hdmlnYXRlTmV4dCgpIHtcblxuXHRcdC8vIFByaW9yaXRpemUgcmV2ZWFsaW5nIGZyYWdtZW50c1xuXHRcdGlmKCBuZXh0RnJhZ21lbnQoKSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRpZiggYXZhaWxhYmxlUm91dGVzKCkuZG93biApIHtcblx0XHRcdFx0bmF2aWdhdGVEb3duKCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKCBjb25maWcucnRsICkge1xuXHRcdFx0XHRuYXZpZ2F0ZUxlZnQoKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRuYXZpZ2F0ZVJpZ2h0KCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIHRoZSB0YXJnZXQgZWxlbWVudCBwcmV2ZW50cyB0aGUgdHJpZ2dlcmluZyBvZlxuXHQgKiBzd2lwZSBuYXZpZ2F0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gaXNTd2lwZVByZXZlbnRlZCggdGFyZ2V0ICkge1xuXG5cdFx0d2hpbGUoIHRhcmdldCAmJiB0eXBlb2YgdGFyZ2V0Lmhhc0F0dHJpYnV0ZSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdGlmKCB0YXJnZXQuaGFzQXR0cmlidXRlKCAnZGF0YS1wcmV2ZW50LXN3aXBlJyApICkgcmV0dXJuIHRydWU7XG5cdFx0XHR0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cblx0fVxuXG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBFVkVOVFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuXHQvKipcblx0ICogQ2FsbGVkIGJ5IGFsbCBldmVudCBoYW5kbGVycyB0aGF0IGFyZSBiYXNlZCBvbiB1c2VyXG5cdCAqIGlucHV0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW2V2ZW50XVxuXHQgKi9cblx0ZnVuY3Rpb24gb25Vc2VySW5wdXQoIGV2ZW50ICkge1xuXG5cdFx0aWYoIGNvbmZpZy5hdXRvU2xpZGVTdG9wcGFibGUgKSB7XG5cdFx0XHRwYXVzZUF1dG9TbGlkZSgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSBkb2N1bWVudCBsZXZlbCAna2V5cHJlc3MnIGV2ZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcblx0ICovXG5cdGZ1bmN0aW9uIG9uRG9jdW1lbnRLZXlQcmVzcyggZXZlbnQgKSB7XG5cblx0XHQvLyBDaGVjayBpZiB0aGUgcHJlc3NlZCBrZXkgaXMgcXVlc3Rpb24gbWFya1xuXHRcdGlmKCBldmVudC5zaGlmdEtleSAmJiBldmVudC5jaGFyQ29kZSA9PT0gNjMgKSB7XG5cdFx0XHR0b2dnbGVIZWxwKCk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogSGFuZGxlciBmb3IgdGhlIGRvY3VtZW50IGxldmVsICdrZXlkb3duJyBldmVudC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBvbkRvY3VtZW50S2V5RG93biggZXZlbnQgKSB7XG5cblx0XHQvLyBJZiB0aGVyZSdzIGEgY29uZGl0aW9uIHNwZWNpZmllZCBhbmQgaXQgcmV0dXJucyBmYWxzZSxcblx0XHQvLyBpZ25vcmUgdGhpcyBldmVudFxuXHRcdGlmKCB0eXBlb2YgY29uZmlnLmtleWJvYXJkQ29uZGl0aW9uID09PSAnZnVuY3Rpb24nICYmIGNvbmZpZy5rZXlib2FyZENvbmRpdGlvbigpID09PSBmYWxzZSApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFJlbWVtYmVyIGlmIGF1dG8tc2xpZGluZyB3YXMgcGF1c2VkIHNvIHdlIGNhbiB0b2dnbGUgaXRcblx0XHR2YXIgYXV0b1NsaWRlV2FzUGF1c2VkID0gYXV0b1NsaWRlUGF1c2VkO1xuXG5cdFx0b25Vc2VySW5wdXQoIGV2ZW50ICk7XG5cblx0XHQvLyBDaGVjayBpZiB0aGVyZSdzIGEgZm9jdXNlZCBlbGVtZW50IHRoYXQgY291bGQgYmUgdXNpbmdcblx0XHQvLyB0aGUga2V5Ym9hcmRcblx0XHR2YXIgYWN0aXZlRWxlbWVudElzQ0UgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY29udGVudEVkaXRhYmxlICE9PSAnaW5oZXJpdCc7XG5cdFx0dmFyIGFjdGl2ZUVsZW1lbnRJc0lucHV0ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LnRhZ05hbWUgJiYgL2lucHV0fHRleHRhcmVhL2kudGVzdCggZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50YWdOYW1lICk7XG5cdFx0dmFyIGFjdGl2ZUVsZW1lbnRJc05vdGVzID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNsYXNzTmFtZSAmJiAvc3BlYWtlci1ub3Rlcy9pLnRlc3QoIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY2xhc3NOYW1lKTtcblxuXHRcdC8vIERpc3JlZ2FyZCB0aGUgZXZlbnQgaWYgdGhlcmUncyBhIGZvY3VzZWQgZWxlbWVudCBvciBhXG5cdFx0Ly8ga2V5Ym9hcmQgbW9kaWZpZXIga2V5IGlzIHByZXNlbnRcblx0XHRpZiggYWN0aXZlRWxlbWVudElzQ0UgfHwgYWN0aXZlRWxlbWVudElzSW5wdXQgfHwgYWN0aXZlRWxlbWVudElzTm90ZXMgfHwgKGV2ZW50LnNoaWZ0S2V5ICYmIGV2ZW50LmtleUNvZGUgIT09IDMyKSB8fCBldmVudC5hbHRLZXkgfHwgZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5ICkgcmV0dXJuO1xuXG5cdFx0Ly8gV2hpbGUgcGF1c2VkIG9ubHkgYWxsb3cgcmVzdW1lIGtleWJvYXJkIGV2ZW50czsgJ2InLCAndicsICcuJ1xuXHRcdHZhciByZXN1bWVLZXlDb2RlcyA9IFs2Niw4NiwxOTAsMTkxXTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gQ3VzdG9tIGtleSBiaW5kaW5ncyBmb3IgdG9nZ2xlUGF1c2Ugc2hvdWxkIGJlIGFibGUgdG8gcmVzdW1lXG5cdFx0aWYoIHR5cGVvZiBjb25maWcua2V5Ym9hcmQgPT09ICdvYmplY3QnICkge1xuXHRcdFx0Zm9yKCBrZXkgaW4gY29uZmlnLmtleWJvYXJkICkge1xuXHRcdFx0XHRpZiggY29uZmlnLmtleWJvYXJkW2tleV0gPT09ICd0b2dnbGVQYXVzZScgKSB7XG5cdFx0XHRcdFx0cmVzdW1lS2V5Q29kZXMucHVzaCggcGFyc2VJbnQoIGtleSwgMTAgKSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoIGlzUGF1c2VkKCkgJiYgcmVzdW1lS2V5Q29kZXMuaW5kZXhPZiggZXZlbnQua2V5Q29kZSApID09PSAtMSApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHR2YXIgdHJpZ2dlcmVkID0gZmFsc2U7XG5cblx0XHQvLyAxLiBVc2VyIGRlZmluZWQga2V5IGJpbmRpbmdzXG5cdFx0aWYoIHR5cGVvZiBjb25maWcua2V5Ym9hcmQgPT09ICdvYmplY3QnICkge1xuXG5cdFx0XHRmb3IoIGtleSBpbiBjb25maWcua2V5Ym9hcmQgKSB7XG5cblx0XHRcdFx0Ly8gQ2hlY2sgaWYgdGhpcyBiaW5kaW5nIG1hdGNoZXMgdGhlIHByZXNzZWQga2V5XG5cdFx0XHRcdGlmKCBwYXJzZUludCgga2V5LCAxMCApID09PSBldmVudC5rZXlDb2RlICkge1xuXG5cdFx0XHRcdFx0dmFyIHZhbHVlID0gY29uZmlnLmtleWJvYXJkWyBrZXkgXTtcblxuXHRcdFx0XHRcdC8vIENhbGxiYWNrIGZ1bmN0aW9uXG5cdFx0XHRcdFx0aWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0XHRcdHZhbHVlLmFwcGx5KCBudWxsLCBbIGV2ZW50IF0gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gU3RyaW5nIHNob3J0Y3V0cyB0byByZXZlYWwuanMgQVBJXG5cdFx0XHRcdFx0ZWxzZSBpZiggdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgUmV2ZWFsWyB2YWx1ZSBdID09PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0XHRcdFx0UmV2ZWFsWyB2YWx1ZSBdLmNhbGwoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0cmlnZ2VyZWQgPSB0cnVlO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0Ly8gMi4gU3lzdGVtIGRlZmluZWQga2V5IGJpbmRpbmdzXG5cdFx0aWYoIHRyaWdnZXJlZCA9PT0gZmFsc2UgKSB7XG5cblx0XHRcdC8vIEFzc3VtZSB0cnVlIGFuZCB0cnkgdG8gcHJvdmUgZmFsc2Vcblx0XHRcdHRyaWdnZXJlZCA9IHRydWU7XG5cblx0XHRcdHN3aXRjaCggZXZlbnQua2V5Q29kZSApIHtcblx0XHRcdFx0Ly8gcCwgcGFnZSB1cFxuXHRcdFx0XHRjYXNlIDgwOiBjYXNlIDMzOiBuYXZpZ2F0ZVByZXYoKTsgYnJlYWs7XG5cdFx0XHRcdC8vIG4sIHBhZ2UgZG93blxuXHRcdFx0XHRjYXNlIDc4OiBjYXNlIDM0OiBuYXZpZ2F0ZU5leHQoKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGgsIGxlZnRcblx0XHRcdFx0Y2FzZSA3MjogY2FzZSAzNzogbmF2aWdhdGVMZWZ0KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBsLCByaWdodFxuXHRcdFx0XHRjYXNlIDc2OiBjYXNlIDM5OiBuYXZpZ2F0ZVJpZ2h0KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBrLCB1cFxuXHRcdFx0XHRjYXNlIDc1OiBjYXNlIDM4OiBuYXZpZ2F0ZVVwKCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBqLCBkb3duXG5cdFx0XHRcdGNhc2UgNzQ6IGNhc2UgNDA6IG5hdmlnYXRlRG93bigpOyBicmVhaztcblx0XHRcdFx0Ly8gaG9tZVxuXHRcdFx0XHRjYXNlIDM2OiBzbGlkZSggMCApOyBicmVhaztcblx0XHRcdFx0Ly8gZW5kXG5cdFx0XHRcdGNhc2UgMzU6IHNsaWRlKCBOdW1iZXIuTUFYX1ZBTFVFICk7IGJyZWFrO1xuXHRcdFx0XHQvLyBzcGFjZVxuXHRcdFx0XHRjYXNlIDMyOiBpc092ZXJ2aWV3KCkgPyBkZWFjdGl2YXRlT3ZlcnZpZXcoKSA6IGV2ZW50LnNoaWZ0S2V5ID8gbmF2aWdhdGVQcmV2KCkgOiBuYXZpZ2F0ZU5leHQoKTsgYnJlYWs7XG5cdFx0XHRcdC8vIHJldHVyblxuXHRcdFx0XHRjYXNlIDEzOiBpc092ZXJ2aWV3KCkgPyBkZWFjdGl2YXRlT3ZlcnZpZXcoKSA6IHRyaWdnZXJlZCA9IGZhbHNlOyBicmVhaztcblx0XHRcdFx0Ly8gdHdvLXNwb3QsIHNlbWljb2xvbiwgYiwgdiwgcGVyaW9kLCBMb2dpdGVjaCBwcmVzZW50ZXIgdG9vbHMgXCJibGFjayBzY3JlZW5cIiBidXR0b25cblx0XHRcdFx0Y2FzZSA1ODogY2FzZSA1OTogY2FzZSA2NjogY2FzZSA4NjogY2FzZSAxOTA6IGNhc2UgMTkxOiB0b2dnbGVQYXVzZSgpOyBicmVhaztcblx0XHRcdFx0Ly8gZlxuXHRcdFx0XHRjYXNlIDcwOiBlbnRlckZ1bGxzY3JlZW4oKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGFcblx0XHRcdFx0Y2FzZSA2NTogaWYgKCBjb25maWcuYXV0b1NsaWRlU3RvcHBhYmxlICkgdG9nZ2xlQXV0b1NsaWRlKCBhdXRvU2xpZGVXYXNQYXVzZWQgKTsgYnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0dHJpZ2dlcmVkID0gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgaW5wdXQgcmVzdWx0ZWQgaW4gYSB0cmlnZ2VyZWQgYWN0aW9uIHdlIHNob3VsZCBwcmV2ZW50XG5cdFx0Ly8gdGhlIGJyb3dzZXJzIGRlZmF1bHQgYmVoYXZpb3Jcblx0XHRpZiggdHJpZ2dlcmVkICkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQgJiYgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cdFx0Ly8gRVNDIG9yIE8ga2V5XG5cdFx0ZWxzZSBpZiAoICggZXZlbnQua2V5Q29kZSA9PT0gMjcgfHwgZXZlbnQua2V5Q29kZSA9PT0gNzkgKSAmJiBmZWF0dXJlcy50cmFuc2Zvcm1zM2QgKSB7XG5cdFx0XHRpZiggZG9tLm92ZXJsYXkgKSB7XG5cdFx0XHRcdGNsb3NlT3ZlcmxheSgpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHRvZ2dsZU92ZXJ2aWV3KCk7XG5cdFx0XHR9XG5cblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0ICYmIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgYXV0by1zbGlkaW5nIGlzIGVuYWJsZWQgd2UgbmVlZCB0byBjdWUgdXBcblx0XHQvLyBhbm90aGVyIHRpbWVvdXRcblx0XHRjdWVBdXRvU2xpZGUoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSAndG91Y2hzdGFydCcgZXZlbnQsIGVuYWJsZXMgc3VwcG9ydCBmb3Jcblx0ICogc3dpcGUgYW5kIHBpbmNoIGdlc3R1cmVzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcblx0ICovXG5cdGZ1bmN0aW9uIG9uVG91Y2hTdGFydCggZXZlbnQgKSB7XG5cblx0XHRpZiggaXNTd2lwZVByZXZlbnRlZCggZXZlbnQudGFyZ2V0ICkgKSByZXR1cm4gdHJ1ZTtcblxuXHRcdHRvdWNoLnN0YXJ0WCA9IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHR0b3VjaC5zdGFydFkgPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0dG91Y2guc3RhcnRDb3VudCA9IGV2ZW50LnRvdWNoZXMubGVuZ3RoO1xuXG5cdFx0Ly8gSWYgdGhlcmUncyB0d28gdG91Y2hlcyB3ZSBuZWVkIHRvIG1lbW9yaXplIHRoZSBkaXN0YW5jZVxuXHRcdC8vIGJldHdlZW4gdGhvc2UgdHdvIHBvaW50cyB0byBkZXRlY3QgcGluY2hpbmdcblx0XHRpZiggZXZlbnQudG91Y2hlcy5sZW5ndGggPT09IDIgJiYgY29uZmlnLm92ZXJ2aWV3ICkge1xuXHRcdFx0dG91Y2guc3RhcnRTcGFuID0gZGlzdGFuY2VCZXR3ZWVuKCB7XG5cdFx0XHRcdHg6IGV2ZW50LnRvdWNoZXNbMV0uY2xpZW50WCxcblx0XHRcdFx0eTogZXZlbnQudG91Y2hlc1sxXS5jbGllbnRZXG5cdFx0XHR9LCB7XG5cdFx0XHRcdHg6IHRvdWNoLnN0YXJ0WCxcblx0XHRcdFx0eTogdG91Y2guc3RhcnRZXG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogSGFuZGxlciBmb3IgdGhlICd0b3VjaG1vdmUnIGV2ZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcblx0ICovXG5cdGZ1bmN0aW9uIG9uVG91Y2hNb3ZlKCBldmVudCApIHtcblxuXHRcdGlmKCBpc1N3aXBlUHJldmVudGVkKCBldmVudC50YXJnZXQgKSApIHJldHVybiB0cnVlO1xuXG5cdFx0Ly8gRWFjaCB0b3VjaCBzaG91bGQgb25seSB0cmlnZ2VyIG9uZSBhY3Rpb25cblx0XHRpZiggIXRvdWNoLmNhcHR1cmVkICkge1xuXHRcdFx0b25Vc2VySW5wdXQoIGV2ZW50ICk7XG5cblx0XHRcdHZhciBjdXJyZW50WCA9IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHRcdHZhciBjdXJyZW50WSA9IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WTtcblxuXHRcdFx0Ly8gSWYgdGhlIHRvdWNoIHN0YXJ0ZWQgd2l0aCB0d28gcG9pbnRzIGFuZCBzdGlsbCBoYXNcblx0XHRcdC8vIHR3byBhY3RpdmUgdG91Y2hlczsgdGVzdCBmb3IgdGhlIHBpbmNoIGdlc3R1cmVcblx0XHRcdGlmKCBldmVudC50b3VjaGVzLmxlbmd0aCA9PT0gMiAmJiB0b3VjaC5zdGFydENvdW50ID09PSAyICYmIGNvbmZpZy5vdmVydmlldyApIHtcblxuXHRcdFx0XHQvLyBUaGUgY3VycmVudCBkaXN0YW5jZSBpbiBwaXhlbHMgYmV0d2VlbiB0aGUgdHdvIHRvdWNoIHBvaW50c1xuXHRcdFx0XHR2YXIgY3VycmVudFNwYW4gPSBkaXN0YW5jZUJldHdlZW4oIHtcblx0XHRcdFx0XHR4OiBldmVudC50b3VjaGVzWzFdLmNsaWVudFgsXG5cdFx0XHRcdFx0eTogZXZlbnQudG91Y2hlc1sxXS5jbGllbnRZXG5cdFx0XHRcdH0sIHtcblx0XHRcdFx0XHR4OiB0b3VjaC5zdGFydFgsXG5cdFx0XHRcdFx0eTogdG91Y2guc3RhcnRZXG5cdFx0XHRcdH0gKTtcblxuXHRcdFx0XHQvLyBJZiB0aGUgc3BhbiBpcyBsYXJnZXIgdGhhbiB0aGUgZGVzaXJlIGFtb3VudCB3ZSd2ZSBnb3Rcblx0XHRcdFx0Ly8gb3Vyc2VsdmVzIGEgcGluY2hcblx0XHRcdFx0aWYoIE1hdGguYWJzKCB0b3VjaC5zdGFydFNwYW4gLSBjdXJyZW50U3BhbiApID4gdG91Y2gudGhyZXNob2xkICkge1xuXHRcdFx0XHRcdHRvdWNoLmNhcHR1cmVkID0gdHJ1ZTtcblxuXHRcdFx0XHRcdGlmKCBjdXJyZW50U3BhbiA8IHRvdWNoLnN0YXJ0U3BhbiApIHtcblx0XHRcdFx0XHRcdGFjdGl2YXRlT3ZlcnZpZXcoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRkZWFjdGl2YXRlT3ZlcnZpZXcoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHR9XG5cdFx0XHQvLyBUaGVyZSB3YXMgb25seSBvbmUgdG91Y2ggcG9pbnQsIGxvb2sgZm9yIGEgc3dpcGVcblx0XHRcdGVsc2UgaWYoIGV2ZW50LnRvdWNoZXMubGVuZ3RoID09PSAxICYmIHRvdWNoLnN0YXJ0Q291bnQgIT09IDIgKSB7XG5cblx0XHRcdFx0dmFyIGRlbHRhWCA9IGN1cnJlbnRYIC0gdG91Y2guc3RhcnRYLFxuXHRcdFx0XHRcdGRlbHRhWSA9IGN1cnJlbnRZIC0gdG91Y2guc3RhcnRZO1xuXG5cdFx0XHRcdGlmKCBkZWx0YVggPiB0b3VjaC50aHJlc2hvbGQgJiYgTWF0aC5hYnMoIGRlbHRhWCApID4gTWF0aC5hYnMoIGRlbHRhWSApICkge1xuXHRcdFx0XHRcdHRvdWNoLmNhcHR1cmVkID0gdHJ1ZTtcblx0XHRcdFx0XHRuYXZpZ2F0ZUxlZnQoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKCBkZWx0YVggPCAtdG91Y2gudGhyZXNob2xkICYmIE1hdGguYWJzKCBkZWx0YVggKSA+IE1hdGguYWJzKCBkZWx0YVkgKSApIHtcblx0XHRcdFx0XHR0b3VjaC5jYXB0dXJlZCA9IHRydWU7XG5cdFx0XHRcdFx0bmF2aWdhdGVSaWdodCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYoIGRlbHRhWSA+IHRvdWNoLnRocmVzaG9sZCApIHtcblx0XHRcdFx0XHR0b3VjaC5jYXB0dXJlZCA9IHRydWU7XG5cdFx0XHRcdFx0bmF2aWdhdGVVcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYoIGRlbHRhWSA8IC10b3VjaC50aHJlc2hvbGQgKSB7XG5cdFx0XHRcdFx0dG91Y2guY2FwdHVyZWQgPSB0cnVlO1xuXHRcdFx0XHRcdG5hdmlnYXRlRG93bigpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gSWYgd2UncmUgZW1iZWRkZWQsIG9ubHkgYmxvY2sgdG91Y2ggZXZlbnRzIGlmIHRoZXkgaGF2ZVxuXHRcdFx0XHQvLyB0cmlnZ2VyZWQgYW4gYWN0aW9uXG5cdFx0XHRcdGlmKCBjb25maWcuZW1iZWRkZWQgKSB7XG5cdFx0XHRcdFx0aWYoIHRvdWNoLmNhcHR1cmVkIHx8IGlzVmVydGljYWxTbGlkZSggY3VycmVudFNsaWRlICkgKSB7XG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBOb3QgZW1iZWRkZWQ/IEJsb2NrIHRoZW0gYWxsIHRvIGF2b2lkIG5lZWRsZXNzIHRvc3Npbmdcblx0XHRcdFx0Ly8gYXJvdW5kIG9mIHRoZSB2aWV3cG9ydCBpbiBpT1Ncblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIFRoZXJlJ3MgYSBidWcgd2l0aCBzd2lwaW5nIG9uIHNvbWUgQW5kcm9pZCBkZXZpY2VzIHVubGVzc1xuXHRcdC8vIHRoZSBkZWZhdWx0IGFjdGlvbiBpcyBhbHdheXMgcHJldmVudGVkXG5cdFx0ZWxzZSBpZiggVUEubWF0Y2goIC9hbmRyb2lkL2dpICkgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSAndG91Y2hlbmQnIGV2ZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcblx0ICovXG5cdGZ1bmN0aW9uIG9uVG91Y2hFbmQoIGV2ZW50ICkge1xuXG5cdFx0dG91Y2guY2FwdHVyZWQgPSBmYWxzZTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnQgcG9pbnRlciBkb3duIHRvIHRvdWNoIHN0YXJ0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcblx0ICovXG5cdGZ1bmN0aW9uIG9uUG9pbnRlckRvd24oIGV2ZW50ICkge1xuXG5cdFx0aWYoIGV2ZW50LnBvaW50ZXJUeXBlID09PSBldmVudC5NU1BPSU5URVJfVFlQRV9UT1VDSCB8fCBldmVudC5wb2ludGVyVHlwZSA9PT0gXCJ0b3VjaFwiICkge1xuXHRcdFx0ZXZlbnQudG91Y2hlcyA9IFt7IGNsaWVudFg6IGV2ZW50LmNsaWVudFgsIGNsaWVudFk6IGV2ZW50LmNsaWVudFkgfV07XG5cdFx0XHRvblRvdWNoU3RhcnQoIGV2ZW50ICk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydCBwb2ludGVyIG1vdmUgdG8gdG91Y2ggbW92ZS5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBvblBvaW50ZXJNb3ZlKCBldmVudCApIHtcblxuXHRcdGlmKCBldmVudC5wb2ludGVyVHlwZSA9PT0gZXZlbnQuTVNQT0lOVEVSX1RZUEVfVE9VQ0ggfHwgZXZlbnQucG9pbnRlclR5cGUgPT09IFwidG91Y2hcIiApICB7XG5cdFx0XHRldmVudC50b3VjaGVzID0gW3sgY2xpZW50WDogZXZlbnQuY2xpZW50WCwgY2xpZW50WTogZXZlbnQuY2xpZW50WSB9XTtcblx0XHRcdG9uVG91Y2hNb3ZlKCBldmVudCApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnQgcG9pbnRlciB1cCB0byB0b3VjaCBlbmQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxuXHQgKi9cblx0ZnVuY3Rpb24gb25Qb2ludGVyVXAoIGV2ZW50ICkge1xuXG5cdFx0aWYoIGV2ZW50LnBvaW50ZXJUeXBlID09PSBldmVudC5NU1BPSU5URVJfVFlQRV9UT1VDSCB8fCBldmVudC5wb2ludGVyVHlwZSA9PT0gXCJ0b3VjaFwiICkgIHtcblx0XHRcdGV2ZW50LnRvdWNoZXMgPSBbeyBjbGllbnRYOiBldmVudC5jbGllbnRYLCBjbGllbnRZOiBldmVudC5jbGllbnRZIH1dO1xuXHRcdFx0b25Ub3VjaEVuZCggZXZlbnQgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIG1vdXNlIHdoZWVsIHNjcm9sbGluZywgdGhyb3R0bGVkIHRvIGF2b2lkIHNraXBwaW5nXG5cdCAqIG11bHRpcGxlIHNsaWRlcy5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBvbkRvY3VtZW50TW91c2VTY3JvbGwoIGV2ZW50ICkge1xuXG5cdFx0aWYoIERhdGUubm93KCkgLSBsYXN0TW91c2VXaGVlbFN0ZXAgPiA2MDAgKSB7XG5cblx0XHRcdGxhc3RNb3VzZVdoZWVsU3RlcCA9IERhdGUubm93KCk7XG5cblx0XHRcdHZhciBkZWx0YSA9IGV2ZW50LmRldGFpbCB8fCAtZXZlbnQud2hlZWxEZWx0YTtcblx0XHRcdGlmKCBkZWx0YSA+IDAgKSB7XG5cdFx0XHRcdG5hdmlnYXRlTmV4dCgpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiggZGVsdGEgPCAwICkge1xuXHRcdFx0XHRuYXZpZ2F0ZVByZXYoKTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENsaWNraW5nIG9uIHRoZSBwcm9ncmVzcyBiYXIgcmVzdWx0cyBpbiBhIG5hdmlnYXRpb24gdG8gdGhlXG5cdCAqIGNsb3Nlc3QgYXBwcm94aW1hdGUgaG9yaXpvbnRhbCBzbGlkZSB1c2luZyB0aGlzIGVxdWF0aW9uOlxuXHQgKlxuXHQgKiAoIGNsaWNrWCAvIHByZXNlbnRhdGlvbldpZHRoICkgKiBudW1iZXJPZlNsaWRlc1xuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcblx0ICovXG5cdGZ1bmN0aW9uIG9uUHJvZ3Jlc3NDbGlja2VkKCBldmVudCApIHtcblxuXHRcdG9uVXNlcklucHV0KCBldmVudCApO1xuXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdHZhciBzbGlkZXNUb3RhbCA9IHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKS5sZW5ndGg7XG5cdFx0dmFyIHNsaWRlSW5kZXggPSBNYXRoLmZsb29yKCAoIGV2ZW50LmNsaWVudFggLyBkb20ud3JhcHBlci5vZmZzZXRXaWR0aCApICogc2xpZGVzVG90YWwgKTtcblxuXHRcdGlmKCBjb25maWcucnRsICkge1xuXHRcdFx0c2xpZGVJbmRleCA9IHNsaWRlc1RvdGFsIC0gc2xpZGVJbmRleDtcblx0XHR9XG5cblx0XHRzbGlkZSggc2xpZGVJbmRleCApO1xuXG5cdH1cblxuXHQvKipcblx0ICogRXZlbnQgaGFuZGxlciBmb3IgbmF2aWdhdGlvbiBjb250cm9sIGJ1dHRvbnMuXG5cdCAqL1xuXHRmdW5jdGlvbiBvbk5hdmlnYXRlTGVmdENsaWNrZWQoIGV2ZW50ICkgeyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBvblVzZXJJbnB1dCgpOyBuYXZpZ2F0ZUxlZnQoKTsgfVxuXHRmdW5jdGlvbiBvbk5hdmlnYXRlUmlnaHRDbGlja2VkKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgb25Vc2VySW5wdXQoKTsgbmF2aWdhdGVSaWdodCgpOyB9XG5cdGZ1bmN0aW9uIG9uTmF2aWdhdGVVcENsaWNrZWQoIGV2ZW50ICkgeyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBvblVzZXJJbnB1dCgpOyBuYXZpZ2F0ZVVwKCk7IH1cblx0ZnVuY3Rpb24gb25OYXZpZ2F0ZURvd25DbGlja2VkKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgb25Vc2VySW5wdXQoKTsgbmF2aWdhdGVEb3duKCk7IH1cblx0ZnVuY3Rpb24gb25OYXZpZ2F0ZVByZXZDbGlja2VkKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgb25Vc2VySW5wdXQoKTsgbmF2aWdhdGVQcmV2KCk7IH1cblx0ZnVuY3Rpb24gb25OYXZpZ2F0ZU5leHRDbGlja2VkKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgb25Vc2VySW5wdXQoKTsgbmF2aWdhdGVOZXh0KCk7IH1cblxuXHQvKipcblx0ICogSGFuZGxlciBmb3IgdGhlIHdpbmRvdyBsZXZlbCAnaGFzaGNoYW5nZScgZXZlbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbZXZlbnRdXG5cdCAqL1xuXHRmdW5jdGlvbiBvbldpbmRvd0hhc2hDaGFuZ2UoIGV2ZW50ICkge1xuXG5cdFx0cmVhZFVSTCgpO1xuXG5cdH1cblxuXHQvKipcblx0ICogSGFuZGxlciBmb3IgdGhlIHdpbmRvdyBsZXZlbCAncmVzaXplJyBldmVudC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IFtldmVudF1cblx0ICovXG5cdGZ1bmN0aW9uIG9uV2luZG93UmVzaXplKCBldmVudCApIHtcblxuXHRcdGxheW91dCgpO1xuXG5cdH1cblxuXHQvKipcblx0ICogSGFuZGxlIGZvciB0aGUgd2luZG93IGxldmVsICd2aXNpYmlsaXR5Y2hhbmdlJyBldmVudC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IFtldmVudF1cblx0ICovXG5cdGZ1bmN0aW9uIG9uUGFnZVZpc2liaWxpdHlDaGFuZ2UoIGV2ZW50ICkge1xuXG5cdFx0dmFyIGlzSGlkZGVuID0gIGRvY3VtZW50LndlYmtpdEhpZGRlbiB8fFxuXHRcdFx0XHRcdFx0ZG9jdW1lbnQubXNIaWRkZW4gfHxcblx0XHRcdFx0XHRcdGRvY3VtZW50LmhpZGRlbjtcblxuXHRcdC8vIElmLCBhZnRlciBjbGlja2luZyBhIGxpbmsgb3Igc2ltaWxhciBhbmQgd2UncmUgY29taW5nIGJhY2ssXG5cdFx0Ly8gZm9jdXMgdGhlIGRvY3VtZW50LmJvZHkgdG8gZW5zdXJlIHdlIGNhbiB1c2Uga2V5Ym9hcmQgc2hvcnRjdXRzXG5cdFx0aWYoIGlzSGlkZGVuID09PSBmYWxzZSAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSBkb2N1bWVudC5ib2R5ICkge1xuXHRcdFx0Ly8gTm90IGFsbCBlbGVtZW50cyBzdXBwb3J0IC5ibHVyKCkgLSBTVkdzIGFtb25nIHRoZW0uXG5cdFx0XHRpZiggdHlwZW9mIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1ciA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0XHR9XG5cdFx0XHRkb2N1bWVudC5ib2R5LmZvY3VzKCk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogSW52b2tlZCB3aGVuIGEgc2xpZGUgaXMgYW5kIHdlJ3JlIGluIHRoZSBvdmVydmlldy5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBvbk92ZXJ2aWV3U2xpZGVDbGlja2VkKCBldmVudCApIHtcblxuXHRcdC8vIFRPRE8gVGhlcmUncyBhIGJ1ZyBoZXJlIHdoZXJlIHRoZSBldmVudCBsaXN0ZW5lcnMgYXJlIG5vdFxuXHRcdC8vIHJlbW92ZWQgYWZ0ZXIgZGVhY3RpdmF0aW5nIHRoZSBvdmVydmlldy5cblx0XHRpZiggZXZlbnRzQXJlQm91bmQgJiYgaXNPdmVydmlldygpICkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0dmFyIGVsZW1lbnQgPSBldmVudC50YXJnZXQ7XG5cblx0XHRcdHdoaWxlKCBlbGVtZW50ICYmICFlbGVtZW50Lm5vZGVOYW1lLm1hdGNoKCAvc2VjdGlvbi9naSApICkge1xuXHRcdFx0XHRlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggZWxlbWVudCAmJiAhZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoICdkaXNhYmxlZCcgKSApIHtcblxuXHRcdFx0XHRkZWFjdGl2YXRlT3ZlcnZpZXcoKTtcblxuXHRcdFx0XHRpZiggZWxlbWVudC5ub2RlTmFtZS5tYXRjaCggL3NlY3Rpb24vZ2kgKSApIHtcblx0XHRcdFx0XHR2YXIgaCA9IHBhcnNlSW50KCBlbGVtZW50LmdldEF0dHJpYnV0ZSggJ2RhdGEtaW5kZXgtaCcgKSwgMTAgKSxcblx0XHRcdFx0XHRcdHYgPSBwYXJzZUludCggZWxlbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LXYnICksIDEwICk7XG5cblx0XHRcdFx0XHRzbGlkZSggaCwgdiApO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGNsaWNrcyBvbiBsaW5rcyB0aGF0IGFyZSBzZXQgdG8gcHJldmlldyBpbiB0aGVcblx0ICogaWZyYW1lIG92ZXJsYXkuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxuXHQgKi9cblx0ZnVuY3Rpb24gb25QcmV2aWV3TGlua0NsaWNrZWQoIGV2ZW50ICkge1xuXG5cdFx0aWYoIGV2ZW50LmN1cnJlbnRUYXJnZXQgJiYgZXZlbnQuY3VycmVudFRhcmdldC5oYXNBdHRyaWJ1dGUoICdocmVmJyApICkge1xuXHRcdFx0dmFyIHVybCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKCAnaHJlZicgKTtcblx0XHRcdGlmKCB1cmwgKSB7XG5cdFx0XHRcdHNob3dQcmV2aWV3KCB1cmwgKTtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGNsaWNrIG9uIHRoZSBhdXRvLXNsaWRpbmcgY29udHJvbHMgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IFtldmVudF1cblx0ICovXG5cdGZ1bmN0aW9uIG9uQXV0b1NsaWRlUGxheWVyQ2xpY2soIGV2ZW50ICkge1xuXG5cdFx0Ly8gUmVwbGF5XG5cdFx0aWYoIFJldmVhbC5pc0xhc3RTbGlkZSgpICYmIGNvbmZpZy5sb29wID09PSBmYWxzZSApIHtcblx0XHRcdHNsaWRlKCAwLCAwICk7XG5cdFx0XHRyZXN1bWVBdXRvU2xpZGUoKTtcblx0XHR9XG5cdFx0Ly8gUmVzdW1lXG5cdFx0ZWxzZSBpZiggYXV0b1NsaWRlUGF1c2VkICkge1xuXHRcdFx0cmVzdW1lQXV0b1NsaWRlKCk7XG5cdFx0fVxuXHRcdC8vIFBhdXNlXG5cdFx0ZWxzZSB7XG5cdFx0XHRwYXVzZUF1dG9TbGlkZSgpO1xuXHRcdH1cblxuXHR9XG5cblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQTEFZQkFDSyBDT01QT05FTlQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5cblx0LyoqXG5cdCAqIENvbnN0cnVjdG9yIGZvciB0aGUgcGxheWJhY2sgY29tcG9uZW50LCB3aGljaCBkaXNwbGF5c1xuXHQgKiBwbGF5L3BhdXNlL3Byb2dyZXNzIGNvbnRyb2xzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgVGhlIGNvbXBvbmVudCB3aWxsIGFwcGVuZFxuXHQgKiBpdHNlbGYgdG8gdGhpc1xuXHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9ncmVzc0NoZWNrIEEgbWV0aG9kIHdoaWNoIHdpbGwgYmVcblx0ICogY2FsbGVkIGZyZXF1ZW50bHkgdG8gZ2V0IHRoZSBjdXJyZW50IHByb2dyZXNzIG9uIGEgcmFuZ2Vcblx0ICogb2YgMC0xXG5cdCAqL1xuXHRmdW5jdGlvbiBQbGF5YmFjayggY29udGFpbmVyLCBwcm9ncmVzc0NoZWNrICkge1xuXG5cdFx0Ly8gQ29zbWV0aWNzXG5cdFx0dGhpcy5kaWFtZXRlciA9IDEwMDtcblx0XHR0aGlzLmRpYW1ldGVyMiA9IHRoaXMuZGlhbWV0ZXIvMjtcblx0XHR0aGlzLnRoaWNrbmVzcyA9IDY7XG5cblx0XHQvLyBGbGFncyBpZiB3ZSBhcmUgY3VycmVudGx5IHBsYXlpbmdcblx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcblxuXHRcdC8vIEN1cnJlbnQgcHJvZ3Jlc3Mgb24gYSAwLTEgcmFuZ2Vcblx0XHR0aGlzLnByb2dyZXNzID0gMDtcblxuXHRcdC8vIFVzZWQgdG8gbG9vcCB0aGUgYW5pbWF0aW9uIHNtb290aGx5XG5cdFx0dGhpcy5wcm9ncmVzc09mZnNldCA9IDE7XG5cblx0XHR0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcblx0XHR0aGlzLnByb2dyZXNzQ2hlY2sgPSBwcm9ncmVzc0NoZWNrO1xuXG5cdFx0dGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xuXHRcdHRoaXMuY2FudmFzLmNsYXNzTmFtZSA9ICdwbGF5YmFjayc7XG5cdFx0dGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmRpYW1ldGVyO1xuXHRcdHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuZGlhbWV0ZXI7XG5cdFx0dGhpcy5jYW52YXMuc3R5bGUud2lkdGggPSB0aGlzLmRpYW1ldGVyMiArICdweCc7XG5cdFx0dGhpcy5jYW52YXMuc3R5bGUuaGVpZ2h0ID0gdGhpcy5kaWFtZXRlcjIgKyAncHgnO1xuXHRcdHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoICcyZCcgKTtcblxuXHRcdHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKCB0aGlzLmNhbnZhcyApO1xuXG5cdFx0dGhpcy5yZW5kZXIoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB2YWx1ZVxuXHQgKi9cblx0UGxheWJhY2sucHJvdG90eXBlLnNldFBsYXlpbmcgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG5cblx0XHR2YXIgd2FzUGxheWluZyA9IHRoaXMucGxheWluZztcblxuXHRcdHRoaXMucGxheWluZyA9IHZhbHVlO1xuXG5cdFx0Ly8gU3RhcnQgcmVwYWludGluZyBpZiB3ZSB3ZXJlbid0IGFscmVhZHlcblx0XHRpZiggIXdhc1BsYXlpbmcgJiYgdGhpcy5wbGF5aW5nICkge1xuXHRcdFx0dGhpcy5hbmltYXRlKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR9XG5cblx0fTtcblxuXHRQbGF5YmFjay5wcm90b3R5cGUuYW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyIHByb2dyZXNzQmVmb3JlID0gdGhpcy5wcm9ncmVzcztcblxuXHRcdHRoaXMucHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzQ2hlY2soKTtcblxuXHRcdC8vIFdoZW4gd2UgbG9vcCwgb2Zmc2V0IHRoZSBwcm9ncmVzcyBzbyB0aGF0IGl0IGVhc2VzXG5cdFx0Ly8gc21vb3RobHkgcmF0aGVyIHRoYW4gaW1tZWRpYXRlbHkgcmVzZXR0aW5nXG5cdFx0aWYoIHByb2dyZXNzQmVmb3JlID4gMC44ICYmIHRoaXMucHJvZ3Jlc3MgPCAwLjIgKSB7XG5cdFx0XHR0aGlzLnByb2dyZXNzT2Zmc2V0ID0gdGhpcy5wcm9ncmVzcztcblx0XHR9XG5cblx0XHR0aGlzLnJlbmRlcigpO1xuXG5cdFx0aWYoIHRoaXMucGxheWluZyApIHtcblx0XHRcdGZlYXR1cmVzLnJlcXVlc3RBbmltYXRpb25GcmFtZU1ldGhvZC5jYWxsKCB3aW5kb3csIHRoaXMuYW5pbWF0ZS5iaW5kKCB0aGlzICkgKTtcblx0XHR9XG5cblx0fTtcblxuXHQvKipcblx0ICogUmVuZGVycyB0aGUgY3VycmVudCBwcm9ncmVzcyBhbmQgcGxheWJhY2sgc3RhdGUuXG5cdCAqL1xuXHRQbGF5YmFjay5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgcHJvZ3Jlc3MgPSB0aGlzLnBsYXlpbmcgPyB0aGlzLnByb2dyZXNzIDogMCxcblx0XHRcdHJhZGl1cyA9ICggdGhpcy5kaWFtZXRlcjIgKSAtIHRoaXMudGhpY2tuZXNzLFxuXHRcdFx0eCA9IHRoaXMuZGlhbWV0ZXIyLFxuXHRcdFx0eSA9IHRoaXMuZGlhbWV0ZXIyLFxuXHRcdFx0aWNvblNpemUgPSAyODtcblxuXHRcdC8vIEVhc2UgdG93YXJkcyAxXG5cdFx0dGhpcy5wcm9ncmVzc09mZnNldCArPSAoIDEgLSB0aGlzLnByb2dyZXNzT2Zmc2V0ICkgKiAwLjE7XG5cblx0XHR2YXIgZW5kQW5nbGUgPSAoIC0gTWF0aC5QSSAvIDIgKSArICggcHJvZ3Jlc3MgKiAoIE1hdGguUEkgKiAyICkgKTtcblx0XHR2YXIgc3RhcnRBbmdsZSA9ICggLSBNYXRoLlBJIC8gMiApICsgKCB0aGlzLnByb2dyZXNzT2Zmc2V0ICogKCBNYXRoLlBJICogMiApICk7XG5cblx0XHR0aGlzLmNvbnRleHQuc2F2ZSgpO1xuXHRcdHRoaXMuY29udGV4dC5jbGVhclJlY3QoIDAsIDAsIHRoaXMuZGlhbWV0ZXIsIHRoaXMuZGlhbWV0ZXIgKTtcblxuXHRcdC8vIFNvbGlkIGJhY2tncm91bmQgY29sb3Jcblx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0dGhpcy5jb250ZXh0LmFyYyggeCwgeSwgcmFkaXVzICsgNCwgMCwgTWF0aC5QSSAqIDIsIGZhbHNlICk7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKCAwLCAwLCAwLCAwLjQgKSc7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGwoKTtcblxuXHRcdC8vIERyYXcgcHJvZ3Jlc3MgdHJhY2tcblx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0dGhpcy5jb250ZXh0LmFyYyggeCwgeSwgcmFkaXVzLCAwLCBNYXRoLlBJICogMiwgZmFsc2UgKTtcblx0XHR0aGlzLmNvbnRleHQubGluZVdpZHRoID0gdGhpcy50aGlja25lc3M7XG5cdFx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gJyM2NjYnO1xuXHRcdHRoaXMuY29udGV4dC5zdHJva2UoKTtcblxuXHRcdGlmKCB0aGlzLnBsYXlpbmcgKSB7XG5cdFx0XHQvLyBEcmF3IHByb2dyZXNzIG9uIHRvcCBvZiB0cmFja1xuXHRcdFx0dGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuXHRcdFx0dGhpcy5jb250ZXh0LmFyYyggeCwgeSwgcmFkaXVzLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSwgZmFsc2UgKTtcblx0XHRcdHRoaXMuY29udGV4dC5saW5lV2lkdGggPSB0aGlzLnRoaWNrbmVzcztcblx0XHRcdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9ICcjZmZmJztcblx0XHRcdHRoaXMuY29udGV4dC5zdHJva2UoKTtcblx0XHR9XG5cblx0XHR0aGlzLmNvbnRleHQudHJhbnNsYXRlKCB4IC0gKCBpY29uU2l6ZSAvIDIgKSwgeSAtICggaWNvblNpemUgLyAyICkgKTtcblxuXHRcdC8vIERyYXcgcGxheS9wYXVzZSBpY29uc1xuXHRcdGlmKCB0aGlzLnBsYXlpbmcgKSB7XG5cdFx0XHR0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJyNmZmYnO1xuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxSZWN0KCAwLCAwLCBpY29uU2l6ZSAvIDIgLSA0LCBpY29uU2l6ZSApO1xuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxSZWN0KCBpY29uU2l6ZSAvIDIgKyA0LCAwLCBpY29uU2l6ZSAvIDIgLSA0LCBpY29uU2l6ZSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdHRoaXMuY29udGV4dC50cmFuc2xhdGUoIDQsIDAgKTtcblx0XHRcdHRoaXMuY29udGV4dC5tb3ZlVG8oIDAsIDAgKTtcblx0XHRcdHRoaXMuY29udGV4dC5saW5lVG8oIGljb25TaXplIC0gNCwgaWNvblNpemUgLyAyICk7XG5cdFx0XHR0aGlzLmNvbnRleHQubGluZVRvKCAwLCBpY29uU2l6ZSApO1xuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICcjZmZmJztcblx0XHRcdHRoaXMuY29udGV4dC5maWxsKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5jb250ZXh0LnJlc3RvcmUoKTtcblxuXHR9O1xuXG5cdFBsYXliYWNrLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKCB0eXBlLCBsaXN0ZW5lciApIHtcblx0XHR0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciwgZmFsc2UgKTtcblx0fTtcblxuXHRQbGF5YmFjay5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oIHR5cGUsIGxpc3RlbmVyICkge1xuXHRcdHRoaXMuY2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoIHR5cGUsIGxpc3RlbmVyLCBmYWxzZSApO1xuXHR9O1xuXG5cdFBsYXliYWNrLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG5cblx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcblxuXHRcdGlmKCB0aGlzLmNhbnZhcy5wYXJlbnROb2RlICkge1xuXHRcdFx0dGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQoIHRoaXMuY2FudmFzICk7XG5cdFx0fVxuXG5cdH07XG5cblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5cblx0UmV2ZWFsID0ge1xuXHRcdFZFUlNJT046IFZFUlNJT04sXG5cblx0XHRpbml0aWFsaXplOiBpbml0aWFsaXplLFxuXHRcdGNvbmZpZ3VyZTogY29uZmlndXJlLFxuXHRcdHN5bmM6IHN5bmMsXG5cblx0XHQvLyBOYXZpZ2F0aW9uIG1ldGhvZHNcblx0XHRzbGlkZTogc2xpZGUsXG5cdFx0bGVmdDogbmF2aWdhdGVMZWZ0LFxuXHRcdHJpZ2h0OiBuYXZpZ2F0ZVJpZ2h0LFxuXHRcdHVwOiBuYXZpZ2F0ZVVwLFxuXHRcdGRvd246IG5hdmlnYXRlRG93bixcblx0XHRwcmV2OiBuYXZpZ2F0ZVByZXYsXG5cdFx0bmV4dDogbmF2aWdhdGVOZXh0LFxuXG5cdFx0Ly8gRnJhZ21lbnQgbWV0aG9kc1xuXHRcdG5hdmlnYXRlRnJhZ21lbnQ6IG5hdmlnYXRlRnJhZ21lbnQsXG5cdFx0cHJldkZyYWdtZW50OiBwcmV2aW91c0ZyYWdtZW50LFxuXHRcdG5leHRGcmFnbWVudDogbmV4dEZyYWdtZW50LFxuXG5cdFx0Ly8gRGVwcmVjYXRlZCBhbGlhc2VzXG5cdFx0bmF2aWdhdGVUbzogc2xpZGUsXG5cdFx0bmF2aWdhdGVMZWZ0OiBuYXZpZ2F0ZUxlZnQsXG5cdFx0bmF2aWdhdGVSaWdodDogbmF2aWdhdGVSaWdodCxcblx0XHRuYXZpZ2F0ZVVwOiBuYXZpZ2F0ZVVwLFxuXHRcdG5hdmlnYXRlRG93bjogbmF2aWdhdGVEb3duLFxuXHRcdG5hdmlnYXRlUHJldjogbmF2aWdhdGVQcmV2LFxuXHRcdG5hdmlnYXRlTmV4dDogbmF2aWdhdGVOZXh0LFxuXG5cdFx0Ly8gRm9yY2VzIGFuIHVwZGF0ZSBpbiBzbGlkZSBsYXlvdXRcblx0XHRsYXlvdXQ6IGxheW91dCxcblxuXHRcdC8vIFJhbmRvbWl6ZXMgdGhlIG9yZGVyIG9mIHNsaWRlc1xuXHRcdHNodWZmbGU6IHNodWZmbGUsXG5cblx0XHQvLyBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSBhdmFpbGFibGUgcm91dGVzIGFzIGJvb2xlYW5zIChsZWZ0L3JpZ2h0L3RvcC9ib3R0b20pXG5cdFx0YXZhaWxhYmxlUm91dGVzOiBhdmFpbGFibGVSb3V0ZXMsXG5cblx0XHQvLyBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSBhdmFpbGFibGUgZnJhZ21lbnRzIGFzIGJvb2xlYW5zIChwcmV2L25leHQpXG5cdFx0YXZhaWxhYmxlRnJhZ21lbnRzOiBhdmFpbGFibGVGcmFnbWVudHMsXG5cblx0XHQvLyBUb2dnbGVzIGEgaGVscCBvdmVybGF5IHdpdGgga2V5Ym9hcmQgc2hvcnRjdXRzXG5cdFx0dG9nZ2xlSGVscDogdG9nZ2xlSGVscCxcblxuXHRcdC8vIFRvZ2dsZXMgdGhlIG92ZXJ2aWV3IG1vZGUgb24vb2ZmXG5cdFx0dG9nZ2xlT3ZlcnZpZXc6IHRvZ2dsZU92ZXJ2aWV3LFxuXG5cdFx0Ly8gVG9nZ2xlcyB0aGUgXCJibGFjayBzY3JlZW5cIiBtb2RlIG9uL29mZlxuXHRcdHRvZ2dsZVBhdXNlOiB0b2dnbGVQYXVzZSxcblxuXHRcdC8vIFRvZ2dsZXMgdGhlIGF1dG8gc2xpZGUgbW9kZSBvbi9vZmZcblx0XHR0b2dnbGVBdXRvU2xpZGU6IHRvZ2dsZUF1dG9TbGlkZSxcblxuXHRcdC8vIFN0YXRlIGNoZWNrc1xuXHRcdGlzT3ZlcnZpZXc6IGlzT3ZlcnZpZXcsXG5cdFx0aXNQYXVzZWQ6IGlzUGF1c2VkLFxuXHRcdGlzQXV0b1NsaWRpbmc6IGlzQXV0b1NsaWRpbmcsXG5cblx0XHQvLyBBZGRzIG9yIHJlbW92ZXMgYWxsIGludGVybmFsIGV2ZW50IGxpc3RlbmVycyAoc3VjaCBhcyBrZXlib2FyZClcblx0XHRhZGRFdmVudExpc3RlbmVyczogYWRkRXZlbnRMaXN0ZW5lcnMsXG5cdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcnM6IHJlbW92ZUV2ZW50TGlzdGVuZXJzLFxuXG5cdFx0Ly8gRmFjaWxpdHkgZm9yIHBlcnNpc3RpbmcgYW5kIHJlc3RvcmluZyB0aGUgcHJlc2VudGF0aW9uIHN0YXRlXG5cdFx0Z2V0U3RhdGU6IGdldFN0YXRlLFxuXHRcdHNldFN0YXRlOiBzZXRTdGF0ZSxcblxuXHRcdC8vIFByZXNlbnRhdGlvbiBwcm9ncmVzc1xuXHRcdGdldFNsaWRlUGFzdENvdW50OiBnZXRTbGlkZVBhc3RDb3VudCxcblxuXHRcdC8vIFByZXNlbnRhdGlvbiBwcm9ncmVzcyBvbiByYW5nZSBvZiAwLTFcblx0XHRnZXRQcm9ncmVzczogZ2V0UHJvZ3Jlc3MsXG5cblx0XHQvLyBSZXR1cm5zIHRoZSBpbmRpY2VzIG9mIHRoZSBjdXJyZW50LCBvciBzcGVjaWZpZWQsIHNsaWRlXG5cdFx0Z2V0SW5kaWNlczogZ2V0SW5kaWNlcyxcblxuXHRcdC8vIFJldHVybnMgYW4gQXJyYXkgb2YgYWxsIHNsaWRlc1xuXHRcdGdldFNsaWRlczogZ2V0U2xpZGVzLFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgdG90YWwgbnVtYmVyIG9mIHNsaWRlc1xuXHRcdGdldFRvdGFsU2xpZGVzOiBnZXRUb3RhbFNsaWRlcyxcblxuXHRcdC8vIFJldHVybnMgdGhlIHNsaWRlIGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCBpbmRleFxuXHRcdGdldFNsaWRlOiBnZXRTbGlkZSxcblxuXHRcdC8vIFJldHVybnMgdGhlIHNsaWRlIGJhY2tncm91bmQgZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIGluZGV4XG5cdFx0Z2V0U2xpZGVCYWNrZ3JvdW5kOiBnZXRTbGlkZUJhY2tncm91bmQsXG5cblx0XHQvLyBSZXR1cm5zIHRoZSBzcGVha2VyIG5vdGVzIHN0cmluZyBmb3IgYSBzbGlkZSwgb3IgbnVsbFxuXHRcdGdldFNsaWRlTm90ZXM6IGdldFNsaWRlTm90ZXMsXG5cblx0XHQvLyBSZXR1cm5zIHRoZSBwcmV2aW91cyBzbGlkZSBlbGVtZW50LCBtYXkgYmUgbnVsbFxuXHRcdGdldFByZXZpb3VzU2xpZGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHByZXZpb3VzU2xpZGU7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybnMgdGhlIGN1cnJlbnQgc2xpZGUgZWxlbWVudFxuXHRcdGdldEN1cnJlbnRTbGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY3VycmVudFNsaWRlO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm5zIHRoZSBjdXJyZW50IHNjYWxlIG9mIHRoZSBwcmVzZW50YXRpb24gY29udGVudFxuXHRcdGdldFNjYWxlOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBzY2FsZTtcblx0XHR9LFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uIG9iamVjdFxuXHRcdGdldENvbmZpZzogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY29uZmlnO1xuXHRcdH0sXG5cblx0XHQvLyBIZWxwZXIgbWV0aG9kLCByZXRyaWV2ZXMgcXVlcnkgc3RyaW5nIGFzIGEga2V5L3ZhbHVlIGhhc2hcblx0XHRnZXRRdWVyeUhhc2g6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHF1ZXJ5ID0ge307XG5cblx0XHRcdGxvY2F0aW9uLnNlYXJjaC5yZXBsYWNlKCAvW0EtWjAtOV0rPz0oW1xcd1xcLiUtXSopL2dpLCBmdW5jdGlvbihhKSB7XG5cdFx0XHRcdHF1ZXJ5WyBhLnNwbGl0KCAnPScgKS5zaGlmdCgpIF0gPSBhLnNwbGl0KCAnPScgKS5wb3AoKTtcblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gQmFzaWMgZGVzZXJpYWxpemF0aW9uXG5cdFx0XHRmb3IoIHZhciBpIGluIHF1ZXJ5ICkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSBxdWVyeVsgaSBdO1xuXG5cdFx0XHRcdHF1ZXJ5WyBpIF0gPSBkZXNlcmlhbGl6ZSggdW5lc2NhcGUoIHZhbHVlICkgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHF1ZXJ5O1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm5zIHRydWUgaWYgd2UncmUgY3VycmVudGx5IG9uIHRoZSBmaXJzdCBzbGlkZVxuXHRcdGlzRmlyc3RTbGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gKCBpbmRleGggPT09IDAgJiYgaW5kZXh2ID09PSAwICk7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybnMgdHJ1ZSBpZiB3ZSdyZSBjdXJyZW50bHkgb24gdGhlIGxhc3Qgc2xpZGVcblx0XHRpc0xhc3RTbGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiggY3VycmVudFNsaWRlICkge1xuXHRcdFx0XHQvLyBEb2VzIHRoaXMgc2xpZGUgaGFzIG5leHQgYSBzaWJsaW5nP1xuXHRcdFx0XHRpZiggY3VycmVudFNsaWRlLm5leHRFbGVtZW50U2libGluZyApIHJldHVybiBmYWxzZTtcblxuXHRcdFx0XHQvLyBJZiBpdCdzIHZlcnRpY2FsLCBkb2VzIGl0cyBwYXJlbnQgaGF2ZSBhIG5leHQgc2libGluZz9cblx0XHRcdFx0aWYoIGlzVmVydGljYWxTbGlkZSggY3VycmVudFNsaWRlICkgJiYgY3VycmVudFNsaWRlLnBhcmVudE5vZGUubmV4dEVsZW1lbnRTaWJsaW5nICkgcmV0dXJuIGZhbHNlO1xuXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fSxcblxuXHRcdC8vIENoZWNrcyBpZiByZXZlYWwuanMgaGFzIGJlZW4gbG9hZGVkIGFuZCBpcyByZWFkeSBmb3IgdXNlXG5cdFx0aXNSZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gbG9hZGVkO1xuXHRcdH0sXG5cblx0XHQvLyBGb3J3YXJkIGV2ZW50IGJpbmRpbmcgdG8gdGhlIHJldmVhbCBET00gZWxlbWVudFxuXHRcdGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSApIHtcblx0XHRcdGlmKCAnYWRkRXZlbnRMaXN0ZW5lcicgaW4gd2luZG93ICkge1xuXHRcdFx0XHQoIGRvbS53cmFwcGVyIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoICcucmV2ZWFsJyApICkuYWRkRXZlbnRMaXN0ZW5lciggdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUgKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSApIHtcblx0XHRcdGlmKCAnYWRkRXZlbnRMaXN0ZW5lcicgaW4gd2luZG93ICkge1xuXHRcdFx0XHQoIGRvbS53cmFwcGVyIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoICcucmV2ZWFsJyApICkucmVtb3ZlRXZlbnRMaXN0ZW5lciggdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUgKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Ly8gUHJvZ3JhbWF0aWNhbGx5IHRyaWdnZXJzIGEga2V5Ym9hcmQgZXZlbnRcblx0XHR0cmlnZ2VyS2V5OiBmdW5jdGlvbigga2V5Q29kZSApIHtcblx0XHRcdG9uRG9jdW1lbnRLZXlEb3duKCB7IGtleUNvZGU6IGtleUNvZGUgfSApO1xuXHRcdH0sXG5cblx0XHQvLyBSZWdpc3RlcnMgYSBuZXcgc2hvcnRjdXQgdG8gaW5jbHVkZSBpbiB0aGUgaGVscCBvdmVybGF5XG5cdFx0cmVnaXN0ZXJLZXlib2FyZFNob3J0Y3V0OiBmdW5jdGlvbigga2V5LCB2YWx1ZSApIHtcblx0XHRcdGtleWJvYXJkU2hvcnRjdXRzW2tleV0gPSB2YWx1ZTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFJldmVhbDtcblxufSkpO1xuIiwiLyoqXG4gKiBUaGUgcmV2ZWFsLmpzIG1hcmtkb3duIHBsdWdpbi4gSGFuZGxlcyBwYXJzaW5nIG9mXG4gKiBtYXJrZG93biBpbnNpZGUgb2YgcHJlc2VudGF0aW9ucyBhcyB3ZWxsIGFzIGxvYWRpbmdcbiAqIG9mIGV4dGVybmFsIG1hcmtkb3duIGRvY3VtZW50cy5cbiAqL1xuKGZ1bmN0aW9uKCByb290LCBmYWN0b3J5ICkge1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0cm9vdC5tYXJrZWQgPSByZXF1aXJlKCAnLi9tYXJrZWQnICk7XG5cdFx0cm9vdC5SZXZlYWxNYXJrZG93biA9IGZhY3RvcnkoIHJvb3QubWFya2VkICk7XG5cdFx0cm9vdC5SZXZlYWxNYXJrZG93bi5pbml0aWFsaXplKCk7XG5cdH0gZWxzZSBpZiggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSggcmVxdWlyZSggJy4vbWFya2VkJyApICk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gQnJvd3NlciBnbG9iYWxzIChyb290IGlzIHdpbmRvdylcblx0XHRyb290LlJldmVhbE1hcmtkb3duID0gZmFjdG9yeSggcm9vdC5tYXJrZWQgKTtcblx0XHRyb290LlJldmVhbE1hcmtkb3duLmluaXRpYWxpemUoKTtcblx0fVxufSggdGhpcywgZnVuY3Rpb24oIG1hcmtlZCApIHtcblxuXHR2YXIgREVGQVVMVF9TTElERV9TRVBBUkFUT1IgPSAnXlxccj9cXG4tLS1cXHI/XFxuJCcsXG5cdFx0REVGQVVMVF9OT1RFU19TRVBBUkFUT1IgPSAnbm90ZTonLFxuXHRcdERFRkFVTFRfRUxFTUVOVF9BVFRSSUJVVEVTX1NFUEFSQVRPUiA9ICdcXFxcXFwuZWxlbWVudFxcXFxcXHMqPyguKz8pJCcsXG5cdFx0REVGQVVMVF9TTElERV9BVFRSSUJVVEVTX1NFUEFSQVRPUiA9ICdcXFxcXFwuc2xpZGU6XFxcXFxccyo/KFxcXFxcXFMuKz8pJCc7XG5cblx0dmFyIFNDUklQVF9FTkRfUExBQ0VIT0xERVIgPSAnX19TQ1JJUFRfRU5EX18nO1xuXG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgbWFya2Rvd24gY29udGVudHMgb2YgYSBzbGlkZSBzZWN0aW9uXG5cdCAqIGVsZW1lbnQuIE5vcm1hbGl6ZXMgbGVhZGluZyB0YWJzL3doaXRlc3BhY2UuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRNYXJrZG93bkZyb21TbGlkZSggc2VjdGlvbiApIHtcblxuXHRcdC8vIGxvb2sgZm9yIGEgPHNjcmlwdD4gb3IgPHRleHRhcmVhIGRhdGEtdGVtcGxhdGU+IHdyYXBwZXJcblx0XHR2YXIgdGVtcGxhdGUgPSBzZWN0aW9uLnF1ZXJ5U2VsZWN0b3IoICdbZGF0YS10ZW1wbGF0ZV0nICkgfHwgc2VjdGlvbi5xdWVyeVNlbGVjdG9yKCAnc2NyaXB0JyApO1xuXG5cdFx0Ly8gc3RyaXAgbGVhZGluZyB3aGl0ZXNwYWNlIHNvIGl0IGlzbid0IGV2YWx1YXRlZCBhcyBjb2RlXG5cdFx0dmFyIHRleHQgPSAoIHRlbXBsYXRlIHx8IHNlY3Rpb24gKS50ZXh0Q29udGVudDtcblxuXHRcdC8vIHJlc3RvcmUgc2NyaXB0IGVuZCB0YWdzXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSggbmV3IFJlZ0V4cCggU0NSSVBUX0VORF9QTEFDRUhPTERFUiwgJ2cnICksICc8L3NjcmlwdD4nICk7XG5cblx0XHR2YXIgbGVhZGluZ1dzID0gdGV4dC5tYXRjaCggL15cXG4/KFxccyopLyApWzFdLmxlbmd0aCxcblx0XHRcdGxlYWRpbmdUYWJzID0gdGV4dC5tYXRjaCggL15cXG4/KFxcdCopLyApWzFdLmxlbmd0aDtcblxuXHRcdGlmKCBsZWFkaW5nVGFicyA+IDAgKSB7XG5cdFx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKCBuZXcgUmVnRXhwKCdcXFxcbj9cXFxcdHsnICsgbGVhZGluZ1RhYnMgKyAnfScsJ2cnKSwgJ1xcbicgKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiggbGVhZGluZ1dzID4gMSApIHtcblx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoIG5ldyBSZWdFeHAoJ1xcXFxuPyB7JyArIGxlYWRpbmdXcyArICd9JywgJ2cnKSwgJ1xcbicgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGV4dDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEdpdmVuIGEgbWFya2Rvd24gc2xpZGUgc2VjdGlvbiBlbGVtZW50LCB0aGlzIHdpbGxcblx0ICogcmV0dXJuIGFsbCBhcmd1bWVudHMgdGhhdCBhcmVuJ3QgcmVsYXRlZCB0byBtYXJrZG93blxuXHQgKiBwYXJzaW5nLiBVc2VkIHRvIGZvcndhcmQgYW55IG90aGVyIHVzZXItZGVmaW5lZCBhcmd1bWVudHNcblx0ICogdG8gdGhlIG91dHB1dCBtYXJrZG93biBzbGlkZS5cblx0ICovXG5cdGZ1bmN0aW9uIGdldEZvcndhcmRlZEF0dHJpYnV0ZXMoIHNlY3Rpb24gKSB7XG5cblx0XHR2YXIgYXR0cmlidXRlcyA9IHNlY3Rpb24uYXR0cmlidXRlcztcblx0XHR2YXIgcmVzdWx0ID0gW107XG5cblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gYXR0cmlidXRlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdHZhciBuYW1lID0gYXR0cmlidXRlc1tpXS5uYW1lLFxuXHRcdFx0XHR2YWx1ZSA9IGF0dHJpYnV0ZXNbaV0udmFsdWU7XG5cblx0XHRcdC8vIGRpc3JlZ2FyZCBhdHRyaWJ1dGVzIHRoYXQgYXJlIHVzZWQgZm9yIG1hcmtkb3duIGxvYWRpbmcvcGFyc2luZ1xuXHRcdFx0aWYoIC9kYXRhXFwtKG1hcmtkb3dufHNlcGFyYXRvcnx2ZXJ0aWNhbHxub3RlcykvZ2kudGVzdCggbmFtZSApICkgY29udGludWU7XG5cblx0XHRcdGlmKCB2YWx1ZSApIHtcblx0XHRcdFx0cmVzdWx0LnB1c2goIG5hbWUgKyAnPVwiJyArIHZhbHVlICsgJ1wiJyApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJlc3VsdC5wdXNoKCBuYW1lICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdC5qb2luKCAnICcgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEluc3BlY3RzIHRoZSBnaXZlbiBvcHRpb25zIGFuZCBmaWxscyBvdXQgZGVmYXVsdFxuXHQgKiB2YWx1ZXMgZm9yIHdoYXQncyBub3QgZGVmaW5lZC5cblx0ICovXG5cdGZ1bmN0aW9uIGdldFNsaWRpZnlPcHRpb25zKCBvcHRpb25zICkge1xuXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0b3B0aW9ucy5zZXBhcmF0b3IgPSBvcHRpb25zLnNlcGFyYXRvciB8fCBERUZBVUxUX1NMSURFX1NFUEFSQVRPUjtcblx0XHRvcHRpb25zLm5vdGVzU2VwYXJhdG9yID0gb3B0aW9ucy5ub3Rlc1NlcGFyYXRvciB8fCBERUZBVUxUX05PVEVTX1NFUEFSQVRPUjtcblx0XHRvcHRpb25zLmF0dHJpYnV0ZXMgPSBvcHRpb25zLmF0dHJpYnV0ZXMgfHwgJyc7XG5cblx0XHRyZXR1cm4gb3B0aW9ucztcblxuXHR9XG5cblx0LyoqXG5cdCAqIEhlbHBlciBmdW5jdGlvbiBmb3IgY29uc3RydWN0aW5nIGEgbWFya2Rvd24gc2xpZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVNYXJrZG93blNsaWRlKCBjb250ZW50LCBvcHRpb25zICkge1xuXG5cdFx0b3B0aW9ucyA9IGdldFNsaWRpZnlPcHRpb25zKCBvcHRpb25zICk7XG5cblx0XHR2YXIgbm90ZXNNYXRjaCA9IGNvbnRlbnQuc3BsaXQoIG5ldyBSZWdFeHAoIG9wdGlvbnMubm90ZXNTZXBhcmF0b3IsICdtZ2knICkgKTtcblxuXHRcdGlmKCBub3Rlc01hdGNoLmxlbmd0aCA9PT0gMiApIHtcblx0XHRcdGNvbnRlbnQgPSBub3Rlc01hdGNoWzBdICsgJzxhc2lkZSBjbGFzcz1cIm5vdGVzXCI+JyArIG1hcmtlZChub3Rlc01hdGNoWzFdLnRyaW0oKSkgKyAnPC9hc2lkZT4nO1xuXHRcdH1cblxuXHRcdC8vIHByZXZlbnQgc2NyaXB0IGVuZCB0YWdzIGluIHRoZSBjb250ZW50IGZyb20gaW50ZXJmZXJpbmdcblx0XHQvLyB3aXRoIHBhcnNpbmdcblx0XHRjb250ZW50ID0gY29udGVudC5yZXBsYWNlKCAvPFxcL3NjcmlwdD4vZywgU0NSSVBUX0VORF9QTEFDRUhPTERFUiApO1xuXG5cdFx0cmV0dXJuICc8c2NyaXB0IHR5cGU9XCJ0ZXh0L3RlbXBsYXRlXCI+JyArIGNvbnRlbnQgKyAnPC9zY3JpcHQ+JztcblxuXHR9XG5cblx0LyoqXG5cdCAqIFBhcnNlcyBhIGRhdGEgc3RyaW5nIGludG8gbXVsdGlwbGUgc2xpZGVzIGJhc2VkXG5cdCAqIG9uIHRoZSBwYXNzZWQgaW4gc2VwYXJhdG9yIGFyZ3VtZW50cy5cblx0ICovXG5cdGZ1bmN0aW9uIHNsaWRpZnkoIG1hcmtkb3duLCBvcHRpb25zICkge1xuXG5cdFx0b3B0aW9ucyA9IGdldFNsaWRpZnlPcHRpb25zKCBvcHRpb25zICk7XG5cblx0XHR2YXIgc2VwYXJhdG9yUmVnZXggPSBuZXcgUmVnRXhwKCBvcHRpb25zLnNlcGFyYXRvciArICggb3B0aW9ucy52ZXJ0aWNhbFNlcGFyYXRvciA/ICd8JyArIG9wdGlvbnMudmVydGljYWxTZXBhcmF0b3IgOiAnJyApLCAnbWcnICksXG5cdFx0XHRob3Jpem9udGFsU2VwYXJhdG9yUmVnZXggPSBuZXcgUmVnRXhwKCBvcHRpb25zLnNlcGFyYXRvciApO1xuXG5cdFx0dmFyIG1hdGNoZXMsXG5cdFx0XHRsYXN0SW5kZXggPSAwLFxuXHRcdFx0aXNIb3Jpem9udGFsLFxuXHRcdFx0d2FzSG9yaXpvbnRhbCA9IHRydWUsXG5cdFx0XHRjb250ZW50LFxuXHRcdFx0c2VjdGlvblN0YWNrID0gW107XG5cblx0XHQvLyBpdGVyYXRlIHVudGlsIGFsbCBibG9ja3MgYmV0d2VlbiBzZXBhcmF0b3JzIGFyZSBzdGFja2VkIHVwXG5cdFx0d2hpbGUoIG1hdGNoZXMgPSBzZXBhcmF0b3JSZWdleC5leGVjKCBtYXJrZG93biApICkge1xuXHRcdFx0bm90ZXMgPSBudWxsO1xuXG5cdFx0XHQvLyBkZXRlcm1pbmUgZGlyZWN0aW9uIChob3Jpem9udGFsIGJ5IGRlZmF1bHQpXG5cdFx0XHRpc0hvcml6b250YWwgPSBob3Jpem9udGFsU2VwYXJhdG9yUmVnZXgudGVzdCggbWF0Y2hlc1swXSApO1xuXG5cdFx0XHRpZiggIWlzSG9yaXpvbnRhbCAmJiB3YXNIb3Jpem9udGFsICkge1xuXHRcdFx0XHQvLyBjcmVhdGUgdmVydGljYWwgc3RhY2tcblx0XHRcdFx0c2VjdGlvblN0YWNrLnB1c2goIFtdICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHBsdWNrIHNsaWRlIGNvbnRlbnQgZnJvbSBtYXJrZG93biBpbnB1dFxuXHRcdFx0Y29udGVudCA9IG1hcmtkb3duLnN1YnN0cmluZyggbGFzdEluZGV4LCBtYXRjaGVzLmluZGV4ICk7XG5cblx0XHRcdGlmKCBpc0hvcml6b250YWwgJiYgd2FzSG9yaXpvbnRhbCApIHtcblx0XHRcdFx0Ly8gYWRkIHRvIGhvcml6b250YWwgc3RhY2tcblx0XHRcdFx0c2VjdGlvblN0YWNrLnB1c2goIGNvbnRlbnQgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHQvLyBhZGQgdG8gdmVydGljYWwgc3RhY2tcblx0XHRcdFx0c2VjdGlvblN0YWNrW3NlY3Rpb25TdGFjay5sZW5ndGgtMV0ucHVzaCggY29udGVudCApO1xuXHRcdFx0fVxuXG5cdFx0XHRsYXN0SW5kZXggPSBzZXBhcmF0b3JSZWdleC5sYXN0SW5kZXg7XG5cdFx0XHR3YXNIb3Jpem9udGFsID0gaXNIb3Jpem9udGFsO1xuXHRcdH1cblxuXHRcdC8vIGFkZCB0aGUgcmVtYWluaW5nIHNsaWRlXG5cdFx0KCB3YXNIb3Jpem9udGFsID8gc2VjdGlvblN0YWNrIDogc2VjdGlvblN0YWNrW3NlY3Rpb25TdGFjay5sZW5ndGgtMV0gKS5wdXNoKCBtYXJrZG93bi5zdWJzdHJpbmcoIGxhc3RJbmRleCApICk7XG5cblx0XHR2YXIgbWFya2Rvd25TZWN0aW9ucyA9ICcnO1xuXG5cdFx0Ly8gZmxhdHRlbiB0aGUgaGllcmFyY2hpY2FsIHN0YWNrLCBhbmQgaW5zZXJ0IDxzZWN0aW9uIGRhdGEtbWFya2Rvd24+IHRhZ3Ncblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gc2VjdGlvblN0YWNrLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0Ly8gdmVydGljYWxcblx0XHRcdGlmKCBzZWN0aW9uU3RhY2tbaV0gaW5zdGFuY2VvZiBBcnJheSApIHtcblx0XHRcdFx0bWFya2Rvd25TZWN0aW9ucyArPSAnPHNlY3Rpb24gJysgb3B0aW9ucy5hdHRyaWJ1dGVzICsnPic7XG5cblx0XHRcdFx0c2VjdGlvblN0YWNrW2ldLmZvckVhY2goIGZ1bmN0aW9uKCBjaGlsZCApIHtcblx0XHRcdFx0XHRtYXJrZG93blNlY3Rpb25zICs9ICc8c2VjdGlvbiBkYXRhLW1hcmtkb3duPicgKyBjcmVhdGVNYXJrZG93blNsaWRlKCBjaGlsZCwgb3B0aW9ucyApICsgJzwvc2VjdGlvbj4nO1xuXHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0bWFya2Rvd25TZWN0aW9ucyArPSAnPC9zZWN0aW9uPic7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0bWFya2Rvd25TZWN0aW9ucyArPSAnPHNlY3Rpb24gJysgb3B0aW9ucy5hdHRyaWJ1dGVzICsnIGRhdGEtbWFya2Rvd24+JyArIGNyZWF0ZU1hcmtkb3duU2xpZGUoIHNlY3Rpb25TdGFja1tpXSwgb3B0aW9ucyApICsgJzwvc2VjdGlvbj4nO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBtYXJrZG93blNlY3Rpb25zO1xuXG5cdH1cblxuXHQvKipcblx0ICogUGFyc2VzIGFueSBjdXJyZW50IGRhdGEtbWFya2Rvd24gc2xpZGVzLCBzcGxpdHNcblx0ICogbXVsdGktc2xpZGUgbWFya2Rvd24gaW50byBzZXBhcmF0ZSBzZWN0aW9ucyBhbmRcblx0ICogaGFuZGxlcyBsb2FkaW5nIG9mIGV4dGVybmFsIG1hcmtkb3duLlxuXHQgKi9cblx0ZnVuY3Rpb24gcHJvY2Vzc1NsaWRlcygpIHtcblxuXHRcdHZhciBzZWN0aW9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICdbZGF0YS1tYXJrZG93bl0nKSxcblx0XHRcdHNlY3Rpb247XG5cblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gc2VjdGlvbnMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cblx0XHRcdHNlY3Rpb24gPSBzZWN0aW9uc1tpXTtcblxuXHRcdFx0aWYoIHNlY3Rpb24uZ2V0QXR0cmlidXRlKCAnZGF0YS1tYXJrZG93bicgKS5sZW5ndGggKSB7XG5cblx0XHRcdFx0dmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuXHRcdFx0XHRcdHVybCA9IHNlY3Rpb24uZ2V0QXR0cmlidXRlKCAnZGF0YS1tYXJrZG93bicgKTtcblxuXHRcdFx0XHRkYXRhY2hhcnNldCA9IHNlY3Rpb24uZ2V0QXR0cmlidXRlKCAnZGF0YS1jaGFyc2V0JyApO1xuXG5cdFx0XHRcdC8vIHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvZWxlbWVudC5nZXRBdHRyaWJ1dGUjTm90ZXNcblx0XHRcdFx0aWYoIGRhdGFjaGFyc2V0ICE9IG51bGwgJiYgZGF0YWNoYXJzZXQgIT0gJycgKSB7XG5cdFx0XHRcdFx0eGhyLm92ZXJyaWRlTWltZVR5cGUoICd0ZXh0L2h0bWw7IGNoYXJzZXQ9JyArIGRhdGFjaGFyc2V0ICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYoIHhoci5yZWFkeVN0YXRlID09PSA0ICkge1xuXHRcdFx0XHRcdFx0Ly8gZmlsZSBwcm90b2NvbCB5aWVsZHMgc3RhdHVzIGNvZGUgMCAodXNlZnVsIGZvciBsb2NhbCBkZWJ1ZywgbW9iaWxlIGFwcGxpY2F0aW9ucyBldGMuKVxuXHRcdFx0XHRcdFx0aWYgKCAoIHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDAgKSB8fCB4aHIuc3RhdHVzID09PSAwICkge1xuXG5cdFx0XHRcdFx0XHRcdHNlY3Rpb24ub3V0ZXJIVE1MID0gc2xpZGlmeSggeGhyLnJlc3BvbnNlVGV4dCwge1xuXHRcdFx0XHRcdFx0XHRcdHNlcGFyYXRvcjogc2VjdGlvbi5nZXRBdHRyaWJ1dGUoICdkYXRhLXNlcGFyYXRvcicgKSxcblx0XHRcdFx0XHRcdFx0XHR2ZXJ0aWNhbFNlcGFyYXRvcjogc2VjdGlvbi5nZXRBdHRyaWJ1dGUoICdkYXRhLXNlcGFyYXRvci12ZXJ0aWNhbCcgKSxcblx0XHRcdFx0XHRcdFx0XHRub3Rlc1NlcGFyYXRvcjogc2VjdGlvbi5nZXRBdHRyaWJ1dGUoICdkYXRhLXNlcGFyYXRvci1ub3RlcycgKSxcblx0XHRcdFx0XHRcdFx0XHRhdHRyaWJ1dGVzOiBnZXRGb3J3YXJkZWRBdHRyaWJ1dGVzKCBzZWN0aW9uIClcblx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXG5cdFx0XHRcdFx0XHRcdHNlY3Rpb24ub3V0ZXJIVE1MID0gJzxzZWN0aW9uIGRhdGEtc3RhdGU9XCJhbGVydFwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdCdFUlJPUjogVGhlIGF0dGVtcHQgdG8gZmV0Y2ggJyArIHVybCArICcgZmFpbGVkIHdpdGggSFRUUCBzdGF0dXMgJyArIHhoci5zdGF0dXMgKyAnLicgK1xuXHRcdFx0XHRcdFx0XHRcdCdDaGVjayB5b3VyIGJyb3dzZXJcXCdzIEphdmFTY3JpcHQgY29uc29sZSBmb3IgbW9yZSBkZXRhaWxzLicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8cD5SZW1lbWJlciB0aGF0IHlvdSBuZWVkIHRvIHNlcnZlIHRoZSBwcmVzZW50YXRpb24gSFRNTCBmcm9tIGEgSFRUUCBzZXJ2ZXIuPC9wPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L3NlY3Rpb24+JztcblxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHR4aHIub3BlbiggJ0dFVCcsIHVybCwgZmFsc2UgKTtcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHhoci5zZW5kKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2F0Y2ggKCBlICkge1xuXHRcdFx0XHRcdGFsZXJ0KCAnRmFpbGVkIHRvIGdldCB0aGUgTWFya2Rvd24gZmlsZSAnICsgdXJsICsgJy4gTWFrZSBzdXJlIHRoYXQgdGhlIHByZXNlbnRhdGlvbiBhbmQgdGhlIGZpbGUgYXJlIHNlcnZlZCBieSBhIEhUVFAgc2VydmVyIGFuZCB0aGUgZmlsZSBjYW4gYmUgZm91bmQgdGhlcmUuICcgKyBlICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiggc2VjdGlvbi5nZXRBdHRyaWJ1dGUoICdkYXRhLXNlcGFyYXRvcicgKSB8fCBzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtc2VwYXJhdG9yLXZlcnRpY2FsJyApIHx8IHNlY3Rpb24uZ2V0QXR0cmlidXRlKCAnZGF0YS1zZXBhcmF0b3Itbm90ZXMnICkgKSB7XG5cblx0XHRcdFx0c2VjdGlvbi5vdXRlckhUTUwgPSBzbGlkaWZ5KCBnZXRNYXJrZG93bkZyb21TbGlkZSggc2VjdGlvbiApLCB7XG5cdFx0XHRcdFx0c2VwYXJhdG9yOiBzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtc2VwYXJhdG9yJyApLFxuXHRcdFx0XHRcdHZlcnRpY2FsU2VwYXJhdG9yOiBzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtc2VwYXJhdG9yLXZlcnRpY2FsJyApLFxuXHRcdFx0XHRcdG5vdGVzU2VwYXJhdG9yOiBzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtc2VwYXJhdG9yLW5vdGVzJyApLFxuXHRcdFx0XHRcdGF0dHJpYnV0ZXM6IGdldEZvcndhcmRlZEF0dHJpYnV0ZXMoIHNlY3Rpb24gKVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHNlY3Rpb24uaW5uZXJIVE1MID0gY3JlYXRlTWFya2Rvd25TbGlkZSggZ2V0TWFya2Rvd25Gcm9tU2xpZGUoIHNlY3Rpb24gKSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrIGlmIGEgbm9kZSB2YWx1ZSBoYXMgdGhlIGF0dHJpYnV0ZXMgcGF0dGVybi5cblx0ICogSWYgeWVzLCBleHRyYWN0IGl0IGFuZCBhZGQgdGhhdCB2YWx1ZSBhcyBvbmUgb3Igc2V2ZXJhbCBhdHRyaWJ1dGVzXG5cdCAqIHRoZSB0aGUgdGVyZ2V0IGVsZW1lbnQuXG5cdCAqXG5cdCAqIFlvdSBuZWVkIENhY2hlIEtpbGxlciBvbiBDaHJvbWUgdG8gc2VlIHRoZSBlZmZlY3Qgb24gYW55IEZPTSB0cmFuc2Zvcm1hdGlvblxuXHQgKiBkaXJlY3RseSBvbiByZWZyZXNoIChGNSlcblx0ICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81NjkwMjY5L2Rpc2FibGluZy1jaHJvbWUtY2FjaGUtZm9yLXdlYnNpdGUtZGV2ZWxvcG1lbnQvNzAwMDg5OSNhbnN3ZXItMTE3ODYyNzdcblx0ICovXG5cdGZ1bmN0aW9uIGFkZEF0dHJpYnV0ZUluRWxlbWVudCggbm9kZSwgZWxlbWVudFRhcmdldCwgc2VwYXJhdG9yICkge1xuXG5cdFx0dmFyIG1hcmRvd25DbGFzc2VzSW5FbGVtZW50c1JlZ2V4ID0gbmV3IFJlZ0V4cCggc2VwYXJhdG9yLCAnbWcnICk7XG5cdFx0dmFyIG1hcmRvd25DbGFzc1JlZ2V4ID0gbmV3IFJlZ0V4cCggXCIoW15cXFwiPSBdKz8pPVxcXCIoW15cXFwiPV0rPylcXFwiXCIsICdtZycgKTtcblx0XHR2YXIgbm9kZVZhbHVlID0gbm9kZS5ub2RlVmFsdWU7XG5cdFx0aWYoIG1hdGNoZXMgPSBtYXJkb3duQ2xhc3Nlc0luRWxlbWVudHNSZWdleC5leGVjKCBub2RlVmFsdWUgKSApIHtcblxuXHRcdFx0dmFyIGNsYXNzZXMgPSBtYXRjaGVzWzFdO1xuXHRcdFx0bm9kZVZhbHVlID0gbm9kZVZhbHVlLnN1YnN0cmluZyggMCwgbWF0Y2hlcy5pbmRleCApICsgbm9kZVZhbHVlLnN1YnN0cmluZyggbWFyZG93bkNsYXNzZXNJbkVsZW1lbnRzUmVnZXgubGFzdEluZGV4ICk7XG5cdFx0XHRub2RlLm5vZGVWYWx1ZSA9IG5vZGVWYWx1ZTtcblx0XHRcdHdoaWxlKCBtYXRjaGVzQ2xhc3MgPSBtYXJkb3duQ2xhc3NSZWdleC5leGVjKCBjbGFzc2VzICkgKSB7XG5cdFx0XHRcdGVsZW1lbnRUYXJnZXQuc2V0QXR0cmlidXRlKCBtYXRjaGVzQ2xhc3NbMV0sIG1hdGNoZXNDbGFzc1syXSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBZGQgYXR0cmlidXRlcyB0byB0aGUgcGFyZW50IGVsZW1lbnQgb2YgYSB0ZXh0IG5vZGUsXG5cdCAqIG9yIHRoZSBlbGVtZW50IG9mIGFuIGF0dHJpYnV0ZSBub2RlLlxuXHQgKi9cblx0ZnVuY3Rpb24gYWRkQXR0cmlidXRlcyggc2VjdGlvbiwgZWxlbWVudCwgcHJldmlvdXNFbGVtZW50LCBzZXBhcmF0b3JFbGVtZW50QXR0cmlidXRlcywgc2VwYXJhdG9yU2VjdGlvbkF0dHJpYnV0ZXMgKSB7XG5cblx0XHRpZiAoIGVsZW1lbnQgIT0gbnVsbCAmJiBlbGVtZW50LmNoaWxkTm9kZXMgIT0gdW5kZWZpbmVkICYmIGVsZW1lbnQuY2hpbGROb2Rlcy5sZW5ndGggPiAwICkge1xuXHRcdFx0cHJldmlvdXNQYXJlbnRFbGVtZW50ID0gZWxlbWVudDtcblx0XHRcdGZvciggdmFyIGkgPSAwOyBpIDwgZWxlbWVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrICkge1xuXHRcdFx0XHRjaGlsZEVsZW1lbnQgPSBlbGVtZW50LmNoaWxkTm9kZXNbaV07XG5cdFx0XHRcdGlmICggaSA+IDAgKSB7XG5cdFx0XHRcdFx0aiA9IGkgLSAxO1xuXHRcdFx0XHRcdHdoaWxlICggaiA+PSAwICkge1xuXHRcdFx0XHRcdFx0YVByZXZpb3VzQ2hpbGRFbGVtZW50ID0gZWxlbWVudC5jaGlsZE5vZGVzW2pdO1xuXHRcdFx0XHRcdFx0aWYgKCB0eXBlb2YgYVByZXZpb3VzQ2hpbGRFbGVtZW50LnNldEF0dHJpYnV0ZSA9PSAnZnVuY3Rpb24nICYmIGFQcmV2aW91c0NoaWxkRWxlbWVudC50YWdOYW1lICE9IFwiQlJcIiApIHtcblx0XHRcdFx0XHRcdFx0cHJldmlvdXNQYXJlbnRFbGVtZW50ID0gYVByZXZpb3VzQ2hpbGRFbGVtZW50O1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGogPSBqIC0gMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cGFyZW50U2VjdGlvbiA9IHNlY3Rpb247XG5cdFx0XHRcdGlmKCBjaGlsZEVsZW1lbnQubm9kZU5hbWUgPT0gIFwic2VjdGlvblwiICkge1xuXHRcdFx0XHRcdHBhcmVudFNlY3Rpb24gPSBjaGlsZEVsZW1lbnQgO1xuXHRcdFx0XHRcdHByZXZpb3VzUGFyZW50RWxlbWVudCA9IGNoaWxkRWxlbWVudCA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCB0eXBlb2YgY2hpbGRFbGVtZW50LnNldEF0dHJpYnV0ZSA9PSAnZnVuY3Rpb24nIHx8IGNoaWxkRWxlbWVudC5ub2RlVHlwZSA9PSBOb2RlLkNPTU1FTlRfTk9ERSApIHtcblx0XHRcdFx0XHRhZGRBdHRyaWJ1dGVzKCBwYXJlbnRTZWN0aW9uLCBjaGlsZEVsZW1lbnQsIHByZXZpb3VzUGFyZW50RWxlbWVudCwgc2VwYXJhdG9yRWxlbWVudEF0dHJpYnV0ZXMsIHNlcGFyYXRvclNlY3Rpb25BdHRyaWJ1dGVzICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIGVsZW1lbnQubm9kZVR5cGUgPT0gTm9kZS5DT01NRU5UX05PREUgKSB7XG5cdFx0XHRpZiAoIGFkZEF0dHJpYnV0ZUluRWxlbWVudCggZWxlbWVudCwgcHJldmlvdXNFbGVtZW50LCBzZXBhcmF0b3JFbGVtZW50QXR0cmlidXRlcyApID09IGZhbHNlICkge1xuXHRcdFx0XHRhZGRBdHRyaWJ1dGVJbkVsZW1lbnQoIGVsZW1lbnQsIHNlY3Rpb24sIHNlcGFyYXRvclNlY3Rpb25BdHRyaWJ1dGVzICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGFueSBjdXJyZW50IGRhdGEtbWFya2Rvd24gc2xpZGVzIGluIHRoZVxuXHQgKiBET00gdG8gSFRNTC5cblx0ICovXG5cdGZ1bmN0aW9uIGNvbnZlcnRTbGlkZXMoKSB7XG5cblx0XHR2YXIgc2VjdGlvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnW2RhdGEtbWFya2Rvd25dJyk7XG5cblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gc2VjdGlvbnMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cblx0XHRcdHZhciBzZWN0aW9uID0gc2VjdGlvbnNbaV07XG5cblx0XHRcdC8vIE9ubHkgcGFyc2UgdGhlIHNhbWUgc2xpZGUgb25jZVxuXHRcdFx0aWYoICFzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtbWFya2Rvd24tcGFyc2VkJyApICkge1xuXG5cdFx0XHRcdHNlY3Rpb24uc2V0QXR0cmlidXRlKCAnZGF0YS1tYXJrZG93bi1wYXJzZWQnLCB0cnVlIClcblxuXHRcdFx0XHR2YXIgbm90ZXMgPSBzZWN0aW9uLnF1ZXJ5U2VsZWN0b3IoICdhc2lkZS5ub3RlcycgKTtcblx0XHRcdFx0dmFyIG1hcmtkb3duID0gZ2V0TWFya2Rvd25Gcm9tU2xpZGUoIHNlY3Rpb24gKTtcblxuXHRcdFx0XHRzZWN0aW9uLmlubmVySFRNTCA9IG1hcmtlZCggbWFya2Rvd24gKTtcblx0XHRcdFx0YWRkQXR0cmlidXRlcyggXHRzZWN0aW9uLCBzZWN0aW9uLCBudWxsLCBzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtZWxlbWVudC1hdHRyaWJ1dGVzJyApIHx8XG5cdFx0XHRcdFx0XHRcdFx0c2VjdGlvbi5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSggJ2RhdGEtZWxlbWVudC1hdHRyaWJ1dGVzJyApIHx8XG5cdFx0XHRcdFx0XHRcdFx0REVGQVVMVF9FTEVNRU5UX0FUVFJJQlVURVNfU0VQQVJBVE9SLFxuXHRcdFx0XHRcdFx0XHRcdHNlY3Rpb24uZ2V0QXR0cmlidXRlKCAnZGF0YS1hdHRyaWJ1dGVzJyApIHx8XG5cdFx0XHRcdFx0XHRcdFx0c2VjdGlvbi5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYXR0cmlidXRlcycgKSB8fFxuXHRcdFx0XHRcdFx0XHRcdERFRkFVTFRfU0xJREVfQVRUUklCVVRFU19TRVBBUkFUT1IpO1xuXG5cdFx0XHRcdC8vIElmIHRoZXJlIHdlcmUgbm90ZXMsIHdlIG5lZWQgdG8gcmUtYWRkIHRoZW0gYWZ0ZXJcblx0XHRcdFx0Ly8gaGF2aW5nIG92ZXJ3cml0dGVuIHRoZSBzZWN0aW9uJ3MgSFRNTFxuXHRcdFx0XHRpZiggbm90ZXMgKSB7XG5cdFx0XHRcdFx0c2VjdGlvbi5hcHBlbmRDaGlsZCggbm90ZXMgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fVxuXG5cdC8vIEFQSVxuXHRyZXR1cm4ge1xuXG5cdFx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiggdHlwZW9mIG1hcmtlZCA9PT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdHRocm93ICdUaGUgcmV2ZWFsLmpzIE1hcmtkb3duIHBsdWdpbiByZXF1aXJlcyBtYXJrZWQgdG8gYmUgbG9hZGVkJztcblx0XHRcdH1cblxuXHRcdFx0aWYoIHR5cGVvZiBobGpzICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0bWFya2VkLnNldE9wdGlvbnMoe1xuXHRcdFx0XHRcdGhpZ2hsaWdodDogZnVuY3Rpb24oIGNvZGUsIGxhbmcgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gaGxqcy5oaWdobGlnaHRBdXRvKCBjb2RlLCBbbGFuZ10gKS52YWx1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgb3B0aW9ucyA9IFJldmVhbC5nZXRDb25maWcoKS5tYXJrZG93bjtcblxuXHRcdFx0aWYgKCBvcHRpb25zICkge1xuXHRcdFx0XHRtYXJrZWQuc2V0T3B0aW9ucyggb3B0aW9ucyApO1xuXHRcdFx0fVxuXG5cdFx0XHRwcm9jZXNzU2xpZGVzKCk7XG5cdFx0XHRjb252ZXJ0U2xpZGVzKCk7XG5cdFx0fSxcblxuXHRcdC8vIFRPRE86IERvIHRoZXNlIGJlbG9uZyBpbiB0aGUgQVBJP1xuXHRcdHByb2Nlc3NTbGlkZXM6IHByb2Nlc3NTbGlkZXMsXG5cdFx0Y29udmVydFNsaWRlczogY29udmVydFNsaWRlcyxcblx0XHRzbGlkaWZ5OiBzbGlkaWZ5XG5cblx0fTtcblxufSkpO1xuIiwiLyoqXG4gKiBtYXJrZWQgLSBhIG1hcmtkb3duIHBhcnNlclxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTQsIENocmlzdG9waGVyIEplZmZyZXkuIChNSVQgTGljZW5zZWQpXG4gKiBodHRwczovL2dpdGh1Yi5jb20vY2hqai9tYXJrZWRcbiAqL1xuKGZ1bmN0aW9uKCl7dmFyIGJsb2NrPXtuZXdsaW5lOi9eXFxuKy8sY29kZTovXiggezR9W15cXG5dK1xcbiopKy8sZmVuY2VzOm5vb3AsaHI6L14oICpbLSpfXSl7Myx9ICooPzpcXG4rfCQpLyxoZWFkaW5nOi9eICooI3sxLDZ9KSAqKFteXFxuXSs/KSAqIyogKig/Olxcbit8JCkvLG5wdGFibGU6bm9vcCxsaGVhZGluZzovXihbXlxcbl0rKVxcbiAqKD18LSl7Mix9ICooPzpcXG4rfCQpLyxibG9ja3F1b3RlOi9eKCAqPlteXFxuXSsoXFxuKD8hZGVmKVteXFxuXSspKlxcbiopKy8sbGlzdDovXiggKikoYnVsbCkgW1xcc1xcU10rPyg/OmhyfGRlZnxcXG57Mix9KD8hICkoPyFcXDFidWxsIClcXG4qfFxccyokKS8saHRtbDovXiAqKD86Y29tbWVudCAqKD86XFxufFxccyokKXxjbG9zZWQgKig/OlxcbnsyLH18XFxzKiQpfGNsb3NpbmcgKig/OlxcbnsyLH18XFxzKiQpKS8sZGVmOi9eICpcXFsoW15cXF1dKylcXF06ICo8PyhbXlxccz5dKyk+Pyg/OiArW1wiKF0oW15cXG5dKylbXCIpXSk/ICooPzpcXG4rfCQpLyx0YWJsZTpub29wLHBhcmFncmFwaDovXigoPzpbXlxcbl0rXFxuPyg/IWhyfGhlYWRpbmd8bGhlYWRpbmd8YmxvY2txdW90ZXx0YWd8ZGVmKSkrKVxcbiovLHRleHQ6L15bXlxcbl0rL307YmxvY2suYnVsbGV0PS8oPzpbKistXXxcXGQrXFwuKS87YmxvY2suaXRlbT0vXiggKikoYnVsbCkgW15cXG5dKig/Olxcbig/IVxcMWJ1bGwgKVteXFxuXSopKi87YmxvY2suaXRlbT1yZXBsYWNlKGJsb2NrLml0ZW0sXCJnbVwiKSgvYnVsbC9nLGJsb2NrLmJ1bGxldCkoKTtibG9jay5saXN0PXJlcGxhY2UoYmxvY2subGlzdCkoL2J1bGwvZyxibG9jay5idWxsZXQpKFwiaHJcIixcIlxcXFxuKyg/PVxcXFwxPyg/OlstKl9dICopezMsfSg/OlxcXFxuK3wkKSlcIikoXCJkZWZcIixcIlxcXFxuKyg/PVwiK2Jsb2NrLmRlZi5zb3VyY2UrXCIpXCIpKCk7YmxvY2suYmxvY2txdW90ZT1yZXBsYWNlKGJsb2NrLmJsb2NrcXVvdGUpKFwiZGVmXCIsYmxvY2suZGVmKSgpO2Jsb2NrLl90YWc9XCIoPyEoPzpcIitcImF8ZW18c3Ryb25nfHNtYWxsfHN8Y2l0ZXxxfGRmbnxhYmJyfGRhdGF8dGltZXxjb2RlXCIrXCJ8dmFyfHNhbXB8a2JkfHN1YnxzdXB8aXxifHV8bWFya3xydWJ5fHJ0fHJwfGJkaXxiZG9cIitcInxzcGFufGJyfHdicnxpbnN8ZGVsfGltZylcXFxcYilcXFxcdysoPyE6L3xbXlxcXFx3XFxcXHNAXSpAKVxcXFxiXCI7YmxvY2suaHRtbD1yZXBsYWNlKGJsb2NrLmh0bWwpKFwiY29tbWVudFwiLC88IS0tW1xcc1xcU10qPy0tPi8pKFwiY2xvc2VkXCIsLzwodGFnKVtcXHNcXFNdKz88XFwvXFwxPi8pKFwiY2xvc2luZ1wiLC88dGFnKD86XCJbXlwiXSpcInwnW14nXSonfFteJ1wiPl0pKj8+LykoL3RhZy9nLGJsb2NrLl90YWcpKCk7YmxvY2sucGFyYWdyYXBoPXJlcGxhY2UoYmxvY2sucGFyYWdyYXBoKShcImhyXCIsYmxvY2suaHIpKFwiaGVhZGluZ1wiLGJsb2NrLmhlYWRpbmcpKFwibGhlYWRpbmdcIixibG9jay5saGVhZGluZykoXCJibG9ja3F1b3RlXCIsYmxvY2suYmxvY2txdW90ZSkoXCJ0YWdcIixcIjxcIitibG9jay5fdGFnKShcImRlZlwiLGJsb2NrLmRlZikoKTtibG9jay5ub3JtYWw9bWVyZ2Uoe30sYmxvY2spO2Jsb2NrLmdmbT1tZXJnZSh7fSxibG9jay5ub3JtYWwse2ZlbmNlczovXiAqKGB7Myx9fH57Myx9KVsgXFwuXSooXFxTKyk/ICpcXG4oW1xcc1xcU10qPylcXHMqXFwxICooPzpcXG4rfCQpLyxwYXJhZ3JhcGg6L14vLGhlYWRpbmc6L14gKigjezEsNn0pICsoW15cXG5dKz8pICojKiAqKD86XFxuK3wkKS99KTtibG9jay5nZm0ucGFyYWdyYXBoPXJlcGxhY2UoYmxvY2sucGFyYWdyYXBoKShcIig/IVwiLFwiKD8hXCIrYmxvY2suZ2ZtLmZlbmNlcy5zb3VyY2UucmVwbGFjZShcIlxcXFwxXCIsXCJcXFxcMlwiKStcInxcIitibG9jay5saXN0LnNvdXJjZS5yZXBsYWNlKFwiXFxcXDFcIixcIlxcXFwzXCIpK1wifFwiKSgpO2Jsb2NrLnRhYmxlcz1tZXJnZSh7fSxibG9jay5nZm0se25wdGFibGU6L14gKihcXFMuKlxcfC4qKVxcbiAqKFstOl0rICpcXHxbLXwgOl0qKVxcbigoPzouKlxcfC4qKD86XFxufCQpKSopXFxuKi8sdGFibGU6L14gKlxcfCguKylcXG4gKlxcfCggKlstOl0rWy18IDpdKilcXG4oKD86ICpcXHwuKig/OlxcbnwkKSkqKVxcbiovfSk7ZnVuY3Rpb24gTGV4ZXIob3B0aW9ucyl7dGhpcy50b2tlbnM9W107dGhpcy50b2tlbnMubGlua3M9e307dGhpcy5vcHRpb25zPW9wdGlvbnN8fG1hcmtlZC5kZWZhdWx0czt0aGlzLnJ1bGVzPWJsb2NrLm5vcm1hbDtpZih0aGlzLm9wdGlvbnMuZ2ZtKXtpZih0aGlzLm9wdGlvbnMudGFibGVzKXt0aGlzLnJ1bGVzPWJsb2NrLnRhYmxlc31lbHNle3RoaXMucnVsZXM9YmxvY2suZ2ZtfX19TGV4ZXIucnVsZXM9YmxvY2s7TGV4ZXIubGV4PWZ1bmN0aW9uKHNyYyxvcHRpb25zKXt2YXIgbGV4ZXI9bmV3IExleGVyKG9wdGlvbnMpO3JldHVybiBsZXhlci5sZXgoc3JjKX07TGV4ZXIucHJvdG90eXBlLmxleD1mdW5jdGlvbihzcmMpe3NyYz1zcmMucmVwbGFjZSgvXFxyXFxufFxcci9nLFwiXFxuXCIpLnJlcGxhY2UoL1xcdC9nLFwiICAgIFwiKS5yZXBsYWNlKC9cXHUwMGEwL2csXCIgXCIpLnJlcGxhY2UoL1xcdTI0MjQvZyxcIlxcblwiKTtyZXR1cm4gdGhpcy50b2tlbihzcmMsdHJ1ZSl9O0xleGVyLnByb3RvdHlwZS50b2tlbj1mdW5jdGlvbihzcmMsdG9wLGJxKXt2YXIgc3JjPXNyYy5yZXBsYWNlKC9eICskL2dtLFwiXCIpLG5leHQsbG9vc2UsY2FwLGJ1bGwsYixpdGVtLHNwYWNlLGksbDt3aGlsZShzcmMpe2lmKGNhcD10aGlzLnJ1bGVzLm5ld2xpbmUuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtpZihjYXBbMF0ubGVuZ3RoPjEpe3RoaXMudG9rZW5zLnB1c2goe3R5cGU6XCJzcGFjZVwifSl9fWlmKGNhcD10aGlzLnJ1bGVzLmNvZGUuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtjYXA9Y2FwWzBdLnJlcGxhY2UoL14gezR9L2dtLFwiXCIpO3RoaXMudG9rZW5zLnB1c2goe3R5cGU6XCJjb2RlXCIsdGV4dDohdGhpcy5vcHRpb25zLnBlZGFudGljP2NhcC5yZXBsYWNlKC9cXG4rJC8sXCJcIik6Y2FwfSk7Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMuZmVuY2VzLmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7dGhpcy50b2tlbnMucHVzaCh7dHlwZTpcImNvZGVcIixsYW5nOmNhcFsyXSx0ZXh0OmNhcFszXXx8XCJcIn0pO2NvbnRpbnVlfWlmKGNhcD10aGlzLnJ1bGVzLmhlYWRpbmcuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTt0aGlzLnRva2Vucy5wdXNoKHt0eXBlOlwiaGVhZGluZ1wiLGRlcHRoOmNhcFsxXS5sZW5ndGgsdGV4dDpjYXBbMl19KTtjb250aW51ZX1pZih0b3AmJihjYXA9dGhpcy5ydWxlcy5ucHRhYmxlLmV4ZWMoc3JjKSkpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO2l0ZW09e3R5cGU6XCJ0YWJsZVwiLGhlYWRlcjpjYXBbMV0ucmVwbGFjZSgvXiAqfCAqXFx8ICokL2csXCJcIikuc3BsaXQoLyAqXFx8ICovKSxhbGlnbjpjYXBbMl0ucmVwbGFjZSgvXiAqfFxcfCAqJC9nLFwiXCIpLnNwbGl0KC8gKlxcfCAqLyksY2VsbHM6Y2FwWzNdLnJlcGxhY2UoL1xcbiQvLFwiXCIpLnNwbGl0KFwiXFxuXCIpfTtmb3IoaT0wO2k8aXRlbS5hbGlnbi5sZW5ndGg7aSsrKXtpZigvXiAqLSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKXtpdGVtLmFsaWduW2ldPVwicmlnaHRcIn1lbHNlIGlmKC9eICo6LSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKXtpdGVtLmFsaWduW2ldPVwiY2VudGVyXCJ9ZWxzZSBpZigvXiAqOi0rICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKXtpdGVtLmFsaWduW2ldPVwibGVmdFwifWVsc2V7aXRlbS5hbGlnbltpXT1udWxsfX1mb3IoaT0wO2k8aXRlbS5jZWxscy5sZW5ndGg7aSsrKXtpdGVtLmNlbGxzW2ldPWl0ZW0uY2VsbHNbaV0uc3BsaXQoLyAqXFx8ICovKX10aGlzLnRva2Vucy5wdXNoKGl0ZW0pO2NvbnRpbnVlfWlmKGNhcD10aGlzLnJ1bGVzLmxoZWFkaW5nLmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7dGhpcy50b2tlbnMucHVzaCh7dHlwZTpcImhlYWRpbmdcIixkZXB0aDpjYXBbMl09PT1cIj1cIj8xOjIsdGV4dDpjYXBbMV19KTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy5oci5leGVjKHNyYykpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO3RoaXMudG9rZW5zLnB1c2goe3R5cGU6XCJoclwifSk7Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMuYmxvY2txdW90ZS5leGVjKHNyYykpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO3RoaXMudG9rZW5zLnB1c2goe3R5cGU6XCJibG9ja3F1b3RlX3N0YXJ0XCJ9KTtjYXA9Y2FwWzBdLnJlcGxhY2UoL14gKj4gPy9nbSxcIlwiKTt0aGlzLnRva2VuKGNhcCx0b3AsdHJ1ZSk7dGhpcy50b2tlbnMucHVzaCh7dHlwZTpcImJsb2NrcXVvdGVfZW5kXCJ9KTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy5saXN0LmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7YnVsbD1jYXBbMl07dGhpcy50b2tlbnMucHVzaCh7dHlwZTpcImxpc3Rfc3RhcnRcIixvcmRlcmVkOmJ1bGwubGVuZ3RoPjF9KTtjYXA9Y2FwWzBdLm1hdGNoKHRoaXMucnVsZXMuaXRlbSk7bmV4dD1mYWxzZTtsPWNhcC5sZW5ndGg7aT0wO2Zvcig7aTxsO2krKyl7aXRlbT1jYXBbaV07c3BhY2U9aXRlbS5sZW5ndGg7aXRlbT1pdGVtLnJlcGxhY2UoL14gKihbKistXXxcXGQrXFwuKSArLyxcIlwiKTtpZih+aXRlbS5pbmRleE9mKFwiXFxuIFwiKSl7c3BhY2UtPWl0ZW0ubGVuZ3RoO2l0ZW09IXRoaXMub3B0aW9ucy5wZWRhbnRpYz9pdGVtLnJlcGxhY2UobmV3IFJlZ0V4cChcIl4gezEsXCIrc3BhY2UrXCJ9XCIsXCJnbVwiKSxcIlwiKTppdGVtLnJlcGxhY2UoL14gezEsNH0vZ20sXCJcIil9aWYodGhpcy5vcHRpb25zLnNtYXJ0TGlzdHMmJmkhPT1sLTEpe2I9YmxvY2suYnVsbGV0LmV4ZWMoY2FwW2krMV0pWzBdO2lmKGJ1bGwhPT1iJiYhKGJ1bGwubGVuZ3RoPjEmJmIubGVuZ3RoPjEpKXtzcmM9Y2FwLnNsaWNlKGkrMSkuam9pbihcIlxcblwiKStzcmM7aT1sLTF9fWxvb3NlPW5leHR8fC9cXG5cXG4oPyFcXHMqJCkvLnRlc3QoaXRlbSk7aWYoaSE9PWwtMSl7bmV4dD1pdGVtLmNoYXJBdChpdGVtLmxlbmd0aC0xKT09PVwiXFxuXCI7aWYoIWxvb3NlKWxvb3NlPW5leHR9dGhpcy50b2tlbnMucHVzaCh7dHlwZTpsb29zZT9cImxvb3NlX2l0ZW1fc3RhcnRcIjpcImxpc3RfaXRlbV9zdGFydFwifSk7dGhpcy50b2tlbihpdGVtLGZhbHNlLGJxKTt0aGlzLnRva2Vucy5wdXNoKHt0eXBlOlwibGlzdF9pdGVtX2VuZFwifSl9dGhpcy50b2tlbnMucHVzaCh7dHlwZTpcImxpc3RfZW5kXCJ9KTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy5odG1sLmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7dGhpcy50b2tlbnMucHVzaCh7dHlwZTp0aGlzLm9wdGlvbnMuc2FuaXRpemU/XCJwYXJhZ3JhcGhcIjpcImh0bWxcIixwcmU6IXRoaXMub3B0aW9ucy5zYW5pdGl6ZXImJihjYXBbMV09PT1cInByZVwifHxjYXBbMV09PT1cInNjcmlwdFwifHxjYXBbMV09PT1cInN0eWxlXCIpLHRleHQ6Y2FwWzBdfSk7Y29udGludWV9aWYoIWJxJiZ0b3AmJihjYXA9dGhpcy5ydWxlcy5kZWYuZXhlYyhzcmMpKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7dGhpcy50b2tlbnMubGlua3NbY2FwWzFdLnRvTG93ZXJDYXNlKCldPXtocmVmOmNhcFsyXSx0aXRsZTpjYXBbM119O2NvbnRpbnVlfWlmKHRvcCYmKGNhcD10aGlzLnJ1bGVzLnRhYmxlLmV4ZWMoc3JjKSkpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO2l0ZW09e3R5cGU6XCJ0YWJsZVwiLGhlYWRlcjpjYXBbMV0ucmVwbGFjZSgvXiAqfCAqXFx8ICokL2csXCJcIikuc3BsaXQoLyAqXFx8ICovKSxhbGlnbjpjYXBbMl0ucmVwbGFjZSgvXiAqfFxcfCAqJC9nLFwiXCIpLnNwbGl0KC8gKlxcfCAqLyksY2VsbHM6Y2FwWzNdLnJlcGxhY2UoLyg/OiAqXFx8ICopP1xcbiQvLFwiXCIpLnNwbGl0KFwiXFxuXCIpfTtmb3IoaT0wO2k8aXRlbS5hbGlnbi5sZW5ndGg7aSsrKXtpZigvXiAqLSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKXtpdGVtLmFsaWduW2ldPVwicmlnaHRcIn1lbHNlIGlmKC9eICo6LSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKXtpdGVtLmFsaWduW2ldPVwiY2VudGVyXCJ9ZWxzZSBpZigvXiAqOi0rICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKXtpdGVtLmFsaWduW2ldPVwibGVmdFwifWVsc2V7aXRlbS5hbGlnbltpXT1udWxsfX1mb3IoaT0wO2k8aXRlbS5jZWxscy5sZW5ndGg7aSsrKXtpdGVtLmNlbGxzW2ldPWl0ZW0uY2VsbHNbaV0ucmVwbGFjZSgvXiAqXFx8ICp8ICpcXHwgKiQvZyxcIlwiKS5zcGxpdCgvICpcXHwgKi8pfXRoaXMudG9rZW5zLnB1c2goaXRlbSk7Y29udGludWV9aWYodG9wJiYoY2FwPXRoaXMucnVsZXMucGFyYWdyYXBoLmV4ZWMoc3JjKSkpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO3RoaXMudG9rZW5zLnB1c2goe3R5cGU6XCJwYXJhZ3JhcGhcIix0ZXh0OmNhcFsxXS5jaGFyQXQoY2FwWzFdLmxlbmd0aC0xKT09PVwiXFxuXCI/Y2FwWzFdLnNsaWNlKDAsLTEpOmNhcFsxXX0pO2NvbnRpbnVlfWlmKGNhcD10aGlzLnJ1bGVzLnRleHQuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTt0aGlzLnRva2Vucy5wdXNoKHt0eXBlOlwidGV4dFwiLHRleHQ6Y2FwWzBdfSk7Y29udGludWV9aWYoc3JjKXt0aHJvdyBuZXcgRXJyb3IoXCJJbmZpbml0ZSBsb29wIG9uIGJ5dGU6IFwiK3NyYy5jaGFyQ29kZUF0KDApKX19cmV0dXJuIHRoaXMudG9rZW5zfTt2YXIgaW5saW5lPXtlc2NhcGU6L15cXFxcKFtcXFxcYCp7fVxcW1xcXSgpIytcXC0uIV8+XSkvLGF1dG9saW5rOi9ePChbXiA+XSsoQHw6XFwvKVteID5dKyk+Lyx1cmw6bm9vcCx0YWc6L148IS0tW1xcc1xcU10qPy0tPnxePFxcLz9cXHcrKD86XCJbXlwiXSpcInwnW14nXSonfFteJ1wiPl0pKj8+LyxsaW5rOi9eIT9cXFsoaW5zaWRlKVxcXVxcKGhyZWZcXCkvLHJlZmxpbms6L14hP1xcWyhpbnNpZGUpXFxdXFxzKlxcWyhbXlxcXV0qKVxcXS8sbm9saW5rOi9eIT9cXFsoKD86XFxbW15cXF1dKlxcXXxbXlxcW1xcXV0pKilcXF0vLHN0cm9uZzovXl9fKFtcXHNcXFNdKz8pX18oPyFfKXxeXFwqXFwqKFtcXHNcXFNdKz8pXFwqXFwqKD8hXFwqKS8sZW06L15cXGJfKCg/OlteX118X18pKz8pX1xcYnxeXFwqKCg/OlxcKlxcKnxbXFxzXFxTXSkrPylcXCooPyFcXCopLyxjb2RlOi9eKGArKVxccyooW1xcc1xcU10qP1teYF0pXFxzKlxcMSg/IWApLyxicjovXiB7Mix9XFxuKD8hXFxzKiQpLyxkZWw6bm9vcCx0ZXh0Oi9eW1xcc1xcU10rPyg/PVtcXFxcPCFcXFtfKmBdfCB7Mix9XFxufCQpL307aW5saW5lLl9pbnNpZGU9Lyg/OlxcW1teXFxdXSpcXF18W15cXFtcXF1dfFxcXSg/PVteXFxbXSpcXF0pKSovO2lubGluZS5faHJlZj0vXFxzKjw/KFtcXHNcXFNdKj8pPj8oPzpcXHMrWydcIl0oW1xcc1xcU10qPylbJ1wiXSk/XFxzKi87aW5saW5lLmxpbms9cmVwbGFjZShpbmxpbmUubGluaykoXCJpbnNpZGVcIixpbmxpbmUuX2luc2lkZSkoXCJocmVmXCIsaW5saW5lLl9ocmVmKSgpO2lubGluZS5yZWZsaW5rPXJlcGxhY2UoaW5saW5lLnJlZmxpbmspKFwiaW5zaWRlXCIsaW5saW5lLl9pbnNpZGUpKCk7aW5saW5lLm5vcm1hbD1tZXJnZSh7fSxpbmxpbmUpO2lubGluZS5wZWRhbnRpYz1tZXJnZSh7fSxpbmxpbmUubm9ybWFsLHtzdHJvbmc6L15fXyg/PVxcUykoW1xcc1xcU10qP1xcUylfXyg/IV8pfF5cXCpcXCooPz1cXFMpKFtcXHNcXFNdKj9cXFMpXFwqXFwqKD8hXFwqKS8sZW06L15fKD89XFxTKShbXFxzXFxTXSo/XFxTKV8oPyFfKXxeXFwqKD89XFxTKShbXFxzXFxTXSo/XFxTKVxcKig/IVxcKikvfSk7aW5saW5lLmdmbT1tZXJnZSh7fSxpbmxpbmUubm9ybWFsLHtlc2NhcGU6cmVwbGFjZShpbmxpbmUuZXNjYXBlKShcIl0pXCIsXCJ+fF0pXCIpKCksdXJsOi9eKGh0dHBzPzpcXC9cXC9bXlxcczxdK1tePC4sOjtcIicpXFxdXFxzXSkvLGRlbDovXn5+KD89XFxTKShbXFxzXFxTXSo/XFxTKX5+Lyx0ZXh0OnJlcGxhY2UoaW5saW5lLnRleHQpKFwiXXxcIixcIn5dfFwiKShcInxcIixcInxodHRwcz86Ly98XCIpKCl9KTtpbmxpbmUuYnJlYWtzPW1lcmdlKHt9LGlubGluZS5nZm0se2JyOnJlcGxhY2UoaW5saW5lLmJyKShcInsyLH1cIixcIipcIikoKSx0ZXh0OnJlcGxhY2UoaW5saW5lLmdmbS50ZXh0KShcInsyLH1cIixcIipcIikoKX0pO2Z1bmN0aW9uIElubGluZUxleGVyKGxpbmtzLG9wdGlvbnMpe3RoaXMub3B0aW9ucz1vcHRpb25zfHxtYXJrZWQuZGVmYXVsdHM7dGhpcy5saW5rcz1saW5rczt0aGlzLnJ1bGVzPWlubGluZS5ub3JtYWw7dGhpcy5yZW5kZXJlcj10aGlzLm9wdGlvbnMucmVuZGVyZXJ8fG5ldyBSZW5kZXJlcjt0aGlzLnJlbmRlcmVyLm9wdGlvbnM9dGhpcy5vcHRpb25zO2lmKCF0aGlzLmxpbmtzKXt0aHJvdyBuZXcgRXJyb3IoXCJUb2tlbnMgYXJyYXkgcmVxdWlyZXMgYSBgbGlua3NgIHByb3BlcnR5LlwiKX1pZih0aGlzLm9wdGlvbnMuZ2ZtKXtpZih0aGlzLm9wdGlvbnMuYnJlYWtzKXt0aGlzLnJ1bGVzPWlubGluZS5icmVha3N9ZWxzZXt0aGlzLnJ1bGVzPWlubGluZS5nZm19fWVsc2UgaWYodGhpcy5vcHRpb25zLnBlZGFudGljKXt0aGlzLnJ1bGVzPWlubGluZS5wZWRhbnRpY319SW5saW5lTGV4ZXIucnVsZXM9aW5saW5lO0lubGluZUxleGVyLm91dHB1dD1mdW5jdGlvbihzcmMsbGlua3Msb3B0aW9ucyl7dmFyIGlubGluZT1uZXcgSW5saW5lTGV4ZXIobGlua3Msb3B0aW9ucyk7cmV0dXJuIGlubGluZS5vdXRwdXQoc3JjKX07SW5saW5lTGV4ZXIucHJvdG90eXBlLm91dHB1dD1mdW5jdGlvbihzcmMpe3ZhciBvdXQ9XCJcIixsaW5rLHRleHQsaHJlZixjYXA7d2hpbGUoc3JjKXtpZihjYXA9dGhpcy5ydWxlcy5lc2NhcGUuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtvdXQrPWNhcFsxXTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy5hdXRvbGluay5leGVjKHNyYykpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO2lmKGNhcFsyXT09PVwiQFwiKXt0ZXh0PWNhcFsxXS5jaGFyQXQoNik9PT1cIjpcIj90aGlzLm1hbmdsZShjYXBbMV0uc3Vic3RyaW5nKDcpKTp0aGlzLm1hbmdsZShjYXBbMV0pO2hyZWY9dGhpcy5tYW5nbGUoXCJtYWlsdG86XCIpK3RleHR9ZWxzZXt0ZXh0PWVzY2FwZShjYXBbMV0pO2hyZWY9dGV4dH1vdXQrPXRoaXMucmVuZGVyZXIubGluayhocmVmLG51bGwsdGV4dCk7Y29udGludWV9aWYoIXRoaXMuaW5MaW5rJiYoY2FwPXRoaXMucnVsZXMudXJsLmV4ZWMoc3JjKSkpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO3RleHQ9ZXNjYXBlKGNhcFsxXSk7aHJlZj10ZXh0O291dCs9dGhpcy5yZW5kZXJlci5saW5rKGhyZWYsbnVsbCx0ZXh0KTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy50YWcuZXhlYyhzcmMpKXtpZighdGhpcy5pbkxpbmsmJi9ePGEgL2kudGVzdChjYXBbMF0pKXt0aGlzLmluTGluaz10cnVlfWVsc2UgaWYodGhpcy5pbkxpbmsmJi9ePFxcL2E+L2kudGVzdChjYXBbMF0pKXt0aGlzLmluTGluaz1mYWxzZX1zcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtvdXQrPXRoaXMub3B0aW9ucy5zYW5pdGl6ZT90aGlzLm9wdGlvbnMuc2FuaXRpemVyP3RoaXMub3B0aW9ucy5zYW5pdGl6ZXIoY2FwWzBdKTplc2NhcGUoY2FwWzBdKTpjYXBbMF07Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMubGluay5leGVjKHNyYykpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO3RoaXMuaW5MaW5rPXRydWU7b3V0Kz10aGlzLm91dHB1dExpbmsoY2FwLHtocmVmOmNhcFsyXSx0aXRsZTpjYXBbM119KTt0aGlzLmluTGluaz1mYWxzZTtjb250aW51ZX1pZigoY2FwPXRoaXMucnVsZXMucmVmbGluay5leGVjKHNyYykpfHwoY2FwPXRoaXMucnVsZXMubm9saW5rLmV4ZWMoc3JjKSkpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO2xpbms9KGNhcFsyXXx8Y2FwWzFdKS5yZXBsYWNlKC9cXHMrL2csXCIgXCIpO2xpbms9dGhpcy5saW5rc1tsaW5rLnRvTG93ZXJDYXNlKCldO2lmKCFsaW5rfHwhbGluay5ocmVmKXtvdXQrPWNhcFswXS5jaGFyQXQoMCk7c3JjPWNhcFswXS5zdWJzdHJpbmcoMSkrc3JjO2NvbnRpbnVlfXRoaXMuaW5MaW5rPXRydWU7b3V0Kz10aGlzLm91dHB1dExpbmsoY2FwLGxpbmspO3RoaXMuaW5MaW5rPWZhbHNlO2NvbnRpbnVlfWlmKGNhcD10aGlzLnJ1bGVzLnN0cm9uZy5leGVjKHNyYykpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO291dCs9dGhpcy5yZW5kZXJlci5zdHJvbmcodGhpcy5vdXRwdXQoY2FwWzJdfHxjYXBbMV0pKTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy5lbS5leGVjKHNyYykpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO291dCs9dGhpcy5yZW5kZXJlci5lbSh0aGlzLm91dHB1dChjYXBbMl18fGNhcFsxXSkpO2NvbnRpbnVlfWlmKGNhcD10aGlzLnJ1bGVzLmNvZGUuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtvdXQrPXRoaXMucmVuZGVyZXIuY29kZXNwYW4oZXNjYXBlKGNhcFsyXSx0cnVlKSk7Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMuYnIuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtvdXQrPXRoaXMucmVuZGVyZXIuYnIoKTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy5kZWwuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtvdXQrPXRoaXMucmVuZGVyZXIuZGVsKHRoaXMub3V0cHV0KGNhcFsxXSkpO2NvbnRpbnVlfWlmKGNhcD10aGlzLnJ1bGVzLnRleHQuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtvdXQrPXRoaXMucmVuZGVyZXIudGV4dChlc2NhcGUodGhpcy5zbWFydHlwYW50cyhjYXBbMF0pKSk7Y29udGludWV9aWYoc3JjKXt0aHJvdyBuZXcgRXJyb3IoXCJJbmZpbml0ZSBsb29wIG9uIGJ5dGU6IFwiK3NyYy5jaGFyQ29kZUF0KDApKX19cmV0dXJuIG91dH07SW5saW5lTGV4ZXIucHJvdG90eXBlLm91dHB1dExpbms9ZnVuY3Rpb24oY2FwLGxpbmspe3ZhciBocmVmPWVzY2FwZShsaW5rLmhyZWYpLHRpdGxlPWxpbmsudGl0bGU/ZXNjYXBlKGxpbmsudGl0bGUpOm51bGw7cmV0dXJuIGNhcFswXS5jaGFyQXQoMCkhPT1cIiFcIj90aGlzLnJlbmRlcmVyLmxpbmsoaHJlZix0aXRsZSx0aGlzLm91dHB1dChjYXBbMV0pKTp0aGlzLnJlbmRlcmVyLmltYWdlKGhyZWYsdGl0bGUsZXNjYXBlKGNhcFsxXSkpfTtJbmxpbmVMZXhlci5wcm90b3R5cGUuc21hcnR5cGFudHM9ZnVuY3Rpb24odGV4dCl7aWYoIXRoaXMub3B0aW9ucy5zbWFydHlwYW50cylyZXR1cm4gdGV4dDtyZXR1cm4gdGV4dC5yZXBsYWNlKC8tLS0vZyxcIuKAlFwiKS5yZXBsYWNlKC8tLS9nLFwi4oCTXCIpLnJlcGxhY2UoLyhefFstXFx1MjAxNC8oXFxbe1wiXFxzXSknL2csXCIkMeKAmFwiKS5yZXBsYWNlKC8nL2csXCLigJlcIikucmVwbGFjZSgvKF58Wy1cXHUyMDE0LyhcXFt7XFx1MjAxOFxcc10pXCIvZyxcIiQx4oCcXCIpLnJlcGxhY2UoL1wiL2csXCLigJ1cIikucmVwbGFjZSgvXFwuezN9L2csXCLigKZcIil9O0lubGluZUxleGVyLnByb3RvdHlwZS5tYW5nbGU9ZnVuY3Rpb24odGV4dCl7aWYoIXRoaXMub3B0aW9ucy5tYW5nbGUpcmV0dXJuIHRleHQ7dmFyIG91dD1cIlwiLGw9dGV4dC5sZW5ndGgsaT0wLGNoO2Zvcig7aTxsO2krKyl7Y2g9dGV4dC5jaGFyQ29kZUF0KGkpO2lmKE1hdGgucmFuZG9tKCk+LjUpe2NoPVwieFwiK2NoLnRvU3RyaW5nKDE2KX1vdXQrPVwiJiNcIitjaCtcIjtcIn1yZXR1cm4gb3V0fTtmdW5jdGlvbiBSZW5kZXJlcihvcHRpb25zKXt0aGlzLm9wdGlvbnM9b3B0aW9uc3x8e319UmVuZGVyZXIucHJvdG90eXBlLmNvZGU9ZnVuY3Rpb24oY29kZSxsYW5nLGVzY2FwZWQpe2lmKHRoaXMub3B0aW9ucy5oaWdobGlnaHQpe3ZhciBvdXQ9dGhpcy5vcHRpb25zLmhpZ2hsaWdodChjb2RlLGxhbmcpO2lmKG91dCE9bnVsbCYmb3V0IT09Y29kZSl7ZXNjYXBlZD10cnVlO2NvZGU9b3V0fX1pZighbGFuZyl7cmV0dXJuXCI8cHJlPjxjb2RlPlwiKyhlc2NhcGVkP2NvZGU6ZXNjYXBlKGNvZGUsdHJ1ZSkpK1wiXFxuPC9jb2RlPjwvcHJlPlwifXJldHVybic8cHJlPjxjb2RlIGNsYXNzPVwiJyt0aGlzLm9wdGlvbnMubGFuZ1ByZWZpeCtlc2NhcGUobGFuZyx0cnVlKSsnXCI+JysoZXNjYXBlZD9jb2RlOmVzY2FwZShjb2RlLHRydWUpKStcIlxcbjwvY29kZT48L3ByZT5cXG5cIn07UmVuZGVyZXIucHJvdG90eXBlLmJsb2NrcXVvdGU9ZnVuY3Rpb24ocXVvdGUpe3JldHVyblwiPGJsb2NrcXVvdGU+XFxuXCIrcXVvdGUrXCI8L2Jsb2NrcXVvdGU+XFxuXCJ9O1JlbmRlcmVyLnByb3RvdHlwZS5odG1sPWZ1bmN0aW9uKGh0bWwpe3JldHVybiBodG1sfTtSZW5kZXJlci5wcm90b3R5cGUuaGVhZGluZz1mdW5jdGlvbih0ZXh0LGxldmVsLHJhdyl7cmV0dXJuXCI8aFwiK2xldmVsKycgaWQ9XCInK3RoaXMub3B0aW9ucy5oZWFkZXJQcmVmaXgrcmF3LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15cXHddKy9nLFwiLVwiKSsnXCI+Jyt0ZXh0K1wiPC9oXCIrbGV2ZWwrXCI+XFxuXCJ9O1JlbmRlcmVyLnByb3RvdHlwZS5ocj1mdW5jdGlvbigpe3JldHVybiB0aGlzLm9wdGlvbnMueGh0bWw/XCI8aHIvPlxcblwiOlwiPGhyPlxcblwifTtSZW5kZXJlci5wcm90b3R5cGUubGlzdD1mdW5jdGlvbihib2R5LG9yZGVyZWQpe3ZhciB0eXBlPW9yZGVyZWQ/XCJvbFwiOlwidWxcIjtyZXR1cm5cIjxcIit0eXBlK1wiPlxcblwiK2JvZHkrXCI8L1wiK3R5cGUrXCI+XFxuXCJ9O1JlbmRlcmVyLnByb3RvdHlwZS5saXN0aXRlbT1mdW5jdGlvbih0ZXh0KXtyZXR1cm5cIjxsaT5cIit0ZXh0K1wiPC9saT5cXG5cIn07UmVuZGVyZXIucHJvdG90eXBlLnBhcmFncmFwaD1mdW5jdGlvbih0ZXh0KXtyZXR1cm5cIjxwPlwiK3RleHQrXCI8L3A+XFxuXCJ9O1JlbmRlcmVyLnByb3RvdHlwZS50YWJsZT1mdW5jdGlvbihoZWFkZXIsYm9keSl7cmV0dXJuXCI8dGFibGU+XFxuXCIrXCI8dGhlYWQ+XFxuXCIraGVhZGVyK1wiPC90aGVhZD5cXG5cIitcIjx0Ym9keT5cXG5cIitib2R5K1wiPC90Ym9keT5cXG5cIitcIjwvdGFibGU+XFxuXCJ9O1JlbmRlcmVyLnByb3RvdHlwZS50YWJsZXJvdz1mdW5jdGlvbihjb250ZW50KXtyZXR1cm5cIjx0cj5cXG5cIitjb250ZW50K1wiPC90cj5cXG5cIn07UmVuZGVyZXIucHJvdG90eXBlLnRhYmxlY2VsbD1mdW5jdGlvbihjb250ZW50LGZsYWdzKXt2YXIgdHlwZT1mbGFncy5oZWFkZXI/XCJ0aFwiOlwidGRcIjt2YXIgdGFnPWZsYWdzLmFsaWduP1wiPFwiK3R5cGUrJyBzdHlsZT1cInRleHQtYWxpZ246JytmbGFncy5hbGlnbisnXCI+JzpcIjxcIit0eXBlK1wiPlwiO3JldHVybiB0YWcrY29udGVudCtcIjwvXCIrdHlwZStcIj5cXG5cIn07UmVuZGVyZXIucHJvdG90eXBlLnN0cm9uZz1mdW5jdGlvbih0ZXh0KXtyZXR1cm5cIjxzdHJvbmc+XCIrdGV4dCtcIjwvc3Ryb25nPlwifTtSZW5kZXJlci5wcm90b3R5cGUuZW09ZnVuY3Rpb24odGV4dCl7cmV0dXJuXCI8ZW0+XCIrdGV4dCtcIjwvZW0+XCJ9O1JlbmRlcmVyLnByb3RvdHlwZS5jb2Rlc3Bhbj1mdW5jdGlvbih0ZXh0KXtyZXR1cm5cIjxjb2RlPlwiK3RleHQrXCI8L2NvZGU+XCJ9O1JlbmRlcmVyLnByb3RvdHlwZS5icj1mdW5jdGlvbigpe3JldHVybiB0aGlzLm9wdGlvbnMueGh0bWw/XCI8YnIvPlwiOlwiPGJyPlwifTtSZW5kZXJlci5wcm90b3R5cGUuZGVsPWZ1bmN0aW9uKHRleHQpe3JldHVyblwiPGRlbD5cIit0ZXh0K1wiPC9kZWw+XCJ9O1JlbmRlcmVyLnByb3RvdHlwZS5saW5rPWZ1bmN0aW9uKGhyZWYsdGl0bGUsdGV4dCl7aWYodGhpcy5vcHRpb25zLnNhbml0aXplKXt0cnl7dmFyIHByb3Q9ZGVjb2RlVVJJQ29tcG9uZW50KHVuZXNjYXBlKGhyZWYpKS5yZXBsYWNlKC9bXlxcdzpdL2csXCJcIikudG9Mb3dlckNhc2UoKX1jYXRjaChlKXtyZXR1cm5cIlwifWlmKHByb3QuaW5kZXhPZihcImphdmFzY3JpcHQ6XCIpPT09MHx8cHJvdC5pbmRleE9mKFwidmJzY3JpcHQ6XCIpPT09MCl7cmV0dXJuXCJcIn19dmFyIG91dD0nPGEgaHJlZj1cIicraHJlZisnXCInO2lmKHRpdGxlKXtvdXQrPScgdGl0bGU9XCInK3RpdGxlKydcIid9b3V0Kz1cIj5cIit0ZXh0K1wiPC9hPlwiO3JldHVybiBvdXR9O1JlbmRlcmVyLnByb3RvdHlwZS5pbWFnZT1mdW5jdGlvbihocmVmLHRpdGxlLHRleHQpe3ZhciBvdXQ9JzxpbWcgc3JjPVwiJytocmVmKydcIiBhbHQ9XCInK3RleHQrJ1wiJztpZih0aXRsZSl7b3V0Kz0nIHRpdGxlPVwiJyt0aXRsZSsnXCInfW91dCs9dGhpcy5vcHRpb25zLnhodG1sP1wiLz5cIjpcIj5cIjtyZXR1cm4gb3V0fTtSZW5kZXJlci5wcm90b3R5cGUudGV4dD1mdW5jdGlvbih0ZXh0KXtyZXR1cm4gdGV4dH07ZnVuY3Rpb24gUGFyc2VyKG9wdGlvbnMpe3RoaXMudG9rZW5zPVtdO3RoaXMudG9rZW49bnVsbDt0aGlzLm9wdGlvbnM9b3B0aW9uc3x8bWFya2VkLmRlZmF1bHRzO3RoaXMub3B0aW9ucy5yZW5kZXJlcj10aGlzLm9wdGlvbnMucmVuZGVyZXJ8fG5ldyBSZW5kZXJlcjt0aGlzLnJlbmRlcmVyPXRoaXMub3B0aW9ucy5yZW5kZXJlcjt0aGlzLnJlbmRlcmVyLm9wdGlvbnM9dGhpcy5vcHRpb25zfVBhcnNlci5wYXJzZT1mdW5jdGlvbihzcmMsb3B0aW9ucyxyZW5kZXJlcil7dmFyIHBhcnNlcj1uZXcgUGFyc2VyKG9wdGlvbnMscmVuZGVyZXIpO3JldHVybiBwYXJzZXIucGFyc2Uoc3JjKX07UGFyc2VyLnByb3RvdHlwZS5wYXJzZT1mdW5jdGlvbihzcmMpe3RoaXMuaW5saW5lPW5ldyBJbmxpbmVMZXhlcihzcmMubGlua3MsdGhpcy5vcHRpb25zLHRoaXMucmVuZGVyZXIpO3RoaXMudG9rZW5zPXNyYy5yZXZlcnNlKCk7dmFyIG91dD1cIlwiO3doaWxlKHRoaXMubmV4dCgpKXtvdXQrPXRoaXMudG9rKCl9cmV0dXJuIG91dH07UGFyc2VyLnByb3RvdHlwZS5uZXh0PWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudG9rZW49dGhpcy50b2tlbnMucG9wKCl9O1BhcnNlci5wcm90b3R5cGUucGVlaz1mdW5jdGlvbigpe3JldHVybiB0aGlzLnRva2Vuc1t0aGlzLnRva2Vucy5sZW5ndGgtMV18fDB9O1BhcnNlci5wcm90b3R5cGUucGFyc2VUZXh0PWZ1bmN0aW9uKCl7dmFyIGJvZHk9dGhpcy50b2tlbi50ZXh0O3doaWxlKHRoaXMucGVlaygpLnR5cGU9PT1cInRleHRcIil7Ym9keSs9XCJcXG5cIit0aGlzLm5leHQoKS50ZXh0fXJldHVybiB0aGlzLmlubGluZS5vdXRwdXQoYm9keSl9O1BhcnNlci5wcm90b3R5cGUudG9rPWZ1bmN0aW9uKCl7c3dpdGNoKHRoaXMudG9rZW4udHlwZSl7Y2FzZVwic3BhY2VcIjp7cmV0dXJuXCJcIn1jYXNlXCJoclwiOntyZXR1cm4gdGhpcy5yZW5kZXJlci5ocigpfWNhc2VcImhlYWRpbmdcIjp7cmV0dXJuIHRoaXMucmVuZGVyZXIuaGVhZGluZyh0aGlzLmlubGluZS5vdXRwdXQodGhpcy50b2tlbi50ZXh0KSx0aGlzLnRva2VuLmRlcHRoLHRoaXMudG9rZW4udGV4dCl9Y2FzZVwiY29kZVwiOntyZXR1cm4gdGhpcy5yZW5kZXJlci5jb2RlKHRoaXMudG9rZW4udGV4dCx0aGlzLnRva2VuLmxhbmcsdGhpcy50b2tlbi5lc2NhcGVkKX1jYXNlXCJ0YWJsZVwiOnt2YXIgaGVhZGVyPVwiXCIsYm9keT1cIlwiLGkscm93LGNlbGwsZmxhZ3MsajtjZWxsPVwiXCI7Zm9yKGk9MDtpPHRoaXMudG9rZW4uaGVhZGVyLmxlbmd0aDtpKyspe2ZsYWdzPXtoZWFkZXI6dHJ1ZSxhbGlnbjp0aGlzLnRva2VuLmFsaWduW2ldfTtjZWxsKz10aGlzLnJlbmRlcmVyLnRhYmxlY2VsbCh0aGlzLmlubGluZS5vdXRwdXQodGhpcy50b2tlbi5oZWFkZXJbaV0pLHtoZWFkZXI6dHJ1ZSxhbGlnbjp0aGlzLnRva2VuLmFsaWduW2ldfSl9aGVhZGVyKz10aGlzLnJlbmRlcmVyLnRhYmxlcm93KGNlbGwpO2ZvcihpPTA7aTx0aGlzLnRva2VuLmNlbGxzLmxlbmd0aDtpKyspe3Jvdz10aGlzLnRva2VuLmNlbGxzW2ldO2NlbGw9XCJcIjtmb3Ioaj0wO2o8cm93Lmxlbmd0aDtqKyspe2NlbGwrPXRoaXMucmVuZGVyZXIudGFibGVjZWxsKHRoaXMuaW5saW5lLm91dHB1dChyb3dbal0pLHtoZWFkZXI6ZmFsc2UsYWxpZ246dGhpcy50b2tlbi5hbGlnbltqXX0pfWJvZHkrPXRoaXMucmVuZGVyZXIudGFibGVyb3coY2VsbCl9cmV0dXJuIHRoaXMucmVuZGVyZXIudGFibGUoaGVhZGVyLGJvZHkpfWNhc2VcImJsb2NrcXVvdGVfc3RhcnRcIjp7dmFyIGJvZHk9XCJcIjt3aGlsZSh0aGlzLm5leHQoKS50eXBlIT09XCJibG9ja3F1b3RlX2VuZFwiKXtib2R5Kz10aGlzLnRvaygpfXJldHVybiB0aGlzLnJlbmRlcmVyLmJsb2NrcXVvdGUoYm9keSl9Y2FzZVwibGlzdF9zdGFydFwiOnt2YXIgYm9keT1cIlwiLG9yZGVyZWQ9dGhpcy50b2tlbi5vcmRlcmVkO3doaWxlKHRoaXMubmV4dCgpLnR5cGUhPT1cImxpc3RfZW5kXCIpe2JvZHkrPXRoaXMudG9rKCl9cmV0dXJuIHRoaXMucmVuZGVyZXIubGlzdChib2R5LG9yZGVyZWQpfWNhc2VcImxpc3RfaXRlbV9zdGFydFwiOnt2YXIgYm9keT1cIlwiO3doaWxlKHRoaXMubmV4dCgpLnR5cGUhPT1cImxpc3RfaXRlbV9lbmRcIil7Ym9keSs9dGhpcy50b2tlbi50eXBlPT09XCJ0ZXh0XCI/dGhpcy5wYXJzZVRleHQoKTp0aGlzLnRvaygpfXJldHVybiB0aGlzLnJlbmRlcmVyLmxpc3RpdGVtKGJvZHkpfWNhc2VcImxvb3NlX2l0ZW1fc3RhcnRcIjp7dmFyIGJvZHk9XCJcIjt3aGlsZSh0aGlzLm5leHQoKS50eXBlIT09XCJsaXN0X2l0ZW1fZW5kXCIpe2JvZHkrPXRoaXMudG9rKCl9cmV0dXJuIHRoaXMucmVuZGVyZXIubGlzdGl0ZW0oYm9keSl9Y2FzZVwiaHRtbFwiOnt2YXIgaHRtbD0hdGhpcy50b2tlbi5wcmUmJiF0aGlzLm9wdGlvbnMucGVkYW50aWM/dGhpcy5pbmxpbmUub3V0cHV0KHRoaXMudG9rZW4udGV4dCk6dGhpcy50b2tlbi50ZXh0O3JldHVybiB0aGlzLnJlbmRlcmVyLmh0bWwoaHRtbCl9Y2FzZVwicGFyYWdyYXBoXCI6e3JldHVybiB0aGlzLnJlbmRlcmVyLnBhcmFncmFwaCh0aGlzLmlubGluZS5vdXRwdXQodGhpcy50b2tlbi50ZXh0KSl9Y2FzZVwidGV4dFwiOntyZXR1cm4gdGhpcy5yZW5kZXJlci5wYXJhZ3JhcGgodGhpcy5wYXJzZVRleHQoKSl9fX07ZnVuY3Rpb24gZXNjYXBlKGh0bWwsZW5jb2RlKXtyZXR1cm4gaHRtbC5yZXBsYWNlKCFlbmNvZGU/LyYoPyEjP1xcdys7KS9nOi8mL2csXCImYW1wO1wiKS5yZXBsYWNlKC88L2csXCImbHQ7XCIpLnJlcGxhY2UoLz4vZyxcIiZndDtcIikucmVwbGFjZSgvXCIvZyxcIiZxdW90O1wiKS5yZXBsYWNlKC8nL2csXCImIzM5O1wiKX1mdW5jdGlvbiB1bmVzY2FwZShodG1sKXtyZXR1cm4gaHRtbC5yZXBsYWNlKC8mKFsjXFx3XSspOy9nLGZ1bmN0aW9uKF8sbil7bj1uLnRvTG93ZXJDYXNlKCk7aWYobj09PVwiY29sb25cIilyZXR1cm5cIjpcIjtpZihuLmNoYXJBdCgwKT09PVwiI1wiKXtyZXR1cm4gbi5jaGFyQXQoMSk9PT1cInhcIj9TdHJpbmcuZnJvbUNoYXJDb2RlKHBhcnNlSW50KG4uc3Vic3RyaW5nKDIpLDE2KSk6U3RyaW5nLmZyb21DaGFyQ29kZSgrbi5zdWJzdHJpbmcoMSkpfXJldHVyblwiXCJ9KX1mdW5jdGlvbiByZXBsYWNlKHJlZ2V4LG9wdCl7cmVnZXg9cmVnZXguc291cmNlO29wdD1vcHR8fFwiXCI7cmV0dXJuIGZ1bmN0aW9uIHNlbGYobmFtZSx2YWwpe2lmKCFuYW1lKXJldHVybiBuZXcgUmVnRXhwKHJlZ2V4LG9wdCk7dmFsPXZhbC5zb3VyY2V8fHZhbDt2YWw9dmFsLnJlcGxhY2UoLyhefFteXFxbXSlcXF4vZyxcIiQxXCIpO3JlZ2V4PXJlZ2V4LnJlcGxhY2UobmFtZSx2YWwpO3JldHVybiBzZWxmfX1mdW5jdGlvbiBub29wKCl7fW5vb3AuZXhlYz1ub29wO2Z1bmN0aW9uIG1lcmdlKG9iail7dmFyIGk9MSx0YXJnZXQsa2V5O2Zvcig7aTxhcmd1bWVudHMubGVuZ3RoO2krKyl7dGFyZ2V0PWFyZ3VtZW50c1tpXTtmb3Ioa2V5IGluIHRhcmdldCl7aWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRhcmdldCxrZXkpKXtvYmpba2V5XT10YXJnZXRba2V5XX19fXJldHVybiBvYmp9ZnVuY3Rpb24gbWFya2VkKHNyYyxvcHQsY2FsbGJhY2spe2lmKGNhbGxiYWNrfHx0eXBlb2Ygb3B0PT09XCJmdW5jdGlvblwiKXtpZighY2FsbGJhY2spe2NhbGxiYWNrPW9wdDtvcHQ9bnVsbH1vcHQ9bWVyZ2Uoe30sbWFya2VkLmRlZmF1bHRzLG9wdHx8e30pO3ZhciBoaWdobGlnaHQ9b3B0LmhpZ2hsaWdodCx0b2tlbnMscGVuZGluZyxpPTA7dHJ5e3Rva2Vucz1MZXhlci5sZXgoc3JjLG9wdCl9Y2F0Y2goZSl7cmV0dXJuIGNhbGxiYWNrKGUpfXBlbmRpbmc9dG9rZW5zLmxlbmd0aDt2YXIgZG9uZT1mdW5jdGlvbihlcnIpe2lmKGVycil7b3B0LmhpZ2hsaWdodD1oaWdobGlnaHQ7cmV0dXJuIGNhbGxiYWNrKGVycil9dmFyIG91dDt0cnl7b3V0PVBhcnNlci5wYXJzZSh0b2tlbnMsb3B0KX1jYXRjaChlKXtlcnI9ZX1vcHQuaGlnaGxpZ2h0PWhpZ2hsaWdodDtyZXR1cm4gZXJyP2NhbGxiYWNrKGVycik6Y2FsbGJhY2sobnVsbCxvdXQpfTtpZighaGlnaGxpZ2h0fHxoaWdobGlnaHQubGVuZ3RoPDMpe3JldHVybiBkb25lKCl9ZGVsZXRlIG9wdC5oaWdobGlnaHQ7aWYoIXBlbmRpbmcpcmV0dXJuIGRvbmUoKTtmb3IoO2k8dG9rZW5zLmxlbmd0aDtpKyspeyhmdW5jdGlvbih0b2tlbil7aWYodG9rZW4udHlwZSE9PVwiY29kZVwiKXtyZXR1cm4tLXBlbmRpbmd8fGRvbmUoKX1yZXR1cm4gaGlnaGxpZ2h0KHRva2VuLnRleHQsdG9rZW4ubGFuZyxmdW5jdGlvbihlcnIsY29kZSl7aWYoZXJyKXJldHVybiBkb25lKGVycik7aWYoY29kZT09bnVsbHx8Y29kZT09PXRva2VuLnRleHQpe3JldHVybi0tcGVuZGluZ3x8ZG9uZSgpfXRva2VuLnRleHQ9Y29kZTt0b2tlbi5lc2NhcGVkPXRydWU7LS1wZW5kaW5nfHxkb25lKCl9KX0pKHRva2Vuc1tpXSl9cmV0dXJufXRyeXtpZihvcHQpb3B0PW1lcmdlKHt9LG1hcmtlZC5kZWZhdWx0cyxvcHQpO3JldHVybiBQYXJzZXIucGFyc2UoTGV4ZXIubGV4KHNyYyxvcHQpLG9wdCl9Y2F0Y2goZSl7ZS5tZXNzYWdlKz1cIlxcblBsZWFzZSByZXBvcnQgdGhpcyB0byBodHRwczovL2dpdGh1Yi5jb20vY2hqai9tYXJrZWQuXCI7aWYoKG9wdHx8bWFya2VkLmRlZmF1bHRzKS5zaWxlbnQpe3JldHVyblwiPHA+QW4gZXJyb3Igb2NjdXJlZDo8L3A+PHByZT5cIitlc2NhcGUoZS5tZXNzYWdlK1wiXCIsdHJ1ZSkrXCI8L3ByZT5cIn10aHJvdyBlfX1tYXJrZWQub3B0aW9ucz1tYXJrZWQuc2V0T3B0aW9ucz1mdW5jdGlvbihvcHQpe21lcmdlKG1hcmtlZC5kZWZhdWx0cyxvcHQpO3JldHVybiBtYXJrZWR9O21hcmtlZC5kZWZhdWx0cz17Z2ZtOnRydWUsdGFibGVzOnRydWUsYnJlYWtzOmZhbHNlLHBlZGFudGljOmZhbHNlLHNhbml0aXplOmZhbHNlLHNhbml0aXplcjpudWxsLG1hbmdsZTp0cnVlLHNtYXJ0TGlzdHM6ZmFsc2Usc2lsZW50OmZhbHNlLGhpZ2hsaWdodDpudWxsLGxhbmdQcmVmaXg6XCJsYW5nLVwiLHNtYXJ0eXBhbnRzOmZhbHNlLGhlYWRlclByZWZpeDpcIlwiLHJlbmRlcmVyOm5ldyBSZW5kZXJlcix4aHRtbDpmYWxzZX07bWFya2VkLlBhcnNlcj1QYXJzZXI7bWFya2VkLnBhcnNlcj1QYXJzZXIucGFyc2U7bWFya2VkLlJlbmRlcmVyPVJlbmRlcmVyO21hcmtlZC5MZXhlcj1MZXhlcjttYXJrZWQubGV4ZXI9TGV4ZXIubGV4O21hcmtlZC5JbmxpbmVMZXhlcj1JbmxpbmVMZXhlcjttYXJrZWQuaW5saW5lTGV4ZXI9SW5saW5lTGV4ZXIub3V0cHV0O21hcmtlZC5wYXJzZT1tYXJrZWQ7aWYodHlwZW9mIG1vZHVsZSE9PVwidW5kZWZpbmVkXCImJnR5cGVvZiBleHBvcnRzPT09XCJvYmplY3RcIil7bW9kdWxlLmV4cG9ydHM9bWFya2VkfWVsc2UgaWYodHlwZW9mIGRlZmluZT09PVwiZnVuY3Rpb25cIiYmZGVmaW5lLmFtZCl7ZGVmaW5lKGZ1bmN0aW9uKCl7cmV0dXJuIG1hcmtlZH0pfWVsc2V7dGhpcy5tYXJrZWQ9bWFya2VkfX0pLmNhbGwoZnVuY3Rpb24oKXtyZXR1cm4gdGhpc3x8KHR5cGVvZiB3aW5kb3chPT1cInVuZGVmaW5lZFwiP3dpbmRvdzpnbG9iYWwpfSgpKTsiLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFJldmVhbCA9IGdsb2JhbC5SZXZlYWwgPSByZXF1aXJlKCdyZXZlYWwuanMnKTtcblxuY29uc3QgaGxqcyA9IGdsb2JhbC5obGpzID0gcmVxdWlyZSgnaGlnaGxpZ2h0LmpzL2xpYi9oaWdobGlnaHQnKTtcbmhsanMucmVnaXN0ZXJMYW5ndWFnZSgnYmFzaCcsIHJlcXVpcmUoJ2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL2Jhc2gnKSk7XG5obGpzLnJlZ2lzdGVyTGFuZ3VhZ2UoJ3NoZWxsJywgcmVxdWlyZSgnaGlnaGxpZ2h0LmpzL2xpYi9sYW5ndWFnZXMvc2hlbGwnKSk7XG5obGpzLnJlZ2lzdGVyTGFuZ3VhZ2UoJ3NoZWxsJywgcmVxdWlyZSgnaGlnaGxpZ2h0LmpzL2xpYi9sYW5ndWFnZXMvc2hlbGwnKSk7XG5obGpzLnJlZ2lzdGVyTGFuZ3VhZ2UoJ3htbCcsIHJlcXVpcmUoJ2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL3htbCcpKTtcbmhsanMucmVnaXN0ZXJMYW5ndWFnZSgnYXNjaWlkb2MnLCByZXF1aXJlKCdoaWdobGlnaHQuanMvbGliL2xhbmd1YWdlcy9hc2NpaWRvYycpKTtcbmhsanMucmVnaXN0ZXJMYW5ndWFnZSgnamF2YXNjcmlwdCcsIHJlcXVpcmUoJ2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL2phdmFzY3JpcHQnKSk7XG5cbmNvbnN0IFJldmVhbE1hcmtkb3duID0gcmVxdWlyZSgncmV2ZWFsLmpzL3BsdWdpbi9tYXJrZG93bi9tYXJrZG93bi5qcycpO1xuXG52YXIgdG9BcnJheSA9IGZ1bmN0aW9uKGFycil7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcnIpO1xufTtcblxuUmV2ZWFsTWFya2Rvd24uaW5pdGlhbGl6ZSgpO1xuUmV2ZWFsLmluaXRpYWxpemUoe1xuICB3aWR0aDogMTAyNCxcbiAgaGVpZ2h0OiA3MjgsXG5cbiAgY29udHJvbHM6IC8obG9jYWxob3N0fCNsaXZlKS8udGVzdChsb2NhdGlvbi5ocmVmKSAhPT0gdHJ1ZSxcbiAgcHJvZ3Jlc3M6IHRydWUsXG4gIGhpc3Rvcnk6IHRydWUsXG4gIGNlbnRlcjogdHJ1ZSxcbiAgb3ZlcnZpZXc6IGZhbHNlLFxuICByb2xsaW5nTGlua3M6IGZhbHNlLFxuXG4gIHRyYW5zaXRpb246ICdsaW5lYXInXG59KTtcblxuLy8gUmV2ZWFsLmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5JywgKCkgPT4gaGxqcy5pbml0SGlnaGxpZ2h0aW5nKCkpO1xuUmV2ZWFsLmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gIHRvQXJyYXkoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYSA+IGltZycpKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXtcbiAgICBlbC5wYXJlbnROb2RlLmNsYXNzTGlzdC5hZGQoJ2ltYWdlJyk7XG4gIH0pO1xuXG4gIHRvQXJyYXkoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnc2VjdGlvbltkYXRhLWJhY2tncm91bmRdJykpLmZvckVhY2goZnVuY3Rpb24oZWwpe1xuICAgIHZhciBpc0VtcHR5ID0gdG9BcnJheShlbC5jaGlsZHJlbikuZXZlcnkoZnVuY3Rpb24oY2hpbGQpe1xuICAgICAgcmV0dXJuICh0eXBlb2YgY2hpbGQubm9kZVZhbHVlID09PSAndGV4dCcgJiYgY2hpbGQubm9kZVZhbHVlLnRyaW0oKSA9PT0gJycpIHx8IGNoaWxkLmNsYXNzTGlzdC5jb250YWlucygnbm90ZXMnKTtcbiAgICB9KTtcblxuICAgIGlmIChpc0VtcHR5KXtcbiAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2VtcHR5Jyk7XG4gICAgfVxuICB9KTtcblxuICB0b0FycmF5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3NlY3Rpb25bZGF0YS1tYXJrZG93bl0gPiBoMSwgc2VjdGlvbltkYXRhLW1hcmtkb3duXSA+IGgyLCBzZWN0aW9uW2RhdGEtbWFya2Rvd25dID4gaDMnKSkuZm9yRWFjaChmdW5jdGlvbihlbCl7XG4gICAgaWYgKGVsLm5leHRFbGVtZW50U2libGluZyAmJiBlbC5uZXh0RWxlbWVudFNpYmxpbmcuY2xhc3NMaXN0LmNvbnRhaW5zKCdub3RlcycpKXtcbiAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2xhc3QtY2hpbGQnKTtcbiAgICB9XG4gIH0pO1xuXG4gIHRvQXJyYXkoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnc2VjdGlvbltkYXRhLW1hcmtkb3duXScpKS5mb3JFYWNoKGZ1bmN0aW9uKHNlY3Rpb24pe1xuICAgIGlmIChzZWN0aW9uLnF1ZXJ5U2VsZWN0b3JBbGwoJ3ByZSA+IGNvZGUnKS5sZW5ndGgpe1xuICAgICAgc2VjdGlvbi5zZXRBdHRyaWJ1dGUoJ2RhdGEtc3RhdGUnLCAnY29kZScpO1xuICAgIH1cbiAgfSk7XG59KTtcbiJdfQ==
