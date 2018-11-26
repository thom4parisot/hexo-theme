'use strict';


hexo.extend.helper.register('coverUrl', function(post, config) {
  const { default_cover, url:siteUrl } = config;
  var url = post.cover ? (post.cover.url || post.cover) : (post.image ? '/' + post.image.trimStart('/') : '');

  if (!url && default_cover) {
    url = default_cover;
  }

  if (url){
    return this.img_url(url, post);
  }

  return url;
});
