'use strict';

import ejs from 'ejs';
import searchResultString from '../../../layout/common/search-result.ejs';

const template = ejs.compile(searchResultString, {client: false});

export default (data) => template(data, {});
