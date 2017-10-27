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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzL2xpYi9oaWdobGlnaHQuanMiLCJub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzL2xpYi9sYW5ndWFnZXMvYXNjaWlkb2MuanMiLCJub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzL2xpYi9sYW5ndWFnZXMvYmFzaC5qcyIsIm5vZGVfbW9kdWxlcy9oaWdobGlnaHQuanMvbGliL2xhbmd1YWdlcy9qYXZhc2NyaXB0LmpzIiwibm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL3NoZWxsLmpzIiwibm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL3htbC5qcyIsIm5vZGVfbW9kdWxlcy9yZXZlYWwuanMvanMvcmV2ZWFsLmpzIiwibm9kZV9tb2R1bGVzL3JldmVhbC5qcy9wbHVnaW4vbWFya2Rvd24vbWFya2Rvd24uanMiLCJub2RlX21vZHVsZXMvcmV2ZWFsLmpzL3BsdWdpbi9tYXJrZG93bi9tYXJrZWQuanMiLCJzb3VyY2UvYXNzZXRzL2pzL3NsaWRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2h6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4L0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDTEE7O0FBRUEsSUFBTSxTQUFTLE9BQU8sTUFBUCxHQUFnQixRQUFRLFdBQVIsQ0FBL0I7O0FBRUEsSUFBTSxPQUFPLE9BQU8sSUFBUCxHQUFjLFFBQVEsNEJBQVIsQ0FBM0I7QUFDQSxLQUFLLGdCQUFMLENBQXNCLE1BQXRCLEVBQThCLFFBQVEsaUNBQVIsQ0FBOUI7QUFDQSxLQUFLLGdCQUFMLENBQXNCLE9BQXRCLEVBQStCLFFBQVEsa0NBQVIsQ0FBL0I7QUFDQSxLQUFLLGdCQUFMLENBQXNCLE9BQXRCLEVBQStCLFFBQVEsa0NBQVIsQ0FBL0I7QUFDQSxLQUFLLGdCQUFMLENBQXNCLEtBQXRCLEVBQTZCLFFBQVEsZ0NBQVIsQ0FBN0I7QUFDQSxLQUFLLGdCQUFMLENBQXNCLFVBQXRCLEVBQWtDLFFBQVEscUNBQVIsQ0FBbEM7QUFDQSxLQUFLLGdCQUFMLENBQXNCLFlBQXRCLEVBQW9DLFFBQVEsdUNBQVIsQ0FBcEM7O0FBRUEsSUFBTSxpQkFBaUIsUUFBUSx1Q0FBUixDQUF2Qjs7QUFFQSxJQUFJLFVBQVUsU0FBVixPQUFVLENBQVMsR0FBVCxFQUFhO0FBQ3pCLFNBQU8sTUFBTSxTQUFOLENBQWdCLEtBQWhCLENBQXNCLElBQXRCLENBQTJCLEdBQTNCLENBQVA7QUFDRCxDQUZEOztBQUlBLGVBQWUsVUFBZjtBQUNBLE9BQU8sVUFBUCxDQUFrQjtBQUNoQixTQUFPLElBRFM7QUFFaEIsVUFBUSxHQUZROztBQUloQixZQUFVLG9CQUFvQixJQUFwQixDQUF5QixTQUFTLElBQWxDLE1BQTRDLElBSnRDO0FBS2hCLFlBQVUsSUFMTTtBQU1oQixXQUFTLElBTk87QUFPaEIsVUFBUSxJQVBRO0FBUWhCLFlBQVUsS0FSTTtBQVNoQixnQkFBYyxLQVRFOztBQVdoQixjQUFZO0FBWEksQ0FBbEI7O0FBY0EsT0FBTyxnQkFBUCxDQUF3QixPQUF4QixFQUFpQyxZQUFXO0FBQzFDLFVBQVEsU0FBUyxnQkFBVCxDQUEwQixTQUExQixDQUFSLEVBQThDLE9BQTlDLENBQXNELFVBQVMsRUFBVCxFQUFZO0FBQ2hFLE9BQUcsVUFBSCxDQUFjLFNBQWQsQ0FBd0IsR0FBeEIsQ0FBNEIsT0FBNUI7QUFDRCxHQUZEOztBQUlBLFVBQVEsU0FBUyxnQkFBVCxDQUEwQiwwQkFBMUIsQ0FBUixFQUErRCxPQUEvRCxDQUF1RSxVQUFTLEVBQVQsRUFBWTtBQUNqRixRQUFJLFVBQVUsUUFBUSxHQUFHLFFBQVgsRUFBcUIsS0FBckIsQ0FBMkIsVUFBUyxLQUFULEVBQWU7QUFDdEQsYUFBUSxPQUFPLE1BQU0sU0FBYixLQUEyQixNQUEzQixJQUFxQyxNQUFNLFNBQU4sQ0FBZ0IsSUFBaEIsT0FBMkIsRUFBakUsSUFBd0UsTUFBTSxTQUFOLENBQWdCLFFBQWhCLENBQXlCLE9BQXpCLENBQS9FO0FBQ0QsS0FGYSxDQUFkOztBQUlBLFFBQUksT0FBSixFQUFZO0FBQ1YsU0FBRyxTQUFILENBQWEsR0FBYixDQUFpQixPQUFqQjtBQUNEO0FBQ0YsR0FSRDs7QUFVQSxVQUFRLFNBQVMsZ0JBQVQsQ0FBMEIsdUZBQTFCLENBQVIsRUFBNEgsT0FBNUgsQ0FBb0ksVUFBUyxFQUFULEVBQVk7QUFDOUksUUFBSSxHQUFHLGtCQUFILElBQXlCLEdBQUcsa0JBQUgsQ0FBc0IsU0FBdEIsQ0FBZ0MsUUFBaEMsQ0FBeUMsT0FBekMsQ0FBN0IsRUFBK0U7QUFDN0UsU0FBRyxTQUFILENBQWEsR0FBYixDQUFpQixZQUFqQjtBQUNEO0FBQ0YsR0FKRDs7QUFNQSxVQUFRLFNBQVMsZ0JBQVQsQ0FBMEIsd0JBQTFCLENBQVIsRUFBNkQsT0FBN0QsQ0FBcUUsVUFBUyxPQUFULEVBQWlCO0FBQ3BGLFFBQUksUUFBUSxnQkFBUixDQUF5QixZQUF6QixFQUF1QyxNQUEzQyxFQUFrRDtBQUNoRCxjQUFRLFlBQVIsQ0FBcUIsWUFBckIsRUFBbUMsTUFBbkM7QUFDRDtBQUNGLEdBSkQ7QUFLRCxDQTFCRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuU3ludGF4IGhpZ2hsaWdodGluZyB3aXRoIGxhbmd1YWdlIGF1dG9kZXRlY3Rpb24uXG5odHRwczovL2hpZ2hsaWdodGpzLm9yZy9cbiovXG5cbihmdW5jdGlvbihmYWN0b3J5KSB7XG5cbiAgLy8gRmluZCB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgZXhwb3J0IHRvIGJvdGggdGhlIGJyb3dzZXIgYW5kIHdlYiB3b3JrZXJzLlxuICB2YXIgZ2xvYmFsT2JqZWN0ID0gdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgd2luZG93IHx8XG4gICAgICAgICAgICAgICAgICAgICB0eXBlb2Ygc2VsZiA9PT0gJ29iamVjdCcgJiYgc2VsZjtcblxuICAvLyBTZXR1cCBoaWdobGlnaHQuanMgZm9yIGRpZmZlcmVudCBlbnZpcm9ubWVudHMuIEZpcnN0IGlzIE5vZGUuanMgb3JcbiAgLy8gQ29tbW9uSlMuXG4gIGlmKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGZhY3RvcnkoZXhwb3J0cyk7XG4gIH0gZWxzZSBpZihnbG9iYWxPYmplY3QpIHtcbiAgICAvLyBFeHBvcnQgaGxqcyBnbG9iYWxseSBldmVuIHdoZW4gdXNpbmcgQU1EIGZvciBjYXNlcyB3aGVuIHRoaXMgc2NyaXB0XG4gICAgLy8gaXMgbG9hZGVkIHdpdGggb3RoZXJzIHRoYXQgbWF5IHN0aWxsIGV4cGVjdCBhIGdsb2JhbCBobGpzLlxuICAgIGdsb2JhbE9iamVjdC5obGpzID0gZmFjdG9yeSh7fSk7XG5cbiAgICAvLyBGaW5hbGx5IHJlZ2lzdGVyIHRoZSBnbG9iYWwgaGxqcyB3aXRoIEFNRC5cbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBnbG9iYWxPYmplY3QuaGxqcztcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG59KGZ1bmN0aW9uKGhsanMpIHtcbiAgLy8gQ29udmVuaWVuY2UgdmFyaWFibGVzIGZvciBidWlsZC1pbiBvYmplY3RzXG4gIHZhciBBcnJheVByb3RvID0gW10sXG4gICAgICBvYmplY3RLZXlzID0gT2JqZWN0LmtleXM7XG5cbiAgLy8gR2xvYmFsIGludGVybmFsIHZhcmlhYmxlcyB1c2VkIHdpdGhpbiB0aGUgaGlnaGxpZ2h0LmpzIGxpYnJhcnkuXG4gIHZhciBsYW5ndWFnZXMgPSB7fSxcbiAgICAgIGFsaWFzZXMgICA9IHt9O1xuXG4gIC8vIFJlZ3VsYXIgZXhwcmVzc2lvbnMgdXNlZCB0aHJvdWdob3V0IHRoZSBoaWdobGlnaHQuanMgbGlicmFyeS5cbiAgdmFyIG5vSGlnaGxpZ2h0UmUgICAgPSAvXihuby0/aGlnaGxpZ2h0fHBsYWlufHRleHQpJC9pLFxuICAgICAgbGFuZ3VhZ2VQcmVmaXhSZSA9IC9cXGJsYW5nKD86dWFnZSk/LShbXFx3LV0rKVxcYi9pLFxuICAgICAgZml4TWFya3VwUmUgICAgICA9IC8oKF4oPFtePl0rPnxcXHR8KSt8KD86XFxuKSkpL2dtO1xuXG4gIHZhciBzcGFuRW5kVGFnID0gJzwvc3Bhbj4nO1xuXG4gIC8vIEdsb2JhbCBvcHRpb25zIHVzZWQgd2hlbiB3aXRoaW4gZXh0ZXJuYWwgQVBJcy4gVGhpcyBpcyBtb2RpZmllZCB3aGVuXG4gIC8vIGNhbGxpbmcgdGhlIGBobGpzLmNvbmZpZ3VyZWAgZnVuY3Rpb24uXG4gIHZhciBvcHRpb25zID0ge1xuICAgIGNsYXNzUHJlZml4OiAnaGxqcy0nLFxuICAgIHRhYlJlcGxhY2U6IG51bGwsXG4gICAgdXNlQlI6IGZhbHNlLFxuICAgIGxhbmd1YWdlczogdW5kZWZpbmVkXG4gIH07XG5cblxuICAvKiBVdGlsaXR5IGZ1bmN0aW9ucyAqL1xuXG4gIGZ1bmN0aW9uIGVzY2FwZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG4gIH1cblxuICBmdW5jdGlvbiB0YWcobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gIH1cblxuICBmdW5jdGlvbiB0ZXN0UmUocmUsIGxleGVtZSkge1xuICAgIHZhciBtYXRjaCA9IHJlICYmIHJlLmV4ZWMobGV4ZW1lKTtcbiAgICByZXR1cm4gbWF0Y2ggJiYgbWF0Y2guaW5kZXggPT09IDA7XG4gIH1cblxuICBmdW5jdGlvbiBpc05vdEhpZ2hsaWdodGVkKGxhbmd1YWdlKSB7XG4gICAgcmV0dXJuIG5vSGlnaGxpZ2h0UmUudGVzdChsYW5ndWFnZSk7XG4gIH1cblxuICBmdW5jdGlvbiBibG9ja0xhbmd1YWdlKGJsb2NrKSB7XG4gICAgdmFyIGksIG1hdGNoLCBsZW5ndGgsIF9jbGFzcztcbiAgICB2YXIgY2xhc3NlcyA9IGJsb2NrLmNsYXNzTmFtZSArICcgJztcblxuICAgIGNsYXNzZXMgKz0gYmxvY2sucGFyZW50Tm9kZSA/IGJsb2NrLnBhcmVudE5vZGUuY2xhc3NOYW1lIDogJyc7XG5cbiAgICAvLyBsYW5ndWFnZS0qIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBub24tcHJlZml4ZWQgY2xhc3MgbmFtZXMuXG4gICAgbWF0Y2ggPSBsYW5ndWFnZVByZWZpeFJlLmV4ZWMoY2xhc3Nlcyk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICByZXR1cm4gZ2V0TGFuZ3VhZ2UobWF0Y2hbMV0pID8gbWF0Y2hbMV0gOiAnbm8taGlnaGxpZ2h0JztcbiAgICB9XG5cbiAgICBjbGFzc2VzID0gY2xhc3Nlcy5zcGxpdCgvXFxzKy8pO1xuXG4gICAgZm9yIChpID0gMCwgbGVuZ3RoID0gY2xhc3Nlcy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgX2NsYXNzID0gY2xhc3Nlc1tpXVxuXG4gICAgICBpZiAoaXNOb3RIaWdobGlnaHRlZChfY2xhc3MpIHx8IGdldExhbmd1YWdlKF9jbGFzcykpIHtcbiAgICAgICAgcmV0dXJuIF9jbGFzcztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbmhlcml0KHBhcmVudCkgeyAgLy8gaW5oZXJpdChwYXJlbnQsIG92ZXJyaWRlX29iaiwgb3ZlcnJpZGVfb2JqLCAuLi4pXG4gICAgdmFyIGtleTtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIG9iamVjdHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgZm9yIChrZXkgaW4gcGFyZW50KVxuICAgICAgcmVzdWx0W2tleV0gPSBwYXJlbnRba2V5XTtcbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24ob2JqKSB7XG4gICAgICBmb3IgKGtleSBpbiBvYmopXG4gICAgICAgIHJlc3VsdFtrZXldID0gb2JqW2tleV07XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qIFN0cmVhbSBtZXJnaW5nICovXG5cbiAgZnVuY3Rpb24gbm9kZVN0cmVhbShub2RlKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIChmdW5jdGlvbiBfbm9kZVN0cmVhbShub2RlLCBvZmZzZXQpIHtcbiAgICAgIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDMpXG4gICAgICAgICAgb2Zmc2V0ICs9IGNoaWxkLm5vZGVWYWx1ZS5sZW5ndGg7XG4gICAgICAgIGVsc2UgaWYgKGNoaWxkLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgZXZlbnQ6ICdzdGFydCcsXG4gICAgICAgICAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICAgICAgICAgIG5vZGU6IGNoaWxkXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgb2Zmc2V0ID0gX25vZGVTdHJlYW0oY2hpbGQsIG9mZnNldCk7XG4gICAgICAgICAgLy8gUHJldmVudCB2b2lkIGVsZW1lbnRzIGZyb20gaGF2aW5nIGFuIGVuZCB0YWcgdGhhdCB3b3VsZCBhY3R1YWxseVxuICAgICAgICAgIC8vIGRvdWJsZSB0aGVtIGluIHRoZSBvdXRwdXQuIFRoZXJlIGFyZSBtb3JlIHZvaWQgZWxlbWVudHMgaW4gSFRNTFxuICAgICAgICAgIC8vIGJ1dCB3ZSBsaXN0IG9ubHkgdGhvc2UgcmVhbGlzdGljYWxseSBleHBlY3RlZCBpbiBjb2RlIGRpc3BsYXkuXG4gICAgICAgICAgaWYgKCF0YWcoY2hpbGQpLm1hdGNoKC9icnxocnxpbWd8aW5wdXQvKSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICBldmVudDogJ3N0b3AnLFxuICAgICAgICAgICAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICAgICAgICAgICAgbm9kZTogY2hpbGRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG9mZnNldDtcbiAgICB9KShub2RlLCAwKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gbWVyZ2VTdHJlYW1zKG9yaWdpbmFsLCBoaWdobGlnaHRlZCwgdmFsdWUpIHtcbiAgICB2YXIgcHJvY2Vzc2VkID0gMDtcbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgdmFyIG5vZGVTdGFjayA9IFtdO1xuXG4gICAgZnVuY3Rpb24gc2VsZWN0U3RyZWFtKCkge1xuICAgICAgaWYgKCFvcmlnaW5hbC5sZW5ndGggfHwgIWhpZ2hsaWdodGVkLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gb3JpZ2luYWwubGVuZ3RoID8gb3JpZ2luYWwgOiBoaWdobGlnaHRlZDtcbiAgICAgIH1cbiAgICAgIGlmIChvcmlnaW5hbFswXS5vZmZzZXQgIT09IGhpZ2hsaWdodGVkWzBdLm9mZnNldCkge1xuICAgICAgICByZXR1cm4gKG9yaWdpbmFsWzBdLm9mZnNldCA8IGhpZ2hsaWdodGVkWzBdLm9mZnNldCkgPyBvcmlnaW5hbCA6IGhpZ2hsaWdodGVkO1xuICAgICAgfVxuXG4gICAgICAvKlxuICAgICAgVG8gYXZvaWQgc3RhcnRpbmcgdGhlIHN0cmVhbSBqdXN0IGJlZm9yZSBpdCBzaG91bGQgc3RvcCB0aGUgb3JkZXIgaXNcbiAgICAgIGVuc3VyZWQgdGhhdCBvcmlnaW5hbCBhbHdheXMgc3RhcnRzIGZpcnN0IGFuZCBjbG9zZXMgbGFzdDpcblxuICAgICAgaWYgKGV2ZW50MSA9PSAnc3RhcnQnICYmIGV2ZW50MiA9PSAnc3RhcnQnKVxuICAgICAgICByZXR1cm4gb3JpZ2luYWw7XG4gICAgICBpZiAoZXZlbnQxID09ICdzdGFydCcgJiYgZXZlbnQyID09ICdzdG9wJylcbiAgICAgICAgcmV0dXJuIGhpZ2hsaWdodGVkO1xuICAgICAgaWYgKGV2ZW50MSA9PSAnc3RvcCcgJiYgZXZlbnQyID09ICdzdGFydCcpXG4gICAgICAgIHJldHVybiBvcmlnaW5hbDtcbiAgICAgIGlmIChldmVudDEgPT0gJ3N0b3AnICYmIGV2ZW50MiA9PSAnc3RvcCcpXG4gICAgICAgIHJldHVybiBoaWdobGlnaHRlZDtcblxuICAgICAgLi4uIHdoaWNoIGlzIGNvbGxhcHNlZCB0bzpcbiAgICAgICovXG4gICAgICByZXR1cm4gaGlnaGxpZ2h0ZWRbMF0uZXZlbnQgPT09ICdzdGFydCcgPyBvcmlnaW5hbCA6IGhpZ2hsaWdodGVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9wZW4obm9kZSkge1xuICAgICAgZnVuY3Rpb24gYXR0cl9zdHIoYSkge3JldHVybiAnICcgKyBhLm5vZGVOYW1lICsgJz1cIicgKyBlc2NhcGUoYS52YWx1ZSkucmVwbGFjZSgnXCInLCAnJnF1b3Q7JykgKyAnXCInO31cbiAgICAgIHJlc3VsdCArPSAnPCcgKyB0YWcobm9kZSkgKyBBcnJheVByb3RvLm1hcC5jYWxsKG5vZGUuYXR0cmlidXRlcywgYXR0cl9zdHIpLmpvaW4oJycpICsgJz4nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsb3NlKG5vZGUpIHtcbiAgICAgIHJlc3VsdCArPSAnPC8nICsgdGFnKG5vZGUpICsgJz4nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbmRlcihldmVudCkge1xuICAgICAgKGV2ZW50LmV2ZW50ID09PSAnc3RhcnQnID8gb3BlbiA6IGNsb3NlKShldmVudC5ub2RlKTtcbiAgICB9XG5cbiAgICB3aGlsZSAob3JpZ2luYWwubGVuZ3RoIHx8IGhpZ2hsaWdodGVkLmxlbmd0aCkge1xuICAgICAgdmFyIHN0cmVhbSA9IHNlbGVjdFN0cmVhbSgpO1xuICAgICAgcmVzdWx0ICs9IGVzY2FwZSh2YWx1ZS5zdWJzdHJpbmcocHJvY2Vzc2VkLCBzdHJlYW1bMF0ub2Zmc2V0KSk7XG4gICAgICBwcm9jZXNzZWQgPSBzdHJlYW1bMF0ub2Zmc2V0O1xuICAgICAgaWYgKHN0cmVhbSA9PT0gb3JpZ2luYWwpIHtcbiAgICAgICAgLypcbiAgICAgICAgT24gYW55IG9wZW5pbmcgb3IgY2xvc2luZyB0YWcgb2YgdGhlIG9yaWdpbmFsIG1hcmt1cCB3ZSBmaXJzdCBjbG9zZVxuICAgICAgICB0aGUgZW50aXJlIGhpZ2hsaWdodGVkIG5vZGUgc3RhY2ssIHRoZW4gcmVuZGVyIHRoZSBvcmlnaW5hbCB0YWcgYWxvbmdcbiAgICAgICAgd2l0aCBhbGwgdGhlIGZvbGxvd2luZyBvcmlnaW5hbCB0YWdzIGF0IHRoZSBzYW1lIG9mZnNldCBhbmQgdGhlblxuICAgICAgICByZW9wZW4gYWxsIHRoZSB0YWdzIG9uIHRoZSBoaWdobGlnaHRlZCBzdGFjay5cbiAgICAgICAgKi9cbiAgICAgICAgbm9kZVN0YWNrLnJldmVyc2UoKS5mb3JFYWNoKGNsb3NlKTtcbiAgICAgICAgZG8ge1xuICAgICAgICAgIHJlbmRlcihzdHJlYW0uc3BsaWNlKDAsIDEpWzBdKTtcbiAgICAgICAgICBzdHJlYW0gPSBzZWxlY3RTdHJlYW0oKTtcbiAgICAgICAgfSB3aGlsZSAoc3RyZWFtID09PSBvcmlnaW5hbCAmJiBzdHJlYW0ubGVuZ3RoICYmIHN0cmVhbVswXS5vZmZzZXQgPT09IHByb2Nlc3NlZCk7XG4gICAgICAgIG5vZGVTdGFjay5yZXZlcnNlKCkuZm9yRWFjaChvcGVuKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzdHJlYW1bMF0uZXZlbnQgPT09ICdzdGFydCcpIHtcbiAgICAgICAgICBub2RlU3RhY2sucHVzaChzdHJlYW1bMF0ubm9kZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbm9kZVN0YWNrLnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIHJlbmRlcihzdHJlYW0uc3BsaWNlKDAsIDEpWzBdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdCArIGVzY2FwZSh2YWx1ZS5zdWJzdHIocHJvY2Vzc2VkKSk7XG4gIH1cblxuICAvKiBJbml0aWFsaXphdGlvbiAqL1xuXG4gIGZ1bmN0aW9uIGV4cGFuZF9tb2RlKG1vZGUpIHtcbiAgICBpZiAobW9kZS52YXJpYW50cyAmJiAhbW9kZS5jYWNoZWRfdmFyaWFudHMpIHtcbiAgICAgIG1vZGUuY2FjaGVkX3ZhcmlhbnRzID0gbW9kZS52YXJpYW50cy5tYXAoZnVuY3Rpb24odmFyaWFudCkge1xuICAgICAgICByZXR1cm4gaW5oZXJpdChtb2RlLCB7dmFyaWFudHM6IG51bGx9LCB2YXJpYW50KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbW9kZS5jYWNoZWRfdmFyaWFudHMgfHwgKG1vZGUuZW5kc1dpdGhQYXJlbnQgJiYgW2luaGVyaXQobW9kZSldKSB8fCBbbW9kZV07XG4gIH1cblxuICBmdW5jdGlvbiBjb21waWxlTGFuZ3VhZ2UobGFuZ3VhZ2UpIHtcblxuICAgIGZ1bmN0aW9uIHJlU3RyKHJlKSB7XG4gICAgICAgIHJldHVybiAocmUgJiYgcmUuc291cmNlKSB8fCByZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsYW5nUmUodmFsdWUsIGdsb2JhbCkge1xuICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXG4gICAgICAgIHJlU3RyKHZhbHVlKSxcbiAgICAgICAgJ20nICsgKGxhbmd1YWdlLmNhc2VfaW5zZW5zaXRpdmUgPyAnaScgOiAnJykgKyAoZ2xvYmFsID8gJ2cnIDogJycpXG4gICAgICApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXBpbGVNb2RlKG1vZGUsIHBhcmVudCkge1xuICAgICAgaWYgKG1vZGUuY29tcGlsZWQpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1vZGUuY29tcGlsZWQgPSB0cnVlO1xuXG4gICAgICBtb2RlLmtleXdvcmRzID0gbW9kZS5rZXl3b3JkcyB8fCBtb2RlLmJlZ2luS2V5d29yZHM7XG4gICAgICBpZiAobW9kZS5rZXl3b3Jkcykge1xuICAgICAgICB2YXIgY29tcGlsZWRfa2V5d29yZHMgPSB7fTtcblxuICAgICAgICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGNsYXNzTmFtZSwgc3RyKSB7XG4gICAgICAgICAgaWYgKGxhbmd1YWdlLmNhc2VfaW5zZW5zaXRpdmUpIHtcbiAgICAgICAgICAgIHN0ciA9IHN0ci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdHIuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uKGt3KSB7XG4gICAgICAgICAgICB2YXIgcGFpciA9IGt3LnNwbGl0KCd8Jyk7XG4gICAgICAgICAgICBjb21waWxlZF9rZXl3b3Jkc1twYWlyWzBdXSA9IFtjbGFzc05hbWUsIHBhaXJbMV0gPyBOdW1iZXIocGFpclsxXSkgOiAxXTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZW9mIG1vZGUua2V5d29yZHMgPT09ICdzdHJpbmcnKSB7IC8vIHN0cmluZ1xuICAgICAgICAgIGZsYXR0ZW4oJ2tleXdvcmQnLCBtb2RlLmtleXdvcmRzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvYmplY3RLZXlzKG1vZGUua2V5d29yZHMpLmZvckVhY2goZnVuY3Rpb24gKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgZmxhdHRlbihjbGFzc05hbWUsIG1vZGUua2V5d29yZHNbY2xhc3NOYW1lXSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbW9kZS5rZXl3b3JkcyA9IGNvbXBpbGVkX2tleXdvcmRzO1xuICAgICAgfVxuICAgICAgbW9kZS5sZXhlbWVzUmUgPSBsYW5nUmUobW9kZS5sZXhlbWVzIHx8IC9cXHcrLywgdHJ1ZSk7XG5cbiAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKG1vZGUuYmVnaW5LZXl3b3Jkcykge1xuICAgICAgICAgIG1vZGUuYmVnaW4gPSAnXFxcXGIoJyArIG1vZGUuYmVnaW5LZXl3b3Jkcy5zcGxpdCgnICcpLmpvaW4oJ3wnKSArICcpXFxcXGInO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbW9kZS5iZWdpbilcbiAgICAgICAgICBtb2RlLmJlZ2luID0gL1xcQnxcXGIvO1xuICAgICAgICBtb2RlLmJlZ2luUmUgPSBsYW5nUmUobW9kZS5iZWdpbik7XG4gICAgICAgIGlmICghbW9kZS5lbmQgJiYgIW1vZGUuZW5kc1dpdGhQYXJlbnQpXG4gICAgICAgICAgbW9kZS5lbmQgPSAvXFxCfFxcYi87XG4gICAgICAgIGlmIChtb2RlLmVuZClcbiAgICAgICAgICBtb2RlLmVuZFJlID0gbGFuZ1JlKG1vZGUuZW5kKTtcbiAgICAgICAgbW9kZS50ZXJtaW5hdG9yX2VuZCA9IHJlU3RyKG1vZGUuZW5kKSB8fCAnJztcbiAgICAgICAgaWYgKG1vZGUuZW5kc1dpdGhQYXJlbnQgJiYgcGFyZW50LnRlcm1pbmF0b3JfZW5kKVxuICAgICAgICAgIG1vZGUudGVybWluYXRvcl9lbmQgKz0gKG1vZGUuZW5kID8gJ3wnIDogJycpICsgcGFyZW50LnRlcm1pbmF0b3JfZW5kO1xuICAgICAgfVxuICAgICAgaWYgKG1vZGUuaWxsZWdhbClcbiAgICAgICAgbW9kZS5pbGxlZ2FsUmUgPSBsYW5nUmUobW9kZS5pbGxlZ2FsKTtcbiAgICAgIGlmIChtb2RlLnJlbGV2YW5jZSA9PSBudWxsKVxuICAgICAgICBtb2RlLnJlbGV2YW5jZSA9IDE7XG4gICAgICBpZiAoIW1vZGUuY29udGFpbnMpIHtcbiAgICAgICAgbW9kZS5jb250YWlucyA9IFtdO1xuICAgICAgfVxuICAgICAgbW9kZS5jb250YWlucyA9IEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIG1vZGUuY29udGFpbnMubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgcmV0dXJuIGV4cGFuZF9tb2RlKGMgPT09ICdzZWxmJyA/IG1vZGUgOiBjKVxuICAgICAgfSkpO1xuICAgICAgbW9kZS5jb250YWlucy5mb3JFYWNoKGZ1bmN0aW9uKGMpIHtjb21waWxlTW9kZShjLCBtb2RlKTt9KTtcblxuICAgICAgaWYgKG1vZGUuc3RhcnRzKSB7XG4gICAgICAgIGNvbXBpbGVNb2RlKG1vZGUuc3RhcnRzLCBwYXJlbnQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgdGVybWluYXRvcnMgPVxuICAgICAgICBtb2RlLmNvbnRhaW5zLm1hcChmdW5jdGlvbihjKSB7XG4gICAgICAgICAgcmV0dXJuIGMuYmVnaW5LZXl3b3JkcyA/ICdcXFxcLj8oJyArIGMuYmVnaW4gKyAnKVxcXFwuPycgOiBjLmJlZ2luO1xuICAgICAgICB9KVxuICAgICAgICAuY29uY2F0KFttb2RlLnRlcm1pbmF0b3JfZW5kLCBtb2RlLmlsbGVnYWxdKVxuICAgICAgICAubWFwKHJlU3RyKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgbW9kZS50ZXJtaW5hdG9ycyA9IHRlcm1pbmF0b3JzLmxlbmd0aCA/IGxhbmdSZSh0ZXJtaW5hdG9ycy5qb2luKCd8JyksIHRydWUpIDoge2V4ZWM6IGZ1bmN0aW9uKC8qcyovKSB7cmV0dXJuIG51bGw7fX07XG4gICAgfVxuXG4gICAgY29tcGlsZU1vZGUobGFuZ3VhZ2UpO1xuICB9XG5cbiAgLypcbiAgQ29yZSBoaWdobGlnaHRpbmcgZnVuY3Rpb24uIEFjY2VwdHMgYSBsYW5ndWFnZSBuYW1lLCBvciBhbiBhbGlhcywgYW5kIGFcbiAgc3RyaW5nIHdpdGggdGhlIGNvZGUgdG8gaGlnaGxpZ2h0LiBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmdcbiAgcHJvcGVydGllczpcblxuICAtIHJlbGV2YW5jZSAoaW50KVxuICAtIHZhbHVlIChhbiBIVE1MIHN0cmluZyB3aXRoIGhpZ2hsaWdodGluZyBtYXJrdXApXG5cbiAgKi9cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0KG5hbWUsIHZhbHVlLCBpZ25vcmVfaWxsZWdhbHMsIGNvbnRpbnVhdGlvbikge1xuXG4gICAgZnVuY3Rpb24gc3ViTW9kZShsZXhlbWUsIG1vZGUpIHtcbiAgICAgIHZhciBpLCBsZW5ndGg7XG5cbiAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IG1vZGUuY29udGFpbnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRlc3RSZShtb2RlLmNvbnRhaW5zW2ldLmJlZ2luUmUsIGxleGVtZSkpIHtcbiAgICAgICAgICByZXR1cm4gbW9kZS5jb250YWluc1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVuZE9mTW9kZShtb2RlLCBsZXhlbWUpIHtcbiAgICAgIGlmICh0ZXN0UmUobW9kZS5lbmRSZSwgbGV4ZW1lKSkge1xuICAgICAgICB3aGlsZSAobW9kZS5lbmRzUGFyZW50ICYmIG1vZGUucGFyZW50KSB7XG4gICAgICAgICAgbW9kZSA9IG1vZGUucGFyZW50O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtb2RlO1xuICAgICAgfVxuICAgICAgaWYgKG1vZGUuZW5kc1dpdGhQYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuIGVuZE9mTW9kZShtb2RlLnBhcmVudCwgbGV4ZW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0lsbGVnYWwobGV4ZW1lLCBtb2RlKSB7XG4gICAgICByZXR1cm4gIWlnbm9yZV9pbGxlZ2FscyAmJiB0ZXN0UmUobW9kZS5pbGxlZ2FsUmUsIGxleGVtZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga2V5d29yZE1hdGNoKG1vZGUsIG1hdGNoKSB7XG4gICAgICB2YXIgbWF0Y2hfc3RyID0gbGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSA/IG1hdGNoWzBdLnRvTG93ZXJDYXNlKCkgOiBtYXRjaFswXTtcbiAgICAgIHJldHVybiBtb2RlLmtleXdvcmRzLmhhc093blByb3BlcnR5KG1hdGNoX3N0cikgJiYgbW9kZS5rZXl3b3Jkc1ttYXRjaF9zdHJdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJ1aWxkU3BhbihjbGFzc25hbWUsIGluc2lkZVNwYW4sIGxlYXZlT3Blbiwgbm9QcmVmaXgpIHtcbiAgICAgIHZhciBjbGFzc1ByZWZpeCA9IG5vUHJlZml4ID8gJycgOiBvcHRpb25zLmNsYXNzUHJlZml4LFxuICAgICAgICAgIG9wZW5TcGFuICAgID0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzUHJlZml4LFxuICAgICAgICAgIGNsb3NlU3BhbiAgID0gbGVhdmVPcGVuID8gJycgOiBzcGFuRW5kVGFnXG5cbiAgICAgIG9wZW5TcGFuICs9IGNsYXNzbmFtZSArICdcIj4nO1xuXG4gICAgICByZXR1cm4gb3BlblNwYW4gKyBpbnNpZGVTcGFuICsgY2xvc2VTcGFuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NLZXl3b3JkcygpIHtcbiAgICAgIHZhciBrZXl3b3JkX21hdGNoLCBsYXN0X2luZGV4LCBtYXRjaCwgcmVzdWx0O1xuXG4gICAgICBpZiAoIXRvcC5rZXl3b3JkcylcbiAgICAgICAgcmV0dXJuIGVzY2FwZShtb2RlX2J1ZmZlcik7XG5cbiAgICAgIHJlc3VsdCA9ICcnO1xuICAgICAgbGFzdF9pbmRleCA9IDA7XG4gICAgICB0b3AubGV4ZW1lc1JlLmxhc3RJbmRleCA9IDA7XG4gICAgICBtYXRjaCA9IHRvcC5sZXhlbWVzUmUuZXhlYyhtb2RlX2J1ZmZlcik7XG5cbiAgICAgIHdoaWxlIChtYXRjaCkge1xuICAgICAgICByZXN1bHQgKz0gZXNjYXBlKG1vZGVfYnVmZmVyLnN1YnN0cmluZyhsYXN0X2luZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgICAgICBrZXl3b3JkX21hdGNoID0ga2V5d29yZE1hdGNoKHRvcCwgbWF0Y2gpO1xuICAgICAgICBpZiAoa2V5d29yZF9tYXRjaCkge1xuICAgICAgICAgIHJlbGV2YW5jZSArPSBrZXl3b3JkX21hdGNoWzFdO1xuICAgICAgICAgIHJlc3VsdCArPSBidWlsZFNwYW4oa2V5d29yZF9tYXRjaFswXSwgZXNjYXBlKG1hdGNoWzBdKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ICs9IGVzY2FwZShtYXRjaFswXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdF9pbmRleCA9IHRvcC5sZXhlbWVzUmUubGFzdEluZGV4O1xuICAgICAgICBtYXRjaCA9IHRvcC5sZXhlbWVzUmUuZXhlYyhtb2RlX2J1ZmZlcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0ICsgZXNjYXBlKG1vZGVfYnVmZmVyLnN1YnN0cihsYXN0X2luZGV4KSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc1N1Ykxhbmd1YWdlKCkge1xuICAgICAgdmFyIGV4cGxpY2l0ID0gdHlwZW9mIHRvcC5zdWJMYW5ndWFnZSA9PT0gJ3N0cmluZyc7XG4gICAgICBpZiAoZXhwbGljaXQgJiYgIWxhbmd1YWdlc1t0b3Auc3ViTGFuZ3VhZ2VdKSB7XG4gICAgICAgIHJldHVybiBlc2NhcGUobW9kZV9idWZmZXIpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmVzdWx0ID0gZXhwbGljaXQgP1xuICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodCh0b3Auc3ViTGFuZ3VhZ2UsIG1vZGVfYnVmZmVyLCB0cnVlLCBjb250aW51YXRpb25zW3RvcC5zdWJMYW5ndWFnZV0pIDpcbiAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRBdXRvKG1vZGVfYnVmZmVyLCB0b3Auc3ViTGFuZ3VhZ2UubGVuZ3RoID8gdG9wLnN1Ykxhbmd1YWdlIDogdW5kZWZpbmVkKTtcblxuICAgICAgLy8gQ291bnRpbmcgZW1iZWRkZWQgbGFuZ3VhZ2Ugc2NvcmUgdG93YXJkcyB0aGUgaG9zdCBsYW5ndWFnZSBtYXkgYmUgZGlzYWJsZWRcbiAgICAgIC8vIHdpdGggemVyb2luZyB0aGUgY29udGFpbmluZyBtb2RlIHJlbGV2YW5jZS4gVXNlY2FzZSBpbiBwb2ludCBpcyBNYXJrZG93biB0aGF0XG4gICAgICAvLyBhbGxvd3MgWE1MIGV2ZXJ5d2hlcmUgYW5kIG1ha2VzIGV2ZXJ5IFhNTCBzbmlwcGV0IHRvIGhhdmUgYSBtdWNoIGxhcmdlciBNYXJrZG93blxuICAgICAgLy8gc2NvcmUuXG4gICAgICBpZiAodG9wLnJlbGV2YW5jZSA+IDApIHtcbiAgICAgICAgcmVsZXZhbmNlICs9IHJlc3VsdC5yZWxldmFuY2U7XG4gICAgICB9XG4gICAgICBpZiAoZXhwbGljaXQpIHtcbiAgICAgICAgY29udGludWF0aW9uc1t0b3Auc3ViTGFuZ3VhZ2VdID0gcmVzdWx0LnRvcDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBidWlsZFNwYW4ocmVzdWx0Lmxhbmd1YWdlLCByZXN1bHQudmFsdWUsIGZhbHNlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzQnVmZmVyKCkge1xuICAgICAgcmVzdWx0ICs9ICh0b3Auc3ViTGFuZ3VhZ2UgIT0gbnVsbCA/IHByb2Nlc3NTdWJMYW5ndWFnZSgpIDogcHJvY2Vzc0tleXdvcmRzKCkpO1xuICAgICAgbW9kZV9idWZmZXIgPSAnJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFydE5ld01vZGUobW9kZSkge1xuICAgICAgcmVzdWx0ICs9IG1vZGUuY2xhc3NOYW1lPyBidWlsZFNwYW4obW9kZS5jbGFzc05hbWUsICcnLCB0cnVlKTogJyc7XG4gICAgICB0b3AgPSBPYmplY3QuY3JlYXRlKG1vZGUsIHtwYXJlbnQ6IHt2YWx1ZTogdG9wfX0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NMZXhlbWUoYnVmZmVyLCBsZXhlbWUpIHtcblxuICAgICAgbW9kZV9idWZmZXIgKz0gYnVmZmVyO1xuXG4gICAgICBpZiAobGV4ZW1lID09IG51bGwpIHtcbiAgICAgICAgcHJvY2Vzc0J1ZmZlcigpO1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cblxuICAgICAgdmFyIG5ld19tb2RlID0gc3ViTW9kZShsZXhlbWUsIHRvcCk7XG4gICAgICBpZiAobmV3X21vZGUpIHtcbiAgICAgICAgaWYgKG5ld19tb2RlLnNraXApIHtcbiAgICAgICAgICBtb2RlX2J1ZmZlciArPSBsZXhlbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG5ld19tb2RlLmV4Y2x1ZGVCZWdpbikge1xuICAgICAgICAgICAgbW9kZV9idWZmZXIgKz0gbGV4ZW1lO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgICAgaWYgKCFuZXdfbW9kZS5yZXR1cm5CZWdpbiAmJiAhbmV3X21vZGUuZXhjbHVkZUJlZ2luKSB7XG4gICAgICAgICAgICBtb2RlX2J1ZmZlciA9IGxleGVtZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhcnROZXdNb2RlKG5ld19tb2RlLCBsZXhlbWUpO1xuICAgICAgICByZXR1cm4gbmV3X21vZGUucmV0dXJuQmVnaW4gPyAwIDogbGV4ZW1lLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgdmFyIGVuZF9tb2RlID0gZW5kT2ZNb2RlKHRvcCwgbGV4ZW1lKTtcbiAgICAgIGlmIChlbmRfbW9kZSkge1xuICAgICAgICB2YXIgb3JpZ2luID0gdG9wO1xuICAgICAgICBpZiAob3JpZ2luLnNraXApIHtcbiAgICAgICAgICBtb2RlX2J1ZmZlciArPSBsZXhlbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCEob3JpZ2luLnJldHVybkVuZCB8fCBvcmlnaW4uZXhjbHVkZUVuZCkpIHtcbiAgICAgICAgICAgIG1vZGVfYnVmZmVyICs9IGxleGVtZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvY2Vzc0J1ZmZlcigpO1xuICAgICAgICAgIGlmIChvcmlnaW4uZXhjbHVkZUVuZCkge1xuICAgICAgICAgICAgbW9kZV9idWZmZXIgPSBsZXhlbWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBpZiAodG9wLmNsYXNzTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9IHNwYW5FbmRUYWc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghdG9wLnNraXApIHtcbiAgICAgICAgICAgIHJlbGV2YW5jZSArPSB0b3AucmVsZXZhbmNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0b3AgPSB0b3AucGFyZW50O1xuICAgICAgICB9IHdoaWxlICh0b3AgIT09IGVuZF9tb2RlLnBhcmVudCk7XG4gICAgICAgIGlmIChlbmRfbW9kZS5zdGFydHMpIHtcbiAgICAgICAgICBzdGFydE5ld01vZGUoZW5kX21vZGUuc3RhcnRzLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9yaWdpbi5yZXR1cm5FbmQgPyAwIDogbGV4ZW1lLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzSWxsZWdhbChsZXhlbWUsIHRvcCkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBsZXhlbWUgXCInICsgbGV4ZW1lICsgJ1wiIGZvciBtb2RlIFwiJyArICh0b3AuY2xhc3NOYW1lIHx8ICc8dW5uYW1lZD4nKSArICdcIicpO1xuXG4gICAgICAvKlxuICAgICAgUGFyc2VyIHNob3VsZCBub3QgcmVhY2ggdGhpcyBwb2ludCBhcyBhbGwgdHlwZXMgb2YgbGV4ZW1lcyBzaG91bGQgYmUgY2F1Z2h0XG4gICAgICBlYXJsaWVyLCBidXQgaWYgaXQgZG9lcyBkdWUgdG8gc29tZSBidWcgbWFrZSBzdXJlIGl0IGFkdmFuY2VzIGF0IGxlYXN0IG9uZVxuICAgICAgY2hhcmFjdGVyIGZvcndhcmQgdG8gcHJldmVudCBpbmZpbml0ZSBsb29waW5nLlxuICAgICAgKi9cbiAgICAgIG1vZGVfYnVmZmVyICs9IGxleGVtZTtcbiAgICAgIHJldHVybiBsZXhlbWUubGVuZ3RoIHx8IDE7XG4gICAgfVxuXG4gICAgdmFyIGxhbmd1YWdlID0gZ2V0TGFuZ3VhZ2UobmFtZSk7XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlOiBcIicgKyBuYW1lICsgJ1wiJyk7XG4gICAgfVxuXG4gICAgY29tcGlsZUxhbmd1YWdlKGxhbmd1YWdlKTtcbiAgICB2YXIgdG9wID0gY29udGludWF0aW9uIHx8IGxhbmd1YWdlO1xuICAgIHZhciBjb250aW51YXRpb25zID0ge307IC8vIGtlZXAgY29udGludWF0aW9ucyBmb3Igc3ViLWxhbmd1YWdlc1xuICAgIHZhciByZXN1bHQgPSAnJywgY3VycmVudDtcbiAgICBmb3IoY3VycmVudCA9IHRvcDsgY3VycmVudCAhPT0gbGFuZ3VhZ2U7IGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudCkge1xuICAgICAgaWYgKGN1cnJlbnQuY2xhc3NOYW1lKSB7XG4gICAgICAgIHJlc3VsdCA9IGJ1aWxkU3BhbihjdXJyZW50LmNsYXNzTmFtZSwgJycsIHRydWUpICsgcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgbW9kZV9idWZmZXIgPSAnJztcbiAgICB2YXIgcmVsZXZhbmNlID0gMDtcbiAgICB0cnkge1xuICAgICAgdmFyIG1hdGNoLCBjb3VudCwgaW5kZXggPSAwO1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgdG9wLnRlcm1pbmF0b3JzLmxhc3RJbmRleCA9IGluZGV4O1xuICAgICAgICBtYXRjaCA9IHRvcC50ZXJtaW5hdG9ycy5leGVjKHZhbHVlKTtcbiAgICAgICAgaWYgKCFtYXRjaClcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY291bnQgPSBwcm9jZXNzTGV4ZW1lKHZhbHVlLnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXgpLCBtYXRjaFswXSk7XG4gICAgICAgIGluZGV4ID0gbWF0Y2guaW5kZXggKyBjb3VudDtcbiAgICAgIH1cbiAgICAgIHByb2Nlc3NMZXhlbWUodmFsdWUuc3Vic3RyKGluZGV4KSk7XG4gICAgICBmb3IoY3VycmVudCA9IHRvcDsgY3VycmVudC5wYXJlbnQ7IGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudCkgeyAvLyBjbG9zZSBkYW5nbGluZyBtb2Rlc1xuICAgICAgICBpZiAoY3VycmVudC5jbGFzc05hbWUpIHtcbiAgICAgICAgICByZXN1bHQgKz0gc3BhbkVuZFRhZztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVsZXZhbmNlOiByZWxldmFuY2UsXG4gICAgICAgIHZhbHVlOiByZXN1bHQsXG4gICAgICAgIGxhbmd1YWdlOiBuYW1lLFxuICAgICAgICB0b3A6IHRvcFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZS5tZXNzYWdlICYmIGUubWVzc2FnZS5pbmRleE9mKCdJbGxlZ2FsJykgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgICAgIHZhbHVlOiBlc2NhcGUodmFsdWUpXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qXG4gIEhpZ2hsaWdodGluZyB3aXRoIGxhbmd1YWdlIGRldGVjdGlvbi4gQWNjZXB0cyBhIHN0cmluZyB3aXRoIHRoZSBjb2RlIHRvXG4gIGhpZ2hsaWdodC4gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG5cbiAgLSBsYW5ndWFnZSAoZGV0ZWN0ZWQgbGFuZ3VhZ2UpXG4gIC0gcmVsZXZhbmNlIChpbnQpXG4gIC0gdmFsdWUgKGFuIEhUTUwgc3RyaW5nIHdpdGggaGlnaGxpZ2h0aW5nIG1hcmt1cClcbiAgLSBzZWNvbmRfYmVzdCAob2JqZWN0IHdpdGggdGhlIHNhbWUgc3RydWN0dXJlIGZvciBzZWNvbmQtYmVzdCBoZXVyaXN0aWNhbGx5XG4gICAgZGV0ZWN0ZWQgbGFuZ3VhZ2UsIG1heSBiZSBhYnNlbnQpXG5cbiAgKi9cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0QXV0byh0ZXh0LCBsYW5ndWFnZVN1YnNldCkge1xuICAgIGxhbmd1YWdlU3Vic2V0ID0gbGFuZ3VhZ2VTdWJzZXQgfHwgb3B0aW9ucy5sYW5ndWFnZXMgfHwgb2JqZWN0S2V5cyhsYW5ndWFnZXMpO1xuICAgIHZhciByZXN1bHQgPSB7XG4gICAgICByZWxldmFuY2U6IDAsXG4gICAgICB2YWx1ZTogZXNjYXBlKHRleHQpXG4gICAgfTtcbiAgICB2YXIgc2Vjb25kX2Jlc3QgPSByZXN1bHQ7XG4gICAgbGFuZ3VhZ2VTdWJzZXQuZmlsdGVyKGdldExhbmd1YWdlKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBjdXJyZW50ID0gaGlnaGxpZ2h0KG5hbWUsIHRleHQsIGZhbHNlKTtcbiAgICAgIGN1cnJlbnQubGFuZ3VhZ2UgPSBuYW1lO1xuICAgICAgaWYgKGN1cnJlbnQucmVsZXZhbmNlID4gc2Vjb25kX2Jlc3QucmVsZXZhbmNlKSB7XG4gICAgICAgIHNlY29uZF9iZXN0ID0gY3VycmVudDtcbiAgICAgIH1cbiAgICAgIGlmIChjdXJyZW50LnJlbGV2YW5jZSA+IHJlc3VsdC5yZWxldmFuY2UpIHtcbiAgICAgICAgc2Vjb25kX2Jlc3QgPSByZXN1bHQ7XG4gICAgICAgIHJlc3VsdCA9IGN1cnJlbnQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHNlY29uZF9iZXN0Lmxhbmd1YWdlKSB7XG4gICAgICByZXN1bHQuc2Vjb25kX2Jlc3QgPSBzZWNvbmRfYmVzdDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qXG4gIFBvc3QtcHJvY2Vzc2luZyBvZiB0aGUgaGlnaGxpZ2h0ZWQgbWFya3VwOlxuXG4gIC0gcmVwbGFjZSBUQUJzIHdpdGggc29tZXRoaW5nIG1vcmUgdXNlZnVsXG4gIC0gcmVwbGFjZSByZWFsIGxpbmUtYnJlYWtzIHdpdGggJzxicj4nIGZvciBub24tcHJlIGNvbnRhaW5lcnNcblxuICAqL1xuICBmdW5jdGlvbiBmaXhNYXJrdXAodmFsdWUpIHtcbiAgICByZXR1cm4gIShvcHRpb25zLnRhYlJlcGxhY2UgfHwgb3B0aW9ucy51c2VCUilcbiAgICAgID8gdmFsdWVcbiAgICAgIDogdmFsdWUucmVwbGFjZShmaXhNYXJrdXBSZSwgZnVuY3Rpb24obWF0Y2gsIHAxKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMudXNlQlIgJiYgbWF0Y2ggPT09ICdcXG4nKSB7XG4gICAgICAgICAgICByZXR1cm4gJzxicj4nO1xuICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy50YWJSZXBsYWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcDEucmVwbGFjZSgvXFx0L2csIG9wdGlvbnMudGFiUmVwbGFjZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYnVpbGRDbGFzc05hbWUocHJldkNsYXNzTmFtZSwgY3VycmVudExhbmcsIHJlc3VsdExhbmcpIHtcbiAgICB2YXIgbGFuZ3VhZ2UgPSBjdXJyZW50TGFuZyA/IGFsaWFzZXNbY3VycmVudExhbmddIDogcmVzdWx0TGFuZyxcbiAgICAgICAgcmVzdWx0ICAgPSBbcHJldkNsYXNzTmFtZS50cmltKCldO1xuXG4gICAgaWYgKCFwcmV2Q2xhc3NOYW1lLm1hdGNoKC9cXGJobGpzXFxiLykpIHtcbiAgICAgIHJlc3VsdC5wdXNoKCdobGpzJyk7XG4gICAgfVxuXG4gICAgaWYgKHByZXZDbGFzc05hbWUuaW5kZXhPZihsYW5ndWFnZSkgPT09IC0xKSB7XG4gICAgICByZXN1bHQucHVzaChsYW5ndWFnZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdC5qb2luKCcgJykudHJpbSgpO1xuICB9XG5cbiAgLypcbiAgQXBwbGllcyBoaWdobGlnaHRpbmcgdG8gYSBET00gbm9kZSBjb250YWluaW5nIGNvZGUuIEFjY2VwdHMgYSBET00gbm9kZSBhbmRcbiAgdHdvIG9wdGlvbmFsIHBhcmFtZXRlcnMgZm9yIGZpeE1hcmt1cC5cbiAgKi9cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0QmxvY2soYmxvY2spIHtcbiAgICB2YXIgbm9kZSwgb3JpZ2luYWxTdHJlYW0sIHJlc3VsdCwgcmVzdWx0Tm9kZSwgdGV4dDtcbiAgICB2YXIgbGFuZ3VhZ2UgPSBibG9ja0xhbmd1YWdlKGJsb2NrKTtcblxuICAgIGlmIChpc05vdEhpZ2hsaWdodGVkKGxhbmd1YWdlKSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKG9wdGlvbnMudXNlQlIpIHtcbiAgICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwnLCAnZGl2Jyk7XG4gICAgICBub2RlLmlubmVySFRNTCA9IGJsb2NrLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJycpLnJlcGxhY2UoLzxiclsgXFwvXSo+L2csICdcXG4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZSA9IGJsb2NrO1xuICAgIH1cbiAgICB0ZXh0ID0gbm9kZS50ZXh0Q29udGVudDtcbiAgICByZXN1bHQgPSBsYW5ndWFnZSA/IGhpZ2hsaWdodChsYW5ndWFnZSwgdGV4dCwgdHJ1ZSkgOiBoaWdobGlnaHRBdXRvKHRleHQpO1xuXG4gICAgb3JpZ2luYWxTdHJlYW0gPSBub2RlU3RyZWFtKG5vZGUpO1xuICAgIGlmIChvcmlnaW5hbFN0cmVhbS5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwnLCAnZGl2Jyk7XG4gICAgICByZXN1bHROb2RlLmlubmVySFRNTCA9IHJlc3VsdC52YWx1ZTtcbiAgICAgIHJlc3VsdC52YWx1ZSA9IG1lcmdlU3RyZWFtcyhvcmlnaW5hbFN0cmVhbSwgbm9kZVN0cmVhbShyZXN1bHROb2RlKSwgdGV4dCk7XG4gICAgfVxuICAgIHJlc3VsdC52YWx1ZSA9IGZpeE1hcmt1cChyZXN1bHQudmFsdWUpO1xuXG4gICAgYmxvY2suaW5uZXJIVE1MID0gcmVzdWx0LnZhbHVlO1xuICAgIGJsb2NrLmNsYXNzTmFtZSA9IGJ1aWxkQ2xhc3NOYW1lKGJsb2NrLmNsYXNzTmFtZSwgbGFuZ3VhZ2UsIHJlc3VsdC5sYW5ndWFnZSk7XG4gICAgYmxvY2sucmVzdWx0ID0ge1xuICAgICAgbGFuZ3VhZ2U6IHJlc3VsdC5sYW5ndWFnZSxcbiAgICAgIHJlOiByZXN1bHQucmVsZXZhbmNlXG4gICAgfTtcbiAgICBpZiAocmVzdWx0LnNlY29uZF9iZXN0KSB7XG4gICAgICBibG9jay5zZWNvbmRfYmVzdCA9IHtcbiAgICAgICAgbGFuZ3VhZ2U6IHJlc3VsdC5zZWNvbmRfYmVzdC5sYW5ndWFnZSxcbiAgICAgICAgcmU6IHJlc3VsdC5zZWNvbmRfYmVzdC5yZWxldmFuY2VcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLypcbiAgVXBkYXRlcyBoaWdobGlnaHQuanMgZ2xvYmFsIG9wdGlvbnMgd2l0aCB2YWx1ZXMgcGFzc2VkIGluIHRoZSBmb3JtIG9mIGFuIG9iamVjdC5cbiAgKi9cbiAgZnVuY3Rpb24gY29uZmlndXJlKHVzZXJfb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBpbmhlcml0KG9wdGlvbnMsIHVzZXJfb3B0aW9ucyk7XG4gIH1cblxuICAvKlxuICBBcHBsaWVzIGhpZ2hsaWdodGluZyB0byBhbGwgPHByZT48Y29kZT4uLjwvY29kZT48L3ByZT4gYmxvY2tzIG9uIGEgcGFnZS5cbiAgKi9cbiAgZnVuY3Rpb24gaW5pdEhpZ2hsaWdodGluZygpIHtcbiAgICBpZiAoaW5pdEhpZ2hsaWdodGluZy5jYWxsZWQpXG4gICAgICByZXR1cm47XG4gICAgaW5pdEhpZ2hsaWdodGluZy5jYWxsZWQgPSB0cnVlO1xuXG4gICAgdmFyIGJsb2NrcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3ByZSBjb2RlJyk7XG4gICAgQXJyYXlQcm90by5mb3JFYWNoLmNhbGwoYmxvY2tzLCBoaWdobGlnaHRCbG9jayk7XG4gIH1cblxuICAvKlxuICBBdHRhY2hlcyBoaWdobGlnaHRpbmcgdG8gdGhlIHBhZ2UgbG9hZCBldmVudC5cbiAgKi9cbiAgZnVuY3Rpb24gaW5pdEhpZ2hsaWdodGluZ09uTG9hZCgpIHtcbiAgICBhZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgaW5pdEhpZ2hsaWdodGluZywgZmFsc2UpO1xuICAgIGFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBpbml0SGlnaGxpZ2h0aW5nLCBmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWdpc3Rlckxhbmd1YWdlKG5hbWUsIGxhbmd1YWdlKSB7XG4gICAgdmFyIGxhbmcgPSBsYW5ndWFnZXNbbmFtZV0gPSBsYW5ndWFnZShobGpzKTtcbiAgICBpZiAobGFuZy5hbGlhc2VzKSB7XG4gICAgICBsYW5nLmFsaWFzZXMuZm9yRWFjaChmdW5jdGlvbihhbGlhcykge2FsaWFzZXNbYWxpYXNdID0gbmFtZTt9KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsaXN0TGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiBvYmplY3RLZXlzKGxhbmd1YWdlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRMYW5ndWFnZShuYW1lKSB7XG4gICAgbmFtZSA9IChuYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHJldHVybiBsYW5ndWFnZXNbbmFtZV0gfHwgbGFuZ3VhZ2VzW2FsaWFzZXNbbmFtZV1dO1xuICB9XG5cbiAgLyogSW50ZXJmYWNlIGRlZmluaXRpb24gKi9cblxuICBobGpzLmhpZ2hsaWdodCA9IGhpZ2hsaWdodDtcbiAgaGxqcy5oaWdobGlnaHRBdXRvID0gaGlnaGxpZ2h0QXV0bztcbiAgaGxqcy5maXhNYXJrdXAgPSBmaXhNYXJrdXA7XG4gIGhsanMuaGlnaGxpZ2h0QmxvY2sgPSBoaWdobGlnaHRCbG9jaztcbiAgaGxqcy5jb25maWd1cmUgPSBjb25maWd1cmU7XG4gIGhsanMuaW5pdEhpZ2hsaWdodGluZyA9IGluaXRIaWdobGlnaHRpbmc7XG4gIGhsanMuaW5pdEhpZ2hsaWdodGluZ09uTG9hZCA9IGluaXRIaWdobGlnaHRpbmdPbkxvYWQ7XG4gIGhsanMucmVnaXN0ZXJMYW5ndWFnZSA9IHJlZ2lzdGVyTGFuZ3VhZ2U7XG4gIGhsanMubGlzdExhbmd1YWdlcyA9IGxpc3RMYW5ndWFnZXM7XG4gIGhsanMuZ2V0TGFuZ3VhZ2UgPSBnZXRMYW5ndWFnZTtcbiAgaGxqcy5pbmhlcml0ID0gaW5oZXJpdDtcblxuICAvLyBDb21tb24gcmVnZXhwc1xuICBobGpzLklERU5UX1JFID0gJ1thLXpBLVpdXFxcXHcqJztcbiAgaGxqcy5VTkRFUlNDT1JFX0lERU5UX1JFID0gJ1thLXpBLVpfXVxcXFx3Kic7XG4gIGhsanMuTlVNQkVSX1JFID0gJ1xcXFxiXFxcXGQrKFxcXFwuXFxcXGQrKT8nO1xuICBobGpzLkNfTlVNQkVSX1JFID0gJygtPykoXFxcXGIwW3hYXVthLWZBLUYwLTldK3woXFxcXGJcXFxcZCsoXFxcXC5cXFxcZCopP3xcXFxcLlxcXFxkKykoW2VFXVstK10/XFxcXGQrKT8pJzsgLy8gMHguLi4sIDAuLi4sIGRlY2ltYWwsIGZsb2F0XG4gIGhsanMuQklOQVJZX05VTUJFUl9SRSA9ICdcXFxcYigwYlswMV0rKSc7IC8vIDBiLi4uXG4gIGhsanMuUkVfU1RBUlRFUlNfUkUgPSAnIXwhPXwhPT18JXwlPXwmfCYmfCY9fFxcXFwqfFxcXFwqPXxcXFxcK3xcXFxcKz18LHwtfC09fC89fC98Onw7fDw8fDw8PXw8PXw8fD09PXw9PXw9fD4+Pj18Pj49fD49fD4+Pnw+Pnw+fFxcXFw/fFxcXFxbfFxcXFx7fFxcXFwofFxcXFxefFxcXFxePXxcXFxcfHxcXFxcfD18XFxcXHxcXFxcfHx+JztcblxuICAvLyBDb21tb24gbW9kZXNcbiAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFID0ge1xuICAgIGJlZ2luOiAnXFxcXFxcXFxbXFxcXHNcXFxcU10nLCByZWxldmFuY2U6IDBcbiAgfTtcbiAgaGxqcy5BUE9TX1NUUklOR19NT0RFID0ge1xuICAgIGNsYXNzTmFtZTogJ3N0cmluZycsXG4gICAgYmVnaW46ICdcXCcnLCBlbmQ6ICdcXCcnLFxuICAgIGlsbGVnYWw6ICdcXFxcbicsXG4gICAgY29udGFpbnM6IFtobGpzLkJBQ0tTTEFTSF9FU0NBUEVdXG4gIH07XG4gIGhsanMuUVVPVEVfU1RSSU5HX01PREUgPSB7XG4gICAgY2xhc3NOYW1lOiAnc3RyaW5nJyxcbiAgICBiZWdpbjogJ1wiJywgZW5kOiAnXCInLFxuICAgIGlsbGVnYWw6ICdcXFxcbicsXG4gICAgY29udGFpbnM6IFtobGpzLkJBQ0tTTEFTSF9FU0NBUEVdXG4gIH07XG4gIGhsanMuUEhSQVNBTF9XT1JEU19NT0RFID0ge1xuICAgIGJlZ2luOiAvXFxiKGF8YW58dGhlfGFyZXxJJ218aXNuJ3R8ZG9uJ3R8ZG9lc24ndHx3b24ndHxidXR8anVzdHxzaG91bGR8cHJldHR5fHNpbXBseXxlbm91Z2h8Z29ubmF8Z29pbmd8d3RmfHNvfHN1Y2h8d2lsbHx5b3V8eW91cnx0aGV5fGxpa2V8bW9yZSlcXGIvXG4gIH07XG4gIGhsanMuQ09NTUVOVCA9IGZ1bmN0aW9uIChiZWdpbiwgZW5kLCBpbmhlcml0cykge1xuICAgIHZhciBtb2RlID0gaGxqcy5pbmhlcml0KFxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdjb21tZW50JyxcbiAgICAgICAgYmVnaW46IGJlZ2luLCBlbmQ6IGVuZCxcbiAgICAgICAgY29udGFpbnM6IFtdXG4gICAgICB9LFxuICAgICAgaW5oZXJpdHMgfHwge31cbiAgICApO1xuICAgIG1vZGUuY29udGFpbnMucHVzaChobGpzLlBIUkFTQUxfV09SRFNfTU9ERSk7XG4gICAgbW9kZS5jb250YWlucy5wdXNoKHtcbiAgICAgIGNsYXNzTmFtZTogJ2RvY3RhZycsXG4gICAgICBiZWdpbjogJyg/OlRPRE98RklYTUV8Tk9URXxCVUd8WFhYKTonLFxuICAgICAgcmVsZXZhbmNlOiAwXG4gICAgfSk7XG4gICAgcmV0dXJuIG1vZGU7XG4gIH07XG4gIGhsanMuQ19MSU5FX0NPTU1FTlRfTU9ERSA9IGhsanMuQ09NTUVOVCgnLy8nLCAnJCcpO1xuICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFID0gaGxqcy5DT01NRU5UKCcvXFxcXConLCAnXFxcXCovJyk7XG4gIGhsanMuSEFTSF9DT01NRU5UX01PREUgPSBobGpzLkNPTU1FTlQoJyMnLCAnJCcpO1xuICBobGpzLk5VTUJFUl9NT0RFID0ge1xuICAgIGNsYXNzTmFtZTogJ251bWJlcicsXG4gICAgYmVnaW46IGhsanMuTlVNQkVSX1JFLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuICBobGpzLkNfTlVNQkVSX01PREUgPSB7XG4gICAgY2xhc3NOYW1lOiAnbnVtYmVyJyxcbiAgICBiZWdpbjogaGxqcy5DX05VTUJFUl9SRSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcbiAgaGxqcy5CSU5BUllfTlVNQkVSX01PREUgPSB7XG4gICAgY2xhc3NOYW1lOiAnbnVtYmVyJyxcbiAgICBiZWdpbjogaGxqcy5CSU5BUllfTlVNQkVSX1JFLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuICBobGpzLkNTU19OVU1CRVJfTU9ERSA9IHtcbiAgICBjbGFzc05hbWU6ICdudW1iZXInLFxuICAgIGJlZ2luOiBobGpzLk5VTUJFUl9SRSArICcoJyArXG4gICAgICAnJXxlbXxleHxjaHxyZW0nICArXG4gICAgICAnfHZ3fHZofHZtaW58dm1heCcgK1xuICAgICAgJ3xjbXxtbXxpbnxwdHxwY3xweCcgK1xuICAgICAgJ3xkZWd8Z3JhZHxyYWR8dHVybicgK1xuICAgICAgJ3xzfG1zJyArXG4gICAgICAnfEh6fGtIeicgK1xuICAgICAgJ3xkcGl8ZHBjbXxkcHB4JyArXG4gICAgICAnKT8nLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuICBobGpzLlJFR0VYUF9NT0RFID0ge1xuICAgIGNsYXNzTmFtZTogJ3JlZ2V4cCcsXG4gICAgYmVnaW46IC9cXC8vLCBlbmQ6IC9cXC9bZ2ltdXldKi8sXG4gICAgaWxsZWdhbDogL1xcbi8sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIGhsanMuQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC9cXFsvLCBlbmQ6IC9cXF0vLFxuICAgICAgICByZWxldmFuY2U6IDAsXG4gICAgICAgIGNvbnRhaW5zOiBbaGxqcy5CQUNLU0xBU0hfRVNDQVBFXVxuICAgICAgfVxuICAgIF1cbiAgfTtcbiAgaGxqcy5USVRMRV9NT0RFID0ge1xuICAgIGNsYXNzTmFtZTogJ3RpdGxlJyxcbiAgICBiZWdpbjogaGxqcy5JREVOVF9SRSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcbiAgaGxqcy5VTkRFUlNDT1JFX1RJVExFX01PREUgPSB7XG4gICAgY2xhc3NOYW1lOiAndGl0bGUnLFxuICAgIGJlZ2luOiBobGpzLlVOREVSU0NPUkVfSURFTlRfUkUsXG4gICAgcmVsZXZhbmNlOiAwXG4gIH07XG4gIGhsanMuTUVUSE9EX0dVQVJEID0ge1xuICAgIC8vIGV4Y2x1ZGVzIG1ldGhvZCBuYW1lcyBmcm9tIGtleXdvcmQgcHJvY2Vzc2luZ1xuICAgIGJlZ2luOiAnXFxcXC5cXFxccyonICsgaGxqcy5VTkRFUlNDT1JFX0lERU5UX1JFLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIHJldHVybiBobGpzO1xufSkpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihobGpzKSB7XG4gIHJldHVybiB7XG4gICAgYWxpYXNlczogWydhZG9jJ10sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIC8vIGJsb2NrIGNvbW1lbnRcbiAgICAgIGhsanMuQ09NTUVOVChcbiAgICAgICAgJ14vezQsfVxcXFxuJyxcbiAgICAgICAgJ1xcXFxuL3s0LH0kJyxcbiAgICAgICAgLy8gY2FuIGFsc28gYmUgZG9uZSBhcy4uLlxuICAgICAgICAvLydeL3s0LH0kJyxcbiAgICAgICAgLy8nXi97NCx9JCcsXG4gICAgICAgIHtcbiAgICAgICAgICByZWxldmFuY2U6IDEwXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICAvLyBsaW5lIGNvbW1lbnRcbiAgICAgIGhsanMuQ09NTUVOVChcbiAgICAgICAgJ14vLycsXG4gICAgICAgICckJyxcbiAgICAgICAge1xuICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICB9XG4gICAgICApLFxuICAgICAgLy8gdGl0bGVcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAndGl0bGUnLFxuICAgICAgICBiZWdpbjogJ15cXFxcLlxcXFx3LiokJ1xuICAgICAgfSxcbiAgICAgIC8vIGV4YW1wbGUsIGFkbW9uaXRpb24gJiBzaWRlYmFyIGJsb2Nrc1xuICAgICAge1xuICAgICAgICBiZWdpbjogJ15bPVxcXFwqXXs0LH1cXFxcbicsXG4gICAgICAgIGVuZDogJ1xcXFxuXls9XFxcXCpdezQsfSQnLFxuICAgICAgICByZWxldmFuY2U6IDEwXG4gICAgICB9LFxuICAgICAgLy8gaGVhZGluZ3NcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnc2VjdGlvbicsXG4gICAgICAgIHJlbGV2YW5jZTogMTAsXG4gICAgICAgIHZhcmlhbnRzOiBbXG4gICAgICAgICAge2JlZ2luOiAnXig9ezEsNX0pIC4rPyggXFxcXDEpPyQnfSxcbiAgICAgICAgICB7YmVnaW46ICdeW15cXFxcW1xcXFxdXFxcXG5dKz9cXFxcbls9XFxcXC1+XFxcXF5cXFxcK117Mix9JCd9LFxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgLy8gZG9jdW1lbnQgYXR0cmlidXRlc1xuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdtZXRhJyxcbiAgICAgICAgYmVnaW46ICdeOi4rPzonLFxuICAgICAgICBlbmQ6ICdcXFxccycsXG4gICAgICAgIGV4Y2x1ZGVFbmQ6IHRydWUsXG4gICAgICAgIHJlbGV2YW5jZTogMTBcbiAgICAgIH0sXG4gICAgICAvLyBibG9jayBhdHRyaWJ1dGVzXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ21ldGEnLFxuICAgICAgICBiZWdpbjogJ15cXFxcWy4rP1xcXFxdJCcsXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIC8vIHF1b3RlYmxvY2tzXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3F1b3RlJyxcbiAgICAgICAgYmVnaW46ICdeX3s0LH1cXFxcbicsXG4gICAgICAgIGVuZDogJ1xcXFxuX3s0LH0kJyxcbiAgICAgICAgcmVsZXZhbmNlOiAxMFxuICAgICAgfSxcbiAgICAgIC8vIGxpc3RpbmcgYW5kIGxpdGVyYWwgYmxvY2tzXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ2NvZGUnLFxuICAgICAgICBiZWdpbjogJ15bXFxcXC1cXFxcLl17NCx9XFxcXG4nLFxuICAgICAgICBlbmQ6ICdcXFxcbltcXFxcLVxcXFwuXXs0LH0kJyxcbiAgICAgICAgcmVsZXZhbmNlOiAxMFxuICAgICAgfSxcbiAgICAgIC8vIHBhc3N0aHJvdWdoIGJsb2Nrc1xuICAgICAge1xuICAgICAgICBiZWdpbjogJ15cXFxcK3s0LH1cXFxcbicsXG4gICAgICAgIGVuZDogJ1xcXFxuXFxcXCt7NCx9JCcsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYmVnaW46ICc8JywgZW5kOiAnPicsXG4gICAgICAgICAgICBzdWJMYW5ndWFnZTogJ3htbCcsXG4gICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIHJlbGV2YW5jZTogMTBcbiAgICAgIH0sXG4gICAgICAvLyBsaXN0cyAoY2FuIG9ubHkgY2FwdHVyZSBpbmRpY2F0b3JzKVxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdidWxsZXQnLFxuICAgICAgICBiZWdpbjogJ14oXFxcXCorfFxcXFwtK3xcXFxcLit8W15cXFxcbl0rPzo6KVxcXFxzKydcbiAgICAgIH0sXG4gICAgICAvLyBhZG1vbml0aW9uXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3N5bWJvbCcsXG4gICAgICAgIGJlZ2luOiAnXihOT1RFfFRJUHxJTVBPUlRBTlR8V0FSTklOR3xDQVVUSU9OKTpcXFxccysnLFxuICAgICAgICByZWxldmFuY2U6IDEwXG4gICAgICB9LFxuICAgICAgLy8gaW5saW5lIHN0cm9uZ1xuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdzdHJvbmcnLFxuICAgICAgICAvLyBtdXN0IG5vdCBmb2xsb3cgYSB3b3JkIGNoYXJhY3RlciBvciBiZSBmb2xsb3dlZCBieSBhbiBhc3RlcmlzayBvciBzcGFjZVxuICAgICAgICBiZWdpbjogJ1xcXFxCXFxcXCooPyFbXFxcXCpcXFxcc10pJyxcbiAgICAgICAgZW5kOiAnKFxcXFxuezJ9fFxcXFwqKScsXG4gICAgICAgIC8vIGFsbG93IGVzY2FwZWQgYXN0ZXJpc2sgZm9sbG93ZWQgYnkgd29yZCBjaGFyXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYmVnaW46ICdcXFxcXFxcXCpcXFxcdycsXG4gICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICAvLyBpbmxpbmUgZW1waGFzaXNcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnZW1waGFzaXMnLFxuICAgICAgICAvLyBtdXN0IG5vdCBmb2xsb3cgYSB3b3JkIGNoYXJhY3RlciBvciBiZSBmb2xsb3dlZCBieSBhIHNpbmdsZSBxdW90ZSBvciBzcGFjZVxuICAgICAgICBiZWdpbjogJ1xcXFxCXFwnKD8hW1xcJ1xcXFxzXSknLFxuICAgICAgICBlbmQ6ICcoXFxcXG57Mn18XFwnKScsXG4gICAgICAgIC8vIGFsbG93IGVzY2FwZWQgc2luZ2xlIHF1b3RlIGZvbGxvd2VkIGJ5IHdvcmQgY2hhclxuICAgICAgICBjb250YWluczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJlZ2luOiAnXFxcXFxcXFxcXCdcXFxcdycsXG4gICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIC8vIGlubGluZSBlbXBoYXNpcyAoYWx0KVxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdlbXBoYXNpcycsXG4gICAgICAgIC8vIG11c3Qgbm90IGZvbGxvdyBhIHdvcmQgY2hhcmFjdGVyIG9yIGJlIGZvbGxvd2VkIGJ5IGFuIHVuZGVybGluZSBvciBzcGFjZVxuICAgICAgICBiZWdpbjogJ18oPyFbX1xcXFxzXSknLFxuICAgICAgICBlbmQ6ICcoXFxcXG57Mn18XyknLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH0sXG4gICAgICAvLyBpbmxpbmUgc21hcnQgcXVvdGVzXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3N0cmluZycsXG4gICAgICAgIHZhcmlhbnRzOiBbXG4gICAgICAgICAge2JlZ2luOiBcImBgLis/JydcIn0sXG4gICAgICAgICAge2JlZ2luOiBcImAuKz8nXCJ9XG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICAvLyBpbmxpbmUgY29kZSBzbmlwcGV0cyAoVE9ETyBzaG91bGQgZ2V0IHNhbWUgdHJlYXRtZW50IGFzIHN0cm9uZyBhbmQgZW1waGFzaXMpXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ2NvZGUnLFxuICAgICAgICBiZWdpbjogJyhgLis/YHxcXFxcKy4rP1xcXFwrKScsXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIC8vIGluZGVudGVkIGxpdGVyYWwgYmxvY2tcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnY29kZScsXG4gICAgICAgIGJlZ2luOiAnXlsgXFxcXHRdJyxcbiAgICAgICAgZW5kOiAnJCcsXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIC8vIGhvcml6b250YWwgcnVsZXNcbiAgICAgIHtcbiAgICAgICAgYmVnaW46ICdeXFwnezMsfVsgXFxcXHRdKiQnLFxuICAgICAgICByZWxldmFuY2U6IDEwXG4gICAgICB9LFxuICAgICAgLy8gaW1hZ2VzIGFuZCBsaW5rc1xuICAgICAge1xuICAgICAgICBiZWdpbjogJyhsaW5rOik/KGh0dHB8aHR0cHN8ZnRwfGZpbGV8aXJjfGltYWdlOj8pOlxcXFxTK1xcXFxbLio/XFxcXF0nLFxuICAgICAgICByZXR1cm5CZWdpbjogdHJ1ZSxcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBiZWdpbjogJyhsaW5rfGltYWdlOj8pOicsXG4gICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJ2xpbmsnLFxuICAgICAgICAgICAgYmVnaW46ICdcXFxcdycsXG4gICAgICAgICAgICBlbmQ6ICdbXlxcXFxbXSsnLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjbGFzc05hbWU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgYmVnaW46ICdcXFxcWycsXG4gICAgICAgICAgICBlbmQ6ICdcXFxcXScsXG4gICAgICAgICAgICBleGNsdWRlQmVnaW46IHRydWUsXG4gICAgICAgICAgICBleGNsdWRlRW5kOiB0cnVlLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICByZWxldmFuY2U6IDEwXG4gICAgICB9XG4gICAgXVxuICB9O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGhsanMpIHtcbiAgdmFyIFZBUiA9IHtcbiAgICBjbGFzc05hbWU6ICd2YXJpYWJsZScsXG4gICAgdmFyaWFudHM6IFtcbiAgICAgIHtiZWdpbjogL1xcJFtcXHdcXGQjQF1bXFx3XFxkX10qL30sXG4gICAgICB7YmVnaW46IC9cXCRcXHsoLio/KX0vfVxuICAgIF1cbiAgfTtcbiAgdmFyIFFVT1RFX1NUUklORyA9IHtcbiAgICBjbGFzc05hbWU6ICdzdHJpbmcnLFxuICAgIGJlZ2luOiAvXCIvLCBlbmQ6IC9cIi8sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIGhsanMuQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICAgIFZBUixcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAndmFyaWFibGUnLFxuICAgICAgICBiZWdpbjogL1xcJFxcKC8sIGVuZDogL1xcKS8sXG4gICAgICAgIGNvbnRhaW5zOiBbaGxqcy5CQUNLU0xBU0hfRVNDQVBFXVxuICAgICAgfVxuICAgIF1cbiAgfTtcbiAgdmFyIEFQT1NfU1RSSU5HID0ge1xuICAgIGNsYXNzTmFtZTogJ3N0cmluZycsXG4gICAgYmVnaW46IC8nLywgZW5kOiAvJy9cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGFsaWFzZXM6IFsnc2gnLCAnenNoJ10sXG4gICAgbGV4ZW1lczogL1xcYi0/W2EtelxcLl9dK1xcYi8sXG4gICAga2V5d29yZHM6IHtcbiAgICAgIGtleXdvcmQ6XG4gICAgICAgICdpZiB0aGVuIGVsc2UgZWxpZiBmaSBmb3Igd2hpbGUgaW4gZG8gZG9uZSBjYXNlIGVzYWMgZnVuY3Rpb24nLFxuICAgICAgbGl0ZXJhbDpcbiAgICAgICAgJ3RydWUgZmFsc2UnLFxuICAgICAgYnVpbHRfaW46XG4gICAgICAgIC8vIFNoZWxsIGJ1aWx0LWluc1xuICAgICAgICAvLyBodHRwOi8vd3d3LmdudS5vcmcvc29mdHdhcmUvYmFzaC9tYW51YWwvaHRtbF9ub2RlL1NoZWxsLUJ1aWx0aW4tQ29tbWFuZHMuaHRtbFxuICAgICAgICAnYnJlYWsgY2QgY29udGludWUgZXZhbCBleGVjIGV4aXQgZXhwb3J0IGdldG9wdHMgaGFzaCBwd2QgcmVhZG9ubHkgcmV0dXJuIHNoaWZ0IHRlc3QgdGltZXMgJyArXG4gICAgICAgICd0cmFwIHVtYXNrIHVuc2V0ICcgK1xuICAgICAgICAvLyBCYXNoIGJ1aWx0LWluc1xuICAgICAgICAnYWxpYXMgYmluZCBidWlsdGluIGNhbGxlciBjb21tYW5kIGRlY2xhcmUgZWNobyBlbmFibGUgaGVscCBsZXQgbG9jYWwgbG9nb3V0IG1hcGZpbGUgcHJpbnRmICcgK1xuICAgICAgICAncmVhZCByZWFkYXJyYXkgc291cmNlIHR5cGUgdHlwZXNldCB1bGltaXQgdW5hbGlhcyAnICtcbiAgICAgICAgLy8gU2hlbGwgbW9kaWZpZXJzXG4gICAgICAgICdzZXQgc2hvcHQgJyArXG4gICAgICAgIC8vIFpzaCBidWlsdC1pbnNcbiAgICAgICAgJ2F1dG9sb2FkIGJnIGJpbmRrZXkgYnllIGNhcCBjaGRpciBjbG9uZSBjb21wYXJndW1lbnRzIGNvbXBjYWxsIGNvbXBjdGwgY29tcGRlc2NyaWJlIGNvbXBmaWxlcyAnICtcbiAgICAgICAgJ2NvbXBncm91cHMgY29tcHF1b3RlIGNvbXB0YWdzIGNvbXB0cnkgY29tcHZhbHVlcyBkaXJzIGRpc2FibGUgZGlzb3duIGVjaG90YyBlY2hvdGkgZW11bGF0ZSAnICtcbiAgICAgICAgJ2ZjIGZnIGZsb2F0IGZ1bmN0aW9ucyBnZXRjYXAgZ2V0bG4gaGlzdG9yeSBpbnRlZ2VyIGpvYnMga2lsbCBsaW1pdCBsb2cgbm9nbG9iIHBvcGQgcHJpbnQgJyArXG4gICAgICAgICdwdXNoZCBwdXNobG4gcmVoYXNoIHNjaGVkIHNldGNhcCBzZXRvcHQgc3RhdCBzdXNwZW5kIHR0eWN0bCB1bmZ1bmN0aW9uIHVuaGFzaCB1bmxpbWl0ICcgK1xuICAgICAgICAndW5zZXRvcHQgdmFyZWQgd2FpdCB3aGVuY2Ugd2hlcmUgd2hpY2ggemNvbXBpbGUgemZvcm1hdCB6ZnRwIHpsZSB6bW9kbG9hZCB6cGFyc2VvcHRzIHpwcm9mICcgK1xuICAgICAgICAnenB0eSB6cmVnZXhwYXJzZSB6c29ja2V0IHpzdHlsZSB6dGNwJyxcbiAgICAgIF86XG4gICAgICAgICctbmUgLWVxIC1sdCAtZ3QgLWYgLWQgLWUgLXMgLWwgLWEnIC8vIHJlbGV2YW5jZSBib29zdGVyXG4gICAgfSxcbiAgICBjb250YWluczogW1xuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdtZXRhJyxcbiAgICAgICAgYmVnaW46IC9eIyFbXlxcbl0rc2hcXHMqJC8sXG4gICAgICAgIHJlbGV2YW5jZTogMTBcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ2Z1bmN0aW9uJyxcbiAgICAgICAgYmVnaW46IC9cXHdbXFx3XFxkX10qXFxzKlxcKFxccypcXClcXHMqXFx7LyxcbiAgICAgICAgcmV0dXJuQmVnaW46IHRydWUsXG4gICAgICAgIGNvbnRhaW5zOiBbaGxqcy5pbmhlcml0KGhsanMuVElUTEVfTU9ERSwge2JlZ2luOiAvXFx3W1xcd1xcZF9dKi99KV0sXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIGhsanMuSEFTSF9DT01NRU5UX01PREUsXG4gICAgICBRVU9URV9TVFJJTkcsXG4gICAgICBBUE9TX1NUUklORyxcbiAgICAgIFZBUlxuICAgIF1cbiAgfTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihobGpzKSB7XG4gIHZhciBJREVOVF9SRSA9ICdbQS1aYS16JF9dWzAtOUEtWmEteiRfXSonO1xuICB2YXIgS0VZV09SRFMgPSB7XG4gICAga2V5d29yZDpcbiAgICAgICdpbiBvZiBpZiBmb3Igd2hpbGUgZmluYWxseSB2YXIgbmV3IGZ1bmN0aW9uIGRvIHJldHVybiB2b2lkIGVsc2UgYnJlYWsgY2F0Y2ggJyArXG4gICAgICAnaW5zdGFuY2VvZiB3aXRoIHRocm93IGNhc2UgZGVmYXVsdCB0cnkgdGhpcyBzd2l0Y2ggY29udGludWUgdHlwZW9mIGRlbGV0ZSAnICtcbiAgICAgICdsZXQgeWllbGQgY29uc3QgZXhwb3J0IHN1cGVyIGRlYnVnZ2VyIGFzIGFzeW5jIGF3YWl0IHN0YXRpYyAnICtcbiAgICAgIC8vIEVDTUFTY3JpcHQgNiBtb2R1bGVzIGltcG9ydFxuICAgICAgJ2ltcG9ydCBmcm9tIGFzJ1xuICAgICxcbiAgICBsaXRlcmFsOlxuICAgICAgJ3RydWUgZmFsc2UgbnVsbCB1bmRlZmluZWQgTmFOIEluZmluaXR5JyxcbiAgICBidWlsdF9pbjpcbiAgICAgICdldmFsIGlzRmluaXRlIGlzTmFOIHBhcnNlRmxvYXQgcGFyc2VJbnQgZGVjb2RlVVJJIGRlY29kZVVSSUNvbXBvbmVudCAnICtcbiAgICAgICdlbmNvZGVVUkkgZW5jb2RlVVJJQ29tcG9uZW50IGVzY2FwZSB1bmVzY2FwZSBPYmplY3QgRnVuY3Rpb24gQm9vbGVhbiBFcnJvciAnICtcbiAgICAgICdFdmFsRXJyb3IgSW50ZXJuYWxFcnJvciBSYW5nZUVycm9yIFJlZmVyZW5jZUVycm9yIFN0b3BJdGVyYXRpb24gU3ludGF4RXJyb3IgJyArXG4gICAgICAnVHlwZUVycm9yIFVSSUVycm9yIE51bWJlciBNYXRoIERhdGUgU3RyaW5nIFJlZ0V4cCBBcnJheSBGbG9hdDMyQXJyYXkgJyArXG4gICAgICAnRmxvYXQ2NEFycmF5IEludDE2QXJyYXkgSW50MzJBcnJheSBJbnQ4QXJyYXkgVWludDE2QXJyYXkgVWludDMyQXJyYXkgJyArXG4gICAgICAnVWludDhBcnJheSBVaW50OENsYW1wZWRBcnJheSBBcnJheUJ1ZmZlciBEYXRhVmlldyBKU09OIEludGwgYXJndW1lbnRzIHJlcXVpcmUgJyArXG4gICAgICAnbW9kdWxlIGNvbnNvbGUgd2luZG93IGRvY3VtZW50IFN5bWJvbCBTZXQgTWFwIFdlYWtTZXQgV2Vha01hcCBQcm94eSBSZWZsZWN0ICcgK1xuICAgICAgJ1Byb21pc2UnXG4gIH07XG4gIHZhciBFWFBSRVNTSU9OUztcbiAgdmFyIE5VTUJFUiA9IHtcbiAgICBjbGFzc05hbWU6ICdudW1iZXInLFxuICAgIHZhcmlhbnRzOiBbXG4gICAgICB7IGJlZ2luOiAnXFxcXGIoMFtiQl1bMDFdKyknIH0sXG4gICAgICB7IGJlZ2luOiAnXFxcXGIoMFtvT11bMC03XSspJyB9LFxuICAgICAgeyBiZWdpbjogaGxqcy5DX05VTUJFUl9SRSB9XG4gICAgXSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcbiAgdmFyIFNVQlNUID0ge1xuICAgIGNsYXNzTmFtZTogJ3N1YnN0JyxcbiAgICBiZWdpbjogJ1xcXFwkXFxcXHsnLCBlbmQ6ICdcXFxcfScsXG4gICAga2V5d29yZHM6IEtFWVdPUkRTLFxuICAgIGNvbnRhaW5zOiBbXSAgLy8gZGVmaW5lZCBsYXRlclxuICB9O1xuICB2YXIgVEVNUExBVEVfU1RSSU5HID0ge1xuICAgIGNsYXNzTmFtZTogJ3N0cmluZycsXG4gICAgYmVnaW46ICdgJywgZW5kOiAnYCcsXG4gICAgY29udGFpbnM6IFtcbiAgICAgIGhsanMuQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICAgIFNVQlNUXG4gICAgXVxuICB9O1xuICBTVUJTVC5jb250YWlucyA9IFtcbiAgICBobGpzLkFQT1NfU1RSSU5HX01PREUsXG4gICAgaGxqcy5RVU9URV9TVFJJTkdfTU9ERSxcbiAgICBURU1QTEFURV9TVFJJTkcsXG4gICAgTlVNQkVSLFxuICAgIGhsanMuUkVHRVhQX01PREVcbiAgXVxuICB2YXIgUEFSQU1TX0NPTlRBSU5TID0gU1VCU1QuY29udGFpbnMuY29uY2F0KFtcbiAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgIGhsanMuQ19MSU5FX0NPTU1FTlRfTU9ERVxuICBdKTtcblxuICByZXR1cm4ge1xuICAgIGFsaWFzZXM6IFsnanMnLCAnanN4J10sXG4gICAga2V5d29yZHM6IEtFWVdPUkRTLFxuICAgIGNvbnRhaW5zOiBbXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ21ldGEnLFxuICAgICAgICByZWxldmFuY2U6IDEwLFxuICAgICAgICBiZWdpbjogL15cXHMqWydcIl11c2UgKHN0cmljdHxhc20pWydcIl0vXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdtZXRhJyxcbiAgICAgICAgYmVnaW46IC9eIyEvLCBlbmQ6IC8kL1xuICAgICAgfSxcbiAgICAgIGhsanMuQVBPU19TVFJJTkdfTU9ERSxcbiAgICAgIGhsanMuUVVPVEVfU1RSSU5HX01PREUsXG4gICAgICBURU1QTEFURV9TVFJJTkcsXG4gICAgICBobGpzLkNfTElORV9DT01NRU5UX01PREUsXG4gICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgICAgTlVNQkVSLFxuICAgICAgeyAvLyBvYmplY3QgYXR0ciBjb250YWluZXJcbiAgICAgICAgYmVnaW46IC9beyxdXFxzKi8sIHJlbGV2YW5jZTogMCxcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBiZWdpbjogSURFTlRfUkUgKyAnXFxcXHMqOicsIHJldHVybkJlZ2luOiB0cnVlLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgICAgICAgY29udGFpbnM6IFt7Y2xhc3NOYW1lOiAnYXR0cicsIGJlZ2luOiBJREVOVF9SRSwgcmVsZXZhbmNlOiAwfV1cbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICB7IC8vIFwidmFsdWVcIiBjb250YWluZXJcbiAgICAgICAgYmVnaW46ICcoJyArIGhsanMuUkVfU1RBUlRFUlNfUkUgKyAnfFxcXFxiKGNhc2V8cmV0dXJufHRocm93KVxcXFxiKVxcXFxzKicsXG4gICAgICAgIGtleXdvcmRzOiAncmV0dXJuIHRocm93IGNhc2UnLFxuICAgICAgICBjb250YWluczogW1xuICAgICAgICAgIGhsanMuQ19MSU5FX0NPTU1FTlRfTU9ERSxcbiAgICAgICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgICAgICAgIGhsanMuUkVHRVhQX01PREUsXG4gICAgICAgICAge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnZnVuY3Rpb24nLFxuICAgICAgICAgICAgYmVnaW46ICcoXFxcXCguKj9cXFxcKXwnICsgSURFTlRfUkUgKyAnKVxcXFxzKj0+JywgcmV0dXJuQmVnaW46IHRydWUsXG4gICAgICAgICAgICBlbmQ6ICdcXFxccyo9PicsXG4gICAgICAgICAgICBjb250YWluczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lOiAncGFyYW1zJyxcbiAgICAgICAgICAgICAgICB2YXJpYW50czogW1xuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBiZWdpbjogSURFTlRfUkVcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luOiAvXFwoXFxzKlxcKS8sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBiZWdpbjogL1xcKC8sIGVuZDogL1xcKS8sXG4gICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGVCZWdpbjogdHJ1ZSwgZXhjbHVkZUVuZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAga2V5d29yZHM6IEtFWVdPUkRTLFxuICAgICAgICAgICAgICAgICAgICBjb250YWluczogUEFSQU1TX0NPTlRBSU5TXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IC8vIEU0WCAvIEpTWFxuICAgICAgICAgICAgYmVnaW46IC88LywgZW5kOiAvKFxcL1xcdyt8XFx3K1xcLyk+LyxcbiAgICAgICAgICAgIHN1Ykxhbmd1YWdlOiAneG1sJyxcbiAgICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAgIHtiZWdpbjogLzxcXHcrXFxzKlxcLz4vLCBza2lwOiB0cnVlfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJlZ2luOiAvPFxcdysvLCBlbmQ6IC8oXFwvXFx3K3xcXHcrXFwvKT4vLCBza2lwOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAgICAgICB7YmVnaW46IC88XFx3K1xccypcXC8+Lywgc2tpcDogdHJ1ZX0sXG4gICAgICAgICAgICAgICAgICAnc2VsZidcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnZnVuY3Rpb24nLFxuICAgICAgICBiZWdpbktleXdvcmRzOiAnZnVuY3Rpb24nLCBlbmQ6IC9cXHsvLCBleGNsdWRlRW5kOiB0cnVlLFxuICAgICAgICBjb250YWluczogW1xuICAgICAgICAgIGhsanMuaW5oZXJpdChobGpzLlRJVExFX01PREUsIHtiZWdpbjogSURFTlRfUkV9KSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjbGFzc05hbWU6ICdwYXJhbXMnLFxuICAgICAgICAgICAgYmVnaW46IC9cXCgvLCBlbmQ6IC9cXCkvLFxuICAgICAgICAgICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgICAgICAgICAgZXhjbHVkZUVuZDogdHJ1ZSxcbiAgICAgICAgICAgIGNvbnRhaW5zOiBQQVJBTVNfQ09OVEFJTlNcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIGlsbGVnYWw6IC9cXFt8JS9cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAvXFwkWyguXS8gLy8gcmVsZXZhbmNlIGJvb3N0ZXIgZm9yIGEgcGF0dGVybiBjb21tb24gdG8gSlMgbGliczogYCQoc29tZXRoaW5nKWAgYW5kIGAkLnNvbWV0aGluZ2BcbiAgICAgIH0sXG4gICAgICBobGpzLk1FVEhPRF9HVUFSRCxcbiAgICAgIHsgLy8gRVM2IGNsYXNzXG4gICAgICAgIGNsYXNzTmFtZTogJ2NsYXNzJyxcbiAgICAgICAgYmVnaW5LZXl3b3JkczogJ2NsYXNzJywgZW5kOiAvW3s7PV0vLCBleGNsdWRlRW5kOiB0cnVlLFxuICAgICAgICBpbGxlZ2FsOiAvWzpcIlxcW1xcXV0vLFxuICAgICAgICBjb250YWluczogW1xuICAgICAgICAgIHtiZWdpbktleXdvcmRzOiAnZXh0ZW5kcyd9LFxuICAgICAgICAgIGhsanMuVU5ERVJTQ09SRV9USVRMRV9NT0RFXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGJlZ2luS2V5d29yZHM6ICdjb25zdHJ1Y3RvcicsIGVuZDogL1xcey8sIGV4Y2x1ZGVFbmQ6IHRydWVcbiAgICAgIH1cbiAgICBdLFxuICAgIGlsbGVnYWw6IC8jKD8hISkvXG4gIH07XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaGxqcykge1xuICByZXR1cm4ge1xuICAgIGFsaWFzZXM6IFsnY29uc29sZSddLFxuICAgIGNvbnRhaW5zOiBbXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ21ldGEnLFxuICAgICAgICBiZWdpbjogJ15cXFxcc3swLDN9W1xcXFx3XFxcXGRcXFxcW1xcXFxdKClALV0qWz4lJCNdJyxcbiAgICAgICAgc3RhcnRzOiB7XG4gICAgICAgICAgZW5kOiAnJCcsIHN1Ykxhbmd1YWdlOiAnYmFzaCdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICBdXG4gIH1cbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihobGpzKSB7XG4gIHZhciBYTUxfSURFTlRfUkUgPSAnW0EtWmEtejAtOVxcXFwuXzotXSsnO1xuICB2YXIgVEFHX0lOVEVSTkFMUyA9IHtcbiAgICBlbmRzV2l0aFBhcmVudDogdHJ1ZSxcbiAgICBpbGxlZ2FsOiAvPC8sXG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIGNvbnRhaW5zOiBbXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ2F0dHInLFxuICAgICAgICBiZWdpbjogWE1MX0lERU5UX1JFLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAvPVxccyovLFxuICAgICAgICByZWxldmFuY2U6IDAsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVuZHNQYXJlbnQ6IHRydWUsXG4gICAgICAgICAgICB2YXJpYW50czogW1xuICAgICAgICAgICAgICB7YmVnaW46IC9cIi8sIGVuZDogL1wiL30sXG4gICAgICAgICAgICAgIHtiZWdpbjogLycvLCBlbmQ6IC8nL30sXG4gICAgICAgICAgICAgIHtiZWdpbjogL1teXFxzXCInPTw+YF0rL31cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICBdXG4gIH07XG4gIHJldHVybiB7XG4gICAgYWxpYXNlczogWydodG1sJywgJ3hodG1sJywgJ3JzcycsICdhdG9tJywgJ3hqYicsICd4c2QnLCAneHNsJywgJ3BsaXN0J10sXG4gICAgY2FzZV9pbnNlbnNpdGl2ZTogdHJ1ZSxcbiAgICBjb250YWluczogW1xuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdtZXRhJyxcbiAgICAgICAgYmVnaW46ICc8IURPQ1RZUEUnLCBlbmQ6ICc+JyxcbiAgICAgICAgcmVsZXZhbmNlOiAxMCxcbiAgICAgICAgY29udGFpbnM6IFt7YmVnaW46ICdcXFxcWycsIGVuZDogJ1xcXFxdJ31dXG4gICAgICB9LFxuICAgICAgaGxqcy5DT01NRU5UKFxuICAgICAgICAnPCEtLScsXG4gICAgICAgICctLT4nLFxuICAgICAgICB7XG4gICAgICAgICAgcmVsZXZhbmNlOiAxMFxuICAgICAgICB9XG4gICAgICApLFxuICAgICAge1xuICAgICAgICBiZWdpbjogJzxcXFxcIVxcXFxbQ0RBVEFcXFxcWycsIGVuZDogJ1xcXFxdXFxcXF0+JyxcbiAgICAgICAgcmVsZXZhbmNlOiAxMFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC88XFw/KHBocCk/LywgZW5kOiAvXFw/Pi8sXG4gICAgICAgIHN1Ykxhbmd1YWdlOiAncGhwJyxcbiAgICAgICAgY29udGFpbnM6IFt7YmVnaW46ICcvXFxcXConLCBlbmQ6ICdcXFxcKi8nLCBza2lwOiB0cnVlfV1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3RhZycsXG4gICAgICAgIC8qXG4gICAgICAgIFRoZSBsb29rYWhlYWQgcGF0dGVybiAoPz0uLi4pIGVuc3VyZXMgdGhhdCAnYmVnaW4nIG9ubHkgbWF0Y2hlc1xuICAgICAgICAnPHN0eWxlJyBhcyBhIHNpbmdsZSB3b3JkLCBmb2xsb3dlZCBieSBhIHdoaXRlc3BhY2Ugb3IgYW5cbiAgICAgICAgZW5kaW5nIGJyYWtldC4gVGhlICckJyBpcyBuZWVkZWQgZm9yIHRoZSBsZXhlbWUgdG8gYmUgcmVjb2duaXplZFxuICAgICAgICBieSBobGpzLnN1Yk1vZGUoKSB0aGF0IHRlc3RzIGxleGVtZXMgb3V0c2lkZSB0aGUgc3RyZWFtLlxuICAgICAgICAqL1xuICAgICAgICBiZWdpbjogJzxzdHlsZSg/PVxcXFxzfD58JCknLCBlbmQ6ICc+JyxcbiAgICAgICAga2V5d29yZHM6IHtuYW1lOiAnc3R5bGUnfSxcbiAgICAgICAgY29udGFpbnM6IFtUQUdfSU5URVJOQUxTXSxcbiAgICAgICAgc3RhcnRzOiB7XG4gICAgICAgICAgZW5kOiAnPC9zdHlsZT4nLCByZXR1cm5FbmQ6IHRydWUsXG4gICAgICAgICAgc3ViTGFuZ3VhZ2U6IFsnY3NzJywgJ3htbCddXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3RhZycsXG4gICAgICAgIC8vIFNlZSB0aGUgY29tbWVudCBpbiB0aGUgPHN0eWxlIHRhZyBhYm91dCB0aGUgbG9va2FoZWFkIHBhdHRlcm5cbiAgICAgICAgYmVnaW46ICc8c2NyaXB0KD89XFxcXHN8PnwkKScsIGVuZDogJz4nLFxuICAgICAgICBrZXl3b3Jkczoge25hbWU6ICdzY3JpcHQnfSxcbiAgICAgICAgY29udGFpbnM6IFtUQUdfSU5URVJOQUxTXSxcbiAgICAgICAgc3RhcnRzOiB7XG4gICAgICAgICAgZW5kOiAnXFw8XFwvc2NyaXB0XFw+JywgcmV0dXJuRW5kOiB0cnVlLFxuICAgICAgICAgIHN1Ykxhbmd1YWdlOiBbJ2FjdGlvbnNjcmlwdCcsICdqYXZhc2NyaXB0JywgJ2hhbmRsZWJhcnMnLCAneG1sJ11cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnbWV0YScsXG4gICAgICAgIHZhcmlhbnRzOiBbXG4gICAgICAgICAge2JlZ2luOiAvPFxcP3htbC8sIGVuZDogL1xcPz4vLCByZWxldmFuY2U6IDEwfSxcbiAgICAgICAgICB7YmVnaW46IC88XFw/XFx3Ky8sIGVuZDogL1xcPz4vfVxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICd0YWcnLFxuICAgICAgICBiZWdpbjogJzwvPycsIGVuZDogJy8/PicsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnbmFtZScsIGJlZ2luOiAvW15cXC8+PFxcc10rLywgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBUQUdfSU5URVJOQUxTXG4gICAgICAgIF1cbiAgICAgIH1cbiAgICBdXG4gIH07XG59OyIsIi8qIVxuICogcmV2ZWFsLmpzXG4gKiBodHRwOi8vbGFiLmhha2ltLnNlL3JldmVhbC1qc1xuICogTUlUIGxpY2Vuc2VkXG4gKlxuICogQ29weXJpZ2h0IChDKSAyMDE3IEhha2ltIEVsIEhhdHRhYiwgaHR0cDovL2hha2ltLnNlXG4gKi9cbihmdW5jdGlvbiggcm9vdCwgZmFjdG9yeSApIHtcblx0aWYoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcblx0XHQvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG5cdFx0ZGVmaW5lKCBmdW5jdGlvbigpIHtcblx0XHRcdHJvb3QuUmV2ZWFsID0gZmFjdG9yeSgpO1xuXHRcdFx0cmV0dXJuIHJvb3QuUmV2ZWFsO1xuXHRcdH0gKTtcblx0fSBlbHNlIGlmKCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgKSB7XG5cdFx0Ly8gTm9kZS4gRG9lcyBub3Qgd29yayB3aXRoIHN0cmljdCBDb21tb25KUy5cblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0fSBlbHNlIHtcblx0XHQvLyBCcm93c2VyIGdsb2JhbHMuXG5cdFx0cm9vdC5SZXZlYWwgPSBmYWN0b3J5KCk7XG5cdH1cbn0oIHRoaXMsIGZ1bmN0aW9uKCkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgUmV2ZWFsO1xuXG5cdC8vIFRoZSByZXZlYWwuanMgdmVyc2lvblxuXHR2YXIgVkVSU0lPTiA9ICczLjUuMCc7XG5cblx0dmFyIFNMSURFU19TRUxFQ1RPUiA9ICcuc2xpZGVzIHNlY3Rpb24nLFxuXHRcdEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SID0gJy5zbGlkZXM+c2VjdGlvbicsXG5cdFx0VkVSVElDQUxfU0xJREVTX1NFTEVDVE9SID0gJy5zbGlkZXM+c2VjdGlvbi5wcmVzZW50PnNlY3Rpb24nLFxuXHRcdEhPTUVfU0xJREVfU0VMRUNUT1IgPSAnLnNsaWRlcz5zZWN0aW9uOmZpcnN0LW9mLXR5cGUnLFxuXHRcdFVBID0gbmF2aWdhdG9yLnVzZXJBZ2VudCxcblxuXHRcdC8vIENvbmZpZ3VyYXRpb24gZGVmYXVsdHMsIGNhbiBiZSBvdmVycmlkZGVuIGF0IGluaXRpYWxpemF0aW9uIHRpbWVcblx0XHRjb25maWcgPSB7XG5cblx0XHRcdC8vIFRoZSBcIm5vcm1hbFwiIHNpemUgb2YgdGhlIHByZXNlbnRhdGlvbiwgYXNwZWN0IHJhdGlvIHdpbGwgYmUgcHJlc2VydmVkXG5cdFx0XHQvLyB3aGVuIHRoZSBwcmVzZW50YXRpb24gaXMgc2NhbGVkIHRvIGZpdCBkaWZmZXJlbnQgcmVzb2x1dGlvbnNcblx0XHRcdHdpZHRoOiA5NjAsXG5cdFx0XHRoZWlnaHQ6IDcwMCxcblxuXHRcdFx0Ly8gRmFjdG9yIG9mIHRoZSBkaXNwbGF5IHNpemUgdGhhdCBzaG91bGQgcmVtYWluIGVtcHR5IGFyb3VuZCB0aGUgY29udGVudFxuXHRcdFx0bWFyZ2luOiAwLjA0LFxuXG5cdFx0XHQvLyBCb3VuZHMgZm9yIHNtYWxsZXN0L2xhcmdlc3QgcG9zc2libGUgc2NhbGUgdG8gYXBwbHkgdG8gY29udGVudFxuXHRcdFx0bWluU2NhbGU6IDAuMixcblx0XHRcdG1heFNjYWxlOiAyLjAsXG5cblx0XHRcdC8vIERpc3BsYXkgY29udHJvbHMgaW4gdGhlIGJvdHRvbSByaWdodCBjb3JuZXJcblx0XHRcdGNvbnRyb2xzOiB0cnVlLFxuXG5cdFx0XHQvLyBEaXNwbGF5IGEgcHJlc2VudGF0aW9uIHByb2dyZXNzIGJhclxuXHRcdFx0cHJvZ3Jlc3M6IHRydWUsXG5cblx0XHRcdC8vIERpc3BsYXkgdGhlIHBhZ2UgbnVtYmVyIG9mIHRoZSBjdXJyZW50IHNsaWRlXG5cdFx0XHRzbGlkZU51bWJlcjogZmFsc2UsXG5cblx0XHRcdC8vIERldGVybWluZSB3aGljaCBkaXNwbGF5cyB0byBzaG93IHRoZSBzbGlkZSBudW1iZXIgb25cblx0XHRcdHNob3dTbGlkZU51bWJlcjogJ2FsbCcsXG5cblx0XHRcdC8vIFB1c2ggZWFjaCBzbGlkZSBjaGFuZ2UgdG8gdGhlIGJyb3dzZXIgaGlzdG9yeVxuXHRcdFx0aGlzdG9yeTogZmFsc2UsXG5cblx0XHRcdC8vIEVuYWJsZSBrZXlib2FyZCBzaG9ydGN1dHMgZm9yIG5hdmlnYXRpb25cblx0XHRcdGtleWJvYXJkOiB0cnVlLFxuXG5cdFx0XHQvLyBPcHRpb25hbCBmdW5jdGlvbiB0aGF0IGJsb2NrcyBrZXlib2FyZCBldmVudHMgd2hlbiByZXR1bmluZyBmYWxzZVxuXHRcdFx0a2V5Ym9hcmRDb25kaXRpb246IG51bGwsXG5cblx0XHRcdC8vIEVuYWJsZSB0aGUgc2xpZGUgb3ZlcnZpZXcgbW9kZVxuXHRcdFx0b3ZlcnZpZXc6IHRydWUsXG5cblx0XHRcdC8vIFZlcnRpY2FsIGNlbnRlcmluZyBvZiBzbGlkZXNcblx0XHRcdGNlbnRlcjogdHJ1ZSxcblxuXHRcdFx0Ly8gRW5hYmxlcyB0b3VjaCBuYXZpZ2F0aW9uIG9uIGRldmljZXMgd2l0aCB0b3VjaCBpbnB1dFxuXHRcdFx0dG91Y2g6IHRydWUsXG5cblx0XHRcdC8vIExvb3AgdGhlIHByZXNlbnRhdGlvblxuXHRcdFx0bG9vcDogZmFsc2UsXG5cblx0XHRcdC8vIENoYW5nZSB0aGUgcHJlc2VudGF0aW9uIGRpcmVjdGlvbiB0byBiZSBSVExcblx0XHRcdHJ0bDogZmFsc2UsXG5cblx0XHRcdC8vIFJhbmRvbWl6ZXMgdGhlIG9yZGVyIG9mIHNsaWRlcyBlYWNoIHRpbWUgdGhlIHByZXNlbnRhdGlvbiBsb2Fkc1xuXHRcdFx0c2h1ZmZsZTogZmFsc2UsXG5cblx0XHRcdC8vIFR1cm5zIGZyYWdtZW50cyBvbiBhbmQgb2ZmIGdsb2JhbGx5XG5cdFx0XHRmcmFnbWVudHM6IHRydWUsXG5cblx0XHRcdC8vIEZsYWdzIGlmIHRoZSBwcmVzZW50YXRpb24gaXMgcnVubmluZyBpbiBhbiBlbWJlZGRlZCBtb2RlLFxuXHRcdFx0Ly8gaS5lLiBjb250YWluZWQgd2l0aGluIGEgbGltaXRlZCBwb3J0aW9uIG9mIHRoZSBzY3JlZW5cblx0XHRcdGVtYmVkZGVkOiBmYWxzZSxcblxuXHRcdFx0Ly8gRmxhZ3MgaWYgd2Ugc2hvdWxkIHNob3cgYSBoZWxwIG92ZXJsYXkgd2hlbiB0aGUgcXVlc3Rpb24tbWFya1xuXHRcdFx0Ly8ga2V5IGlzIHByZXNzZWRcblx0XHRcdGhlbHA6IHRydWUsXG5cblx0XHRcdC8vIEZsYWdzIGlmIGl0IHNob3VsZCBiZSBwb3NzaWJsZSB0byBwYXVzZSB0aGUgcHJlc2VudGF0aW9uIChibGFja291dClcblx0XHRcdHBhdXNlOiB0cnVlLFxuXG5cdFx0XHQvLyBGbGFncyBpZiBzcGVha2VyIG5vdGVzIHNob3VsZCBiZSB2aXNpYmxlIHRvIGFsbCB2aWV3ZXJzXG5cdFx0XHRzaG93Tm90ZXM6IGZhbHNlLFxuXG5cdFx0XHQvLyBHbG9iYWwgb3ZlcnJpZGUgZm9yIGF1dG9sYXlpbmcgZW1iZWRkZWQgbWVkaWEgKHZpZGVvL2F1ZGlvL2lmcmFtZSlcblx0XHRcdC8vIC0gbnVsbDogTWVkaWEgd2lsbCBvbmx5IGF1dG9wbGF5IGlmIGRhdGEtYXV0b3BsYXkgaXMgcHJlc2VudFxuXHRcdFx0Ly8gLSB0cnVlOiBBbGwgbWVkaWEgd2lsbCBhdXRvcGxheSwgcmVnYXJkbGVzcyBvZiBpbmRpdmlkdWFsIHNldHRpbmdcblx0XHRcdC8vIC0gZmFsc2U6IE5vIG1lZGlhIHdpbGwgYXV0b3BsYXksIHJlZ2FyZGxlc3Mgb2YgaW5kaXZpZHVhbCBzZXR0aW5nXG5cdFx0XHRhdXRvUGxheU1lZGlhOiBudWxsLFxuXG5cdFx0XHQvLyBOdW1iZXIgb2YgbWlsbGlzZWNvbmRzIGJldHdlZW4gYXV0b21hdGljYWxseSBwcm9jZWVkaW5nIHRvIHRoZVxuXHRcdFx0Ly8gbmV4dCBzbGlkZSwgZGlzYWJsZWQgd2hlbiBzZXQgdG8gMCwgdGhpcyB2YWx1ZSBjYW4gYmUgb3ZlcndyaXR0ZW5cblx0XHRcdC8vIGJ5IHVzaW5nIGEgZGF0YS1hdXRvc2xpZGUgYXR0cmlidXRlIG9uIHlvdXIgc2xpZGVzXG5cdFx0XHRhdXRvU2xpZGU6IDAsXG5cblx0XHRcdC8vIFN0b3AgYXV0by1zbGlkaW5nIGFmdGVyIHVzZXIgaW5wdXRcblx0XHRcdGF1dG9TbGlkZVN0b3BwYWJsZTogdHJ1ZSxcblxuXHRcdFx0Ly8gVXNlIHRoaXMgbWV0aG9kIGZvciBuYXZpZ2F0aW9uIHdoZW4gYXV0by1zbGlkaW5nIChkZWZhdWx0cyB0byBuYXZpZ2F0ZU5leHQpXG5cdFx0XHRhdXRvU2xpZGVNZXRob2Q6IG51bGwsXG5cblx0XHRcdC8vIEVuYWJsZSBzbGlkZSBuYXZpZ2F0aW9uIHZpYSBtb3VzZSB3aGVlbFxuXHRcdFx0bW91c2VXaGVlbDogZmFsc2UsXG5cblx0XHRcdC8vIEFwcGx5IGEgM0Qgcm9sbCB0byBsaW5rcyBvbiBob3ZlclxuXHRcdFx0cm9sbGluZ0xpbmtzOiBmYWxzZSxcblxuXHRcdFx0Ly8gSGlkZXMgdGhlIGFkZHJlc3MgYmFyIG9uIG1vYmlsZSBkZXZpY2VzXG5cdFx0XHRoaWRlQWRkcmVzc0JhcjogdHJ1ZSxcblxuXHRcdFx0Ly8gT3BlbnMgbGlua3MgaW4gYW4gaWZyYW1lIHByZXZpZXcgb3ZlcmxheVxuXHRcdFx0cHJldmlld0xpbmtzOiBmYWxzZSxcblxuXHRcdFx0Ly8gRXhwb3NlcyB0aGUgcmV2ZWFsLmpzIEFQSSB0aHJvdWdoIHdpbmRvdy5wb3N0TWVzc2FnZVxuXHRcdFx0cG9zdE1lc3NhZ2U6IHRydWUsXG5cblx0XHRcdC8vIERpc3BhdGNoZXMgYWxsIHJldmVhbC5qcyBldmVudHMgdG8gdGhlIHBhcmVudCB3aW5kb3cgdGhyb3VnaCBwb3N0TWVzc2FnZVxuXHRcdFx0cG9zdE1lc3NhZ2VFdmVudHM6IGZhbHNlLFxuXG5cdFx0XHQvLyBGb2N1c2VzIGJvZHkgd2hlbiBwYWdlIGNoYW5nZXMgdmlzaWJpbGl0eSB0byBlbnN1cmUga2V5Ym9hcmQgc2hvcnRjdXRzIHdvcmtcblx0XHRcdGZvY3VzQm9keU9uUGFnZVZpc2liaWxpdHlDaGFuZ2U6IHRydWUsXG5cblx0XHRcdC8vIFRyYW5zaXRpb24gc3R5bGVcblx0XHRcdHRyYW5zaXRpb246ICdzbGlkZScsIC8vIG5vbmUvZmFkZS9zbGlkZS9jb252ZXgvY29uY2F2ZS96b29tXG5cblx0XHRcdC8vIFRyYW5zaXRpb24gc3BlZWRcblx0XHRcdHRyYW5zaXRpb25TcGVlZDogJ2RlZmF1bHQnLCAvLyBkZWZhdWx0L2Zhc3Qvc2xvd1xuXG5cdFx0XHQvLyBUcmFuc2l0aW9uIHN0eWxlIGZvciBmdWxsIHBhZ2Ugc2xpZGUgYmFja2dyb3VuZHNcblx0XHRcdGJhY2tncm91bmRUcmFuc2l0aW9uOiAnZmFkZScsIC8vIG5vbmUvZmFkZS9zbGlkZS9jb252ZXgvY29uY2F2ZS96b29tXG5cblx0XHRcdC8vIFBhcmFsbGF4IGJhY2tncm91bmQgaW1hZ2Vcblx0XHRcdHBhcmFsbGF4QmFja2dyb3VuZEltYWdlOiAnJywgLy8gQ1NTIHN5bnRheCwgZS5nLiBcImEuanBnXCJcblxuXHRcdFx0Ly8gUGFyYWxsYXggYmFja2dyb3VuZCBzaXplXG5cdFx0XHRwYXJhbGxheEJhY2tncm91bmRTaXplOiAnJywgLy8gQ1NTIHN5bnRheCwgZS5nLiBcIjMwMDBweCAyMDAwcHhcIlxuXG5cdFx0XHQvLyBBbW91bnQgb2YgcGl4ZWxzIHRvIG1vdmUgdGhlIHBhcmFsbGF4IGJhY2tncm91bmQgcGVyIHNsaWRlIHN0ZXBcblx0XHRcdHBhcmFsbGF4QmFja2dyb3VuZEhvcml6b250YWw6IG51bGwsXG5cdFx0XHRwYXJhbGxheEJhY2tncm91bmRWZXJ0aWNhbDogbnVsbCxcblxuXHRcdFx0Ly8gVGhlIG1heGltdW0gbnVtYmVyIG9mIHBhZ2VzIGEgc2luZ2xlIHNsaWRlIGNhbiBleHBhbmQgb250byB3aGVuIHByaW50aW5nXG5cdFx0XHQvLyB0byBQREYsIHVubGltaXRlZCBieSBkZWZhdWx0XG5cdFx0XHRwZGZNYXhQYWdlc1BlclNsaWRlOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG5cblx0XHRcdC8vIE9mZnNldCB1c2VkIHRvIHJlZHVjZSB0aGUgaGVpZ2h0IG9mIGNvbnRlbnQgd2l0aGluIGV4cG9ydGVkIFBERiBwYWdlcy5cblx0XHRcdC8vIFRoaXMgZXhpc3RzIHRvIGFjY291bnQgZm9yIGVudmlyb25tZW50IGRpZmZlcmVuY2VzIGJhc2VkIG9uIGhvdyB5b3Vcblx0XHRcdC8vIHByaW50IHRvIFBERi4gQ0xJIHByaW50aW5nIG9wdGlvbnMsIGxpa2UgcGhhbnRvbWpzIGFuZCB3a3BkZiwgY2FuIGVuZFxuXHRcdFx0Ly8gb24gcHJlY2lzZWx5IHRoZSB0b3RhbCBoZWlnaHQgb2YgdGhlIGRvY3VtZW50IHdoZXJlYXMgaW4tYnJvd3NlclxuXHRcdFx0Ly8gcHJpbnRpbmcgaGFzIHRvIGVuZCBvbmUgcGl4ZWwgYmVmb3JlLlxuXHRcdFx0cGRmUGFnZUhlaWdodE9mZnNldDogLTEsXG5cblx0XHRcdC8vIE51bWJlciBvZiBzbGlkZXMgYXdheSBmcm9tIHRoZSBjdXJyZW50IHRoYXQgYXJlIHZpc2libGVcblx0XHRcdHZpZXdEaXN0YW5jZTogMyxcblxuXHRcdFx0Ly8gVGhlIGRpc3BsYXkgbW9kZSB0aGF0IHdpbGwgYmUgdXNlZCB0byBzaG93IHNsaWRlc1xuXHRcdFx0ZGlzcGxheTogJ2Jsb2NrJyxcblxuXHRcdFx0Ly8gU2NyaXB0IGRlcGVuZGVuY2llcyB0byBsb2FkXG5cdFx0XHRkZXBlbmRlbmNpZXM6IFtdXG5cblx0XHR9LFxuXG5cdFx0Ly8gRmxhZ3MgaWYgUmV2ZWFsLmluaXRpYWxpemUoKSBoYXMgYmVlbiBjYWxsZWRcblx0XHRpbml0aWFsaXplZCA9IGZhbHNlLFxuXG5cdFx0Ly8gRmxhZ3MgaWYgcmV2ZWFsLmpzIGlzIGxvYWRlZCAoaGFzIGRpc3BhdGNoZWQgdGhlICdyZWFkeScgZXZlbnQpXG5cdFx0bG9hZGVkID0gZmFsc2UsXG5cblx0XHQvLyBGbGFncyBpZiB0aGUgb3ZlcnZpZXcgbW9kZSBpcyBjdXJyZW50bHkgYWN0aXZlXG5cdFx0b3ZlcnZpZXcgPSBmYWxzZSxcblxuXHRcdC8vIEhvbGRzIHRoZSBkaW1lbnNpb25zIG9mIG91ciBvdmVydmlldyBzbGlkZXMsIGluY2x1ZGluZyBtYXJnaW5zXG5cdFx0b3ZlcnZpZXdTbGlkZVdpZHRoID0gbnVsbCxcblx0XHRvdmVydmlld1NsaWRlSGVpZ2h0ID0gbnVsbCxcblxuXHRcdC8vIFRoZSBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBpbmRleCBvZiB0aGUgY3VycmVudGx5IGFjdGl2ZSBzbGlkZVxuXHRcdGluZGV4aCxcblx0XHRpbmRleHYsXG5cblx0XHQvLyBUaGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgc2xpZGUgSFRNTCBlbGVtZW50c1xuXHRcdHByZXZpb3VzU2xpZGUsXG5cdFx0Y3VycmVudFNsaWRlLFxuXG5cdFx0cHJldmlvdXNCYWNrZ3JvdW5kLFxuXG5cdFx0Ly8gU2xpZGVzIG1heSBob2xkIGEgZGF0YS1zdGF0ZSBhdHRyaWJ1dGUgd2hpY2ggd2UgcGljayB1cCBhbmQgYXBwbHlcblx0XHQvLyBhcyBhIGNsYXNzIHRvIHRoZSBib2R5LiBUaGlzIGxpc3QgY29udGFpbnMgdGhlIGNvbWJpbmVkIHN0YXRlIG9mXG5cdFx0Ly8gYWxsIGN1cnJlbnQgc2xpZGVzLlxuXHRcdHN0YXRlID0gW10sXG5cblx0XHQvLyBUaGUgY3VycmVudCBzY2FsZSBvZiB0aGUgcHJlc2VudGF0aW9uIChzZWUgd2lkdGgvaGVpZ2h0IGNvbmZpZylcblx0XHRzY2FsZSA9IDEsXG5cblx0XHQvLyBDU1MgdHJhbnNmb3JtIHRoYXQgaXMgY3VycmVudGx5IGFwcGxpZWQgdG8gdGhlIHNsaWRlcyBjb250YWluZXIsXG5cdFx0Ly8gc3BsaXQgaW50byB0d28gZ3JvdXBzXG5cdFx0c2xpZGVzVHJhbnNmb3JtID0geyBsYXlvdXQ6ICcnLCBvdmVydmlldzogJycgfSxcblxuXHRcdC8vIENhY2hlZCByZWZlcmVuY2VzIHRvIERPTSBlbGVtZW50c1xuXHRcdGRvbSA9IHt9LFxuXG5cdFx0Ly8gRmVhdHVyZXMgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyLCBzZWUgI2NoZWNrQ2FwYWJpbGl0aWVzKClcblx0XHRmZWF0dXJlcyA9IHt9LFxuXG5cdFx0Ly8gQ2xpZW50IGlzIGEgbW9iaWxlIGRldmljZSwgc2VlICNjaGVja0NhcGFiaWxpdGllcygpXG5cdFx0aXNNb2JpbGVEZXZpY2UsXG5cblx0XHQvLyBDbGllbnQgaXMgYSBkZXNrdG9wIENocm9tZSwgc2VlICNjaGVja0NhcGFiaWxpdGllcygpXG5cdFx0aXNDaHJvbWUsXG5cblx0XHQvLyBUaHJvdHRsZXMgbW91c2Ugd2hlZWwgbmF2aWdhdGlvblxuXHRcdGxhc3RNb3VzZVdoZWVsU3RlcCA9IDAsXG5cblx0XHQvLyBEZWxheXMgdXBkYXRlcyB0byB0aGUgVVJMIGR1ZSB0byBhIENocm9tZSB0aHVtYm5haWxlciBidWdcblx0XHR3cml0ZVVSTFRpbWVvdXQgPSAwLFxuXG5cdFx0Ly8gRmxhZ3MgaWYgdGhlIGludGVyYWN0aW9uIGV2ZW50IGxpc3RlbmVycyBhcmUgYm91bmRcblx0XHRldmVudHNBcmVCb3VuZCA9IGZhbHNlLFxuXG5cdFx0Ly8gVGhlIGN1cnJlbnQgYXV0by1zbGlkZSBkdXJhdGlvblxuXHRcdGF1dG9TbGlkZSA9IDAsXG5cblx0XHQvLyBBdXRvIHNsaWRlIHByb3BlcnRpZXNcblx0XHRhdXRvU2xpZGVQbGF5ZXIsXG5cdFx0YXV0b1NsaWRlVGltZW91dCA9IDAsXG5cdFx0YXV0b1NsaWRlU3RhcnRUaW1lID0gLTEsXG5cdFx0YXV0b1NsaWRlUGF1c2VkID0gZmFsc2UsXG5cblx0XHQvLyBIb2xkcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudGx5IG9uZ29pbmcgdG91Y2ggaW5wdXRcblx0XHR0b3VjaCA9IHtcblx0XHRcdHN0YXJ0WDogMCxcblx0XHRcdHN0YXJ0WTogMCxcblx0XHRcdHN0YXJ0U3BhbjogMCxcblx0XHRcdHN0YXJ0Q291bnQ6IDAsXG5cdFx0XHRjYXB0dXJlZDogZmFsc2UsXG5cdFx0XHR0aHJlc2hvbGQ6IDQwXG5cdFx0fSxcblxuXHRcdC8vIEhvbGRzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBrZXlib2FyZCBzaG9ydGN1dHNcblx0XHRrZXlib2FyZFNob3J0Y3V0cyA9IHtcblx0XHRcdCdOICAsICBTUEFDRSc6XHRcdFx0J05leHQgc2xpZGUnLFxuXHRcdFx0J1AnOlx0XHRcdFx0XHQnUHJldmlvdXMgc2xpZGUnLFxuXHRcdFx0JyYjODU5MjsgICwgIEgnOlx0XHQnTmF2aWdhdGUgbGVmdCcsXG5cdFx0XHQnJiM4NTk0OyAgLCAgTCc6XHRcdCdOYXZpZ2F0ZSByaWdodCcsXG5cdFx0XHQnJiM4NTkzOyAgLCAgSyc6XHRcdCdOYXZpZ2F0ZSB1cCcsXG5cdFx0XHQnJiM4NTk1OyAgLCAgSic6XHRcdCdOYXZpZ2F0ZSBkb3duJyxcblx0XHRcdCdIb21lJzpcdFx0XHRcdFx0J0ZpcnN0IHNsaWRlJyxcblx0XHRcdCdFbmQnOlx0XHRcdFx0XHQnTGFzdCBzbGlkZScsXG5cdFx0XHQnQiAgLCAgLic6XHRcdFx0XHQnUGF1c2UnLFxuXHRcdFx0J0YnOlx0XHRcdFx0XHQnRnVsbHNjcmVlbicsXG5cdFx0XHQnRVNDLCBPJzpcdFx0XHRcdCdTbGlkZSBvdmVydmlldydcblx0XHR9O1xuXG5cdC8qKlxuXHQgKiBTdGFydHMgdXAgdGhlIHByZXNlbnRhdGlvbiBpZiB0aGUgY2xpZW50IGlzIGNhcGFibGUuXG5cdCAqL1xuXHRmdW5jdGlvbiBpbml0aWFsaXplKCBvcHRpb25zICkge1xuXG5cdFx0Ly8gTWFrZSBzdXJlIHdlIG9ubHkgaW5pdGlhbGl6ZSBvbmNlXG5cdFx0aWYoIGluaXRpYWxpemVkID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0aW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG5cdFx0Y2hlY2tDYXBhYmlsaXRpZXMoKTtcblxuXHRcdGlmKCAhZmVhdHVyZXMudHJhbnNmb3JtczJkICYmICFmZWF0dXJlcy50cmFuc2Zvcm1zM2QgKSB7XG5cdFx0XHRkb2N1bWVudC5ib2R5LnNldEF0dHJpYnV0ZSggJ2NsYXNzJywgJ25vLXRyYW5zZm9ybXMnICk7XG5cblx0XHRcdC8vIFNpbmNlIEpTIHdvbid0IGJlIHJ1bm5pbmcgYW55IGZ1cnRoZXIsIHdlIGxvYWQgYWxsIGxhenlcblx0XHRcdC8vIGxvYWRpbmcgZWxlbWVudHMgdXBmcm9udFxuXHRcdFx0dmFyIGltYWdlcyA9IHRvQXJyYXkoIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCAnaW1nJyApICksXG5cdFx0XHRcdGlmcmFtZXMgPSB0b0FycmF5KCBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSggJ2lmcmFtZScgKSApO1xuXG5cdFx0XHR2YXIgbGF6eUxvYWRhYmxlID0gaW1hZ2VzLmNvbmNhdCggaWZyYW1lcyApO1xuXG5cdFx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gbGF6eUxvYWRhYmxlLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0XHR2YXIgZWxlbWVudCA9IGxhenlMb2FkYWJsZVtpXTtcblx0XHRcdFx0aWYoIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1zcmMnICkgKSB7XG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUoICdzcmMnLCBlbGVtZW50LmdldEF0dHJpYnV0ZSggJ2RhdGEtc3JjJyApICk7XG5cdFx0XHRcdFx0ZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoICdkYXRhLXNyYycgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBvcnQgY29yZSBmZWF0dXJlcyB3ZSB3b24ndCBiZVxuXHRcdFx0Ly8gdXNpbmcgSmF2YVNjcmlwdCB0byBjb250cm9sIHRoZSBwcmVzZW50YXRpb25cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBDYWNoZSByZWZlcmVuY2VzIHRvIGtleSBET00gZWxlbWVudHNcblx0XHRkb20ud3JhcHBlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoICcucmV2ZWFsJyApO1xuXHRcdGRvbS5zbGlkZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCAnLnJldmVhbCAuc2xpZGVzJyApO1xuXG5cdFx0Ly8gRm9yY2UgYSBsYXlvdXQgd2hlbiB0aGUgd2hvbGUgcGFnZSwgaW5jbCBmb250cywgaGFzIGxvYWRlZFxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIGxheW91dCwgZmFsc2UgKTtcblxuXHRcdHZhciBxdWVyeSA9IFJldmVhbC5nZXRRdWVyeUhhc2goKTtcblxuXHRcdC8vIERvIG5vdCBhY2NlcHQgbmV3IGRlcGVuZGVuY2llcyB2aWEgcXVlcnkgY29uZmlnIHRvIGF2b2lkXG5cdFx0Ly8gdGhlIHBvdGVudGlhbCBvZiBtYWxpY2lvdXMgc2NyaXB0IGluamVjdGlvblxuXHRcdGlmKCB0eXBlb2YgcXVlcnlbJ2RlcGVuZGVuY2llcyddICE9PSAndW5kZWZpbmVkJyApIGRlbGV0ZSBxdWVyeVsnZGVwZW5kZW5jaWVzJ107XG5cblx0XHQvLyBDb3B5IG9wdGlvbnMgb3ZlciB0byBvdXIgY29uZmlnIG9iamVjdFxuXHRcdGV4dGVuZCggY29uZmlnLCBvcHRpb25zICk7XG5cdFx0ZXh0ZW5kKCBjb25maWcsIHF1ZXJ5ICk7XG5cblx0XHQvLyBIaWRlIHRoZSBhZGRyZXNzIGJhciBpbiBtb2JpbGUgYnJvd3NlcnNcblx0XHRoaWRlQWRkcmVzc0JhcigpO1xuXG5cdFx0Ly8gTG9hZHMgdGhlIGRlcGVuZGVuY2llcyBhbmQgY29udGludWVzIHRvICNzdGFydCgpIG9uY2UgZG9uZVxuXHRcdGxvYWQoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEluc3BlY3QgdGhlIGNsaWVudCB0byBzZWUgd2hhdCBpdCdzIGNhcGFibGUgb2YsIHRoaXNcblx0ICogc2hvdWxkIG9ubHkgaGFwcGVucyBvbmNlIHBlciBydW50aW1lLlxuXHQgKi9cblx0ZnVuY3Rpb24gY2hlY2tDYXBhYmlsaXRpZXMoKSB7XG5cblx0XHRpc01vYmlsZURldmljZSA9IC8oaXBob25lfGlwb2R8aXBhZHxhbmRyb2lkKS9naS50ZXN0KCBVQSApO1xuXHRcdGlzQ2hyb21lID0gL2Nocm9tZS9pLnRlc3QoIFVBICkgJiYgIS9lZGdlL2kudGVzdCggVUEgKTtcblxuXHRcdHZhciB0ZXN0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cblx0XHRmZWF0dXJlcy50cmFuc2Zvcm1zM2QgPSAnV2Via2l0UGVyc3BlY3RpdmUnIGluIHRlc3RFbGVtZW50LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J01velBlcnNwZWN0aXZlJyBpbiB0ZXN0RWxlbWVudC5zdHlsZSB8fFxuXHRcdFx0XHRcdFx0XHRcdCdtc1BlcnNwZWN0aXZlJyBpbiB0ZXN0RWxlbWVudC5zdHlsZSB8fFxuXHRcdFx0XHRcdFx0XHRcdCdPUGVyc3BlY3RpdmUnIGluIHRlc3RFbGVtZW50LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J3BlcnNwZWN0aXZlJyBpbiB0ZXN0RWxlbWVudC5zdHlsZTtcblxuXHRcdGZlYXR1cmVzLnRyYW5zZm9ybXMyZCA9ICdXZWJraXRUcmFuc2Zvcm0nIGluIHRlc3RFbGVtZW50LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J01velRyYW5zZm9ybScgaW4gdGVzdEVsZW1lbnQuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQnbXNUcmFuc2Zvcm0nIGluIHRlc3RFbGVtZW50LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J09UcmFuc2Zvcm0nIGluIHRlc3RFbGVtZW50LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J3RyYW5zZm9ybScgaW4gdGVzdEVsZW1lbnQuc3R5bGU7XG5cblx0XHRmZWF0dXJlcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVNZXRob2QgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZTtcblx0XHRmZWF0dXJlcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB0eXBlb2YgZmVhdHVyZXMucmVxdWVzdEFuaW1hdGlvbkZyYW1lTWV0aG9kID09PSAnZnVuY3Rpb24nO1xuXG5cdFx0ZmVhdHVyZXMuY2FudmFzID0gISFkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApLmdldENvbnRleHQ7XG5cblx0XHQvLyBUcmFuc2l0aW9ucyBpbiB0aGUgb3ZlcnZpZXcgYXJlIGRpc2FibGVkIGluIGRlc2t0b3AgYW5kXG5cdFx0Ly8gU2FmYXJpIGR1ZSB0byBsYWdcblx0XHRmZWF0dXJlcy5vdmVydmlld1RyYW5zaXRpb25zID0gIS9WZXJzaW9uXFwvW1xcZFxcLl0rLipTYWZhcmkvLnRlc3QoIFVBICk7XG5cblx0XHQvLyBGbGFncyBpZiB3ZSBzaG91bGQgdXNlIHpvb20gaW5zdGVhZCBvZiB0cmFuc2Zvcm0gdG8gc2NhbGVcblx0XHQvLyB1cCBzbGlkZXMuIFpvb20gcHJvZHVjZXMgY3Jpc3BlciByZXN1bHRzIGJ1dCBoYXMgYSBsb3Qgb2Zcblx0XHQvLyB4YnJvd3NlciBxdWlya3Mgc28gd2Ugb25seSB1c2UgaXQgaW4gd2hpdGVsc2l0ZWQgYnJvd3NlcnMuXG5cdFx0ZmVhdHVyZXMuem9vbSA9ICd6b29tJyBpbiB0ZXN0RWxlbWVudC5zdHlsZSAmJiAhaXNNb2JpbGVEZXZpY2UgJiZcblx0XHRcdFx0XHRcdCggaXNDaHJvbWUgfHwgL1ZlcnNpb25cXC9bXFxkXFwuXSsuKlNhZmFyaS8udGVzdCggVUEgKSApO1xuXG5cdH1cblxuICAgIC8qKlxuICAgICAqIExvYWRzIHRoZSBkZXBlbmRlbmNpZXMgb2YgcmV2ZWFsLmpzLiBEZXBlbmRlbmNpZXMgYXJlXG4gICAgICogZGVmaW5lZCB2aWEgdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9uICdkZXBlbmRlbmNpZXMnXG4gICAgICogYW5kIHdpbGwgYmUgbG9hZGVkIHByaW9yIHRvIHN0YXJ0aW5nL2JpbmRpbmcgcmV2ZWFsLmpzLlxuICAgICAqIFNvbWUgZGVwZW5kZW5jaWVzIG1heSBoYXZlIGFuICdhc3luYycgZmxhZywgaWYgc28gdGhleVxuICAgICAqIHdpbGwgbG9hZCBhZnRlciByZXZlYWwuanMgaGFzIGJlZW4gc3RhcnRlZCB1cC5cbiAgICAgKi9cblx0ZnVuY3Rpb24gbG9hZCgpIHtcblxuXHRcdHZhciBzY3JpcHRzID0gW10sXG5cdFx0XHRzY3JpcHRzQXN5bmMgPSBbXSxcblx0XHRcdHNjcmlwdHNUb1ByZWxvYWQgPSAwO1xuXG5cdFx0Ly8gQ2FsbGVkIG9uY2Ugc3luY2hyb25vdXMgc2NyaXB0cyBmaW5pc2ggbG9hZGluZ1xuXHRcdGZ1bmN0aW9uIHByb2NlZWQoKSB7XG5cdFx0XHRpZiggc2NyaXB0c0FzeW5jLmxlbmd0aCApIHtcblx0XHRcdFx0Ly8gTG9hZCBhc3luY2hyb25vdXMgc2NyaXB0c1xuXHRcdFx0XHRoZWFkLmpzLmFwcGx5KCBudWxsLCBzY3JpcHRzQXN5bmMgKTtcblx0XHRcdH1cblxuXHRcdFx0c3RhcnQoKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBsb2FkU2NyaXB0KCBzICkge1xuXHRcdFx0aGVhZC5yZWFkeSggcy5zcmMubWF0Y2goIC8oW1xcd1xcZF9cXC1dKilcXC4/anMkfFteXFxcXFxcL10qJC9pIClbMF0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvLyBFeHRlbnNpb24gbWF5IGNvbnRhaW4gY2FsbGJhY2sgZnVuY3Rpb25zXG5cdFx0XHRcdGlmKCB0eXBlb2Ygcy5jYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0XHRzLmNhbGxiYWNrLmFwcGx5KCB0aGlzICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiggLS1zY3JpcHRzVG9QcmVsb2FkID09PSAwICkge1xuXHRcdFx0XHRcdHByb2NlZWQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGNvbmZpZy5kZXBlbmRlbmNpZXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHR2YXIgcyA9IGNvbmZpZy5kZXBlbmRlbmNpZXNbaV07XG5cblx0XHRcdC8vIExvYWQgaWYgdGhlcmUncyBubyBjb25kaXRpb24gb3IgdGhlIGNvbmRpdGlvbiBpcyB0cnV0aHlcblx0XHRcdGlmKCAhcy5jb25kaXRpb24gfHwgcy5jb25kaXRpb24oKSApIHtcblx0XHRcdFx0aWYoIHMuYXN5bmMgKSB7XG5cdFx0XHRcdFx0c2NyaXB0c0FzeW5jLnB1c2goIHMuc3JjICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0c2NyaXB0cy5wdXNoKCBzLnNyYyApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bG9hZFNjcmlwdCggcyApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKCBzY3JpcHRzLmxlbmd0aCApIHtcblx0XHRcdHNjcmlwdHNUb1ByZWxvYWQgPSBzY3JpcHRzLmxlbmd0aDtcblxuXHRcdFx0Ly8gTG9hZCBzeW5jaHJvbm91cyBzY3JpcHRzXG5cdFx0XHRoZWFkLmpzLmFwcGx5KCBudWxsLCBzY3JpcHRzICk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cHJvY2VlZCgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFN0YXJ0cyB1cCByZXZlYWwuanMgYnkgYmluZGluZyBpbnB1dCBldmVudHMgYW5kIG5hdmlnYXRpbmdcblx0ICogdG8gdGhlIGN1cnJlbnQgVVJMIGRlZXBsaW5rIGlmIHRoZXJlIGlzIG9uZS5cblx0ICovXG5cdGZ1bmN0aW9uIHN0YXJ0KCkge1xuXG5cdFx0Ly8gTWFrZSBzdXJlIHdlJ3ZlIGdvdCBhbGwgdGhlIERPTSBlbGVtZW50cyB3ZSBuZWVkXG5cdFx0c2V0dXBET00oKTtcblxuXHRcdC8vIExpc3RlbiB0byBtZXNzYWdlcyBwb3N0ZWQgdG8gdGhpcyB3aW5kb3dcblx0XHRzZXR1cFBvc3RNZXNzYWdlKCk7XG5cblx0XHQvLyBQcmV2ZW50IHRoZSBzbGlkZXMgZnJvbSBiZWluZyBzY3JvbGxlZCBvdXQgb2Ygdmlld1xuXHRcdHNldHVwU2Nyb2xsUHJldmVudGlvbigpO1xuXG5cdFx0Ly8gUmVzZXRzIGFsbCB2ZXJ0aWNhbCBzbGlkZXMgc28gdGhhdCBvbmx5IHRoZSBmaXJzdCBpcyB2aXNpYmxlXG5cdFx0cmVzZXRWZXJ0aWNhbFNsaWRlcygpO1xuXG5cdFx0Ly8gVXBkYXRlcyB0aGUgcHJlc2VudGF0aW9uIHRvIG1hdGNoIHRoZSBjdXJyZW50IGNvbmZpZ3VyYXRpb24gdmFsdWVzXG5cdFx0Y29uZmlndXJlKCk7XG5cblx0XHQvLyBSZWFkIHRoZSBpbml0aWFsIGhhc2hcblx0XHRyZWFkVVJMKCk7XG5cblx0XHQvLyBVcGRhdGUgYWxsIGJhY2tncm91bmRzXG5cdFx0dXBkYXRlQmFja2dyb3VuZCggdHJ1ZSApO1xuXG5cdFx0Ly8gTm90aWZ5IGxpc3RlbmVycyB0aGF0IHRoZSBwcmVzZW50YXRpb24gaXMgcmVhZHkgYnV0IHVzZSBhIDFtc1xuXHRcdC8vIHRpbWVvdXQgdG8gZW5zdXJlIGl0J3Mgbm90IGZpcmVkIHN5bmNocm9ub3VzbHkgYWZ0ZXIgI2luaXRpYWxpemUoKVxuXHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gRW5hYmxlIHRyYW5zaXRpb25zIG5vdyB0aGF0IHdlJ3JlIGxvYWRlZFxuXHRcdFx0ZG9tLnNsaWRlcy5jbGFzc0xpc3QucmVtb3ZlKCAnbm8tdHJhbnNpdGlvbicgKTtcblxuXHRcdFx0bG9hZGVkID0gdHJ1ZTtcblxuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ3JlYWR5JyApO1xuXG5cdFx0XHRkaXNwYXRjaEV2ZW50KCAncmVhZHknLCB7XG5cdFx0XHRcdCdpbmRleGgnOiBpbmRleGgsXG5cdFx0XHRcdCdpbmRleHYnOiBpbmRleHYsXG5cdFx0XHRcdCdjdXJyZW50U2xpZGUnOiBjdXJyZW50U2xpZGVcblx0XHRcdH0gKTtcblx0XHR9LCAxICk7XG5cblx0XHQvLyBTcGVjaWFsIHNldHVwIGFuZCBjb25maWcgaXMgcmVxdWlyZWQgd2hlbiBwcmludGluZyB0byBQREZcblx0XHRpZiggaXNQcmludGluZ1BERigpICkge1xuXHRcdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcblxuXHRcdFx0Ly8gVGhlIGRvY3VtZW50IG5lZWRzIHRvIGhhdmUgbG9hZGVkIGZvciB0aGUgUERGIGxheW91dFxuXHRcdFx0Ly8gbWVhc3VyZW1lbnRzIHRvIGJlIGFjY3VyYXRlXG5cdFx0XHRpZiggZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJyApIHtcblx0XHRcdFx0c2V0dXBQREYoKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBzZXR1cFBERiApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEZpbmRzIGFuZCBzdG9yZXMgcmVmZXJlbmNlcyB0byBET00gZWxlbWVudHMgd2hpY2ggYXJlXG5cdCAqIHJlcXVpcmVkIGJ5IHRoZSBwcmVzZW50YXRpb24uIElmIGEgcmVxdWlyZWQgZWxlbWVudCBpc1xuXHQgKiBub3QgZm91bmQsIGl0IGlzIGNyZWF0ZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBzZXR1cERPTSgpIHtcblxuXHRcdC8vIFByZXZlbnQgdHJhbnNpdGlvbnMgd2hpbGUgd2UncmUgbG9hZGluZ1xuXHRcdGRvbS5zbGlkZXMuY2xhc3NMaXN0LmFkZCggJ25vLXRyYW5zaXRpb24nICk7XG5cblx0XHQvLyBCYWNrZ3JvdW5kIGVsZW1lbnRcblx0XHRkb20uYmFja2dyb3VuZCA9IGNyZWF0ZVNpbmdsZXRvbk5vZGUoIGRvbS53cmFwcGVyLCAnZGl2JywgJ2JhY2tncm91bmRzJywgbnVsbCApO1xuXG5cdFx0Ly8gUHJvZ3Jlc3MgYmFyXG5cdFx0ZG9tLnByb2dyZXNzID0gY3JlYXRlU2luZ2xldG9uTm9kZSggZG9tLndyYXBwZXIsICdkaXYnLCAncHJvZ3Jlc3MnLCAnPHNwYW4+PC9zcGFuPicgKTtcblx0XHRkb20ucHJvZ3Jlc3NiYXIgPSBkb20ucHJvZ3Jlc3MucXVlcnlTZWxlY3RvciggJ3NwYW4nICk7XG5cblx0XHQvLyBBcnJvdyBjb250cm9sc1xuXHRcdGNyZWF0ZVNpbmdsZXRvbk5vZGUoIGRvbS53cmFwcGVyLCAnYXNpZGUnLCAnY29udHJvbHMnLFxuXHRcdFx0JzxidXR0b24gY2xhc3M9XCJuYXZpZ2F0ZS1sZWZ0XCIgYXJpYS1sYWJlbD1cInByZXZpb3VzIHNsaWRlXCI+PC9idXR0b24+JyArXG5cdFx0XHQnPGJ1dHRvbiBjbGFzcz1cIm5hdmlnYXRlLXJpZ2h0XCIgYXJpYS1sYWJlbD1cIm5leHQgc2xpZGVcIj48L2J1dHRvbj4nICtcblx0XHRcdCc8YnV0dG9uIGNsYXNzPVwibmF2aWdhdGUtdXBcIiBhcmlhLWxhYmVsPVwiYWJvdmUgc2xpZGVcIj48L2J1dHRvbj4nICtcblx0XHRcdCc8YnV0dG9uIGNsYXNzPVwibmF2aWdhdGUtZG93blwiIGFyaWEtbGFiZWw9XCJiZWxvdyBzbGlkZVwiPjwvYnV0dG9uPicgKTtcblxuXHRcdC8vIFNsaWRlIG51bWJlclxuXHRcdGRvbS5zbGlkZU51bWJlciA9IGNyZWF0ZVNpbmdsZXRvbk5vZGUoIGRvbS53cmFwcGVyLCAnZGl2JywgJ3NsaWRlLW51bWJlcicsICcnICk7XG5cblx0XHQvLyBFbGVtZW50IGNvbnRhaW5pbmcgbm90ZXMgdGhhdCBhcmUgdmlzaWJsZSB0byB0aGUgYXVkaWVuY2Vcblx0XHRkb20uc3BlYWtlck5vdGVzID0gY3JlYXRlU2luZ2xldG9uTm9kZSggZG9tLndyYXBwZXIsICdkaXYnLCAnc3BlYWtlci1ub3RlcycsIG51bGwgKTtcblx0XHRkb20uc3BlYWtlck5vdGVzLnNldEF0dHJpYnV0ZSggJ2RhdGEtcHJldmVudC1zd2lwZScsICcnICk7XG5cdFx0ZG9tLnNwZWFrZXJOb3Rlcy5zZXRBdHRyaWJ1dGUoICd0YWJpbmRleCcsICcwJyApO1xuXG5cdFx0Ly8gT3ZlcmxheSBncmFwaGljIHdoaWNoIGlzIGRpc3BsYXllZCBkdXJpbmcgdGhlIHBhdXNlZCBtb2RlXG5cdFx0Y3JlYXRlU2luZ2xldG9uTm9kZSggZG9tLndyYXBwZXIsICdkaXYnLCAncGF1c2Utb3ZlcmxheScsIG51bGwgKTtcblxuXHRcdC8vIENhY2hlIHJlZmVyZW5jZXMgdG8gZWxlbWVudHNcblx0XHRkb20uY29udHJvbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCAnLnJldmVhbCAuY29udHJvbHMnICk7XG5cblx0XHRkb20ud3JhcHBlci5zZXRBdHRyaWJ1dGUoICdyb2xlJywgJ2FwcGxpY2F0aW9uJyApO1xuXG5cdFx0Ly8gVGhlcmUgY2FuIGJlIG11bHRpcGxlIGluc3RhbmNlcyBvZiBjb250cm9scyB0aHJvdWdob3V0IHRoZSBwYWdlXG5cdFx0ZG9tLmNvbnRyb2xzTGVmdCA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcubmF2aWdhdGUtbGVmdCcgKSApO1xuXHRcdGRvbS5jb250cm9sc1JpZ2h0ID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5uYXZpZ2F0ZS1yaWdodCcgKSApO1xuXHRcdGRvbS5jb250cm9sc1VwID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5uYXZpZ2F0ZS11cCcgKSApO1xuXHRcdGRvbS5jb250cm9sc0Rvd24gPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLm5hdmlnYXRlLWRvd24nICkgKTtcblx0XHRkb20uY29udHJvbHNQcmV2ID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5uYXZpZ2F0ZS1wcmV2JyApICk7XG5cdFx0ZG9tLmNvbnRyb2xzTmV4dCA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcubmF2aWdhdGUtbmV4dCcgKSApO1xuXG5cdFx0ZG9tLnN0YXR1c0RpdiA9IGNyZWF0ZVN0YXR1c0RpdigpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYSBoaWRkZW4gZGl2IHdpdGggcm9sZSBhcmlhLWxpdmUgdG8gYW5ub3VuY2UgdGhlXG5cdCAqIGN1cnJlbnQgc2xpZGUgY29udGVudC4gSGlkZSB0aGUgZGl2IG9mZi1zY3JlZW4gdG8gbWFrZSBpdFxuXHQgKiBhdmFpbGFibGUgb25seSB0byBBc3Npc3RpdmUgVGVjaG5vbG9naWVzLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZVN0YXR1c0RpdigpIHtcblxuXHRcdHZhciBzdGF0dXNEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2FyaWEtc3RhdHVzLWRpdicgKTtcblx0XHRpZiggIXN0YXR1c0RpdiApIHtcblx0XHRcdHN0YXR1c0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdFx0XHRzdGF0dXNEaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0c3RhdHVzRGl2LnN0eWxlLmhlaWdodCA9ICcxcHgnO1xuXHRcdFx0c3RhdHVzRGl2LnN0eWxlLndpZHRoID0gJzFweCc7XG5cdFx0XHRzdGF0dXNEaXYuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblx0XHRcdHN0YXR1c0Rpdi5zdHlsZS5jbGlwID0gJ3JlY3QoIDFweCwgMXB4LCAxcHgsIDFweCApJztcblx0XHRcdHN0YXR1c0Rpdi5zZXRBdHRyaWJ1dGUoICdpZCcsICdhcmlhLXN0YXR1cy1kaXYnICk7XG5cdFx0XHRzdGF0dXNEaXYuc2V0QXR0cmlidXRlKCAnYXJpYS1saXZlJywgJ3BvbGl0ZScgKTtcblx0XHRcdHN0YXR1c0Rpdi5zZXRBdHRyaWJ1dGUoICdhcmlhLWF0b21pYycsJ3RydWUnICk7XG5cdFx0XHRkb20ud3JhcHBlci5hcHBlbmRDaGlsZCggc3RhdHVzRGl2ICk7XG5cdFx0fVxuXHRcdHJldHVybiBzdGF0dXNEaXY7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyB0aGUgZ2l2ZW4gSFRNTCBlbGVtZW50IGludG8gYSBzdHJpbmcgb2YgdGV4dFxuXHQgKiB0aGF0IGNhbiBiZSBhbm5vdW5jZWQgdG8gYSBzY3JlZW4gcmVhZGVyLiBIaWRkZW5cblx0ICogZWxlbWVudHMgYXJlIGV4Y2x1ZGVkLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0U3RhdHVzVGV4dCggbm9kZSApIHtcblxuXHRcdHZhciB0ZXh0ID0gJyc7XG5cblx0XHQvLyBUZXh0IG5vZGVcblx0XHRpZiggbm9kZS5ub2RlVHlwZSA9PT0gMyApIHtcblx0XHRcdHRleHQgKz0gbm9kZS50ZXh0Q29udGVudDtcblx0XHR9XG5cdFx0Ly8gRWxlbWVudCBub2RlXG5cdFx0ZWxzZSBpZiggbm9kZS5ub2RlVHlwZSA9PT0gMSApIHtcblxuXHRcdFx0dmFyIGlzQXJpYUhpZGRlbiA9IG5vZGUuZ2V0QXR0cmlidXRlKCAnYXJpYS1oaWRkZW4nICk7XG5cdFx0XHR2YXIgaXNEaXNwbGF5SGlkZGVuID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoIG5vZGUgKVsnZGlzcGxheSddID09PSAnbm9uZSc7XG5cdFx0XHRpZiggaXNBcmlhSGlkZGVuICE9PSAndHJ1ZScgJiYgIWlzRGlzcGxheUhpZGRlbiApIHtcblxuXHRcdFx0XHR0b0FycmF5KCBub2RlLmNoaWxkTm9kZXMgKS5mb3JFYWNoKCBmdW5jdGlvbiggY2hpbGQgKSB7XG5cdFx0XHRcdFx0dGV4dCArPSBnZXRTdGF0dXNUZXh0KCBjaGlsZCApO1xuXHRcdFx0XHR9ICk7XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdHJldHVybiB0ZXh0O1xuXG5cdH1cblxuXHQvKipcblx0ICogQ29uZmlndXJlcyB0aGUgcHJlc2VudGF0aW9uIGZvciBwcmludGluZyB0byBhIHN0YXRpY1xuXHQgKiBQREYuXG5cdCAqL1xuXHRmdW5jdGlvbiBzZXR1cFBERigpIHtcblxuXHRcdHZhciBzbGlkZVNpemUgPSBnZXRDb21wdXRlZFNsaWRlU2l6ZSggd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCApO1xuXG5cdFx0Ly8gRGltZW5zaW9ucyBvZiB0aGUgUERGIHBhZ2VzXG5cdFx0dmFyIHBhZ2VXaWR0aCA9IE1hdGguZmxvb3IoIHNsaWRlU2l6ZS53aWR0aCAqICggMSArIGNvbmZpZy5tYXJnaW4gKSApLFxuXHRcdFx0cGFnZUhlaWdodCA9IE1hdGguZmxvb3IoIHNsaWRlU2l6ZS5oZWlnaHQgKiAoIDEgKyBjb25maWcubWFyZ2luICkgKTtcblxuXHRcdC8vIERpbWVuc2lvbnMgb2Ygc2xpZGVzIHdpdGhpbiB0aGUgcGFnZXNcblx0XHR2YXIgc2xpZGVXaWR0aCA9IHNsaWRlU2l6ZS53aWR0aCxcblx0XHRcdHNsaWRlSGVpZ2h0ID0gc2xpZGVTaXplLmhlaWdodDtcblxuXHRcdC8vIExldCB0aGUgYnJvd3NlciBrbm93IHdoYXQgcGFnZSBzaXplIHdlIHdhbnQgdG8gcHJpbnRcblx0XHRpbmplY3RTdHlsZVNoZWV0KCAnQHBhZ2V7c2l6ZTonKyBwYWdlV2lkdGggKydweCAnKyBwYWdlSGVpZ2h0ICsncHg7IG1hcmdpbjogMHB4O30nICk7XG5cblx0XHQvLyBMaW1pdCB0aGUgc2l6ZSBvZiBjZXJ0YWluIGVsZW1lbnRzIHRvIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBzbGlkZVxuXHRcdGluamVjdFN0eWxlU2hlZXQoICcucmV2ZWFsIHNlY3Rpb24+aW1nLCAucmV2ZWFsIHNlY3Rpb24+dmlkZW8sIC5yZXZlYWwgc2VjdGlvbj5pZnJhbWV7bWF4LXdpZHRoOiAnKyBzbGlkZVdpZHRoICsncHg7IG1heC1oZWlnaHQ6Jysgc2xpZGVIZWlnaHQgKydweH0nICk7XG5cblx0XHRkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoICdwcmludC1wZGYnICk7XG5cdFx0ZG9jdW1lbnQuYm9keS5zdHlsZS53aWR0aCA9IHBhZ2VXaWR0aCArICdweCc7XG5cdFx0ZG9jdW1lbnQuYm9keS5zdHlsZS5oZWlnaHQgPSBwYWdlSGVpZ2h0ICsgJ3B4JztcblxuXHRcdC8vIE1ha2Ugc3VyZSBzdHJldGNoIGVsZW1lbnRzIGZpdCBvbiBzbGlkZVxuXHRcdGxheW91dFNsaWRlQ29udGVudHMoIHNsaWRlV2lkdGgsIHNsaWRlSGVpZ2h0ICk7XG5cblx0XHQvLyBBZGQgZWFjaCBzbGlkZSdzIGluZGV4IGFzIGF0dHJpYnV0ZXMgb24gaXRzZWxmLCB3ZSBuZWVkIHRoZXNlXG5cdFx0Ly8gaW5kaWNlcyB0byBnZW5lcmF0ZSBzbGlkZSBudW1iZXJzIGJlbG93XG5cdFx0dG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBoc2xpZGUsIGggKSB7XG5cdFx0XHRoc2xpZGUuc2V0QXR0cmlidXRlKCAnZGF0YS1pbmRleC1oJywgaCApO1xuXG5cdFx0XHRpZiggaHNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ3N0YWNrJyApICkge1xuXHRcdFx0XHR0b0FycmF5KCBoc2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggdnNsaWRlLCB2ICkge1xuXHRcdFx0XHRcdHZzbGlkZS5zZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LWgnLCBoICk7XG5cdFx0XHRcdFx0dnNsaWRlLnNldEF0dHJpYnV0ZSggJ2RhdGEtaW5kZXgtdicsIHYgKTtcblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdC8vIFNsaWRlIGFuZCBzbGlkZSBiYWNrZ3JvdW5kIGxheW91dFxuXHRcdHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIFNMSURFU19TRUxFQ1RPUiApICkuZm9yRWFjaCggZnVuY3Rpb24oIHNsaWRlICkge1xuXG5cdFx0XHQvLyBWZXJ0aWNhbCBzdGFja3MgYXJlIG5vdCBjZW50cmVkIHNpbmNlIHRoZWlyIHNlY3Rpb25cblx0XHRcdC8vIGNoaWxkcmVuIHdpbGwgYmVcblx0XHRcdGlmKCBzbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoICdzdGFjaycgKSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdC8vIENlbnRlciB0aGUgc2xpZGUgaW5zaWRlIG9mIHRoZSBwYWdlLCBnaXZpbmcgdGhlIHNsaWRlIHNvbWUgbWFyZ2luXG5cdFx0XHRcdHZhciBsZWZ0ID0gKCBwYWdlV2lkdGggLSBzbGlkZVdpZHRoICkgLyAyLFxuXHRcdFx0XHRcdHRvcCA9ICggcGFnZUhlaWdodCAtIHNsaWRlSGVpZ2h0ICkgLyAyO1xuXG5cdFx0XHRcdHZhciBjb250ZW50SGVpZ2h0ID0gc2xpZGUuc2Nyb2xsSGVpZ2h0O1xuXHRcdFx0XHR2YXIgbnVtYmVyT2ZQYWdlcyA9IE1hdGgubWF4KCBNYXRoLmNlaWwoIGNvbnRlbnRIZWlnaHQgLyBwYWdlSGVpZ2h0ICksIDEgKTtcblxuXHRcdFx0XHQvLyBBZGhlcmUgdG8gY29uZmlndXJlZCBwYWdlcyBwZXIgc2xpZGUgbGltaXRcblx0XHRcdFx0bnVtYmVyT2ZQYWdlcyA9IE1hdGgubWluKCBudW1iZXJPZlBhZ2VzLCBjb25maWcucGRmTWF4UGFnZXNQZXJTbGlkZSApO1xuXG5cdFx0XHRcdC8vIENlbnRlciBzbGlkZXMgdmVydGljYWxseVxuXHRcdFx0XHRpZiggbnVtYmVyT2ZQYWdlcyA9PT0gMSAmJiBjb25maWcuY2VudGVyIHx8IHNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ2NlbnRlcicgKSApIHtcblx0XHRcdFx0XHR0b3AgPSBNYXRoLm1heCggKCBwYWdlSGVpZ2h0IC0gY29udGVudEhlaWdodCApIC8gMiwgMCApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gV3JhcCB0aGUgc2xpZGUgaW4gYSBwYWdlIGVsZW1lbnQgYW5kIGhpZGUgaXRzIG92ZXJmbG93XG5cdFx0XHRcdC8vIHNvIHRoYXQgbm8gcGFnZSBldmVyIGZsb3dzIG9udG8gYW5vdGhlclxuXHRcdFx0XHR2YXIgcGFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdFx0XHRcdHBhZ2UuY2xhc3NOYW1lID0gJ3BkZi1wYWdlJztcblx0XHRcdFx0cGFnZS5zdHlsZS5oZWlnaHQgPSAoICggcGFnZUhlaWdodCArIGNvbmZpZy5wZGZQYWdlSGVpZ2h0T2Zmc2V0ICkgKiBudW1iZXJPZlBhZ2VzICkgKyAncHgnO1xuXHRcdFx0XHRzbGlkZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZSggcGFnZSwgc2xpZGUgKTtcblx0XHRcdFx0cGFnZS5hcHBlbmRDaGlsZCggc2xpZGUgKTtcblxuXHRcdFx0XHQvLyBQb3NpdGlvbiB0aGUgc2xpZGUgaW5zaWRlIG9mIHRoZSBwYWdlXG5cdFx0XHRcdHNsaWRlLnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4Jztcblx0XHRcdFx0c2xpZGUuc3R5bGUudG9wID0gdG9wICsgJ3B4Jztcblx0XHRcdFx0c2xpZGUuc3R5bGUud2lkdGggPSBzbGlkZVdpZHRoICsgJ3B4JztcblxuXHRcdFx0XHRpZiggc2xpZGUuc2xpZGVCYWNrZ3JvdW5kRWxlbWVudCApIHtcblx0XHRcdFx0XHRwYWdlLmluc2VydEJlZm9yZSggc2xpZGUuc2xpZGVCYWNrZ3JvdW5kRWxlbWVudCwgc2xpZGUgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEluamVjdCBub3RlcyBpZiBgc2hvd05vdGVzYCBpcyBlbmFibGVkXG5cdFx0XHRcdGlmKCBjb25maWcuc2hvd05vdGVzICkge1xuXG5cdFx0XHRcdFx0Ly8gQXJlIHRoZXJlIG5vdGVzIGZvciB0aGlzIHNsaWRlP1xuXHRcdFx0XHRcdHZhciBub3RlcyA9IGdldFNsaWRlTm90ZXMoIHNsaWRlICk7XG5cdFx0XHRcdFx0aWYoIG5vdGVzICkge1xuXG5cdFx0XHRcdFx0XHR2YXIgbm90ZXNTcGFjaW5nID0gODtcblx0XHRcdFx0XHRcdHZhciBub3Rlc0xheW91dCA9IHR5cGVvZiBjb25maWcuc2hvd05vdGVzID09PSAnc3RyaW5nJyA/IGNvbmZpZy5zaG93Tm90ZXMgOiAnaW5saW5lJztcblx0XHRcdFx0XHRcdHZhciBub3Rlc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRcdFx0XHRcdFx0bm90ZXNFbGVtZW50LmNsYXNzTGlzdC5hZGQoICdzcGVha2VyLW5vdGVzJyApO1xuXHRcdFx0XHRcdFx0bm90ZXNFbGVtZW50LmNsYXNzTGlzdC5hZGQoICdzcGVha2VyLW5vdGVzLXBkZicgKTtcblx0XHRcdFx0XHRcdG5vdGVzRWxlbWVudC5zZXRBdHRyaWJ1dGUoICdkYXRhLWxheW91dCcsIG5vdGVzTGF5b3V0ICk7XG5cdFx0XHRcdFx0XHRub3Rlc0VsZW1lbnQuaW5uZXJIVE1MID0gbm90ZXM7XG5cblx0XHRcdFx0XHRcdGlmKCBub3Rlc0xheW91dCA9PT0gJ3NlcGFyYXRlLXBhZ2UnICkge1xuXHRcdFx0XHRcdFx0XHRwYWdlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKCBub3Rlc0VsZW1lbnQsIHBhZ2UubmV4dFNpYmxpbmcgKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRub3Rlc0VsZW1lbnQuc3R5bGUubGVmdCA9IG5vdGVzU3BhY2luZyArICdweCc7XG5cdFx0XHRcdFx0XHRcdG5vdGVzRWxlbWVudC5zdHlsZS5ib3R0b20gPSBub3Rlc1NwYWNpbmcgKyAncHgnO1xuXHRcdFx0XHRcdFx0XHRub3Rlc0VsZW1lbnQuc3R5bGUud2lkdGggPSAoIHBhZ2VXaWR0aCAtIG5vdGVzU3BhY2luZyoyICkgKyAncHgnO1xuXHRcdFx0XHRcdFx0XHRwYWdlLmFwcGVuZENoaWxkKCBub3Rlc0VsZW1lbnQgKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gSW5qZWN0IHNsaWRlIG51bWJlcnMgaWYgYHNsaWRlTnVtYmVyc2AgYXJlIGVuYWJsZWRcblx0XHRcdFx0aWYoIGNvbmZpZy5zbGlkZU51bWJlciAmJiAvYWxsfHByaW50L2kudGVzdCggY29uZmlnLnNob3dTbGlkZU51bWJlciApICkge1xuXHRcdFx0XHRcdHZhciBzbGlkZU51bWJlckggPSBwYXJzZUludCggc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1pbmRleC1oJyApLCAxMCApICsgMSxcblx0XHRcdFx0XHRcdHNsaWRlTnVtYmVyViA9IHBhcnNlSW50KCBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LXYnICksIDEwICkgKyAxO1xuXG5cdFx0XHRcdFx0dmFyIG51bWJlckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRcdFx0XHRcdG51bWJlckVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ3NsaWRlLW51bWJlcicgKTtcblx0XHRcdFx0XHRudW1iZXJFbGVtZW50LmNsYXNzTGlzdC5hZGQoICdzbGlkZS1udW1iZXItcGRmJyApO1xuXHRcdFx0XHRcdG51bWJlckVsZW1lbnQuaW5uZXJIVE1MID0gZm9ybWF0U2xpZGVOdW1iZXIoIHNsaWRlTnVtYmVySCwgJy4nLCBzbGlkZU51bWJlclYgKTtcblx0XHRcdFx0XHRwYWdlLmFwcGVuZENoaWxkKCBudW1iZXJFbGVtZW50ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdH0gKTtcblxuXHRcdC8vIFNob3cgYWxsIGZyYWdtZW50c1xuXHRcdHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIFNMSURFU19TRUxFQ1RPUiArICcgLmZyYWdtZW50JyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGZyYWdtZW50ICkge1xuXHRcdFx0ZnJhZ21lbnQuY2xhc3NMaXN0LmFkZCggJ3Zpc2libGUnICk7XG5cdFx0fSApO1xuXG5cdFx0Ly8gTm90aWZ5IHN1YnNjcmliZXJzIHRoYXQgdGhlIFBERiBsYXlvdXQgaXMgZ29vZCB0byBnb1xuXHRcdGRpc3BhdGNoRXZlbnQoICdwZGYtcmVhZHknICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBUaGlzIGlzIGFuIHVuZm9ydHVuYXRlIG5lY2Vzc2l0eS4gU29tZSBhY3Rpb25zIOKAkyBzdWNoIGFzXG5cdCAqIGFuIGlucHV0IGZpZWxkIGJlaW5nIGZvY3VzZWQgaW4gYW4gaWZyYW1lIG9yIHVzaW5nIHRoZVxuXHQgKiBrZXlib2FyZCB0byBleHBhbmQgdGV4dCBzZWxlY3Rpb24gYmV5b25kIHRoZSBib3VuZHMgb2Zcblx0ICogYSBzbGlkZSDigJMgY2FuIHRyaWdnZXIgb3VyIGNvbnRlbnQgdG8gYmUgcHVzaGVkIG91dCBvZiB2aWV3LlxuXHQgKiBUaGlzIHNjcm9sbGluZyBjYW4gbm90IGJlIHByZXZlbnRlZCBieSBoaWRpbmcgb3ZlcmZsb3cgaW5cblx0ICogQ1NTICh3ZSBhbHJlYWR5IGRvKSBzbyB3ZSBoYXZlIHRvIHJlc29ydCB0byByZXBlYXRlZGx5XG5cdCAqIGNoZWNraW5nIGlmIHRoZSBzbGlkZXMgaGF2ZSBiZWVuIG9mZnNldCA6KFxuXHQgKi9cblx0ZnVuY3Rpb24gc2V0dXBTY3JvbGxQcmV2ZW50aW9uKCkge1xuXG5cdFx0c2V0SW50ZXJ2YWwoIGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYoIGRvbS53cmFwcGVyLnNjcm9sbFRvcCAhPT0gMCB8fCBkb20ud3JhcHBlci5zY3JvbGxMZWZ0ICE9PSAwICkge1xuXHRcdFx0XHRkb20ud3JhcHBlci5zY3JvbGxUb3AgPSAwO1xuXHRcdFx0XHRkb20ud3JhcHBlci5zY3JvbGxMZWZ0ID0gMDtcblx0XHRcdH1cblx0XHR9LCAxMDAwICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGFuIEhUTUwgZWxlbWVudCBhbmQgcmV0dXJucyBhIHJlZmVyZW5jZSB0byBpdC5cblx0ICogSWYgdGhlIGVsZW1lbnQgYWxyZWFkeSBleGlzdHMgdGhlIGV4aXN0aW5nIGluc3RhbmNlIHdpbGxcblx0ICogYmUgcmV0dXJuZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGFnbmFtZVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NuYW1lXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpbm5lckhUTUxcblx0ICpcblx0ICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVTaW5nbGV0b25Ob2RlKCBjb250YWluZXIsIHRhZ25hbWUsIGNsYXNzbmFtZSwgaW5uZXJIVE1MICkge1xuXG5cdFx0Ly8gRmluZCBhbGwgbm9kZXMgbWF0Y2hpbmcgdGhlIGRlc2NyaXB0aW9uXG5cdFx0dmFyIG5vZGVzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoICcuJyArIGNsYXNzbmFtZSApO1xuXG5cdFx0Ly8gQ2hlY2sgYWxsIG1hdGNoZXMgdG8gZmluZCBvbmUgd2hpY2ggaXMgYSBkaXJlY3QgY2hpbGQgb2Zcblx0XHQvLyB0aGUgc3BlY2lmaWVkIGNvbnRhaW5lclxuXHRcdGZvciggdmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHR2YXIgdGVzdE5vZGUgPSBub2Rlc1tpXTtcblx0XHRcdGlmKCB0ZXN0Tm9kZS5wYXJlbnROb2RlID09PSBjb250YWluZXIgKSB7XG5cdFx0XHRcdHJldHVybiB0ZXN0Tm9kZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJZiBubyBub2RlIHdhcyBmb3VuZCwgY3JlYXRlIGl0IG5vd1xuXHRcdHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggdGFnbmFtZSApO1xuXHRcdG5vZGUuY2xhc3NMaXN0LmFkZCggY2xhc3NuYW1lICk7XG5cdFx0aWYoIHR5cGVvZiBpbm5lckhUTUwgPT09ICdzdHJpbmcnICkge1xuXHRcdFx0bm9kZS5pbm5lckhUTUwgPSBpbm5lckhUTUw7XG5cdFx0fVxuXHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZCggbm9kZSApO1xuXG5cdFx0cmV0dXJuIG5vZGU7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIHRoZSBzbGlkZSBiYWNrZ3JvdW5kIGVsZW1lbnRzIGFuZCBhcHBlbmRzIHRoZW1cblx0ICogdG8gdGhlIGJhY2tncm91bmQgY29udGFpbmVyLiBPbmUgZWxlbWVudCBpcyBjcmVhdGVkIHBlclxuXHQgKiBzbGlkZSBubyBtYXR0ZXIgaWYgdGhlIGdpdmVuIHNsaWRlIGhhcyB2aXNpYmxlIGJhY2tncm91bmQuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVCYWNrZ3JvdW5kcygpIHtcblxuXHRcdHZhciBwcmludE1vZGUgPSBpc1ByaW50aW5nUERGKCk7XG5cblx0XHQvLyBDbGVhciBwcmlvciBiYWNrZ3JvdW5kc1xuXHRcdGRvbS5iYWNrZ3JvdW5kLmlubmVySFRNTCA9ICcnO1xuXHRcdGRvbS5iYWNrZ3JvdW5kLmNsYXNzTGlzdC5hZGQoICduby10cmFuc2l0aW9uJyApO1xuXG5cdFx0Ly8gSXRlcmF0ZSBvdmVyIGFsbCBob3Jpem9udGFsIHNsaWRlc1xuXHRcdHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggc2xpZGVoICkge1xuXG5cdFx0XHR2YXIgYmFja2dyb3VuZFN0YWNrID0gY3JlYXRlQmFja2dyb3VuZCggc2xpZGVoLCBkb20uYmFja2dyb3VuZCApO1xuXG5cdFx0XHQvLyBJdGVyYXRlIG92ZXIgYWxsIHZlcnRpY2FsIHNsaWRlc1xuXHRcdFx0dG9BcnJheSggc2xpZGVoLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIHNsaWRldiApIHtcblxuXHRcdFx0XHRjcmVhdGVCYWNrZ3JvdW5kKCBzbGlkZXYsIGJhY2tncm91bmRTdGFjayApO1xuXG5cdFx0XHRcdGJhY2tncm91bmRTdGFjay5jbGFzc0xpc3QuYWRkKCAnc3RhY2snICk7XG5cblx0XHRcdH0gKTtcblxuXHRcdH0gKTtcblxuXHRcdC8vIEFkZCBwYXJhbGxheCBiYWNrZ3JvdW5kIGlmIHNwZWNpZmllZFxuXHRcdGlmKCBjb25maWcucGFyYWxsYXhCYWNrZ3JvdW5kSW1hZ2UgKSB7XG5cblx0XHRcdGRvbS5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoXCInICsgY29uZmlnLnBhcmFsbGF4QmFja2dyb3VuZEltYWdlICsgJ1wiKSc7XG5cdFx0XHRkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9IGNvbmZpZy5wYXJhbGxheEJhY2tncm91bmRTaXplO1xuXG5cdFx0XHQvLyBNYWtlIHN1cmUgdGhlIGJlbG93IHByb3BlcnRpZXMgYXJlIHNldCBvbiB0aGUgZWxlbWVudCAtIHRoZXNlIHByb3BlcnRpZXMgYXJlXG5cdFx0XHQvLyBuZWVkZWQgZm9yIHByb3BlciB0cmFuc2l0aW9ucyB0byBiZSBzZXQgb24gdGhlIGVsZW1lbnQgdmlhIENTUy4gVG8gcmVtb3ZlXG5cdFx0XHQvLyBhbm5veWluZyBiYWNrZ3JvdW5kIHNsaWRlLWluIGVmZmVjdCB3aGVuIHRoZSBwcmVzZW50YXRpb24gc3RhcnRzLCBhcHBseVxuXHRcdFx0Ly8gdGhlc2UgcHJvcGVydGllcyBhZnRlciBzaG9ydCB0aW1lIGRlbGF5XG5cdFx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ2hhcy1wYXJhbGxheC1iYWNrZ3JvdW5kJyApO1xuXHRcdFx0fSwgMSApO1xuXG5cdFx0fVxuXHRcdGVsc2Uge1xuXG5cdFx0XHRkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnJztcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoICdoYXMtcGFyYWxsYXgtYmFja2dyb3VuZCcgKTtcblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYSBiYWNrZ3JvdW5kIGZvciB0aGUgZ2l2ZW4gc2xpZGUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHNsaWRlXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lciBUaGUgZWxlbWVudCB0aGF0IHRoZSBiYWNrZ3JvdW5kXG5cdCAqIHNob3VsZCBiZSBhcHBlbmRlZCB0b1xuXHQgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gTmV3IGJhY2tncm91bmQgZGl2XG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVCYWNrZ3JvdW5kKCBzbGlkZSwgY29udGFpbmVyICkge1xuXG5cdFx0dmFyIGRhdGEgPSB7XG5cdFx0XHRiYWNrZ3JvdW5kOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQnICksXG5cdFx0XHRiYWNrZ3JvdW5kU2l6ZTogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXNpemUnICksXG5cdFx0XHRiYWNrZ3JvdW5kSW1hZ2U6IHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC1pbWFnZScgKSxcblx0XHRcdGJhY2tncm91bmRWaWRlbzogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXZpZGVvJyApLFxuXHRcdFx0YmFja2dyb3VuZElmcmFtZTogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWlmcmFtZScgKSxcblx0XHRcdGJhY2tncm91bmRDb2xvcjogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWNvbG9yJyApLFxuXHRcdFx0YmFja2dyb3VuZFJlcGVhdDogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXJlcGVhdCcgKSxcblx0XHRcdGJhY2tncm91bmRQb3NpdGlvbjogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXBvc2l0aW9uJyApLFxuXHRcdFx0YmFja2dyb3VuZFRyYW5zaXRpb246IHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uJyApXG5cdFx0fTtcblxuXHRcdHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblxuXHRcdC8vIENhcnJ5IG92ZXIgY3VzdG9tIGNsYXNzZXMgZnJvbSB0aGUgc2xpZGUgdG8gdGhlIGJhY2tncm91bmRcblx0XHRlbGVtZW50LmNsYXNzTmFtZSA9ICdzbGlkZS1iYWNrZ3JvdW5kICcgKyBzbGlkZS5jbGFzc05hbWUucmVwbGFjZSggL3ByZXNlbnR8cGFzdHxmdXR1cmUvLCAnJyApO1xuXG5cdFx0aWYoIGRhdGEuYmFja2dyb3VuZCApIHtcblx0XHRcdC8vIEF1dG8td3JhcCBpbWFnZSB1cmxzIGluIHVybCguLi4pXG5cdFx0XHRpZiggL14oaHR0cHxmaWxlfFxcL1xcLykvZ2kudGVzdCggZGF0YS5iYWNrZ3JvdW5kICkgfHwgL1xcLihzdmd8cG5nfGpwZ3xqcGVnfGdpZnxibXApKFs/I118JCkvZ2kudGVzdCggZGF0YS5iYWNrZ3JvdW5kICkgKSB7XG5cdFx0XHRcdHNsaWRlLnNldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC1pbWFnZScsIGRhdGEuYmFja2dyb3VuZCApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZCA9IGRhdGEuYmFja2dyb3VuZDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBDcmVhdGUgYSBoYXNoIGZvciB0aGlzIGNvbWJpbmF0aW9uIG9mIGJhY2tncm91bmQgc2V0dGluZ3MuXG5cdFx0Ly8gVGhpcyBpcyB1c2VkIHRvIGRldGVybWluZSB3aGVuIHR3byBzbGlkZSBiYWNrZ3JvdW5kcyBhcmVcblx0XHQvLyB0aGUgc2FtZS5cblx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kIHx8IGRhdGEuYmFja2dyb3VuZENvbG9yIHx8IGRhdGEuYmFja2dyb3VuZEltYWdlIHx8IGRhdGEuYmFja2dyb3VuZFZpZGVvIHx8IGRhdGEuYmFja2dyb3VuZElmcmFtZSApIHtcblx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWhhc2gnLCBkYXRhLmJhY2tncm91bmQgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5iYWNrZ3JvdW5kU2l6ZSArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmJhY2tncm91bmRJbWFnZSArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmJhY2tncm91bmRWaWRlbyArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmJhY2tncm91bmRJZnJhbWUgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5iYWNrZ3JvdW5kQ29sb3IgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5iYWNrZ3JvdW5kUmVwZWF0ICtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuYmFja2dyb3VuZFBvc2l0aW9uICtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuYmFja2dyb3VuZFRyYW5zaXRpb24gKTtcblx0XHR9XG5cblx0XHQvLyBBZGRpdGlvbmFsIGFuZCBvcHRpb25hbCBiYWNrZ3JvdW5kIHByb3BlcnRpZXNcblx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kU2l6ZSApIGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZFNpemUgPSBkYXRhLmJhY2tncm91bmRTaXplO1xuXHRcdGlmKCBkYXRhLmJhY2tncm91bmRTaXplICkgZWxlbWVudC5zZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtc2l6ZScsIGRhdGEuYmFja2dyb3VuZFNpemUgKTtcblx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kQ29sb3IgKSBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGRhdGEuYmFja2dyb3VuZENvbG9yO1xuXHRcdGlmKCBkYXRhLmJhY2tncm91bmRSZXBlYXQgKSBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSBkYXRhLmJhY2tncm91bmRSZXBlYXQ7XG5cdFx0aWYoIGRhdGEuYmFja2dyb3VuZFBvc2l0aW9uICkgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSBkYXRhLmJhY2tncm91bmRQb3NpdGlvbjtcblx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kVHJhbnNpdGlvbiApIGVsZW1lbnQuc2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb24nLCBkYXRhLmJhY2tncm91bmRUcmFuc2l0aW9uICk7XG5cblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQoIGVsZW1lbnQgKTtcblxuXHRcdC8vIElmIGJhY2tncm91bmRzIGFyZSBiZWluZyByZWNyZWF0ZWQsIGNsZWFyIG9sZCBjbGFzc2VzXG5cdFx0c2xpZGUuY2xhc3NMaXN0LnJlbW92ZSggJ2hhcy1kYXJrLWJhY2tncm91bmQnICk7XG5cdFx0c2xpZGUuY2xhc3NMaXN0LnJlbW92ZSggJ2hhcy1saWdodC1iYWNrZ3JvdW5kJyApO1xuXG5cdFx0c2xpZGUuc2xpZGVCYWNrZ3JvdW5kRWxlbWVudCA9IGVsZW1lbnQ7XG5cblx0XHQvLyBJZiB0aGlzIHNsaWRlIGhhcyBhIGJhY2tncm91bmQgY29sb3IsIGFkZCBhIGNsYXNzIHRoYXRcblx0XHQvLyBzaWduYWxzIGlmIGl0IGlzIGxpZ2h0IG9yIGRhcmsuIElmIHRoZSBzbGlkZSBoYXMgbm8gYmFja2dyb3VuZFxuXHRcdC8vIGNvbG9yLCBubyBjbGFzcyB3aWxsIGJlIHNldFxuXHRcdHZhciBjb21wdXRlZEJhY2tncm91bmRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKCBlbGVtZW50ICk7XG5cdFx0aWYoIGNvbXB1dGVkQmFja2dyb3VuZFN0eWxlICYmIGNvbXB1dGVkQmFja2dyb3VuZFN0eWxlLmJhY2tncm91bmRDb2xvciApIHtcblx0XHRcdHZhciByZ2IgPSBjb2xvclRvUmdiKCBjb21wdXRlZEJhY2tncm91bmRTdHlsZS5iYWNrZ3JvdW5kQ29sb3IgKTtcblxuXHRcdFx0Ly8gSWdub3JlIGZ1bGx5IHRyYW5zcGFyZW50IGJhY2tncm91bmRzLiBTb21lIGJyb3dzZXJzIHJldHVyblxuXHRcdFx0Ly8gcmdiYSgwLDAsMCwwKSB3aGVuIHJlYWRpbmcgdGhlIGNvbXB1dGVkIGJhY2tncm91bmQgY29sb3Igb2Zcblx0XHRcdC8vIGFuIGVsZW1lbnQgd2l0aCBubyBiYWNrZ3JvdW5kXG5cdFx0XHRpZiggcmdiICYmIHJnYi5hICE9PSAwICkge1xuXHRcdFx0XHRpZiggY29sb3JCcmlnaHRuZXNzKCBjb21wdXRlZEJhY2tncm91bmRTdHlsZS5iYWNrZ3JvdW5kQ29sb3IgKSA8IDEyOCApIHtcblx0XHRcdFx0XHRzbGlkZS5jbGFzc0xpc3QuYWRkKCAnaGFzLWRhcmstYmFja2dyb3VuZCcgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRzbGlkZS5jbGFzc0xpc3QuYWRkKCAnaGFzLWxpZ2h0LWJhY2tncm91bmQnICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZWxlbWVudDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJlZ2lzdGVycyBhIGxpc3RlbmVyIHRvIHBvc3RNZXNzYWdlIGV2ZW50cywgdGhpcyBtYWtlcyBpdFxuXHQgKiBwb3NzaWJsZSB0byBjYWxsIGFsbCByZXZlYWwuanMgQVBJIG1ldGhvZHMgZnJvbSBhbm90aGVyXG5cdCAqIHdpbmRvdy4gRm9yIGV4YW1wbGU6XG5cdCAqXG5cdCAqIHJldmVhbFdpbmRvdy5wb3N0TWVzc2FnZSggSlNPTi5zdHJpbmdpZnkoe1xuXHQgKiAgIG1ldGhvZDogJ3NsaWRlJyxcblx0ICogICBhcmdzOiBbIDIgXVxuXHQgKiB9KSwgJyonICk7XG5cdCAqL1xuXHRmdW5jdGlvbiBzZXR1cFBvc3RNZXNzYWdlKCkge1xuXG5cdFx0aWYoIGNvbmZpZy5wb3N0TWVzc2FnZSApIHtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnbWVzc2FnZScsIGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cdFx0XHRcdHZhciBkYXRhID0gZXZlbnQuZGF0YTtcblxuXHRcdFx0XHQvLyBNYWtlIHN1cmUgd2UncmUgZGVhbGluZyB3aXRoIEpTT05cblx0XHRcdFx0aWYoIHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJyAmJiBkYXRhLmNoYXJBdCggMCApID09PSAneycgJiYgZGF0YS5jaGFyQXQoIGRhdGEubGVuZ3RoIC0gMSApID09PSAnfScgKSB7XG5cdFx0XHRcdFx0ZGF0YSA9IEpTT04ucGFyc2UoIGRhdGEgKTtcblxuXHRcdFx0XHRcdC8vIENoZWNrIGlmIHRoZSByZXF1ZXN0ZWQgbWV0aG9kIGNhbiBiZSBmb3VuZFxuXHRcdFx0XHRcdGlmKCBkYXRhLm1ldGhvZCAmJiB0eXBlb2YgUmV2ZWFsW2RhdGEubWV0aG9kXSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0XHRcdFJldmVhbFtkYXRhLm1ldGhvZF0uYXBwbHkoIFJldmVhbCwgZGF0YS5hcmdzICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LCBmYWxzZSApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEFwcGxpZXMgdGhlIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3MgZnJvbSB0aGUgY29uZmlnXG5cdCAqIG9iamVjdC4gTWF5IGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcy5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcblx0ICovXG5cdGZ1bmN0aW9uIGNvbmZpZ3VyZSggb3B0aW9ucyApIHtcblxuXHRcdHZhciBudW1iZXJPZlNsaWRlcyA9IGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIFNMSURFU19TRUxFQ1RPUiApLmxlbmd0aDtcblxuXHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoIGNvbmZpZy50cmFuc2l0aW9uICk7XG5cblx0XHQvLyBOZXcgY29uZmlnIG9wdGlvbnMgbWF5IGJlIHBhc3NlZCB3aGVuIHRoaXMgbWV0aG9kXG5cdFx0Ly8gaXMgaW52b2tlZCB0aHJvdWdoIHRoZSBBUEkgYWZ0ZXIgaW5pdGlhbGl6YXRpb25cblx0XHRpZiggdHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnICkgZXh0ZW5kKCBjb25maWcsIG9wdGlvbnMgKTtcblxuXHRcdC8vIEZvcmNlIGxpbmVhciB0cmFuc2l0aW9uIGJhc2VkIG9uIGJyb3dzZXIgY2FwYWJpbGl0aWVzXG5cdFx0aWYoIGZlYXR1cmVzLnRyYW5zZm9ybXMzZCA9PT0gZmFsc2UgKSBjb25maWcudHJhbnNpdGlvbiA9ICdsaW5lYXInO1xuXG5cdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggY29uZmlnLnRyYW5zaXRpb24gKTtcblxuXHRcdGRvbS53cmFwcGVyLnNldEF0dHJpYnV0ZSggJ2RhdGEtdHJhbnNpdGlvbi1zcGVlZCcsIGNvbmZpZy50cmFuc2l0aW9uU3BlZWQgKTtcblx0XHRkb20ud3JhcHBlci5zZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbicsIGNvbmZpZy5iYWNrZ3JvdW5kVHJhbnNpdGlvbiApO1xuXG5cdFx0ZG9tLmNvbnRyb2xzLnN0eWxlLmRpc3BsYXkgPSBjb25maWcuY29udHJvbHMgPyAnYmxvY2snIDogJ25vbmUnO1xuXHRcdGRvbS5wcm9ncmVzcy5zdHlsZS5kaXNwbGF5ID0gY29uZmlnLnByb2dyZXNzID8gJ2Jsb2NrJyA6ICdub25lJztcblxuXHRcdGlmKCBjb25maWcuc2h1ZmZsZSApIHtcblx0XHRcdHNodWZmbGUoKTtcblx0XHR9XG5cblx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoICdydGwnICk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ3J0bCcgKTtcblx0XHR9XG5cblx0XHRpZiggY29uZmlnLmNlbnRlciApIHtcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoICdjZW50ZXInICk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ2NlbnRlcicgKTtcblx0XHR9XG5cblx0XHQvLyBFeGl0IHRoZSBwYXVzZWQgbW9kZSBpZiBpdCB3YXMgY29uZmlndXJlZCBvZmZcblx0XHRpZiggY29uZmlnLnBhdXNlID09PSBmYWxzZSApIHtcblx0XHRcdHJlc3VtZSgpO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcuc2hvd05vdGVzICkge1xuXHRcdFx0ZG9tLnNwZWFrZXJOb3Rlcy5jbGFzc0xpc3QuYWRkKCAndmlzaWJsZScgKTtcblx0XHRcdGRvbS5zcGVha2VyTm90ZXMuc2V0QXR0cmlidXRlKCAnZGF0YS1sYXlvdXQnLCB0eXBlb2YgY29uZmlnLnNob3dOb3RlcyA9PT0gJ3N0cmluZycgPyBjb25maWcuc2hvd05vdGVzIDogJ2lubGluZScgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRkb20uc3BlYWtlck5vdGVzLmNsYXNzTGlzdC5yZW1vdmUoICd2aXNpYmxlJyApO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcubW91c2VXaGVlbCApIHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdET01Nb3VzZVNjcm9sbCcsIG9uRG9jdW1lbnRNb3VzZVNjcm9sbCwgZmFsc2UgKTsgLy8gRkZcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZXdoZWVsJywgb25Eb2N1bWVudE1vdXNlU2Nyb2xsLCBmYWxzZSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdET01Nb3VzZVNjcm9sbCcsIG9uRG9jdW1lbnRNb3VzZVNjcm9sbCwgZmFsc2UgKTsgLy8gRkZcblx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdtb3VzZXdoZWVsJywgb25Eb2N1bWVudE1vdXNlU2Nyb2xsLCBmYWxzZSApO1xuXHRcdH1cblxuXHRcdC8vIFJvbGxpbmcgM0QgbGlua3Ncblx0XHRpZiggY29uZmlnLnJvbGxpbmdMaW5rcyApIHtcblx0XHRcdGVuYWJsZVJvbGxpbmdMaW5rcygpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGRpc2FibGVSb2xsaW5nTGlua3MoKTtcblx0XHR9XG5cblx0XHQvLyBJZnJhbWUgbGluayBwcmV2aWV3c1xuXHRcdGlmKCBjb25maWcucHJldmlld0xpbmtzICkge1xuXHRcdFx0ZW5hYmxlUHJldmlld0xpbmtzKCk7XG5cdFx0XHRkaXNhYmxlUHJldmlld0xpbmtzKCAnW2RhdGEtcHJldmlldy1saW5rPWZhbHNlXScgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRkaXNhYmxlUHJldmlld0xpbmtzKCk7XG5cdFx0XHRlbmFibGVQcmV2aWV3TGlua3MoICdbZGF0YS1wcmV2aWV3LWxpbmtdOm5vdChbZGF0YS1wcmV2aWV3LWxpbms9ZmFsc2VdKScgKTtcblx0XHR9XG5cblx0XHQvLyBSZW1vdmUgZXhpc3RpbmcgYXV0by1zbGlkZSBjb250cm9sc1xuXHRcdGlmKCBhdXRvU2xpZGVQbGF5ZXIgKSB7XG5cdFx0XHRhdXRvU2xpZGVQbGF5ZXIuZGVzdHJveSgpO1xuXHRcdFx0YXV0b1NsaWRlUGxheWVyID0gbnVsbDtcblx0XHR9XG5cblx0XHQvLyBHZW5lcmF0ZSBhdXRvLXNsaWRlIGNvbnRyb2xzIGlmIG5lZWRlZFxuXHRcdGlmKCBudW1iZXJPZlNsaWRlcyA+IDEgJiYgY29uZmlnLmF1dG9TbGlkZSAmJiBjb25maWcuYXV0b1NsaWRlU3RvcHBhYmxlICYmIGZlYXR1cmVzLmNhbnZhcyAmJiBmZWF0dXJlcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKSB7XG5cdFx0XHRhdXRvU2xpZGVQbGF5ZXIgPSBuZXcgUGxheWJhY2soIGRvbS53cmFwcGVyLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIE1hdGgubWluKCBNYXRoLm1heCggKCBEYXRlLm5vdygpIC0gYXV0b1NsaWRlU3RhcnRUaW1lICkgLyBhdXRvU2xpZGUsIDAgKSwgMSApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRhdXRvU2xpZGVQbGF5ZXIub24oICdjbGljaycsIG9uQXV0b1NsaWRlUGxheWVyQ2xpY2sgKTtcblx0XHRcdGF1dG9TbGlkZVBhdXNlZCA9IGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIFdoZW4gZnJhZ21lbnRzIGFyZSB0dXJuZWQgb2ZmIHRoZXkgc2hvdWxkIGJlIHZpc2libGVcblx0XHRpZiggY29uZmlnLmZyYWdtZW50cyA9PT0gZmFsc2UgKSB7XG5cdFx0XHR0b0FycmF5KCBkb20uc2xpZGVzLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCAndmlzaWJsZScgKTtcblx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAnY3VycmVudC1mcmFnbWVudCcgKTtcblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHQvLyBTbGlkZSBudW1iZXJzXG5cdFx0dmFyIHNsaWRlTnVtYmVyRGlzcGxheSA9ICdub25lJztcblx0XHRpZiggY29uZmlnLnNsaWRlTnVtYmVyICYmICFpc1ByaW50aW5nUERGKCkgKSB7XG5cdFx0XHRpZiggY29uZmlnLnNob3dTbGlkZU51bWJlciA9PT0gJ2FsbCcgKSB7XG5cdFx0XHRcdHNsaWRlTnVtYmVyRGlzcGxheSA9ICdibG9jayc7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKCBjb25maWcuc2hvd1NsaWRlTnVtYmVyID09PSAnc3BlYWtlcicgJiYgaXNTcGVha2VyTm90ZXMoKSApIHtcblx0XHRcdFx0c2xpZGVOdW1iZXJEaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRkb20uc2xpZGVOdW1iZXIuc3R5bGUuZGlzcGxheSA9IHNsaWRlTnVtYmVyRGlzcGxheTtcblxuXHRcdHN5bmMoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEJpbmRzIGFsbCBldmVudCBsaXN0ZW5lcnMuXG5cdCAqL1xuXHRmdW5jdGlvbiBhZGRFdmVudExpc3RlbmVycygpIHtcblxuXHRcdGV2ZW50c0FyZUJvdW5kID0gdHJ1ZTtcblxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnaGFzaGNoYW5nZScsIG9uV2luZG93SGFzaENoYW5nZSwgZmFsc2UgKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplLCBmYWxzZSApO1xuXG5cdFx0aWYoIGNvbmZpZy50b3VjaCApIHtcblx0XHRcdGRvbS53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0LCBmYWxzZSApO1xuXHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSApO1xuXHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UgKTtcblxuXHRcdFx0Ly8gU3VwcG9ydCBwb2ludGVyLXN0eWxlIHRvdWNoIGludGVyYWN0aW9uIGFzIHdlbGxcblx0XHRcdGlmKCB3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkICkge1xuXHRcdFx0XHQvLyBJRSAxMSB1c2VzIHVuLXByZWZpeGVkIHZlcnNpb24gb2YgcG9pbnRlciBldmVudHNcblx0XHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ3BvaW50ZXJkb3duJywgb25Qb2ludGVyRG93biwgZmFsc2UgKTtcblx0XHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ3BvaW50ZXJtb3ZlJywgb25Qb2ludGVyTW92ZSwgZmFsc2UgKTtcblx0XHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ3BvaW50ZXJ1cCcsIG9uUG9pbnRlclVwLCBmYWxzZSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiggd2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICkge1xuXHRcdFx0XHQvLyBJRSAxMCB1c2VzIHByZWZpeGVkIHZlcnNpb24gb2YgcG9pbnRlciBldmVudHNcblx0XHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ01TUG9pbnRlckRvd24nLCBvblBvaW50ZXJEb3duLCBmYWxzZSApO1xuXHRcdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAnTVNQb2ludGVyTW92ZScsIG9uUG9pbnRlck1vdmUsIGZhbHNlICk7XG5cdFx0XHRcdGRvbS53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoICdNU1BvaW50ZXJVcCcsIG9uUG9pbnRlclVwLCBmYWxzZSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKCBjb25maWcua2V5Ym9hcmQgKSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCAna2V5ZG93bicsIG9uRG9jdW1lbnRLZXlEb3duLCBmYWxzZSApO1xuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ2tleXByZXNzJywgb25Eb2N1bWVudEtleVByZXNzLCBmYWxzZSApO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcucHJvZ3Jlc3MgJiYgZG9tLnByb2dyZXNzICkge1xuXHRcdFx0ZG9tLnByb2dyZXNzLmFkZEV2ZW50TGlzdGVuZXIoICdjbGljaycsIG9uUHJvZ3Jlc3NDbGlja2VkLCBmYWxzZSApO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcuZm9jdXNCb2R5T25QYWdlVmlzaWJpbGl0eUNoYW5nZSApIHtcblx0XHRcdHZhciB2aXNpYmlsaXR5Q2hhbmdlO1xuXG5cdFx0XHRpZiggJ2hpZGRlbicgaW4gZG9jdW1lbnQgKSB7XG5cdFx0XHRcdHZpc2liaWxpdHlDaGFuZ2UgPSAndmlzaWJpbGl0eWNoYW5nZSc7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKCAnbXNIaWRkZW4nIGluIGRvY3VtZW50ICkge1xuXHRcdFx0XHR2aXNpYmlsaXR5Q2hhbmdlID0gJ21zdmlzaWJpbGl0eWNoYW5nZSc7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKCAnd2Via2l0SGlkZGVuJyBpbiBkb2N1bWVudCApIHtcblx0XHRcdFx0dmlzaWJpbGl0eUNoYW5nZSA9ICd3ZWJraXR2aXNpYmlsaXR5Y2hhbmdlJztcblx0XHRcdH1cblxuXHRcdFx0aWYoIHZpc2liaWxpdHlDaGFuZ2UgKSB7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoIHZpc2liaWxpdHlDaGFuZ2UsIG9uUGFnZVZpc2liaWxpdHlDaGFuZ2UsIGZhbHNlICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gTGlzdGVuIHRvIGJvdGggdG91Y2ggYW5kIGNsaWNrIGV2ZW50cywgaW4gY2FzZSB0aGUgZGV2aWNlXG5cdFx0Ly8gc3VwcG9ydHMgYm90aFxuXHRcdHZhciBwb2ludGVyRXZlbnRzID0gWyAndG91Y2hzdGFydCcsICdjbGljaycgXTtcblxuXHRcdC8vIE9ubHkgc3VwcG9ydCB0b3VjaCBmb3IgQW5kcm9pZCwgZml4ZXMgZG91YmxlIG5hdmlnYXRpb25zIGluXG5cdFx0Ly8gc3RvY2sgYnJvd3NlclxuXHRcdGlmKCBVQS5tYXRjaCggL2FuZHJvaWQvZ2kgKSApIHtcblx0XHRcdHBvaW50ZXJFdmVudHMgPSBbICd0b3VjaHN0YXJ0JyBdO1xuXHRcdH1cblxuXHRcdHBvaW50ZXJFdmVudHMuZm9yRWFjaCggZnVuY3Rpb24oIGV2ZW50TmFtZSApIHtcblx0XHRcdGRvbS5jb250cm9sc0xlZnQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5hZGRFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVMZWZ0Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzUmlnaHQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5hZGRFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVSaWdodENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc1VwLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuYWRkRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlVXBDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNEb3duLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuYWRkRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlRG93bkNsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc1ByZXYuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5hZGRFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVQcmV2Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzTmV4dC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZU5leHRDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogVW5iaW5kcyBhbGwgZXZlbnQgbGlzdGVuZXJzLlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKSB7XG5cblx0XHRldmVudHNBcmVCb3VuZCA9IGZhbHNlO1xuXG5cdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCBvbkRvY3VtZW50S2V5RG93biwgZmFsc2UgKTtcblx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAna2V5cHJlc3MnLCBvbkRvY3VtZW50S2V5UHJlc3MsIGZhbHNlICk7XG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdoYXNoY2hhbmdlJywgb25XaW5kb3dIYXNoQ2hhbmdlLCBmYWxzZSApO1xuXHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCAncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlICk7XG5cblx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UgKTtcblx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUsIGZhbHNlICk7XG5cdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UgKTtcblxuXHRcdC8vIElFMTFcblx0XHRpZiggd2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCApIHtcblx0XHRcdGRvbS53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdwb2ludGVyZG93bicsIG9uUG9pbnRlckRvd24sIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAncG9pbnRlcm1vdmUnLCBvblBvaW50ZXJNb3ZlLCBmYWxzZSApO1xuXHRcdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3BvaW50ZXJ1cCcsIG9uUG9pbnRlclVwLCBmYWxzZSApO1xuXHRcdH1cblx0XHQvLyBJRTEwXG5cdFx0ZWxzZSBpZiggd2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICkge1xuXHRcdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ01TUG9pbnRlckRvd24nLCBvblBvaW50ZXJEb3duLCBmYWxzZSApO1xuXHRcdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ01TUG9pbnRlck1vdmUnLCBvblBvaW50ZXJNb3ZlLCBmYWxzZSApO1xuXHRcdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ01TUG9pbnRlclVwJywgb25Qb2ludGVyVXAsIGZhbHNlICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBjb25maWcucHJvZ3Jlc3MgJiYgZG9tLnByb2dyZXNzICkge1xuXHRcdFx0ZG9tLnByb2dyZXNzLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdjbGljaycsIG9uUHJvZ3Jlc3NDbGlja2VkLCBmYWxzZSApO1xuXHRcdH1cblxuXHRcdFsgJ3RvdWNoc3RhcnQnLCAnY2xpY2snIF0uZm9yRWFjaCggZnVuY3Rpb24oIGV2ZW50TmFtZSApIHtcblx0XHRcdGRvbS5jb250cm9sc0xlZnQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVMZWZ0Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzUmlnaHQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVSaWdodENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc1VwLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlVXBDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNEb3duLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlRG93bkNsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc1ByZXYuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVQcmV2Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzTmV4dC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZU5leHRDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogRXh0ZW5kIG9iamVjdCBhIHdpdGggdGhlIHByb3BlcnRpZXMgb2Ygb2JqZWN0IGIuXG5cdCAqIElmIHRoZXJlJ3MgYSBjb25mbGljdCwgb2JqZWN0IGIgdGFrZXMgcHJlY2VkZW5jZS5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGFcblx0ICogQHBhcmFtIHtvYmplY3R9IGJcblx0ICovXG5cdGZ1bmN0aW9uIGV4dGVuZCggYSwgYiApIHtcblxuXHRcdGZvciggdmFyIGkgaW4gYiApIHtcblx0XHRcdGFbIGkgXSA9IGJbIGkgXTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyB0aGUgdGFyZ2V0IG9iamVjdCB0byBhbiBhcnJheS5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IG9cblx0ICogQHJldHVybiB7b2JqZWN0W119XG5cdCAqL1xuXHRmdW5jdGlvbiB0b0FycmF5KCBvICkge1xuXG5cdFx0cmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBvICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVdGlsaXR5IGZvciBkZXNlcmlhbGl6aW5nIGEgdmFsdWUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gdmFsdWVcblx0ICogQHJldHVybiB7Kn1cblx0ICovXG5cdGZ1bmN0aW9uIGRlc2VyaWFsaXplKCB2YWx1ZSApIHtcblxuXHRcdGlmKCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICkge1xuXHRcdFx0aWYoIHZhbHVlID09PSAnbnVsbCcgKSByZXR1cm4gbnVsbDtcblx0XHRcdGVsc2UgaWYoIHZhbHVlID09PSAndHJ1ZScgKSByZXR1cm4gdHJ1ZTtcblx0XHRcdGVsc2UgaWYoIHZhbHVlID09PSAnZmFsc2UnICkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0ZWxzZSBpZiggdmFsdWUubWF0Y2goIC9eW1xcZFxcLl0rJC8gKSApIHJldHVybiBwYXJzZUZsb2F0KCB2YWx1ZSApO1xuXHRcdH1cblxuXHRcdHJldHVybiB2YWx1ZTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIE1lYXN1cmVzIHRoZSBkaXN0YW5jZSBpbiBwaXhlbHMgYmV0d2VlbiBwb2ludCBhXG5cdCAqIGFuZCBwb2ludCBiLlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gYSBwb2ludCB3aXRoIHgveSBwcm9wZXJ0aWVzXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBiIHBvaW50IHdpdGggeC95IHByb3BlcnRpZXNcblx0ICpcblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0ZnVuY3Rpb24gZGlzdGFuY2VCZXR3ZWVuKCBhLCBiICkge1xuXG5cdFx0dmFyIGR4ID0gYS54IC0gYi54LFxuXHRcdFx0ZHkgPSBhLnkgLSBiLnk7XG5cblx0XHRyZXR1cm4gTWF0aC5zcXJ0KCBkeCpkeCArIGR5KmR5ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBsaWVzIGEgQ1NTIHRyYW5zZm9ybSB0byB0aGUgdGFyZ2V0IGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRyYW5zZm9ybVxuXHQgKi9cblx0ZnVuY3Rpb24gdHJhbnNmb3JtRWxlbWVudCggZWxlbWVudCwgdHJhbnNmb3JtICkge1xuXG5cdFx0ZWxlbWVudC5zdHlsZS5XZWJraXRUcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG5cdFx0ZWxlbWVudC5zdHlsZS5Nb3pUcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG5cdFx0ZWxlbWVudC5zdHlsZS5tc1RyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblx0XHRlbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEFwcGxpZXMgQ1NTIHRyYW5zZm9ybXMgdG8gdGhlIHNsaWRlcyBjb250YWluZXIuIFRoZSBjb250YWluZXJcblx0ICogaXMgdHJhbnNmb3JtZWQgZnJvbSB0d28gc2VwYXJhdGUgc291cmNlczogbGF5b3V0IGFuZCB0aGUgb3ZlcnZpZXdcblx0ICogbW9kZS5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IHRyYW5zZm9ybXNcblx0ICovXG5cdGZ1bmN0aW9uIHRyYW5zZm9ybVNsaWRlcyggdHJhbnNmb3JtcyApIHtcblxuXHRcdC8vIFBpY2sgdXAgbmV3IHRyYW5zZm9ybXMgZnJvbSBhcmd1bWVudHNcblx0XHRpZiggdHlwZW9mIHRyYW5zZm9ybXMubGF5b3V0ID09PSAnc3RyaW5nJyApIHNsaWRlc1RyYW5zZm9ybS5sYXlvdXQgPSB0cmFuc2Zvcm1zLmxheW91dDtcblx0XHRpZiggdHlwZW9mIHRyYW5zZm9ybXMub3ZlcnZpZXcgPT09ICdzdHJpbmcnICkgc2xpZGVzVHJhbnNmb3JtLm92ZXJ2aWV3ID0gdHJhbnNmb3Jtcy5vdmVydmlldztcblxuXHRcdC8vIEFwcGx5IHRoZSB0cmFuc2Zvcm1zIHRvIHRoZSBzbGlkZXMgY29udGFpbmVyXG5cdFx0aWYoIHNsaWRlc1RyYW5zZm9ybS5sYXlvdXQgKSB7XG5cdFx0XHR0cmFuc2Zvcm1FbGVtZW50KCBkb20uc2xpZGVzLCBzbGlkZXNUcmFuc2Zvcm0ubGF5b3V0ICsgJyAnICsgc2xpZGVzVHJhbnNmb3JtLm92ZXJ2aWV3ICk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dHJhbnNmb3JtRWxlbWVudCggZG9tLnNsaWRlcywgc2xpZGVzVHJhbnNmb3JtLm92ZXJ2aWV3ICk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogSW5qZWN0cyB0aGUgZ2l2ZW4gQ1NTIHN0eWxlcyBpbnRvIHRoZSBET00uXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuXHQgKi9cblx0ZnVuY3Rpb24gaW5qZWN0U3R5bGVTaGVldCggdmFsdWUgKSB7XG5cblx0XHR2YXIgdGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3N0eWxlJyApO1xuXHRcdHRhZy50eXBlID0gJ3RleHQvY3NzJztcblx0XHRpZiggdGFnLnN0eWxlU2hlZXQgKSB7XG5cdFx0XHR0YWcuc3R5bGVTaGVldC5jc3NUZXh0ID0gdmFsdWU7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGFnLmFwcGVuZENoaWxkKCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSggdmFsdWUgKSApO1xuXHRcdH1cblx0XHRkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSggJ2hlYWQnIClbMF0uYXBwZW5kQ2hpbGQoIHRhZyApO1xuXG5cdH1cblxuXHQvKipcblx0ICogRmluZCB0aGUgY2xvc2VzdCBwYXJlbnQgdGhhdCBtYXRjaGVzIHRoZSBnaXZlblxuXHQgKiBzZWxlY3Rvci5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IFRoZSBjaGlsZCBlbGVtZW50XG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBUaGUgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoXG5cdCAqIHRoZSBwYXJlbnRzIGFnYWluc3Rcblx0ICpcblx0ICogQHJldHVybiB7SFRNTEVsZW1lbnR9IFRoZSBtYXRjaGVkIHBhcmVudCBvciBudWxsXG5cdCAqIGlmIG5vIG1hdGNoaW5nIHBhcmVudCB3YXMgZm91bmRcblx0ICovXG5cdGZ1bmN0aW9uIGNsb3Nlc3RQYXJlbnQoIHRhcmdldCwgc2VsZWN0b3IgKSB7XG5cblx0XHR2YXIgcGFyZW50ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG5cblx0XHR3aGlsZSggcGFyZW50ICkge1xuXG5cdFx0XHQvLyBUaGVyZSdzIHNvbWUgb3ZlcmhlYWQgZG9pbmcgdGhpcyBlYWNoIHRpbWUsIHdlIGRvbid0XG5cdFx0XHQvLyB3YW50IHRvIHJld3JpdGUgdGhlIGVsZW1lbnQgcHJvdG90eXBlIGJ1dCBzaG91bGQgc3RpbGxcblx0XHRcdC8vIGJlIGVub3VnaCB0byBmZWF0dXJlIGRldGVjdCBvbmNlIGF0IHN0YXJ0dXAuLi5cblx0XHRcdHZhciBtYXRjaGVzTWV0aG9kID0gcGFyZW50Lm1hdGNoZXMgfHwgcGFyZW50Lm1hdGNoZXNTZWxlY3RvciB8fCBwYXJlbnQubXNNYXRjaGVzU2VsZWN0b3I7XG5cblx0XHRcdC8vIElmIHdlIGZpbmQgYSBtYXRjaCwgd2UncmUgYWxsIHNldFxuXHRcdFx0aWYoIG1hdGNoZXNNZXRob2QgJiYgbWF0Y2hlc01ldGhvZC5jYWxsKCBwYXJlbnQsIHNlbGVjdG9yICkgKSB7XG5cdFx0XHRcdHJldHVybiBwYXJlbnQ7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEtlZXAgc2VhcmNoaW5nXG5cdFx0XHRwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcblxuXHRcdH1cblxuXHRcdHJldHVybiBudWxsO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgdmFyaW91cyBjb2xvciBpbnB1dCBmb3JtYXRzIHRvIGFuIHtyOjAsZzowLGI6MH0gb2JqZWN0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIGNvbG9yXG5cdCAqIEBleGFtcGxlXG5cdCAqIGNvbG9yVG9SZ2IoJyMwMDAnKTtcblx0ICogQGV4YW1wbGVcblx0ICogY29sb3JUb1JnYignIzAwMDAwMCcpO1xuXHQgKiBAZXhhbXBsZVxuXHQgKiBjb2xvclRvUmdiKCdyZ2IoMCwwLDApJyk7XG5cdCAqIEBleGFtcGxlXG5cdCAqIGNvbG9yVG9SZ2IoJ3JnYmEoMCwwLDApJyk7XG5cdCAqXG5cdCAqIEByZXR1cm4ge3tyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBbYV06IG51bWJlcn18bnVsbH1cblx0ICovXG5cdGZ1bmN0aW9uIGNvbG9yVG9SZ2IoIGNvbG9yICkge1xuXG5cdFx0dmFyIGhleDMgPSBjb2xvci5tYXRjaCggL14jKFswLTlhLWZdezN9KSQvaSApO1xuXHRcdGlmKCBoZXgzICYmIGhleDNbMV0gKSB7XG5cdFx0XHRoZXgzID0gaGV4M1sxXTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHI6IHBhcnNlSW50KCBoZXgzLmNoYXJBdCggMCApLCAxNiApICogMHgxMSxcblx0XHRcdFx0ZzogcGFyc2VJbnQoIGhleDMuY2hhckF0KCAxICksIDE2ICkgKiAweDExLFxuXHRcdFx0XHRiOiBwYXJzZUludCggaGV4My5jaGFyQXQoIDIgKSwgMTYgKSAqIDB4MTFcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dmFyIGhleDYgPSBjb2xvci5tYXRjaCggL14jKFswLTlhLWZdezZ9KSQvaSApO1xuXHRcdGlmKCBoZXg2ICYmIGhleDZbMV0gKSB7XG5cdFx0XHRoZXg2ID0gaGV4NlsxXTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHI6IHBhcnNlSW50KCBoZXg2LnN1YnN0ciggMCwgMiApLCAxNiApLFxuXHRcdFx0XHRnOiBwYXJzZUludCggaGV4Ni5zdWJzdHIoIDIsIDIgKSwgMTYgKSxcblx0XHRcdFx0YjogcGFyc2VJbnQoIGhleDYuc3Vic3RyKCA0LCAyICksIDE2IClcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dmFyIHJnYiA9IGNvbG9yLm1hdGNoKCAvXnJnYlxccypcXChcXHMqKFxcZCspXFxzKixcXHMqKFxcZCspXFxzKixcXHMqKFxcZCspXFxzKlxcKSQvaSApO1xuXHRcdGlmKCByZ2IgKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRyOiBwYXJzZUludCggcmdiWzFdLCAxMCApLFxuXHRcdFx0XHRnOiBwYXJzZUludCggcmdiWzJdLCAxMCApLFxuXHRcdFx0XHRiOiBwYXJzZUludCggcmdiWzNdLCAxMCApXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHZhciByZ2JhID0gY29sb3IubWF0Y2goIC9ecmdiYVxccypcXChcXHMqKFxcZCspXFxzKixcXHMqKFxcZCspXFxzKixcXHMqKFxcZCspXFxzKlxcLFxccyooW1xcZF0rfFtcXGRdKi5bXFxkXSspXFxzKlxcKSQvaSApO1xuXHRcdGlmKCByZ2JhICkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cjogcGFyc2VJbnQoIHJnYmFbMV0sIDEwICksXG5cdFx0XHRcdGc6IHBhcnNlSW50KCByZ2JhWzJdLCAxMCApLFxuXHRcdFx0XHRiOiBwYXJzZUludCggcmdiYVszXSwgMTAgKSxcblx0XHRcdFx0YTogcGFyc2VGbG9hdCggcmdiYVs0XSApXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiBudWxsO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ2FsY3VsYXRlcyBicmlnaHRuZXNzIG9uIGEgc2NhbGUgb2YgMC0yNTUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciBTZWUgY29sb3JUb1JnYiBmb3Igc3VwcG9ydGVkIGZvcm1hdHMuXG5cdCAqIEBzZWUge0BsaW5rIGNvbG9yVG9SZ2J9XG5cdCAqL1xuXHRmdW5jdGlvbiBjb2xvckJyaWdodG5lc3MoIGNvbG9yICkge1xuXG5cdFx0aWYoIHR5cGVvZiBjb2xvciA9PT0gJ3N0cmluZycgKSBjb2xvciA9IGNvbG9yVG9SZ2IoIGNvbG9yICk7XG5cblx0XHRpZiggY29sb3IgKSB7XG5cdFx0XHRyZXR1cm4gKCBjb2xvci5yICogMjk5ICsgY29sb3IuZyAqIDU4NyArIGNvbG9yLmIgKiAxMTQgKSAvIDEwMDA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGw7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSByZW1haW5pbmcgaGVpZ2h0IHdpdGhpbiB0aGUgcGFyZW50IG9mIHRoZVxuXHQgKiB0YXJnZXQgZWxlbWVudC5cblx0ICpcblx0ICogcmVtYWluaW5nIGhlaWdodCA9IFsgY29uZmlndXJlZCBwYXJlbnQgaGVpZ2h0IF0gLSBbIGN1cnJlbnQgcGFyZW50IGhlaWdodCBdXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcblx0ICogQHBhcmFtIHtudW1iZXJ9IFtoZWlnaHRdXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRSZW1haW5pbmdIZWlnaHQoIGVsZW1lbnQsIGhlaWdodCApIHtcblxuXHRcdGhlaWdodCA9IGhlaWdodCB8fCAwO1xuXG5cdFx0aWYoIGVsZW1lbnQgKSB7XG5cdFx0XHR2YXIgbmV3SGVpZ2h0LCBvbGRIZWlnaHQgPSBlbGVtZW50LnN0eWxlLmhlaWdodDtcblxuXHRcdFx0Ly8gQ2hhbmdlIHRoZSAuc3RyZXRjaCBlbGVtZW50IGhlaWdodCB0byAwIGluIG9yZGVyIGZpbmQgdGhlIGhlaWdodCBvZiBhbGxcblx0XHRcdC8vIHRoZSBvdGhlciBlbGVtZW50c1xuXHRcdFx0ZWxlbWVudC5zdHlsZS5oZWlnaHQgPSAnMHB4Jztcblx0XHRcdG5ld0hlaWdodCA9IGhlaWdodCAtIGVsZW1lbnQucGFyZW50Tm9kZS5vZmZzZXRIZWlnaHQ7XG5cblx0XHRcdC8vIFJlc3RvcmUgdGhlIG9sZCBoZWlnaHQsIGp1c3QgaW4gY2FzZVxuXHRcdFx0ZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBvbGRIZWlnaHQgKyAncHgnO1xuXG5cdFx0XHRyZXR1cm4gbmV3SGVpZ2h0O1xuXHRcdH1cblxuXHRcdHJldHVybiBoZWlnaHQ7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgaWYgdGhpcyBpbnN0YW5jZSBpcyBiZWluZyB1c2VkIHRvIHByaW50IGEgUERGLlxuXHQgKi9cblx0ZnVuY3Rpb24gaXNQcmludGluZ1BERigpIHtcblxuXHRcdHJldHVybiAoIC9wcmludC1wZGYvZ2kgKS50ZXN0KCB3aW5kb3cubG9jYXRpb24uc2VhcmNoICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIaWRlcyB0aGUgYWRkcmVzcyBiYXIgaWYgd2UncmUgb24gYSBtb2JpbGUgZGV2aWNlLlxuXHQgKi9cblx0ZnVuY3Rpb24gaGlkZUFkZHJlc3NCYXIoKSB7XG5cblx0XHRpZiggY29uZmlnLmhpZGVBZGRyZXNzQmFyICYmIGlzTW9iaWxlRGV2aWNlICkge1xuXHRcdFx0Ly8gRXZlbnRzIHRoYXQgc2hvdWxkIHRyaWdnZXIgdGhlIGFkZHJlc3MgYmFyIHRvIGhpZGVcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIHJlbW92ZUFkZHJlc3NCYXIsIGZhbHNlICk7XG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ29yaWVudGF0aW9uY2hhbmdlJywgcmVtb3ZlQWRkcmVzc0JhciwgZmFsc2UgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDYXVzZXMgdGhlIGFkZHJlc3MgYmFyIHRvIGhpZGUgb24gbW9iaWxlIGRldmljZXMsXG5cdCAqIG1vcmUgdmVydGljYWwgc3BhY2UgZnR3LlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVtb3ZlQWRkcmVzc0JhcigpIHtcblxuXHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0d2luZG93LnNjcm9sbFRvKCAwLCAxICk7XG5cdFx0fSwgMTAgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIERpc3BhdGNoZXMgYW4gZXZlbnQgb2YgdGhlIHNwZWNpZmllZCB0eXBlIGZyb20gdGhlXG5cdCAqIHJldmVhbCBET00gZWxlbWVudC5cblx0ICovXG5cdGZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoIHR5cGUsIGFyZ3MgKSB7XG5cblx0XHR2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCggJ0hUTUxFdmVudHMnLCAxLCAyICk7XG5cdFx0ZXZlbnQuaW5pdEV2ZW50KCB0eXBlLCB0cnVlLCB0cnVlICk7XG5cdFx0ZXh0ZW5kKCBldmVudCwgYXJncyApO1xuXHRcdGRvbS53cmFwcGVyLmRpc3BhdGNoRXZlbnQoIGV2ZW50ICk7XG5cblx0XHQvLyBJZiB3ZSdyZSBpbiBhbiBpZnJhbWUsIHBvc3QgZWFjaCByZXZlYWwuanMgZXZlbnQgdG8gdGhlXG5cdFx0Ly8gcGFyZW50IHdpbmRvdy4gVXNlZCBieSB0aGUgbm90ZXMgcGx1Z2luXG5cdFx0aWYoIGNvbmZpZy5wb3N0TWVzc2FnZUV2ZW50cyAmJiB3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cuc2VsZiApIHtcblx0XHRcdHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UoIEpTT04uc3RyaW5naWZ5KHsgbmFtZXNwYWNlOiAncmV2ZWFsJywgZXZlbnROYW1lOiB0eXBlLCBzdGF0ZTogZ2V0U3RhdGUoKSB9KSwgJyonICk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogV3JhcCBhbGwgbGlua3MgaW4gM0QgZ29vZG5lc3MuXG5cdCAqL1xuXHRmdW5jdGlvbiBlbmFibGVSb2xsaW5nTGlua3MoKSB7XG5cblx0XHRpZiggZmVhdHVyZXMudHJhbnNmb3JtczNkICYmICEoICdtc1BlcnNwZWN0aXZlJyBpbiBkb2N1bWVudC5ib2R5LnN0eWxlICkgKSB7XG5cdFx0XHR2YXIgYW5jaG9ycyA9IGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIFNMSURFU19TRUxFQ1RPUiArICcgYScgKTtcblxuXHRcdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGFuY2hvcnMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHRcdHZhciBhbmNob3IgPSBhbmNob3JzW2ldO1xuXG5cdFx0XHRcdGlmKCBhbmNob3IudGV4dENvbnRlbnQgJiYgIWFuY2hvci5xdWVyeVNlbGVjdG9yKCAnKicgKSAmJiAoICFhbmNob3IuY2xhc3NOYW1lIHx8ICFhbmNob3IuY2xhc3NMaXN0LmNvbnRhaW5zKCBhbmNob3IsICdyb2xsJyApICkgKSB7XG5cdFx0XHRcdFx0dmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cdFx0XHRcdFx0c3Bhbi5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGl0bGUnLCBhbmNob3IudGV4dCk7XG5cdFx0XHRcdFx0c3Bhbi5pbm5lckhUTUwgPSBhbmNob3IuaW5uZXJIVE1MO1xuXG5cdFx0XHRcdFx0YW5jaG9yLmNsYXNzTGlzdC5hZGQoICdyb2xsJyApO1xuXHRcdFx0XHRcdGFuY2hvci5pbm5lckhUTUwgPSAnJztcblx0XHRcdFx0XHRhbmNob3IuYXBwZW5kQ2hpbGQoc3Bhbik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVbndyYXAgYWxsIDNEIGxpbmtzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGlzYWJsZVJvbGxpbmdMaW5rcygpIHtcblxuXHRcdHZhciBhbmNob3JzID0gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICsgJyBhLnJvbGwnICk7XG5cblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gYW5jaG9ycy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdHZhciBhbmNob3IgPSBhbmNob3JzW2ldO1xuXHRcdFx0dmFyIHNwYW4gPSBhbmNob3IucXVlcnlTZWxlY3RvciggJ3NwYW4nICk7XG5cblx0XHRcdGlmKCBzcGFuICkge1xuXHRcdFx0XHRhbmNob3IuY2xhc3NMaXN0LnJlbW92ZSggJ3JvbGwnICk7XG5cdFx0XHRcdGFuY2hvci5pbm5lckhUTUwgPSBzcGFuLmlubmVySFRNTDtcblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBCaW5kIHByZXZpZXcgZnJhbWUgbGlua3MuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBbc2VsZWN0b3I9YV0gLSBzZWxlY3RvciBmb3IgYW5jaG9yc1xuXHQgKi9cblx0ZnVuY3Rpb24gZW5hYmxlUHJldmlld0xpbmtzKCBzZWxlY3RvciApIHtcblxuXHRcdHZhciBhbmNob3JzID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggc2VsZWN0b3IgPyBzZWxlY3RvciA6ICdhJyApICk7XG5cblx0XHRhbmNob3JzLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0aWYoIC9eKGh0dHB8d3d3KS9naS50ZXN0KCBlbGVtZW50LmdldEF0dHJpYnV0ZSggJ2hyZWYnICkgKSApIHtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvblByZXZpZXdMaW5rQ2xpY2tlZCwgZmFsc2UgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVbmJpbmQgcHJldmlldyBmcmFtZSBsaW5rcy5cblx0ICovXG5cdGZ1bmN0aW9uIGRpc2FibGVQcmV2aWV3TGlua3MoIHNlbGVjdG9yICkge1xuXG5cdFx0dmFyIGFuY2hvcnMgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBzZWxlY3RvciA/IHNlbGVjdG9yIDogJ2EnICkgKTtcblxuXHRcdGFuY2hvcnMuZm9yRWFjaCggZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHRpZiggL14oaHR0cHx3d3cpL2dpLnRlc3QoIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnaHJlZicgKSApICkge1xuXHRcdFx0XHRlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdjbGljaycsIG9uUHJldmlld0xpbmtDbGlja2VkLCBmYWxzZSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIE9wZW5zIGEgcHJldmlldyB3aW5kb3cgZm9yIHRoZSB0YXJnZXQgVVJMLlxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gdXJsIGZvciBwcmV2aWV3IGlmcmFtZSBzcmNcblx0ICovXG5cdGZ1bmN0aW9uIHNob3dQcmV2aWV3KCB1cmwgKSB7XG5cblx0XHRjbG9zZU92ZXJsYXkoKTtcblxuXHRcdGRvbS5vdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHRkb20ub3ZlcmxheS5jbGFzc0xpc3QuYWRkKCAnb3ZlcmxheScgKTtcblx0XHRkb20ub3ZlcmxheS5jbGFzc0xpc3QuYWRkKCAnb3ZlcmxheS1wcmV2aWV3JyApO1xuXHRcdGRvbS53cmFwcGVyLmFwcGVuZENoaWxkKCBkb20ub3ZlcmxheSApO1xuXG5cdFx0ZG9tLm92ZXJsYXkuaW5uZXJIVE1MID0gW1xuXHRcdFx0JzxoZWFkZXI+Jyxcblx0XHRcdFx0JzxhIGNsYXNzPVwiY2xvc2VcIiBocmVmPVwiI1wiPjxzcGFuIGNsYXNzPVwiaWNvblwiPjwvc3Bhbj48L2E+Jyxcblx0XHRcdFx0JzxhIGNsYXNzPVwiZXh0ZXJuYWxcIiBocmVmPVwiJysgdXJsICsnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PHNwYW4gY2xhc3M9XCJpY29uXCI+PC9zcGFuPjwvYT4nLFxuXHRcdFx0JzwvaGVhZGVyPicsXG5cdFx0XHQnPGRpdiBjbGFzcz1cInNwaW5uZXJcIj48L2Rpdj4nLFxuXHRcdFx0JzxkaXYgY2xhc3M9XCJ2aWV3cG9ydFwiPicsXG5cdFx0XHRcdCc8aWZyYW1lIHNyYz1cIicrIHVybCArJ1wiPjwvaWZyYW1lPicsXG5cdFx0XHRcdCc8c21hbGwgY2xhc3M9XCJ2aWV3cG9ydC1pbm5lclwiPicsXG5cdFx0XHRcdFx0JzxzcGFuIGNsYXNzPVwieC1mcmFtZS1lcnJvclwiPlVuYWJsZSB0byBsb2FkIGlmcmFtZS4gVGhpcyBpcyBsaWtlbHkgZHVlIHRvIHRoZSBzaXRlXFwncyBwb2xpY3kgKHgtZnJhbWUtb3B0aW9ucykuPC9zcGFuPicsXG5cdFx0XHRcdCc8L3NtYWxsPicsXG5cdFx0XHQnPC9kaXY+J1xuXHRcdF0uam9pbignJyk7XG5cblx0XHRkb20ub3ZlcmxheS5xdWVyeVNlbGVjdG9yKCAnaWZyYW1lJyApLmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0ZG9tLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCggJ2xvYWRlZCcgKTtcblx0XHR9LCBmYWxzZSApO1xuXG5cdFx0ZG9tLm92ZXJsYXkucXVlcnlTZWxlY3RvciggJy5jbG9zZScgKS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRjbG9zZU92ZXJsYXkoKTtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fSwgZmFsc2UgKTtcblxuXHRcdGRvbS5vdmVybGF5LnF1ZXJ5U2VsZWN0b3IoICcuZXh0ZXJuYWwnICkuYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0Y2xvc2VPdmVybGF5KCk7XG5cdFx0fSwgZmFsc2UgKTtcblxuXHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZG9tLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCggJ3Zpc2libGUnICk7XG5cdFx0fSwgMSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogT3BlbiBvciBjbG9zZSBoZWxwIG92ZXJsYXkgd2luZG93LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IFtvdmVycmlkZV0gRmxhZyB3aGljaCBvdmVycmlkZXMgdGhlXG5cdCAqIHRvZ2dsZSBsb2dpYyBhbmQgZm9yY2libHkgc2V0cyB0aGUgZGVzaXJlZCBzdGF0ZS4gVHJ1ZSBtZWFuc1xuXHQgKiBoZWxwIGlzIG9wZW4sIGZhbHNlIG1lYW5zIGl0J3MgY2xvc2VkLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9nZ2xlSGVscCggb3ZlcnJpZGUgKXtcblxuXHRcdGlmKCB0eXBlb2Ygb3ZlcnJpZGUgPT09ICdib29sZWFuJyApIHtcblx0XHRcdG92ZXJyaWRlID8gc2hvd0hlbHAoKSA6IGNsb3NlT3ZlcmxheSgpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmKCBkb20ub3ZlcmxheSApIHtcblx0XHRcdFx0Y2xvc2VPdmVybGF5KCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0c2hvd0hlbHAoKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogT3BlbnMgYW4gb3ZlcmxheSB3aW5kb3cgd2l0aCBoZWxwIG1hdGVyaWFsLlxuXHQgKi9cblx0ZnVuY3Rpb24gc2hvd0hlbHAoKSB7XG5cblx0XHRpZiggY29uZmlnLmhlbHAgKSB7XG5cblx0XHRcdGNsb3NlT3ZlcmxheSgpO1xuXG5cdFx0XHRkb20ub3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdFx0XHRkb20ub3ZlcmxheS5jbGFzc0xpc3QuYWRkKCAnb3ZlcmxheScgKTtcblx0XHRcdGRvbS5vdmVybGF5LmNsYXNzTGlzdC5hZGQoICdvdmVybGF5LWhlbHAnICk7XG5cdFx0XHRkb20ud3JhcHBlci5hcHBlbmRDaGlsZCggZG9tLm92ZXJsYXkgKTtcblxuXHRcdFx0dmFyIGh0bWwgPSAnPHAgY2xhc3M9XCJ0aXRsZVwiPktleWJvYXJkIFNob3J0Y3V0czwvcD48YnIvPic7XG5cblx0XHRcdGh0bWwgKz0gJzx0YWJsZT48dGg+S0VZPC90aD48dGg+QUNUSU9OPC90aD4nO1xuXHRcdFx0Zm9yKCB2YXIga2V5IGluIGtleWJvYXJkU2hvcnRjdXRzICkge1xuXHRcdFx0XHRodG1sICs9ICc8dHI+PHRkPicgKyBrZXkgKyAnPC90ZD48dGQ+JyArIGtleWJvYXJkU2hvcnRjdXRzWyBrZXkgXSArICc8L3RkPjwvdHI+Jztcblx0XHRcdH1cblxuXHRcdFx0aHRtbCArPSAnPC90YWJsZT4nO1xuXG5cdFx0XHRkb20ub3ZlcmxheS5pbm5lckhUTUwgPSBbXG5cdFx0XHRcdCc8aGVhZGVyPicsXG5cdFx0XHRcdFx0JzxhIGNsYXNzPVwiY2xvc2VcIiBocmVmPVwiI1wiPjxzcGFuIGNsYXNzPVwiaWNvblwiPjwvc3Bhbj48L2E+Jyxcblx0XHRcdFx0JzwvaGVhZGVyPicsXG5cdFx0XHRcdCc8ZGl2IGNsYXNzPVwidmlld3BvcnRcIj4nLFxuXHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwidmlld3BvcnQtaW5uZXJcIj4nKyBodG1sICsnPC9kaXY+Jyxcblx0XHRcdFx0JzwvZGl2Pidcblx0XHRcdF0uam9pbignJyk7XG5cblx0XHRcdGRvbS5vdmVybGF5LnF1ZXJ5U2VsZWN0b3IoICcuY2xvc2UnICkuYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0XHRjbG9zZU92ZXJsYXkoKTtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH0sIGZhbHNlICk7XG5cblx0XHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRkb20ub3ZlcmxheS5jbGFzc0xpc3QuYWRkKCAndmlzaWJsZScgKTtcblx0XHRcdH0sIDEgKTtcblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENsb3NlcyBhbnkgY3VycmVudGx5IG9wZW4gb3ZlcmxheS5cblx0ICovXG5cdGZ1bmN0aW9uIGNsb3NlT3ZlcmxheSgpIHtcblxuXHRcdGlmKCBkb20ub3ZlcmxheSApIHtcblx0XHRcdGRvbS5vdmVybGF5LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoIGRvbS5vdmVybGF5ICk7XG5cdFx0XHRkb20ub3ZlcmxheSA9IG51bGw7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQXBwbGllcyBKYXZhU2NyaXB0LWNvbnRyb2xsZWQgbGF5b3V0IHJ1bGVzIHRvIHRoZVxuXHQgKiBwcmVzZW50YXRpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBsYXlvdXQoKSB7XG5cblx0XHRpZiggZG9tLndyYXBwZXIgJiYgIWlzUHJpbnRpbmdQREYoKSApIHtcblxuXHRcdFx0dmFyIHNpemUgPSBnZXRDb21wdXRlZFNsaWRlU2l6ZSgpO1xuXG5cdFx0XHQvLyBMYXlvdXQgdGhlIGNvbnRlbnRzIG9mIHRoZSBzbGlkZXNcblx0XHRcdGxheW91dFNsaWRlQ29udGVudHMoIGNvbmZpZy53aWR0aCwgY29uZmlnLmhlaWdodCApO1xuXG5cdFx0XHRkb20uc2xpZGVzLnN0eWxlLndpZHRoID0gc2l6ZS53aWR0aCArICdweCc7XG5cdFx0XHRkb20uc2xpZGVzLnN0eWxlLmhlaWdodCA9IHNpemUuaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0Ly8gRGV0ZXJtaW5lIHNjYWxlIG9mIGNvbnRlbnQgdG8gZml0IHdpdGhpbiBhdmFpbGFibGUgc3BhY2Vcblx0XHRcdHNjYWxlID0gTWF0aC5taW4oIHNpemUucHJlc2VudGF0aW9uV2lkdGggLyBzaXplLndpZHRoLCBzaXplLnByZXNlbnRhdGlvbkhlaWdodCAvIHNpemUuaGVpZ2h0ICk7XG5cblx0XHRcdC8vIFJlc3BlY3QgbWF4L21pbiBzY2FsZSBzZXR0aW5nc1xuXHRcdFx0c2NhbGUgPSBNYXRoLm1heCggc2NhbGUsIGNvbmZpZy5taW5TY2FsZSApO1xuXHRcdFx0c2NhbGUgPSBNYXRoLm1pbiggc2NhbGUsIGNvbmZpZy5tYXhTY2FsZSApO1xuXG5cdFx0XHQvLyBEb24ndCBhcHBseSBhbnkgc2NhbGluZyBzdHlsZXMgaWYgc2NhbGUgaXMgMVxuXHRcdFx0aWYoIHNjYWxlID09PSAxICkge1xuXHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLnpvb20gPSAnJztcblx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS5sZWZ0ID0gJyc7XG5cdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUudG9wID0gJyc7XG5cdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUuYm90dG9tID0gJyc7XG5cdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUucmlnaHQgPSAnJztcblx0XHRcdFx0dHJhbnNmb3JtU2xpZGVzKCB7IGxheW91dDogJycgfSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdC8vIFByZWZlciB6b29tIGZvciBzY2FsaW5nIHVwIHNvIHRoYXQgY29udGVudCByZW1haW5zIGNyaXNwLlxuXHRcdFx0XHQvLyBEb24ndCB1c2Ugem9vbSB0byBzY2FsZSBkb3duIHNpbmNlIHRoYXQgY2FuIGxlYWQgdG8gc2hpZnRzXG5cdFx0XHRcdC8vIGluIHRleHQgbGF5b3V0L2xpbmUgYnJlYWtzLlxuXHRcdFx0XHRpZiggc2NhbGUgPiAxICYmIGZlYXR1cmVzLnpvb20gKSB7XG5cdFx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS56b29tID0gc2NhbGU7XG5cdFx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS5sZWZ0ID0gJyc7XG5cdFx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS50b3AgPSAnJztcblx0XHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLmJvdHRvbSA9ICcnO1xuXHRcdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUucmlnaHQgPSAnJztcblx0XHRcdFx0XHR0cmFuc2Zvcm1TbGlkZXMoIHsgbGF5b3V0OiAnJyB9ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gQXBwbHkgc2NhbGUgdHJhbnNmb3JtIGFzIGEgZmFsbGJhY2tcblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS56b29tID0gJyc7XG5cdFx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS5sZWZ0ID0gJzUwJSc7XG5cdFx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS50b3AgPSAnNTAlJztcblx0XHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLmJvdHRvbSA9ICdhdXRvJztcblx0XHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLnJpZ2h0ID0gJ2F1dG8nO1xuXHRcdFx0XHRcdHRyYW5zZm9ybVNsaWRlcyggeyBsYXlvdXQ6ICd0cmFuc2xhdGUoLTUwJSwgLTUwJSkgc2NhbGUoJysgc2NhbGUgKycpJyB9ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gU2VsZWN0IGFsbCBzbGlkZXMsIHZlcnRpY2FsIGFuZCBob3Jpem9udGFsXG5cdFx0XHR2YXIgc2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICkgKTtcblxuXHRcdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IHNsaWRlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdFx0dmFyIHNsaWRlID0gc2xpZGVzWyBpIF07XG5cblx0XHRcdFx0Ly8gRG9uJ3QgYm90aGVyIHVwZGF0aW5nIGludmlzaWJsZSBzbGlkZXNcblx0XHRcdFx0aWYoIHNsaWRlLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJyApIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCBjb25maWcuY2VudGVyIHx8IHNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ2NlbnRlcicgKSApIHtcblx0XHRcdFx0XHQvLyBWZXJ0aWNhbCBzdGFja3MgYXJlIG5vdCBjZW50cmVkIHNpbmNlIHRoZWlyIHNlY3Rpb25cblx0XHRcdFx0XHQvLyBjaGlsZHJlbiB3aWxsIGJlXG5cdFx0XHRcdFx0aWYoIHNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ3N0YWNrJyApICkge1xuXHRcdFx0XHRcdFx0c2xpZGUuc3R5bGUudG9wID0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRzbGlkZS5zdHlsZS50b3AgPSBNYXRoLm1heCggKCBzaXplLmhlaWdodCAtIHNsaWRlLnNjcm9sbEhlaWdodCApIC8gMiwgMCApICsgJ3B4Jztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0c2xpZGUuc3R5bGUudG9wID0gJyc7XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXG5cdFx0XHR1cGRhdGVQcm9ncmVzcygpO1xuXHRcdFx0dXBkYXRlUGFyYWxsYXgoKTtcblxuXHRcdFx0aWYoIGlzT3ZlcnZpZXcoKSApIHtcblx0XHRcdFx0dXBkYXRlT3ZlcnZpZXcoKTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEFwcGxpZXMgbGF5b3V0IGxvZ2ljIHRvIHRoZSBjb250ZW50cyBvZiBhbGwgc2xpZGVzIGluXG5cdCAqIHRoZSBwcmVzZW50YXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gd2lkdGhcblx0ICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBoZWlnaHRcblx0ICovXG5cdGZ1bmN0aW9uIGxheW91dFNsaWRlQ29udGVudHMoIHdpZHRoLCBoZWlnaHQgKSB7XG5cblx0XHQvLyBIYW5kbGUgc2l6aW5nIG9mIGVsZW1lbnRzIHdpdGggdGhlICdzdHJldGNoJyBjbGFzc1xuXHRcdHRvQXJyYXkoIGRvbS5zbGlkZXMucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24gPiAuc3RyZXRjaCcgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXG5cdFx0XHQvLyBEZXRlcm1pbmUgaG93IG11Y2ggdmVydGljYWwgc3BhY2Ugd2UgY2FuIHVzZVxuXHRcdFx0dmFyIHJlbWFpbmluZ0hlaWdodCA9IGdldFJlbWFpbmluZ0hlaWdodCggZWxlbWVudCwgaGVpZ2h0ICk7XG5cblx0XHRcdC8vIENvbnNpZGVyIHRoZSBhc3BlY3QgcmF0aW8gb2YgbWVkaWEgZWxlbWVudHNcblx0XHRcdGlmKCAvKGltZ3x2aWRlbykvZ2kudGVzdCggZWxlbWVudC5ub2RlTmFtZSApICkge1xuXHRcdFx0XHR2YXIgbncgPSBlbGVtZW50Lm5hdHVyYWxXaWR0aCB8fCBlbGVtZW50LnZpZGVvV2lkdGgsXG5cdFx0XHRcdFx0bmggPSBlbGVtZW50Lm5hdHVyYWxIZWlnaHQgfHwgZWxlbWVudC52aWRlb0hlaWdodDtcblxuXHRcdFx0XHR2YXIgZXMgPSBNYXRoLm1pbiggd2lkdGggLyBudywgcmVtYWluaW5nSGVpZ2h0IC8gbmggKTtcblxuXHRcdFx0XHRlbGVtZW50LnN0eWxlLndpZHRoID0gKCBudyAqIGVzICkgKyAncHgnO1xuXHRcdFx0XHRlbGVtZW50LnN0eWxlLmhlaWdodCA9ICggbmggKiBlcyApICsgJ3B4JztcblxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG5cdFx0XHRcdGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gcmVtYWluaW5nSGVpZ2h0ICsgJ3B4Jztcblx0XHRcdH1cblxuXHRcdH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGN1bGF0ZXMgdGhlIGNvbXB1dGVkIHBpeGVsIHNpemUgb2Ygb3VyIHNsaWRlcy4gVGhlc2Vcblx0ICogdmFsdWVzIGFyZSBiYXNlZCBvbiB0aGUgd2lkdGggYW5kIGhlaWdodCBjb25maWd1cmF0aW9uXG5cdCAqIG9wdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBbcHJlc2VudGF0aW9uV2lkdGg9ZG9tLndyYXBwZXIub2Zmc2V0V2lkdGhdXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBbcHJlc2VudGF0aW9uSGVpZ2h0PWRvbS53cmFwcGVyLm9mZnNldEhlaWdodF1cblx0ICovXG5cdGZ1bmN0aW9uIGdldENvbXB1dGVkU2xpZGVTaXplKCBwcmVzZW50YXRpb25XaWR0aCwgcHJlc2VudGF0aW9uSGVpZ2h0ICkge1xuXG5cdFx0dmFyIHNpemUgPSB7XG5cdFx0XHQvLyBTbGlkZSBzaXplXG5cdFx0XHR3aWR0aDogY29uZmlnLndpZHRoLFxuXHRcdFx0aGVpZ2h0OiBjb25maWcuaGVpZ2h0LFxuXG5cdFx0XHQvLyBQcmVzZW50YXRpb24gc2l6ZVxuXHRcdFx0cHJlc2VudGF0aW9uV2lkdGg6IHByZXNlbnRhdGlvbldpZHRoIHx8IGRvbS53cmFwcGVyLm9mZnNldFdpZHRoLFxuXHRcdFx0cHJlc2VudGF0aW9uSGVpZ2h0OiBwcmVzZW50YXRpb25IZWlnaHQgfHwgZG9tLndyYXBwZXIub2Zmc2V0SGVpZ2h0XG5cdFx0fTtcblxuXHRcdC8vIFJlZHVjZSBhdmFpbGFibGUgc3BhY2UgYnkgbWFyZ2luXG5cdFx0c2l6ZS5wcmVzZW50YXRpb25XaWR0aCAtPSAoIHNpemUucHJlc2VudGF0aW9uV2lkdGggKiBjb25maWcubWFyZ2luICk7XG5cdFx0c2l6ZS5wcmVzZW50YXRpb25IZWlnaHQgLT0gKCBzaXplLnByZXNlbnRhdGlvbkhlaWdodCAqIGNvbmZpZy5tYXJnaW4gKTtcblxuXHRcdC8vIFNsaWRlIHdpZHRoIG1heSBiZSBhIHBlcmNlbnRhZ2Ugb2YgYXZhaWxhYmxlIHdpZHRoXG5cdFx0aWYoIHR5cGVvZiBzaXplLndpZHRoID09PSAnc3RyaW5nJyAmJiAvJSQvLnRlc3QoIHNpemUud2lkdGggKSApIHtcblx0XHRcdHNpemUud2lkdGggPSBwYXJzZUludCggc2l6ZS53aWR0aCwgMTAgKSAvIDEwMCAqIHNpemUucHJlc2VudGF0aW9uV2lkdGg7XG5cdFx0fVxuXG5cdFx0Ly8gU2xpZGUgaGVpZ2h0IG1heSBiZSBhIHBlcmNlbnRhZ2Ugb2YgYXZhaWxhYmxlIGhlaWdodFxuXHRcdGlmKCB0eXBlb2Ygc2l6ZS5oZWlnaHQgPT09ICdzdHJpbmcnICYmIC8lJC8udGVzdCggc2l6ZS5oZWlnaHQgKSApIHtcblx0XHRcdHNpemUuaGVpZ2h0ID0gcGFyc2VJbnQoIHNpemUuaGVpZ2h0LCAxMCApIC8gMTAwICogc2l6ZS5wcmVzZW50YXRpb25IZWlnaHQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNpemU7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTdG9yZXMgdGhlIHZlcnRpY2FsIGluZGV4IG9mIGEgc3RhY2sgc28gdGhhdCB0aGUgc2FtZVxuXHQgKiB2ZXJ0aWNhbCBzbGlkZSBjYW4gYmUgc2VsZWN0ZWQgd2hlbiBuYXZpZ2F0aW5nIHRvIGFuZFxuXHQgKiBmcm9tIHRoZSBzdGFjay5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gc3RhY2sgVGhlIHZlcnRpY2FsIHN0YWNrIGVsZW1lbnRcblx0ICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbdj0wXSBJbmRleCB0byBtZW1vcml6ZVxuXHQgKi9cblx0ZnVuY3Rpb24gc2V0UHJldmlvdXNWZXJ0aWNhbEluZGV4KCBzdGFjaywgdiApIHtcblxuXHRcdGlmKCB0eXBlb2Ygc3RhY2sgPT09ICdvYmplY3QnICYmIHR5cGVvZiBzdGFjay5zZXRBdHRyaWJ1dGUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRzdGFjay5zZXRBdHRyaWJ1dGUoICdkYXRhLXByZXZpb3VzLWluZGV4dicsIHYgfHwgMCApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgdmVydGljYWwgaW5kZXggd2hpY2ggd2FzIHN0b3JlZCB1c2luZ1xuXHQgKiAjc2V0UHJldmlvdXNWZXJ0aWNhbEluZGV4KCkgb3IgMCBpZiBubyBwcmV2aW91cyBpbmRleFxuXHQgKiBleGlzdHMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHN0YWNrIFRoZSB2ZXJ0aWNhbCBzdGFjayBlbGVtZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIHN0YWNrICkge1xuXG5cdFx0aWYoIHR5cGVvZiBzdGFjayA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHN0YWNrLnNldEF0dHJpYnV0ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBzdGFjay5jbGFzc0xpc3QuY29udGFpbnMoICdzdGFjaycgKSApIHtcblx0XHRcdC8vIFByZWZlciBtYW51YWxseSBkZWZpbmVkIHN0YXJ0LWluZGV4dlxuXHRcdFx0dmFyIGF0dHJpYnV0ZU5hbWUgPSBzdGFjay5oYXNBdHRyaWJ1dGUoICdkYXRhLXN0YXJ0LWluZGV4dicgKSA/ICdkYXRhLXN0YXJ0LWluZGV4dicgOiAnZGF0YS1wcmV2aW91cy1pbmRleHYnO1xuXG5cdFx0XHRyZXR1cm4gcGFyc2VJbnQoIHN0YWNrLmdldEF0dHJpYnV0ZSggYXR0cmlidXRlTmFtZSApIHx8IDAsIDEwICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIDA7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBEaXNwbGF5cyB0aGUgb3ZlcnZpZXcgb2Ygc2xpZGVzIChxdWljayBuYXYpIGJ5IHNjYWxpbmdcblx0ICogZG93biBhbmQgYXJyYW5naW5nIGFsbCBzbGlkZSBlbGVtZW50cy5cblx0ICovXG5cdGZ1bmN0aW9uIGFjdGl2YXRlT3ZlcnZpZXcoKSB7XG5cblx0XHQvLyBPbmx5IHByb2NlZWQgaWYgZW5hYmxlZCBpbiBjb25maWdcblx0XHRpZiggY29uZmlnLm92ZXJ2aWV3ICYmICFpc092ZXJ2aWV3KCkgKSB7XG5cblx0XHRcdG92ZXJ2aWV3ID0gdHJ1ZTtcblxuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ292ZXJ2aWV3JyApO1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ292ZXJ2aWV3LWRlYWN0aXZhdGluZycgKTtcblxuXHRcdFx0aWYoIGZlYXR1cmVzLm92ZXJ2aWV3VHJhbnNpdGlvbnMgKSB7XG5cdFx0XHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoICdvdmVydmlldy1hbmltYXRlZCcgKTtcblx0XHRcdFx0fSwgMSApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBEb24ndCBhdXRvLXNsaWRlIHdoaWxlIGluIG92ZXJ2aWV3IG1vZGVcblx0XHRcdGNhbmNlbEF1dG9TbGlkZSgpO1xuXG5cdFx0XHQvLyBNb3ZlIHRoZSBiYWNrZ3JvdW5kcyBlbGVtZW50IGludG8gdGhlIHNsaWRlIGNvbnRhaW5lciB0b1xuXHRcdFx0Ly8gdGhhdCB0aGUgc2FtZSBzY2FsaW5nIGlzIGFwcGxpZWRcblx0XHRcdGRvbS5zbGlkZXMuYXBwZW5kQ2hpbGQoIGRvbS5iYWNrZ3JvdW5kICk7XG5cblx0XHRcdC8vIENsaWNraW5nIG9uIGFuIG92ZXJ2aWV3IHNsaWRlIG5hdmlnYXRlcyB0byBpdFxuXHRcdFx0dG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggc2xpZGUgKSB7XG5cdFx0XHRcdGlmKCAhc2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAnc3RhY2snICkgKSB7XG5cdFx0XHRcdFx0c2xpZGUuYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgb25PdmVydmlld1NsaWRlQ2xpY2tlZCwgdHJ1ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIENhbGN1bGF0ZSBzbGlkZSBzaXplc1xuXHRcdFx0dmFyIG1hcmdpbiA9IDcwO1xuXHRcdFx0dmFyIHNsaWRlU2l6ZSA9IGdldENvbXB1dGVkU2xpZGVTaXplKCk7XG5cdFx0XHRvdmVydmlld1NsaWRlV2lkdGggPSBzbGlkZVNpemUud2lkdGggKyBtYXJnaW47XG5cdFx0XHRvdmVydmlld1NsaWRlSGVpZ2h0ID0gc2xpZGVTaXplLmhlaWdodCArIG1hcmdpbjtcblxuXHRcdFx0Ly8gUmV2ZXJzZSBpbiBSVEwgbW9kZVxuXHRcdFx0aWYoIGNvbmZpZy5ydGwgKSB7XG5cdFx0XHRcdG92ZXJ2aWV3U2xpZGVXaWR0aCA9IC1vdmVydmlld1NsaWRlV2lkdGg7XG5cdFx0XHR9XG5cblx0XHRcdHVwZGF0ZVNsaWRlc1Zpc2liaWxpdHkoKTtcblx0XHRcdGxheW91dE92ZXJ2aWV3KCk7XG5cdFx0XHR1cGRhdGVPdmVydmlldygpO1xuXG5cdFx0XHRsYXlvdXQoKTtcblxuXHRcdFx0Ly8gTm90aWZ5IG9ic2VydmVycyBvZiB0aGUgb3ZlcnZpZXcgc2hvd2luZ1xuXHRcdFx0ZGlzcGF0Y2hFdmVudCggJ292ZXJ2aWV3c2hvd24nLCB7XG5cdFx0XHRcdCdpbmRleGgnOiBpbmRleGgsXG5cdFx0XHRcdCdpbmRleHYnOiBpbmRleHYsXG5cdFx0XHRcdCdjdXJyZW50U2xpZGUnOiBjdXJyZW50U2xpZGVcblx0XHRcdH0gKTtcblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFVzZXMgQ1NTIHRyYW5zZm9ybXMgdG8gcG9zaXRpb24gYWxsIHNsaWRlcyBpbiBhIGdyaWQgZm9yXG5cdCAqIGRpc3BsYXkgaW5zaWRlIG9mIHRoZSBvdmVydmlldyBtb2RlLlxuXHQgKi9cblx0ZnVuY3Rpb24gbGF5b3V0T3ZlcnZpZXcoKSB7XG5cblx0XHQvLyBMYXlvdXQgc2xpZGVzXG5cdFx0dG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBoc2xpZGUsIGggKSB7XG5cdFx0XHRoc2xpZGUuc2V0QXR0cmlidXRlKCAnZGF0YS1pbmRleC1oJywgaCApO1xuXHRcdFx0dHJhbnNmb3JtRWxlbWVudCggaHNsaWRlLCAndHJhbnNsYXRlM2QoJyArICggaCAqIG92ZXJ2aWV3U2xpZGVXaWR0aCApICsgJ3B4LCAwLCAwKScgKTtcblxuXHRcdFx0aWYoIGhzbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoICdzdGFjaycgKSApIHtcblxuXHRcdFx0XHR0b0FycmF5KCBoc2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggdnNsaWRlLCB2ICkge1xuXHRcdFx0XHRcdHZzbGlkZS5zZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LWgnLCBoICk7XG5cdFx0XHRcdFx0dnNsaWRlLnNldEF0dHJpYnV0ZSggJ2RhdGEtaW5kZXgtdicsIHYgKTtcblxuXHRcdFx0XHRcdHRyYW5zZm9ybUVsZW1lbnQoIHZzbGlkZSwgJ3RyYW5zbGF0ZTNkKDAsICcgKyAoIHYgKiBvdmVydmlld1NsaWRlSGVpZ2h0ICkgKyAncHgsIDApJyApO1xuXHRcdFx0XHR9ICk7XG5cblx0XHRcdH1cblx0XHR9ICk7XG5cblx0XHQvLyBMYXlvdXQgc2xpZGUgYmFja2dyb3VuZHNcblx0XHR0b0FycmF5KCBkb20uYmFja2dyb3VuZC5jaGlsZE5vZGVzICkuZm9yRWFjaCggZnVuY3Rpb24oIGhiYWNrZ3JvdW5kLCBoICkge1xuXHRcdFx0dHJhbnNmb3JtRWxlbWVudCggaGJhY2tncm91bmQsICd0cmFuc2xhdGUzZCgnICsgKCBoICogb3ZlcnZpZXdTbGlkZVdpZHRoICkgKyAncHgsIDAsIDApJyApO1xuXG5cdFx0XHR0b0FycmF5KCBoYmFja2dyb3VuZC5xdWVyeVNlbGVjdG9yQWxsKCAnLnNsaWRlLWJhY2tncm91bmQnICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggdmJhY2tncm91bmQsIHYgKSB7XG5cdFx0XHRcdHRyYW5zZm9ybUVsZW1lbnQoIHZiYWNrZ3JvdW5kLCAndHJhbnNsYXRlM2QoMCwgJyArICggdiAqIG92ZXJ2aWV3U2xpZGVIZWlnaHQgKSArICdweCwgMCknICk7XG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogTW92ZXMgdGhlIG92ZXJ2aWV3IHZpZXdwb3J0IHRvIHRoZSBjdXJyZW50IHNsaWRlcy5cblx0ICogQ2FsbGVkIGVhY2ggdGltZSB0aGUgY3VycmVudCBzbGlkZSBjaGFuZ2VzLlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlT3ZlcnZpZXcoKSB7XG5cblx0XHR2YXIgdm1pbiA9IE1hdGgubWluKCB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0ICk7XG5cdFx0dmFyIHNjYWxlID0gTWF0aC5tYXgoIHZtaW4gLyA1LCAxNTAgKSAvIHZtaW47XG5cblx0XHR0cmFuc2Zvcm1TbGlkZXMoIHtcblx0XHRcdG92ZXJ2aWV3OiBbXG5cdFx0XHRcdCdzY2FsZSgnKyBzY2FsZSArJyknLFxuXHRcdFx0XHQndHJhbnNsYXRlWCgnKyAoIC1pbmRleGggKiBvdmVydmlld1NsaWRlV2lkdGggKSArJ3B4KScsXG5cdFx0XHRcdCd0cmFuc2xhdGVZKCcrICggLWluZGV4diAqIG92ZXJ2aWV3U2xpZGVIZWlnaHQgKSArJ3B4KSdcblx0XHRcdF0uam9pbiggJyAnIClcblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFeGl0cyB0aGUgc2xpZGUgb3ZlcnZpZXcgYW5kIGVudGVycyB0aGUgY3VycmVudGx5XG5cdCAqIGFjdGl2ZSBzbGlkZS5cblx0ICovXG5cdGZ1bmN0aW9uIGRlYWN0aXZhdGVPdmVydmlldygpIHtcblxuXHRcdC8vIE9ubHkgcHJvY2VlZCBpZiBlbmFibGVkIGluIGNvbmZpZ1xuXHRcdGlmKCBjb25maWcub3ZlcnZpZXcgKSB7XG5cblx0XHRcdG92ZXJ2aWV3ID0gZmFsc2U7XG5cblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoICdvdmVydmlldycgKTtcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoICdvdmVydmlldy1hbmltYXRlZCcgKTtcblxuXHRcdFx0Ly8gVGVtcG9yYXJpbHkgYWRkIGEgY2xhc3Mgc28gdGhhdCB0cmFuc2l0aW9ucyBjYW4gZG8gZGlmZmVyZW50IHRoaW5nc1xuXHRcdFx0Ly8gZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhleSBhcmUgZXhpdGluZy9lbnRlcmluZyBvdmVydmlldywgb3IganVzdFxuXHRcdFx0Ly8gbW92aW5nIGZyb20gc2xpZGUgdG8gc2xpZGVcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoICdvdmVydmlldy1kZWFjdGl2YXRpbmcnICk7XG5cblx0XHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ292ZXJ2aWV3LWRlYWN0aXZhdGluZycgKTtcblx0XHRcdH0sIDEgKTtcblxuXHRcdFx0Ly8gTW92ZSB0aGUgYmFja2dyb3VuZCBlbGVtZW50IGJhY2sgb3V0XG5cdFx0XHRkb20ud3JhcHBlci5hcHBlbmRDaGlsZCggZG9tLmJhY2tncm91bmQgKTtcblxuXHRcdFx0Ly8gQ2xlYW4gdXAgY2hhbmdlcyBtYWRlIHRvIHNsaWRlc1xuXHRcdFx0dG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggc2xpZGUgKSB7XG5cdFx0XHRcdHRyYW5zZm9ybUVsZW1lbnQoIHNsaWRlLCAnJyApO1xuXG5cdFx0XHRcdHNsaWRlLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdjbGljaycsIG9uT3ZlcnZpZXdTbGlkZUNsaWNrZWQsIHRydWUgKTtcblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gQ2xlYW4gdXAgY2hhbmdlcyBtYWRlIHRvIGJhY2tncm91bmRzXG5cdFx0XHR0b0FycmF5KCBkb20uYmFja2dyb3VuZC5xdWVyeVNlbGVjdG9yQWxsKCAnLnNsaWRlLWJhY2tncm91bmQnICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggYmFja2dyb3VuZCApIHtcblx0XHRcdFx0dHJhbnNmb3JtRWxlbWVudCggYmFja2dyb3VuZCwgJycgKTtcblx0XHRcdH0gKTtcblxuXHRcdFx0dHJhbnNmb3JtU2xpZGVzKCB7IG92ZXJ2aWV3OiAnJyB9ICk7XG5cblx0XHRcdHNsaWRlKCBpbmRleGgsIGluZGV4diApO1xuXG5cdFx0XHRsYXlvdXQoKTtcblxuXHRcdFx0Y3VlQXV0b1NsaWRlKCk7XG5cblx0XHRcdC8vIE5vdGlmeSBvYnNlcnZlcnMgb2YgdGhlIG92ZXJ2aWV3IGhpZGluZ1xuXHRcdFx0ZGlzcGF0Y2hFdmVudCggJ292ZXJ2aWV3aGlkZGVuJywge1xuXHRcdFx0XHQnaW5kZXhoJzogaW5kZXhoLFxuXHRcdFx0XHQnaW5kZXh2JzogaW5kZXh2LFxuXHRcdFx0XHQnY3VycmVudFNsaWRlJzogY3VycmVudFNsaWRlXG5cdFx0XHR9ICk7XG5cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogVG9nZ2xlcyB0aGUgc2xpZGUgb3ZlcnZpZXcgbW9kZSBvbiBhbmQgb2ZmLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IFtvdmVycmlkZV0gRmxhZyB3aGljaCBvdmVycmlkZXMgdGhlXG5cdCAqIHRvZ2dsZSBsb2dpYyBhbmQgZm9yY2libHkgc2V0cyB0aGUgZGVzaXJlZCBzdGF0ZS4gVHJ1ZSBtZWFuc1xuXHQgKiBvdmVydmlldyBpcyBvcGVuLCBmYWxzZSBtZWFucyBpdCdzIGNsb3NlZC5cblx0ICovXG5cdGZ1bmN0aW9uIHRvZ2dsZU92ZXJ2aWV3KCBvdmVycmlkZSApIHtcblxuXHRcdGlmKCB0eXBlb2Ygb3ZlcnJpZGUgPT09ICdib29sZWFuJyApIHtcblx0XHRcdG92ZXJyaWRlID8gYWN0aXZhdGVPdmVydmlldygpIDogZGVhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aXNPdmVydmlldygpID8gZGVhY3RpdmF0ZU92ZXJ2aWV3KCkgOiBhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIHRoZSBvdmVydmlldyBpcyBjdXJyZW50bHkgYWN0aXZlLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIHRoZSBvdmVydmlldyBpcyBhY3RpdmUsXG5cdCAqIGZhbHNlIG90aGVyd2lzZVxuXHQgKi9cblx0ZnVuY3Rpb24gaXNPdmVydmlldygpIHtcblxuXHRcdHJldHVybiBvdmVydmlldztcblxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiB0aGUgY3VycmVudCBvciBzcGVjaWZpZWQgc2xpZGUgaXMgdmVydGljYWxcblx0ICogKG5lc3RlZCB3aXRoaW4gYW5vdGhlciBzbGlkZSkuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtzbGlkZT1jdXJyZW50U2xpZGVdIFRoZSBzbGlkZSB0byBjaGVja1xuXHQgKiBvcmllbnRhdGlvbiBvZlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHQgKi9cblx0ZnVuY3Rpb24gaXNWZXJ0aWNhbFNsaWRlKCBzbGlkZSApIHtcblxuXHRcdC8vIFByZWZlciBzbGlkZSBhcmd1bWVudCwgb3RoZXJ3aXNlIHVzZSBjdXJyZW50IHNsaWRlXG5cdFx0c2xpZGUgPSBzbGlkZSA/IHNsaWRlIDogY3VycmVudFNsaWRlO1xuXG5cdFx0cmV0dXJuIHNsaWRlICYmIHNsaWRlLnBhcmVudE5vZGUgJiYgISFzbGlkZS5wYXJlbnROb2RlLm5vZGVOYW1lLm1hdGNoKCAvc2VjdGlvbi9pICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGluZyB0aGUgZnVsbHNjcmVlbiBmdW5jdGlvbmFsaXR5IHZpYSB0aGUgZnVsbHNjcmVlbiBBUElcblx0ICpcblx0ICogQHNlZSBodHRwOi8vZnVsbHNjcmVlbi5zcGVjLndoYXR3Zy5vcmcvXG5cdCAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9ET00vVXNpbmdfZnVsbHNjcmVlbl9tb2RlXG5cdCAqL1xuXHRmdW5jdGlvbiBlbnRlckZ1bGxzY3JlZW4oKSB7XG5cblx0XHR2YXIgZWxlbWVudCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuXHRcdC8vIENoZWNrIHdoaWNoIGltcGxlbWVudGF0aW9uIGlzIGF2YWlsYWJsZVxuXHRcdHZhciByZXF1ZXN0TWV0aG9kID0gZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbiB8fFxuXHRcdFx0XHRcdFx0XHRlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuIHx8XG5cdFx0XHRcdFx0XHRcdGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4gfHxcblx0XHRcdFx0XHRcdFx0ZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbiB8fFxuXHRcdFx0XHRcdFx0XHRlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW47XG5cblx0XHRpZiggcmVxdWVzdE1ldGhvZCApIHtcblx0XHRcdHJlcXVlc3RNZXRob2QuYXBwbHkoIGVsZW1lbnQgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFbnRlcnMgdGhlIHBhdXNlZCBtb2RlIHdoaWNoIGZhZGVzIGV2ZXJ5dGhpbmcgb24gc2NyZWVuIHRvXG5cdCAqIGJsYWNrLlxuXHQgKi9cblx0ZnVuY3Rpb24gcGF1c2UoKSB7XG5cblx0XHRpZiggY29uZmlnLnBhdXNlICkge1xuXHRcdFx0dmFyIHdhc1BhdXNlZCA9IGRvbS53cmFwcGVyLmNsYXNzTGlzdC5jb250YWlucyggJ3BhdXNlZCcgKTtcblxuXHRcdFx0Y2FuY2VsQXV0b1NsaWRlKCk7XG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QuYWRkKCAncGF1c2VkJyApO1xuXG5cdFx0XHRpZiggd2FzUGF1c2VkID09PSBmYWxzZSApIHtcblx0XHRcdFx0ZGlzcGF0Y2hFdmVudCggJ3BhdXNlZCcgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFeGl0cyBmcm9tIHRoZSBwYXVzZWQgbW9kZS5cblx0ICovXG5cdGZ1bmN0aW9uIHJlc3VtZSgpIHtcblxuXHRcdHZhciB3YXNQYXVzZWQgPSBkb20ud3JhcHBlci5jbGFzc0xpc3QuY29udGFpbnMoICdwYXVzZWQnICk7XG5cdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ3BhdXNlZCcgKTtcblxuXHRcdGN1ZUF1dG9TbGlkZSgpO1xuXG5cdFx0aWYoIHdhc1BhdXNlZCApIHtcblx0XHRcdGRpc3BhdGNoRXZlbnQoICdyZXN1bWVkJyApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFRvZ2dsZXMgdGhlIHBhdXNlZCBtb2RlIG9uIGFuZCBvZmYuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b2dnbGVQYXVzZSggb3ZlcnJpZGUgKSB7XG5cblx0XHRpZiggdHlwZW9mIG92ZXJyaWRlID09PSAnYm9vbGVhbicgKSB7XG5cdFx0XHRvdmVycmlkZSA/IHBhdXNlKCkgOiByZXN1bWUoKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpc1BhdXNlZCgpID8gcmVzdW1lKCkgOiBwYXVzZSgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiB3ZSBhcmUgY3VycmVudGx5IGluIHRoZSBwYXVzZWQgbW9kZS5cblx0ICpcblx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0ICovXG5cdGZ1bmN0aW9uIGlzUGF1c2VkKCkge1xuXG5cdFx0cmV0dXJuIGRvbS53cmFwcGVyLmNsYXNzTGlzdC5jb250YWlucyggJ3BhdXNlZCcgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFRvZ2dsZXMgdGhlIGF1dG8gc2xpZGUgbW9kZSBvbiBhbmQgb2ZmLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IFtvdmVycmlkZV0gRmxhZyB3aGljaCBzZXRzIHRoZSBkZXNpcmVkIHN0YXRlLlxuXHQgKiBUcnVlIG1lYW5zIGF1dG9wbGF5IHN0YXJ0cywgZmFsc2UgbWVhbnMgaXQgc3RvcHMuXG5cdCAqL1xuXG5cdGZ1bmN0aW9uIHRvZ2dsZUF1dG9TbGlkZSggb3ZlcnJpZGUgKSB7XG5cblx0XHRpZiggdHlwZW9mIG92ZXJyaWRlID09PSAnYm9vbGVhbicgKSB7XG5cdFx0XHRvdmVycmlkZSA/IHJlc3VtZUF1dG9TbGlkZSgpIDogcGF1c2VBdXRvU2xpZGUoKTtcblx0XHR9XG5cblx0XHRlbHNlIHtcblx0XHRcdGF1dG9TbGlkZVBhdXNlZCA/IHJlc3VtZUF1dG9TbGlkZSgpIDogcGF1c2VBdXRvU2xpZGUoKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgaWYgdGhlIGF1dG8gc2xpZGUgbW9kZSBpcyBjdXJyZW50bHkgb24uXG5cdCAqXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59XG5cdCAqL1xuXHRmdW5jdGlvbiBpc0F1dG9TbGlkaW5nKCkge1xuXG5cdFx0cmV0dXJuICEhKCBhdXRvU2xpZGUgJiYgIWF1dG9TbGlkZVBhdXNlZCApO1xuXG5cdH1cblxuXHQvKipcblx0ICogU3RlcHMgZnJvbSB0aGUgY3VycmVudCBwb2ludCBpbiB0aGUgcHJlc2VudGF0aW9uIHRvIHRoZVxuXHQgKiBzbGlkZSB3aGljaCBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgaG9yaXpvbnRhbCBhbmQgdmVydGljYWxcblx0ICogaW5kaWNlcy5cblx0ICpcblx0ICogQHBhcmFtIHtudW1iZXJ9IFtoPWluZGV4aF0gSG9yaXpvbnRhbCBpbmRleCBvZiB0aGUgdGFyZ2V0IHNsaWRlXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBbdj1pbmRleHZdIFZlcnRpY2FsIGluZGV4IG9mIHRoZSB0YXJnZXQgc2xpZGVcblx0ICogQHBhcmFtIHtudW1iZXJ9IFtmXSBJbmRleCBvZiBhIGZyYWdtZW50IHdpdGhpbiB0aGVcblx0ICogdGFyZ2V0IHNsaWRlIHRvIGFjdGl2YXRlXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBbb10gT3JpZ2luIGZvciB1c2UgaW4gbXVsdGltYXN0ZXIgZW52aXJvbm1lbnRzXG5cdCAqL1xuXHRmdW5jdGlvbiBzbGlkZSggaCwgdiwgZiwgbyApIHtcblxuXHRcdC8vIFJlbWVtYmVyIHdoZXJlIHdlIHdlcmUgYXQgYmVmb3JlXG5cdFx0cHJldmlvdXNTbGlkZSA9IGN1cnJlbnRTbGlkZTtcblxuXHRcdC8vIFF1ZXJ5IGFsbCBob3Jpem9udGFsIHNsaWRlcyBpbiB0aGUgZGVja1xuXHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKTtcblxuXHRcdC8vIEFib3J0IGlmIHRoZXJlIGFyZSBubyBzbGlkZXNcblx0XHRpZiggaG9yaXpvbnRhbFNsaWRlcy5sZW5ndGggPT09IDAgKSByZXR1cm47XG5cblx0XHQvLyBJZiBubyB2ZXJ0aWNhbCBpbmRleCBpcyBzcGVjaWZpZWQgYW5kIHRoZSB1cGNvbWluZyBzbGlkZSBpcyBhXG5cdFx0Ly8gc3RhY2ssIHJlc3VtZSBhdCBpdHMgcHJldmlvdXMgdmVydGljYWwgaW5kZXhcblx0XHRpZiggdiA9PT0gdW5kZWZpbmVkICYmICFpc092ZXJ2aWV3KCkgKSB7XG5cdFx0XHR2ID0gZ2V0UHJldmlvdXNWZXJ0aWNhbEluZGV4KCBob3Jpem9udGFsU2xpZGVzWyBoIF0gKTtcblx0XHR9XG5cblx0XHQvLyBJZiB3ZSB3ZXJlIG9uIGEgdmVydGljYWwgc3RhY2ssIHJlbWVtYmVyIHdoYXQgdmVydGljYWwgaW5kZXhcblx0XHQvLyBpdCB3YXMgb24gc28gd2UgY2FuIHJlc3VtZSBhdCB0aGUgc2FtZSBwb3NpdGlvbiB3aGVuIHJldHVybmluZ1xuXHRcdGlmKCBwcmV2aW91c1NsaWRlICYmIHByZXZpb3VzU2xpZGUucGFyZW50Tm9kZSAmJiBwcmV2aW91c1NsaWRlLnBhcmVudE5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAnc3RhY2snICkgKSB7XG5cdFx0XHRzZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIHByZXZpb3VzU2xpZGUucGFyZW50Tm9kZSwgaW5kZXh2ICk7XG5cdFx0fVxuXG5cdFx0Ly8gUmVtZW1iZXIgdGhlIHN0YXRlIGJlZm9yZSB0aGlzIHNsaWRlXG5cdFx0dmFyIHN0YXRlQmVmb3JlID0gc3RhdGUuY29uY2F0KCk7XG5cblx0XHQvLyBSZXNldCB0aGUgc3RhdGUgYXJyYXlcblx0XHRzdGF0ZS5sZW5ndGggPSAwO1xuXG5cdFx0dmFyIGluZGV4aEJlZm9yZSA9IGluZGV4aCB8fCAwLFxuXHRcdFx0aW5kZXh2QmVmb3JlID0gaW5kZXh2IHx8IDA7XG5cblx0XHQvLyBBY3RpdmF0ZSBhbmQgdHJhbnNpdGlvbiB0byB0aGUgbmV3IHNsaWRlXG5cdFx0aW5kZXhoID0gdXBkYXRlU2xpZGVzKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiwgaCA9PT0gdW5kZWZpbmVkID8gaW5kZXhoIDogaCApO1xuXHRcdGluZGV4diA9IHVwZGF0ZVNsaWRlcyggVkVSVElDQUxfU0xJREVTX1NFTEVDVE9SLCB2ID09PSB1bmRlZmluZWQgPyBpbmRleHYgOiB2ICk7XG5cblx0XHQvLyBVcGRhdGUgdGhlIHZpc2liaWxpdHkgb2Ygc2xpZGVzIG5vdyB0aGF0IHRoZSBpbmRpY2VzIGhhdmUgY2hhbmdlZFxuXHRcdHVwZGF0ZVNsaWRlc1Zpc2liaWxpdHkoKTtcblxuXHRcdGxheW91dCgpO1xuXG5cdFx0Ly8gQXBwbHkgdGhlIG5ldyBzdGF0ZVxuXHRcdHN0YXRlTG9vcDogZm9yKCB2YXIgaSA9IDAsIGxlbiA9IHN0YXRlLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0Ly8gQ2hlY2sgaWYgdGhpcyBzdGF0ZSBleGlzdGVkIG9uIHRoZSBwcmV2aW91cyBzbGlkZS4gSWYgaXRcblx0XHRcdC8vIGRpZCwgd2Ugd2lsbCBhdm9pZCBhZGRpbmcgaXQgcmVwZWF0ZWRseVxuXHRcdFx0Zm9yKCB2YXIgaiA9IDA7IGogPCBzdGF0ZUJlZm9yZS5sZW5ndGg7IGorKyApIHtcblx0XHRcdFx0aWYoIHN0YXRlQmVmb3JlW2pdID09PSBzdGF0ZVtpXSApIHtcblx0XHRcdFx0XHRzdGF0ZUJlZm9yZS5zcGxpY2UoIGosIDEgKTtcblx0XHRcdFx0XHRjb250aW51ZSBzdGF0ZUxvb3A7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoIHN0YXRlW2ldICk7XG5cblx0XHRcdC8vIERpc3BhdGNoIGN1c3RvbSBldmVudCBtYXRjaGluZyB0aGUgc3RhdGUncyBuYW1lXG5cdFx0XHRkaXNwYXRjaEV2ZW50KCBzdGF0ZVtpXSApO1xuXHRcdH1cblxuXHRcdC8vIENsZWFuIHVwIHRoZSByZW1haW5zIG9mIHRoZSBwcmV2aW91cyBzdGF0ZVxuXHRcdHdoaWxlKCBzdGF0ZUJlZm9yZS5sZW5ndGggKSB7XG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggc3RhdGVCZWZvcmUucG9wKCkgKTtcblx0XHR9XG5cblx0XHQvLyBVcGRhdGUgdGhlIG92ZXJ2aWV3IGlmIGl0J3MgY3VycmVudGx5IGFjdGl2ZVxuXHRcdGlmKCBpc092ZXJ2aWV3KCkgKSB7XG5cdFx0XHR1cGRhdGVPdmVydmlldygpO1xuXHRcdH1cblxuXHRcdC8vIEZpbmQgdGhlIGN1cnJlbnQgaG9yaXpvbnRhbCBzbGlkZSBhbmQgYW55IHBvc3NpYmxlIHZlcnRpY2FsIHNsaWRlc1xuXHRcdC8vIHdpdGhpbiBpdFxuXHRcdHZhciBjdXJyZW50SG9yaXpvbnRhbFNsaWRlID0gaG9yaXpvbnRhbFNsaWRlc1sgaW5kZXhoIF0sXG5cdFx0XHRjdXJyZW50VmVydGljYWxTbGlkZXMgPSBjdXJyZW50SG9yaXpvbnRhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApO1xuXG5cdFx0Ly8gU3RvcmUgcmVmZXJlbmNlcyB0byB0aGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgc2xpZGVzXG5cdFx0Y3VycmVudFNsaWRlID0gY3VycmVudFZlcnRpY2FsU2xpZGVzWyBpbmRleHYgXSB8fCBjdXJyZW50SG9yaXpvbnRhbFNsaWRlO1xuXG5cdFx0Ly8gU2hvdyBmcmFnbWVudCwgaWYgc3BlY2lmaWVkXG5cdFx0aWYoIHR5cGVvZiBmICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdG5hdmlnYXRlRnJhZ21lbnQoIGYgKTtcblx0XHR9XG5cblx0XHQvLyBEaXNwYXRjaCBhbiBldmVudCBpZiB0aGUgc2xpZGUgY2hhbmdlZFxuXHRcdHZhciBzbGlkZUNoYW5nZWQgPSAoIGluZGV4aCAhPT0gaW5kZXhoQmVmb3JlIHx8IGluZGV4diAhPT0gaW5kZXh2QmVmb3JlICk7XG5cdFx0aWYoIHNsaWRlQ2hhbmdlZCApIHtcblx0XHRcdGRpc3BhdGNoRXZlbnQoICdzbGlkZWNoYW5nZWQnLCB7XG5cdFx0XHRcdCdpbmRleGgnOiBpbmRleGgsXG5cdFx0XHRcdCdpbmRleHYnOiBpbmRleHYsXG5cdFx0XHRcdCdwcmV2aW91c1NsaWRlJzogcHJldmlvdXNTbGlkZSxcblx0XHRcdFx0J2N1cnJlbnRTbGlkZSc6IGN1cnJlbnRTbGlkZSxcblx0XHRcdFx0J29yaWdpbic6IG9cblx0XHRcdH0gKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBFbnN1cmUgdGhhdCB0aGUgcHJldmlvdXMgc2xpZGUgaXMgbmV2ZXIgdGhlIHNhbWUgYXMgdGhlIGN1cnJlbnRcblx0XHRcdHByZXZpb3VzU2xpZGUgPSBudWxsO1xuXHRcdH1cblxuXHRcdC8vIFNvbHZlcyBhbiBlZGdlIGNhc2Ugd2hlcmUgdGhlIHByZXZpb3VzIHNsaWRlIG1haW50YWlucyB0aGVcblx0XHQvLyAncHJlc2VudCcgY2xhc3Mgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gYWRqYWNlbnQgdmVydGljYWxcblx0XHQvLyBzdGFja3Ncblx0XHRpZiggcHJldmlvdXNTbGlkZSApIHtcblx0XHRcdHByZXZpb3VzU2xpZGUuY2xhc3NMaXN0LnJlbW92ZSggJ3ByZXNlbnQnICk7XG5cdFx0XHRwcmV2aW91c1NsaWRlLnNldEF0dHJpYnV0ZSggJ2FyaWEtaGlkZGVuJywgJ3RydWUnICk7XG5cblx0XHRcdC8vIFJlc2V0IGFsbCBzbGlkZXMgdXBvbiBuYXZpZ2F0ZSB0byBob21lXG5cdFx0XHQvLyBJc3N1ZTogIzI4NVxuXHRcdFx0aWYgKCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yKCBIT01FX1NMSURFX1NFTEVDVE9SICkuY2xhc3NMaXN0LmNvbnRhaW5zKCAncHJlc2VudCcgKSApIHtcblx0XHRcdFx0Ly8gTGF1bmNoIGFzeW5jIHRhc2tcblx0XHRcdFx0c2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHZhciBzbGlkZXMgPSB0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiArICcuc3RhY2snKSApLCBpO1xuXHRcdFx0XHRcdGZvciggaSBpbiBzbGlkZXMgKSB7XG5cdFx0XHRcdFx0XHRpZiggc2xpZGVzW2ldICkge1xuXHRcdFx0XHRcdFx0XHQvLyBSZXNldCBzdGFja1xuXHRcdFx0XHRcdFx0XHRzZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIHNsaWRlc1tpXSwgMCApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgMCApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIEhhbmRsZSBlbWJlZGRlZCBjb250ZW50XG5cdFx0aWYoIHNsaWRlQ2hhbmdlZCB8fCAhcHJldmlvdXNTbGlkZSApIHtcblx0XHRcdHN0b3BFbWJlZGRlZENvbnRlbnQoIHByZXZpb3VzU2xpZGUgKTtcblx0XHRcdHN0YXJ0RW1iZWRkZWRDb250ZW50KCBjdXJyZW50U2xpZGUgKTtcblx0XHR9XG5cblx0XHQvLyBBbm5vdW5jZSB0aGUgY3VycmVudCBzbGlkZSBjb250ZW50cywgZm9yIHNjcmVlbiByZWFkZXJzXG5cdFx0ZG9tLnN0YXR1c0Rpdi50ZXh0Q29udGVudCA9IGdldFN0YXR1c1RleHQoIGN1cnJlbnRTbGlkZSApO1xuXG5cdFx0dXBkYXRlQ29udHJvbHMoKTtcblx0XHR1cGRhdGVQcm9ncmVzcygpO1xuXHRcdHVwZGF0ZUJhY2tncm91bmQoKTtcblx0XHR1cGRhdGVQYXJhbGxheCgpO1xuXHRcdHVwZGF0ZVNsaWRlTnVtYmVyKCk7XG5cdFx0dXBkYXRlTm90ZXMoKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgVVJMIGhhc2hcblx0XHR3cml0ZVVSTCgpO1xuXG5cdFx0Y3VlQXV0b1NsaWRlKCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTeW5jcyB0aGUgcHJlc2VudGF0aW9uIHdpdGggdGhlIGN1cnJlbnQgRE9NLiBVc2VmdWxcblx0ICogd2hlbiBuZXcgc2xpZGVzIG9yIGNvbnRyb2wgZWxlbWVudHMgYXJlIGFkZGVkIG9yIHdoZW5cblx0ICogdGhlIGNvbmZpZ3VyYXRpb24gaGFzIGNoYW5nZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBzeW5jKCkge1xuXG5cdFx0Ly8gU3Vic2NyaWJlIHRvIGlucHV0XG5cdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcblx0XHRhZGRFdmVudExpc3RlbmVycygpO1xuXG5cdFx0Ly8gRm9yY2UgYSBsYXlvdXQgdG8gbWFrZSBzdXJlIHRoZSBjdXJyZW50IGNvbmZpZyBpcyBhY2NvdW50ZWQgZm9yXG5cdFx0bGF5b3V0KCk7XG5cblx0XHQvLyBSZWZsZWN0IHRoZSBjdXJyZW50IGF1dG9TbGlkZSB2YWx1ZVxuXHRcdGF1dG9TbGlkZSA9IGNvbmZpZy5hdXRvU2xpZGU7XG5cblx0XHQvLyBTdGFydCBhdXRvLXNsaWRpbmcgaWYgaXQncyBlbmFibGVkXG5cdFx0Y3VlQXV0b1NsaWRlKCk7XG5cblx0XHQvLyBSZS1jcmVhdGUgdGhlIHNsaWRlIGJhY2tncm91bmRzXG5cdFx0Y3JlYXRlQmFja2dyb3VuZHMoKTtcblxuXHRcdC8vIFdyaXRlIHRoZSBjdXJyZW50IGhhc2ggdG8gdGhlIFVSTFxuXHRcdHdyaXRlVVJMKCk7XG5cblx0XHRzb3J0QWxsRnJhZ21lbnRzKCk7XG5cblx0XHR1cGRhdGVDb250cm9scygpO1xuXHRcdHVwZGF0ZVByb2dyZXNzKCk7XG5cdFx0dXBkYXRlU2xpZGVOdW1iZXIoKTtcblx0XHR1cGRhdGVTbGlkZXNWaXNpYmlsaXR5KCk7XG5cdFx0dXBkYXRlQmFja2dyb3VuZCggdHJ1ZSApO1xuXHRcdHVwZGF0ZU5vdGVzKCk7XG5cblx0XHRmb3JtYXRFbWJlZGRlZENvbnRlbnQoKTtcblxuXHRcdC8vIFN0YXJ0IG9yIHN0b3AgZW1iZWRkZWQgY29udGVudCBkZXBlbmRpbmcgb24gZ2xvYmFsIGNvbmZpZ1xuXHRcdGlmKCBjb25maWcuYXV0b1BsYXlNZWRpYSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRzdG9wRW1iZWRkZWRDb250ZW50KCBjdXJyZW50U2xpZGUgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRzdGFydEVtYmVkZGVkQ29udGVudCggY3VycmVudFNsaWRlICk7XG5cdFx0fVxuXG5cdFx0aWYoIGlzT3ZlcnZpZXcoKSApIHtcblx0XHRcdGxheW91dE92ZXJ2aWV3KCk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogUmVzZXRzIGFsbCB2ZXJ0aWNhbCBzbGlkZXMgc28gdGhhdCBvbmx5IHRoZSBmaXJzdFxuXHQgKiBpcyB2aXNpYmxlLlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVzZXRWZXJ0aWNhbFNsaWRlcygpIHtcblxuXHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApO1xuXHRcdGhvcml6b250YWxTbGlkZXMuZm9yRWFjaCggZnVuY3Rpb24oIGhvcml6b250YWxTbGlkZSApIHtcblxuXHRcdFx0dmFyIHZlcnRpY2FsU2xpZGVzID0gdG9BcnJheSggaG9yaXpvbnRhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApICk7XG5cdFx0XHR2ZXJ0aWNhbFNsaWRlcy5mb3JFYWNoKCBmdW5jdGlvbiggdmVydGljYWxTbGlkZSwgeSApIHtcblxuXHRcdFx0XHRpZiggeSA+IDAgKSB7XG5cdFx0XHRcdFx0dmVydGljYWxTbGlkZS5jbGFzc0xpc3QucmVtb3ZlKCAncHJlc2VudCcgKTtcblx0XHRcdFx0XHR2ZXJ0aWNhbFNsaWRlLmNsYXNzTGlzdC5yZW1vdmUoICdwYXN0JyApO1xuXHRcdFx0XHRcdHZlcnRpY2FsU2xpZGUuY2xhc3NMaXN0LmFkZCggJ2Z1dHVyZScgKTtcblx0XHRcdFx0XHR2ZXJ0aWNhbFNsaWRlLnNldEF0dHJpYnV0ZSggJ2FyaWEtaGlkZGVuJywgJ3RydWUnICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSApO1xuXG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogU29ydHMgYW5kIGZvcm1hdHMgYWxsIG9mIGZyYWdtZW50cyBpbiB0aGVcblx0ICogcHJlc2VudGF0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gc29ydEFsbEZyYWdtZW50cygpIHtcblxuXHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApO1xuXHRcdGhvcml6b250YWxTbGlkZXMuZm9yRWFjaCggZnVuY3Rpb24oIGhvcml6b250YWxTbGlkZSApIHtcblxuXHRcdFx0dmFyIHZlcnRpY2FsU2xpZGVzID0gdG9BcnJheSggaG9yaXpvbnRhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApICk7XG5cdFx0XHR2ZXJ0aWNhbFNsaWRlcy5mb3JFYWNoKCBmdW5jdGlvbiggdmVydGljYWxTbGlkZSwgeSApIHtcblxuXHRcdFx0XHRzb3J0RnJhZ21lbnRzKCB2ZXJ0aWNhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICkgKTtcblxuXHRcdFx0fSApO1xuXG5cdFx0XHRpZiggdmVydGljYWxTbGlkZXMubGVuZ3RoID09PSAwICkgc29ydEZyYWdtZW50cyggaG9yaXpvbnRhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICkgKTtcblxuXHRcdH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJhbmRvbWx5IHNodWZmbGVzIGFsbCBzbGlkZXMgaW4gdGhlIGRlY2suXG5cdCAqL1xuXHRmdW5jdGlvbiBzaHVmZmxlKCkge1xuXG5cdFx0dmFyIHNsaWRlcyA9IHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKTtcblxuXHRcdHNsaWRlcy5mb3JFYWNoKCBmdW5jdGlvbiggc2xpZGUgKSB7XG5cblx0XHRcdC8vIEluc2VydCB0aGlzIHNsaWRlIG5leHQgdG8gYW5vdGhlciByYW5kb20gc2xpZGUuIFRoaXMgbWF5XG5cdFx0XHQvLyBjYXVzZSB0aGUgc2xpZGUgdG8gaW5zZXJ0IGJlZm9yZSBpdHNlbGYgYnV0IHRoYXQncyBmaW5lLlxuXHRcdFx0ZG9tLnNsaWRlcy5pbnNlcnRCZWZvcmUoIHNsaWRlLCBzbGlkZXNbIE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiBzbGlkZXMubGVuZ3RoICkgXSApO1xuXG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyBvbmUgZGltZW5zaW9uIG9mIHNsaWRlcyBieSBzaG93aW5nIHRoZSBzbGlkZVxuXHQgKiB3aXRoIHRoZSBzcGVjaWZpZWQgaW5kZXguXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciBBIENTUyBzZWxlY3RvciB0aGF0IHdpbGwgZmV0Y2hcblx0ICogdGhlIGdyb3VwIG9mIHNsaWRlcyB3ZSBhcmUgd29ya2luZyB3aXRoXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIHNsaWRlIHRoYXQgc2hvdWxkIGJlXG5cdCAqIHNob3duXG5cdCAqXG5cdCAqIEByZXR1cm4ge251bWJlcn0gVGhlIGluZGV4IG9mIHRoZSBzbGlkZSB0aGF0IGlzIG5vdyBzaG93bixcblx0ICogbWlnaHQgZGlmZmVyIGZyb20gdGhlIHBhc3NlZCBpbiBpbmRleCBpZiBpdCB3YXMgb3V0IG9mXG5cdCAqIGJvdW5kcy5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZVNsaWRlcyggc2VsZWN0b3IsIGluZGV4ICkge1xuXG5cdFx0Ly8gU2VsZWN0IGFsbCBzbGlkZXMgYW5kIGNvbnZlcnQgdGhlIE5vZGVMaXN0IHJlc3VsdCB0b1xuXHRcdC8vIGFuIGFycmF5XG5cdFx0dmFyIHNsaWRlcyA9IHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIHNlbGVjdG9yICkgKSxcblx0XHRcdHNsaWRlc0xlbmd0aCA9IHNsaWRlcy5sZW5ndGg7XG5cblx0XHR2YXIgcHJpbnRNb2RlID0gaXNQcmludGluZ1BERigpO1xuXG5cdFx0aWYoIHNsaWRlc0xlbmd0aCApIHtcblxuXHRcdFx0Ly8gU2hvdWxkIHRoZSBpbmRleCBsb29wP1xuXHRcdFx0aWYoIGNvbmZpZy5sb29wICkge1xuXHRcdFx0XHRpbmRleCAlPSBzbGlkZXNMZW5ndGg7XG5cblx0XHRcdFx0aWYoIGluZGV4IDwgMCApIHtcblx0XHRcdFx0XHRpbmRleCA9IHNsaWRlc0xlbmd0aCArIGluZGV4O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIEVuZm9yY2UgbWF4IGFuZCBtaW5pbXVtIGluZGV4IGJvdW5kc1xuXHRcdFx0aW5kZXggPSBNYXRoLm1heCggTWF0aC5taW4oIGluZGV4LCBzbGlkZXNMZW5ndGggLSAxICksIDAgKTtcblxuXHRcdFx0Zm9yKCB2YXIgaSA9IDA7IGkgPCBzbGlkZXNMZW5ndGg7IGkrKyApIHtcblx0XHRcdFx0dmFyIGVsZW1lbnQgPSBzbGlkZXNbaV07XG5cblx0XHRcdFx0dmFyIHJldmVyc2UgPSBjb25maWcucnRsICYmICFpc1ZlcnRpY2FsU2xpZGUoIGVsZW1lbnQgKTtcblxuXHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdwYXN0JyApO1xuXHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdwcmVzZW50JyApO1xuXHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdmdXR1cmUnICk7XG5cblx0XHRcdFx0Ly8gaHR0cDovL3d3dy53My5vcmcvaHRtbC93Zy9kcmFmdHMvaHRtbC9tYXN0ZXIvZWRpdGluZy5odG1sI3RoZS1oaWRkZW4tYXR0cmlidXRlXG5cdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKCAnaGlkZGVuJywgJycgKTtcblx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUoICdhcmlhLWhpZGRlbicsICd0cnVlJyApO1xuXG5cdFx0XHRcdC8vIElmIHRoaXMgZWxlbWVudCBjb250YWlucyB2ZXJ0aWNhbCBzbGlkZXNcblx0XHRcdFx0aWYoIGVsZW1lbnQucXVlcnlTZWxlY3RvciggJ3NlY3Rpb24nICkgKSB7XG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCAnc3RhY2snICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBJZiB3ZSdyZSBwcmludGluZyBzdGF0aWMgc2xpZGVzLCBhbGwgc2xpZGVzIGFyZSBcInByZXNlbnRcIlxuXHRcdFx0XHRpZiggcHJpbnRNb2RlICkge1xuXHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ3ByZXNlbnQnICk7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiggaSA8IGluZGV4ICkge1xuXHRcdFx0XHRcdC8vIEFueSBlbGVtZW50IHByZXZpb3VzIHRvIGluZGV4IGlzIGdpdmVuIHRoZSAncGFzdCcgY2xhc3Ncblx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQoIHJldmVyc2UgPyAnZnV0dXJlJyA6ICdwYXN0JyApO1xuXG5cdFx0XHRcdFx0aWYoIGNvbmZpZy5mcmFnbWVudHMgKSB7XG5cdFx0XHRcdFx0XHR2YXIgcGFzdEZyYWdtZW50cyA9IHRvQXJyYXkoIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKSApO1xuXG5cdFx0XHRcdFx0XHQvLyBTaG93IGFsbCBmcmFnbWVudHMgb24gcHJpb3Igc2xpZGVzXG5cdFx0XHRcdFx0XHR3aGlsZSggcGFzdEZyYWdtZW50cy5sZW5ndGggKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBwYXN0RnJhZ21lbnQgPSBwYXN0RnJhZ21lbnRzLnBvcCgpO1xuXHRcdFx0XHRcdFx0XHRwYXN0RnJhZ21lbnQuY2xhc3NMaXN0LmFkZCggJ3Zpc2libGUnICk7XG5cdFx0XHRcdFx0XHRcdHBhc3RGcmFnbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAnY3VycmVudC1mcmFnbWVudCcgKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiggaSA+IGluZGV4ICkge1xuXHRcdFx0XHRcdC8vIEFueSBlbGVtZW50IHN1YnNlcXVlbnQgdG8gaW5kZXggaXMgZ2l2ZW4gdGhlICdmdXR1cmUnIGNsYXNzXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCByZXZlcnNlID8gJ3Bhc3QnIDogJ2Z1dHVyZScgKTtcblxuXHRcdFx0XHRcdGlmKCBjb25maWcuZnJhZ21lbnRzICkge1xuXHRcdFx0XHRcdFx0dmFyIGZ1dHVyZUZyYWdtZW50cyA9IHRvQXJyYXkoIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudC52aXNpYmxlJyApICk7XG5cblx0XHRcdFx0XHRcdC8vIE5vIGZyYWdtZW50cyBpbiBmdXR1cmUgc2xpZGVzIHNob3VsZCBiZSB2aXNpYmxlIGFoZWFkIG9mIHRpbWVcblx0XHRcdFx0XHRcdHdoaWxlKCBmdXR1cmVGcmFnbWVudHMubGVuZ3RoICkge1xuXHRcdFx0XHRcdFx0XHR2YXIgZnV0dXJlRnJhZ21lbnQgPSBmdXR1cmVGcmFnbWVudHMucG9wKCk7XG5cdFx0XHRcdFx0XHRcdGZ1dHVyZUZyYWdtZW50LmNsYXNzTGlzdC5yZW1vdmUoICd2aXNpYmxlJyApO1xuXHRcdFx0XHRcdFx0XHRmdXR1cmVGcmFnbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAnY3VycmVudC1mcmFnbWVudCcgKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gTWFyayB0aGUgY3VycmVudCBzbGlkZSBhcyBwcmVzZW50XG5cdFx0XHRzbGlkZXNbaW5kZXhdLmNsYXNzTGlzdC5hZGQoICdwcmVzZW50JyApO1xuXHRcdFx0c2xpZGVzW2luZGV4XS5yZW1vdmVBdHRyaWJ1dGUoICdoaWRkZW4nICk7XG5cdFx0XHRzbGlkZXNbaW5kZXhdLnJlbW92ZUF0dHJpYnV0ZSggJ2FyaWEtaGlkZGVuJyApO1xuXG5cdFx0XHQvLyBJZiB0aGlzIHNsaWRlIGhhcyBhIHN0YXRlIGFzc29jaWF0ZWQgd2l0aCBpdCwgYWRkIGl0XG5cdFx0XHQvLyBvbnRvIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBkZWNrXG5cdFx0XHR2YXIgc2xpZGVTdGF0ZSA9IHNsaWRlc1tpbmRleF0uZ2V0QXR0cmlidXRlKCAnZGF0YS1zdGF0ZScgKTtcblx0XHRcdGlmKCBzbGlkZVN0YXRlICkge1xuXHRcdFx0XHRzdGF0ZSA9IHN0YXRlLmNvbmNhdCggc2xpZGVTdGF0ZS5zcGxpdCggJyAnICkgKTtcblx0XHRcdH1cblxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFNpbmNlIHRoZXJlIGFyZSBubyBzbGlkZXMgd2UgY2FuJ3QgYmUgYW55d2hlcmUgYmV5b25kIHRoZVxuXHRcdFx0Ly8gemVyb3RoIGluZGV4XG5cdFx0XHRpbmRleCA9IDA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGluZGV4O1xuXG5cdH1cblxuXHQvKipcblx0ICogT3B0aW1pemF0aW9uIG1ldGhvZDsgaGlkZSBhbGwgc2xpZGVzIHRoYXQgYXJlIGZhciBhd2F5XG5cdCAqIGZyb20gdGhlIHByZXNlbnQgc2xpZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVTbGlkZXNWaXNpYmlsaXR5KCkge1xuXG5cdFx0Ly8gU2VsZWN0IGFsbCBzbGlkZXMgYW5kIGNvbnZlcnQgdGhlIE5vZGVMaXN0IHJlc3VsdCB0b1xuXHRcdC8vIGFuIGFycmF5XG5cdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSB0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApICksXG5cdFx0XHRob3Jpem9udGFsU2xpZGVzTGVuZ3RoID0gaG9yaXpvbnRhbFNsaWRlcy5sZW5ndGgsXG5cdFx0XHRkaXN0YW5jZVgsXG5cdFx0XHRkaXN0YW5jZVk7XG5cblx0XHRpZiggaG9yaXpvbnRhbFNsaWRlc0xlbmd0aCAmJiB0eXBlb2YgaW5kZXhoICE9PSAndW5kZWZpbmVkJyApIHtcblxuXHRcdFx0Ly8gVGhlIG51bWJlciBvZiBzdGVwcyBhd2F5IGZyb20gdGhlIHByZXNlbnQgc2xpZGUgdGhhdCB3aWxsXG5cdFx0XHQvLyBiZSB2aXNpYmxlXG5cdFx0XHR2YXIgdmlld0Rpc3RhbmNlID0gaXNPdmVydmlldygpID8gMTAgOiBjb25maWcudmlld0Rpc3RhbmNlO1xuXG5cdFx0XHQvLyBMaW1pdCB2aWV3IGRpc3RhbmNlIG9uIHdlYWtlciBkZXZpY2VzXG5cdFx0XHRpZiggaXNNb2JpbGVEZXZpY2UgKSB7XG5cdFx0XHRcdHZpZXdEaXN0YW5jZSA9IGlzT3ZlcnZpZXcoKSA/IDYgOiAyO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBbGwgc2xpZGVzIG5lZWQgdG8gYmUgdmlzaWJsZSB3aGVuIGV4cG9ydGluZyB0byBQREZcblx0XHRcdGlmKCBpc1ByaW50aW5nUERGKCkgKSB7XG5cdFx0XHRcdHZpZXdEaXN0YW5jZSA9IE51bWJlci5NQVhfVkFMVUU7XG5cdFx0XHR9XG5cblx0XHRcdGZvciggdmFyIHggPSAwOyB4IDwgaG9yaXpvbnRhbFNsaWRlc0xlbmd0aDsgeCsrICkge1xuXHRcdFx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlID0gaG9yaXpvbnRhbFNsaWRlc1t4XTtcblxuXHRcdFx0XHR2YXIgdmVydGljYWxTbGlkZXMgPSB0b0FycmF5KCBob3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkgKSxcblx0XHRcdFx0XHR2ZXJ0aWNhbFNsaWRlc0xlbmd0aCA9IHZlcnRpY2FsU2xpZGVzLmxlbmd0aDtcblxuXHRcdFx0XHQvLyBEZXRlcm1pbmUgaG93IGZhciBhd2F5IHRoaXMgc2xpZGUgaXMgZnJvbSB0aGUgcHJlc2VudFxuXHRcdFx0XHRkaXN0YW5jZVggPSBNYXRoLmFicyggKCBpbmRleGggfHwgMCApIC0geCApIHx8IDA7XG5cblx0XHRcdFx0Ly8gSWYgdGhlIHByZXNlbnRhdGlvbiBpcyBsb29wZWQsIGRpc3RhbmNlIHNob3VsZCBtZWFzdXJlXG5cdFx0XHRcdC8vIDEgYmV0d2VlbiB0aGUgZmlyc3QgYW5kIGxhc3Qgc2xpZGVzXG5cdFx0XHRcdGlmKCBjb25maWcubG9vcCApIHtcblx0XHRcdFx0XHRkaXN0YW5jZVggPSBNYXRoLmFicyggKCAoIGluZGV4aCB8fCAwICkgLSB4ICkgJSAoIGhvcml6b250YWxTbGlkZXNMZW5ndGggLSB2aWV3RGlzdGFuY2UgKSApIHx8IDA7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBTaG93IHRoZSBob3Jpem9udGFsIHNsaWRlIGlmIGl0J3Mgd2l0aGluIHRoZSB2aWV3IGRpc3RhbmNlXG5cdFx0XHRcdGlmKCBkaXN0YW5jZVggPCB2aWV3RGlzdGFuY2UgKSB7XG5cdFx0XHRcdFx0c2hvd1NsaWRlKCBob3Jpem9udGFsU2xpZGUgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRoaWRlU2xpZGUoIGhvcml6b250YWxTbGlkZSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIHZlcnRpY2FsU2xpZGVzTGVuZ3RoICkge1xuXG5cdFx0XHRcdFx0dmFyIG95ID0gZ2V0UHJldmlvdXNWZXJ0aWNhbEluZGV4KCBob3Jpem9udGFsU2xpZGUgKTtcblxuXHRcdFx0XHRcdGZvciggdmFyIHkgPSAwOyB5IDwgdmVydGljYWxTbGlkZXNMZW5ndGg7IHkrKyApIHtcblx0XHRcdFx0XHRcdHZhciB2ZXJ0aWNhbFNsaWRlID0gdmVydGljYWxTbGlkZXNbeV07XG5cblx0XHRcdFx0XHRcdGRpc3RhbmNlWSA9IHggPT09ICggaW5kZXhoIHx8IDAgKSA/IE1hdGguYWJzKCAoIGluZGV4diB8fCAwICkgLSB5ICkgOiBNYXRoLmFicyggeSAtIG95ICk7XG5cblx0XHRcdFx0XHRcdGlmKCBkaXN0YW5jZVggKyBkaXN0YW5jZVkgPCB2aWV3RGlzdGFuY2UgKSB7XG5cdFx0XHRcdFx0XHRcdHNob3dTbGlkZSggdmVydGljYWxTbGlkZSApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGhpZGVTbGlkZSggdmVydGljYWxTbGlkZSApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBQaWNrIHVwIG5vdGVzIGZyb20gdGhlIGN1cnJlbnQgc2xpZGUgYW5kIGRpc3BsYXkgdGhlbVxuXHQgKiB0byB0aGUgdmlld2VyLlxuXHQgKlxuXHQgKiBAc2VlIHtAbGluayBjb25maWcuc2hvd05vdGVzfVxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlTm90ZXMoKSB7XG5cblx0XHRpZiggY29uZmlnLnNob3dOb3RlcyAmJiBkb20uc3BlYWtlck5vdGVzICYmIGN1cnJlbnRTbGlkZSAmJiAhaXNQcmludGluZ1BERigpICkge1xuXG5cdFx0XHRkb20uc3BlYWtlck5vdGVzLmlubmVySFRNTCA9IGdldFNsaWRlTm90ZXMoKSB8fCAnJztcblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIHByb2dyZXNzIGJhciB0byByZWZsZWN0IHRoZSBjdXJyZW50IHNsaWRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlUHJvZ3Jlc3MoKSB7XG5cblx0XHQvLyBVcGRhdGUgcHJvZ3Jlc3MgaWYgZW5hYmxlZFxuXHRcdGlmKCBjb25maWcucHJvZ3Jlc3MgJiYgZG9tLnByb2dyZXNzYmFyICkge1xuXG5cdFx0XHRkb20ucHJvZ3Jlc3NiYXIuc3R5bGUud2lkdGggPSBnZXRQcm9ncmVzcygpICogZG9tLndyYXBwZXIub2Zmc2V0V2lkdGggKyAncHgnO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyB0aGUgc2xpZGUgbnVtYmVyIGRpdiB0byByZWZsZWN0IHRoZSBjdXJyZW50IHNsaWRlLlxuXHQgKlxuXHQgKiBUaGUgZm9sbG93aW5nIHNsaWRlIG51bWJlciBmb3JtYXRzIGFyZSBhdmFpbGFibGU6XG5cdCAqICBcImgudlwiOlx0aG9yaXpvbnRhbCAuIHZlcnRpY2FsIHNsaWRlIG51bWJlciAoZGVmYXVsdClcblx0ICogIFwiaC92XCI6XHRob3Jpem9udGFsIC8gdmVydGljYWwgc2xpZGUgbnVtYmVyXG5cdCAqICAgIFwiY1wiOlx0ZmxhdHRlbmVkIHNsaWRlIG51bWJlclxuXHQgKiAgXCJjL3RcIjpcdGZsYXR0ZW5lZCBzbGlkZSBudW1iZXIgLyB0b3RhbCBzbGlkZXNcblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZVNsaWRlTnVtYmVyKCkge1xuXG5cdFx0Ly8gVXBkYXRlIHNsaWRlIG51bWJlciBpZiBlbmFibGVkXG5cdFx0aWYoIGNvbmZpZy5zbGlkZU51bWJlciAmJiBkb20uc2xpZGVOdW1iZXIgKSB7XG5cblx0XHRcdHZhciB2YWx1ZSA9IFtdO1xuXHRcdFx0dmFyIGZvcm1hdCA9ICdoLnYnO1xuXG5cdFx0XHQvLyBDaGVjayBpZiBhIGN1c3RvbSBudW1iZXIgZm9ybWF0IGlzIGF2YWlsYWJsZVxuXHRcdFx0aWYoIHR5cGVvZiBjb25maWcuc2xpZGVOdW1iZXIgPT09ICdzdHJpbmcnICkge1xuXHRcdFx0XHRmb3JtYXQgPSBjb25maWcuc2xpZGVOdW1iZXI7XG5cdFx0XHR9XG5cblx0XHRcdHN3aXRjaCggZm9ybWF0ICkge1xuXHRcdFx0XHRjYXNlICdjJzpcblx0XHRcdFx0XHR2YWx1ZS5wdXNoKCBnZXRTbGlkZVBhc3RDb3VudCgpICsgMSApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdjL3QnOlxuXHRcdFx0XHRcdHZhbHVlLnB1c2goIGdldFNsaWRlUGFzdENvdW50KCkgKyAxLCAnLycsIGdldFRvdGFsU2xpZGVzKCkgKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnaC92Jzpcblx0XHRcdFx0XHR2YWx1ZS5wdXNoKCBpbmRleGggKyAxICk7XG5cdFx0XHRcdFx0aWYoIGlzVmVydGljYWxTbGlkZSgpICkgdmFsdWUucHVzaCggJy8nLCBpbmRleHYgKyAxICk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0dmFsdWUucHVzaCggaW5kZXhoICsgMSApO1xuXHRcdFx0XHRcdGlmKCBpc1ZlcnRpY2FsU2xpZGUoKSApIHZhbHVlLnB1c2goICcuJywgaW5kZXh2ICsgMSApO1xuXHRcdFx0fVxuXG5cdFx0XHRkb20uc2xpZGVOdW1iZXIuaW5uZXJIVE1MID0gZm9ybWF0U2xpZGVOdW1iZXIoIHZhbHVlWzBdLCB2YWx1ZVsxXSwgdmFsdWVbMl0gKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBsaWVzIEhUTUwgZm9ybWF0dGluZyB0byBhIHNsaWRlIG51bWJlciBiZWZvcmUgaXQnc1xuXHQgKiB3cml0dGVuIHRvIHRoZSBET00uXG5cdCAqXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBhIEN1cnJlbnQgc2xpZGVcblx0ICogQHBhcmFtIHtzdHJpbmd9IGRlbGltaXRlciBDaGFyYWN0ZXIgdG8gc2VwYXJhdGUgc2xpZGUgbnVtYmVyc1xuXHQgKiBAcGFyYW0geyhudW1iZXJ8Kil9IGIgVG90YWwgc2xpZGVzXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gSFRNTCBzdHJpbmcgZnJhZ21lbnRcblx0ICovXG5cdGZ1bmN0aW9uIGZvcm1hdFNsaWRlTnVtYmVyKCBhLCBkZWxpbWl0ZXIsIGIgKSB7XG5cblx0XHRpZiggdHlwZW9mIGIgPT09ICdudW1iZXInICYmICFpc05hTiggYiApICkge1xuXHRcdFx0cmV0dXJuICAnPHNwYW4gY2xhc3M9XCJzbGlkZS1udW1iZXItYVwiPicrIGEgKyc8L3NwYW4+JyArXG5cdFx0XHRcdFx0JzxzcGFuIGNsYXNzPVwic2xpZGUtbnVtYmVyLWRlbGltaXRlclwiPicrIGRlbGltaXRlciArJzwvc3Bhbj4nICtcblx0XHRcdFx0XHQnPHNwYW4gY2xhc3M9XCJzbGlkZS1udW1iZXItYlwiPicrIGIgKyc8L3NwYW4+Jztcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gJzxzcGFuIGNsYXNzPVwic2xpZGUtbnVtYmVyLWFcIj4nKyBhICsnPC9zcGFuPic7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyB0aGUgc3RhdGUgb2YgYWxsIGNvbnRyb2wvbmF2aWdhdGlvbiBhcnJvd3MuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVDb250cm9scygpIHtcblxuXHRcdHZhciByb3V0ZXMgPSBhdmFpbGFibGVSb3V0ZXMoKTtcblx0XHR2YXIgZnJhZ21lbnRzID0gYXZhaWxhYmxlRnJhZ21lbnRzKCk7XG5cblx0XHQvLyBSZW1vdmUgdGhlICdlbmFibGVkJyBjbGFzcyBmcm9tIGFsbCBkaXJlY3Rpb25zXG5cdFx0ZG9tLmNvbnRyb2xzTGVmdC5jb25jYXQoIGRvbS5jb250cm9sc1JpZ2h0IClcblx0XHRcdFx0XHRcdC5jb25jYXQoIGRvbS5jb250cm9sc1VwIClcblx0XHRcdFx0XHRcdC5jb25jYXQoIGRvbS5jb250cm9sc0Rvd24gKVxuXHRcdFx0XHRcdFx0LmNvbmNhdCggZG9tLmNvbnRyb2xzUHJldiApXG5cdFx0XHRcdFx0XHQuY29uY2F0KCBkb20uY29udHJvbHNOZXh0ICkuZm9yRWFjaCggZnVuY3Rpb24oIG5vZGUgKSB7XG5cdFx0XHRub2RlLmNsYXNzTGlzdC5yZW1vdmUoICdlbmFibGVkJyApO1xuXHRcdFx0bm9kZS5jbGFzc0xpc3QucmVtb3ZlKCAnZnJhZ21lbnRlZCcgKTtcblxuXHRcdFx0Ly8gU2V0ICdkaXNhYmxlZCcgYXR0cmlidXRlIG9uIGFsbCBkaXJlY3Rpb25zXG5cdFx0XHRub2RlLnNldEF0dHJpYnV0ZSggJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJyApO1xuXHRcdH0gKTtcblxuXHRcdC8vIEFkZCB0aGUgJ2VuYWJsZWQnIGNsYXNzIHRvIHRoZSBhdmFpbGFibGUgcm91dGVzOyByZW1vdmUgJ2Rpc2FibGVkJyBhdHRyaWJ1dGUgdG8gZW5hYmxlIGJ1dHRvbnNcblx0XHRpZiggcm91dGVzLmxlZnQgKSBkb20uY29udHJvbHNMZWZ0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2VuYWJsZWQnICk7IGVsLnJlbW92ZUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApOyB9ICk7XG5cdFx0aWYoIHJvdXRlcy5yaWdodCApIGRvbS5jb250cm9sc1JpZ2h0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2VuYWJsZWQnICk7IGVsLnJlbW92ZUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApOyB9ICk7XG5cdFx0aWYoIHJvdXRlcy51cCApIGRvbS5jb250cm9sc1VwLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2VuYWJsZWQnICk7IGVsLnJlbW92ZUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApOyB9ICk7XG5cdFx0aWYoIHJvdXRlcy5kb3duICkgZG9tLmNvbnRyb2xzRG93bi5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdlbmFibGVkJyApOyBlbC5yZW1vdmVBdHRyaWJ1dGUoICdkaXNhYmxlZCcgKTsgfSApO1xuXG5cdFx0Ly8gUHJldi9uZXh0IGJ1dHRvbnNcblx0XHRpZiggcm91dGVzLmxlZnQgfHwgcm91dGVzLnVwICkgZG9tLmNvbnRyb2xzUHJldi5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdlbmFibGVkJyApOyBlbC5yZW1vdmVBdHRyaWJ1dGUoICdkaXNhYmxlZCcgKTsgfSApO1xuXHRcdGlmKCByb3V0ZXMucmlnaHQgfHwgcm91dGVzLmRvd24gKSBkb20uY29udHJvbHNOZXh0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2VuYWJsZWQnICk7IGVsLnJlbW92ZUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApOyB9ICk7XG5cblx0XHQvLyBIaWdobGlnaHQgZnJhZ21lbnQgZGlyZWN0aW9uc1xuXHRcdGlmKCBjdXJyZW50U2xpZGUgKSB7XG5cblx0XHRcdC8vIEFsd2F5cyBhcHBseSBmcmFnbWVudCBkZWNvcmF0b3IgdG8gcHJldi9uZXh0IGJ1dHRvbnNcblx0XHRcdGlmKCBmcmFnbWVudHMucHJldiApIGRvbS5jb250cm9sc1ByZXYuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZnJhZ21lbnRlZCcsICdlbmFibGVkJyApOyBlbC5yZW1vdmVBdHRyaWJ1dGUoICdkaXNhYmxlZCcgKTsgfSApO1xuXHRcdFx0aWYoIGZyYWdtZW50cy5uZXh0ICkgZG9tLmNvbnRyb2xzTmV4dC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdmcmFnbWVudGVkJywgJ2VuYWJsZWQnICk7IGVsLnJlbW92ZUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApOyB9ICk7XG5cblx0XHRcdC8vIEFwcGx5IGZyYWdtZW50IGRlY29yYXRvcnMgdG8gZGlyZWN0aW9uYWwgYnV0dG9ucyBiYXNlZCBvblxuXHRcdFx0Ly8gd2hhdCBzbGlkZSBheGlzIHRoZXkgYXJlIGluXG5cdFx0XHRpZiggaXNWZXJ0aWNhbFNsaWRlKCBjdXJyZW50U2xpZGUgKSApIHtcblx0XHRcdFx0aWYoIGZyYWdtZW50cy5wcmV2ICkgZG9tLmNvbnRyb2xzVXAuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZnJhZ21lbnRlZCcsICdlbmFibGVkJyApOyBlbC5yZW1vdmVBdHRyaWJ1dGUoICdkaXNhYmxlZCcgKTsgfSApO1xuXHRcdFx0XHRpZiggZnJhZ21lbnRzLm5leHQgKSBkb20uY29udHJvbHNEb3duLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2ZyYWdtZW50ZWQnLCAnZW5hYmxlZCcgKTsgZWwucmVtb3ZlQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7IH0gKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRpZiggZnJhZ21lbnRzLnByZXYgKSBkb20uY29udHJvbHNMZWZ0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2ZyYWdtZW50ZWQnLCAnZW5hYmxlZCcgKTsgZWwucmVtb3ZlQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7IH0gKTtcblx0XHRcdFx0aWYoIGZyYWdtZW50cy5uZXh0ICkgZG9tLmNvbnRyb2xzUmlnaHQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZnJhZ21lbnRlZCcsICdlbmFibGVkJyApOyBlbC5yZW1vdmVBdHRyaWJ1dGUoICdkaXNhYmxlZCcgKTsgfSApO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyB0aGUgYmFja2dyb3VuZCBlbGVtZW50cyB0byByZWZsZWN0IHRoZSBjdXJyZW50XG5cdCAqIHNsaWRlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGluY2x1ZGVBbGwgSWYgdHJ1ZSwgdGhlIGJhY2tncm91bmRzIG9mXG5cdCAqIGFsbCB2ZXJ0aWNhbCBzbGlkZXMgKG5vdCBqdXN0IHRoZSBwcmVzZW50KSB3aWxsIGJlIHVwZGF0ZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVCYWNrZ3JvdW5kKCBpbmNsdWRlQWxsICkge1xuXG5cdFx0dmFyIGN1cnJlbnRCYWNrZ3JvdW5kID0gbnVsbDtcblxuXHRcdC8vIFJldmVyc2UgcGFzdC9mdXR1cmUgY2xhc3NlcyB3aGVuIGluIFJUTCBtb2RlXG5cdFx0dmFyIGhvcml6b250YWxQYXN0ID0gY29uZmlnLnJ0bCA/ICdmdXR1cmUnIDogJ3Bhc3QnLFxuXHRcdFx0aG9yaXpvbnRhbEZ1dHVyZSA9IGNvbmZpZy5ydGwgPyAncGFzdCcgOiAnZnV0dXJlJztcblxuXHRcdC8vIFVwZGF0ZSB0aGUgY2xhc3NlcyBvZiBhbGwgYmFja2dyb3VuZHMgdG8gbWF0Y2ggdGhlXG5cdFx0Ly8gc3RhdGVzIG9mIHRoZWlyIHNsaWRlcyAocGFzdC9wcmVzZW50L2Z1dHVyZSlcblx0XHR0b0FycmF5KCBkb20uYmFja2dyb3VuZC5jaGlsZE5vZGVzICkuZm9yRWFjaCggZnVuY3Rpb24oIGJhY2tncm91bmRoLCBoICkge1xuXG5cdFx0XHRiYWNrZ3JvdW5kaC5jbGFzc0xpc3QucmVtb3ZlKCAncGFzdCcgKTtcblx0XHRcdGJhY2tncm91bmRoLmNsYXNzTGlzdC5yZW1vdmUoICdwcmVzZW50JyApO1xuXHRcdFx0YmFja2dyb3VuZGguY2xhc3NMaXN0LnJlbW92ZSggJ2Z1dHVyZScgKTtcblxuXHRcdFx0aWYoIGggPCBpbmRleGggKSB7XG5cdFx0XHRcdGJhY2tncm91bmRoLmNsYXNzTGlzdC5hZGQoIGhvcml6b250YWxQYXN0ICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICggaCA+IGluZGV4aCApIHtcblx0XHRcdFx0YmFja2dyb3VuZGguY2xhc3NMaXN0LmFkZCggaG9yaXpvbnRhbEZ1dHVyZSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGJhY2tncm91bmRoLmNsYXNzTGlzdC5hZGQoICdwcmVzZW50JyApO1xuXG5cdFx0XHRcdC8vIFN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGJhY2tncm91bmQgZWxlbWVudFxuXHRcdFx0XHRjdXJyZW50QmFja2dyb3VuZCA9IGJhY2tncm91bmRoO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggaW5jbHVkZUFsbCB8fCBoID09PSBpbmRleGggKSB7XG5cdFx0XHRcdHRvQXJyYXkoIGJhY2tncm91bmRoLnF1ZXJ5U2VsZWN0b3JBbGwoICcuc2xpZGUtYmFja2dyb3VuZCcgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBiYWNrZ3JvdW5kdiwgdiApIHtcblxuXHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTGlzdC5yZW1vdmUoICdwYXN0JyApO1xuXHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTGlzdC5yZW1vdmUoICdwcmVzZW50JyApO1xuXHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTGlzdC5yZW1vdmUoICdmdXR1cmUnICk7XG5cblx0XHRcdFx0XHRpZiggdiA8IGluZGV4diApIHtcblx0XHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTGlzdC5hZGQoICdwYXN0JyApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICggdiA+IGluZGV4diApIHtcblx0XHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTGlzdC5hZGQoICdmdXR1cmUnICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0YmFja2dyb3VuZHYuY2xhc3NMaXN0LmFkZCggJ3ByZXNlbnQnICk7XG5cblx0XHRcdFx0XHRcdC8vIE9ubHkgaWYgdGhpcyBpcyB0aGUgcHJlc2VudCBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBzbGlkZVxuXHRcdFx0XHRcdFx0aWYoIGggPT09IGluZGV4aCApIGN1cnJlbnRCYWNrZ3JvdW5kID0gYmFja2dyb3VuZHY7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblxuXHRcdH0gKTtcblxuXHRcdC8vIFN0b3AgY29udGVudCBpbnNpZGUgb2YgcHJldmlvdXMgYmFja2dyb3VuZHNcblx0XHRpZiggcHJldmlvdXNCYWNrZ3JvdW5kICkge1xuXG5cdFx0XHRzdG9wRW1iZWRkZWRDb250ZW50KCBwcmV2aW91c0JhY2tncm91bmQgKTtcblxuXHRcdH1cblxuXHRcdC8vIFN0YXJ0IGNvbnRlbnQgaW4gdGhlIGN1cnJlbnQgYmFja2dyb3VuZFxuXHRcdGlmKCBjdXJyZW50QmFja2dyb3VuZCApIHtcblxuXHRcdFx0c3RhcnRFbWJlZGRlZENvbnRlbnQoIGN1cnJlbnRCYWNrZ3JvdW5kICk7XG5cblx0XHRcdHZhciBiYWNrZ3JvdW5kSW1hZ2VVUkwgPSBjdXJyZW50QmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgfHwgJyc7XG5cblx0XHRcdC8vIFJlc3RhcnQgR0lGcyAoZG9lc24ndCB3b3JrIGluIEZpcmVmb3gpXG5cdFx0XHRpZiggL1xcLmdpZi9pLnRlc3QoIGJhY2tncm91bmRJbWFnZVVSTCApICkge1xuXHRcdFx0XHRjdXJyZW50QmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnJztcblx0XHRcdFx0d2luZG93LmdldENvbXB1dGVkU3R5bGUoIGN1cnJlbnRCYWNrZ3JvdW5kICkub3BhY2l0eTtcblx0XHRcdFx0Y3VycmVudEJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYmFja2dyb3VuZEltYWdlVVJMO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBEb24ndCB0cmFuc2l0aW9uIGJldHdlZW4gaWRlbnRpY2FsIGJhY2tncm91bmRzLiBUaGlzXG5cdFx0XHQvLyBwcmV2ZW50cyB1bndhbnRlZCBmbGlja2VyLlxuXHRcdFx0dmFyIHByZXZpb3VzQmFja2dyb3VuZEhhc2ggPSBwcmV2aW91c0JhY2tncm91bmQgPyBwcmV2aW91c0JhY2tncm91bmQuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWhhc2gnICkgOiBudWxsO1xuXHRcdFx0dmFyIGN1cnJlbnRCYWNrZ3JvdW5kSGFzaCA9IGN1cnJlbnRCYWNrZ3JvdW5kLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC1oYXNoJyApO1xuXHRcdFx0aWYoIGN1cnJlbnRCYWNrZ3JvdW5kSGFzaCAmJiBjdXJyZW50QmFja2dyb3VuZEhhc2ggPT09IHByZXZpb3VzQmFja2dyb3VuZEhhc2ggJiYgY3VycmVudEJhY2tncm91bmQgIT09IHByZXZpb3VzQmFja2dyb3VuZCApIHtcblx0XHRcdFx0ZG9tLmJhY2tncm91bmQuY2xhc3NMaXN0LmFkZCggJ25vLXRyYW5zaXRpb24nICk7XG5cdFx0XHR9XG5cblx0XHRcdHByZXZpb3VzQmFja2dyb3VuZCA9IGN1cnJlbnRCYWNrZ3JvdW5kO1xuXG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlcmUncyBhIGJhY2tncm91bmQgYnJpZ2h0bmVzcyBmbGFnIGZvciB0aGlzIHNsaWRlLFxuXHRcdC8vIGJ1YmJsZSBpdCB0byB0aGUgLnJldmVhbCBjb250YWluZXJcblx0XHRpZiggY3VycmVudFNsaWRlICkge1xuXHRcdFx0WyAnaGFzLWxpZ2h0LWJhY2tncm91bmQnLCAnaGFzLWRhcmstYmFja2dyb3VuZCcgXS5mb3JFYWNoKCBmdW5jdGlvbiggY2xhc3NUb0J1YmJsZSApIHtcblx0XHRcdFx0aWYoIGN1cnJlbnRTbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoIGNsYXNzVG9CdWJibGUgKSApIHtcblx0XHRcdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QuYWRkKCBjbGFzc1RvQnViYmxlICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggY2xhc3NUb0J1YmJsZSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0Ly8gQWxsb3cgdGhlIGZpcnN0IGJhY2tncm91bmQgdG8gYXBwbHkgd2l0aG91dCB0cmFuc2l0aW9uXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRkb20uYmFja2dyb3VuZC5jbGFzc0xpc3QucmVtb3ZlKCAnbm8tdHJhbnNpdGlvbicgKTtcblx0XHR9LCAxICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBwb3NpdGlvbiBvZiB0aGUgcGFyYWxsYXggYmFja2dyb3VuZCBiYXNlZFxuXHQgKiBvbiB0aGUgY3VycmVudCBzbGlkZSBpbmRleC5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZVBhcmFsbGF4KCkge1xuXG5cdFx0aWYoIGNvbmZpZy5wYXJhbGxheEJhY2tncm91bmRJbWFnZSApIHtcblxuXHRcdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApLFxuXHRcdFx0XHR2ZXJ0aWNhbFNsaWRlcyA9IGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIFZFUlRJQ0FMX1NMSURFU19TRUxFQ1RPUiApO1xuXG5cdFx0XHR2YXIgYmFja2dyb3VuZFNpemUgPSBkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZS5zcGxpdCggJyAnICksXG5cdFx0XHRcdGJhY2tncm91bmRXaWR0aCwgYmFja2dyb3VuZEhlaWdodDtcblxuXHRcdFx0aWYoIGJhY2tncm91bmRTaXplLmxlbmd0aCA9PT0gMSApIHtcblx0XHRcdFx0YmFja2dyb3VuZFdpZHRoID0gYmFja2dyb3VuZEhlaWdodCA9IHBhcnNlSW50KCBiYWNrZ3JvdW5kU2l6ZVswXSwgMTAgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRiYWNrZ3JvdW5kV2lkdGggPSBwYXJzZUludCggYmFja2dyb3VuZFNpemVbMF0sIDEwICk7XG5cdFx0XHRcdGJhY2tncm91bmRIZWlnaHQgPSBwYXJzZUludCggYmFja2dyb3VuZFNpemVbMV0sIDEwICk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBzbGlkZVdpZHRoID0gZG9tLmJhY2tncm91bmQub2Zmc2V0V2lkdGgsXG5cdFx0XHRcdGhvcml6b250YWxTbGlkZUNvdW50ID0gaG9yaXpvbnRhbFNsaWRlcy5sZW5ndGgsXG5cdFx0XHRcdGhvcml6b250YWxPZmZzZXRNdWx0aXBsaWVyLFxuXHRcdFx0XHRob3Jpem9udGFsT2Zmc2V0O1xuXG5cdFx0XHRpZiggdHlwZW9mIGNvbmZpZy5wYXJhbGxheEJhY2tncm91bmRIb3Jpem9udGFsID09PSAnbnVtYmVyJyApIHtcblx0XHRcdFx0aG9yaXpvbnRhbE9mZnNldE11bHRpcGxpZXIgPSBjb25maWcucGFyYWxsYXhCYWNrZ3JvdW5kSG9yaXpvbnRhbDtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRob3Jpem9udGFsT2Zmc2V0TXVsdGlwbGllciA9IGhvcml6b250YWxTbGlkZUNvdW50ID4gMSA/ICggYmFja2dyb3VuZFdpZHRoIC0gc2xpZGVXaWR0aCApIC8gKCBob3Jpem9udGFsU2xpZGVDb3VudC0xICkgOiAwO1xuXHRcdFx0fVxuXG5cdFx0XHRob3Jpem9udGFsT2Zmc2V0ID0gaG9yaXpvbnRhbE9mZnNldE11bHRpcGxpZXIgKiBpbmRleGggKiAtMTtcblxuXHRcdFx0dmFyIHNsaWRlSGVpZ2h0ID0gZG9tLmJhY2tncm91bmQub2Zmc2V0SGVpZ2h0LFxuXHRcdFx0XHR2ZXJ0aWNhbFNsaWRlQ291bnQgPSB2ZXJ0aWNhbFNsaWRlcy5sZW5ndGgsXG5cdFx0XHRcdHZlcnRpY2FsT2Zmc2V0TXVsdGlwbGllcixcblx0XHRcdFx0dmVydGljYWxPZmZzZXQ7XG5cblx0XHRcdGlmKCB0eXBlb2YgY29uZmlnLnBhcmFsbGF4QmFja2dyb3VuZFZlcnRpY2FsID09PSAnbnVtYmVyJyApIHtcblx0XHRcdFx0dmVydGljYWxPZmZzZXRNdWx0aXBsaWVyID0gY29uZmlnLnBhcmFsbGF4QmFja2dyb3VuZFZlcnRpY2FsO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHZlcnRpY2FsT2Zmc2V0TXVsdGlwbGllciA9ICggYmFja2dyb3VuZEhlaWdodCAtIHNsaWRlSGVpZ2h0ICkgLyAoIHZlcnRpY2FsU2xpZGVDb3VudC0xICk7XG5cdFx0XHR9XG5cblx0XHRcdHZlcnRpY2FsT2Zmc2V0ID0gdmVydGljYWxTbGlkZUNvdW50ID4gMCA/ICB2ZXJ0aWNhbE9mZnNldE11bHRpcGxpZXIgKiBpbmRleHYgOiAwO1xuXG5cdFx0XHRkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSBob3Jpem9udGFsT2Zmc2V0ICsgJ3B4ICcgKyAtdmVydGljYWxPZmZzZXQgKyAncHgnO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2FsbGVkIHdoZW4gdGhlIGdpdmVuIHNsaWRlIGlzIHdpdGhpbiB0aGUgY29uZmlndXJlZCB2aWV3XG5cdCAqIGRpc3RhbmNlLiBTaG93cyB0aGUgc2xpZGUgZWxlbWVudCBhbmQgbG9hZHMgYW55IGNvbnRlbnRcblx0ICogdGhhdCBpcyBzZXQgdG8gbG9hZCBsYXppbHkgKGRhdGEtc3JjKS5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gc2xpZGUgU2xpZGUgdG8gc2hvd1xuXHQgKi9cblx0LyoqXG5cdCAqIENhbGxlZCB3aGVuIHRoZSBnaXZlbiBzbGlkZSBpcyB3aXRoaW4gdGhlIGNvbmZpZ3VyZWQgdmlld1xuXHQgKiBkaXN0YW5jZS4gU2hvd3MgdGhlIHNsaWRlIGVsZW1lbnQgYW5kIGxvYWRzIGFueSBjb250ZW50XG5cdCAqIHRoYXQgaXMgc2V0IHRvIGxvYWQgbGF6aWx5IChkYXRhLXNyYykuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHNsaWRlIFNsaWRlIHRvIHNob3dcblx0ICovXG5cdGZ1bmN0aW9uIHNob3dTbGlkZSggc2xpZGUgKSB7XG5cblx0XHQvLyBTaG93IHRoZSBzbGlkZSBlbGVtZW50XG5cdFx0c2xpZGUuc3R5bGUuZGlzcGxheSA9IGNvbmZpZy5kaXNwbGF5O1xuXG5cdFx0Ly8gTWVkaWEgZWxlbWVudHMgd2l0aCBkYXRhLXNyYyBhdHRyaWJ1dGVzXG5cdFx0dG9BcnJheSggc2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ2ltZ1tkYXRhLXNyY10sIHZpZGVvW2RhdGEtc3JjXSwgYXVkaW9bZGF0YS1zcmNdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZSggJ3NyYycsIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1zcmMnICkgKTtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCAnZGF0YS1zcmMnICk7XG5cdFx0fSApO1xuXG5cdFx0Ly8gTWVkaWEgZWxlbWVudHMgd2l0aCA8c291cmNlPiBjaGlsZHJlblxuXHRcdHRvQXJyYXkoIHNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICd2aWRlbywgYXVkaW8nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggbWVkaWEgKSB7XG5cdFx0XHR2YXIgc291cmNlcyA9IDA7XG5cblx0XHRcdHRvQXJyYXkoIG1lZGlhLnF1ZXJ5U2VsZWN0b3JBbGwoICdzb3VyY2VbZGF0YS1zcmNdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIHNvdXJjZSApIHtcblx0XHRcdFx0c291cmNlLnNldEF0dHJpYnV0ZSggJ3NyYycsIHNvdXJjZS5nZXRBdHRyaWJ1dGUoICdkYXRhLXNyYycgKSApO1xuXHRcdFx0XHRzb3VyY2UucmVtb3ZlQXR0cmlidXRlKCAnZGF0YS1zcmMnICk7XG5cdFx0XHRcdHNvdXJjZXMgKz0gMTtcblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gSWYgd2UgcmV3cm90ZSBzb3VyY2VzIGZvciB0aGlzIHZpZGVvL2F1ZGlvIGVsZW1lbnQsIHdlIG5lZWRcblx0XHRcdC8vIHRvIG1hbnVhbGx5IHRlbGwgaXQgdG8gbG9hZCBmcm9tIGl0cyBuZXcgb3JpZ2luXG5cdFx0XHRpZiggc291cmNlcyA+IDAgKSB7XG5cdFx0XHRcdG1lZGlhLmxvYWQoKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblxuXHRcdC8vIFNob3cgdGhlIGNvcnJlc3BvbmRpbmcgYmFja2dyb3VuZCBlbGVtZW50XG5cdFx0dmFyIGluZGljZXMgPSBnZXRJbmRpY2VzKCBzbGlkZSApO1xuXHRcdHZhciBiYWNrZ3JvdW5kID0gZ2V0U2xpZGVCYWNrZ3JvdW5kKCBpbmRpY2VzLmgsIGluZGljZXMudiApO1xuXHRcdGlmKCBiYWNrZ3JvdW5kICkge1xuXHRcdFx0YmFja2dyb3VuZC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuXHRcdFx0Ly8gSWYgdGhlIGJhY2tncm91bmQgY29udGFpbnMgbWVkaWEsIGxvYWQgaXRcblx0XHRcdGlmKCBiYWNrZ3JvdW5kLmhhc0F0dHJpYnV0ZSggJ2RhdGEtbG9hZGVkJyApID09PSBmYWxzZSApIHtcblx0XHRcdFx0YmFja2dyb3VuZC5zZXRBdHRyaWJ1dGUoICdkYXRhLWxvYWRlZCcsICd0cnVlJyApO1xuXG5cdFx0XHRcdHZhciBiYWNrZ3JvdW5kSW1hZ2UgPSBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtaW1hZ2UnICksXG5cdFx0XHRcdFx0YmFja2dyb3VuZFZpZGVvID0gc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXZpZGVvJyApLFxuXHRcdFx0XHRcdGJhY2tncm91bmRWaWRlb0xvb3AgPSBzbGlkZS5oYXNBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtdmlkZW8tbG9vcCcgKSxcblx0XHRcdFx0XHRiYWNrZ3JvdW5kVmlkZW9NdXRlZCA9IHNsaWRlLmhhc0F0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC12aWRlby1tdXRlZCcgKSxcblx0XHRcdFx0XHRiYWNrZ3JvdW5kSWZyYW1lID0gc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWlmcmFtZScgKTtcblxuXHRcdFx0XHQvLyBJbWFnZXNcblx0XHRcdFx0aWYoIGJhY2tncm91bmRJbWFnZSApIHtcblx0XHRcdFx0XHRiYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoJysgYmFja2dyb3VuZEltYWdlICsnKSc7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gVmlkZW9zXG5cdFx0XHRcdGVsc2UgaWYgKCBiYWNrZ3JvdW5kVmlkZW8gJiYgIWlzU3BlYWtlck5vdGVzKCkgKSB7XG5cdFx0XHRcdFx0dmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3ZpZGVvJyApO1xuXG5cdFx0XHRcdFx0aWYoIGJhY2tncm91bmRWaWRlb0xvb3AgKSB7XG5cdFx0XHRcdFx0XHR2aWRlby5zZXRBdHRyaWJ1dGUoICdsb29wJywgJycgKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiggYmFja2dyb3VuZFZpZGVvTXV0ZWQgKSB7XG5cdFx0XHRcdFx0XHR2aWRlby5tdXRlZCA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gSW5saW5lIHZpZGVvIHBsYXliYWNrIHdvcmtzIChhdCBsZWFzdCBpbiBNb2JpbGUgU2FmYXJpKSBhc1xuXHRcdFx0XHRcdC8vIGxvbmcgYXMgdGhlIHZpZGVvIGlzIG11dGVkIGFuZCB0aGUgYHBsYXlzaW5saW5lYCBhdHRyaWJ1dGUgaXNcblx0XHRcdFx0XHQvLyBwcmVzZW50XG5cdFx0XHRcdFx0aWYoIGlzTW9iaWxlRGV2aWNlICkge1xuXHRcdFx0XHRcdFx0dmlkZW8ubXV0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0dmlkZW8uYXV0b3BsYXkgPSB0cnVlO1xuXHRcdFx0XHRcdFx0dmlkZW8uc2V0QXR0cmlidXRlKCAncGxheXNpbmxpbmUnLCAnJyApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIFN1cHBvcnQgY29tbWEgc2VwYXJhdGVkIGxpc3RzIG9mIHZpZGVvIHNvdXJjZXNcblx0XHRcdFx0XHRiYWNrZ3JvdW5kVmlkZW8uc3BsaXQoICcsJyApLmZvckVhY2goIGZ1bmN0aW9uKCBzb3VyY2UgKSB7XG5cdFx0XHRcdFx0XHR2aWRlby5pbm5lckhUTUwgKz0gJzxzb3VyY2Ugc3JjPVwiJysgc291cmNlICsnXCI+Jztcblx0XHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0XHRiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKCB2aWRlbyApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIElmcmFtZXNcblx0XHRcdFx0ZWxzZSBpZiggYmFja2dyb3VuZElmcmFtZSApIHtcblx0XHRcdFx0XHR2YXIgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2lmcmFtZScgKTtcblx0XHRcdFx0XHRpZnJhbWUuc2V0QXR0cmlidXRlKCAnYWxsb3dmdWxsc2NyZWVuJywgJycgKTtcblx0XHRcdFx0XHRpZnJhbWUuc2V0QXR0cmlidXRlKCAnbW96YWxsb3dmdWxsc2NyZWVuJywgJycgKTtcblx0XHRcdFx0XHRpZnJhbWUuc2V0QXR0cmlidXRlKCAnd2Via2l0YWxsb3dmdWxsc2NyZWVuJywgJycgKTtcblxuXHRcdFx0XHRcdC8vIE9ubHkgbG9hZCBhdXRvcGxheWluZyBjb250ZW50IHdoZW4gdGhlIHNsaWRlIGlzIHNob3duIHRvXG5cdFx0XHRcdFx0Ly8gYXZvaWQgaGF2aW5nIGl0IHBsYXkgaW4gdGhlIGJhY2tncm91bmRcblx0XHRcdFx0XHRpZiggL2F1dG9wbGF5PSgxfHRydWV8eWVzKS9naS50ZXN0KCBiYWNrZ3JvdW5kSWZyYW1lICkgKSB7XG5cdFx0XHRcdFx0XHRpZnJhbWUuc2V0QXR0cmlidXRlKCAnZGF0YS1zcmMnLCBiYWNrZ3JvdW5kSWZyYW1lICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0aWZyYW1lLnNldEF0dHJpYnV0ZSggJ3NyYycsIGJhY2tncm91bmRJZnJhbWUgKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZnJhbWUuc3R5bGUud2lkdGggID0gJzEwMCUnO1xuXHRcdFx0XHRcdGlmcmFtZS5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG5cdFx0XHRcdFx0aWZyYW1lLnN0eWxlLm1heEhlaWdodCA9ICcxMDAlJztcblx0XHRcdFx0XHRpZnJhbWUuc3R5bGUubWF4V2lkdGggPSAnMTAwJSc7XG5cblx0XHRcdFx0XHRiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKCBpZnJhbWUgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2FsbGVkIHdoZW4gdGhlIGdpdmVuIHNsaWRlIGlzIG1vdmVkIG91dHNpZGUgb2YgdGhlXG5cdCAqIGNvbmZpZ3VyZWQgdmlldyBkaXN0YW5jZS5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gc2xpZGVcblx0ICovXG5cdGZ1bmN0aW9uIGhpZGVTbGlkZSggc2xpZGUgKSB7XG5cblx0XHQvLyBIaWRlIHRoZSBzbGlkZSBlbGVtZW50XG5cdFx0c2xpZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuXHRcdC8vIEhpZGUgdGhlIGNvcnJlc3BvbmRpbmcgYmFja2dyb3VuZCBlbGVtZW50XG5cdFx0dmFyIGluZGljZXMgPSBnZXRJbmRpY2VzKCBzbGlkZSApO1xuXHRcdHZhciBiYWNrZ3JvdW5kID0gZ2V0U2xpZGVCYWNrZ3JvdW5kKCBpbmRpY2VzLmgsIGluZGljZXMudiApO1xuXHRcdGlmKCBiYWNrZ3JvdW5kICkge1xuXHRcdFx0YmFja2dyb3VuZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIERldGVybWluZSB3aGF0IGF2YWlsYWJsZSByb3V0ZXMgdGhlcmUgYXJlIGZvciBuYXZpZ2F0aW9uLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHt7bGVmdDogYm9vbGVhbiwgcmlnaHQ6IGJvb2xlYW4sIHVwOiBib29sZWFuLCBkb3duOiBib29sZWFufX1cblx0ICovXG5cdGZ1bmN0aW9uIGF2YWlsYWJsZVJvdXRlcygpIHtcblxuXHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSxcblx0XHRcdHZlcnRpY2FsU2xpZGVzID0gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggVkVSVElDQUxfU0xJREVTX1NFTEVDVE9SICk7XG5cblx0XHR2YXIgcm91dGVzID0ge1xuXHRcdFx0bGVmdDogaW5kZXhoID4gMCB8fCBjb25maWcubG9vcCxcblx0XHRcdHJpZ2h0OiBpbmRleGggPCBob3Jpem9udGFsU2xpZGVzLmxlbmd0aCAtIDEgfHwgY29uZmlnLmxvb3AsXG5cdFx0XHR1cDogaW5kZXh2ID4gMCxcblx0XHRcdGRvd246IGluZGV4diA8IHZlcnRpY2FsU2xpZGVzLmxlbmd0aCAtIDFcblx0XHR9O1xuXG5cdFx0Ly8gcmV2ZXJzZSBob3Jpem9udGFsIGNvbnRyb2xzIGZvciBydGxcblx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdHZhciBsZWZ0ID0gcm91dGVzLmxlZnQ7XG5cdFx0XHRyb3V0ZXMubGVmdCA9IHJvdXRlcy5yaWdodDtcblx0XHRcdHJvdXRlcy5yaWdodCA9IGxlZnQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJvdXRlcztcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGF2YWlsYWJsZSBmcmFnbWVudFxuXHQgKiBkaXJlY3Rpb25zLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHt7cHJldjogYm9vbGVhbiwgbmV4dDogYm9vbGVhbn19XG5cdCAqL1xuXHRmdW5jdGlvbiBhdmFpbGFibGVGcmFnbWVudHMoKSB7XG5cblx0XHRpZiggY3VycmVudFNsaWRlICYmIGNvbmZpZy5mcmFnbWVudHMgKSB7XG5cdFx0XHR2YXIgZnJhZ21lbnRzID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICk7XG5cdFx0XHR2YXIgaGlkZGVuRnJhZ21lbnRzID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQ6bm90KC52aXNpYmxlKScgKTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cHJldjogZnJhZ21lbnRzLmxlbmd0aCAtIGhpZGRlbkZyYWdtZW50cy5sZW5ndGggPiAwLFxuXHRcdFx0XHRuZXh0OiAhIWhpZGRlbkZyYWdtZW50cy5sZW5ndGhcblx0XHRcdH07XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHsgcHJldjogZmFsc2UsIG5leHQ6IGZhbHNlIH07XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogRW5mb3JjZXMgb3JpZ2luLXNwZWNpZmljIGZvcm1hdCBydWxlcyBmb3IgZW1iZWRkZWQgbWVkaWEuXG5cdCAqL1xuXHRmdW5jdGlvbiBmb3JtYXRFbWJlZGRlZENvbnRlbnQoKSB7XG5cblx0XHR2YXIgX2FwcGVuZFBhcmFtVG9JZnJhbWVTb3VyY2UgPSBmdW5jdGlvbiggc291cmNlQXR0cmlidXRlLCBzb3VyY2VVUkwsIHBhcmFtICkge1xuXHRcdFx0dG9BcnJheSggZG9tLnNsaWRlcy5xdWVyeVNlbGVjdG9yQWxsKCAnaWZyYW1lWycrIHNvdXJjZUF0dHJpYnV0ZSArJyo9XCInKyBzb3VyY2VVUkwgKydcIl0nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdHZhciBzcmMgPSBlbC5nZXRBdHRyaWJ1dGUoIHNvdXJjZUF0dHJpYnV0ZSApO1xuXHRcdFx0XHRpZiggc3JjICYmIHNyYy5pbmRleE9mKCBwYXJhbSApID09PSAtMSApIHtcblx0XHRcdFx0XHRlbC5zZXRBdHRyaWJ1dGUoIHNvdXJjZUF0dHJpYnV0ZSwgc3JjICsgKCAhL1xcPy8udGVzdCggc3JjICkgPyAnPycgOiAnJicgKSArIHBhcmFtICk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvLyBZb3VUdWJlIGZyYW1lcyBtdXN0IGluY2x1ZGUgXCI/ZW5hYmxlanNhcGk9MVwiXG5cdFx0X2FwcGVuZFBhcmFtVG9JZnJhbWVTb3VyY2UoICdzcmMnLCAneW91dHViZS5jb20vZW1iZWQvJywgJ2VuYWJsZWpzYXBpPTEnICk7XG5cdFx0X2FwcGVuZFBhcmFtVG9JZnJhbWVTb3VyY2UoICdkYXRhLXNyYycsICd5b3V0dWJlLmNvbS9lbWJlZC8nLCAnZW5hYmxlanNhcGk9MScgKTtcblxuXHRcdC8vIFZpbWVvIGZyYW1lcyBtdXN0IGluY2x1ZGUgXCI/YXBpPTFcIlxuXHRcdF9hcHBlbmRQYXJhbVRvSWZyYW1lU291cmNlKCAnc3JjJywgJ3BsYXllci52aW1lby5jb20vJywgJ2FwaT0xJyApO1xuXHRcdF9hcHBlbmRQYXJhbVRvSWZyYW1lU291cmNlKCAnZGF0YS1zcmMnLCAncGxheWVyLnZpbWVvLmNvbS8nLCAnYXBpPTEnICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTdGFydCBwbGF5YmFjayBvZiBhbnkgZW1iZWRkZWQgY29udGVudCBpbnNpZGUgb2Zcblx0ICogdGhlIGdpdmVuIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcblx0ICovXG5cdGZ1bmN0aW9uIHN0YXJ0RW1iZWRkZWRDb250ZW50KCBlbGVtZW50ICkge1xuXG5cdFx0aWYoIGVsZW1lbnQgJiYgIWlzU3BlYWtlck5vdGVzKCkgKSB7XG5cblx0XHRcdC8vIFJlc3RhcnQgR0lGc1xuXHRcdFx0dG9BcnJheSggZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnaW1nW3NyYyQ9XCIuZ2lmXCJdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHQvLyBTZXR0aW5nIHRoZSBzYW1lIHVuY2hhbmdlZCBzb3VyY2UgbGlrZSB0aGlzIHdhcyBjb25maXJtZWRcblx0XHRcdFx0Ly8gdG8gd29yayBpbiBDaHJvbWUsIEZGICYgU2FmYXJpXG5cdFx0XHRcdGVsLnNldEF0dHJpYnV0ZSggJ3NyYycsIGVsLmdldEF0dHJpYnV0ZSggJ3NyYycgKSApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHQvLyBIVE1MNSBtZWRpYSBlbGVtZW50c1xuXHRcdFx0dG9BcnJheSggZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCAndmlkZW8sIGF1ZGlvJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRpZiggY2xvc2VzdFBhcmVudCggZWwsICcuZnJhZ21lbnQnICkgJiYgIWNsb3Nlc3RQYXJlbnQoIGVsLCAnLmZyYWdtZW50LnZpc2libGUnICkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUHJlZmVyIGFuIGV4cGxpY2l0IGdsb2JhbCBhdXRvcGxheSBzZXR0aW5nXG5cdFx0XHRcdHZhciBhdXRvcGxheSA9IGNvbmZpZy5hdXRvUGxheU1lZGlhO1xuXG5cdFx0XHRcdC8vIElmIG5vIGdsb2JhbCBzZXR0aW5nIGlzIGF2YWlsYWJsZSwgZmFsbCBiYWNrIG9uIHRoZSBlbGVtZW50J3Ncblx0XHRcdFx0Ly8gb3duIGF1dG9wbGF5IHNldHRpbmdcblx0XHRcdFx0aWYoIHR5cGVvZiBhdXRvcGxheSAhPT0gJ2Jvb2xlYW4nICkge1xuXHRcdFx0XHRcdGF1dG9wbGF5ID0gZWwuaGFzQXR0cmlidXRlKCAnZGF0YS1hdXRvcGxheScgKSB8fCAhIWNsb3Nlc3RQYXJlbnQoIGVsLCAnLnNsaWRlLWJhY2tncm91bmQnICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiggYXV0b3BsYXkgJiYgdHlwZW9mIGVsLnBsYXkgPT09ICdmdW5jdGlvbicgKSB7XG5cblx0XHRcdFx0XHRpZiggZWwucmVhZHlTdGF0ZSA+IDEgKSB7XG5cdFx0XHRcdFx0XHRzdGFydEVtYmVkZGVkTWVkaWEoIHsgdGFyZ2V0OiBlbCB9ICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2xvYWRlZGRhdGEnLCBzdGFydEVtYmVkZGVkTWVkaWEgKTsgLy8gcmVtb3ZlIGZpcnN0IHRvIGF2b2lkIGR1cGVzXG5cdFx0XHRcdFx0XHRlbC5hZGRFdmVudExpc3RlbmVyKCAnbG9hZGVkZGF0YScsIHN0YXJ0RW1iZWRkZWRNZWRpYSApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIE5vcm1hbCBpZnJhbWVzXG5cdFx0XHR0b0FycmF5KCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWVbc3JjXScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0aWYoIGNsb3Nlc3RQYXJlbnQoIGVsLCAnLmZyYWdtZW50JyApICYmICFjbG9zZXN0UGFyZW50KCBlbCwgJy5mcmFnbWVudC52aXNpYmxlJyApICkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHN0YXJ0RW1iZWRkZWRJZnJhbWUoIHsgdGFyZ2V0OiBlbCB9ICk7XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIExhenkgbG9hZGluZyBpZnJhbWVzXG5cdFx0XHR0b0FycmF5KCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWVbZGF0YS1zcmNdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRpZiggY2xvc2VzdFBhcmVudCggZWwsICcuZnJhZ21lbnQnICkgJiYgIWNsb3Nlc3RQYXJlbnQoIGVsLCAnLmZyYWdtZW50LnZpc2libGUnICkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIGVsLmdldEF0dHJpYnV0ZSggJ3NyYycgKSAhPT0gZWwuZ2V0QXR0cmlidXRlKCAnZGF0YS1zcmMnICkgKSB7XG5cdFx0XHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBzdGFydEVtYmVkZGVkSWZyYW1lICk7IC8vIHJlbW92ZSBmaXJzdCB0byBhdm9pZCBkdXBlc1xuXHRcdFx0XHRcdGVsLmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgc3RhcnRFbWJlZGRlZElmcmFtZSApO1xuXHRcdFx0XHRcdGVsLnNldEF0dHJpYnV0ZSggJ3NyYycsIGVsLmdldEF0dHJpYnV0ZSggJ2RhdGEtc3JjJyApICk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFN0YXJ0cyBwbGF5aW5nIGFuIGVtYmVkZGVkIHZpZGVvL2F1ZGlvIGVsZW1lbnQgYWZ0ZXJcblx0ICogaXQgaGFzIGZpbmlzaGVkIGxvYWRpbmcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxuXHQgKi9cblx0ZnVuY3Rpb24gc3RhcnRFbWJlZGRlZE1lZGlhKCBldmVudCApIHtcblxuXHRcdHZhciBpc0F0dGFjaGVkVG9ET00gPSAhIWNsb3Nlc3RQYXJlbnQoIGV2ZW50LnRhcmdldCwgJ2h0bWwnICksXG5cdFx0XHRpc1Zpc2libGUgIFx0XHQ9ICEhY2xvc2VzdFBhcmVudCggZXZlbnQudGFyZ2V0LCAnLnByZXNlbnQnICk7XG5cblx0XHRpZiggaXNBdHRhY2hlZFRvRE9NICYmIGlzVmlzaWJsZSApIHtcblx0XHRcdGV2ZW50LnRhcmdldC5jdXJyZW50VGltZSA9IDA7XG5cdFx0XHRldmVudC50YXJnZXQucGxheSgpO1xuXHRcdH1cblxuXHRcdGV2ZW50LnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbG9hZGVkZGF0YScsIHN0YXJ0RW1iZWRkZWRNZWRpYSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogXCJTdGFydHNcIiB0aGUgY29udGVudCBvZiBhbiBlbWJlZGRlZCBpZnJhbWUgdXNpbmcgdGhlXG5cdCAqIHBvc3RNZXNzYWdlIEFQSS5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBzdGFydEVtYmVkZGVkSWZyYW1lKCBldmVudCApIHtcblxuXHRcdHZhciBpZnJhbWUgPSBldmVudC50YXJnZXQ7XG5cblx0XHRpZiggaWZyYW1lICYmIGlmcmFtZS5jb250ZW50V2luZG93ICkge1xuXG5cdFx0XHR2YXIgaXNBdHRhY2hlZFRvRE9NID0gISFjbG9zZXN0UGFyZW50KCBldmVudC50YXJnZXQsICdodG1sJyApLFxuXHRcdFx0XHRpc1Zpc2libGUgIFx0XHQ9ICEhY2xvc2VzdFBhcmVudCggZXZlbnQudGFyZ2V0LCAnLnByZXNlbnQnICk7XG5cblx0XHRcdGlmKCBpc0F0dGFjaGVkVG9ET00gJiYgaXNWaXNpYmxlICkge1xuXG5cdFx0XHRcdC8vIFByZWZlciBhbiBleHBsaWNpdCBnbG9iYWwgYXV0b3BsYXkgc2V0dGluZ1xuXHRcdFx0XHR2YXIgYXV0b3BsYXkgPSBjb25maWcuYXV0b1BsYXlNZWRpYTtcblxuXHRcdFx0XHQvLyBJZiBubyBnbG9iYWwgc2V0dGluZyBpcyBhdmFpbGFibGUsIGZhbGwgYmFjayBvbiB0aGUgZWxlbWVudCdzXG5cdFx0XHRcdC8vIG93biBhdXRvcGxheSBzZXR0aW5nXG5cdFx0XHRcdGlmKCB0eXBlb2YgYXV0b3BsYXkgIT09ICdib29sZWFuJyApIHtcblx0XHRcdFx0XHRhdXRvcGxheSA9IGlmcmFtZS5oYXNBdHRyaWJ1dGUoICdkYXRhLWF1dG9wbGF5JyApIHx8ICEhY2xvc2VzdFBhcmVudCggaWZyYW1lLCAnLnNsaWRlLWJhY2tncm91bmQnICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBZb3VUdWJlIHBvc3RNZXNzYWdlIEFQSVxuXHRcdFx0XHRpZiggL3lvdXR1YmVcXC5jb21cXC9lbWJlZFxcLy8udGVzdCggaWZyYW1lLmdldEF0dHJpYnV0ZSggJ3NyYycgKSApICYmIGF1dG9wbGF5ICkge1xuXHRcdFx0XHRcdGlmcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCAne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gVmltZW8gcG9zdE1lc3NhZ2UgQVBJXG5cdFx0XHRcdGVsc2UgaWYoIC9wbGF5ZXJcXC52aW1lb1xcLmNvbVxcLy8udGVzdCggaWZyYW1lLmdldEF0dHJpYnV0ZSggJ3NyYycgKSApICYmIGF1dG9wbGF5ICkge1xuXHRcdFx0XHRcdGlmcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCAne1wibWV0aG9kXCI6XCJwbGF5XCJ9JywgJyonICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gR2VuZXJpYyBwb3N0TWVzc2FnZSBBUElcblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0aWZyYW1lLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoICdzbGlkZTpzdGFydCcsICcqJyApO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFN0b3AgcGxheWJhY2sgb2YgYW55IGVtYmVkZGVkIGNvbnRlbnQgaW5zaWRlIG9mXG5cdCAqIHRoZSB0YXJnZXRlZCBzbGlkZS5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuXHQgKi9cblx0ZnVuY3Rpb24gc3RvcEVtYmVkZGVkQ29udGVudCggZWxlbWVudCApIHtcblxuXHRcdGlmKCBlbGVtZW50ICYmIGVsZW1lbnQucGFyZW50Tm9kZSApIHtcblx0XHRcdC8vIEhUTUw1IG1lZGlhIGVsZW1lbnRzXG5cdFx0XHR0b0FycmF5KCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICd2aWRlbywgYXVkaW8nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdGlmKCAhZWwuaGFzQXR0cmlidXRlKCAnZGF0YS1pZ25vcmUnICkgJiYgdHlwZW9mIGVsLnBhdXNlID09PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0XHRcdGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1wYXVzZWQtYnktcmV2ZWFsJywgJycpO1xuXHRcdFx0XHRcdGVsLnBhdXNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gR2VuZXJpYyBwb3N0TWVzc2FnZSBBUEkgZm9yIG5vbi1sYXp5IGxvYWRlZCBpZnJhbWVzXG5cdFx0XHR0b0FycmF5KCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWUnICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdGlmKCBlbC5jb250ZW50V2luZG93ICkgZWwuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSggJ3NsaWRlOnN0b3AnLCAnKicgKTtcblx0XHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBzdGFydEVtYmVkZGVkSWZyYW1lICk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gWW91VHViZSBwb3N0TWVzc2FnZSBBUElcblx0XHRcdHRvQXJyYXkoIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJ2lmcmFtZVtzcmMqPVwieW91dHViZS5jb20vZW1iZWQvXCJdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRpZiggIWVsLmhhc0F0dHJpYnV0ZSggJ2RhdGEtaWdub3JlJyApICYmIGVsLmNvbnRlbnRXaW5kb3cgJiYgdHlwZW9mIGVsLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRcdFx0ZWwuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSggJ3tcImV2ZW50XCI6XCJjb21tYW5kXCIsXCJmdW5jXCI6XCJwYXVzZVZpZGVvXCIsXCJhcmdzXCI6XCJcIn0nLCAnKicgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIFZpbWVvIHBvc3RNZXNzYWdlIEFQSVxuXHRcdFx0dG9BcnJheSggZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnaWZyYW1lW3NyYyo9XCJwbGF5ZXIudmltZW8uY29tL1wiXScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0aWYoICFlbC5oYXNBdHRyaWJ1dGUoICdkYXRhLWlnbm9yZScgKSAmJiBlbC5jb250ZW50V2luZG93ICYmIHR5cGVvZiBlbC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlID09PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0XHRcdGVsLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoICd7XCJtZXRob2RcIjpcInBhdXNlXCJ9JywgJyonICk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBMYXp5IGxvYWRpbmcgaWZyYW1lc1xuXHRcdFx0dG9BcnJheSggZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnaWZyYW1lW2RhdGEtc3JjXScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0Ly8gT25seSByZW1vdmluZyB0aGUgc3JjIGRvZXNuJ3QgYWN0dWFsbHkgdW5sb2FkIHRoZSBmcmFtZVxuXHRcdFx0XHQvLyBpbiBhbGwgYnJvd3NlcnMgKEZpcmVmb3gpIHNvIHdlIHNldCBpdCB0byBibGFuayBmaXJzdFxuXHRcdFx0XHRlbC5zZXRBdHRyaWJ1dGUoICdzcmMnLCAnYWJvdXQ6YmxhbmsnICk7XG5cdFx0XHRcdGVsLnJlbW92ZUF0dHJpYnV0ZSggJ3NyYycgKTtcblx0XHRcdH0gKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgcGFzdCBzbGlkZXMuIFRoaXMgY2FuIGJlIHVzZWQgYXMgYSBnbG9iYWxcblx0ICogZmxhdHRlbmVkIGluZGV4IGZvciBzbGlkZXMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge251bWJlcn0gUGFzdCBzbGlkZSBjb3VudFxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0U2xpZGVQYXN0Q291bnQoKSB7XG5cblx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlcyA9IHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKTtcblxuXHRcdC8vIFRoZSBudW1iZXIgb2YgcGFzdCBzbGlkZXNcblx0XHR2YXIgcGFzdENvdW50ID0gMDtcblxuXHRcdC8vIFN0ZXAgdGhyb3VnaCBhbGwgc2xpZGVzIGFuZCBjb3VudCB0aGUgcGFzdCBvbmVzXG5cdFx0bWFpbkxvb3A6IGZvciggdmFyIGkgPSAwOyBpIDwgaG9yaXpvbnRhbFNsaWRlcy5sZW5ndGg7IGkrKyApIHtcblxuXHRcdFx0dmFyIGhvcml6b250YWxTbGlkZSA9IGhvcml6b250YWxTbGlkZXNbaV07XG5cdFx0XHR2YXIgdmVydGljYWxTbGlkZXMgPSB0b0FycmF5KCBob3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkgKTtcblxuXHRcdFx0Zm9yKCB2YXIgaiA9IDA7IGogPCB2ZXJ0aWNhbFNsaWRlcy5sZW5ndGg7IGorKyApIHtcblxuXHRcdFx0XHQvLyBTdG9wIGFzIHNvb24gYXMgd2UgYXJyaXZlIGF0IHRoZSBwcmVzZW50XG5cdFx0XHRcdGlmKCB2ZXJ0aWNhbFNsaWRlc1tqXS5jbGFzc0xpc3QuY29udGFpbnMoICdwcmVzZW50JyApICkge1xuXHRcdFx0XHRcdGJyZWFrIG1haW5Mb29wO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cGFzdENvdW50Kys7XG5cblx0XHRcdH1cblxuXHRcdFx0Ly8gU3RvcCBhcyBzb29uIGFzIHdlIGFycml2ZSBhdCB0aGUgcHJlc2VudFxuXHRcdFx0aWYoIGhvcml6b250YWxTbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoICdwcmVzZW50JyApICkge1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0Ly8gRG9uJ3QgY291bnQgdGhlIHdyYXBwaW5nIHNlY3Rpb24gZm9yIHZlcnRpY2FsIHNsaWRlc1xuXHRcdFx0aWYoIGhvcml6b250YWxTbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoICdzdGFjaycgKSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdHBhc3RDb3VudCsrO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHBhc3RDb3VudDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSB2YWx1ZSByYW5naW5nIGZyb20gMC0xIHRoYXQgcmVwcmVzZW50c1xuXHQgKiBob3cgZmFyIGludG8gdGhlIHByZXNlbnRhdGlvbiB3ZSBoYXZlIG5hdmlnYXRlZC5cblx0ICpcblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0UHJvZ3Jlc3MoKSB7XG5cblx0XHQvLyBUaGUgbnVtYmVyIG9mIHBhc3QgYW5kIHRvdGFsIHNsaWRlc1xuXHRcdHZhciB0b3RhbENvdW50ID0gZ2V0VG90YWxTbGlkZXMoKTtcblx0XHR2YXIgcGFzdENvdW50ID0gZ2V0U2xpZGVQYXN0Q291bnQoKTtcblxuXHRcdGlmKCBjdXJyZW50U2xpZGUgKSB7XG5cblx0XHRcdHZhciBhbGxGcmFnbWVudHMgPSBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKTtcblxuXHRcdFx0Ly8gSWYgdGhlcmUgYXJlIGZyYWdtZW50cyBpbiB0aGUgY3VycmVudCBzbGlkZSB0aG9zZSBzaG91bGQgYmVcblx0XHRcdC8vIGFjY291bnRlZCBmb3IgaW4gdGhlIHByb2dyZXNzLlxuXHRcdFx0aWYoIGFsbEZyYWdtZW50cy5sZW5ndGggPiAwICkge1xuXHRcdFx0XHR2YXIgdmlzaWJsZUZyYWdtZW50cyA9IGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50LnZpc2libGUnICk7XG5cblx0XHRcdFx0Ly8gVGhpcyB2YWx1ZSByZXByZXNlbnRzIGhvdyBiaWcgYSBwb3J0aW9uIG9mIHRoZSBzbGlkZSBwcm9ncmVzc1xuXHRcdFx0XHQvLyB0aGF0IGlzIG1hZGUgdXAgYnkgaXRzIGZyYWdtZW50cyAoMC0xKVxuXHRcdFx0XHR2YXIgZnJhZ21lbnRXZWlnaHQgPSAwLjk7XG5cblx0XHRcdFx0Ly8gQWRkIGZyYWdtZW50IHByb2dyZXNzIHRvIHRoZSBwYXN0IHNsaWRlIGNvdW50XG5cdFx0XHRcdHBhc3RDb3VudCArPSAoIHZpc2libGVGcmFnbWVudHMubGVuZ3RoIC8gYWxsRnJhZ21lbnRzLmxlbmd0aCApICogZnJhZ21lbnRXZWlnaHQ7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gcGFzdENvdW50IC8gKCB0b3RhbENvdW50IC0gMSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIHRoaXMgcHJlc2VudGF0aW9uIGlzIHJ1bm5pbmcgaW5zaWRlIG9mIHRoZVxuXHQgKiBzcGVha2VyIG5vdGVzIHdpbmRvdy5cblx0ICpcblx0ICogQHJldHVybiB7Ym9vbGVhbn1cblx0ICovXG5cdGZ1bmN0aW9uIGlzU3BlYWtlck5vdGVzKCkge1xuXG5cdFx0cmV0dXJuICEhd2luZG93LmxvY2F0aW9uLnNlYXJjaC5tYXRjaCggL3JlY2VpdmVyL2dpICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZWFkcyB0aGUgY3VycmVudCBVUkwgKGhhc2gpIGFuZCBuYXZpZ2F0ZXMgYWNjb3JkaW5nbHkuXG5cdCAqL1xuXHRmdW5jdGlvbiByZWFkVVJMKCkge1xuXG5cdFx0dmFyIGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcblxuXHRcdC8vIEF0dGVtcHQgdG8gcGFyc2UgdGhlIGhhc2ggYXMgZWl0aGVyIGFuIGluZGV4IG9yIG5hbWVcblx0XHR2YXIgYml0cyA9IGhhc2guc2xpY2UoIDIgKS5zcGxpdCggJy8nICksXG5cdFx0XHRuYW1lID0gaGFzaC5yZXBsYWNlKCAvI3xcXC8vZ2ksICcnICk7XG5cblx0XHQvLyBJZiB0aGUgZmlyc3QgYml0IGlzIGludmFsaWQgYW5kIHRoZXJlIGlzIGEgbmFtZSB3ZSBjYW5cblx0XHQvLyBhc3N1bWUgdGhhdCB0aGlzIGlzIGEgbmFtZWQgbGlua1xuXHRcdGlmKCBpc05hTiggcGFyc2VJbnQoIGJpdHNbMF0sIDEwICkgKSAmJiBuYW1lLmxlbmd0aCApIHtcblx0XHRcdHZhciBlbGVtZW50O1xuXG5cdFx0XHQvLyBFbnN1cmUgdGhlIG5hbWVkIGxpbmsgaXMgYSB2YWxpZCBIVE1MIElEIGF0dHJpYnV0ZVxuXHRcdFx0aWYoIC9eW2EtekEtWl1bXFx3Oi4tXSokLy50ZXN0KCBuYW1lICkgKSB7XG5cdFx0XHRcdC8vIEZpbmQgdGhlIHNsaWRlIHdpdGggdGhlIHNwZWNpZmllZCBJRFxuXHRcdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIG5hbWUgKTtcblx0XHRcdH1cblxuXHRcdFx0aWYoIGVsZW1lbnQgKSB7XG5cdFx0XHRcdC8vIEZpbmQgdGhlIHBvc2l0aW9uIG9mIHRoZSBuYW1lZCBzbGlkZSBhbmQgbmF2aWdhdGUgdG8gaXRcblx0XHRcdFx0dmFyIGluZGljZXMgPSBSZXZlYWwuZ2V0SW5kaWNlcyggZWxlbWVudCApO1xuXHRcdFx0XHRzbGlkZSggaW5kaWNlcy5oLCBpbmRpY2VzLnYgKTtcblx0XHRcdH1cblx0XHRcdC8vIElmIHRoZSBzbGlkZSBkb2Vzbid0IGV4aXN0LCBuYXZpZ2F0ZSB0byB0aGUgY3VycmVudCBzbGlkZVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHNsaWRlKCBpbmRleGggfHwgMCwgaW5kZXh2IHx8IDAgKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBSZWFkIHRoZSBpbmRleCBjb21wb25lbnRzIG9mIHRoZSBoYXNoXG5cdFx0XHR2YXIgaCA9IHBhcnNlSW50KCBiaXRzWzBdLCAxMCApIHx8IDAsXG5cdFx0XHRcdHYgPSBwYXJzZUludCggYml0c1sxXSwgMTAgKSB8fCAwO1xuXG5cdFx0XHRpZiggaCAhPT0gaW5kZXhoIHx8IHYgIT09IGluZGV4diApIHtcblx0XHRcdFx0c2xpZGUoIGgsIHYgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBwYWdlIFVSTCAoaGFzaCkgdG8gcmVmbGVjdCB0aGUgY3VycmVudFxuXHQgKiBzdGF0ZS5cblx0ICpcblx0ICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IFRoZSB0aW1lIGluIG1zIHRvIHdhaXQgYmVmb3JlXG5cdCAqIHdyaXRpbmcgdGhlIGhhc2hcblx0ICovXG5cdGZ1bmN0aW9uIHdyaXRlVVJMKCBkZWxheSApIHtcblxuXHRcdGlmKCBjb25maWcuaGlzdG9yeSApIHtcblxuXHRcdFx0Ly8gTWFrZSBzdXJlIHRoZXJlJ3MgbmV2ZXIgbW9yZSB0aGFuIG9uZSB0aW1lb3V0IHJ1bm5pbmdcblx0XHRcdGNsZWFyVGltZW91dCggd3JpdGVVUkxUaW1lb3V0ICk7XG5cblx0XHRcdC8vIElmIGEgZGVsYXkgaXMgc3BlY2lmaWVkLCB0aW1lb3V0IHRoaXMgY2FsbFxuXHRcdFx0aWYoIHR5cGVvZiBkZWxheSA9PT0gJ251bWJlcicgKSB7XG5cdFx0XHRcdHdyaXRlVVJMVGltZW91dCA9IHNldFRpbWVvdXQoIHdyaXRlVVJMLCBkZWxheSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiggY3VycmVudFNsaWRlICkge1xuXHRcdFx0XHR2YXIgdXJsID0gJy8nO1xuXG5cdFx0XHRcdC8vIEF0dGVtcHQgdG8gY3JlYXRlIGEgbmFtZWQgbGluayBiYXNlZCBvbiB0aGUgc2xpZGUncyBJRFxuXHRcdFx0XHR2YXIgaWQgPSBjdXJyZW50U2xpZGUuZ2V0QXR0cmlidXRlKCAnaWQnICk7XG5cdFx0XHRcdGlmKCBpZCApIHtcblx0XHRcdFx0XHRpZCA9IGlkLnJlcGxhY2UoIC9bXmEtekEtWjAtOVxcLVxcX1xcOlxcLl0vZywgJycgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIElmIHRoZSBjdXJyZW50IHNsaWRlIGhhcyBhbiBJRCwgdXNlIHRoYXQgYXMgYSBuYW1lZCBsaW5rXG5cdFx0XHRcdGlmKCB0eXBlb2YgaWQgPT09ICdzdHJpbmcnICYmIGlkLmxlbmd0aCApIHtcblx0XHRcdFx0XHR1cmwgPSAnLycgKyBpZDtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBPdGhlcndpc2UgdXNlIHRoZSAvaC92IGluZGV4XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGlmKCBpbmRleGggPiAwIHx8IGluZGV4diA+IDAgKSB1cmwgKz0gaW5kZXhoO1xuXHRcdFx0XHRcdGlmKCBpbmRleHYgPiAwICkgdXJsICs9ICcvJyArIGluZGV4djtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gdXJsO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIGgvdiBsb2NhdGlvbiBhbmQgZnJhZ21lbnQgb2YgdGhlIGN1cnJlbnQsXG5cdCAqIG9yIHNwZWNpZmllZCwgc2xpZGUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtzbGlkZV0gSWYgc3BlY2lmaWVkLCB0aGUgcmV0dXJuZWRcblx0ICogaW5kZXggd2lsbCBiZSBmb3IgdGhpcyBzbGlkZSByYXRoZXIgdGhhbiB0aGUgY3VycmVudGx5XG5cdCAqIGFjdGl2ZSBvbmVcblx0ICpcblx0ICogQHJldHVybiB7e2g6IG51bWJlciwgdjogbnVtYmVyLCBmOiBudW1iZXJ9fVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0SW5kaWNlcyggc2xpZGUgKSB7XG5cblx0XHQvLyBCeSBkZWZhdWx0LCByZXR1cm4gdGhlIGN1cnJlbnQgaW5kaWNlc1xuXHRcdHZhciBoID0gaW5kZXhoLFxuXHRcdFx0diA9IGluZGV4dixcblx0XHRcdGY7XG5cblx0XHQvLyBJZiBhIHNsaWRlIGlzIHNwZWNpZmllZCwgcmV0dXJuIHRoZSBpbmRpY2VzIG9mIHRoYXQgc2xpZGVcblx0XHRpZiggc2xpZGUgKSB7XG5cdFx0XHR2YXIgaXNWZXJ0aWNhbCA9IGlzVmVydGljYWxTbGlkZSggc2xpZGUgKTtcblx0XHRcdHZhciBzbGlkZWggPSBpc1ZlcnRpY2FsID8gc2xpZGUucGFyZW50Tm9kZSA6IHNsaWRlO1xuXG5cdFx0XHQvLyBTZWxlY3QgYWxsIGhvcml6b250YWwgc2xpZGVzXG5cdFx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlcyA9IHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKTtcblxuXHRcdFx0Ly8gTm93IHRoYXQgd2Uga25vdyB3aGljaCB0aGUgaG9yaXpvbnRhbCBzbGlkZSBpcywgZ2V0IGl0cyBpbmRleFxuXHRcdFx0aCA9IE1hdGgubWF4KCBob3Jpem9udGFsU2xpZGVzLmluZGV4T2YoIHNsaWRlaCApLCAwICk7XG5cblx0XHRcdC8vIEFzc3VtZSB3ZSdyZSBub3QgdmVydGljYWxcblx0XHRcdHYgPSB1bmRlZmluZWQ7XG5cblx0XHRcdC8vIElmIHRoaXMgaXMgYSB2ZXJ0aWNhbCBzbGlkZSwgZ3JhYiB0aGUgdmVydGljYWwgaW5kZXhcblx0XHRcdGlmKCBpc1ZlcnRpY2FsICkge1xuXHRcdFx0XHR2ID0gTWF0aC5tYXgoIHRvQXJyYXkoIHNsaWRlLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICkgKS5pbmRleE9mKCBzbGlkZSApLCAwICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoICFzbGlkZSAmJiBjdXJyZW50U2xpZGUgKSB7XG5cdFx0XHR2YXIgaGFzRnJhZ21lbnRzID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICkubGVuZ3RoID4gMDtcblx0XHRcdGlmKCBoYXNGcmFnbWVudHMgKSB7XG5cdFx0XHRcdHZhciBjdXJyZW50RnJhZ21lbnQgPSBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvciggJy5jdXJyZW50LWZyYWdtZW50JyApO1xuXHRcdFx0XHRpZiggY3VycmVudEZyYWdtZW50ICYmIGN1cnJlbnRGcmFnbWVudC5oYXNBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JyApICkge1xuXHRcdFx0XHRcdGYgPSBwYXJzZUludCggY3VycmVudEZyYWdtZW50LmdldEF0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnICksIDEwICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0ZiA9IGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50LnZpc2libGUnICkubGVuZ3RoIC0gMTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB7IGg6IGgsIHY6IHYsIGY6IGYgfTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyBhbGwgc2xpZGVzIGluIHRoaXMgcHJlc2VudGF0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0U2xpZGVzKCkge1xuXG5cdFx0cmV0dXJuIHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIFNMSURFU19TRUxFQ1RPUiArICc6bm90KC5zdGFjayknICkpO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSB0b3RhbCBudW1iZXIgb2Ygc2xpZGVzIGluIHRoaXMgcHJlc2VudGF0aW9uLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtudW1iZXJ9XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRUb3RhbFNsaWRlcygpIHtcblxuXHRcdHJldHVybiBnZXRTbGlkZXMoKS5sZW5ndGg7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBzbGlkZSBlbGVtZW50IG1hdGNoaW5nIHRoZSBzcGVjaWZpZWQgaW5kZXguXG5cdCAqXG5cdCAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0U2xpZGUoIHgsIHkgKSB7XG5cblx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlID0gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKVsgeCBdO1xuXHRcdHZhciB2ZXJ0aWNhbFNsaWRlcyA9IGhvcml6b250YWxTbGlkZSAmJiBob3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICk7XG5cblx0XHRpZiggdmVydGljYWxTbGlkZXMgJiYgdmVydGljYWxTbGlkZXMubGVuZ3RoICYmIHR5cGVvZiB5ID09PSAnbnVtYmVyJyApIHtcblx0XHRcdHJldHVybiB2ZXJ0aWNhbFNsaWRlcyA/IHZlcnRpY2FsU2xpZGVzWyB5IF0gOiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGhvcml6b250YWxTbGlkZTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGJhY2tncm91bmQgZWxlbWVudCBmb3IgdGhlIGdpdmVuIHNsaWRlLlxuXHQgKiBBbGwgc2xpZGVzLCBldmVuIHRoZSBvbmVzIHdpdGggbm8gYmFja2dyb3VuZCBwcm9wZXJ0aWVzXG5cdCAqIGRlZmluZWQsIGhhdmUgYSBiYWNrZ3JvdW5kIGVsZW1lbnQgc28gYXMgbG9uZyBhcyB0aGVcblx0ICogaW5kZXggaXMgdmFsaWQgYW4gZWxlbWVudCB3aWxsIGJlIHJldHVybmVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge251bWJlcn0geCBIb3Jpem9udGFsIGJhY2tncm91bmQgaW5kZXhcblx0ICogQHBhcmFtIHtudW1iZXJ9IHkgVmVydGljYWwgYmFja2dyb3VuZCBpbmRleFxuXHQgKiBAcmV0dXJuIHsoSFRNTEVsZW1lbnRbXXwqKX1cblx0ICovXG5cdGZ1bmN0aW9uIGdldFNsaWRlQmFja2dyb3VuZCggeCwgeSApIHtcblxuXHRcdC8vIFdoZW4gcHJpbnRpbmcgdG8gUERGIHRoZSBzbGlkZSBiYWNrZ3JvdW5kcyBhcmUgbmVzdGVkXG5cdFx0Ly8gaW5zaWRlIG9mIHRoZSBzbGlkZXNcblx0XHRpZiggaXNQcmludGluZ1BERigpICkge1xuXHRcdFx0dmFyIHNsaWRlID0gZ2V0U2xpZGUoIHgsIHkgKTtcblx0XHRcdGlmKCBzbGlkZSApIHtcblx0XHRcdFx0cmV0dXJuIHNsaWRlLnNsaWRlQmFja2dyb3VuZEVsZW1lbnQ7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0dmFyIGhvcml6b250YWxCYWNrZ3JvdW5kID0gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggJy5iYWNrZ3JvdW5kcz4uc2xpZGUtYmFja2dyb3VuZCcgKVsgeCBdO1xuXHRcdHZhciB2ZXJ0aWNhbEJhY2tncm91bmRzID0gaG9yaXpvbnRhbEJhY2tncm91bmQgJiYgaG9yaXpvbnRhbEJhY2tncm91bmQucXVlcnlTZWxlY3RvckFsbCggJy5zbGlkZS1iYWNrZ3JvdW5kJyApO1xuXG5cdFx0aWYoIHZlcnRpY2FsQmFja2dyb3VuZHMgJiYgdmVydGljYWxCYWNrZ3JvdW5kcy5sZW5ndGggJiYgdHlwZW9mIHkgPT09ICdudW1iZXInICkge1xuXHRcdFx0cmV0dXJuIHZlcnRpY2FsQmFja2dyb3VuZHMgPyB2ZXJ0aWNhbEJhY2tncm91bmRzWyB5IF0gOiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGhvcml6b250YWxCYWNrZ3JvdW5kO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSBzcGVha2VyIG5vdGVzIGZyb20gYSBzbGlkZS4gTm90ZXMgY2FuIGJlXG5cdCAqIGRlZmluZWQgaW4gdHdvIHdheXM6XG5cdCAqIDEuIEFzIGEgZGF0YS1ub3RlcyBhdHRyaWJ1dGUgb24gdGhlIHNsaWRlIDxzZWN0aW9uPlxuXHQgKiAyLiBBcyBhbiA8YXNpZGUgY2xhc3M9XCJub3Rlc1wiPiBpbnNpZGUgb2YgdGhlIHNsaWRlXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtzbGlkZT1jdXJyZW50U2xpZGVdXG5cdCAqIEByZXR1cm4geyhzdHJpbmd8bnVsbCl9XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRTbGlkZU5vdGVzKCBzbGlkZSApIHtcblxuXHRcdC8vIERlZmF1bHQgdG8gdGhlIGN1cnJlbnQgc2xpZGVcblx0XHRzbGlkZSA9IHNsaWRlIHx8IGN1cnJlbnRTbGlkZTtcblxuXHRcdC8vIE5vdGVzIGNhbiBiZSBzcGVjaWZpZWQgdmlhIHRoZSBkYXRhLW5vdGVzIGF0dHJpYnV0ZS4uLlxuXHRcdGlmKCBzbGlkZS5oYXNBdHRyaWJ1dGUoICdkYXRhLW5vdGVzJyApICkge1xuXHRcdFx0cmV0dXJuIHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtbm90ZXMnICk7XG5cdFx0fVxuXG5cdFx0Ly8gLi4uIG9yIHVzaW5nIGFuIDxhc2lkZSBjbGFzcz1cIm5vdGVzXCI+IGVsZW1lbnRcblx0XHR2YXIgbm90ZXNFbGVtZW50ID0gc2xpZGUucXVlcnlTZWxlY3RvciggJ2FzaWRlLm5vdGVzJyApO1xuXHRcdGlmKCBub3Rlc0VsZW1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gbm90ZXNFbGVtZW50LmlubmVySFRNTDtcblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgcHJlc2VudGF0aW9uIGFzXG5cdCAqIGFuIG9iamVjdC4gVGhpcyBzdGF0ZSBjYW4gdGhlbiBiZSByZXN0b3JlZCBhdCBhbnlcblx0ICogdGltZS5cblx0ICpcblx0ICogQHJldHVybiB7e2luZGV4aDogbnVtYmVyLCBpbmRleHY6IG51bWJlciwgaW5kZXhmOiBudW1iZXIsIHBhdXNlZDogYm9vbGVhbiwgb3ZlcnZpZXc6IGJvb2xlYW59fVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0U3RhdGUoKSB7XG5cblx0XHR2YXIgaW5kaWNlcyA9IGdldEluZGljZXMoKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRpbmRleGg6IGluZGljZXMuaCxcblx0XHRcdGluZGV4djogaW5kaWNlcy52LFxuXHRcdFx0aW5kZXhmOiBpbmRpY2VzLmYsXG5cdFx0XHRwYXVzZWQ6IGlzUGF1c2VkKCksXG5cdFx0XHRvdmVydmlldzogaXNPdmVydmlldygpXG5cdFx0fTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJlc3RvcmVzIHRoZSBwcmVzZW50YXRpb24gdG8gdGhlIGdpdmVuIHN0YXRlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gc3RhdGUgQXMgZ2VuZXJhdGVkIGJ5IGdldFN0YXRlKClcblx0ICogQHNlZSB7QGxpbmsgZ2V0U3RhdGV9IGdlbmVyYXRlcyB0aGUgcGFyYW1ldGVyIGBzdGF0ZWBcblx0ICovXG5cdGZ1bmN0aW9uIHNldFN0YXRlKCBzdGF0ZSApIHtcblxuXHRcdGlmKCB0eXBlb2Ygc3RhdGUgPT09ICdvYmplY3QnICkge1xuXHRcdFx0c2xpZGUoIGRlc2VyaWFsaXplKCBzdGF0ZS5pbmRleGggKSwgZGVzZXJpYWxpemUoIHN0YXRlLmluZGV4diApLCBkZXNlcmlhbGl6ZSggc3RhdGUuaW5kZXhmICkgKTtcblxuXHRcdFx0dmFyIHBhdXNlZEZsYWcgPSBkZXNlcmlhbGl6ZSggc3RhdGUucGF1c2VkICksXG5cdFx0XHRcdG92ZXJ2aWV3RmxhZyA9IGRlc2VyaWFsaXplKCBzdGF0ZS5vdmVydmlldyApO1xuXG5cdFx0XHRpZiggdHlwZW9mIHBhdXNlZEZsYWcgPT09ICdib29sZWFuJyAmJiBwYXVzZWRGbGFnICE9PSBpc1BhdXNlZCgpICkge1xuXHRcdFx0XHR0b2dnbGVQYXVzZSggcGF1c2VkRmxhZyApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggdHlwZW9mIG92ZXJ2aWV3RmxhZyA9PT0gJ2Jvb2xlYW4nICYmIG92ZXJ2aWV3RmxhZyAhPT0gaXNPdmVydmlldygpICkge1xuXHRcdFx0XHR0b2dnbGVPdmVydmlldyggb3ZlcnZpZXdGbGFnICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJuIGEgc29ydGVkIGZyYWdtZW50cyBsaXN0LCBvcmRlcmVkIGJ5IGFuIGluY3JlYXNpbmdcblx0ICogXCJkYXRhLWZyYWdtZW50LWluZGV4XCIgYXR0cmlidXRlLlxuXHQgKlxuXHQgKiBGcmFnbWVudHMgd2lsbCBiZSByZXZlYWxlZCBpbiB0aGUgb3JkZXIgdGhhdCB0aGV5IGFyZSByZXR1cm5lZCBieVxuXHQgKiB0aGlzIGZ1bmN0aW9uLCBzbyB5b3UgY2FuIHVzZSB0aGUgaW5kZXggYXR0cmlidXRlcyB0byBjb250cm9sIHRoZVxuXHQgKiBvcmRlciBvZiBmcmFnbWVudCBhcHBlYXJhbmNlLlxuXHQgKlxuXHQgKiBUbyBtYWludGFpbiBhIHNlbnNpYmxlIGRlZmF1bHQgZnJhZ21lbnQgb3JkZXIsIGZyYWdtZW50cyBhcmUgcHJlc3VtZWRcblx0ICogdG8gYmUgcGFzc2VkIGluIGRvY3VtZW50IG9yZGVyLiBUaGlzIGZ1bmN0aW9uIGFkZHMgYSBcImZyYWdtZW50LWluZGV4XCJcblx0ICogYXR0cmlidXRlIHRvIGVhY2ggbm9kZSBpZiBzdWNoIGFuIGF0dHJpYnV0ZSBpcyBub3QgYWxyZWFkeSBwcmVzZW50LFxuXHQgKiBhbmQgc2V0cyB0aGF0IGF0dHJpYnV0ZSB0byBhbiBpbnRlZ2VyIHZhbHVlIHdoaWNoIGlzIHRoZSBwb3NpdGlvbiBvZlxuXHQgKiB0aGUgZnJhZ21lbnQgd2l0aGluIHRoZSBmcmFnbWVudHMgbGlzdC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3RbXXwqfSBmcmFnbWVudHNcblx0ICogQHJldHVybiB7b2JqZWN0W119IHNvcnRlZCBTb3J0ZWQgYXJyYXkgb2YgZnJhZ21lbnRzXG5cdCAqL1xuXHRmdW5jdGlvbiBzb3J0RnJhZ21lbnRzKCBmcmFnbWVudHMgKSB7XG5cblx0XHRmcmFnbWVudHMgPSB0b0FycmF5KCBmcmFnbWVudHMgKTtcblxuXHRcdHZhciBvcmRlcmVkID0gW10sXG5cdFx0XHR1bm9yZGVyZWQgPSBbXSxcblx0XHRcdHNvcnRlZCA9IFtdO1xuXG5cdFx0Ly8gR3JvdXAgb3JkZXJlZCBhbmQgdW5vcmRlcmVkIGVsZW1lbnRzXG5cdFx0ZnJhZ21lbnRzLmZvckVhY2goIGZ1bmN0aW9uKCBmcmFnbWVudCwgaSApIHtcblx0XHRcdGlmKCBmcmFnbWVudC5oYXNBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JyApICkge1xuXHRcdFx0XHR2YXIgaW5kZXggPSBwYXJzZUludCggZnJhZ21lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1mcmFnbWVudC1pbmRleCcgKSwgMTAgKTtcblxuXHRcdFx0XHRpZiggIW9yZGVyZWRbaW5kZXhdICkge1xuXHRcdFx0XHRcdG9yZGVyZWRbaW5kZXhdID0gW107XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRvcmRlcmVkW2luZGV4XS5wdXNoKCBmcmFnbWVudCApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHVub3JkZXJlZC5wdXNoKCBbIGZyYWdtZW50IF0gKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0XHQvLyBBcHBlbmQgZnJhZ21lbnRzIHdpdGhvdXQgZXhwbGljaXQgaW5kaWNlcyBpbiB0aGVpclxuXHRcdC8vIERPTSBvcmRlclxuXHRcdG9yZGVyZWQgPSBvcmRlcmVkLmNvbmNhdCggdW5vcmRlcmVkICk7XG5cblx0XHQvLyBNYW51YWxseSBjb3VudCB0aGUgaW5kZXggdXAgcGVyIGdyb3VwIHRvIGVuc3VyZSB0aGVyZVxuXHRcdC8vIGFyZSBubyBnYXBzXG5cdFx0dmFyIGluZGV4ID0gMDtcblxuXHRcdC8vIFB1c2ggYWxsIGZyYWdtZW50cyBpbiB0aGVpciBzb3J0ZWQgb3JkZXIgdG8gYW4gYXJyYXksXG5cdFx0Ly8gdGhpcyBmbGF0dGVucyB0aGUgZ3JvdXBzXG5cdFx0b3JkZXJlZC5mb3JFYWNoKCBmdW5jdGlvbiggZ3JvdXAgKSB7XG5cdFx0XHRncm91cC5mb3JFYWNoKCBmdW5jdGlvbiggZnJhZ21lbnQgKSB7XG5cdFx0XHRcdHNvcnRlZC5wdXNoKCBmcmFnbWVudCApO1xuXHRcdFx0XHRmcmFnbWVudC5zZXRBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JywgaW5kZXggKTtcblx0XHRcdH0gKTtcblxuXHRcdFx0aW5kZXggKys7XG5cdFx0fSApO1xuXG5cdFx0cmV0dXJuIHNvcnRlZDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIE5hdmlnYXRlIHRvIHRoZSBzcGVjaWZpZWQgc2xpZGUgZnJhZ21lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7P251bWJlcn0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBmcmFnbWVudCB0aGF0XG5cdCAqIHNob3VsZCBiZSBzaG93biwgLTEgbWVhbnMgYWxsIGFyZSBpbnZpc2libGVcblx0ICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBJbnRlZ2VyIG9mZnNldCB0byBhcHBseSB0byB0aGVcblx0ICogZnJhZ21lbnQgaW5kZXhcblx0ICpcblx0ICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBhIGNoYW5nZSB3YXMgbWFkZSBpbiBhbnlcblx0ICogZnJhZ21lbnRzIHZpc2liaWxpdHkgYXMgcGFydCBvZiB0aGlzIGNhbGxcblx0ICovXG5cdGZ1bmN0aW9uIG5hdmlnYXRlRnJhZ21lbnQoIGluZGV4LCBvZmZzZXQgKSB7XG5cblx0XHRpZiggY3VycmVudFNsaWRlICYmIGNvbmZpZy5mcmFnbWVudHMgKSB7XG5cblx0XHRcdHZhciBmcmFnbWVudHMgPSBzb3J0RnJhZ21lbnRzKCBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKSApO1xuXHRcdFx0aWYoIGZyYWdtZW50cy5sZW5ndGggKSB7XG5cblx0XHRcdFx0Ly8gSWYgbm8gaW5kZXggaXMgc3BlY2lmaWVkLCBmaW5kIHRoZSBjdXJyZW50XG5cdFx0XHRcdGlmKCB0eXBlb2YgaW5kZXggIT09ICdudW1iZXInICkge1xuXHRcdFx0XHRcdHZhciBsYXN0VmlzaWJsZUZyYWdtZW50ID0gc29ydEZyYWdtZW50cyggY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQudmlzaWJsZScgKSApLnBvcCgpO1xuXG5cdFx0XHRcdFx0aWYoIGxhc3RWaXNpYmxlRnJhZ21lbnQgKSB7XG5cdFx0XHRcdFx0XHRpbmRleCA9IHBhcnNlSW50KCBsYXN0VmlzaWJsZUZyYWdtZW50LmdldEF0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnICkgfHwgMCwgMTAgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRpbmRleCA9IC0xO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIElmIGFuIG9mZnNldCBpcyBzcGVjaWZpZWQsIGFwcGx5IGl0IHRvIHRoZSBpbmRleFxuXHRcdFx0XHRpZiggdHlwZW9mIG9mZnNldCA9PT0gJ251bWJlcicgKSB7XG5cdFx0XHRcdFx0aW5kZXggKz0gb2Zmc2V0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGZyYWdtZW50c1Nob3duID0gW10sXG5cdFx0XHRcdFx0ZnJhZ21lbnRzSGlkZGVuID0gW107XG5cblx0XHRcdFx0dG9BcnJheSggZnJhZ21lbnRzICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsZW1lbnQsIGkgKSB7XG5cblx0XHRcdFx0XHRpZiggZWxlbWVudC5oYXNBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JyApICkge1xuXHRcdFx0XHRcdFx0aSA9IHBhcnNlSW50KCBlbGVtZW50LmdldEF0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnICksIDEwICk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gVmlzaWJsZSBmcmFnbWVudHNcblx0XHRcdFx0XHRpZiggaSA8PSBpbmRleCApIHtcblx0XHRcdFx0XHRcdGlmKCAhZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoICd2aXNpYmxlJyApICkgZnJhZ21lbnRzU2hvd24ucHVzaCggZWxlbWVudCApO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCAndmlzaWJsZScgKTtcblx0XHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ2N1cnJlbnQtZnJhZ21lbnQnICk7XG5cblx0XHRcdFx0XHRcdC8vIEFubm91bmNlIHRoZSBmcmFnbWVudHMgb25lIGJ5IG9uZSB0byB0aGUgU2NyZWVuIFJlYWRlclxuXHRcdFx0XHRcdFx0ZG9tLnN0YXR1c0Rpdi50ZXh0Q29udGVudCA9IGdldFN0YXR1c1RleHQoIGVsZW1lbnQgKTtcblxuXHRcdFx0XHRcdFx0aWYoIGkgPT09IGluZGV4ICkge1xuXHRcdFx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQoICdjdXJyZW50LWZyYWdtZW50JyApO1xuXHRcdFx0XHRcdFx0XHRzdGFydEVtYmVkZGVkQ29udGVudCggZWxlbWVudCApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBIaWRkZW4gZnJhZ21lbnRzXG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRpZiggZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoICd2aXNpYmxlJyApICkgZnJhZ21lbnRzSGlkZGVuLnB1c2goIGVsZW1lbnQgKTtcblx0XHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ3Zpc2libGUnICk7XG5cdFx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdjdXJyZW50LWZyYWdtZW50JyApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0aWYoIGZyYWdtZW50c0hpZGRlbi5sZW5ndGggKSB7XG5cdFx0XHRcdFx0ZGlzcGF0Y2hFdmVudCggJ2ZyYWdtZW50aGlkZGVuJywgeyBmcmFnbWVudDogZnJhZ21lbnRzSGlkZGVuWzBdLCBmcmFnbWVudHM6IGZyYWdtZW50c0hpZGRlbiB9ICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiggZnJhZ21lbnRzU2hvd24ubGVuZ3RoICkge1xuXHRcdFx0XHRcdGRpc3BhdGNoRXZlbnQoICdmcmFnbWVudHNob3duJywgeyBmcmFnbWVudDogZnJhZ21lbnRzU2hvd25bMF0sIGZyYWdtZW50czogZnJhZ21lbnRzU2hvd24gfSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dXBkYXRlQ29udHJvbHMoKTtcblx0XHRcdFx0dXBkYXRlUHJvZ3Jlc3MoKTtcblxuXHRcdFx0XHRyZXR1cm4gISEoIGZyYWdtZW50c1Nob3duLmxlbmd0aCB8fCBmcmFnbWVudHNIaWRkZW4ubGVuZ3RoICk7XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIE5hdmlnYXRlIHRvIHRoZSBuZXh0IHNsaWRlIGZyYWdtZW50LlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZXJlIHdhcyBhIG5leHQgZnJhZ21lbnQsXG5cdCAqIGZhbHNlIG90aGVyd2lzZVxuXHQgKi9cblx0ZnVuY3Rpb24gbmV4dEZyYWdtZW50KCkge1xuXG5cdFx0cmV0dXJuIG5hdmlnYXRlRnJhZ21lbnQoIG51bGwsIDEgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIE5hdmlnYXRlIHRvIHRoZSBwcmV2aW91cyBzbGlkZSBmcmFnbWVudC5cblx0ICpcblx0ICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGVyZSB3YXMgYSBwcmV2aW91cyBmcmFnbWVudCxcblx0ICogZmFsc2Ugb3RoZXJ3aXNlXG5cdCAqL1xuXHRmdW5jdGlvbiBwcmV2aW91c0ZyYWdtZW50KCkge1xuXG5cdFx0cmV0dXJuIG5hdmlnYXRlRnJhZ21lbnQoIG51bGwsIC0xICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDdWVzIGEgbmV3IGF1dG9tYXRlZCBzbGlkZSBpZiBlbmFibGVkIGluIHRoZSBjb25maWcuXG5cdCAqL1xuXHRmdW5jdGlvbiBjdWVBdXRvU2xpZGUoKSB7XG5cblx0XHRjYW5jZWxBdXRvU2xpZGUoKTtcblxuXHRcdGlmKCBjdXJyZW50U2xpZGUgKSB7XG5cblx0XHRcdHZhciBmcmFnbWVudCA9IGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yKCAnLmN1cnJlbnQtZnJhZ21lbnQnICk7XG5cblx0XHRcdC8vIFdoZW4gdGhlIHNsaWRlIGZpcnN0IGFwcGVhcnMgdGhlcmUgaXMgbm8gXCJjdXJyZW50XCIgZnJhZ21lbnQgc29cblx0XHRcdC8vIHdlIGxvb2sgZm9yIGEgZGF0YS1hdXRvc2xpZGUgdGltaW5nIG9uIHRoZSBmaXJzdCBmcmFnbWVudFxuXHRcdFx0aWYoICFmcmFnbWVudCApIGZyYWdtZW50ID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3IoICcuZnJhZ21lbnQnICk7XG5cblx0XHRcdHZhciBmcmFnbWVudEF1dG9TbGlkZSA9IGZyYWdtZW50ID8gZnJhZ21lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1hdXRvc2xpZGUnICkgOiBudWxsO1xuXHRcdFx0dmFyIHBhcmVudEF1dG9TbGlkZSA9IGN1cnJlbnRTbGlkZS5wYXJlbnROb2RlID8gY3VycmVudFNsaWRlLnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1hdXRvc2xpZGUnICkgOiBudWxsO1xuXHRcdFx0dmFyIHNsaWRlQXV0b1NsaWRlID0gY3VycmVudFNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYXV0b3NsaWRlJyApO1xuXG5cdFx0XHQvLyBQaWNrIHZhbHVlIGluIHRoZSBmb2xsb3dpbmcgcHJpb3JpdHkgb3JkZXI6XG5cdFx0XHQvLyAxLiBDdXJyZW50IGZyYWdtZW50J3MgZGF0YS1hdXRvc2xpZGVcblx0XHRcdC8vIDIuIEN1cnJlbnQgc2xpZGUncyBkYXRhLWF1dG9zbGlkZVxuXHRcdFx0Ly8gMy4gUGFyZW50IHNsaWRlJ3MgZGF0YS1hdXRvc2xpZGVcblx0XHRcdC8vIDQuIEdsb2JhbCBhdXRvU2xpZGUgc2V0dGluZ1xuXHRcdFx0aWYoIGZyYWdtZW50QXV0b1NsaWRlICkge1xuXHRcdFx0XHRhdXRvU2xpZGUgPSBwYXJzZUludCggZnJhZ21lbnRBdXRvU2xpZGUsIDEwICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKCBzbGlkZUF1dG9TbGlkZSApIHtcblx0XHRcdFx0YXV0b1NsaWRlID0gcGFyc2VJbnQoIHNsaWRlQXV0b1NsaWRlLCAxMCApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiggcGFyZW50QXV0b1NsaWRlICkge1xuXHRcdFx0XHRhdXRvU2xpZGUgPSBwYXJzZUludCggcGFyZW50QXV0b1NsaWRlLCAxMCApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGF1dG9TbGlkZSA9IGNvbmZpZy5hdXRvU2xpZGU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIHRoZXJlIGFyZSBtZWRpYSBlbGVtZW50cyB3aXRoIGRhdGEtYXV0b3BsYXksXG5cdFx0XHQvLyBhdXRvbWF0aWNhbGx5IHNldCB0aGUgYXV0b1NsaWRlIGR1cmF0aW9uIHRvIHRoZVxuXHRcdFx0Ly8gbGVuZ3RoIG9mIHRoYXQgbWVkaWEuIE5vdCBhcHBsaWNhYmxlIGlmIHRoZSBzbGlkZVxuXHRcdFx0Ly8gaXMgZGl2aWRlZCB1cCBpbnRvIGZyYWdtZW50cy5cblx0XHRcdC8vIHBsYXliYWNrUmF0ZSBpcyBhY2NvdW50ZWQgZm9yIGluIHRoZSBkdXJhdGlvbi5cblx0XHRcdGlmKCBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKS5sZW5ndGggPT09IDAgKSB7XG5cdFx0XHRcdHRvQXJyYXkoIGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAndmlkZW8sIGF1ZGlvJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRcdGlmKCBlbC5oYXNBdHRyaWJ1dGUoICdkYXRhLWF1dG9wbGF5JyApICkge1xuXHRcdFx0XHRcdFx0aWYoIGF1dG9TbGlkZSAmJiAoZWwuZHVyYXRpb24gKiAxMDAwIC8gZWwucGxheWJhY2tSYXRlICkgPiBhdXRvU2xpZGUgKSB7XG5cdFx0XHRcdFx0XHRcdGF1dG9TbGlkZSA9ICggZWwuZHVyYXRpb24gKiAxMDAwIC8gZWwucGxheWJhY2tSYXRlICkgKyAxMDAwO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDdWUgdGhlIG5leHQgYXV0by1zbGlkZSBpZjpcblx0XHRcdC8vIC0gVGhlcmUgaXMgYW4gYXV0b1NsaWRlIHZhbHVlXG5cdFx0XHQvLyAtIEF1dG8tc2xpZGluZyBpc24ndCBwYXVzZWQgYnkgdGhlIHVzZXJcblx0XHRcdC8vIC0gVGhlIHByZXNlbnRhdGlvbiBpc24ndCBwYXVzZWRcblx0XHRcdC8vIC0gVGhlIG92ZXJ2aWV3IGlzbid0IGFjdGl2ZVxuXHRcdFx0Ly8gLSBUaGUgcHJlc2VudGF0aW9uIGlzbid0IG92ZXJcblx0XHRcdGlmKCBhdXRvU2xpZGUgJiYgIWF1dG9TbGlkZVBhdXNlZCAmJiAhaXNQYXVzZWQoKSAmJiAhaXNPdmVydmlldygpICYmICggIVJldmVhbC5pc0xhc3RTbGlkZSgpIHx8IGF2YWlsYWJsZUZyYWdtZW50cygpLm5leHQgfHwgY29uZmlnLmxvb3AgPT09IHRydWUgKSApIHtcblx0XHRcdFx0YXV0b1NsaWRlVGltZW91dCA9IHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHR5cGVvZiBjb25maWcuYXV0b1NsaWRlTWV0aG9kID09PSAnZnVuY3Rpb24nID8gY29uZmlnLmF1dG9TbGlkZU1ldGhvZCgpIDogbmF2aWdhdGVOZXh0KCk7XG5cdFx0XHRcdFx0Y3VlQXV0b1NsaWRlKCk7XG5cdFx0XHRcdH0sIGF1dG9TbGlkZSApO1xuXHRcdFx0XHRhdXRvU2xpZGVTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggYXV0b1NsaWRlUGxheWVyICkge1xuXHRcdFx0XHRhdXRvU2xpZGVQbGF5ZXIuc2V0UGxheWluZyggYXV0b1NsaWRlVGltZW91dCAhPT0gLTEgKTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENhbmNlbHMgYW55IG9uZ29pbmcgcmVxdWVzdCB0byBhdXRvLXNsaWRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gY2FuY2VsQXV0b1NsaWRlKCkge1xuXG5cdFx0Y2xlYXJUaW1lb3V0KCBhdXRvU2xpZGVUaW1lb3V0ICk7XG5cdFx0YXV0b1NsaWRlVGltZW91dCA9IC0xO1xuXG5cdH1cblxuXHRmdW5jdGlvbiBwYXVzZUF1dG9TbGlkZSgpIHtcblxuXHRcdGlmKCBhdXRvU2xpZGUgJiYgIWF1dG9TbGlkZVBhdXNlZCApIHtcblx0XHRcdGF1dG9TbGlkZVBhdXNlZCA9IHRydWU7XG5cdFx0XHRkaXNwYXRjaEV2ZW50KCAnYXV0b3NsaWRlcGF1c2VkJyApO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KCBhdXRvU2xpZGVUaW1lb3V0ICk7XG5cblx0XHRcdGlmKCBhdXRvU2xpZGVQbGF5ZXIgKSB7XG5cdFx0XHRcdGF1dG9TbGlkZVBsYXllci5zZXRQbGF5aW5nKCBmYWxzZSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0ZnVuY3Rpb24gcmVzdW1lQXV0b1NsaWRlKCkge1xuXG5cdFx0aWYoIGF1dG9TbGlkZSAmJiBhdXRvU2xpZGVQYXVzZWQgKSB7XG5cdFx0XHRhdXRvU2xpZGVQYXVzZWQgPSBmYWxzZTtcblx0XHRcdGRpc3BhdGNoRXZlbnQoICdhdXRvc2xpZGVyZXN1bWVkJyApO1xuXHRcdFx0Y3VlQXV0b1NsaWRlKCk7XG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiBuYXZpZ2F0ZUxlZnQoKSB7XG5cblx0XHQvLyBSZXZlcnNlIGZvciBSVExcblx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBuZXh0RnJhZ21lbnQoKSA9PT0gZmFsc2UgKSAmJiBhdmFpbGFibGVSb3V0ZXMoKS5sZWZ0ICkge1xuXHRcdFx0XHRzbGlkZSggaW5kZXhoICsgMSApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBOb3JtYWwgbmF2aWdhdGlvblxuXHRcdGVsc2UgaWYoICggaXNPdmVydmlldygpIHx8IHByZXZpb3VzRnJhZ21lbnQoKSA9PT0gZmFsc2UgKSAmJiBhdmFpbGFibGVSb3V0ZXMoKS5sZWZ0ICkge1xuXHRcdFx0c2xpZGUoIGluZGV4aCAtIDEgKTtcblx0XHR9XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG5hdmlnYXRlUmlnaHQoKSB7XG5cblx0XHQvLyBSZXZlcnNlIGZvciBSVExcblx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBwcmV2aW91c0ZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkucmlnaHQgKSB7XG5cdFx0XHRcdHNsaWRlKCBpbmRleGggLSAxICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIE5vcm1hbCBuYXZpZ2F0aW9uXG5cdFx0ZWxzZSBpZiggKCBpc092ZXJ2aWV3KCkgfHwgbmV4dEZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkucmlnaHQgKSB7XG5cdFx0XHRzbGlkZSggaW5kZXhoICsgMSApO1xuXHRcdH1cblxuXHR9XG5cblx0ZnVuY3Rpb24gbmF2aWdhdGVVcCgpIHtcblxuXHRcdC8vIFByaW9yaXRpemUgaGlkaW5nIGZyYWdtZW50c1xuXHRcdGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBwcmV2aW91c0ZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkudXAgKSB7XG5cdFx0XHRzbGlkZSggaW5kZXhoLCBpbmRleHYgLSAxICk7XG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiBuYXZpZ2F0ZURvd24oKSB7XG5cblx0XHQvLyBQcmlvcml0aXplIHJldmVhbGluZyBmcmFnbWVudHNcblx0XHRpZiggKCBpc092ZXJ2aWV3KCkgfHwgbmV4dEZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkuZG93biApIHtcblx0XHRcdHNsaWRlKCBpbmRleGgsIGluZGV4diArIDEgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBOYXZpZ2F0ZXMgYmFja3dhcmRzLCBwcmlvcml0aXplZCBpbiB0aGUgZm9sbG93aW5nIG9yZGVyOlxuXHQgKiAxKSBQcmV2aW91cyBmcmFnbWVudFxuXHQgKiAyKSBQcmV2aW91cyB2ZXJ0aWNhbCBzbGlkZVxuXHQgKiAzKSBQcmV2aW91cyBob3Jpem9udGFsIHNsaWRlXG5cdCAqL1xuXHRmdW5jdGlvbiBuYXZpZ2F0ZVByZXYoKSB7XG5cblx0XHQvLyBQcmlvcml0aXplIHJldmVhbGluZyBmcmFnbWVudHNcblx0XHRpZiggcHJldmlvdXNGcmFnbWVudCgpID09PSBmYWxzZSApIHtcblx0XHRcdGlmKCBhdmFpbGFibGVSb3V0ZXMoKS51cCApIHtcblx0XHRcdFx0bmF2aWdhdGVVcCgpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdC8vIEZldGNoIHRoZSBwcmV2aW91cyBob3Jpem9udGFsIHNsaWRlLCBpZiB0aGVyZSBpcyBvbmVcblx0XHRcdFx0dmFyIHByZXZpb3VzU2xpZGU7XG5cblx0XHRcdFx0aWYoIGNvbmZpZy5ydGwgKSB7XG5cdFx0XHRcdFx0cHJldmlvdXNTbGlkZSA9IHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICsgJy5mdXR1cmUnICkgKS5wb3AoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRwcmV2aW91c1NsaWRlID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKyAnLnBhc3QnICkgKS5wb3AoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCBwcmV2aW91c1NsaWRlICkge1xuXHRcdFx0XHRcdHZhciB2ID0gKCBwcmV2aW91c1NsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApLmxlbmd0aCAtIDEgKSB8fCB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0dmFyIGggPSBpbmRleGggLSAxO1xuXHRcdFx0XHRcdHNsaWRlKCBoLCB2ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBUaGUgcmV2ZXJzZSBvZiAjbmF2aWdhdGVQcmV2KCkuXG5cdCAqL1xuXHRmdW5jdGlvbiBuYXZpZ2F0ZU5leHQoKSB7XG5cblx0XHQvLyBQcmlvcml0aXplIHJldmVhbGluZyBmcmFnbWVudHNcblx0XHRpZiggbmV4dEZyYWdtZW50KCkgPT09IGZhbHNlICkge1xuXHRcdFx0aWYoIGF2YWlsYWJsZVJvdXRlcygpLmRvd24gKSB7XG5cdFx0XHRcdG5hdmlnYXRlRG93bigpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdFx0bmF2aWdhdGVMZWZ0KCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0bmF2aWdhdGVSaWdodCgpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgcHJldmVudHMgdGhlIHRyaWdnZXJpbmcgb2Zcblx0ICogc3dpcGUgbmF2aWdhdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGlzU3dpcGVQcmV2ZW50ZWQoIHRhcmdldCApIHtcblxuXHRcdHdoaWxlKCB0YXJnZXQgJiYgdHlwZW9mIHRhcmdldC5oYXNBdHRyaWJ1dGUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRpZiggdGFyZ2V0Lmhhc0F0dHJpYnV0ZSggJ2RhdGEtcHJldmVudC1zd2lwZScgKSApIHJldHVybiB0cnVlO1xuXHRcdFx0dGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdH1cblxuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRVZFTlRTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cblx0LyoqXG5cdCAqIENhbGxlZCBieSBhbGwgZXZlbnQgaGFuZGxlcnMgdGhhdCBhcmUgYmFzZWQgb24gdXNlclxuXHQgKiBpbnB1dC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IFtldmVudF1cblx0ICovXG5cdGZ1bmN0aW9uIG9uVXNlcklucHV0KCBldmVudCApIHtcblxuXHRcdGlmKCBjb25maWcuYXV0b1NsaWRlU3RvcHBhYmxlICkge1xuXHRcdFx0cGF1c2VBdXRvU2xpZGUoKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVyIGZvciB0aGUgZG9jdW1lbnQgbGV2ZWwgJ2tleXByZXNzJyBldmVudC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBvbkRvY3VtZW50S2V5UHJlc3MoIGV2ZW50ICkge1xuXG5cdFx0Ly8gQ2hlY2sgaWYgdGhlIHByZXNzZWQga2V5IGlzIHF1ZXN0aW9uIG1hcmtcblx0XHRpZiggZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQuY2hhckNvZGUgPT09IDYzICkge1xuXHRcdFx0dG9nZ2xlSGVscCgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSBkb2N1bWVudCBsZXZlbCAna2V5ZG93bicgZXZlbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxuXHQgKi9cblx0ZnVuY3Rpb24gb25Eb2N1bWVudEtleURvd24oIGV2ZW50ICkge1xuXG5cdFx0Ly8gSWYgdGhlcmUncyBhIGNvbmRpdGlvbiBzcGVjaWZpZWQgYW5kIGl0IHJldHVybnMgZmFsc2UsXG5cdFx0Ly8gaWdub3JlIHRoaXMgZXZlbnRcblx0XHRpZiggdHlwZW9mIGNvbmZpZy5rZXlib2FyZENvbmRpdGlvbiA9PT0gJ2Z1bmN0aW9uJyAmJiBjb25maWcua2V5Ym9hcmRDb25kaXRpb24oKSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBSZW1lbWJlciBpZiBhdXRvLXNsaWRpbmcgd2FzIHBhdXNlZCBzbyB3ZSBjYW4gdG9nZ2xlIGl0XG5cdFx0dmFyIGF1dG9TbGlkZVdhc1BhdXNlZCA9IGF1dG9TbGlkZVBhdXNlZDtcblxuXHRcdG9uVXNlcklucHV0KCBldmVudCApO1xuXG5cdFx0Ly8gQ2hlY2sgaWYgdGhlcmUncyBhIGZvY3VzZWQgZWxlbWVudCB0aGF0IGNvdWxkIGJlIHVzaW5nXG5cdFx0Ly8gdGhlIGtleWJvYXJkXG5cdFx0dmFyIGFjdGl2ZUVsZW1lbnRJc0NFID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNvbnRlbnRFZGl0YWJsZSAhPT0gJ2luaGVyaXQnO1xuXHRcdHZhciBhY3RpdmVFbGVtZW50SXNJbnB1dCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50YWdOYW1lICYmIC9pbnB1dHx0ZXh0YXJlYS9pLnRlc3QoIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQudGFnTmFtZSApO1xuXHRcdHZhciBhY3RpdmVFbGVtZW50SXNOb3RlcyA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5jbGFzc05hbWUgJiYgL3NwZWFrZXItbm90ZXMvaS50ZXN0KCBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNsYXNzTmFtZSk7XG5cblx0XHQvLyBEaXNyZWdhcmQgdGhlIGV2ZW50IGlmIHRoZXJlJ3MgYSBmb2N1c2VkIGVsZW1lbnQgb3IgYVxuXHRcdC8vIGtleWJvYXJkIG1vZGlmaWVyIGtleSBpcyBwcmVzZW50XG5cdFx0aWYoIGFjdGl2ZUVsZW1lbnRJc0NFIHx8IGFjdGl2ZUVsZW1lbnRJc0lucHV0IHx8IGFjdGl2ZUVsZW1lbnRJc05vdGVzIHx8IChldmVudC5zaGlmdEtleSAmJiBldmVudC5rZXlDb2RlICE9PSAzMikgfHwgZXZlbnQuYWx0S2V5IHx8IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQubWV0YUtleSApIHJldHVybjtcblxuXHRcdC8vIFdoaWxlIHBhdXNlZCBvbmx5IGFsbG93IHJlc3VtZSBrZXlib2FyZCBldmVudHM7ICdiJywgJ3YnLCAnLidcblx0XHR2YXIgcmVzdW1lS2V5Q29kZXMgPSBbNjYsODYsMTkwLDE5MV07XG5cdFx0dmFyIGtleTtcblxuXHRcdC8vIEN1c3RvbSBrZXkgYmluZGluZ3MgZm9yIHRvZ2dsZVBhdXNlIHNob3VsZCBiZSBhYmxlIHRvIHJlc3VtZVxuXHRcdGlmKCB0eXBlb2YgY29uZmlnLmtleWJvYXJkID09PSAnb2JqZWN0JyApIHtcblx0XHRcdGZvcigga2V5IGluIGNvbmZpZy5rZXlib2FyZCApIHtcblx0XHRcdFx0aWYoIGNvbmZpZy5rZXlib2FyZFtrZXldID09PSAndG9nZ2xlUGF1c2UnICkge1xuXHRcdFx0XHRcdHJlc3VtZUtleUNvZGVzLnB1c2goIHBhcnNlSW50KCBrZXksIDEwICkgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKCBpc1BhdXNlZCgpICYmIHJlc3VtZUtleUNvZGVzLmluZGV4T2YoIGV2ZW50LmtleUNvZGUgKSA9PT0gLTEgKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0dmFyIHRyaWdnZXJlZCA9IGZhbHNlO1xuXG5cdFx0Ly8gMS4gVXNlciBkZWZpbmVkIGtleSBiaW5kaW5nc1xuXHRcdGlmKCB0eXBlb2YgY29uZmlnLmtleWJvYXJkID09PSAnb2JqZWN0JyApIHtcblxuXHRcdFx0Zm9yKCBrZXkgaW4gY29uZmlnLmtleWJvYXJkICkge1xuXG5cdFx0XHRcdC8vIENoZWNrIGlmIHRoaXMgYmluZGluZyBtYXRjaGVzIHRoZSBwcmVzc2VkIGtleVxuXHRcdFx0XHRpZiggcGFyc2VJbnQoIGtleSwgMTAgKSA9PT0gZXZlbnQua2V5Q29kZSApIHtcblxuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IGNvbmZpZy5rZXlib2FyZFsga2V5IF07XG5cblx0XHRcdFx0XHQvLyBDYWxsYmFjayBmdW5jdGlvblxuXHRcdFx0XHRcdGlmKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRcdFx0XHR2YWx1ZS5hcHBseSggbnVsbCwgWyBldmVudCBdICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIFN0cmluZyBzaG9ydGN1dHMgdG8gcmV2ZWFsLmpzIEFQSVxuXHRcdFx0XHRcdGVsc2UgaWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIFJldmVhbFsgdmFsdWUgXSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0XHRcdFJldmVhbFsgdmFsdWUgXS5jYWxsKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dHJpZ2dlcmVkID0gdHJ1ZTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdC8vIDIuIFN5c3RlbSBkZWZpbmVkIGtleSBiaW5kaW5nc1xuXHRcdGlmKCB0cmlnZ2VyZWQgPT09IGZhbHNlICkge1xuXG5cdFx0XHQvLyBBc3N1bWUgdHJ1ZSBhbmQgdHJ5IHRvIHByb3ZlIGZhbHNlXG5cdFx0XHR0cmlnZ2VyZWQgPSB0cnVlO1xuXG5cdFx0XHRzd2l0Y2goIGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHRcdC8vIHAsIHBhZ2UgdXBcblx0XHRcdFx0Y2FzZSA4MDogY2FzZSAzMzogbmF2aWdhdGVQcmV2KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBuLCBwYWdlIGRvd25cblx0XHRcdFx0Y2FzZSA3ODogY2FzZSAzNDogbmF2aWdhdGVOZXh0KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBoLCBsZWZ0XG5cdFx0XHRcdGNhc2UgNzI6IGNhc2UgMzc6IG5hdmlnYXRlTGVmdCgpOyBicmVhaztcblx0XHRcdFx0Ly8gbCwgcmlnaHRcblx0XHRcdFx0Y2FzZSA3NjogY2FzZSAzOTogbmF2aWdhdGVSaWdodCgpOyBicmVhaztcblx0XHRcdFx0Ly8gaywgdXBcblx0XHRcdFx0Y2FzZSA3NTogY2FzZSAzODogbmF2aWdhdGVVcCgpOyBicmVhaztcblx0XHRcdFx0Ly8gaiwgZG93blxuXHRcdFx0XHRjYXNlIDc0OiBjYXNlIDQwOiBuYXZpZ2F0ZURvd24oKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGhvbWVcblx0XHRcdFx0Y2FzZSAzNjogc2xpZGUoIDAgKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGVuZFxuXHRcdFx0XHRjYXNlIDM1OiBzbGlkZSggTnVtYmVyLk1BWF9WQUxVRSApOyBicmVhaztcblx0XHRcdFx0Ly8gc3BhY2Vcblx0XHRcdFx0Y2FzZSAzMjogaXNPdmVydmlldygpID8gZGVhY3RpdmF0ZU92ZXJ2aWV3KCkgOiBldmVudC5zaGlmdEtleSA/IG5hdmlnYXRlUHJldigpIDogbmF2aWdhdGVOZXh0KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyByZXR1cm5cblx0XHRcdFx0Y2FzZSAxMzogaXNPdmVydmlldygpID8gZGVhY3RpdmF0ZU92ZXJ2aWV3KCkgOiB0cmlnZ2VyZWQgPSBmYWxzZTsgYnJlYWs7XG5cdFx0XHRcdC8vIHR3by1zcG90LCBzZW1pY29sb24sIGIsIHYsIHBlcmlvZCwgTG9naXRlY2ggcHJlc2VudGVyIHRvb2xzIFwiYmxhY2sgc2NyZWVuXCIgYnV0dG9uXG5cdFx0XHRcdGNhc2UgNTg6IGNhc2UgNTk6IGNhc2UgNjY6IGNhc2UgODY6IGNhc2UgMTkwOiBjYXNlIDE5MTogdG9nZ2xlUGF1c2UoKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGZcblx0XHRcdFx0Y2FzZSA3MDogZW50ZXJGdWxsc2NyZWVuKCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBhXG5cdFx0XHRcdGNhc2UgNjU6IGlmICggY29uZmlnLmF1dG9TbGlkZVN0b3BwYWJsZSApIHRvZ2dsZUF1dG9TbGlkZSggYXV0b1NsaWRlV2FzUGF1c2VkICk7IGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdHRyaWdnZXJlZCA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIGlucHV0IHJlc3VsdGVkIGluIGEgdHJpZ2dlcmVkIGFjdGlvbiB3ZSBzaG91bGQgcHJldmVudFxuXHRcdC8vIHRoZSBicm93c2VycyBkZWZhdWx0IGJlaGF2aW9yXG5cdFx0aWYoIHRyaWdnZXJlZCApIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0ICYmIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHRcdC8vIEVTQyBvciBPIGtleVxuXHRcdGVsc2UgaWYgKCAoIGV2ZW50LmtleUNvZGUgPT09IDI3IHx8IGV2ZW50LmtleUNvZGUgPT09IDc5ICkgJiYgZmVhdHVyZXMudHJhbnNmb3JtczNkICkge1xuXHRcdFx0aWYoIGRvbS5vdmVybGF5ICkge1xuXHRcdFx0XHRjbG9zZU92ZXJsYXkoKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0b2dnbGVPdmVydmlldygpO1xuXHRcdFx0fVxuXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCAmJiBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdC8vIElmIGF1dG8tc2xpZGluZyBpcyBlbmFibGVkIHdlIG5lZWQgdG8gY3VlIHVwXG5cdFx0Ly8gYW5vdGhlciB0aW1lb3V0XG5cdFx0Y3VlQXV0b1NsaWRlKCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVyIGZvciB0aGUgJ3RvdWNoc3RhcnQnIGV2ZW50LCBlbmFibGVzIHN1cHBvcnQgZm9yXG5cdCAqIHN3aXBlIGFuZCBwaW5jaCBnZXN0dXJlcy5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBvblRvdWNoU3RhcnQoIGV2ZW50ICkge1xuXG5cdFx0aWYoIGlzU3dpcGVQcmV2ZW50ZWQoIGV2ZW50LnRhcmdldCApICkgcmV0dXJuIHRydWU7XG5cblx0XHR0b3VjaC5zdGFydFggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0dG91Y2guc3RhcnRZID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdHRvdWNoLnN0YXJ0Q291bnQgPSBldmVudC50b3VjaGVzLmxlbmd0aDtcblxuXHRcdC8vIElmIHRoZXJlJ3MgdHdvIHRvdWNoZXMgd2UgbmVlZCB0byBtZW1vcml6ZSB0aGUgZGlzdGFuY2Vcblx0XHQvLyBiZXR3ZWVuIHRob3NlIHR3byBwb2ludHMgdG8gZGV0ZWN0IHBpbmNoaW5nXG5cdFx0aWYoIGV2ZW50LnRvdWNoZXMubGVuZ3RoID09PSAyICYmIGNvbmZpZy5vdmVydmlldyApIHtcblx0XHRcdHRvdWNoLnN0YXJ0U3BhbiA9IGRpc3RhbmNlQmV0d2Vlbigge1xuXHRcdFx0XHR4OiBldmVudC50b3VjaGVzWzFdLmNsaWVudFgsXG5cdFx0XHRcdHk6IGV2ZW50LnRvdWNoZXNbMV0uY2xpZW50WVxuXHRcdFx0fSwge1xuXHRcdFx0XHR4OiB0b3VjaC5zdGFydFgsXG5cdFx0XHRcdHk6IHRvdWNoLnN0YXJ0WVxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSAndG91Y2htb3ZlJyBldmVudC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBvblRvdWNoTW92ZSggZXZlbnQgKSB7XG5cblx0XHRpZiggaXNTd2lwZVByZXZlbnRlZCggZXZlbnQudGFyZ2V0ICkgKSByZXR1cm4gdHJ1ZTtcblxuXHRcdC8vIEVhY2ggdG91Y2ggc2hvdWxkIG9ubHkgdHJpZ2dlciBvbmUgYWN0aW9uXG5cdFx0aWYoICF0b3VjaC5jYXB0dXJlZCApIHtcblx0XHRcdG9uVXNlcklucHV0KCBldmVudCApO1xuXG5cdFx0XHR2YXIgY3VycmVudFggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHR2YXIgY3VycmVudFkgPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFk7XG5cblx0XHRcdC8vIElmIHRoZSB0b3VjaCBzdGFydGVkIHdpdGggdHdvIHBvaW50cyBhbmQgc3RpbGwgaGFzXG5cdFx0XHQvLyB0d28gYWN0aXZlIHRvdWNoZXM7IHRlc3QgZm9yIHRoZSBwaW5jaCBnZXN0dXJlXG5cdFx0XHRpZiggZXZlbnQudG91Y2hlcy5sZW5ndGggPT09IDIgJiYgdG91Y2guc3RhcnRDb3VudCA9PT0gMiAmJiBjb25maWcub3ZlcnZpZXcgKSB7XG5cblx0XHRcdFx0Ly8gVGhlIGN1cnJlbnQgZGlzdGFuY2UgaW4gcGl4ZWxzIGJldHdlZW4gdGhlIHR3byB0b3VjaCBwb2ludHNcblx0XHRcdFx0dmFyIGN1cnJlbnRTcGFuID0gZGlzdGFuY2VCZXR3ZWVuKCB7XG5cdFx0XHRcdFx0eDogZXZlbnQudG91Y2hlc1sxXS5jbGllbnRYLFxuXHRcdFx0XHRcdHk6IGV2ZW50LnRvdWNoZXNbMV0uY2xpZW50WVxuXHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0eDogdG91Y2guc3RhcnRYLFxuXHRcdFx0XHRcdHk6IHRvdWNoLnN0YXJ0WVxuXHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0Ly8gSWYgdGhlIHNwYW4gaXMgbGFyZ2VyIHRoYW4gdGhlIGRlc2lyZSBhbW91bnQgd2UndmUgZ290XG5cdFx0XHRcdC8vIG91cnNlbHZlcyBhIHBpbmNoXG5cdFx0XHRcdGlmKCBNYXRoLmFicyggdG91Y2guc3RhcnRTcGFuIC0gY3VycmVudFNwYW4gKSA+IHRvdWNoLnRocmVzaG9sZCApIHtcblx0XHRcdFx0XHR0b3VjaC5jYXB0dXJlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRpZiggY3VycmVudFNwYW4gPCB0b3VjaC5zdGFydFNwYW4gKSB7XG5cdFx0XHRcdFx0XHRhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZGVhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0fVxuXHRcdFx0Ly8gVGhlcmUgd2FzIG9ubHkgb25lIHRvdWNoIHBvaW50LCBsb29rIGZvciBhIHN3aXBlXG5cdFx0XHRlbHNlIGlmKCBldmVudC50b3VjaGVzLmxlbmd0aCA9PT0gMSAmJiB0b3VjaC5zdGFydENvdW50ICE9PSAyICkge1xuXG5cdFx0XHRcdHZhciBkZWx0YVggPSBjdXJyZW50WCAtIHRvdWNoLnN0YXJ0WCxcblx0XHRcdFx0XHRkZWx0YVkgPSBjdXJyZW50WSAtIHRvdWNoLnN0YXJ0WTtcblxuXHRcdFx0XHRpZiggZGVsdGFYID4gdG91Y2gudGhyZXNob2xkICYmIE1hdGguYWJzKCBkZWx0YVggKSA+IE1hdGguYWJzKCBkZWx0YVkgKSApIHtcblx0XHRcdFx0XHR0b3VjaC5jYXB0dXJlZCA9IHRydWU7XG5cdFx0XHRcdFx0bmF2aWdhdGVMZWZ0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiggZGVsdGFYIDwgLXRvdWNoLnRocmVzaG9sZCAmJiBNYXRoLmFicyggZGVsdGFYICkgPiBNYXRoLmFicyggZGVsdGFZICkgKSB7XG5cdFx0XHRcdFx0dG91Y2guY2FwdHVyZWQgPSB0cnVlO1xuXHRcdFx0XHRcdG5hdmlnYXRlUmlnaHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKCBkZWx0YVkgPiB0b3VjaC50aHJlc2hvbGQgKSB7XG5cdFx0XHRcdFx0dG91Y2guY2FwdHVyZWQgPSB0cnVlO1xuXHRcdFx0XHRcdG5hdmlnYXRlVXAoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKCBkZWx0YVkgPCAtdG91Y2gudGhyZXNob2xkICkge1xuXHRcdFx0XHRcdHRvdWNoLmNhcHR1cmVkID0gdHJ1ZTtcblx0XHRcdFx0XHRuYXZpZ2F0ZURvd24oKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIElmIHdlJ3JlIGVtYmVkZGVkLCBvbmx5IGJsb2NrIHRvdWNoIGV2ZW50cyBpZiB0aGV5IGhhdmVcblx0XHRcdFx0Ly8gdHJpZ2dlcmVkIGFuIGFjdGlvblxuXHRcdFx0XHRpZiggY29uZmlnLmVtYmVkZGVkICkge1xuXHRcdFx0XHRcdGlmKCB0b3VjaC5jYXB0dXJlZCB8fCBpc1ZlcnRpY2FsU2xpZGUoIGN1cnJlbnRTbGlkZSApICkge1xuXHRcdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gTm90IGVtYmVkZGVkPyBCbG9jayB0aGVtIGFsbCB0byBhdm9pZCBuZWVkbGVzcyB0b3NzaW5nXG5cdFx0XHRcdC8vIGFyb3VuZCBvZiB0aGUgdmlld3BvcnQgaW4gaU9TXG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBUaGVyZSdzIGEgYnVnIHdpdGggc3dpcGluZyBvbiBzb21lIEFuZHJvaWQgZGV2aWNlcyB1bmxlc3Ncblx0XHQvLyB0aGUgZGVmYXVsdCBhY3Rpb24gaXMgYWx3YXlzIHByZXZlbnRlZFxuXHRcdGVsc2UgaWYoIFVBLm1hdGNoKCAvYW5kcm9pZC9naSApICkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVyIGZvciB0aGUgJ3RvdWNoZW5kJyBldmVudC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBvblRvdWNoRW5kKCBldmVudCApIHtcblxuXHRcdHRvdWNoLmNhcHR1cmVkID0gZmFsc2U7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0IHBvaW50ZXIgZG93biB0byB0b3VjaCBzdGFydC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBvblBvaW50ZXJEb3duKCBldmVudCApIHtcblxuXHRcdGlmKCBldmVudC5wb2ludGVyVHlwZSA9PT0gZXZlbnQuTVNQT0lOVEVSX1RZUEVfVE9VQ0ggfHwgZXZlbnQucG9pbnRlclR5cGUgPT09IFwidG91Y2hcIiApIHtcblx0XHRcdGV2ZW50LnRvdWNoZXMgPSBbeyBjbGllbnRYOiBldmVudC5jbGllbnRYLCBjbGllbnRZOiBldmVudC5jbGllbnRZIH1dO1xuXHRcdFx0b25Ub3VjaFN0YXJ0KCBldmVudCApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnQgcG9pbnRlciBtb3ZlIHRvIHRvdWNoIG1vdmUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxuXHQgKi9cblx0ZnVuY3Rpb24gb25Qb2ludGVyTW92ZSggZXZlbnQgKSB7XG5cblx0XHRpZiggZXZlbnQucG9pbnRlclR5cGUgPT09IGV2ZW50Lk1TUE9JTlRFUl9UWVBFX1RPVUNIIHx8IGV2ZW50LnBvaW50ZXJUeXBlID09PSBcInRvdWNoXCIgKSAge1xuXHRcdFx0ZXZlbnQudG91Y2hlcyA9IFt7IGNsaWVudFg6IGV2ZW50LmNsaWVudFgsIGNsaWVudFk6IGV2ZW50LmNsaWVudFkgfV07XG5cdFx0XHRvblRvdWNoTW92ZSggZXZlbnQgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0IHBvaW50ZXIgdXAgdG8gdG91Y2ggZW5kLlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcblx0ICovXG5cdGZ1bmN0aW9uIG9uUG9pbnRlclVwKCBldmVudCApIHtcblxuXHRcdGlmKCBldmVudC5wb2ludGVyVHlwZSA9PT0gZXZlbnQuTVNQT0lOVEVSX1RZUEVfVE9VQ0ggfHwgZXZlbnQucG9pbnRlclR5cGUgPT09IFwidG91Y2hcIiApICB7XG5cdFx0XHRldmVudC50b3VjaGVzID0gW3sgY2xpZW50WDogZXZlbnQuY2xpZW50WCwgY2xpZW50WTogZXZlbnQuY2xpZW50WSB9XTtcblx0XHRcdG9uVG91Y2hFbmQoIGV2ZW50ICk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogSGFuZGxlcyBtb3VzZSB3aGVlbCBzY3JvbGxpbmcsIHRocm90dGxlZCB0byBhdm9pZCBza2lwcGluZ1xuXHQgKiBtdWx0aXBsZSBzbGlkZXMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxuXHQgKi9cblx0ZnVuY3Rpb24gb25Eb2N1bWVudE1vdXNlU2Nyb2xsKCBldmVudCApIHtcblxuXHRcdGlmKCBEYXRlLm5vdygpIC0gbGFzdE1vdXNlV2hlZWxTdGVwID4gNjAwICkge1xuXG5cdFx0XHRsYXN0TW91c2VXaGVlbFN0ZXAgPSBEYXRlLm5vdygpO1xuXG5cdFx0XHR2YXIgZGVsdGEgPSBldmVudC5kZXRhaWwgfHwgLWV2ZW50LndoZWVsRGVsdGE7XG5cdFx0XHRpZiggZGVsdGEgPiAwICkge1xuXHRcdFx0XHRuYXZpZ2F0ZU5leHQoKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoIGRlbHRhIDwgMCApIHtcblx0XHRcdFx0bmF2aWdhdGVQcmV2KCk7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDbGlja2luZyBvbiB0aGUgcHJvZ3Jlc3MgYmFyIHJlc3VsdHMgaW4gYSBuYXZpZ2F0aW9uIHRvIHRoZVxuXHQgKiBjbG9zZXN0IGFwcHJveGltYXRlIGhvcml6b250YWwgc2xpZGUgdXNpbmcgdGhpcyBlcXVhdGlvbjpcblx0ICpcblx0ICogKCBjbGlja1ggLyBwcmVzZW50YXRpb25XaWR0aCApICogbnVtYmVyT2ZTbGlkZXNcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBvblByb2dyZXNzQ2xpY2tlZCggZXZlbnQgKSB7XG5cblx0XHRvblVzZXJJbnB1dCggZXZlbnQgKTtcblxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHR2YXIgc2xpZGVzVG90YWwgPSB0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApICkubGVuZ3RoO1xuXHRcdHZhciBzbGlkZUluZGV4ID0gTWF0aC5mbG9vciggKCBldmVudC5jbGllbnRYIC8gZG9tLndyYXBwZXIub2Zmc2V0V2lkdGggKSAqIHNsaWRlc1RvdGFsICk7XG5cblx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdHNsaWRlSW5kZXggPSBzbGlkZXNUb3RhbCAtIHNsaWRlSW5kZXg7XG5cdFx0fVxuXG5cdFx0c2xpZGUoIHNsaWRlSW5kZXggKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEV2ZW50IGhhbmRsZXIgZm9yIG5hdmlnYXRpb24gY29udHJvbCBidXR0b25zLlxuXHQgKi9cblx0ZnVuY3Rpb24gb25OYXZpZ2F0ZUxlZnRDbGlja2VkKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgb25Vc2VySW5wdXQoKTsgbmF2aWdhdGVMZWZ0KCk7IH1cblx0ZnVuY3Rpb24gb25OYXZpZ2F0ZVJpZ2h0Q2xpY2tlZCggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IG9uVXNlcklucHV0KCk7IG5hdmlnYXRlUmlnaHQoKTsgfVxuXHRmdW5jdGlvbiBvbk5hdmlnYXRlVXBDbGlja2VkKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgb25Vc2VySW5wdXQoKTsgbmF2aWdhdGVVcCgpOyB9XG5cdGZ1bmN0aW9uIG9uTmF2aWdhdGVEb3duQ2xpY2tlZCggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IG9uVXNlcklucHV0KCk7IG5hdmlnYXRlRG93bigpOyB9XG5cdGZ1bmN0aW9uIG9uTmF2aWdhdGVQcmV2Q2xpY2tlZCggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IG9uVXNlcklucHV0KCk7IG5hdmlnYXRlUHJldigpOyB9XG5cdGZ1bmN0aW9uIG9uTmF2aWdhdGVOZXh0Q2xpY2tlZCggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IG9uVXNlcklucHV0KCk7IG5hdmlnYXRlTmV4dCgpOyB9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSB3aW5kb3cgbGV2ZWwgJ2hhc2hjaGFuZ2UnIGV2ZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW2V2ZW50XVxuXHQgKi9cblx0ZnVuY3Rpb24gb25XaW5kb3dIYXNoQ2hhbmdlKCBldmVudCApIHtcblxuXHRcdHJlYWRVUkwoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSB3aW5kb3cgbGV2ZWwgJ3Jlc2l6ZScgZXZlbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbZXZlbnRdXG5cdCAqL1xuXHRmdW5jdGlvbiBvbldpbmRvd1Jlc2l6ZSggZXZlbnQgKSB7XG5cblx0XHRsYXlvdXQoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZSBmb3IgdGhlIHdpbmRvdyBsZXZlbCAndmlzaWJpbGl0eWNoYW5nZScgZXZlbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbZXZlbnRdXG5cdCAqL1xuXHRmdW5jdGlvbiBvblBhZ2VWaXNpYmlsaXR5Q2hhbmdlKCBldmVudCApIHtcblxuXHRcdHZhciBpc0hpZGRlbiA9ICBkb2N1bWVudC53ZWJraXRIaWRkZW4gfHxcblx0XHRcdFx0XHRcdGRvY3VtZW50Lm1zSGlkZGVuIHx8XG5cdFx0XHRcdFx0XHRkb2N1bWVudC5oaWRkZW47XG5cblx0XHQvLyBJZiwgYWZ0ZXIgY2xpY2tpbmcgYSBsaW5rIG9yIHNpbWlsYXIgYW5kIHdlJ3JlIGNvbWluZyBiYWNrLFxuXHRcdC8vIGZvY3VzIHRoZSBkb2N1bWVudC5ib2R5IHRvIGVuc3VyZSB3ZSBjYW4gdXNlIGtleWJvYXJkIHNob3J0Y3V0c1xuXHRcdGlmKCBpc0hpZGRlbiA9PT0gZmFsc2UgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gZG9jdW1lbnQuYm9keSApIHtcblx0XHRcdC8vIE5vdCBhbGwgZWxlbWVudHMgc3VwcG9ydCAuYmx1cigpIC0gU1ZHcyBhbW9uZyB0aGVtLlxuXHRcdFx0aWYoIHR5cGVvZiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRcdGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuXHRcdFx0fVxuXHRcdFx0ZG9jdW1lbnQuYm9keS5mb2N1cygpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEludm9rZWQgd2hlbiBhIHNsaWRlIGlzIGFuZCB3ZSdyZSBpbiB0aGUgb3ZlcnZpZXcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxuXHQgKi9cblx0ZnVuY3Rpb24gb25PdmVydmlld1NsaWRlQ2xpY2tlZCggZXZlbnQgKSB7XG5cblx0XHQvLyBUT0RPIFRoZXJlJ3MgYSBidWcgaGVyZSB3aGVyZSB0aGUgZXZlbnQgbGlzdGVuZXJzIGFyZSBub3Rcblx0XHQvLyByZW1vdmVkIGFmdGVyIGRlYWN0aXZhdGluZyB0aGUgb3ZlcnZpZXcuXG5cdFx0aWYoIGV2ZW50c0FyZUJvdW5kICYmIGlzT3ZlcnZpZXcoKSApIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRcdHZhciBlbGVtZW50ID0gZXZlbnQudGFyZ2V0O1xuXG5cdFx0XHR3aGlsZSggZWxlbWVudCAmJiAhZWxlbWVudC5ub2RlTmFtZS5tYXRjaCggL3NlY3Rpb24vZ2kgKSApIHtcblx0XHRcdFx0ZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcblx0XHRcdH1cblxuXHRcdFx0aWYoIGVsZW1lbnQgJiYgIWVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCAnZGlzYWJsZWQnICkgKSB7XG5cblx0XHRcdFx0ZGVhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cblx0XHRcdFx0aWYoIGVsZW1lbnQubm9kZU5hbWUubWF0Y2goIC9zZWN0aW9uL2dpICkgKSB7XG5cdFx0XHRcdFx0dmFyIGggPSBwYXJzZUludCggZWxlbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LWgnICksIDEwICksXG5cdFx0XHRcdFx0XHR2ID0gcGFyc2VJbnQoIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1pbmRleC12JyApLCAxMCApO1xuXG5cdFx0XHRcdFx0c2xpZGUoIGgsIHYgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogSGFuZGxlcyBjbGlja3Mgb24gbGlua3MgdGhhdCBhcmUgc2V0IHRvIHByZXZpZXcgaW4gdGhlXG5cdCAqIGlmcmFtZSBvdmVybGF5LlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcblx0ICovXG5cdGZ1bmN0aW9uIG9uUHJldmlld0xpbmtDbGlja2VkKCBldmVudCApIHtcblxuXHRcdGlmKCBldmVudC5jdXJyZW50VGFyZ2V0ICYmIGV2ZW50LmN1cnJlbnRUYXJnZXQuaGFzQXR0cmlidXRlKCAnaHJlZicgKSApIHtcblx0XHRcdHZhciB1cmwgPSBldmVudC5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSggJ2hyZWYnICk7XG5cdFx0XHRpZiggdXJsICkge1xuXHRcdFx0XHRzaG93UHJldmlldyggdXJsICk7XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogSGFuZGxlcyBjbGljayBvbiB0aGUgYXV0by1zbGlkaW5nIGNvbnRyb2xzIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbZXZlbnRdXG5cdCAqL1xuXHRmdW5jdGlvbiBvbkF1dG9TbGlkZVBsYXllckNsaWNrKCBldmVudCApIHtcblxuXHRcdC8vIFJlcGxheVxuXHRcdGlmKCBSZXZlYWwuaXNMYXN0U2xpZGUoKSAmJiBjb25maWcubG9vcCA9PT0gZmFsc2UgKSB7XG5cdFx0XHRzbGlkZSggMCwgMCApO1xuXHRcdFx0cmVzdW1lQXV0b1NsaWRlKCk7XG5cdFx0fVxuXHRcdC8vIFJlc3VtZVxuXHRcdGVsc2UgaWYoIGF1dG9TbGlkZVBhdXNlZCApIHtcblx0XHRcdHJlc3VtZUF1dG9TbGlkZSgpO1xuXHRcdH1cblx0XHQvLyBQYXVzZVxuXHRcdGVsc2Uge1xuXHRcdFx0cGF1c2VBdXRvU2xpZGUoKTtcblx0XHR9XG5cblx0fVxuXG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUExBWUJBQ0sgQ09NUE9ORU5UIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuXG5cdC8qKlxuXHQgKiBDb25zdHJ1Y3RvciBmb3IgdGhlIHBsYXliYWNrIGNvbXBvbmVudCwgd2hpY2ggZGlzcGxheXNcblx0ICogcGxheS9wYXVzZS9wcm9ncmVzcyBjb250cm9scy5cblx0ICpcblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gY29udGFpbmVyIFRoZSBjb21wb25lbnQgd2lsbCBhcHBlbmRcblx0ICogaXRzZWxmIHRvIHRoaXNcblx0ICogQHBhcmFtIHtmdW5jdGlvbn0gcHJvZ3Jlc3NDaGVjayBBIG1ldGhvZCB3aGljaCB3aWxsIGJlXG5cdCAqIGNhbGxlZCBmcmVxdWVudGx5IHRvIGdldCB0aGUgY3VycmVudCBwcm9ncmVzcyBvbiBhIHJhbmdlXG5cdCAqIG9mIDAtMVxuXHQgKi9cblx0ZnVuY3Rpb24gUGxheWJhY2soIGNvbnRhaW5lciwgcHJvZ3Jlc3NDaGVjayApIHtcblxuXHRcdC8vIENvc21ldGljc1xuXHRcdHRoaXMuZGlhbWV0ZXIgPSAxMDA7XG5cdFx0dGhpcy5kaWFtZXRlcjIgPSB0aGlzLmRpYW1ldGVyLzI7XG5cdFx0dGhpcy50aGlja25lc3MgPSA2O1xuXG5cdFx0Ly8gRmxhZ3MgaWYgd2UgYXJlIGN1cnJlbnRseSBwbGF5aW5nXG5cdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XG5cblx0XHQvLyBDdXJyZW50IHByb2dyZXNzIG9uIGEgMC0xIHJhbmdlXG5cdFx0dGhpcy5wcm9ncmVzcyA9IDA7XG5cblx0XHQvLyBVc2VkIHRvIGxvb3AgdGhlIGFuaW1hdGlvbiBzbW9vdGhseVxuXHRcdHRoaXMucHJvZ3Jlc3NPZmZzZXQgPSAxO1xuXG5cdFx0dGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG5cdFx0dGhpcy5wcm9ncmVzc0NoZWNrID0gcHJvZ3Jlc3NDaGVjaztcblxuXHRcdHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcblx0XHR0aGlzLmNhbnZhcy5jbGFzc05hbWUgPSAncGxheWJhY2snO1xuXHRcdHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5kaWFtZXRlcjtcblx0XHR0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmRpYW1ldGVyO1xuXHRcdHRoaXMuY2FudmFzLnN0eWxlLndpZHRoID0gdGhpcy5kaWFtZXRlcjIgKyAncHgnO1xuXHRcdHRoaXMuY2FudmFzLnN0eWxlLmhlaWdodCA9IHRoaXMuZGlhbWV0ZXIyICsgJ3B4Jztcblx0XHR0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCAnMmQnICk7XG5cblx0XHR0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCggdGhpcy5jYW52YXMgKTtcblxuXHRcdHRoaXMucmVuZGVyKCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBAcGFyYW0gdmFsdWVcblx0ICovXG5cdFBsYXliYWNrLnByb3RvdHlwZS5zZXRQbGF5aW5nID0gZnVuY3Rpb24oIHZhbHVlICkge1xuXG5cdFx0dmFyIHdhc1BsYXlpbmcgPSB0aGlzLnBsYXlpbmc7XG5cblx0XHR0aGlzLnBsYXlpbmcgPSB2YWx1ZTtcblxuXHRcdC8vIFN0YXJ0IHJlcGFpbnRpbmcgaWYgd2Ugd2VyZW4ndCBhbHJlYWR5XG5cdFx0aWYoICF3YXNQbGF5aW5nICYmIHRoaXMucGxheWluZyApIHtcblx0XHRcdHRoaXMuYW5pbWF0ZSgpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMucmVuZGVyKCk7XG5cdFx0fVxuXG5cdH07XG5cblx0UGxheWJhY2sucHJvdG90eXBlLmFuaW1hdGUgPSBmdW5jdGlvbigpIHtcblxuXHRcdHZhciBwcm9ncmVzc0JlZm9yZSA9IHRoaXMucHJvZ3Jlc3M7XG5cblx0XHR0aGlzLnByb2dyZXNzID0gdGhpcy5wcm9ncmVzc0NoZWNrKCk7XG5cblx0XHQvLyBXaGVuIHdlIGxvb3AsIG9mZnNldCB0aGUgcHJvZ3Jlc3Mgc28gdGhhdCBpdCBlYXNlc1xuXHRcdC8vIHNtb290aGx5IHJhdGhlciB0aGFuIGltbWVkaWF0ZWx5IHJlc2V0dGluZ1xuXHRcdGlmKCBwcm9ncmVzc0JlZm9yZSA+IDAuOCAmJiB0aGlzLnByb2dyZXNzIDwgMC4yICkge1xuXHRcdFx0dGhpcy5wcm9ncmVzc09mZnNldCA9IHRoaXMucHJvZ3Jlc3M7XG5cdFx0fVxuXG5cdFx0dGhpcy5yZW5kZXIoKTtcblxuXHRcdGlmKCB0aGlzLnBsYXlpbmcgKSB7XG5cdFx0XHRmZWF0dXJlcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVNZXRob2QuY2FsbCggd2luZG93LCB0aGlzLmFuaW1hdGUuYmluZCggdGhpcyApICk7XG5cdFx0fVxuXG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbmRlcnMgdGhlIGN1cnJlbnQgcHJvZ3Jlc3MgYW5kIHBsYXliYWNrIHN0YXRlLlxuXHQgKi9cblx0UGxheWJhY2sucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyIHByb2dyZXNzID0gdGhpcy5wbGF5aW5nID8gdGhpcy5wcm9ncmVzcyA6IDAsXG5cdFx0XHRyYWRpdXMgPSAoIHRoaXMuZGlhbWV0ZXIyICkgLSB0aGlzLnRoaWNrbmVzcyxcblx0XHRcdHggPSB0aGlzLmRpYW1ldGVyMixcblx0XHRcdHkgPSB0aGlzLmRpYW1ldGVyMixcblx0XHRcdGljb25TaXplID0gMjg7XG5cblx0XHQvLyBFYXNlIHRvd2FyZHMgMVxuXHRcdHRoaXMucHJvZ3Jlc3NPZmZzZXQgKz0gKCAxIC0gdGhpcy5wcm9ncmVzc09mZnNldCApICogMC4xO1xuXG5cdFx0dmFyIGVuZEFuZ2xlID0gKCAtIE1hdGguUEkgLyAyICkgKyAoIHByb2dyZXNzICogKCBNYXRoLlBJICogMiApICk7XG5cdFx0dmFyIHN0YXJ0QW5nbGUgPSAoIC0gTWF0aC5QSSAvIDIgKSArICggdGhpcy5wcm9ncmVzc09mZnNldCAqICggTWF0aC5QSSAqIDIgKSApO1xuXG5cdFx0dGhpcy5jb250ZXh0LnNhdmUoKTtcblx0XHR0aGlzLmNvbnRleHQuY2xlYXJSZWN0KCAwLCAwLCB0aGlzLmRpYW1ldGVyLCB0aGlzLmRpYW1ldGVyICk7XG5cblx0XHQvLyBTb2xpZCBiYWNrZ3JvdW5kIGNvbG9yXG5cdFx0dGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuXHRcdHRoaXMuY29udGV4dC5hcmMoIHgsIHksIHJhZGl1cyArIDQsIDAsIE1hdGguUEkgKiAyLCBmYWxzZSApO1xuXHRcdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSggMCwgMCwgMCwgMC40ICknO1xuXHRcdHRoaXMuY29udGV4dC5maWxsKCk7XG5cblx0XHQvLyBEcmF3IHByb2dyZXNzIHRyYWNrXG5cdFx0dGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuXHRcdHRoaXMuY29udGV4dC5hcmMoIHgsIHksIHJhZGl1cywgMCwgTWF0aC5QSSAqIDIsIGZhbHNlICk7XG5cdFx0dGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMudGhpY2tuZXNzO1xuXHRcdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9ICcjNjY2Jztcblx0XHR0aGlzLmNvbnRleHQuc3Ryb2tlKCk7XG5cblx0XHRpZiggdGhpcy5wbGF5aW5nICkge1xuXHRcdFx0Ly8gRHJhdyBwcm9ncmVzcyBvbiB0b3Agb2YgdHJhY2tcblx0XHRcdHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdHRoaXMuY29udGV4dC5hcmMoIHgsIHksIHJhZGl1cywgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGZhbHNlICk7XG5cdFx0XHR0aGlzLmNvbnRleHQubGluZVdpZHRoID0gdGhpcy50aGlja25lc3M7XG5cdFx0XHR0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSAnI2ZmZic7XG5cdFx0XHR0aGlzLmNvbnRleHQuc3Ryb2tlKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5jb250ZXh0LnRyYW5zbGF0ZSggeCAtICggaWNvblNpemUgLyAyICksIHkgLSAoIGljb25TaXplIC8gMiApICk7XG5cblx0XHQvLyBEcmF3IHBsYXkvcGF1c2UgaWNvbnNcblx0XHRpZiggdGhpcy5wbGF5aW5nICkge1xuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICcjZmZmJztcblx0XHRcdHRoaXMuY29udGV4dC5maWxsUmVjdCggMCwgMCwgaWNvblNpemUgLyAyIC0gNCwgaWNvblNpemUgKTtcblx0XHRcdHRoaXMuY29udGV4dC5maWxsUmVjdCggaWNvblNpemUgLyAyICsgNCwgMCwgaWNvblNpemUgLyAyIC0gNCwgaWNvblNpemUgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0XHR0aGlzLmNvbnRleHQudHJhbnNsYXRlKCA0LCAwICk7XG5cdFx0XHR0aGlzLmNvbnRleHQubW92ZVRvKCAwLCAwICk7XG5cdFx0XHR0aGlzLmNvbnRleHQubGluZVRvKCBpY29uU2l6ZSAtIDQsIGljb25TaXplIC8gMiApO1xuXHRcdFx0dGhpcy5jb250ZXh0LmxpbmVUbyggMCwgaWNvblNpemUgKTtcblx0XHRcdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnI2ZmZic7XG5cdFx0XHR0aGlzLmNvbnRleHQuZmlsbCgpO1xuXHRcdH1cblxuXHRcdHRoaXMuY29udGV4dC5yZXN0b3JlKCk7XG5cblx0fTtcblxuXHRQbGF5YmFjay5wcm90b3R5cGUub24gPSBmdW5jdGlvbiggdHlwZSwgbGlzdGVuZXIgKSB7XG5cdFx0dGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lciggdHlwZSwgbGlzdGVuZXIsIGZhbHNlICk7XG5cdH07XG5cblx0UGxheWJhY2sucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKCB0eXBlLCBsaXN0ZW5lciApIHtcblx0XHR0aGlzLmNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciwgZmFsc2UgKTtcblx0fTtcblxuXHRQbGF5YmFjay5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XG5cblx0XHRpZiggdGhpcy5jYW52YXMucGFyZW50Tm9kZSApIHtcblx0XHRcdHRoaXMuY29udGFpbmVyLnJlbW92ZUNoaWxkKCB0aGlzLmNhbnZhcyApO1xuXHRcdH1cblxuXHR9O1xuXG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEFQSSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuXG5cdFJldmVhbCA9IHtcblx0XHRWRVJTSU9OOiBWRVJTSU9OLFxuXG5cdFx0aW5pdGlhbGl6ZTogaW5pdGlhbGl6ZSxcblx0XHRjb25maWd1cmU6IGNvbmZpZ3VyZSxcblx0XHRzeW5jOiBzeW5jLFxuXG5cdFx0Ly8gTmF2aWdhdGlvbiBtZXRob2RzXG5cdFx0c2xpZGU6IHNsaWRlLFxuXHRcdGxlZnQ6IG5hdmlnYXRlTGVmdCxcblx0XHRyaWdodDogbmF2aWdhdGVSaWdodCxcblx0XHR1cDogbmF2aWdhdGVVcCxcblx0XHRkb3duOiBuYXZpZ2F0ZURvd24sXG5cdFx0cHJldjogbmF2aWdhdGVQcmV2LFxuXHRcdG5leHQ6IG5hdmlnYXRlTmV4dCxcblxuXHRcdC8vIEZyYWdtZW50IG1ldGhvZHNcblx0XHRuYXZpZ2F0ZUZyYWdtZW50OiBuYXZpZ2F0ZUZyYWdtZW50LFxuXHRcdHByZXZGcmFnbWVudDogcHJldmlvdXNGcmFnbWVudCxcblx0XHRuZXh0RnJhZ21lbnQ6IG5leHRGcmFnbWVudCxcblxuXHRcdC8vIERlcHJlY2F0ZWQgYWxpYXNlc1xuXHRcdG5hdmlnYXRlVG86IHNsaWRlLFxuXHRcdG5hdmlnYXRlTGVmdDogbmF2aWdhdGVMZWZ0LFxuXHRcdG5hdmlnYXRlUmlnaHQ6IG5hdmlnYXRlUmlnaHQsXG5cdFx0bmF2aWdhdGVVcDogbmF2aWdhdGVVcCxcblx0XHRuYXZpZ2F0ZURvd246IG5hdmlnYXRlRG93bixcblx0XHRuYXZpZ2F0ZVByZXY6IG5hdmlnYXRlUHJldixcblx0XHRuYXZpZ2F0ZU5leHQ6IG5hdmlnYXRlTmV4dCxcblxuXHRcdC8vIEZvcmNlcyBhbiB1cGRhdGUgaW4gc2xpZGUgbGF5b3V0XG5cdFx0bGF5b3V0OiBsYXlvdXQsXG5cblx0XHQvLyBSYW5kb21pemVzIHRoZSBvcmRlciBvZiBzbGlkZXNcblx0XHRzaHVmZmxlOiBzaHVmZmxlLFxuXG5cdFx0Ly8gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgYXZhaWxhYmxlIHJvdXRlcyBhcyBib29sZWFucyAobGVmdC9yaWdodC90b3AvYm90dG9tKVxuXHRcdGF2YWlsYWJsZVJvdXRlczogYXZhaWxhYmxlUm91dGVzLFxuXG5cdFx0Ly8gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgYXZhaWxhYmxlIGZyYWdtZW50cyBhcyBib29sZWFucyAocHJldi9uZXh0KVxuXHRcdGF2YWlsYWJsZUZyYWdtZW50czogYXZhaWxhYmxlRnJhZ21lbnRzLFxuXG5cdFx0Ly8gVG9nZ2xlcyBhIGhlbHAgb3ZlcmxheSB3aXRoIGtleWJvYXJkIHNob3J0Y3V0c1xuXHRcdHRvZ2dsZUhlbHA6IHRvZ2dsZUhlbHAsXG5cblx0XHQvLyBUb2dnbGVzIHRoZSBvdmVydmlldyBtb2RlIG9uL29mZlxuXHRcdHRvZ2dsZU92ZXJ2aWV3OiB0b2dnbGVPdmVydmlldyxcblxuXHRcdC8vIFRvZ2dsZXMgdGhlIFwiYmxhY2sgc2NyZWVuXCIgbW9kZSBvbi9vZmZcblx0XHR0b2dnbGVQYXVzZTogdG9nZ2xlUGF1c2UsXG5cblx0XHQvLyBUb2dnbGVzIHRoZSBhdXRvIHNsaWRlIG1vZGUgb24vb2ZmXG5cdFx0dG9nZ2xlQXV0b1NsaWRlOiB0b2dnbGVBdXRvU2xpZGUsXG5cblx0XHQvLyBTdGF0ZSBjaGVja3Ncblx0XHRpc092ZXJ2aWV3OiBpc092ZXJ2aWV3LFxuXHRcdGlzUGF1c2VkOiBpc1BhdXNlZCxcblx0XHRpc0F1dG9TbGlkaW5nOiBpc0F1dG9TbGlkaW5nLFxuXG5cdFx0Ly8gQWRkcyBvciByZW1vdmVzIGFsbCBpbnRlcm5hbCBldmVudCBsaXN0ZW5lcnMgKHN1Y2ggYXMga2V5Ym9hcmQpXG5cdFx0YWRkRXZlbnRMaXN0ZW5lcnM6IGFkZEV2ZW50TGlzdGVuZXJzLFxuXHRcdHJlbW92ZUV2ZW50TGlzdGVuZXJzOiByZW1vdmVFdmVudExpc3RlbmVycyxcblxuXHRcdC8vIEZhY2lsaXR5IGZvciBwZXJzaXN0aW5nIGFuZCByZXN0b3JpbmcgdGhlIHByZXNlbnRhdGlvbiBzdGF0ZVxuXHRcdGdldFN0YXRlOiBnZXRTdGF0ZSxcblx0XHRzZXRTdGF0ZTogc2V0U3RhdGUsXG5cblx0XHQvLyBQcmVzZW50YXRpb24gcHJvZ3Jlc3Ncblx0XHRnZXRTbGlkZVBhc3RDb3VudDogZ2V0U2xpZGVQYXN0Q291bnQsXG5cblx0XHQvLyBQcmVzZW50YXRpb24gcHJvZ3Jlc3Mgb24gcmFuZ2Ugb2YgMC0xXG5cdFx0Z2V0UHJvZ3Jlc3M6IGdldFByb2dyZXNzLFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgaW5kaWNlcyBvZiB0aGUgY3VycmVudCwgb3Igc3BlY2lmaWVkLCBzbGlkZVxuXHRcdGdldEluZGljZXM6IGdldEluZGljZXMsXG5cblx0XHQvLyBSZXR1cm5zIGFuIEFycmF5IG9mIGFsbCBzbGlkZXNcblx0XHRnZXRTbGlkZXM6IGdldFNsaWRlcyxcblxuXHRcdC8vIFJldHVybnMgdGhlIHRvdGFsIG51bWJlciBvZiBzbGlkZXNcblx0XHRnZXRUb3RhbFNsaWRlczogZ2V0VG90YWxTbGlkZXMsXG5cblx0XHQvLyBSZXR1cm5zIHRoZSBzbGlkZSBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXhcblx0XHRnZXRTbGlkZTogZ2V0U2xpZGUsXG5cblx0XHQvLyBSZXR1cm5zIHRoZSBzbGlkZSBiYWNrZ3JvdW5kIGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCBpbmRleFxuXHRcdGdldFNsaWRlQmFja2dyb3VuZDogZ2V0U2xpZGVCYWNrZ3JvdW5kLFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgc3BlYWtlciBub3RlcyBzdHJpbmcgZm9yIGEgc2xpZGUsIG9yIG51bGxcblx0XHRnZXRTbGlkZU5vdGVzOiBnZXRTbGlkZU5vdGVzLFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgcHJldmlvdXMgc2xpZGUgZWxlbWVudCwgbWF5IGJlIG51bGxcblx0XHRnZXRQcmV2aW91c1NsaWRlOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBwcmV2aW91c1NsaWRlO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm5zIHRoZSBjdXJyZW50IHNsaWRlIGVsZW1lbnRcblx0XHRnZXRDdXJyZW50U2xpZGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGN1cnJlbnRTbGlkZTtcblx0XHR9LFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgY3VycmVudCBzY2FsZSBvZiB0aGUgcHJlc2VudGF0aW9uIGNvbnRlbnRcblx0XHRnZXRTY2FsZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gc2NhbGU7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybnMgdGhlIGN1cnJlbnQgY29uZmlndXJhdGlvbiBvYmplY3Rcblx0XHRnZXRDb25maWc6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGNvbmZpZztcblx0XHR9LFxuXG5cdFx0Ly8gSGVscGVyIG1ldGhvZCwgcmV0cmlldmVzIHF1ZXJ5IHN0cmluZyBhcyBhIGtleS92YWx1ZSBoYXNoXG5cdFx0Z2V0UXVlcnlIYXNoOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBxdWVyeSA9IHt9O1xuXG5cdFx0XHRsb2NhdGlvbi5zZWFyY2gucmVwbGFjZSggL1tBLVowLTldKz89KFtcXHdcXC4lLV0qKS9naSwgZnVuY3Rpb24oYSkge1xuXHRcdFx0XHRxdWVyeVsgYS5zcGxpdCggJz0nICkuc2hpZnQoKSBdID0gYS5zcGxpdCggJz0nICkucG9wKCk7XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIEJhc2ljIGRlc2VyaWFsaXphdGlvblxuXHRcdFx0Zm9yKCB2YXIgaSBpbiBxdWVyeSApIHtcblx0XHRcdFx0dmFyIHZhbHVlID0gcXVlcnlbIGkgXTtcblxuXHRcdFx0XHRxdWVyeVsgaSBdID0gZGVzZXJpYWxpemUoIHVuZXNjYXBlKCB2YWx1ZSApICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBxdWVyeTtcblx0XHR9LFxuXG5cdFx0Ly8gUmV0dXJucyB0cnVlIGlmIHdlJ3JlIGN1cnJlbnRseSBvbiB0aGUgZmlyc3Qgc2xpZGVcblx0XHRpc0ZpcnN0U2xpZGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuICggaW5kZXhoID09PSAwICYmIGluZGV4diA9PT0gMCApO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm5zIHRydWUgaWYgd2UncmUgY3VycmVudGx5IG9uIHRoZSBsYXN0IHNsaWRlXG5cdFx0aXNMYXN0U2xpZGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYoIGN1cnJlbnRTbGlkZSApIHtcblx0XHRcdFx0Ly8gRG9lcyB0aGlzIHNsaWRlIGhhcyBuZXh0IGEgc2libGluZz9cblx0XHRcdFx0aWYoIGN1cnJlbnRTbGlkZS5uZXh0RWxlbWVudFNpYmxpbmcgKSByZXR1cm4gZmFsc2U7XG5cblx0XHRcdFx0Ly8gSWYgaXQncyB2ZXJ0aWNhbCwgZG9lcyBpdHMgcGFyZW50IGhhdmUgYSBuZXh0IHNpYmxpbmc/XG5cdFx0XHRcdGlmKCBpc1ZlcnRpY2FsU2xpZGUoIGN1cnJlbnRTbGlkZSApICYmIGN1cnJlbnRTbGlkZS5wYXJlbnROb2RlLm5leHRFbGVtZW50U2libGluZyApIHJldHVybiBmYWxzZTtcblxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0sXG5cblx0XHQvLyBDaGVja3MgaWYgcmV2ZWFsLmpzIGhhcyBiZWVuIGxvYWRlZCBhbmQgaXMgcmVhZHkgZm9yIHVzZVxuXHRcdGlzUmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGxvYWRlZDtcblx0XHR9LFxuXG5cdFx0Ly8gRm9yd2FyZCBldmVudCBiaW5kaW5nIHRvIHRoZSByZXZlYWwgRE9NIGVsZW1lbnRcblx0XHRhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbiggdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUgKSB7XG5cdFx0XHRpZiggJ2FkZEV2ZW50TGlzdGVuZXInIGluIHdpbmRvdyApIHtcblx0XHRcdFx0KCBkb20ud3JhcHBlciB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCAnLnJldmVhbCcgKSApLmFkZEV2ZW50TGlzdGVuZXIoIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlICk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZW1vdmVFdmVudExpc3RlbmVyOiBmdW5jdGlvbiggdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUgKSB7XG5cdFx0XHRpZiggJ2FkZEV2ZW50TGlzdGVuZXInIGluIHdpbmRvdyApIHtcblx0XHRcdFx0KCBkb20ud3JhcHBlciB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCAnLnJldmVhbCcgKSApLnJlbW92ZUV2ZW50TGlzdGVuZXIoIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlICk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vIFByb2dyYW1hdGljYWxseSB0cmlnZ2VycyBhIGtleWJvYXJkIGV2ZW50XG5cdFx0dHJpZ2dlcktleTogZnVuY3Rpb24oIGtleUNvZGUgKSB7XG5cdFx0XHRvbkRvY3VtZW50S2V5RG93biggeyBrZXlDb2RlOiBrZXlDb2RlIH0gKTtcblx0XHR9LFxuXG5cdFx0Ly8gUmVnaXN0ZXJzIGEgbmV3IHNob3J0Y3V0IHRvIGluY2x1ZGUgaW4gdGhlIGhlbHAgb3ZlcmxheVxuXHRcdHJlZ2lzdGVyS2V5Ym9hcmRTaG9ydGN1dDogZnVuY3Rpb24oIGtleSwgdmFsdWUgKSB7XG5cdFx0XHRrZXlib2FyZFNob3J0Y3V0c1trZXldID0gdmFsdWU7XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBSZXZlYWw7XG5cbn0pKTtcbiIsIi8qKlxuICogVGhlIHJldmVhbC5qcyBtYXJrZG93biBwbHVnaW4uIEhhbmRsZXMgcGFyc2luZyBvZlxuICogbWFya2Rvd24gaW5zaWRlIG9mIHByZXNlbnRhdGlvbnMgYXMgd2VsbCBhcyBsb2FkaW5nXG4gKiBvZiBleHRlcm5hbCBtYXJrZG93biBkb2N1bWVudHMuXG4gKi9cbihmdW5jdGlvbiggcm9vdCwgZmFjdG9yeSApIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdHJvb3QubWFya2VkID0gcmVxdWlyZSggJy4vbWFya2VkJyApO1xuXHRcdHJvb3QuUmV2ZWFsTWFya2Rvd24gPSBmYWN0b3J5KCByb290Lm1hcmtlZCApO1xuXHRcdHJvb3QuUmV2ZWFsTWFya2Rvd24uaW5pdGlhbGl6ZSgpO1xuXHR9IGVsc2UgaWYoIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyApIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoIHJlcXVpcmUoICcuL21hcmtlZCcgKSApO1xuXHR9IGVsc2Uge1xuXHRcdC8vIEJyb3dzZXIgZ2xvYmFscyAocm9vdCBpcyB3aW5kb3cpXG5cdFx0cm9vdC5SZXZlYWxNYXJrZG93biA9IGZhY3RvcnkoIHJvb3QubWFya2VkICk7XG5cdFx0cm9vdC5SZXZlYWxNYXJrZG93bi5pbml0aWFsaXplKCk7XG5cdH1cbn0oIHRoaXMsIGZ1bmN0aW9uKCBtYXJrZWQgKSB7XG5cblx0dmFyIERFRkFVTFRfU0xJREVfU0VQQVJBVE9SID0gJ15cXHI/XFxuLS0tXFxyP1xcbiQnLFxuXHRcdERFRkFVTFRfTk9URVNfU0VQQVJBVE9SID0gJ25vdGU6Jyxcblx0XHRERUZBVUxUX0VMRU1FTlRfQVRUUklCVVRFU19TRVBBUkFUT1IgPSAnXFxcXFxcLmVsZW1lbnRcXFxcXFxzKj8oLis/KSQnLFxuXHRcdERFRkFVTFRfU0xJREVfQVRUUklCVVRFU19TRVBBUkFUT1IgPSAnXFxcXFxcLnNsaWRlOlxcXFxcXHMqPyhcXFxcXFxTLis/KSQnO1xuXG5cdHZhciBTQ1JJUFRfRU5EX1BMQUNFSE9MREVSID0gJ19fU0NSSVBUX0VORF9fJztcblxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIG1hcmtkb3duIGNvbnRlbnRzIG9mIGEgc2xpZGUgc2VjdGlvblxuXHQgKiBlbGVtZW50LiBOb3JtYWxpemVzIGxlYWRpbmcgdGFicy93aGl0ZXNwYWNlLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0TWFya2Rvd25Gcm9tU2xpZGUoIHNlY3Rpb24gKSB7XG5cblx0XHQvLyBsb29rIGZvciBhIDxzY3JpcHQ+IG9yIDx0ZXh0YXJlYSBkYXRhLXRlbXBsYXRlPiB3cmFwcGVyXG5cdFx0dmFyIHRlbXBsYXRlID0gc2VjdGlvbi5xdWVyeVNlbGVjdG9yKCAnW2RhdGEtdGVtcGxhdGVdJyApIHx8IHNlY3Rpb24ucXVlcnlTZWxlY3RvciggJ3NjcmlwdCcgKTtcblxuXHRcdC8vIHN0cmlwIGxlYWRpbmcgd2hpdGVzcGFjZSBzbyBpdCBpc24ndCBldmFsdWF0ZWQgYXMgY29kZVxuXHRcdHZhciB0ZXh0ID0gKCB0ZW1wbGF0ZSB8fCBzZWN0aW9uICkudGV4dENvbnRlbnQ7XG5cblx0XHQvLyByZXN0b3JlIHNjcmlwdCBlbmQgdGFnc1xuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoIG5ldyBSZWdFeHAoIFNDUklQVF9FTkRfUExBQ0VIT0xERVIsICdnJyApLCAnPC9zY3JpcHQ+JyApO1xuXG5cdFx0dmFyIGxlYWRpbmdXcyA9IHRleHQubWF0Y2goIC9eXFxuPyhcXHMqKS8gKVsxXS5sZW5ndGgsXG5cdFx0XHRsZWFkaW5nVGFicyA9IHRleHQubWF0Y2goIC9eXFxuPyhcXHQqKS8gKVsxXS5sZW5ndGg7XG5cblx0XHRpZiggbGVhZGluZ1RhYnMgPiAwICkge1xuXHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZSggbmV3IFJlZ0V4cCgnXFxcXG4/XFxcXHR7JyArIGxlYWRpbmdUYWJzICsgJ30nLCdnJyksICdcXG4nICk7XG5cdFx0fVxuXHRcdGVsc2UgaWYoIGxlYWRpbmdXcyA+IDEgKSB7XG5cdFx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKCBuZXcgUmVnRXhwKCdcXFxcbj8geycgKyBsZWFkaW5nV3MgKyAnfScsICdnJyksICdcXG4nICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRleHQ7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBHaXZlbiBhIG1hcmtkb3duIHNsaWRlIHNlY3Rpb24gZWxlbWVudCwgdGhpcyB3aWxsXG5cdCAqIHJldHVybiBhbGwgYXJndW1lbnRzIHRoYXQgYXJlbid0IHJlbGF0ZWQgdG8gbWFya2Rvd25cblx0ICogcGFyc2luZy4gVXNlZCB0byBmb3J3YXJkIGFueSBvdGhlciB1c2VyLWRlZmluZWQgYXJndW1lbnRzXG5cdCAqIHRvIHRoZSBvdXRwdXQgbWFya2Rvd24gc2xpZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRGb3J3YXJkZWRBdHRyaWJ1dGVzKCBzZWN0aW9uICkge1xuXG5cdFx0dmFyIGF0dHJpYnV0ZXMgPSBzZWN0aW9uLmF0dHJpYnV0ZXM7XG5cdFx0dmFyIHJlc3VsdCA9IFtdO1xuXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGF0dHJpYnV0ZXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHR2YXIgbmFtZSA9IGF0dHJpYnV0ZXNbaV0ubmFtZSxcblx0XHRcdFx0dmFsdWUgPSBhdHRyaWJ1dGVzW2ldLnZhbHVlO1xuXG5cdFx0XHQvLyBkaXNyZWdhcmQgYXR0cmlidXRlcyB0aGF0IGFyZSB1c2VkIGZvciBtYXJrZG93biBsb2FkaW5nL3BhcnNpbmdcblx0XHRcdGlmKCAvZGF0YVxcLShtYXJrZG93bnxzZXBhcmF0b3J8dmVydGljYWx8bm90ZXMpL2dpLnRlc3QoIG5hbWUgKSApIGNvbnRpbnVlO1xuXG5cdFx0XHRpZiggdmFsdWUgKSB7XG5cdFx0XHRcdHJlc3VsdC5wdXNoKCBuYW1lICsgJz1cIicgKyB2YWx1ZSArICdcIicgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRyZXN1bHQucHVzaCggbmFtZSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiByZXN1bHQuam9pbiggJyAnICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBJbnNwZWN0cyB0aGUgZ2l2ZW4gb3B0aW9ucyBhbmQgZmlsbHMgb3V0IGRlZmF1bHRcblx0ICogdmFsdWVzIGZvciB3aGF0J3Mgbm90IGRlZmluZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRTbGlkaWZ5T3B0aW9ucyggb3B0aW9ucyApIHtcblxuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHRcdG9wdGlvbnMuc2VwYXJhdG9yID0gb3B0aW9ucy5zZXBhcmF0b3IgfHwgREVGQVVMVF9TTElERV9TRVBBUkFUT1I7XG5cdFx0b3B0aW9ucy5ub3Rlc1NlcGFyYXRvciA9IG9wdGlvbnMubm90ZXNTZXBhcmF0b3IgfHwgREVGQVVMVF9OT1RFU19TRVBBUkFUT1I7XG5cdFx0b3B0aW9ucy5hdHRyaWJ1dGVzID0gb3B0aW9ucy5hdHRyaWJ1dGVzIHx8ICcnO1xuXG5cdFx0cmV0dXJuIG9wdGlvbnM7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIZWxwZXIgZnVuY3Rpb24gZm9yIGNvbnN0cnVjdGluZyBhIG1hcmtkb3duIHNsaWRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlTWFya2Rvd25TbGlkZSggY29udGVudCwgb3B0aW9ucyApIHtcblxuXHRcdG9wdGlvbnMgPSBnZXRTbGlkaWZ5T3B0aW9ucyggb3B0aW9ucyApO1xuXG5cdFx0dmFyIG5vdGVzTWF0Y2ggPSBjb250ZW50LnNwbGl0KCBuZXcgUmVnRXhwKCBvcHRpb25zLm5vdGVzU2VwYXJhdG9yLCAnbWdpJyApICk7XG5cblx0XHRpZiggbm90ZXNNYXRjaC5sZW5ndGggPT09IDIgKSB7XG5cdFx0XHRjb250ZW50ID0gbm90ZXNNYXRjaFswXSArICc8YXNpZGUgY2xhc3M9XCJub3Rlc1wiPicgKyBtYXJrZWQobm90ZXNNYXRjaFsxXS50cmltKCkpICsgJzwvYXNpZGU+Jztcblx0XHR9XG5cblx0XHQvLyBwcmV2ZW50IHNjcmlwdCBlbmQgdGFncyBpbiB0aGUgY29udGVudCBmcm9tIGludGVyZmVyaW5nXG5cdFx0Ly8gd2l0aCBwYXJzaW5nXG5cdFx0Y29udGVudCA9IGNvbnRlbnQucmVwbGFjZSggLzxcXC9zY3JpcHQ+L2csIFNDUklQVF9FTkRfUExBQ0VIT0xERVIgKTtcblxuXHRcdHJldHVybiAnPHNjcmlwdCB0eXBlPVwidGV4dC90ZW1wbGF0ZVwiPicgKyBjb250ZW50ICsgJzwvc2NyaXB0Pic7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBQYXJzZXMgYSBkYXRhIHN0cmluZyBpbnRvIG11bHRpcGxlIHNsaWRlcyBiYXNlZFxuXHQgKiBvbiB0aGUgcGFzc2VkIGluIHNlcGFyYXRvciBhcmd1bWVudHMuXG5cdCAqL1xuXHRmdW5jdGlvbiBzbGlkaWZ5KCBtYXJrZG93biwgb3B0aW9ucyApIHtcblxuXHRcdG9wdGlvbnMgPSBnZXRTbGlkaWZ5T3B0aW9ucyggb3B0aW9ucyApO1xuXG5cdFx0dmFyIHNlcGFyYXRvclJlZ2V4ID0gbmV3IFJlZ0V4cCggb3B0aW9ucy5zZXBhcmF0b3IgKyAoIG9wdGlvbnMudmVydGljYWxTZXBhcmF0b3IgPyAnfCcgKyBvcHRpb25zLnZlcnRpY2FsU2VwYXJhdG9yIDogJycgKSwgJ21nJyApLFxuXHRcdFx0aG9yaXpvbnRhbFNlcGFyYXRvclJlZ2V4ID0gbmV3IFJlZ0V4cCggb3B0aW9ucy5zZXBhcmF0b3IgKTtcblxuXHRcdHZhciBtYXRjaGVzLFxuXHRcdFx0bGFzdEluZGV4ID0gMCxcblx0XHRcdGlzSG9yaXpvbnRhbCxcblx0XHRcdHdhc0hvcml6b250YWwgPSB0cnVlLFxuXHRcdFx0Y29udGVudCxcblx0XHRcdHNlY3Rpb25TdGFjayA9IFtdO1xuXG5cdFx0Ly8gaXRlcmF0ZSB1bnRpbCBhbGwgYmxvY2tzIGJldHdlZW4gc2VwYXJhdG9ycyBhcmUgc3RhY2tlZCB1cFxuXHRcdHdoaWxlKCBtYXRjaGVzID0gc2VwYXJhdG9yUmVnZXguZXhlYyggbWFya2Rvd24gKSApIHtcblx0XHRcdG5vdGVzID0gbnVsbDtcblxuXHRcdFx0Ly8gZGV0ZXJtaW5lIGRpcmVjdGlvbiAoaG9yaXpvbnRhbCBieSBkZWZhdWx0KVxuXHRcdFx0aXNIb3Jpem9udGFsID0gaG9yaXpvbnRhbFNlcGFyYXRvclJlZ2V4LnRlc3QoIG1hdGNoZXNbMF0gKTtcblxuXHRcdFx0aWYoICFpc0hvcml6b250YWwgJiYgd2FzSG9yaXpvbnRhbCApIHtcblx0XHRcdFx0Ly8gY3JlYXRlIHZlcnRpY2FsIHN0YWNrXG5cdFx0XHRcdHNlY3Rpb25TdGFjay5wdXNoKCBbXSApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBwbHVjayBzbGlkZSBjb250ZW50IGZyb20gbWFya2Rvd24gaW5wdXRcblx0XHRcdGNvbnRlbnQgPSBtYXJrZG93bi5zdWJzdHJpbmcoIGxhc3RJbmRleCwgbWF0Y2hlcy5pbmRleCApO1xuXG5cdFx0XHRpZiggaXNIb3Jpem9udGFsICYmIHdhc0hvcml6b250YWwgKSB7XG5cdFx0XHRcdC8vIGFkZCB0byBob3Jpem9udGFsIHN0YWNrXG5cdFx0XHRcdHNlY3Rpb25TdGFjay5wdXNoKCBjb250ZW50ICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly8gYWRkIHRvIHZlcnRpY2FsIHN0YWNrXG5cdFx0XHRcdHNlY3Rpb25TdGFja1tzZWN0aW9uU3RhY2subGVuZ3RoLTFdLnB1c2goIGNvbnRlbnQgKTtcblx0XHRcdH1cblxuXHRcdFx0bGFzdEluZGV4ID0gc2VwYXJhdG9yUmVnZXgubGFzdEluZGV4O1xuXHRcdFx0d2FzSG9yaXpvbnRhbCA9IGlzSG9yaXpvbnRhbDtcblx0XHR9XG5cblx0XHQvLyBhZGQgdGhlIHJlbWFpbmluZyBzbGlkZVxuXHRcdCggd2FzSG9yaXpvbnRhbCA/IHNlY3Rpb25TdGFjayA6IHNlY3Rpb25TdGFja1tzZWN0aW9uU3RhY2subGVuZ3RoLTFdICkucHVzaCggbWFya2Rvd24uc3Vic3RyaW5nKCBsYXN0SW5kZXggKSApO1xuXG5cdFx0dmFyIG1hcmtkb3duU2VjdGlvbnMgPSAnJztcblxuXHRcdC8vIGZsYXR0ZW4gdGhlIGhpZXJhcmNoaWNhbCBzdGFjaywgYW5kIGluc2VydCA8c2VjdGlvbiBkYXRhLW1hcmtkb3duPiB0YWdzXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IHNlY3Rpb25TdGFjay5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdC8vIHZlcnRpY2FsXG5cdFx0XHRpZiggc2VjdGlvblN0YWNrW2ldIGluc3RhbmNlb2YgQXJyYXkgKSB7XG5cdFx0XHRcdG1hcmtkb3duU2VjdGlvbnMgKz0gJzxzZWN0aW9uICcrIG9wdGlvbnMuYXR0cmlidXRlcyArJz4nO1xuXG5cdFx0XHRcdHNlY3Rpb25TdGFja1tpXS5mb3JFYWNoKCBmdW5jdGlvbiggY2hpbGQgKSB7XG5cdFx0XHRcdFx0bWFya2Rvd25TZWN0aW9ucyArPSAnPHNlY3Rpb24gZGF0YS1tYXJrZG93bj4nICsgY3JlYXRlTWFya2Rvd25TbGlkZSggY2hpbGQsIG9wdGlvbnMgKSArICc8L3NlY3Rpb24+Jztcblx0XHRcdFx0fSApO1xuXG5cdFx0XHRcdG1hcmtkb3duU2VjdGlvbnMgKz0gJzwvc2VjdGlvbj4nO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdG1hcmtkb3duU2VjdGlvbnMgKz0gJzxzZWN0aW9uICcrIG9wdGlvbnMuYXR0cmlidXRlcyArJyBkYXRhLW1hcmtkb3duPicgKyBjcmVhdGVNYXJrZG93blNsaWRlKCBzZWN0aW9uU3RhY2tbaV0sIG9wdGlvbnMgKSArICc8L3NlY3Rpb24+Jztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbWFya2Rvd25TZWN0aW9ucztcblxuXHR9XG5cblx0LyoqXG5cdCAqIFBhcnNlcyBhbnkgY3VycmVudCBkYXRhLW1hcmtkb3duIHNsaWRlcywgc3BsaXRzXG5cdCAqIG11bHRpLXNsaWRlIG1hcmtkb3duIGludG8gc2VwYXJhdGUgc2VjdGlvbnMgYW5kXG5cdCAqIGhhbmRsZXMgbG9hZGluZyBvZiBleHRlcm5hbCBtYXJrZG93bi5cblx0ICovXG5cdGZ1bmN0aW9uIHByb2Nlc3NTbGlkZXMoKSB7XG5cblx0XHR2YXIgc2VjdGlvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnW2RhdGEtbWFya2Rvd25dJyksXG5cdFx0XHRzZWN0aW9uO1xuXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IHNlY3Rpb25zLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXG5cdFx0XHRzZWN0aW9uID0gc2VjdGlvbnNbaV07XG5cblx0XHRcdGlmKCBzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtbWFya2Rvd24nICkubGVuZ3RoICkge1xuXG5cdFx0XHRcdHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcblx0XHRcdFx0XHR1cmwgPSBzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtbWFya2Rvd24nICk7XG5cblx0XHRcdFx0ZGF0YWNoYXJzZXQgPSBzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtY2hhcnNldCcgKTtcblxuXHRcdFx0XHQvLyBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL2VsZW1lbnQuZ2V0QXR0cmlidXRlI05vdGVzXG5cdFx0XHRcdGlmKCBkYXRhY2hhcnNldCAhPSBudWxsICYmIGRhdGFjaGFyc2V0ICE9ICcnICkge1xuXHRcdFx0XHRcdHhoci5vdmVycmlkZU1pbWVUeXBlKCAndGV4dC9odG1sOyBjaGFyc2V0PScgKyBkYXRhY2hhcnNldCApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmKCB4aHIucmVhZHlTdGF0ZSA9PT0gNCApIHtcblx0XHRcdFx0XHRcdC8vIGZpbGUgcHJvdG9jb2wgeWllbGRzIHN0YXR1cyBjb2RlIDAgKHVzZWZ1bCBmb3IgbG9jYWwgZGVidWcsIG1vYmlsZSBhcHBsaWNhdGlvbnMgZXRjLilcblx0XHRcdFx0XHRcdGlmICggKCB4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwICkgfHwgeGhyLnN0YXR1cyA9PT0gMCApIHtcblxuXHRcdFx0XHRcdFx0XHRzZWN0aW9uLm91dGVySFRNTCA9IHNsaWRpZnkoIHhoci5yZXNwb25zZVRleHQsIHtcblx0XHRcdFx0XHRcdFx0XHRzZXBhcmF0b3I6IHNlY3Rpb24uZ2V0QXR0cmlidXRlKCAnZGF0YS1zZXBhcmF0b3InICksXG5cdFx0XHRcdFx0XHRcdFx0dmVydGljYWxTZXBhcmF0b3I6IHNlY3Rpb24uZ2V0QXR0cmlidXRlKCAnZGF0YS1zZXBhcmF0b3ItdmVydGljYWwnICksXG5cdFx0XHRcdFx0XHRcdFx0bm90ZXNTZXBhcmF0b3I6IHNlY3Rpb24uZ2V0QXR0cmlidXRlKCAnZGF0YS1zZXBhcmF0b3Itbm90ZXMnICksXG5cdFx0XHRcdFx0XHRcdFx0YXR0cmlidXRlczogZ2V0Rm9yd2FyZGVkQXR0cmlidXRlcyggc2VjdGlvbiApXG5cdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblxuXHRcdFx0XHRcdFx0XHRzZWN0aW9uLm91dGVySFRNTCA9ICc8c2VjdGlvbiBkYXRhLXN0YXRlPVwiYWxlcnRcIj4nICtcblx0XHRcdFx0XHRcdFx0XHQnRVJST1I6IFRoZSBhdHRlbXB0IHRvIGZldGNoICcgKyB1cmwgKyAnIGZhaWxlZCB3aXRoIEhUVFAgc3RhdHVzICcgKyB4aHIuc3RhdHVzICsgJy4nICtcblx0XHRcdFx0XHRcdFx0XHQnQ2hlY2sgeW91ciBicm93c2VyXFwncyBKYXZhU2NyaXB0IGNvbnNvbGUgZm9yIG1vcmUgZGV0YWlscy4nICtcblx0XHRcdFx0XHRcdFx0XHQnPHA+UmVtZW1iZXIgdGhhdCB5b3UgbmVlZCB0byBzZXJ2ZSB0aGUgcHJlc2VudGF0aW9uIEhUTUwgZnJvbSBhIEhUVFAgc2VydmVyLjwvcD4nICtcblx0XHRcdFx0XHRcdFx0XHQnPC9zZWN0aW9uPic7XG5cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0eGhyLm9wZW4oICdHRVQnLCB1cmwsIGZhbHNlICk7XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR4aHIuc2VuZCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNhdGNoICggZSApIHtcblx0XHRcdFx0XHRhbGVydCggJ0ZhaWxlZCB0byBnZXQgdGhlIE1hcmtkb3duIGZpbGUgJyArIHVybCArICcuIE1ha2Ugc3VyZSB0aGF0IHRoZSBwcmVzZW50YXRpb24gYW5kIHRoZSBmaWxlIGFyZSBzZXJ2ZWQgYnkgYSBIVFRQIHNlcnZlciBhbmQgdGhlIGZpbGUgY2FuIGJlIGZvdW5kIHRoZXJlLiAnICsgZSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoIHNlY3Rpb24uZ2V0QXR0cmlidXRlKCAnZGF0YS1zZXBhcmF0b3InICkgfHwgc2VjdGlvbi5nZXRBdHRyaWJ1dGUoICdkYXRhLXNlcGFyYXRvci12ZXJ0aWNhbCcgKSB8fCBzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtc2VwYXJhdG9yLW5vdGVzJyApICkge1xuXG5cdFx0XHRcdHNlY3Rpb24ub3V0ZXJIVE1MID0gc2xpZGlmeSggZ2V0TWFya2Rvd25Gcm9tU2xpZGUoIHNlY3Rpb24gKSwge1xuXHRcdFx0XHRcdHNlcGFyYXRvcjogc2VjdGlvbi5nZXRBdHRyaWJ1dGUoICdkYXRhLXNlcGFyYXRvcicgKSxcblx0XHRcdFx0XHR2ZXJ0aWNhbFNlcGFyYXRvcjogc2VjdGlvbi5nZXRBdHRyaWJ1dGUoICdkYXRhLXNlcGFyYXRvci12ZXJ0aWNhbCcgKSxcblx0XHRcdFx0XHRub3Rlc1NlcGFyYXRvcjogc2VjdGlvbi5nZXRBdHRyaWJ1dGUoICdkYXRhLXNlcGFyYXRvci1ub3RlcycgKSxcblx0XHRcdFx0XHRhdHRyaWJ1dGVzOiBnZXRGb3J3YXJkZWRBdHRyaWJ1dGVzKCBzZWN0aW9uIClcblx0XHRcdFx0fSk7XG5cblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRzZWN0aW9uLmlubmVySFRNTCA9IGNyZWF0ZU1hcmtkb3duU2xpZGUoIGdldE1hcmtkb3duRnJvbVNsaWRlKCBzZWN0aW9uICkgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVjayBpZiBhIG5vZGUgdmFsdWUgaGFzIHRoZSBhdHRyaWJ1dGVzIHBhdHRlcm4uXG5cdCAqIElmIHllcywgZXh0cmFjdCBpdCBhbmQgYWRkIHRoYXQgdmFsdWUgYXMgb25lIG9yIHNldmVyYWwgYXR0cmlidXRlc1xuXHQgKiB0aGUgdGhlIHRlcmdldCBlbGVtZW50LlxuXHQgKlxuXHQgKiBZb3UgbmVlZCBDYWNoZSBLaWxsZXIgb24gQ2hyb21lIHRvIHNlZSB0aGUgZWZmZWN0IG9uIGFueSBGT00gdHJhbnNmb3JtYXRpb25cblx0ICogZGlyZWN0bHkgb24gcmVmcmVzaCAoRjUpXG5cdCAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTY5MDI2OS9kaXNhYmxpbmctY2hyb21lLWNhY2hlLWZvci13ZWJzaXRlLWRldmVsb3BtZW50LzcwMDA4OTkjYW5zd2VyLTExNzg2Mjc3XG5cdCAqL1xuXHRmdW5jdGlvbiBhZGRBdHRyaWJ1dGVJbkVsZW1lbnQoIG5vZGUsIGVsZW1lbnRUYXJnZXQsIHNlcGFyYXRvciApIHtcblxuXHRcdHZhciBtYXJkb3duQ2xhc3Nlc0luRWxlbWVudHNSZWdleCA9IG5ldyBSZWdFeHAoIHNlcGFyYXRvciwgJ21nJyApO1xuXHRcdHZhciBtYXJkb3duQ2xhc3NSZWdleCA9IG5ldyBSZWdFeHAoIFwiKFteXFxcIj0gXSs/KT1cXFwiKFteXFxcIj1dKz8pXFxcIlwiLCAnbWcnICk7XG5cdFx0dmFyIG5vZGVWYWx1ZSA9IG5vZGUubm9kZVZhbHVlO1xuXHRcdGlmKCBtYXRjaGVzID0gbWFyZG93bkNsYXNzZXNJbkVsZW1lbnRzUmVnZXguZXhlYyggbm9kZVZhbHVlICkgKSB7XG5cblx0XHRcdHZhciBjbGFzc2VzID0gbWF0Y2hlc1sxXTtcblx0XHRcdG5vZGVWYWx1ZSA9IG5vZGVWYWx1ZS5zdWJzdHJpbmcoIDAsIG1hdGNoZXMuaW5kZXggKSArIG5vZGVWYWx1ZS5zdWJzdHJpbmcoIG1hcmRvd25DbGFzc2VzSW5FbGVtZW50c1JlZ2V4Lmxhc3RJbmRleCApO1xuXHRcdFx0bm9kZS5ub2RlVmFsdWUgPSBub2RlVmFsdWU7XG5cdFx0XHR3aGlsZSggbWF0Y2hlc0NsYXNzID0gbWFyZG93bkNsYXNzUmVnZXguZXhlYyggY2xhc3NlcyApICkge1xuXHRcdFx0XHRlbGVtZW50VGFyZ2V0LnNldEF0dHJpYnV0ZSggbWF0Y2hlc0NsYXNzWzFdLCBtYXRjaGVzQ2xhc3NbMl0gKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0ICogQWRkIGF0dHJpYnV0ZXMgdG8gdGhlIHBhcmVudCBlbGVtZW50IG9mIGEgdGV4dCBub2RlLFxuXHQgKiBvciB0aGUgZWxlbWVudCBvZiBhbiBhdHRyaWJ1dGUgbm9kZS5cblx0ICovXG5cdGZ1bmN0aW9uIGFkZEF0dHJpYnV0ZXMoIHNlY3Rpb24sIGVsZW1lbnQsIHByZXZpb3VzRWxlbWVudCwgc2VwYXJhdG9yRWxlbWVudEF0dHJpYnV0ZXMsIHNlcGFyYXRvclNlY3Rpb25BdHRyaWJ1dGVzICkge1xuXG5cdFx0aWYgKCBlbGVtZW50ICE9IG51bGwgJiYgZWxlbWVudC5jaGlsZE5vZGVzICE9IHVuZGVmaW5lZCAmJiBlbGVtZW50LmNoaWxkTm9kZXMubGVuZ3RoID4gMCApIHtcblx0XHRcdHByZXZpb3VzUGFyZW50RWxlbWVudCA9IGVsZW1lbnQ7XG5cdFx0XHRmb3IoIHZhciBpID0gMDsgaSA8IGVsZW1lbnQuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKyApIHtcblx0XHRcdFx0Y2hpbGRFbGVtZW50ID0gZWxlbWVudC5jaGlsZE5vZGVzW2ldO1xuXHRcdFx0XHRpZiAoIGkgPiAwICkge1xuXHRcdFx0XHRcdGogPSBpIC0gMTtcblx0XHRcdFx0XHR3aGlsZSAoIGogPj0gMCApIHtcblx0XHRcdFx0XHRcdGFQcmV2aW91c0NoaWxkRWxlbWVudCA9IGVsZW1lbnQuY2hpbGROb2Rlc1tqXTtcblx0XHRcdFx0XHRcdGlmICggdHlwZW9mIGFQcmV2aW91c0NoaWxkRWxlbWVudC5zZXRBdHRyaWJ1dGUgPT0gJ2Z1bmN0aW9uJyAmJiBhUHJldmlvdXNDaGlsZEVsZW1lbnQudGFnTmFtZSAhPSBcIkJSXCIgKSB7XG5cdFx0XHRcdFx0XHRcdHByZXZpb3VzUGFyZW50RWxlbWVudCA9IGFQcmV2aW91c0NoaWxkRWxlbWVudDtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRqID0gaiAtIDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHBhcmVudFNlY3Rpb24gPSBzZWN0aW9uO1xuXHRcdFx0XHRpZiggY2hpbGRFbGVtZW50Lm5vZGVOYW1lID09ICBcInNlY3Rpb25cIiApIHtcblx0XHRcdFx0XHRwYXJlbnRTZWN0aW9uID0gY2hpbGRFbGVtZW50IDtcblx0XHRcdFx0XHRwcmV2aW91c1BhcmVudEVsZW1lbnQgPSBjaGlsZEVsZW1lbnQgO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggdHlwZW9mIGNoaWxkRWxlbWVudC5zZXRBdHRyaWJ1dGUgPT0gJ2Z1bmN0aW9uJyB8fCBjaGlsZEVsZW1lbnQubm9kZVR5cGUgPT0gTm9kZS5DT01NRU5UX05PREUgKSB7XG5cdFx0XHRcdFx0YWRkQXR0cmlidXRlcyggcGFyZW50U2VjdGlvbiwgY2hpbGRFbGVtZW50LCBwcmV2aW91c1BhcmVudEVsZW1lbnQsIHNlcGFyYXRvckVsZW1lbnRBdHRyaWJ1dGVzLCBzZXBhcmF0b3JTZWN0aW9uQXR0cmlidXRlcyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCBlbGVtZW50Lm5vZGVUeXBlID09IE5vZGUuQ09NTUVOVF9OT0RFICkge1xuXHRcdFx0aWYgKCBhZGRBdHRyaWJ1dGVJbkVsZW1lbnQoIGVsZW1lbnQsIHByZXZpb3VzRWxlbWVudCwgc2VwYXJhdG9yRWxlbWVudEF0dHJpYnV0ZXMgKSA9PSBmYWxzZSApIHtcblx0XHRcdFx0YWRkQXR0cmlidXRlSW5FbGVtZW50KCBlbGVtZW50LCBzZWN0aW9uLCBzZXBhcmF0b3JTZWN0aW9uQXR0cmlidXRlcyApO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhbnkgY3VycmVudCBkYXRhLW1hcmtkb3duIHNsaWRlcyBpbiB0aGVcblx0ICogRE9NIHRvIEhUTUwuXG5cdCAqL1xuXHRmdW5jdGlvbiBjb252ZXJ0U2xpZGVzKCkge1xuXG5cdFx0dmFyIHNlY3Rpb25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJ1tkYXRhLW1hcmtkb3duXScpO1xuXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IHNlY3Rpb25zLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXG5cdFx0XHR2YXIgc2VjdGlvbiA9IHNlY3Rpb25zW2ldO1xuXG5cdFx0XHQvLyBPbmx5IHBhcnNlIHRoZSBzYW1lIHNsaWRlIG9uY2Vcblx0XHRcdGlmKCAhc2VjdGlvbi5nZXRBdHRyaWJ1dGUoICdkYXRhLW1hcmtkb3duLXBhcnNlZCcgKSApIHtcblxuXHRcdFx0XHRzZWN0aW9uLnNldEF0dHJpYnV0ZSggJ2RhdGEtbWFya2Rvd24tcGFyc2VkJywgdHJ1ZSApXG5cblx0XHRcdFx0dmFyIG5vdGVzID0gc2VjdGlvbi5xdWVyeVNlbGVjdG9yKCAnYXNpZGUubm90ZXMnICk7XG5cdFx0XHRcdHZhciBtYXJrZG93biA9IGdldE1hcmtkb3duRnJvbVNsaWRlKCBzZWN0aW9uICk7XG5cblx0XHRcdFx0c2VjdGlvbi5pbm5lckhUTUwgPSBtYXJrZWQoIG1hcmtkb3duICk7XG5cdFx0XHRcdGFkZEF0dHJpYnV0ZXMoIFx0c2VjdGlvbiwgc2VjdGlvbiwgbnVsbCwgc2VjdGlvbi5nZXRBdHRyaWJ1dGUoICdkYXRhLWVsZW1lbnQtYXR0cmlidXRlcycgKSB8fFxuXHRcdFx0XHRcdFx0XHRcdHNlY3Rpb24ucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWVsZW1lbnQtYXR0cmlidXRlcycgKSB8fFxuXHRcdFx0XHRcdFx0XHRcdERFRkFVTFRfRUxFTUVOVF9BVFRSSUJVVEVTX1NFUEFSQVRPUixcblx0XHRcdFx0XHRcdFx0XHRzZWN0aW9uLmdldEF0dHJpYnV0ZSggJ2RhdGEtYXR0cmlidXRlcycgKSB8fFxuXHRcdFx0XHRcdFx0XHRcdHNlY3Rpb24ucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWF0dHJpYnV0ZXMnICkgfHxcblx0XHRcdFx0XHRcdFx0XHRERUZBVUxUX1NMSURFX0FUVFJJQlVURVNfU0VQQVJBVE9SKTtcblxuXHRcdFx0XHQvLyBJZiB0aGVyZSB3ZXJlIG5vdGVzLCB3ZSBuZWVkIHRvIHJlLWFkZCB0aGVtIGFmdGVyXG5cdFx0XHRcdC8vIGhhdmluZyBvdmVyd3JpdHRlbiB0aGUgc2VjdGlvbidzIEhUTUxcblx0XHRcdFx0aWYoIG5vdGVzICkge1xuXHRcdFx0XHRcdHNlY3Rpb24uYXBwZW5kQ2hpbGQoIG5vdGVzICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdH1cblxuXHQvLyBBUElcblx0cmV0dXJuIHtcblxuXHRcdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYoIHR5cGVvZiBtYXJrZWQgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHR0aHJvdyAnVGhlIHJldmVhbC5qcyBNYXJrZG93biBwbHVnaW4gcmVxdWlyZXMgbWFya2VkIHRvIGJlIGxvYWRlZCc7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCB0eXBlb2YgaGxqcyAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdG1hcmtlZC5zZXRPcHRpb25zKHtcblx0XHRcdFx0XHRoaWdobGlnaHQ6IGZ1bmN0aW9uKCBjb2RlLCBsYW5nICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGhsanMuaGlnaGxpZ2h0QXV0byggY29kZSwgW2xhbmddICkudmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIG9wdGlvbnMgPSBSZXZlYWwuZ2V0Q29uZmlnKCkubWFya2Rvd247XG5cblx0XHRcdGlmICggb3B0aW9ucyApIHtcblx0XHRcdFx0bWFya2VkLnNldE9wdGlvbnMoIG9wdGlvbnMgKTtcblx0XHRcdH1cblxuXHRcdFx0cHJvY2Vzc1NsaWRlcygpO1xuXHRcdFx0Y29udmVydFNsaWRlcygpO1xuXHRcdH0sXG5cblx0XHQvLyBUT0RPOiBEbyB0aGVzZSBiZWxvbmcgaW4gdGhlIEFQST9cblx0XHRwcm9jZXNzU2xpZGVzOiBwcm9jZXNzU2xpZGVzLFxuXHRcdGNvbnZlcnRTbGlkZXM6IGNvbnZlcnRTbGlkZXMsXG5cdFx0c2xpZGlmeTogc2xpZGlmeVxuXG5cdH07XG5cbn0pKTtcbiIsIi8qKlxuICogbWFya2VkIC0gYSBtYXJrZG93biBwYXJzZXJcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDE0LCBDaHJpc3RvcGhlciBKZWZmcmV5LiAoTUlUIExpY2Vuc2VkKVxuICogaHR0cHM6Ly9naXRodWIuY29tL2NoamovbWFya2VkXG4gKi9cbihmdW5jdGlvbigpe3ZhciBibG9jaz17bmV3bGluZTovXlxcbisvLGNvZGU6L14oIHs0fVteXFxuXStcXG4qKSsvLGZlbmNlczpub29wLGhyOi9eKCAqWy0qX10pezMsfSAqKD86XFxuK3wkKS8saGVhZGluZzovXiAqKCN7MSw2fSkgKihbXlxcbl0rPykgKiMqICooPzpcXG4rfCQpLyxucHRhYmxlOm5vb3AsbGhlYWRpbmc6L14oW15cXG5dKylcXG4gKig9fC0pezIsfSAqKD86XFxuK3wkKS8sYmxvY2txdW90ZTovXiggKj5bXlxcbl0rKFxcbig/IWRlZilbXlxcbl0rKSpcXG4qKSsvLGxpc3Q6L14oICopKGJ1bGwpIFtcXHNcXFNdKz8oPzpocnxkZWZ8XFxuezIsfSg/ISApKD8hXFwxYnVsbCApXFxuKnxcXHMqJCkvLGh0bWw6L14gKig/OmNvbW1lbnQgKig/OlxcbnxcXHMqJCl8Y2xvc2VkICooPzpcXG57Mix9fFxccyokKXxjbG9zaW5nICooPzpcXG57Mix9fFxccyokKSkvLGRlZjovXiAqXFxbKFteXFxdXSspXFxdOiAqPD8oW15cXHM+XSspPj8oPzogK1tcIihdKFteXFxuXSspW1wiKV0pPyAqKD86XFxuK3wkKS8sdGFibGU6bm9vcCxwYXJhZ3JhcGg6L14oKD86W15cXG5dK1xcbj8oPyFocnxoZWFkaW5nfGxoZWFkaW5nfGJsb2NrcXVvdGV8dGFnfGRlZikpKylcXG4qLyx0ZXh0Oi9eW15cXG5dKy99O2Jsb2NrLmJ1bGxldD0vKD86WyorLV18XFxkK1xcLikvO2Jsb2NrLml0ZW09L14oICopKGJ1bGwpIFteXFxuXSooPzpcXG4oPyFcXDFidWxsIClbXlxcbl0qKSovO2Jsb2NrLml0ZW09cmVwbGFjZShibG9jay5pdGVtLFwiZ21cIikoL2J1bGwvZyxibG9jay5idWxsZXQpKCk7YmxvY2subGlzdD1yZXBsYWNlKGJsb2NrLmxpc3QpKC9idWxsL2csYmxvY2suYnVsbGV0KShcImhyXCIsXCJcXFxcbisoPz1cXFxcMT8oPzpbLSpfXSAqKXszLH0oPzpcXFxcbit8JCkpXCIpKFwiZGVmXCIsXCJcXFxcbisoPz1cIitibG9jay5kZWYuc291cmNlK1wiKVwiKSgpO2Jsb2NrLmJsb2NrcXVvdGU9cmVwbGFjZShibG9jay5ibG9ja3F1b3RlKShcImRlZlwiLGJsb2NrLmRlZikoKTtibG9jay5fdGFnPVwiKD8hKD86XCIrXCJhfGVtfHN0cm9uZ3xzbWFsbHxzfGNpdGV8cXxkZm58YWJicnxkYXRhfHRpbWV8Y29kZVwiK1wifHZhcnxzYW1wfGtiZHxzdWJ8c3VwfGl8Ynx1fG1hcmt8cnVieXxydHxycHxiZGl8YmRvXCIrXCJ8c3Bhbnxicnx3YnJ8aW5zfGRlbHxpbWcpXFxcXGIpXFxcXHcrKD8hOi98W15cXFxcd1xcXFxzQF0qQClcXFxcYlwiO2Jsb2NrLmh0bWw9cmVwbGFjZShibG9jay5odG1sKShcImNvbW1lbnRcIiwvPCEtLVtcXHNcXFNdKj8tLT4vKShcImNsb3NlZFwiLC88KHRhZylbXFxzXFxTXSs/PFxcL1xcMT4vKShcImNsb3NpbmdcIiwvPHRhZyg/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXidcIj5dKSo/Pi8pKC90YWcvZyxibG9jay5fdGFnKSgpO2Jsb2NrLnBhcmFncmFwaD1yZXBsYWNlKGJsb2NrLnBhcmFncmFwaCkoXCJoclwiLGJsb2NrLmhyKShcImhlYWRpbmdcIixibG9jay5oZWFkaW5nKShcImxoZWFkaW5nXCIsYmxvY2subGhlYWRpbmcpKFwiYmxvY2txdW90ZVwiLGJsb2NrLmJsb2NrcXVvdGUpKFwidGFnXCIsXCI8XCIrYmxvY2suX3RhZykoXCJkZWZcIixibG9jay5kZWYpKCk7YmxvY2subm9ybWFsPW1lcmdlKHt9LGJsb2NrKTtibG9jay5nZm09bWVyZ2Uoe30sYmxvY2subm9ybWFsLHtmZW5jZXM6L14gKihgezMsfXx+ezMsfSlbIFxcLl0qKFxcUyspPyAqXFxuKFtcXHNcXFNdKj8pXFxzKlxcMSAqKD86XFxuK3wkKS8scGFyYWdyYXBoOi9eLyxoZWFkaW5nOi9eICooI3sxLDZ9KSArKFteXFxuXSs/KSAqIyogKig/Olxcbit8JCkvfSk7YmxvY2suZ2ZtLnBhcmFncmFwaD1yZXBsYWNlKGJsb2NrLnBhcmFncmFwaCkoXCIoPyFcIixcIig/IVwiK2Jsb2NrLmdmbS5mZW5jZXMuc291cmNlLnJlcGxhY2UoXCJcXFxcMVwiLFwiXFxcXDJcIikrXCJ8XCIrYmxvY2subGlzdC5zb3VyY2UucmVwbGFjZShcIlxcXFwxXCIsXCJcXFxcM1wiKStcInxcIikoKTtibG9jay50YWJsZXM9bWVyZ2Uoe30sYmxvY2suZ2ZtLHtucHRhYmxlOi9eICooXFxTLipcXHwuKilcXG4gKihbLTpdKyAqXFx8Wy18IDpdKilcXG4oKD86LipcXHwuKig/OlxcbnwkKSkqKVxcbiovLHRhYmxlOi9eICpcXHwoLispXFxuICpcXHwoICpbLTpdK1stfCA6XSopXFxuKCg/OiAqXFx8LiooPzpcXG58JCkpKilcXG4qL30pO2Z1bmN0aW9uIExleGVyKG9wdGlvbnMpe3RoaXMudG9rZW5zPVtdO3RoaXMudG9rZW5zLmxpbmtzPXt9O3RoaXMub3B0aW9ucz1vcHRpb25zfHxtYXJrZWQuZGVmYXVsdHM7dGhpcy5ydWxlcz1ibG9jay5ub3JtYWw7aWYodGhpcy5vcHRpb25zLmdmbSl7aWYodGhpcy5vcHRpb25zLnRhYmxlcyl7dGhpcy5ydWxlcz1ibG9jay50YWJsZXN9ZWxzZXt0aGlzLnJ1bGVzPWJsb2NrLmdmbX19fUxleGVyLnJ1bGVzPWJsb2NrO0xleGVyLmxleD1mdW5jdGlvbihzcmMsb3B0aW9ucyl7dmFyIGxleGVyPW5ldyBMZXhlcihvcHRpb25zKTtyZXR1cm4gbGV4ZXIubGV4KHNyYyl9O0xleGVyLnByb3RvdHlwZS5sZXg9ZnVuY3Rpb24oc3JjKXtzcmM9c3JjLnJlcGxhY2UoL1xcclxcbnxcXHIvZyxcIlxcblwiKS5yZXBsYWNlKC9cXHQvZyxcIiAgICBcIikucmVwbGFjZSgvXFx1MDBhMC9nLFwiIFwiKS5yZXBsYWNlKC9cXHUyNDI0L2csXCJcXG5cIik7cmV0dXJuIHRoaXMudG9rZW4oc3JjLHRydWUpfTtMZXhlci5wcm90b3R5cGUudG9rZW49ZnVuY3Rpb24oc3JjLHRvcCxicSl7dmFyIHNyYz1zcmMucmVwbGFjZSgvXiArJC9nbSxcIlwiKSxuZXh0LGxvb3NlLGNhcCxidWxsLGIsaXRlbSxzcGFjZSxpLGw7d2hpbGUoc3JjKXtpZihjYXA9dGhpcy5ydWxlcy5uZXdsaW5lLmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7aWYoY2FwWzBdLmxlbmd0aD4xKXt0aGlzLnRva2Vucy5wdXNoKHt0eXBlOlwic3BhY2VcIn0pfX1pZihjYXA9dGhpcy5ydWxlcy5jb2RlLmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7Y2FwPWNhcFswXS5yZXBsYWNlKC9eIHs0fS9nbSxcIlwiKTt0aGlzLnRva2Vucy5wdXNoKHt0eXBlOlwiY29kZVwiLHRleHQ6IXRoaXMub3B0aW9ucy5wZWRhbnRpYz9jYXAucmVwbGFjZSgvXFxuKyQvLFwiXCIpOmNhcH0pO2NvbnRpbnVlfWlmKGNhcD10aGlzLnJ1bGVzLmZlbmNlcy5leGVjKHNyYykpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO3RoaXMudG9rZW5zLnB1c2goe3R5cGU6XCJjb2RlXCIsbGFuZzpjYXBbMl0sdGV4dDpjYXBbM118fFwiXCJ9KTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy5oZWFkaW5nLmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7dGhpcy50b2tlbnMucHVzaCh7dHlwZTpcImhlYWRpbmdcIixkZXB0aDpjYXBbMV0ubGVuZ3RoLHRleHQ6Y2FwWzJdfSk7Y29udGludWV9aWYodG9wJiYoY2FwPXRoaXMucnVsZXMubnB0YWJsZS5leGVjKHNyYykpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtpdGVtPXt0eXBlOlwidGFibGVcIixoZWFkZXI6Y2FwWzFdLnJlcGxhY2UoL14gKnwgKlxcfCAqJC9nLFwiXCIpLnNwbGl0KC8gKlxcfCAqLyksYWxpZ246Y2FwWzJdLnJlcGxhY2UoL14gKnxcXHwgKiQvZyxcIlwiKS5zcGxpdCgvICpcXHwgKi8pLGNlbGxzOmNhcFszXS5yZXBsYWNlKC9cXG4kLyxcIlwiKS5zcGxpdChcIlxcblwiKX07Zm9yKGk9MDtpPGl0ZW0uYWxpZ24ubGVuZ3RoO2krKyl7aWYoL14gKi0rOiAqJC8udGVzdChpdGVtLmFsaWduW2ldKSl7aXRlbS5hbGlnbltpXT1cInJpZ2h0XCJ9ZWxzZSBpZigvXiAqOi0rOiAqJC8udGVzdChpdGVtLmFsaWduW2ldKSl7aXRlbS5hbGlnbltpXT1cImNlbnRlclwifWVsc2UgaWYoL14gKjotKyAqJC8udGVzdChpdGVtLmFsaWduW2ldKSl7aXRlbS5hbGlnbltpXT1cImxlZnRcIn1lbHNle2l0ZW0uYWxpZ25baV09bnVsbH19Zm9yKGk9MDtpPGl0ZW0uY2VsbHMubGVuZ3RoO2krKyl7aXRlbS5jZWxsc1tpXT1pdGVtLmNlbGxzW2ldLnNwbGl0KC8gKlxcfCAqLyl9dGhpcy50b2tlbnMucHVzaChpdGVtKTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy5saGVhZGluZy5leGVjKHNyYykpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO3RoaXMudG9rZW5zLnB1c2goe3R5cGU6XCJoZWFkaW5nXCIsZGVwdGg6Y2FwWzJdPT09XCI9XCI/MToyLHRleHQ6Y2FwWzFdfSk7Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMuaHIuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTt0aGlzLnRva2Vucy5wdXNoKHt0eXBlOlwiaHJcIn0pO2NvbnRpbnVlfWlmKGNhcD10aGlzLnJ1bGVzLmJsb2NrcXVvdGUuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTt0aGlzLnRva2Vucy5wdXNoKHt0eXBlOlwiYmxvY2txdW90ZV9zdGFydFwifSk7Y2FwPWNhcFswXS5yZXBsYWNlKC9eICo+ID8vZ20sXCJcIik7dGhpcy50b2tlbihjYXAsdG9wLHRydWUpO3RoaXMudG9rZW5zLnB1c2goe3R5cGU6XCJibG9ja3F1b3RlX2VuZFwifSk7Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMubGlzdC5leGVjKHNyYykpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO2J1bGw9Y2FwWzJdO3RoaXMudG9rZW5zLnB1c2goe3R5cGU6XCJsaXN0X3N0YXJ0XCIsb3JkZXJlZDpidWxsLmxlbmd0aD4xfSk7Y2FwPWNhcFswXS5tYXRjaCh0aGlzLnJ1bGVzLml0ZW0pO25leHQ9ZmFsc2U7bD1jYXAubGVuZ3RoO2k9MDtmb3IoO2k8bDtpKyspe2l0ZW09Y2FwW2ldO3NwYWNlPWl0ZW0ubGVuZ3RoO2l0ZW09aXRlbS5yZXBsYWNlKC9eICooWyorLV18XFxkK1xcLikgKy8sXCJcIik7aWYofml0ZW0uaW5kZXhPZihcIlxcbiBcIikpe3NwYWNlLT1pdGVtLmxlbmd0aDtpdGVtPSF0aGlzLm9wdGlvbnMucGVkYW50aWM/aXRlbS5yZXBsYWNlKG5ldyBSZWdFeHAoXCJeIHsxLFwiK3NwYWNlK1wifVwiLFwiZ21cIiksXCJcIik6aXRlbS5yZXBsYWNlKC9eIHsxLDR9L2dtLFwiXCIpfWlmKHRoaXMub3B0aW9ucy5zbWFydExpc3RzJiZpIT09bC0xKXtiPWJsb2NrLmJ1bGxldC5leGVjKGNhcFtpKzFdKVswXTtpZihidWxsIT09YiYmIShidWxsLmxlbmd0aD4xJiZiLmxlbmd0aD4xKSl7c3JjPWNhcC5zbGljZShpKzEpLmpvaW4oXCJcXG5cIikrc3JjO2k9bC0xfX1sb29zZT1uZXh0fHwvXFxuXFxuKD8hXFxzKiQpLy50ZXN0KGl0ZW0pO2lmKGkhPT1sLTEpe25leHQ9aXRlbS5jaGFyQXQoaXRlbS5sZW5ndGgtMSk9PT1cIlxcblwiO2lmKCFsb29zZSlsb29zZT1uZXh0fXRoaXMudG9rZW5zLnB1c2goe3R5cGU6bG9vc2U/XCJsb29zZV9pdGVtX3N0YXJ0XCI6XCJsaXN0X2l0ZW1fc3RhcnRcIn0pO3RoaXMudG9rZW4oaXRlbSxmYWxzZSxicSk7dGhpcy50b2tlbnMucHVzaCh7dHlwZTpcImxpc3RfaXRlbV9lbmRcIn0pfXRoaXMudG9rZW5zLnB1c2goe3R5cGU6XCJsaXN0X2VuZFwifSk7Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMuaHRtbC5leGVjKHNyYykpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO3RoaXMudG9rZW5zLnB1c2goe3R5cGU6dGhpcy5vcHRpb25zLnNhbml0aXplP1wicGFyYWdyYXBoXCI6XCJodG1sXCIscHJlOiF0aGlzLm9wdGlvbnMuc2FuaXRpemVyJiYoY2FwWzFdPT09XCJwcmVcInx8Y2FwWzFdPT09XCJzY3JpcHRcInx8Y2FwWzFdPT09XCJzdHlsZVwiKSx0ZXh0OmNhcFswXX0pO2NvbnRpbnVlfWlmKCFicSYmdG9wJiYoY2FwPXRoaXMucnVsZXMuZGVmLmV4ZWMoc3JjKSkpe3NyYz1zcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO3RoaXMudG9rZW5zLmxpbmtzW2NhcFsxXS50b0xvd2VyQ2FzZSgpXT17aHJlZjpjYXBbMl0sdGl0bGU6Y2FwWzNdfTtjb250aW51ZX1pZih0b3AmJihjYXA9dGhpcy5ydWxlcy50YWJsZS5leGVjKHNyYykpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtpdGVtPXt0eXBlOlwidGFibGVcIixoZWFkZXI6Y2FwWzFdLnJlcGxhY2UoL14gKnwgKlxcfCAqJC9nLFwiXCIpLnNwbGl0KC8gKlxcfCAqLyksYWxpZ246Y2FwWzJdLnJlcGxhY2UoL14gKnxcXHwgKiQvZyxcIlwiKS5zcGxpdCgvICpcXHwgKi8pLGNlbGxzOmNhcFszXS5yZXBsYWNlKC8oPzogKlxcfCAqKT9cXG4kLyxcIlwiKS5zcGxpdChcIlxcblwiKX07Zm9yKGk9MDtpPGl0ZW0uYWxpZ24ubGVuZ3RoO2krKyl7aWYoL14gKi0rOiAqJC8udGVzdChpdGVtLmFsaWduW2ldKSl7aXRlbS5hbGlnbltpXT1cInJpZ2h0XCJ9ZWxzZSBpZigvXiAqOi0rOiAqJC8udGVzdChpdGVtLmFsaWduW2ldKSl7aXRlbS5hbGlnbltpXT1cImNlbnRlclwifWVsc2UgaWYoL14gKjotKyAqJC8udGVzdChpdGVtLmFsaWduW2ldKSl7aXRlbS5hbGlnbltpXT1cImxlZnRcIn1lbHNle2l0ZW0uYWxpZ25baV09bnVsbH19Zm9yKGk9MDtpPGl0ZW0uY2VsbHMubGVuZ3RoO2krKyl7aXRlbS5jZWxsc1tpXT1pdGVtLmNlbGxzW2ldLnJlcGxhY2UoL14gKlxcfCAqfCAqXFx8ICokL2csXCJcIikuc3BsaXQoLyAqXFx8ICovKX10aGlzLnRva2Vucy5wdXNoKGl0ZW0pO2NvbnRpbnVlfWlmKHRvcCYmKGNhcD10aGlzLnJ1bGVzLnBhcmFncmFwaC5leGVjKHNyYykpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTt0aGlzLnRva2Vucy5wdXNoKHt0eXBlOlwicGFyYWdyYXBoXCIsdGV4dDpjYXBbMV0uY2hhckF0KGNhcFsxXS5sZW5ndGgtMSk9PT1cIlxcblwiP2NhcFsxXS5zbGljZSgwLC0xKTpjYXBbMV19KTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy50ZXh0LmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7dGhpcy50b2tlbnMucHVzaCh7dHlwZTpcInRleHRcIix0ZXh0OmNhcFswXX0pO2NvbnRpbnVlfWlmKHNyYyl7dGhyb3cgbmV3IEVycm9yKFwiSW5maW5pdGUgbG9vcCBvbiBieXRlOiBcIitzcmMuY2hhckNvZGVBdCgwKSl9fXJldHVybiB0aGlzLnRva2Vuc307dmFyIGlubGluZT17ZXNjYXBlOi9eXFxcXChbXFxcXGAqe31cXFtcXF0oKSMrXFwtLiFfPl0pLyxhdXRvbGluazovXjwoW14gPl0rKEB8OlxcLylbXiA+XSspPi8sdXJsOm5vb3AsdGFnOi9ePCEtLVtcXHNcXFNdKj8tLT58XjxcXC8/XFx3Kyg/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXidcIj5dKSo/Pi8sbGluazovXiE/XFxbKGluc2lkZSlcXF1cXChocmVmXFwpLyxyZWZsaW5rOi9eIT9cXFsoaW5zaWRlKVxcXVxccypcXFsoW15cXF1dKilcXF0vLG5vbGluazovXiE/XFxbKCg/OlxcW1teXFxdXSpcXF18W15cXFtcXF1dKSopXFxdLyxzdHJvbmc6L15fXyhbXFxzXFxTXSs/KV9fKD8hXyl8XlxcKlxcKihbXFxzXFxTXSs/KVxcKlxcKig/IVxcKikvLGVtOi9eXFxiXygoPzpbXl9dfF9fKSs/KV9cXGJ8XlxcKigoPzpcXCpcXCp8W1xcc1xcU10pKz8pXFwqKD8hXFwqKS8sY29kZTovXihgKylcXHMqKFtcXHNcXFNdKj9bXmBdKVxccypcXDEoPyFgKS8sYnI6L14gezIsfVxcbig/IVxccyokKS8sZGVsOm5vb3AsdGV4dDovXltcXHNcXFNdKz8oPz1bXFxcXDwhXFxbXypgXXwgezIsfVxcbnwkKS99O2lubGluZS5faW5zaWRlPS8oPzpcXFtbXlxcXV0qXFxdfFteXFxbXFxdXXxcXF0oPz1bXlxcW10qXFxdKSkqLztpbmxpbmUuX2hyZWY9L1xccyo8PyhbXFxzXFxTXSo/KT4/KD86XFxzK1snXCJdKFtcXHNcXFNdKj8pWydcIl0pP1xccyovO2lubGluZS5saW5rPXJlcGxhY2UoaW5saW5lLmxpbmspKFwiaW5zaWRlXCIsaW5saW5lLl9pbnNpZGUpKFwiaHJlZlwiLGlubGluZS5faHJlZikoKTtpbmxpbmUucmVmbGluaz1yZXBsYWNlKGlubGluZS5yZWZsaW5rKShcImluc2lkZVwiLGlubGluZS5faW5zaWRlKSgpO2lubGluZS5ub3JtYWw9bWVyZ2Uoe30saW5saW5lKTtpbmxpbmUucGVkYW50aWM9bWVyZ2Uoe30saW5saW5lLm5vcm1hbCx7c3Ryb25nOi9eX18oPz1cXFMpKFtcXHNcXFNdKj9cXFMpX18oPyFfKXxeXFwqXFwqKD89XFxTKShbXFxzXFxTXSo/XFxTKVxcKlxcKig/IVxcKikvLGVtOi9eXyg/PVxcUykoW1xcc1xcU10qP1xcUylfKD8hXyl8XlxcKig/PVxcUykoW1xcc1xcU10qP1xcUylcXCooPyFcXCopL30pO2lubGluZS5nZm09bWVyZ2Uoe30saW5saW5lLm5vcm1hbCx7ZXNjYXBlOnJlcGxhY2UoaW5saW5lLmVzY2FwZSkoXCJdKVwiLFwifnxdKVwiKSgpLHVybDovXihodHRwcz86XFwvXFwvW15cXHM8XStbXjwuLDo7XCInKVxcXVxcc10pLyxkZWw6L15+fig/PVxcUykoW1xcc1xcU10qP1xcUyl+fi8sdGV4dDpyZXBsYWNlKGlubGluZS50ZXh0KShcIl18XCIsXCJ+XXxcIikoXCJ8XCIsXCJ8aHR0cHM/Oi8vfFwiKSgpfSk7aW5saW5lLmJyZWFrcz1tZXJnZSh7fSxpbmxpbmUuZ2ZtLHticjpyZXBsYWNlKGlubGluZS5icikoXCJ7Mix9XCIsXCIqXCIpKCksdGV4dDpyZXBsYWNlKGlubGluZS5nZm0udGV4dCkoXCJ7Mix9XCIsXCIqXCIpKCl9KTtmdW5jdGlvbiBJbmxpbmVMZXhlcihsaW5rcyxvcHRpb25zKXt0aGlzLm9wdGlvbnM9b3B0aW9uc3x8bWFya2VkLmRlZmF1bHRzO3RoaXMubGlua3M9bGlua3M7dGhpcy5ydWxlcz1pbmxpbmUubm9ybWFsO3RoaXMucmVuZGVyZXI9dGhpcy5vcHRpb25zLnJlbmRlcmVyfHxuZXcgUmVuZGVyZXI7dGhpcy5yZW5kZXJlci5vcHRpb25zPXRoaXMub3B0aW9ucztpZighdGhpcy5saW5rcyl7dGhyb3cgbmV3IEVycm9yKFwiVG9rZW5zIGFycmF5IHJlcXVpcmVzIGEgYGxpbmtzYCBwcm9wZXJ0eS5cIil9aWYodGhpcy5vcHRpb25zLmdmbSl7aWYodGhpcy5vcHRpb25zLmJyZWFrcyl7dGhpcy5ydWxlcz1pbmxpbmUuYnJlYWtzfWVsc2V7dGhpcy5ydWxlcz1pbmxpbmUuZ2ZtfX1lbHNlIGlmKHRoaXMub3B0aW9ucy5wZWRhbnRpYyl7dGhpcy5ydWxlcz1pbmxpbmUucGVkYW50aWN9fUlubGluZUxleGVyLnJ1bGVzPWlubGluZTtJbmxpbmVMZXhlci5vdXRwdXQ9ZnVuY3Rpb24oc3JjLGxpbmtzLG9wdGlvbnMpe3ZhciBpbmxpbmU9bmV3IElubGluZUxleGVyKGxpbmtzLG9wdGlvbnMpO3JldHVybiBpbmxpbmUub3V0cHV0KHNyYyl9O0lubGluZUxleGVyLnByb3RvdHlwZS5vdXRwdXQ9ZnVuY3Rpb24oc3JjKXt2YXIgb3V0PVwiXCIsbGluayx0ZXh0LGhyZWYsY2FwO3doaWxlKHNyYyl7aWYoY2FwPXRoaXMucnVsZXMuZXNjYXBlLmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7b3V0Kz1jYXBbMV07Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMuYXV0b2xpbmsuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtpZihjYXBbMl09PT1cIkBcIil7dGV4dD1jYXBbMV0uY2hhckF0KDYpPT09XCI6XCI/dGhpcy5tYW5nbGUoY2FwWzFdLnN1YnN0cmluZyg3KSk6dGhpcy5tYW5nbGUoY2FwWzFdKTtocmVmPXRoaXMubWFuZ2xlKFwibWFpbHRvOlwiKSt0ZXh0fWVsc2V7dGV4dD1lc2NhcGUoY2FwWzFdKTtocmVmPXRleHR9b3V0Kz10aGlzLnJlbmRlcmVyLmxpbmsoaHJlZixudWxsLHRleHQpO2NvbnRpbnVlfWlmKCF0aGlzLmluTGluayYmKGNhcD10aGlzLnJ1bGVzLnVybC5leGVjKHNyYykpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTt0ZXh0PWVzY2FwZShjYXBbMV0pO2hyZWY9dGV4dDtvdXQrPXRoaXMucmVuZGVyZXIubGluayhocmVmLG51bGwsdGV4dCk7Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMudGFnLmV4ZWMoc3JjKSl7aWYoIXRoaXMuaW5MaW5rJiYvXjxhIC9pLnRlc3QoY2FwWzBdKSl7dGhpcy5pbkxpbms9dHJ1ZX1lbHNlIGlmKHRoaXMuaW5MaW5rJiYvXjxcXC9hPi9pLnRlc3QoY2FwWzBdKSl7dGhpcy5pbkxpbms9ZmFsc2V9c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7b3V0Kz10aGlzLm9wdGlvbnMuc2FuaXRpemU/dGhpcy5vcHRpb25zLnNhbml0aXplcj90aGlzLm9wdGlvbnMuc2FuaXRpemVyKGNhcFswXSk6ZXNjYXBlKGNhcFswXSk6Y2FwWzBdO2NvbnRpbnVlfWlmKGNhcD10aGlzLnJ1bGVzLmxpbmsuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTt0aGlzLmluTGluaz10cnVlO291dCs9dGhpcy5vdXRwdXRMaW5rKGNhcCx7aHJlZjpjYXBbMl0sdGl0bGU6Y2FwWzNdfSk7dGhpcy5pbkxpbms9ZmFsc2U7Y29udGludWV9aWYoKGNhcD10aGlzLnJ1bGVzLnJlZmxpbmsuZXhlYyhzcmMpKXx8KGNhcD10aGlzLnJ1bGVzLm5vbGluay5leGVjKHNyYykpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtsaW5rPShjYXBbMl18fGNhcFsxXSkucmVwbGFjZSgvXFxzKy9nLFwiIFwiKTtsaW5rPXRoaXMubGlua3NbbGluay50b0xvd2VyQ2FzZSgpXTtpZighbGlua3x8IWxpbmsuaHJlZil7b3V0Kz1jYXBbMF0uY2hhckF0KDApO3NyYz1jYXBbMF0uc3Vic3RyaW5nKDEpK3NyYztjb250aW51ZX10aGlzLmluTGluaz10cnVlO291dCs9dGhpcy5vdXRwdXRMaW5rKGNhcCxsaW5rKTt0aGlzLmluTGluaz1mYWxzZTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy5zdHJvbmcuZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtvdXQrPXRoaXMucmVuZGVyZXIuc3Ryb25nKHRoaXMub3V0cHV0KGNhcFsyXXx8Y2FwWzFdKSk7Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMuZW0uZXhlYyhzcmMpKXtzcmM9c3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtvdXQrPXRoaXMucmVuZGVyZXIuZW0odGhpcy5vdXRwdXQoY2FwWzJdfHxjYXBbMV0pKTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy5jb2RlLmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7b3V0Kz10aGlzLnJlbmRlcmVyLmNvZGVzcGFuKGVzY2FwZShjYXBbMl0sdHJ1ZSkpO2NvbnRpbnVlfWlmKGNhcD10aGlzLnJ1bGVzLmJyLmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7b3V0Kz10aGlzLnJlbmRlcmVyLmJyKCk7Y29udGludWV9aWYoY2FwPXRoaXMucnVsZXMuZGVsLmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7b3V0Kz10aGlzLnJlbmRlcmVyLmRlbCh0aGlzLm91dHB1dChjYXBbMV0pKTtjb250aW51ZX1pZihjYXA9dGhpcy5ydWxlcy50ZXh0LmV4ZWMoc3JjKSl7c3JjPXNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7b3V0Kz10aGlzLnJlbmRlcmVyLnRleHQoZXNjYXBlKHRoaXMuc21hcnR5cGFudHMoY2FwWzBdKSkpO2NvbnRpbnVlfWlmKHNyYyl7dGhyb3cgbmV3IEVycm9yKFwiSW5maW5pdGUgbG9vcCBvbiBieXRlOiBcIitzcmMuY2hhckNvZGVBdCgwKSl9fXJldHVybiBvdXR9O0lubGluZUxleGVyLnByb3RvdHlwZS5vdXRwdXRMaW5rPWZ1bmN0aW9uKGNhcCxsaW5rKXt2YXIgaHJlZj1lc2NhcGUobGluay5ocmVmKSx0aXRsZT1saW5rLnRpdGxlP2VzY2FwZShsaW5rLnRpdGxlKTpudWxsO3JldHVybiBjYXBbMF0uY2hhckF0KDApIT09XCIhXCI/dGhpcy5yZW5kZXJlci5saW5rKGhyZWYsdGl0bGUsdGhpcy5vdXRwdXQoY2FwWzFdKSk6dGhpcy5yZW5kZXJlci5pbWFnZShocmVmLHRpdGxlLGVzY2FwZShjYXBbMV0pKX07SW5saW5lTGV4ZXIucHJvdG90eXBlLnNtYXJ0eXBhbnRzPWZ1bmN0aW9uKHRleHQpe2lmKCF0aGlzLm9wdGlvbnMuc21hcnR5cGFudHMpcmV0dXJuIHRleHQ7cmV0dXJuIHRleHQucmVwbGFjZSgvLS0tL2csXCLigJRcIikucmVwbGFjZSgvLS0vZyxcIuKAk1wiKS5yZXBsYWNlKC8oXnxbLVxcdTIwMTQvKFxcW3tcIlxcc10pJy9nLFwiJDHigJhcIikucmVwbGFjZSgvJy9nLFwi4oCZXCIpLnJlcGxhY2UoLyhefFstXFx1MjAxNC8oXFxbe1xcdTIwMThcXHNdKVwiL2csXCIkMeKAnFwiKS5yZXBsYWNlKC9cIi9nLFwi4oCdXCIpLnJlcGxhY2UoL1xcLnszfS9nLFwi4oCmXCIpfTtJbmxpbmVMZXhlci5wcm90b3R5cGUubWFuZ2xlPWZ1bmN0aW9uKHRleHQpe2lmKCF0aGlzLm9wdGlvbnMubWFuZ2xlKXJldHVybiB0ZXh0O3ZhciBvdXQ9XCJcIixsPXRleHQubGVuZ3RoLGk9MCxjaDtmb3IoO2k8bDtpKyspe2NoPXRleHQuY2hhckNvZGVBdChpKTtpZihNYXRoLnJhbmRvbSgpPi41KXtjaD1cInhcIitjaC50b1N0cmluZygxNil9b3V0Kz1cIiYjXCIrY2grXCI7XCJ9cmV0dXJuIG91dH07ZnVuY3Rpb24gUmVuZGVyZXIob3B0aW9ucyl7dGhpcy5vcHRpb25zPW9wdGlvbnN8fHt9fVJlbmRlcmVyLnByb3RvdHlwZS5jb2RlPWZ1bmN0aW9uKGNvZGUsbGFuZyxlc2NhcGVkKXtpZih0aGlzLm9wdGlvbnMuaGlnaGxpZ2h0KXt2YXIgb3V0PXRoaXMub3B0aW9ucy5oaWdobGlnaHQoY29kZSxsYW5nKTtpZihvdXQhPW51bGwmJm91dCE9PWNvZGUpe2VzY2FwZWQ9dHJ1ZTtjb2RlPW91dH19aWYoIWxhbmcpe3JldHVyblwiPHByZT48Y29kZT5cIisoZXNjYXBlZD9jb2RlOmVzY2FwZShjb2RlLHRydWUpKStcIlxcbjwvY29kZT48L3ByZT5cIn1yZXR1cm4nPHByZT48Y29kZSBjbGFzcz1cIicrdGhpcy5vcHRpb25zLmxhbmdQcmVmaXgrZXNjYXBlKGxhbmcsdHJ1ZSkrJ1wiPicrKGVzY2FwZWQ/Y29kZTplc2NhcGUoY29kZSx0cnVlKSkrXCJcXG48L2NvZGU+PC9wcmU+XFxuXCJ9O1JlbmRlcmVyLnByb3RvdHlwZS5ibG9ja3F1b3RlPWZ1bmN0aW9uKHF1b3RlKXtyZXR1cm5cIjxibG9ja3F1b3RlPlxcblwiK3F1b3RlK1wiPC9ibG9ja3F1b3RlPlxcblwifTtSZW5kZXJlci5wcm90b3R5cGUuaHRtbD1mdW5jdGlvbihodG1sKXtyZXR1cm4gaHRtbH07UmVuZGVyZXIucHJvdG90eXBlLmhlYWRpbmc9ZnVuY3Rpb24odGV4dCxsZXZlbCxyYXcpe3JldHVyblwiPGhcIitsZXZlbCsnIGlkPVwiJyt0aGlzLm9wdGlvbnMuaGVhZGVyUHJlZml4K3Jhdy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1teXFx3XSsvZyxcIi1cIikrJ1wiPicrdGV4dCtcIjwvaFwiK2xldmVsK1wiPlxcblwifTtSZW5kZXJlci5wcm90b3R5cGUuaHI9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5vcHRpb25zLnhodG1sP1wiPGhyLz5cXG5cIjpcIjxocj5cXG5cIn07UmVuZGVyZXIucHJvdG90eXBlLmxpc3Q9ZnVuY3Rpb24oYm9keSxvcmRlcmVkKXt2YXIgdHlwZT1vcmRlcmVkP1wib2xcIjpcInVsXCI7cmV0dXJuXCI8XCIrdHlwZStcIj5cXG5cIitib2R5K1wiPC9cIit0eXBlK1wiPlxcblwifTtSZW5kZXJlci5wcm90b3R5cGUubGlzdGl0ZW09ZnVuY3Rpb24odGV4dCl7cmV0dXJuXCI8bGk+XCIrdGV4dCtcIjwvbGk+XFxuXCJ9O1JlbmRlcmVyLnByb3RvdHlwZS5wYXJhZ3JhcGg9ZnVuY3Rpb24odGV4dCl7cmV0dXJuXCI8cD5cIit0ZXh0K1wiPC9wPlxcblwifTtSZW5kZXJlci5wcm90b3R5cGUudGFibGU9ZnVuY3Rpb24oaGVhZGVyLGJvZHkpe3JldHVyblwiPHRhYmxlPlxcblwiK1wiPHRoZWFkPlxcblwiK2hlYWRlcitcIjwvdGhlYWQ+XFxuXCIrXCI8dGJvZHk+XFxuXCIrYm9keStcIjwvdGJvZHk+XFxuXCIrXCI8L3RhYmxlPlxcblwifTtSZW5kZXJlci5wcm90b3R5cGUudGFibGVyb3c9ZnVuY3Rpb24oY29udGVudCl7cmV0dXJuXCI8dHI+XFxuXCIrY29udGVudCtcIjwvdHI+XFxuXCJ9O1JlbmRlcmVyLnByb3RvdHlwZS50YWJsZWNlbGw9ZnVuY3Rpb24oY29udGVudCxmbGFncyl7dmFyIHR5cGU9ZmxhZ3MuaGVhZGVyP1widGhcIjpcInRkXCI7dmFyIHRhZz1mbGFncy5hbGlnbj9cIjxcIit0eXBlKycgc3R5bGU9XCJ0ZXh0LWFsaWduOicrZmxhZ3MuYWxpZ24rJ1wiPic6XCI8XCIrdHlwZStcIj5cIjtyZXR1cm4gdGFnK2NvbnRlbnQrXCI8L1wiK3R5cGUrXCI+XFxuXCJ9O1JlbmRlcmVyLnByb3RvdHlwZS5zdHJvbmc9ZnVuY3Rpb24odGV4dCl7cmV0dXJuXCI8c3Ryb25nPlwiK3RleHQrXCI8L3N0cm9uZz5cIn07UmVuZGVyZXIucHJvdG90eXBlLmVtPWZ1bmN0aW9uKHRleHQpe3JldHVyblwiPGVtPlwiK3RleHQrXCI8L2VtPlwifTtSZW5kZXJlci5wcm90b3R5cGUuY29kZXNwYW49ZnVuY3Rpb24odGV4dCl7cmV0dXJuXCI8Y29kZT5cIit0ZXh0K1wiPC9jb2RlPlwifTtSZW5kZXJlci5wcm90b3R5cGUuYnI9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5vcHRpb25zLnhodG1sP1wiPGJyLz5cIjpcIjxicj5cIn07UmVuZGVyZXIucHJvdG90eXBlLmRlbD1mdW5jdGlvbih0ZXh0KXtyZXR1cm5cIjxkZWw+XCIrdGV4dCtcIjwvZGVsPlwifTtSZW5kZXJlci5wcm90b3R5cGUubGluaz1mdW5jdGlvbihocmVmLHRpdGxlLHRleHQpe2lmKHRoaXMub3B0aW9ucy5zYW5pdGl6ZSl7dHJ5e3ZhciBwcm90PWRlY29kZVVSSUNvbXBvbmVudCh1bmVzY2FwZShocmVmKSkucmVwbGFjZSgvW15cXHc6XS9nLFwiXCIpLnRvTG93ZXJDYXNlKCl9Y2F0Y2goZSl7cmV0dXJuXCJcIn1pZihwcm90LmluZGV4T2YoXCJqYXZhc2NyaXB0OlwiKT09PTB8fHByb3QuaW5kZXhPZihcInZic2NyaXB0OlwiKT09PTApe3JldHVyblwiXCJ9fXZhciBvdXQ9JzxhIGhyZWY9XCInK2hyZWYrJ1wiJztpZih0aXRsZSl7b3V0Kz0nIHRpdGxlPVwiJyt0aXRsZSsnXCInfW91dCs9XCI+XCIrdGV4dCtcIjwvYT5cIjtyZXR1cm4gb3V0fTtSZW5kZXJlci5wcm90b3R5cGUuaW1hZ2U9ZnVuY3Rpb24oaHJlZix0aXRsZSx0ZXh0KXt2YXIgb3V0PSc8aW1nIHNyYz1cIicraHJlZisnXCIgYWx0PVwiJyt0ZXh0KydcIic7aWYodGl0bGUpe291dCs9JyB0aXRsZT1cIicrdGl0bGUrJ1wiJ31vdXQrPXRoaXMub3B0aW9ucy54aHRtbD9cIi8+XCI6XCI+XCI7cmV0dXJuIG91dH07UmVuZGVyZXIucHJvdG90eXBlLnRleHQ9ZnVuY3Rpb24odGV4dCl7cmV0dXJuIHRleHR9O2Z1bmN0aW9uIFBhcnNlcihvcHRpb25zKXt0aGlzLnRva2Vucz1bXTt0aGlzLnRva2VuPW51bGw7dGhpcy5vcHRpb25zPW9wdGlvbnN8fG1hcmtlZC5kZWZhdWx0czt0aGlzLm9wdGlvbnMucmVuZGVyZXI9dGhpcy5vcHRpb25zLnJlbmRlcmVyfHxuZXcgUmVuZGVyZXI7dGhpcy5yZW5kZXJlcj10aGlzLm9wdGlvbnMucmVuZGVyZXI7dGhpcy5yZW5kZXJlci5vcHRpb25zPXRoaXMub3B0aW9uc31QYXJzZXIucGFyc2U9ZnVuY3Rpb24oc3JjLG9wdGlvbnMscmVuZGVyZXIpe3ZhciBwYXJzZXI9bmV3IFBhcnNlcihvcHRpb25zLHJlbmRlcmVyKTtyZXR1cm4gcGFyc2VyLnBhcnNlKHNyYyl9O1BhcnNlci5wcm90b3R5cGUucGFyc2U9ZnVuY3Rpb24oc3JjKXt0aGlzLmlubGluZT1uZXcgSW5saW5lTGV4ZXIoc3JjLmxpbmtzLHRoaXMub3B0aW9ucyx0aGlzLnJlbmRlcmVyKTt0aGlzLnRva2Vucz1zcmMucmV2ZXJzZSgpO3ZhciBvdXQ9XCJcIjt3aGlsZSh0aGlzLm5leHQoKSl7b3V0Kz10aGlzLnRvaygpfXJldHVybiBvdXR9O1BhcnNlci5wcm90b3R5cGUubmV4dD1mdW5jdGlvbigpe3JldHVybiB0aGlzLnRva2VuPXRoaXMudG9rZW5zLnBvcCgpfTtQYXJzZXIucHJvdG90eXBlLnBlZWs9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy50b2tlbnNbdGhpcy50b2tlbnMubGVuZ3RoLTFdfHwwfTtQYXJzZXIucHJvdG90eXBlLnBhcnNlVGV4dD1mdW5jdGlvbigpe3ZhciBib2R5PXRoaXMudG9rZW4udGV4dDt3aGlsZSh0aGlzLnBlZWsoKS50eXBlPT09XCJ0ZXh0XCIpe2JvZHkrPVwiXFxuXCIrdGhpcy5uZXh0KCkudGV4dH1yZXR1cm4gdGhpcy5pbmxpbmUub3V0cHV0KGJvZHkpfTtQYXJzZXIucHJvdG90eXBlLnRvaz1mdW5jdGlvbigpe3N3aXRjaCh0aGlzLnRva2VuLnR5cGUpe2Nhc2VcInNwYWNlXCI6e3JldHVyblwiXCJ9Y2FzZVwiaHJcIjp7cmV0dXJuIHRoaXMucmVuZGVyZXIuaHIoKX1jYXNlXCJoZWFkaW5nXCI6e3JldHVybiB0aGlzLnJlbmRlcmVyLmhlYWRpbmcodGhpcy5pbmxpbmUub3V0cHV0KHRoaXMudG9rZW4udGV4dCksdGhpcy50b2tlbi5kZXB0aCx0aGlzLnRva2VuLnRleHQpfWNhc2VcImNvZGVcIjp7cmV0dXJuIHRoaXMucmVuZGVyZXIuY29kZSh0aGlzLnRva2VuLnRleHQsdGhpcy50b2tlbi5sYW5nLHRoaXMudG9rZW4uZXNjYXBlZCl9Y2FzZVwidGFibGVcIjp7dmFyIGhlYWRlcj1cIlwiLGJvZHk9XCJcIixpLHJvdyxjZWxsLGZsYWdzLGo7Y2VsbD1cIlwiO2ZvcihpPTA7aTx0aGlzLnRva2VuLmhlYWRlci5sZW5ndGg7aSsrKXtmbGFncz17aGVhZGVyOnRydWUsYWxpZ246dGhpcy50b2tlbi5hbGlnbltpXX07Y2VsbCs9dGhpcy5yZW5kZXJlci50YWJsZWNlbGwodGhpcy5pbmxpbmUub3V0cHV0KHRoaXMudG9rZW4uaGVhZGVyW2ldKSx7aGVhZGVyOnRydWUsYWxpZ246dGhpcy50b2tlbi5hbGlnbltpXX0pfWhlYWRlcis9dGhpcy5yZW5kZXJlci50YWJsZXJvdyhjZWxsKTtmb3IoaT0wO2k8dGhpcy50b2tlbi5jZWxscy5sZW5ndGg7aSsrKXtyb3c9dGhpcy50b2tlbi5jZWxsc1tpXTtjZWxsPVwiXCI7Zm9yKGo9MDtqPHJvdy5sZW5ndGg7aisrKXtjZWxsKz10aGlzLnJlbmRlcmVyLnRhYmxlY2VsbCh0aGlzLmlubGluZS5vdXRwdXQocm93W2pdKSx7aGVhZGVyOmZhbHNlLGFsaWduOnRoaXMudG9rZW4uYWxpZ25bal19KX1ib2R5Kz10aGlzLnJlbmRlcmVyLnRhYmxlcm93KGNlbGwpfXJldHVybiB0aGlzLnJlbmRlcmVyLnRhYmxlKGhlYWRlcixib2R5KX1jYXNlXCJibG9ja3F1b3RlX3N0YXJ0XCI6e3ZhciBib2R5PVwiXCI7d2hpbGUodGhpcy5uZXh0KCkudHlwZSE9PVwiYmxvY2txdW90ZV9lbmRcIil7Ym9keSs9dGhpcy50b2soKX1yZXR1cm4gdGhpcy5yZW5kZXJlci5ibG9ja3F1b3RlKGJvZHkpfWNhc2VcImxpc3Rfc3RhcnRcIjp7dmFyIGJvZHk9XCJcIixvcmRlcmVkPXRoaXMudG9rZW4ub3JkZXJlZDt3aGlsZSh0aGlzLm5leHQoKS50eXBlIT09XCJsaXN0X2VuZFwiKXtib2R5Kz10aGlzLnRvaygpfXJldHVybiB0aGlzLnJlbmRlcmVyLmxpc3QoYm9keSxvcmRlcmVkKX1jYXNlXCJsaXN0X2l0ZW1fc3RhcnRcIjp7dmFyIGJvZHk9XCJcIjt3aGlsZSh0aGlzLm5leHQoKS50eXBlIT09XCJsaXN0X2l0ZW1fZW5kXCIpe2JvZHkrPXRoaXMudG9rZW4udHlwZT09PVwidGV4dFwiP3RoaXMucGFyc2VUZXh0KCk6dGhpcy50b2soKX1yZXR1cm4gdGhpcy5yZW5kZXJlci5saXN0aXRlbShib2R5KX1jYXNlXCJsb29zZV9pdGVtX3N0YXJ0XCI6e3ZhciBib2R5PVwiXCI7d2hpbGUodGhpcy5uZXh0KCkudHlwZSE9PVwibGlzdF9pdGVtX2VuZFwiKXtib2R5Kz10aGlzLnRvaygpfXJldHVybiB0aGlzLnJlbmRlcmVyLmxpc3RpdGVtKGJvZHkpfWNhc2VcImh0bWxcIjp7dmFyIGh0bWw9IXRoaXMudG9rZW4ucHJlJiYhdGhpcy5vcHRpb25zLnBlZGFudGljP3RoaXMuaW5saW5lLm91dHB1dCh0aGlzLnRva2VuLnRleHQpOnRoaXMudG9rZW4udGV4dDtyZXR1cm4gdGhpcy5yZW5kZXJlci5odG1sKGh0bWwpfWNhc2VcInBhcmFncmFwaFwiOntyZXR1cm4gdGhpcy5yZW5kZXJlci5wYXJhZ3JhcGgodGhpcy5pbmxpbmUub3V0cHV0KHRoaXMudG9rZW4udGV4dCkpfWNhc2VcInRleHRcIjp7cmV0dXJuIHRoaXMucmVuZGVyZXIucGFyYWdyYXBoKHRoaXMucGFyc2VUZXh0KCkpfX19O2Z1bmN0aW9uIGVzY2FwZShodG1sLGVuY29kZSl7cmV0dXJuIGh0bWwucmVwbGFjZSghZW5jb2RlPy8mKD8hIz9cXHcrOykvZzovJi9nLFwiJmFtcDtcIikucmVwbGFjZSgvPC9nLFwiJmx0O1wiKS5yZXBsYWNlKC8+L2csXCImZ3Q7XCIpLnJlcGxhY2UoL1wiL2csXCImcXVvdDtcIikucmVwbGFjZSgvJy9nLFwiJiMzOTtcIil9ZnVuY3Rpb24gdW5lc2NhcGUoaHRtbCl7cmV0dXJuIGh0bWwucmVwbGFjZSgvJihbI1xcd10rKTsvZyxmdW5jdGlvbihfLG4pe249bi50b0xvd2VyQ2FzZSgpO2lmKG49PT1cImNvbG9uXCIpcmV0dXJuXCI6XCI7aWYobi5jaGFyQXQoMCk9PT1cIiNcIil7cmV0dXJuIG4uY2hhckF0KDEpPT09XCJ4XCI/U3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChuLnN1YnN0cmluZygyKSwxNikpOlN0cmluZy5mcm9tQ2hhckNvZGUoK24uc3Vic3RyaW5nKDEpKX1yZXR1cm5cIlwifSl9ZnVuY3Rpb24gcmVwbGFjZShyZWdleCxvcHQpe3JlZ2V4PXJlZ2V4LnNvdXJjZTtvcHQ9b3B0fHxcIlwiO3JldHVybiBmdW5jdGlvbiBzZWxmKG5hbWUsdmFsKXtpZighbmFtZSlyZXR1cm4gbmV3IFJlZ0V4cChyZWdleCxvcHQpO3ZhbD12YWwuc291cmNlfHx2YWw7dmFsPXZhbC5yZXBsYWNlKC8oXnxbXlxcW10pXFxeL2csXCIkMVwiKTtyZWdleD1yZWdleC5yZXBsYWNlKG5hbWUsdmFsKTtyZXR1cm4gc2VsZn19ZnVuY3Rpb24gbm9vcCgpe31ub29wLmV4ZWM9bm9vcDtmdW5jdGlvbiBtZXJnZShvYmope3ZhciBpPTEsdGFyZ2V0LGtleTtmb3IoO2k8YXJndW1lbnRzLmxlbmd0aDtpKyspe3RhcmdldD1hcmd1bWVudHNbaV07Zm9yKGtleSBpbiB0YXJnZXQpe2lmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsa2V5KSl7b2JqW2tleV09dGFyZ2V0W2tleV19fX1yZXR1cm4gb2JqfWZ1bmN0aW9uIG1hcmtlZChzcmMsb3B0LGNhbGxiYWNrKXtpZihjYWxsYmFja3x8dHlwZW9mIG9wdD09PVwiZnVuY3Rpb25cIil7aWYoIWNhbGxiYWNrKXtjYWxsYmFjaz1vcHQ7b3B0PW51bGx9b3B0PW1lcmdlKHt9LG1hcmtlZC5kZWZhdWx0cyxvcHR8fHt9KTt2YXIgaGlnaGxpZ2h0PW9wdC5oaWdobGlnaHQsdG9rZW5zLHBlbmRpbmcsaT0wO3RyeXt0b2tlbnM9TGV4ZXIubGV4KHNyYyxvcHQpfWNhdGNoKGUpe3JldHVybiBjYWxsYmFjayhlKX1wZW5kaW5nPXRva2Vucy5sZW5ndGg7dmFyIGRvbmU9ZnVuY3Rpb24oZXJyKXtpZihlcnIpe29wdC5oaWdobGlnaHQ9aGlnaGxpZ2h0O3JldHVybiBjYWxsYmFjayhlcnIpfXZhciBvdXQ7dHJ5e291dD1QYXJzZXIucGFyc2UodG9rZW5zLG9wdCl9Y2F0Y2goZSl7ZXJyPWV9b3B0LmhpZ2hsaWdodD1oaWdobGlnaHQ7cmV0dXJuIGVycj9jYWxsYmFjayhlcnIpOmNhbGxiYWNrKG51bGwsb3V0KX07aWYoIWhpZ2hsaWdodHx8aGlnaGxpZ2h0Lmxlbmd0aDwzKXtyZXR1cm4gZG9uZSgpfWRlbGV0ZSBvcHQuaGlnaGxpZ2h0O2lmKCFwZW5kaW5nKXJldHVybiBkb25lKCk7Zm9yKDtpPHRva2Vucy5sZW5ndGg7aSsrKXsoZnVuY3Rpb24odG9rZW4pe2lmKHRva2VuLnR5cGUhPT1cImNvZGVcIil7cmV0dXJuLS1wZW5kaW5nfHxkb25lKCl9cmV0dXJuIGhpZ2hsaWdodCh0b2tlbi50ZXh0LHRva2VuLmxhbmcsZnVuY3Rpb24oZXJyLGNvZGUpe2lmKGVycilyZXR1cm4gZG9uZShlcnIpO2lmKGNvZGU9PW51bGx8fGNvZGU9PT10b2tlbi50ZXh0KXtyZXR1cm4tLXBlbmRpbmd8fGRvbmUoKX10b2tlbi50ZXh0PWNvZGU7dG9rZW4uZXNjYXBlZD10cnVlOy0tcGVuZGluZ3x8ZG9uZSgpfSl9KSh0b2tlbnNbaV0pfXJldHVybn10cnl7aWYob3B0KW9wdD1tZXJnZSh7fSxtYXJrZWQuZGVmYXVsdHMsb3B0KTtyZXR1cm4gUGFyc2VyLnBhcnNlKExleGVyLmxleChzcmMsb3B0KSxvcHQpfWNhdGNoKGUpe2UubWVzc2FnZSs9XCJcXG5QbGVhc2UgcmVwb3J0IHRoaXMgdG8gaHR0cHM6Ly9naXRodWIuY29tL2NoamovbWFya2VkLlwiO2lmKChvcHR8fG1hcmtlZC5kZWZhdWx0cykuc2lsZW50KXtyZXR1cm5cIjxwPkFuIGVycm9yIG9jY3VyZWQ6PC9wPjxwcmU+XCIrZXNjYXBlKGUubWVzc2FnZStcIlwiLHRydWUpK1wiPC9wcmU+XCJ9dGhyb3cgZX19bWFya2VkLm9wdGlvbnM9bWFya2VkLnNldE9wdGlvbnM9ZnVuY3Rpb24ob3B0KXttZXJnZShtYXJrZWQuZGVmYXVsdHMsb3B0KTtyZXR1cm4gbWFya2VkfTttYXJrZWQuZGVmYXVsdHM9e2dmbTp0cnVlLHRhYmxlczp0cnVlLGJyZWFrczpmYWxzZSxwZWRhbnRpYzpmYWxzZSxzYW5pdGl6ZTpmYWxzZSxzYW5pdGl6ZXI6bnVsbCxtYW5nbGU6dHJ1ZSxzbWFydExpc3RzOmZhbHNlLHNpbGVudDpmYWxzZSxoaWdobGlnaHQ6bnVsbCxsYW5nUHJlZml4OlwibGFuZy1cIixzbWFydHlwYW50czpmYWxzZSxoZWFkZXJQcmVmaXg6XCJcIixyZW5kZXJlcjpuZXcgUmVuZGVyZXIseGh0bWw6ZmFsc2V9O21hcmtlZC5QYXJzZXI9UGFyc2VyO21hcmtlZC5wYXJzZXI9UGFyc2VyLnBhcnNlO21hcmtlZC5SZW5kZXJlcj1SZW5kZXJlcjttYXJrZWQuTGV4ZXI9TGV4ZXI7bWFya2VkLmxleGVyPUxleGVyLmxleDttYXJrZWQuSW5saW5lTGV4ZXI9SW5saW5lTGV4ZXI7bWFya2VkLmlubGluZUxleGVyPUlubGluZUxleGVyLm91dHB1dDttYXJrZWQucGFyc2U9bWFya2VkO2lmKHR5cGVvZiBtb2R1bGUhPT1cInVuZGVmaW5lZFwiJiZ0eXBlb2YgZXhwb3J0cz09PVwib2JqZWN0XCIpe21vZHVsZS5leHBvcnRzPW1hcmtlZH1lbHNlIGlmKHR5cGVvZiBkZWZpbmU9PT1cImZ1bmN0aW9uXCImJmRlZmluZS5hbWQpe2RlZmluZShmdW5jdGlvbigpe3JldHVybiBtYXJrZWR9KX1lbHNle3RoaXMubWFya2VkPW1hcmtlZH19KS5jYWxsKGZ1bmN0aW9uKCl7cmV0dXJuIHRoaXN8fCh0eXBlb2Ygd2luZG93IT09XCJ1bmRlZmluZWRcIj93aW5kb3c6Z2xvYmFsKX0oKSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBSZXZlYWwgPSBnbG9iYWwuUmV2ZWFsID0gcmVxdWlyZSgncmV2ZWFsLmpzJyk7XG5cbmNvbnN0IGhsanMgPSBnbG9iYWwuaGxqcyA9IHJlcXVpcmUoJ2hpZ2hsaWdodC5qcy9saWIvaGlnaGxpZ2h0Jyk7XG5obGpzLnJlZ2lzdGVyTGFuZ3VhZ2UoJ2Jhc2gnLCByZXF1aXJlKCdoaWdobGlnaHQuanMvbGliL2xhbmd1YWdlcy9iYXNoJykpO1xuaGxqcy5yZWdpc3Rlckxhbmd1YWdlKCdzaGVsbCcsIHJlcXVpcmUoJ2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL3NoZWxsJykpO1xuaGxqcy5yZWdpc3Rlckxhbmd1YWdlKCdzaGVsbCcsIHJlcXVpcmUoJ2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL3NoZWxsJykpO1xuaGxqcy5yZWdpc3Rlckxhbmd1YWdlKCd4bWwnLCByZXF1aXJlKCdoaWdobGlnaHQuanMvbGliL2xhbmd1YWdlcy94bWwnKSk7XG5obGpzLnJlZ2lzdGVyTGFuZ3VhZ2UoJ2FzY2lpZG9jJywgcmVxdWlyZSgnaGlnaGxpZ2h0LmpzL2xpYi9sYW5ndWFnZXMvYXNjaWlkb2MnKSk7XG5obGpzLnJlZ2lzdGVyTGFuZ3VhZ2UoJ2phdmFzY3JpcHQnLCByZXF1aXJlKCdoaWdobGlnaHQuanMvbGliL2xhbmd1YWdlcy9qYXZhc2NyaXB0JykpO1xuXG5jb25zdCBSZXZlYWxNYXJrZG93biA9IHJlcXVpcmUoJ3JldmVhbC5qcy9wbHVnaW4vbWFya2Rvd24vbWFya2Rvd24uanMnKTtcblxudmFyIHRvQXJyYXkgPSBmdW5jdGlvbihhcnIpe1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcbn07XG5cblJldmVhbE1hcmtkb3duLmluaXRpYWxpemUoKTtcblJldmVhbC5pbml0aWFsaXplKHtcbiAgd2lkdGg6IDEwMjQsXG4gIGhlaWdodDogNzI4LFxuXG4gIGNvbnRyb2xzOiAvKGxvY2FsaG9zdHwjbGl2ZSkvLnRlc3QobG9jYXRpb24uaHJlZikgIT09IHRydWUsXG4gIHByb2dyZXNzOiB0cnVlLFxuICBoaXN0b3J5OiB0cnVlLFxuICBjZW50ZXI6IHRydWUsXG4gIG92ZXJ2aWV3OiBmYWxzZSxcbiAgcm9sbGluZ0xpbmtzOiBmYWxzZSxcblxuICB0cmFuc2l0aW9uOiAnbGluZWFyJ1xufSk7XG5cblJldmVhbC5hZGRFdmVudExpc3RlbmVyKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICB0b0FycmF5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EgPiBpbWcnKSkuZm9yRWFjaChmdW5jdGlvbihlbCl7XG4gICAgZWwucGFyZW50Tm9kZS5jbGFzc0xpc3QuYWRkKCdpbWFnZScpO1xuICB9KTtcblxuICB0b0FycmF5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3NlY3Rpb25bZGF0YS1iYWNrZ3JvdW5kXScpKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXtcbiAgICB2YXIgaXNFbXB0eSA9IHRvQXJyYXkoZWwuY2hpbGRyZW4pLmV2ZXJ5KGZ1bmN0aW9uKGNoaWxkKXtcbiAgICAgIHJldHVybiAodHlwZW9mIGNoaWxkLm5vZGVWYWx1ZSA9PT0gJ3RleHQnICYmIGNoaWxkLm5vZGVWYWx1ZS50cmltKCkgPT09ICcnKSB8fCBjaGlsZC5jbGFzc0xpc3QuY29udGFpbnMoJ25vdGVzJyk7XG4gICAgfSk7XG5cbiAgICBpZiAoaXNFbXB0eSl7XG4gICAgICBlbC5jbGFzc0xpc3QuYWRkKCdlbXB0eScpO1xuICAgIH1cbiAgfSk7XG5cbiAgdG9BcnJheShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzZWN0aW9uW2RhdGEtbWFya2Rvd25dID4gaDEsIHNlY3Rpb25bZGF0YS1tYXJrZG93bl0gPiBoMiwgc2VjdGlvbltkYXRhLW1hcmtkb3duXSA+IGgzJykpLmZvckVhY2goZnVuY3Rpb24oZWwpe1xuICAgIGlmIChlbC5uZXh0RWxlbWVudFNpYmxpbmcgJiYgZWwubmV4dEVsZW1lbnRTaWJsaW5nLmNsYXNzTGlzdC5jb250YWlucygnbm90ZXMnKSl7XG4gICAgICBlbC5jbGFzc0xpc3QuYWRkKCdsYXN0LWNoaWxkJyk7XG4gICAgfVxuICB9KTtcblxuICB0b0FycmF5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3NlY3Rpb25bZGF0YS1tYXJrZG93bl0nKSkuZm9yRWFjaChmdW5jdGlvbihzZWN0aW9uKXtcbiAgICBpZiAoc2VjdGlvbi5xdWVyeVNlbGVjdG9yQWxsKCdwcmUgPiBjb2RlJykubGVuZ3RoKXtcbiAgICAgIHNlY3Rpb24uc2V0QXR0cmlidXRlKCdkYXRhLXN0YXRlJywgJ2NvZGUnKTtcbiAgICB9XG4gIH0pO1xufSk7XG4iXX0=
