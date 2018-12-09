'use strict';

const { parse } = require('url');

hexo.extend.helper.register('img_url', function(src, post) {
  const root = process.env.NODE_ENV === 'production' ? this.config.url : '';
  const prefix = root.replace(this.config.root.slice(0, -1), '');

  return post && src[0] !== '/'
    ? prefix + this.url_for(`${post.path}/${src}`)
    : prefix + this.url_for(src);
});
