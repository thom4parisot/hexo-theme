'use strict';

const url_for = hexo.extend.helper.store['url_for'].bind(hexo);

function coverUrl(post, config) {
  const {url:siteUrl=''} = config;
  var url = post.cover ? (post.cover.url || post.cover) : (post.image ? '/' + post.image.trimStart('/') : '');

  return url ? (siteUrl + url_for(url)) : '';
}

hexo.extend.filter.register('before_post_render', function(data){
  if (data.cover) {
    data.image = coverUrl(data, hexo.config);
  }

  return data;
});
