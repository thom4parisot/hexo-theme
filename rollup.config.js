import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import {string} from 'rollup-plugin-string';

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
    preferConst: true,
  },
  plugins: [
    globals(),
    builtins(),
    resolve({
      preferBuiltins: true
    }),
    string({
      include: '**/*.ejs'
    }),
    commonjs(),
    json(),
    babel({
      babelrc: true,
      runtimeHelpers: true,
    }),
  ]
}
