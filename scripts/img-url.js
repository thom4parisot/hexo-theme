'use strict';

const { parse } = require('url');

// const urlFor = hexo.extend.helper.store['url_for'].bind(hexo);

hexo.extend.helper.register('img_url', function(src, post) {
  return parse(src).protocol
    ? src.replace('_c_d.jpg', '_b_d.jpg')
    : (post
      ? this.url_for(`${post.slug}/${src}`)
      : this.url_for(src));
});
