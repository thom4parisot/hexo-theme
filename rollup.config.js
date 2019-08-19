import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import string from 'rollup-plugin-string';

export default {
  input: 'source/assets/js/templates.js',
  output: {
    format: 'es',
    file: 'source/assets/js/templates.bundle.js'
  },
  plugins: [
    globals(),
    resolve({
      preferBuiltins: false
    }),
    builtins(),
    commonjs(),
    json(),
    string({
      include: '**/*.ejs'
    }),
    babel({
      babelrc: true,
      runtimeHelpers: true,
    }),
  ]
}
