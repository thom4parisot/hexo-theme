'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _reveal = _interopRequireDefault(require("reveal.js"));

var _revealRandomColors = _interopRequireDefault(require("reveal-random-colors"));

var _markdown = _interopRequireDefault(require("reveal.js/plugin/markdown/markdown.js"));

global.Reveal = _reveal.default;

const hljs = global.hljs = require('highlight.js/lib/highlight');

hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'));
hljs.registerLanguage('shell', require('highlight.js/lib/languages/shell'));
hljs.registerLanguage('shell', require('highlight.js/lib/languages/shell'));
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'));
hljs.registerLanguage('asciidoc', require('highlight.js/lib/languages/asciidoc'));
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));

var toArray = function toArray(arr) {
  return Array.prototype.slice.call(arr);
};

const random = arr => arr[Math.floor(Math.random() * arr.length)];

_markdown.default.initialize();

_reveal.default.initialize({
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

_reveal.default.addEventListener('slidechanged', (0, _revealRandomColors.default)());

_reveal.default.addEventListener('ready', function () {
  window.localStorage.setItem('reveal-speaker-layout', 'tall');
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
