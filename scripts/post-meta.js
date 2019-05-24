'use strict';

const url_for = hexo.extend.helper.store['url_for'].bind(hexo);

function coverUrl(post, config) {
  const {url:siteUrl=''} = config;
  var url = post.cover ? (post.cover.url || post.cover) : (post.image ? '/' + post.image.trimStart('/') : '');

  return url ? (siteUrl + url_for(url)) : '';
}

/**
 * Adds `post.image` from `post.cover[.url]`
 */
hexo.extend.filter.register('before_post_render', function(data){
  if (data.cover) {
    data.image = coverUrl(data, hexo.config);
  }

  return data;
});

/**
 * Adds `post.image` for book cover
 */
hexo.extend.filter.register('before_post_render', function(data){
  if (data.layout && data.layout === 'reading-note' && data.isbn) {
    const {isbn} = data;
    data.image = `https://images.epagine.fr/${isbn.slice(-3)}/${isbn}_1_75.jpg`;
  }

  return data;
});

/**
 * Adds a default post langage to 'fr' when before 2013-03-01
 * It's the date I moved to London
 */
hexo.extend.filter.register('before_post_render', function(post){
  if (!post.lang && post.date.isBefore('2013-03-01')) {
    post.lang = 'fr';
  }

  return post;
});

/**
 * Adds `post.quotes_count`
 */
hexo.extend.filter.register('before_generate', function(){
  const Page = hexo.model('Page');

  Page.schema.virtual('quotes_count').get(function() {
    return ((this.content || '').match(/^<blockquote/gm) || []).length;
  });
});


hexo.extend.filter.register('before_post_render', function(post){
  if (post.layout === 'journal') {
    post.title = `☕️ Journal : ${post.title}`;
  }

  return post;
});
