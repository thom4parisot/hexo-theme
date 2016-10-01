'use strict';

const { parse } = require('url');

hexo.extend.helper.register('img_url', function(src, post) {
  const prefix = process.env.NODE_ENV === 'production' ? this.config.url : '';

  return parse(src).protocol
    ? src.replace('_c_d.jpg', '_b_d.jpg')
    : (post
      ? prefix + this.url_for(`${post.slug}/${src}`)
      : prefix + this.url_for(src));
});
