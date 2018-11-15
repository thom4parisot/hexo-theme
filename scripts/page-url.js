'use strict';

hexo.extend.helper.register('url_for_page', function(path, options) {
  return this.url_for(path, options).replace(/index.html$/, '');
});
