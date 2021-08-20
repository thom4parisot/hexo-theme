'use strict'

const mdItContainer = require('markdown-it-container')

hexo.extend.filter.register('markdown-it:renderer', (parser) => {
  parser.use(mdItContainer, 'ins', {
    render (tokens, idx) {
      const {type, info} = tokens[idx]

      if (type === 'container_ins_open') {
        const [, datetime] = info.match(/datetime="?([\d-]+)"?/)

        return `<ins class="section"${ datetime ? ` datetime="${datetime}"` : ''}>`
      }
      else if (type === 'container_ins_close') {
        return '</ins>\n'
      }
    }
  })
})
