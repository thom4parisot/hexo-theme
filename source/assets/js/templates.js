import ejs from 'ejs';
import searchResult from '../../../layout/common/search-result.ejs';
import photographyTile from '../../../layout/photography/tile.ejs';
// import searchResultString from '../../../layout/common/search-result.ejs';

const searchResultTemplate = ejs.compile(searchResult, {client: false});
const photographyTileTemplate = ejs.compile(photographyTile, {client: false});

export const search = (data) => searchResultTemplate(data, {});
export const photography = (data) => photographyTileTemplate(data, {});
