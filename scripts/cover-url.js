'use strict';


hexo.extend.helper.register('coverUrl', function(post, config) {
  const { default_cover, url:siteUrl } = config;
  var url = post.cover ? (post.cover.url || post.cover) : '';

  if (!url && default_cover) {
    url = default_cover;
  }

  if (url){
    if (url.match(/^\/images/) && process.env.NODE_ENV === 'production'){
      url = `${siteUrl}${this.url_for(url)}`;
    }

    return this.img_url(url, post);
  }

  return url;
});
