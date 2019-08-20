import {compile} from 'ejs';
import searchResult from '../../../layout/common/search-result.ejs';
import photographyTile from '../../../layout/photography/tile.ejs';
// import searchResultString from '../../../layout/common/search-result.ejs';

const searchResultTemplate = compile(searchResult, {client: false});
const photographyTileTemplate = compile(photographyTile, {client: false});

export const search = (data) => searchResultTemplate(data, {});
export const photography = (data) => photographyTileTemplate(data, {});
