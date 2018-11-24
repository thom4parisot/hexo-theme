import {search, render} from './search.js';
import './comments.js';

document.body.classList.add('js-enabled');

document.addEventListener('DOMContentLoaded', function(e) {
  const query = new URLSearchParams(window.location.search).get('q');
  const searchForm = document.querySelector('#search [role="search"]');
  const searchField = document.querySelector('#search [name="q"]');
  const searchResults = document.querySelector('#search .search-results');

  if (query && searchField) {
    searchField.value = query;
  }

  // resets results when search field is empty
  if (searchField) {
    searchField.addEventListener('change', () => {
      if (searchField.value.trim() === '') {
        searchResults.innerHTML = '';
      }
    });
  }

  const displayResults = (results) => {
    const parser = new DOMParser();
    searchResults.innerHTML = '';
    
    results.forEach(post => {
      const html = parser.parseFromString(render({post}), 'text/html');
      const li = document.createElement('li');
      // li.lang = post.lang;
      li.innerHTML = html.body.innerHTML;
      searchResults.appendChild(li);
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', () => {
      search(searchField.value).then(displayResults);
    });
  }

  if (query) {
    search(query).then(displayResults);
  }
});
