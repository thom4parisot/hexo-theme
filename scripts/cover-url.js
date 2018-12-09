'use strict';

const url_for = hexo.extend.helper.store['url_for'].bind(hexo);

function coverUrl(post, config) {
  const { default_cover, url:siteUrl } = config;
  var url = post.cover ? (post.cover.url || post.cover) : (post.image ? '/' + post.image.trimStart('/') : '');

  if (!url && default_cover) {
    url = default_cover;
  }

  if (url){
    return url_for(url, post);
  }

  return url;
}

hexo.extend.helper.register('coverUrl', function(post, config) {
  return coverUrl(post, config);
});

hexo.extend.filter.register('before_post_render', function(data){
  if (data.cover) {
    data.image = coverUrl(data, {});
  }

  return data;
});
