import '../algolia/algoliasearchLite.min.js';

const searchForm = document.querySelector('form[role="search"]');
const algoliaConfig = document.querySelector('meta[property="algolia:search"]').dataset;
const searchField = document.querySelector('form[role="search"] [name="q"]');
const resultsContainer = document.querySelector('.content-results');
const sampleResult = document.querySelector('.content-result[hidden]');

export const executeSearchWith = (query) => {
  const resultsFragment = document.createDocumentFragment();

  window.location = '#search:' + query;
  resultsContainer.innerHTML = '';
  searchForm.dataset.state = 'loading';

  searchForm.dataset.state = 'results';
  resultsContainer.appendChild(resultsFragment);

  return index.search(query, { hitsPerPage: 6 }).then(function(response){
    searchForm.dataset.state = 'loaded';

    response.hits.forEach(function(hit){
      const dom = sampleResult.cloneNode(true);
      dom.removeAttribute('hidden');

      const a = dom.querySelector('a');
      a.href = hit.permalink;
      a.innerText = hit.title;

      const time = dom.querySelector('time');
      const date = new Date(hit.date);
      time.setAttribute('datetime', hit.date);
      time.innerText = date.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
      });

      dom.querySelector('.post__summary').innerHTML = hit.excerpt;
      dom.querySelector('.post__summary').innerHTML = dom.querySelector('.post__summary').innerText;

      resultsFragment.appendChild(dom);
    });
  });
};

if (searchForm) {
  searchForm.dataset.state = 'idle';
  sampleResult.remove();

  const index = algoliasearch(algoliaConfig.applicationId, algoliaConfig.apiKey)
    .initIndex(algoliaConfig.indexName);

  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (searchField.value) {
      executeSearchWith(searchField.value);
    }
    else {
      window.location = '#search';
      searchForm.dataset.state = 'idle';
      resultsContainer.innerHTML = '';
    }
  });
}
