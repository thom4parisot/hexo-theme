import '../algolia/algoliasearchLite.min.js';
import render from './search-template.bundle.js';

const searchForm = document.querySelector('form[role="search"]');
const algoliaConfig = document.querySelector('meta[property="algolia:search"]').dataset;
const searchField = document.querySelector('form[role="search"] [name="q"]');
const resultsContainer = document.querySelector('.content-results');
const index = algoliasearch(algoliaConfig.applicationId, algoliaConfig.apiKey)
  .initIndex(algoliaConfig.indexName);

export {render};
export const search = (query) => {
  return index.search(query, { hitsPerPage: 6 }).then(({hits}) => {
    return hits;
  });
};

if (searchForm) {
  searchForm.dataset.state = 'idle';

  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (searchField.value) {
      searchForm.dataset.state = 'loading';
      window.history.pushState({}, "", `?q=${searchField.value}#search`)

      search(searchField.value).then(() => {
        searchForm.dataset.state = 'loaded';
      });
    }
    else {
      window.location = '#search';
      searchForm.dataset.state = 'idle';
    }
  });
}
