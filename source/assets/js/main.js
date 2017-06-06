(function(document, context){
  var tag = document.querySelector("link[rel='canonical']");
  var each = (function(){
      var slice = Array.prototype.slice;

      return function(data, callback){
          return slice.call(data).map(callback);
      };
  })();

  // Toggle menu
  var toggleButton = document.getElementById('static-top-navbar-toggle-button');
  if (toggleButton) {
    var toggleMenu = document.getElementById(toggleButton.getAttribute('data-target').slice(1));

    toggleButton.addEventListener('click', function(){
      toggleMenu.classList[toggleMenu.classList.contains('in') ? 'remove' : 'add']('in');
    });
  }

  // Interactive Content
  each(document.querySelectorAll('p.interactive-loading'), function(el){
      el.style.width = el.getAttribute('data-width') + 'px';
      el.style.height = el.getAttribute('data-height') + 'px';

      var loadElement = function loadElement(e){
          var self = this;
          var img = document.createElement('img');

          self.classList.add('loading');

          img.src = self.getAttribute('data-src');
          img.alt = self.innerHTML;

          img.onload = function(){
              each(self.childNodes, function(n){
                  if (n.nodeType === 3){        //nodeName === #text
                      self.removeChild(n);
                  }
              });

              self.removeAttribute('style');
              self.classList.remove('loading');
              self.classList.add('loaded');
          };

          self.appendChild(img);
          self.removeEventListener('click', loadElement);
      };

      el.addEventListener('click', loadElement);
  });

  /* Search */
  var algoliaConfig = document.querySelector('meta[property="algolia:search"]').dataset;
  var searchForm = document.querySelector('form[role="search"]');
  var searchField = searchForm.querySelector('[name="q"]');
  var resultsContainer = document.querySelector('.content-results');
  var sampleResult = document.querySelector('.content-result[hidden]');
  var resultsFragment = document.createDocumentFragment();

  sampleResult.remove();

  var index = algoliasearch(algoliaConfig.applicationId, algoliaConfig.apiKey).initIndex(algoliaConfig.indexName);

  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    resultsContainer.innerHTML = '';

    var query = searchField.value;
    index.search(query, { hitsPerPage: 12 }).then(function(response){
      response.hits.forEach(function(hit){
        var dom = sampleResult.cloneNode(true);
        dom.removeAttribute('hidden');

        var a = dom.querySelector('a');
        a.href = hit.permalink;
        a.innerText = hit.title;

        var date = dom.querySelector('time');
        date.setAttribute('datetime', hit.date);
        date.innerText = hit.date;

        dom.querySelector('.excerpt').innerHTML = hit.excerpt;
        dom.querySelector('.excerpt').innerHTML = dom.querySelector('.excerpt').innerText;

        resultsFragment.appendChild(dom);
      });

      resultsContainer.appendChild(resultsFragment);
    });
  });

  console.log(index)
})(document, window);
