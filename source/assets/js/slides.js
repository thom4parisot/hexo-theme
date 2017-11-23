'use strict';

const Reveal = global.Reveal = require('reveal.js');

const hljs = global.hljs = require('highlight.js/lib/highlight');
hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'));
hljs.registerLanguage('shell', require('highlight.js/lib/languages/shell'));
hljs.registerLanguage('shell', require('highlight.js/lib/languages/shell'));
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'));
hljs.registerLanguage('asciidoc', require('highlight.js/lib/languages/asciidoc'));
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));

const RevealMarkdown = require('reveal.js/plugin/markdown/markdown.js');

const {colors, fonts} = require('./random.js');

var toArray = function(arr){
  return Array.prototype.slice.call(arr);
};

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

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

Reveal.addEventListener('ready', function() {
  toArray(document.querySelectorAll('a > img')).forEach(function(el){
    el.parentNode.classList.add('image');
  });

  toArray(document.querySelectorAll('section[data-background]')).forEach(function(el){
    var isEmpty = toArray(el.children).every(function(child){
      return (typeof child.nodeValue === 'text' && child.nodeValue.trim() === '') || child.classList.contains('notes');
    });

    if (isEmpty){
      el.classList.add('empty');
    }
  });

  toArray(document.querySelectorAll('section[data-markdown] > h1, section[data-markdown] > h2, section[data-markdown] > h3')).forEach(function(el){
    if (el.nextElementSibling && el.nextElementSibling.classList.contains('notes')){
      el.classList.add('last-child');
    }
  });

  toArray(document.querySelectorAll('section[data-markdown]')).forEach(function(section){
    if (section.querySelectorAll('pre > code').length){
      section.setAttribute('data-state', 'code');
    }
  });

  const App = document.querySelector('[role="application"]');

  Reveal.addEventListener('slidechanged', ({previousSlide, currentSlide}) => {
    if (currentSlide.dataset.state === 'random')
    {
      const [color, backgroundColor] = random(colors);
      App.style.color = color;
      App.style.backgroundColor = backgroundColor;
      App.style.fontFamily = random(fonts);
    }
    else {
      App.style.color = null;
      App.style.backgroundColor = null;
      App.style.fontFamily = null;
    }
  });
});
