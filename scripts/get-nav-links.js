'use strict';

// link.namespace === config.layout || is_page() && is_current(link.href) ? 'active' : ''

hexo.extend.helper.register('getNavLinks', function (links) {
  const isPage = hexo.extend.helper.get('is_page').bind(this);
  const isPost = hexo.extend.helper.get('is_post').bind(this);
  const isCurrent = hexo.extend.helper.get('is_current').bind(this);
  const { layout } = this.config;
  let found = false;

  return links
    .map(link => Object.assign(link, { classNames: '' }))
    .map(link => {
      if (isPage() && `${link.href}index.html`.indexOf(this.path) === 1) {
        link.classNames = 'active active--page';
        found = true;
      }

      return link;
    })
    .map(link => {
      if (!found && link.namespace === layout) {
        link.classNames = 'active';
      }

      return link;
    });
});
