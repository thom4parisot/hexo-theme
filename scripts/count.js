'use strict';

hexo.extend.helper.register('pictures_count', post => {
  return (post.pictures || [])
    .filter(p => p.hasOwnProperty('src') && (p.src.img || p.src))
    .length;
});
