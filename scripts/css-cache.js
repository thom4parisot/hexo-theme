'use strict';

const urlFor = hexo.extend.helper.store['url_for'].bind(hexo);

hexo.extend.helper.register('page_css', (page) => {
  const { layouts } = hexo.theme.config.less;
  let files = ['assets/css/core.css'];

  if (page.layout === 'post' && hexo.config.layout === 'talks') {
    files = [
      'assets/css/slides.css',
      `assets/css/slides/theme-${page.theme || 'oncletom'}.css`
    ];
  }
  // photography layouts (as defined in _config.yml)
  else if (layouts[page.layout]) {
    files = files.concat(layouts[page.layout]);
  }

  return files;
});

hexo.extend.helper.register('cssCache', (urls) => {
  const v = process.env.npm_package_version;

  return urls
    .filter(d => d)
    .map(url => {
      return `<link rel="stylesheet" href="${urlFor(url)}?v=v${v}">`;
    })
    .join("\n");
});
