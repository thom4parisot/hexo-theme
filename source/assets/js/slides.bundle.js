import { c as createCommonjsModule, b as commonjsGlobal, g as getCjsExportFromNamespace } from './chunk__commonjsHelpers.js';

const global$1 = typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};

var reveal = createCommonjsModule(function (module, exports) {
  /*!
   * reveal.js
   * http://revealjs.com
   * MIT licensed
   *
   * Copyright (C) 2019 Hakim El Hattab, http://hakim.se
   */
  (function (root, factory) {
    {
      // Node. Does not work with strict CommonJS.
      module.exports = factory();
    }
  })(commonjsGlobal, function () {

    var Reveal; // The reveal.js version

    var VERSION = '3.8.0';
    var SLIDES_SELECTOR = '.slides section',
        HORIZONTAL_SLIDES_SELECTOR = '.slides>section',
        VERTICAL_SLIDES_SELECTOR = '.slides>section.present>section',
        HOME_SLIDE_SELECTOR = '.slides>section:first-of-type',
        UA = navigator.userAgent,
        // Configuration defaults, can be overridden at initialization time
    config = {
      // The "normal" size of the presentation, aspect ratio will be preserved
      // when the presentation is scaled to fit different resolutions
      width: 960,
      height: 700,
      // Factor of the display size that should remain empty around the content
      margin: 0.04,
      // Bounds for smallest/largest possible scale to apply to content
      minScale: 0.2,
      maxScale: 2.0,
      // Display presentation control arrows
      controls: true,
      // Help the user learn the controls by providing hints, for example by
      // bouncing the down arrow when they first encounter a vertical slide
      controlsTutorial: true,
      // Determines where controls appear, "edges" or "bottom-right"
      controlsLayout: 'bottom-right',
      // Visibility rule for backwards navigation arrows; "faded", "hidden"
      // or "visible"
      controlsBackArrows: 'faded',
      // Display a presentation progress bar
      progress: true,
      // Display the page number of the current slide
      // - true:    Show slide number
      // - false:   Hide slide number
      //
      // Can optionally be set as a string that specifies the number formatting:
      // - "h.v":	  Horizontal . vertical slide number (default)
      // - "h/v":	  Horizontal / vertical slide number
      // - "c":	  Flattened slide number
      // - "c/t":	  Flattened slide number / total slides
      //
      // Alternatively, you can provide a function that returns the slide
      // number for the current slide. The function needs to return an array
      // with one string [slideNumber] or three strings [n1,delimiter,n2].
      // See #formatSlideNumber().
      slideNumber: false,
      // Can be used to limit the contexts in which the slide number appears
      // - "all":      Always show the slide number
      // - "print":    Only when printing to PDF
      // - "speaker":  Only in the speaker view
      showSlideNumber: 'all',
      // Use 1 based indexing for # links to match slide number (default is zero
      // based)
      hashOneBasedIndex: false,
      // Add the current slide number to the URL hash so that reloading the
      // page/copying the URL will return you to the same slide
      hash: false,
      // Push each slide change to the browser history.  Implies `hash: true`
      history: false,
      // Enable keyboard shortcuts for navigation
      keyboard: true,
      // Optional function that blocks keyboard events when retuning false
      keyboardCondition: null,
      // Enable the slide overview mode
      overview: true,
      // Disables the default reveal.js slide layout so that you can use
      // custom CSS layout
      disableLayout: false,
      // Vertical centering of slides
      center: true,
      // Enables touch navigation on devices with touch input
      touch: true,
      // Loop the presentation
      loop: false,
      // Change the presentation direction to be RTL
      rtl: false,
      // Changes the behavior of our navigation directions.
      //
      // "default"
      // Left/right arrow keys step between horizontal slides, up/down
      // arrow keys step between vertical slides. Space key steps through
      // all slides (both horizontal and vertical).
      //
      // "linear"
      // Removes the up/down arrows. Left/right arrows step through all
      // slides (both horizontal and vertical).
      //
      // "grid"
      // When this is enabled, stepping left/right from a vertical stack
      // to an adjacent vertical stack will land you at the same vertical
      // index.
      //
      // Consider a deck with six slides ordered in two vertical stacks:
      // 1.1    2.1
      // 1.2    2.2
      // 1.3    2.3
      //
      // If you're on slide 1.3 and navigate right, you will normally move
      // from 1.3 -> 2.1. If "grid" is used, the same navigation takes you
      // from 1.3 -> 2.3.
      navigationMode: 'default',
      // Randomizes the order of slides each time the presentation loads
      shuffle: false,
      // Turns fragments on and off globally
      fragments: true,
      // Flags whether to include the current fragment in the URL,
      // so that reloading brings you to the same fragment position
      fragmentInURL: false,
      // Flags if the presentation is running in an embedded mode,
      // i.e. contained within a limited portion of the screen
      embedded: false,
      // Flags if we should show a help overlay when the question-mark
      // key is pressed
      help: true,
      // Flags if it should be possible to pause the presentation (blackout)
      pause: true,
      // Flags if speaker notes should be visible to all viewers
      showNotes: false,
      // Global override for autolaying embedded media (video/audio/iframe)
      // - null:   Media will only autoplay if data-autoplay is present
      // - true:   All media will autoplay, regardless of individual setting
      // - false:  No media will autoplay, regardless of individual setting
      autoPlayMedia: null,
      // Global override for preloading lazy-loaded iframes
      // - null:   Iframes with data-src AND data-preload will be loaded when within
      //           the viewDistance, iframes with only data-src will be loaded when visible
      // - true:   All iframes with data-src will be loaded when within the viewDistance
      // - false:  All iframes with data-src will be loaded only when visible
      preloadIframes: null,
      // Controls automatic progression to the next slide
      // - 0:      Auto-sliding only happens if the data-autoslide HTML attribute
      //           is present on the current slide or fragment
      // - 1+:     All slides will progress automatically at the given interval
      // - false:  No auto-sliding, even if data-autoslide is present
      autoSlide: 0,
      // Stop auto-sliding after user input
      autoSlideStoppable: true,
      // Use this method for navigation when auto-sliding (defaults to navigateNext)
      autoSlideMethod: null,
      // Specify the average time in seconds that you think you will spend
      // presenting each slide. This is used to show a pacing timer in the
      // speaker view
      defaultTiming: null,
      // Enable slide navigation via mouse wheel
      mouseWheel: false,
      // Apply a 3D roll to links on hover
      rollingLinks: false,
      // Hides the address bar on mobile devices
      hideAddressBar: true,
      // Opens links in an iframe preview overlay
      // Add `data-preview-link` and `data-preview-link="false"` to customise each link
      // individually
      previewLinks: false,
      // Exposes the reveal.js API through window.postMessage
      postMessage: true,
      // Dispatches all reveal.js events to the parent window through postMessage
      postMessageEvents: false,
      // Focuses body when page changes visibility to ensure keyboard shortcuts work
      focusBodyOnPageVisibilityChange: true,
      // Transition style
      transition: 'slide',
      // none/fade/slide/convex/concave/zoom
      // Transition speed
      transitionSpeed: 'default',
      // default/fast/slow
      // Transition style for full page slide backgrounds
      backgroundTransition: 'fade',
      // none/fade/slide/convex/concave/zoom
      // Parallax background image
      parallaxBackgroundImage: '',
      // CSS syntax, e.g. "a.jpg"
      // Parallax background size
      parallaxBackgroundSize: '',
      // CSS syntax, e.g. "3000px 2000px"
      // Parallax background repeat
      parallaxBackgroundRepeat: '',
      // repeat/repeat-x/repeat-y/no-repeat/initial/inherit
      // Parallax background position
      parallaxBackgroundPosition: '',
      // CSS syntax, e.g. "top left"
      // Amount of pixels to move the parallax background per slide step
      parallaxBackgroundHorizontal: null,
      parallaxBackgroundVertical: null,
      // The maximum number of pages a single slide can expand onto when printing
      // to PDF, unlimited by default
      pdfMaxPagesPerSlide: Number.POSITIVE_INFINITY,
      // Prints each fragment on a separate slide
      pdfSeparateFragments: true,
      // Offset used to reduce the height of content within exported PDF pages.
      // This exists to account for environment differences based on how you
      // print to PDF. CLI printing options, like phantomjs and wkpdf, can end
      // on precisely the total height of the document whereas in-browser
      // printing has to end one pixel before.
      pdfPageHeightOffset: -1,
      // Number of slides away from the current that are visible
      viewDistance: 3,
      // The display mode that will be used to show slides
      display: 'block',
      // Hide cursor if inactive
      hideInactiveCursor: true,
      // Time before the cursor is hidden (in ms)
      hideCursorTime: 5000,
      // Script dependencies to load
      dependencies: []
    },
        // Flags if Reveal.initialize() has been called
    initialized = false,
        // Flags if reveal.js is loaded (has dispatched the 'ready' event)
    loaded = false,
        // Flags if the overview mode is currently active
    overview = false,
        // Holds the dimensions of our overview slides, including margins
    overviewSlideWidth = null,
        overviewSlideHeight = null,
        // The horizontal and vertical index of the currently active slide
    indexh,
        indexv,
        // The previous and current slide HTML elements
    previousSlide,
        currentSlide,
        previousBackground,
        // Remember which directions that the user has navigated towards
    hasNavigatedRight = false,
        hasNavigatedDown = false,
        // Slides may hold a data-state attribute which we pick up and apply
    // as a class to the body. This list contains the combined state of
    // all current slides.
    state = [],
        // The current scale of the presentation (see width/height config)
    scale = 1,
        // CSS transform that is currently applied to the slides container,
    // split into two groups
    slidesTransform = {
      layout: '',
      overview: ''
    },
        // Cached references to DOM elements
    dom = {},
        // A list of registered reveal.js plugins
    plugins = {},
        // List of asynchronously loaded reveal.js dependencies
    asyncDependencies = [],
        // Features supported by the browser, see #checkCapabilities()
    features = {},
        // Client is a mobile device, see #checkCapabilities()
    isMobileDevice,
        // Client is a desktop Chrome, see #checkCapabilities()
    isChrome,
        // Throttles mouse wheel navigation
    lastMouseWheelStep = 0,
        // Delays updates to the URL due to a Chrome thumbnailer bug
    writeURLTimeout = 0,
        // Is the mouse pointer currently hidden from view
    cursorHidden = false,
        // Timeout used to determine when the cursor is inactive
    cursorInactiveTimeout = 0,
        // Flags if the interaction event listeners are bound
    eventsAreBound = false,
        // The current auto-slide duration
    autoSlide = 0,
        // Auto slide properties
    autoSlidePlayer,
        autoSlideTimeout = 0,
        autoSlideStartTime = -1,
        autoSlidePaused = false,
        // Holds information about the currently ongoing touch input
    touch = {
      startX: 0,
      startY: 0,
      startCount: 0,
      captured: false,
      threshold: 40
    },
        // A key:value map of shortcut keyboard keys and descriptions of
    // the actions they trigger, generated in #configure()
    keyboardShortcuts = {},
        // Holds custom key code mappings
    registeredKeyBindings = {};
    /**
     * Starts up the presentation if the client is capable.
     */

    function initialize(options) {
      // Make sure we only initialize once
      if (initialized === true) return;
      initialized = true;
      checkCapabilities();

      if (!features.transforms2d && !features.transforms3d) {
        document.body.setAttribute('class', 'no-transforms'); // Since JS won't be running any further, we load all lazy
        // loading elements upfront

        var images = toArray(document.getElementsByTagName('img')),
            iframes = toArray(document.getElementsByTagName('iframe'));
        var lazyLoadable = images.concat(iframes);

        for (var i = 0, len = lazyLoadable.length; i < len; i++) {
          var element = lazyLoadable[i];

          if (element.getAttribute('data-src')) {
            element.setAttribute('src', element.getAttribute('data-src'));
            element.removeAttribute('data-src');
          }
        } // If the browser doesn't support core features we won't be
        // using JavaScript to control the presentation


        return;
      } // Cache references to key DOM elements


      dom.wrapper = document.querySelector('.reveal');
      dom.slides = document.querySelector('.reveal .slides'); // Force a layout when the whole page, incl fonts, has loaded

      window.addEventListener('load', layout, false);
      var query = Reveal.getQueryHash(); // Do not accept new dependencies via query config to avoid
      // the potential of malicious script injection

      if (typeof query['dependencies'] !== 'undefined') delete query['dependencies']; // Copy options over to our config object

      extend(config, options);
      extend(config, query); // Hide the address bar in mobile browsers

      hideAddressBar(); // Loads dependencies and continues to #start() once done

      load();
    }
    /**
     * Inspect the client to see what it's capable of, this
     * should only happens once per runtime.
     */


    function checkCapabilities() {
      isMobileDevice = /(iphone|ipod|ipad|android)/gi.test(UA);
      isChrome = /chrome/i.test(UA) && !/edge/i.test(UA);
      var testElement = document.createElement('div');
      features.transforms3d = 'WebkitPerspective' in testElement.style || 'MozPerspective' in testElement.style || 'msPerspective' in testElement.style || 'OPerspective' in testElement.style || 'perspective' in testElement.style;
      features.transforms2d = 'WebkitTransform' in testElement.style || 'MozTransform' in testElement.style || 'msTransform' in testElement.style || 'OTransform' in testElement.style || 'transform' in testElement.style;
      features.requestAnimationFrameMethod = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
      features.requestAnimationFrame = typeof features.requestAnimationFrameMethod === 'function';
      features.canvas = !!document.createElement('canvas').getContext; // Transitions in the overview are disabled in desktop and
      // Safari due to lag

      features.overviewTransitions = !/Version\/[\d\.]+.*Safari/.test(UA); // Flags if we should use zoom instead of transform to scale
      // up slides. Zoom produces crisper results but has a lot of
      // xbrowser quirks so we only use it in whitelsited browsers.

      features.zoom = 'zoom' in testElement.style && !isMobileDevice && (isChrome || /Version\/[\d\.]+.*Safari/.test(UA));
    }
    /**
     * Loads the dependencies of reveal.js. Dependencies are
     * defined via the configuration option 'dependencies'
     * and will be loaded prior to starting/binding reveal.js.
     * Some dependencies may have an 'async' flag, if so they
     * will load after reveal.js has been started up.
     */


    function load() {
      var scripts = [],
          scriptsToLoad = 0;
      config.dependencies.forEach(function (s) {
        // Load if there's no condition or the condition is truthy
        if (!s.condition || s.condition()) {
          if (s.async) {
            asyncDependencies.push(s);
          } else {
            scripts.push(s);
          }
        }
      });

      if (scripts.length) {
        scriptsToLoad = scripts.length; // Load synchronous scripts

        scripts.forEach(function (s) {
          loadScript(s.src, function () {
            if (typeof s.callback === 'function') s.callback();

            if (--scriptsToLoad === 0) {
              initPlugins();
            }
          });
        });
      } else {
        initPlugins();
      }
    }
    /**
     * Initializes our plugins and waits for them to be ready
     * before proceeding.
     */


    function initPlugins() {
      var pluginsToInitialize = Object.keys(plugins).length; // If there are no plugins, skip this step

      if (pluginsToInitialize === 0) {
        loadAsyncDependencies();
      } // ... otherwise initialize plugins
      else {
          var afterPlugInitialized = function () {
            if (--pluginsToInitialize === 0) {
              loadAsyncDependencies();
            }
          };

          for (var i in plugins) {
            var plugin = plugins[i]; // If the plugin has an 'init' method, invoke it

            if (typeof plugin.init === 'function') {
              var callback = plugin.init(); // If the plugin returned a Promise, wait for it

              if (callback && typeof callback.then === 'function') {
                callback.then(afterPlugInitialized);
              } else {
                afterPlugInitialized();
              }
            } else {
              afterPlugInitialized();
            }
          }
        }
    }
    /**
     * Loads all async reveal.js dependencies.
     */


    function loadAsyncDependencies() {
      if (asyncDependencies.length) {
        asyncDependencies.forEach(function (s) {
          loadScript(s.src, s.callback);
        });
      }

      start();
    }
    /**
     * Loads a JavaScript file from the given URL and executes it.
     *
     * @param {string} url Address of the .js file to load
     * @param {function} callback Method to invoke when the script
     * has loaded and executed
     */


    function loadScript(url, callback) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = false;
      script.defer = false;
      script.src = url;

      if (callback) {
        // Success callback
        script.onload = script.onreadystatechange = function (event) {
          if (event.type === "load" || /loaded|complete/.test(script.readyState)) {
            // Kill event listeners
            script.onload = script.onreadystatechange = script.onerror = null;
            callback();
          }
        }; // Error callback


        script.onerror = function (err) {
          // Kill event listeners
          script.onload = script.onreadystatechange = script.onerror = null;
          callback(new Error('Failed loading script: ' + script.src + '\n' + err));
        };
      } // Append the script at the end of <head>


      var head = document.querySelector('head');
      head.insertBefore(script, head.lastChild);
    }
    /**
     * Starts up reveal.js by binding input events and navigating
     * to the current URL deeplink if there is one.
     */


    function start() {
      loaded = true; // Make sure we've got all the DOM elements we need

      setupDOM(); // Listen to messages posted to this window

      setupPostMessage(); // Prevent the slides from being scrolled out of view

      setupScrollPrevention(); // Resets all vertical slides so that only the first is visible

      resetVerticalSlides(); // Updates the presentation to match the current configuration values

      configure(); // Read the initial hash

      readURL(); // Update all backgrounds

      updateBackground(true); // Notify listeners that the presentation is ready but use a 1ms
      // timeout to ensure it's not fired synchronously after #initialize()

      setTimeout(function () {
        // Enable transitions now that we're loaded
        dom.slides.classList.remove('no-transition');
        dom.wrapper.classList.add('ready');
        dispatchEvent('ready', {
          'indexh': indexh,
          'indexv': indexv,
          'currentSlide': currentSlide
        });
      }, 1); // Special setup and config is required when printing to PDF

      if (isPrintingPDF()) {
        removeEventListeners(); // The document needs to have loaded for the PDF layout
        // measurements to be accurate

        if (document.readyState === 'complete') {
          setupPDF();
        } else {
          window.addEventListener('load', setupPDF);
        }
      }
    }
    /**
     * Finds and stores references to DOM elements which are
     * required by the presentation. If a required element is
     * not found, it is created.
     */


    function setupDOM() {
      // Prevent transitions while we're loading
      dom.slides.classList.add('no-transition');

      if (isMobileDevice) {
        dom.wrapper.classList.add('no-hover');
      } else {
        dom.wrapper.classList.remove('no-hover');
      }

      if (/iphone/gi.test(UA)) {
        dom.wrapper.classList.add('ua-iphone');
      } else {
        dom.wrapper.classList.remove('ua-iphone');
      } // Background element


      dom.background = createSingletonNode(dom.wrapper, 'div', 'backgrounds', null); // Progress bar

      dom.progress = createSingletonNode(dom.wrapper, 'div', 'progress', '<span></span>');
      dom.progressbar = dom.progress.querySelector('span'); // Arrow controls

      dom.controls = createSingletonNode(dom.wrapper, 'aside', 'controls', '<button class="navigate-left" aria-label="previous slide"><div class="controls-arrow"></div></button>' + '<button class="navigate-right" aria-label="next slide"><div class="controls-arrow"></div></button>' + '<button class="navigate-up" aria-label="above slide"><div class="controls-arrow"></div></button>' + '<button class="navigate-down" aria-label="below slide"><div class="controls-arrow"></div></button>'); // Slide number

      dom.slideNumber = createSingletonNode(dom.wrapper, 'div', 'slide-number', ''); // Element containing notes that are visible to the audience

      dom.speakerNotes = createSingletonNode(dom.wrapper, 'div', 'speaker-notes', null);
      dom.speakerNotes.setAttribute('data-prevent-swipe', '');
      dom.speakerNotes.setAttribute('tabindex', '0'); // Overlay graphic which is displayed during the paused mode

      dom.pauseOverlay = createSingletonNode(dom.wrapper, 'div', 'pause-overlay', config.controls ? '<button class="resume-button">Resume presentation</button>' : null);
      dom.wrapper.setAttribute('role', 'application'); // There can be multiple instances of controls throughout the page

      dom.controlsLeft = toArray(document.querySelectorAll('.navigate-left'));
      dom.controlsRight = toArray(document.querySelectorAll('.navigate-right'));
      dom.controlsUp = toArray(document.querySelectorAll('.navigate-up'));
      dom.controlsDown = toArray(document.querySelectorAll('.navigate-down'));
      dom.controlsPrev = toArray(document.querySelectorAll('.navigate-prev'));
      dom.controlsNext = toArray(document.querySelectorAll('.navigate-next')); // The right and down arrows in the standard reveal.js controls

      dom.controlsRightArrow = dom.controls.querySelector('.navigate-right');
      dom.controlsDownArrow = dom.controls.querySelector('.navigate-down');
      dom.statusDiv = createStatusDiv();
    }
    /**
     * Creates a hidden div with role aria-live to announce the
     * current slide content. Hide the div off-screen to make it
     * available only to Assistive Technologies.
     *
     * @return {HTMLElement}
     */


    function createStatusDiv() {
      var statusDiv = document.getElementById('aria-status-div');

      if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.style.position = 'absolute';
        statusDiv.style.height = '1px';
        statusDiv.style.width = '1px';
        statusDiv.style.overflow = 'hidden';
        statusDiv.style.clip = 'rect( 1px, 1px, 1px, 1px )';
        statusDiv.setAttribute('id', 'aria-status-div');
        statusDiv.setAttribute('aria-live', 'polite');
        statusDiv.setAttribute('aria-atomic', 'true');
        dom.wrapper.appendChild(statusDiv);
      }

      return statusDiv;
    }
    /**
     * Converts the given HTML element into a string of text
     * that can be announced to a screen reader. Hidden
     * elements are excluded.
     */


    function getStatusText(node) {
      var text = ''; // Text node

      if (node.nodeType === 3) {
        text += node.textContent;
      } // Element node
      else if (node.nodeType === 1) {
          var isAriaHidden = node.getAttribute('aria-hidden');
          var isDisplayHidden = window.getComputedStyle(node)['display'] === 'none';

          if (isAriaHidden !== 'true' && !isDisplayHidden) {
            toArray(node.childNodes).forEach(function (child) {
              text += getStatusText(child);
            });
          }
        }

      return text;
    }
    /**
     * Configures the presentation for printing to a static
     * PDF.
     */


    function setupPDF() {
      var slideSize = getComputedSlideSize(window.innerWidth, window.innerHeight); // Dimensions of the PDF pages

      var pageWidth = Math.floor(slideSize.width * (1 + config.margin)),
          pageHeight = Math.floor(slideSize.height * (1 + config.margin)); // Dimensions of slides within the pages

      var slideWidth = slideSize.width,
          slideHeight = slideSize.height; // Let the browser know what page size we want to print

      injectStyleSheet('@page{size:' + pageWidth + 'px ' + pageHeight + 'px; margin: 0px;}'); // Limit the size of certain elements to the dimensions of the slide

      injectStyleSheet('.reveal section>img, .reveal section>video, .reveal section>iframe{max-width: ' + slideWidth + 'px; max-height:' + slideHeight + 'px}');
      document.body.classList.add('print-pdf');
      document.body.style.width = pageWidth + 'px';
      document.body.style.height = pageHeight + 'px'; // Make sure stretch elements fit on slide

      layoutSlideContents(slideWidth, slideHeight); // Add each slide's index as attributes on itself, we need these
      // indices to generate slide numbers below

      toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR)).forEach(function (hslide, h) {
        hslide.setAttribute('data-index-h', h);

        if (hslide.classList.contains('stack')) {
          toArray(hslide.querySelectorAll('section')).forEach(function (vslide, v) {
            vslide.setAttribute('data-index-h', h);
            vslide.setAttribute('data-index-v', v);
          });
        }
      }); // Slide and slide background layout

      toArray(dom.wrapper.querySelectorAll(SLIDES_SELECTOR)).forEach(function (slide) {
        // Vertical stacks are not centred since their section
        // children will be
        if (slide.classList.contains('stack') === false) {
          // Center the slide inside of the page, giving the slide some margin
          var left = (pageWidth - slideWidth) / 2,
              top = (pageHeight - slideHeight) / 2;
          var contentHeight = slide.scrollHeight;
          var numberOfPages = Math.max(Math.ceil(contentHeight / pageHeight), 1); // Adhere to configured pages per slide limit

          numberOfPages = Math.min(numberOfPages, config.pdfMaxPagesPerSlide); // Center slides vertically

          if (numberOfPages === 1 && config.center || slide.classList.contains('center')) {
            top = Math.max((pageHeight - contentHeight) / 2, 0);
          } // Wrap the slide in a page element and hide its overflow
          // so that no page ever flows onto another


          var page = document.createElement('div');
          page.className = 'pdf-page';
          page.style.height = (pageHeight + config.pdfPageHeightOffset) * numberOfPages + 'px';
          slide.parentNode.insertBefore(page, slide);
          page.appendChild(slide); // Position the slide inside of the page

          slide.style.left = left + 'px';
          slide.style.top = top + 'px';
          slide.style.width = slideWidth + 'px';

          if (slide.slideBackgroundElement) {
            page.insertBefore(slide.slideBackgroundElement, slide);
          } // Inject notes if `showNotes` is enabled


          if (config.showNotes) {
            // Are there notes for this slide?
            var notes = getSlideNotes(slide);

            if (notes) {
              var notesSpacing = 8;
              var notesLayout = typeof config.showNotes === 'string' ? config.showNotes : 'inline';
              var notesElement = document.createElement('div');
              notesElement.classList.add('speaker-notes');
              notesElement.classList.add('speaker-notes-pdf');
              notesElement.setAttribute('data-layout', notesLayout);
              notesElement.innerHTML = notes;

              if (notesLayout === 'separate-page') {
                page.parentNode.insertBefore(notesElement, page.nextSibling);
              } else {
                notesElement.style.left = notesSpacing + 'px';
                notesElement.style.bottom = notesSpacing + 'px';
                notesElement.style.width = pageWidth - notesSpacing * 2 + 'px';
                page.appendChild(notesElement);
              }
            }
          } // Inject slide numbers if `slideNumbers` are enabled


          if (config.slideNumber && /all|print/i.test(config.showSlideNumber)) {
            var slideNumberH = parseInt(slide.getAttribute('data-index-h'), 10) + 1,
                slideNumberV = parseInt(slide.getAttribute('data-index-v'), 10) + 1;
            var numberElement = document.createElement('div');
            numberElement.classList.add('slide-number');
            numberElement.classList.add('slide-number-pdf');
            numberElement.innerHTML = formatSlideNumber(slideNumberH, '.', slideNumberV);
            page.appendChild(numberElement);
          } // Copy page and show fragments one after another


          if (config.pdfSeparateFragments) {
            // Each fragment 'group' is an array containing one or more
            // fragments. Multiple fragments that appear at the same time
            // are part of the same group.
            var fragmentGroups = sortFragments(page.querySelectorAll('.fragment'), true);
            var previousFragmentStep;
            var previousPage;
            fragmentGroups.forEach(function (fragments) {
              // Remove 'current-fragment' from the previous group
              if (previousFragmentStep) {
                previousFragmentStep.forEach(function (fragment) {
                  fragment.classList.remove('current-fragment');
                });
              } // Show the fragments for the current index


              fragments.forEach(function (fragment) {
                fragment.classList.add('visible', 'current-fragment');
              }); // Create a separate page for the current fragment state

              var clonedPage = page.cloneNode(true);
              page.parentNode.insertBefore(clonedPage, (previousPage || page).nextSibling);
              previousFragmentStep = fragments;
              previousPage = clonedPage;
            }); // Reset the first/original page so that all fragments are hidden

            fragmentGroups.forEach(function (fragments) {
              fragments.forEach(function (fragment) {
                fragment.classList.remove('visible', 'current-fragment');
              });
            });
          } // Show all fragments
          else {
              toArray(page.querySelectorAll('.fragment:not(.fade-out)')).forEach(function (fragment) {
                fragment.classList.add('visible');
              });
            }
        }
      }); // Notify subscribers that the PDF layout is good to go

      dispatchEvent('pdf-ready');
    }
    /**
     * This is an unfortunate necessity. Some actions – such as
     * an input field being focused in an iframe or using the
     * keyboard to expand text selection beyond the bounds of
     * a slide – can trigger our content to be pushed out of view.
     * This scrolling can not be prevented by hiding overflow in
     * CSS (we already do) so we have to resort to repeatedly
     * checking if the slides have been offset :(
     */


    function setupScrollPrevention() {
      setInterval(function () {
        if (dom.wrapper.scrollTop !== 0 || dom.wrapper.scrollLeft !== 0) {
          dom.wrapper.scrollTop = 0;
          dom.wrapper.scrollLeft = 0;
        }
      }, 1000);
    }
    /**
     * Creates an HTML element and returns a reference to it.
     * If the element already exists the existing instance will
     * be returned.
     *
     * @param {HTMLElement} container
     * @param {string} tagname
     * @param {string} classname
     * @param {string} innerHTML
     *
     * @return {HTMLElement}
     */


    function createSingletonNode(container, tagname, classname, innerHTML) {
      // Find all nodes matching the description
      var nodes = container.querySelectorAll('.' + classname); // Check all matches to find one which is a direct child of
      // the specified container

      for (var i = 0; i < nodes.length; i++) {
        var testNode = nodes[i];

        if (testNode.parentNode === container) {
          return testNode;
        }
      } // If no node was found, create it now


      var node = document.createElement(tagname);
      node.className = classname;

      if (typeof innerHTML === 'string') {
        node.innerHTML = innerHTML;
      }

      container.appendChild(node);
      return node;
    }
    /**
     * Creates the slide background elements and appends them
     * to the background container. One element is created per
     * slide no matter if the given slide has visible background.
     */


    function createBackgrounds() {
      var printMode = isPrintingPDF(); // Clear prior backgrounds

      dom.background.innerHTML = '';
      dom.background.classList.add('no-transition'); // Iterate over all horizontal slides

      toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR)).forEach(function (slideh) {
        var backgroundStack = createBackground(slideh, dom.background); // Iterate over all vertical slides

        toArray(slideh.querySelectorAll('section')).forEach(function (slidev) {
          createBackground(slidev, backgroundStack);
          backgroundStack.classList.add('stack');
        });
      }); // Add parallax background if specified

      if (config.parallaxBackgroundImage) {
        dom.background.style.backgroundImage = 'url("' + config.parallaxBackgroundImage + '")';
        dom.background.style.backgroundSize = config.parallaxBackgroundSize;
        dom.background.style.backgroundRepeat = config.parallaxBackgroundRepeat;
        dom.background.style.backgroundPosition = config.parallaxBackgroundPosition; // Make sure the below properties are set on the element - these properties are
        // needed for proper transitions to be set on the element via CSS. To remove
        // annoying background slide-in effect when the presentation starts, apply
        // these properties after short time delay

        setTimeout(function () {
          dom.wrapper.classList.add('has-parallax-background');
        }, 1);
      } else {
        dom.background.style.backgroundImage = '';
        dom.wrapper.classList.remove('has-parallax-background');
      }
    }
    /**
     * Creates a background for the given slide.
     *
     * @param {HTMLElement} slide
     * @param {HTMLElement} container The element that the background
     * should be appended to
     * @return {HTMLElement} New background div
     */


    function createBackground(slide, container) {
      // Main slide background element
      var element = document.createElement('div');
      element.className = 'slide-background ' + slide.className.replace(/present|past|future/, ''); // Inner background element that wraps images/videos/iframes

      var contentElement = document.createElement('div');
      contentElement.className = 'slide-background-content';
      element.appendChild(contentElement);
      container.appendChild(element);
      slide.slideBackgroundElement = element;
      slide.slideBackgroundContentElement = contentElement; // Syncs the background to reflect all current background settings

      syncBackground(slide);
      return element;
    }
    /**
     * Renders all of the visual properties of a slide background
     * based on the various background attributes.
     *
     * @param {HTMLElement} slide
     */


    function syncBackground(slide) {
      var element = slide.slideBackgroundElement,
          contentElement = slide.slideBackgroundContentElement; // Reset the prior background state in case this is not the
      // initial sync

      slide.classList.remove('has-dark-background');
      slide.classList.remove('has-light-background');
      element.removeAttribute('data-loaded');
      element.removeAttribute('data-background-hash');
      element.removeAttribute('data-background-size');
      element.removeAttribute('data-background-transition');
      element.style.backgroundColor = '';
      contentElement.style.backgroundSize = '';
      contentElement.style.backgroundRepeat = '';
      contentElement.style.backgroundPosition = '';
      contentElement.style.backgroundImage = '';
      contentElement.style.opacity = '';
      contentElement.innerHTML = '';
      var data = {
        background: slide.getAttribute('data-background'),
        backgroundSize: slide.getAttribute('data-background-size'),
        backgroundImage: slide.getAttribute('data-background-image'),
        backgroundVideo: slide.getAttribute('data-background-video'),
        backgroundIframe: slide.getAttribute('data-background-iframe'),
        backgroundColor: slide.getAttribute('data-background-color'),
        backgroundRepeat: slide.getAttribute('data-background-repeat'),
        backgroundPosition: slide.getAttribute('data-background-position'),
        backgroundTransition: slide.getAttribute('data-background-transition'),
        backgroundOpacity: slide.getAttribute('data-background-opacity')
      };

      if (data.background) {
        // Auto-wrap image urls in url(...)
        if (/^(http|file|\/\/)/gi.test(data.background) || /\.(svg|png|jpg|jpeg|gif|bmp)([?#\s]|$)/gi.test(data.background)) {
          slide.setAttribute('data-background-image', data.background);
        } else {
          element.style.background = data.background;
        }
      } // Create a hash for this combination of background settings.
      // This is used to determine when two slide backgrounds are
      // the same.


      if (data.background || data.backgroundColor || data.backgroundImage || data.backgroundVideo || data.backgroundIframe) {
        element.setAttribute('data-background-hash', data.background + data.backgroundSize + data.backgroundImage + data.backgroundVideo + data.backgroundIframe + data.backgroundColor + data.backgroundRepeat + data.backgroundPosition + data.backgroundTransition + data.backgroundOpacity);
      } // Additional and optional background properties


      if (data.backgroundSize) element.setAttribute('data-background-size', data.backgroundSize);
      if (data.backgroundColor) element.style.backgroundColor = data.backgroundColor;
      if (data.backgroundTransition) element.setAttribute('data-background-transition', data.backgroundTransition); // Background image options are set on the content wrapper

      if (data.backgroundSize) contentElement.style.backgroundSize = data.backgroundSize;
      if (data.backgroundRepeat) contentElement.style.backgroundRepeat = data.backgroundRepeat;
      if (data.backgroundPosition) contentElement.style.backgroundPosition = data.backgroundPosition;
      if (data.backgroundOpacity) contentElement.style.opacity = data.backgroundOpacity; // If this slide has a background color, we add a class that
      // signals if it is light or dark. If the slide has no background
      // color, no class will be added

      var contrastColor = data.backgroundColor; // If no bg color was found, check the computed background

      if (!contrastColor) {
        var computedBackgroundStyle = window.getComputedStyle(element);

        if (computedBackgroundStyle && computedBackgroundStyle.backgroundColor) {
          contrastColor = computedBackgroundStyle.backgroundColor;
        }
      }

      if (contrastColor) {
        var rgb = colorToRgb(contrastColor); // Ignore fully transparent backgrounds. Some browsers return
        // rgba(0,0,0,0) when reading the computed background color of
        // an element with no background

        if (rgb && rgb.a !== 0) {
          if (colorBrightness(contrastColor) < 128) {
            slide.classList.add('has-dark-background');
          } else {
            slide.classList.add('has-light-background');
          }
        }
      }
    }
    /**
     * Registers a listener to postMessage events, this makes it
     * possible to call all reveal.js API methods from another
     * window. For example:
     *
     * revealWindow.postMessage( JSON.stringify({
     *   method: 'slide',
     *   args: [ 2 ]
     * }), '*' );
     */


    function setupPostMessage() {
      if (config.postMessage) {
        window.addEventListener('message', function (event) {
          var data = event.data; // Make sure we're dealing with JSON

          if (typeof data === 'string' && data.charAt(0) === '{' && data.charAt(data.length - 1) === '}') {
            data = JSON.parse(data); // Check if the requested method can be found

            if (data.method && typeof Reveal[data.method] === 'function') {
              Reveal[data.method].apply(Reveal, data.args);
            }
          }
        }, false);
      }
    }
    /**
     * Applies the configuration settings from the config
     * object. May be called multiple times.
     *
     * @param {object} options
     */


    function configure(options) {
      var oldTransition = config.transition; // New config options may be passed when this method
      // is invoked through the API after initialization

      if (typeof options === 'object') extend(config, options); // Abort if reveal.js hasn't finished loading, config
      // changes will be applied automatically once loading
      // finishes

      if (loaded === false) return;
      var numberOfSlides = dom.wrapper.querySelectorAll(SLIDES_SELECTOR).length; // Remove the previously configured transition class

      dom.wrapper.classList.remove(oldTransition); // Force linear transition based on browser capabilities

      if (features.transforms3d === false) config.transition = 'linear';
      dom.wrapper.classList.add(config.transition);
      dom.wrapper.setAttribute('data-transition-speed', config.transitionSpeed);
      dom.wrapper.setAttribute('data-background-transition', config.backgroundTransition);
      dom.controls.style.display = config.controls ? 'block' : 'none';
      dom.progress.style.display = config.progress ? 'block' : 'none';
      dom.controls.setAttribute('data-controls-layout', config.controlsLayout);
      dom.controls.setAttribute('data-controls-back-arrows', config.controlsBackArrows);

      if (config.shuffle) {
        shuffle();
      }

      if (config.rtl) {
        dom.wrapper.classList.add('rtl');
      } else {
        dom.wrapper.classList.remove('rtl');
      }

      if (config.center) {
        dom.wrapper.classList.add('center');
      } else {
        dom.wrapper.classList.remove('center');
      } // Exit the paused mode if it was configured off


      if (config.pause === false) {
        resume();
      }

      if (config.showNotes) {
        dom.speakerNotes.setAttribute('data-layout', typeof config.showNotes === 'string' ? config.showNotes : 'inline');
      }

      if (config.mouseWheel) {
        document.addEventListener('DOMMouseScroll', onDocumentMouseScroll, false); // FF

        document.addEventListener('mousewheel', onDocumentMouseScroll, false);
      } else {
        document.removeEventListener('DOMMouseScroll', onDocumentMouseScroll, false); // FF

        document.removeEventListener('mousewheel', onDocumentMouseScroll, false);
      } // Rolling 3D links


      if (config.rollingLinks) {
        enableRollingLinks();
      } else {
        disableRollingLinks();
      } // Auto-hide the mouse pointer when its inactive


      if (config.hideInactiveCursor) {
        document.addEventListener('mousemove', onDocumentCursorActive, false);
        document.addEventListener('mousedown', onDocumentCursorActive, false);
      } else {
        showCursor();
        document.removeEventListener('mousemove', onDocumentCursorActive, false);
        document.removeEventListener('mousedown', onDocumentCursorActive, false);
      } // Iframe link previews


      if (config.previewLinks) {
        enablePreviewLinks();
        disablePreviewLinks('[data-preview-link=false]');
      } else {
        disablePreviewLinks();
        enablePreviewLinks('[data-preview-link]:not([data-preview-link=false])');
      } // Remove existing auto-slide controls


      if (autoSlidePlayer) {
        autoSlidePlayer.destroy();
        autoSlidePlayer = null;
      } // Generate auto-slide controls if needed


      if (numberOfSlides > 1 && config.autoSlide && config.autoSlideStoppable && features.canvas && features.requestAnimationFrame) {
        autoSlidePlayer = new Playback(dom.wrapper, function () {
          return Math.min(Math.max((Date.now() - autoSlideStartTime) / autoSlide, 0), 1);
        });
        autoSlidePlayer.on('click', onAutoSlidePlayerClick);
        autoSlidePaused = false;
      } // When fragments are turned off they should be visible


      if (config.fragments === false) {
        toArray(dom.slides.querySelectorAll('.fragment')).forEach(function (element) {
          element.classList.add('visible');
          element.classList.remove('current-fragment');
        });
      } // Slide numbers


      var slideNumberDisplay = 'none';

      if (config.slideNumber && !isPrintingPDF()) {
        if (config.showSlideNumber === 'all') {
          slideNumberDisplay = 'block';
        } else if (config.showSlideNumber === 'speaker' && isSpeakerNotes()) {
          slideNumberDisplay = 'block';
        }
      }

      dom.slideNumber.style.display = slideNumberDisplay; // Add the navigation mode to the DOM so we can adjust styling

      if (config.navigationMode !== 'default') {
        dom.wrapper.setAttribute('data-navigation-mode', config.navigationMode);
      } else {
        dom.wrapper.removeAttribute('data-navigation-mode');
      } // Define our contextual list of keyboard shortcuts


      if (config.navigationMode === 'linear') {
        keyboardShortcuts['&#8594;  ,  &#8595;  ,  SPACE  ,  N  ,  L  ,  J'] = 'Next slide';
        keyboardShortcuts['&#8592;  ,  &#8593;  ,  P  ,  H  ,  K'] = 'Previous slide';
      } else {
        keyboardShortcuts['N  ,  SPACE'] = 'Next slide';
        keyboardShortcuts['P'] = 'Previous slide';
        keyboardShortcuts['&#8592;  ,  H'] = 'Navigate left';
        keyboardShortcuts['&#8594;  ,  L'] = 'Navigate right';
        keyboardShortcuts['&#8593;  ,  K'] = 'Navigate up';
        keyboardShortcuts['&#8595;  ,  J'] = 'Navigate down';
      }

      keyboardShortcuts['Home  ,  &#8984;/CTRL &#8592;'] = 'First slide';
      keyboardShortcuts['End  ,  &#8984;/CTRL &#8594;'] = 'Last slide';
      keyboardShortcuts['B  ,  .'] = 'Pause';
      keyboardShortcuts['F'] = 'Fullscreen';
      keyboardShortcuts['ESC, O'] = 'Slide overview';
      sync();
    }
    /**
     * Binds all event listeners.
     */


    function addEventListeners() {
      eventsAreBound = true;
      window.addEventListener('hashchange', onWindowHashChange, false);
      window.addEventListener('resize', onWindowResize, false);

      if (config.touch) {
        if ('onpointerdown' in window) {
          // Use W3C pointer events
          dom.wrapper.addEventListener('pointerdown', onPointerDown, false);
          dom.wrapper.addEventListener('pointermove', onPointerMove, false);
          dom.wrapper.addEventListener('pointerup', onPointerUp, false);
        } else if (window.navigator.msPointerEnabled) {
          // IE 10 uses prefixed version of pointer events
          dom.wrapper.addEventListener('MSPointerDown', onPointerDown, false);
          dom.wrapper.addEventListener('MSPointerMove', onPointerMove, false);
          dom.wrapper.addEventListener('MSPointerUp', onPointerUp, false);
        } else {
          // Fall back to touch events
          dom.wrapper.addEventListener('touchstart', onTouchStart, false);
          dom.wrapper.addEventListener('touchmove', onTouchMove, false);
          dom.wrapper.addEventListener('touchend', onTouchEnd, false);
        }
      }

      if (config.keyboard) {
        document.addEventListener('keydown', onDocumentKeyDown, false);
        document.addEventListener('keypress', onDocumentKeyPress, false);
      }

      if (config.progress && dom.progress) {
        dom.progress.addEventListener('click', onProgressClicked, false);
      }

      dom.pauseOverlay.addEventListener('click', resume, false);

      if (config.focusBodyOnPageVisibilityChange) {
        var visibilityChange;

        if ('hidden' in document) {
          visibilityChange = 'visibilitychange';
        } else if ('msHidden' in document) {
          visibilityChange = 'msvisibilitychange';
        } else if ('webkitHidden' in document) {
          visibilityChange = 'webkitvisibilitychange';
        }

        if (visibilityChange) {
          document.addEventListener(visibilityChange, onPageVisibilityChange, false);
        }
      } // Listen to both touch and click events, in case the device
      // supports both


      var pointerEvents = ['touchstart', 'click']; // Only support touch for Android, fixes double navigations in
      // stock browser

      if (UA.match(/android/gi)) {
        pointerEvents = ['touchstart'];
      }

      pointerEvents.forEach(function (eventName) {
        dom.controlsLeft.forEach(function (el) {
          el.addEventListener(eventName, onNavigateLeftClicked, false);
        });
        dom.controlsRight.forEach(function (el) {
          el.addEventListener(eventName, onNavigateRightClicked, false);
        });
        dom.controlsUp.forEach(function (el) {
          el.addEventListener(eventName, onNavigateUpClicked, false);
        });
        dom.controlsDown.forEach(function (el) {
          el.addEventListener(eventName, onNavigateDownClicked, false);
        });
        dom.controlsPrev.forEach(function (el) {
          el.addEventListener(eventName, onNavigatePrevClicked, false);
        });
        dom.controlsNext.forEach(function (el) {
          el.addEventListener(eventName, onNavigateNextClicked, false);
        });
      });
    }
    /**
     * Unbinds all event listeners.
     */


    function removeEventListeners() {
      eventsAreBound = false;
      document.removeEventListener('keydown', onDocumentKeyDown, false);
      document.removeEventListener('keypress', onDocumentKeyPress, false);
      window.removeEventListener('hashchange', onWindowHashChange, false);
      window.removeEventListener('resize', onWindowResize, false);
      dom.wrapper.removeEventListener('pointerdown', onPointerDown, false);
      dom.wrapper.removeEventListener('pointermove', onPointerMove, false);
      dom.wrapper.removeEventListener('pointerup', onPointerUp, false);
      dom.wrapper.removeEventListener('MSPointerDown', onPointerDown, false);
      dom.wrapper.removeEventListener('MSPointerMove', onPointerMove, false);
      dom.wrapper.removeEventListener('MSPointerUp', onPointerUp, false);
      dom.wrapper.removeEventListener('touchstart', onTouchStart, false);
      dom.wrapper.removeEventListener('touchmove', onTouchMove, false);
      dom.wrapper.removeEventListener('touchend', onTouchEnd, false);
      dom.pauseOverlay.removeEventListener('click', resume, false);

      if (config.progress && dom.progress) {
        dom.progress.removeEventListener('click', onProgressClicked, false);
      }

      ['touchstart', 'click'].forEach(function (eventName) {
        dom.controlsLeft.forEach(function (el) {
          el.removeEventListener(eventName, onNavigateLeftClicked, false);
        });
        dom.controlsRight.forEach(function (el) {
          el.removeEventListener(eventName, onNavigateRightClicked, false);
        });
        dom.controlsUp.forEach(function (el) {
          el.removeEventListener(eventName, onNavigateUpClicked, false);
        });
        dom.controlsDown.forEach(function (el) {
          el.removeEventListener(eventName, onNavigateDownClicked, false);
        });
        dom.controlsPrev.forEach(function (el) {
          el.removeEventListener(eventName, onNavigatePrevClicked, false);
        });
        dom.controlsNext.forEach(function (el) {
          el.removeEventListener(eventName, onNavigateNextClicked, false);
        });
      });
    }
    /**
     * Registers a new plugin with this reveal.js instance.
     *
     * reveal.js waits for all regisered plugins to initialize
     * before considering itself ready, as long as the plugin
     * is registered before calling `Reveal.initialize()`.
     */


    function registerPlugin(id, plugin) {
      if (plugins[id] === undefined) {
        plugins[id] = plugin; // If a plugin is registered after reveal.js is loaded,
        // initialize it right away

        if (loaded && typeof plugin.init === 'function') {
          plugin.init();
        }
      } else {
        console.warn('reveal.js: "' + id + '" plugin has already been registered');
      }
    }
    /**
     * Checks if a specific plugin has been registered.
     *
     * @param {String} id Unique plugin identifier
     */


    function hasPlugin(id) {
      return !!plugins[id];
    }
    /**
     * Returns the specific plugin instance, if a plugin
     * with the given ID has been registered.
     *
     * @param {String} id Unique plugin identifier
     */


    function getPlugin(id) {
      return plugins[id];
    }
    /**
     * Add a custom key binding with optional description to
     * be added to the help screen.
     */


    function addKeyBinding(binding, callback) {
      if (typeof binding === 'object' && binding.keyCode) {
        registeredKeyBindings[binding.keyCode] = {
          callback: callback,
          key: binding.key,
          description: binding.description
        };
      } else {
        registeredKeyBindings[binding] = {
          callback: callback,
          key: null,
          description: null
        };
      }
    }
    /**
     * Removes the specified custom key binding.
     */


    function removeKeyBinding(keyCode) {
      delete registeredKeyBindings[keyCode];
    }
    /**
     * Extend object a with the properties of object b.
     * If there's a conflict, object b takes precedence.
     *
     * @param {object} a
     * @param {object} b
     */


    function extend(a, b) {
      for (var i in b) {
        a[i] = b[i];
      }

      return a;
    }
    /**
     * Converts the target object to an array.
     *
     * @param {object} o
     * @return {object[]}
     */


    function toArray(o) {
      return Array.prototype.slice.call(o);
    }
    /**
     * Utility for deserializing a value.
     *
     * @param {*} value
     * @return {*}
     */


    function deserialize(value) {
      if (typeof value === 'string') {
        if (value === 'null') return null;else if (value === 'true') return true;else if (value === 'false') return false;else if (value.match(/^-?[\d\.]+$/)) return parseFloat(value);
      }

      return value;
    }
    /**
     * Applies a CSS transform to the target element.
     *
     * @param {HTMLElement} element
     * @param {string} transform
     */


    function transformElement(element, transform) {
      element.style.WebkitTransform = transform;
      element.style.MozTransform = transform;
      element.style.msTransform = transform;
      element.style.transform = transform;
    }
    /**
     * Applies CSS transforms to the slides container. The container
     * is transformed from two separate sources: layout and the overview
     * mode.
     *
     * @param {object} transforms
     */


    function transformSlides(transforms) {
      // Pick up new transforms from arguments
      if (typeof transforms.layout === 'string') slidesTransform.layout = transforms.layout;
      if (typeof transforms.overview === 'string') slidesTransform.overview = transforms.overview; // Apply the transforms to the slides container

      if (slidesTransform.layout) {
        transformElement(dom.slides, slidesTransform.layout + ' ' + slidesTransform.overview);
      } else {
        transformElement(dom.slides, slidesTransform.overview);
      }
    }
    /**
     * Injects the given CSS styles into the DOM.
     *
     * @param {string} value
     */


    function injectStyleSheet(value) {
      var tag = document.createElement('style');
      tag.type = 'text/css';

      if (tag.styleSheet) {
        tag.styleSheet.cssText = value;
      } else {
        tag.appendChild(document.createTextNode(value));
      }

      document.getElementsByTagName('head')[0].appendChild(tag);
    }
    /**
     * Find the closest parent that matches the given
     * selector.
     *
     * @param {HTMLElement} target The child element
     * @param {String} selector The CSS selector to match
     * the parents against
     *
     * @return {HTMLElement} The matched parent or null
     * if no matching parent was found
     */


    function closestParent(target, selector) {
      var parent = target.parentNode;

      while (parent) {
        // There's some overhead doing this each time, we don't
        // want to rewrite the element prototype but should still
        // be enough to feature detect once at startup...
        var matchesMethod = parent.matches || parent.matchesSelector || parent.msMatchesSelector; // If we find a match, we're all set

        if (matchesMethod && matchesMethod.call(parent, selector)) {
          return parent;
        } // Keep searching


        parent = parent.parentNode;
      }

      return null;
    }
    /**
     * Converts various color input formats to an {r:0,g:0,b:0} object.
     *
     * @param {string} color The string representation of a color
     * @example
     * colorToRgb('#000');
     * @example
     * colorToRgb('#000000');
     * @example
     * colorToRgb('rgb(0,0,0)');
     * @example
     * colorToRgb('rgba(0,0,0)');
     *
     * @return {{r: number, g: number, b: number, [a]: number}|null}
     */


    function colorToRgb(color) {
      var hex3 = color.match(/^#([0-9a-f]{3})$/i);

      if (hex3 && hex3[1]) {
        hex3 = hex3[1];
        return {
          r: parseInt(hex3.charAt(0), 16) * 0x11,
          g: parseInt(hex3.charAt(1), 16) * 0x11,
          b: parseInt(hex3.charAt(2), 16) * 0x11
        };
      }

      var hex6 = color.match(/^#([0-9a-f]{6})$/i);

      if (hex6 && hex6[1]) {
        hex6 = hex6[1];
        return {
          r: parseInt(hex6.substr(0, 2), 16),
          g: parseInt(hex6.substr(2, 2), 16),
          b: parseInt(hex6.substr(4, 2), 16)
        };
      }

      var rgb = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);

      if (rgb) {
        return {
          r: parseInt(rgb[1], 10),
          g: parseInt(rgb[2], 10),
          b: parseInt(rgb[3], 10)
        };
      }

      var rgba = color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\,\s*([\d]+|[\d]*.[\d]+)\s*\)$/i);

      if (rgba) {
        return {
          r: parseInt(rgba[1], 10),
          g: parseInt(rgba[2], 10),
          b: parseInt(rgba[3], 10),
          a: parseFloat(rgba[4])
        };
      }

      return null;
    }
    /**
     * Calculates brightness on a scale of 0-255.
     *
     * @param {string} color See colorToRgb for supported formats.
     * @see {@link colorToRgb}
     */


    function colorBrightness(color) {
      if (typeof color === 'string') color = colorToRgb(color);

      if (color) {
        return (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
      }

      return null;
    }
    /**
     * Returns the remaining height within the parent of the
     * target element.
     *
     * remaining height = [ configured parent height ] - [ current parent height ]
     *
     * @param {HTMLElement} element
     * @param {number} [height]
     */


    function getRemainingHeight(element, height) {
      height = height || 0;

      if (element) {
        var newHeight,
            oldHeight = element.style.height; // Change the .stretch element height to 0 in order find the height of all
        // the other elements

        element.style.height = '0px'; // In Overview mode, the parent (.slide) height is set of 700px.
        // Restore it temporarily to its natural height.

        element.parentNode.style.height = 'auto';
        newHeight = height - element.parentNode.offsetHeight; // Restore the old height, just in case

        element.style.height = oldHeight + 'px'; // Clear the parent (.slide) height. .removeProperty works in IE9+

        element.parentNode.style.removeProperty('height');
        return newHeight;
      }

      return height;
    }
    /**
     * Checks if this instance is being used to print a PDF.
     */


    function isPrintingPDF() {
      return /print-pdf/gi.test(window.location.search);
    }
    /**
     * Hides the address bar if we're on a mobile device.
     */


    function hideAddressBar() {
      if (config.hideAddressBar && isMobileDevice) {
        // Events that should trigger the address bar to hide
        window.addEventListener('load', removeAddressBar, false);
        window.addEventListener('orientationchange', removeAddressBar, false);
      }
    }
    /**
     * Causes the address bar to hide on mobile devices,
     * more vertical space ftw.
     */


    function removeAddressBar() {
      setTimeout(function () {
        window.scrollTo(0, 1);
      }, 10);
    }
    /**
     * Dispatches an event of the specified type from the
     * reveal DOM element.
     */


    function dispatchEvent(type, args) {
      var event = document.createEvent('HTMLEvents', 1, 2);
      event.initEvent(type, true, true);
      extend(event, args);
      dom.wrapper.dispatchEvent(event); // If we're in an iframe, post each reveal.js event to the
      // parent window. Used by the notes plugin

      if (config.postMessageEvents && window.parent !== window.self) {
        window.parent.postMessage(JSON.stringify({
          namespace: 'reveal',
          eventName: type,
          state: getState()
        }), '*');
      }
    }
    /**
     * Wrap all links in 3D goodness.
     */


    function enableRollingLinks() {
      if (features.transforms3d && !('msPerspective' in document.body.style)) {
        var anchors = dom.wrapper.querySelectorAll(SLIDES_SELECTOR + ' a');

        for (var i = 0, len = anchors.length; i < len; i++) {
          var anchor = anchors[i];

          if (anchor.textContent && !anchor.querySelector('*') && (!anchor.className || !anchor.classList.contains(anchor, 'roll'))) {
            var span = document.createElement('span');
            span.setAttribute('data-title', anchor.text);
            span.innerHTML = anchor.innerHTML;
            anchor.classList.add('roll');
            anchor.innerHTML = '';
            anchor.appendChild(span);
          }
        }
      }
    }
    /**
     * Unwrap all 3D links.
     */


    function disableRollingLinks() {
      var anchors = dom.wrapper.querySelectorAll(SLIDES_SELECTOR + ' a.roll');

      for (var i = 0, len = anchors.length; i < len; i++) {
        var anchor = anchors[i];
        var span = anchor.querySelector('span');

        if (span) {
          anchor.classList.remove('roll');
          anchor.innerHTML = span.innerHTML;
        }
      }
    }
    /**
     * Bind preview frame links.
     *
     * @param {string} [selector=a] - selector for anchors
     */


    function enablePreviewLinks(selector) {
      var anchors = toArray(document.querySelectorAll(selector ? selector : 'a'));
      anchors.forEach(function (element) {
        if (/^(http|www)/gi.test(element.getAttribute('href'))) {
          element.addEventListener('click', onPreviewLinkClicked, false);
        }
      });
    }
    /**
     * Unbind preview frame links.
     */


    function disablePreviewLinks(selector) {
      var anchors = toArray(document.querySelectorAll(selector ? selector : 'a'));
      anchors.forEach(function (element) {
        if (/^(http|www)/gi.test(element.getAttribute('href'))) {
          element.removeEventListener('click', onPreviewLinkClicked, false);
        }
      });
    }
    /**
     * Opens a preview window for the target URL.
     *
     * @param {string} url - url for preview iframe src
     */


    function showPreview(url) {
      closeOverlay();
      dom.overlay = document.createElement('div');
      dom.overlay.classList.add('overlay');
      dom.overlay.classList.add('overlay-preview');
      dom.wrapper.appendChild(dom.overlay);
      dom.overlay.innerHTML = ['<header>', '<a class="close" href="#"><span class="icon"></span></a>', '<a class="external" href="' + url + '" target="_blank"><span class="icon"></span></a>', '</header>', '<div class="spinner"></div>', '<div class="viewport">', '<iframe src="' + url + '"></iframe>', '<small class="viewport-inner">', '<span class="x-frame-error">Unable to load iframe. This is likely due to the site\'s policy (x-frame-options).</span>', '</small>', '</div>'].join('');
      dom.overlay.querySelector('iframe').addEventListener('load', function (event) {
        dom.overlay.classList.add('loaded');
      }, false);
      dom.overlay.querySelector('.close').addEventListener('click', function (event) {
        closeOverlay();
        event.preventDefault();
      }, false);
      dom.overlay.querySelector('.external').addEventListener('click', function (event) {
        closeOverlay();
      }, false);
      setTimeout(function () {
        dom.overlay.classList.add('visible');
      }, 1);
    }
    /**
     * Open or close help overlay window.
     *
     * @param {Boolean} [override] Flag which overrides the
     * toggle logic and forcibly sets the desired state. True means
     * help is open, false means it's closed.
     */


    function toggleHelp(override) {
      if (typeof override === 'boolean') {
        override ? showHelp() : closeOverlay();
      } else {
        if (dom.overlay) {
          closeOverlay();
        } else {
          showHelp();
        }
      }
    }
    /**
     * Opens an overlay window with help material.
     */


    function showHelp() {
      if (config.help) {
        closeOverlay();
        dom.overlay = document.createElement('div');
        dom.overlay.classList.add('overlay');
        dom.overlay.classList.add('overlay-help');
        dom.wrapper.appendChild(dom.overlay);
        var html = '<p class="title">Keyboard Shortcuts</p><br/>';
        html += '<table><th>KEY</th><th>ACTION</th>';

        for (var key in keyboardShortcuts) {
          html += '<tr><td>' + key + '</td><td>' + keyboardShortcuts[key] + '</td></tr>';
        } // Add custom key bindings that have associated descriptions


        for (var binding in registeredKeyBindings) {
          if (registeredKeyBindings[binding].key && registeredKeyBindings[binding].description) {
            html += '<tr><td>' + registeredKeyBindings[binding].key + '</td><td>' + registeredKeyBindings[binding].description + '</td></tr>';
          }
        }

        html += '</table>';
        dom.overlay.innerHTML = ['<header>', '<a class="close" href="#"><span class="icon"></span></a>', '</header>', '<div class="viewport">', '<div class="viewport-inner">' + html + '</div>', '</div>'].join('');
        dom.overlay.querySelector('.close').addEventListener('click', function (event) {
          closeOverlay();
          event.preventDefault();
        }, false);
        setTimeout(function () {
          dom.overlay.classList.add('visible');
        }, 1);
      }
    }
    /**
     * Closes any currently open overlay.
     */


    function closeOverlay() {
      if (dom.overlay) {
        dom.overlay.parentNode.removeChild(dom.overlay);
        dom.overlay = null;
      }
    }
    /**
     * Applies JavaScript-controlled layout rules to the
     * presentation.
     */


    function layout() {
      if (dom.wrapper && !isPrintingPDF()) {
        if (!config.disableLayout) {
          // On some mobile devices '100vh' is taller than the visible
          // viewport which leads to part of the presentation being
          // cut off. To work around this we define our own '--vh' custom
          // property where 100x adds up to the correct height.
          //
          // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
          if (isMobileDevice) {
            document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
          }

          var size = getComputedSlideSize();
          var oldScale = scale; // Layout the contents of the slides

          layoutSlideContents(config.width, config.height);
          dom.slides.style.width = size.width + 'px';
          dom.slides.style.height = size.height + 'px'; // Determine scale of content to fit within available space

          scale = Math.min(size.presentationWidth / size.width, size.presentationHeight / size.height); // Respect max/min scale settings

          scale = Math.max(scale, config.minScale);
          scale = Math.min(scale, config.maxScale); // Don't apply any scaling styles if scale is 1

          if (scale === 1) {
            dom.slides.style.zoom = '';
            dom.slides.style.left = '';
            dom.slides.style.top = '';
            dom.slides.style.bottom = '';
            dom.slides.style.right = '';
            transformSlides({
              layout: ''
            });
          } else {
            // Prefer zoom for scaling up so that content remains crisp.
            // Don't use zoom to scale down since that can lead to shifts
            // in text layout/line breaks.
            if (scale > 1 && features.zoom) {
              dom.slides.style.zoom = scale;
              dom.slides.style.left = '';
              dom.slides.style.top = '';
              dom.slides.style.bottom = '';
              dom.slides.style.right = '';
              transformSlides({
                layout: ''
              });
            } // Apply scale transform as a fallback
            else {
                dom.slides.style.zoom = '';
                dom.slides.style.left = '50%';
                dom.slides.style.top = '50%';
                dom.slides.style.bottom = 'auto';
                dom.slides.style.right = 'auto';
                transformSlides({
                  layout: 'translate(-50%, -50%) scale(' + scale + ')'
                });
              }
          } // Select all slides, vertical and horizontal


          var slides = toArray(dom.wrapper.querySelectorAll(SLIDES_SELECTOR));

          for (var i = 0, len = slides.length; i < len; i++) {
            var slide = slides[i]; // Don't bother updating invisible slides

            if (slide.style.display === 'none') {
              continue;
            }

            if (config.center || slide.classList.contains('center')) {
              // Vertical stacks are not centred since their section
              // children will be
              if (slide.classList.contains('stack')) {
                slide.style.top = 0;
              } else {
                slide.style.top = Math.max((size.height - slide.scrollHeight) / 2, 0) + 'px';
              }
            } else {
              slide.style.top = '';
            }
          }

          if (oldScale !== scale) {
            dispatchEvent('resize', {
              'oldScale': oldScale,
              'scale': scale,
              'size': size
            });
          }
        }

        updateProgress();
        updateParallax();

        if (isOverview()) {
          updateOverview();
        }
      }
    }
    /**
     * Applies layout logic to the contents of all slides in
     * the presentation.
     *
     * @param {string|number} width
     * @param {string|number} height
     */


    function layoutSlideContents(width, height) {
      // Handle sizing of elements with the 'stretch' class
      toArray(dom.slides.querySelectorAll('section > .stretch')).forEach(function (element) {
        // Determine how much vertical space we can use
        var remainingHeight = getRemainingHeight(element, height); // Consider the aspect ratio of media elements

        if (/(img|video)/gi.test(element.nodeName)) {
          var nw = element.naturalWidth || element.videoWidth,
              nh = element.naturalHeight || element.videoHeight;
          var es = Math.min(width / nw, remainingHeight / nh);
          element.style.width = nw * es + 'px';
          element.style.height = nh * es + 'px';
        } else {
          element.style.width = width + 'px';
          element.style.height = remainingHeight + 'px';
        }
      });
    }
    /**
     * Calculates the computed pixel size of our slides. These
     * values are based on the width and height configuration
     * options.
     *
     * @param {number} [presentationWidth=dom.wrapper.offsetWidth]
     * @param {number} [presentationHeight=dom.wrapper.offsetHeight]
     */


    function getComputedSlideSize(presentationWidth, presentationHeight) {
      var size = {
        // Slide size
        width: config.width,
        height: config.height,
        // Presentation size
        presentationWidth: presentationWidth || dom.wrapper.offsetWidth,
        presentationHeight: presentationHeight || dom.wrapper.offsetHeight
      }; // Reduce available space by margin

      size.presentationWidth -= size.presentationWidth * config.margin;
      size.presentationHeight -= size.presentationHeight * config.margin; // Slide width may be a percentage of available width

      if (typeof size.width === 'string' && /%$/.test(size.width)) {
        size.width = parseInt(size.width, 10) / 100 * size.presentationWidth;
      } // Slide height may be a percentage of available height


      if (typeof size.height === 'string' && /%$/.test(size.height)) {
        size.height = parseInt(size.height, 10) / 100 * size.presentationHeight;
      }

      return size;
    }
    /**
     * Stores the vertical index of a stack so that the same
     * vertical slide can be selected when navigating to and
     * from the stack.
     *
     * @param {HTMLElement} stack The vertical stack element
     * @param {string|number} [v=0] Index to memorize
     */


    function setPreviousVerticalIndex(stack, v) {
      if (typeof stack === 'object' && typeof stack.setAttribute === 'function') {
        stack.setAttribute('data-previous-indexv', v || 0);
      }
    }
    /**
     * Retrieves the vertical index which was stored using
     * #setPreviousVerticalIndex() or 0 if no previous index
     * exists.
     *
     * @param {HTMLElement} stack The vertical stack element
     */


    function getPreviousVerticalIndex(stack) {
      if (typeof stack === 'object' && typeof stack.setAttribute === 'function' && stack.classList.contains('stack')) {
        // Prefer manually defined start-indexv
        var attributeName = stack.hasAttribute('data-start-indexv') ? 'data-start-indexv' : 'data-previous-indexv';
        return parseInt(stack.getAttribute(attributeName) || 0, 10);
      }

      return 0;
    }
    /**
     * Displays the overview of slides (quick nav) by scaling
     * down and arranging all slide elements.
     */


    function activateOverview() {
      // Only proceed if enabled in config
      if (config.overview && !isOverview()) {
        overview = true;
        dom.wrapper.classList.add('overview');
        dom.wrapper.classList.remove('overview-deactivating');

        if (features.overviewTransitions) {
          setTimeout(function () {
            dom.wrapper.classList.add('overview-animated');
          }, 1);
        } // Don't auto-slide while in overview mode


        cancelAutoSlide(); // Move the backgrounds element into the slide container to
        // that the same scaling is applied

        dom.slides.appendChild(dom.background); // Clicking on an overview slide navigates to it

        toArray(dom.wrapper.querySelectorAll(SLIDES_SELECTOR)).forEach(function (slide) {
          if (!slide.classList.contains('stack')) {
            slide.addEventListener('click', onOverviewSlideClicked, true);
          }
        }); // Calculate slide sizes

        var margin = 70;
        var slideSize = getComputedSlideSize();
        overviewSlideWidth = slideSize.width + margin;
        overviewSlideHeight = slideSize.height + margin; // Reverse in RTL mode

        if (config.rtl) {
          overviewSlideWidth = -overviewSlideWidth;
        }

        updateSlidesVisibility();
        layoutOverview();
        updateOverview();
        layout(); // Notify observers of the overview showing

        dispatchEvent('overviewshown', {
          'indexh': indexh,
          'indexv': indexv,
          'currentSlide': currentSlide
        });
      }
    }
    /**
     * Uses CSS transforms to position all slides in a grid for
     * display inside of the overview mode.
     */


    function layoutOverview() {
      // Layout slides
      toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR)).forEach(function (hslide, h) {
        hslide.setAttribute('data-index-h', h);
        transformElement(hslide, 'translate3d(' + h * overviewSlideWidth + 'px, 0, 0)');

        if (hslide.classList.contains('stack')) {
          toArray(hslide.querySelectorAll('section')).forEach(function (vslide, v) {
            vslide.setAttribute('data-index-h', h);
            vslide.setAttribute('data-index-v', v);
            transformElement(vslide, 'translate3d(0, ' + v * overviewSlideHeight + 'px, 0)');
          });
        }
      }); // Layout slide backgrounds

      toArray(dom.background.childNodes).forEach(function (hbackground, h) {
        transformElement(hbackground, 'translate3d(' + h * overviewSlideWidth + 'px, 0, 0)');
        toArray(hbackground.querySelectorAll('.slide-background')).forEach(function (vbackground, v) {
          transformElement(vbackground, 'translate3d(0, ' + v * overviewSlideHeight + 'px, 0)');
        });
      });
    }
    /**
     * Moves the overview viewport to the current slides.
     * Called each time the current slide changes.
     */


    function updateOverview() {
      var vmin = Math.min(window.innerWidth, window.innerHeight);
      var scale = Math.max(vmin / 5, 150) / vmin;
      transformSlides({
        overview: ['scale(' + scale + ')', 'translateX(' + -indexh * overviewSlideWidth + 'px)', 'translateY(' + -indexv * overviewSlideHeight + 'px)'].join(' ')
      });
    }
    /**
     * Exits the slide overview and enters the currently
     * active slide.
     */


    function deactivateOverview() {
      // Only proceed if enabled in config
      if (config.overview) {
        overview = false;
        dom.wrapper.classList.remove('overview');
        dom.wrapper.classList.remove('overview-animated'); // Temporarily add a class so that transitions can do different things
        // depending on whether they are exiting/entering overview, or just
        // moving from slide to slide

        dom.wrapper.classList.add('overview-deactivating');
        setTimeout(function () {
          dom.wrapper.classList.remove('overview-deactivating');
        }, 1); // Move the background element back out

        dom.wrapper.appendChild(dom.background); // Clean up changes made to slides

        toArray(dom.wrapper.querySelectorAll(SLIDES_SELECTOR)).forEach(function (slide) {
          transformElement(slide, '');
          slide.removeEventListener('click', onOverviewSlideClicked, true);
        }); // Clean up changes made to backgrounds

        toArray(dom.background.querySelectorAll('.slide-background')).forEach(function (background) {
          transformElement(background, '');
        });
        transformSlides({
          overview: ''
        });
        slide(indexh, indexv);
        layout();
        cueAutoSlide(); // Notify observers of the overview hiding

        dispatchEvent('overviewhidden', {
          'indexh': indexh,
          'indexv': indexv,
          'currentSlide': currentSlide
        });
      }
    }
    /**
     * Toggles the slide overview mode on and off.
     *
     * @param {Boolean} [override] Flag which overrides the
     * toggle logic and forcibly sets the desired state. True means
     * overview is open, false means it's closed.
     */


    function toggleOverview(override) {
      if (typeof override === 'boolean') {
        override ? activateOverview() : deactivateOverview();
      } else {
        isOverview() ? deactivateOverview() : activateOverview();
      }
    }
    /**
     * Checks if the overview is currently active.
     *
     * @return {Boolean} true if the overview is active,
     * false otherwise
     */


    function isOverview() {
      return overview;
    }
    /**
     * Return a hash URL that will resolve to the current slide location.
     */


    function locationHash() {
      var url = '/'; // Attempt to create a named link based on the slide's ID

      var id = currentSlide ? currentSlide.getAttribute('id') : null;

      if (id) {
        id = encodeURIComponent(id);
      }

      var indexf;

      if (config.fragmentInURL) {
        indexf = getIndices().f;
      } // If the current slide has an ID, use that as a named link,
      // but we don't support named links with a fragment index


      if (typeof id === 'string' && id.length && indexf === undefined) {
        url = '/' + id;
      } // Otherwise use the /h/v index
      else {
          var hashIndexBase = config.hashOneBasedIndex ? 1 : 0;
          if (indexh > 0 || indexv > 0 || indexf !== undefined) url += indexh + hashIndexBase;
          if (indexv > 0 || indexf !== undefined) url += '/' + (indexv + hashIndexBase);
          if (indexf !== undefined) url += '/' + indexf;
        }

      return url;
    }
    /**
     * Checks if the current or specified slide is vertical
     * (nested within another slide).
     *
     * @param {HTMLElement} [slide=currentSlide] The slide to check
     * orientation of
     * @return {Boolean}
     */


    function isVerticalSlide(slide) {
      // Prefer slide argument, otherwise use current slide
      slide = slide ? slide : currentSlide;
      return slide && slide.parentNode && !!slide.parentNode.nodeName.match(/section/i);
    }
    /**
     * Handling the fullscreen functionality via the fullscreen API
     *
     * @see http://fullscreen.spec.whatwg.org/
     * @see https://developer.mozilla.org/en-US/docs/DOM/Using_fullscreen_mode
     */


    function enterFullscreen() {
      var element = document.documentElement; // Check which implementation is available

      var requestMethod = element.requestFullscreen || element.webkitRequestFullscreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen;

      if (requestMethod) {
        requestMethod.apply(element);
      }
    }
    /**
     * Shows the mouse pointer after it has been hidden with
     * #hideCursor.
     */


    function showCursor() {
      if (cursorHidden) {
        cursorHidden = false;
        dom.wrapper.style.cursor = '';
      }
    }
    /**
     * Hides the mouse pointer when it's on top of the .reveal
     * container.
     */


    function hideCursor() {
      if (cursorHidden === false) {
        cursorHidden = true;
        dom.wrapper.style.cursor = 'none';
      }
    }
    /**
     * Enters the paused mode which fades everything on screen to
     * black.
     */


    function pause() {
      if (config.pause) {
        var wasPaused = dom.wrapper.classList.contains('paused');
        cancelAutoSlide();
        dom.wrapper.classList.add('paused');

        if (wasPaused === false) {
          dispatchEvent('paused');
        }
      }
    }
    /**
     * Exits from the paused mode.
     */


    function resume() {
      var wasPaused = dom.wrapper.classList.contains('paused');
      dom.wrapper.classList.remove('paused');
      cueAutoSlide();

      if (wasPaused) {
        dispatchEvent('resumed');
      }
    }
    /**
     * Toggles the paused mode on and off.
     */


    function togglePause(override) {
      if (typeof override === 'boolean') {
        override ? pause() : resume();
      } else {
        isPaused() ? resume() : pause();
      }
    }
    /**
     * Checks if we are currently in the paused mode.
     *
     * @return {Boolean}
     */


    function isPaused() {
      return dom.wrapper.classList.contains('paused');
    }
    /**
     * Toggles the auto slide mode on and off.
     *
     * @param {Boolean} [override] Flag which sets the desired state.
     * True means autoplay starts, false means it stops.
     */


    function toggleAutoSlide(override) {
      if (typeof override === 'boolean') {
        override ? resumeAutoSlide() : pauseAutoSlide();
      } else {
        autoSlidePaused ? resumeAutoSlide() : pauseAutoSlide();
      }
    }
    /**
     * Checks if the auto slide mode is currently on.
     *
     * @return {Boolean}
     */


    function isAutoSliding() {
      return !!(autoSlide && !autoSlidePaused);
    }
    /**
     * Steps from the current point in the presentation to the
     * slide which matches the specified horizontal and vertical
     * indices.
     *
     * @param {number} [h=indexh] Horizontal index of the target slide
     * @param {number} [v=indexv] Vertical index of the target slide
     * @param {number} [f] Index of a fragment within the
     * target slide to activate
     * @param {number} [o] Origin for use in multimaster environments
     */


    function slide(h, v, f, o) {
      // Remember where we were at before
      previousSlide = currentSlide; // Query all horizontal slides in the deck

      var horizontalSlides = dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR); // Abort if there are no slides

      if (horizontalSlides.length === 0) return; // If no vertical index is specified and the upcoming slide is a
      // stack, resume at its previous vertical index

      if (v === undefined && !isOverview()) {
        v = getPreviousVerticalIndex(horizontalSlides[h]);
      } // If we were on a vertical stack, remember what vertical index
      // it was on so we can resume at the same position when returning


      if (previousSlide && previousSlide.parentNode && previousSlide.parentNode.classList.contains('stack')) {
        setPreviousVerticalIndex(previousSlide.parentNode, indexv);
      } // Remember the state before this slide


      var stateBefore = state.concat(); // Reset the state array

      state.length = 0;
      var indexhBefore = indexh || 0,
          indexvBefore = indexv || 0; // Activate and transition to the new slide

      indexh = updateSlides(HORIZONTAL_SLIDES_SELECTOR, h === undefined ? indexh : h);
      indexv = updateSlides(VERTICAL_SLIDES_SELECTOR, v === undefined ? indexv : v); // Update the visibility of slides now that the indices have changed

      updateSlidesVisibility();
      layout(); // Update the overview if it's currently active

      if (isOverview()) {
        updateOverview();
      } // Find the current horizontal slide and any possible vertical slides
      // within it


      var currentHorizontalSlide = horizontalSlides[indexh],
          currentVerticalSlides = currentHorizontalSlide.querySelectorAll('section'); // Store references to the previous and current slides

      currentSlide = currentVerticalSlides[indexv] || currentHorizontalSlide; // Show fragment, if specified

      if (typeof f !== 'undefined') {
        navigateFragment(f);
      } // Dispatch an event if the slide changed


      var slideChanged = indexh !== indexhBefore || indexv !== indexvBefore;

      if (!slideChanged) {
        // Ensure that the previous slide is never the same as the current
        previousSlide = null;
      } // Solves an edge case where the previous slide maintains the
      // 'present' class when navigating between adjacent vertical
      // stacks


      if (previousSlide && previousSlide !== currentSlide) {
        previousSlide.classList.remove('present');
        previousSlide.setAttribute('aria-hidden', 'true'); // Reset all slides upon navigate to home
        // Issue: #285

        if (dom.wrapper.querySelector(HOME_SLIDE_SELECTOR).classList.contains('present')) {
          // Launch async task
          setTimeout(function () {
            var slides = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR + '.stack')),
                i;

            for (i in slides) {
              if (slides[i]) {
                // Reset stack
                setPreviousVerticalIndex(slides[i], 0);
              }
            }
          }, 0);
        }
      } // Apply the new state


      stateLoop: for (var i = 0, len = state.length; i < len; i++) {
        // Check if this state existed on the previous slide. If it
        // did, we will avoid adding it repeatedly
        for (var j = 0; j < stateBefore.length; j++) {
          if (stateBefore[j] === state[i]) {
            stateBefore.splice(j, 1);
            continue stateLoop;
          }
        }

        document.documentElement.classList.add(state[i]); // Dispatch custom event matching the state's name

        dispatchEvent(state[i]);
      } // Clean up the remains of the previous state


      while (stateBefore.length) {
        document.documentElement.classList.remove(stateBefore.pop());
      }

      if (slideChanged) {
        dispatchEvent('slidechanged', {
          'indexh': indexh,
          'indexv': indexv,
          'previousSlide': previousSlide,
          'currentSlide': currentSlide,
          'origin': o
        });
      } // Handle embedded content


      if (slideChanged || !previousSlide) {
        stopEmbeddedContent(previousSlide);
        startEmbeddedContent(currentSlide);
      } // Announce the current slide contents, for screen readers


      dom.statusDiv.textContent = getStatusText(currentSlide);
      updateControls();
      updateProgress();
      updateBackground();
      updateParallax();
      updateSlideNumber();
      updateNotes();
      updateFragments(); // Update the URL hash

      writeURL();
      cueAutoSlide();
    }
    /**
     * Syncs the presentation with the current DOM. Useful
     * when new slides or control elements are added or when
     * the configuration has changed.
     */


    function sync() {
      // Subscribe to input
      removeEventListeners();
      addEventListeners(); // Force a layout to make sure the current config is accounted for

      layout(); // Reflect the current autoSlide value

      autoSlide = config.autoSlide; // Start auto-sliding if it's enabled

      cueAutoSlide(); // Re-create the slide backgrounds

      createBackgrounds(); // Write the current hash to the URL

      writeURL();
      sortAllFragments();
      updateControls();
      updateProgress();
      updateSlideNumber();
      updateSlidesVisibility();
      updateBackground(true);
      updateNotesVisibility();
      updateNotes();
      formatEmbeddedContent(); // Start or stop embedded content depending on global config

      if (config.autoPlayMedia === false) {
        stopEmbeddedContent(currentSlide, {
          unloadIframes: false
        });
      } else {
        startEmbeddedContent(currentSlide);
      }

      if (isOverview()) {
        layoutOverview();
      }
    }
    /**
     * Updates reveal.js to keep in sync with new slide attributes. For
     * example, if you add a new `data-background-image` you can call
     * this to have reveal.js render the new background image.
     *
     * Similar to #sync() but more efficient when you only need to
     * refresh a specific slide.
     *
     * @param {HTMLElement} slide
     */


    function syncSlide(slide) {
      // Default to the current slide
      slide = slide || currentSlide;
      syncBackground(slide);
      syncFragments(slide);
      updateBackground();
      updateNotes();
      loadSlide(slide);
    }
    /**
     * Formats the fragments on the given slide so that they have
     * valid indices. Call this if fragments are changed in the DOM
     * after reveal.js has already initialized.
     *
     * @param {HTMLElement} slide
     * @return {Array} a list of the HTML fragments that were synced
     */


    function syncFragments(slide) {
      // Default to the current slide
      slide = slide || currentSlide;
      return sortFragments(slide.querySelectorAll('.fragment'));
    }
    /**
     * Resets all vertical slides so that only the first
     * is visible.
     */


    function resetVerticalSlides() {
      var horizontalSlides = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR));
      horizontalSlides.forEach(function (horizontalSlide) {
        var verticalSlides = toArray(horizontalSlide.querySelectorAll('section'));
        verticalSlides.forEach(function (verticalSlide, y) {
          if (y > 0) {
            verticalSlide.classList.remove('present');
            verticalSlide.classList.remove('past');
            verticalSlide.classList.add('future');
            verticalSlide.setAttribute('aria-hidden', 'true');
          }
        });
      });
    }
    /**
     * Sorts and formats all of fragments in the
     * presentation.
     */


    function sortAllFragments() {
      var horizontalSlides = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR));
      horizontalSlides.forEach(function (horizontalSlide) {
        var verticalSlides = toArray(horizontalSlide.querySelectorAll('section'));
        verticalSlides.forEach(function (verticalSlide, y) {
          sortFragments(verticalSlide.querySelectorAll('.fragment'));
        });
        if (verticalSlides.length === 0) sortFragments(horizontalSlide.querySelectorAll('.fragment'));
      });
    }
    /**
     * Randomly shuffles all slides in the deck.
     */


    function shuffle() {
      var slides = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR));
      slides.forEach(function (slide) {
        // Insert this slide next to another random slide. This may
        // cause the slide to insert before itself but that's fine.
        dom.slides.insertBefore(slide, slides[Math.floor(Math.random() * slides.length)]);
      });
    }
    /**
     * Updates one dimension of slides by showing the slide
     * with the specified index.
     *
     * @param {string} selector A CSS selector that will fetch
     * the group of slides we are working with
     * @param {number} index The index of the slide that should be
     * shown
     *
     * @return {number} The index of the slide that is now shown,
     * might differ from the passed in index if it was out of
     * bounds.
     */


    function updateSlides(selector, index) {
      // Select all slides and convert the NodeList result to
      // an array
      var slides = toArray(dom.wrapper.querySelectorAll(selector)),
          slidesLength = slides.length;
      var printMode = isPrintingPDF();

      if (slidesLength) {
        // Should the index loop?
        if (config.loop) {
          index %= slidesLength;

          if (index < 0) {
            index = slidesLength + index;
          }
        } // Enforce max and minimum index bounds


        index = Math.max(Math.min(index, slidesLength - 1), 0);

        for (var i = 0; i < slidesLength; i++) {
          var element = slides[i];
          var reverse = config.rtl && !isVerticalSlide(element);
          element.classList.remove('past');
          element.classList.remove('present');
          element.classList.remove('future'); // http://www.w3.org/html/wg/drafts/html/master/editing.html#the-hidden-attribute

          element.setAttribute('hidden', '');
          element.setAttribute('aria-hidden', 'true'); // If this element contains vertical slides

          if (element.querySelector('section')) {
            element.classList.add('stack');
          } // If we're printing static slides, all slides are "present"


          if (printMode) {
            element.classList.add('present');
            continue;
          }

          if (i < index) {
            // Any element previous to index is given the 'past' class
            element.classList.add(reverse ? 'future' : 'past');

            if (config.fragments) {
              // Show all fragments in prior slides
              toArray(element.querySelectorAll('.fragment')).forEach(function (fragment) {
                fragment.classList.add('visible');
                fragment.classList.remove('current-fragment');
              });
            }
          } else if (i > index) {
            // Any element subsequent to index is given the 'future' class
            element.classList.add(reverse ? 'past' : 'future');

            if (config.fragments) {
              // Hide all fragments in future slides
              toArray(element.querySelectorAll('.fragment.visible')).forEach(function (fragment) {
                fragment.classList.remove('visible');
                fragment.classList.remove('current-fragment');
              });
            }
          }
        } // Mark the current slide as present


        slides[index].classList.add('present');
        slides[index].removeAttribute('hidden');
        slides[index].removeAttribute('aria-hidden'); // If this slide has a state associated with it, add it
        // onto the current state of the deck

        var slideState = slides[index].getAttribute('data-state');

        if (slideState) {
          state = state.concat(slideState.split(' '));
        }
      } else {
        // Since there are no slides we can't be anywhere beyond the
        // zeroth index
        index = 0;
      }

      return index;
    }
    /**
     * Optimization method; hide all slides that are far away
     * from the present slide.
     */


    function updateSlidesVisibility() {
      // Select all slides and convert the NodeList result to
      // an array
      var horizontalSlides = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR)),
          horizontalSlidesLength = horizontalSlides.length,
          distanceX,
          distanceY;

      if (horizontalSlidesLength && typeof indexh !== 'undefined') {
        // The number of steps away from the present slide that will
        // be visible
        var viewDistance = isOverview() ? 10 : config.viewDistance; // Limit view distance on weaker devices

        if (isMobileDevice) {
          viewDistance = isOverview() ? 6 : 2;
        } // All slides need to be visible when exporting to PDF


        if (isPrintingPDF()) {
          viewDistance = Number.MAX_VALUE;
        }

        for (var x = 0; x < horizontalSlidesLength; x++) {
          var horizontalSlide = horizontalSlides[x];
          var verticalSlides = toArray(horizontalSlide.querySelectorAll('section')),
              verticalSlidesLength = verticalSlides.length; // Determine how far away this slide is from the present

          distanceX = Math.abs((indexh || 0) - x) || 0; // If the presentation is looped, distance should measure
          // 1 between the first and last slides

          if (config.loop) {
            distanceX = Math.abs(((indexh || 0) - x) % (horizontalSlidesLength - viewDistance)) || 0;
          } // Show the horizontal slide if it's within the view distance


          if (distanceX < viewDistance) {
            loadSlide(horizontalSlide);
          } else {
            unloadSlide(horizontalSlide);
          }

          if (verticalSlidesLength) {
            var oy = getPreviousVerticalIndex(horizontalSlide);

            for (var y = 0; y < verticalSlidesLength; y++) {
              var verticalSlide = verticalSlides[y];
              distanceY = x === (indexh || 0) ? Math.abs((indexv || 0) - y) : Math.abs(y - oy);

              if (distanceX + distanceY < viewDistance) {
                loadSlide(verticalSlide);
              } else {
                unloadSlide(verticalSlide);
              }
            }
          }
        } // Flag if there are ANY vertical slides, anywhere in the deck


        if (dom.wrapper.querySelectorAll('.slides>section>section').length) {
          dom.wrapper.classList.add('has-vertical-slides');
        } else {
          dom.wrapper.classList.remove('has-vertical-slides');
        } // Flag if there are ANY horizontal slides, anywhere in the deck


        if (dom.wrapper.querySelectorAll('.slides>section').length > 1) {
          dom.wrapper.classList.add('has-horizontal-slides');
        } else {
          dom.wrapper.classList.remove('has-horizontal-slides');
        }
      }
    }
    /**
     * Pick up notes from the current slide and display them
     * to the viewer.
     *
     * @see {@link config.showNotes}
     */


    function updateNotes() {
      if (config.showNotes && dom.speakerNotes && currentSlide && !isPrintingPDF()) {
        dom.speakerNotes.innerHTML = getSlideNotes() || '<span class="notes-placeholder">No notes on this slide.</span>';
      }
    }
    /**
     * Updates the visibility of the speaker notes sidebar that
     * is used to share annotated slides. The notes sidebar is
     * only visible if showNotes is true and there are notes on
     * one or more slides in the deck.
     */


    function updateNotesVisibility() {
      if (config.showNotes && hasNotes()) {
        dom.wrapper.classList.add('show-notes');
      } else {
        dom.wrapper.classList.remove('show-notes');
      }
    }
    /**
     * Checks if there are speaker notes for ANY slide in the
     * presentation.
     */


    function hasNotes() {
      return dom.slides.querySelectorAll('[data-notes], aside.notes').length > 0;
    }
    /**
     * Updates the progress bar to reflect the current slide.
     */


    function updateProgress() {
      // Update progress if enabled
      if (config.progress && dom.progressbar) {
        dom.progressbar.style.width = getProgress() * dom.wrapper.offsetWidth + 'px';
      }
    }
    /**
     * Updates the slide number to match the current slide.
     */


    function updateSlideNumber() {
      // Update slide number if enabled
      if (config.slideNumber && dom.slideNumber) {
        var value;
        var format = 'h.v';

        if (typeof config.slideNumber === 'function') {
          value = config.slideNumber();
        } else {
          // Check if a custom number format is available
          if (typeof config.slideNumber === 'string') {
            format = config.slideNumber;
          } // If there are ONLY vertical slides in this deck, always use
          // a flattened slide number


          if (!/c/.test(format) && dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR).length === 1) {
            format = 'c';
          }

          value = [];

          switch (format) {
            case 'c':
              value.push(getSlidePastCount() + 1);
              break;

            case 'c/t':
              value.push(getSlidePastCount() + 1, '/', getTotalSlides());
              break;

            case 'h/v':
              value.push(indexh + 1);
              if (isVerticalSlide()) value.push('/', indexv + 1);
              break;

            default:
              value.push(indexh + 1);
              if (isVerticalSlide()) value.push('.', indexv + 1);
          }
        }

        dom.slideNumber.innerHTML = formatSlideNumber(value[0], value[1], value[2]);
      }
    }
    /**
     * Applies HTML formatting to a slide number before it's
     * written to the DOM.
     *
     * @param {number} a Current slide
     * @param {string} delimiter Character to separate slide numbers
     * @param {(number|*)} b Total slides
     * @return {string} HTML string fragment
     */


    function formatSlideNumber(a, delimiter, b) {
      var url = '#' + locationHash();

      if (typeof b === 'number' && !isNaN(b)) {
        return '<a href="' + url + '">' + '<span class="slide-number-a">' + a + '</span>' + '<span class="slide-number-delimiter">' + delimiter + '</span>' + '<span class="slide-number-b">' + b + '</span>' + '</a>';
      } else {
        return '<a href="' + url + '">' + '<span class="slide-number-a">' + a + '</span>' + '</a>';
      }
    }
    /**
     * Updates the state of all control/navigation arrows.
     */


    function updateControls() {
      var routes = availableRoutes();
      var fragments = availableFragments(); // Remove the 'enabled' class from all directions

      dom.controlsLeft.concat(dom.controlsRight).concat(dom.controlsUp).concat(dom.controlsDown).concat(dom.controlsPrev).concat(dom.controlsNext).forEach(function (node) {
        node.classList.remove('enabled');
        node.classList.remove('fragmented'); // Set 'disabled' attribute on all directions

        node.setAttribute('disabled', 'disabled');
      }); // Add the 'enabled' class to the available routes; remove 'disabled' attribute to enable buttons

      if (routes.left) dom.controlsLeft.forEach(function (el) {
        el.classList.add('enabled');
        el.removeAttribute('disabled');
      });
      if (routes.right) dom.controlsRight.forEach(function (el) {
        el.classList.add('enabled');
        el.removeAttribute('disabled');
      });
      if (routes.up) dom.controlsUp.forEach(function (el) {
        el.classList.add('enabled');
        el.removeAttribute('disabled');
      });
      if (routes.down) dom.controlsDown.forEach(function (el) {
        el.classList.add('enabled');
        el.removeAttribute('disabled');
      }); // Prev/next buttons

      if (routes.left || routes.up) dom.controlsPrev.forEach(function (el) {
        el.classList.add('enabled');
        el.removeAttribute('disabled');
      });
      if (routes.right || routes.down) dom.controlsNext.forEach(function (el) {
        el.classList.add('enabled');
        el.removeAttribute('disabled');
      }); // Highlight fragment directions

      if (currentSlide) {
        // Always apply fragment decorator to prev/next buttons
        if (fragments.prev) dom.controlsPrev.forEach(function (el) {
          el.classList.add('fragmented', 'enabled');
          el.removeAttribute('disabled');
        });
        if (fragments.next) dom.controlsNext.forEach(function (el) {
          el.classList.add('fragmented', 'enabled');
          el.removeAttribute('disabled');
        }); // Apply fragment decorators to directional buttons based on
        // what slide axis they are in

        if (isVerticalSlide(currentSlide)) {
          if (fragments.prev) dom.controlsUp.forEach(function (el) {
            el.classList.add('fragmented', 'enabled');
            el.removeAttribute('disabled');
          });
          if (fragments.next) dom.controlsDown.forEach(function (el) {
            el.classList.add('fragmented', 'enabled');
            el.removeAttribute('disabled');
          });
        } else {
          if (fragments.prev) dom.controlsLeft.forEach(function (el) {
            el.classList.add('fragmented', 'enabled');
            el.removeAttribute('disabled');
          });
          if (fragments.next) dom.controlsRight.forEach(function (el) {
            el.classList.add('fragmented', 'enabled');
            el.removeAttribute('disabled');
          });
        }
      }

      if (config.controlsTutorial) {
        // Highlight control arrows with an animation to ensure
        // that the viewer knows how to navigate
        if (!hasNavigatedDown && routes.down) {
          dom.controlsDownArrow.classList.add('highlight');
        } else {
          dom.controlsDownArrow.classList.remove('highlight');

          if (!hasNavigatedRight && routes.right && indexv === 0) {
            dom.controlsRightArrow.classList.add('highlight');
          } else {
            dom.controlsRightArrow.classList.remove('highlight');
          }
        }
      }
    }
    /**
     * Updates the background elements to reflect the current
     * slide.
     *
     * @param {boolean} includeAll If true, the backgrounds of
     * all vertical slides (not just the present) will be updated.
     */


    function updateBackground(includeAll) {
      var currentBackground = null; // Reverse past/future classes when in RTL mode

      var horizontalPast = config.rtl ? 'future' : 'past',
          horizontalFuture = config.rtl ? 'past' : 'future'; // Update the classes of all backgrounds to match the
      // states of their slides (past/present/future)

      toArray(dom.background.childNodes).forEach(function (backgroundh, h) {
        backgroundh.classList.remove('past');
        backgroundh.classList.remove('present');
        backgroundh.classList.remove('future');

        if (h < indexh) {
          backgroundh.classList.add(horizontalPast);
        } else if (h > indexh) {
          backgroundh.classList.add(horizontalFuture);
        } else {
          backgroundh.classList.add('present'); // Store a reference to the current background element

          currentBackground = backgroundh;
        }

        if (includeAll || h === indexh) {
          toArray(backgroundh.querySelectorAll('.slide-background')).forEach(function (backgroundv, v) {
            backgroundv.classList.remove('past');
            backgroundv.classList.remove('present');
            backgroundv.classList.remove('future');

            if (v < indexv) {
              backgroundv.classList.add('past');
            } else if (v > indexv) {
              backgroundv.classList.add('future');
            } else {
              backgroundv.classList.add('present'); // Only if this is the present horizontal and vertical slide

              if (h === indexh) currentBackground = backgroundv;
            }
          });
        }
      }); // Stop content inside of previous backgrounds

      if (previousBackground) {
        stopEmbeddedContent(previousBackground);
      } // Start content in the current background


      if (currentBackground) {
        startEmbeddedContent(currentBackground);
        var currentBackgroundContent = currentBackground.querySelector('.slide-background-content');

        if (currentBackgroundContent) {
          var backgroundImageURL = currentBackgroundContent.style.backgroundImage || ''; // Restart GIFs (doesn't work in Firefox)

          if (/\.gif/i.test(backgroundImageURL)) {
            currentBackgroundContent.style.backgroundImage = '';
            window.getComputedStyle(currentBackgroundContent).opacity;
            currentBackgroundContent.style.backgroundImage = backgroundImageURL;
          }
        } // Don't transition between identical backgrounds. This
        // prevents unwanted flicker.


        var previousBackgroundHash = previousBackground ? previousBackground.getAttribute('data-background-hash') : null;
        var currentBackgroundHash = currentBackground.getAttribute('data-background-hash');

        if (currentBackgroundHash && currentBackgroundHash === previousBackgroundHash && currentBackground !== previousBackground) {
          dom.background.classList.add('no-transition');
        }

        previousBackground = currentBackground;
      } // If there's a background brightness flag for this slide,
      // bubble it to the .reveal container


      if (currentSlide) {
        ['has-light-background', 'has-dark-background'].forEach(function (classToBubble) {
          if (currentSlide.classList.contains(classToBubble)) {
            dom.wrapper.classList.add(classToBubble);
          } else {
            dom.wrapper.classList.remove(classToBubble);
          }
        });
      } // Allow the first background to apply without transition


      setTimeout(function () {
        dom.background.classList.remove('no-transition');
      }, 1);
    }
    /**
     * Updates the position of the parallax background based
     * on the current slide index.
     */


    function updateParallax() {
      if (config.parallaxBackgroundImage) {
        var horizontalSlides = dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR),
            verticalSlides = dom.wrapper.querySelectorAll(VERTICAL_SLIDES_SELECTOR);
        var backgroundSize = dom.background.style.backgroundSize.split(' '),
            backgroundWidth,
            backgroundHeight;

        if (backgroundSize.length === 1) {
          backgroundWidth = backgroundHeight = parseInt(backgroundSize[0], 10);
        } else {
          backgroundWidth = parseInt(backgroundSize[0], 10);
          backgroundHeight = parseInt(backgroundSize[1], 10);
        }

        var slideWidth = dom.background.offsetWidth,
            horizontalSlideCount = horizontalSlides.length,
            horizontalOffsetMultiplier,
            horizontalOffset;

        if (typeof config.parallaxBackgroundHorizontal === 'number') {
          horizontalOffsetMultiplier = config.parallaxBackgroundHorizontal;
        } else {
          horizontalOffsetMultiplier = horizontalSlideCount > 1 ? (backgroundWidth - slideWidth) / (horizontalSlideCount - 1) : 0;
        }

        horizontalOffset = horizontalOffsetMultiplier * indexh * -1;
        var slideHeight = dom.background.offsetHeight,
            verticalSlideCount = verticalSlides.length,
            verticalOffsetMultiplier,
            verticalOffset;

        if (typeof config.parallaxBackgroundVertical === 'number') {
          verticalOffsetMultiplier = config.parallaxBackgroundVertical;
        } else {
          verticalOffsetMultiplier = (backgroundHeight - slideHeight) / (verticalSlideCount - 1);
        }

        verticalOffset = verticalSlideCount > 0 ? verticalOffsetMultiplier * indexv : 0;
        dom.background.style.backgroundPosition = horizontalOffset + 'px ' + -verticalOffset + 'px';
      }
    }
    /**
     * Should the given element be preloaded?
     * Decides based on local element attributes and global config.
     *
     * @param {HTMLElement} element
     */


    function shouldPreload(element) {
      // Prefer an explicit global preload setting
      var preload = config.preloadIframes; // If no global setting is available, fall back on the element's
      // own preload setting

      if (typeof preload !== 'boolean') {
        preload = element.hasAttribute('data-preload');
      }

      return preload;
    }
    /**
     * Called when the given slide is within the configured view
     * distance. Shows the slide element and loads any content
     * that is set to load lazily (data-src).
     *
     * @param {HTMLElement} slide Slide to show
     */


    function loadSlide(slide, options) {
      options = options || {}; // Show the slide element

      slide.style.display = config.display; // Media elements with data-src attributes

      toArray(slide.querySelectorAll('img[data-src], video[data-src], audio[data-src], iframe[data-src]')).forEach(function (element) {
        if (element.tagName !== 'IFRAME' || shouldPreload(element)) {
          element.setAttribute('src', element.getAttribute('data-src'));
          element.setAttribute('data-lazy-loaded', '');
          element.removeAttribute('data-src');
        }
      }); // Media elements with <source> children

      toArray(slide.querySelectorAll('video, audio')).forEach(function (media) {
        var sources = 0;
        toArray(media.querySelectorAll('source[data-src]')).forEach(function (source) {
          source.setAttribute('src', source.getAttribute('data-src'));
          source.removeAttribute('data-src');
          source.setAttribute('data-lazy-loaded', '');
          sources += 1;
        }); // If we rewrote sources for this video/audio element, we need
        // to manually tell it to load from its new origin

        if (sources > 0) {
          media.load();
        }
      }); // Show the corresponding background element

      var background = slide.slideBackgroundElement;

      if (background) {
        background.style.display = 'block';
        var backgroundContent = slide.slideBackgroundContentElement; // If the background contains media, load it

        if (background.hasAttribute('data-loaded') === false) {
          background.setAttribute('data-loaded', 'true');
          var backgroundImage = slide.getAttribute('data-background-image'),
              backgroundVideo = slide.getAttribute('data-background-video'),
              backgroundVideoLoop = slide.hasAttribute('data-background-video-loop'),
              backgroundVideoMuted = slide.hasAttribute('data-background-video-muted'),
              backgroundIframe = slide.getAttribute('data-background-iframe'); // Images

          if (backgroundImage) {
            backgroundContent.style.backgroundImage = 'url(' + encodeURI(backgroundImage) + ')';
          } // Videos
          else if (backgroundVideo && !isSpeakerNotes()) {
              var video = document.createElement('video');

              if (backgroundVideoLoop) {
                video.setAttribute('loop', '');
              }

              if (backgroundVideoMuted) {
                video.muted = true;
              } // Inline video playback works (at least in Mobile Safari) as
              // long as the video is muted and the `playsinline` attribute is
              // present


              if (isMobileDevice) {
                video.muted = true;
                video.autoplay = true;
                video.setAttribute('playsinline', '');
              } // Support comma separated lists of video sources


              backgroundVideo.split(',').forEach(function (source) {
                video.innerHTML += '<source src="' + source + '">';
              });
              backgroundContent.appendChild(video);
            } // Iframes
            else if (backgroundIframe && options.excludeIframes !== true) {
                var iframe = document.createElement('iframe');
                iframe.setAttribute('allowfullscreen', '');
                iframe.setAttribute('mozallowfullscreen', '');
                iframe.setAttribute('webkitallowfullscreen', ''); // Only load autoplaying content when the slide is shown to
                // avoid having it play in the background

                if (/autoplay=(1|true|yes)/gi.test(backgroundIframe)) {
                  iframe.setAttribute('data-src', backgroundIframe);
                } else {
                  iframe.setAttribute('src', backgroundIframe);
                }

                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.maxHeight = '100%';
                iframe.style.maxWidth = '100%';
                backgroundContent.appendChild(iframe);
              }
        }
      }
    }
    /**
     * Unloads and hides the given slide. This is called when the
     * slide is moved outside of the configured view distance.
     *
     * @param {HTMLElement} slide
     */


    function unloadSlide(slide) {
      // Hide the slide element
      slide.style.display = 'none'; // Hide the corresponding background element

      var background = getSlideBackground(slide);

      if (background) {
        background.style.display = 'none';
      } // Reset lazy-loaded media elements with src attributes


      toArray(slide.querySelectorAll('video[data-lazy-loaded][src], audio[data-lazy-loaded][src], iframe[data-lazy-loaded][src]')).forEach(function (element) {
        element.setAttribute('data-src', element.getAttribute('src'));
        element.removeAttribute('src');
      }); // Reset lazy-loaded media elements with <source> children

      toArray(slide.querySelectorAll('video[data-lazy-loaded] source[src], audio source[src]')).forEach(function (source) {
        source.setAttribute('data-src', source.getAttribute('src'));
        source.removeAttribute('src');
      });
    }
    /**
     * Determine what available routes there are for navigation.
     *
     * @return {{left: boolean, right: boolean, up: boolean, down: boolean}}
     */


    function availableRoutes() {
      var horizontalSlides = dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR),
          verticalSlides = dom.wrapper.querySelectorAll(VERTICAL_SLIDES_SELECTOR);
      var routes = {
        left: indexh > 0,
        right: indexh < horizontalSlides.length - 1,
        up: indexv > 0,
        down: indexv < verticalSlides.length - 1
      }; // Looped presentations can always be navigated as long as
      // there are slides available

      if (config.loop) {
        if (horizontalSlides.length > 1) {
          routes.left = true;
          routes.right = true;
        }

        if (verticalSlides.length > 1) {
          routes.up = true;
          routes.down = true;
        }
      } // Reverse horizontal controls for rtl


      if (config.rtl) {
        var left = routes.left;
        routes.left = routes.right;
        routes.right = left;
      }

      return routes;
    }
    /**
     * Returns an object describing the available fragment
     * directions.
     *
     * @return {{prev: boolean, next: boolean}}
     */


    function availableFragments() {
      if (currentSlide && config.fragments) {
        var fragments = currentSlide.querySelectorAll('.fragment');
        var hiddenFragments = currentSlide.querySelectorAll('.fragment:not(.visible)');
        return {
          prev: fragments.length - hiddenFragments.length > 0,
          next: !!hiddenFragments.length
        };
      } else {
        return {
          prev: false,
          next: false
        };
      }
    }
    /**
     * Enforces origin-specific format rules for embedded media.
     */


    function formatEmbeddedContent() {
      var _appendParamToIframeSource = function (sourceAttribute, sourceURL, param) {
        toArray(dom.slides.querySelectorAll('iframe[' + sourceAttribute + '*="' + sourceURL + '"]')).forEach(function (el) {
          var src = el.getAttribute(sourceAttribute);

          if (src && src.indexOf(param) === -1) {
            el.setAttribute(sourceAttribute, src + (!/\?/.test(src) ? '?' : '&') + param);
          }
        });
      }; // YouTube frames must include "?enablejsapi=1"


      _appendParamToIframeSource('src', 'youtube.com/embed/', 'enablejsapi=1');

      _appendParamToIframeSource('data-src', 'youtube.com/embed/', 'enablejsapi=1'); // Vimeo frames must include "?api=1"


      _appendParamToIframeSource('src', 'player.vimeo.com/', 'api=1');

      _appendParamToIframeSource('data-src', 'player.vimeo.com/', 'api=1');
    }
    /**
     * Start playback of any embedded content inside of
     * the given element.
     *
     * @param {HTMLElement} element
     */


    function startEmbeddedContent(element) {
      if (element && !isSpeakerNotes()) {
        // Restart GIFs
        toArray(element.querySelectorAll('img[src$=".gif"]')).forEach(function (el) {
          // Setting the same unchanged source like this was confirmed
          // to work in Chrome, FF & Safari
          el.setAttribute('src', el.getAttribute('src'));
        }); // HTML5 media elements

        toArray(element.querySelectorAll('video, audio')).forEach(function (el) {
          if (closestParent(el, '.fragment') && !closestParent(el, '.fragment.visible')) {
            return;
          } // Prefer an explicit global autoplay setting


          var autoplay = config.autoPlayMedia; // If no global setting is available, fall back on the element's
          // own autoplay setting

          if (typeof autoplay !== 'boolean') {
            autoplay = el.hasAttribute('data-autoplay') || !!closestParent(el, '.slide-background');
          }

          if (autoplay && typeof el.play === 'function') {
            // If the media is ready, start playback
            if (el.readyState > 1) {
              startEmbeddedMedia({
                target: el
              });
            } // Mobile devices never fire a loaded event so instead
            // of waiting, we initiate playback
            else if (isMobileDevice) {
                var promise = el.play(); // If autoplay does not work, ensure that the controls are visible so
                // that the viewer can start the media on their own

                if (promise && typeof promise.catch === 'function' && el.controls === false) {
                  promise.catch(function () {
                    el.controls = true; // Once the video does start playing, hide the controls again

                    el.addEventListener('play', function () {
                      el.controls = false;
                    });
                  });
                }
              } // If the media isn't loaded, wait before playing
              else {
                  el.removeEventListener('loadeddata', startEmbeddedMedia); // remove first to avoid dupes

                  el.addEventListener('loadeddata', startEmbeddedMedia);
                }
          }
        }); // Normal iframes

        toArray(element.querySelectorAll('iframe[src]')).forEach(function (el) {
          if (closestParent(el, '.fragment') && !closestParent(el, '.fragment.visible')) {
            return;
          }

          startEmbeddedIframe({
            target: el
          });
        }); // Lazy loading iframes

        toArray(element.querySelectorAll('iframe[data-src]')).forEach(function (el) {
          if (closestParent(el, '.fragment') && !closestParent(el, '.fragment.visible')) {
            return;
          }

          if (el.getAttribute('src') !== el.getAttribute('data-src')) {
            el.removeEventListener('load', startEmbeddedIframe); // remove first to avoid dupes

            el.addEventListener('load', startEmbeddedIframe);
            el.setAttribute('src', el.getAttribute('data-src'));
          }
        });
      }
    }
    /**
     * Starts playing an embedded video/audio element after
     * it has finished loading.
     *
     * @param {object} event
     */


    function startEmbeddedMedia(event) {
      var isAttachedToDOM = !!closestParent(event.target, 'html'),
          isVisible = !!closestParent(event.target, '.present');

      if (isAttachedToDOM && isVisible) {
        event.target.currentTime = 0;
        event.target.play();
      }

      event.target.removeEventListener('loadeddata', startEmbeddedMedia);
    }
    /**
     * "Starts" the content of an embedded iframe using the
     * postMessage API.
     *
     * @param {object} event
     */


    function startEmbeddedIframe(event) {
      var iframe = event.target;

      if (iframe && iframe.contentWindow) {
        var isAttachedToDOM = !!closestParent(event.target, 'html'),
            isVisible = !!closestParent(event.target, '.present');

        if (isAttachedToDOM && isVisible) {
          // Prefer an explicit global autoplay setting
          var autoplay = config.autoPlayMedia; // If no global setting is available, fall back on the element's
          // own autoplay setting

          if (typeof autoplay !== 'boolean') {
            autoplay = iframe.hasAttribute('data-autoplay') || !!closestParent(iframe, '.slide-background');
          } // YouTube postMessage API


          if (/youtube\.com\/embed\//.test(iframe.getAttribute('src')) && autoplay) {
            iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          } // Vimeo postMessage API
          else if (/player\.vimeo\.com\//.test(iframe.getAttribute('src')) && autoplay) {
              iframe.contentWindow.postMessage('{"method":"play"}', '*');
            } // Generic postMessage API
            else {
                iframe.contentWindow.postMessage('slide:start', '*');
              }
        }
      }
    }
    /**
     * Stop playback of any embedded content inside of
     * the targeted slide.
     *
     * @param {HTMLElement} element
     */


    function stopEmbeddedContent(element, options) {
      options = extend({
        // Defaults
        unloadIframes: true
      }, options || {});

      if (element && element.parentNode) {
        // HTML5 media elements
        toArray(element.querySelectorAll('video, audio')).forEach(function (el) {
          if (!el.hasAttribute('data-ignore') && typeof el.pause === 'function') {
            el.setAttribute('data-paused-by-reveal', '');
            el.pause();
          }
        }); // Generic postMessage API for non-lazy loaded iframes

        toArray(element.querySelectorAll('iframe')).forEach(function (el) {
          if (el.contentWindow) el.contentWindow.postMessage('slide:stop', '*');
          el.removeEventListener('load', startEmbeddedIframe);
        }); // YouTube postMessage API

        toArray(element.querySelectorAll('iframe[src*="youtube.com/embed/"]')).forEach(function (el) {
          if (!el.hasAttribute('data-ignore') && el.contentWindow && typeof el.contentWindow.postMessage === 'function') {
            el.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          }
        }); // Vimeo postMessage API

        toArray(element.querySelectorAll('iframe[src*="player.vimeo.com/"]')).forEach(function (el) {
          if (!el.hasAttribute('data-ignore') && el.contentWindow && typeof el.contentWindow.postMessage === 'function') {
            el.contentWindow.postMessage('{"method":"pause"}', '*');
          }
        });

        if (options.unloadIframes === true) {
          // Unload lazy-loaded iframes
          toArray(element.querySelectorAll('iframe[data-src]')).forEach(function (el) {
            // Only removing the src doesn't actually unload the frame
            // in all browsers (Firefox) so we set it to blank first
            el.setAttribute('src', 'about:blank');
            el.removeAttribute('src');
          });
        }
      }
    }
    /**
     * Returns the number of past slides. This can be used as a global
     * flattened index for slides.
     *
     * @return {number} Past slide count
     */


    function getSlidePastCount() {
      var horizontalSlides = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR)); // The number of past slides

      var pastCount = 0; // Step through all slides and count the past ones

      mainLoop: for (var i = 0; i < horizontalSlides.length; i++) {
        var horizontalSlide = horizontalSlides[i];
        var verticalSlides = toArray(horizontalSlide.querySelectorAll('section'));

        for (var j = 0; j < verticalSlides.length; j++) {
          // Stop as soon as we arrive at the present
          if (verticalSlides[j].classList.contains('present')) {
            break mainLoop;
          }

          pastCount++;
        } // Stop as soon as we arrive at the present


        if (horizontalSlide.classList.contains('present')) {
          break;
        } // Don't count the wrapping section for vertical slides


        if (horizontalSlide.classList.contains('stack') === false) {
          pastCount++;
        }
      }

      return pastCount;
    }
    /**
     * Returns a value ranging from 0-1 that represents
     * how far into the presentation we have navigated.
     *
     * @return {number}
     */


    function getProgress() {
      // The number of past and total slides
      var totalCount = getTotalSlides();
      var pastCount = getSlidePastCount();

      if (currentSlide) {
        var allFragments = currentSlide.querySelectorAll('.fragment'); // If there are fragments in the current slide those should be
        // accounted for in the progress.

        if (allFragments.length > 0) {
          var visibleFragments = currentSlide.querySelectorAll('.fragment.visible'); // This value represents how big a portion of the slide progress
          // that is made up by its fragments (0-1)

          var fragmentWeight = 0.9; // Add fragment progress to the past slide count

          pastCount += visibleFragments.length / allFragments.length * fragmentWeight;
        }
      }

      return Math.min(pastCount / (totalCount - 1), 1);
    }
    /**
     * Checks if this presentation is running inside of the
     * speaker notes window.
     *
     * @return {boolean}
     */


    function isSpeakerNotes() {
      return !!window.location.search.match(/receiver/gi);
    }
    /**
     * Reads the current URL (hash) and navigates accordingly.
     */


    function readURL() {
      var hash = window.location.hash; // Attempt to parse the hash as either an index or name

      var bits = hash.slice(2).split('/'),
          name = hash.replace(/#|\//gi, ''); // If the first bit is not fully numeric and there is a name we
      // can assume that this is a named link

      if (!/^[0-9]*$/.test(bits[0]) && name.length) {
        var element; // Ensure the named link is a valid HTML ID attribute

        try {
          element = document.getElementById(decodeURIComponent(name));
        } catch (error) {} // Ensure that we're not already on a slide with the same name


        var isSameNameAsCurrentSlide = currentSlide ? currentSlide.getAttribute('id') === name : false;

        if (element) {
          // If the slide exists and is not the current slide...
          if (!isSameNameAsCurrentSlide) {
            // ...find the position of the named slide and navigate to it
            var indices = Reveal.getIndices(element);
            slide(indices.h, indices.v);
          }
        } // If the slide doesn't exist, navigate to the current slide
        else {
            slide(indexh || 0, indexv || 0);
          }
      } else {
        var hashIndexBase = config.hashOneBasedIndex ? 1 : 0; // Read the index components of the hash

        var h = parseInt(bits[0], 10) - hashIndexBase || 0,
            v = parseInt(bits[1], 10) - hashIndexBase || 0,
            f;

        if (config.fragmentInURL) {
          f = parseInt(bits[2], 10);

          if (isNaN(f)) {
            f = undefined;
          }
        }

        if (h !== indexh || v !== indexv || f !== undefined) {
          slide(h, v, f);
        }
      }
    }
    /**
     * Updates the page URL (hash) to reflect the current
     * state.
     *
     * @param {number} delay The time in ms to wait before
     * writing the hash
     */


    function writeURL(delay) {
      // Make sure there's never more than one timeout running
      clearTimeout(writeURLTimeout); // If a delay is specified, timeout this call

      if (typeof delay === 'number') {
        writeURLTimeout = setTimeout(writeURL, delay);
      } else if (currentSlide) {
        // If we're configured to push to history OR the history
        // API is not avaialble.
        if (config.history || !window.history) {
          window.location.hash = locationHash();
        } // If we're configured to reflect the current slide in the
        // URL without pushing to history.
        else if (config.hash) {
            window.history.replaceState(null, null, '#' + locationHash());
          } // If history and hash are both disabled, a hash may still
          // be added to the URL by clicking on a href with a hash
          // target. Counter this by always removing the hash.
          else {
              window.history.replaceState(null, null, window.location.pathname + window.location.search);
            }
      }
    }
    /**
     * Retrieves the h/v location and fragment of the current,
     * or specified, slide.
     *
     * @param {HTMLElement} [slide] If specified, the returned
     * index will be for this slide rather than the currently
     * active one
     *
     * @return {{h: number, v: number, f: number}}
     */


    function getIndices(slide) {
      // By default, return the current indices
      var h = indexh,
          v = indexv,
          f; // If a slide is specified, return the indices of that slide

      if (slide) {
        var isVertical = isVerticalSlide(slide);
        var slideh = isVertical ? slide.parentNode : slide; // Select all horizontal slides

        var horizontalSlides = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR)); // Now that we know which the horizontal slide is, get its index

        h = Math.max(horizontalSlides.indexOf(slideh), 0); // Assume we're not vertical

        v = undefined; // If this is a vertical slide, grab the vertical index

        if (isVertical) {
          v = Math.max(toArray(slide.parentNode.querySelectorAll('section')).indexOf(slide), 0);
        }
      }

      if (!slide && currentSlide) {
        var hasFragments = currentSlide.querySelectorAll('.fragment').length > 0;

        if (hasFragments) {
          var currentFragment = currentSlide.querySelector('.current-fragment');

          if (currentFragment && currentFragment.hasAttribute('data-fragment-index')) {
            f = parseInt(currentFragment.getAttribute('data-fragment-index'), 10);
          } else {
            f = currentSlide.querySelectorAll('.fragment.visible').length - 1;
          }
        }
      }

      return {
        h: h,
        v: v,
        f: f
      };
    }
    /**
     * Retrieves all slides in this presentation.
     */


    function getSlides() {
      return toArray(dom.wrapper.querySelectorAll(SLIDES_SELECTOR + ':not(.stack)'));
    }
    /**
     * Returns an array of objects where each object represents the
     * attributes on its respective slide.
     */


    function getSlidesAttributes() {
      return getSlides().map(function (slide) {
        var attributes = {};

        for (var i = 0; i < slide.attributes.length; i++) {
          var attribute = slide.attributes[i];
          attributes[attribute.name] = attribute.value;
        }

        return attributes;
      });
    }
    /**
     * Retrieves the total number of slides in this presentation.
     *
     * @return {number}
     */


    function getTotalSlides() {
      return getSlides().length;
    }
    /**
     * Returns the slide element matching the specified index.
     *
     * @return {HTMLElement}
     */


    function getSlide(x, y) {
      var horizontalSlide = dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR)[x];
      var verticalSlides = horizontalSlide && horizontalSlide.querySelectorAll('section');

      if (verticalSlides && verticalSlides.length && typeof y === 'number') {
        return verticalSlides ? verticalSlides[y] : undefined;
      }

      return horizontalSlide;
    }
    /**
     * Returns the background element for the given slide.
     * All slides, even the ones with no background properties
     * defined, have a background element so as long as the
     * index is valid an element will be returned.
     *
     * @param {mixed} x Horizontal background index OR a slide
     * HTML element
     * @param {number} y Vertical background index
     * @return {(HTMLElement[]|*)}
     */


    function getSlideBackground(x, y) {
      var slide = typeof x === 'number' ? getSlide(x, y) : x;

      if (slide) {
        return slide.slideBackgroundElement;
      }

      return undefined;
    }
    /**
     * Retrieves the speaker notes from a slide. Notes can be
     * defined in two ways:
     * 1. As a data-notes attribute on the slide <section>
     * 2. As an <aside class="notes"> inside of the slide
     *
     * @param {HTMLElement} [slide=currentSlide]
     * @return {(string|null)}
     */


    function getSlideNotes(slide) {
      // Default to the current slide
      slide = slide || currentSlide; // Notes can be specified via the data-notes attribute...

      if (slide.hasAttribute('data-notes')) {
        return slide.getAttribute('data-notes');
      } // ... or using an <aside class="notes"> element


      var notesElement = slide.querySelector('aside.notes');

      if (notesElement) {
        return notesElement.innerHTML;
      }

      return null;
    }
    /**
     * Retrieves the current state of the presentation as
     * an object. This state can then be restored at any
     * time.
     *
     * @return {{indexh: number, indexv: number, indexf: number, paused: boolean, overview: boolean}}
     */


    function getState() {
      var indices = getIndices();
      return {
        indexh: indices.h,
        indexv: indices.v,
        indexf: indices.f,
        paused: isPaused(),
        overview: isOverview()
      };
    }
    /**
     * Restores the presentation to the given state.
     *
     * @param {object} state As generated by getState()
     * @see {@link getState} generates the parameter `state`
     */


    function setState(state) {
      if (typeof state === 'object') {
        slide(deserialize(state.indexh), deserialize(state.indexv), deserialize(state.indexf));
        var pausedFlag = deserialize(state.paused),
            overviewFlag = deserialize(state.overview);

        if (typeof pausedFlag === 'boolean' && pausedFlag !== isPaused()) {
          togglePause(pausedFlag);
        }

        if (typeof overviewFlag === 'boolean' && overviewFlag !== isOverview()) {
          toggleOverview(overviewFlag);
        }
      }
    }
    /**
     * Return a sorted fragments list, ordered by an increasing
     * "data-fragment-index" attribute.
     *
     * Fragments will be revealed in the order that they are returned by
     * this function, so you can use the index attributes to control the
     * order of fragment appearance.
     *
     * To maintain a sensible default fragment order, fragments are presumed
     * to be passed in document order. This function adds a "fragment-index"
     * attribute to each node if such an attribute is not already present,
     * and sets that attribute to an integer value which is the position of
     * the fragment within the fragments list.
     *
     * @param {object[]|*} fragments
     * @param {boolean} grouped If true the returned array will contain
     * nested arrays for all fragments with the same index
     * @return {object[]} sorted Sorted array of fragments
     */


    function sortFragments(fragments, grouped) {
      fragments = toArray(fragments);
      var ordered = [],
          unordered = [],
          sorted = []; // Group ordered and unordered elements

      fragments.forEach(function (fragment, i) {
        if (fragment.hasAttribute('data-fragment-index')) {
          var index = parseInt(fragment.getAttribute('data-fragment-index'), 10);

          if (!ordered[index]) {
            ordered[index] = [];
          }

          ordered[index].push(fragment);
        } else {
          unordered.push([fragment]);
        }
      }); // Append fragments without explicit indices in their
      // DOM order

      ordered = ordered.concat(unordered); // Manually count the index up per group to ensure there
      // are no gaps

      var index = 0; // Push all fragments in their sorted order to an array,
      // this flattens the groups

      ordered.forEach(function (group) {
        group.forEach(function (fragment) {
          sorted.push(fragment);
          fragment.setAttribute('data-fragment-index', index);
        });
        index++;
      });
      return grouped === true ? ordered : sorted;
    }
    /**
     * Refreshes the fragments on the current slide so that they
     * have the appropriate classes (.visible + .current-fragment).
     *
     * @param {number} [index] The index of the current fragment
     * @param {array} [fragments] Array containing all fragments
     * in the current slide
     *
     * @return {{shown: array, hidden: array}}
     */


    function updateFragments(index, fragments) {
      var changedFragments = {
        shown: [],
        hidden: []
      };

      if (currentSlide && config.fragments) {
        fragments = fragments || sortFragments(currentSlide.querySelectorAll('.fragment'));

        if (fragments.length) {
          if (typeof index !== 'number') {
            var currentFragment = sortFragments(currentSlide.querySelectorAll('.fragment.visible')).pop();

            if (currentFragment) {
              index = parseInt(currentFragment.getAttribute('data-fragment-index') || 0, 10);
            }
          }

          toArray(fragments).forEach(function (el, i) {
            if (el.hasAttribute('data-fragment-index')) {
              i = parseInt(el.getAttribute('data-fragment-index'), 10);
            } // Visible fragments


            if (i <= index) {
              if (!el.classList.contains('visible')) changedFragments.shown.push(el);
              el.classList.add('visible');
              el.classList.remove('current-fragment'); // Announce the fragments one by one to the Screen Reader

              dom.statusDiv.textContent = getStatusText(el);

              if (i === index) {
                el.classList.add('current-fragment');
                startEmbeddedContent(el);
              }
            } // Hidden fragments
            else {
                if (el.classList.contains('visible')) changedFragments.hidden.push(el);
                el.classList.remove('visible');
                el.classList.remove('current-fragment');
              }
          });
        }
      }

      return changedFragments;
    }
    /**
     * Navigate to the specified slide fragment.
     *
     * @param {?number} index The index of the fragment that
     * should be shown, -1 means all are invisible
     * @param {number} offset Integer offset to apply to the
     * fragment index
     *
     * @return {boolean} true if a change was made in any
     * fragments visibility as part of this call
     */


    function navigateFragment(index, offset) {
      if (currentSlide && config.fragments) {
        var fragments = sortFragments(currentSlide.querySelectorAll('.fragment'));

        if (fragments.length) {
          // If no index is specified, find the current
          if (typeof index !== 'number') {
            var lastVisibleFragment = sortFragments(currentSlide.querySelectorAll('.fragment.visible')).pop();

            if (lastVisibleFragment) {
              index = parseInt(lastVisibleFragment.getAttribute('data-fragment-index') || 0, 10);
            } else {
              index = -1;
            }
          } // If an offset is specified, apply it to the index


          if (typeof offset === 'number') {
            index += offset;
          }

          var changedFragments = updateFragments(index, fragments);

          if (changedFragments.hidden.length) {
            dispatchEvent('fragmenthidden', {
              fragment: changedFragments.hidden[0],
              fragments: changedFragments.hidden
            });
          }

          if (changedFragments.shown.length) {
            dispatchEvent('fragmentshown', {
              fragment: changedFragments.shown[0],
              fragments: changedFragments.shown
            });
          }

          updateControls();
          updateProgress();

          if (config.fragmentInURL) {
            writeURL();
          }

          return !!(changedFragments.shown.length || changedFragments.hidden.length);
        }
      }

      return false;
    }
    /**
     * Navigate to the next slide fragment.
     *
     * @return {boolean} true if there was a next fragment,
     * false otherwise
     */


    function nextFragment() {
      return navigateFragment(null, 1);
    }
    /**
     * Navigate to the previous slide fragment.
     *
     * @return {boolean} true if there was a previous fragment,
     * false otherwise
     */


    function previousFragment() {
      return navigateFragment(null, -1);
    }
    /**
     * Cues a new automated slide if enabled in the config.
     */


    function cueAutoSlide() {
      cancelAutoSlide();

      if (currentSlide && config.autoSlide !== false) {
        var fragment = currentSlide.querySelector('.current-fragment'); // When the slide first appears there is no "current" fragment so
        // we look for a data-autoslide timing on the first fragment

        if (!fragment) fragment = currentSlide.querySelector('.fragment');
        var fragmentAutoSlide = fragment ? fragment.getAttribute('data-autoslide') : null;
        var parentAutoSlide = currentSlide.parentNode ? currentSlide.parentNode.getAttribute('data-autoslide') : null;
        var slideAutoSlide = currentSlide.getAttribute('data-autoslide'); // Pick value in the following priority order:
        // 1. Current fragment's data-autoslide
        // 2. Current slide's data-autoslide
        // 3. Parent slide's data-autoslide
        // 4. Global autoSlide setting

        if (fragmentAutoSlide) {
          autoSlide = parseInt(fragmentAutoSlide, 10);
        } else if (slideAutoSlide) {
          autoSlide = parseInt(slideAutoSlide, 10);
        } else if (parentAutoSlide) {
          autoSlide = parseInt(parentAutoSlide, 10);
        } else {
          autoSlide = config.autoSlide;
        } // If there are media elements with data-autoplay,
        // automatically set the autoSlide duration to the
        // length of that media. Not applicable if the slide
        // is divided up into fragments.
        // playbackRate is accounted for in the duration.


        if (currentSlide.querySelectorAll('.fragment').length === 0) {
          toArray(currentSlide.querySelectorAll('video, audio')).forEach(function (el) {
            if (el.hasAttribute('data-autoplay')) {
              if (autoSlide && el.duration * 1000 / el.playbackRate > autoSlide) {
                autoSlide = el.duration * 1000 / el.playbackRate + 1000;
              }
            }
          });
        } // Cue the next auto-slide if:
        // - There is an autoSlide value
        // - Auto-sliding isn't paused by the user
        // - The presentation isn't paused
        // - The overview isn't active
        // - The presentation isn't over


        if (autoSlide && !autoSlidePaused && !isPaused() && !isOverview() && (!Reveal.isLastSlide() || availableFragments().next || config.loop === true)) {
          autoSlideTimeout = setTimeout(function () {
            typeof config.autoSlideMethod === 'function' ? config.autoSlideMethod() : navigateNext();
            cueAutoSlide();
          }, autoSlide);
          autoSlideStartTime = Date.now();
        }

        if (autoSlidePlayer) {
          autoSlidePlayer.setPlaying(autoSlideTimeout !== -1);
        }
      }
    }
    /**
     * Cancels any ongoing request to auto-slide.
     */


    function cancelAutoSlide() {
      clearTimeout(autoSlideTimeout);
      autoSlideTimeout = -1;
    }

    function pauseAutoSlide() {
      if (autoSlide && !autoSlidePaused) {
        autoSlidePaused = true;
        dispatchEvent('autoslidepaused');
        clearTimeout(autoSlideTimeout);

        if (autoSlidePlayer) {
          autoSlidePlayer.setPlaying(false);
        }
      }
    }

    function resumeAutoSlide() {
      if (autoSlide && autoSlidePaused) {
        autoSlidePaused = false;
        dispatchEvent('autoslideresumed');
        cueAutoSlide();
      }
    }

    function navigateLeft() {
      // Reverse for RTL
      if (config.rtl) {
        if ((isOverview() || nextFragment() === false) && availableRoutes().left) {
          slide(indexh + 1, config.navigationMode === 'grid' ? indexv : undefined);
        }
      } // Normal navigation
      else if ((isOverview() || previousFragment() === false) && availableRoutes().left) {
          slide(indexh - 1, config.navigationMode === 'grid' ? indexv : undefined);
        }
    }

    function navigateRight() {
      hasNavigatedRight = true; // Reverse for RTL

      if (config.rtl) {
        if ((isOverview() || previousFragment() === false) && availableRoutes().right) {
          slide(indexh - 1, config.navigationMode === 'grid' ? indexv : undefined);
        }
      } // Normal navigation
      else if ((isOverview() || nextFragment() === false) && availableRoutes().right) {
          slide(indexh + 1, config.navigationMode === 'grid' ? indexv : undefined);
        }
    }

    function navigateUp() {
      // Prioritize hiding fragments
      if ((isOverview() || previousFragment() === false) && availableRoutes().up) {
        slide(indexh, indexv - 1);
      }
    }

    function navigateDown() {
      hasNavigatedDown = true; // Prioritize revealing fragments

      if ((isOverview() || nextFragment() === false) && availableRoutes().down) {
        slide(indexh, indexv + 1);
      }
    }
    /**
     * Navigates backwards, prioritized in the following order:
     * 1) Previous fragment
     * 2) Previous vertical slide
     * 3) Previous horizontal slide
     */


    function navigatePrev() {
      // Prioritize revealing fragments
      if (previousFragment() === false) {
        if (availableRoutes().up) {
          navigateUp();
        } else {
          // Fetch the previous horizontal slide, if there is one
          var previousSlide;

          if (config.rtl) {
            previousSlide = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR + '.future')).pop();
          } else {
            previousSlide = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR + '.past')).pop();
          }

          if (previousSlide) {
            var v = previousSlide.querySelectorAll('section').length - 1 || undefined;
            var h = indexh - 1;
            slide(h, v);
          }
        }
      }
    }
    /**
     * The reverse of #navigatePrev().
     */


    function navigateNext() {
      hasNavigatedRight = true;
      hasNavigatedDown = true; // Prioritize revealing fragments

      if (nextFragment() === false) {
        var routes = availableRoutes(); // When looping is enabled `routes.down` is always available
        // so we need a separate check for when we've reached the
        // end of a stack and should move horizontally

        if (routes.down && routes.right && config.loop && Reveal.isLastVerticalSlide(currentSlide)) {
          routes.down = false;
        }

        if (routes.down) {
          navigateDown();
        } else if (config.rtl) {
          navigateLeft();
        } else {
          navigateRight();
        }
      }
    }
    /**
     * Checks if the target element prevents the triggering of
     * swipe navigation.
     */


    function isSwipePrevented(target) {
      while (target && typeof target.hasAttribute === 'function') {
        if (target.hasAttribute('data-prevent-swipe')) return true;
        target = target.parentNode;
      }

      return false;
    } // --------------------------------------------------------------------//
    // ----------------------------- EVENTS -------------------------------//
    // --------------------------------------------------------------------//

    /**
     * Called by all event handlers that are based on user
     * input.
     *
     * @param {object} [event]
     */


    function onUserInput(event) {
      if (config.autoSlideStoppable) {
        pauseAutoSlide();
      }
    }
    /**
     * Called whenever there is mouse input at the document level
     * to determine if the cursor is active or not.
     *
     * @param {object} event
     */


    function onDocumentCursorActive(event) {
      showCursor();
      clearTimeout(cursorInactiveTimeout);
      cursorInactiveTimeout = setTimeout(hideCursor, config.hideCursorTime);
    }
    /**
     * Handler for the document level 'keypress' event.
     *
     * @param {object} event
     */


    function onDocumentKeyPress(event) {
      // Check if the pressed key is question mark
      if (event.shiftKey && event.charCode === 63) {
        toggleHelp();
      }
    }
    /**
     * Handler for the document level 'keydown' event.
     *
     * @param {object} event
     */


    function onDocumentKeyDown(event) {
      // If there's a condition specified and it returns false,
      // ignore this event
      if (typeof config.keyboardCondition === 'function' && config.keyboardCondition(event) === false) {
        return true;
      } // Shorthand


      var keyCode = event.keyCode; // Remember if auto-sliding was paused so we can toggle it

      var autoSlideWasPaused = autoSlidePaused;
      onUserInput(); // Is there a focused element that could be using the keyboard?

      var activeElementIsCE = document.activeElement && document.activeElement.contentEditable !== 'inherit';
      var activeElementIsInput = document.activeElement && document.activeElement.tagName && /input|textarea/i.test(document.activeElement.tagName);
      var activeElementIsNotes = document.activeElement && document.activeElement.className && /speaker-notes/i.test(document.activeElement.className); // Whitelist specific modified + keycode combinations

      var prevSlideShortcut = event.shiftKey && event.keyCode === 32;
      var firstSlideShortcut = (event.metaKey || event.ctrlKey) && keyCode === 37;
      var lastSlideShortcut = (event.metaKey || event.ctrlKey) && keyCode === 39; // Prevent all other events when a modifier is pressed

      var unusedModifier = !prevSlideShortcut && !firstSlideShortcut && !lastSlideShortcut && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey); // Disregard the event if there's a focused element or a
      // keyboard modifier key is present

      if (activeElementIsCE || activeElementIsInput || activeElementIsNotes || unusedModifier) return; // While paused only allow resume keyboard events; 'b', 'v', '.'

      var resumeKeyCodes = [66, 86, 190, 191];
      var key; // Custom key bindings for togglePause should be able to resume

      if (typeof config.keyboard === 'object') {
        for (key in config.keyboard) {
          if (config.keyboard[key] === 'togglePause') {
            resumeKeyCodes.push(parseInt(key, 10));
          }
        }
      }

      if (isPaused() && resumeKeyCodes.indexOf(keyCode) === -1) {
        return false;
      }

      var triggered = false; // 1. User defined key bindings

      if (typeof config.keyboard === 'object') {
        for (key in config.keyboard) {
          // Check if this binding matches the pressed key
          if (parseInt(key, 10) === keyCode) {
            var value = config.keyboard[key]; // Callback function

            if (typeof value === 'function') {
              value.apply(null, [event]);
            } // String shortcuts to reveal.js API
            else if (typeof value === 'string' && typeof Reveal[value] === 'function') {
                Reveal[value].call();
              }

            triggered = true;
          }
        }
      } // 2. Registered custom key bindings


      if (triggered === false) {
        for (key in registeredKeyBindings) {
          // Check if this binding matches the pressed key
          if (parseInt(key, 10) === keyCode) {
            var action = registeredKeyBindings[key].callback; // Callback function

            if (typeof action === 'function') {
              action.apply(null, [event]);
            } // String shortcuts to reveal.js API
            else if (typeof action === 'string' && typeof Reveal[action] === 'function') {
                Reveal[action].call();
              }

            triggered = true;
          }
        }
      } // 3. System defined key bindings


      if (triggered === false) {
        // Assume true and try to prove false
        triggered = true; // P, PAGE UP

        if (keyCode === 80 || keyCode === 33) {
          navigatePrev();
        } // N, PAGE DOWN
        else if (keyCode === 78 || keyCode === 34) {
            navigateNext();
          } // H, LEFT
          else if (keyCode === 72 || keyCode === 37) {
              if (firstSlideShortcut) {
                slide(0);
              } else if (!isOverview() && config.navigationMode === 'linear') {
                navigatePrev();
              } else {
                navigateLeft();
              }
            } // L, RIGHT
            else if (keyCode === 76 || keyCode === 39) {
                if (lastSlideShortcut) {
                  slide(Number.MAX_VALUE);
                } else if (!isOverview() && config.navigationMode === 'linear') {
                  navigateNext();
                } else {
                  navigateRight();
                }
              } // K, UP
              else if (keyCode === 75 || keyCode === 38) {
                  if (!isOverview() && config.navigationMode === 'linear') {
                    navigatePrev();
                  } else {
                    navigateUp();
                  }
                } // J, DOWN
                else if (keyCode === 74 || keyCode === 40) {
                    if (!isOverview() && config.navigationMode === 'linear') {
                      navigateNext();
                    } else {
                      navigateDown();
                    }
                  } // HOME
                  else if (keyCode === 36) {
                      slide(0);
                    } // END
                    else if (keyCode === 35) {
                        slide(Number.MAX_VALUE);
                      } // SPACE
                      else if (keyCode === 32) {
                          if (isOverview()) {
                            deactivateOverview();
                          }

                          if (event.shiftKey) {
                            navigatePrev();
                          } else {
                            navigateNext();
                          }
                        } // TWO-SPOT, SEMICOLON, B, V, PERIOD, LOGITECH PRESENTER TOOLS "BLACK SCREEN" BUTTON
                        else if (keyCode === 58 || keyCode === 59 || keyCode === 66 || keyCode === 86 || keyCode === 190 || keyCode === 191) {
                            togglePause();
                          } // F
                          else if (keyCode === 70) {
                              enterFullscreen();
                            } // A
                            else if (keyCode === 65) {
                                if (config.autoSlideStoppable) {
                                  toggleAutoSlide(autoSlideWasPaused);
                                }
                              } else {
                                triggered = false;
                              }
      } // If the input resulted in a triggered action we should prevent
      // the browsers default behavior


      if (triggered) {
        event.preventDefault && event.preventDefault();
      } // ESC or O key
      else if ((keyCode === 27 || keyCode === 79) && features.transforms3d) {
          if (dom.overlay) {
            closeOverlay();
          } else {
            toggleOverview();
          }

          event.preventDefault && event.preventDefault();
        } // If auto-sliding is enabled we need to cue up
      // another timeout


      cueAutoSlide();
    }
    /**
     * Handler for the 'touchstart' event, enables support for
     * swipe and pinch gestures.
     *
     * @param {object} event
     */


    function onTouchStart(event) {
      if (isSwipePrevented(event.target)) return true;
      touch.startX = event.touches[0].clientX;
      touch.startY = event.touches[0].clientY;
      touch.startCount = event.touches.length;
    }
    /**
     * Handler for the 'touchmove' event.
     *
     * @param {object} event
     */


    function onTouchMove(event) {
      if (isSwipePrevented(event.target)) return true; // Each touch should only trigger one action

      if (!touch.captured) {
        onUserInput();
        var currentX = event.touches[0].clientX;
        var currentY = event.touches[0].clientY; // There was only one touch point, look for a swipe

        if (event.touches.length === 1 && touch.startCount !== 2) {
          var deltaX = currentX - touch.startX,
              deltaY = currentY - touch.startY;

          if (deltaX > touch.threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
            touch.captured = true;
            navigateLeft();
          } else if (deltaX < -touch.threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
            touch.captured = true;
            navigateRight();
          } else if (deltaY > touch.threshold) {
            touch.captured = true;
            navigateUp();
          } else if (deltaY < -touch.threshold) {
            touch.captured = true;
            navigateDown();
          } // If we're embedded, only block touch events if they have
          // triggered an action


          if (config.embedded) {
            if (touch.captured || isVerticalSlide(currentSlide)) {
              event.preventDefault();
            }
          } // Not embedded? Block them all to avoid needless tossing
          // around of the viewport in iOS
          else {
              event.preventDefault();
            }
        }
      } // There's a bug with swiping on some Android devices unless
      // the default action is always prevented
      else if (UA.match(/android/gi)) {
          event.preventDefault();
        }
    }
    /**
     * Handler for the 'touchend' event.
     *
     * @param {object} event
     */


    function onTouchEnd(event) {
      touch.captured = false;
    }
    /**
     * Convert pointer down to touch start.
     *
     * @param {object} event
     */


    function onPointerDown(event) {
      if (event.pointerType === event.MSPOINTER_TYPE_TOUCH || event.pointerType === "touch") {
        event.touches = [{
          clientX: event.clientX,
          clientY: event.clientY
        }];
        onTouchStart(event);
      }
    }
    /**
     * Convert pointer move to touch move.
     *
     * @param {object} event
     */


    function onPointerMove(event) {
      if (event.pointerType === event.MSPOINTER_TYPE_TOUCH || event.pointerType === "touch") {
        event.touches = [{
          clientX: event.clientX,
          clientY: event.clientY
        }];
        onTouchMove(event);
      }
    }
    /**
     * Convert pointer up to touch end.
     *
     * @param {object} event
     */


    function onPointerUp(event) {
      if (event.pointerType === event.MSPOINTER_TYPE_TOUCH || event.pointerType === "touch") {
        event.touches = [{
          clientX: event.clientX,
          clientY: event.clientY
        }];
        onTouchEnd();
      }
    }
    /**
     * Handles mouse wheel scrolling, throttled to avoid skipping
     * multiple slides.
     *
     * @param {object} event
     */


    function onDocumentMouseScroll(event) {
      if (Date.now() - lastMouseWheelStep > 600) {
        lastMouseWheelStep = Date.now();
        var delta = event.detail || -event.wheelDelta;

        if (delta > 0) {
          navigateNext();
        } else if (delta < 0) {
          navigatePrev();
        }
      }
    }
    /**
     * Clicking on the progress bar results in a navigation to the
     * closest approximate horizontal slide using this equation:
     *
     * ( clickX / presentationWidth ) * numberOfSlides
     *
     * @param {object} event
     */


    function onProgressClicked(event) {
      onUserInput();
      event.preventDefault();
      var slidesTotal = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR)).length;
      var slideIndex = Math.floor(event.clientX / dom.wrapper.offsetWidth * slidesTotal);

      if (config.rtl) {
        slideIndex = slidesTotal - slideIndex;
      }

      slide(slideIndex);
    }
    /**
     * Event handler for navigation control buttons.
     */


    function onNavigateLeftClicked(event) {
      event.preventDefault();
      onUserInput();
      config.navigationMode === 'linear' ? navigatePrev() : navigateLeft();
    }

    function onNavigateRightClicked(event) {
      event.preventDefault();
      onUserInput();
      config.navigationMode === 'linear' ? navigateNext() : navigateRight();
    }

    function onNavigateUpClicked(event) {
      event.preventDefault();
      onUserInput();
      navigateUp();
    }

    function onNavigateDownClicked(event) {
      event.preventDefault();
      onUserInput();
      navigateDown();
    }

    function onNavigatePrevClicked(event) {
      event.preventDefault();
      onUserInput();
      navigatePrev();
    }

    function onNavigateNextClicked(event) {
      event.preventDefault();
      onUserInput();
      navigateNext();
    }
    /**
     * Handler for the window level 'hashchange' event.
     *
     * @param {object} [event]
     */


    function onWindowHashChange(event) {
      readURL();
    }
    /**
     * Handler for the window level 'resize' event.
     *
     * @param {object} [event]
     */


    function onWindowResize(event) {
      layout();
    }
    /**
     * Handle for the window level 'visibilitychange' event.
     *
     * @param {object} [event]
     */


    function onPageVisibilityChange(event) {
      var isHidden = document.webkitHidden || document.msHidden || document.hidden; // If, after clicking a link or similar and we're coming back,
      // focus the document.body to ensure we can use keyboard shortcuts

      if (isHidden === false && document.activeElement !== document.body) {
        // Not all elements support .blur() - SVGs among them.
        if (typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }

        document.body.focus();
      }
    }
    /**
     * Invoked when a slide is and we're in the overview.
     *
     * @param {object} event
     */


    function onOverviewSlideClicked(event) {
      // TODO There's a bug here where the event listeners are not
      // removed after deactivating the overview.
      if (eventsAreBound && isOverview()) {
        event.preventDefault();
        var element = event.target;

        while (element && !element.nodeName.match(/section/gi)) {
          element = element.parentNode;
        }

        if (element && !element.classList.contains('disabled')) {
          deactivateOverview();

          if (element.nodeName.match(/section/gi)) {
            var h = parseInt(element.getAttribute('data-index-h'), 10),
                v = parseInt(element.getAttribute('data-index-v'), 10);
            slide(h, v);
          }
        }
      }
    }
    /**
     * Handles clicks on links that are set to preview in the
     * iframe overlay.
     *
     * @param {object} event
     */


    function onPreviewLinkClicked(event) {
      if (event.currentTarget && event.currentTarget.hasAttribute('href')) {
        var url = event.currentTarget.getAttribute('href');

        if (url) {
          showPreview(url);
          event.preventDefault();
        }
      }
    }
    /**
     * Handles click on the auto-sliding controls element.
     *
     * @param {object} [event]
     */


    function onAutoSlidePlayerClick(event) {
      // Replay
      if (Reveal.isLastSlide() && config.loop === false) {
        slide(0, 0);
        resumeAutoSlide();
      } // Resume
      else if (autoSlidePaused) {
          resumeAutoSlide();
        } // Pause
        else {
            pauseAutoSlide();
          }
    } // --------------------------------------------------------------------//
    // ------------------------ PLAYBACK COMPONENT ------------------------//
    // --------------------------------------------------------------------//

    /**
     * Constructor for the playback component, which displays
     * play/pause/progress controls.
     *
     * @param {HTMLElement} container The component will append
     * itself to this
     * @param {function} progressCheck A method which will be
     * called frequently to get the current progress on a range
     * of 0-1
     */


    function Playback(container, progressCheck) {
      // Cosmetics
      this.diameter = 100;
      this.diameter2 = this.diameter / 2;
      this.thickness = 6; // Flags if we are currently playing

      this.playing = false; // Current progress on a 0-1 range

      this.progress = 0; // Used to loop the animation smoothly

      this.progressOffset = 1;
      this.container = container;
      this.progressCheck = progressCheck;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'playback';
      this.canvas.width = this.diameter;
      this.canvas.height = this.diameter;
      this.canvas.style.width = this.diameter2 + 'px';
      this.canvas.style.height = this.diameter2 + 'px';
      this.context = this.canvas.getContext('2d');
      this.container.appendChild(this.canvas);
      this.render();
    }
    /**
     * @param value
     */


    Playback.prototype.setPlaying = function (value) {
      var wasPlaying = this.playing;
      this.playing = value; // Start repainting if we weren't already

      if (!wasPlaying && this.playing) {
        this.animate();
      } else {
        this.render();
      }
    };

    Playback.prototype.animate = function () {
      var progressBefore = this.progress;
      this.progress = this.progressCheck(); // When we loop, offset the progress so that it eases
      // smoothly rather than immediately resetting

      if (progressBefore > 0.8 && this.progress < 0.2) {
        this.progressOffset = this.progress;
      }

      this.render();

      if (this.playing) {
        features.requestAnimationFrameMethod.call(window, this.animate.bind(this));
      }
    };
    /**
     * Renders the current progress and playback state.
     */


    Playback.prototype.render = function () {
      var progress = this.playing ? this.progress : 0,
          radius = this.diameter2 - this.thickness,
          x = this.diameter2,
          y = this.diameter2,
          iconSize = 28; // Ease towards 1

      this.progressOffset += (1 - this.progressOffset) * 0.1;
      var endAngle = -Math.PI / 2 + progress * (Math.PI * 2);
      var startAngle = -Math.PI / 2 + this.progressOffset * (Math.PI * 2);
      this.context.save();
      this.context.clearRect(0, 0, this.diameter, this.diameter); // Solid background color

      this.context.beginPath();
      this.context.arc(x, y, radius + 4, 0, Math.PI * 2, false);
      this.context.fillStyle = 'rgba( 0, 0, 0, 0.4 )';
      this.context.fill(); // Draw progress track

      this.context.beginPath();
      this.context.arc(x, y, radius, 0, Math.PI * 2, false);
      this.context.lineWidth = this.thickness;
      this.context.strokeStyle = 'rgba( 255, 255, 255, 0.2 )';
      this.context.stroke();

      if (this.playing) {
        // Draw progress on top of track
        this.context.beginPath();
        this.context.arc(x, y, radius, startAngle, endAngle, false);
        this.context.lineWidth = this.thickness;
        this.context.strokeStyle = '#fff';
        this.context.stroke();
      }

      this.context.translate(x - iconSize / 2, y - iconSize / 2); // Draw play/pause icons

      if (this.playing) {
        this.context.fillStyle = '#fff';
        this.context.fillRect(0, 0, iconSize / 2 - 4, iconSize);
        this.context.fillRect(iconSize / 2 + 4, 0, iconSize / 2 - 4, iconSize);
      } else {
        this.context.beginPath();
        this.context.translate(4, 0);
        this.context.moveTo(0, 0);
        this.context.lineTo(iconSize - 4, iconSize / 2);
        this.context.lineTo(0, iconSize);
        this.context.fillStyle = '#fff';
        this.context.fill();
      }

      this.context.restore();
    };

    Playback.prototype.on = function (type, listener) {
      this.canvas.addEventListener(type, listener, false);
    };

    Playback.prototype.off = function (type, listener) {
      this.canvas.removeEventListener(type, listener, false);
    };

    Playback.prototype.destroy = function () {
      this.playing = false;

      if (this.canvas.parentNode) {
        this.container.removeChild(this.canvas);
      }
    }; // --------------------------------------------------------------------//
    // ------------------------------- API --------------------------------//
    // --------------------------------------------------------------------//


    Reveal = {
      VERSION: VERSION,
      initialize: initialize,
      configure: configure,
      sync: sync,
      syncSlide: syncSlide,
      syncFragments: syncFragments,
      // Navigation methods
      slide: slide,
      left: navigateLeft,
      right: navigateRight,
      up: navigateUp,
      down: navigateDown,
      prev: navigatePrev,
      next: navigateNext,
      // Fragment methods
      navigateFragment: navigateFragment,
      prevFragment: previousFragment,
      nextFragment: nextFragment,
      // Deprecated aliases
      navigateTo: slide,
      navigateLeft: navigateLeft,
      navigateRight: navigateRight,
      navigateUp: navigateUp,
      navigateDown: navigateDown,
      navigatePrev: navigatePrev,
      navigateNext: navigateNext,
      // Forces an update in slide layout
      layout: layout,
      // Randomizes the order of slides
      shuffle: shuffle,
      // Returns an object with the available routes as booleans (left/right/top/bottom)
      availableRoutes: availableRoutes,
      // Returns an object with the available fragments as booleans (prev/next)
      availableFragments: availableFragments,
      // Toggles a help overlay with keyboard shortcuts
      toggleHelp: toggleHelp,
      // Toggles the overview mode on/off
      toggleOverview: toggleOverview,
      // Toggles the "black screen" mode on/off
      togglePause: togglePause,
      // Toggles the auto slide mode on/off
      toggleAutoSlide: toggleAutoSlide,
      // State checks
      isOverview: isOverview,
      isPaused: isPaused,
      isAutoSliding: isAutoSliding,
      isSpeakerNotes: isSpeakerNotes,
      // Slide preloading
      loadSlide: loadSlide,
      unloadSlide: unloadSlide,
      // Adds or removes all internal event listeners (such as keyboard)
      addEventListeners: addEventListeners,
      removeEventListeners: removeEventListeners,
      // Facility for persisting and restoring the presentation state
      getState: getState,
      setState: setState,
      // Presentation progress
      getSlidePastCount: getSlidePastCount,
      // Presentation progress on range of 0-1
      getProgress: getProgress,
      // Returns the indices of the current, or specified, slide
      getIndices: getIndices,
      // Returns an Array of all slides
      getSlides: getSlides,
      // Returns an Array of objects representing the attributes on
      // the slides
      getSlidesAttributes: getSlidesAttributes,
      // Returns the total number of slides
      getTotalSlides: getTotalSlides,
      // Returns the slide element at the specified index
      getSlide: getSlide,
      // Returns the slide background element at the specified index
      getSlideBackground: getSlideBackground,
      // Returns the speaker notes string for a slide, or null
      getSlideNotes: getSlideNotes,
      // Returns the previous slide element, may be null
      getPreviousSlide: function () {
        return previousSlide;
      },
      // Returns the current slide element
      getCurrentSlide: function () {
        return currentSlide;
      },
      // Returns the current scale of the presentation content
      getScale: function () {
        return scale;
      },
      // Returns the current configuration object
      getConfig: function () {
        return config;
      },
      // Helper method, retrieves query string as a key/value hash
      getQueryHash: function () {
        var query = {};
        location.search.replace(/[A-Z0-9]+?=([\w\.%-]*)/gi, function (a) {
          query[a.split('=').shift()] = a.split('=').pop();
        }); // Basic deserialization

        for (var i in query) {
          var value = query[i];
          query[i] = deserialize(unescape(value));
        }

        return query;
      },
      // Returns the top-level DOM element
      getRevealElement: function () {
        return dom.wrapper || document.querySelector('.reveal');
      },
      // Returns a hash with all registered plugins
      getPlugins: function () {
        return plugins;
      },
      // Returns true if we're currently on the first slide
      isFirstSlide: function () {
        return indexh === 0 && indexv === 0;
      },
      // Returns true if we're currently on the last slide
      isLastSlide: function () {
        if (currentSlide) {
          // Does this slide have a next sibling?
          if (currentSlide.nextElementSibling) return false; // If it's vertical, does its parent have a next sibling?

          if (isVerticalSlide(currentSlide) && currentSlide.parentNode.nextElementSibling) return false;
          return true;
        }

        return false;
      },
      // Returns true if we're on the last slide in the current
      // vertical stack
      isLastVerticalSlide: function () {
        if (currentSlide && isVerticalSlide(currentSlide)) {
          // Does this slide have a next sibling?
          if (currentSlide.nextElementSibling) return false;
          return true;
        }

        return false;
      },
      // Checks if reveal.js has been loaded and is ready for use
      isReady: function () {
        return loaded;
      },
      // Forward event binding to the reveal DOM element
      addEventListener: function (type, listener, useCapture) {
        if ('addEventListener' in window) {
          Reveal.getRevealElement().addEventListener(type, listener, useCapture);
        }
      },
      removeEventListener: function (type, listener, useCapture) {
        if ('addEventListener' in window) {
          Reveal.getRevealElement().removeEventListener(type, listener, useCapture);
        }
      },
      // Adds/removes a custom key binding
      addKeyBinding: addKeyBinding,
      removeKeyBinding: removeKeyBinding,
      // API for registering and retrieving plugins
      registerPlugin: registerPlugin,
      hasPlugin: hasPlugin,
      getPlugin: getPlugin,
      // Programmatically triggers a keyboard event
      triggerKey: function (keyCode) {
        onDocumentKeyDown({
          keyCode: keyCode
        });
      },
      // Registers a new shortcut to include in the help overlay
      registerKeyboardShortcut: function (key, value) {
        keyboardShortcuts[key] = value;
      }
    };
    return Reveal;
  });
});

const colors = [['#FFDFDF', '#00449E'], ['#000000', '#FFFF00'], ['#FFFF00', '#5E2CA5'], ['#111111', '#CCCCCC'], ['#111111', '#FF725C'], ['#FFFFFF', '#00449E'], ['#FF4136', '#000000'], ['#5E2CA5', '#E8FDF5'], ['#5E2CA5', '#FFDFDF'], ['#9EEBCF', '#5E2CA5'], ['#00449E', '#9EEBCF'], ['#00449E', '#F6FFFE'], ['#76C4E2', '#001B44'], ['#CDECFF', '#5E2CA5'], ['#CDECFF', '#00449E'], ['#F6FFFE', '#5E2CA5'], ['#E8FDF5', '#00449E'], ['#FFFCEB', '#555555'], ['#FFDFDF', '#5E2CA5']];
const fonts = ["American Typewriter", "Andalé Mono", "Apple Chancery", ".AquaKana", "Arial", "Arial Hebrew", "Ayuthaya", "Baghdad", "Baskerville", "Beijing", "BiauKai", "Big Caslon", "Brush Script", "Chalkboard", "Chalkduster", "Charcoal", "Charcoal CY", "Chicago", "Cochin", "Comic Sans", "Cooper", "Copperplate", "Corsiva Hebrew", "Courier", "Courier New", "DecoType Naskh", "Devanagari", "Didot", "Euphemia UCAS", "Fang Song", "Futura", "Gadget", "Geeza Pro", "Geezah", "Geneva", "Geneva CY", "Georgia", "Gill Sans", "Gujarati", "Gung Seoche", "Gurmukhi", "Hangangche", "HeadlineA", "Hei", "Helvetica", "Helvetica CY", "Helvetica Neue", "Herculanum", "Hiragino Kaku Gothic Pro", "Hiragino Kaku Gothic ProN", "Hiragino Kaku Gothic Std", "Hiragino Kaku Gothic StdN", "Hiragino Maru Gothic Pro", "Hiragino Maru Gothic ProN", "Hiragino Mincho Pro", "Hiragino Mincho ProN", "Hoefler Text", "Inai Mathi", "Impact", "Jung Gothic", "Kai", "Keyboard", "Krungthep", "KufiStandard GK", "LiHei Pro", "LiSong Pro", "Lucida Grande", "Marker Felt", "Menlo", "Monaco", "Monaco CY", "Mshtakan", "Nadeem", "New Peninim", "New York", "NISC GB18030", "Optima", "Osaka", "Palatino", "Papyrus", "PC Myungjo", "Pilgiche", "Plantagenet Cherokee", "Raanana", "Sand", "Sathu", "Seoul", "Shin Myungjo Neue", "Silom", "Skia", "Song", "ST FangSong", "ST Heiti", "ST Kaiti", "ST Song", "Tae Graphic", "Tahoma", "Taipei", "Techno", "Textile", "Thonburi", "Times", "Times CY", "Times New Roman", "Trebuchet MS", "Verdana", "Zapf Chancery", "Zapfino"];

const random = arr => {
  const length = arr.length;
  return arr[Math.floor(Math.random() * length)];
};

const extend = (base, ...objects) => {
  return Object.assign({}, JSON.parse(JSON.stringify(base)), ...objects);
};

const DEFAULT_OPTIONS = {
  'state-target': 'random-color',
  fonts,
  colors
};
function RevealRandomColors(options = {}) {
  const resolvedOptions = extend(DEFAULT_OPTIONS, options);
  const {
    colors,
    fonts
  } = resolvedOptions;
  return {
    init(RevealOrNot) {
      (RevealOrNot || Reveal).addEventListener('slidechanged', ({
        currentSlide
      }) => {
        const App = document.querySelector('.reveal[role="application"]');
        let color = null;
        let backgroundColor = null;
        let fontFamily = null;

        if (currentSlide.dataset.state === resolvedOptions['state-target']) {
          [color, backgroundColor] = random(colors);
          fontFamily = random(fonts);
        }

        App.style.color = color;
        App.style.backgroundColor = backgroundColor;
        App.style.fontFamily = fontFamily;
      });
    }

  };
}

var Aacute = "Á";
var aacute = "á";
var Abreve = "Ă";
var abreve = "ă";
var ac = "∾";
var acd = "∿";
var acE = "∾̳";
var Acirc = "Â";
var acirc = "â";
var acute = "´";
var Acy = "А";
var acy = "а";
var AElig = "Æ";
var aelig = "æ";
var af = "⁡";
var Afr = "𝔄";
var afr = "𝔞";
var Agrave = "À";
var agrave = "à";
var alefsym = "ℵ";
var aleph = "ℵ";
var Alpha = "Α";
var alpha = "α";
var Amacr = "Ā";
var amacr = "ā";
var amalg = "⨿";
var amp = "&";
var AMP = "&";
var andand = "⩕";
var And = "⩓";
var and = "∧";
var andd = "⩜";
var andslope = "⩘";
var andv = "⩚";
var ang = "∠";
var ange = "⦤";
var angle = "∠";
var angmsdaa = "⦨";
var angmsdab = "⦩";
var angmsdac = "⦪";
var angmsdad = "⦫";
var angmsdae = "⦬";
var angmsdaf = "⦭";
var angmsdag = "⦮";
var angmsdah = "⦯";
var angmsd = "∡";
var angrt = "∟";
var angrtvb = "⊾";
var angrtvbd = "⦝";
var angsph = "∢";
var angst = "Å";
var angzarr = "⍼";
var Aogon = "Ą";
var aogon = "ą";
var Aopf = "𝔸";
var aopf = "𝕒";
var apacir = "⩯";
var ap = "≈";
var apE = "⩰";
var ape = "≊";
var apid = "≋";
var apos = "'";
var ApplyFunction = "⁡";
var approx = "≈";
var approxeq = "≊";
var Aring = "Å";
var aring = "å";
var Ascr = "𝒜";
var ascr = "𝒶";
var Assign = "≔";
var ast = "*";
var asymp = "≈";
var asympeq = "≍";
var Atilde = "Ã";
var atilde = "ã";
var Auml = "Ä";
var auml = "ä";
var awconint = "∳";
var awint = "⨑";
var backcong = "≌";
var backepsilon = "϶";
var backprime = "‵";
var backsim = "∽";
var backsimeq = "⋍";
var Backslash = "∖";
var Barv = "⫧";
var barvee = "⊽";
var barwed = "⌅";
var Barwed = "⌆";
var barwedge = "⌅";
var bbrk = "⎵";
var bbrktbrk = "⎶";
var bcong = "≌";
var Bcy = "Б";
var bcy = "б";
var bdquo = "„";
var becaus = "∵";
var because = "∵";
var Because = "∵";
var bemptyv = "⦰";
var bepsi = "϶";
var bernou = "ℬ";
var Bernoullis = "ℬ";
var Beta = "Β";
var beta = "β";
var beth = "ℶ";
var between = "≬";
var Bfr = "𝔅";
var bfr = "𝔟";
var bigcap = "⋂";
var bigcirc = "◯";
var bigcup = "⋃";
var bigodot = "⨀";
var bigoplus = "⨁";
var bigotimes = "⨂";
var bigsqcup = "⨆";
var bigstar = "★";
var bigtriangledown = "▽";
var bigtriangleup = "△";
var biguplus = "⨄";
var bigvee = "⋁";
var bigwedge = "⋀";
var bkarow = "⤍";
var blacklozenge = "⧫";
var blacksquare = "▪";
var blacktriangle = "▴";
var blacktriangledown = "▾";
var blacktriangleleft = "◂";
var blacktriangleright = "▸";
var blank = "␣";
var blk12 = "▒";
var blk14 = "░";
var blk34 = "▓";
var block = "█";
var bne = "=⃥";
var bnequiv = "≡⃥";
var bNot = "⫭";
var bnot = "⌐";
var Bopf = "𝔹";
var bopf = "𝕓";
var bot = "⊥";
var bottom = "⊥";
var bowtie = "⋈";
var boxbox = "⧉";
var boxdl = "┐";
var boxdL = "╕";
var boxDl = "╖";
var boxDL = "╗";
var boxdr = "┌";
var boxdR = "╒";
var boxDr = "╓";
var boxDR = "╔";
var boxh = "─";
var boxH = "═";
var boxhd = "┬";
var boxHd = "╤";
var boxhD = "╥";
var boxHD = "╦";
var boxhu = "┴";
var boxHu = "╧";
var boxhU = "╨";
var boxHU = "╩";
var boxminus = "⊟";
var boxplus = "⊞";
var boxtimes = "⊠";
var boxul = "┘";
var boxuL = "╛";
var boxUl = "╜";
var boxUL = "╝";
var boxur = "└";
var boxuR = "╘";
var boxUr = "╙";
var boxUR = "╚";
var boxv = "│";
var boxV = "║";
var boxvh = "┼";
var boxvH = "╪";
var boxVh = "╫";
var boxVH = "╬";
var boxvl = "┤";
var boxvL = "╡";
var boxVl = "╢";
var boxVL = "╣";
var boxvr = "├";
var boxvR = "╞";
var boxVr = "╟";
var boxVR = "╠";
var bprime = "‵";
var breve = "˘";
var Breve = "˘";
var brvbar = "¦";
var bscr = "𝒷";
var Bscr = "ℬ";
var bsemi = "⁏";
var bsim = "∽";
var bsime = "⋍";
var bsolb = "⧅";
var bsol = "\\";
var bsolhsub = "⟈";
var bull = "•";
var bullet = "•";
var bump = "≎";
var bumpE = "⪮";
var bumpe = "≏";
var Bumpeq = "≎";
var bumpeq = "≏";
var Cacute = "Ć";
var cacute = "ć";
var capand = "⩄";
var capbrcup = "⩉";
var capcap = "⩋";
var cap = "∩";
var Cap = "⋒";
var capcup = "⩇";
var capdot = "⩀";
var CapitalDifferentialD = "ⅅ";
var caps = "∩︀";
var caret = "⁁";
var caron = "ˇ";
var Cayleys = "ℭ";
var ccaps = "⩍";
var Ccaron = "Č";
var ccaron = "č";
var Ccedil = "Ç";
var ccedil = "ç";
var Ccirc = "Ĉ";
var ccirc = "ĉ";
var Cconint = "∰";
var ccups = "⩌";
var ccupssm = "⩐";
var Cdot = "Ċ";
var cdot = "ċ";
var cedil = "¸";
var Cedilla = "¸";
var cemptyv = "⦲";
var cent = "¢";
var centerdot = "·";
var CenterDot = "·";
var cfr = "𝔠";
var Cfr = "ℭ";
var CHcy = "Ч";
var chcy = "ч";
var check = "✓";
var checkmark = "✓";
var Chi = "Χ";
var chi = "χ";
var circ = "ˆ";
var circeq = "≗";
var circlearrowleft = "↺";
var circlearrowright = "↻";
var circledast = "⊛";
var circledcirc = "⊚";
var circleddash = "⊝";
var CircleDot = "⊙";
var circledR = "®";
var circledS = "Ⓢ";
var CircleMinus = "⊖";
var CirclePlus = "⊕";
var CircleTimes = "⊗";
var cir = "○";
var cirE = "⧃";
var cire = "≗";
var cirfnint = "⨐";
var cirmid = "⫯";
var cirscir = "⧂";
var ClockwiseContourIntegral = "∲";
var CloseCurlyDoubleQuote = "”";
var CloseCurlyQuote = "’";
var clubs = "♣";
var clubsuit = "♣";
var colon = ":";
var Colon = "∷";
var Colone = "⩴";
var colone = "≔";
var coloneq = "≔";
var comma = ",";
var commat = "@";
var comp = "∁";
var compfn = "∘";
var complement = "∁";
var complexes = "ℂ";
var cong = "≅";
var congdot = "⩭";
var Congruent = "≡";
var conint = "∮";
var Conint = "∯";
var ContourIntegral = "∮";
var copf = "𝕔";
var Copf = "ℂ";
var coprod = "∐";
var Coproduct = "∐";
var copy = "©";
var COPY = "©";
var copysr = "℗";
var CounterClockwiseContourIntegral = "∳";
var crarr = "↵";
var cross = "✗";
var Cross = "⨯";
var Cscr = "𝒞";
var cscr = "𝒸";
var csub = "⫏";
var csube = "⫑";
var csup = "⫐";
var csupe = "⫒";
var ctdot = "⋯";
var cudarrl = "⤸";
var cudarrr = "⤵";
var cuepr = "⋞";
var cuesc = "⋟";
var cularr = "↶";
var cularrp = "⤽";
var cupbrcap = "⩈";
var cupcap = "⩆";
var CupCap = "≍";
var cup = "∪";
var Cup = "⋓";
var cupcup = "⩊";
var cupdot = "⊍";
var cupor = "⩅";
var cups = "∪︀";
var curarr = "↷";
var curarrm = "⤼";
var curlyeqprec = "⋞";
var curlyeqsucc = "⋟";
var curlyvee = "⋎";
var curlywedge = "⋏";
var curren = "¤";
var curvearrowleft = "↶";
var curvearrowright = "↷";
var cuvee = "⋎";
var cuwed = "⋏";
var cwconint = "∲";
var cwint = "∱";
var cylcty = "⌭";
var dagger = "†";
var Dagger = "‡";
var daleth = "ℸ";
var darr = "↓";
var Darr = "↡";
var dArr = "⇓";
var dash = "‐";
var Dashv = "⫤";
var dashv = "⊣";
var dbkarow = "⤏";
var dblac = "˝";
var Dcaron = "Ď";
var dcaron = "ď";
var Dcy = "Д";
var dcy = "д";
var ddagger = "‡";
var ddarr = "⇊";
var DD = "ⅅ";
var dd = "ⅆ";
var DDotrahd = "⤑";
var ddotseq = "⩷";
var deg = "°";
var Del = "∇";
var Delta = "Δ";
var delta = "δ";
var demptyv = "⦱";
var dfisht = "⥿";
var Dfr = "𝔇";
var dfr = "𝔡";
var dHar = "⥥";
var dharl = "⇃";
var dharr = "⇂";
var DiacriticalAcute = "´";
var DiacriticalDot = "˙";
var DiacriticalDoubleAcute = "˝";
var DiacriticalGrave = "`";
var DiacriticalTilde = "˜";
var diam = "⋄";
var diamond = "⋄";
var Diamond = "⋄";
var diamondsuit = "♦";
var diams = "♦";
var die = "¨";
var DifferentialD = "ⅆ";
var digamma = "ϝ";
var disin = "⋲";
var div = "÷";
var divide = "÷";
var divideontimes = "⋇";
var divonx = "⋇";
var DJcy = "Ђ";
var djcy = "ђ";
var dlcorn = "⌞";
var dlcrop = "⌍";
var dollar = "$";
var Dopf = "𝔻";
var dopf = "𝕕";
var Dot = "¨";
var dot = "˙";
var DotDot = "⃜";
var doteq = "≐";
var doteqdot = "≑";
var DotEqual = "≐";
var dotminus = "∸";
var dotplus = "∔";
var dotsquare = "⊡";
var doublebarwedge = "⌆";
var DoubleContourIntegral = "∯";
var DoubleDot = "¨";
var DoubleDownArrow = "⇓";
var DoubleLeftArrow = "⇐";
var DoubleLeftRightArrow = "⇔";
var DoubleLeftTee = "⫤";
var DoubleLongLeftArrow = "⟸";
var DoubleLongLeftRightArrow = "⟺";
var DoubleLongRightArrow = "⟹";
var DoubleRightArrow = "⇒";
var DoubleRightTee = "⊨";
var DoubleUpArrow = "⇑";
var DoubleUpDownArrow = "⇕";
var DoubleVerticalBar = "∥";
var DownArrowBar = "⤓";
var downarrow = "↓";
var DownArrow = "↓";
var Downarrow = "⇓";
var DownArrowUpArrow = "⇵";
var DownBreve = "̑";
var downdownarrows = "⇊";
var downharpoonleft = "⇃";
var downharpoonright = "⇂";
var DownLeftRightVector = "⥐";
var DownLeftTeeVector = "⥞";
var DownLeftVectorBar = "⥖";
var DownLeftVector = "↽";
var DownRightTeeVector = "⥟";
var DownRightVectorBar = "⥗";
var DownRightVector = "⇁";
var DownTeeArrow = "↧";
var DownTee = "⊤";
var drbkarow = "⤐";
var drcorn = "⌟";
var drcrop = "⌌";
var Dscr = "𝒟";
var dscr = "𝒹";
var DScy = "Ѕ";
var dscy = "ѕ";
var dsol = "⧶";
var Dstrok = "Đ";
var dstrok = "đ";
var dtdot = "⋱";
var dtri = "▿";
var dtrif = "▾";
var duarr = "⇵";
var duhar = "⥯";
var dwangle = "⦦";
var DZcy = "Џ";
var dzcy = "џ";
var dzigrarr = "⟿";
var Eacute = "É";
var eacute = "é";
var easter = "⩮";
var Ecaron = "Ě";
var ecaron = "ě";
var Ecirc = "Ê";
var ecirc = "ê";
var ecir = "≖";
var ecolon = "≕";
var Ecy = "Э";
var ecy = "э";
var eDDot = "⩷";
var Edot = "Ė";
var edot = "ė";
var eDot = "≑";
var ee = "ⅇ";
var efDot = "≒";
var Efr = "𝔈";
var efr = "𝔢";
var eg = "⪚";
var Egrave = "È";
var egrave = "è";
var egs = "⪖";
var egsdot = "⪘";
var el = "⪙";
var Element = "∈";
var elinters = "⏧";
var ell = "ℓ";
var els = "⪕";
var elsdot = "⪗";
var Emacr = "Ē";
var emacr = "ē";
var empty = "∅";
var emptyset = "∅";
var EmptySmallSquare = "◻";
var emptyv = "∅";
var EmptyVerySmallSquare = "▫";
var emsp13 = " ";
var emsp14 = " ";
var emsp = " ";
var ENG = "Ŋ";
var eng = "ŋ";
var ensp = " ";
var Eogon = "Ę";
var eogon = "ę";
var Eopf = "𝔼";
var eopf = "𝕖";
var epar = "⋕";
var eparsl = "⧣";
var eplus = "⩱";
var epsi = "ε";
var Epsilon = "Ε";
var epsilon = "ε";
var epsiv = "ϵ";
var eqcirc = "≖";
var eqcolon = "≕";
var eqsim = "≂";
var eqslantgtr = "⪖";
var eqslantless = "⪕";
var Equal = "⩵";
var equals = "=";
var EqualTilde = "≂";
var equest = "≟";
var Equilibrium = "⇌";
var equiv = "≡";
var equivDD = "⩸";
var eqvparsl = "⧥";
var erarr = "⥱";
var erDot = "≓";
var escr = "ℯ";
var Escr = "ℰ";
var esdot = "≐";
var Esim = "⩳";
var esim = "≂";
var Eta = "Η";
var eta = "η";
var ETH = "Ð";
var eth = "ð";
var Euml = "Ë";
var euml = "ë";
var euro = "€";
var excl = "!";
var exist = "∃";
var Exists = "∃";
var expectation = "ℰ";
var exponentiale = "ⅇ";
var ExponentialE = "ⅇ";
var fallingdotseq = "≒";
var Fcy = "Ф";
var fcy = "ф";
var female = "♀";
var ffilig = "ﬃ";
var fflig = "ﬀ";
var ffllig = "ﬄ";
var Ffr = "𝔉";
var ffr = "𝔣";
var filig = "ﬁ";
var FilledSmallSquare = "◼";
var FilledVerySmallSquare = "▪";
var fjlig = "fj";
var flat = "♭";
var fllig = "ﬂ";
var fltns = "▱";
var fnof = "ƒ";
var Fopf = "𝔽";
var fopf = "𝕗";
var forall = "∀";
var ForAll = "∀";
var fork = "⋔";
var forkv = "⫙";
var Fouriertrf = "ℱ";
var fpartint = "⨍";
var frac12 = "½";
var frac13 = "⅓";
var frac14 = "¼";
var frac15 = "⅕";
var frac16 = "⅙";
var frac18 = "⅛";
var frac23 = "⅔";
var frac25 = "⅖";
var frac34 = "¾";
var frac35 = "⅗";
var frac38 = "⅜";
var frac45 = "⅘";
var frac56 = "⅚";
var frac58 = "⅝";
var frac78 = "⅞";
var frasl = "⁄";
var frown = "⌢";
var fscr = "𝒻";
var Fscr = "ℱ";
var gacute = "ǵ";
var Gamma = "Γ";
var gamma = "γ";
var Gammad = "Ϝ";
var gammad = "ϝ";
var gap = "⪆";
var Gbreve = "Ğ";
var gbreve = "ğ";
var Gcedil = "Ģ";
var Gcirc = "Ĝ";
var gcirc = "ĝ";
var Gcy = "Г";
var gcy = "г";
var Gdot = "Ġ";
var gdot = "ġ";
var ge = "≥";
var gE = "≧";
var gEl = "⪌";
var gel = "⋛";
var geq = "≥";
var geqq = "≧";
var geqslant = "⩾";
var gescc = "⪩";
var ges = "⩾";
var gesdot = "⪀";
var gesdoto = "⪂";
var gesdotol = "⪄";
var gesl = "⋛︀";
var gesles = "⪔";
var Gfr = "𝔊";
var gfr = "𝔤";
var gg = "≫";
var Gg = "⋙";
var ggg = "⋙";
var gimel = "ℷ";
var GJcy = "Ѓ";
var gjcy = "ѓ";
var gla = "⪥";
var gl = "≷";
var glE = "⪒";
var glj = "⪤";
var gnap = "⪊";
var gnapprox = "⪊";
var gne = "⪈";
var gnE = "≩";
var gneq = "⪈";
var gneqq = "≩";
var gnsim = "⋧";
var Gopf = "𝔾";
var gopf = "𝕘";
var grave = "`";
var GreaterEqual = "≥";
var GreaterEqualLess = "⋛";
var GreaterFullEqual = "≧";
var GreaterGreater = "⪢";
var GreaterLess = "≷";
var GreaterSlantEqual = "⩾";
var GreaterTilde = "≳";
var Gscr = "𝒢";
var gscr = "ℊ";
var gsim = "≳";
var gsime = "⪎";
var gsiml = "⪐";
var gtcc = "⪧";
var gtcir = "⩺";
var gt = ">";
var GT = ">";
var Gt = "≫";
var gtdot = "⋗";
var gtlPar = "⦕";
var gtquest = "⩼";
var gtrapprox = "⪆";
var gtrarr = "⥸";
var gtrdot = "⋗";
var gtreqless = "⋛";
var gtreqqless = "⪌";
var gtrless = "≷";
var gtrsim = "≳";
var gvertneqq = "≩︀";
var gvnE = "≩︀";
var Hacek = "ˇ";
var hairsp = " ";
var half = "½";
var hamilt = "ℋ";
var HARDcy = "Ъ";
var hardcy = "ъ";
var harrcir = "⥈";
var harr = "↔";
var hArr = "⇔";
var harrw = "↭";
var Hat = "^";
var hbar = "ℏ";
var Hcirc = "Ĥ";
var hcirc = "ĥ";
var hearts = "♥";
var heartsuit = "♥";
var hellip = "…";
var hercon = "⊹";
var hfr = "𝔥";
var Hfr = "ℌ";
var HilbertSpace = "ℋ";
var hksearow = "⤥";
var hkswarow = "⤦";
var hoarr = "⇿";
var homtht = "∻";
var hookleftarrow = "↩";
var hookrightarrow = "↪";
var hopf = "𝕙";
var Hopf = "ℍ";
var horbar = "―";
var HorizontalLine = "─";
var hscr = "𝒽";
var Hscr = "ℋ";
var hslash = "ℏ";
var Hstrok = "Ħ";
var hstrok = "ħ";
var HumpDownHump = "≎";
var HumpEqual = "≏";
var hybull = "⁃";
var hyphen = "‐";
var Iacute = "Í";
var iacute = "í";
var ic = "⁣";
var Icirc = "Î";
var icirc = "î";
var Icy = "И";
var icy = "и";
var Idot = "İ";
var IEcy = "Е";
var iecy = "е";
var iexcl = "¡";
var iff = "⇔";
var ifr = "𝔦";
var Ifr = "ℑ";
var Igrave = "Ì";
var igrave = "ì";
var ii = "ⅈ";
var iiiint = "⨌";
var iiint = "∭";
var iinfin = "⧜";
var iiota = "℩";
var IJlig = "Ĳ";
var ijlig = "ĳ";
var Imacr = "Ī";
var imacr = "ī";
var image = "ℑ";
var ImaginaryI = "ⅈ";
var imagline = "ℐ";
var imagpart = "ℑ";
var imath = "ı";
var Im = "ℑ";
var imof = "⊷";
var imped = "Ƶ";
var Implies = "⇒";
var incare = "℅";
var infin = "∞";
var infintie = "⧝";
var inodot = "ı";
var intcal = "⊺";
var int = "∫";
var Int = "∬";
var integers = "ℤ";
var Integral = "∫";
var intercal = "⊺";
var Intersection = "⋂";
var intlarhk = "⨗";
var intprod = "⨼";
var InvisibleComma = "⁣";
var InvisibleTimes = "⁢";
var IOcy = "Ё";
var iocy = "ё";
var Iogon = "Į";
var iogon = "į";
var Iopf = "𝕀";
var iopf = "𝕚";
var Iota = "Ι";
var iota = "ι";
var iprod = "⨼";
var iquest = "¿";
var iscr = "𝒾";
var Iscr = "ℐ";
var isin = "∈";
var isindot = "⋵";
var isinE = "⋹";
var isins = "⋴";
var isinsv = "⋳";
var isinv = "∈";
var it = "⁢";
var Itilde = "Ĩ";
var itilde = "ĩ";
var Iukcy = "І";
var iukcy = "і";
var Iuml = "Ï";
var iuml = "ï";
var Jcirc = "Ĵ";
var jcirc = "ĵ";
var Jcy = "Й";
var jcy = "й";
var Jfr = "𝔍";
var jfr = "𝔧";
var jmath = "ȷ";
var Jopf = "𝕁";
var jopf = "𝕛";
var Jscr = "𝒥";
var jscr = "𝒿";
var Jsercy = "Ј";
var jsercy = "ј";
var Jukcy = "Є";
var jukcy = "є";
var Kappa = "Κ";
var kappa = "κ";
var kappav = "ϰ";
var Kcedil = "Ķ";
var kcedil = "ķ";
var Kcy = "К";
var kcy = "к";
var Kfr = "𝔎";
var kfr = "𝔨";
var kgreen = "ĸ";
var KHcy = "Х";
var khcy = "х";
var KJcy = "Ќ";
var kjcy = "ќ";
var Kopf = "𝕂";
var kopf = "𝕜";
var Kscr = "𝒦";
var kscr = "𝓀";
var lAarr = "⇚";
var Lacute = "Ĺ";
var lacute = "ĺ";
var laemptyv = "⦴";
var lagran = "ℒ";
var Lambda = "Λ";
var lambda = "λ";
var lang = "⟨";
var Lang = "⟪";
var langd = "⦑";
var langle = "⟨";
var lap = "⪅";
var Laplacetrf = "ℒ";
var laquo = "«";
var larrb = "⇤";
var larrbfs = "⤟";
var larr = "←";
var Larr = "↞";
var lArr = "⇐";
var larrfs = "⤝";
var larrhk = "↩";
var larrlp = "↫";
var larrpl = "⤹";
var larrsim = "⥳";
var larrtl = "↢";
var latail = "⤙";
var lAtail = "⤛";
var lat = "⪫";
var late = "⪭";
var lates = "⪭︀";
var lbarr = "⤌";
var lBarr = "⤎";
var lbbrk = "❲";
var lbrace = "{";
var lbrack = "[";
var lbrke = "⦋";
var lbrksld = "⦏";
var lbrkslu = "⦍";
var Lcaron = "Ľ";
var lcaron = "ľ";
var Lcedil = "Ļ";
var lcedil = "ļ";
var lceil = "⌈";
var lcub = "{";
var Lcy = "Л";
var lcy = "л";
var ldca = "⤶";
var ldquo = "“";
var ldquor = "„";
var ldrdhar = "⥧";
var ldrushar = "⥋";
var ldsh = "↲";
var le = "≤";
var lE = "≦";
var LeftAngleBracket = "⟨";
var LeftArrowBar = "⇤";
var leftarrow = "←";
var LeftArrow = "←";
var Leftarrow = "⇐";
var LeftArrowRightArrow = "⇆";
var leftarrowtail = "↢";
var LeftCeiling = "⌈";
var LeftDoubleBracket = "⟦";
var LeftDownTeeVector = "⥡";
var LeftDownVectorBar = "⥙";
var LeftDownVector = "⇃";
var LeftFloor = "⌊";
var leftharpoondown = "↽";
var leftharpoonup = "↼";
var leftleftarrows = "⇇";
var leftrightarrow = "↔";
var LeftRightArrow = "↔";
var Leftrightarrow = "⇔";
var leftrightarrows = "⇆";
var leftrightharpoons = "⇋";
var leftrightsquigarrow = "↭";
var LeftRightVector = "⥎";
var LeftTeeArrow = "↤";
var LeftTee = "⊣";
var LeftTeeVector = "⥚";
var leftthreetimes = "⋋";
var LeftTriangleBar = "⧏";
var LeftTriangle = "⊲";
var LeftTriangleEqual = "⊴";
var LeftUpDownVector = "⥑";
var LeftUpTeeVector = "⥠";
var LeftUpVectorBar = "⥘";
var LeftUpVector = "↿";
var LeftVectorBar = "⥒";
var LeftVector = "↼";
var lEg = "⪋";
var leg = "⋚";
var leq = "≤";
var leqq = "≦";
var leqslant = "⩽";
var lescc = "⪨";
var les = "⩽";
var lesdot = "⩿";
var lesdoto = "⪁";
var lesdotor = "⪃";
var lesg = "⋚︀";
var lesges = "⪓";
var lessapprox = "⪅";
var lessdot = "⋖";
var lesseqgtr = "⋚";
var lesseqqgtr = "⪋";
var LessEqualGreater = "⋚";
var LessFullEqual = "≦";
var LessGreater = "≶";
var lessgtr = "≶";
var LessLess = "⪡";
var lesssim = "≲";
var LessSlantEqual = "⩽";
var LessTilde = "≲";
var lfisht = "⥼";
var lfloor = "⌊";
var Lfr = "𝔏";
var lfr = "𝔩";
var lg = "≶";
var lgE = "⪑";
var lHar = "⥢";
var lhard = "↽";
var lharu = "↼";
var lharul = "⥪";
var lhblk = "▄";
var LJcy = "Љ";
var ljcy = "љ";
var llarr = "⇇";
var ll = "≪";
var Ll = "⋘";
var llcorner = "⌞";
var Lleftarrow = "⇚";
var llhard = "⥫";
var lltri = "◺";
var Lmidot = "Ŀ";
var lmidot = "ŀ";
var lmoustache = "⎰";
var lmoust = "⎰";
var lnap = "⪉";
var lnapprox = "⪉";
var lne = "⪇";
var lnE = "≨";
var lneq = "⪇";
var lneqq = "≨";
var lnsim = "⋦";
var loang = "⟬";
var loarr = "⇽";
var lobrk = "⟦";
var longleftarrow = "⟵";
var LongLeftArrow = "⟵";
var Longleftarrow = "⟸";
var longleftrightarrow = "⟷";
var LongLeftRightArrow = "⟷";
var Longleftrightarrow = "⟺";
var longmapsto = "⟼";
var longrightarrow = "⟶";
var LongRightArrow = "⟶";
var Longrightarrow = "⟹";
var looparrowleft = "↫";
var looparrowright = "↬";
var lopar = "⦅";
var Lopf = "𝕃";
var lopf = "𝕝";
var loplus = "⨭";
var lotimes = "⨴";
var lowast = "∗";
var lowbar = "_";
var LowerLeftArrow = "↙";
var LowerRightArrow = "↘";
var loz = "◊";
var lozenge = "◊";
var lozf = "⧫";
var lpar = "(";
var lparlt = "⦓";
var lrarr = "⇆";
var lrcorner = "⌟";
var lrhar = "⇋";
var lrhard = "⥭";
var lrm = "‎";
var lrtri = "⊿";
var lsaquo = "‹";
var lscr = "𝓁";
var Lscr = "ℒ";
var lsh = "↰";
var Lsh = "↰";
var lsim = "≲";
var lsime = "⪍";
var lsimg = "⪏";
var lsqb = "[";
var lsquo = "‘";
var lsquor = "‚";
var Lstrok = "Ł";
var lstrok = "ł";
var ltcc = "⪦";
var ltcir = "⩹";
var lt = "<";
var LT = "<";
var Lt = "≪";
var ltdot = "⋖";
var lthree = "⋋";
var ltimes = "⋉";
var ltlarr = "⥶";
var ltquest = "⩻";
var ltri = "◃";
var ltrie = "⊴";
var ltrif = "◂";
var ltrPar = "⦖";
var lurdshar = "⥊";
var luruhar = "⥦";
var lvertneqq = "≨︀";
var lvnE = "≨︀";
var macr = "¯";
var male = "♂";
var malt = "✠";
var maltese = "✠";
var map = "↦";
var mapsto = "↦";
var mapstodown = "↧";
var mapstoleft = "↤";
var mapstoup = "↥";
var marker = "▮";
var mcomma = "⨩";
var Mcy = "М";
var mcy = "м";
var mdash = "—";
var mDDot = "∺";
var measuredangle = "∡";
var MediumSpace = " ";
var Mellintrf = "ℳ";
var Mfr = "𝔐";
var mfr = "𝔪";
var mho = "℧";
var micro = "µ";
var midast = "*";
var midcir = "⫰";
var mid = "∣";
var middot = "·";
var minusb = "⊟";
var minus = "−";
var minusd = "∸";
var minusdu = "⨪";
var MinusPlus = "∓";
var mlcp = "⫛";
var mldr = "…";
var mnplus = "∓";
var models = "⊧";
var Mopf = "𝕄";
var mopf = "𝕞";
var mp = "∓";
var mscr = "𝓂";
var Mscr = "ℳ";
var mstpos = "∾";
var Mu = "Μ";
var mu = "μ";
var multimap = "⊸";
var mumap = "⊸";
var nabla = "∇";
var Nacute = "Ń";
var nacute = "ń";
var nang = "∠⃒";
var nap = "≉";
var napE = "⩰̸";
var napid = "≋̸";
var napos = "ŉ";
var napprox = "≉";
var natural = "♮";
var naturals = "ℕ";
var natur = "♮";
var nbsp = " ";
var nbump = "≎̸";
var nbumpe = "≏̸";
var ncap = "⩃";
var Ncaron = "Ň";
var ncaron = "ň";
var Ncedil = "Ņ";
var ncedil = "ņ";
var ncong = "≇";
var ncongdot = "⩭̸";
var ncup = "⩂";
var Ncy = "Н";
var ncy = "н";
var ndash = "–";
var nearhk = "⤤";
var nearr = "↗";
var neArr = "⇗";
var nearrow = "↗";
var ne = "≠";
var nedot = "≐̸";
var NegativeMediumSpace = "​";
var NegativeThickSpace = "​";
var NegativeThinSpace = "​";
var NegativeVeryThinSpace = "​";
var nequiv = "≢";
var nesear = "⤨";
var nesim = "≂̸";
var NestedGreaterGreater = "≫";
var NestedLessLess = "≪";
var NewLine = "\n";
var nexist = "∄";
var nexists = "∄";
var Nfr = "𝔑";
var nfr = "𝔫";
var ngE = "≧̸";
var nge = "≱";
var ngeq = "≱";
var ngeqq = "≧̸";
var ngeqslant = "⩾̸";
var nges = "⩾̸";
var nGg = "⋙̸";
var ngsim = "≵";
var nGt = "≫⃒";
var ngt = "≯";
var ngtr = "≯";
var nGtv = "≫̸";
var nharr = "↮";
var nhArr = "⇎";
var nhpar = "⫲";
var ni = "∋";
var nis = "⋼";
var nisd = "⋺";
var niv = "∋";
var NJcy = "Њ";
var njcy = "њ";
var nlarr = "↚";
var nlArr = "⇍";
var nldr = "‥";
var nlE = "≦̸";
var nle = "≰";
var nleftarrow = "↚";
var nLeftarrow = "⇍";
var nleftrightarrow = "↮";
var nLeftrightarrow = "⇎";
var nleq = "≰";
var nleqq = "≦̸";
var nleqslant = "⩽̸";
var nles = "⩽̸";
var nless = "≮";
var nLl = "⋘̸";
var nlsim = "≴";
var nLt = "≪⃒";
var nlt = "≮";
var nltri = "⋪";
var nltrie = "⋬";
var nLtv = "≪̸";
var nmid = "∤";
var NoBreak = "⁠";
var NonBreakingSpace = " ";
var nopf = "𝕟";
var Nopf = "ℕ";
var Not = "⫬";
var not = "¬";
var NotCongruent = "≢";
var NotCupCap = "≭";
var NotDoubleVerticalBar = "∦";
var NotElement = "∉";
var NotEqual = "≠";
var NotEqualTilde = "≂̸";
var NotExists = "∄";
var NotGreater = "≯";
var NotGreaterEqual = "≱";
var NotGreaterFullEqual = "≧̸";
var NotGreaterGreater = "≫̸";
var NotGreaterLess = "≹";
var NotGreaterSlantEqual = "⩾̸";
var NotGreaterTilde = "≵";
var NotHumpDownHump = "≎̸";
var NotHumpEqual = "≏̸";
var notin = "∉";
var notindot = "⋵̸";
var notinE = "⋹̸";
var notinva = "∉";
var notinvb = "⋷";
var notinvc = "⋶";
var NotLeftTriangleBar = "⧏̸";
var NotLeftTriangle = "⋪";
var NotLeftTriangleEqual = "⋬";
var NotLess = "≮";
var NotLessEqual = "≰";
var NotLessGreater = "≸";
var NotLessLess = "≪̸";
var NotLessSlantEqual = "⩽̸";
var NotLessTilde = "≴";
var NotNestedGreaterGreater = "⪢̸";
var NotNestedLessLess = "⪡̸";
var notni = "∌";
var notniva = "∌";
var notnivb = "⋾";
var notnivc = "⋽";
var NotPrecedes = "⊀";
var NotPrecedesEqual = "⪯̸";
var NotPrecedesSlantEqual = "⋠";
var NotReverseElement = "∌";
var NotRightTriangleBar = "⧐̸";
var NotRightTriangle = "⋫";
var NotRightTriangleEqual = "⋭";
var NotSquareSubset = "⊏̸";
var NotSquareSubsetEqual = "⋢";
var NotSquareSuperset = "⊐̸";
var NotSquareSupersetEqual = "⋣";
var NotSubset = "⊂⃒";
var NotSubsetEqual = "⊈";
var NotSucceeds = "⊁";
var NotSucceedsEqual = "⪰̸";
var NotSucceedsSlantEqual = "⋡";
var NotSucceedsTilde = "≿̸";
var NotSuperset = "⊃⃒";
var NotSupersetEqual = "⊉";
var NotTilde = "≁";
var NotTildeEqual = "≄";
var NotTildeFullEqual = "≇";
var NotTildeTilde = "≉";
var NotVerticalBar = "∤";
var nparallel = "∦";
var npar = "∦";
var nparsl = "⫽⃥";
var npart = "∂̸";
var npolint = "⨔";
var npr = "⊀";
var nprcue = "⋠";
var nprec = "⊀";
var npreceq = "⪯̸";
var npre = "⪯̸";
var nrarrc = "⤳̸";
var nrarr = "↛";
var nrArr = "⇏";
var nrarrw = "↝̸";
var nrightarrow = "↛";
var nRightarrow = "⇏";
var nrtri = "⋫";
var nrtrie = "⋭";
var nsc = "⊁";
var nsccue = "⋡";
var nsce = "⪰̸";
var Nscr = "𝒩";
var nscr = "𝓃";
var nshortmid = "∤";
var nshortparallel = "∦";
var nsim = "≁";
var nsime = "≄";
var nsimeq = "≄";
var nsmid = "∤";
var nspar = "∦";
var nsqsube = "⋢";
var nsqsupe = "⋣";
var nsub = "⊄";
var nsubE = "⫅̸";
var nsube = "⊈";
var nsubset = "⊂⃒";
var nsubseteq = "⊈";
var nsubseteqq = "⫅̸";
var nsucc = "⊁";
var nsucceq = "⪰̸";
var nsup = "⊅";
var nsupE = "⫆̸";
var nsupe = "⊉";
var nsupset = "⊃⃒";
var nsupseteq = "⊉";
var nsupseteqq = "⫆̸";
var ntgl = "≹";
var Ntilde = "Ñ";
var ntilde = "ñ";
var ntlg = "≸";
var ntriangleleft = "⋪";
var ntrianglelefteq = "⋬";
var ntriangleright = "⋫";
var ntrianglerighteq = "⋭";
var Nu = "Ν";
var nu = "ν";
var num = "#";
var numero = "№";
var numsp = " ";
var nvap = "≍⃒";
var nvdash = "⊬";
var nvDash = "⊭";
var nVdash = "⊮";
var nVDash = "⊯";
var nvge = "≥⃒";
var nvgt = ">⃒";
var nvHarr = "⤄";
var nvinfin = "⧞";
var nvlArr = "⤂";
var nvle = "≤⃒";
var nvlt = "<⃒";
var nvltrie = "⊴⃒";
var nvrArr = "⤃";
var nvrtrie = "⊵⃒";
var nvsim = "∼⃒";
var nwarhk = "⤣";
var nwarr = "↖";
var nwArr = "⇖";
var nwarrow = "↖";
var nwnear = "⤧";
var Oacute = "Ó";
var oacute = "ó";
var oast = "⊛";
var Ocirc = "Ô";
var ocirc = "ô";
var ocir = "⊚";
var Ocy = "О";
var ocy = "о";
var odash = "⊝";
var Odblac = "Ő";
var odblac = "ő";
var odiv = "⨸";
var odot = "⊙";
var odsold = "⦼";
var OElig = "Œ";
var oelig = "œ";
var ofcir = "⦿";
var Ofr = "𝔒";
var ofr = "𝔬";
var ogon = "˛";
var Ograve = "Ò";
var ograve = "ò";
var ogt = "⧁";
var ohbar = "⦵";
var ohm = "Ω";
var oint = "∮";
var olarr = "↺";
var olcir = "⦾";
var olcross = "⦻";
var oline = "‾";
var olt = "⧀";
var Omacr = "Ō";
var omacr = "ō";
var Omega = "Ω";
var omega = "ω";
var Omicron = "Ο";
var omicron = "ο";
var omid = "⦶";
var ominus = "⊖";
var Oopf = "𝕆";
var oopf = "𝕠";
var opar = "⦷";
var OpenCurlyDoubleQuote = "“";
var OpenCurlyQuote = "‘";
var operp = "⦹";
var oplus = "⊕";
var orarr = "↻";
var Or = "⩔";
var or = "∨";
var ord = "⩝";
var order = "ℴ";
var orderof = "ℴ";
var ordf = "ª";
var ordm = "º";
var origof = "⊶";
var oror = "⩖";
var orslope = "⩗";
var orv = "⩛";
var oS = "Ⓢ";
var Oscr = "𝒪";
var oscr = "ℴ";
var Oslash = "Ø";
var oslash = "ø";
var osol = "⊘";
var Otilde = "Õ";
var otilde = "õ";
var otimesas = "⨶";
var Otimes = "⨷";
var otimes = "⊗";
var Ouml = "Ö";
var ouml = "ö";
var ovbar = "⌽";
var OverBar = "‾";
var OverBrace = "⏞";
var OverBracket = "⎴";
var OverParenthesis = "⏜";
var para = "¶";
var parallel = "∥";
var par = "∥";
var parsim = "⫳";
var parsl = "⫽";
var part = "∂";
var PartialD = "∂";
var Pcy = "П";
var pcy = "п";
var percnt = "%";
var period = ".";
var permil = "‰";
var perp = "⊥";
var pertenk = "‱";
var Pfr = "𝔓";
var pfr = "𝔭";
var Phi = "Φ";
var phi = "φ";
var phiv = "ϕ";
var phmmat = "ℳ";
var phone = "☎";
var Pi = "Π";
var pi = "π";
var pitchfork = "⋔";
var piv = "ϖ";
var planck = "ℏ";
var planckh = "ℎ";
var plankv = "ℏ";
var plusacir = "⨣";
var plusb = "⊞";
var pluscir = "⨢";
var plus = "+";
var plusdo = "∔";
var plusdu = "⨥";
var pluse = "⩲";
var PlusMinus = "±";
var plusmn = "±";
var plussim = "⨦";
var plustwo = "⨧";
var pm = "±";
var Poincareplane = "ℌ";
var pointint = "⨕";
var popf = "𝕡";
var Popf = "ℙ";
var pound = "£";
var prap = "⪷";
var Pr = "⪻";
var pr = "≺";
var prcue = "≼";
var precapprox = "⪷";
var prec = "≺";
var preccurlyeq = "≼";
var Precedes = "≺";
var PrecedesEqual = "⪯";
var PrecedesSlantEqual = "≼";
var PrecedesTilde = "≾";
var preceq = "⪯";
var precnapprox = "⪹";
var precneqq = "⪵";
var precnsim = "⋨";
var pre = "⪯";
var prE = "⪳";
var precsim = "≾";
var prime = "′";
var Prime = "″";
var primes = "ℙ";
var prnap = "⪹";
var prnE = "⪵";
var prnsim = "⋨";
var prod = "∏";
var Product = "∏";
var profalar = "⌮";
var profline = "⌒";
var profsurf = "⌓";
var prop = "∝";
var Proportional = "∝";
var Proportion = "∷";
var propto = "∝";
var prsim = "≾";
var prurel = "⊰";
var Pscr = "𝒫";
var pscr = "𝓅";
var Psi = "Ψ";
var psi = "ψ";
var puncsp = " ";
var Qfr = "𝔔";
var qfr = "𝔮";
var qint = "⨌";
var qopf = "𝕢";
var Qopf = "ℚ";
var qprime = "⁗";
var Qscr = "𝒬";
var qscr = "𝓆";
var quaternions = "ℍ";
var quatint = "⨖";
var quest = "?";
var questeq = "≟";
var quot = "\"";
var QUOT = "\"";
var rAarr = "⇛";
var race = "∽̱";
var Racute = "Ŕ";
var racute = "ŕ";
var radic = "√";
var raemptyv = "⦳";
var rang = "⟩";
var Rang = "⟫";
var rangd = "⦒";
var range = "⦥";
var rangle = "⟩";
var raquo = "»";
var rarrap = "⥵";
var rarrb = "⇥";
var rarrbfs = "⤠";
var rarrc = "⤳";
var rarr = "→";
var Rarr = "↠";
var rArr = "⇒";
var rarrfs = "⤞";
var rarrhk = "↪";
var rarrlp = "↬";
var rarrpl = "⥅";
var rarrsim = "⥴";
var Rarrtl = "⤖";
var rarrtl = "↣";
var rarrw = "↝";
var ratail = "⤚";
var rAtail = "⤜";
var ratio = "∶";
var rationals = "ℚ";
var rbarr = "⤍";
var rBarr = "⤏";
var RBarr = "⤐";
var rbbrk = "❳";
var rbrace = "}";
var rbrack = "]";
var rbrke = "⦌";
var rbrksld = "⦎";
var rbrkslu = "⦐";
var Rcaron = "Ř";
var rcaron = "ř";
var Rcedil = "Ŗ";
var rcedil = "ŗ";
var rceil = "⌉";
var rcub = "}";
var Rcy = "Р";
var rcy = "р";
var rdca = "⤷";
var rdldhar = "⥩";
var rdquo = "”";
var rdquor = "”";
var rdsh = "↳";
var real = "ℜ";
var realine = "ℛ";
var realpart = "ℜ";
var reals = "ℝ";
var Re = "ℜ";
var rect = "▭";
var reg = "®";
var REG = "®";
var ReverseElement = "∋";
var ReverseEquilibrium = "⇋";
var ReverseUpEquilibrium = "⥯";
var rfisht = "⥽";
var rfloor = "⌋";
var rfr = "𝔯";
var Rfr = "ℜ";
var rHar = "⥤";
var rhard = "⇁";
var rharu = "⇀";
var rharul = "⥬";
var Rho = "Ρ";
var rho = "ρ";
var rhov = "ϱ";
var RightAngleBracket = "⟩";
var RightArrowBar = "⇥";
var rightarrow = "→";
var RightArrow = "→";
var Rightarrow = "⇒";
var RightArrowLeftArrow = "⇄";
var rightarrowtail = "↣";
var RightCeiling = "⌉";
var RightDoubleBracket = "⟧";
var RightDownTeeVector = "⥝";
var RightDownVectorBar = "⥕";
var RightDownVector = "⇂";
var RightFloor = "⌋";
var rightharpoondown = "⇁";
var rightharpoonup = "⇀";
var rightleftarrows = "⇄";
var rightleftharpoons = "⇌";
var rightrightarrows = "⇉";
var rightsquigarrow = "↝";
var RightTeeArrow = "↦";
var RightTee = "⊢";
var RightTeeVector = "⥛";
var rightthreetimes = "⋌";
var RightTriangleBar = "⧐";
var RightTriangle = "⊳";
var RightTriangleEqual = "⊵";
var RightUpDownVector = "⥏";
var RightUpTeeVector = "⥜";
var RightUpVectorBar = "⥔";
var RightUpVector = "↾";
var RightVectorBar = "⥓";
var RightVector = "⇀";
var ring = "˚";
var risingdotseq = "≓";
var rlarr = "⇄";
var rlhar = "⇌";
var rlm = "‏";
var rmoustache = "⎱";
var rmoust = "⎱";
var rnmid = "⫮";
var roang = "⟭";
var roarr = "⇾";
var robrk = "⟧";
var ropar = "⦆";
var ropf = "𝕣";
var Ropf = "ℝ";
var roplus = "⨮";
var rotimes = "⨵";
var RoundImplies = "⥰";
var rpar = ")";
var rpargt = "⦔";
var rppolint = "⨒";
var rrarr = "⇉";
var Rrightarrow = "⇛";
var rsaquo = "›";
var rscr = "𝓇";
var Rscr = "ℛ";
var rsh = "↱";
var Rsh = "↱";
var rsqb = "]";
var rsquo = "’";
var rsquor = "’";
var rthree = "⋌";
var rtimes = "⋊";
var rtri = "▹";
var rtrie = "⊵";
var rtrif = "▸";
var rtriltri = "⧎";
var RuleDelayed = "⧴";
var ruluhar = "⥨";
var rx = "℞";
var Sacute = "Ś";
var sacute = "ś";
var sbquo = "‚";
var scap = "⪸";
var Scaron = "Š";
var scaron = "š";
var Sc = "⪼";
var sc = "≻";
var sccue = "≽";
var sce = "⪰";
var scE = "⪴";
var Scedil = "Ş";
var scedil = "ş";
var Scirc = "Ŝ";
var scirc = "ŝ";
var scnap = "⪺";
var scnE = "⪶";
var scnsim = "⋩";
var scpolint = "⨓";
var scsim = "≿";
var Scy = "С";
var scy = "с";
var sdotb = "⊡";
var sdot = "⋅";
var sdote = "⩦";
var searhk = "⤥";
var searr = "↘";
var seArr = "⇘";
var searrow = "↘";
var sect = "§";
var semi = ";";
var seswar = "⤩";
var setminus = "∖";
var setmn = "∖";
var sext = "✶";
var Sfr = "𝔖";
var sfr = "𝔰";
var sfrown = "⌢";
var sharp = "♯";
var SHCHcy = "Щ";
var shchcy = "щ";
var SHcy = "Ш";
var shcy = "ш";
var ShortDownArrow = "↓";
var ShortLeftArrow = "←";
var shortmid = "∣";
var shortparallel = "∥";
var ShortRightArrow = "→";
var ShortUpArrow = "↑";
var shy = "­";
var Sigma = "Σ";
var sigma = "σ";
var sigmaf = "ς";
var sigmav = "ς";
var sim = "∼";
var simdot = "⩪";
var sime = "≃";
var simeq = "≃";
var simg = "⪞";
var simgE = "⪠";
var siml = "⪝";
var simlE = "⪟";
var simne = "≆";
var simplus = "⨤";
var simrarr = "⥲";
var slarr = "←";
var SmallCircle = "∘";
var smallsetminus = "∖";
var smashp = "⨳";
var smeparsl = "⧤";
var smid = "∣";
var smile = "⌣";
var smt = "⪪";
var smte = "⪬";
var smtes = "⪬︀";
var SOFTcy = "Ь";
var softcy = "ь";
var solbar = "⌿";
var solb = "⧄";
var sol = "/";
var Sopf = "𝕊";
var sopf = "𝕤";
var spades = "♠";
var spadesuit = "♠";
var spar = "∥";
var sqcap = "⊓";
var sqcaps = "⊓︀";
var sqcup = "⊔";
var sqcups = "⊔︀";
var Sqrt = "√";
var sqsub = "⊏";
var sqsube = "⊑";
var sqsubset = "⊏";
var sqsubseteq = "⊑";
var sqsup = "⊐";
var sqsupe = "⊒";
var sqsupset = "⊐";
var sqsupseteq = "⊒";
var square = "□";
var Square = "□";
var SquareIntersection = "⊓";
var SquareSubset = "⊏";
var SquareSubsetEqual = "⊑";
var SquareSuperset = "⊐";
var SquareSupersetEqual = "⊒";
var SquareUnion = "⊔";
var squarf = "▪";
var squ = "□";
var squf = "▪";
var srarr = "→";
var Sscr = "𝒮";
var sscr = "𝓈";
var ssetmn = "∖";
var ssmile = "⌣";
var sstarf = "⋆";
var Star = "⋆";
var star = "☆";
var starf = "★";
var straightepsilon = "ϵ";
var straightphi = "ϕ";
var strns = "¯";
var sub = "⊂";
var Sub = "⋐";
var subdot = "⪽";
var subE = "⫅";
var sube = "⊆";
var subedot = "⫃";
var submult = "⫁";
var subnE = "⫋";
var subne = "⊊";
var subplus = "⪿";
var subrarr = "⥹";
var subset = "⊂";
var Subset = "⋐";
var subseteq = "⊆";
var subseteqq = "⫅";
var SubsetEqual = "⊆";
var subsetneq = "⊊";
var subsetneqq = "⫋";
var subsim = "⫇";
var subsub = "⫕";
var subsup = "⫓";
var succapprox = "⪸";
var succ = "≻";
var succcurlyeq = "≽";
var Succeeds = "≻";
var SucceedsEqual = "⪰";
var SucceedsSlantEqual = "≽";
var SucceedsTilde = "≿";
var succeq = "⪰";
var succnapprox = "⪺";
var succneqq = "⪶";
var succnsim = "⋩";
var succsim = "≿";
var SuchThat = "∋";
var sum = "∑";
var Sum = "∑";
var sung = "♪";
var sup1 = "¹";
var sup2 = "²";
var sup3 = "³";
var sup = "⊃";
var Sup = "⋑";
var supdot = "⪾";
var supdsub = "⫘";
var supE = "⫆";
var supe = "⊇";
var supedot = "⫄";
var Superset = "⊃";
var SupersetEqual = "⊇";
var suphsol = "⟉";
var suphsub = "⫗";
var suplarr = "⥻";
var supmult = "⫂";
var supnE = "⫌";
var supne = "⊋";
var supplus = "⫀";
var supset = "⊃";
var Supset = "⋑";
var supseteq = "⊇";
var supseteqq = "⫆";
var supsetneq = "⊋";
var supsetneqq = "⫌";
var supsim = "⫈";
var supsub = "⫔";
var supsup = "⫖";
var swarhk = "⤦";
var swarr = "↙";
var swArr = "⇙";
var swarrow = "↙";
var swnwar = "⤪";
var szlig = "ß";
var Tab = "\t";
var target = "⌖";
var Tau = "Τ";
var tau = "τ";
var tbrk = "⎴";
var Tcaron = "Ť";
var tcaron = "ť";
var Tcedil = "Ţ";
var tcedil = "ţ";
var Tcy = "Т";
var tcy = "т";
var tdot = "⃛";
var telrec = "⌕";
var Tfr = "𝔗";
var tfr = "𝔱";
var there4 = "∴";
var therefore = "∴";
var Therefore = "∴";
var Theta = "Θ";
var theta = "θ";
var thetasym = "ϑ";
var thetav = "ϑ";
var thickapprox = "≈";
var thicksim = "∼";
var ThickSpace = "  ";
var ThinSpace = " ";
var thinsp = " ";
var thkap = "≈";
var thksim = "∼";
var THORN = "Þ";
var thorn = "þ";
var tilde = "˜";
var Tilde = "∼";
var TildeEqual = "≃";
var TildeFullEqual = "≅";
var TildeTilde = "≈";
var timesbar = "⨱";
var timesb = "⊠";
var times = "×";
var timesd = "⨰";
var tint = "∭";
var toea = "⤨";
var topbot = "⌶";
var topcir = "⫱";
var top = "⊤";
var Topf = "𝕋";
var topf = "𝕥";
var topfork = "⫚";
var tosa = "⤩";
var tprime = "‴";
var trade = "™";
var TRADE = "™";
var triangle = "▵";
var triangledown = "▿";
var triangleleft = "◃";
var trianglelefteq = "⊴";
var triangleq = "≜";
var triangleright = "▹";
var trianglerighteq = "⊵";
var tridot = "◬";
var trie = "≜";
var triminus = "⨺";
var TripleDot = "⃛";
var triplus = "⨹";
var trisb = "⧍";
var tritime = "⨻";
var trpezium = "⏢";
var Tscr = "𝒯";
var tscr = "𝓉";
var TScy = "Ц";
var tscy = "ц";
var TSHcy = "Ћ";
var tshcy = "ћ";
var Tstrok = "Ŧ";
var tstrok = "ŧ";
var twixt = "≬";
var twoheadleftarrow = "↞";
var twoheadrightarrow = "↠";
var Uacute = "Ú";
var uacute = "ú";
var uarr = "↑";
var Uarr = "↟";
var uArr = "⇑";
var Uarrocir = "⥉";
var Ubrcy = "Ў";
var ubrcy = "ў";
var Ubreve = "Ŭ";
var ubreve = "ŭ";
var Ucirc = "Û";
var ucirc = "û";
var Ucy = "У";
var ucy = "у";
var udarr = "⇅";
var Udblac = "Ű";
var udblac = "ű";
var udhar = "⥮";
var ufisht = "⥾";
var Ufr = "𝔘";
var ufr = "𝔲";
var Ugrave = "Ù";
var ugrave = "ù";
var uHar = "⥣";
var uharl = "↿";
var uharr = "↾";
var uhblk = "▀";
var ulcorn = "⌜";
var ulcorner = "⌜";
var ulcrop = "⌏";
var ultri = "◸";
var Umacr = "Ū";
var umacr = "ū";
var uml = "¨";
var UnderBar = "_";
var UnderBrace = "⏟";
var UnderBracket = "⎵";
var UnderParenthesis = "⏝";
var Union = "⋃";
var UnionPlus = "⊎";
var Uogon = "Ų";
var uogon = "ų";
var Uopf = "𝕌";
var uopf = "𝕦";
var UpArrowBar = "⤒";
var uparrow = "↑";
var UpArrow = "↑";
var Uparrow = "⇑";
var UpArrowDownArrow = "⇅";
var updownarrow = "↕";
var UpDownArrow = "↕";
var Updownarrow = "⇕";
var UpEquilibrium = "⥮";
var upharpoonleft = "↿";
var upharpoonright = "↾";
var uplus = "⊎";
var UpperLeftArrow = "↖";
var UpperRightArrow = "↗";
var upsi = "υ";
var Upsi = "ϒ";
var upsih = "ϒ";
var Upsilon = "Υ";
var upsilon = "υ";
var UpTeeArrow = "↥";
var UpTee = "⊥";
var upuparrows = "⇈";
var urcorn = "⌝";
var urcorner = "⌝";
var urcrop = "⌎";
var Uring = "Ů";
var uring = "ů";
var urtri = "◹";
var Uscr = "𝒰";
var uscr = "𝓊";
var utdot = "⋰";
var Utilde = "Ũ";
var utilde = "ũ";
var utri = "▵";
var utrif = "▴";
var uuarr = "⇈";
var Uuml = "Ü";
var uuml = "ü";
var uwangle = "⦧";
var vangrt = "⦜";
var varepsilon = "ϵ";
var varkappa = "ϰ";
var varnothing = "∅";
var varphi = "ϕ";
var varpi = "ϖ";
var varpropto = "∝";
var varr = "↕";
var vArr = "⇕";
var varrho = "ϱ";
var varsigma = "ς";
var varsubsetneq = "⊊︀";
var varsubsetneqq = "⫋︀";
var varsupsetneq = "⊋︀";
var varsupsetneqq = "⫌︀";
var vartheta = "ϑ";
var vartriangleleft = "⊲";
var vartriangleright = "⊳";
var vBar = "⫨";
var Vbar = "⫫";
var vBarv = "⫩";
var Vcy = "В";
var vcy = "в";
var vdash = "⊢";
var vDash = "⊨";
var Vdash = "⊩";
var VDash = "⊫";
var Vdashl = "⫦";
var veebar = "⊻";
var vee = "∨";
var Vee = "⋁";
var veeeq = "≚";
var vellip = "⋮";
var verbar = "|";
var Verbar = "‖";
var vert = "|";
var Vert = "‖";
var VerticalBar = "∣";
var VerticalLine = "|";
var VerticalSeparator = "❘";
var VerticalTilde = "≀";
var VeryThinSpace = " ";
var Vfr = "𝔙";
var vfr = "𝔳";
var vltri = "⊲";
var vnsub = "⊂⃒";
var vnsup = "⊃⃒";
var Vopf = "𝕍";
var vopf = "𝕧";
var vprop = "∝";
var vrtri = "⊳";
var Vscr = "𝒱";
var vscr = "𝓋";
var vsubnE = "⫋︀";
var vsubne = "⊊︀";
var vsupnE = "⫌︀";
var vsupne = "⊋︀";
var Vvdash = "⊪";
var vzigzag = "⦚";
var Wcirc = "Ŵ";
var wcirc = "ŵ";
var wedbar = "⩟";
var wedge = "∧";
var Wedge = "⋀";
var wedgeq = "≙";
var weierp = "℘";
var Wfr = "𝔚";
var wfr = "𝔴";
var Wopf = "𝕎";
var wopf = "𝕨";
var wp = "℘";
var wr = "≀";
var wreath = "≀";
var Wscr = "𝒲";
var wscr = "𝓌";
var xcap = "⋂";
var xcirc = "◯";
var xcup = "⋃";
var xdtri = "▽";
var Xfr = "𝔛";
var xfr = "𝔵";
var xharr = "⟷";
var xhArr = "⟺";
var Xi = "Ξ";
var xi = "ξ";
var xlarr = "⟵";
var xlArr = "⟸";
var xmap = "⟼";
var xnis = "⋻";
var xodot = "⨀";
var Xopf = "𝕏";
var xopf = "𝕩";
var xoplus = "⨁";
var xotime = "⨂";
var xrarr = "⟶";
var xrArr = "⟹";
var Xscr = "𝒳";
var xscr = "𝓍";
var xsqcup = "⨆";
var xuplus = "⨄";
var xutri = "△";
var xvee = "⋁";
var xwedge = "⋀";
var Yacute = "Ý";
var yacute = "ý";
var YAcy = "Я";
var yacy = "я";
var Ycirc = "Ŷ";
var ycirc = "ŷ";
var Ycy = "Ы";
var ycy = "ы";
var yen = "¥";
var Yfr = "𝔜";
var yfr = "𝔶";
var YIcy = "Ї";
var yicy = "ї";
var Yopf = "𝕐";
var yopf = "𝕪";
var Yscr = "𝒴";
var yscr = "𝓎";
var YUcy = "Ю";
var yucy = "ю";
var yuml = "ÿ";
var Yuml = "Ÿ";
var Zacute = "Ź";
var zacute = "ź";
var Zcaron = "Ž";
var zcaron = "ž";
var Zcy = "З";
var zcy = "з";
var Zdot = "Ż";
var zdot = "ż";
var zeetrf = "ℨ";
var ZeroWidthSpace = "​";
var Zeta = "Ζ";
var zeta = "ζ";
var zfr = "𝔷";
var Zfr = "ℨ";
var ZHcy = "Ж";
var zhcy = "ж";
var zigrarr = "⇝";
var zopf = "𝕫";
var Zopf = "ℤ";
var Zscr = "𝒵";
var zscr = "𝓏";
var zwj = "‍";
var zwnj = "‌";
const entities = {
	Aacute: Aacute,
	aacute: aacute,
	Abreve: Abreve,
	abreve: abreve,
	ac: ac,
	acd: acd,
	acE: acE,
	Acirc: Acirc,
	acirc: acirc,
	acute: acute,
	Acy: Acy,
	acy: acy,
	AElig: AElig,
	aelig: aelig,
	af: af,
	Afr: Afr,
	afr: afr,
	Agrave: Agrave,
	agrave: agrave,
	alefsym: alefsym,
	aleph: aleph,
	Alpha: Alpha,
	alpha: alpha,
	Amacr: Amacr,
	amacr: amacr,
	amalg: amalg,
	amp: amp,
	AMP: AMP,
	andand: andand,
	And: And,
	and: and,
	andd: andd,
	andslope: andslope,
	andv: andv,
	ang: ang,
	ange: ange,
	angle: angle,
	angmsdaa: angmsdaa,
	angmsdab: angmsdab,
	angmsdac: angmsdac,
	angmsdad: angmsdad,
	angmsdae: angmsdae,
	angmsdaf: angmsdaf,
	angmsdag: angmsdag,
	angmsdah: angmsdah,
	angmsd: angmsd,
	angrt: angrt,
	angrtvb: angrtvb,
	angrtvbd: angrtvbd,
	angsph: angsph,
	angst: angst,
	angzarr: angzarr,
	Aogon: Aogon,
	aogon: aogon,
	Aopf: Aopf,
	aopf: aopf,
	apacir: apacir,
	ap: ap,
	apE: apE,
	ape: ape,
	apid: apid,
	apos: apos,
	ApplyFunction: ApplyFunction,
	approx: approx,
	approxeq: approxeq,
	Aring: Aring,
	aring: aring,
	Ascr: Ascr,
	ascr: ascr,
	Assign: Assign,
	ast: ast,
	asymp: asymp,
	asympeq: asympeq,
	Atilde: Atilde,
	atilde: atilde,
	Auml: Auml,
	auml: auml,
	awconint: awconint,
	awint: awint,
	backcong: backcong,
	backepsilon: backepsilon,
	backprime: backprime,
	backsim: backsim,
	backsimeq: backsimeq,
	Backslash: Backslash,
	Barv: Barv,
	barvee: barvee,
	barwed: barwed,
	Barwed: Barwed,
	barwedge: barwedge,
	bbrk: bbrk,
	bbrktbrk: bbrktbrk,
	bcong: bcong,
	Bcy: Bcy,
	bcy: bcy,
	bdquo: bdquo,
	becaus: becaus,
	because: because,
	Because: Because,
	bemptyv: bemptyv,
	bepsi: bepsi,
	bernou: bernou,
	Bernoullis: Bernoullis,
	Beta: Beta,
	beta: beta,
	beth: beth,
	between: between,
	Bfr: Bfr,
	bfr: bfr,
	bigcap: bigcap,
	bigcirc: bigcirc,
	bigcup: bigcup,
	bigodot: bigodot,
	bigoplus: bigoplus,
	bigotimes: bigotimes,
	bigsqcup: bigsqcup,
	bigstar: bigstar,
	bigtriangledown: bigtriangledown,
	bigtriangleup: bigtriangleup,
	biguplus: biguplus,
	bigvee: bigvee,
	bigwedge: bigwedge,
	bkarow: bkarow,
	blacklozenge: blacklozenge,
	blacksquare: blacksquare,
	blacktriangle: blacktriangle,
	blacktriangledown: blacktriangledown,
	blacktriangleleft: blacktriangleleft,
	blacktriangleright: blacktriangleright,
	blank: blank,
	blk12: blk12,
	blk14: blk14,
	blk34: blk34,
	block: block,
	bne: bne,
	bnequiv: bnequiv,
	bNot: bNot,
	bnot: bnot,
	Bopf: Bopf,
	bopf: bopf,
	bot: bot,
	bottom: bottom,
	bowtie: bowtie,
	boxbox: boxbox,
	boxdl: boxdl,
	boxdL: boxdL,
	boxDl: boxDl,
	boxDL: boxDL,
	boxdr: boxdr,
	boxdR: boxdR,
	boxDr: boxDr,
	boxDR: boxDR,
	boxh: boxh,
	boxH: boxH,
	boxhd: boxhd,
	boxHd: boxHd,
	boxhD: boxhD,
	boxHD: boxHD,
	boxhu: boxhu,
	boxHu: boxHu,
	boxhU: boxhU,
	boxHU: boxHU,
	boxminus: boxminus,
	boxplus: boxplus,
	boxtimes: boxtimes,
	boxul: boxul,
	boxuL: boxuL,
	boxUl: boxUl,
	boxUL: boxUL,
	boxur: boxur,
	boxuR: boxuR,
	boxUr: boxUr,
	boxUR: boxUR,
	boxv: boxv,
	boxV: boxV,
	boxvh: boxvh,
	boxvH: boxvH,
	boxVh: boxVh,
	boxVH: boxVH,
	boxvl: boxvl,
	boxvL: boxvL,
	boxVl: boxVl,
	boxVL: boxVL,
	boxvr: boxvr,
	boxvR: boxvR,
	boxVr: boxVr,
	boxVR: boxVR,
	bprime: bprime,
	breve: breve,
	Breve: Breve,
	brvbar: brvbar,
	bscr: bscr,
	Bscr: Bscr,
	bsemi: bsemi,
	bsim: bsim,
	bsime: bsime,
	bsolb: bsolb,
	bsol: bsol,
	bsolhsub: bsolhsub,
	bull: bull,
	bullet: bullet,
	bump: bump,
	bumpE: bumpE,
	bumpe: bumpe,
	Bumpeq: Bumpeq,
	bumpeq: bumpeq,
	Cacute: Cacute,
	cacute: cacute,
	capand: capand,
	capbrcup: capbrcup,
	capcap: capcap,
	cap: cap,
	Cap: Cap,
	capcup: capcup,
	capdot: capdot,
	CapitalDifferentialD: CapitalDifferentialD,
	caps: caps,
	caret: caret,
	caron: caron,
	Cayleys: Cayleys,
	ccaps: ccaps,
	Ccaron: Ccaron,
	ccaron: ccaron,
	Ccedil: Ccedil,
	ccedil: ccedil,
	Ccirc: Ccirc,
	ccirc: ccirc,
	Cconint: Cconint,
	ccups: ccups,
	ccupssm: ccupssm,
	Cdot: Cdot,
	cdot: cdot,
	cedil: cedil,
	Cedilla: Cedilla,
	cemptyv: cemptyv,
	cent: cent,
	centerdot: centerdot,
	CenterDot: CenterDot,
	cfr: cfr,
	Cfr: Cfr,
	CHcy: CHcy,
	chcy: chcy,
	check: check,
	checkmark: checkmark,
	Chi: Chi,
	chi: chi,
	circ: circ,
	circeq: circeq,
	circlearrowleft: circlearrowleft,
	circlearrowright: circlearrowright,
	circledast: circledast,
	circledcirc: circledcirc,
	circleddash: circleddash,
	CircleDot: CircleDot,
	circledR: circledR,
	circledS: circledS,
	CircleMinus: CircleMinus,
	CirclePlus: CirclePlus,
	CircleTimes: CircleTimes,
	cir: cir,
	cirE: cirE,
	cire: cire,
	cirfnint: cirfnint,
	cirmid: cirmid,
	cirscir: cirscir,
	ClockwiseContourIntegral: ClockwiseContourIntegral,
	CloseCurlyDoubleQuote: CloseCurlyDoubleQuote,
	CloseCurlyQuote: CloseCurlyQuote,
	clubs: clubs,
	clubsuit: clubsuit,
	colon: colon,
	Colon: Colon,
	Colone: Colone,
	colone: colone,
	coloneq: coloneq,
	comma: comma,
	commat: commat,
	comp: comp,
	compfn: compfn,
	complement: complement,
	complexes: complexes,
	cong: cong,
	congdot: congdot,
	Congruent: Congruent,
	conint: conint,
	Conint: Conint,
	ContourIntegral: ContourIntegral,
	copf: copf,
	Copf: Copf,
	coprod: coprod,
	Coproduct: Coproduct,
	copy: copy,
	COPY: COPY,
	copysr: copysr,
	CounterClockwiseContourIntegral: CounterClockwiseContourIntegral,
	crarr: crarr,
	cross: cross,
	Cross: Cross,
	Cscr: Cscr,
	cscr: cscr,
	csub: csub,
	csube: csube,
	csup: csup,
	csupe: csupe,
	ctdot: ctdot,
	cudarrl: cudarrl,
	cudarrr: cudarrr,
	cuepr: cuepr,
	cuesc: cuesc,
	cularr: cularr,
	cularrp: cularrp,
	cupbrcap: cupbrcap,
	cupcap: cupcap,
	CupCap: CupCap,
	cup: cup,
	Cup: Cup,
	cupcup: cupcup,
	cupdot: cupdot,
	cupor: cupor,
	cups: cups,
	curarr: curarr,
	curarrm: curarrm,
	curlyeqprec: curlyeqprec,
	curlyeqsucc: curlyeqsucc,
	curlyvee: curlyvee,
	curlywedge: curlywedge,
	curren: curren,
	curvearrowleft: curvearrowleft,
	curvearrowright: curvearrowright,
	cuvee: cuvee,
	cuwed: cuwed,
	cwconint: cwconint,
	cwint: cwint,
	cylcty: cylcty,
	dagger: dagger,
	Dagger: Dagger,
	daleth: daleth,
	darr: darr,
	Darr: Darr,
	dArr: dArr,
	dash: dash,
	Dashv: Dashv,
	dashv: dashv,
	dbkarow: dbkarow,
	dblac: dblac,
	Dcaron: Dcaron,
	dcaron: dcaron,
	Dcy: Dcy,
	dcy: dcy,
	ddagger: ddagger,
	ddarr: ddarr,
	DD: DD,
	dd: dd,
	DDotrahd: DDotrahd,
	ddotseq: ddotseq,
	deg: deg,
	Del: Del,
	Delta: Delta,
	delta: delta,
	demptyv: demptyv,
	dfisht: dfisht,
	Dfr: Dfr,
	dfr: dfr,
	dHar: dHar,
	dharl: dharl,
	dharr: dharr,
	DiacriticalAcute: DiacriticalAcute,
	DiacriticalDot: DiacriticalDot,
	DiacriticalDoubleAcute: DiacriticalDoubleAcute,
	DiacriticalGrave: DiacriticalGrave,
	DiacriticalTilde: DiacriticalTilde,
	diam: diam,
	diamond: diamond,
	Diamond: Diamond,
	diamondsuit: diamondsuit,
	diams: diams,
	die: die,
	DifferentialD: DifferentialD,
	digamma: digamma,
	disin: disin,
	div: div,
	divide: divide,
	divideontimes: divideontimes,
	divonx: divonx,
	DJcy: DJcy,
	djcy: djcy,
	dlcorn: dlcorn,
	dlcrop: dlcrop,
	dollar: dollar,
	Dopf: Dopf,
	dopf: dopf,
	Dot: Dot,
	dot: dot,
	DotDot: DotDot,
	doteq: doteq,
	doteqdot: doteqdot,
	DotEqual: DotEqual,
	dotminus: dotminus,
	dotplus: dotplus,
	dotsquare: dotsquare,
	doublebarwedge: doublebarwedge,
	DoubleContourIntegral: DoubleContourIntegral,
	DoubleDot: DoubleDot,
	DoubleDownArrow: DoubleDownArrow,
	DoubleLeftArrow: DoubleLeftArrow,
	DoubleLeftRightArrow: DoubleLeftRightArrow,
	DoubleLeftTee: DoubleLeftTee,
	DoubleLongLeftArrow: DoubleLongLeftArrow,
	DoubleLongLeftRightArrow: DoubleLongLeftRightArrow,
	DoubleLongRightArrow: DoubleLongRightArrow,
	DoubleRightArrow: DoubleRightArrow,
	DoubleRightTee: DoubleRightTee,
	DoubleUpArrow: DoubleUpArrow,
	DoubleUpDownArrow: DoubleUpDownArrow,
	DoubleVerticalBar: DoubleVerticalBar,
	DownArrowBar: DownArrowBar,
	downarrow: downarrow,
	DownArrow: DownArrow,
	Downarrow: Downarrow,
	DownArrowUpArrow: DownArrowUpArrow,
	DownBreve: DownBreve,
	downdownarrows: downdownarrows,
	downharpoonleft: downharpoonleft,
	downharpoonright: downharpoonright,
	DownLeftRightVector: DownLeftRightVector,
	DownLeftTeeVector: DownLeftTeeVector,
	DownLeftVectorBar: DownLeftVectorBar,
	DownLeftVector: DownLeftVector,
	DownRightTeeVector: DownRightTeeVector,
	DownRightVectorBar: DownRightVectorBar,
	DownRightVector: DownRightVector,
	DownTeeArrow: DownTeeArrow,
	DownTee: DownTee,
	drbkarow: drbkarow,
	drcorn: drcorn,
	drcrop: drcrop,
	Dscr: Dscr,
	dscr: dscr,
	DScy: DScy,
	dscy: dscy,
	dsol: dsol,
	Dstrok: Dstrok,
	dstrok: dstrok,
	dtdot: dtdot,
	dtri: dtri,
	dtrif: dtrif,
	duarr: duarr,
	duhar: duhar,
	dwangle: dwangle,
	DZcy: DZcy,
	dzcy: dzcy,
	dzigrarr: dzigrarr,
	Eacute: Eacute,
	eacute: eacute,
	easter: easter,
	Ecaron: Ecaron,
	ecaron: ecaron,
	Ecirc: Ecirc,
	ecirc: ecirc,
	ecir: ecir,
	ecolon: ecolon,
	Ecy: Ecy,
	ecy: ecy,
	eDDot: eDDot,
	Edot: Edot,
	edot: edot,
	eDot: eDot,
	ee: ee,
	efDot: efDot,
	Efr: Efr,
	efr: efr,
	eg: eg,
	Egrave: Egrave,
	egrave: egrave,
	egs: egs,
	egsdot: egsdot,
	el: el,
	Element: Element,
	elinters: elinters,
	ell: ell,
	els: els,
	elsdot: elsdot,
	Emacr: Emacr,
	emacr: emacr,
	empty: empty,
	emptyset: emptyset,
	EmptySmallSquare: EmptySmallSquare,
	emptyv: emptyv,
	EmptyVerySmallSquare: EmptyVerySmallSquare,
	emsp13: emsp13,
	emsp14: emsp14,
	emsp: emsp,
	ENG: ENG,
	eng: eng,
	ensp: ensp,
	Eogon: Eogon,
	eogon: eogon,
	Eopf: Eopf,
	eopf: eopf,
	epar: epar,
	eparsl: eparsl,
	eplus: eplus,
	epsi: epsi,
	Epsilon: Epsilon,
	epsilon: epsilon,
	epsiv: epsiv,
	eqcirc: eqcirc,
	eqcolon: eqcolon,
	eqsim: eqsim,
	eqslantgtr: eqslantgtr,
	eqslantless: eqslantless,
	Equal: Equal,
	equals: equals,
	EqualTilde: EqualTilde,
	equest: equest,
	Equilibrium: Equilibrium,
	equiv: equiv,
	equivDD: equivDD,
	eqvparsl: eqvparsl,
	erarr: erarr,
	erDot: erDot,
	escr: escr,
	Escr: Escr,
	esdot: esdot,
	Esim: Esim,
	esim: esim,
	Eta: Eta,
	eta: eta,
	ETH: ETH,
	eth: eth,
	Euml: Euml,
	euml: euml,
	euro: euro,
	excl: excl,
	exist: exist,
	Exists: Exists,
	expectation: expectation,
	exponentiale: exponentiale,
	ExponentialE: ExponentialE,
	fallingdotseq: fallingdotseq,
	Fcy: Fcy,
	fcy: fcy,
	female: female,
	ffilig: ffilig,
	fflig: fflig,
	ffllig: ffllig,
	Ffr: Ffr,
	ffr: ffr,
	filig: filig,
	FilledSmallSquare: FilledSmallSquare,
	FilledVerySmallSquare: FilledVerySmallSquare,
	fjlig: fjlig,
	flat: flat,
	fllig: fllig,
	fltns: fltns,
	fnof: fnof,
	Fopf: Fopf,
	fopf: fopf,
	forall: forall,
	ForAll: ForAll,
	fork: fork,
	forkv: forkv,
	Fouriertrf: Fouriertrf,
	fpartint: fpartint,
	frac12: frac12,
	frac13: frac13,
	frac14: frac14,
	frac15: frac15,
	frac16: frac16,
	frac18: frac18,
	frac23: frac23,
	frac25: frac25,
	frac34: frac34,
	frac35: frac35,
	frac38: frac38,
	frac45: frac45,
	frac56: frac56,
	frac58: frac58,
	frac78: frac78,
	frasl: frasl,
	frown: frown,
	fscr: fscr,
	Fscr: Fscr,
	gacute: gacute,
	Gamma: Gamma,
	gamma: gamma,
	Gammad: Gammad,
	gammad: gammad,
	gap: gap,
	Gbreve: Gbreve,
	gbreve: gbreve,
	Gcedil: Gcedil,
	Gcirc: Gcirc,
	gcirc: gcirc,
	Gcy: Gcy,
	gcy: gcy,
	Gdot: Gdot,
	gdot: gdot,
	ge: ge,
	gE: gE,
	gEl: gEl,
	gel: gel,
	geq: geq,
	geqq: geqq,
	geqslant: geqslant,
	gescc: gescc,
	ges: ges,
	gesdot: gesdot,
	gesdoto: gesdoto,
	gesdotol: gesdotol,
	gesl: gesl,
	gesles: gesles,
	Gfr: Gfr,
	gfr: gfr,
	gg: gg,
	Gg: Gg,
	ggg: ggg,
	gimel: gimel,
	GJcy: GJcy,
	gjcy: gjcy,
	gla: gla,
	gl: gl,
	glE: glE,
	glj: glj,
	gnap: gnap,
	gnapprox: gnapprox,
	gne: gne,
	gnE: gnE,
	gneq: gneq,
	gneqq: gneqq,
	gnsim: gnsim,
	Gopf: Gopf,
	gopf: gopf,
	grave: grave,
	GreaterEqual: GreaterEqual,
	GreaterEqualLess: GreaterEqualLess,
	GreaterFullEqual: GreaterFullEqual,
	GreaterGreater: GreaterGreater,
	GreaterLess: GreaterLess,
	GreaterSlantEqual: GreaterSlantEqual,
	GreaterTilde: GreaterTilde,
	Gscr: Gscr,
	gscr: gscr,
	gsim: gsim,
	gsime: gsime,
	gsiml: gsiml,
	gtcc: gtcc,
	gtcir: gtcir,
	gt: gt,
	GT: GT,
	Gt: Gt,
	gtdot: gtdot,
	gtlPar: gtlPar,
	gtquest: gtquest,
	gtrapprox: gtrapprox,
	gtrarr: gtrarr,
	gtrdot: gtrdot,
	gtreqless: gtreqless,
	gtreqqless: gtreqqless,
	gtrless: gtrless,
	gtrsim: gtrsim,
	gvertneqq: gvertneqq,
	gvnE: gvnE,
	Hacek: Hacek,
	hairsp: hairsp,
	half: half,
	hamilt: hamilt,
	HARDcy: HARDcy,
	hardcy: hardcy,
	harrcir: harrcir,
	harr: harr,
	hArr: hArr,
	harrw: harrw,
	Hat: Hat,
	hbar: hbar,
	Hcirc: Hcirc,
	hcirc: hcirc,
	hearts: hearts,
	heartsuit: heartsuit,
	hellip: hellip,
	hercon: hercon,
	hfr: hfr,
	Hfr: Hfr,
	HilbertSpace: HilbertSpace,
	hksearow: hksearow,
	hkswarow: hkswarow,
	hoarr: hoarr,
	homtht: homtht,
	hookleftarrow: hookleftarrow,
	hookrightarrow: hookrightarrow,
	hopf: hopf,
	Hopf: Hopf,
	horbar: horbar,
	HorizontalLine: HorizontalLine,
	hscr: hscr,
	Hscr: Hscr,
	hslash: hslash,
	Hstrok: Hstrok,
	hstrok: hstrok,
	HumpDownHump: HumpDownHump,
	HumpEqual: HumpEqual,
	hybull: hybull,
	hyphen: hyphen,
	Iacute: Iacute,
	iacute: iacute,
	ic: ic,
	Icirc: Icirc,
	icirc: icirc,
	Icy: Icy,
	icy: icy,
	Idot: Idot,
	IEcy: IEcy,
	iecy: iecy,
	iexcl: iexcl,
	iff: iff,
	ifr: ifr,
	Ifr: Ifr,
	Igrave: Igrave,
	igrave: igrave,
	ii: ii,
	iiiint: iiiint,
	iiint: iiint,
	iinfin: iinfin,
	iiota: iiota,
	IJlig: IJlig,
	ijlig: ijlig,
	Imacr: Imacr,
	imacr: imacr,
	image: image,
	ImaginaryI: ImaginaryI,
	imagline: imagline,
	imagpart: imagpart,
	imath: imath,
	Im: Im,
	imof: imof,
	imped: imped,
	Implies: Implies,
	incare: incare,
	"in": "∈",
	infin: infin,
	infintie: infintie,
	inodot: inodot,
	intcal: intcal,
	int: int,
	Int: Int,
	integers: integers,
	Integral: Integral,
	intercal: intercal,
	Intersection: Intersection,
	intlarhk: intlarhk,
	intprod: intprod,
	InvisibleComma: InvisibleComma,
	InvisibleTimes: InvisibleTimes,
	IOcy: IOcy,
	iocy: iocy,
	Iogon: Iogon,
	iogon: iogon,
	Iopf: Iopf,
	iopf: iopf,
	Iota: Iota,
	iota: iota,
	iprod: iprod,
	iquest: iquest,
	iscr: iscr,
	Iscr: Iscr,
	isin: isin,
	isindot: isindot,
	isinE: isinE,
	isins: isins,
	isinsv: isinsv,
	isinv: isinv,
	it: it,
	Itilde: Itilde,
	itilde: itilde,
	Iukcy: Iukcy,
	iukcy: iukcy,
	Iuml: Iuml,
	iuml: iuml,
	Jcirc: Jcirc,
	jcirc: jcirc,
	Jcy: Jcy,
	jcy: jcy,
	Jfr: Jfr,
	jfr: jfr,
	jmath: jmath,
	Jopf: Jopf,
	jopf: jopf,
	Jscr: Jscr,
	jscr: jscr,
	Jsercy: Jsercy,
	jsercy: jsercy,
	Jukcy: Jukcy,
	jukcy: jukcy,
	Kappa: Kappa,
	kappa: kappa,
	kappav: kappav,
	Kcedil: Kcedil,
	kcedil: kcedil,
	Kcy: Kcy,
	kcy: kcy,
	Kfr: Kfr,
	kfr: kfr,
	kgreen: kgreen,
	KHcy: KHcy,
	khcy: khcy,
	KJcy: KJcy,
	kjcy: kjcy,
	Kopf: Kopf,
	kopf: kopf,
	Kscr: Kscr,
	kscr: kscr,
	lAarr: lAarr,
	Lacute: Lacute,
	lacute: lacute,
	laemptyv: laemptyv,
	lagran: lagran,
	Lambda: Lambda,
	lambda: lambda,
	lang: lang,
	Lang: Lang,
	langd: langd,
	langle: langle,
	lap: lap,
	Laplacetrf: Laplacetrf,
	laquo: laquo,
	larrb: larrb,
	larrbfs: larrbfs,
	larr: larr,
	Larr: Larr,
	lArr: lArr,
	larrfs: larrfs,
	larrhk: larrhk,
	larrlp: larrlp,
	larrpl: larrpl,
	larrsim: larrsim,
	larrtl: larrtl,
	latail: latail,
	lAtail: lAtail,
	lat: lat,
	late: late,
	lates: lates,
	lbarr: lbarr,
	lBarr: lBarr,
	lbbrk: lbbrk,
	lbrace: lbrace,
	lbrack: lbrack,
	lbrke: lbrke,
	lbrksld: lbrksld,
	lbrkslu: lbrkslu,
	Lcaron: Lcaron,
	lcaron: lcaron,
	Lcedil: Lcedil,
	lcedil: lcedil,
	lceil: lceil,
	lcub: lcub,
	Lcy: Lcy,
	lcy: lcy,
	ldca: ldca,
	ldquo: ldquo,
	ldquor: ldquor,
	ldrdhar: ldrdhar,
	ldrushar: ldrushar,
	ldsh: ldsh,
	le: le,
	lE: lE,
	LeftAngleBracket: LeftAngleBracket,
	LeftArrowBar: LeftArrowBar,
	leftarrow: leftarrow,
	LeftArrow: LeftArrow,
	Leftarrow: Leftarrow,
	LeftArrowRightArrow: LeftArrowRightArrow,
	leftarrowtail: leftarrowtail,
	LeftCeiling: LeftCeiling,
	LeftDoubleBracket: LeftDoubleBracket,
	LeftDownTeeVector: LeftDownTeeVector,
	LeftDownVectorBar: LeftDownVectorBar,
	LeftDownVector: LeftDownVector,
	LeftFloor: LeftFloor,
	leftharpoondown: leftharpoondown,
	leftharpoonup: leftharpoonup,
	leftleftarrows: leftleftarrows,
	leftrightarrow: leftrightarrow,
	LeftRightArrow: LeftRightArrow,
	Leftrightarrow: Leftrightarrow,
	leftrightarrows: leftrightarrows,
	leftrightharpoons: leftrightharpoons,
	leftrightsquigarrow: leftrightsquigarrow,
	LeftRightVector: LeftRightVector,
	LeftTeeArrow: LeftTeeArrow,
	LeftTee: LeftTee,
	LeftTeeVector: LeftTeeVector,
	leftthreetimes: leftthreetimes,
	LeftTriangleBar: LeftTriangleBar,
	LeftTriangle: LeftTriangle,
	LeftTriangleEqual: LeftTriangleEqual,
	LeftUpDownVector: LeftUpDownVector,
	LeftUpTeeVector: LeftUpTeeVector,
	LeftUpVectorBar: LeftUpVectorBar,
	LeftUpVector: LeftUpVector,
	LeftVectorBar: LeftVectorBar,
	LeftVector: LeftVector,
	lEg: lEg,
	leg: leg,
	leq: leq,
	leqq: leqq,
	leqslant: leqslant,
	lescc: lescc,
	les: les,
	lesdot: lesdot,
	lesdoto: lesdoto,
	lesdotor: lesdotor,
	lesg: lesg,
	lesges: lesges,
	lessapprox: lessapprox,
	lessdot: lessdot,
	lesseqgtr: lesseqgtr,
	lesseqqgtr: lesseqqgtr,
	LessEqualGreater: LessEqualGreater,
	LessFullEqual: LessFullEqual,
	LessGreater: LessGreater,
	lessgtr: lessgtr,
	LessLess: LessLess,
	lesssim: lesssim,
	LessSlantEqual: LessSlantEqual,
	LessTilde: LessTilde,
	lfisht: lfisht,
	lfloor: lfloor,
	Lfr: Lfr,
	lfr: lfr,
	lg: lg,
	lgE: lgE,
	lHar: lHar,
	lhard: lhard,
	lharu: lharu,
	lharul: lharul,
	lhblk: lhblk,
	LJcy: LJcy,
	ljcy: ljcy,
	llarr: llarr,
	ll: ll,
	Ll: Ll,
	llcorner: llcorner,
	Lleftarrow: Lleftarrow,
	llhard: llhard,
	lltri: lltri,
	Lmidot: Lmidot,
	lmidot: lmidot,
	lmoustache: lmoustache,
	lmoust: lmoust,
	lnap: lnap,
	lnapprox: lnapprox,
	lne: lne,
	lnE: lnE,
	lneq: lneq,
	lneqq: lneqq,
	lnsim: lnsim,
	loang: loang,
	loarr: loarr,
	lobrk: lobrk,
	longleftarrow: longleftarrow,
	LongLeftArrow: LongLeftArrow,
	Longleftarrow: Longleftarrow,
	longleftrightarrow: longleftrightarrow,
	LongLeftRightArrow: LongLeftRightArrow,
	Longleftrightarrow: Longleftrightarrow,
	longmapsto: longmapsto,
	longrightarrow: longrightarrow,
	LongRightArrow: LongRightArrow,
	Longrightarrow: Longrightarrow,
	looparrowleft: looparrowleft,
	looparrowright: looparrowright,
	lopar: lopar,
	Lopf: Lopf,
	lopf: lopf,
	loplus: loplus,
	lotimes: lotimes,
	lowast: lowast,
	lowbar: lowbar,
	LowerLeftArrow: LowerLeftArrow,
	LowerRightArrow: LowerRightArrow,
	loz: loz,
	lozenge: lozenge,
	lozf: lozf,
	lpar: lpar,
	lparlt: lparlt,
	lrarr: lrarr,
	lrcorner: lrcorner,
	lrhar: lrhar,
	lrhard: lrhard,
	lrm: lrm,
	lrtri: lrtri,
	lsaquo: lsaquo,
	lscr: lscr,
	Lscr: Lscr,
	lsh: lsh,
	Lsh: Lsh,
	lsim: lsim,
	lsime: lsime,
	lsimg: lsimg,
	lsqb: lsqb,
	lsquo: lsquo,
	lsquor: lsquor,
	Lstrok: Lstrok,
	lstrok: lstrok,
	ltcc: ltcc,
	ltcir: ltcir,
	lt: lt,
	LT: LT,
	Lt: Lt,
	ltdot: ltdot,
	lthree: lthree,
	ltimes: ltimes,
	ltlarr: ltlarr,
	ltquest: ltquest,
	ltri: ltri,
	ltrie: ltrie,
	ltrif: ltrif,
	ltrPar: ltrPar,
	lurdshar: lurdshar,
	luruhar: luruhar,
	lvertneqq: lvertneqq,
	lvnE: lvnE,
	macr: macr,
	male: male,
	malt: malt,
	maltese: maltese,
	"Map": "⤅",
	map: map,
	mapsto: mapsto,
	mapstodown: mapstodown,
	mapstoleft: mapstoleft,
	mapstoup: mapstoup,
	marker: marker,
	mcomma: mcomma,
	Mcy: Mcy,
	mcy: mcy,
	mdash: mdash,
	mDDot: mDDot,
	measuredangle: measuredangle,
	MediumSpace: MediumSpace,
	Mellintrf: Mellintrf,
	Mfr: Mfr,
	mfr: mfr,
	mho: mho,
	micro: micro,
	midast: midast,
	midcir: midcir,
	mid: mid,
	middot: middot,
	minusb: minusb,
	minus: minus,
	minusd: minusd,
	minusdu: minusdu,
	MinusPlus: MinusPlus,
	mlcp: mlcp,
	mldr: mldr,
	mnplus: mnplus,
	models: models,
	Mopf: Mopf,
	mopf: mopf,
	mp: mp,
	mscr: mscr,
	Mscr: Mscr,
	mstpos: mstpos,
	Mu: Mu,
	mu: mu,
	multimap: multimap,
	mumap: mumap,
	nabla: nabla,
	Nacute: Nacute,
	nacute: nacute,
	nang: nang,
	nap: nap,
	napE: napE,
	napid: napid,
	napos: napos,
	napprox: napprox,
	natural: natural,
	naturals: naturals,
	natur: natur,
	nbsp: nbsp,
	nbump: nbump,
	nbumpe: nbumpe,
	ncap: ncap,
	Ncaron: Ncaron,
	ncaron: ncaron,
	Ncedil: Ncedil,
	ncedil: ncedil,
	ncong: ncong,
	ncongdot: ncongdot,
	ncup: ncup,
	Ncy: Ncy,
	ncy: ncy,
	ndash: ndash,
	nearhk: nearhk,
	nearr: nearr,
	neArr: neArr,
	nearrow: nearrow,
	ne: ne,
	nedot: nedot,
	NegativeMediumSpace: NegativeMediumSpace,
	NegativeThickSpace: NegativeThickSpace,
	NegativeThinSpace: NegativeThinSpace,
	NegativeVeryThinSpace: NegativeVeryThinSpace,
	nequiv: nequiv,
	nesear: nesear,
	nesim: nesim,
	NestedGreaterGreater: NestedGreaterGreater,
	NestedLessLess: NestedLessLess,
	NewLine: NewLine,
	nexist: nexist,
	nexists: nexists,
	Nfr: Nfr,
	nfr: nfr,
	ngE: ngE,
	nge: nge,
	ngeq: ngeq,
	ngeqq: ngeqq,
	ngeqslant: ngeqslant,
	nges: nges,
	nGg: nGg,
	ngsim: ngsim,
	nGt: nGt,
	ngt: ngt,
	ngtr: ngtr,
	nGtv: nGtv,
	nharr: nharr,
	nhArr: nhArr,
	nhpar: nhpar,
	ni: ni,
	nis: nis,
	nisd: nisd,
	niv: niv,
	NJcy: NJcy,
	njcy: njcy,
	nlarr: nlarr,
	nlArr: nlArr,
	nldr: nldr,
	nlE: nlE,
	nle: nle,
	nleftarrow: nleftarrow,
	nLeftarrow: nLeftarrow,
	nleftrightarrow: nleftrightarrow,
	nLeftrightarrow: nLeftrightarrow,
	nleq: nleq,
	nleqq: nleqq,
	nleqslant: nleqslant,
	nles: nles,
	nless: nless,
	nLl: nLl,
	nlsim: nlsim,
	nLt: nLt,
	nlt: nlt,
	nltri: nltri,
	nltrie: nltrie,
	nLtv: nLtv,
	nmid: nmid,
	NoBreak: NoBreak,
	NonBreakingSpace: NonBreakingSpace,
	nopf: nopf,
	Nopf: Nopf,
	Not: Not,
	not: not,
	NotCongruent: NotCongruent,
	NotCupCap: NotCupCap,
	NotDoubleVerticalBar: NotDoubleVerticalBar,
	NotElement: NotElement,
	NotEqual: NotEqual,
	NotEqualTilde: NotEqualTilde,
	NotExists: NotExists,
	NotGreater: NotGreater,
	NotGreaterEqual: NotGreaterEqual,
	NotGreaterFullEqual: NotGreaterFullEqual,
	NotGreaterGreater: NotGreaterGreater,
	NotGreaterLess: NotGreaterLess,
	NotGreaterSlantEqual: NotGreaterSlantEqual,
	NotGreaterTilde: NotGreaterTilde,
	NotHumpDownHump: NotHumpDownHump,
	NotHumpEqual: NotHumpEqual,
	notin: notin,
	notindot: notindot,
	notinE: notinE,
	notinva: notinva,
	notinvb: notinvb,
	notinvc: notinvc,
	NotLeftTriangleBar: NotLeftTriangleBar,
	NotLeftTriangle: NotLeftTriangle,
	NotLeftTriangleEqual: NotLeftTriangleEqual,
	NotLess: NotLess,
	NotLessEqual: NotLessEqual,
	NotLessGreater: NotLessGreater,
	NotLessLess: NotLessLess,
	NotLessSlantEqual: NotLessSlantEqual,
	NotLessTilde: NotLessTilde,
	NotNestedGreaterGreater: NotNestedGreaterGreater,
	NotNestedLessLess: NotNestedLessLess,
	notni: notni,
	notniva: notniva,
	notnivb: notnivb,
	notnivc: notnivc,
	NotPrecedes: NotPrecedes,
	NotPrecedesEqual: NotPrecedesEqual,
	NotPrecedesSlantEqual: NotPrecedesSlantEqual,
	NotReverseElement: NotReverseElement,
	NotRightTriangleBar: NotRightTriangleBar,
	NotRightTriangle: NotRightTriangle,
	NotRightTriangleEqual: NotRightTriangleEqual,
	NotSquareSubset: NotSquareSubset,
	NotSquareSubsetEqual: NotSquareSubsetEqual,
	NotSquareSuperset: NotSquareSuperset,
	NotSquareSupersetEqual: NotSquareSupersetEqual,
	NotSubset: NotSubset,
	NotSubsetEqual: NotSubsetEqual,
	NotSucceeds: NotSucceeds,
	NotSucceedsEqual: NotSucceedsEqual,
	NotSucceedsSlantEqual: NotSucceedsSlantEqual,
	NotSucceedsTilde: NotSucceedsTilde,
	NotSuperset: NotSuperset,
	NotSupersetEqual: NotSupersetEqual,
	NotTilde: NotTilde,
	NotTildeEqual: NotTildeEqual,
	NotTildeFullEqual: NotTildeFullEqual,
	NotTildeTilde: NotTildeTilde,
	NotVerticalBar: NotVerticalBar,
	nparallel: nparallel,
	npar: npar,
	nparsl: nparsl,
	npart: npart,
	npolint: npolint,
	npr: npr,
	nprcue: nprcue,
	nprec: nprec,
	npreceq: npreceq,
	npre: npre,
	nrarrc: nrarrc,
	nrarr: nrarr,
	nrArr: nrArr,
	nrarrw: nrarrw,
	nrightarrow: nrightarrow,
	nRightarrow: nRightarrow,
	nrtri: nrtri,
	nrtrie: nrtrie,
	nsc: nsc,
	nsccue: nsccue,
	nsce: nsce,
	Nscr: Nscr,
	nscr: nscr,
	nshortmid: nshortmid,
	nshortparallel: nshortparallel,
	nsim: nsim,
	nsime: nsime,
	nsimeq: nsimeq,
	nsmid: nsmid,
	nspar: nspar,
	nsqsube: nsqsube,
	nsqsupe: nsqsupe,
	nsub: nsub,
	nsubE: nsubE,
	nsube: nsube,
	nsubset: nsubset,
	nsubseteq: nsubseteq,
	nsubseteqq: nsubseteqq,
	nsucc: nsucc,
	nsucceq: nsucceq,
	nsup: nsup,
	nsupE: nsupE,
	nsupe: nsupe,
	nsupset: nsupset,
	nsupseteq: nsupseteq,
	nsupseteqq: nsupseteqq,
	ntgl: ntgl,
	Ntilde: Ntilde,
	ntilde: ntilde,
	ntlg: ntlg,
	ntriangleleft: ntriangleleft,
	ntrianglelefteq: ntrianglelefteq,
	ntriangleright: ntriangleright,
	ntrianglerighteq: ntrianglerighteq,
	Nu: Nu,
	nu: nu,
	num: num,
	numero: numero,
	numsp: numsp,
	nvap: nvap,
	nvdash: nvdash,
	nvDash: nvDash,
	nVdash: nVdash,
	nVDash: nVDash,
	nvge: nvge,
	nvgt: nvgt,
	nvHarr: nvHarr,
	nvinfin: nvinfin,
	nvlArr: nvlArr,
	nvle: nvle,
	nvlt: nvlt,
	nvltrie: nvltrie,
	nvrArr: nvrArr,
	nvrtrie: nvrtrie,
	nvsim: nvsim,
	nwarhk: nwarhk,
	nwarr: nwarr,
	nwArr: nwArr,
	nwarrow: nwarrow,
	nwnear: nwnear,
	Oacute: Oacute,
	oacute: oacute,
	oast: oast,
	Ocirc: Ocirc,
	ocirc: ocirc,
	ocir: ocir,
	Ocy: Ocy,
	ocy: ocy,
	odash: odash,
	Odblac: Odblac,
	odblac: odblac,
	odiv: odiv,
	odot: odot,
	odsold: odsold,
	OElig: OElig,
	oelig: oelig,
	ofcir: ofcir,
	Ofr: Ofr,
	ofr: ofr,
	ogon: ogon,
	Ograve: Ograve,
	ograve: ograve,
	ogt: ogt,
	ohbar: ohbar,
	ohm: ohm,
	oint: oint,
	olarr: olarr,
	olcir: olcir,
	olcross: olcross,
	oline: oline,
	olt: olt,
	Omacr: Omacr,
	omacr: omacr,
	Omega: Omega,
	omega: omega,
	Omicron: Omicron,
	omicron: omicron,
	omid: omid,
	ominus: ominus,
	Oopf: Oopf,
	oopf: oopf,
	opar: opar,
	OpenCurlyDoubleQuote: OpenCurlyDoubleQuote,
	OpenCurlyQuote: OpenCurlyQuote,
	operp: operp,
	oplus: oplus,
	orarr: orarr,
	Or: Or,
	or: or,
	ord: ord,
	order: order,
	orderof: orderof,
	ordf: ordf,
	ordm: ordm,
	origof: origof,
	oror: oror,
	orslope: orslope,
	orv: orv,
	oS: oS,
	Oscr: Oscr,
	oscr: oscr,
	Oslash: Oslash,
	oslash: oslash,
	osol: osol,
	Otilde: Otilde,
	otilde: otilde,
	otimesas: otimesas,
	Otimes: Otimes,
	otimes: otimes,
	Ouml: Ouml,
	ouml: ouml,
	ovbar: ovbar,
	OverBar: OverBar,
	OverBrace: OverBrace,
	OverBracket: OverBracket,
	OverParenthesis: OverParenthesis,
	para: para,
	parallel: parallel,
	par: par,
	parsim: parsim,
	parsl: parsl,
	part: part,
	PartialD: PartialD,
	Pcy: Pcy,
	pcy: pcy,
	percnt: percnt,
	period: period,
	permil: permil,
	perp: perp,
	pertenk: pertenk,
	Pfr: Pfr,
	pfr: pfr,
	Phi: Phi,
	phi: phi,
	phiv: phiv,
	phmmat: phmmat,
	phone: phone,
	Pi: Pi,
	pi: pi,
	pitchfork: pitchfork,
	piv: piv,
	planck: planck,
	planckh: planckh,
	plankv: plankv,
	plusacir: plusacir,
	plusb: plusb,
	pluscir: pluscir,
	plus: plus,
	plusdo: plusdo,
	plusdu: plusdu,
	pluse: pluse,
	PlusMinus: PlusMinus,
	plusmn: plusmn,
	plussim: plussim,
	plustwo: plustwo,
	pm: pm,
	Poincareplane: Poincareplane,
	pointint: pointint,
	popf: popf,
	Popf: Popf,
	pound: pound,
	prap: prap,
	Pr: Pr,
	pr: pr,
	prcue: prcue,
	precapprox: precapprox,
	prec: prec,
	preccurlyeq: preccurlyeq,
	Precedes: Precedes,
	PrecedesEqual: PrecedesEqual,
	PrecedesSlantEqual: PrecedesSlantEqual,
	PrecedesTilde: PrecedesTilde,
	preceq: preceq,
	precnapprox: precnapprox,
	precneqq: precneqq,
	precnsim: precnsim,
	pre: pre,
	prE: prE,
	precsim: precsim,
	prime: prime,
	Prime: Prime,
	primes: primes,
	prnap: prnap,
	prnE: prnE,
	prnsim: prnsim,
	prod: prod,
	Product: Product,
	profalar: profalar,
	profline: profline,
	profsurf: profsurf,
	prop: prop,
	Proportional: Proportional,
	Proportion: Proportion,
	propto: propto,
	prsim: prsim,
	prurel: prurel,
	Pscr: Pscr,
	pscr: pscr,
	Psi: Psi,
	psi: psi,
	puncsp: puncsp,
	Qfr: Qfr,
	qfr: qfr,
	qint: qint,
	qopf: qopf,
	Qopf: Qopf,
	qprime: qprime,
	Qscr: Qscr,
	qscr: qscr,
	quaternions: quaternions,
	quatint: quatint,
	quest: quest,
	questeq: questeq,
	quot: quot,
	QUOT: QUOT,
	rAarr: rAarr,
	race: race,
	Racute: Racute,
	racute: racute,
	radic: radic,
	raemptyv: raemptyv,
	rang: rang,
	Rang: Rang,
	rangd: rangd,
	range: range,
	rangle: rangle,
	raquo: raquo,
	rarrap: rarrap,
	rarrb: rarrb,
	rarrbfs: rarrbfs,
	rarrc: rarrc,
	rarr: rarr,
	Rarr: Rarr,
	rArr: rArr,
	rarrfs: rarrfs,
	rarrhk: rarrhk,
	rarrlp: rarrlp,
	rarrpl: rarrpl,
	rarrsim: rarrsim,
	Rarrtl: Rarrtl,
	rarrtl: rarrtl,
	rarrw: rarrw,
	ratail: ratail,
	rAtail: rAtail,
	ratio: ratio,
	rationals: rationals,
	rbarr: rbarr,
	rBarr: rBarr,
	RBarr: RBarr,
	rbbrk: rbbrk,
	rbrace: rbrace,
	rbrack: rbrack,
	rbrke: rbrke,
	rbrksld: rbrksld,
	rbrkslu: rbrkslu,
	Rcaron: Rcaron,
	rcaron: rcaron,
	Rcedil: Rcedil,
	rcedil: rcedil,
	rceil: rceil,
	rcub: rcub,
	Rcy: Rcy,
	rcy: rcy,
	rdca: rdca,
	rdldhar: rdldhar,
	rdquo: rdquo,
	rdquor: rdquor,
	rdsh: rdsh,
	real: real,
	realine: realine,
	realpart: realpart,
	reals: reals,
	Re: Re,
	rect: rect,
	reg: reg,
	REG: REG,
	ReverseElement: ReverseElement,
	ReverseEquilibrium: ReverseEquilibrium,
	ReverseUpEquilibrium: ReverseUpEquilibrium,
	rfisht: rfisht,
	rfloor: rfloor,
	rfr: rfr,
	Rfr: Rfr,
	rHar: rHar,
	rhard: rhard,
	rharu: rharu,
	rharul: rharul,
	Rho: Rho,
	rho: rho,
	rhov: rhov,
	RightAngleBracket: RightAngleBracket,
	RightArrowBar: RightArrowBar,
	rightarrow: rightarrow,
	RightArrow: RightArrow,
	Rightarrow: Rightarrow,
	RightArrowLeftArrow: RightArrowLeftArrow,
	rightarrowtail: rightarrowtail,
	RightCeiling: RightCeiling,
	RightDoubleBracket: RightDoubleBracket,
	RightDownTeeVector: RightDownTeeVector,
	RightDownVectorBar: RightDownVectorBar,
	RightDownVector: RightDownVector,
	RightFloor: RightFloor,
	rightharpoondown: rightharpoondown,
	rightharpoonup: rightharpoonup,
	rightleftarrows: rightleftarrows,
	rightleftharpoons: rightleftharpoons,
	rightrightarrows: rightrightarrows,
	rightsquigarrow: rightsquigarrow,
	RightTeeArrow: RightTeeArrow,
	RightTee: RightTee,
	RightTeeVector: RightTeeVector,
	rightthreetimes: rightthreetimes,
	RightTriangleBar: RightTriangleBar,
	RightTriangle: RightTriangle,
	RightTriangleEqual: RightTriangleEqual,
	RightUpDownVector: RightUpDownVector,
	RightUpTeeVector: RightUpTeeVector,
	RightUpVectorBar: RightUpVectorBar,
	RightUpVector: RightUpVector,
	RightVectorBar: RightVectorBar,
	RightVector: RightVector,
	ring: ring,
	risingdotseq: risingdotseq,
	rlarr: rlarr,
	rlhar: rlhar,
	rlm: rlm,
	rmoustache: rmoustache,
	rmoust: rmoust,
	rnmid: rnmid,
	roang: roang,
	roarr: roarr,
	robrk: robrk,
	ropar: ropar,
	ropf: ropf,
	Ropf: Ropf,
	roplus: roplus,
	rotimes: rotimes,
	RoundImplies: RoundImplies,
	rpar: rpar,
	rpargt: rpargt,
	rppolint: rppolint,
	rrarr: rrarr,
	Rrightarrow: Rrightarrow,
	rsaquo: rsaquo,
	rscr: rscr,
	Rscr: Rscr,
	rsh: rsh,
	Rsh: Rsh,
	rsqb: rsqb,
	rsquo: rsquo,
	rsquor: rsquor,
	rthree: rthree,
	rtimes: rtimes,
	rtri: rtri,
	rtrie: rtrie,
	rtrif: rtrif,
	rtriltri: rtriltri,
	RuleDelayed: RuleDelayed,
	ruluhar: ruluhar,
	rx: rx,
	Sacute: Sacute,
	sacute: sacute,
	sbquo: sbquo,
	scap: scap,
	Scaron: Scaron,
	scaron: scaron,
	Sc: Sc,
	sc: sc,
	sccue: sccue,
	sce: sce,
	scE: scE,
	Scedil: Scedil,
	scedil: scedil,
	Scirc: Scirc,
	scirc: scirc,
	scnap: scnap,
	scnE: scnE,
	scnsim: scnsim,
	scpolint: scpolint,
	scsim: scsim,
	Scy: Scy,
	scy: scy,
	sdotb: sdotb,
	sdot: sdot,
	sdote: sdote,
	searhk: searhk,
	searr: searr,
	seArr: seArr,
	searrow: searrow,
	sect: sect,
	semi: semi,
	seswar: seswar,
	setminus: setminus,
	setmn: setmn,
	sext: sext,
	Sfr: Sfr,
	sfr: sfr,
	sfrown: sfrown,
	sharp: sharp,
	SHCHcy: SHCHcy,
	shchcy: shchcy,
	SHcy: SHcy,
	shcy: shcy,
	ShortDownArrow: ShortDownArrow,
	ShortLeftArrow: ShortLeftArrow,
	shortmid: shortmid,
	shortparallel: shortparallel,
	ShortRightArrow: ShortRightArrow,
	ShortUpArrow: ShortUpArrow,
	shy: shy,
	Sigma: Sigma,
	sigma: sigma,
	sigmaf: sigmaf,
	sigmav: sigmav,
	sim: sim,
	simdot: simdot,
	sime: sime,
	simeq: simeq,
	simg: simg,
	simgE: simgE,
	siml: siml,
	simlE: simlE,
	simne: simne,
	simplus: simplus,
	simrarr: simrarr,
	slarr: slarr,
	SmallCircle: SmallCircle,
	smallsetminus: smallsetminus,
	smashp: smashp,
	smeparsl: smeparsl,
	smid: smid,
	smile: smile,
	smt: smt,
	smte: smte,
	smtes: smtes,
	SOFTcy: SOFTcy,
	softcy: softcy,
	solbar: solbar,
	solb: solb,
	sol: sol,
	Sopf: Sopf,
	sopf: sopf,
	spades: spades,
	spadesuit: spadesuit,
	spar: spar,
	sqcap: sqcap,
	sqcaps: sqcaps,
	sqcup: sqcup,
	sqcups: sqcups,
	Sqrt: Sqrt,
	sqsub: sqsub,
	sqsube: sqsube,
	sqsubset: sqsubset,
	sqsubseteq: sqsubseteq,
	sqsup: sqsup,
	sqsupe: sqsupe,
	sqsupset: sqsupset,
	sqsupseteq: sqsupseteq,
	square: square,
	Square: Square,
	SquareIntersection: SquareIntersection,
	SquareSubset: SquareSubset,
	SquareSubsetEqual: SquareSubsetEqual,
	SquareSuperset: SquareSuperset,
	SquareSupersetEqual: SquareSupersetEqual,
	SquareUnion: SquareUnion,
	squarf: squarf,
	squ: squ,
	squf: squf,
	srarr: srarr,
	Sscr: Sscr,
	sscr: sscr,
	ssetmn: ssetmn,
	ssmile: ssmile,
	sstarf: sstarf,
	Star: Star,
	star: star,
	starf: starf,
	straightepsilon: straightepsilon,
	straightphi: straightphi,
	strns: strns,
	sub: sub,
	Sub: Sub,
	subdot: subdot,
	subE: subE,
	sube: sube,
	subedot: subedot,
	submult: submult,
	subnE: subnE,
	subne: subne,
	subplus: subplus,
	subrarr: subrarr,
	subset: subset,
	Subset: Subset,
	subseteq: subseteq,
	subseteqq: subseteqq,
	SubsetEqual: SubsetEqual,
	subsetneq: subsetneq,
	subsetneqq: subsetneqq,
	subsim: subsim,
	subsub: subsub,
	subsup: subsup,
	succapprox: succapprox,
	succ: succ,
	succcurlyeq: succcurlyeq,
	Succeeds: Succeeds,
	SucceedsEqual: SucceedsEqual,
	SucceedsSlantEqual: SucceedsSlantEqual,
	SucceedsTilde: SucceedsTilde,
	succeq: succeq,
	succnapprox: succnapprox,
	succneqq: succneqq,
	succnsim: succnsim,
	succsim: succsim,
	SuchThat: SuchThat,
	sum: sum,
	Sum: Sum,
	sung: sung,
	sup1: sup1,
	sup2: sup2,
	sup3: sup3,
	sup: sup,
	Sup: Sup,
	supdot: supdot,
	supdsub: supdsub,
	supE: supE,
	supe: supe,
	supedot: supedot,
	Superset: Superset,
	SupersetEqual: SupersetEqual,
	suphsol: suphsol,
	suphsub: suphsub,
	suplarr: suplarr,
	supmult: supmult,
	supnE: supnE,
	supne: supne,
	supplus: supplus,
	supset: supset,
	Supset: Supset,
	supseteq: supseteq,
	supseteqq: supseteqq,
	supsetneq: supsetneq,
	supsetneqq: supsetneqq,
	supsim: supsim,
	supsub: supsub,
	supsup: supsup,
	swarhk: swarhk,
	swarr: swarr,
	swArr: swArr,
	swarrow: swarrow,
	swnwar: swnwar,
	szlig: szlig,
	Tab: Tab,
	target: target,
	Tau: Tau,
	tau: tau,
	tbrk: tbrk,
	Tcaron: Tcaron,
	tcaron: tcaron,
	Tcedil: Tcedil,
	tcedil: tcedil,
	Tcy: Tcy,
	tcy: tcy,
	tdot: tdot,
	telrec: telrec,
	Tfr: Tfr,
	tfr: tfr,
	there4: there4,
	therefore: therefore,
	Therefore: Therefore,
	Theta: Theta,
	theta: theta,
	thetasym: thetasym,
	thetav: thetav,
	thickapprox: thickapprox,
	thicksim: thicksim,
	ThickSpace: ThickSpace,
	ThinSpace: ThinSpace,
	thinsp: thinsp,
	thkap: thkap,
	thksim: thksim,
	THORN: THORN,
	thorn: thorn,
	tilde: tilde,
	Tilde: Tilde,
	TildeEqual: TildeEqual,
	TildeFullEqual: TildeFullEqual,
	TildeTilde: TildeTilde,
	timesbar: timesbar,
	timesb: timesb,
	times: times,
	timesd: timesd,
	tint: tint,
	toea: toea,
	topbot: topbot,
	topcir: topcir,
	top: top,
	Topf: Topf,
	topf: topf,
	topfork: topfork,
	tosa: tosa,
	tprime: tprime,
	trade: trade,
	TRADE: TRADE,
	triangle: triangle,
	triangledown: triangledown,
	triangleleft: triangleleft,
	trianglelefteq: trianglelefteq,
	triangleq: triangleq,
	triangleright: triangleright,
	trianglerighteq: trianglerighteq,
	tridot: tridot,
	trie: trie,
	triminus: triminus,
	TripleDot: TripleDot,
	triplus: triplus,
	trisb: trisb,
	tritime: tritime,
	trpezium: trpezium,
	Tscr: Tscr,
	tscr: tscr,
	TScy: TScy,
	tscy: tscy,
	TSHcy: TSHcy,
	tshcy: tshcy,
	Tstrok: Tstrok,
	tstrok: tstrok,
	twixt: twixt,
	twoheadleftarrow: twoheadleftarrow,
	twoheadrightarrow: twoheadrightarrow,
	Uacute: Uacute,
	uacute: uacute,
	uarr: uarr,
	Uarr: Uarr,
	uArr: uArr,
	Uarrocir: Uarrocir,
	Ubrcy: Ubrcy,
	ubrcy: ubrcy,
	Ubreve: Ubreve,
	ubreve: ubreve,
	Ucirc: Ucirc,
	ucirc: ucirc,
	Ucy: Ucy,
	ucy: ucy,
	udarr: udarr,
	Udblac: Udblac,
	udblac: udblac,
	udhar: udhar,
	ufisht: ufisht,
	Ufr: Ufr,
	ufr: ufr,
	Ugrave: Ugrave,
	ugrave: ugrave,
	uHar: uHar,
	uharl: uharl,
	uharr: uharr,
	uhblk: uhblk,
	ulcorn: ulcorn,
	ulcorner: ulcorner,
	ulcrop: ulcrop,
	ultri: ultri,
	Umacr: Umacr,
	umacr: umacr,
	uml: uml,
	UnderBar: UnderBar,
	UnderBrace: UnderBrace,
	UnderBracket: UnderBracket,
	UnderParenthesis: UnderParenthesis,
	Union: Union,
	UnionPlus: UnionPlus,
	Uogon: Uogon,
	uogon: uogon,
	Uopf: Uopf,
	uopf: uopf,
	UpArrowBar: UpArrowBar,
	uparrow: uparrow,
	UpArrow: UpArrow,
	Uparrow: Uparrow,
	UpArrowDownArrow: UpArrowDownArrow,
	updownarrow: updownarrow,
	UpDownArrow: UpDownArrow,
	Updownarrow: Updownarrow,
	UpEquilibrium: UpEquilibrium,
	upharpoonleft: upharpoonleft,
	upharpoonright: upharpoonright,
	uplus: uplus,
	UpperLeftArrow: UpperLeftArrow,
	UpperRightArrow: UpperRightArrow,
	upsi: upsi,
	Upsi: Upsi,
	upsih: upsih,
	Upsilon: Upsilon,
	upsilon: upsilon,
	UpTeeArrow: UpTeeArrow,
	UpTee: UpTee,
	upuparrows: upuparrows,
	urcorn: urcorn,
	urcorner: urcorner,
	urcrop: urcrop,
	Uring: Uring,
	uring: uring,
	urtri: urtri,
	Uscr: Uscr,
	uscr: uscr,
	utdot: utdot,
	Utilde: Utilde,
	utilde: utilde,
	utri: utri,
	utrif: utrif,
	uuarr: uuarr,
	Uuml: Uuml,
	uuml: uuml,
	uwangle: uwangle,
	vangrt: vangrt,
	varepsilon: varepsilon,
	varkappa: varkappa,
	varnothing: varnothing,
	varphi: varphi,
	varpi: varpi,
	varpropto: varpropto,
	varr: varr,
	vArr: vArr,
	varrho: varrho,
	varsigma: varsigma,
	varsubsetneq: varsubsetneq,
	varsubsetneqq: varsubsetneqq,
	varsupsetneq: varsupsetneq,
	varsupsetneqq: varsupsetneqq,
	vartheta: vartheta,
	vartriangleleft: vartriangleleft,
	vartriangleright: vartriangleright,
	vBar: vBar,
	Vbar: Vbar,
	vBarv: vBarv,
	Vcy: Vcy,
	vcy: vcy,
	vdash: vdash,
	vDash: vDash,
	Vdash: Vdash,
	VDash: VDash,
	Vdashl: Vdashl,
	veebar: veebar,
	vee: vee,
	Vee: Vee,
	veeeq: veeeq,
	vellip: vellip,
	verbar: verbar,
	Verbar: Verbar,
	vert: vert,
	Vert: Vert,
	VerticalBar: VerticalBar,
	VerticalLine: VerticalLine,
	VerticalSeparator: VerticalSeparator,
	VerticalTilde: VerticalTilde,
	VeryThinSpace: VeryThinSpace,
	Vfr: Vfr,
	vfr: vfr,
	vltri: vltri,
	vnsub: vnsub,
	vnsup: vnsup,
	Vopf: Vopf,
	vopf: vopf,
	vprop: vprop,
	vrtri: vrtri,
	Vscr: Vscr,
	vscr: vscr,
	vsubnE: vsubnE,
	vsubne: vsubne,
	vsupnE: vsupnE,
	vsupne: vsupne,
	Vvdash: Vvdash,
	vzigzag: vzigzag,
	Wcirc: Wcirc,
	wcirc: wcirc,
	wedbar: wedbar,
	wedge: wedge,
	Wedge: Wedge,
	wedgeq: wedgeq,
	weierp: weierp,
	Wfr: Wfr,
	wfr: wfr,
	Wopf: Wopf,
	wopf: wopf,
	wp: wp,
	wr: wr,
	wreath: wreath,
	Wscr: Wscr,
	wscr: wscr,
	xcap: xcap,
	xcirc: xcirc,
	xcup: xcup,
	xdtri: xdtri,
	Xfr: Xfr,
	xfr: xfr,
	xharr: xharr,
	xhArr: xhArr,
	Xi: Xi,
	xi: xi,
	xlarr: xlarr,
	xlArr: xlArr,
	xmap: xmap,
	xnis: xnis,
	xodot: xodot,
	Xopf: Xopf,
	xopf: xopf,
	xoplus: xoplus,
	xotime: xotime,
	xrarr: xrarr,
	xrArr: xrArr,
	Xscr: Xscr,
	xscr: xscr,
	xsqcup: xsqcup,
	xuplus: xuplus,
	xutri: xutri,
	xvee: xvee,
	xwedge: xwedge,
	Yacute: Yacute,
	yacute: yacute,
	YAcy: YAcy,
	yacy: yacy,
	Ycirc: Ycirc,
	ycirc: ycirc,
	Ycy: Ycy,
	ycy: ycy,
	yen: yen,
	Yfr: Yfr,
	yfr: yfr,
	YIcy: YIcy,
	yicy: yicy,
	Yopf: Yopf,
	yopf: yopf,
	Yscr: Yscr,
	yscr: yscr,
	YUcy: YUcy,
	yucy: yucy,
	yuml: yuml,
	Yuml: Yuml,
	Zacute: Zacute,
	zacute: zacute,
	Zcaron: Zcaron,
	zcaron: zcaron,
	Zcy: Zcy,
	zcy: zcy,
	Zdot: Zdot,
	zdot: zdot,
	zeetrf: zeetrf,
	ZeroWidthSpace: ZeroWidthSpace,
	Zeta: Zeta,
	zeta: zeta,
	zfr: zfr,
	Zfr: Zfr,
	ZHcy: ZHcy,
	zhcy: zhcy,
	zigrarr: zigrarr,
	zopf: zopf,
	Zopf: Zopf,
	Zscr: Zscr,
	zscr: zscr,
	zwj: zwj,
	zwnj: zwnj
};

const entities$1 = /*#__PURE__*/Object.freeze({
            Aacute: Aacute,
            aacute: aacute,
            Abreve: Abreve,
            abreve: abreve,
            ac: ac,
            acd: acd,
            acE: acE,
            Acirc: Acirc,
            acirc: acirc,
            acute: acute,
            Acy: Acy,
            acy: acy,
            AElig: AElig,
            aelig: aelig,
            af: af,
            Afr: Afr,
            afr: afr,
            Agrave: Agrave,
            agrave: agrave,
            alefsym: alefsym,
            aleph: aleph,
            Alpha: Alpha,
            alpha: alpha,
            Amacr: Amacr,
            amacr: amacr,
            amalg: amalg,
            amp: amp,
            AMP: AMP,
            andand: andand,
            And: And,
            and: and,
            andd: andd,
            andslope: andslope,
            andv: andv,
            ang: ang,
            ange: ange,
            angle: angle,
            angmsdaa: angmsdaa,
            angmsdab: angmsdab,
            angmsdac: angmsdac,
            angmsdad: angmsdad,
            angmsdae: angmsdae,
            angmsdaf: angmsdaf,
            angmsdag: angmsdag,
            angmsdah: angmsdah,
            angmsd: angmsd,
            angrt: angrt,
            angrtvb: angrtvb,
            angrtvbd: angrtvbd,
            angsph: angsph,
            angst: angst,
            angzarr: angzarr,
            Aogon: Aogon,
            aogon: aogon,
            Aopf: Aopf,
            aopf: aopf,
            apacir: apacir,
            ap: ap,
            apE: apE,
            ape: ape,
            apid: apid,
            apos: apos,
            ApplyFunction: ApplyFunction,
            approx: approx,
            approxeq: approxeq,
            Aring: Aring,
            aring: aring,
            Ascr: Ascr,
            ascr: ascr,
            Assign: Assign,
            ast: ast,
            asymp: asymp,
            asympeq: asympeq,
            Atilde: Atilde,
            atilde: atilde,
            Auml: Auml,
            auml: auml,
            awconint: awconint,
            awint: awint,
            backcong: backcong,
            backepsilon: backepsilon,
            backprime: backprime,
            backsim: backsim,
            backsimeq: backsimeq,
            Backslash: Backslash,
            Barv: Barv,
            barvee: barvee,
            barwed: barwed,
            Barwed: Barwed,
            barwedge: barwedge,
            bbrk: bbrk,
            bbrktbrk: bbrktbrk,
            bcong: bcong,
            Bcy: Bcy,
            bcy: bcy,
            bdquo: bdquo,
            becaus: becaus,
            because: because,
            Because: Because,
            bemptyv: bemptyv,
            bepsi: bepsi,
            bernou: bernou,
            Bernoullis: Bernoullis,
            Beta: Beta,
            beta: beta,
            beth: beth,
            between: between,
            Bfr: Bfr,
            bfr: bfr,
            bigcap: bigcap,
            bigcirc: bigcirc,
            bigcup: bigcup,
            bigodot: bigodot,
            bigoplus: bigoplus,
            bigotimes: bigotimes,
            bigsqcup: bigsqcup,
            bigstar: bigstar,
            bigtriangledown: bigtriangledown,
            bigtriangleup: bigtriangleup,
            biguplus: biguplus,
            bigvee: bigvee,
            bigwedge: bigwedge,
            bkarow: bkarow,
            blacklozenge: blacklozenge,
            blacksquare: blacksquare,
            blacktriangle: blacktriangle,
            blacktriangledown: blacktriangledown,
            blacktriangleleft: blacktriangleleft,
            blacktriangleright: blacktriangleright,
            blank: blank,
            blk12: blk12,
            blk14: blk14,
            blk34: blk34,
            block: block,
            bne: bne,
            bnequiv: bnequiv,
            bNot: bNot,
            bnot: bnot,
            Bopf: Bopf,
            bopf: bopf,
            bot: bot,
            bottom: bottom,
            bowtie: bowtie,
            boxbox: boxbox,
            boxdl: boxdl,
            boxdL: boxdL,
            boxDl: boxDl,
            boxDL: boxDL,
            boxdr: boxdr,
            boxdR: boxdR,
            boxDr: boxDr,
            boxDR: boxDR,
            boxh: boxh,
            boxH: boxH,
            boxhd: boxhd,
            boxHd: boxHd,
            boxhD: boxhD,
            boxHD: boxHD,
            boxhu: boxhu,
            boxHu: boxHu,
            boxhU: boxhU,
            boxHU: boxHU,
            boxminus: boxminus,
            boxplus: boxplus,
            boxtimes: boxtimes,
            boxul: boxul,
            boxuL: boxuL,
            boxUl: boxUl,
            boxUL: boxUL,
            boxur: boxur,
            boxuR: boxuR,
            boxUr: boxUr,
            boxUR: boxUR,
            boxv: boxv,
            boxV: boxV,
            boxvh: boxvh,
            boxvH: boxvH,
            boxVh: boxVh,
            boxVH: boxVH,
            boxvl: boxvl,
            boxvL: boxvL,
            boxVl: boxVl,
            boxVL: boxVL,
            boxvr: boxvr,
            boxvR: boxvR,
            boxVr: boxVr,
            boxVR: boxVR,
            bprime: bprime,
            breve: breve,
            Breve: Breve,
            brvbar: brvbar,
            bscr: bscr,
            Bscr: Bscr,
            bsemi: bsemi,
            bsim: bsim,
            bsime: bsime,
            bsolb: bsolb,
            bsol: bsol,
            bsolhsub: bsolhsub,
            bull: bull,
            bullet: bullet,
            bump: bump,
            bumpE: bumpE,
            bumpe: bumpe,
            Bumpeq: Bumpeq,
            bumpeq: bumpeq,
            Cacute: Cacute,
            cacute: cacute,
            capand: capand,
            capbrcup: capbrcup,
            capcap: capcap,
            cap: cap,
            Cap: Cap,
            capcup: capcup,
            capdot: capdot,
            CapitalDifferentialD: CapitalDifferentialD,
            caps: caps,
            caret: caret,
            caron: caron,
            Cayleys: Cayleys,
            ccaps: ccaps,
            Ccaron: Ccaron,
            ccaron: ccaron,
            Ccedil: Ccedil,
            ccedil: ccedil,
            Ccirc: Ccirc,
            ccirc: ccirc,
            Cconint: Cconint,
            ccups: ccups,
            ccupssm: ccupssm,
            Cdot: Cdot,
            cdot: cdot,
            cedil: cedil,
            Cedilla: Cedilla,
            cemptyv: cemptyv,
            cent: cent,
            centerdot: centerdot,
            CenterDot: CenterDot,
            cfr: cfr,
            Cfr: Cfr,
            CHcy: CHcy,
            chcy: chcy,
            check: check,
            checkmark: checkmark,
            Chi: Chi,
            chi: chi,
            circ: circ,
            circeq: circeq,
            circlearrowleft: circlearrowleft,
            circlearrowright: circlearrowright,
            circledast: circledast,
            circledcirc: circledcirc,
            circleddash: circleddash,
            CircleDot: CircleDot,
            circledR: circledR,
            circledS: circledS,
            CircleMinus: CircleMinus,
            CirclePlus: CirclePlus,
            CircleTimes: CircleTimes,
            cir: cir,
            cirE: cirE,
            cire: cire,
            cirfnint: cirfnint,
            cirmid: cirmid,
            cirscir: cirscir,
            ClockwiseContourIntegral: ClockwiseContourIntegral,
            CloseCurlyDoubleQuote: CloseCurlyDoubleQuote,
            CloseCurlyQuote: CloseCurlyQuote,
            clubs: clubs,
            clubsuit: clubsuit,
            colon: colon,
            Colon: Colon,
            Colone: Colone,
            colone: colone,
            coloneq: coloneq,
            comma: comma,
            commat: commat,
            comp: comp,
            compfn: compfn,
            complement: complement,
            complexes: complexes,
            cong: cong,
            congdot: congdot,
            Congruent: Congruent,
            conint: conint,
            Conint: Conint,
            ContourIntegral: ContourIntegral,
            copf: copf,
            Copf: Copf,
            coprod: coprod,
            Coproduct: Coproduct,
            copy: copy,
            COPY: COPY,
            copysr: copysr,
            CounterClockwiseContourIntegral: CounterClockwiseContourIntegral,
            crarr: crarr,
            cross: cross,
            Cross: Cross,
            Cscr: Cscr,
            cscr: cscr,
            csub: csub,
            csube: csube,
            csup: csup,
            csupe: csupe,
            ctdot: ctdot,
            cudarrl: cudarrl,
            cudarrr: cudarrr,
            cuepr: cuepr,
            cuesc: cuesc,
            cularr: cularr,
            cularrp: cularrp,
            cupbrcap: cupbrcap,
            cupcap: cupcap,
            CupCap: CupCap,
            cup: cup,
            Cup: Cup,
            cupcup: cupcup,
            cupdot: cupdot,
            cupor: cupor,
            cups: cups,
            curarr: curarr,
            curarrm: curarrm,
            curlyeqprec: curlyeqprec,
            curlyeqsucc: curlyeqsucc,
            curlyvee: curlyvee,
            curlywedge: curlywedge,
            curren: curren,
            curvearrowleft: curvearrowleft,
            curvearrowright: curvearrowright,
            cuvee: cuvee,
            cuwed: cuwed,
            cwconint: cwconint,
            cwint: cwint,
            cylcty: cylcty,
            dagger: dagger,
            Dagger: Dagger,
            daleth: daleth,
            darr: darr,
            Darr: Darr,
            dArr: dArr,
            dash: dash,
            Dashv: Dashv,
            dashv: dashv,
            dbkarow: dbkarow,
            dblac: dblac,
            Dcaron: Dcaron,
            dcaron: dcaron,
            Dcy: Dcy,
            dcy: dcy,
            ddagger: ddagger,
            ddarr: ddarr,
            DD: DD,
            dd: dd,
            DDotrahd: DDotrahd,
            ddotseq: ddotseq,
            deg: deg,
            Del: Del,
            Delta: Delta,
            delta: delta,
            demptyv: demptyv,
            dfisht: dfisht,
            Dfr: Dfr,
            dfr: dfr,
            dHar: dHar,
            dharl: dharl,
            dharr: dharr,
            DiacriticalAcute: DiacriticalAcute,
            DiacriticalDot: DiacriticalDot,
            DiacriticalDoubleAcute: DiacriticalDoubleAcute,
            DiacriticalGrave: DiacriticalGrave,
            DiacriticalTilde: DiacriticalTilde,
            diam: diam,
            diamond: diamond,
            Diamond: Diamond,
            diamondsuit: diamondsuit,
            diams: diams,
            die: die,
            DifferentialD: DifferentialD,
            digamma: digamma,
            disin: disin,
            div: div,
            divide: divide,
            divideontimes: divideontimes,
            divonx: divonx,
            DJcy: DJcy,
            djcy: djcy,
            dlcorn: dlcorn,
            dlcrop: dlcrop,
            dollar: dollar,
            Dopf: Dopf,
            dopf: dopf,
            Dot: Dot,
            dot: dot,
            DotDot: DotDot,
            doteq: doteq,
            doteqdot: doteqdot,
            DotEqual: DotEqual,
            dotminus: dotminus,
            dotplus: dotplus,
            dotsquare: dotsquare,
            doublebarwedge: doublebarwedge,
            DoubleContourIntegral: DoubleContourIntegral,
            DoubleDot: DoubleDot,
            DoubleDownArrow: DoubleDownArrow,
            DoubleLeftArrow: DoubleLeftArrow,
            DoubleLeftRightArrow: DoubleLeftRightArrow,
            DoubleLeftTee: DoubleLeftTee,
            DoubleLongLeftArrow: DoubleLongLeftArrow,
            DoubleLongLeftRightArrow: DoubleLongLeftRightArrow,
            DoubleLongRightArrow: DoubleLongRightArrow,
            DoubleRightArrow: DoubleRightArrow,
            DoubleRightTee: DoubleRightTee,
            DoubleUpArrow: DoubleUpArrow,
            DoubleUpDownArrow: DoubleUpDownArrow,
            DoubleVerticalBar: DoubleVerticalBar,
            DownArrowBar: DownArrowBar,
            downarrow: downarrow,
            DownArrow: DownArrow,
            Downarrow: Downarrow,
            DownArrowUpArrow: DownArrowUpArrow,
            DownBreve: DownBreve,
            downdownarrows: downdownarrows,
            downharpoonleft: downharpoonleft,
            downharpoonright: downharpoonright,
            DownLeftRightVector: DownLeftRightVector,
            DownLeftTeeVector: DownLeftTeeVector,
            DownLeftVectorBar: DownLeftVectorBar,
            DownLeftVector: DownLeftVector,
            DownRightTeeVector: DownRightTeeVector,
            DownRightVectorBar: DownRightVectorBar,
            DownRightVector: DownRightVector,
            DownTeeArrow: DownTeeArrow,
            DownTee: DownTee,
            drbkarow: drbkarow,
            drcorn: drcorn,
            drcrop: drcrop,
            Dscr: Dscr,
            dscr: dscr,
            DScy: DScy,
            dscy: dscy,
            dsol: dsol,
            Dstrok: Dstrok,
            dstrok: dstrok,
            dtdot: dtdot,
            dtri: dtri,
            dtrif: dtrif,
            duarr: duarr,
            duhar: duhar,
            dwangle: dwangle,
            DZcy: DZcy,
            dzcy: dzcy,
            dzigrarr: dzigrarr,
            Eacute: Eacute,
            eacute: eacute,
            easter: easter,
            Ecaron: Ecaron,
            ecaron: ecaron,
            Ecirc: Ecirc,
            ecirc: ecirc,
            ecir: ecir,
            ecolon: ecolon,
            Ecy: Ecy,
            ecy: ecy,
            eDDot: eDDot,
            Edot: Edot,
            edot: edot,
            eDot: eDot,
            ee: ee,
            efDot: efDot,
            Efr: Efr,
            efr: efr,
            eg: eg,
            Egrave: Egrave,
            egrave: egrave,
            egs: egs,
            egsdot: egsdot,
            el: el,
            Element: Element,
            elinters: elinters,
            ell: ell,
            els: els,
            elsdot: elsdot,
            Emacr: Emacr,
            emacr: emacr,
            empty: empty,
            emptyset: emptyset,
            EmptySmallSquare: EmptySmallSquare,
            emptyv: emptyv,
            EmptyVerySmallSquare: EmptyVerySmallSquare,
            emsp13: emsp13,
            emsp14: emsp14,
            emsp: emsp,
            ENG: ENG,
            eng: eng,
            ensp: ensp,
            Eogon: Eogon,
            eogon: eogon,
            Eopf: Eopf,
            eopf: eopf,
            epar: epar,
            eparsl: eparsl,
            eplus: eplus,
            epsi: epsi,
            Epsilon: Epsilon,
            epsilon: epsilon,
            epsiv: epsiv,
            eqcirc: eqcirc,
            eqcolon: eqcolon,
            eqsim: eqsim,
            eqslantgtr: eqslantgtr,
            eqslantless: eqslantless,
            Equal: Equal,
            equals: equals,
            EqualTilde: EqualTilde,
            equest: equest,
            Equilibrium: Equilibrium,
            equiv: equiv,
            equivDD: equivDD,
            eqvparsl: eqvparsl,
            erarr: erarr,
            erDot: erDot,
            escr: escr,
            Escr: Escr,
            esdot: esdot,
            Esim: Esim,
            esim: esim,
            Eta: Eta,
            eta: eta,
            ETH: ETH,
            eth: eth,
            Euml: Euml,
            euml: euml,
            euro: euro,
            excl: excl,
            exist: exist,
            Exists: Exists,
            expectation: expectation,
            exponentiale: exponentiale,
            ExponentialE: ExponentialE,
            fallingdotseq: fallingdotseq,
            Fcy: Fcy,
            fcy: fcy,
            female: female,
            ffilig: ffilig,
            fflig: fflig,
            ffllig: ffllig,
            Ffr: Ffr,
            ffr: ffr,
            filig: filig,
            FilledSmallSquare: FilledSmallSquare,
            FilledVerySmallSquare: FilledVerySmallSquare,
            fjlig: fjlig,
            flat: flat,
            fllig: fllig,
            fltns: fltns,
            fnof: fnof,
            Fopf: Fopf,
            fopf: fopf,
            forall: forall,
            ForAll: ForAll,
            fork: fork,
            forkv: forkv,
            Fouriertrf: Fouriertrf,
            fpartint: fpartint,
            frac12: frac12,
            frac13: frac13,
            frac14: frac14,
            frac15: frac15,
            frac16: frac16,
            frac18: frac18,
            frac23: frac23,
            frac25: frac25,
            frac34: frac34,
            frac35: frac35,
            frac38: frac38,
            frac45: frac45,
            frac56: frac56,
            frac58: frac58,
            frac78: frac78,
            frasl: frasl,
            frown: frown,
            fscr: fscr,
            Fscr: Fscr,
            gacute: gacute,
            Gamma: Gamma,
            gamma: gamma,
            Gammad: Gammad,
            gammad: gammad,
            gap: gap,
            Gbreve: Gbreve,
            gbreve: gbreve,
            Gcedil: Gcedil,
            Gcirc: Gcirc,
            gcirc: gcirc,
            Gcy: Gcy,
            gcy: gcy,
            Gdot: Gdot,
            gdot: gdot,
            ge: ge,
            gE: gE,
            gEl: gEl,
            gel: gel,
            geq: geq,
            geqq: geqq,
            geqslant: geqslant,
            gescc: gescc,
            ges: ges,
            gesdot: gesdot,
            gesdoto: gesdoto,
            gesdotol: gesdotol,
            gesl: gesl,
            gesles: gesles,
            Gfr: Gfr,
            gfr: gfr,
            gg: gg,
            Gg: Gg,
            ggg: ggg,
            gimel: gimel,
            GJcy: GJcy,
            gjcy: gjcy,
            gla: gla,
            gl: gl,
            glE: glE,
            glj: glj,
            gnap: gnap,
            gnapprox: gnapprox,
            gne: gne,
            gnE: gnE,
            gneq: gneq,
            gneqq: gneqq,
            gnsim: gnsim,
            Gopf: Gopf,
            gopf: gopf,
            grave: grave,
            GreaterEqual: GreaterEqual,
            GreaterEqualLess: GreaterEqualLess,
            GreaterFullEqual: GreaterFullEqual,
            GreaterGreater: GreaterGreater,
            GreaterLess: GreaterLess,
            GreaterSlantEqual: GreaterSlantEqual,
            GreaterTilde: GreaterTilde,
            Gscr: Gscr,
            gscr: gscr,
            gsim: gsim,
            gsime: gsime,
            gsiml: gsiml,
            gtcc: gtcc,
            gtcir: gtcir,
            gt: gt,
            GT: GT,
            Gt: Gt,
            gtdot: gtdot,
            gtlPar: gtlPar,
            gtquest: gtquest,
            gtrapprox: gtrapprox,
            gtrarr: gtrarr,
            gtrdot: gtrdot,
            gtreqless: gtreqless,
            gtreqqless: gtreqqless,
            gtrless: gtrless,
            gtrsim: gtrsim,
            gvertneqq: gvertneqq,
            gvnE: gvnE,
            Hacek: Hacek,
            hairsp: hairsp,
            half: half,
            hamilt: hamilt,
            HARDcy: HARDcy,
            hardcy: hardcy,
            harrcir: harrcir,
            harr: harr,
            hArr: hArr,
            harrw: harrw,
            Hat: Hat,
            hbar: hbar,
            Hcirc: Hcirc,
            hcirc: hcirc,
            hearts: hearts,
            heartsuit: heartsuit,
            hellip: hellip,
            hercon: hercon,
            hfr: hfr,
            Hfr: Hfr,
            HilbertSpace: HilbertSpace,
            hksearow: hksearow,
            hkswarow: hkswarow,
            hoarr: hoarr,
            homtht: homtht,
            hookleftarrow: hookleftarrow,
            hookrightarrow: hookrightarrow,
            hopf: hopf,
            Hopf: Hopf,
            horbar: horbar,
            HorizontalLine: HorizontalLine,
            hscr: hscr,
            Hscr: Hscr,
            hslash: hslash,
            Hstrok: Hstrok,
            hstrok: hstrok,
            HumpDownHump: HumpDownHump,
            HumpEqual: HumpEqual,
            hybull: hybull,
            hyphen: hyphen,
            Iacute: Iacute,
            iacute: iacute,
            ic: ic,
            Icirc: Icirc,
            icirc: icirc,
            Icy: Icy,
            icy: icy,
            Idot: Idot,
            IEcy: IEcy,
            iecy: iecy,
            iexcl: iexcl,
            iff: iff,
            ifr: ifr,
            Ifr: Ifr,
            Igrave: Igrave,
            igrave: igrave,
            ii: ii,
            iiiint: iiiint,
            iiint: iiint,
            iinfin: iinfin,
            iiota: iiota,
            IJlig: IJlig,
            ijlig: ijlig,
            Imacr: Imacr,
            imacr: imacr,
            image: image,
            ImaginaryI: ImaginaryI,
            imagline: imagline,
            imagpart: imagpart,
            imath: imath,
            Im: Im,
            imof: imof,
            imped: imped,
            Implies: Implies,
            incare: incare,
            infin: infin,
            infintie: infintie,
            inodot: inodot,
            intcal: intcal,
            int: int,
            Int: Int,
            integers: integers,
            Integral: Integral,
            intercal: intercal,
            Intersection: Intersection,
            intlarhk: intlarhk,
            intprod: intprod,
            InvisibleComma: InvisibleComma,
            InvisibleTimes: InvisibleTimes,
            IOcy: IOcy,
            iocy: iocy,
            Iogon: Iogon,
            iogon: iogon,
            Iopf: Iopf,
            iopf: iopf,
            Iota: Iota,
            iota: iota,
            iprod: iprod,
            iquest: iquest,
            iscr: iscr,
            Iscr: Iscr,
            isin: isin,
            isindot: isindot,
            isinE: isinE,
            isins: isins,
            isinsv: isinsv,
            isinv: isinv,
            it: it,
            Itilde: Itilde,
            itilde: itilde,
            Iukcy: Iukcy,
            iukcy: iukcy,
            Iuml: Iuml,
            iuml: iuml,
            Jcirc: Jcirc,
            jcirc: jcirc,
            Jcy: Jcy,
            jcy: jcy,
            Jfr: Jfr,
            jfr: jfr,
            jmath: jmath,
            Jopf: Jopf,
            jopf: jopf,
            Jscr: Jscr,
            jscr: jscr,
            Jsercy: Jsercy,
            jsercy: jsercy,
            Jukcy: Jukcy,
            jukcy: jukcy,
            Kappa: Kappa,
            kappa: kappa,
            kappav: kappav,
            Kcedil: Kcedil,
            kcedil: kcedil,
            Kcy: Kcy,
            kcy: kcy,
            Kfr: Kfr,
            kfr: kfr,
            kgreen: kgreen,
            KHcy: KHcy,
            khcy: khcy,
            KJcy: KJcy,
            kjcy: kjcy,
            Kopf: Kopf,
            kopf: kopf,
            Kscr: Kscr,
            kscr: kscr,
            lAarr: lAarr,
            Lacute: Lacute,
            lacute: lacute,
            laemptyv: laemptyv,
            lagran: lagran,
            Lambda: Lambda,
            lambda: lambda,
            lang: lang,
            Lang: Lang,
            langd: langd,
            langle: langle,
            lap: lap,
            Laplacetrf: Laplacetrf,
            laquo: laquo,
            larrb: larrb,
            larrbfs: larrbfs,
            larr: larr,
            Larr: Larr,
            lArr: lArr,
            larrfs: larrfs,
            larrhk: larrhk,
            larrlp: larrlp,
            larrpl: larrpl,
            larrsim: larrsim,
            larrtl: larrtl,
            latail: latail,
            lAtail: lAtail,
            lat: lat,
            late: late,
            lates: lates,
            lbarr: lbarr,
            lBarr: lBarr,
            lbbrk: lbbrk,
            lbrace: lbrace,
            lbrack: lbrack,
            lbrke: lbrke,
            lbrksld: lbrksld,
            lbrkslu: lbrkslu,
            Lcaron: Lcaron,
            lcaron: lcaron,
            Lcedil: Lcedil,
            lcedil: lcedil,
            lceil: lceil,
            lcub: lcub,
            Lcy: Lcy,
            lcy: lcy,
            ldca: ldca,
            ldquo: ldquo,
            ldquor: ldquor,
            ldrdhar: ldrdhar,
            ldrushar: ldrushar,
            ldsh: ldsh,
            le: le,
            lE: lE,
            LeftAngleBracket: LeftAngleBracket,
            LeftArrowBar: LeftArrowBar,
            leftarrow: leftarrow,
            LeftArrow: LeftArrow,
            Leftarrow: Leftarrow,
            LeftArrowRightArrow: LeftArrowRightArrow,
            leftarrowtail: leftarrowtail,
            LeftCeiling: LeftCeiling,
            LeftDoubleBracket: LeftDoubleBracket,
            LeftDownTeeVector: LeftDownTeeVector,
            LeftDownVectorBar: LeftDownVectorBar,
            LeftDownVector: LeftDownVector,
            LeftFloor: LeftFloor,
            leftharpoondown: leftharpoondown,
            leftharpoonup: leftharpoonup,
            leftleftarrows: leftleftarrows,
            leftrightarrow: leftrightarrow,
            LeftRightArrow: LeftRightArrow,
            Leftrightarrow: Leftrightarrow,
            leftrightarrows: leftrightarrows,
            leftrightharpoons: leftrightharpoons,
            leftrightsquigarrow: leftrightsquigarrow,
            LeftRightVector: LeftRightVector,
            LeftTeeArrow: LeftTeeArrow,
            LeftTee: LeftTee,
            LeftTeeVector: LeftTeeVector,
            leftthreetimes: leftthreetimes,
            LeftTriangleBar: LeftTriangleBar,
            LeftTriangle: LeftTriangle,
            LeftTriangleEqual: LeftTriangleEqual,
            LeftUpDownVector: LeftUpDownVector,
            LeftUpTeeVector: LeftUpTeeVector,
            LeftUpVectorBar: LeftUpVectorBar,
            LeftUpVector: LeftUpVector,
            LeftVectorBar: LeftVectorBar,
            LeftVector: LeftVector,
            lEg: lEg,
            leg: leg,
            leq: leq,
            leqq: leqq,
            leqslant: leqslant,
            lescc: lescc,
            les: les,
            lesdot: lesdot,
            lesdoto: lesdoto,
            lesdotor: lesdotor,
            lesg: lesg,
            lesges: lesges,
            lessapprox: lessapprox,
            lessdot: lessdot,
            lesseqgtr: lesseqgtr,
            lesseqqgtr: lesseqqgtr,
            LessEqualGreater: LessEqualGreater,
            LessFullEqual: LessFullEqual,
            LessGreater: LessGreater,
            lessgtr: lessgtr,
            LessLess: LessLess,
            lesssim: lesssim,
            LessSlantEqual: LessSlantEqual,
            LessTilde: LessTilde,
            lfisht: lfisht,
            lfloor: lfloor,
            Lfr: Lfr,
            lfr: lfr,
            lg: lg,
            lgE: lgE,
            lHar: lHar,
            lhard: lhard,
            lharu: lharu,
            lharul: lharul,
            lhblk: lhblk,
            LJcy: LJcy,
            ljcy: ljcy,
            llarr: llarr,
            ll: ll,
            Ll: Ll,
            llcorner: llcorner,
            Lleftarrow: Lleftarrow,
            llhard: llhard,
            lltri: lltri,
            Lmidot: Lmidot,
            lmidot: lmidot,
            lmoustache: lmoustache,
            lmoust: lmoust,
            lnap: lnap,
            lnapprox: lnapprox,
            lne: lne,
            lnE: lnE,
            lneq: lneq,
            lneqq: lneqq,
            lnsim: lnsim,
            loang: loang,
            loarr: loarr,
            lobrk: lobrk,
            longleftarrow: longleftarrow,
            LongLeftArrow: LongLeftArrow,
            Longleftarrow: Longleftarrow,
            longleftrightarrow: longleftrightarrow,
            LongLeftRightArrow: LongLeftRightArrow,
            Longleftrightarrow: Longleftrightarrow,
            longmapsto: longmapsto,
            longrightarrow: longrightarrow,
            LongRightArrow: LongRightArrow,
            Longrightarrow: Longrightarrow,
            looparrowleft: looparrowleft,
            looparrowright: looparrowright,
            lopar: lopar,
            Lopf: Lopf,
            lopf: lopf,
            loplus: loplus,
            lotimes: lotimes,
            lowast: lowast,
            lowbar: lowbar,
            LowerLeftArrow: LowerLeftArrow,
            LowerRightArrow: LowerRightArrow,
            loz: loz,
            lozenge: lozenge,
            lozf: lozf,
            lpar: lpar,
            lparlt: lparlt,
            lrarr: lrarr,
            lrcorner: lrcorner,
            lrhar: lrhar,
            lrhard: lrhard,
            lrm: lrm,
            lrtri: lrtri,
            lsaquo: lsaquo,
            lscr: lscr,
            Lscr: Lscr,
            lsh: lsh,
            Lsh: Lsh,
            lsim: lsim,
            lsime: lsime,
            lsimg: lsimg,
            lsqb: lsqb,
            lsquo: lsquo,
            lsquor: lsquor,
            Lstrok: Lstrok,
            lstrok: lstrok,
            ltcc: ltcc,
            ltcir: ltcir,
            lt: lt,
            LT: LT,
            Lt: Lt,
            ltdot: ltdot,
            lthree: lthree,
            ltimes: ltimes,
            ltlarr: ltlarr,
            ltquest: ltquest,
            ltri: ltri,
            ltrie: ltrie,
            ltrif: ltrif,
            ltrPar: ltrPar,
            lurdshar: lurdshar,
            luruhar: luruhar,
            lvertneqq: lvertneqq,
            lvnE: lvnE,
            macr: macr,
            male: male,
            malt: malt,
            maltese: maltese,
            map: map,
            mapsto: mapsto,
            mapstodown: mapstodown,
            mapstoleft: mapstoleft,
            mapstoup: mapstoup,
            marker: marker,
            mcomma: mcomma,
            Mcy: Mcy,
            mcy: mcy,
            mdash: mdash,
            mDDot: mDDot,
            measuredangle: measuredangle,
            MediumSpace: MediumSpace,
            Mellintrf: Mellintrf,
            Mfr: Mfr,
            mfr: mfr,
            mho: mho,
            micro: micro,
            midast: midast,
            midcir: midcir,
            mid: mid,
            middot: middot,
            minusb: minusb,
            minus: minus,
            minusd: minusd,
            minusdu: minusdu,
            MinusPlus: MinusPlus,
            mlcp: mlcp,
            mldr: mldr,
            mnplus: mnplus,
            models: models,
            Mopf: Mopf,
            mopf: mopf,
            mp: mp,
            mscr: mscr,
            Mscr: Mscr,
            mstpos: mstpos,
            Mu: Mu,
            mu: mu,
            multimap: multimap,
            mumap: mumap,
            nabla: nabla,
            Nacute: Nacute,
            nacute: nacute,
            nang: nang,
            nap: nap,
            napE: napE,
            napid: napid,
            napos: napos,
            napprox: napprox,
            natural: natural,
            naturals: naturals,
            natur: natur,
            nbsp: nbsp,
            nbump: nbump,
            nbumpe: nbumpe,
            ncap: ncap,
            Ncaron: Ncaron,
            ncaron: ncaron,
            Ncedil: Ncedil,
            ncedil: ncedil,
            ncong: ncong,
            ncongdot: ncongdot,
            ncup: ncup,
            Ncy: Ncy,
            ncy: ncy,
            ndash: ndash,
            nearhk: nearhk,
            nearr: nearr,
            neArr: neArr,
            nearrow: nearrow,
            ne: ne,
            nedot: nedot,
            NegativeMediumSpace: NegativeMediumSpace,
            NegativeThickSpace: NegativeThickSpace,
            NegativeThinSpace: NegativeThinSpace,
            NegativeVeryThinSpace: NegativeVeryThinSpace,
            nequiv: nequiv,
            nesear: nesear,
            nesim: nesim,
            NestedGreaterGreater: NestedGreaterGreater,
            NestedLessLess: NestedLessLess,
            NewLine: NewLine,
            nexist: nexist,
            nexists: nexists,
            Nfr: Nfr,
            nfr: nfr,
            ngE: ngE,
            nge: nge,
            ngeq: ngeq,
            ngeqq: ngeqq,
            ngeqslant: ngeqslant,
            nges: nges,
            nGg: nGg,
            ngsim: ngsim,
            nGt: nGt,
            ngt: ngt,
            ngtr: ngtr,
            nGtv: nGtv,
            nharr: nharr,
            nhArr: nhArr,
            nhpar: nhpar,
            ni: ni,
            nis: nis,
            nisd: nisd,
            niv: niv,
            NJcy: NJcy,
            njcy: njcy,
            nlarr: nlarr,
            nlArr: nlArr,
            nldr: nldr,
            nlE: nlE,
            nle: nle,
            nleftarrow: nleftarrow,
            nLeftarrow: nLeftarrow,
            nleftrightarrow: nleftrightarrow,
            nLeftrightarrow: nLeftrightarrow,
            nleq: nleq,
            nleqq: nleqq,
            nleqslant: nleqslant,
            nles: nles,
            nless: nless,
            nLl: nLl,
            nlsim: nlsim,
            nLt: nLt,
            nlt: nlt,
            nltri: nltri,
            nltrie: nltrie,
            nLtv: nLtv,
            nmid: nmid,
            NoBreak: NoBreak,
            NonBreakingSpace: NonBreakingSpace,
            nopf: nopf,
            Nopf: Nopf,
            Not: Not,
            not: not,
            NotCongruent: NotCongruent,
            NotCupCap: NotCupCap,
            NotDoubleVerticalBar: NotDoubleVerticalBar,
            NotElement: NotElement,
            NotEqual: NotEqual,
            NotEqualTilde: NotEqualTilde,
            NotExists: NotExists,
            NotGreater: NotGreater,
            NotGreaterEqual: NotGreaterEqual,
            NotGreaterFullEqual: NotGreaterFullEqual,
            NotGreaterGreater: NotGreaterGreater,
            NotGreaterLess: NotGreaterLess,
            NotGreaterSlantEqual: NotGreaterSlantEqual,
            NotGreaterTilde: NotGreaterTilde,
            NotHumpDownHump: NotHumpDownHump,
            NotHumpEqual: NotHumpEqual,
            notin: notin,
            notindot: notindot,
            notinE: notinE,
            notinva: notinva,
            notinvb: notinvb,
            notinvc: notinvc,
            NotLeftTriangleBar: NotLeftTriangleBar,
            NotLeftTriangle: NotLeftTriangle,
            NotLeftTriangleEqual: NotLeftTriangleEqual,
            NotLess: NotLess,
            NotLessEqual: NotLessEqual,
            NotLessGreater: NotLessGreater,
            NotLessLess: NotLessLess,
            NotLessSlantEqual: NotLessSlantEqual,
            NotLessTilde: NotLessTilde,
            NotNestedGreaterGreater: NotNestedGreaterGreater,
            NotNestedLessLess: NotNestedLessLess,
            notni: notni,
            notniva: notniva,
            notnivb: notnivb,
            notnivc: notnivc,
            NotPrecedes: NotPrecedes,
            NotPrecedesEqual: NotPrecedesEqual,
            NotPrecedesSlantEqual: NotPrecedesSlantEqual,
            NotReverseElement: NotReverseElement,
            NotRightTriangleBar: NotRightTriangleBar,
            NotRightTriangle: NotRightTriangle,
            NotRightTriangleEqual: NotRightTriangleEqual,
            NotSquareSubset: NotSquareSubset,
            NotSquareSubsetEqual: NotSquareSubsetEqual,
            NotSquareSuperset: NotSquareSuperset,
            NotSquareSupersetEqual: NotSquareSupersetEqual,
            NotSubset: NotSubset,
            NotSubsetEqual: NotSubsetEqual,
            NotSucceeds: NotSucceeds,
            NotSucceedsEqual: NotSucceedsEqual,
            NotSucceedsSlantEqual: NotSucceedsSlantEqual,
            NotSucceedsTilde: NotSucceedsTilde,
            NotSuperset: NotSuperset,
            NotSupersetEqual: NotSupersetEqual,
            NotTilde: NotTilde,
            NotTildeEqual: NotTildeEqual,
            NotTildeFullEqual: NotTildeFullEqual,
            NotTildeTilde: NotTildeTilde,
            NotVerticalBar: NotVerticalBar,
            nparallel: nparallel,
            npar: npar,
            nparsl: nparsl,
            npart: npart,
            npolint: npolint,
            npr: npr,
            nprcue: nprcue,
            nprec: nprec,
            npreceq: npreceq,
            npre: npre,
            nrarrc: nrarrc,
            nrarr: nrarr,
            nrArr: nrArr,
            nrarrw: nrarrw,
            nrightarrow: nrightarrow,
            nRightarrow: nRightarrow,
            nrtri: nrtri,
            nrtrie: nrtrie,
            nsc: nsc,
            nsccue: nsccue,
            nsce: nsce,
            Nscr: Nscr,
            nscr: nscr,
            nshortmid: nshortmid,
            nshortparallel: nshortparallel,
            nsim: nsim,
            nsime: nsime,
            nsimeq: nsimeq,
            nsmid: nsmid,
            nspar: nspar,
            nsqsube: nsqsube,
            nsqsupe: nsqsupe,
            nsub: nsub,
            nsubE: nsubE,
            nsube: nsube,
            nsubset: nsubset,
            nsubseteq: nsubseteq,
            nsubseteqq: nsubseteqq,
            nsucc: nsucc,
            nsucceq: nsucceq,
            nsup: nsup,
            nsupE: nsupE,
            nsupe: nsupe,
            nsupset: nsupset,
            nsupseteq: nsupseteq,
            nsupseteqq: nsupseteqq,
            ntgl: ntgl,
            Ntilde: Ntilde,
            ntilde: ntilde,
            ntlg: ntlg,
            ntriangleleft: ntriangleleft,
            ntrianglelefteq: ntrianglelefteq,
            ntriangleright: ntriangleright,
            ntrianglerighteq: ntrianglerighteq,
            Nu: Nu,
            nu: nu,
            num: num,
            numero: numero,
            numsp: numsp,
            nvap: nvap,
            nvdash: nvdash,
            nvDash: nvDash,
            nVdash: nVdash,
            nVDash: nVDash,
            nvge: nvge,
            nvgt: nvgt,
            nvHarr: nvHarr,
            nvinfin: nvinfin,
            nvlArr: nvlArr,
            nvle: nvle,
            nvlt: nvlt,
            nvltrie: nvltrie,
            nvrArr: nvrArr,
            nvrtrie: nvrtrie,
            nvsim: nvsim,
            nwarhk: nwarhk,
            nwarr: nwarr,
            nwArr: nwArr,
            nwarrow: nwarrow,
            nwnear: nwnear,
            Oacute: Oacute,
            oacute: oacute,
            oast: oast,
            Ocirc: Ocirc,
            ocirc: ocirc,
            ocir: ocir,
            Ocy: Ocy,
            ocy: ocy,
            odash: odash,
            Odblac: Odblac,
            odblac: odblac,
            odiv: odiv,
            odot: odot,
            odsold: odsold,
            OElig: OElig,
            oelig: oelig,
            ofcir: ofcir,
            Ofr: Ofr,
            ofr: ofr,
            ogon: ogon,
            Ograve: Ograve,
            ograve: ograve,
            ogt: ogt,
            ohbar: ohbar,
            ohm: ohm,
            oint: oint,
            olarr: olarr,
            olcir: olcir,
            olcross: olcross,
            oline: oline,
            olt: olt,
            Omacr: Omacr,
            omacr: omacr,
            Omega: Omega,
            omega: omega,
            Omicron: Omicron,
            omicron: omicron,
            omid: omid,
            ominus: ominus,
            Oopf: Oopf,
            oopf: oopf,
            opar: opar,
            OpenCurlyDoubleQuote: OpenCurlyDoubleQuote,
            OpenCurlyQuote: OpenCurlyQuote,
            operp: operp,
            oplus: oplus,
            orarr: orarr,
            Or: Or,
            or: or,
            ord: ord,
            order: order,
            orderof: orderof,
            ordf: ordf,
            ordm: ordm,
            origof: origof,
            oror: oror,
            orslope: orslope,
            orv: orv,
            oS: oS,
            Oscr: Oscr,
            oscr: oscr,
            Oslash: Oslash,
            oslash: oslash,
            osol: osol,
            Otilde: Otilde,
            otilde: otilde,
            otimesas: otimesas,
            Otimes: Otimes,
            otimes: otimes,
            Ouml: Ouml,
            ouml: ouml,
            ovbar: ovbar,
            OverBar: OverBar,
            OverBrace: OverBrace,
            OverBracket: OverBracket,
            OverParenthesis: OverParenthesis,
            para: para,
            parallel: parallel,
            par: par,
            parsim: parsim,
            parsl: parsl,
            part: part,
            PartialD: PartialD,
            Pcy: Pcy,
            pcy: pcy,
            percnt: percnt,
            period: period,
            permil: permil,
            perp: perp,
            pertenk: pertenk,
            Pfr: Pfr,
            pfr: pfr,
            Phi: Phi,
            phi: phi,
            phiv: phiv,
            phmmat: phmmat,
            phone: phone,
            Pi: Pi,
            pi: pi,
            pitchfork: pitchfork,
            piv: piv,
            planck: planck,
            planckh: planckh,
            plankv: plankv,
            plusacir: plusacir,
            plusb: plusb,
            pluscir: pluscir,
            plus: plus,
            plusdo: plusdo,
            plusdu: plusdu,
            pluse: pluse,
            PlusMinus: PlusMinus,
            plusmn: plusmn,
            plussim: plussim,
            plustwo: plustwo,
            pm: pm,
            Poincareplane: Poincareplane,
            pointint: pointint,
            popf: popf,
            Popf: Popf,
            pound: pound,
            prap: prap,
            Pr: Pr,
            pr: pr,
            prcue: prcue,
            precapprox: precapprox,
            prec: prec,
            preccurlyeq: preccurlyeq,
            Precedes: Precedes,
            PrecedesEqual: PrecedesEqual,
            PrecedesSlantEqual: PrecedesSlantEqual,
            PrecedesTilde: PrecedesTilde,
            preceq: preceq,
            precnapprox: precnapprox,
            precneqq: precneqq,
            precnsim: precnsim,
            pre: pre,
            prE: prE,
            precsim: precsim,
            prime: prime,
            Prime: Prime,
            primes: primes,
            prnap: prnap,
            prnE: prnE,
            prnsim: prnsim,
            prod: prod,
            Product: Product,
            profalar: profalar,
            profline: profline,
            profsurf: profsurf,
            prop: prop,
            Proportional: Proportional,
            Proportion: Proportion,
            propto: propto,
            prsim: prsim,
            prurel: prurel,
            Pscr: Pscr,
            pscr: pscr,
            Psi: Psi,
            psi: psi,
            puncsp: puncsp,
            Qfr: Qfr,
            qfr: qfr,
            qint: qint,
            qopf: qopf,
            Qopf: Qopf,
            qprime: qprime,
            Qscr: Qscr,
            qscr: qscr,
            quaternions: quaternions,
            quatint: quatint,
            quest: quest,
            questeq: questeq,
            quot: quot,
            QUOT: QUOT,
            rAarr: rAarr,
            race: race,
            Racute: Racute,
            racute: racute,
            radic: radic,
            raemptyv: raemptyv,
            rang: rang,
            Rang: Rang,
            rangd: rangd,
            range: range,
            rangle: rangle,
            raquo: raquo,
            rarrap: rarrap,
            rarrb: rarrb,
            rarrbfs: rarrbfs,
            rarrc: rarrc,
            rarr: rarr,
            Rarr: Rarr,
            rArr: rArr,
            rarrfs: rarrfs,
            rarrhk: rarrhk,
            rarrlp: rarrlp,
            rarrpl: rarrpl,
            rarrsim: rarrsim,
            Rarrtl: Rarrtl,
            rarrtl: rarrtl,
            rarrw: rarrw,
            ratail: ratail,
            rAtail: rAtail,
            ratio: ratio,
            rationals: rationals,
            rbarr: rbarr,
            rBarr: rBarr,
            RBarr: RBarr,
            rbbrk: rbbrk,
            rbrace: rbrace,
            rbrack: rbrack,
            rbrke: rbrke,
            rbrksld: rbrksld,
            rbrkslu: rbrkslu,
            Rcaron: Rcaron,
            rcaron: rcaron,
            Rcedil: Rcedil,
            rcedil: rcedil,
            rceil: rceil,
            rcub: rcub,
            Rcy: Rcy,
            rcy: rcy,
            rdca: rdca,
            rdldhar: rdldhar,
            rdquo: rdquo,
            rdquor: rdquor,
            rdsh: rdsh,
            real: real,
            realine: realine,
            realpart: realpart,
            reals: reals,
            Re: Re,
            rect: rect,
            reg: reg,
            REG: REG,
            ReverseElement: ReverseElement,
            ReverseEquilibrium: ReverseEquilibrium,
            ReverseUpEquilibrium: ReverseUpEquilibrium,
            rfisht: rfisht,
            rfloor: rfloor,
            rfr: rfr,
            Rfr: Rfr,
            rHar: rHar,
            rhard: rhard,
            rharu: rharu,
            rharul: rharul,
            Rho: Rho,
            rho: rho,
            rhov: rhov,
            RightAngleBracket: RightAngleBracket,
            RightArrowBar: RightArrowBar,
            rightarrow: rightarrow,
            RightArrow: RightArrow,
            Rightarrow: Rightarrow,
            RightArrowLeftArrow: RightArrowLeftArrow,
            rightarrowtail: rightarrowtail,
            RightCeiling: RightCeiling,
            RightDoubleBracket: RightDoubleBracket,
            RightDownTeeVector: RightDownTeeVector,
            RightDownVectorBar: RightDownVectorBar,
            RightDownVector: RightDownVector,
            RightFloor: RightFloor,
            rightharpoondown: rightharpoondown,
            rightharpoonup: rightharpoonup,
            rightleftarrows: rightleftarrows,
            rightleftharpoons: rightleftharpoons,
            rightrightarrows: rightrightarrows,
            rightsquigarrow: rightsquigarrow,
            RightTeeArrow: RightTeeArrow,
            RightTee: RightTee,
            RightTeeVector: RightTeeVector,
            rightthreetimes: rightthreetimes,
            RightTriangleBar: RightTriangleBar,
            RightTriangle: RightTriangle,
            RightTriangleEqual: RightTriangleEqual,
            RightUpDownVector: RightUpDownVector,
            RightUpTeeVector: RightUpTeeVector,
            RightUpVectorBar: RightUpVectorBar,
            RightUpVector: RightUpVector,
            RightVectorBar: RightVectorBar,
            RightVector: RightVector,
            ring: ring,
            risingdotseq: risingdotseq,
            rlarr: rlarr,
            rlhar: rlhar,
            rlm: rlm,
            rmoustache: rmoustache,
            rmoust: rmoust,
            rnmid: rnmid,
            roang: roang,
            roarr: roarr,
            robrk: robrk,
            ropar: ropar,
            ropf: ropf,
            Ropf: Ropf,
            roplus: roplus,
            rotimes: rotimes,
            RoundImplies: RoundImplies,
            rpar: rpar,
            rpargt: rpargt,
            rppolint: rppolint,
            rrarr: rrarr,
            Rrightarrow: Rrightarrow,
            rsaquo: rsaquo,
            rscr: rscr,
            Rscr: Rscr,
            rsh: rsh,
            Rsh: Rsh,
            rsqb: rsqb,
            rsquo: rsquo,
            rsquor: rsquor,
            rthree: rthree,
            rtimes: rtimes,
            rtri: rtri,
            rtrie: rtrie,
            rtrif: rtrif,
            rtriltri: rtriltri,
            RuleDelayed: RuleDelayed,
            ruluhar: ruluhar,
            rx: rx,
            Sacute: Sacute,
            sacute: sacute,
            sbquo: sbquo,
            scap: scap,
            Scaron: Scaron,
            scaron: scaron,
            Sc: Sc,
            sc: sc,
            sccue: sccue,
            sce: sce,
            scE: scE,
            Scedil: Scedil,
            scedil: scedil,
            Scirc: Scirc,
            scirc: scirc,
            scnap: scnap,
            scnE: scnE,
            scnsim: scnsim,
            scpolint: scpolint,
            scsim: scsim,
            Scy: Scy,
            scy: scy,
            sdotb: sdotb,
            sdot: sdot,
            sdote: sdote,
            searhk: searhk,
            searr: searr,
            seArr: seArr,
            searrow: searrow,
            sect: sect,
            semi: semi,
            seswar: seswar,
            setminus: setminus,
            setmn: setmn,
            sext: sext,
            Sfr: Sfr,
            sfr: sfr,
            sfrown: sfrown,
            sharp: sharp,
            SHCHcy: SHCHcy,
            shchcy: shchcy,
            SHcy: SHcy,
            shcy: shcy,
            ShortDownArrow: ShortDownArrow,
            ShortLeftArrow: ShortLeftArrow,
            shortmid: shortmid,
            shortparallel: shortparallel,
            ShortRightArrow: ShortRightArrow,
            ShortUpArrow: ShortUpArrow,
            shy: shy,
            Sigma: Sigma,
            sigma: sigma,
            sigmaf: sigmaf,
            sigmav: sigmav,
            sim: sim,
            simdot: simdot,
            sime: sime,
            simeq: simeq,
            simg: simg,
            simgE: simgE,
            siml: siml,
            simlE: simlE,
            simne: simne,
            simplus: simplus,
            simrarr: simrarr,
            slarr: slarr,
            SmallCircle: SmallCircle,
            smallsetminus: smallsetminus,
            smashp: smashp,
            smeparsl: smeparsl,
            smid: smid,
            smile: smile,
            smt: smt,
            smte: smte,
            smtes: smtes,
            SOFTcy: SOFTcy,
            softcy: softcy,
            solbar: solbar,
            solb: solb,
            sol: sol,
            Sopf: Sopf,
            sopf: sopf,
            spades: spades,
            spadesuit: spadesuit,
            spar: spar,
            sqcap: sqcap,
            sqcaps: sqcaps,
            sqcup: sqcup,
            sqcups: sqcups,
            Sqrt: Sqrt,
            sqsub: sqsub,
            sqsube: sqsube,
            sqsubset: sqsubset,
            sqsubseteq: sqsubseteq,
            sqsup: sqsup,
            sqsupe: sqsupe,
            sqsupset: sqsupset,
            sqsupseteq: sqsupseteq,
            square: square,
            Square: Square,
            SquareIntersection: SquareIntersection,
            SquareSubset: SquareSubset,
            SquareSubsetEqual: SquareSubsetEqual,
            SquareSuperset: SquareSuperset,
            SquareSupersetEqual: SquareSupersetEqual,
            SquareUnion: SquareUnion,
            squarf: squarf,
            squ: squ,
            squf: squf,
            srarr: srarr,
            Sscr: Sscr,
            sscr: sscr,
            ssetmn: ssetmn,
            ssmile: ssmile,
            sstarf: sstarf,
            Star: Star,
            star: star,
            starf: starf,
            straightepsilon: straightepsilon,
            straightphi: straightphi,
            strns: strns,
            sub: sub,
            Sub: Sub,
            subdot: subdot,
            subE: subE,
            sube: sube,
            subedot: subedot,
            submult: submult,
            subnE: subnE,
            subne: subne,
            subplus: subplus,
            subrarr: subrarr,
            subset: subset,
            Subset: Subset,
            subseteq: subseteq,
            subseteqq: subseteqq,
            SubsetEqual: SubsetEqual,
            subsetneq: subsetneq,
            subsetneqq: subsetneqq,
            subsim: subsim,
            subsub: subsub,
            subsup: subsup,
            succapprox: succapprox,
            succ: succ,
            succcurlyeq: succcurlyeq,
            Succeeds: Succeeds,
            SucceedsEqual: SucceedsEqual,
            SucceedsSlantEqual: SucceedsSlantEqual,
            SucceedsTilde: SucceedsTilde,
            succeq: succeq,
            succnapprox: succnapprox,
            succneqq: succneqq,
            succnsim: succnsim,
            succsim: succsim,
            SuchThat: SuchThat,
            sum: sum,
            Sum: Sum,
            sung: sung,
            sup1: sup1,
            sup2: sup2,
            sup3: sup3,
            sup: sup,
            Sup: Sup,
            supdot: supdot,
            supdsub: supdsub,
            supE: supE,
            supe: supe,
            supedot: supedot,
            Superset: Superset,
            SupersetEqual: SupersetEqual,
            suphsol: suphsol,
            suphsub: suphsub,
            suplarr: suplarr,
            supmult: supmult,
            supnE: supnE,
            supne: supne,
            supplus: supplus,
            supset: supset,
            Supset: Supset,
            supseteq: supseteq,
            supseteqq: supseteqq,
            supsetneq: supsetneq,
            supsetneqq: supsetneqq,
            supsim: supsim,
            supsub: supsub,
            supsup: supsup,
            swarhk: swarhk,
            swarr: swarr,
            swArr: swArr,
            swarrow: swarrow,
            swnwar: swnwar,
            szlig: szlig,
            Tab: Tab,
            target: target,
            Tau: Tau,
            tau: tau,
            tbrk: tbrk,
            Tcaron: Tcaron,
            tcaron: tcaron,
            Tcedil: Tcedil,
            tcedil: tcedil,
            Tcy: Tcy,
            tcy: tcy,
            tdot: tdot,
            telrec: telrec,
            Tfr: Tfr,
            tfr: tfr,
            there4: there4,
            therefore: therefore,
            Therefore: Therefore,
            Theta: Theta,
            theta: theta,
            thetasym: thetasym,
            thetav: thetav,
            thickapprox: thickapprox,
            thicksim: thicksim,
            ThickSpace: ThickSpace,
            ThinSpace: ThinSpace,
            thinsp: thinsp,
            thkap: thkap,
            thksim: thksim,
            THORN: THORN,
            thorn: thorn,
            tilde: tilde,
            Tilde: Tilde,
            TildeEqual: TildeEqual,
            TildeFullEqual: TildeFullEqual,
            TildeTilde: TildeTilde,
            timesbar: timesbar,
            timesb: timesb,
            times: times,
            timesd: timesd,
            tint: tint,
            toea: toea,
            topbot: topbot,
            topcir: topcir,
            top: top,
            Topf: Topf,
            topf: topf,
            topfork: topfork,
            tosa: tosa,
            tprime: tprime,
            trade: trade,
            TRADE: TRADE,
            triangle: triangle,
            triangledown: triangledown,
            triangleleft: triangleleft,
            trianglelefteq: trianglelefteq,
            triangleq: triangleq,
            triangleright: triangleright,
            trianglerighteq: trianglerighteq,
            tridot: tridot,
            trie: trie,
            triminus: triminus,
            TripleDot: TripleDot,
            triplus: triplus,
            trisb: trisb,
            tritime: tritime,
            trpezium: trpezium,
            Tscr: Tscr,
            tscr: tscr,
            TScy: TScy,
            tscy: tscy,
            TSHcy: TSHcy,
            tshcy: tshcy,
            Tstrok: Tstrok,
            tstrok: tstrok,
            twixt: twixt,
            twoheadleftarrow: twoheadleftarrow,
            twoheadrightarrow: twoheadrightarrow,
            Uacute: Uacute,
            uacute: uacute,
            uarr: uarr,
            Uarr: Uarr,
            uArr: uArr,
            Uarrocir: Uarrocir,
            Ubrcy: Ubrcy,
            ubrcy: ubrcy,
            Ubreve: Ubreve,
            ubreve: ubreve,
            Ucirc: Ucirc,
            ucirc: ucirc,
            Ucy: Ucy,
            ucy: ucy,
            udarr: udarr,
            Udblac: Udblac,
            udblac: udblac,
            udhar: udhar,
            ufisht: ufisht,
            Ufr: Ufr,
            ufr: ufr,
            Ugrave: Ugrave,
            ugrave: ugrave,
            uHar: uHar,
            uharl: uharl,
            uharr: uharr,
            uhblk: uhblk,
            ulcorn: ulcorn,
            ulcorner: ulcorner,
            ulcrop: ulcrop,
            ultri: ultri,
            Umacr: Umacr,
            umacr: umacr,
            uml: uml,
            UnderBar: UnderBar,
            UnderBrace: UnderBrace,
            UnderBracket: UnderBracket,
            UnderParenthesis: UnderParenthesis,
            Union: Union,
            UnionPlus: UnionPlus,
            Uogon: Uogon,
            uogon: uogon,
            Uopf: Uopf,
            uopf: uopf,
            UpArrowBar: UpArrowBar,
            uparrow: uparrow,
            UpArrow: UpArrow,
            Uparrow: Uparrow,
            UpArrowDownArrow: UpArrowDownArrow,
            updownarrow: updownarrow,
            UpDownArrow: UpDownArrow,
            Updownarrow: Updownarrow,
            UpEquilibrium: UpEquilibrium,
            upharpoonleft: upharpoonleft,
            upharpoonright: upharpoonright,
            uplus: uplus,
            UpperLeftArrow: UpperLeftArrow,
            UpperRightArrow: UpperRightArrow,
            upsi: upsi,
            Upsi: Upsi,
            upsih: upsih,
            Upsilon: Upsilon,
            upsilon: upsilon,
            UpTeeArrow: UpTeeArrow,
            UpTee: UpTee,
            upuparrows: upuparrows,
            urcorn: urcorn,
            urcorner: urcorner,
            urcrop: urcrop,
            Uring: Uring,
            uring: uring,
            urtri: urtri,
            Uscr: Uscr,
            uscr: uscr,
            utdot: utdot,
            Utilde: Utilde,
            utilde: utilde,
            utri: utri,
            utrif: utrif,
            uuarr: uuarr,
            Uuml: Uuml,
            uuml: uuml,
            uwangle: uwangle,
            vangrt: vangrt,
            varepsilon: varepsilon,
            varkappa: varkappa,
            varnothing: varnothing,
            varphi: varphi,
            varpi: varpi,
            varpropto: varpropto,
            varr: varr,
            vArr: vArr,
            varrho: varrho,
            varsigma: varsigma,
            varsubsetneq: varsubsetneq,
            varsubsetneqq: varsubsetneqq,
            varsupsetneq: varsupsetneq,
            varsupsetneqq: varsupsetneqq,
            vartheta: vartheta,
            vartriangleleft: vartriangleleft,
            vartriangleright: vartriangleright,
            vBar: vBar,
            Vbar: Vbar,
            vBarv: vBarv,
            Vcy: Vcy,
            vcy: vcy,
            vdash: vdash,
            vDash: vDash,
            Vdash: Vdash,
            VDash: VDash,
            Vdashl: Vdashl,
            veebar: veebar,
            vee: vee,
            Vee: Vee,
            veeeq: veeeq,
            vellip: vellip,
            verbar: verbar,
            Verbar: Verbar,
            vert: vert,
            Vert: Vert,
            VerticalBar: VerticalBar,
            VerticalLine: VerticalLine,
            VerticalSeparator: VerticalSeparator,
            VerticalTilde: VerticalTilde,
            VeryThinSpace: VeryThinSpace,
            Vfr: Vfr,
            vfr: vfr,
            vltri: vltri,
            vnsub: vnsub,
            vnsup: vnsup,
            Vopf: Vopf,
            vopf: vopf,
            vprop: vprop,
            vrtri: vrtri,
            Vscr: Vscr,
            vscr: vscr,
            vsubnE: vsubnE,
            vsubne: vsubne,
            vsupnE: vsupnE,
            vsupne: vsupne,
            Vvdash: Vvdash,
            vzigzag: vzigzag,
            Wcirc: Wcirc,
            wcirc: wcirc,
            wedbar: wedbar,
            wedge: wedge,
            Wedge: Wedge,
            wedgeq: wedgeq,
            weierp: weierp,
            Wfr: Wfr,
            wfr: wfr,
            Wopf: Wopf,
            wopf: wopf,
            wp: wp,
            wr: wr,
            wreath: wreath,
            Wscr: Wscr,
            wscr: wscr,
            xcap: xcap,
            xcirc: xcirc,
            xcup: xcup,
            xdtri: xdtri,
            Xfr: Xfr,
            xfr: xfr,
            xharr: xharr,
            xhArr: xhArr,
            Xi: Xi,
            xi: xi,
            xlarr: xlarr,
            xlArr: xlArr,
            xmap: xmap,
            xnis: xnis,
            xodot: xodot,
            Xopf: Xopf,
            xopf: xopf,
            xoplus: xoplus,
            xotime: xotime,
            xrarr: xrarr,
            xrArr: xrArr,
            Xscr: Xscr,
            xscr: xscr,
            xsqcup: xsqcup,
            xuplus: xuplus,
            xutri: xutri,
            xvee: xvee,
            xwedge: xwedge,
            Yacute: Yacute,
            yacute: yacute,
            YAcy: YAcy,
            yacy: yacy,
            Ycirc: Ycirc,
            ycirc: ycirc,
            Ycy: Ycy,
            ycy: ycy,
            yen: yen,
            Yfr: Yfr,
            yfr: yfr,
            YIcy: YIcy,
            yicy: yicy,
            Yopf: Yopf,
            yopf: yopf,
            Yscr: Yscr,
            yscr: yscr,
            YUcy: YUcy,
            yucy: yucy,
            yuml: yuml,
            Yuml: Yuml,
            Zacute: Zacute,
            zacute: zacute,
            Zcaron: Zcaron,
            zcaron: zcaron,
            Zcy: Zcy,
            zcy: zcy,
            Zdot: Zdot,
            zdot: zdot,
            zeetrf: zeetrf,
            ZeroWidthSpace: ZeroWidthSpace,
            Zeta: Zeta,
            zeta: zeta,
            zfr: zfr,
            Zfr: Zfr,
            ZHcy: ZHcy,
            zhcy: zhcy,
            zigrarr: zigrarr,
            zopf: zopf,
            Zopf: Zopf,
            Zscr: Zscr,
            zscr: zscr,
            zwj: zwj,
            zwnj: zwnj,
            'default': entities
});

const require$$0 = getCjsExportFromNamespace(entities$1);

/*eslint quotes:0*/


var entities$2 = require$$0;

var regex = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4E\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/;

var encodeCache = {}; // Create a lookup array where anything but characters in `chars` string
// and alphanumeric chars is percent-encoded.
//

function getEncodeCache(exclude) {
  var i,
      ch,
      cache = encodeCache[exclude];

  if (cache) {
    return cache;
  }

  cache = encodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);

    if (/^[0-9a-z]$/i.test(ch)) {
      // always allow unencoded alphanumeric characters
      cache.push(ch);
    } else {
      cache.push('%' + ('0' + i.toString(16).toUpperCase()).slice(-2));
    }
  }

  for (i = 0; i < exclude.length; i++) {
    cache[exclude.charCodeAt(i)] = exclude[i];
  }

  return cache;
} // Encode unsafe characters with percent-encoding, skipping already
// encoded sequences.
//
//  - string       - string to encode
//  - exclude      - list of characters to ignore (in addition to a-zA-Z0-9)
//  - keepEscaped  - don't encode '%' in a correct escape sequence (default: true)
//


function encode(string, exclude, keepEscaped) {
  var i,
      l,
      code,
      nextCode,
      cache,
      result = '';

  if (typeof exclude !== 'string') {
    // encode(string, keepEscaped)
    keepEscaped = exclude;
    exclude = encode.defaultChars;
  }

  if (typeof keepEscaped === 'undefined') {
    keepEscaped = true;
  }

  cache = getEncodeCache(exclude);

  for (i = 0, l = string.length; i < l; i++) {
    code = string.charCodeAt(i);

    if (keepEscaped && code === 0x25
    /* % */
    && i + 2 < l) {
      if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
        result += string.slice(i, i + 3);
        i += 2;
        continue;
      }
    }

    if (code < 128) {
      result += cache[code];
      continue;
    }

    if (code >= 0xD800 && code <= 0xDFFF) {
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < l) {
        nextCode = string.charCodeAt(i + 1);

        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          result += encodeURIComponent(string[i] + string[i + 1]);
          i++;
          continue;
        }
      }

      result += '%EF%BF%BD';
      continue;
    }

    result += encodeURIComponent(string[i]);
  }

  return result;
}

encode.defaultChars = ";/?:@&=+$,-_.!~*'()#";
encode.componentChars = "-_.!~*'()";
var encode_1 = encode;

/* eslint-disable no-bitwise */

var decodeCache = {};

function getDecodeCache(exclude) {
  var i,
      ch,
      cache = decodeCache[exclude];

  if (cache) {
    return cache;
  }

  cache = decodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);
    cache.push(ch);
  }

  for (i = 0; i < exclude.length; i++) {
    ch = exclude.charCodeAt(i);
    cache[ch] = '%' + ('0' + ch.toString(16).toUpperCase()).slice(-2);
  }

  return cache;
} // Decode percent-encoded string.
//


function decode(string, exclude) {
  var cache;

  if (typeof exclude !== 'string') {
    exclude = decode.defaultChars;
  }

  cache = getDecodeCache(exclude);
  return string.replace(/(%[a-f0-9]{2})+/gi, function (seq) {
    var i,
        l,
        b1,
        b2,
        b3,
        b4,
        chr,
        result = '';

    for (i = 0, l = seq.length; i < l; i += 3) {
      b1 = parseInt(seq.slice(i + 1, i + 3), 16);

      if (b1 < 0x80) {
        result += cache[b1];
        continue;
      }

      if ((b1 & 0xE0) === 0xC0 && i + 3 < l) {
        // 110xxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);

        if ((b2 & 0xC0) === 0x80) {
          chr = b1 << 6 & 0x7C0 | b2 & 0x3F;

          if (chr < 0x80) {
            result += '\ufffd\ufffd';
          } else {
            result += String.fromCharCode(chr);
          }

          i += 3;
          continue;
        }
      }

      if ((b1 & 0xF0) === 0xE0 && i + 6 < l) {
        // 1110xxxx 10xxxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        b3 = parseInt(seq.slice(i + 7, i + 9), 16);

        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
          chr = b1 << 12 & 0xF000 | b2 << 6 & 0xFC0 | b3 & 0x3F;

          if (chr < 0x800 || chr >= 0xD800 && chr <= 0xDFFF) {
            result += '\ufffd\ufffd\ufffd';
          } else {
            result += String.fromCharCode(chr);
          }

          i += 6;
          continue;
        }
      }

      if ((b1 & 0xF8) === 0xF0 && i + 9 < l) {
        // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        b3 = parseInt(seq.slice(i + 7, i + 9), 16);
        b4 = parseInt(seq.slice(i + 10, i + 12), 16);

        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80 && (b4 & 0xC0) === 0x80) {
          chr = b1 << 18 & 0x1C0000 | b2 << 12 & 0x3F000 | b3 << 6 & 0xFC0 | b4 & 0x3F;

          if (chr < 0x10000 || chr > 0x10FFFF) {
            result += '\ufffd\ufffd\ufffd\ufffd';
          } else {
            chr -= 0x10000;
            result += String.fromCharCode(0xD800 + (chr >> 10), 0xDC00 + (chr & 0x3FF));
          }

          i += 9;
          continue;
        }
      }

      result += '\ufffd';
    }

    return result;
  });
}

decode.defaultChars = ';/?:@&=+$,#';
decode.componentChars = '';
var decode_1 = decode;

var format = function format(url) {
  var result = '';
  result += url.protocol || '';
  result += url.slashes ? '//' : '';
  result += url.auth ? url.auth + '@' : '';

  if (url.hostname && url.hostname.indexOf(':') !== -1) {
    // ipv6 address
    result += '[' + url.hostname + ']';
  } else {
    result += url.hostname || '';
  }

  result += url.port ? ':' + url.port : '';
  result += url.pathname || '';
  result += url.search || '';
  result += url.hash || '';
  return result;
};

// Copyright Joyent, Inc. and other Node contributors.
// Changes from joyent/node:
//
// 1. No leading slash in paths,
//    e.g. in `url.parse('http://foo?bar')` pathname is ``, not `/`
//
// 2. Backslashes are not replaced with slashes,
//    so `http:\\example.org\` is treated like a relative path
//
// 3. Trailing colon is treated like a part of the path,
//    i.e. in `http://example.org:foo` pathname is `:foo`
//
// 4. Nothing is URL-encoded in the resulting object,
//    (in joyent/node some chars in auth and paths are encoded)
//
// 5. `url.parse()` does not have `parseQueryString` argument
//
// 6. Removed extraneous result properties: `host`, `path`, `query`, etc.,
//    which can be constructed using other parts of the url.
//

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.pathname = null;
} // Reference: RFC 3986, RFC 1808, RFC 2396
// define these here so at least they only have to be
// compiled once on the first module load.


var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,
    // Special case for a simple path URL
simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
    // RFC 2396: characters reserved for delimiting URLs.
// We actually just auto-escape these.
delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
    // RFC 2396: characters not allowed for various reasons.
unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),
    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
// Note that any invalid chars are also handled, but these
// are the ones that are *expected* to be seen, so we fast-path
// them.
nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.

/* eslint-disable no-script-url */
// protocols that never have a hostname.
hostlessProtocol = {
  'javascript': true,
  'javascript:': true
},
    // protocols that always contain a // bit.
slashedProtocol = {
  'http': true,
  'https': true,
  'ftp': true,
  'gopher': true,
  'file': true,
  'http:': true,
  'https:': true,
  'ftp:': true,
  'gopher:': true,
  'file:': true
};
/* eslint-enable no-script-url */

function urlParse(url, slashesDenoteHost) {
  if (url && url instanceof Url) {
    return url;
  }

  var u = new Url();
  u.parse(url, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function (url, slashesDenoteHost) {
  var i,
      l,
      lowerProto,
      hec,
      slashes,
      rest = url; // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"

  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);

    if (simplePath) {
      this.pathname = simplePath[1];

      if (simplePath[2]) {
        this.search = simplePath[2];
      }

      return this;
    }
  }

  var proto = protocolPattern.exec(rest);

  if (proto) {
    proto = proto[0];
    lowerProto = proto.toLowerCase();
    this.protocol = proto;
    rest = rest.substr(proto.length);
  } // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.


  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    slashes = rest.substr(0, 2) === '//';

    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c
    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.
    // find the first instance of any hostEndingChars
    var hostEnd = -1;

    for (i = 0; i < hostEndingChars.length; i++) {
      hec = rest.indexOf(hostEndingChars[i]);

      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    } // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.


    var auth, atSign;

    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    } // Now we have a portion which is definitely the auth.
    // Pull that off.


    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = auth;
    } // the host is the remaining to the left of the first non-host char


    hostEnd = -1;

    for (i = 0; i < nonHostChars.length; i++) {
      hec = rest.indexOf(nonHostChars[i]);

      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    } // if we still have not hit it, then the entire thing is a host.


    if (hostEnd === -1) {
      hostEnd = rest.length;
    }

    if (rest[hostEnd - 1] === ':') {
      hostEnd--;
    }

    var host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd); // pull out port.

    this.parseHost(host); // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.

    this.hostname = this.hostname || ''; // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.

    var ipv6Hostname = this.hostname[0] === '[' && this.hostname[this.hostname.length - 1] === ']'; // validate a little.

    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);

      for (i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];

        if (!part) {
          continue;
        }

        if (!part.match(hostnamePartPattern)) {
          var newpart = '';

          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          } // we test again with ASCII char only


          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);

            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }

            if (notHost.length) {
              rest = notHost.join('.') + rest;
            }

            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } // strip [ and ] from the hostname
    // the host field still retains them, though


    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
    }
  } // chop off from the tail first.


  var hash = rest.indexOf('#');

  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }

  var qm = rest.indexOf('?');

  if (qm !== -1) {
    this.search = rest.substr(qm);
    rest = rest.slice(0, qm);
  }

  if (rest) {
    this.pathname = rest;
  }

  if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
    this.pathname = '';
  }

  return this;
};

Url.prototype.parseHost = function (host) {
  var port = portPattern.exec(host);

  if (port) {
    port = port[0];

    if (port !== ':') {
      this.port = port.substr(1);
    }

    host = host.substr(0, host.length - port.length);
  }

  if (host) {
    this.hostname = host;
  }
};

var parse = urlParse;

var encode$1 = encode_1;
var decode$1 = decode_1;
var format$1 = format;
var parse$1 = parse;
var mdurl = {
  encode: encode$1,
  decode: decode$1,
  format: format$1,
  parse: parse$1
};

var regex$1 = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;

var regex$2 = /[\0-\x1F\x7F-\x9F]/;

var regex$3 = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;

var regex$4 = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;

var Any = regex$1;
var Cc = regex$2;
var Cf = regex$3;
var P = regex;
var Z = regex$4;
var uc_micro = {
  Any: Any,
  Cc: Cc,
  Cf: Cf,
  P: P,
  Z: Z
};

var utils = createCommonjsModule(function (module, exports) {

  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }

  function isString(obj) {
    return _class(obj) === '[object String]';
  }

  var _hasOwnProperty = Object.prototype.hasOwnProperty;

  function has(object, key) {
    return _hasOwnProperty.call(object, key);
  } // Merge objects
  //


  function assign(obj
  /*from1, from2, from3, ...*/
  ) {
    var sources = Array.prototype.slice.call(arguments, 1);
    sources.forEach(function (source) {
      if (!source) {
        return;
      }

      if (typeof source !== 'object') {
        throw new TypeError(source + 'must be object');
      }

      Object.keys(source).forEach(function (key) {
        obj[key] = source[key];
      });
    });
    return obj;
  } // Remove element from array and put another array at those position.
  // Useful for some operations with tokens


  function arrayReplaceAt(src, pos, newElements) {
    return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
  } ////////////////////////////////////////////////////////////////////////////////


  function isValidEntityCode(c) {
    /*eslint no-bitwise:0*/
    // broken sequence
    if (c >= 0xD800 && c <= 0xDFFF) {
      return false;
    } // never used


    if (c >= 0xFDD0 && c <= 0xFDEF) {
      return false;
    }

    if ((c & 0xFFFF) === 0xFFFF || (c & 0xFFFF) === 0xFFFE) {
      return false;
    } // control codes


    if (c >= 0x00 && c <= 0x08) {
      return false;
    }

    if (c === 0x0B) {
      return false;
    }

    if (c >= 0x0E && c <= 0x1F) {
      return false;
    }

    if (c >= 0x7F && c <= 0x9F) {
      return false;
    } // out of range


    if (c > 0x10FFFF) {
      return false;
    }

    return true;
  }

  function fromCodePoint(c) {
    /*eslint no-bitwise:0*/
    if (c > 0xffff) {
      c -= 0x10000;
      var surrogate1 = 0xd800 + (c >> 10),
          surrogate2 = 0xdc00 + (c & 0x3ff);
      return String.fromCharCode(surrogate1, surrogate2);
    }

    return String.fromCharCode(c);
  }

  var UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])/g;
  var ENTITY_RE = /&([a-z#][a-z0-9]{1,31});/gi;
  var UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + '|' + ENTITY_RE.source, 'gi');
  var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))/i;

  function replaceEntityPattern(match, name) {
    var code = 0;

    if (has(entities$2, name)) {
      return entities$2[name];
    }

    if (name.charCodeAt(0) === 0x23
    /* # */
    && DIGITAL_ENTITY_TEST_RE.test(name)) {
      code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);

      if (isValidEntityCode(code)) {
        return fromCodePoint(code);
      }
    }

    return match;
  }
  /*function replaceEntities(str) {
    if (str.indexOf('&') < 0) { return str; }
  
    return str.replace(ENTITY_RE, replaceEntityPattern);
  }*/


  function unescapeMd(str) {
    if (str.indexOf('\\') < 0) {
      return str;
    }

    return str.replace(UNESCAPE_MD_RE, '$1');
  }

  function unescapeAll(str) {
    if (str.indexOf('\\') < 0 && str.indexOf('&') < 0) {
      return str;
    }

    return str.replace(UNESCAPE_ALL_RE, function (match, escaped, entity) {
      if (escaped) {
        return escaped;
      }

      return replaceEntityPattern(match, entity);
    });
  } ////////////////////////////////////////////////////////////////////////////////


  var HTML_ESCAPE_TEST_RE = /[&<>"]/;
  var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
  var HTML_REPLACEMENTS = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };

  function replaceUnsafeChar(ch) {
    return HTML_REPLACEMENTS[ch];
  }

  function escapeHtml(str) {
    if (HTML_ESCAPE_TEST_RE.test(str)) {
      return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
    }

    return str;
  } ////////////////////////////////////////////////////////////////////////////////


  var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;

  function escapeRE(str) {
    return str.replace(REGEXP_ESCAPE_RE, '\\$&');
  } ////////////////////////////////////////////////////////////////////////////////


  function isSpace(code) {
    switch (code) {
      case 0x09:
      case 0x20:
        return true;
    }

    return false;
  } // Zs (unicode class) || [\t\f\v\r\n]


  function isWhiteSpace(code) {
    if (code >= 0x2000 && code <= 0x200A) {
      return true;
    }

    switch (code) {
      case 0x09: // \t

      case 0x0A: // \n

      case 0x0B: // \v

      case 0x0C: // \f

      case 0x0D: // \r

      case 0x20:
      case 0xA0:
      case 0x1680:
      case 0x202F:
      case 0x205F:
      case 0x3000:
        return true;
    }

    return false;
  } ////////////////////////////////////////////////////////////////////////////////

  /*eslint-disable max-len*/
  // Currently without astral characters support.


  function isPunctChar(ch) {
    return regex.test(ch);
  } // Markdown ASCII punctuation characters.
  //
  // !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~
  // http://spec.commonmark.org/0.15/#ascii-punctuation-character
  //
  // Don't confuse with unicode punctuation !!! It lacks some chars in ascii range.
  //


  function isMdAsciiPunct(ch) {
    switch (ch) {
      case 0x21
      /* ! */
      :
      case 0x22
      /* " */
      :
      case 0x23
      /* # */
      :
      case 0x24
      /* $ */
      :
      case 0x25
      /* % */
      :
      case 0x26
      /* & */
      :
      case 0x27
      /* ' */
      :
      case 0x28
      /* ( */
      :
      case 0x29
      /* ) */
      :
      case 0x2A
      /* * */
      :
      case 0x2B
      /* + */
      :
      case 0x2C
      /* , */
      :
      case 0x2D
      /* - */
      :
      case 0x2E
      /* . */
      :
      case 0x2F
      /* / */
      :
      case 0x3A
      /* : */
      :
      case 0x3B
      /* ; */
      :
      case 0x3C
      /* < */
      :
      case 0x3D
      /* = */
      :
      case 0x3E
      /* > */
      :
      case 0x3F
      /* ? */
      :
      case 0x40
      /* @ */
      :
      case 0x5B
      /* [ */
      :
      case 0x5C
      /* \ */
      :
      case 0x5D
      /* ] */
      :
      case 0x5E
      /* ^ */
      :
      case 0x5F
      /* _ */
      :
      case 0x60
      /* ` */
      :
      case 0x7B
      /* { */
      :
      case 0x7C
      /* | */
      :
      case 0x7D
      /* } */
      :
      case 0x7E
      /* ~ */
      :
        return true;

      default:
        return false;
    }
  } // Hepler to unify [reference labels].
  //


  function normalizeReference(str) {
    // Trim and collapse whitespace
    //
    str = str.trim().replace(/\s+/g, ' '); // In node v10 'ẞ'.toLowerCase() === 'Ṿ', which is presumed to be a bug
    // fixed in v12 (couldn't find any details).
    //
    // So treat this one as a special case
    // (remove this when node v10 is no longer supported).
    //

    if ('ẞ'.toLowerCase() === 'Ṿ') {
      str = str.replace(/ẞ/g, 'ß');
    } // .toLowerCase().toUpperCase() should get rid of all differences
    // between letter variants.
    //
    // Simple .toLowerCase() doesn't normalize 125 code points correctly,
    // and .toUpperCase doesn't normalize 6 of them (list of exceptions:
    // İ, ϴ, ẞ, Ω, K, Å - those are already uppercased, but have differently
    // uppercased versions).
    //
    // Here's an example showing how it happens. Lets take greek letter omega:
    // uppercase U+0398 (Θ), U+03f4 (ϴ) and lowercase U+03b8 (θ), U+03d1 (ϑ)
    //
    // Unicode entries:
    // 0398;GREEK CAPITAL LETTER THETA;Lu;0;L;;;;;N;;;;03B8;
    // 03B8;GREEK SMALL LETTER THETA;Ll;0;L;;;;;N;;;0398;;0398
    // 03D1;GREEK THETA SYMBOL;Ll;0;L;<compat> 03B8;;;;N;GREEK SMALL LETTER SCRIPT THETA;;0398;;0398
    // 03F4;GREEK CAPITAL THETA SYMBOL;Lu;0;L;<compat> 0398;;;;N;;;;03B8;
    //
    // Case-insensitive comparison should treat all of them as equivalent.
    //
    // But .toLowerCase() doesn't change ϑ (it's already lowercase),
    // and .toUpperCase() doesn't change ϴ (already uppercase).
    //
    // Applying first lower then upper case normalizes any character:
    // '\u0398\u03f4\u03b8\u03d1'.toLowerCase().toUpperCase() === '\u0398\u0398\u0398\u0398'
    //
    // Note: this is equivalent to unicode case folding; unicode normalization
    // is a different step that is not required here.
    //
    // Final result should be uppercased, because it's later stored in an object
    // (this avoid a conflict with Object.prototype members,
    // most notably, `__proto__`)
    //


    return str.toLowerCase().toUpperCase();
  } ////////////////////////////////////////////////////////////////////////////////
  // Re-export libraries commonly used in both markdown-it and its plugins,
  // so plugins won't have to depend on them explicitly, which reduces their
  // bundled size (e.g. a browser build).
  //


  exports.lib = {};
  exports.lib.mdurl = mdurl;
  exports.lib.ucmicro = uc_micro;
  exports.assign = assign;
  exports.isString = isString;
  exports.has = has;
  exports.unescapeMd = unescapeMd;
  exports.unescapeAll = unescapeAll;
  exports.isValidEntityCode = isValidEntityCode;
  exports.fromCodePoint = fromCodePoint; // exports.replaceEntities     = replaceEntities;

  exports.escapeHtml = escapeHtml;
  exports.arrayReplaceAt = arrayReplaceAt;
  exports.isSpace = isSpace;
  exports.isWhiteSpace = isWhiteSpace;
  exports.isMdAsciiPunct = isMdAsciiPunct;
  exports.isPunctChar = isPunctChar;
  exports.escapeRE = escapeRE;
  exports.normalizeReference = normalizeReference;
});
var utils_1 = utils.lib;
var utils_2 = utils.assign;
var utils_3 = utils.isString;
var utils_4 = utils.has;
var utils_5 = utils.unescapeMd;
var utils_6 = utils.unescapeAll;
var utils_7 = utils.isValidEntityCode;
var utils_8 = utils.fromCodePoint;
var utils_9 = utils.escapeHtml;
var utils_10 = utils.arrayReplaceAt;
var utils_11 = utils.isSpace;
var utils_12 = utils.isWhiteSpace;
var utils_13 = utils.isMdAsciiPunct;
var utils_14 = utils.isPunctChar;
var utils_15 = utils.escapeRE;
var utils_16 = utils.normalizeReference;

// Parse link label

var parse_link_label = function parseLinkLabel(state, start, disableNested) {
  var level,
      found,
      marker,
      prevPos,
      labelEnd = -1,
      max = state.posMax,
      oldPos = state.pos;
  state.pos = start + 1;
  level = 1;

  while (state.pos < max) {
    marker = state.src.charCodeAt(state.pos);

    if (marker === 0x5D
    /* ] */
    ) {
        level--;

        if (level === 0) {
          found = true;
          break;
        }
      }

    prevPos = state.pos;
    state.md.inline.skipToken(state);

    if (marker === 0x5B
    /* [ */
    ) {
        if (prevPos === state.pos - 1) {
          // increase level if we find text `[`, which is not a part of any token
          level++;
        } else if (disableNested) {
          state.pos = oldPos;
          return -1;
        }
      }
  }

  if (found) {
    labelEnd = state.pos;
  } // restore old state


  state.pos = oldPos;
  return labelEnd;
};

var unescapeAll = utils.unescapeAll;

var parse_link_destination = function parseLinkDestination(str, pos, max) {
  var code,
      level,
      lines = 0,
      start = pos,
      result = {
    ok: false,
    pos: 0,
    lines: 0,
    str: ''
  };

  if (str.charCodeAt(pos) === 0x3C
  /* < */
  ) {
      pos++;

      while (pos < max) {
        code = str.charCodeAt(pos);

        if (code === 0x0A
        /* \n */
        ) {
            return result;
          }

        if (code === 0x3E
        /* > */
        ) {
            result.pos = pos + 1;
            result.str = unescapeAll(str.slice(start + 1, pos));
            result.ok = true;
            return result;
          }

        if (code === 0x5C
        /* \ */
        && pos + 1 < max) {
          pos += 2;
          continue;
        }

        pos++;
      } // no closing '>'


      return result;
    } // this should be ... } else { ... branch


  level = 0;

  while (pos < max) {
    code = str.charCodeAt(pos);

    if (code === 0x20) {
      break;
    } // ascii control characters


    if (code < 0x20 || code === 0x7F) {
      break;
    }

    if (code === 0x5C
    /* \ */
    && pos + 1 < max) {
      pos += 2;
      continue;
    }

    if (code === 0x28
    /* ( */
    ) {
        level++;
      }

    if (code === 0x29
    /* ) */
    ) {
        if (level === 0) {
          break;
        }

        level--;
      }

    pos++;
  }

  if (start === pos) {
    return result;
  }

  if (level !== 0) {
    return result;
  }

  result.str = unescapeAll(str.slice(start, pos));
  result.lines = lines;
  result.pos = pos;
  result.ok = true;
  return result;
};

var unescapeAll$1 = utils.unescapeAll;

var parse_link_title = function parseLinkTitle(str, pos, max) {
  var code,
      marker,
      lines = 0,
      start = pos,
      result = {
    ok: false,
    pos: 0,
    lines: 0,
    str: ''
  };

  if (pos >= max) {
    return result;
  }

  marker = str.charCodeAt(pos);

  if (marker !== 0x22
  /* " */
  && marker !== 0x27
  /* ' */
  && marker !== 0x28
  /* ( */
  ) {
      return result;
    }

  pos++; // if opening marker is "(", switch it to closing marker ")"

  if (marker === 0x28) {
    marker = 0x29;
  }

  while (pos < max) {
    code = str.charCodeAt(pos);

    if (code === marker) {
      result.pos = pos + 1;
      result.lines = lines;
      result.str = unescapeAll$1(str.slice(start + 1, pos));
      result.ok = true;
      return result;
    } else if (code === 0x0A) {
      lines++;
    } else if (code === 0x5C
    /* \ */
    && pos + 1 < max) {
      pos++;

      if (str.charCodeAt(pos) === 0x0A) {
        lines++;
      }
    }

    pos++;
  }

  return result;
};

var parseLinkLabel = parse_link_label;
var parseLinkDestination = parse_link_destination;
var parseLinkTitle = parse_link_title;
var helpers = {
  parseLinkLabel: parseLinkLabel,
  parseLinkDestination: parseLinkDestination,
  parseLinkTitle: parseLinkTitle
};

var assign = utils.assign;
var unescapeAll$2 = utils.unescapeAll;
var escapeHtml = utils.escapeHtml; ////////////////////////////////////////////////////////////////////////////////

var default_rules = {};

default_rules.code_inline = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];
  return '<code' + slf.renderAttrs(token) + '>' + escapeHtml(tokens[idx].content) + '</code>';
};

default_rules.code_block = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];
  return '<pre' + slf.renderAttrs(token) + '><code>' + escapeHtml(tokens[idx].content) + '</code></pre>\n';
};

default_rules.fence = function (tokens, idx, options, env, slf) {
  var token = tokens[idx],
      info = token.info ? unescapeAll$2(token.info).trim() : '',
      langName = '',
      highlighted,
      i,
      tmpAttrs,
      tmpToken;

  if (info) {
    langName = info.split(/\s+/g)[0];
  }

  if (options.highlight) {
    highlighted = options.highlight(token.content, langName) || escapeHtml(token.content);
  } else {
    highlighted = escapeHtml(token.content);
  }

  if (highlighted.indexOf('<pre') === 0) {
    return highlighted + '\n';
  } // If language exists, inject class gently, without modifying original token.
  // May be, one day we will add .clone() for token and simplify this part, but
  // now we prefer to keep things local.


  if (info) {
    i = token.attrIndex('class');
    tmpAttrs = token.attrs ? token.attrs.slice() : [];

    if (i < 0) {
      tmpAttrs.push(['class', options.langPrefix + langName]);
    } else {
      tmpAttrs[i][1] += ' ' + options.langPrefix + langName;
    } // Fake token just to render attributes


    tmpToken = {
      attrs: tmpAttrs
    };
    return '<pre><code' + slf.renderAttrs(tmpToken) + '>' + highlighted + '</code></pre>\n';
  }

  return '<pre><code' + slf.renderAttrs(token) + '>' + highlighted + '</code></pre>\n';
};

default_rules.image = function (tokens, idx, options, env, slf) {
  var token = tokens[idx]; // "alt" attr MUST be set, even if empty. Because it's mandatory and
  // should be placed on proper position for tests.
  //
  // Replace content with actual value

  token.attrs[token.attrIndex('alt')][1] = slf.renderInlineAsText(token.children, options, env);
  return slf.renderToken(tokens, idx, options);
};

default_rules.hardbreak = function (tokens, idx, options
/*, env */
) {
  return options.xhtmlOut ? '<br />\n' : '<br>\n';
};

default_rules.softbreak = function (tokens, idx, options
/*, env */
) {
  return options.breaks ? options.xhtmlOut ? '<br />\n' : '<br>\n' : '\n';
};

default_rules.text = function (tokens, idx
/*, options, env */
) {
  return escapeHtml(tokens[idx].content);
};

default_rules.html_block = function (tokens, idx
/*, options, env */
) {
  return tokens[idx].content;
};

default_rules.html_inline = function (tokens, idx
/*, options, env */
) {
  return tokens[idx].content;
};
/**
 * new Renderer()
 *
 * Creates new [[Renderer]] instance and fill [[Renderer#rules]] with defaults.
 **/


function Renderer() {
  /**
   * Renderer#rules -> Object
   *
   * Contains render rules for tokens. Can be updated and extended.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.renderer.rules.strong_open  = function () { return '<b>'; };
   * md.renderer.rules.strong_close = function () { return '</b>'; };
   *
   * var result = md.renderInline(...);
   * ```
   *
   * Each rule is called as independent static function with fixed signature:
   *
   * ```javascript
   * function my_token_render(tokens, idx, options, env, renderer) {
   *   // ...
   *   return renderedHTML;
   * }
   * ```
   *
   * See [source code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js)
   * for more details and examples.
   **/
  this.rules = assign({}, default_rules);
}
/**
 * Renderer.renderAttrs(token) -> String
 *
 * Render token attributes to string.
 **/


Renderer.prototype.renderAttrs = function renderAttrs(token) {
  var i, l, result;

  if (!token.attrs) {
    return '';
  }

  result = '';

  for (i = 0, l = token.attrs.length; i < l; i++) {
    result += ' ' + escapeHtml(token.attrs[i][0]) + '="' + escapeHtml(token.attrs[i][1]) + '"';
  }

  return result;
};
/**
 * Renderer.renderToken(tokens, idx, options) -> String
 * - tokens (Array): list of tokens
 * - idx (Numbed): token index to render
 * - options (Object): params of parser instance
 *
 * Default token renderer. Can be overriden by custom function
 * in [[Renderer#rules]].
 **/


Renderer.prototype.renderToken = function renderToken(tokens, idx, options) {
  var nextToken,
      result = '',
      needLf = false,
      token = tokens[idx]; // Tight list paragraphs

  if (token.hidden) {
    return '';
  } // Insert a newline between hidden paragraph and subsequent opening
  // block-level tag.
  //
  // For example, here we should insert a newline before blockquote:
  //  - a
  //    >
  //


  if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
    result += '\n';
  } // Add token name, e.g. `<img`


  result += (token.nesting === -1 ? '</' : '<') + token.tag; // Encode attributes, e.g. `<img src="foo"`

  result += this.renderAttrs(token); // Add a slash for self-closing tags, e.g. `<img src="foo" /`

  if (token.nesting === 0 && options.xhtmlOut) {
    result += ' /';
  } // Check if we need to add a newline after this tag


  if (token.block) {
    needLf = true;

    if (token.nesting === 1) {
      if (idx + 1 < tokens.length) {
        nextToken = tokens[idx + 1];

        if (nextToken.type === 'inline' || nextToken.hidden) {
          // Block-level tag containing an inline tag.
          //
          needLf = false;
        } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
          // Opening tag + closing tag of the same type. E.g. `<li></li>`.
          //
          needLf = false;
        }
      }
    }
  }

  result += needLf ? '>\n' : '>';
  return result;
};
/**
 * Renderer.renderInline(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to renter
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * The same as [[Renderer.render]], but for single token of `inline` type.
 **/


Renderer.prototype.renderInline = function (tokens, options, env) {
  var type,
      result = '',
      rules = this.rules;

  for (var i = 0, len = tokens.length; i < len; i++) {
    type = tokens[i].type;

    if (typeof rules[type] !== 'undefined') {
      result += rules[type](tokens, i, options, env, this);
    } else {
      result += this.renderToken(tokens, i, options);
    }
  }

  return result;
};
/** internal
 * Renderer.renderInlineAsText(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to renter
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * Special kludge for image `alt` attributes to conform CommonMark spec.
 * Don't try to use it! Spec requires to show `alt` content with stripped markup,
 * instead of simple escaping.
 **/


Renderer.prototype.renderInlineAsText = function (tokens, options, env) {
  var result = '';

  for (var i = 0, len = tokens.length; i < len; i++) {
    if (tokens[i].type === 'text') {
      result += tokens[i].content;
    } else if (tokens[i].type === 'image') {
      result += this.renderInlineAsText(tokens[i].children, options, env);
    }
  }

  return result;
};
/**
 * Renderer.render(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to renter
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * Takes token stream and generates HTML. Probably, you will never need to call
 * this method directly.
 **/


Renderer.prototype.render = function (tokens, options, env) {
  var i,
      len,
      type,
      result = '',
      rules = this.rules;

  for (i = 0, len = tokens.length; i < len; i++) {
    type = tokens[i].type;

    if (type === 'inline') {
      result += this.renderInline(tokens[i].children, options, env);
    } else if (typeof rules[type] !== 'undefined') {
      result += rules[tokens[i].type](tokens, i, options, env, this);
    } else {
      result += this.renderToken(tokens, i, options, env);
    }
  }

  return result;
};

var renderer = Renderer;

/**
 * class Ruler
 *
 * Helper class, used by [[MarkdownIt#core]], [[MarkdownIt#block]] and
 * [[MarkdownIt#inline]] to manage sequences of functions (rules):
 *
 * - keep rules in defined order
 * - assign the name to each rule
 * - enable/disable rules
 * - add/replace rules
 * - allow assign rules to additional named chains (in the same)
 * - cacheing lists of active rules
 *
 * You will not need use this class directly until write plugins. For simple
 * rules control use [[MarkdownIt.disable]], [[MarkdownIt.enable]] and
 * [[MarkdownIt.use]].
 **/
/**
 * new Ruler()
 **/

function Ruler() {
  // List of added rules. Each element is:
  //
  // {
  //   name: XXX,
  //   enabled: Boolean,
  //   fn: Function(),
  //   alt: [ name2, name3 ]
  // }
  //
  this.__rules__ = []; // Cached rule chains.
  //
  // First level - chain name, '' for default.
  // Second level - diginal anchor for fast filtering by charcodes.
  //

  this.__cache__ = null;
} ////////////////////////////////////////////////////////////////////////////////
// Helper methods, should not be used directly
// Find rule index by name
//


Ruler.prototype.__find__ = function (name) {
  for (var i = 0; i < this.__rules__.length; i++) {
    if (this.__rules__[i].name === name) {
      return i;
    }
  }

  return -1;
}; // Build rules lookup cache
//


Ruler.prototype.__compile__ = function () {
  var self = this;
  var chains = ['']; // collect unique names

  self.__rules__.forEach(function (rule) {
    if (!rule.enabled) {
      return;
    }

    rule.alt.forEach(function (altName) {
      if (chains.indexOf(altName) < 0) {
        chains.push(altName);
      }
    });
  });

  self.__cache__ = {};
  chains.forEach(function (chain) {
    self.__cache__[chain] = [];

    self.__rules__.forEach(function (rule) {
      if (!rule.enabled) {
        return;
      }

      if (chain && rule.alt.indexOf(chain) < 0) {
        return;
      }

      self.__cache__[chain].push(rule.fn);
    });
  });
};
/**
 * Ruler.at(name, fn [, options])
 * - name (String): rule name to replace.
 * - fn (Function): new rule function.
 * - options (Object): new rule options (not mandatory).
 *
 * Replace rule by name with new function & options. Throws error if name not
 * found.
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * Replace existing typographer replacement rule with new one:
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.core.ruler.at('replacements', function replace(state) {
 *   //...
 * });
 * ```
 **/


Ruler.prototype.at = function (name, fn, options) {
  var index = this.__find__(name);

  var opt = options || {};

  if (index === -1) {
    throw new Error('Parser rule not found: ' + name);
  }

  this.__rules__[index].fn = fn;
  this.__rules__[index].alt = opt.alt || [];
  this.__cache__ = null;
};
/**
 * Ruler.before(beforeName, ruleName, fn [, options])
 * - beforeName (String): new rule will be added before this one.
 * - ruleName (String): name of added rule.
 * - fn (Function): rule function.
 * - options (Object): rule options (not mandatory).
 *
 * Add new rule to chain before one with given name. See also
 * [[Ruler.after]], [[Ruler.push]].
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
 *   //...
 * });
 * ```
 **/


Ruler.prototype.before = function (beforeName, ruleName, fn, options) {
  var index = this.__find__(beforeName);

  var opt = options || {};

  if (index === -1) {
    throw new Error('Parser rule not found: ' + beforeName);
  }

  this.__rules__.splice(index, 0, {
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};
/**
 * Ruler.after(afterName, ruleName, fn [, options])
 * - afterName (String): new rule will be added after this one.
 * - ruleName (String): name of added rule.
 * - fn (Function): rule function.
 * - options (Object): rule options (not mandatory).
 *
 * Add new rule to chain after one with given name. See also
 * [[Ruler.before]], [[Ruler.push]].
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.inline.ruler.after('text', 'my_rule', function replace(state) {
 *   //...
 * });
 * ```
 **/


Ruler.prototype.after = function (afterName, ruleName, fn, options) {
  var index = this.__find__(afterName);

  var opt = options || {};

  if (index === -1) {
    throw new Error('Parser rule not found: ' + afterName);
  }

  this.__rules__.splice(index + 1, 0, {
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};
/**
 * Ruler.push(ruleName, fn [, options])
 * - ruleName (String): name of added rule.
 * - fn (Function): rule function.
 * - options (Object): rule options (not mandatory).
 *
 * Push new rule to the end of chain. See also
 * [[Ruler.before]], [[Ruler.after]].
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.core.ruler.push('my_rule', function replace(state) {
 *   //...
 * });
 * ```
 **/


Ruler.prototype.push = function (ruleName, fn, options) {
  var opt = options || {};

  this.__rules__.push({
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};
/**
 * Ruler.enable(list [, ignoreInvalid]) -> Array
 * - list (String|Array): list of rule names to enable.
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Enable rules with given names. If any rule name not found - throw Error.
 * Errors can be disabled by second param.
 *
 * Returns list of found rule names (if no exception happened).
 *
 * See also [[Ruler.disable]], [[Ruler.enableOnly]].
 **/


Ruler.prototype.enable = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) {
    list = [list];
  }

  var result = []; // Search by name and enable

  list.forEach(function (name) {
    var idx = this.__find__(name);

    if (idx < 0) {
      if (ignoreInvalid) {
        return;
      }

      throw new Error('Rules manager: invalid rule name ' + name);
    }

    this.__rules__[idx].enabled = true;
    result.push(name);
  }, this);
  this.__cache__ = null;
  return result;
};
/**
 * Ruler.enableOnly(list [, ignoreInvalid])
 * - list (String|Array): list of rule names to enable (whitelist).
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Enable rules with given names, and disable everything else. If any rule name
 * not found - throw Error. Errors can be disabled by second param.
 *
 * See also [[Ruler.disable]], [[Ruler.enable]].
 **/


Ruler.prototype.enableOnly = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) {
    list = [list];
  }

  this.__rules__.forEach(function (rule) {
    rule.enabled = false;
  });

  this.enable(list, ignoreInvalid);
};
/**
 * Ruler.disable(list [, ignoreInvalid]) -> Array
 * - list (String|Array): list of rule names to disable.
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Disable rules with given names. If any rule name not found - throw Error.
 * Errors can be disabled by second param.
 *
 * Returns list of found rule names (if no exception happened).
 *
 * See also [[Ruler.enable]], [[Ruler.enableOnly]].
 **/


Ruler.prototype.disable = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) {
    list = [list];
  }

  var result = []; // Search by name and disable

  list.forEach(function (name) {
    var idx = this.__find__(name);

    if (idx < 0) {
      if (ignoreInvalid) {
        return;
      }

      throw new Error('Rules manager: invalid rule name ' + name);
    }

    this.__rules__[idx].enabled = false;
    result.push(name);
  }, this);
  this.__cache__ = null;
  return result;
};
/**
 * Ruler.getRules(chainName) -> Array
 *
 * Return array of active functions (rules) for given chain name. It analyzes
 * rules configuration, compiles caches if not exists and returns result.
 *
 * Default chain name is `''` (empty string). It can't be skipped. That's
 * done intentionally, to keep signature monomorphic for high speed.
 **/


Ruler.prototype.getRules = function (chainName) {
  if (this.__cache__ === null) {
    this.__compile__();
  } // Chain can be empty, if rules disabled. But we still have to return Array.


  return this.__cache__[chainName] || [];
};

var ruler = Ruler;

// Normalize input string

var NEWLINES_RE = /\r\n?|\n/g;
var NULL_RE = /\0/g;

var normalize = function normalize(state) {
  var str; // Normalize newlines

  str = state.src.replace(NEWLINES_RE, '\n'); // Replace NULL characters

  str = str.replace(NULL_RE, '\uFFFD');
  state.src = str;
};

var block$1 = function block(state) {
  var token;

  if (state.inlineMode) {
    token = new state.Token('inline', '', 0);
    token.content = state.src;
    token.map = [0, 1];
    token.children = [];
    state.tokens.push(token);
  } else {
    state.md.block.parse(state.src, state.md, state.env, state.tokens);
  }
};

var inline = function inline(state) {
  var tokens = state.tokens,
      tok,
      i,
      l; // Parse inlines

  for (i = 0, l = tokens.length; i < l; i++) {
    tok = tokens[i];

    if (tok.type === 'inline') {
      state.md.inline.parse(tok.content, state.md, state.env, tok.children);
    }
  }
};

var arrayReplaceAt = utils.arrayReplaceAt;

function isLinkOpen(str) {
  return /^<a[>\s]/i.test(str);
}

function isLinkClose(str) {
  return /^<\/a\s*>/i.test(str);
}

var linkify = function linkify(state) {
  var i,
      j,
      l,
      tokens,
      token,
      currentToken,
      nodes,
      ln,
      text,
      pos,
      lastPos,
      level,
      htmlLinkLevel,
      url,
      fullUrl,
      urlText,
      blockTokens = state.tokens,
      links;

  if (!state.md.options.linkify) {
    return;
  }

  for (j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== 'inline' || !state.md.linkify.pretest(blockTokens[j].content)) {
      continue;
    }

    tokens = blockTokens[j].children;
    htmlLinkLevel = 0; // We scan from the end, to keep position when new tags added.
    // Use reversed logic in links start/end match

    for (i = tokens.length - 1; i >= 0; i--) {
      currentToken = tokens[i]; // Skip content of markdown links

      if (currentToken.type === 'link_close') {
        i--;

        while (tokens[i].level !== currentToken.level && tokens[i].type !== 'link_open') {
          i--;
        }

        continue;
      } // Skip content of html tag links


      if (currentToken.type === 'html_inline') {
        if (isLinkOpen(currentToken.content) && htmlLinkLevel > 0) {
          htmlLinkLevel--;
        }

        if (isLinkClose(currentToken.content)) {
          htmlLinkLevel++;
        }
      }

      if (htmlLinkLevel > 0) {
        continue;
      }

      if (currentToken.type === 'text' && state.md.linkify.test(currentToken.content)) {
        text = currentToken.content;
        links = state.md.linkify.match(text); // Now split string to nodes

        nodes = [];
        level = currentToken.level;
        lastPos = 0;

        for (ln = 0; ln < links.length; ln++) {
          url = links[ln].url;
          fullUrl = state.md.normalizeLink(url);

          if (!state.md.validateLink(fullUrl)) {
            continue;
          }

          urlText = links[ln].text; // Linkifier might send raw hostnames like "example.com", where url
          // starts with domain name. So we prepend http:// in those cases,
          // and remove it afterwards.
          //

          if (!links[ln].schema) {
            urlText = state.md.normalizeLinkText('http://' + urlText).replace(/^http:\/\//, '');
          } else if (links[ln].schema === 'mailto:' && !/^mailto:/i.test(urlText)) {
            urlText = state.md.normalizeLinkText('mailto:' + urlText).replace(/^mailto:/, '');
          } else {
            urlText = state.md.normalizeLinkText(urlText);
          }

          pos = links[ln].index;

          if (pos > lastPos) {
            token = new state.Token('text', '', 0);
            token.content = text.slice(lastPos, pos);
            token.level = level;
            nodes.push(token);
          }

          token = new state.Token('link_open', 'a', 1);
          token.attrs = [['href', fullUrl]];
          token.level = level++;
          token.markup = 'linkify';
          token.info = 'auto';
          nodes.push(token);
          token = new state.Token('text', '', 0);
          token.content = urlText;
          token.level = level;
          nodes.push(token);
          token = new state.Token('link_close', 'a', -1);
          token.level = --level;
          token.markup = 'linkify';
          token.info = 'auto';
          nodes.push(token);
          lastPos = links[ln].lastIndex;
        }

        if (lastPos < text.length) {
          token = new state.Token('text', '', 0);
          token.content = text.slice(lastPos);
          token.level = level;
          nodes.push(token);
        } // replace current node


        blockTokens[j].children = tokens = arrayReplaceAt(tokens, i, nodes);
      }
    }
  }
};

// Simple typographic replacements
// - fractionals 1/2, 1/4, 3/4 -> ½, ¼, ¾
// - miltiplication 2 x 4 -> 2 × 4

var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/; // Workaround for phantomjs - need regex without /g flag,
// or root check will fail every second time

var SCOPED_ABBR_TEST_RE = /\((c|tm|r|p)\)/i;
var SCOPED_ABBR_RE = /\((c|tm|r|p)\)/ig;
var SCOPED_ABBR = {
  c: '©',
  r: '®',
  p: '§',
  tm: '™'
};

function replaceFn(match, name) {
  return SCOPED_ABBR[name.toLowerCase()];
}

function replace_scoped(inlineTokens) {
  var i,
      token,
      inside_autolink = 0;

  for (i = inlineTokens.length - 1; i >= 0; i--) {
    token = inlineTokens[i];

    if (token.type === 'text' && !inside_autolink) {
      token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
    }

    if (token.type === 'link_open' && token.info === 'auto') {
      inside_autolink--;
    }

    if (token.type === 'link_close' && token.info === 'auto') {
      inside_autolink++;
    }
  }
}

function replace_rare(inlineTokens) {
  var i,
      token,
      inside_autolink = 0;

  for (i = inlineTokens.length - 1; i >= 0; i--) {
    token = inlineTokens[i];

    if (token.type === 'text' && !inside_autolink) {
      if (RARE_RE.test(token.content)) {
        token.content = token.content.replace(/\+-/g, '±') // .., ..., ....... -> …
        // but ?..... & !..... -> ?.. & !..
        .replace(/\.{2,}/g, '…').replace(/([?!])…/g, '$1..').replace(/([?!]){4,}/g, '$1$1$1').replace(/,{2,}/g, ',') // em-dash
        .replace(/(^|[^-])---([^-]|$)/mg, '$1\u2014$2') // en-dash
        .replace(/(^|\s)--(\s|$)/mg, '$1\u2013$2').replace(/(^|[^-\s])--([^-\s]|$)/mg, '$1\u2013$2');
      }
    }

    if (token.type === 'link_open' && token.info === 'auto') {
      inside_autolink--;
    }

    if (token.type === 'link_close' && token.info === 'auto') {
      inside_autolink++;
    }
  }
}

var replacements = function replace(state) {
  var blkIdx;

  if (!state.md.options.typographer) {
    return;
  }

  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
    if (state.tokens[blkIdx].type !== 'inline') {
      continue;
    }

    if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) {
      replace_scoped(state.tokens[blkIdx].children);
    }

    if (RARE_RE.test(state.tokens[blkIdx].content)) {
      replace_rare(state.tokens[blkIdx].children);
    }
  }
};

var isWhiteSpace = utils.isWhiteSpace;
var isPunctChar = utils.isPunctChar;
var isMdAsciiPunct = utils.isMdAsciiPunct;
var QUOTE_TEST_RE = /['"]/;
var QUOTE_RE = /['"]/g;
var APOSTROPHE = '\u2019';
/* ’ */

function replaceAt(str, index, ch) {
  return str.substr(0, index) + ch + str.substr(index + 1);
}

function process_inlines(tokens, state) {
  var i, token, text, t, pos, max, thisLevel, item, lastChar, nextChar, isLastPunctChar, isNextPunctChar, isLastWhiteSpace, isNextWhiteSpace, canOpen, canClose, j, isSingle, stack, openQuote, closeQuote;
  stack = [];

  for (i = 0; i < tokens.length; i++) {
    token = tokens[i];
    thisLevel = tokens[i].level;

    for (j = stack.length - 1; j >= 0; j--) {
      if (stack[j].level <= thisLevel) {
        break;
      }
    }

    stack.length = j + 1;

    if (token.type !== 'text') {
      continue;
    }

    text = token.content;
    pos = 0;
    max = text.length;
    /*eslint no-labels:0,block-scoped-var:0*/

    OUTER: while (pos < max) {
      QUOTE_RE.lastIndex = pos;
      t = QUOTE_RE.exec(text);

      if (!t) {
        break;
      }

      canOpen = canClose = true;
      pos = t.index + 1;
      isSingle = t[0] === "'"; // Find previous character,
      // default to space if it's the beginning of the line
      //

      lastChar = 0x20;

      if (t.index - 1 >= 0) {
        lastChar = text.charCodeAt(t.index - 1);
      } else {
        for (j = i - 1; j >= 0; j--) {
          if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; // lastChar defaults to 0x20

          if (tokens[j].type !== 'text') continue;
          lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
          break;
        }
      } // Find next character,
      // default to space if it's the end of the line
      //


      nextChar = 0x20;

      if (pos < max) {
        nextChar = text.charCodeAt(pos);
      } else {
        for (j = i + 1; j < tokens.length; j++) {
          if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; // nextChar defaults to 0x20

          if (tokens[j].type !== 'text') continue;
          nextChar = tokens[j].content.charCodeAt(0);
          break;
        }
      }

      isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
      isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));
      isLastWhiteSpace = isWhiteSpace(lastChar);
      isNextWhiteSpace = isWhiteSpace(nextChar);

      if (isNextWhiteSpace) {
        canOpen = false;
      } else if (isNextPunctChar) {
        if (!(isLastWhiteSpace || isLastPunctChar)) {
          canOpen = false;
        }
      }

      if (isLastWhiteSpace) {
        canClose = false;
      } else if (isLastPunctChar) {
        if (!(isNextWhiteSpace || isNextPunctChar)) {
          canClose = false;
        }
      }

      if (nextChar === 0x22
      /* " */
      && t[0] === '"') {
        if (lastChar >= 0x30
        /* 0 */
        && lastChar <= 0x39
        /* 9 */
        ) {
            // special case: 1"" - count first quote as an inch
            canClose = canOpen = false;
          }
      }

      if (canOpen && canClose) {
        // treat this as the middle of the word
        canOpen = false;
        canClose = isNextPunctChar;
      }

      if (!canOpen && !canClose) {
        // middle of word
        if (isSingle) {
          token.content = replaceAt(token.content, t.index, APOSTROPHE);
        }

        continue;
      }

      if (canClose) {
        // this could be a closing quote, rewind the stack to get a match
        for (j = stack.length - 1; j >= 0; j--) {
          item = stack[j];

          if (stack[j].level < thisLevel) {
            break;
          }

          if (item.single === isSingle && stack[j].level === thisLevel) {
            item = stack[j];

            if (isSingle) {
              openQuote = state.md.options.quotes[2];
              closeQuote = state.md.options.quotes[3];
            } else {
              openQuote = state.md.options.quotes[0];
              closeQuote = state.md.options.quotes[1];
            } // replace token.content *before* tokens[item.token].content,
            // because, if they are pointing at the same token, replaceAt
            // could mess up indices when quote length != 1


            token.content = replaceAt(token.content, t.index, closeQuote);
            tokens[item.token].content = replaceAt(tokens[item.token].content, item.pos, openQuote);
            pos += closeQuote.length - 1;

            if (item.token === i) {
              pos += openQuote.length - 1;
            }

            text = token.content;
            max = text.length;
            stack.length = j;
            continue OUTER;
          }
        }
      }

      if (canOpen) {
        stack.push({
          token: i,
          pos: t.index,
          single: isSingle,
          level: thisLevel
        });
      } else if (canClose && isSingle) {
        token.content = replaceAt(token.content, t.index, APOSTROPHE);
      }
    }
  }
}

var smartquotes = function smartquotes(state) {
  /*eslint max-depth:0*/
  var blkIdx;

  if (!state.md.options.typographer) {
    return;
  }

  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
    if (state.tokens[blkIdx].type !== 'inline' || !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) {
      continue;
    }

    process_inlines(state.tokens[blkIdx].children, state);
  }
};

// Token class
/**
 * class Token
 **/

/**
 * new Token(type, tag, nesting)
 *
 * Create new token and fill passed properties.
 **/

function Token(type, tag, nesting) {
  /**
   * Token#type -> String
   *
   * Type of the token (string, e.g. "paragraph_open")
   **/
  this.type = type;
  /**
   * Token#tag -> String
   *
   * html tag name, e.g. "p"
   **/

  this.tag = tag;
  /**
   * Token#attrs -> Array
   *
   * Html attributes. Format: `[ [ name1, value1 ], [ name2, value2 ] ]`
   **/

  this.attrs = null;
  /**
   * Token#map -> Array
   *
   * Source map info. Format: `[ line_begin, line_end ]`
   **/

  this.map = null;
  /**
   * Token#nesting -> Number
   *
   * Level change (number in {-1, 0, 1} set), where:
   *
   * -  `1` means the tag is opening
   * -  `0` means the tag is self-closing
   * - `-1` means the tag is closing
   **/

  this.nesting = nesting;
  /**
   * Token#level -> Number
   *
   * nesting level, the same as `state.level`
   **/

  this.level = 0;
  /**
   * Token#children -> Array
   *
   * An array of child nodes (inline and img tokens)
   **/

  this.children = null;
  /**
   * Token#content -> String
   *
   * In a case of self-closing tag (code, html, fence, etc.),
   * it has contents of this tag.
   **/

  this.content = '';
  /**
   * Token#markup -> String
   *
   * '*' or '_' for emphasis, fence string for fence, etc.
   **/

  this.markup = '';
  /**
   * Token#info -> String
   *
   * fence infostring
   **/

  this.info = '';
  /**
   * Token#meta -> Object
   *
   * A place for plugins to store an arbitrary data
   **/

  this.meta = null;
  /**
   * Token#block -> Boolean
   *
   * True for block-level tokens, false for inline tokens.
   * Used in renderer to calculate line breaks
   **/

  this.block = false;
  /**
   * Token#hidden -> Boolean
   *
   * If it's true, ignore this element when rendering. Used for tight lists
   * to hide paragraphs.
   **/

  this.hidden = false;
}
/**
 * Token.attrIndex(name) -> Number
 *
 * Search attribute index by name.
 **/


Token.prototype.attrIndex = function attrIndex(name) {
  var attrs, i, len;

  if (!this.attrs) {
    return -1;
  }

  attrs = this.attrs;

  for (i = 0, len = attrs.length; i < len; i++) {
    if (attrs[i][0] === name) {
      return i;
    }
  }

  return -1;
};
/**
 * Token.attrPush(attrData)
 *
 * Add `[ name, value ]` attribute to list. Init attrs if necessary
 **/


Token.prototype.attrPush = function attrPush(attrData) {
  if (this.attrs) {
    this.attrs.push(attrData);
  } else {
    this.attrs = [attrData];
  }
};
/**
 * Token.attrSet(name, value)
 *
 * Set `name` attribute to `value`. Override old value if exists.
 **/


Token.prototype.attrSet = function attrSet(name, value) {
  var idx = this.attrIndex(name),
      attrData = [name, value];

  if (idx < 0) {
    this.attrPush(attrData);
  } else {
    this.attrs[idx] = attrData;
  }
};
/**
 * Token.attrGet(name)
 *
 * Get the value of attribute `name`, or null if it does not exist.
 **/


Token.prototype.attrGet = function attrGet(name) {
  var idx = this.attrIndex(name),
      value = null;

  if (idx >= 0) {
    value = this.attrs[idx][1];
  }

  return value;
};
/**
 * Token.attrJoin(name, value)
 *
 * Join value to existing attribute via space. Or create new attribute if not
 * exists. Useful to operate with token classes.
 **/


Token.prototype.attrJoin = function attrJoin(name, value) {
  var idx = this.attrIndex(name);

  if (idx < 0) {
    this.attrPush([name, value]);
  } else {
    this.attrs[idx][1] = this.attrs[idx][1] + ' ' + value;
  }
};

var token = Token;

function StateCore(src, md, env) {
  this.src = src;
  this.env = env;
  this.tokens = [];
  this.inlineMode = false;
  this.md = md; // link to parser instance
} // re-export Token class to use in core rules


StateCore.prototype.Token = token;
var state_core = StateCore;

var _rules = [['normalize', normalize], ['block', block$1], ['inline', inline], ['linkify', linkify], ['replacements', replacements], ['smartquotes', smartquotes]];
/**
 * new Core()
 **/

function Core() {
  /**
   * Core#ruler -> Ruler
   *
   * [[Ruler]] instance. Keep configuration of core rules.
   **/
  this.ruler = new ruler();

  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }
}
/**
 * Core.process(state)
 *
 * Executes core chain rules.
 **/


Core.prototype.process = function (state) {
  var i, l, rules;
  rules = this.ruler.getRules('');

  for (i = 0, l = rules.length; i < l; i++) {
    rules[i](state);
  }
};

Core.prototype.State = state_core;
var parser_core = Core;

var isSpace = utils.isSpace;

function getLine(state, line) {
  var pos = state.bMarks[line] + state.blkIndent,
      max = state.eMarks[line];
  return state.src.substr(pos, max - pos);
}

function escapedSplit(str) {
  var result = [],
      pos = 0,
      max = str.length,
      ch,
      escapes = 0,
      lastPos = 0,
      backTicked = false,
      lastBackTick = 0;
  ch = str.charCodeAt(pos);

  while (pos < max) {
    if (ch === 0x60
    /* ` */
    ) {
        if (backTicked) {
          // make \` close code sequence, but not open it;
          // the reason is: `\` is correct code block
          backTicked = false;
          lastBackTick = pos;
        } else if (escapes % 2 === 0) {
          backTicked = true;
          lastBackTick = pos;
        }
      } else if (ch === 0x7c
    /* | */
    && escapes % 2 === 0 && !backTicked) {
      result.push(str.substring(lastPos, pos));
      lastPos = pos + 1;
    }

    if (ch === 0x5c
    /* \ */
    ) {
        escapes++;
      } else {
      escapes = 0;
    }

    pos++; // If there was an un-closed backtick, go back to just after
    // the last backtick, but as if it was a normal character

    if (pos === max && backTicked) {
      backTicked = false;
      pos = lastBackTick + 1;
    }

    ch = str.charCodeAt(pos);
  }

  result.push(str.substring(lastPos));
  return result;
}

var table = function table(state, startLine, endLine, silent) {
  var ch, lineText, pos, i, nextLine, columns, columnCount, token, aligns, t, tableLines, tbodyLines; // should have at least two lines

  if (startLine + 2 > endLine) {
    return false;
  }

  nextLine = startLine + 1;

  if (state.sCount[nextLine] < state.blkIndent) {
    return false;
  } // if it's indented more than 3 spaces, it should be a code block


  if (state.sCount[nextLine] - state.blkIndent >= 4) {
    return false;
  } // first character of the second line should be '|', '-', ':',
  // and no other characters are allowed but spaces;
  // basically, this is the equivalent of /^[-:|][-:|\s]*$/ regexp


  pos = state.bMarks[nextLine] + state.tShift[nextLine];

  if (pos >= state.eMarks[nextLine]) {
    return false;
  }

  ch = state.src.charCodeAt(pos++);

  if (ch !== 0x7C
  /* | */
  && ch !== 0x2D
  /* - */
  && ch !== 0x3A
  /* : */
  ) {
      return false;
    }

  while (pos < state.eMarks[nextLine]) {
    ch = state.src.charCodeAt(pos);

    if (ch !== 0x7C
    /* | */
    && ch !== 0x2D
    /* - */
    && ch !== 0x3A
    /* : */
    && !isSpace(ch)) {
      return false;
    }

    pos++;
  }

  lineText = getLine(state, startLine + 1);
  columns = lineText.split('|');
  aligns = [];

  for (i = 0; i < columns.length; i++) {
    t = columns[i].trim();

    if (!t) {
      // allow empty columns before and after table, but not in between columns;
      // e.g. allow ` |---| `, disallow ` ---||--- `
      if (i === 0 || i === columns.length - 1) {
        continue;
      } else {
        return false;
      }
    }

    if (!/^:?-+:?$/.test(t)) {
      return false;
    }

    if (t.charCodeAt(t.length - 1) === 0x3A
    /* : */
    ) {
        aligns.push(t.charCodeAt(0) === 0x3A
        /* : */
        ? 'center' : 'right');
      } else if (t.charCodeAt(0) === 0x3A
    /* : */
    ) {
        aligns.push('left');
      } else {
      aligns.push('');
    }
  }

  lineText = getLine(state, startLine).trim();

  if (lineText.indexOf('|') === -1) {
    return false;
  }

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  columns = escapedSplit(lineText.replace(/^\||\|$/g, '')); // header row will define an amount of columns in the entire table,
  // and align row shouldn't be smaller than that (the rest of the rows can)

  columnCount = columns.length;

  if (columnCount > aligns.length) {
    return false;
  }

  if (silent) {
    return true;
  }

  token = state.push('table_open', 'table', 1);
  token.map = tableLines = [startLine, 0];
  token = state.push('thead_open', 'thead', 1);
  token.map = [startLine, startLine + 1];
  token = state.push('tr_open', 'tr', 1);
  token.map = [startLine, startLine + 1];

  for (i = 0; i < columns.length; i++) {
    token = state.push('th_open', 'th', 1);
    token.map = [startLine, startLine + 1];

    if (aligns[i]) {
      token.attrs = [['style', 'text-align:' + aligns[i]]];
    }

    token = state.push('inline', '', 0);
    token.content = columns[i].trim();
    token.map = [startLine, startLine + 1];
    token.children = [];
    token = state.push('th_close', 'th', -1);
  }

  token = state.push('tr_close', 'tr', -1);
  token = state.push('thead_close', 'thead', -1);
  token = state.push('tbody_open', 'tbody', 1);
  token.map = tbodyLines = [startLine + 2, 0];

  for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
    if (state.sCount[nextLine] < state.blkIndent) {
      break;
    }

    lineText = getLine(state, nextLine).trim();

    if (lineText.indexOf('|') === -1) {
      break;
    }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      break;
    }

    columns = escapedSplit(lineText.replace(/^\||\|$/g, ''));
    token = state.push('tr_open', 'tr', 1);

    for (i = 0; i < columnCount; i++) {
      token = state.push('td_open', 'td', 1);

      if (aligns[i]) {
        token.attrs = [['style', 'text-align:' + aligns[i]]];
      }

      token = state.push('inline', '', 0);
      token.content = columns[i] ? columns[i].trim() : '';
      token.children = [];
      token = state.push('td_close', 'td', -1);
    }

    token = state.push('tr_close', 'tr', -1);
  }

  token = state.push('tbody_close', 'tbody', -1);
  token = state.push('table_close', 'table', -1);
  tableLines[1] = tbodyLines[1] = nextLine;
  state.line = nextLine;
  return true;
};

// Code block (4 spaces padded)

var code = function code(state, startLine, endLine
/*, silent*/
) {
  var nextLine, last, token;

  if (state.sCount[startLine] - state.blkIndent < 4) {
    return false;
  }

  last = nextLine = startLine + 1;

  while (nextLine < endLine) {
    if (state.isEmpty(nextLine)) {
      nextLine++;
      continue;
    }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      nextLine++;
      last = nextLine;
      continue;
    }

    break;
  }

  state.line = last;
  token = state.push('code_block', 'code', 0);
  token.content = state.getLines(startLine, last, 4 + state.blkIndent, true);
  token.map = [startLine, state.line];
  return true;
};

// fences (``` lang, ~~~ lang)

var fence = function fence(state, startLine, endLine, silent) {
  var marker,
      len,
      params,
      nextLine,
      mem,
      token,
      markup,
      haveEndMarker = false,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  if (pos + 3 > max) {
    return false;
  }

  marker = state.src.charCodeAt(pos);

  if (marker !== 0x7E
  /* ~ */
  && marker !== 0x60
  /* ` */
  ) {
      return false;
    } // scan marker length


  mem = pos;
  pos = state.skipChars(pos, marker);
  len = pos - mem;

  if (len < 3) {
    return false;
  }

  markup = state.src.slice(mem, pos);
  params = state.src.slice(pos, max);

  if (marker === 0x60
  /* ` */
  ) {
      if (params.indexOf(String.fromCharCode(marker)) >= 0) {
        return false;
      }
    } // Since start is found, we can report success here in validation mode


  if (silent) {
    return true;
  } // search end of block


  nextLine = startLine;

  for (;;) {
    nextLine++;

    if (nextLine >= endLine) {
      // unclosed block should be autoclosed by end of document.
      // also block seems to be autoclosed by end of parent
      break;
    }

    pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.sCount[nextLine] < state.blkIndent) {
      // non-empty line with negative indent should stop the list:
      // - ```
      //  test
      break;
    }

    if (state.src.charCodeAt(pos) !== marker) {
      continue;
    }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      // closing fence should be indented less than 4 spaces
      continue;
    }

    pos = state.skipChars(pos, marker); // closing code fence must be at least as long as the opening one

    if (pos - mem < len) {
      continue;
    } // make sure tail has spaces only


    pos = state.skipSpaces(pos);

    if (pos < max) {
      continue;
    }

    haveEndMarker = true; // found!

    break;
  } // If a fence has heading spaces, they should be removed from its inner block


  len = state.sCount[startLine];
  state.line = nextLine + (haveEndMarker ? 1 : 0);
  token = state.push('fence', 'code', 0);
  token.info = params;
  token.content = state.getLines(startLine + 1, nextLine, len, true);
  token.markup = markup;
  token.map = [startLine, state.line];
  return true;
};

var isSpace$1 = utils.isSpace;

var blockquote = function blockquote(state, startLine, endLine, silent) {
  var adjustTab,
      ch,
      i,
      initial,
      l,
      lastLineEmpty,
      lines,
      nextLine,
      offset,
      oldBMarks,
      oldBSCount,
      oldIndent,
      oldParentType,
      oldSCount,
      oldTShift,
      spaceAfterMarker,
      terminate,
      terminatorRules,
      token,
      wasOutdented,
      oldLineMax = state.lineMax,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  } // check the block quote marker


  if (state.src.charCodeAt(pos++) !== 0x3E
  /* > */
  ) {
      return false;
    } // we know that it's going to be a valid blockquote,
  // so no point trying to find the end of it in silent mode


  if (silent) {
    return true;
  } // skip spaces after ">" and re-calculate offset


  initial = offset = state.sCount[startLine] + pos - (state.bMarks[startLine] + state.tShift[startLine]); // skip one optional space after '>'

  if (state.src.charCodeAt(pos) === 0x20
  /* space */
  ) {
      // ' >   test '
      //     ^ -- position start of line here:
      pos++;
      initial++;
      offset++;
      adjustTab = false;
      spaceAfterMarker = true;
    } else if (state.src.charCodeAt(pos) === 0x09
  /* tab */
  ) {
      spaceAfterMarker = true;

      if ((state.bsCount[startLine] + offset) % 4 === 3) {
        // '  >\t  test '
        //       ^ -- position start of line here (tab has width===1)
        pos++;
        initial++;
        offset++;
        adjustTab = false;
      } else {
        // ' >\t  test '
        //    ^ -- position start of line here + shift bsCount slightly
        //         to make extra space appear
        adjustTab = true;
      }
    } else {
    spaceAfterMarker = false;
  }

  oldBMarks = [state.bMarks[startLine]];
  state.bMarks[startLine] = pos;

  while (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (isSpace$1(ch)) {
      if (ch === 0x09) {
        offset += 4 - (offset + state.bsCount[startLine] + (adjustTab ? 1 : 0)) % 4;
      } else {
        offset++;
      }
    } else {
      break;
    }

    pos++;
  }

  oldBSCount = [state.bsCount[startLine]];
  state.bsCount[startLine] = state.sCount[startLine] + 1 + (spaceAfterMarker ? 1 : 0);
  lastLineEmpty = pos >= max;
  oldSCount = [state.sCount[startLine]];
  state.sCount[startLine] = offset - initial;
  oldTShift = [state.tShift[startLine]];
  state.tShift[startLine] = pos - state.bMarks[startLine];
  terminatorRules = state.md.block.ruler.getRules('blockquote');
  oldParentType = state.parentType;
  state.parentType = 'blockquote';
  wasOutdented = false; // Search the end of the block
  //
  // Block ends with either:
  //  1. an empty line outside:
  //     ```
  //     > test
  //
  //     ```
  //  2. an empty line inside:
  //     ```
  //     >
  //     test
  //     ```
  //  3. another tag:
  //     ```
  //     > test
  //      - - -
  //     ```

  for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
    // check if it's outdented, i.e. it's inside list item and indented
    // less than said list item:
    //
    // ```
    // 1. anything
    //    > current blockquote
    // 2. checking this line
    // ```
    if (state.sCount[nextLine] < state.blkIndent) wasOutdented = true;
    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos >= max) {
      // Case 1: line is not inside the blockquote, and this line is empty.
      break;
    }

    if (state.src.charCodeAt(pos++) === 0x3E
    /* > */
    && !wasOutdented) {
      // This line is inside the blockquote.
      // skip spaces after ">" and re-calculate offset
      initial = offset = state.sCount[nextLine] + pos - (state.bMarks[nextLine] + state.tShift[nextLine]); // skip one optional space after '>'

      if (state.src.charCodeAt(pos) === 0x20
      /* space */
      ) {
          // ' >   test '
          //     ^ -- position start of line here:
          pos++;
          initial++;
          offset++;
          adjustTab = false;
          spaceAfterMarker = true;
        } else if (state.src.charCodeAt(pos) === 0x09
      /* tab */
      ) {
          spaceAfterMarker = true;

          if ((state.bsCount[nextLine] + offset) % 4 === 3) {
            // '  >\t  test '
            //       ^ -- position start of line here (tab has width===1)
            pos++;
            initial++;
            offset++;
            adjustTab = false;
          } else {
            // ' >\t  test '
            //    ^ -- position start of line here + shift bsCount slightly
            //         to make extra space appear
            adjustTab = true;
          }
        } else {
        spaceAfterMarker = false;
      }

      oldBMarks.push(state.bMarks[nextLine]);
      state.bMarks[nextLine] = pos;

      while (pos < max) {
        ch = state.src.charCodeAt(pos);

        if (isSpace$1(ch)) {
          if (ch === 0x09) {
            offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
          } else {
            offset++;
          }
        } else {
          break;
        }

        pos++;
      }

      lastLineEmpty = pos >= max;
      oldBSCount.push(state.bsCount[nextLine]);
      state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);
      oldSCount.push(state.sCount[nextLine]);
      state.sCount[nextLine] = offset - initial;
      oldTShift.push(state.tShift[nextLine]);
      state.tShift[nextLine] = pos - state.bMarks[nextLine];
      continue;
    } // Case 2: line is not inside the blockquote, and the last line was empty.


    if (lastLineEmpty) {
      break;
    } // Case 3: another tag found.


    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      // Quirk to enforce "hard termination mode" for paragraphs;
      // normally if you call `tokenize(state, startLine, nextLine)`,
      // paragraphs will look below nextLine for paragraph continuation,
      // but if blockquote is terminated by another tag, they shouldn't
      state.lineMax = nextLine;

      if (state.blkIndent !== 0) {
        // state.blkIndent was non-zero, we now set it to zero,
        // so we need to re-calculate all offsets to appear as
        // if indent wasn't changed
        oldBMarks.push(state.bMarks[nextLine]);
        oldBSCount.push(state.bsCount[nextLine]);
        oldTShift.push(state.tShift[nextLine]);
        oldSCount.push(state.sCount[nextLine]);
        state.sCount[nextLine] -= state.blkIndent;
      }

      break;
    }

    oldBMarks.push(state.bMarks[nextLine]);
    oldBSCount.push(state.bsCount[nextLine]);
    oldTShift.push(state.tShift[nextLine]);
    oldSCount.push(state.sCount[nextLine]); // A negative indentation means that this is a paragraph continuation
    //

    state.sCount[nextLine] = -1;
  }

  oldIndent = state.blkIndent;
  state.blkIndent = 0;
  token = state.push('blockquote_open', 'blockquote', 1);
  token.markup = '>';
  token.map = lines = [startLine, 0];
  state.md.block.tokenize(state, startLine, nextLine);
  token = state.push('blockquote_close', 'blockquote', -1);
  token.markup = '>';
  state.lineMax = oldLineMax;
  state.parentType = oldParentType;
  lines[1] = state.line; // Restore original tShift; this might not be necessary since the parser
  // has already been here, but just to make sure we can do that.

  for (i = 0; i < oldTShift.length; i++) {
    state.bMarks[i + startLine] = oldBMarks[i];
    state.tShift[i + startLine] = oldTShift[i];
    state.sCount[i + startLine] = oldSCount[i];
    state.bsCount[i + startLine] = oldBSCount[i];
  }

  state.blkIndent = oldIndent;
  return true;
};

var isSpace$2 = utils.isSpace;

var hr = function hr(state, startLine, endLine, silent) {
  var marker,
      cnt,
      ch,
      token,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  marker = state.src.charCodeAt(pos++); // Check hr marker

  if (marker !== 0x2A
  /* * */
  && marker !== 0x2D
  /* - */
  && marker !== 0x5F
  /* _ */
  ) {
      return false;
    } // markers can be mixed with spaces, but there should be at least 3 of them


  cnt = 1;

  while (pos < max) {
    ch = state.src.charCodeAt(pos++);

    if (ch !== marker && !isSpace$2(ch)) {
      return false;
    }

    if (ch === marker) {
      cnt++;
    }
  }

  if (cnt < 3) {
    return false;
  }

  if (silent) {
    return true;
  }

  state.line = startLine + 1;
  token = state.push('hr', 'hr', 0);
  token.map = [startLine, state.line];
  token.markup = Array(cnt + 1).join(String.fromCharCode(marker));
  return true;
};

var isSpace$3 = utils.isSpace; // Search `[-+*][\n ]`, returns next pos after marker on success
// or -1 on fail.

function skipBulletListMarker(state, startLine) {
  var marker, pos, max, ch;
  pos = state.bMarks[startLine] + state.tShift[startLine];
  max = state.eMarks[startLine];
  marker = state.src.charCodeAt(pos++); // Check bullet

  if (marker !== 0x2A
  /* * */
  && marker !== 0x2D
  /* - */
  && marker !== 0x2B
  /* + */
  ) {
      return -1;
    }

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (!isSpace$3(ch)) {
      // " -test " - is not a list item
      return -1;
    }
  }

  return pos;
} // Search `\d+[.)][\n ]`, returns next pos after marker on success
// or -1 on fail.


function skipOrderedListMarker(state, startLine) {
  var ch,
      start = state.bMarks[startLine] + state.tShift[startLine],
      pos = start,
      max = state.eMarks[startLine]; // List marker should have at least 2 chars (digit + dot)

  if (pos + 1 >= max) {
    return -1;
  }

  ch = state.src.charCodeAt(pos++);

  if (ch < 0x30
  /* 0 */
  || ch > 0x39
  /* 9 */
  ) {
      return -1;
    }

  for (;;) {
    // EOL -> fail
    if (pos >= max) {
      return -1;
    }

    ch = state.src.charCodeAt(pos++);

    if (ch >= 0x30
    /* 0 */
    && ch <= 0x39
    /* 9 */
    ) {
        // List marker should have no more than 9 digits
        // (prevents integer overflow in browsers)
        if (pos - start >= 10) {
          return -1;
        }

        continue;
      } // found valid marker


    if (ch === 0x29
    /* ) */
    || ch === 0x2e
    /* . */
    ) {
        break;
      }

    return -1;
  }

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (!isSpace$3(ch)) {
      // " 1.test " - is not a list item
      return -1;
    }
  }

  return pos;
}

function markTightParagraphs(state, idx) {
  var i,
      l,
      level = state.level + 2;

  for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
    if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
      state.tokens[i + 2].hidden = true;
      state.tokens[i].hidden = true;
      i += 2;
    }
  }
}

var list = function list(state, startLine, endLine, silent) {
  var ch,
      contentStart,
      i,
      indent,
      indentAfterMarker,
      initial,
      isOrdered,
      itemLines,
      l,
      listLines,
      listTokIdx,
      markerCharCode,
      markerValue,
      max,
      nextLine,
      offset,
      oldListIndent,
      oldParentType,
      oldSCount,
      oldTShift,
      oldTight,
      pos,
      posAfterMarker,
      prevEmptyEnd,
      start,
      terminate,
      terminatorRules,
      token,
      isTerminatingParagraph = false,
      tight = true; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  } // Special case:
  //  - item 1
  //   - item 2
  //    - item 3
  //     - item 4
  //      - this one is a paragraph continuation


  if (state.listIndent >= 0 && state.sCount[startLine] - state.listIndent >= 4 && state.sCount[startLine] < state.blkIndent) {
    return false;
  } // limit conditions when list can interrupt
  // a paragraph (validation mode only)


  if (silent && state.parentType === 'paragraph') {
    // Next list item should still terminate previous list item;
    //
    // This code can fail if plugins use blkIndent as well as lists,
    // but I hope the spec gets fixed long before that happens.
    //
    if (state.tShift[startLine] >= state.blkIndent) {
      isTerminatingParagraph = true;
    }
  } // Detect list type and position after marker


  if ((posAfterMarker = skipOrderedListMarker(state, startLine)) >= 0) {
    isOrdered = true;
    start = state.bMarks[startLine] + state.tShift[startLine];
    markerValue = Number(state.src.substr(start, posAfterMarker - start - 1)); // If we're starting a new ordered list right after
    // a paragraph, it should start with 1.

    if (isTerminatingParagraph && markerValue !== 1) return false;
  } else if ((posAfterMarker = skipBulletListMarker(state, startLine)) >= 0) {
    isOrdered = false;
  } else {
    return false;
  } // If we're starting a new unordered list right after
  // a paragraph, first line should not be empty.


  if (isTerminatingParagraph) {
    if (state.skipSpaces(posAfterMarker) >= state.eMarks[startLine]) return false;
  } // We should terminate list on style change. Remember first one to compare.


  markerCharCode = state.src.charCodeAt(posAfterMarker - 1); // For validation mode we can terminate immediately

  if (silent) {
    return true;
  } // Start list


  listTokIdx = state.tokens.length;

  if (isOrdered) {
    token = state.push('ordered_list_open', 'ol', 1);

    if (markerValue !== 1) {
      token.attrs = [['start', markerValue]];
    }
  } else {
    token = state.push('bullet_list_open', 'ul', 1);
  }

  token.map = listLines = [startLine, 0];
  token.markup = String.fromCharCode(markerCharCode); //
  // Iterate list items
  //

  nextLine = startLine;
  prevEmptyEnd = false;
  terminatorRules = state.md.block.ruler.getRules('list');
  oldParentType = state.parentType;
  state.parentType = 'list';

  while (nextLine < endLine) {
    pos = posAfterMarker;
    max = state.eMarks[nextLine];
    initial = offset = state.sCount[nextLine] + posAfterMarker - (state.bMarks[startLine] + state.tShift[startLine]);

    while (pos < max) {
      ch = state.src.charCodeAt(pos);

      if (ch === 0x09) {
        offset += 4 - (offset + state.bsCount[nextLine]) % 4;
      } else if (ch === 0x20) {
        offset++;
      } else {
        break;
      }

      pos++;
    }

    contentStart = pos;

    if (contentStart >= max) {
      // trimming space in "-    \n  3" case, indent is 1 here
      indentAfterMarker = 1;
    } else {
      indentAfterMarker = offset - initial;
    } // If we have more than 4 spaces, the indent is 1
    // (the rest is just indented code block)


    if (indentAfterMarker > 4) {
      indentAfterMarker = 1;
    } // "  -  test"
    //  ^^^^^ - calculating total length of this thing


    indent = initial + indentAfterMarker; // Run subparser & write tokens

    token = state.push('list_item_open', 'li', 1);
    token.markup = String.fromCharCode(markerCharCode);
    token.map = itemLines = [startLine, 0]; // change current state, then restore it after parser subcall

    oldTight = state.tight;
    oldTShift = state.tShift[startLine];
    oldSCount = state.sCount[startLine]; //  - example list
    // ^ listIndent position will be here
    //   ^ blkIndent position will be here
    //

    oldListIndent = state.listIndent;
    state.listIndent = state.blkIndent;
    state.blkIndent = indent;
    state.tight = true;
    state.tShift[startLine] = contentStart - state.bMarks[startLine];
    state.sCount[startLine] = offset;

    if (contentStart >= max && state.isEmpty(startLine + 1)) {
      // workaround for this case
      // (list item is empty, list terminates before "foo"):
      // ~~~~~~~~
      //   -
      //
      //     foo
      // ~~~~~~~~
      state.line = Math.min(state.line + 2, endLine);
    } else {
      state.md.block.tokenize(state, startLine, endLine, true);
    } // If any of list item is tight, mark list as tight


    if (!state.tight || prevEmptyEnd) {
      tight = false;
    } // Item become loose if finish with empty line,
    // but we should filter last element, because it means list finish


    prevEmptyEnd = state.line - startLine > 1 && state.isEmpty(state.line - 1);
    state.blkIndent = state.listIndent;
    state.listIndent = oldListIndent;
    state.tShift[startLine] = oldTShift;
    state.sCount[startLine] = oldSCount;
    state.tight = oldTight;
    token = state.push('list_item_close', 'li', -1);
    token.markup = String.fromCharCode(markerCharCode);
    nextLine = startLine = state.line;
    itemLines[1] = nextLine;
    contentStart = state.bMarks[startLine];

    if (nextLine >= endLine) {
      break;
    } //
    // Try to check if list is terminated or continued.
    //


    if (state.sCount[nextLine] < state.blkIndent) {
      break;
    } // if it's indented more than 3 spaces, it should be a code block


    if (state.sCount[startLine] - state.blkIndent >= 4) {
      break;
    } // fail if terminating block found


    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      break;
    } // fail if list has another type


    if (isOrdered) {
      posAfterMarker = skipOrderedListMarker(state, nextLine);

      if (posAfterMarker < 0) {
        break;
      }
    } else {
      posAfterMarker = skipBulletListMarker(state, nextLine);

      if (posAfterMarker < 0) {
        break;
      }
    }

    if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) {
      break;
    }
  } // Finalize list


  if (isOrdered) {
    token = state.push('ordered_list_close', 'ol', -1);
  } else {
    token = state.push('bullet_list_close', 'ul', -1);
  }

  token.markup = String.fromCharCode(markerCharCode);
  listLines[1] = nextLine;
  state.line = nextLine;
  state.parentType = oldParentType; // mark paragraphs tight if needed

  if (tight) {
    markTightParagraphs(state, listTokIdx);
  }

  return true;
};

var normalizeReference = utils.normalizeReference;
var isSpace$4 = utils.isSpace;

var reference = function reference(state, startLine, _endLine, silent) {
  var ch,
      destEndPos,
      destEndLineNo,
      endLine,
      href,
      i,
      l,
      label,
      labelEnd,
      oldParentType,
      res,
      start,
      str,
      terminate,
      terminatorRules,
      title,
      lines = 0,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine],
      nextLine = startLine + 1; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  if (state.src.charCodeAt(pos) !== 0x5B
  /* [ */
  ) {
      return false;
    } // Simple check to quickly interrupt scan on [link](url) at the start of line.
  // Can be useful on practice: https://github.com/markdown-it/markdown-it/issues/54


  while (++pos < max) {
    if (state.src.charCodeAt(pos) === 0x5D
    /* ] */
    && state.src.charCodeAt(pos - 1) !== 0x5C
    /* \ */
    ) {
        if (pos + 1 === max) {
          return false;
        }

        if (state.src.charCodeAt(pos + 1) !== 0x3A
        /* : */
        ) {
            return false;
          }

        break;
      }
  }

  endLine = state.lineMax; // jump line-by-line until empty one or EOF

  terminatorRules = state.md.block.ruler.getRules('reference');
  oldParentType = state.parentType;
  state.parentType = 'reference';

  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) {
      continue;
    } // quirk for blockquotes, this line should already be checked by that rule


    if (state.sCount[nextLine] < 0) {
      continue;
    } // Some tags can terminate paragraph without empty line.


    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      break;
    }
  }

  str = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
  max = str.length;

  for (pos = 1; pos < max; pos++) {
    ch = str.charCodeAt(pos);

    if (ch === 0x5B
    /* [ */
    ) {
        return false;
      } else if (ch === 0x5D
    /* ] */
    ) {
        labelEnd = pos;
        break;
      } else if (ch === 0x0A
    /* \n */
    ) {
        lines++;
      } else if (ch === 0x5C
    /* \ */
    ) {
        pos++;

        if (pos < max && str.charCodeAt(pos) === 0x0A) {
          lines++;
        }
      }
  }

  if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 0x3A
  /* : */
  ) {
      return false;
    } // [label]:   destination   'title'
  //         ^^^ skip optional whitespace here


  for (pos = labelEnd + 2; pos < max; pos++) {
    ch = str.charCodeAt(pos);

    if (ch === 0x0A) {
      lines++;
    } else if (isSpace$4(ch)) ; else {
      break;
    }
  } // [label]:   destination   'title'
  //            ^^^^^^^^^^^ parse this


  res = state.md.helpers.parseLinkDestination(str, pos, max);

  if (!res.ok) {
    return false;
  }

  href = state.md.normalizeLink(res.str);

  if (!state.md.validateLink(href)) {
    return false;
  }

  pos = res.pos;
  lines += res.lines; // save cursor state, we could require to rollback later

  destEndPos = pos;
  destEndLineNo = lines; // [label]:   destination   'title'
  //                       ^^^ skipping those spaces

  start = pos;

  for (; pos < max; pos++) {
    ch = str.charCodeAt(pos);

    if (ch === 0x0A) {
      lines++;
    } else if (isSpace$4(ch)) ; else {
      break;
    }
  } // [label]:   destination   'title'
  //                          ^^^^^^^ parse this


  res = state.md.helpers.parseLinkTitle(str, pos, max);

  if (pos < max && start !== pos && res.ok) {
    title = res.str;
    pos = res.pos;
    lines += res.lines;
  } else {
    title = '';
    pos = destEndPos;
    lines = destEndLineNo;
  } // skip trailing spaces until the rest of the line


  while (pos < max) {
    ch = str.charCodeAt(pos);

    if (!isSpace$4(ch)) {
      break;
    }

    pos++;
  }

  if (pos < max && str.charCodeAt(pos) !== 0x0A) {
    if (title) {
      // garbage at the end of the line after title,
      // but it could still be a valid reference if we roll back
      title = '';
      pos = destEndPos;
      lines = destEndLineNo;

      while (pos < max) {
        ch = str.charCodeAt(pos);

        if (!isSpace$4(ch)) {
          break;
        }

        pos++;
      }
    }
  }

  if (pos < max && str.charCodeAt(pos) !== 0x0A) {
    // garbage at the end of the line
    return false;
  }

  label = normalizeReference(str.slice(1, labelEnd));

  if (!label) {
    // CommonMark 0.20 disallows empty labels
    return false;
  } // Reference can not terminate anything. This check is for safety only.

  /*istanbul ignore if*/


  if (silent) {
    return true;
  }

  if (typeof state.env.references === 'undefined') {
    state.env.references = {};
  }

  if (typeof state.env.references[label] === 'undefined') {
    state.env.references[label] = {
      title: title,
      href: href
    };
  }

  state.parentType = oldParentType;
  state.line = startLine + lines + 1;
  return true;
};

var isSpace$5 = utils.isSpace;

var heading = function heading(state, startLine, endLine, silent) {
  var ch,
      level,
      tmp,
      token,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  ch = state.src.charCodeAt(pos);

  if (ch !== 0x23
  /* # */
  || pos >= max) {
    return false;
  } // count heading level


  level = 1;
  ch = state.src.charCodeAt(++pos);

  while (ch === 0x23
  /* # */
  && pos < max && level <= 6) {
    level++;
    ch = state.src.charCodeAt(++pos);
  }

  if (level > 6 || pos < max && !isSpace$5(ch)) {
    return false;
  }

  if (silent) {
    return true;
  } // Let's cut tails like '    ###  ' from the end of string


  max = state.skipSpacesBack(max, pos);
  tmp = state.skipCharsBack(max, 0x23, pos); // #

  if (tmp > pos && isSpace$5(state.src.charCodeAt(tmp - 1))) {
    max = tmp;
  }

  state.line = startLine + 1;
  token = state.push('heading_open', 'h' + String(level), 1);
  token.markup = '########'.slice(0, level);
  token.map = [startLine, state.line];
  token = state.push('inline', '', 0);
  token.content = state.src.slice(pos, max).trim();
  token.map = [startLine, state.line];
  token.children = [];
  token = state.push('heading_close', 'h' + String(level), -1);
  token.markup = '########'.slice(0, level);
  return true;
};

// lheading (---, ===)

var lheading = function lheading(state, startLine, endLine
/*, silent*/
) {
  var content,
      terminate,
      i,
      l,
      token,
      pos,
      max,
      level,
      marker,
      nextLine = startLine + 1,
      oldParentType,
      terminatorRules = state.md.block.ruler.getRules('paragraph'); // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  oldParentType = state.parentType;
  state.parentType = 'paragraph'; // use paragraph to match terminatorRules
  // jump line-by-line until empty one or EOF

  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) {
      continue;
    } //
    // Check for underline in setext header
    //


    if (state.sCount[nextLine] >= state.blkIndent) {
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos < max) {
        marker = state.src.charCodeAt(pos);

        if (marker === 0x2D
        /* - */
        || marker === 0x3D
        /* = */
        ) {
            pos = state.skipChars(pos, marker);
            pos = state.skipSpaces(pos);

            if (pos >= max) {
              level = marker === 0x3D
              /* = */
              ? 1 : 2;
              break;
            }
          }
      }
    } // quirk for blockquotes, this line should already be checked by that rule


    if (state.sCount[nextLine] < 0) {
      continue;
    } // Some tags can terminate paragraph without empty line.


    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      break;
    }
  }

  if (!level) {
    // Didn't find valid underline
    return false;
  }

  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
  state.line = nextLine + 1;
  token = state.push('heading_open', 'h' + String(level), 1);
  token.markup = String.fromCharCode(marker);
  token.map = [startLine, state.line];
  token = state.push('inline', '', 0);
  token.content = content;
  token.map = [startLine, state.line - 1];
  token.children = [];
  token = state.push('heading_close', 'h' + String(level), -1);
  token.markup = String.fromCharCode(marker);
  state.parentType = oldParentType;
  return true;
};

// List of valid html blocks names, accorting to commonmark spec

var html_blocks = ['address', 'article', 'aside', 'base', 'basefont', 'blockquote', 'body', 'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dialog', 'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'iframe', 'legend', 'li', 'link', 'main', 'menu', 'menuitem', 'meta', 'nav', 'noframes', 'ol', 'optgroup', 'option', 'p', 'param', 'section', 'source', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'title', 'tr', 'track', 'ul'];

// Regexps to match html elements

var attr_name = '[a-zA-Z_:][a-zA-Z0-9:._-]*';
var unquoted = '[^"\'=<>`\\x00-\\x20]+';
var single_quoted = "'[^']*'";
var double_quoted = '"[^"]*"';
var attr_value = '(?:' + unquoted + '|' + single_quoted + '|' + double_quoted + ')';
var attribute = '(?:\\s+' + attr_name + '(?:\\s*=\\s*' + attr_value + ')?)';
var open_tag = '<[A-Za-z][A-Za-z0-9\\-]*' + attribute + '*\\s*\\/?>';
var close_tag = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>';
var comment = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->';
var processing = '<[?].*?[?]>';
var declaration = '<![A-Z]+\\s+[^>]*>';
var cdata = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>';
var HTML_TAG_RE = new RegExp('^(?:' + open_tag + '|' + close_tag + '|' + comment + '|' + processing + '|' + declaration + '|' + cdata + ')');
var HTML_OPEN_CLOSE_TAG_RE = new RegExp('^(?:' + open_tag + '|' + close_tag + ')');
var HTML_TAG_RE_1 = HTML_TAG_RE;
var HTML_OPEN_CLOSE_TAG_RE_1 = HTML_OPEN_CLOSE_TAG_RE;
var html_re = {
  HTML_TAG_RE: HTML_TAG_RE_1,
  HTML_OPEN_CLOSE_TAG_RE: HTML_OPEN_CLOSE_TAG_RE_1
};

var HTML_OPEN_CLOSE_TAG_RE$1 = html_re.HTML_OPEN_CLOSE_TAG_RE; // An array of opening and corresponding closing sequences for html tags,
// last argument defines whether it can terminate a paragraph or not
//

var HTML_SEQUENCES = [[/^<(script|pre|style)(?=(\s|>|$))/i, /<\/(script|pre|style)>/i, true], [/^<!--/, /-->/, true], [/^<\?/, /\?>/, true], [/^<![A-Z]/, />/, true], [/^<!\[CDATA\[/, /\]\]>/, true], [new RegExp('^</?(' + html_blocks.join('|') + ')(?=(\\s|/?>|$))', 'i'), /^$/, true], [new RegExp(HTML_OPEN_CLOSE_TAG_RE$1.source + '\\s*$'), /^$/, false]];

var html_block = function html_block(state, startLine, endLine, silent) {
  var i,
      nextLine,
      token,
      lineText,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  if (!state.md.options.html) {
    return false;
  }

  if (state.src.charCodeAt(pos) !== 0x3C
  /* < */
  ) {
      return false;
    }

  lineText = state.src.slice(pos, max);

  for (i = 0; i < HTML_SEQUENCES.length; i++) {
    if (HTML_SEQUENCES[i][0].test(lineText)) {
      break;
    }
  }

  if (i === HTML_SEQUENCES.length) {
    return false;
  }

  if (silent) {
    // true if this sequence can be a terminator, false otherwise
    return HTML_SEQUENCES[i][2];
  }

  nextLine = startLine + 1; // If we are here - we detected HTML block.
  // Let's roll down till block end.

  if (!HTML_SEQUENCES[i][1].test(lineText)) {
    for (; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) {
        break;
      }

      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      lineText = state.src.slice(pos, max);

      if (HTML_SEQUENCES[i][1].test(lineText)) {
        if (lineText.length !== 0) {
          nextLine++;
        }

        break;
      }
    }
  }

  state.line = nextLine;
  token = state.push('html_block', '', 0);
  token.map = [startLine, nextLine];
  token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
  return true;
};

// Paragraph

var paragraph = function paragraph(state, startLine
/*, endLine*/
) {
  var content,
      terminate,
      i,
      l,
      token,
      oldParentType,
      nextLine = startLine + 1,
      terminatorRules = state.md.block.ruler.getRules('paragraph'),
      endLine = state.lineMax;
  oldParentType = state.parentType;
  state.parentType = 'paragraph'; // jump line-by-line until empty one or EOF

  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) {
      continue;
    } // quirk for blockquotes, this line should already be checked by that rule


    if (state.sCount[nextLine] < 0) {
      continue;
    } // Some tags can terminate paragraph without empty line.


    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      break;
    }
  }

  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
  state.line = nextLine;
  token = state.push('paragraph_open', 'p', 1);
  token.map = [startLine, state.line];
  token = state.push('inline', '', 0);
  token.content = content;
  token.map = [startLine, state.line];
  token.children = [];
  token = state.push('paragraph_close', 'p', -1);
  state.parentType = oldParentType;
  return true;
};

var isSpace$6 = utils.isSpace;

function StateBlock(src, md, env, tokens) {
  var ch, s, start, pos, len, indent, offset, indent_found;
  this.src = src; // link to parser instance

  this.md = md;
  this.env = env; //
  // Internal state vartiables
  //

  this.tokens = tokens;
  this.bMarks = []; // line begin offsets for fast jumps

  this.eMarks = []; // line end offsets for fast jumps

  this.tShift = []; // offsets of the first non-space characters (tabs not expanded)

  this.sCount = []; // indents for each line (tabs expanded)
  // An amount of virtual spaces (tabs expanded) between beginning
  // of each line (bMarks) and real beginning of that line.
  //
  // It exists only as a hack because blockquotes override bMarks
  // losing information in the process.
  //
  // It's used only when expanding tabs, you can think about it as
  // an initial tab length, e.g. bsCount=21 applied to string `\t123`
  // means first tab should be expanded to 4-21%4 === 3 spaces.
  //

  this.bsCount = []; // block parser variables

  this.blkIndent = 0; // required block content indent (for example, if we are
  // inside a list, it would be positioned after list marker)

  this.line = 0; // line index in src

  this.lineMax = 0; // lines count

  this.tight = false; // loose/tight mode for lists

  this.ddIndent = -1; // indent of the current dd block (-1 if there isn't any)

  this.listIndent = -1; // indent of the current list block (-1 if there isn't any)
  // can be 'blockquote', 'list', 'root', 'paragraph' or 'reference'
  // used in lists to determine if they interrupt a paragraph

  this.parentType = 'root';
  this.level = 0; // renderer

  this.result = ''; // Create caches
  // Generate markers.

  s = this.src;
  indent_found = false;

  for (start = pos = indent = offset = 0, len = s.length; pos < len; pos++) {
    ch = s.charCodeAt(pos);

    if (!indent_found) {
      if (isSpace$6(ch)) {
        indent++;

        if (ch === 0x09) {
          offset += 4 - offset % 4;
        } else {
          offset++;
        }

        continue;
      } else {
        indent_found = true;
      }
    }

    if (ch === 0x0A || pos === len - 1) {
      if (ch !== 0x0A) {
        pos++;
      }

      this.bMarks.push(start);
      this.eMarks.push(pos);
      this.tShift.push(indent);
      this.sCount.push(offset);
      this.bsCount.push(0);
      indent_found = false;
      indent = 0;
      offset = 0;
      start = pos + 1;
    }
  } // Push fake entry to simplify cache bounds checks


  this.bMarks.push(s.length);
  this.eMarks.push(s.length);
  this.tShift.push(0);
  this.sCount.push(0);
  this.bsCount.push(0);
  this.lineMax = this.bMarks.length - 1; // don't count last fake line
} // Push new token to "stream".
//


StateBlock.prototype.push = function (type, tag, nesting) {
  var token$1 = new token(type, tag, nesting);
  token$1.block = true;
  if (nesting < 0) this.level--; // closing tag

  token$1.level = this.level;
  if (nesting > 0) this.level++; // opening tag

  this.tokens.push(token$1);
  return token$1;
};

StateBlock.prototype.isEmpty = function isEmpty(line) {
  return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
};

StateBlock.prototype.skipEmptyLines = function skipEmptyLines(from) {
  for (var max = this.lineMax; from < max; from++) {
    if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
      break;
    }
  }

  return from;
}; // Skip spaces from given position.


StateBlock.prototype.skipSpaces = function skipSpaces(pos) {
  var ch;

  for (var max = this.src.length; pos < max; pos++) {
    ch = this.src.charCodeAt(pos);

    if (!isSpace$6(ch)) {
      break;
    }
  }

  return pos;
}; // Skip spaces from given position in reverse.


StateBlock.prototype.skipSpacesBack = function skipSpacesBack(pos, min) {
  if (pos <= min) {
    return pos;
  }

  while (pos > min) {
    if (!isSpace$6(this.src.charCodeAt(--pos))) {
      return pos + 1;
    }
  }

  return pos;
}; // Skip char codes from given position


StateBlock.prototype.skipChars = function skipChars(pos, code) {
  for (var max = this.src.length; pos < max; pos++) {
    if (this.src.charCodeAt(pos) !== code) {
      break;
    }
  }

  return pos;
}; // Skip char codes reverse from given position - 1


StateBlock.prototype.skipCharsBack = function skipCharsBack(pos, code, min) {
  if (pos <= min) {
    return pos;
  }

  while (pos > min) {
    if (code !== this.src.charCodeAt(--pos)) {
      return pos + 1;
    }
  }

  return pos;
}; // cut lines range from source.


StateBlock.prototype.getLines = function getLines(begin, end, indent, keepLastLF) {
  var i,
      lineIndent,
      ch,
      first,
      last,
      queue,
      lineStart,
      line = begin;

  if (begin >= end) {
    return '';
  }

  queue = new Array(end - begin);

  for (i = 0; line < end; line++, i++) {
    lineIndent = 0;
    lineStart = first = this.bMarks[line];

    if (line + 1 < end || keepLastLF) {
      // No need for bounds check because we have fake entry on tail.
      last = this.eMarks[line] + 1;
    } else {
      last = this.eMarks[line];
    }

    while (first < last && lineIndent < indent) {
      ch = this.src.charCodeAt(first);

      if (isSpace$6(ch)) {
        if (ch === 0x09) {
          lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
        } else {
          lineIndent++;
        }
      } else if (first - lineStart < this.tShift[line]) {
        // patched tShift masked characters to look like spaces (blockquotes, list markers)
        lineIndent++;
      } else {
        break;
      }

      first++;
    }

    if (lineIndent > indent) {
      // partially expanding tabs in code blocks, e.g '\t\tfoobar'
      // with indent=2 becomes '  \tfoobar'
      queue[i] = new Array(lineIndent - indent + 1).join(' ') + this.src.slice(first, last);
    } else {
      queue[i] = this.src.slice(first, last);
    }
  }

  return queue.join('');
}; // re-export Token class to use in block rules


StateBlock.prototype.Token = token;
var state_block = StateBlock;

var _rules$1 = [// First 2 params - rule name & source. Secondary array - list of rules,
// which can be terminated by this one.
['table', table, ['paragraph', 'reference']], ['code', code], ['fence', fence, ['paragraph', 'reference', 'blockquote', 'list']], ['blockquote', blockquote, ['paragraph', 'reference', 'blockquote', 'list']], ['hr', hr, ['paragraph', 'reference', 'blockquote', 'list']], ['list', list, ['paragraph', 'reference', 'blockquote']], ['reference', reference], ['heading', heading, ['paragraph', 'reference', 'blockquote']], ['lheading', lheading], ['html_block', html_block, ['paragraph', 'reference', 'blockquote']], ['paragraph', paragraph]];
/**
 * new ParserBlock()
 **/

function ParserBlock() {
  /**
   * ParserBlock#ruler -> Ruler
   *
   * [[Ruler]] instance. Keep configuration of block rules.
   **/
  this.ruler = new ruler();

  for (var i = 0; i < _rules$1.length; i++) {
    this.ruler.push(_rules$1[i][0], _rules$1[i][1], {
      alt: (_rules$1[i][2] || []).slice()
    });
  }
} // Generate tokens for input range
//


ParserBlock.prototype.tokenize = function (state, startLine, endLine) {
  var ok,
      i,
      rules = this.ruler.getRules(''),
      len = rules.length,
      line = startLine,
      hasEmptyLines = false,
      maxNesting = state.md.options.maxNesting;

  while (line < endLine) {
    state.line = line = state.skipEmptyLines(line);

    if (line >= endLine) {
      break;
    } // Termination condition for nested calls.
    // Nested calls currently used for blockquotes & lists


    if (state.sCount[line] < state.blkIndent) {
      break;
    } // If nesting level exceeded - skip tail to the end. That's not ordinary
    // situation and we should not care about content.


    if (state.level >= maxNesting) {
      state.line = endLine;
      break;
    } // Try all possible rules.
    // On success, rule should:
    //
    // - update `state.line`
    // - update `state.tokens`
    // - return true


    for (i = 0; i < len; i++) {
      ok = rules[i](state, line, endLine, false);

      if (ok) {
        break;
      }
    } // set state.tight if we had an empty line before current tag
    // i.e. latest empty line should not count


    state.tight = !hasEmptyLines; // paragraph might "eat" one newline after it in nested lists

    if (state.isEmpty(state.line - 1)) {
      hasEmptyLines = true;
    }

    line = state.line;

    if (line < endLine && state.isEmpty(line)) {
      hasEmptyLines = true;
      line++;
      state.line = line;
    }
  }
};
/**
 * ParserBlock.parse(str, md, env, outTokens)
 *
 * Process input string and push block tokens into `outTokens`
 **/


ParserBlock.prototype.parse = function (src, md, env, outTokens) {
  var state;

  if (!src) {
    return;
  }

  state = new this.State(src, md, env, outTokens);
  this.tokenize(state, state.line, state.lineMax);
};

ParserBlock.prototype.State = state_block;
var parser_block = ParserBlock;

// Skip text characters for text token, place those to pending buffer
// '{}$%@~+=:' reserved for extentions
// !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~
// !!!! Don't confuse with "Markdown ASCII Punctuation" chars
// http://spec.commonmark.org/0.15/#ascii-punctuation-character

function isTerminatorChar(ch) {
  switch (ch) {
    case 0x0A
    /* \n */
    :
    case 0x21
    /* ! */
    :
    case 0x23
    /* # */
    :
    case 0x24
    /* $ */
    :
    case 0x25
    /* % */
    :
    case 0x26
    /* & */
    :
    case 0x2A
    /* * */
    :
    case 0x2B
    /* + */
    :
    case 0x2D
    /* - */
    :
    case 0x3A
    /* : */
    :
    case 0x3C
    /* < */
    :
    case 0x3D
    /* = */
    :
    case 0x3E
    /* > */
    :
    case 0x40
    /* @ */
    :
    case 0x5B
    /* [ */
    :
    case 0x5C
    /* \ */
    :
    case 0x5D
    /* ] */
    :
    case 0x5E
    /* ^ */
    :
    case 0x5F
    /* _ */
    :
    case 0x60
    /* ` */
    :
    case 0x7B
    /* { */
    :
    case 0x7D
    /* } */
    :
    case 0x7E
    /* ~ */
    :
      return true;

    default:
      return false;
  }
}

var text = function text(state, silent) {
  var pos = state.pos;

  while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) {
    pos++;
  }

  if (pos === state.pos) {
    return false;
  }

  if (!silent) {
    state.pending += state.src.slice(state.pos, pos);
  }

  state.pos = pos;
  return true;
}; // Alternative implementation, for memory.

var isSpace$7 = utils.isSpace;

var newline = function newline(state, silent) {
  var pmax,
      max,
      pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x0A
  /* \n */
  ) {
      return false;
    }

  pmax = state.pending.length - 1;
  max = state.posMax; // '  \n' -> hardbreak
  // Lookup in pending chars is bad practice! Don't copy to other rules!
  // Pending string is stored in concat mode, indexed lookups will cause
  // convertion to flat mode.

  if (!silent) {
    if (pmax >= 0 && state.pending.charCodeAt(pmax) === 0x20) {
      if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 0x20) {
        state.pending = state.pending.replace(/ +$/, '');
        state.push('hardbreak', 'br', 0);
      } else {
        state.pending = state.pending.slice(0, -1);
        state.push('softbreak', 'br', 0);
      }
    } else {
      state.push('softbreak', 'br', 0);
    }
  }

  pos++; // skip heading spaces for next line

  while (pos < max && isSpace$7(state.src.charCodeAt(pos))) {
    pos++;
  }

  state.pos = pos;
  return true;
};

var isSpace$8 = utils.isSpace;
var ESCAPED = [];

for (var i = 0; i < 256; i++) {
  ESCAPED.push(0);
}

'\\!"#$%&\'()*+,./:;<=>?@[]^_`{|}~-'.split('').forEach(function (ch) {
  ESCAPED[ch.charCodeAt(0)] = 1;
});

var _escape = function escape(state, silent) {
  var ch,
      pos = state.pos,
      max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x5C
  /* \ */
  ) {
      return false;
    }

  pos++;

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (ch < 256 && ESCAPED[ch] !== 0) {
      if (!silent) {
        state.pending += state.src[pos];
      }

      state.pos += 2;
      return true;
    }

    if (ch === 0x0A) {
      if (!silent) {
        state.push('hardbreak', 'br', 0);
      }

      pos++; // skip leading whitespaces from next line

      while (pos < max) {
        ch = state.src.charCodeAt(pos);

        if (!isSpace$8(ch)) {
          break;
        }

        pos++;
      }

      state.pos = pos;
      return true;
    }
  }

  if (!silent) {
    state.pending += '\\';
  }

  state.pos++;
  return true;
};

// Parse backticks

var backticks = function backtick(state, silent) {
  var start,
      max,
      marker,
      matchStart,
      matchEnd,
      token,
      pos = state.pos,
      ch = state.src.charCodeAt(pos);

  if (ch !== 0x60
  /* ` */
  ) {
      return false;
    }

  start = pos;
  pos++;
  max = state.posMax;

  while (pos < max && state.src.charCodeAt(pos) === 0x60
  /* ` */
  ) {
    pos++;
  }

  marker = state.src.slice(start, pos);
  matchStart = matchEnd = pos;

  while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
    matchEnd = matchStart + 1;

    while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60
    /* ` */
    ) {
      matchEnd++;
    }

    if (matchEnd - matchStart === marker.length) {
      if (!silent) {
        token = state.push('code_inline', 'code', 0);
        token.markup = marker;
        token.content = state.src.slice(pos, matchStart).replace(/\n/g, ' ').replace(/^ (.+) $/, '$1');
      }

      state.pos = matchEnd;
      return true;
    }
  }

  if (!silent) {
    state.pending += marker;
  }

  state.pos += marker.length;
  return true;
};

// ~~strike through~~
//

var tokenize = function strikethrough(state, silent) {
  var i,
      scanned,
      token,
      len,
      ch,
      start = state.pos,
      marker = state.src.charCodeAt(start);

  if (silent) {
    return false;
  }

  if (marker !== 0x7E
  /* ~ */
  ) {
      return false;
    }

  scanned = state.scanDelims(state.pos, true);
  len = scanned.length;
  ch = String.fromCharCode(marker);

  if (len < 2) {
    return false;
  }

  if (len % 2) {
    token = state.push('text', '', 0);
    token.content = ch;
    len--;
  }

  for (i = 0; i < len; i += 2) {
    token = state.push('text', '', 0);
    token.content = ch + ch;
    state.delimiters.push({
      marker: marker,
      jump: i,
      token: state.tokens.length - 1,
      level: state.level,
      end: -1,
      open: scanned.can_open,
      close: scanned.can_close
    });
  }

  state.pos += scanned.length;
  return true;
}; // Walk through delimiter list and replace text tokens with tags
//


var postProcess = function strikethrough(state) {
  var i,
      j,
      startDelim,
      endDelim,
      token,
      loneMarkers = [],
      delimiters = state.delimiters,
      max = state.delimiters.length;

  for (i = 0; i < max; i++) {
    startDelim = delimiters[i];

    if (startDelim.marker !== 0x7E
    /* ~ */
    ) {
        continue;
      }

    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end];
    token = state.tokens[startDelim.token];
    token.type = 's_open';
    token.tag = 's';
    token.nesting = 1;
    token.markup = '~~';
    token.content = '';
    token = state.tokens[endDelim.token];
    token.type = 's_close';
    token.tag = 's';
    token.nesting = -1;
    token.markup = '~~';
    token.content = '';

    if (state.tokens[endDelim.token - 1].type === 'text' && state.tokens[endDelim.token - 1].content === '~') {
      loneMarkers.push(endDelim.token - 1);
    }
  } // If a marker sequence has an odd number of characters, it's splitted
  // like this: `~~~~~` -> `~` + `~~` + `~~`, leaving one marker at the
  // start of the sequence.
  //
  // So, we have to move all those markers after subsequent s_close tags.
  //


  while (loneMarkers.length) {
    i = loneMarkers.pop();
    j = i + 1;

    while (j < state.tokens.length && state.tokens[j].type === 's_close') {
      j++;
    }

    j--;

    if (i !== j) {
      token = state.tokens[j];
      state.tokens[j] = state.tokens[i];
      state.tokens[i] = token;
    }
  }
};

var strikethrough = {
  tokenize: tokenize,
  postProcess: postProcess
};

// Process *this* and _that_
//

var tokenize$1 = function emphasis(state, silent) {
  var i,
      scanned,
      token,
      start = state.pos,
      marker = state.src.charCodeAt(start);

  if (silent) {
    return false;
  }

  if (marker !== 0x5F
  /* _ */
  && marker !== 0x2A
  /* * */
  ) {
      return false;
    }

  scanned = state.scanDelims(state.pos, marker === 0x2A);

  for (i = 0; i < scanned.length; i++) {
    token = state.push('text', '', 0);
    token.content = String.fromCharCode(marker);
    state.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker: marker,
      // Total length of these series of delimiters.
      //
      length: scanned.length,
      // An amount of characters before this one that's equivalent to
      // current one. In plain English: if this delimiter does not open
      // an emphasis, neither do previous `jump` characters.
      //
      // Used to skip sequences like "*****" in one step, for 1st asterisk
      // value will be 0, for 2nd it's 1 and so on.
      //
      jump: i,
      // A position of the token this delimiter corresponds to.
      //
      token: state.tokens.length - 1,
      // Token level.
      //
      level: state.level,
      // If this delimiter is matched as a valid opener, `end` will be
      // equal to its position, otherwise it's `-1`.
      //
      end: -1,
      // Boolean flags that determine if this delimiter could open or close
      // an emphasis.
      //
      open: scanned.can_open,
      close: scanned.can_close
    });
  }

  state.pos += scanned.length;
  return true;
}; // Walk through delimiter list and replace text tokens with tags
//


var postProcess$1 = function emphasis(state) {
  var i,
      startDelim,
      endDelim,
      token,
      ch,
      isStrong,
      delimiters = state.delimiters,
      max = state.delimiters.length;

  for (i = max - 1; i >= 0; i--) {
    startDelim = delimiters[i];

    if (startDelim.marker !== 0x5F
    /* _ */
    && startDelim.marker !== 0x2A
    /* * */
    ) {
        continue;
      } // Process only opening markers


    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end]; // If the previous delimiter has the same marker and is adjacent to this one,
    // merge those into one strong delimiter.
    //
    // `<em><em>whatever</em></em>` -> `<strong>whatever</strong>`
    //

    isStrong = i > 0 && delimiters[i - 1].end === startDelim.end + 1 && delimiters[i - 1].token === startDelim.token - 1 && delimiters[startDelim.end + 1].token === endDelim.token + 1 && delimiters[i - 1].marker === startDelim.marker;
    ch = String.fromCharCode(startDelim.marker);
    token = state.tokens[startDelim.token];
    token.type = isStrong ? 'strong_open' : 'em_open';
    token.tag = isStrong ? 'strong' : 'em';
    token.nesting = 1;
    token.markup = isStrong ? ch + ch : ch;
    token.content = '';
    token = state.tokens[endDelim.token];
    token.type = isStrong ? 'strong_close' : 'em_close';
    token.tag = isStrong ? 'strong' : 'em';
    token.nesting = -1;
    token.markup = isStrong ? ch + ch : ch;
    token.content = '';

    if (isStrong) {
      state.tokens[delimiters[i - 1].token].content = '';
      state.tokens[delimiters[startDelim.end + 1].token].content = '';
      i--;
    }
  }
};

var emphasis = {
  tokenize: tokenize$1,
  postProcess: postProcess$1
};

var normalizeReference$1 = utils.normalizeReference;
var isSpace$9 = utils.isSpace;

var link = function link(state, silent) {
  var attrs,
      code,
      label,
      labelEnd,
      labelStart,
      pos,
      res,
      ref,
      title,
      token,
      href = '',
      oldPos = state.pos,
      max = state.posMax,
      start = state.pos,
      parseReference = true;

  if (state.src.charCodeAt(state.pos) !== 0x5B
  /* [ */
  ) {
      return false;
    }

  labelStart = state.pos + 1;
  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true); // parser failed to find ']', so it's not a valid link

  if (labelEnd < 0) {
    return false;
  }

  pos = labelEnd + 1;

  if (pos < max && state.src.charCodeAt(pos) === 0x28
  /* ( */
  ) {
      //
      // Inline link
      //
      // might have found a valid shortcut link, disable reference parsing
      parseReference = false; // [link](  <href>  "title"  )
      //        ^^ skipping these spaces

      pos++;

      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);

        if (!isSpace$9(code) && code !== 0x0A) {
          break;
        }
      }

      if (pos >= max) {
        return false;
      } // [link](  <href>  "title"  )
      //          ^^^^^^ parsing link destination


      start = pos;
      res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);

      if (res.ok) {
        href = state.md.normalizeLink(res.str);

        if (state.md.validateLink(href)) {
          pos = res.pos;
        } else {
          href = '';
        }
      } // [link](  <href>  "title"  )
      //                ^^ skipping these spaces


      start = pos;

      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);

        if (!isSpace$9(code) && code !== 0x0A) {
          break;
        }
      } // [link](  <href>  "title"  )
      //                  ^^^^^^^ parsing link title


      res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);

      if (pos < max && start !== pos && res.ok) {
        title = res.str;
        pos = res.pos; // [link](  <href>  "title"  )
        //                         ^^ skipping these spaces

        for (; pos < max; pos++) {
          code = state.src.charCodeAt(pos);

          if (!isSpace$9(code) && code !== 0x0A) {
            break;
          }
        }
      } else {
        title = '';
      }

      if (pos >= max || state.src.charCodeAt(pos) !== 0x29
      /* ) */
      ) {
          // parsing a valid shortcut link failed, fallback to reference
          parseReference = true;
        }

      pos++;
    }

  if (parseReference) {
    //
    // Link reference
    //
    if (typeof state.env.references === 'undefined') {
      return false;
    }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B
    /* [ */
    ) {
        start = pos + 1;
        pos = state.md.helpers.parseLinkLabel(state, pos);

        if (pos >= 0) {
          label = state.src.slice(start, pos++);
        } else {
          pos = labelEnd + 1;
        }
      } else {
      pos = labelEnd + 1;
    } // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)


    if (!label) {
      label = state.src.slice(labelStart, labelEnd);
    }

    ref = state.env.references[normalizeReference$1(label)];

    if (!ref) {
      state.pos = oldPos;
      return false;
    }

    href = ref.href;
    title = ref.title;
  } //
  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //


  if (!silent) {
    state.pos = labelStart;
    state.posMax = labelEnd;
    token = state.push('link_open', 'a', 1);
    token.attrs = attrs = [['href', href]];

    if (title) {
      attrs.push(['title', title]);
    }

    state.md.inline.tokenize(state);
    token = state.push('link_close', 'a', -1);
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

var normalizeReference$2 = utils.normalizeReference;
var isSpace$a = utils.isSpace;

var image$1 = function image(state, silent) {
  var attrs,
      code,
      content,
      label,
      labelEnd,
      labelStart,
      pos,
      ref,
      res,
      title,
      token,
      tokens,
      start,
      href = '',
      oldPos = state.pos,
      max = state.posMax;

  if (state.src.charCodeAt(state.pos) !== 0x21
  /* ! */
  ) {
      return false;
    }

  if (state.src.charCodeAt(state.pos + 1) !== 0x5B
  /* [ */
  ) {
      return false;
    }

  labelStart = state.pos + 2;
  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false); // parser failed to find ']', so it's not a valid link

  if (labelEnd < 0) {
    return false;
  }

  pos = labelEnd + 1;

  if (pos < max && state.src.charCodeAt(pos) === 0x28
  /* ( */
  ) {
      //
      // Inline link
      //
      // [link](  <href>  "title"  )
      //        ^^ skipping these spaces
      pos++;

      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);

        if (!isSpace$a(code) && code !== 0x0A) {
          break;
        }
      }

      if (pos >= max) {
        return false;
      } // [link](  <href>  "title"  )
      //          ^^^^^^ parsing link destination


      start = pos;
      res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);

      if (res.ok) {
        href = state.md.normalizeLink(res.str);

        if (state.md.validateLink(href)) {
          pos = res.pos;
        } else {
          href = '';
        }
      } // [link](  <href>  "title"  )
      //                ^^ skipping these spaces


      start = pos;

      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);

        if (!isSpace$a(code) && code !== 0x0A) {
          break;
        }
      } // [link](  <href>  "title"  )
      //                  ^^^^^^^ parsing link title


      res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);

      if (pos < max && start !== pos && res.ok) {
        title = res.str;
        pos = res.pos; // [link](  <href>  "title"  )
        //                         ^^ skipping these spaces

        for (; pos < max; pos++) {
          code = state.src.charCodeAt(pos);

          if (!isSpace$a(code) && code !== 0x0A) {
            break;
          }
        }
      } else {
        title = '';
      }

      if (pos >= max || state.src.charCodeAt(pos) !== 0x29
      /* ) */
      ) {
          state.pos = oldPos;
          return false;
        }

      pos++;
    } else {
    //
    // Link reference
    //
    if (typeof state.env.references === 'undefined') {
      return false;
    }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B
    /* [ */
    ) {
        start = pos + 1;
        pos = state.md.helpers.parseLinkLabel(state, pos);

        if (pos >= 0) {
          label = state.src.slice(start, pos++);
        } else {
          pos = labelEnd + 1;
        }
      } else {
      pos = labelEnd + 1;
    } // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)


    if (!label) {
      label = state.src.slice(labelStart, labelEnd);
    }

    ref = state.env.references[normalizeReference$2(label)];

    if (!ref) {
      state.pos = oldPos;
      return false;
    }

    href = ref.href;
    title = ref.title;
  } //
  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //


  if (!silent) {
    content = state.src.slice(labelStart, labelEnd);
    state.md.inline.parse(content, state.md, state.env, tokens = []);
    token = state.push('image', 'img', 0);
    token.attrs = attrs = [['src', href], ['alt', '']];
    token.children = tokens;
    token.content = content;

    if (title) {
      attrs.push(['title', title]);
    }
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

// Process autolinks '<protocol:...>'
/*eslint max-len:0*/

var EMAIL_RE = /^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/;
var AUTOLINK_RE = /^<([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)>/;

var autolink = function autolink(state, silent) {
  var tail,
      linkMatch,
      emailMatch,
      url,
      fullUrl,
      token,
      pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x3C
  /* < */
  ) {
      return false;
    }

  tail = state.src.slice(pos);

  if (tail.indexOf('>') < 0) {
    return false;
  }

  if (AUTOLINK_RE.test(tail)) {
    linkMatch = tail.match(AUTOLINK_RE);
    url = linkMatch[0].slice(1, -1);
    fullUrl = state.md.normalizeLink(url);

    if (!state.md.validateLink(fullUrl)) {
      return false;
    }

    if (!silent) {
      token = state.push('link_open', 'a', 1);
      token.attrs = [['href', fullUrl]];
      token.markup = 'autolink';
      token.info = 'auto';
      token = state.push('text', '', 0);
      token.content = state.md.normalizeLinkText(url);
      token = state.push('link_close', 'a', -1);
      token.markup = 'autolink';
      token.info = 'auto';
    }

    state.pos += linkMatch[0].length;
    return true;
  }

  if (EMAIL_RE.test(tail)) {
    emailMatch = tail.match(EMAIL_RE);
    url = emailMatch[0].slice(1, -1);
    fullUrl = state.md.normalizeLink('mailto:' + url);

    if (!state.md.validateLink(fullUrl)) {
      return false;
    }

    if (!silent) {
      token = state.push('link_open', 'a', 1);
      token.attrs = [['href', fullUrl]];
      token.markup = 'autolink';
      token.info = 'auto';
      token = state.push('text', '', 0);
      token.content = state.md.normalizeLinkText(url);
      token = state.push('link_close', 'a', -1);
      token.markup = 'autolink';
      token.info = 'auto';
    }

    state.pos += emailMatch[0].length;
    return true;
  }

  return false;
};

var HTML_TAG_RE$1 = html_re.HTML_TAG_RE;

function isLetter(ch) {
  /*eslint no-bitwise:0*/
  var lc = ch | 0x20; // to lower case

  return lc >= 0x61
  /* a */
  && lc <= 0x7a
  /* z */
  ;
}

var html_inline = function html_inline(state, silent) {
  var ch,
      match,
      max,
      token,
      pos = state.pos;

  if (!state.md.options.html) {
    return false;
  } // Check start


  max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x3C
  /* < */
  || pos + 2 >= max) {
    return false;
  } // Quick fail on second char


  ch = state.src.charCodeAt(pos + 1);

  if (ch !== 0x21
  /* ! */
  && ch !== 0x3F
  /* ? */
  && ch !== 0x2F
  /* / */
  && !isLetter(ch)) {
    return false;
  }

  match = state.src.slice(pos).match(HTML_TAG_RE$1);

  if (!match) {
    return false;
  }

  if (!silent) {
    token = state.push('html_inline', '', 0);
    token.content = state.src.slice(pos, pos + match[0].length);
  }

  state.pos += match[0].length;
  return true;
};

var has = utils.has;
var isValidEntityCode = utils.isValidEntityCode;
var fromCodePoint = utils.fromCodePoint;
var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
var NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;

var entity = function entity(state, silent) {
  var ch,
      code,
      match,
      pos = state.pos,
      max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x26
  /* & */
  ) {
      return false;
    }

  if (pos + 1 < max) {
    ch = state.src.charCodeAt(pos + 1);

    if (ch === 0x23
    /* # */
    ) {
        match = state.src.slice(pos).match(DIGITAL_RE);

        if (match) {
          if (!silent) {
            code = match[1][0].toLowerCase() === 'x' ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
            state.pending += isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(0xFFFD);
          }

          state.pos += match[0].length;
          return true;
        }
      } else {
      match = state.src.slice(pos).match(NAMED_RE);

      if (match) {
        if (has(entities$2, match[1])) {
          if (!silent) {
            state.pending += entities$2[match[1]];
          }

          state.pos += match[0].length;
          return true;
        }
      }
    }
  }

  if (!silent) {
    state.pending += '&';
  }

  state.pos++;
  return true;
};

// For each opening emphasis-like marker find a matching closing one

var balance_pairs = function link_pairs(state) {
  var i,
      j,
      lastDelim,
      currDelim,
      delimiters = state.delimiters,
      max = state.delimiters.length;

  for (i = 0; i < max; i++) {
    lastDelim = delimiters[i];

    if (!lastDelim.close) {
      continue;
    }

    j = i - lastDelim.jump - 1;

    while (j >= 0) {
      currDelim = delimiters[j];

      if (currDelim.open && currDelim.marker === lastDelim.marker && currDelim.end < 0 && currDelim.level === lastDelim.level) {
        var odd_match = false; // typeofs are for backward compatibility with plugins

        if ((currDelim.close || lastDelim.open) && typeof currDelim.length !== 'undefined' && typeof lastDelim.length !== 'undefined') {
          // from spec:
          // sum of the lengths [...] must not be a multiple of 3
          // unless both lengths are multiples of 3
          if ((currDelim.length + lastDelim.length) % 3 === 0) {
            if (currDelim.length % 3 !== 0 || lastDelim.length % 3 !== 0) {
              odd_match = true;
            }
          }
        }

        if (!odd_match) {
          lastDelim.jump = i - j;
          lastDelim.open = false;
          currDelim.end = i;
          currDelim.jump = 0;
          break;
        }
      }

      j -= currDelim.jump + 1;
    }
  }
};

// Clean up tokens after emphasis and strikethrough postprocessing:

var text_collapse = function text_collapse(state) {
  var curr,
      last,
      level = 0,
      tokens = state.tokens,
      max = state.tokens.length;

  for (curr = last = 0; curr < max; curr++) {
    // re-calculate levels after emphasis/strikethrough turns some text nodes
    // into opening/closing tags
    if (tokens[curr].nesting < 0) level--; // closing tag

    tokens[curr].level = level;
    if (tokens[curr].nesting > 0) level++; // opening tag

    if (tokens[curr].type === 'text' && curr + 1 < max && tokens[curr + 1].type === 'text') {
      // collapse two adjacent text nodes
      tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
    } else {
      if (curr !== last) {
        tokens[last] = tokens[curr];
      }

      last++;
    }
  }

  if (curr !== last) {
    tokens.length = last;
  }
};

var isWhiteSpace$1 = utils.isWhiteSpace;
var isPunctChar$1 = utils.isPunctChar;
var isMdAsciiPunct$1 = utils.isMdAsciiPunct;

function StateInline(src, md, env, outTokens) {
  this.src = src;
  this.env = env;
  this.md = md;
  this.tokens = outTokens;
  this.pos = 0;
  this.posMax = this.src.length;
  this.level = 0;
  this.pending = '';
  this.pendingLevel = 0;
  this.cache = {}; // Stores { start: end } pairs. Useful for backtrack
  // optimization of pairs parse (emphasis, strikes).

  this.delimiters = []; // Emphasis-like delimiters
} // Flush pending text
//


StateInline.prototype.pushPending = function () {
  var token$1 = new token('text', '', 0);
  token$1.content = this.pending;
  token$1.level = this.pendingLevel;
  this.tokens.push(token$1);
  this.pending = '';
  return token$1;
}; // Push new token to "stream".
// If pending text exists - flush it as text token
//


StateInline.prototype.push = function (type, tag, nesting) {
  if (this.pending) {
    this.pushPending();
  }

  var token$1 = new token(type, tag, nesting);
  if (nesting < 0) this.level--; // closing tag

  token$1.level = this.level;
  if (nesting > 0) this.level++; // opening tag

  this.pendingLevel = this.level;
  this.tokens.push(token$1);
  return token$1;
}; // Scan a sequence of emphasis-like markers, and determine whether
// it can start an emphasis sequence or end an emphasis sequence.
//
//  - start - position to scan from (it should point at a valid marker);
//  - canSplitWord - determine if these markers can be found inside a word
//


StateInline.prototype.scanDelims = function (start, canSplitWord) {
  var pos = start,
      lastChar,
      nextChar,
      count,
      can_open,
      can_close,
      isLastWhiteSpace,
      isLastPunctChar,
      isNextWhiteSpace,
      isNextPunctChar,
      left_flanking = true,
      right_flanking = true,
      max = this.posMax,
      marker = this.src.charCodeAt(start); // treat beginning of the line as a whitespace

  lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;

  while (pos < max && this.src.charCodeAt(pos) === marker) {
    pos++;
  }

  count = pos - start; // treat end of the line as a whitespace

  nextChar = pos < max ? this.src.charCodeAt(pos) : 0x20;
  isLastPunctChar = isMdAsciiPunct$1(lastChar) || isPunctChar$1(String.fromCharCode(lastChar));
  isNextPunctChar = isMdAsciiPunct$1(nextChar) || isPunctChar$1(String.fromCharCode(nextChar));
  isLastWhiteSpace = isWhiteSpace$1(lastChar);
  isNextWhiteSpace = isWhiteSpace$1(nextChar);

  if (isNextWhiteSpace) {
    left_flanking = false;
  } else if (isNextPunctChar) {
    if (!(isLastWhiteSpace || isLastPunctChar)) {
      left_flanking = false;
    }
  }

  if (isLastWhiteSpace) {
    right_flanking = false;
  } else if (isLastPunctChar) {
    if (!(isNextWhiteSpace || isNextPunctChar)) {
      right_flanking = false;
    }
  }

  if (!canSplitWord) {
    can_open = left_flanking && (!right_flanking || isLastPunctChar);
    can_close = right_flanking && (!left_flanking || isNextPunctChar);
  } else {
    can_open = left_flanking;
    can_close = right_flanking;
  }

  return {
    can_open: can_open,
    can_close: can_close,
    length: count
  };
}; // re-export Token class to use in block rules


StateInline.prototype.Token = token;
var state_inline = StateInline;

// Parser rules


var _rules$2 = [['text', text], ['newline', newline], ['escape', _escape], ['backticks', backticks], ['strikethrough', strikethrough.tokenize], ['emphasis', emphasis.tokenize], ['link', link], ['image', image$1], ['autolink', autolink], ['html_inline', html_inline], ['entity', entity]];
var _rules2 = [['balance_pairs', balance_pairs], ['strikethrough', strikethrough.postProcess], ['emphasis', emphasis.postProcess], ['text_collapse', text_collapse]];
/**
 * new ParserInline()
 **/

function ParserInline() {
  var i;
  /**
   * ParserInline#ruler -> Ruler
   *
   * [[Ruler]] instance. Keep configuration of inline rules.
   **/

  this.ruler = new ruler();

  for (i = 0; i < _rules$2.length; i++) {
    this.ruler.push(_rules$2[i][0], _rules$2[i][1]);
  }
  /**
   * ParserInline#ruler2 -> Ruler
   *
   * [[Ruler]] instance. Second ruler used for post-processing
   * (e.g. in emphasis-like rules).
   **/


  this.ruler2 = new ruler();

  for (i = 0; i < _rules2.length; i++) {
    this.ruler2.push(_rules2[i][0], _rules2[i][1]);
  }
} // Skip single token by running all rules in validation mode;
// returns `true` if any rule reported success
//


ParserInline.prototype.skipToken = function (state) {
  var ok,
      i,
      pos = state.pos,
      rules = this.ruler.getRules(''),
      len = rules.length,
      maxNesting = state.md.options.maxNesting,
      cache = state.cache;

  if (typeof cache[pos] !== 'undefined') {
    state.pos = cache[pos];
    return;
  }

  if (state.level < maxNesting) {
    for (i = 0; i < len; i++) {
      // Increment state.level and decrement it later to limit recursion.
      // It's harmless to do here, because no tokens are created. But ideally,
      // we'd need a separate private state variable for this purpose.
      //
      state.level++;
      ok = rules[i](state, true);
      state.level--;

      if (ok) {
        break;
      }
    }
  } else {
    // Too much nesting, just skip until the end of the paragraph.
    //
    // NOTE: this will cause links to behave incorrectly in the following case,
    //       when an amount of `[` is exactly equal to `maxNesting + 1`:
    //
    //       [[[[[[[[[[[[[[[[[[[[[foo]()
    //
    // TODO: remove this workaround when CM standard will allow nested links
    //       (we can replace it by preventing links from being parsed in
    //       validation mode)
    //
    state.pos = state.posMax;
  }

  if (!ok) {
    state.pos++;
  }

  cache[pos] = state.pos;
}; // Generate tokens for input range
//


ParserInline.prototype.tokenize = function (state) {
  var ok,
      i,
      rules = this.ruler.getRules(''),
      len = rules.length,
      end = state.posMax,
      maxNesting = state.md.options.maxNesting;

  while (state.pos < end) {
    // Try all possible rules.
    // On success, rule should:
    //
    // - update `state.pos`
    // - update `state.tokens`
    // - return true
    if (state.level < maxNesting) {
      for (i = 0; i < len; i++) {
        ok = rules[i](state, false);

        if (ok) {
          break;
        }
      }
    }

    if (ok) {
      if (state.pos >= end) {
        break;
      }

      continue;
    }

    state.pending += state.src[state.pos++];
  }

  if (state.pending) {
    state.pushPending();
  }
};
/**
 * ParserInline.parse(str, md, env, outTokens)
 *
 * Process input string and push inline tokens into `outTokens`
 **/


ParserInline.prototype.parse = function (str, md, env, outTokens) {
  var i, rules, len;
  var state = new this.State(str, md, env, outTokens);
  this.tokenize(state);
  rules = this.ruler2.getRules('');
  len = rules.length;

  for (i = 0; i < len; i++) {
    rules[i](state);
  }
};

ParserInline.prototype.State = state_inline;
var parser_inline = ParserInline;

var re = function (opts) {
  var re = {}; // Use direct extract instead of `regenerate` to reduse browserified size

  re.src_Any = regex$1.source;
  re.src_Cc = regex$2.source;
  re.src_Z = regex$4.source;
  re.src_P = regex.source; // \p{\Z\P\Cc\CF} (white spaces + control + format + punctuation)

  re.src_ZPCc = [re.src_Z, re.src_P, re.src_Cc].join('|'); // \p{\Z\Cc} (white spaces + control)

  re.src_ZCc = [re.src_Z, re.src_Cc].join('|'); // Experimental. List of chars, completely prohibited in links
  // because can separate it from other part of text

  var text_separators = '[><\uff5c]'; // All possible word characters (everything without punctuation, spaces & controls)
  // Defined via punctuation & spaces to save space
  // Should be something like \p{\L\N\S\M} (\w but without `_`)

  re.src_pseudo_letter = '(?:(?!' + text_separators + '|' + re.src_ZPCc + ')' + re.src_Any + ')'; // The same as abothe but without [0-9]
  // var src_pseudo_letter_non_d = '(?:(?![0-9]|' + src_ZPCc + ')' + src_Any + ')';
  ////////////////////////////////////////////////////////////////////////////////

  re.src_ip4 = '(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)'; // Prohibit any of "@/[]()" in user/pass to avoid wrong domain fetch.

  re.src_auth = '(?:(?:(?!' + re.src_ZCc + '|[@/\\[\\]()]).)+@)?';
  re.src_port = '(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?';
  re.src_host_terminator = '(?=$|' + text_separators + '|' + re.src_ZPCc + ')(?!-|_|:\\d|\\.-|\\.(?!$|' + re.src_ZPCc + '))';
  re.src_path = '(?:' + '[/?#]' + '(?:' + '(?!' + re.src_ZCc + '|' + text_separators + '|[()[\\]{}.,"\'?!\\-]).|' + '\\[(?:(?!' + re.src_ZCc + '|\\]).)*\\]|' + '\\((?:(?!' + re.src_ZCc + '|[)]).)*\\)|' + '\\{(?:(?!' + re.src_ZCc + '|[}]).)*\\}|' + '\\"(?:(?!' + re.src_ZCc + '|["]).)+\\"|' + "\\'(?:(?!" + re.src_ZCc + "|[']).)+\\'|" + "\\'(?=" + re.src_pseudo_letter + '|[-]).|' + // allow `I'm_king` if no pair found
  '\\.{2,4}[a-zA-Z0-9%/]|' + // github has ... in commit range links,
  // google has .... in links (issue #66)
  // Restrict to
  // - english
  // - percent-encoded
  // - parts of file path
  // until more examples found.
  '\\.(?!' + re.src_ZCc + '|[.]).|' + (opts && opts['---'] ? '\\-(?!--(?:[^-]|$))(?:-*)|' // `---` => long dash, terminate
  : '\\-+|') + '\\,(?!' + re.src_ZCc + ').|' + // allow `,,,` in paths
  '\\!(?!' + re.src_ZCc + '|[!]).|' + '\\?(?!' + re.src_ZCc + '|[?]).' + ')+' + '|\\/' + ')?'; // Allow anything in markdown spec, forbid quote (") at the first position
  // because emails enclosed in quotes are far more common

  re.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*';
  re.src_xn = 'xn--[a-z0-9\\-]{1,59}'; // More to read about domain names
  // http://serverfault.com/questions/638260/

  re.src_domain_root = // Allow letters & digits (http://test1)
  '(?:' + re.src_xn + '|' + re.src_pseudo_letter + '{1,63}' + ')';
  re.src_domain = '(?:' + re.src_xn + '|' + '(?:' + re.src_pseudo_letter + ')' + '|' + '(?:' + re.src_pseudo_letter + '(?:-|' + re.src_pseudo_letter + '){0,61}' + re.src_pseudo_letter + ')' + ')';
  re.src_host = '(?:' + // Don't need IP check, because digits are already allowed in normal domain names
  //   src_ip4 +
  // '|' +
  '(?:(?:(?:' + re.src_domain + ')\\.)*' + re.src_domain
  /*_root*/
  + ')' + ')';
  re.tpl_host_fuzzy = '(?:' + re.src_ip4 + '|' + '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))' + ')';
  re.tpl_host_no_ip_fuzzy = '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))';
  re.src_host_strict = re.src_host + re.src_host_terminator;
  re.tpl_host_fuzzy_strict = re.tpl_host_fuzzy + re.src_host_terminator;
  re.src_host_port_strict = re.src_host + re.src_port + re.src_host_terminator;
  re.tpl_host_port_fuzzy_strict = re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;
  re.tpl_host_port_no_ip_fuzzy_strict = re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator; ////////////////////////////////////////////////////////////////////////////////
  // Main rules
  // Rude test fuzzy links by host, for quick deny

  re.tpl_host_fuzzy_test = 'localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:' + re.src_ZPCc + '|>|$))';
  re.tpl_email_fuzzy = '(^|' + text_separators + '|"|\\(|' + re.src_ZCc + ')' + '(' + re.src_email_name + '@' + re.tpl_host_fuzzy_strict + ')';
  re.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' + '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_fuzzy_strict + re.src_path + ')';
  re.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' + '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_no_ip_fuzzy_strict + re.src_path + ')';
  return re;
};

// Helpers
// Merge objects
//


function assign$1(obj
/*from1, from2, from3, ...*/
) {
  var sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function (source) {
    if (!source) {
      return;
    }

    Object.keys(source).forEach(function (key) {
      obj[key] = source[key];
    });
  });
  return obj;
}

function _class(obj) {
  return Object.prototype.toString.call(obj);
}

function isString(obj) {
  return _class(obj) === '[object String]';
}

function isObject(obj) {
  return _class(obj) === '[object Object]';
}

function isRegExp(obj) {
  return _class(obj) === '[object RegExp]';
}

function isFunction(obj) {
  return _class(obj) === '[object Function]';
}

function escapeRE(str) {
  return str.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
} ////////////////////////////////////////////////////////////////////////////////


var defaultOptions = {
  fuzzyLink: true,
  fuzzyEmail: true,
  fuzzyIP: false
};

function isOptionsObj(obj) {
  return Object.keys(obj || {}).reduce(function (acc, k) {
    return acc || defaultOptions.hasOwnProperty(k);
  }, false);
}

var defaultSchemas = {
  'http:': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.http) {
        // compile lazily, because "host"-containing variables can change on tlds update.
        self.re.http = new RegExp('^\\/\\/' + self.re.src_auth + self.re.src_host_port_strict + self.re.src_path, 'i');
      }

      if (self.re.http.test(tail)) {
        return tail.match(self.re.http)[0].length;
      }

      return 0;
    }
  },
  'https:': 'http:',
  'ftp:': 'http:',
  '//': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.no_http) {
        // compile lazily, because "host"-containing variables can change on tlds update.
        self.re.no_http = new RegExp('^' + self.re.src_auth + // Don't allow single-level domains, because of false positives like '//test'
        // with code comments
        '(?:localhost|(?:(?:' + self.re.src_domain + ')\\.)+' + self.re.src_domain_root + ')' + self.re.src_port + self.re.src_host_terminator + self.re.src_path, 'i');
      }

      if (self.re.no_http.test(tail)) {
        // should not be `://` & `///`, that protects from errors in protocol name
        if (pos >= 3 && text[pos - 3] === ':') {
          return 0;
        }

        if (pos >= 3 && text[pos - 3] === '/') {
          return 0;
        }

        return tail.match(self.re.no_http)[0].length;
      }

      return 0;
    }
  },
  'mailto:': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.mailto) {
        self.re.mailto = new RegExp('^' + self.re.src_email_name + '@' + self.re.src_host_strict, 'i');
      }

      if (self.re.mailto.test(tail)) {
        return tail.match(self.re.mailto)[0].length;
      }

      return 0;
    }
  }
};
/*eslint-disable max-len*/
// RE pattern for 2-character tlds (autogenerated by ./support/tlds_2char_gen.js)

var tlds_2ch_src_re = 'a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]'; // DON'T try to make PRs with changes. Extend TLDs with LinkifyIt.tlds() instead

var tlds_default = 'biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф'.split('|');
/*eslint-enable max-len*/
////////////////////////////////////////////////////////////////////////////////

function resetScanCache(self) {
  self.__index__ = -1;
  self.__text_cache__ = '';
}

function createValidator(re) {
  return function (text, pos) {
    var tail = text.slice(pos);

    if (re.test(tail)) {
      return tail.match(re)[0].length;
    }

    return 0;
  };
}

function createNormalizer() {
  return function (match, self) {
    self.normalize(match);
  };
} // Schemas compiler. Build regexps.
//


function compile(self) {
  // Load & clone RE patterns.
  var re$1 = self.re = re(self.__opts__); // Define dynamic patterns

  var tlds = self.__tlds__.slice();

  self.onCompile();

  if (!self.__tlds_replaced__) {
    tlds.push(tlds_2ch_src_re);
  }

  tlds.push(re$1.src_xn);
  re$1.src_tlds = tlds.join('|');

  function untpl(tpl) {
    return tpl.replace('%TLDS%', re$1.src_tlds);
  }

  re$1.email_fuzzy = RegExp(untpl(re$1.tpl_email_fuzzy), 'i');
  re$1.link_fuzzy = RegExp(untpl(re$1.tpl_link_fuzzy), 'i');
  re$1.link_no_ip_fuzzy = RegExp(untpl(re$1.tpl_link_no_ip_fuzzy), 'i');
  re$1.host_fuzzy_test = RegExp(untpl(re$1.tpl_host_fuzzy_test), 'i'); //
  // Compile each schema
  //

  var aliases = [];
  self.__compiled__ = {}; // Reset compiled data

  function schemaError(name, val) {
    throw new Error('(LinkifyIt) Invalid schema "' + name + '": ' + val);
  }

  Object.keys(self.__schemas__).forEach(function (name) {
    var val = self.__schemas__[name]; // skip disabled methods

    if (val === null) {
      return;
    }

    var compiled = {
      validate: null,
      link: null
    };
    self.__compiled__[name] = compiled;

    if (isObject(val)) {
      if (isRegExp(val.validate)) {
        compiled.validate = createValidator(val.validate);
      } else if (isFunction(val.validate)) {
        compiled.validate = val.validate;
      } else {
        schemaError(name, val);
      }

      if (isFunction(val.normalize)) {
        compiled.normalize = val.normalize;
      } else if (!val.normalize) {
        compiled.normalize = createNormalizer();
      } else {
        schemaError(name, val);
      }

      return;
    }

    if (isString(val)) {
      aliases.push(name);
      return;
    }

    schemaError(name, val);
  }); //
  // Compile postponed aliases
  //

  aliases.forEach(function (alias) {
    if (!self.__compiled__[self.__schemas__[alias]]) {
      // Silently fail on missed schemas to avoid errons on disable.
      // schemaError(alias, self.__schemas__[alias]);
      return;
    }

    self.__compiled__[alias].validate = self.__compiled__[self.__schemas__[alias]].validate;
    self.__compiled__[alias].normalize = self.__compiled__[self.__schemas__[alias]].normalize;
  }); //
  // Fake record for guessed links
  //

  self.__compiled__[''] = {
    validate: null,
    normalize: createNormalizer()
  }; //
  // Build schema condition
  //

  var slist = Object.keys(self.__compiled__).filter(function (name) {
    // Filter disabled & fake schemas
    return name.length > 0 && self.__compiled__[name];
  }).map(escapeRE).join('|'); // (?!_) cause 1.5x slowdown

  self.re.schema_test = RegExp('(^|(?!_)(?:[><\uff5c]|' + re$1.src_ZPCc + '))(' + slist + ')', 'i');
  self.re.schema_search = RegExp('(^|(?!_)(?:[><\uff5c]|' + re$1.src_ZPCc + '))(' + slist + ')', 'ig');
  self.re.pretest = RegExp('(' + self.re.schema_test.source + ')|(' + self.re.host_fuzzy_test.source + ')|@', 'i'); //
  // Cleanup
  //

  resetScanCache(self);
}
/**
 * class Match
 *
 * Match result. Single element of array, returned by [[LinkifyIt#match]]
 **/


function Match(self, shift) {
  var start = self.__index__,
      end = self.__last_index__,
      text = self.__text_cache__.slice(start, end);
  /**
   * Match#schema -> String
   *
   * Prefix (protocol) for matched string.
   **/


  this.schema = self.__schema__.toLowerCase();
  /**
   * Match#index -> Number
   *
   * First position of matched string.
   **/

  this.index = start + shift;
  /**
   * Match#lastIndex -> Number
   *
   * Next position after matched string.
   **/

  this.lastIndex = end + shift;
  /**
   * Match#raw -> String
   *
   * Matched string.
   **/

  this.raw = text;
  /**
   * Match#text -> String
   *
   * Notmalized text of matched string.
   **/

  this.text = text;
  /**
   * Match#url -> String
   *
   * Normalized url of matched string.
   **/

  this.url = text;
}

function createMatch(self, shift) {
  var match = new Match(self, shift);

  self.__compiled__[match.schema].normalize(match, self);

  return match;
}
/**
 * class LinkifyIt
 **/

/**
 * new LinkifyIt(schemas, options)
 * - schemas (Object): Optional. Additional schemas to validate (prefix/validator)
 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
 *
 * Creates new linkifier instance with optional additional schemas.
 * Can be called without `new` keyword for convenience.
 *
 * By default understands:
 *
 * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
 * - "fuzzy" links and emails (example.com, foo@bar.com).
 *
 * `schemas` is an object, where each key/value describes protocol/rule:
 *
 * - __key__ - link prefix (usually, protocol name with `:` at the end, `skype:`
 *   for example). `linkify-it` makes shure that prefix is not preceeded with
 *   alphanumeric char and symbols. Only whitespaces and punctuation allowed.
 * - __value__ - rule to check tail after link prefix
 *   - _String_ - just alias to existing rule
 *   - _Object_
 *     - _validate_ - validator function (should return matched length on success),
 *       or `RegExp`.
 *     - _normalize_ - optional function to normalize text & url of matched result
 *       (for example, for @twitter mentions).
 *
 * `options`:
 *
 * - __fuzzyLink__ - recognige URL-s without `http(s):` prefix. Default `true`.
 * - __fuzzyIP__ - allow IPs in fuzzy links above. Can conflict with some texts
 *   like version numbers. Default `false`.
 * - __fuzzyEmail__ - recognize emails without `mailto:` prefix.
 *
 **/


function LinkifyIt(schemas, options) {
  if (!(this instanceof LinkifyIt)) {
    return new LinkifyIt(schemas, options);
  }

  if (!options) {
    if (isOptionsObj(schemas)) {
      options = schemas;
      schemas = {};
    }
  }

  this.__opts__ = assign$1({}, defaultOptions, options); // Cache last tested result. Used to skip repeating steps on next `match` call.

  this.__index__ = -1;
  this.__last_index__ = -1; // Next scan position

  this.__schema__ = '';
  this.__text_cache__ = '';
  this.__schemas__ = assign$1({}, defaultSchemas, schemas);
  this.__compiled__ = {};
  this.__tlds__ = tlds_default;
  this.__tlds_replaced__ = false;
  this.re = {};
  compile(this);
}
/** chainable
 * LinkifyIt#add(schema, definition)
 * - schema (String): rule name (fixed pattern prefix)
 * - definition (String|RegExp|Object): schema definition
 *
 * Add new rule definition. See constructor description for details.
 **/


LinkifyIt.prototype.add = function add(schema, definition) {
  this.__schemas__[schema] = definition;
  compile(this);
  return this;
};
/** chainable
 * LinkifyIt#set(options)
 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
 *
 * Set recognition options for links without schema.
 **/


LinkifyIt.prototype.set = function set(options) {
  this.__opts__ = assign$1(this.__opts__, options);
  return this;
};
/**
 * LinkifyIt#test(text) -> Boolean
 *
 * Searches linkifiable pattern and returns `true` on success or `false` on fail.
 **/


LinkifyIt.prototype.test = function test(text) {
  // Reset scan cache
  this.__text_cache__ = text;
  this.__index__ = -1;

  if (!text.length) {
    return false;
  }

  var m, ml, me, len, shift, next, re, tld_pos, at_pos; // try to scan for link with schema - that's the most simple rule

  if (this.re.schema_test.test(text)) {
    re = this.re.schema_search;
    re.lastIndex = 0;

    while ((m = re.exec(text)) !== null) {
      len = this.testSchemaAt(text, m[2], re.lastIndex);

      if (len) {
        this.__schema__ = m[2];
        this.__index__ = m.index + m[1].length;
        this.__last_index__ = m.index + m[0].length + len;
        break;
      }
    }
  }

  if (this.__opts__.fuzzyLink && this.__compiled__['http:']) {
    // guess schemaless links
    tld_pos = text.search(this.re.host_fuzzy_test);

    if (tld_pos >= 0) {
      // if tld is located after found link - no need to check fuzzy pattern
      if (this.__index__ < 0 || tld_pos < this.__index__) {
        if ((ml = text.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null) {
          shift = ml.index + ml[1].length;

          if (this.__index__ < 0 || shift < this.__index__) {
            this.__schema__ = '';
            this.__index__ = shift;
            this.__last_index__ = ml.index + ml[0].length;
          }
        }
      }
    }
  }

  if (this.__opts__.fuzzyEmail && this.__compiled__['mailto:']) {
    // guess schemaless emails
    at_pos = text.indexOf('@');

    if (at_pos >= 0) {
      // We can't skip this check, because this cases are possible:
      // 192.168.1.1@gmail.com, my.in@example.com
      if ((me = text.match(this.re.email_fuzzy)) !== null) {
        shift = me.index + me[1].length;
        next = me.index + me[0].length;

        if (this.__index__ < 0 || shift < this.__index__ || shift === this.__index__ && next > this.__last_index__) {
          this.__schema__ = 'mailto:';
          this.__index__ = shift;
          this.__last_index__ = next;
        }
      }
    }
  }

  return this.__index__ >= 0;
};
/**
 * LinkifyIt#pretest(text) -> Boolean
 *
 * Very quick check, that can give false positives. Returns true if link MAY BE
 * can exists. Can be used for speed optimization, when you need to check that
 * link NOT exists.
 **/


LinkifyIt.prototype.pretest = function pretest(text) {
  return this.re.pretest.test(text);
};
/**
 * LinkifyIt#testSchemaAt(text, name, position) -> Number
 * - text (String): text to scan
 * - name (String): rule (schema) name
 * - position (Number): text offset to check from
 *
 * Similar to [[LinkifyIt#test]] but checks only specific protocol tail exactly
 * at given position. Returns length of found pattern (0 on fail).
 **/


LinkifyIt.prototype.testSchemaAt = function testSchemaAt(text, schema, pos) {
  // If not supported schema check requested - terminate
  if (!this.__compiled__[schema.toLowerCase()]) {
    return 0;
  }

  return this.__compiled__[schema.toLowerCase()].validate(text, pos, this);
};
/**
 * LinkifyIt#match(text) -> Array|null
 *
 * Returns array of found link descriptions or `null` on fail. We strongly
 * recommend to use [[LinkifyIt#test]] first, for best speed.
 *
 * ##### Result match description
 *
 * - __schema__ - link schema, can be empty for fuzzy links, or `//` for
 *   protocol-neutral  links.
 * - __index__ - offset of matched text
 * - __lastIndex__ - index of next char after mathch end
 * - __raw__ - matched text
 * - __text__ - normalized text
 * - __url__ - link, generated from matched text
 **/


LinkifyIt.prototype.match = function match(text) {
  var shift = 0,
      result = []; // Try to take previous element from cache, if .test() called before

  if (this.__index__ >= 0 && this.__text_cache__ === text) {
    result.push(createMatch(this, shift));
    shift = this.__last_index__;
  } // Cut head if cache was used


  var tail = shift ? text.slice(shift) : text; // Scan string until end reached

  while (this.test(tail)) {
    result.push(createMatch(this, shift));
    tail = tail.slice(this.__last_index__);
    shift += this.__last_index__;
  }

  if (result.length) {
    return result;
  }

  return null;
};
/** chainable
 * LinkifyIt#tlds(list [, keepOld]) -> this
 * - list (Array): list of tlds
 * - keepOld (Boolean): merge with current list if `true` (`false` by default)
 *
 * Load (or merge) new tlds list. Those are user for fuzzy links (without prefix)
 * to avoid false positives. By default this algorythm used:
 *
 * - hostname with any 2-letter root zones are ok.
 * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
 *   are ok.
 * - encoded (`xn--...`) root zones are ok.
 *
 * If list is replaced, then exact match for 2-chars root zones will be checked.
 **/


LinkifyIt.prototype.tlds = function tlds(list, keepOld) {
  list = Array.isArray(list) ? list : [list];

  if (!keepOld) {
    this.__tlds__ = list.slice();
    this.__tlds_replaced__ = true;
    compile(this);
    return this;
  }

  this.__tlds__ = this.__tlds__.concat(list).sort().filter(function (el, idx, arr) {
    return el !== arr[idx - 1];
  }).reverse();
  compile(this);
  return this;
};
/**
 * LinkifyIt#normalize(match)
 *
 * Default normalizer (if schema does not define it's own).
 **/


LinkifyIt.prototype.normalize = function normalize(match) {
  // Do minimal possible changes by default. Need to collect feedback prior
  // to move forward https://github.com/markdown-it/linkify-it/issues/1
  if (!match.schema) {
    match.url = 'http://' + match.url;
  }

  if (match.schema === 'mailto:' && !/^mailto:/i.test(match.url)) {
    match.url = 'mailto:' + match.url;
  }
};
/**
 * LinkifyIt#onCompile()
 *
 * Override to modify basic RegExp-s.
 **/


LinkifyIt.prototype.onCompile = function onCompile() {};

var linkifyIt = LinkifyIt;

/*! https://mths.be/punycode v1.4.1 by @mathias */

/** Highest positive signed 32-bit float value */
var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

/** Bootstring parameters */

var base = 36;
var tMin = 1;
var tMax = 26;
var skew = 38;
var damp = 700;
var initialBias = 72;
var initialN = 128; // 0x80

var delimiter = '-'; // '\x2D'

/** Regular expressions */

var regexPunycode = /^xn--/;
var regexNonASCII = /[^\x20-\x7E]/; // unprintable ASCII chars + non-ASCII chars

var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

/** Error messages */

var errors = {
  'overflow': 'Overflow: input needs wider integers to process',
  'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
  'invalid-input': 'Invalid input'
};
/** Convenience shortcuts */

var baseMinusTMin = base - tMin;
var floor = Math.floor;
var stringFromCharCode = String.fromCharCode;
/*--------------------------------------------------------------------------*/

/**
 * A generic error utility function.
 * @private
 * @param {String} type The error type.
 * @returns {Error} Throws a `RangeError` with the applicable error message.
 */

function error(type) {
  throw new RangeError(errors[type]);
}
/**
 * A generic `Array#map` utility function.
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} callback The function that gets called for every array
 * item.
 * @returns {Array} A new array of values returned by the callback function.
 */


function map$1(array, fn) {
  var length = array.length;
  var result = [];

  while (length--) {
    result[length] = fn(array[length]);
  }

  return result;
}
/**
 * A simple `Array#map`-like wrapper to work with domain name strings or email
 * addresses.
 * @private
 * @param {String} domain The domain name or email address.
 * @param {Function} callback The function that gets called for every
 * character.
 * @returns {Array} A new string of characters returned by the callback
 * function.
 */


function mapDomain(string, fn) {
  var parts = string.split('@');
  var result = '';

  if (parts.length > 1) {
    // In email addresses, only the domain name should be punycoded. Leave
    // the local part (i.e. everything up to `@`) intact.
    result = parts[0] + '@';
    string = parts[1];
  } // Avoid `split(regex)` for IE8 compatibility. See #17.


  string = string.replace(regexSeparators, '\x2E');
  var labels = string.split('.');
  var encoded = map$1(labels, fn).join('.');
  return result + encoded;
}
/**
 * Creates an array containing the numeric code points of each Unicode
 * character in the string. While JavaScript uses UCS-2 internally,
 * this function will convert a pair of surrogate halves (each of which
 * UCS-2 exposes as separate characters) into a single code point,
 * matching UTF-16.
 * @see `punycode.ucs2.encode`
 * @see <https://mathiasbynens.be/notes/javascript-encoding>
 * @memberOf punycode.ucs2
 * @name decode
 * @param {String} string The Unicode input string (UCS-2).
 * @returns {Array} The new array of code points.
 */


function ucs2decode(string) {
  var output = [],
      counter = 0,
      length = string.length,
      value,
      extra;

  while (counter < length) {
    value = string.charCodeAt(counter++);

    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
      // high surrogate, and there is a next character
      extra = string.charCodeAt(counter++);

      if ((extra & 0xFC00) == 0xDC00) {
        // low surrogate
        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
      } else {
        // unmatched surrogate; only append this code unit, in case the next
        // code unit is the high surrogate of a surrogate pair
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }

  return output;
}
/**
 * Creates a string based on an array of numeric code points.
 * @see `punycode.ucs2.decode`
 * @memberOf punycode.ucs2
 * @name encode
 * @param {Array} codePoints The array of numeric code points.
 * @returns {String} The new Unicode string (UCS-2).
 */


function ucs2encode(array) {
  return map$1(array, function (value) {
    var output = '';

    if (value > 0xFFFF) {
      value -= 0x10000;
      output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
      value = 0xDC00 | value & 0x3FF;
    }

    output += stringFromCharCode(value);
    return output;
  }).join('');
}
/**
 * Converts a basic code point into a digit/integer.
 * @see `digitToBasic()`
 * @private
 * @param {Number} codePoint The basic numeric code point value.
 * @returns {Number} The numeric value of a basic code point (for use in
 * representing integers) in the range `0` to `base - 1`, or `base` if
 * the code point does not represent a value.
 */


function basicToDigit(codePoint) {
  if (codePoint - 48 < 10) {
    return codePoint - 22;
  }

  if (codePoint - 65 < 26) {
    return codePoint - 65;
  }

  if (codePoint - 97 < 26) {
    return codePoint - 97;
  }

  return base;
}
/**
 * Converts a digit/integer into a basic code point.
 * @see `basicToDigit()`
 * @private
 * @param {Number} digit The numeric value of a basic code point.
 * @returns {Number} The basic code point whose value (when used for
 * representing integers) is `digit`, which needs to be in the range
 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
 * used; else, the lowercase form is used. The behavior is undefined
 * if `flag` is non-zero and `digit` has no uppercase form.
 */


function digitToBasic(digit, flag) {
  //  0..25 map to ASCII a..z or A..Z
  // 26..35 map to ASCII 0..9
  return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
}
/**
 * Bias adaptation function as per section 3.4 of RFC 3492.
 * https://tools.ietf.org/html/rfc3492#section-3.4
 * @private
 */


function adapt(delta, numPoints, firstTime) {
  var k = 0;
  delta = firstTime ? floor(delta / damp) : delta >> 1;
  delta += floor(delta / numPoints);

  for (;
  /* no initialization */
  delta > baseMinusTMin * tMax >> 1; k += base) {
    delta = floor(delta / baseMinusTMin);
  }

  return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
}
/**
 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
 * symbols.
 * @memberOf punycode
 * @param {String} input The Punycode string of ASCII-only symbols.
 * @returns {String} The resulting string of Unicode symbols.
 */


function decode$2(input) {
  // Don't use UCS-2
  var output = [],
      inputLength = input.length,
      out,
      i = 0,
      n = initialN,
      bias = initialBias,
      basic,
      j,
      index,
      oldi,
      w,
      k,
      digit,
      t,

  /** Cached calculation results */
  baseMinusT; // Handle the basic code points: let `basic` be the number of input code
  // points before the last delimiter, or `0` if there is none, then copy
  // the first basic code points to the output.

  basic = input.lastIndexOf(delimiter);

  if (basic < 0) {
    basic = 0;
  }

  for (j = 0; j < basic; ++j) {
    // if it's not a basic code point
    if (input.charCodeAt(j) >= 0x80) {
      error('not-basic');
    }

    output.push(input.charCodeAt(j));
  } // Main decoding loop: start just after the last delimiter if any basic code
  // points were copied; start at the beginning otherwise.


  for (index = basic > 0 ? basic + 1 : 0; index < inputLength;)
  /* no final expression */
  {
    // `index` is the index of the next character to be consumed.
    // Decode a generalized variable-length integer into `delta`,
    // which gets added to `i`. The overflow checking is easier
    // if we increase `i` as we go, then subtract off its starting
    // value at the end to obtain `delta`.
    for (oldi = i, w = 1, k = base;;
    /* no condition */
    k += base) {
      if (index >= inputLength) {
        error('invalid-input');
      }

      digit = basicToDigit(input.charCodeAt(index++));

      if (digit >= base || digit > floor((maxInt - i) / w)) {
        error('overflow');
      }

      i += digit * w;
      t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

      if (digit < t) {
        break;
      }

      baseMinusT = base - t;

      if (w > floor(maxInt / baseMinusT)) {
        error('overflow');
      }

      w *= baseMinusT;
    }

    out = output.length + 1;
    bias = adapt(i - oldi, out, oldi == 0); // `i` was supposed to wrap around from `out` to `0`,
    // incrementing `n` each time, so we'll fix that now:

    if (floor(i / out) > maxInt - n) {
      error('overflow');
    }

    n += floor(i / out);
    i %= out; // Insert `n` at position `i` of the output

    output.splice(i++, 0, n);
  }

  return ucs2encode(output);
}
/**
 * Converts a string of Unicode symbols (e.g. a domain name label) to a
 * Punycode string of ASCII-only symbols.
 * @memberOf punycode
 * @param {String} input The string of Unicode symbols.
 * @returns {String} The resulting Punycode string of ASCII-only symbols.
 */

function encode$2(input) {
  var n,
      delta,
      handledCPCount,
      basicLength,
      bias,
      j,
      m,
      q,
      k,
      t,
      currentValue,
      output = [],

  /** `inputLength` will hold the number of code points in `input`. */
  inputLength,

  /** Cached calculation results */
  handledCPCountPlusOne,
      baseMinusT,
      qMinusT; // Convert the input in UCS-2 to Unicode

  input = ucs2decode(input); // Cache the length

  inputLength = input.length; // Initialize the state

  n = initialN;
  delta = 0;
  bias = initialBias; // Handle the basic code points

  for (j = 0; j < inputLength; ++j) {
    currentValue = input[j];

    if (currentValue < 0x80) {
      output.push(stringFromCharCode(currentValue));
    }
  }

  handledCPCount = basicLength = output.length; // `handledCPCount` is the number of code points that have been handled;
  // `basicLength` is the number of basic code points.
  // Finish the basic string - if it is not empty - with a delimiter

  if (basicLength) {
    output.push(delimiter);
  } // Main encoding loop:


  while (handledCPCount < inputLength) {
    // All non-basic code points < n have been handled already. Find the next
    // larger one:
    for (m = maxInt, j = 0; j < inputLength; ++j) {
      currentValue = input[j];

      if (currentValue >= n && currentValue < m) {
        m = currentValue;
      }
    } // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
    // but guard against overflow


    handledCPCountPlusOne = handledCPCount + 1;

    if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
      error('overflow');
    }

    delta += (m - n) * handledCPCountPlusOne;
    n = m;

    for (j = 0; j < inputLength; ++j) {
      currentValue = input[j];

      if (currentValue < n && ++delta > maxInt) {
        error('overflow');
      }

      if (currentValue == n) {
        // Represent delta as a generalized variable-length integer
        for (q = delta, k = base;;
        /* no condition */
        k += base) {
          t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

          if (q < t) {
            break;
          }

          qMinusT = q - t;
          baseMinusT = base - t;
          output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
          q = floor(qMinusT / baseMinusT);
        }

        output.push(stringFromCharCode(digitToBasic(q, 0)));
        bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
        delta = 0;
        ++handledCPCount;
      }
    }

    ++delta;
    ++n;
  }

  return output.join('');
}
/**
 * Converts a Punycode string representing a domain name or an email address
 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
 * it doesn't matter if you call it on a string that has already been
 * converted to Unicode.
 * @memberOf punycode
 * @param {String} input The Punycoded domain name or email address to
 * convert to Unicode.
 * @returns {String} The Unicode representation of the given Punycode
 * string.
 */

function toUnicode(input) {
  return mapDomain(input, function (string) {
    return regexPunycode.test(string) ? decode$2(string.slice(4).toLowerCase()) : string;
  });
}
/**
 * Converts a Unicode string representing a domain name or an email address to
 * Punycode. Only the non-ASCII parts of the domain name will be converted,
 * i.e. it doesn't matter if you call it with a domain that's already in
 * ASCII.
 * @memberOf punycode
 * @param {String} input The domain name or email address to convert, as a
 * Unicode string.
 * @returns {String} The Punycode representation of the given domain name or
 * email address.
 */

function toASCII(input) {
  return mapDomain(input, function (string) {
    return regexNonASCII.test(string) ? 'xn--' + encode$2(string) : string;
  });
}
var version = '1.4.1';
/**
 * An object of methods to convert from JavaScript's internal character
 * representation (UCS-2) to Unicode code points, and back.
 * @see <https://mathiasbynens.be/notes/javascript-encoding>
 * @memberOf punycode
 * @type Object
 */

var ucs2 = {
  decode: ucs2decode,
  encode: ucs2encode
};
const punycode = {
  version: version,
  ucs2: ucs2,
  toASCII: toASCII,
  toUnicode: toUnicode,
  encode: encode$2,
  decode: decode$2
};

// markdown-it default options

var _default = {
  options: {
    html: false,
    // Enable HTML tags in source
    xhtmlOut: false,
    // Use '/' to close single tags (<br />)
    breaks: false,
    // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-',
    // CSS language prefix for fenced blocks
    linkify: false,
    // autoconvert URL-like texts to links
    // Enable some language-neutral replacements + quotes beautification
    typographer: false,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '\u201c\u201d\u2018\u2019',

    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    maxNesting: 100 // Internal protection, recursion limit

  },
  components: {
    core: {},
    block: {},
    inline: {}
  }
};

// "Zero" preset, with nothing enabled. Useful for manual configuring of simple

var zero = {
  options: {
    html: false,
    // Enable HTML tags in source
    xhtmlOut: false,
    // Use '/' to close single tags (<br />)
    breaks: false,
    // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-',
    // CSS language prefix for fenced blocks
    linkify: false,
    // autoconvert URL-like texts to links
    // Enable some language-neutral replacements + quotes beautification
    typographer: false,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '\u201c\u201d\u2018\u2019',

    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    maxNesting: 20 // Internal protection, recursion limit

  },
  components: {
    core: {
      rules: ['normalize', 'block', 'inline']
    },
    block: {
      rules: ['paragraph']
    },
    inline: {
      rules: ['text'],
      rules2: ['balance_pairs', 'text_collapse']
    }
  }
};

// Commonmark default options

var commonmark = {
  options: {
    html: true,
    // Enable HTML tags in source
    xhtmlOut: true,
    // Use '/' to close single tags (<br />)
    breaks: false,
    // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-',
    // CSS language prefix for fenced blocks
    linkify: false,
    // autoconvert URL-like texts to links
    // Enable some language-neutral replacements + quotes beautification
    typographer: false,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '\u201c\u201d\u2018\u2019',

    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    maxNesting: 20 // Internal protection, recursion limit

  },
  components: {
    core: {
      rules: ['normalize', 'block', 'inline']
    },
    block: {
      rules: ['blockquote', 'code', 'fence', 'heading', 'hr', 'html_block', 'lheading', 'list', 'reference', 'paragraph']
    },
    inline: {
      rules: ['autolink', 'backticks', 'emphasis', 'entity', 'escape', 'html_inline', 'image', 'link', 'newline', 'text'],
      rules2: ['balance_pairs', 'emphasis', 'text_collapse']
    }
  }
};

var config = {
  'default': _default,
  zero: zero,
  commonmark: commonmark
}; ////////////////////////////////////////////////////////////////////////////////
//
// This validator can prohibit more than really needed to prevent XSS. It's a
// tradeoff to keep code simple and to be secure by default.
//
// If you need different setup - override validator method as you wish. Or
// replace it with dummy function and use external sanitizer.
//

var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;

function validateLink(url) {
  // url should be normalized at this point, and existing entities are decoded
  var str = url.trim().toLowerCase();
  return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) ? true : false : true;
} ////////////////////////////////////////////////////////////////////////////////


var RECODE_HOSTNAME_FOR = ['http:', 'https:', 'mailto:'];

function normalizeLink(url) {
  var parsed = mdurl.parse(url, true);

  if (parsed.hostname) {
    // Encode hostnames in urls like:
    // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
    //
    // We don't encode unknown schemas, because it's likely that we encode
    // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
    //
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = punycode.toASCII(parsed.hostname);
      } catch (er) {
        /**/
      }
    }
  }

  return mdurl.encode(mdurl.format(parsed));
}

function normalizeLinkText(url) {
  var parsed = mdurl.parse(url, true);

  if (parsed.hostname) {
    // Encode hostnames in urls like:
    // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
    //
    // We don't encode unknown schemas, because it's likely that we encode
    // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
    //
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = punycode.toUnicode(parsed.hostname);
      } catch (er) {
        /**/
      }
    }
  }

  return mdurl.decode(mdurl.format(parsed));
}
/**
 * class MarkdownIt
 *
 * Main parser/renderer class.
 *
 * ##### Usage
 *
 * ```javascript
 * // node.js, "classic" way:
 * var MarkdownIt = require('markdown-it'),
 *     md = new MarkdownIt();
 * var result = md.render('# markdown-it rulezz!');
 *
 * // node.js, the same, but with sugar:
 * var md = require('markdown-it')();
 * var result = md.render('# markdown-it rulezz!');
 *
 * // browser without AMD, added to "window" on script load
 * // Note, there are no dash.
 * var md = window.markdownit();
 * var result = md.render('# markdown-it rulezz!');
 * ```
 *
 * Single line rendering, without paragraph wrap:
 *
 * ```javascript
 * var md = require('markdown-it')();
 * var result = md.renderInline('__markdown-it__ rulezz!');
 * ```
 **/

/**
 * new MarkdownIt([presetName, options])
 * - presetName (String): optional, `commonmark` / `zero`
 * - options (Object)
 *
 * Creates parser instanse with given config. Can be called without `new`.
 *
 * ##### presetName
 *
 * MarkdownIt provides named presets as a convenience to quickly
 * enable/disable active syntax rules and options for common use cases.
 *
 * - ["commonmark"](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/commonmark.js) -
 *   configures parser to strict [CommonMark](http://commonmark.org/) mode.
 * - [default](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/default.js) -
 *   similar to GFM, used when no preset name given. Enables all available rules,
 *   but still without html, typographer & autolinker.
 * - ["zero"](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/zero.js) -
 *   all rules disabled. Useful to quickly setup your config via `.enable()`.
 *   For example, when you need only `bold` and `italic` markup and nothing else.
 *
 * ##### options:
 *
 * - __html__ - `false`. Set `true` to enable HTML tags in source. Be careful!
 *   That's not safe! You may need external sanitizer to protect output from XSS.
 *   It's better to extend features via plugins, instead of enabling HTML.
 * - __xhtmlOut__ - `false`. Set `true` to add '/' when closing single tags
 *   (`<br />`). This is needed only for full CommonMark compatibility. In real
 *   world you will need HTML output.
 * - __breaks__ - `false`. Set `true` to convert `\n` in paragraphs into `<br>`.
 * - __langPrefix__ - `language-`. CSS language class prefix for fenced blocks.
 *   Can be useful for external highlighters.
 * - __linkify__ - `false`. Set `true` to autoconvert URL-like text to links.
 * - __typographer__  - `false`. Set `true` to enable [some language-neutral
 *   replacement](https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js) +
 *   quotes beautification (smartquotes).
 * - __quotes__ - `“”‘’`, String or Array. Double + single quotes replacement
 *   pairs, when typographer enabled and smartquotes on. For example, you can
 *   use `'«»„“'` for Russian, `'„“‚‘'` for German, and
 *   `['«\xA0', '\xA0»', '‹\xA0', '\xA0›']` for French (including nbsp).
 * - __highlight__ - `null`. Highlighter function for fenced code blocks.
 *   Highlighter `function (str, lang)` should return escaped HTML. It can also
 *   return empty string if the source was not changed and should be escaped
 *   externaly. If result starts with <pre... internal wrapper is skipped.
 *
 * ##### Example
 *
 * ```javascript
 * // commonmark mode
 * var md = require('markdown-it')('commonmark');
 *
 * // default mode
 * var md = require('markdown-it')();
 *
 * // enable everything
 * var md = require('markdown-it')({
 *   html: true,
 *   linkify: true,
 *   typographer: true
 * });
 * ```
 *
 * ##### Syntax highlighting
 *
 * ```js
 * var hljs = require('highlight.js') // https://highlightjs.org/
 *
 * var md = require('markdown-it')({
 *   highlight: function (str, lang) {
 *     if (lang && hljs.getLanguage(lang)) {
 *       try {
 *         return hljs.highlight(lang, str, true).value;
 *       } catch (__) {}
 *     }
 *
 *     return ''; // use external default escaping
 *   }
 * });
 * ```
 *
 * Or with full wrapper override (if you need assign class to `<pre>`):
 *
 * ```javascript
 * var hljs = require('highlight.js') // https://highlightjs.org/
 *
 * // Actual default values
 * var md = require('markdown-it')({
 *   highlight: function (str, lang) {
 *     if (lang && hljs.getLanguage(lang)) {
 *       try {
 *         return '<pre class="hljs"><code>' +
 *                hljs.highlight(lang, str, true).value +
 *                '</code></pre>';
 *       } catch (__) {}
 *     }
 *
 *     return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
 *   }
 * });
 * ```
 *
 **/


function MarkdownIt(presetName, options) {
  if (!(this instanceof MarkdownIt)) {
    return new MarkdownIt(presetName, options);
  }

  if (!options) {
    if (!utils.isString(presetName)) {
      options = presetName || {};
      presetName = 'default';
    }
  }
  /**
   * MarkdownIt#inline -> ParserInline
   *
   * Instance of [[ParserInline]]. You may need it to add new rules when
   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
   * [[MarkdownIt.enable]].
   **/


  this.inline = new parser_inline();
  /**
   * MarkdownIt#block -> ParserBlock
   *
   * Instance of [[ParserBlock]]. You may need it to add new rules when
   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
   * [[MarkdownIt.enable]].
   **/

  this.block = new parser_block();
  /**
   * MarkdownIt#core -> Core
   *
   * Instance of [[Core]] chain executor. You may need it to add new rules when
   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
   * [[MarkdownIt.enable]].
   **/

  this.core = new parser_core();
  /**
   * MarkdownIt#renderer -> Renderer
   *
   * Instance of [[Renderer]]. Use it to modify output look. Or to add rendering
   * rules for new token types, generated by plugins.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * function myToken(tokens, idx, options, env, self) {
   *   //...
   *   return result;
   * };
   *
   * md.renderer.rules['my_token'] = myToken
   * ```
   *
   * See [[Renderer]] docs and [source code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js).
   **/

  this.renderer = new renderer();
  /**
   * MarkdownIt#linkify -> LinkifyIt
   *
   * [linkify-it](https://github.com/markdown-it/linkify-it) instance.
   * Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/linkify.js)
   * rule.
   **/

  this.linkify = new linkifyIt();
  /**
   * MarkdownIt#validateLink(url) -> Boolean
   *
   * Link validation function. CommonMark allows too much in links. By default
   * we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
   * except some embedded image types.
   *
   * You can change this behaviour:
   *
   * ```javascript
   * var md = require('markdown-it')();
   * // enable everything
   * md.validateLink = function () { return true; }
   * ```
   **/

  this.validateLink = validateLink;
  /**
   * MarkdownIt#normalizeLink(url) -> String
   *
   * Function used to encode link url to a machine-readable format,
   * which includes url-encoding, punycode, etc.
   **/

  this.normalizeLink = normalizeLink;
  /**
   * MarkdownIt#normalizeLinkText(url) -> String
   *
   * Function used to decode link url to a human-readable format`
   **/

  this.normalizeLinkText = normalizeLinkText; // Expose utils & helpers for easy acces from plugins

  /**
   * MarkdownIt#utils -> utils
   *
   * Assorted utility functions, useful to write plugins. See details
   * [here](https://github.com/markdown-it/markdown-it/blob/master/lib/common/utils.js).
   **/

  this.utils = utils;
  /**
   * MarkdownIt#helpers -> helpers
   *
   * Link components parser functions, useful to write plugins. See details
   * [here](https://github.com/markdown-it/markdown-it/blob/master/lib/helpers).
   **/

  this.helpers = utils.assign({}, helpers);
  this.options = {};
  this.configure(presetName);

  if (options) {
    this.set(options);
  }
}
/** chainable
 * MarkdownIt.set(options)
 *
 * Set parser options (in the same format as in constructor). Probably, you
 * will never need it, but you can change options after constructor call.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')()
 *             .set({ html: true, breaks: true })
 *             .set({ typographer, true });
 * ```
 *
 * __Note:__ To achieve the best possible performance, don't modify a
 * `markdown-it` instance options on the fly. If you need multiple configurations
 * it's best to create multiple instances and initialize each with separate
 * config.
 **/


MarkdownIt.prototype.set = function (options) {
  utils.assign(this.options, options);
  return this;
};
/** chainable, internal
 * MarkdownIt.configure(presets)
 *
 * Batch load of all options and compenent settings. This is internal method,
 * and you probably will not need it. But if you with - see available presets
 * and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/lib/presets)
 *
 * We strongly recommend to use presets instead of direct config loads. That
 * will give better compatibility with next versions.
 **/


MarkdownIt.prototype.configure = function (presets) {
  var self = this,
      presetName;

  if (utils.isString(presets)) {
    presetName = presets;
    presets = config[presetName];

    if (!presets) {
      throw new Error('Wrong `markdown-it` preset "' + presetName + '", check name');
    }
  }

  if (!presets) {
    throw new Error('Wrong `markdown-it` preset, can\'t be empty');
  }

  if (presets.options) {
    self.set(presets.options);
  }

  if (presets.components) {
    Object.keys(presets.components).forEach(function (name) {
      if (presets.components[name].rules) {
        self[name].ruler.enableOnly(presets.components[name].rules);
      }

      if (presets.components[name].rules2) {
        self[name].ruler2.enableOnly(presets.components[name].rules2);
      }
    });
  }

  return this;
};
/** chainable
 * MarkdownIt.enable(list, ignoreInvalid)
 * - list (String|Array): rule name or list of rule names to enable
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Enable list or rules. It will automatically find appropriate components,
 * containing rules with given names. If rule not found, and `ignoreInvalid`
 * not set - throws exception.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')()
 *             .enable(['sub', 'sup'])
 *             .disable('smartquotes');
 * ```
 **/


MarkdownIt.prototype.enable = function (list, ignoreInvalid) {
  var result = [];

  if (!Array.isArray(list)) {
    list = [list];
  }

  ['core', 'block', 'inline'].forEach(function (chain) {
    result = result.concat(this[chain].ruler.enable(list, true));
  }, this);
  result = result.concat(this.inline.ruler2.enable(list, true));
  var missed = list.filter(function (name) {
    return result.indexOf(name) < 0;
  });

  if (missed.length && !ignoreInvalid) {
    throw new Error('MarkdownIt. Failed to enable unknown rule(s): ' + missed);
  }

  return this;
};
/** chainable
 * MarkdownIt.disable(list, ignoreInvalid)
 * - list (String|Array): rule name or list of rule names to disable.
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * The same as [[MarkdownIt.enable]], but turn specified rules off.
 **/


MarkdownIt.prototype.disable = function (list, ignoreInvalid) {
  var result = [];

  if (!Array.isArray(list)) {
    list = [list];
  }

  ['core', 'block', 'inline'].forEach(function (chain) {
    result = result.concat(this[chain].ruler.disable(list, true));
  }, this);
  result = result.concat(this.inline.ruler2.disable(list, true));
  var missed = list.filter(function (name) {
    return result.indexOf(name) < 0;
  });

  if (missed.length && !ignoreInvalid) {
    throw new Error('MarkdownIt. Failed to disable unknown rule(s): ' + missed);
  }

  return this;
};
/** chainable
 * MarkdownIt.use(plugin, params)
 *
 * Load specified plugin with given params into current parser instance.
 * It's just a sugar to call `plugin(md, params)` with curring.
 *
 * ##### Example
 *
 * ```javascript
 * var iterator = require('markdown-it-for-inline');
 * var md = require('markdown-it')()
 *             .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
 *               tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar');
 *             });
 * ```
 **/


MarkdownIt.prototype.use = function (plugin
/*, params, ... */
) {
  var args = [this].concat(Array.prototype.slice.call(arguments, 1));
  plugin.apply(plugin, args);
  return this;
};
/** internal
 * MarkdownIt.parse(src, env) -> Array
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * Parse input string and returns list of block tokens (special token type
 * "inline" will contain list of inline tokens). You should not call this
 * method directly, until you write custom renderer (for example, to produce
 * AST).
 *
 * `env` is used to pass data between "distributed" rules and return additional
 * metadata like reference info, needed for the renderer. It also can be used to
 * inject data in specific cases. Usually, you will be ok to pass `{}`,
 * and then pass updated object to renderer.
 **/


MarkdownIt.prototype.parse = function (src, env) {
  if (typeof src !== 'string') {
    throw new Error('Input data should be a String');
  }

  var state = new this.core.State(src, this, env);
  this.core.process(state);
  return state.tokens;
};
/**
 * MarkdownIt.render(src [, env]) -> String
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * Render markdown string into html. It does all magic for you :).
 *
 * `env` can be used to inject additional metadata (`{}` by default).
 * But you will not need it with high probability. See also comment
 * in [[MarkdownIt.parse]].
 **/


MarkdownIt.prototype.render = function (src, env) {
  env = env || {};
  return this.renderer.render(this.parse(src, env), this.options, env);
};
/** internal
 * MarkdownIt.parseInline(src, env) -> Array
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * The same as [[MarkdownIt.parse]] but skip all block rules. It returns the
 * block tokens list with the single `inline` element, containing parsed inline
 * tokens in `children` property. Also updates `env` object.
 **/


MarkdownIt.prototype.parseInline = function (src, env) {
  var state = new this.core.State(src, this, env);
  state.inlineMode = true;
  this.core.process(state);
  return state.tokens;
};
/**
 * MarkdownIt.renderInline(src [, env]) -> String
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * Similar to [[MarkdownIt.render]] but for single paragraph content. Result
 * will NOT be wrapped into `<p>` tags.
 **/


MarkdownIt.prototype.renderInline = function (src, env) {
  env = env || {};
  return this.renderer.render(this.parseInline(src, env), this.options, env);
};

var lib = MarkdownIt;

var markdownIt = lib;

/**
 * parse {.class #id key=val} strings
 * @param {string} str: string to parse
 * @param {int} start: where to start parsing (including {)
 * @returns {2d array}: [['key', 'val'], ['class', 'red']]
 */

var getAttrs = function (str, start, options) {
  // not tab, line feed, form feed, space, solidus, greater than sign, quotation mark, apostrophe and equals sign
  const allowedKeyChars = /[^\t\n\f />"'=]/;
  const pairSeparator = ' ';
  const keySeparator = '=';
  const classChar = '.';
  const idChar = '#';
  const attrs = [];
  let key = '';
  let value = '';
  let parsingKey = true;
  let valueInsideQuotes = false; // read inside {}
  // start + left delimiter length to avoid beginning {
  // breaks when } is found or end of string

  for (let i = start + options.leftDelimiter.length; i < str.length; i++) {
    if (str.slice(i, i + options.rightDelimiter.length) === options.rightDelimiter) {
      if (key !== '') {
        attrs.push([key, value]);
      }

      break;
    }

    let char_ = str.charAt(i); // switch to reading value if equal sign

    if (char_ === keySeparator && parsingKey) {
      parsingKey = false;
      continue;
    } // {.class} {..css-module}


    if (char_ === classChar && key === '') {
      if (str.charAt(i + 1) === classChar) {
        key = 'css-module';
        i += 1;
      } else {
        key = 'class';
      }

      parsingKey = false;
      continue;
    } // {#id}


    if (char_ === idChar && key === '') {
      key = 'id';
      parsingKey = false;
      continue;
    } // {value="inside quotes"}


    if (char_ === '"' && value === '') {
      valueInsideQuotes = true;
      continue;
    }

    if (char_ === '"' && valueInsideQuotes) {
      valueInsideQuotes = false;
      continue;
    } // read next key/value pair


    if (char_ === pairSeparator && !valueInsideQuotes) {
      if (key === '') {
        // beginning or ending space: { .red } vs {.red}
        continue;
      }

      attrs.push([key, value]);
      key = '';
      value = '';
      parsingKey = true;
      continue;
    } // continue if character not allowed


    if (parsingKey && char_.search(allowedKeyChars) === -1) {
      continue;
    } // no other conditions met; append to key/value


    if (parsingKey) {
      key += char_;
      continue;
    }

    value += char_;
  }

  if (options.allowedAttributes && options.allowedAttributes.length) {
    let allowedAttributes = options.allowedAttributes;
    return attrs.filter(function (attrPair) {
      let attr = attrPair[0];

      function isAllowedAttribute(allowedAttribute) {
        return attr === allowedAttribute || allowedAttribute instanceof RegExp && allowedAttribute.test(attr);
      }

      return allowedAttributes.some(isAllowedAttribute);
    });
  } else {
    return attrs;
  }
};
/**
 * add attributes from [['key', 'val']] list
 * @param {array} attrs: [['key', 'val']]
 * @param {token} token: which token to add attributes
 * @returns token
 */


var addAttrs = function (attrs, token) {
  for (let j = 0, l = attrs.length; j < l; ++j) {
    let key = attrs[j][0];

    if (key === 'class') {
      token.attrJoin('class', attrs[j][1]);
    } else if (key === 'css-module') {
      token.attrJoin('css-module', attrs[j][1]);
    } else {
      token.attrPush(attrs[j]);
    }
  }

  return token;
};
/**
 * Does string have properly formatted curly?
 *
 * start: '{.a} asdf'
 * middle: 'a{.b}c'
 * end: 'asdf {.a}'
 * only: '{.a}'
 *
 * @param {string} where to expect {} curly. start, middle, end or only.
 * @return {function(string)} Function which testes if string has curly.
 */


var hasDelimiters = function (where, options) {
  if (!where) {
    throw new Error('Parameter `where` not passed. Should be "start", "middle", "end" or "only".');
  }
  /**
   * @param {string} str
   * @return {boolean}
   */


  return function (str) {
    // we need minimum three chars, for example {b}
    let minCurlyLength = options.leftDelimiter.length + 1 + options.rightDelimiter.length;

    if (!str || typeof str !== 'string' || str.length < minCurlyLength) {
      return false;
    }

    function validCurlyLength(curly) {
      let isClass = curly.charAt(options.leftDelimiter.length) === '.';
      let isId = curly.charAt(options.leftDelimiter.length) === '#';
      return isClass || isId ? curly.length >= minCurlyLength + 1 : curly.length >= minCurlyLength;
    }

    let start, end, slice, nextChar;
    let rightDelimiterMinimumShift = minCurlyLength - options.rightDelimiter.length;

    switch (where) {
      case 'start':
        // first char should be {, } found in char 2 or more
        slice = str.slice(0, options.leftDelimiter.length);
        start = slice === options.leftDelimiter ? 0 : -1;
        end = start === -1 ? -1 : str.indexOf(options.rightDelimiter, rightDelimiterMinimumShift); // check if next character is not one of the delimiters

        nextChar = str.charAt(end + options.rightDelimiter.length);

        if (nextChar && options.rightDelimiter.indexOf(nextChar) !== -1) {
          end = -1;
        }

        break;

      case 'end':
        // last char should be }
        start = str.lastIndexOf(options.leftDelimiter);
        end = start === -1 ? -1 : str.indexOf(options.rightDelimiter, start + rightDelimiterMinimumShift);
        end = end === str.length - options.rightDelimiter.length ? end : -1;
        break;

      case 'only':
        // '{.a}'
        slice = str.slice(0, options.leftDelimiter.length);
        start = slice === options.leftDelimiter ? 0 : -1;
        slice = str.slice(str.length - options.rightDelimiter.length);
        end = slice === options.rightDelimiter ? str.length - options.rightDelimiter.length : -1;
        break;
    }

    return start !== -1 && end !== -1 && validCurlyLength(str.substring(start, end + options.rightDelimiter.length));
  };
};
/**
 * Removes last curly from string.
 */


var removeDelimiter = function (str, options) {
  const start = escapeRegExp(options.leftDelimiter);
  const end = escapeRegExp(options.rightDelimiter);
  let curly = new RegExp('[ \\n]?' + start + '[^' + start + end + ']+' + end + '$');
  let pos = str.search(curly);
  return pos !== -1 ? str.slice(0, pos) : str;
};
/**
 * Escapes special characters in string s such that the string
 * can be used in `new RegExp`. For example "[" becomes "\\[".
 *
 * @param {string} s Regex string.
 * @return {string} Escaped string.
 */


function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

var escapeRegExp_1 = escapeRegExp;
/**
 * find corresponding opening block
 */

var getMatchingOpeningToken = function (tokens, i) {
  if (tokens[i].type === 'softbreak') {
    return false;
  } // non closing blocks, example img


  if (tokens[i].nesting === 0) {
    return tokens[i];
  }

  let level = tokens[i].level;
  let type = tokens[i].type.replace('_close', '_open');

  for (; i >= 0; --i) {
    if (tokens[i].type === type && tokens[i].level === level) {
      return tokens[i];
    }
  }
};
/**
 * from https://github.com/markdown-it/markdown-it/blob/master/lib/common/utils.js
 */


let HTML_ESCAPE_TEST_RE = /[&<>"]/;
let HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
let HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

var escapeHtml$1 = function (str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }

  return str;
};

var utils$1 = {
  getAttrs: getAttrs,
  addAttrs: addAttrs,
  hasDelimiters: hasDelimiters,
  removeDelimiter: removeDelimiter,
  escapeRegExp: escapeRegExp_1,
  getMatchingOpeningToken: getMatchingOpeningToken,
  escapeHtml: escapeHtml$1
};

/**
 * If a pattern matches the token stream,
 * then run transform.
 */


var patterns = options => {
  const __hr = new RegExp('^ {0,3}[-*_]{3,} ?' + utils$1.escapeRegExp(options.leftDelimiter) + '[^' + utils$1.escapeRegExp(options.rightDelimiter) + ']');

  return [{
    /**
     * ```python {.cls}
     * for i in range(10):
     *     print(i)
     * ```
     */
    name: 'fenced code blocks',
    tests: [{
      shift: 0,
      block: true,
      info: utils$1.hasDelimiters('end', options)
    }],
    transform: (tokens, i) => {
      let token = tokens[i];
      let start = token.info.lastIndexOf(options.leftDelimiter);
      let attrs = utils$1.getAttrs(token.info, start, options);
      utils$1.addAttrs(attrs, token);
      token.info = utils$1.removeDelimiter(token.info, options);
    }
  }, {
    /**
     * bla `click()`{.c} ![](img.png){.d}
     *
     * differs from 'inline attributes' as it does
     * not have a closing tag (nesting: -1)
     */
    name: 'inline nesting 0',
    tests: [{
      shift: 0,
      type: 'inline',
      children: [{
        shift: -1,
        type: str => str === 'image' || str === 'code_inline'
      }, {
        shift: 0,
        type: 'text',
        content: utils$1.hasDelimiters('start', options)
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let endChar = token.content.indexOf(options.rightDelimiter);
      let attrToken = tokens[i].children[j - 1];
      let attrs = utils$1.getAttrs(token.content, 0, options);
      utils$1.addAttrs(attrs, attrToken);

      if (token.content.length === endChar + options.rightDelimiter.length) {
        tokens[i].children.splice(j, 1);
      } else {
        token.content = token.content.slice(endChar + options.rightDelimiter.length);
      }
    }
  }, {
    /**
     * | h1 |
     * | -- |
     * | c1 |
     * {.c}
     */
    name: 'tables',
    tests: [{
      // let this token be i, such that for-loop continues at
      // next token after tokens.splice
      shift: 0,
      type: 'table_close'
    }, {
      shift: 1,
      type: 'paragraph_open'
    }, {
      shift: 2,
      type: 'inline',
      content: utils$1.hasDelimiters('only', options)
    }],
    transform: (tokens, i) => {
      let token = tokens[i + 2];
      let tableOpen = utils$1.getMatchingOpeningToken(tokens, i);
      let attrs = utils$1.getAttrs(token.content, 0, options); // add attributes

      utils$1.addAttrs(attrs, tableOpen); // remove <p>{.c}</p>

      tokens.splice(i + 1, 3);
    }
  }, {
    /**
     * *emphasis*{.with attrs=1}
     */
    name: 'inline attributes',
    tests: [{
      shift: 0,
      type: 'inline',
      children: [{
        shift: -1,
        nesting: -1 // closing inline tag, </em>{.a}

      }, {
        shift: 0,
        type: 'text',
        content: utils$1.hasDelimiters('start', options)
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = utils$1.getAttrs(content, 0, options);
      let openingToken = utils$1.getMatchingOpeningToken(tokens[i].children, j - 1);
      utils$1.addAttrs(attrs, openingToken);
      token.content = content.slice(content.indexOf(options.rightDelimiter) + options.rightDelimiter.length);
    }
  }, {
    /**
     * - item
     * {.a}
     */
    name: 'list softbreak',
    tests: [{
      shift: -2,
      type: 'list_item_open'
    }, {
      shift: 0,
      type: 'inline',
      children: [{
        position: -2,
        type: 'softbreak'
      }, {
        position: -1,
        type: 'text',
        content: utils$1.hasDelimiters('only', options)
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = utils$1.getAttrs(content, 0, options);
      let ii = i - 2;

      while (tokens[ii - 1] && tokens[ii - 1].type !== 'ordered_list_open' && tokens[ii - 1].type !== 'bullet_list_open') {
        ii--;
      }

      utils$1.addAttrs(attrs, tokens[ii - 1]);
      tokens[i].children = tokens[i].children.slice(0, -2);
    }
  }, {
    /**
     * - nested list
     *   - with double \n
     *   {.a} <-- apply to nested ul
     *
     * {.b} <-- apply to root <ul>
     */
    name: 'list double softbreak',
    tests: [{
      // let this token be i = 0 so that we can erase
      // the <p>{.a}</p> tokens below
      shift: 0,
      type: str => str === 'bullet_list_close' || str === 'ordered_list_close'
    }, {
      shift: 1,
      type: 'paragraph_open'
    }, {
      shift: 2,
      type: 'inline',
      content: utils$1.hasDelimiters('only', options),
      children: arr => arr.length === 1
    }, {
      shift: 3,
      type: 'paragraph_close'
    }],
    transform: (tokens, i) => {
      let token = tokens[i + 2];
      let content = token.content;
      let attrs = utils$1.getAttrs(content, 0, options);
      let openingToken = utils$1.getMatchingOpeningToken(tokens, i);
      utils$1.addAttrs(attrs, openingToken);
      tokens.splice(i + 1, 3);
    }
  }, {
    /**
     * - end of {.list-item}
     */
    name: 'list item end',
    tests: [{
      shift: -2,
      type: 'list_item_open'
    }, {
      shift: 0,
      type: 'inline',
      children: [{
        position: -1,
        type: 'text',
        content: utils$1.hasDelimiters('end', options)
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = utils$1.getAttrs(content, content.lastIndexOf(options.leftDelimiter), options);
      utils$1.addAttrs(attrs, tokens[i - 2]);
      let trimmed = content.slice(0, content.lastIndexOf(options.leftDelimiter));
      token.content = last(trimmed) !== ' ' ? trimmed : trimmed.slice(0, -1);
    }
  }, {
    /**
     * something with softbreak
     * {.cls}
     */
    name: '\n{.a} softbreak then curly in start',
    tests: [{
      shift: 0,
      type: 'inline',
      children: [{
        position: -2,
        type: 'softbreak'
      }, {
        position: -1,
        type: 'text',
        content: utils$1.hasDelimiters('only', options)
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let attrs = utils$1.getAttrs(token.content, 0, options); // find last closing tag

      let ii = i + 1;

      while (tokens[ii + 1] && tokens[ii + 1].nesting === -1) {
        ii++;
      }

      let openingToken = utils$1.getMatchingOpeningToken(tokens, ii);
      utils$1.addAttrs(attrs, openingToken);
      tokens[i].children = tokens[i].children.slice(0, -2);
    }
  }, {
    /**
     * horizontal rule --- {#id}
     */
    name: 'horizontal rule',
    tests: [{
      shift: 0,
      type: 'paragraph_open'
    }, {
      shift: 1,
      type: 'inline',
      children: arr => arr.length === 1,
      content: str => str.match(__hr) !== null
    }, {
      shift: 2,
      type: 'paragraph_close'
    }],
    transform: (tokens, i) => {
      let token = tokens[i];
      token.type = 'hr';
      token.tag = 'hr';
      token.nesting = 0;
      let content = tokens[i + 1].content;
      let start = content.lastIndexOf(options.leftDelimiter);
      token.attrs = utils$1.getAttrs(content, start, options);
      token.markup = content;
      tokens.splice(i + 1, 2);
    }
  }, {
    /**
     * end of {.block}
     */
    name: 'end of block',
    tests: [{
      shift: 0,
      type: 'inline',
      children: [{
        position: -1,
        content: utils$1.hasDelimiters('end', options),
        type: t => t !== 'code_inline'
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = utils$1.getAttrs(content, content.lastIndexOf(options.leftDelimiter), options);
      let ii = i + 1;

      while (tokens[ii + 1] && tokens[ii + 1].nesting === -1) {
        ii++;
      }

      let openingToken = utils$1.getMatchingOpeningToken(tokens, ii);
      utils$1.addAttrs(attrs, openingToken);
      let trimmed = content.slice(0, content.lastIndexOf(options.leftDelimiter));
      token.content = last(trimmed) !== ' ' ? trimmed : trimmed.slice(0, -1);
    }
  }];
}; // get last element of array or string


function last(arr) {
  return arr.slice(-1)[0];
}

const defaultOptions$1 = {
  leftDelimiter: '{',
  rightDelimiter: '}',
  allowedAttributes: []
};

var markdownItAttrs = function attributes(md, options_) {
  let options = Object.assign({}, defaultOptions$1);
  options = Object.assign(options, options_);
  const patterns$1 = patterns(options);

  function curlyAttrs(state) {
    let tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      for (let p = 0; p < patterns$1.length; p++) {
        let pattern = patterns$1[p];
        let j = null; // position of child with offset 0

        let match = pattern.tests.every(t => {
          let res = test(tokens, i, t);

          if (res.j !== null) {
            j = res.j;
          }

          return res.match;
        });

        if (match) {
          pattern.transform(tokens, i, j);

          if (pattern.name === 'inline attributes' || pattern.name === 'inline nesting 0') {
            // retry, may be several inline attributes
            p--;
          }
        }
      }
    }
  }

  md.core.ruler.before('linkify', 'curly_attributes', curlyAttrs);
};
/**
 * Test if t matches token stream.
 *
 * @param {array} tokens
 * @param {number} i
 * @param {object} t Test to match.
 * @return {object} { match: true|false, j: null|number }
 */


function test(tokens, i, t) {
  let res = {
    match: false,
    j: null // position of child

  };
  let ii = t.shift !== undefined ? i + t.shift : t.position;
  let token = get(tokens, ii); // supports negative ii

  if (token === undefined) {
    return res;
  }

  for (let key in t) {
    if (key === 'shift' || key === 'position') {
      continue;
    }

    if (token[key] === undefined) {
      return res;
    }

    if (key === 'children' && isArrayOfObjects(t.children)) {
      if (token.children.length === 0) {
        return res;
      }

      let match;
      let childTests = t.children;
      let children = token.children;

      if (childTests.every(tt => tt.position !== undefined)) {
        // positions instead of shifts, do not loop all children
        match = childTests.every(tt => test(children, tt.position, tt).match);

        if (match) {
          // we may need position of child in transform
          let j = last$1(childTests).position;
          res.j = j >= 0 ? j : children.length + j;
        }
      } else {
        for (let j = 0; j < children.length; j++) {
          match = childTests.every(tt => test(children, j, tt).match);

          if (match) {
            res.j = j; // all tests true, continue with next key of pattern t

            break;
          }
        }
      }

      if (match === false) {
        return res;
      }

      continue;
    }

    switch (typeof t[key]) {
      case 'boolean':
      case 'number':
      case 'string':
        if (token[key] !== t[key]) {
          return res;
        }

        break;

      case 'function':
        if (!t[key](token[key])) {
          return res;
        }

        break;

      case 'object':
        if (isArrayOfFunctions(t[key])) {
          let r = t[key].every(tt => tt(token[key]));

          if (r === false) {
            return res;
          }

          break;
        }

      // fall through for objects !== arrays of functions

      default:
        throw new Error(`Unknown type of pattern test (key: ${key}). Test should be of type boolean, number, string, function or array of functions.`);
    }
  } // no tests returned false -> all tests returns true


  res.match = true;
  return res;
}

function isArrayOfObjects(arr) {
  return Array.isArray(arr) && arr.length && arr.every(i => typeof i === 'object');
}

function isArrayOfFunctions(arr) {
  return Array.isArray(arr) && arr.length && arr.every(i => typeof i === 'function');
}
/**
 * Get n item of array. Supports negative n, where -1 is last
 * element in array.
 * @param {array} arr
 * @param {number} n
 */


function get(arr, n) {
  return n >= 0 ? arr[n] : arr[arr.length + n];
} // get last element of array, safe - returns {} if not found


function last$1(arr) {
  return arr.slice(-1)[0] || {};
}

var highlight = createCommonjsModule(function (module, exports) {
  /*
  Syntax highlighting with language autodetection.
  https://highlightjs.org/
  */
  (function (factory) {
    // Find the global object for export to both the browser and web workers.
    var globalObject = typeof window === 'object' && window || typeof self === 'object' && self; // Setup highlight.js for different environments. First is Node.js or
    // CommonJS.
    // `nodeType` is checked to ensure that `exports` is not a HTML element.

    if ( !exports.nodeType) {
      factory(exports);
    } else if (globalObject) {
      // Export hljs globally even when using AMD for cases when this script
      // is loaded with others that may still expect a global hljs.
      globalObject.hljs = factory({}); // Finally register the global hljs with AMD.
    }
  })(function (hljs) {
    // Convenience variables for build-in objects
    var ArrayProto = [],
        objectKeys = Object.keys; // Global internal variables used within the highlight.js library.

    var languages = {},
        aliases = {}; // Regular expressions used throughout the highlight.js library.

    var noHighlightRe = /^(no-?highlight|plain|text)$/i,
        languagePrefixRe = /\blang(?:uage)?-([\w-]+)\b/i,
        fixMarkupRe = /((^(<[^>]+>|\t|)+|(?:\n)))/gm; // The object will be assigned by the build tool. It used to synchronize API 
    var spanEndTag = '</span>'; // Global options used when within external APIs. This is modified when
    // calling the `hljs.configure` function.

    var options = {
      classPrefix: 'hljs-',
      tabReplace: null,
      useBR: false,
      languages: undefined
    };
    /* Utility functions */

    function escape(value) {
      return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function tag(node) {
      return node.nodeName.toLowerCase();
    }

    function testRe(re, lexeme) {
      var match = re && re.exec(lexeme);
      return match && match.index === 0;
    }

    function isNotHighlighted(language) {
      return noHighlightRe.test(language);
    }

    function blockLanguage(block) {
      var i, match, length, _class;

      var classes = block.className + ' ';
      classes += block.parentNode ? block.parentNode.className : ''; // language-* takes precedence over non-prefixed class names.

      match = languagePrefixRe.exec(classes);

      if (match) {
        return getLanguage(match[1]) ? match[1] : 'no-highlight';
      }

      classes = classes.split(/\s+/);

      for (i = 0, length = classes.length; i < length; i++) {
        _class = classes[i];

        if (isNotHighlighted(_class) || getLanguage(_class)) {
          return _class;
        }
      }
    }

    function inherit(parent) {
      // inherit(parent, override_obj, override_obj, ...)
      var key;
      var result = {};
      var objects = Array.prototype.slice.call(arguments, 1);

      for (key in parent) result[key] = parent[key];

      objects.forEach(function (obj) {
        for (key in obj) result[key] = obj[key];
      });
      return result;
    }
    /* Stream merging */


    function nodeStream(node) {
      var result = [];

      (function _nodeStream(node, offset) {
        for (var child = node.firstChild; child; child = child.nextSibling) {
          if (child.nodeType === 3) offset += child.nodeValue.length;else if (child.nodeType === 1) {
            result.push({
              event: 'start',
              offset: offset,
              node: child
            });
            offset = _nodeStream(child, offset); // Prevent void elements from having an end tag that would actually
            // double them in the output. There are more void elements in HTML
            // but we list only those realistically expected in code display.

            if (!tag(child).match(/br|hr|img|input/)) {
              result.push({
                event: 'stop',
                offset: offset,
                node: child
              });
            }
          }
        }

        return offset;
      })(node, 0);

      return result;
    }

    function mergeStreams(original, highlighted, value) {
      var processed = 0;
      var result = '';
      var nodeStack = [];

      function selectStream() {
        if (!original.length || !highlighted.length) {
          return original.length ? original : highlighted;
        }

        if (original[0].offset !== highlighted[0].offset) {
          return original[0].offset < highlighted[0].offset ? original : highlighted;
        }
        /*
        To avoid starting the stream just before it should stop the order is
        ensured that original always starts first and closes last:
         if (event1 == 'start' && event2 == 'start')
          return original;
        if (event1 == 'start' && event2 == 'stop')
          return highlighted;
        if (event1 == 'stop' && event2 == 'start')
          return original;
        if (event1 == 'stop' && event2 == 'stop')
          return highlighted;
         ... which is collapsed to:
        */


        return highlighted[0].event === 'start' ? original : highlighted;
      }

      function open(node) {
        function attr_str(a) {
          return ' ' + a.nodeName + '="' + escape(a.value).replace('"', '&quot;') + '"';
        }

        result += '<' + tag(node) + ArrayProto.map.call(node.attributes, attr_str).join('') + '>';
      }

      function close(node) {
        result += '</' + tag(node) + '>';
      }

      function render(event) {
        (event.event === 'start' ? open : close)(event.node);
      }

      while (original.length || highlighted.length) {
        var stream = selectStream();
        result += escape(value.substring(processed, stream[0].offset));
        processed = stream[0].offset;

        if (stream === original) {
          /*
          On any opening or closing tag of the original markup we first close
          the entire highlighted node stack, then render the original tag along
          with all the following original tags at the same offset and then
          reopen all the tags on the highlighted stack.
          */
          nodeStack.reverse().forEach(close);

          do {
            render(stream.splice(0, 1)[0]);
            stream = selectStream();
          } while (stream === original && stream.length && stream[0].offset === processed);

          nodeStack.reverse().forEach(open);
        } else {
          if (stream[0].event === 'start') {
            nodeStack.push(stream[0].node);
          } else {
            nodeStack.pop();
          }

          render(stream.splice(0, 1)[0]);
        }
      }

      return result + escape(value.substr(processed));
    }
    /* Initialization */


    function expand_mode(mode) {
      if (mode.variants && !mode.cached_variants) {
        mode.cached_variants = mode.variants.map(function (variant) {
          return inherit(mode, {
            variants: null
          }, variant);
        });
      }

      return mode.cached_variants || mode.endsWithParent && [inherit(mode)] || [mode];
    }

    function compileLanguage(language) {
      function reStr(re) {
        return re && re.source || re;
      }

      function langRe(value, global) {
        return new RegExp(reStr(value), 'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : ''));
      } // joinRe logically computes regexps.join(separator), but fixes the
      // backreferences so they continue to match.


      function joinRe(regexps, separator) {
        // backreferenceRe matches an open parenthesis or backreference. To avoid
        // an incorrect parse, it additionally matches the following:
        // - [...] elements, where the meaning of parentheses and escapes change
        // - other escape sequences, so we do not misparse escape sequences as
        //   interesting elements
        // - non-matching or lookahead parentheses, which do not capture. These
        //   follow the '(' with a '?'.
        var backreferenceRe = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
        var numCaptures = 0;
        var ret = '';

        for (var i = 0; i < regexps.length; i++) {
          var offset = numCaptures;
          var re = reStr(regexps[i]);

          if (i > 0) {
            ret += separator;
          }

          while (re.length > 0) {
            var match = backreferenceRe.exec(re);

            if (match == null) {
              ret += re;
              break;
            }

            ret += re.substring(0, match.index);
            re = re.substring(match.index + match[0].length);

            if (match[0][0] == '\\' && match[1]) {
              // Adjust the backreference.
              ret += '\\' + String(Number(match[1]) + offset);
            } else {
              ret += match[0];

              if (match[0] == '(') {
                numCaptures++;
              }
            }
          }
        }

        return ret;
      }

      function compileMode(mode, parent) {
        if (mode.compiled) return;
        mode.compiled = true;
        mode.keywords = mode.keywords || mode.beginKeywords;

        if (mode.keywords) {
          var compiled_keywords = {};

          var flatten = function (className, str) {
            if (language.case_insensitive) {
              str = str.toLowerCase();
            }

            str.split(' ').forEach(function (kw) {
              var pair = kw.split('|');
              compiled_keywords[pair[0]] = [className, pair[1] ? Number(pair[1]) : 1];
            });
          };

          if (typeof mode.keywords === 'string') {
            // string
            flatten('keyword', mode.keywords);
          } else {
            objectKeys(mode.keywords).forEach(function (className) {
              flatten(className, mode.keywords[className]);
            });
          }

          mode.keywords = compiled_keywords;
        }

        mode.lexemesRe = langRe(mode.lexemes || /\w+/, true);

        if (parent) {
          if (mode.beginKeywords) {
            mode.begin = '\\b(' + mode.beginKeywords.split(' ').join('|') + ')\\b';
          }

          if (!mode.begin) mode.begin = /\B|\b/;
          mode.beginRe = langRe(mode.begin);
          if (mode.endSameAsBegin) mode.end = mode.begin;
          if (!mode.end && !mode.endsWithParent) mode.end = /\B|\b/;
          if (mode.end) mode.endRe = langRe(mode.end);
          mode.terminator_end = reStr(mode.end) || '';
          if (mode.endsWithParent && parent.terminator_end) mode.terminator_end += (mode.end ? '|' : '') + parent.terminator_end;
        }

        if (mode.illegal) mode.illegalRe = langRe(mode.illegal);
        if (mode.relevance == null) mode.relevance = 1;

        if (!mode.contains) {
          mode.contains = [];
        }

        mode.contains = Array.prototype.concat.apply([], mode.contains.map(function (c) {
          return expand_mode(c === 'self' ? mode : c);
        }));
        mode.contains.forEach(function (c) {
          compileMode(c, mode);
        });

        if (mode.starts) {
          compileMode(mode.starts, parent);
        }

        var terminators = mode.contains.map(function (c) {
          return c.beginKeywords ? '\\.?(?:' + c.begin + ')\\.?' : c.begin;
        }).concat([mode.terminator_end, mode.illegal]).map(reStr).filter(Boolean);
        mode.terminators = terminators.length ? langRe(joinRe(terminators, '|'), true) : {
          exec: function ()
          /*s*/
          {
            return null;
          }
        };
      }

      compileMode(language);
    }
    /*
    Core highlighting function. Accepts a language name, or an alias, and a
    string with the code to highlight. Returns an object with the following
    properties:
     - relevance (int)
    - value (an HTML string with highlighting markup)
     */


    function highlight(name, value, ignore_illegals, continuation) {
      function escapeRe(value) {
        return new RegExp(value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'm');
      }

      function subMode(lexeme, mode) {
        var i, length;

        for (i = 0, length = mode.contains.length; i < length; i++) {
          if (testRe(mode.contains[i].beginRe, lexeme)) {
            if (mode.contains[i].endSameAsBegin) {
              mode.contains[i].endRe = escapeRe(mode.contains[i].beginRe.exec(lexeme)[0]);
            }

            return mode.contains[i];
          }
        }
      }

      function endOfMode(mode, lexeme) {
        if (testRe(mode.endRe, lexeme)) {
          while (mode.endsParent && mode.parent) {
            mode = mode.parent;
          }

          return mode;
        }

        if (mode.endsWithParent) {
          return endOfMode(mode.parent, lexeme);
        }
      }

      function isIllegal(lexeme, mode) {
        return !ignore_illegals && testRe(mode.illegalRe, lexeme);
      }

      function keywordMatch(mode, match) {
        var match_str = language.case_insensitive ? match[0].toLowerCase() : match[0];
        return mode.keywords.hasOwnProperty(match_str) && mode.keywords[match_str];
      }

      function buildSpan(classname, insideSpan, leaveOpen, noPrefix) {
        var classPrefix = noPrefix ? '' : options.classPrefix,
            openSpan = '<span class="' + classPrefix,
            closeSpan = leaveOpen ? '' : spanEndTag;
        openSpan += classname + '">';
        if (!classname) return insideSpan;
        return openSpan + insideSpan + closeSpan;
      }

      function processKeywords() {
        var keyword_match, last_index, match, result;
        if (!top.keywords) return escape(mode_buffer);
        result = '';
        last_index = 0;
        top.lexemesRe.lastIndex = 0;
        match = top.lexemesRe.exec(mode_buffer);

        while (match) {
          result += escape(mode_buffer.substring(last_index, match.index));
          keyword_match = keywordMatch(top, match);

          if (keyword_match) {
            relevance += keyword_match[1];
            result += buildSpan(keyword_match[0], escape(match[0]));
          } else {
            result += escape(match[0]);
          }

          last_index = top.lexemesRe.lastIndex;
          match = top.lexemesRe.exec(mode_buffer);
        }

        return result + escape(mode_buffer.substr(last_index));
      }

      function processSubLanguage() {
        var explicit = typeof top.subLanguage === 'string';

        if (explicit && !languages[top.subLanguage]) {
          return escape(mode_buffer);
        }

        var result = explicit ? highlight(top.subLanguage, mode_buffer, true, continuations[top.subLanguage]) : highlightAuto(mode_buffer, top.subLanguage.length ? top.subLanguage : undefined); // Counting embedded language score towards the host language may be disabled
        // with zeroing the containing mode relevance. Usecase in point is Markdown that
        // allows XML everywhere and makes every XML snippet to have a much larger Markdown
        // score.

        if (top.relevance > 0) {
          relevance += result.relevance;
        }

        if (explicit) {
          continuations[top.subLanguage] = result.top;
        }

        return buildSpan(result.language, result.value, false, true);
      }

      function processBuffer() {
        result += top.subLanguage != null ? processSubLanguage() : processKeywords();
        mode_buffer = '';
      }

      function startNewMode(mode) {
        result += mode.className ? buildSpan(mode.className, '', true) : '';
        top = Object.create(mode, {
          parent: {
            value: top
          }
        });
      }

      function processLexeme(buffer, lexeme) {
        mode_buffer += buffer;

        if (lexeme == null) {
          processBuffer();
          return 0;
        }

        var new_mode = subMode(lexeme, top);

        if (new_mode) {
          if (new_mode.skip) {
            mode_buffer += lexeme;
          } else {
            if (new_mode.excludeBegin) {
              mode_buffer += lexeme;
            }

            processBuffer();

            if (!new_mode.returnBegin && !new_mode.excludeBegin) {
              mode_buffer = lexeme;
            }
          }

          startNewMode(new_mode);
          return new_mode.returnBegin ? 0 : lexeme.length;
        }

        var end_mode = endOfMode(top, lexeme);

        if (end_mode) {
          var origin = top;

          if (origin.skip) {
            mode_buffer += lexeme;
          } else {
            if (!(origin.returnEnd || origin.excludeEnd)) {
              mode_buffer += lexeme;
            }

            processBuffer();

            if (origin.excludeEnd) {
              mode_buffer = lexeme;
            }
          }

          do {
            if (top.className) {
              result += spanEndTag;
            }

            if (!top.skip && !top.subLanguage) {
              relevance += top.relevance;
            }

            top = top.parent;
          } while (top !== end_mode.parent);

          if (end_mode.starts) {
            if (end_mode.endSameAsBegin) {
              end_mode.starts.endRe = end_mode.endRe;
            }

            startNewMode(end_mode.starts);
          }

          return origin.returnEnd ? 0 : lexeme.length;
        }

        if (isIllegal(lexeme, top)) throw new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.className || '<unnamed>') + '"');
        /*
        Parser should not reach this point as all types of lexemes should be caught
        earlier, but if it does due to some bug make sure it advances at least one
        character forward to prevent infinite looping.
        */

        mode_buffer += lexeme;
        return lexeme.length || 1;
      }

      var language = getLanguage(name);

      if (!language) {
        throw new Error('Unknown language: "' + name + '"');
      }

      compileLanguage(language);
      var top = continuation || language;
      var continuations = {}; // keep continuations for sub-languages

      var result = '',
          current;

      for (current = top; current !== language; current = current.parent) {
        if (current.className) {
          result = buildSpan(current.className, '', true) + result;
        }
      }

      var mode_buffer = '';
      var relevance = 0;

      try {
        var match,
            count,
            index = 0;

        while (true) {
          top.terminators.lastIndex = index;
          match = top.terminators.exec(value);
          if (!match) break;
          count = processLexeme(value.substring(index, match.index), match[0]);
          index = match.index + count;
        }

        processLexeme(value.substr(index));

        for (current = top; current.parent; current = current.parent) {
          // close dangling modes
          if (current.className) {
            result += spanEndTag;
          }
        }

        return {
          relevance: relevance,
          value: result,
          language: name,
          top: top
        };
      } catch (e) {
        if (e.message && e.message.indexOf('Illegal') !== -1) {
          return {
            relevance: 0,
            value: escape(value)
          };
        } else {
          throw e;
        }
      }
    }
    /*
    Highlighting with language detection. Accepts a string with the code to
    highlight. Returns an object with the following properties:
     - language (detected language)
    - relevance (int)
    - value (an HTML string with highlighting markup)
    - second_best (object with the same structure for second-best heuristically
      detected language, may be absent)
     */


    function highlightAuto(text, languageSubset) {
      languageSubset = languageSubset || options.languages || objectKeys(languages);
      var result = {
        relevance: 0,
        value: escape(text)
      };
      var second_best = result;
      languageSubset.filter(getLanguage).filter(autoDetection).forEach(function (name) {
        var current = highlight(name, text, false);
        current.language = name;

        if (current.relevance > second_best.relevance) {
          second_best = current;
        }

        if (current.relevance > result.relevance) {
          second_best = result;
          result = current;
        }
      });

      if (second_best.language) {
        result.second_best = second_best;
      }

      return result;
    }
    /*
    Post-processing of the highlighted markup:
     - replace TABs with something more useful
    - replace real line-breaks with '<br>' for non-pre containers
     */


    function fixMarkup(value) {
      return !(options.tabReplace || options.useBR) ? value : value.replace(fixMarkupRe, function (match, p1) {
        if (options.useBR && match === '\n') {
          return '<br>';
        } else if (options.tabReplace) {
          return p1.replace(/\t/g, options.tabReplace);
        }

        return '';
      });
    }

    function buildClassName(prevClassName, currentLang, resultLang) {
      var language = currentLang ? aliases[currentLang] : resultLang,
          result = [prevClassName.trim()];

      if (!prevClassName.match(/\bhljs\b/)) {
        result.push('hljs');
      }

      if (prevClassName.indexOf(language) === -1) {
        result.push(language);
      }

      return result.join(' ').trim();
    }
    /*
    Applies highlighting to a DOM node containing code. Accepts a DOM node and
    two optional parameters for fixMarkup.
    */


    function highlightBlock(block) {
      var node, originalStream, result, resultNode, text;
      var language = blockLanguage(block);
      if (isNotHighlighted(language)) return;

      if (options.useBR) {
        node = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        node.innerHTML = block.innerHTML.replace(/\n/g, '').replace(/<br[ \/]*>/g, '\n');
      } else {
        node = block;
      }

      text = node.textContent;
      result = language ? highlight(language, text, true) : highlightAuto(text);
      originalStream = nodeStream(node);

      if (originalStream.length) {
        resultNode = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        resultNode.innerHTML = result.value;
        result.value = mergeStreams(originalStream, nodeStream(resultNode), text);
      }

      result.value = fixMarkup(result.value);
      block.innerHTML = result.value;
      block.className = buildClassName(block.className, language, result.language);
      block.result = {
        language: result.language,
        re: result.relevance
      };

      if (result.second_best) {
        block.second_best = {
          language: result.second_best.language,
          re: result.second_best.relevance
        };
      }
    }
    /*
    Updates highlight.js global options with values passed in the form of an object.
    */


    function configure(user_options) {
      options = inherit(options, user_options);
    }
    /*
    Applies highlighting to all <pre><code>..</code></pre> blocks on a page.
    */


    function initHighlighting() {
      if (initHighlighting.called) return;
      initHighlighting.called = true;
      var blocks = document.querySelectorAll('pre code');
      ArrayProto.forEach.call(blocks, highlightBlock);
    }
    /*
    Attaches highlighting to the page load event.
    */


    function initHighlightingOnLoad() {
      addEventListener('DOMContentLoaded', initHighlighting, false);
      addEventListener('load', initHighlighting, false);
    }

    function registerLanguage(name, language) {
      var lang = languages[name] = language(hljs);

      if (lang.aliases) {
        lang.aliases.forEach(function (alias) {
          aliases[alias] = name;
        });
      }
    }

    function listLanguages() {
      return objectKeys(languages);
    }

    function getLanguage(name) {
      name = (name || '').toLowerCase();
      return languages[name] || languages[aliases[name]];
    }

    function autoDetection(name) {
      var lang = getLanguage(name);
      return lang && !lang.disableAutodetect;
    }
    /* Interface definition */


    hljs.highlight = highlight;
    hljs.highlightAuto = highlightAuto;
    hljs.fixMarkup = fixMarkup;
    hljs.highlightBlock = highlightBlock;
    hljs.configure = configure;
    hljs.initHighlighting = initHighlighting;
    hljs.initHighlightingOnLoad = initHighlightingOnLoad;
    hljs.registerLanguage = registerLanguage;
    hljs.listLanguages = listLanguages;
    hljs.getLanguage = getLanguage;
    hljs.autoDetection = autoDetection;
    hljs.inherit = inherit; // Common regexps

    hljs.IDENT_RE = '[a-zA-Z]\\w*';
    hljs.UNDERSCORE_IDENT_RE = '[a-zA-Z_]\\w*';
    hljs.NUMBER_RE = '\\b\\d+(\\.\\d+)?';
    hljs.C_NUMBER_RE = '(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)'; // 0x..., 0..., decimal, float

    hljs.BINARY_NUMBER_RE = '\\b(0b[01]+)'; // 0b...

    hljs.RE_STARTERS_RE = '!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~'; // Common modes

    hljs.BACKSLASH_ESCAPE = {
      begin: '\\\\[\\s\\S]',
      relevance: 0
    };
    hljs.APOS_STRING_MODE = {
      className: 'string',
      begin: '\'',
      end: '\'',
      illegal: '\\n',
      contains: [hljs.BACKSLASH_ESCAPE]
    };
    hljs.QUOTE_STRING_MODE = {
      className: 'string',
      begin: '"',
      end: '"',
      illegal: '\\n',
      contains: [hljs.BACKSLASH_ESCAPE]
    };
    hljs.PHRASAL_WORDS_MODE = {
      begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
    };

    hljs.COMMENT = function (begin, end, inherits) {
      var mode = hljs.inherit({
        className: 'comment',
        begin: begin,
        end: end,
        contains: []
      }, inherits || {});
      mode.contains.push(hljs.PHRASAL_WORDS_MODE);
      mode.contains.push({
        className: 'doctag',
        begin: '(?:TODO|FIXME|NOTE|BUG|XXX):',
        relevance: 0
      });
      return mode;
    };

    hljs.C_LINE_COMMENT_MODE = hljs.COMMENT('//', '$');
    hljs.C_BLOCK_COMMENT_MODE = hljs.COMMENT('/\\*', '\\*/');
    hljs.HASH_COMMENT_MODE = hljs.COMMENT('#', '$');
    hljs.NUMBER_MODE = {
      className: 'number',
      begin: hljs.NUMBER_RE,
      relevance: 0
    };
    hljs.C_NUMBER_MODE = {
      className: 'number',
      begin: hljs.C_NUMBER_RE,
      relevance: 0
    };
    hljs.BINARY_NUMBER_MODE = {
      className: 'number',
      begin: hljs.BINARY_NUMBER_RE,
      relevance: 0
    };
    hljs.CSS_NUMBER_MODE = {
      className: 'number',
      begin: hljs.NUMBER_RE + '(' + '%|em|ex|ch|rem' + '|vw|vh|vmin|vmax' + '|cm|mm|in|pt|pc|px' + '|deg|grad|rad|turn' + '|s|ms' + '|Hz|kHz' + '|dpi|dpcm|dppx' + ')?',
      relevance: 0
    };
    hljs.REGEXP_MODE = {
      className: 'regexp',
      begin: /\//,
      end: /\/[gimuy]*/,
      illegal: /\n/,
      contains: [hljs.BACKSLASH_ESCAPE, {
        begin: /\[/,
        end: /\]/,
        relevance: 0,
        contains: [hljs.BACKSLASH_ESCAPE]
      }]
    };
    hljs.TITLE_MODE = {
      className: 'title',
      begin: hljs.IDENT_RE,
      relevance: 0
    };
    hljs.UNDERSCORE_TITLE_MODE = {
      className: 'title',
      begin: hljs.UNDERSCORE_IDENT_RE,
      relevance: 0
    };
    hljs.METHOD_GUARD = {
      // excludes method names from keyword processing
      begin: '\\.\\s*' + hljs.UNDERSCORE_IDENT_RE,
      relevance: 0
    };
    return hljs;
  });
});

var bash = function (hljs) {
  var VAR = {
    className: 'variable',
    variants: [{
      begin: /\$[\w\d#@][\w\d_]*/
    }, {
      begin: /\$\{(.*?)}/
    }]
  };
  var QUOTE_STRING = {
    className: 'string',
    begin: /"/,
    end: /"/,
    contains: [hljs.BACKSLASH_ESCAPE, VAR, {
      className: 'variable',
      begin: /\$\(/,
      end: /\)/,
      contains: [hljs.BACKSLASH_ESCAPE]
    }]
  };
  var ESCAPED_QUOTE = {
    className: '',
    begin: /\\"/
  };
  var APOS_STRING = {
    className: 'string',
    begin: /'/,
    end: /'/
  };
  return {
    aliases: ['sh', 'zsh'],
    lexemes: /\b-?[a-z\._]+\b/,
    keywords: {
      keyword: 'if then else elif fi for while in do done case esac function',
      literal: 'true false',
      built_in: // Shell built-ins
      // http://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
      'break cd continue eval exec exit export getopts hash pwd readonly return shift test times ' + 'trap umask unset ' + // Bash built-ins
      'alias bind builtin caller command declare echo enable help let local logout mapfile printf ' + 'read readarray source type typeset ulimit unalias ' + // Shell modifiers
      'set shopt ' + // Zsh built-ins
      'autoload bg bindkey bye cap chdir clone comparguments compcall compctl compdescribe compfiles ' + 'compgroups compquote comptags comptry compvalues dirs disable disown echotc echoti emulate ' + 'fc fg float functions getcap getln history integer jobs kill limit log noglob popd print ' + 'pushd pushln rehash sched setcap setopt stat suspend ttyctl unfunction unhash unlimit ' + 'unsetopt vared wait whence where which zcompile zformat zftp zle zmodload zparseopts zprof ' + 'zpty zregexparse zsocket zstyle ztcp',
      _: '-ne -eq -lt -gt -f -d -e -s -l -a' // relevance booster

    },
    contains: [{
      className: 'meta',
      begin: /^#![^\n]+sh\s*$/,
      relevance: 10
    }, {
      className: 'function',
      begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
      returnBegin: true,
      contains: [hljs.inherit(hljs.TITLE_MODE, {
        begin: /\w[\w\d_]*/
      })],
      relevance: 0
    }, hljs.HASH_COMMENT_MODE, QUOTE_STRING, ESCAPED_QUOTE, APOS_STRING, VAR]
  };
};

var shell = function (hljs) {
  return {
    aliases: ['console'],
    contains: [{
      className: 'meta',
      begin: '^\\s{0,3}[\\w\\d\\[\\]()@-]*[>%$#]',
      starts: {
        end: '$',
        subLanguage: 'bash'
      }
    }]
  };
};

var xml = function (hljs) {
  var XML_IDENT_RE = '[A-Za-z0-9\\._:-]+';
  var TAG_INTERNALS = {
    endsWithParent: true,
    illegal: /</,
    relevance: 0,
    contains: [{
      className: 'attr',
      begin: XML_IDENT_RE,
      relevance: 0
    }, {
      begin: /=\s*/,
      relevance: 0,
      contains: [{
        className: 'string',
        endsParent: true,
        variants: [{
          begin: /"/,
          end: /"/
        }, {
          begin: /'/,
          end: /'/
        }, {
          begin: /[^\s"'=<>`]+/
        }]
      }]
    }]
  };
  return {
    aliases: ['html', 'xhtml', 'rss', 'atom', 'xjb', 'xsd', 'xsl', 'plist', 'wsf'],
    case_insensitive: true,
    contains: [{
      className: 'meta',
      begin: '<!DOCTYPE',
      end: '>',
      relevance: 10,
      contains: [{
        begin: '\\[',
        end: '\\]'
      }]
    }, hljs.COMMENT('<!--', '-->', {
      relevance: 10
    }), {
      begin: '<\\!\\[CDATA\\[',
      end: '\\]\\]>',
      relevance: 10
    }, {
      className: 'meta',
      begin: /<\?xml/,
      end: /\?>/,
      relevance: 10
    }, {
      begin: /<\?(php)?/,
      end: /\?>/,
      subLanguage: 'php',
      contains: [// We don't want the php closing tag ?> to close the PHP block when
      // inside any of the following blocks:
      {
        begin: '/\\*',
        end: '\\*/',
        skip: true
      }, {
        begin: 'b"',
        end: '"',
        skip: true
      }, {
        begin: 'b\'',
        end: '\'',
        skip: true
      }, hljs.inherit(hljs.APOS_STRING_MODE, {
        illegal: null,
        className: null,
        contains: null,
        skip: true
      }), hljs.inherit(hljs.QUOTE_STRING_MODE, {
        illegal: null,
        className: null,
        contains: null,
        skip: true
      })]
    }, {
      className: 'tag',

      /*
      The lookahead pattern (?=...) ensures that 'begin' only matches
      '<style' as a single word, followed by a whitespace or an
      ending braket. The '$' is needed for the lexeme to be recognized
      by hljs.subMode() that tests lexemes outside the stream.
      */
      begin: '<style(?=\\s|>|$)',
      end: '>',
      keywords: {
        name: 'style'
      },
      contains: [TAG_INTERNALS],
      starts: {
        end: '</style>',
        returnEnd: true,
        subLanguage: ['css', 'xml']
      }
    }, {
      className: 'tag',
      // See the comment in the <style tag about the lookahead pattern
      begin: '<script(?=\\s|>|$)',
      end: '>',
      keywords: {
        name: 'script'
      },
      contains: [TAG_INTERNALS],
      starts: {
        end: '\<\/script\>',
        returnEnd: true,
        subLanguage: ['actionscript', 'javascript', 'handlebars', 'xml', 'vbscript']
      }
    }, {
      className: 'tag',
      begin: '</?',
      end: '/?>',
      contains: [{
        className: 'name',
        begin: /[^\/><\s]+/,
        relevance: 0
      }, TAG_INTERNALS]
    }]
  };
};

var asciidoc = function (hljs) {
  return {
    aliases: ['adoc'],
    contains: [// block comment
    hljs.COMMENT('^/{4,}\\n', '\\n/{4,}$', // can also be done as...
    //'^/{4,}$',
    //'^/{4,}$',
    {
      relevance: 10
    }), // line comment
    hljs.COMMENT('^//', '$', {
      relevance: 0
    }), // title
    {
      className: 'title',
      begin: '^\\.\\w.*$'
    }, // example, admonition & sidebar blocks
    {
      begin: '^[=\\*]{4,}\\n',
      end: '\\n^[=\\*]{4,}$',
      relevance: 10
    }, // headings
    {
      className: 'section',
      relevance: 10,
      variants: [{
        begin: '^(={1,5}) .+?( \\1)?$'
      }, {
        begin: '^[^\\[\\]\\n]+?\\n[=\\-~\\^\\+]{2,}$'
      }]
    }, // document attributes
    {
      className: 'meta',
      begin: '^:.+?:',
      end: '\\s',
      excludeEnd: true,
      relevance: 10
    }, // block attributes
    {
      className: 'meta',
      begin: '^\\[.+?\\]$',
      relevance: 0
    }, // quoteblocks
    {
      className: 'quote',
      begin: '^_{4,}\\n',
      end: '\\n_{4,}$',
      relevance: 10
    }, // listing and literal blocks
    {
      className: 'code',
      begin: '^[\\-\\.]{4,}\\n',
      end: '\\n[\\-\\.]{4,}$',
      relevance: 10
    }, // passthrough blocks
    {
      begin: '^\\+{4,}\\n',
      end: '\\n\\+{4,}$',
      contains: [{
        begin: '<',
        end: '>',
        subLanguage: 'xml',
        relevance: 0
      }],
      relevance: 10
    }, // lists (can only capture indicators)
    {
      className: 'bullet',
      begin: '^(\\*+|\\-+|\\.+|[^\\n]+?::)\\s+'
    }, // admonition
    {
      className: 'symbol',
      begin: '^(NOTE|TIP|IMPORTANT|WARNING|CAUTION):\\s+',
      relevance: 10
    }, // inline strong
    {
      className: 'strong',
      // must not follow a word character or be followed by an asterisk or space
      begin: '\\B\\*(?![\\*\\s])',
      end: '(\\n{2}|\\*)',
      // allow escaped asterisk followed by word char
      contains: [{
        begin: '\\\\*\\w',
        relevance: 0
      }]
    }, // inline emphasis
    {
      className: 'emphasis',
      // must not follow a word character or be followed by a single quote or space
      begin: '\\B\'(?![\'\\s])',
      end: '(\\n{2}|\')',
      // allow escaped single quote followed by word char
      contains: [{
        begin: '\\\\\'\\w',
        relevance: 0
      }],
      relevance: 0
    }, // inline emphasis (alt)
    {
      className: 'emphasis',
      // must not follow a word character or be followed by an underline or space
      begin: '_(?![_\\s])',
      end: '(\\n{2}|_)',
      relevance: 0
    }, // inline smart quotes
    {
      className: 'string',
      variants: [{
        begin: "``.+?''"
      }, {
        begin: "`.+?'"
      }]
    }, // inline code snippets (TODO should get same treatment as strong and emphasis)
    {
      className: 'code',
      begin: '(`.+?`|\\+.+?\\+)',
      relevance: 0
    }, // indented literal block
    {
      className: 'code',
      begin: '^[ \\t]',
      end: '$',
      relevance: 0
    }, // horizontal rules
    {
      begin: '^\'{3,}[ \\t]*$',
      relevance: 10
    }, // images and links
    {
      begin: '(link:)?(http|https|ftp|file|irc|image:?):\\S+\\[.*?\\]',
      returnBegin: true,
      contains: [{
        begin: '(link|image:?):',
        relevance: 0
      }, {
        className: 'link',
        begin: '\\w',
        end: '[^\\[]+',
        relevance: 0
      }, {
        className: 'string',
        begin: '\\[',
        end: '\\]',
        excludeBegin: true,
        excludeEnd: true,
        relevance: 0
      }],
      relevance: 10
    }]
  };
};

var javascript = function (hljs) {
  var IDENT_RE = '[A-Za-z$_][0-9A-Za-z$_]*';
  var KEYWORDS = {
    keyword: 'in of if for while finally var new function do return void else break catch ' + 'instanceof with throw case default try this switch continue typeof delete ' + 'let yield const export super debugger as async await static ' + // ECMAScript 6 modules import
    'import from as',
    literal: 'true false null undefined NaN Infinity',
    built_in: 'eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent ' + 'encodeURI encodeURIComponent escape unescape Object Function Boolean Error ' + 'EvalError InternalError RangeError ReferenceError StopIteration SyntaxError ' + 'TypeError URIError Number Math Date String RegExp Array Float32Array ' + 'Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array ' + 'Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require ' + 'module console window document Symbol Set Map WeakSet WeakMap Proxy Reflect ' + 'Promise'
  };
  var NUMBER = {
    className: 'number',
    variants: [{
      begin: '\\b(0[bB][01]+)'
    }, {
      begin: '\\b(0[oO][0-7]+)'
    }, {
      begin: hljs.C_NUMBER_RE
    }],
    relevance: 0
  };
  var SUBST = {
    className: 'subst',
    begin: '\\$\\{',
    end: '\\}',
    keywords: KEYWORDS,
    contains: [] // defined later

  };
  var HTML_TEMPLATE = {
    begin: 'html`',
    end: '',
    starts: {
      end: '`',
      returnEnd: false,
      contains: [hljs.BACKSLASH_ESCAPE, SUBST],
      subLanguage: 'xml'
    }
  };
  var CSS_TEMPLATE = {
    begin: 'css`',
    end: '',
    starts: {
      end: '`',
      returnEnd: false,
      contains: [hljs.BACKSLASH_ESCAPE, SUBST],
      subLanguage: 'css'
    }
  };
  var TEMPLATE_STRING = {
    className: 'string',
    begin: '`',
    end: '`',
    contains: [hljs.BACKSLASH_ESCAPE, SUBST]
  };
  SUBST.contains = [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, HTML_TEMPLATE, CSS_TEMPLATE, TEMPLATE_STRING, NUMBER, hljs.REGEXP_MODE];
  var PARAMS_CONTAINS = SUBST.contains.concat([hljs.C_BLOCK_COMMENT_MODE, hljs.C_LINE_COMMENT_MODE]);
  return {
    aliases: ['js', 'jsx'],
    keywords: KEYWORDS,
    contains: [{
      className: 'meta',
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    }, {
      className: 'meta',
      begin: /^#!/,
      end: /$/
    }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, HTML_TEMPLATE, CSS_TEMPLATE, TEMPLATE_STRING, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, NUMBER, {
      // object attr container
      begin: /[{,]\s*/,
      relevance: 0,
      contains: [{
        begin: IDENT_RE + '\\s*:',
        returnBegin: true,
        relevance: 0,
        contains: [{
          className: 'attr',
          begin: IDENT_RE,
          relevance: 0
        }]
      }]
    }, {
      // "value" container
      begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
      keywords: 'return throw case',
      contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.REGEXP_MODE, {
        className: 'function',
        begin: '(\\(.*?\\)|' + IDENT_RE + ')\\s*=>',
        returnBegin: true,
        end: '\\s*=>',
        contains: [{
          className: 'params',
          variants: [{
            begin: IDENT_RE
          }, {
            begin: /\(\s*\)/
          }, {
            begin: /\(/,
            end: /\)/,
            excludeBegin: true,
            excludeEnd: true,
            keywords: KEYWORDS,
            contains: PARAMS_CONTAINS
          }]
        }]
      }, {
        className: '',
        begin: /\s/,
        end: /\s*/,
        skip: true
      }, {
        // E4X / JSX
        begin: /</,
        end: /(\/[A-Za-z0-9\\._:-]+|[A-Za-z0-9\\._:-]+\/)>/,
        subLanguage: 'xml',
        contains: [{
          begin: /<[A-Za-z0-9\\._:-]+\s*\/>/,
          skip: true
        }, {
          begin: /<[A-Za-z0-9\\._:-]+/,
          end: /(\/[A-Za-z0-9\\._:-]+|[A-Za-z0-9\\._:-]+\/)>/,
          skip: true,
          contains: [{
            begin: /<[A-Za-z0-9\\._:-]+\s*\/>/,
            skip: true
          }, 'self']
        }]
      }],
      relevance: 0
    }, {
      className: 'function',
      beginKeywords: 'function',
      end: /\{/,
      excludeEnd: true,
      contains: [hljs.inherit(hljs.TITLE_MODE, {
        begin: IDENT_RE
      }), {
        className: 'params',
        begin: /\(/,
        end: /\)/,
        excludeBegin: true,
        excludeEnd: true,
        contains: PARAMS_CONTAINS
      }],
      illegal: /\[|%/
    }, {
      begin: /\$[(.]/ // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`

    }, hljs.METHOD_GUARD, {
      // ES6 class
      className: 'class',
      beginKeywords: 'class',
      end: /[{;=]/,
      excludeEnd: true,
      illegal: /[:"\[\]]/,
      contains: [{
        beginKeywords: 'extends'
      }, hljs.UNDERSCORE_TITLE_MODE]
    }, {
      beginKeywords: 'constructor get set',
      end: /\{/,
      excludeEnd: true
    }],
    illegal: /#(?!!)/
  };
};

highlight.registerLanguage('bash', bash);
highlight.registerLanguage('shell', shell);
highlight.registerLanguage('xml', xml);
highlight.registerLanguage('asciidoc', asciidoc);
highlight.registerLanguage('javascript', javascript);
var md = markdownIt({
  html: true,
  highlight: function highlight$1(code, lang) {
    return highlight.highlightAuto(code, [lang]).value;
  }
});
md.use(markdownItAttrs);
var DEFAULT_SLIDE_SEPARATOR = '^\r?\n---\r?\n$',
    DEFAULT_NOTES_SEPARATOR = 'notes?:',
    DEFAULT_ELEMENT_ATTRIBUTES_SEPARATOR = '\\\.element\\\s*?(.+?)$',
    DEFAULT_SLIDE_ATTRIBUTES_SEPARATOR = '\\\.slide:\\\s*?(\\\S.+?)$';
var SCRIPT_END_PLACEHOLDER = '__SCRIPT_END__';
/**
 * Retrieves the markdown contents of a slide section
 * element. Normalizes leading tabs/whitespace.
 */

function getMarkdownFromSlide(section) {
  // look for a <script> or <textarea data-template> wrapper
  var template = section.querySelector('[data-template]') || section.querySelector('script'); // strip leading whitespace so it isn't evaluated as code

  var text = (template || section).textContent; // restore script end tags

  text = text.replace(new RegExp(SCRIPT_END_PLACEHOLDER, 'g'), '</script>');
  var leadingWs = text.match(/^\n?(\s*)/)[1].length,
      leadingTabs = text.match(/^\n?(\t*)/)[1].length;

  if (leadingTabs > 0) {
    text = text.replace(new RegExp('\\n?\\t{' + leadingTabs + '}', 'g'), '\n');
  } else if (leadingWs > 1) {
    text = text.replace(new RegExp('\\n? {' + leadingWs + '}', 'g'), '\n');
  }

  return text;
}
/**
 * Given a markdown slide section element, this will
 * return all arguments that aren't related to markdown
 * parsing. Used to forward any other user-defined arguments
 * to the output markdown slide.
 */


function getForwardedAttributes(section) {
  var attributes = section.attributes;
  var result = [];

  for (var i = 0, len = attributes.length; i < len; i++) {
    var name = attributes[i].name,
        value = attributes[i].value; // disregard attributes that are used for markdown loading/parsing

    if (/data\-(markdown|separator|vertical|notes)/gi.test(name)) continue;

    if (value) {
      result.push(name + '="' + value + '"');
    } else {
      result.push(name);
    }
  }

  return result.join(' ');
}
/**
 * Inspects the given options and fills out default
 * values for what's not defined.
 */


function getSlidifyOptions(options) {
  options = options || {};
  options.separator = options.separator || DEFAULT_SLIDE_SEPARATOR;
  options.notesSeparator = options.notesSeparator || DEFAULT_NOTES_SEPARATOR;
  options.attributes = options.attributes || '';
  return options;
}
/**
 * Helper function for constructing a markdown slide.
 */


function createMarkdownSlide(content, options) {
  options = getSlidifyOptions(options);
  var notesMatch = content.split(new RegExp(options.notesSeparator, 'mgi'));

  if (notesMatch.length === 2) {
    content = notesMatch[0] + '<aside class="notes">' + md.render(notesMatch[1].trim()) + '</aside>';
  } // prevent script end tags in the content from interfering
  // with parsing


  content = content.replace(/<\/script>/g, SCRIPT_END_PLACEHOLDER);
  return '<script type="text/template">' + content + '</script>';
}
/**
 * Parses a data string into multiple slides based
 * on the passed in separator arguments.
 */


function slidify(markdown, options) {
  options = getSlidifyOptions(options);
  var separatorRegex = new RegExp(options.separator + (options.verticalSeparator ? '|' + options.verticalSeparator : ''), 'mg'),
      horizontalSeparatorRegex = new RegExp(options.separator);
  var matches,
      lastIndex = 0,
      isHorizontal,
      wasHorizontal = true,
      content,
      sectionStack = []; // iterate until all blocks between separators are stacked up

  while (matches = separatorRegex.exec(markdown)) {

    isHorizontal = horizontalSeparatorRegex.test(matches[0]);

    if (!isHorizontal && wasHorizontal) {
      // create vertical stack
      sectionStack.push([]);
    } // pluck slide content from markdown input


    content = markdown.substring(lastIndex, matches.index);

    if (isHorizontal && wasHorizontal) {
      // add to horizontal stack
      sectionStack.push(content);
    } else {
      // add to vertical stack
      sectionStack[sectionStack.length - 1].push(content);
    }

    lastIndex = separatorRegex.lastIndex;
    wasHorizontal = isHorizontal;
  } // add the remaining slide


  (wasHorizontal ? sectionStack : sectionStack[sectionStack.length - 1]).push(markdown.substring(lastIndex));
  var markdownSections = ''; // flatten the hierarchical stack, and insert <section data-markdown> tags

  for (var i = 0, len = sectionStack.length; i < len; i++) {
    // vertical
    if (sectionStack[i] instanceof Array) {
      markdownSections += '<section ' + options.attributes + '>';
      sectionStack[i].forEach(function (child) {
        markdownSections += '<section data-markdown>' + createMarkdownSlide(child, options) + '</section>';
      });
      markdownSections += '</section>';
    } else {
      markdownSections += '<section ' + options.attributes + ' data-markdown>' + createMarkdownSlide(sectionStack[i], options) + '</section>';
    }
  }

  return markdownSections;
}
/**
 * Parses any current data-markdown slides, splits
 * multi-slide markdown into separate sections and
 * handles loading of external markdown.
 */


function processSlides() {
  return new Promise(function (resolve) {
    var externalPromises = [];
    [].slice.call(document.querySelectorAll('[data-markdown]')).forEach(function (section, i) {
      if (section.getAttribute('data-markdown').length) {
        externalPromises.push(loadExternalMarkdown(section).then( // Finished loading external file
        function (xhr, url) {
          section.outerHTML = slidify(xhr.responseText, {
            separator: section.getAttribute('data-separator'),
            verticalSeparator: section.getAttribute('data-separator-vertical'),
            notesSeparator: section.getAttribute('data-separator-notes'),
            attributes: getForwardedAttributes(section)
          });
        }, // Failed to load markdown
        function (xhr, url) {
          section.outerHTML = '<section data-state="alert">' + 'ERROR: The attempt to fetch ' + url + ' failed with HTTP status ' + xhr.status + '.' + 'Check your browser\'s JavaScript console for more details.' + '<p>Remember that you need to serve the presentation HTML from a HTTP server.</p>' + '</section>';
        }));
      } else if (section.getAttribute('data-separator') || section.getAttribute('data-separator-vertical') || section.getAttribute('data-separator-notes')) {
        section.outerHTML = slidify(getMarkdownFromSlide(section), {
          separator: section.getAttribute('data-separator'),
          verticalSeparator: section.getAttribute('data-separator-vertical'),
          notesSeparator: section.getAttribute('data-separator-notes'),
          attributes: getForwardedAttributes(section)
        });
      } else {
        section.innerHTML = createMarkdownSlide(getMarkdownFromSlide(section));
      }
    });
    Promise.all(externalPromises).then(resolve);
  });
}

function loadExternalMarkdown(section) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest(),
        url = section.getAttribute('data-markdown');
    datacharset = section.getAttribute('data-charset'); // see https://developer.mozilla.org/en-US/docs/Web/API/element.getAttribute#Notes

    if (datacharset != null && datacharset != '') {
      xhr.overrideMimeType('text/html; charset=' + datacharset);
    }

    xhr.onreadystatechange = function (section, xhr) {
      if (xhr.readyState === 4) {
        // file protocol yields status code 0 (useful for local debug, mobile applications etc.)
        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 0) {
          resolve(xhr, url);
        } else {
          reject(xhr, url);
        }
      }
    }.bind(this, section, xhr);

    xhr.open('GET', url, true);

    try {
      xhr.send();
    } catch (e) {
      alert('Failed to get the Markdown file ' + url + '. Make sure that the presentation and the file are served by a HTTP server and the file can be found there. ' + e);
      resolve(xhr, url);
    }
  });
}
/**
 * Check if a node value has the attributes pattern.
 * If yes, extract it and add that value as one or several attributes
 * to the target element.
 *
 * You need Cache Killer on Chrome to see the effect on any FOM transformation
 * directly on refresh (F5)
 * http://stackoverflow.com/questions/5690269/disabling-chrome-cache-for-website-development/7000899#answer-11786277
 */


function addAttributeInElement(node, elementTarget, separator) {
  var mardownClassesInElementsRegex = new RegExp(separator, 'mg');
  var mardownClassRegex = new RegExp("([^\"= ]+?)=\"([^\"=]+?)\"", 'mg');
  var nodeValue = node.nodeValue;
  var matches, matchesClass;

  if (matches = mardownClassesInElementsRegex.exec(nodeValue)) {
    var classes = matches[1];
    nodeValue = nodeValue.substring(0, matches.index) + nodeValue.substring(mardownClassesInElementsRegex.lastIndex);
    node.nodeValue = nodeValue;

    while (matchesClass = mardownClassRegex.exec(classes)) {
      elementTarget.setAttribute(matchesClass[1], matchesClass[2]);
    }

    return true;
  }

  return false;
}
/**
 * Add attributes to the parent element of a text node,
 * or the element of an attribute node.
 */


function addAttributes(section, element, previousElement, separatorElementAttributes, separatorSectionAttributes) {
  var previousParentElement, childElement, parentSection;

  if (element != null && element.childNodes != undefined && element.childNodes.length > 0) {
    previousParentElement = element;
    var j, aPreviousChildElement;

    for (var i = 0; i < element.childNodes.length; i++) {
      childElement = element.childNodes[i];

      if (i > 0) {
        j = i - 1;

        while (j >= 0) {
          aPreviousChildElement = element.childNodes[j];

          if (typeof aPreviousChildElement.setAttribute == 'function' && aPreviousChildElement.tagName != "BR") {
            previousParentElement = aPreviousChildElement;
            break;
          }

          j = j - 1;
        }
      }

      parentSection = section;

      if (childElement.nodeName == "section") {
        parentSection = childElement;
        previousParentElement = childElement;
      }

      if (typeof childElement.setAttribute == 'function' || childElement.nodeType == Node.COMMENT_NODE) {
        addAttributes(parentSection, childElement, previousParentElement, separatorElementAttributes, separatorSectionAttributes);
      }
    }
  }

  if (element.nodeType == Node.COMMENT_NODE) {
    if (addAttributeInElement(element, previousElement, separatorElementAttributes) == false) {
      addAttributeInElement(element, section, separatorSectionAttributes);
    }
  }
}
/**
 * Converts any current data-markdown slides in the
 * DOM to HTML.
 */


function convertSlides() {
  var sections = document.querySelectorAll('[data-markdown]:not([data-markdown-parsed])');
  [].slice.call(sections).forEach(function (section) {
    section.setAttribute('data-markdown-parsed', true);
    var notes = section.querySelector('aside.notes');
    var markdown = getMarkdownFromSlide(section);
    section.innerHTML = md.render(markdown);
    addAttributes(section, section, null, section.getAttribute('data-element-attributes') || section.parentNode.getAttribute('data-element-attributes') || DEFAULT_ELEMENT_ATTRIBUTES_SEPARATOR, section.getAttribute('data-attributes') || section.parentNode.getAttribute('data-attributes') || DEFAULT_SLIDE_ATTRIBUTES_SEPARATOR); // If there were notes, we need to re-add them after
    // having overwritten the section's HTML

    if (notes) {
      section.appendChild(notes);
    }
  });
  return Promise.resolve();
}

var RevealMarkdown = {
  /**
   * Starts processing and converting Markdown within the
   * current reveal.js deck.
   *
   * @param {function} callback function to invoke once
   * we've finished loading and parsing Markdown
   */
  init: function init(callback) {
    // marked can be configured via reveal.js config options
    var options = Reveal.getConfig().markdown;

    if (options) {
      marked.setOptions(options);
    }

    return processSlides().then(convertSlides);
  },
  // TODO: Do these belong in the API?
  processSlides: processSlides,
  convertSlides: convertSlides,
  slidify: slidify
};

global$1.Reveal = reveal;

var $$ = function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
};

reveal.registerPlugin('randomColors', RevealRandomColors());
reveal.registerPlugin('markdown', RevealMarkdown);
reveal.initialize({
  width: 1024,
  height: 728,
  controls: /(localhost|#live)/.test(location.href) !== true,
  progress: true,
  history: true,
  center: true,
  overview: false,
  rollingLinks: false,
  transition: 'linear'
});
reveal.addEventListener('ready', function () {
  window.localStorage.setItem('reveal-speaker-layout', 'tall');
  $$('a > img').forEach(function (el) {
    el.parentNode.classList.add('image');
  });
  $$('section[data-background]').forEach(function (el) {
    var isEmpty = Array.from(el.children).every(function (child) {
      return typeof child.nodeValue === 'text' && child.nodeValue.trim() === '' || child.classList.contains('notes');
    });

    if (isEmpty) {
      el.classList.add('empty');
    }
  });
  $$('section[data-markdown] > h1, section[data-markdown] > h2, section[data-markdown] > h3').forEach(function (el) {
    if (el.nextElementSibling && el.nextElementSibling.classList.contains('notes')) {
      el.classList.add('last-child');
    }
  });
  $$('section[data-markdown]').forEach(function (section) {
    if (section.querySelectorAll('pre > code').length) {
      section.setAttribute('data-state', 'code');
    }
  });
});
