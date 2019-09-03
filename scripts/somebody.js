'use strict';

const somebody = require('somebody');

hexo.extend.helper.register('somebody', somebody.parse.bind(somebody));
