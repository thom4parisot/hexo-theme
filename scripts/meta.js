'use strict';

hexo.extend.helper.register('description', function(page) {
  let description = '';

  if (page.excerpt && page.more) {
    description = page.excerpt;
  }
  else if (page.title && !page.excerpt && page.more) {
    description = page.content;
  }
  else {
    description = this.config.description || this.theme.description;
  }

  return this.strip_html(description)
    .trim()
    .replace(/(\r\n|\n|\r)/gm, "&#10;");
});

hexo.extend.helper.register('title', function(page) {
  return page.title
    ? [page.title, this.config.title].join(" • ")
    : [this.config.title, this.config.subtitle].join(" • ");
});
