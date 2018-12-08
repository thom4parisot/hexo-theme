import ejs from 'ejs';

var searchResult = "<time class=\"metadata\" datetime=\"<%= post.date %>\"><%= new Date(post.date_as_int * 1000).toLocaleDateString(post.lang, {month: 'long', year: 'numeric'}) %></time>\n<div>\n  <a href=\"<%= post.permalink %>\" rel=\"permalink\"><%= post.title %></a>\n  <details>\n    <summary>Display summary</summary>\n    <%- post.excerpt %>\n  </details>\n<div>\n";

var photographyTile = "<article class=\"tile\">\n  <aside class=\"cover is-square is-empty\">\n    <img src=\"<%= post.image %>\" alt=\"\">\n  </aside>\n  <a href=\"<%= post.permalink %>\" rel=\"permalink\"><%= post.title %></a>\n</article>\n";

var searchResultTemplate = ejs.compile(searchResult, {
  client: false
});
var photographyTileTemplate = ejs.compile(photographyTile, {
  client: false
});
var search = function search(data) {
  return searchResultTemplate(data, {});
};
var photography = function photography(data) {
  return photographyTileTemplate(data, {});
};

export { search, photography };
