'use strict';

const fs = require('hexo-fs');
const {join} = require('path');

hexo.extend.helper.register('markdown_slide', function({ page, slide }){
  if (slide.file === undefined) {
    console.error('Slide not well configured: file key is missing. (s%:%o)', page.path, slide);
    return '';
  }

  const path = join(hexo.source_dir, '_posts', page.path, 'slides', slide.file);

  return fs.readFileSync(path);
});
