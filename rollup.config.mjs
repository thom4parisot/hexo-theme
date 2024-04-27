import nodePolyfills from 'rollup-plugin-node-polyfills'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { string } from 'rollup-plugin-string'
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'

export default {
  input: {
    'templates': 'source/assets/js/templates.js',
    'slides': 'source/assets/js/slides.js',
  },
  output: {
    format: 'esm',
    dir: 'source/assets/js/',
    entryFileNames: '[name].bundle.js',
    chunkFileNames: 'chunk_[name].js',
  },
  plugins: [
    nodePolyfills(),
    resolve({
      preferBuiltins: false
    }),
    commonjs(),
    json(),
    string({
      include: ['**/*.html', '**/*.ejs']
    }),
    babel({
      babelHelpers: 'runtime',
    }),
  ]
}
