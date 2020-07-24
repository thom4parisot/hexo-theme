'use strict';

const groupBy = require('group-array');

hexo.extend.generator.register('archive_index', function(locals){
  const years = Object.entries(groupBy(
    locals.posts.find({ layout: 'post' }).sort('date', -1).toArray(),
    (el) => el.date.year()
  )).sort((a, b) => b[0] - a[0]);

  return {
    path: 'archives/index.html',
    data: {...locals, years, display_search: true},
    layout: ['archive_index', 'archive'],
  }
});
