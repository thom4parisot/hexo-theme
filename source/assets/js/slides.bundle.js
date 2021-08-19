import { c as createCommonjsModule, a as commonjsGlobal } from './chunk__commonjsHelpers.js';
import markdown from 'markdown-it';
import markdownAttributes from 'markdown-it-attrs';

const global$1 = typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};

var reveal = createCommonjsModule(function (module, exports) {
  /*!
   * reveal.js
   * http://revealjs.com
   * MIT licensed
   *
   * Copyright (C) 2020 Hakim El Hattab, http://hakim.se
   */
  (function (root, factory) {
    {
      // Node. Does not work with strict CommonJS.
      module.exports = factory();
    }
  })(commonjsGlobal, function () {

    var Reveal; // The reveal.js version

    var VERSION = '3.9.2';
    var SLIDES_SELECTOR = '.slides section',
        HORIZONTAL_SLIDES_SELECTOR = '.slides>section',
        VERTICAL_SLIDES_SELECTOR = '.slides>section.present>section',
        HOME_SLIDE_SELECTOR = '.slides>section:first-of-type',
        UA = navigator.userAgent,
        // Methods that may not be invoked via the postMessage API
    POST_MESSAGE_METHOD_BLACKLIST = /registerPlugin|registerKeyboardShortcut|addKeyBinding|addEventListener/,
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
      // number for the current slide. The function should take in a slide
      // object and return an array with one string [slideNumber] or
      // three strings [n1,delimiter,n2]. See #formatSlideNumber().
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
      // Number of slides away from the current that are visible on mobile
      // devices. It is advisable to set this to a lower number than
      // viewDistance in order to save resources.
      mobileViewDistance: 2,
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
      isMobileDevice = /(iphone|ipod|ipad|android)/gi.test(UA) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1; // iPadOS

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

      layoutSlideContents(slideWidth, slideHeight); // Compute slide numbers now, before we start duplicating slides

      var doingSlideNumbers = config.slideNumber && /all|print/i.test(config.showSlideNumber);
      toArray(dom.wrapper.querySelectorAll(SLIDES_SELECTOR)).forEach(function (slide) {
        slide.setAttribute('data-slide-number', getSlideNumber(slide));
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


          if (doingSlideNumbers) {
            var numberElement = document.createElement('div');
            numberElement.classList.add('slide-number');
            numberElement.classList.add('slide-number-pdf');
            numberElement.innerHTML = slide.getAttribute('data-slide-number');
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
      isPrintingPDF(); // Clear prior backgrounds

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
      if (data.backgroundTransition) element.setAttribute('data-background-transition', data.backgroundTransition);
      if (slide.hasAttribute('data-preload')) element.setAttribute('data-preload', ''); // Background image options are set on the content wrapper

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
              if (POST_MESSAGE_METHOD_BLACKLIST.test(data.method) === false) {
                var result = Reveal[data.method].apply(Reveal, data.args); // Dispatch a postMessage event with the returned value from
                // our method invocation for getter functions

                dispatchPostMessage('callback', {
                  method: data.method,
                  result: result
                });
              } else {
                console.warn('reveal.js: "' + data.method + '" is is blacklisted from the postMessage API');
              }
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

      keyboardShortcuts['Home  ,  Shift &#8592;'] = 'First slide';
      keyboardShortcuts['End  ,  Shift &#8594;'] = 'Last slide';
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

      dispatchPostMessage(type);
    }
    /**
     * Dispatched a postMessage of the given type from our window.
     */


    function dispatchPostMessage(type, data) {
      if (config.postMessageEvents && window.parent !== window.self) {
        var message = {
          namespace: 'reveal',
          eventName: type,
          state: getState()
        };
        extend(message, data);
        window.parent.postMessage(JSON.stringify(message), '*');
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
            // Zoom Scaling
            // Content remains crisp no matter how much we scale. Side
            // effects are minor differences in text layout and iframe
            // viewports changing size. A 200x200 iframe viewport in a
            // 2x zoomed presentation ends up having a 400x400 viewport.
            if (scale > 1 && features.zoom && window.devicePixelRatio < 2) {
              dom.slides.style.zoom = scale;
              dom.slides.style.left = '';
              dom.slides.style.top = '';
              dom.slides.style.bottom = '';
              dom.slides.style.right = '';
              transformSlides({
                layout: ''
              });
            } // Transform Scaling
            // Content layout remains the exact same when scaled up.
            // Side effect is content becoming blurred, especially with
            // high scale values on ldpi screens.
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
     * Return a hash URL that will resolve to the given slide location.
     *
     * @param {HTMLElement} [slide=currentSlide] The slide to link to
     */


    function locationHash(slide) {
      var url = '/'; // Attempt to create a named link based on the slide's ID

      var s = slide || currentSlide;
      var id = s ? s.getAttribute('id') : null;

      if (id) {
        id = encodeURIComponent(id);
      }

      var index = getIndices(slide);

      if (!config.fragmentInURL) {
        index.f = undefined;
      } // If the current slide has an ID, use that as a named link,
      // but we don't support named links with a fragment index


      if (typeof id === 'string' && id.length && index.f === undefined) {
        url = '/' + id;
      } // Otherwise use the /h/v index
      else {
        var hashIndexBase = config.hashOneBasedIndex ? 1 : 0;
        if (index.h > 0 || index.v > 0 || index.f !== undefined) url += index.h + hashIndexBase;
        if (index.v > 0 || index.f !== undefined) url += '/' + (index.v + hashIndexBase);
        if (index.f !== undefined) url += '/' + index.f;
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
      loadSlide(slide);
      updateBackground();
      updateNotes();
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
        var viewDistance = isOverview() ? 10 : config.viewDistance; // Shorten the view distance on devices that typically have
        // less resources

        if (isMobileDevice) {
          viewDistance = isOverview() ? 6 : config.mobileViewDistance;
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


        if (hasVerticalSlides()) {
          dom.wrapper.classList.add('has-vertical-slides');
        } else {
          dom.wrapper.classList.remove('has-vertical-slides');
        } // Flag if there are ANY horizontal slides, anywhere in the deck


        if (hasHorizontalSlides()) {
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
        dom.slideNumber.innerHTML = getSlideNumber();
      }
    }
    /**
     * Returns the HTML string corresponding to the current slide number,
     * including formatting.
     */


    function getSlideNumber(slide) {
      var value;
      var format = 'h.v';

      if (slide === undefined) {
        slide = currentSlide;
      }

      if (typeof config.slideNumber === 'function') {
        value = config.slideNumber(slide);
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
            value.push(getSlidePastCount(slide) + 1);
            break;

          case 'c/t':
            value.push(getSlidePastCount(slide) + 1, '/', getTotalSlides());
            break;

          default:
            var indices = getIndices(slide);
            value.push(indices.h + 1);
            var sep = format === 'h/v' ? '/' : '.';
            if (isVerticalSlide(slide)) value.push(sep, indices.v + 1);
        }
      }

      var url = '#' + locationHash(slide);
      return formatSlideNumber(value[0], value[1], value[2], url);
    }
    /**
     * Applies HTML formatting to a slide number before it's
     * written to the DOM.
     *
     * @param {number} a Current slide
     * @param {string} delimiter Character to separate slide numbers
     * @param {(number|*)} b Total slides
     * @param {HTMLElement} [url='#'+locationHash()] The url to link to
     * @return {string} HTML string fragment
     */


    function formatSlideNumber(a, delimiter, b, url) {
      if (url === undefined) {
        url = '#' + locationHash();
      }

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
        stopEmbeddedContent(previousBackground, {
          unloadIframes: !shouldPreload(previousBackground)
        });
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
        var backgroundContent = slide.slideBackgroundContentElement;
        var backgroundIframe = slide.getAttribute('data-background-iframe'); // If the background contains media, load it

        if (background.hasAttribute('data-loaded') === false) {
          background.setAttribute('data-loaded', 'true');
          var backgroundImage = slide.getAttribute('data-background-image'),
              backgroundVideo = slide.getAttribute('data-background-video'),
              backgroundVideoLoop = slide.hasAttribute('data-background-video-loop'),
              backgroundVideoMuted = slide.hasAttribute('data-background-video-muted'); // Images

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
            iframe.setAttribute('webkitallowfullscreen', '');
            iframe.setAttribute('allow', 'autoplay');
            iframe.setAttribute('data-src', backgroundIframe);
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.maxHeight = '100%';
            iframe.style.maxWidth = '100%';
            backgroundContent.appendChild(iframe);
          }
        } // Start loading preloadable iframes


        var backgroundIframeElement = backgroundContent.querySelector('iframe[data-src]');

        if (backgroundIframeElement) {
          // Check if this iframe is eligible to be preloaded
          if (shouldPreload(background) && !/autoplay=(1|true|yes)/gi.test(backgroundIframe)) {
            if (backgroundIframeElement.getAttribute('src') !== backgroundIframe) {
              backgroundIframeElement.setAttribute('src', backgroundIframe);
            }
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
        background.style.display = 'none'; // Unload any background iframes

        toArray(background.querySelectorAll('iframe[src]')).forEach(function (element) {
          element.removeAttribute('src');
        });
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
     * @param {HTMLElement} [slide=currentSlide] The slide we're counting before
     *
     * @return {number} Past slide count
     */


    function getSlidePastCount(slide) {
      if (slide === undefined) {
        slide = currentSlide;
      }

      var horizontalSlides = toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR)); // The number of past slides

      var pastCount = 0; // Step through all slides and count the past ones

      mainLoop: for (var i = 0; i < horizontalSlides.length; i++) {
        var horizontalSlide = horizontalSlides[i];
        var verticalSlides = toArray(horizontalSlide.querySelectorAll('section'));

        for (var j = 0; j < verticalSlides.length; j++) {
          // Stop as soon as we arrive at the present
          if (verticalSlides[j] === slide) {
            break mainLoop;
          }

          pastCount++;
        } // Stop as soon as we arrive at the present


        if (horizontalSlide === slide) {
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
     * Returns a list of all horizontal slides in the deck. Each
     * vertical stack is included as one horizontal slide in the
     * resulting array.
     */


    function getHorizontalSlides() {
      return toArray(dom.wrapper.querySelectorAll(HORIZONTAL_SLIDES_SELECTOR));
    }
    /**
     * Returns all vertical slides that exist within this deck.
     */


    function getVerticalSlides() {
      return toArray(dom.wrapper.querySelectorAll('.slides>section>section'));
    }
    /**
     * Returns true if there are at least two horizontal slides.
     */


    function hasHorizontalSlides() {
      return getHorizontalSlides().length > 1;
    }
    /**
     * Returns true if there are at least two vertical slides.
     */


    function hasVerticalSlides() {
      return getVerticalSlides().length > 1;
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
          var maxIndex = 0;

          if (typeof index !== 'number') {
            var currentFragment = sortFragments(currentSlide.querySelectorAll('.fragment.visible')).pop();

            if (currentFragment) {
              index = parseInt(currentFragment.getAttribute('data-fragment-index') || 0, 10);
            }
          }

          toArray(fragments).forEach(function (el, i) {
            if (el.hasAttribute('data-fragment-index')) {
              i = parseInt(el.getAttribute('data-fragment-index'), 10);
            }

            maxIndex = Math.max(maxIndex, i); // Visible fragments

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
          }); // Write the current fragment index to the slide <section>.
          // This can be used by end users to apply styles based on
          // the current fragment index.

          index = typeof index === 'number' ? index : -1;
          index = Math.max(Math.min(index, maxIndex), -1);
          currentSlide.setAttribute('data-fragment', index);
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
      var firstSlideShortcut = event.shiftKey && keyCode === 37;
      var lastSlideShortcut = event.shiftKey && keyCode === 39; // Prevent all other events when a modifier is pressed

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
      } // Use linear navigation if we're configured to OR if
      // the presentation is one-dimensional


      var useLinearMode = config.navigationMode === 'linear' || !hasHorizontalSlides() || !hasVerticalSlides();
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
          } else if (!isOverview() && useLinearMode) {
            navigatePrev();
          } else {
            navigateLeft();
          }
        } // L, RIGHT
        else if (keyCode === 76 || keyCode === 39) {
          if (lastSlideShortcut) {
            slide(Number.MAX_VALUE);
          } else if (!isOverview() && useLinearMode) {
            navigateNext();
          } else {
            navigateRight();
          }
        } // K, UP
        else if (keyCode === 75 || keyCode === 38) {
          if (!isOverview() && useLinearMode) {
            navigatePrev();
          } else {
            navigateUp();
          }
        } // J, DOWN
        else if (keyCode === 74 || keyCode === 40) {
          if (!isOverview() && useLinearMode) {
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

            if (config.navigationMode === 'linear') {
              if (config.rtl) {
                navigateNext();
              } else {
                navigatePrev();
              }
            } else {
              navigateLeft();
            }
          } else if (deltaX < -touch.threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
            touch.captured = true;

            if (config.navigationMode === 'linear') {
              if (config.rtl) {
                navigatePrev();
              } else {
                navigateNext();
              }
            } else {
              navigateRight();
            }
          } else if (deltaY > touch.threshold) {
            touch.captured = true;

            if (config.navigationMode === 'linear') {
              navigatePrev();
            } else {
              navigateUp();
            }
          } else if (deltaY < -touch.threshold) {
            touch.captured = true;

            if (config.navigationMode === 'linear') {
              navigateNext();
            } else {
              navigateDown();
            }
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
      // Returns an array with all horizontal/vertical slides in the deck
      getHorizontalSlides: getHorizontalSlides,
      getVerticalSlides: getVerticalSlides,
      // Checks if the presentation contains two or more
      // horizontal/vertical slides
      hasHorizontalSlides: hasHorizontalSlides,
      hasVerticalSlides: hasVerticalSlides,
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

function deepFreeze(obj) {
  if (obj instanceof Map) {
    obj.clear = obj.delete = obj.set = function () {
      throw new Error('map is read-only');
    };
  } else if (obj instanceof Set) {
    obj.add = obj.clear = obj.delete = function () {
      throw new Error('set is read-only');
    };
  } // Freeze self


  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach(function (name) {
    var prop = obj[name]; // Freeze prop if it is an object

    if (typeof prop == 'object' && !Object.isFrozen(prop)) {
      deepFreeze(prop);
    }
  });
  return obj;
}

var deepFreezeEs6 = deepFreeze;
var _default = deepFreeze;
deepFreezeEs6.default = _default;
/** @implements CallbackResponse */

class Response {
  /**
   * @param {CompiledMode} mode
   */
  constructor(mode) {
    // eslint-disable-next-line no-undefined
    if (mode.data === undefined) mode.data = {};
    this.data = mode.data;
    this.isMatchIgnored = false;
  }

  ignoreMatch() {
    this.isMatchIgnored = true;
  }

}
/**
 * @param {string} value
 * @returns {string}
 */


function escapeHTML(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}
/**
 * performs a shallow merge of multiple objects into one
 *
 * @template T
 * @param {T} original
 * @param {Record<string,any>[]} objects
 * @returns {T} a single new object
 */


function inherit(original, ...objects) {
  /** @type Record<string,any> */
  const result = Object.create(null);

  for (const key in original) {
    result[key] = original[key];
  }

  objects.forEach(function (obj) {
    for (const key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}
/**
 * @typedef {object} Renderer
 * @property {(text: string) => void} addText
 * @property {(node: Node) => void} openNode
 * @property {(node: Node) => void} closeNode
 * @property {() => string} value
 */

/** @typedef {{kind?: string, sublanguage?: boolean}} Node */

/** @typedef {{walk: (r: Renderer) => void}} Tree */

/** */


const SPAN_CLOSE = '</span>';
/**
 * Determines if a node needs to be wrapped in <span>
 *
 * @param {Node} node */

const emitsWrappingTags = node => {
  return !!node.kind;
};
/** @type {Renderer} */


class HTMLRenderer {
  /**
   * Creates a new HTMLRenderer
   *
   * @param {Tree} parseTree - the parse tree (must support `walk` API)
   * @param {{classPrefix: string}} options
   */
  constructor(parseTree, options) {
    this.buffer = "";
    this.classPrefix = options.classPrefix;
    parseTree.walk(this);
  }
  /**
   * Adds texts to the output stream
   *
   * @param {string} text */


  addText(text) {
    this.buffer += escapeHTML(text);
  }
  /**
   * Adds a node open to the output stream (if needed)
   *
   * @param {Node} node */


  openNode(node) {
    if (!emitsWrappingTags(node)) return;
    let className = node.kind;

    if (!node.sublanguage) {
      className = `${this.classPrefix}${className}`;
    }

    this.span(className);
  }
  /**
   * Adds a node close to the output stream (if needed)
   *
   * @param {Node} node */


  closeNode(node) {
    if (!emitsWrappingTags(node)) return;
    this.buffer += SPAN_CLOSE;
  }
  /**
   * returns the accumulated buffer
  */


  value() {
    return this.buffer;
  } // helpers

  /**
   * Builds a span element
   *
   * @param {string} className */


  span(className) {
    this.buffer += `<span class="${className}">`;
  }

}
/** @typedef {{kind?: string, sublanguage?: boolean, children: Node[]} | string} Node */

/** @typedef {{kind?: string, sublanguage?: boolean, children: Node[]} } DataNode */

/**  */


class TokenTree {
  constructor() {
    /** @type DataNode */
    this.rootNode = {
      children: []
    };
    this.stack = [this.rootNode];
  }

  get top() {
    return this.stack[this.stack.length - 1];
  }

  get root() {
    return this.rootNode;
  }
  /** @param {Node} node */


  add(node) {
    this.top.children.push(node);
  }
  /** @param {string} kind */


  openNode(kind) {
    /** @type Node */
    const node = {
      kind,
      children: []
    };
    this.add(node);
    this.stack.push(node);
  }

  closeNode() {
    if (this.stack.length > 1) {
      return this.stack.pop();
    } // eslint-disable-next-line no-undefined


    return undefined;
  }

  closeAllNodes() {
    while (this.closeNode());
  }

  toJSON() {
    return JSON.stringify(this.rootNode, null, 4);
  }
  /**
   * @typedef { import("./html_renderer").Renderer } Renderer
   * @param {Renderer} builder
   */


  walk(builder) {
    // this does not
    return this.constructor._walk(builder, this.rootNode); // this works
    // return TokenTree._walk(builder, this.rootNode);
  }
  /**
   * @param {Renderer} builder
   * @param {Node} node
   */


  static _walk(builder, node) {
    if (typeof node === "string") {
      builder.addText(node);
    } else if (node.children) {
      builder.openNode(node);
      node.children.forEach(child => this._walk(builder, child));
      builder.closeNode(node);
    }

    return builder;
  }
  /**
   * @param {Node} node
   */


  static _collapse(node) {
    if (typeof node === "string") return;
    if (!node.children) return;

    if (node.children.every(el => typeof el === "string")) {
      // node.text = node.children.join("");
      // delete node.children;
      node.children = [node.children.join("")];
    } else {
      node.children.forEach(child => {
        TokenTree._collapse(child);
      });
    }
  }

}
/**
  Currently this is all private API, but this is the minimal API necessary
  that an Emitter must implement to fully support the parser.

  Minimal interface:

  - addKeyword(text, kind)
  - addText(text)
  - addSublanguage(emitter, subLanguageName)
  - finalize()
  - openNode(kind)
  - closeNode()
  - closeAllNodes()
  - toHTML()

*/

/**
 * @implements {Emitter}
 */


class TokenTreeEmitter extends TokenTree {
  /**
   * @param {*} options
   */
  constructor(options) {
    super();
    this.options = options;
  }
  /**
   * @param {string} text
   * @param {string} kind
   */


  addKeyword(text, kind) {
    if (text === "") {
      return;
    }

    this.openNode(kind);
    this.addText(text);
    this.closeNode();
  }
  /**
   * @param {string} text
   */


  addText(text) {
    if (text === "") {
      return;
    }

    this.add(text);
  }
  /**
   * @param {Emitter & {root: DataNode}} emitter
   * @param {string} name
   */


  addSublanguage(emitter, name) {
    /** @type DataNode */
    const node = emitter.root;
    node.kind = name;
    node.sublanguage = true;
    this.add(node);
  }

  toHTML() {
    const renderer = new HTMLRenderer(this, this.options);
    return renderer.value();
  }

  finalize() {
    return true;
  }

}
/**
 * @param {string} value
 * @returns {RegExp}
 * */


function escape(value) {
  return new RegExp(value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'm');
}
/**
 * @param {RegExp | string } re
 * @returns {string}
 */


function source$4(re) {
  if (!re) return null;
  if (typeof re === "string") return re;
  return re.source;
}
/**
 * @param {...(RegExp | string) } args
 * @returns {string}
 */


function concat$4(...args) {
  const joined = args.map(x => source$4(x)).join("");
  return joined;
}
/**
 * Any of the passed expresssions may match
 *
 * Creates a huge this | this | that | that match
 * @param {(RegExp | string)[] } args
 * @returns {string}
 */


function either$1(...args) {
  const joined = '(' + args.map(x => source$4(x)).join("|") + ")";
  return joined;
}
/**
 * @param {RegExp} re
 * @returns {number}
 */


function countMatchGroups(re) {
  return new RegExp(re.toString() + '|').exec('').length - 1;
}
/**
 * Does lexeme start with a regular expression match at the beginning
 * @param {RegExp} re
 * @param {string} lexeme
 */


function startsWith(re, lexeme) {
  const match = re && re.exec(lexeme);
  return match && match.index === 0;
} // BACKREF_RE matches an open parenthesis or backreference. To avoid
// an incorrect parse, it additionally matches the following:
// - [...] elements, where the meaning of parentheses and escapes change
// - other escape sequences, so we do not misparse escape sequences as
//   interesting elements
// - non-matching or lookahead parentheses, which do not capture. These
//   follow the '(' with a '?'.


const BACKREF_RE = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./; // join logically computes regexps.join(separator), but fixes the
// backreferences so they continue to match.
// it also places each individual regular expression into it's own
// match group, keeping track of the sequencing of those match groups
// is currently an exercise for the caller. :-)

/**
 * @param {(string | RegExp)[]} regexps
 * @param {string} separator
 * @returns {string}
 */

function join(regexps, separator = "|") {
  let numCaptures = 0;
  return regexps.map(regex => {
    numCaptures += 1;
    const offset = numCaptures;
    let re = source$4(regex);
    let out = '';

    while (re.length > 0) {
      const match = BACKREF_RE.exec(re);

      if (!match) {
        out += re;
        break;
      }

      out += re.substring(0, match.index);
      re = re.substring(match.index + match[0].length);

      if (match[0][0] === '\\' && match[1]) {
        // Adjust the backreference.
        out += '\\' + String(Number(match[1]) + offset);
      } else {
        out += match[0];

        if (match[0] === '(') {
          numCaptures++;
        }
      }
    }

    return out;
  }).map(re => `(${re})`).join(separator);
} // Common regexps


const MATCH_NOTHING_RE = /\b\B/;
const IDENT_RE$1 = '[a-zA-Z]\\w*';
const UNDERSCORE_IDENT_RE = '[a-zA-Z_]\\w*';
const NUMBER_RE = '\\b\\d+(\\.\\d+)?';
const C_NUMBER_RE = '(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)'; // 0x..., 0..., decimal, float

const BINARY_NUMBER_RE = '\\b(0b[01]+)'; // 0b...

const RE_STARTERS_RE = '!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~';
/**
* @param { Partial<Mode> & {binary?: string | RegExp} } opts
*/

const SHEBANG = (opts = {}) => {
  const beginShebang = /^#![ ]*\//;

  if (opts.binary) {
    opts.begin = concat$4(beginShebang, /.*\b/, opts.binary, /\b.*/);
  }

  return inherit({
    className: 'meta',
    begin: beginShebang,
    end: /$/,
    relevance: 0,

    /** @type {ModeCallback} */
    "on:begin": (m, resp) => {
      if (m.index !== 0) resp.ignoreMatch();
    }
  }, opts);
}; // Common modes


const BACKSLASH_ESCAPE = {
  begin: '\\\\[\\s\\S]',
  relevance: 0
};
const APOS_STRING_MODE = {
  className: 'string',
  begin: '\'',
  end: '\'',
  illegal: '\\n',
  contains: [BACKSLASH_ESCAPE]
};
const QUOTE_STRING_MODE = {
  className: 'string',
  begin: '"',
  end: '"',
  illegal: '\\n',
  contains: [BACKSLASH_ESCAPE]
};
const PHRASAL_WORDS_MODE = {
  begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
};
/**
 * Creates a comment mode
 *
 * @param {string | RegExp} begin
 * @param {string | RegExp} end
 * @param {Mode | {}} [modeOptions]
 * @returns {Partial<Mode>}
 */

const COMMENT = function (begin, end, modeOptions = {}) {
  const mode = inherit({
    className: 'comment',
    begin,
    end,
    contains: []
  }, modeOptions);
  mode.contains.push(PHRASAL_WORDS_MODE);
  mode.contains.push({
    className: 'doctag',
    begin: '(?:TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):',
    relevance: 0
  });
  return mode;
};

const C_LINE_COMMENT_MODE = COMMENT('//', '$');
const C_BLOCK_COMMENT_MODE = COMMENT('/\\*', '\\*/');
const HASH_COMMENT_MODE = COMMENT('#', '$');
const NUMBER_MODE = {
  className: 'number',
  begin: NUMBER_RE,
  relevance: 0
};
const C_NUMBER_MODE = {
  className: 'number',
  begin: C_NUMBER_RE,
  relevance: 0
};
const BINARY_NUMBER_MODE = {
  className: 'number',
  begin: BINARY_NUMBER_RE,
  relevance: 0
};
const CSS_NUMBER_MODE = {
  className: 'number',
  begin: NUMBER_RE + '(' + '%|em|ex|ch|rem' + '|vw|vh|vmin|vmax' + '|cm|mm|in|pt|pc|px' + '|deg|grad|rad|turn' + '|s|ms' + '|Hz|kHz' + '|dpi|dpcm|dppx' + ')?',
  relevance: 0
};
const REGEXP_MODE = {
  // this outer rule makes sure we actually have a WHOLE regex and not simply
  // an expression such as:
  //
  //     3 / something
  //
  // (which will then blow up when regex's `illegal` sees the newline)
  begin: /(?=\/[^/\n]*\/)/,
  contains: [{
    className: 'regexp',
    begin: /\//,
    end: /\/[gimuy]*/,
    illegal: /\n/,
    contains: [BACKSLASH_ESCAPE, {
      begin: /\[/,
      end: /\]/,
      relevance: 0,
      contains: [BACKSLASH_ESCAPE]
    }]
  }]
};
const TITLE_MODE = {
  className: 'title',
  begin: IDENT_RE$1,
  relevance: 0
};
const UNDERSCORE_TITLE_MODE = {
  className: 'title',
  begin: UNDERSCORE_IDENT_RE,
  relevance: 0
};
const METHOD_GUARD = {
  // excludes method names from keyword processing
  begin: '\\.\\s*' + UNDERSCORE_IDENT_RE,
  relevance: 0
};
/**
 * Adds end same as begin mechanics to a mode
 *
 * Your mode must include at least a single () match group as that first match
 * group is what is used for comparison
 * @param {Partial<Mode>} mode
 */

const END_SAME_AS_BEGIN = function (mode) {
  return Object.assign(mode, {
    /** @type {ModeCallback} */
    'on:begin': (m, resp) => {
      resp.data._beginMatch = m[1];
    },

    /** @type {ModeCallback} */
    'on:end': (m, resp) => {
      if (resp.data._beginMatch !== m[1]) resp.ignoreMatch();
    }
  });
};

var MODES = /*#__PURE__*/Object.freeze({
  __proto__: null,
  MATCH_NOTHING_RE: MATCH_NOTHING_RE,
  IDENT_RE: IDENT_RE$1,
  UNDERSCORE_IDENT_RE: UNDERSCORE_IDENT_RE,
  NUMBER_RE: NUMBER_RE,
  C_NUMBER_RE: C_NUMBER_RE,
  BINARY_NUMBER_RE: BINARY_NUMBER_RE,
  RE_STARTERS_RE: RE_STARTERS_RE,
  SHEBANG: SHEBANG,
  BACKSLASH_ESCAPE: BACKSLASH_ESCAPE,
  APOS_STRING_MODE: APOS_STRING_MODE,
  QUOTE_STRING_MODE: QUOTE_STRING_MODE,
  PHRASAL_WORDS_MODE: PHRASAL_WORDS_MODE,
  COMMENT: COMMENT,
  C_LINE_COMMENT_MODE: C_LINE_COMMENT_MODE,
  C_BLOCK_COMMENT_MODE: C_BLOCK_COMMENT_MODE,
  HASH_COMMENT_MODE: HASH_COMMENT_MODE,
  NUMBER_MODE: NUMBER_MODE,
  C_NUMBER_MODE: C_NUMBER_MODE,
  BINARY_NUMBER_MODE: BINARY_NUMBER_MODE,
  CSS_NUMBER_MODE: CSS_NUMBER_MODE,
  REGEXP_MODE: REGEXP_MODE,
  TITLE_MODE: TITLE_MODE,
  UNDERSCORE_TITLE_MODE: UNDERSCORE_TITLE_MODE,
  METHOD_GUARD: METHOD_GUARD,
  END_SAME_AS_BEGIN: END_SAME_AS_BEGIN
}); // Grammar extensions / plugins
// See: https://github.com/highlightjs/highlight.js/issues/2833
// Grammar extensions allow "syntactic sugar" to be added to the grammar modes
// without requiring any underlying changes to the compiler internals.
// `compileMatch` being the perfect small example of now allowing a grammar
// author to write `match` when they desire to match a single expression rather
// than being forced to use `begin`.  The extension then just moves `match` into
// `begin` when it runs.  Ie, no features have been added, but we've just made
// the experience of writing (and reading grammars) a little bit nicer.
// ------
// TODO: We need negative look-behind support to do this properly

/**
 * Skip a match if it has a preceding dot
 *
 * This is used for `beginKeywords` to prevent matching expressions such as
 * `bob.keyword.do()`. The mode compiler automatically wires this up as a
 * special _internal_ 'on:begin' callback for modes with `beginKeywords`
 * @param {RegExpMatchArray} match
 * @param {CallbackResponse} response
 */

function skipIfhasPrecedingDot(match, response) {
  const before = match.input[match.index - 1];

  if (before === ".") {
    response.ignoreMatch();
  }
}
/**
 * `beginKeywords` syntactic sugar
 * @type {CompilerExt}
 */


function beginKeywords(mode, parent) {
  if (!parent) return;
  if (!mode.beginKeywords) return; // for languages with keywords that include non-word characters checking for
  // a word boundary is not sufficient, so instead we check for a word boundary
  // or whitespace - this does no harm in any case since our keyword engine
  // doesn't allow spaces in keywords anyways and we still check for the boundary
  // first

  mode.begin = '\\b(' + mode.beginKeywords.split(' ').join('|') + ')(?!\\.)(?=\\b|\\s)';
  mode.__beforeBegin = skipIfhasPrecedingDot;
  mode.keywords = mode.keywords || mode.beginKeywords;
  delete mode.beginKeywords; // prevents double relevance, the keywords themselves provide
  // relevance, the mode doesn't need to double it
  // eslint-disable-next-line no-undefined

  if (mode.relevance === undefined) mode.relevance = 0;
}
/**
 * Allow `illegal` to contain an array of illegal values
 * @type {CompilerExt}
 */


function compileIllegal(mode, _parent) {
  if (!Array.isArray(mode.illegal)) return;
  mode.illegal = either$1(...mode.illegal);
}
/**
 * `match` to match a single expression for readability
 * @type {CompilerExt}
 */


function compileMatch(mode, _parent) {
  if (!mode.match) return;
  if (mode.begin || mode.end) throw new Error("begin & end are not supported with match");
  mode.begin = mode.match;
  delete mode.match;
}
/**
 * provides the default 1 relevance to all modes
 * @type {CompilerExt}
 */


function compileRelevance(mode, _parent) {
  // eslint-disable-next-line no-undefined
  if (mode.relevance === undefined) mode.relevance = 1;
} // keywords that should have no default relevance value


const COMMON_KEYWORDS = ['of', 'and', 'for', 'in', 'not', 'or', 'if', 'then', 'parent', // common variable name
'list', // common variable name
'value' // common variable name
];
const DEFAULT_KEYWORD_CLASSNAME = "keyword";
/**
 * Given raw keywords from a language definition, compile them.
 *
 * @param {string | Record<string,string|string[]> | Array<string>} rawKeywords
 * @param {boolean} caseInsensitive
 */

function compileKeywords(rawKeywords, caseInsensitive, className = DEFAULT_KEYWORD_CLASSNAME) {
  /** @type KeywordDict */
  const compiledKeywords = {}; // input can be a string of keywords, an array of keywords, or a object with
  // named keys representing className (which can then point to a string or array)

  if (typeof rawKeywords === 'string') {
    compileList(className, rawKeywords.split(" "));
  } else if (Array.isArray(rawKeywords)) {
    compileList(className, rawKeywords);
  } else {
    Object.keys(rawKeywords).forEach(function (className) {
      // collapse all our objects back into the parent object
      Object.assign(compiledKeywords, compileKeywords(rawKeywords[className], caseInsensitive, className));
    });
  }

  return compiledKeywords; // ---

  /**
   * Compiles an individual list of keywords
   *
   * Ex: "for if when while|5"
   *
   * @param {string} className
   * @param {Array<string>} keywordList
   */

  function compileList(className, keywordList) {
    if (caseInsensitive) {
      keywordList = keywordList.map(x => x.toLowerCase());
    }

    keywordList.forEach(function (keyword) {
      const pair = keyword.split('|');
      compiledKeywords[pair[0]] = [className, scoreForKeyword(pair[0], pair[1])];
    });
  }
}
/**
 * Returns the proper score for a given keyword
 *
 * Also takes into account comment keywords, which will be scored 0 UNLESS
 * another score has been manually assigned.
 * @param {string} keyword
 * @param {string} [providedScore]
 */


function scoreForKeyword(keyword, providedScore) {
  // manual scores always win over common keywords
  // so you can force a score of 1 if you really insist
  if (providedScore) {
    return Number(providedScore);
  }

  return commonKeyword(keyword) ? 0 : 1;
}
/**
 * Determines if a given keyword is common or not
 *
 * @param {string} keyword */


function commonKeyword(keyword) {
  return COMMON_KEYWORDS.includes(keyword.toLowerCase());
} // compilation

/**
 * Compiles a language definition result
 *
 * Given the raw result of a language definition (Language), compiles this so
 * that it is ready for highlighting code.
 * @param {Language} language
 * @param {{plugins: HLJSPlugin[]}} opts
 * @returns {CompiledLanguage}
 */


function compileLanguage(language, {
  plugins
}) {
  /**
   * Builds a regex with the case sensativility of the current language
   *
   * @param {RegExp | string} value
   * @param {boolean} [global]
   */
  function langRe(value, global) {
    return new RegExp(source$4(value), 'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : ''));
  }
  /**
    Stores multiple regular expressions and allows you to quickly search for
    them all in a string simultaneously - returning the first match.  It does
    this by creating a huge (a|b|c) regex - each individual item wrapped with ()
    and joined by `|` - using match groups to track position.  When a match is
    found checking which position in the array has content allows us to figure
    out which of the original regexes / match groups triggered the match.
     The match object itself (the result of `Regex.exec`) is returned but also
    enhanced by merging in any meta-data that was registered with the regex.
    This is how we keep track of which mode matched, and what type of rule
    (`illegal`, `begin`, end, etc).
  */


  class MultiRegex {
    constructor() {
      this.matchIndexes = {}; // @ts-ignore

      this.regexes = [];
      this.matchAt = 1;
      this.position = 0;
    } // @ts-ignore


    addRule(re, opts) {
      opts.position = this.position++; // @ts-ignore

      this.matchIndexes[this.matchAt] = opts;
      this.regexes.push([opts, re]);
      this.matchAt += countMatchGroups(re) + 1;
    }

    compile() {
      if (this.regexes.length === 0) {
        // avoids the need to check length every time exec is called
        // @ts-ignore
        this.exec = () => null;
      }

      const terminators = this.regexes.map(el => el[1]);
      this.matcherRe = langRe(join(terminators), true);
      this.lastIndex = 0;
    }
    /** @param {string} s */


    exec(s) {
      this.matcherRe.lastIndex = this.lastIndex;
      const match = this.matcherRe.exec(s);

      if (!match) {
        return null;
      } // eslint-disable-next-line no-undefined


      const i = match.findIndex((el, i) => i > 0 && el !== undefined); // @ts-ignore

      const matchData = this.matchIndexes[i]; // trim off any earlier non-relevant match groups (ie, the other regex
      // match groups that make up the multi-matcher)

      match.splice(0, i);
      return Object.assign(match, matchData);
    }

  }
  /*
    Created to solve the key deficiently with MultiRegex - there is no way to
    test for multiple matches at a single location.  Why would we need to do
    that?  In the future a more dynamic engine will allow certain matches to be
    ignored.  An example: if we matched say the 3rd regex in a large group but
    decided to ignore it - we'd need to started testing again at the 4th
    regex... but MultiRegex itself gives us no real way to do that.
     So what this class creates MultiRegexs on the fly for whatever search
    position they are needed.
     NOTE: These additional MultiRegex objects are created dynamically.  For most
    grammars most of the time we will never actually need anything more than the
    first MultiRegex - so this shouldn't have too much overhead.
     Say this is our search group, and we match regex3, but wish to ignore it.
       regex1 | regex2 | regex3 | regex4 | regex5    ' ie, startAt = 0
     What we need is a new MultiRegex that only includes the remaining
    possibilities:
       regex4 | regex5                               ' ie, startAt = 3
     This class wraps all that complexity up in a simple API... `startAt` decides
    where in the array of expressions to start doing the matching. It
    auto-increments, so if a match is found at position 2, then startAt will be
    set to 3.  If the end is reached startAt will return to 0.
     MOST of the time the parser will be setting startAt manually to 0.
  */


  class ResumableMultiRegex {
    constructor() {
      // @ts-ignore
      this.rules = []; // @ts-ignore

      this.multiRegexes = [];
      this.count = 0;
      this.lastIndex = 0;
      this.regexIndex = 0;
    } // @ts-ignore


    getMatcher(index) {
      if (this.multiRegexes[index]) return this.multiRegexes[index];
      const matcher = new MultiRegex();
      this.rules.slice(index).forEach(([re, opts]) => matcher.addRule(re, opts));
      matcher.compile();
      this.multiRegexes[index] = matcher;
      return matcher;
    }

    resumingScanAtSamePosition() {
      return this.regexIndex !== 0;
    }

    considerAll() {
      this.regexIndex = 0;
    } // @ts-ignore


    addRule(re, opts) {
      this.rules.push([re, opts]);
      if (opts.type === "begin") this.count++;
    }
    /** @param {string} s */


    exec(s) {
      const m = this.getMatcher(this.regexIndex);
      m.lastIndex = this.lastIndex;
      let result = m.exec(s); // The following is because we have no easy way to say "resume scanning at the
      // existing position but also skip the current rule ONLY". What happens is
      // all prior rules are also skipped which can result in matching the wrong
      // thing. Example of matching "booger":
      // our matcher is [string, "booger", number]
      //
      // ....booger....
      // if "booger" is ignored then we'd really need a regex to scan from the
      // SAME position for only: [string, number] but ignoring "booger" (if it
      // was the first match), a simple resume would scan ahead who knows how
      // far looking only for "number", ignoring potential string matches (or
      // future "booger" matches that might be valid.)
      // So what we do: We execute two matchers, one resuming at the same
      // position, but the second full matcher starting at the position after:
      //     /--- resume first regex match here (for [number])
      //     |/---- full match here for [string, "booger", number]
      //     vv
      // ....booger....
      // Which ever results in a match first is then used. So this 3-4 step
      // process essentially allows us to say "match at this position, excluding
      // a prior rule that was ignored".
      //
      // 1. Match "booger" first, ignore. Also proves that [string] does non match.
      // 2. Resume matching for [number]
      // 3. Match at index + 1 for [string, "booger", number]
      // 4. If #2 and #3 result in matches, which came first?

      if (this.resumingScanAtSamePosition()) {
        if (result && result.index === this.lastIndex) ;else {
          // use the second matcher result
          const m2 = this.getMatcher(0);
          m2.lastIndex = this.lastIndex + 1;
          result = m2.exec(s);
        }
      }

      if (result) {
        this.regexIndex += result.position + 1;

        if (this.regexIndex === this.count) {
          // wrap-around to considering all matches again
          this.considerAll();
        }
      }

      return result;
    }

  }
  /**
   * Given a mode, builds a huge ResumableMultiRegex that can be used to walk
   * the content and find matches.
   *
   * @param {CompiledMode} mode
   * @returns {ResumableMultiRegex}
   */


  function buildModeRegex(mode) {
    const mm = new ResumableMultiRegex();
    mode.contains.forEach(term => mm.addRule(term.begin, {
      rule: term,
      type: "begin"
    }));

    if (mode.terminatorEnd) {
      mm.addRule(mode.terminatorEnd, {
        type: "end"
      });
    }

    if (mode.illegal) {
      mm.addRule(mode.illegal, {
        type: "illegal"
      });
    }

    return mm;
  }
  /** skip vs abort vs ignore
   *
   * @skip   - The mode is still entered and exited normally (and contains rules apply),
   *           but all content is held and added to the parent buffer rather than being
   *           output when the mode ends.  Mostly used with `sublanguage` to build up
   *           a single large buffer than can be parsed by sublanguage.
   *
   *             - The mode begin ands ends normally.
   *             - Content matched is added to the parent mode buffer.
   *             - The parser cursor is moved forward normally.
   *
   * @abort  - A hack placeholder until we have ignore.  Aborts the mode (as if it
   *           never matched) but DOES NOT continue to match subsequent `contains`
   *           modes.  Abort is bad/suboptimal because it can result in modes
   *           farther down not getting applied because an earlier rule eats the
   *           content but then aborts.
   *
   *             - The mode does not begin.
   *             - Content matched by `begin` is added to the mode buffer.
   *             - The parser cursor is moved forward accordingly.
   *
   * @ignore - Ignores the mode (as if it never matched) and continues to match any
   *           subsequent `contains` modes.  Ignore isn't technically possible with
   *           the current parser implementation.
   *
   *             - The mode does not begin.
   *             - Content matched by `begin` is ignored.
   *             - The parser cursor is not moved forward.
   */

  /**
   * Compiles an individual mode
   *
   * This can raise an error if the mode contains certain detectable known logic
   * issues.
   * @param {Mode} mode
   * @param {CompiledMode | null} [parent]
   * @returns {CompiledMode | never}
   */


  function compileMode(mode, parent) {
    const cmode = mode;
    if (mode.isCompiled) return cmode;
    [// do this early so compiler extensions generally don't have to worry about
    // the distinction between match/begin
    compileMatch].forEach(ext => ext(mode, parent));
    language.compilerExtensions.forEach(ext => ext(mode, parent)); // __beforeBegin is considered private API, internal use only

    mode.__beforeBegin = null;
    [beginKeywords, // do this later so compiler extensions that come earlier have access to the
    // raw array if they wanted to perhaps manipulate it, etc.
    compileIllegal, // default to 1 relevance if not specified
    compileRelevance].forEach(ext => ext(mode, parent));
    mode.isCompiled = true;
    let keywordPattern = null;

    if (typeof mode.keywords === "object") {
      keywordPattern = mode.keywords.$pattern;
      delete mode.keywords.$pattern;
    }

    if (mode.keywords) {
      mode.keywords = compileKeywords(mode.keywords, language.case_insensitive);
    } // both are not allowed


    if (mode.lexemes && keywordPattern) {
      throw new Error("ERR: Prefer `keywords.$pattern` to `mode.lexemes`, BOTH are not allowed. (see mode reference) ");
    } // `mode.lexemes` was the old standard before we added and now recommend
    // using `keywords.$pattern` to pass the keyword pattern


    keywordPattern = keywordPattern || mode.lexemes || /\w+/;
    cmode.keywordPatternRe = langRe(keywordPattern, true);

    if (parent) {
      if (!mode.begin) mode.begin = /\B|\b/;
      cmode.beginRe = langRe(mode.begin);
      if (mode.endSameAsBegin) mode.end = mode.begin;
      if (!mode.end && !mode.endsWithParent) mode.end = /\B|\b/;
      if (mode.end) cmode.endRe = langRe(mode.end);
      cmode.terminatorEnd = source$4(mode.end) || '';

      if (mode.endsWithParent && parent.terminatorEnd) {
        cmode.terminatorEnd += (mode.end ? '|' : '') + parent.terminatorEnd;
      }
    }

    if (mode.illegal) cmode.illegalRe = langRe(mode.illegal);
    if (!mode.contains) mode.contains = [];
    mode.contains = [].concat(...mode.contains.map(function (c) {
      return expandOrCloneMode(c === 'self' ? mode : c);
    }));
    mode.contains.forEach(function (c) {
      compileMode(c, cmode);
    });

    if (mode.starts) {
      compileMode(mode.starts, parent);
    }

    cmode.matcher = buildModeRegex(cmode);
    return cmode;
  }

  if (!language.compilerExtensions) language.compilerExtensions = []; // self is not valid at the top-level

  if (language.contains && language.contains.includes('self')) {
    throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
  } // we need a null object, which inherit will guarantee


  language.classNameAliases = inherit(language.classNameAliases || {});
  return compileMode(language);
}
/**
 * Determines if a mode has a dependency on it's parent or not
 *
 * If a mode does have a parent dependency then often we need to clone it if
 * it's used in multiple places so that each copy points to the correct parent,
 * where-as modes without a parent can often safely be re-used at the bottom of
 * a mode chain.
 *
 * @param {Mode | null} mode
 * @returns {boolean} - is there a dependency on the parent?
 * */


function dependencyOnParent(mode) {
  if (!mode) return false;
  return mode.endsWithParent || dependencyOnParent(mode.starts);
}
/**
 * Expands a mode or clones it if necessary
 *
 * This is necessary for modes with parental dependenceis (see notes on
 * `dependencyOnParent`) and for nodes that have `variants` - which must then be
 * exploded into their own individual modes at compile time.
 *
 * @param {Mode} mode
 * @returns {Mode | Mode[]}
 * */


function expandOrCloneMode(mode) {
  if (mode.variants && !mode.cachedVariants) {
    mode.cachedVariants = mode.variants.map(function (variant) {
      return inherit(mode, {
        variants: null
      }, variant);
    });
  } // EXPAND
  // if we have variants then essentially "replace" the mode with the variants
  // this happens in compileMode, where this function is called from


  if (mode.cachedVariants) {
    return mode.cachedVariants;
  } // CLONE
  // if we have dependencies on parents then we need a unique
  // instance of ourselves, so we can be reused with many
  // different parents without issue


  if (dependencyOnParent(mode)) {
    return inherit(mode, {
      starts: mode.starts ? inherit(mode.starts) : null
    });
  }

  if (Object.isFrozen(mode)) {
    return inherit(mode);
  } // no special dependency issues, just return ourselves


  return mode;
}

var version = "10.7.3"; // @ts-nocheck

function hasValueOrEmptyAttribute(value) {
  return Boolean(value || value === "");
}

function BuildVuePlugin(hljs) {
  const Component = {
    props: ["language", "code", "autodetect"],
    data: function () {
      return {
        detectedLanguage: "",
        unknownLanguage: false
      };
    },
    computed: {
      className() {
        if (this.unknownLanguage) return "";
        return "hljs " + this.detectedLanguage;
      },

      highlighted() {
        // no idea what language to use, return raw code
        if (!this.autoDetect && !hljs.getLanguage(this.language)) {
          console.warn(`The language "${this.language}" you specified could not be found.`);
          this.unknownLanguage = true;
          return escapeHTML(this.code);
        }

        let result = {};

        if (this.autoDetect) {
          result = hljs.highlightAuto(this.code);
          this.detectedLanguage = result.language;
        } else {
          result = hljs.highlight(this.language, this.code, this.ignoreIllegals);
          this.detectedLanguage = this.language;
        }

        return result.value;
      },

      autoDetect() {
        return !this.language || hasValueOrEmptyAttribute(this.autodetect);
      },

      ignoreIllegals() {
        return true;
      }

    },

    // this avoids needing to use a whole Vue compilation pipeline just
    // to build Highlight.js
    render(createElement) {
      return createElement("pre", {}, [createElement("code", {
        class: this.className,
        domProps: {
          innerHTML: this.highlighted
        }
      })]);
    } // template: `<pre><code :class="className" v-html="highlighted"></code></pre>`


  };
  const VuePlugin = {
    install(Vue) {
      Vue.component('highlightjs', Component);
    }

  };
  return {
    Component,
    VuePlugin
  };
}
/* plugin itself */

/** @type {HLJSPlugin} */


const mergeHTMLPlugin = {
  "after:highlightElement": ({
    el,
    result,
    text
  }) => {
    const originalStream = nodeStream(el);
    if (!originalStream.length) return;
    const resultNode = document.createElement('div');
    resultNode.innerHTML = result.value;
    result.value = mergeStreams(originalStream, nodeStream(resultNode), text);
  }
};
/* Stream merging support functions */

/**
 * @typedef Event
 * @property {'start'|'stop'} event
 * @property {number} offset
 * @property {Node} node
 */

/**
 * @param {Node} node
 */

function tag(node) {
  return node.nodeName.toLowerCase();
}
/**
 * @param {Node} node
 */


function nodeStream(node) {
  /** @type Event[] */
  const result = [];

  (function _nodeStream(node, offset) {
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 3) {
        offset += child.nodeValue.length;
      } else if (child.nodeType === 1) {
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
/**
 * @param {any} original - the original stream
 * @param {any} highlighted - stream of the highlighted source
 * @param {string} value - the original source itself
 */


function mergeStreams(original, highlighted, value) {
  let processed = 0;
  let result = '';
  const nodeStack = [];

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
  /**
   * @param {Node} node
   */


  function open(node) {
    /** @param {Attr} attr */
    function attributeString(attr) {
      return ' ' + attr.nodeName + '="' + escapeHTML(attr.value) + '"';
    } // @ts-ignore


    result += '<' + tag(node) + [].map.call(node.attributes, attributeString).join('') + '>';
  }
  /**
   * @param {Node} node
   */


  function close(node) {
    result += '</' + tag(node) + '>';
  }
  /**
   * @param {Event} event
   */


  function render(event) {
    (event.event === 'start' ? open : close)(event.node);
  }

  while (original.length || highlighted.length) {
    let stream = selectStream();
    result += escapeHTML(value.substring(processed, stream[0].offset));
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

  return result + escapeHTML(value.substr(processed));
}
/*

For the reasoning behind this please see:
https://github.com/highlightjs/highlight.js/issues/2880#issuecomment-747275419

*/

/**
 * @type {Record<string, boolean>}
 */


const seenDeprecations = {};
/**
 * @param {string} message
 */

const error = message => {
  console.error(message);
};
/**
 * @param {string} message
 * @param {any} args
 */


const warn = (message, ...args) => {
  console.log(`WARN: ${message}`, ...args);
};
/**
 * @param {string} version
 * @param {string} message
 */


const deprecated = (version, message) => {
  if (seenDeprecations[`${version}/${message}`]) return;
  console.log(`Deprecated as of ${version}. ${message}`);
  seenDeprecations[`${version}/${message}`] = true;
};
/*
Syntax highlighting with language autodetection.
https://highlightjs.org/
*/


const escape$1 = escapeHTML;
const inherit$1 = inherit;
const NO_MATCH = Symbol("nomatch");
/**
 * @param {any} hljs - object that is extended (legacy)
 * @returns {HLJSApi}
 */

const HLJS = function (hljs) {
  // Global internal variables used within the highlight.js library.

  /** @type {Record<string, Language>} */
  const languages = Object.create(null);
  /** @type {Record<string, string>} */

  const aliases = Object.create(null);
  /** @type {HLJSPlugin[]} */

  const plugins = []; // safe/production mode - swallows more errors, tries to keep running
  // even if a single syntax or parse hits a fatal error

  let SAFE_MODE = true;
  const fixMarkupRe = /(^(<[^>]+>|\t|)+|\n)/gm;
  const LANGUAGE_NOT_FOUND = "Could not find the language '{}', did you forget to load/include a language module?";
  /** @type {Language} */

  const PLAINTEXT_LANGUAGE = {
    disableAutodetect: true,
    name: 'Plain text',
    contains: []
  }; // Global options used when within external APIs. This is modified when
  // calling the `hljs.configure` function.

  /** @type HLJSOptions */

  let options = {
    noHighlightRe: /^(no-?highlight)$/i,
    languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
    classPrefix: 'hljs-',
    tabReplace: null,
    useBR: false,
    languages: null,
    // beta configuration options, subject to change, welcome to discuss
    // https://github.com/highlightjs/highlight.js/issues/1086
    __emitter: TokenTreeEmitter
  };
  /* Utility functions */

  /**
   * Tests a language name to see if highlighting should be skipped
   * @param {string} languageName
   */

  function shouldNotHighlight(languageName) {
    return options.noHighlightRe.test(languageName);
  }
  /**
   * @param {HighlightedHTMLElement} block - the HTML element to determine language for
   */


  function blockLanguage(block) {
    let classes = block.className + ' ';
    classes += block.parentNode ? block.parentNode.className : ''; // language-* takes precedence over non-prefixed class names.

    const match = options.languageDetectRe.exec(classes);

    if (match) {
      const language = getLanguage(match[1]);

      if (!language) {
        warn(LANGUAGE_NOT_FOUND.replace("{}", match[1]));
        warn("Falling back to no-highlight mode for this block.", block);
      }

      return language ? match[1] : 'no-highlight';
    }

    return classes.split(/\s+/).find(_class => shouldNotHighlight(_class) || getLanguage(_class));
  }
  /**
   * Core highlighting function.
   *
   * OLD API
   * highlight(lang, code, ignoreIllegals, continuation)
   *
   * NEW API
   * highlight(code, {lang, ignoreIllegals})
   *
   * @param {string} codeOrlanguageName - the language to use for highlighting
   * @param {string | HighlightOptions} optionsOrCode - the code to highlight
   * @param {boolean} [ignoreIllegals] - whether to ignore illegal matches, default is to bail
   * @param {CompiledMode} [continuation] - current continuation mode, if any
   *
   * @returns {HighlightResult} Result - an object that represents the result
   * @property {string} language - the language name
   * @property {number} relevance - the relevance score
   * @property {string} value - the highlighted HTML code
   * @property {string} code - the original raw code
   * @property {CompiledMode} top - top of the current mode stack
   * @property {boolean} illegal - indicates whether any illegal matches were found
  */


  function highlight(codeOrlanguageName, optionsOrCode, ignoreIllegals, continuation) {
    let code = "";
    let languageName = "";

    if (typeof optionsOrCode === "object") {
      code = codeOrlanguageName;
      ignoreIllegals = optionsOrCode.ignoreIllegals;
      languageName = optionsOrCode.language; // continuation not supported at all via the new API
      // eslint-disable-next-line no-undefined

      continuation = undefined;
    } else {
      // old API
      deprecated("10.7.0", "highlight(lang, code, ...args) has been deprecated.");
      deprecated("10.7.0", "Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277");
      languageName = codeOrlanguageName;
      code = optionsOrCode;
    }
    /** @type {BeforeHighlightContext} */


    const context = {
      code,
      language: languageName
    }; // the plugin can change the desired language or the code to be highlighted
    // just be changing the object it was passed

    fire("before:highlight", context); // a before plugin can usurp the result completely by providing it's own
    // in which case we don't even need to call highlight

    const result = context.result ? context.result : _highlight(context.language, context.code, ignoreIllegals, continuation);
    result.code = context.code; // the plugin can change anything in result to suite it

    fire("after:highlight", result);
    return result;
  }
  /**
   * private highlight that's used internally and does not fire callbacks
   *
   * @param {string} languageName - the language to use for highlighting
   * @param {string} codeToHighlight - the code to highlight
   * @param {boolean?} [ignoreIllegals] - whether to ignore illegal matches, default is to bail
   * @param {CompiledMode?} [continuation] - current continuation mode, if any
   * @returns {HighlightResult} - result of the highlight operation
  */


  function _highlight(languageName, codeToHighlight, ignoreIllegals, continuation) {
    /**
     * Return keyword data if a match is a keyword
     * @param {CompiledMode} mode - current mode
     * @param {RegExpMatchArray} match - regexp match data
     * @returns {KeywordData | false}
     */
    function keywordData(mode, match) {
      const matchText = language.case_insensitive ? match[0].toLowerCase() : match[0];
      return Object.prototype.hasOwnProperty.call(mode.keywords, matchText) && mode.keywords[matchText];
    }

    function processKeywords() {
      if (!top.keywords) {
        emitter.addText(modeBuffer);
        return;
      }

      let lastIndex = 0;
      top.keywordPatternRe.lastIndex = 0;
      let match = top.keywordPatternRe.exec(modeBuffer);
      let buf = "";

      while (match) {
        buf += modeBuffer.substring(lastIndex, match.index);
        const data = keywordData(top, match);

        if (data) {
          const [kind, keywordRelevance] = data;
          emitter.addText(buf);
          buf = "";
          relevance += keywordRelevance;

          if (kind.startsWith("_")) {
            // _ implied for relevance only, do not highlight
            // by applying a class name
            buf += match[0];
          } else {
            const cssClass = language.classNameAliases[kind] || kind;
            emitter.addKeyword(match[0], cssClass);
          }
        } else {
          buf += match[0];
        }

        lastIndex = top.keywordPatternRe.lastIndex;
        match = top.keywordPatternRe.exec(modeBuffer);
      }

      buf += modeBuffer.substr(lastIndex);
      emitter.addText(buf);
    }

    function processSubLanguage() {
      if (modeBuffer === "") return;
      /** @type HighlightResult */

      let result = null;

      if (typeof top.subLanguage === 'string') {
        if (!languages[top.subLanguage]) {
          emitter.addText(modeBuffer);
          return;
        }

        result = _highlight(top.subLanguage, modeBuffer, true, continuations[top.subLanguage]);
        continuations[top.subLanguage] = result.top;
      } else {
        result = highlightAuto(modeBuffer, top.subLanguage.length ? top.subLanguage : null);
      } // Counting embedded language score towards the host language may be disabled
      // with zeroing the containing mode relevance. Use case in point is Markdown that
      // allows XML everywhere and makes every XML snippet to have a much larger Markdown
      // score.


      if (top.relevance > 0) {
        relevance += result.relevance;
      }

      emitter.addSublanguage(result.emitter, result.language);
    }

    function processBuffer() {
      if (top.subLanguage != null) {
        processSubLanguage();
      } else {
        processKeywords();
      }

      modeBuffer = '';
    }
    /**
     * @param {Mode} mode - new mode to start
     */


    function startNewMode(mode) {
      if (mode.className) {
        emitter.openNode(language.classNameAliases[mode.className] || mode.className);
      }

      top = Object.create(mode, {
        parent: {
          value: top
        }
      });
      return top;
    }
    /**
     * @param {CompiledMode } mode - the mode to potentially end
     * @param {RegExpMatchArray} match - the latest match
     * @param {string} matchPlusRemainder - match plus remainder of content
     * @returns {CompiledMode | void} - the next mode, or if void continue on in current mode
     */


    function endOfMode(mode, match, matchPlusRemainder) {
      let matched = startsWith(mode.endRe, matchPlusRemainder);

      if (matched) {
        if (mode["on:end"]) {
          const resp = new Response(mode);
          mode["on:end"](match, resp);
          if (resp.isMatchIgnored) matched = false;
        }

        if (matched) {
          while (mode.endsParent && mode.parent) {
            mode = mode.parent;
          }

          return mode;
        }
      } // even if on:end fires an `ignore` it's still possible
      // that we might trigger the end node because of a parent mode


      if (mode.endsWithParent) {
        return endOfMode(mode.parent, match, matchPlusRemainder);
      }
    }
    /**
     * Handle matching but then ignoring a sequence of text
     *
     * @param {string} lexeme - string containing full match text
     */


    function doIgnore(lexeme) {
      if (top.matcher.regexIndex === 0) {
        // no more regexs to potentially match here, so we move the cursor forward one
        // space
        modeBuffer += lexeme[0];
        return 1;
      } else {
        // no need to move the cursor, we still have additional regexes to try and
        // match at this very spot
        resumeScanAtSamePosition = true;
        return 0;
      }
    }
    /**
     * Handle the start of a new potential mode match
     *
     * @param {EnhancedMatch} match - the current match
     * @returns {number} how far to advance the parse cursor
     */


    function doBeginMatch(match) {
      const lexeme = match[0];
      const newMode = match.rule;
      const resp = new Response(newMode); // first internal before callbacks, then the public ones

      const beforeCallbacks = [newMode.__beforeBegin, newMode["on:begin"]];

      for (const cb of beforeCallbacks) {
        if (!cb) continue;
        cb(match, resp);
        if (resp.isMatchIgnored) return doIgnore(lexeme);
      }

      if (newMode && newMode.endSameAsBegin) {
        newMode.endRe = escape(lexeme);
      }

      if (newMode.skip) {
        modeBuffer += lexeme;
      } else {
        if (newMode.excludeBegin) {
          modeBuffer += lexeme;
        }

        processBuffer();

        if (!newMode.returnBegin && !newMode.excludeBegin) {
          modeBuffer = lexeme;
        }
      }

      startNewMode(newMode); // if (mode["after:begin"]) {
      //   let resp = new Response(mode);
      //   mode["after:begin"](match, resp);
      // }

      return newMode.returnBegin ? 0 : lexeme.length;
    }
    /**
     * Handle the potential end of mode
     *
     * @param {RegExpMatchArray} match - the current match
     */


    function doEndMatch(match) {
      const lexeme = match[0];
      const matchPlusRemainder = codeToHighlight.substr(match.index);
      const endMode = endOfMode(top, match, matchPlusRemainder);

      if (!endMode) {
        return NO_MATCH;
      }

      const origin = top;

      if (origin.skip) {
        modeBuffer += lexeme;
      } else {
        if (!(origin.returnEnd || origin.excludeEnd)) {
          modeBuffer += lexeme;
        }

        processBuffer();

        if (origin.excludeEnd) {
          modeBuffer = lexeme;
        }
      }

      do {
        if (top.className) {
          emitter.closeNode();
        }

        if (!top.skip && !top.subLanguage) {
          relevance += top.relevance;
        }

        top = top.parent;
      } while (top !== endMode.parent);

      if (endMode.starts) {
        if (endMode.endSameAsBegin) {
          endMode.starts.endRe = endMode.endRe;
        }

        startNewMode(endMode.starts);
      }

      return origin.returnEnd ? 0 : lexeme.length;
    }

    function processContinuations() {
      const list = [];

      for (let current = top; current !== language; current = current.parent) {
        if (current.className) {
          list.unshift(current.className);
        }
      }

      list.forEach(item => emitter.openNode(item));
    }
    /** @type {{type?: MatchType, index?: number, rule?: Mode}}} */


    let lastMatch = {};
    /**
     *  Process an individual match
     *
     * @param {string} textBeforeMatch - text preceeding the match (since the last match)
     * @param {EnhancedMatch} [match] - the match itself
     */

    function processLexeme(textBeforeMatch, match) {
      const lexeme = match && match[0]; // add non-matched text to the current mode buffer

      modeBuffer += textBeforeMatch;

      if (lexeme == null) {
        processBuffer();
        return 0;
      } // we've found a 0 width match and we're stuck, so we need to advance
      // this happens when we have badly behaved rules that have optional matchers to the degree that
      // sometimes they can end up matching nothing at all
      // Ref: https://github.com/highlightjs/highlight.js/issues/2140


      if (lastMatch.type === "begin" && match.type === "end" && lastMatch.index === match.index && lexeme === "") {
        // spit the "skipped" character that our regex choked on back into the output sequence
        modeBuffer += codeToHighlight.slice(match.index, match.index + 1);

        if (!SAFE_MODE) {
          /** @type {AnnotatedError} */
          const err = new Error('0 width match regex');
          err.languageName = languageName;
          err.badRule = lastMatch.rule;
          throw err;
        }

        return 1;
      }

      lastMatch = match;

      if (match.type === "begin") {
        return doBeginMatch(match);
      } else if (match.type === "illegal" && !ignoreIllegals) {
        // illegal match, we do not continue processing

        /** @type {AnnotatedError} */
        const err = new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.className || '<unnamed>') + '"');
        err.mode = top;
        throw err;
      } else if (match.type === "end") {
        const processed = doEndMatch(match);

        if (processed !== NO_MATCH) {
          return processed;
        }
      } // edge case for when illegal matches $ (end of line) which is technically
      // a 0 width match but not a begin/end match so it's not caught by the
      // first handler (when ignoreIllegals is true)


      if (match.type === "illegal" && lexeme === "") {
        // advance so we aren't stuck in an infinite loop
        return 1;
      } // infinite loops are BAD, this is a last ditch catch all. if we have a
      // decent number of iterations yet our index (cursor position in our
      // parsing) still 3x behind our index then something is very wrong
      // so we bail


      if (iterations > 100000 && iterations > match.index * 3) {
        const err = new Error('potential infinite loop, way more iterations than matches');
        throw err;
      }
      /*
      Why might be find ourselves here?  Only one occasion now.  An end match that was
      triggered but could not be completed.  When might this happen?  When an `endSameasBegin`
      rule sets the end rule to a specific match.  Since the overall mode termination rule that's
      being used to scan the text isn't recompiled that means that any match that LOOKS like
      the end (but is not, because it is not an exact match to the beginning) will
      end up here.  A definite end match, but when `doEndMatch` tries to "reapply"
      the end rule and fails to match, we wind up here, and just silently ignore the end.
       This causes no real harm other than stopping a few times too many.
      */


      modeBuffer += lexeme;
      return lexeme.length;
    }

    const language = getLanguage(languageName);

    if (!language) {
      error(LANGUAGE_NOT_FOUND.replace("{}", languageName));
      throw new Error('Unknown language: "' + languageName + '"');
    }

    const md = compileLanguage(language, {
      plugins
    });
    let result = '';
    /** @type {CompiledMode} */

    let top = continuation || md;
    /** @type Record<string,CompiledMode> */

    const continuations = {}; // keep continuations for sub-languages

    const emitter = new options.__emitter(options);
    processContinuations();
    let modeBuffer = '';
    let relevance = 0;
    let index = 0;
    let iterations = 0;
    let resumeScanAtSamePosition = false;

    try {
      top.matcher.considerAll();

      for (;;) {
        iterations++;

        if (resumeScanAtSamePosition) {
          // only regexes not matched previously will now be
          // considered for a potential match
          resumeScanAtSamePosition = false;
        } else {
          top.matcher.considerAll();
        }

        top.matcher.lastIndex = index;
        const match = top.matcher.exec(codeToHighlight); // console.log("match", match[0], match.rule && match.rule.begin)

        if (!match) break;
        const beforeMatch = codeToHighlight.substring(index, match.index);
        const processedCount = processLexeme(beforeMatch, match);
        index = match.index + processedCount;
      }

      processLexeme(codeToHighlight.substr(index));
      emitter.closeAllNodes();
      emitter.finalize();
      result = emitter.toHTML();
      return {
        // avoid possible breakage with v10 clients expecting
        // this to always be an integer
        relevance: Math.floor(relevance),
        value: result,
        language: languageName,
        illegal: false,
        emitter: emitter,
        top: top
      };
    } catch (err) {
      if (err.message && err.message.includes('Illegal')) {
        return {
          illegal: true,
          illegalBy: {
            msg: err.message,
            context: codeToHighlight.slice(index - 100, index + 100),
            mode: err.mode
          },
          sofar: result,
          relevance: 0,
          value: escape$1(codeToHighlight),
          emitter: emitter
        };
      } else if (SAFE_MODE) {
        return {
          illegal: false,
          relevance: 0,
          value: escape$1(codeToHighlight),
          emitter: emitter,
          language: languageName,
          top: top,
          errorRaised: err
        };
      } else {
        throw err;
      }
    }
  }
  /**
   * returns a valid highlight result, without actually doing any actual work,
   * auto highlight starts with this and it's possible for small snippets that
   * auto-detection may not find a better match
   * @param {string} code
   * @returns {HighlightResult}
   */


  function justTextHighlightResult(code) {
    const result = {
      relevance: 0,
      emitter: new options.__emitter(options),
      value: escape$1(code),
      illegal: false,
      top: PLAINTEXT_LANGUAGE
    };
    result.emitter.addText(code);
    return result;
  }
  /**
  Highlighting with language detection. Accepts a string with the code to
  highlight. Returns an object with the following properties:
   - language (detected language)
  - relevance (int)
  - value (an HTML string with highlighting markup)
  - second_best (object with the same structure for second-best heuristically
    detected language, may be absent)
     @param {string} code
    @param {Array<string>} [languageSubset]
    @returns {AutoHighlightResult}
  */


  function highlightAuto(code, languageSubset) {
    languageSubset = languageSubset || options.languages || Object.keys(languages);
    const plaintext = justTextHighlightResult(code);
    const results = languageSubset.filter(getLanguage).filter(autoDetection).map(name => _highlight(name, code, false));
    results.unshift(plaintext); // plaintext is always an option

    const sorted = results.sort((a, b) => {
      // sort base on relevance
      if (a.relevance !== b.relevance) return b.relevance - a.relevance; // always award the tie to the base language
      // ie if C++ and Arduino are tied, it's more likely to be C++

      if (a.language && b.language) {
        if (getLanguage(a.language).supersetOf === b.language) {
          return 1;
        } else if (getLanguage(b.language).supersetOf === a.language) {
          return -1;
        }
      } // otherwise say they are equal, which has the effect of sorting on
      // relevance while preserving the original ordering - which is how ties
      // have historically been settled, ie the language that comes first always
      // wins in the case of a tie


      return 0;
    });
    const [best, secondBest] = sorted;
    /** @type {AutoHighlightResult} */

    const result = best;
    result.second_best = secondBest;
    return result;
  }
  /**
  Post-processing of the highlighted markup:
   - replace TABs with something more useful
  - replace real line-breaks with '<br>' for non-pre containers
     @param {string} html
    @returns {string}
  */


  function fixMarkup(html) {
    if (!(options.tabReplace || options.useBR)) {
      return html;
    }

    return html.replace(fixMarkupRe, match => {
      if (match === '\n') {
        return options.useBR ? '<br>' : match;
      } else if (options.tabReplace) {
        return match.replace(/\t/g, options.tabReplace);
      }

      return match;
    });
  }
  /**
   * Builds new class name for block given the language name
   *
   * @param {HTMLElement} element
   * @param {string} [currentLang]
   * @param {string} [resultLang]
   */


  function updateClassName(element, currentLang, resultLang) {
    const language = currentLang ? aliases[currentLang] : resultLang;
    element.classList.add("hljs");
    if (language) element.classList.add(language);
  }
  /** @type {HLJSPlugin} */


  const brPlugin = {
    "before:highlightElement": ({
      el
    }) => {
      if (options.useBR) {
        el.innerHTML = el.innerHTML.replace(/\n/g, '').replace(/<br[ /]*>/g, '\n');
      }
    },
    "after:highlightElement": ({
      result
    }) => {
      if (options.useBR) {
        result.value = result.value.replace(/\n/g, "<br>");
      }
    }
  };
  const TAB_REPLACE_RE = /^(<[^>]+>|\t)+/gm;
  /** @type {HLJSPlugin} */

  const tabReplacePlugin = {
    "after:highlightElement": ({
      result
    }) => {
      if (options.tabReplace) {
        result.value = result.value.replace(TAB_REPLACE_RE, m => m.replace(/\t/g, options.tabReplace));
      }
    }
  };
  /**
   * Applies highlighting to a DOM node containing code. Accepts a DOM node and
   * two optional parameters for fixMarkup.
   *
   * @param {HighlightedHTMLElement} element - the HTML element to highlight
  */

  function highlightElement(element) {
    /** @type HTMLElement */
    let node = null;
    const language = blockLanguage(element);
    if (shouldNotHighlight(language)) return; // support for v10 API

    fire("before:highlightElement", {
      el: element,
      language: language
    });
    node = element;
    const text = node.textContent;
    const result = language ? highlight(text, {
      language,
      ignoreIllegals: true
    }) : highlightAuto(text); // support for v10 API

    fire("after:highlightElement", {
      el: element,
      result,
      text
    });
    element.innerHTML = result.value;
    updateClassName(element, language, result.language);
    element.result = {
      language: result.language,
      // TODO: remove with version 11.0
      re: result.relevance,
      relavance: result.relevance
    };

    if (result.second_best) {
      element.second_best = {
        language: result.second_best.language,
        // TODO: remove with version 11.0
        re: result.second_best.relevance,
        relavance: result.second_best.relevance
      };
    }
  }
  /**
   * Updates highlight.js global options with the passed options
   *
   * @param {Partial<HLJSOptions>} userOptions
   */


  function configure(userOptions) {
    if (userOptions.useBR) {
      deprecated("10.3.0", "'useBR' will be removed entirely in v11.0");
      deprecated("10.3.0", "Please see https://github.com/highlightjs/highlight.js/issues/2559");
    }

    options = inherit$1(options, userOptions);
  }
  /**
   * Highlights to all <pre><code> blocks on a page
   *
   * @type {Function & {called?: boolean}}
   */
  // TODO: remove v12, deprecated


  const initHighlighting = () => {
    if (initHighlighting.called) return;
    initHighlighting.called = true;
    deprecated("10.6.0", "initHighlighting() is deprecated.  Use highlightAll() instead.");
    const blocks = document.querySelectorAll('pre code');
    blocks.forEach(highlightElement);
  }; // Higlights all when DOMContentLoaded fires
  // TODO: remove v12, deprecated


  function initHighlightingOnLoad() {
    deprecated("10.6.0", "initHighlightingOnLoad() is deprecated.  Use highlightAll() instead.");
    wantsHighlight = true;
  }

  let wantsHighlight = false;
  /**
   * auto-highlights all pre>code elements on the page
   */

  function highlightAll() {
    // if we are called too early in the loading process
    if (document.readyState === "loading") {
      wantsHighlight = true;
      return;
    }

    const blocks = document.querySelectorAll('pre code');
    blocks.forEach(highlightElement);
  }

  function boot() {
    // if a highlight was requested before DOM was loaded, do now
    if (wantsHighlight) highlightAll();
  } // make sure we are in the browser environment


  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('DOMContentLoaded', boot, false);
  }
  /**
   * Register a language grammar module
   *
   * @param {string} languageName
   * @param {LanguageFn} languageDefinition
   */


  function registerLanguage(languageName, languageDefinition) {
    let lang = null;

    try {
      lang = languageDefinition(hljs);
    } catch (error$1) {
      error("Language definition for '{}' could not be registered.".replace("{}", languageName)); // hard or soft error

      if (!SAFE_MODE) {
        throw error$1;
      } else {
        error(error$1);
      } // languages that have serious errors are replaced with essentially a
      // "plaintext" stand-in so that the code blocks will still get normal
      // css classes applied to them - and one bad language won't break the
      // entire highlighter


      lang = PLAINTEXT_LANGUAGE;
    } // give it a temporary name if it doesn't have one in the meta-data


    if (!lang.name) lang.name = languageName;
    languages[languageName] = lang;
    lang.rawDefinition = languageDefinition.bind(null, hljs);

    if (lang.aliases) {
      registerAliases(lang.aliases, {
        languageName
      });
    }
  }
  /**
   * Remove a language grammar module
   *
   * @param {string} languageName
   */


  function unregisterLanguage(languageName) {
    delete languages[languageName];

    for (const alias of Object.keys(aliases)) {
      if (aliases[alias] === languageName) {
        delete aliases[alias];
      }
    }
  }
  /**
   * @returns {string[]} List of language internal names
   */


  function listLanguages() {
    return Object.keys(languages);
  }
  /**
    intended usage: When one language truly requires another
     Unlike `getLanguage`, this will throw when the requested language
    is not available.
     @param {string} name - name of the language to fetch/require
    @returns {Language | never}
  */


  function requireLanguage(name) {
    deprecated("10.4.0", "requireLanguage will be removed entirely in v11.");
    deprecated("10.4.0", "Please see https://github.com/highlightjs/highlight.js/pull/2844");
    const lang = getLanguage(name);

    if (lang) {
      return lang;
    }

    const err = new Error('The \'{}\' language is required, but not loaded.'.replace('{}', name));
    throw err;
  }
  /**
   * @param {string} name - name of the language to retrieve
   * @returns {Language | undefined}
   */


  function getLanguage(name) {
    name = (name || '').toLowerCase();
    return languages[name] || languages[aliases[name]];
  }
  /**
   *
   * @param {string|string[]} aliasList - single alias or list of aliases
   * @param {{languageName: string}} opts
   */


  function registerAliases(aliasList, {
    languageName
  }) {
    if (typeof aliasList === 'string') {
      aliasList = [aliasList];
    }

    aliasList.forEach(alias => {
      aliases[alias.toLowerCase()] = languageName;
    });
  }
  /**
   * Determines if a given language has auto-detection enabled
   * @param {string} name - name of the language
   */


  function autoDetection(name) {
    const lang = getLanguage(name);
    return lang && !lang.disableAutodetect;
  }
  /**
   * Upgrades the old highlightBlock plugins to the new
   * highlightElement API
   * @param {HLJSPlugin} plugin
   */


  function upgradePluginAPI(plugin) {
    // TODO: remove with v12
    if (plugin["before:highlightBlock"] && !plugin["before:highlightElement"]) {
      plugin["before:highlightElement"] = data => {
        plugin["before:highlightBlock"](Object.assign({
          block: data.el
        }, data));
      };
    }

    if (plugin["after:highlightBlock"] && !plugin["after:highlightElement"]) {
      plugin["after:highlightElement"] = data => {
        plugin["after:highlightBlock"](Object.assign({
          block: data.el
        }, data));
      };
    }
  }
  /**
   * @param {HLJSPlugin} plugin
   */


  function addPlugin(plugin) {
    upgradePluginAPI(plugin);
    plugins.push(plugin);
  }
  /**
   *
   * @param {PluginEvent} event
   * @param {any} args
   */


  function fire(event, args) {
    const cb = event;
    plugins.forEach(function (plugin) {
      if (plugin[cb]) {
        plugin[cb](args);
      }
    });
  }
  /**
  Note: fixMarkup is deprecated and will be removed entirely in v11
   @param {string} arg
  @returns {string}
  */


  function deprecateFixMarkup(arg) {
    deprecated("10.2.0", "fixMarkup will be removed entirely in v11.0");
    deprecated("10.2.0", "Please see https://github.com/highlightjs/highlight.js/issues/2534");
    return fixMarkup(arg);
  }
  /**
   *
   * @param {HighlightedHTMLElement} el
   */


  function deprecateHighlightBlock(el) {
    deprecated("10.7.0", "highlightBlock will be removed entirely in v12.0");
    deprecated("10.7.0", "Please use highlightElement now.");
    return highlightElement(el);
  }
  /* Interface definition */


  Object.assign(hljs, {
    highlight,
    highlightAuto,
    highlightAll,
    fixMarkup: deprecateFixMarkup,
    highlightElement,
    // TODO: Remove with v12 API
    highlightBlock: deprecateHighlightBlock,
    configure,
    initHighlighting,
    initHighlightingOnLoad,
    registerLanguage,
    unregisterLanguage,
    listLanguages,
    getLanguage,
    registerAliases,
    requireLanguage,
    autoDetection,
    inherit: inherit$1,
    addPlugin,
    // plugins for frameworks
    vuePlugin: BuildVuePlugin(hljs).VuePlugin
  });

  hljs.debugMode = function () {
    SAFE_MODE = false;
  };

  hljs.safeMode = function () {
    SAFE_MODE = true;
  };

  hljs.versionString = version;

  for (const key in MODES) {
    // @ts-ignore
    if (typeof MODES[key] === "object") {
      // @ts-ignore
      deepFreezeEs6(MODES[key]);
    }
  } // merge all the modes/regexs into our main object


  Object.assign(hljs, MODES); // built-in plugins, likely to be moved out of core in the future

  hljs.addPlugin(brPlugin); // slated to be removed in v11

  hljs.addPlugin(mergeHTMLPlugin);
  hljs.addPlugin(tabReplacePlugin);
  return hljs;
}; // export an "instance" of the highlighter


var highlight = HLJS({});
var core = highlight;

/**
 * @param {string} value
 * @returns {RegExp}
 * */

/**
 * @param {RegExp | string } re
 * @returns {string}
 */
function source$3(re) {
  if (!re) return null;
  if (typeof re === "string") return re;
  return re.source;
}
/**
 * @param {...(RegExp | string) } args
 * @returns {string}
 */


function concat$3(...args) {
  const joined = args.map(x => source$3(x)).join("");
  return joined;
}
/*
Language: Bash
Author: vah <vahtenberg@gmail.com>
Contributrors: Benjamin Pannell <contact@sierrasoftworks.com>
Website: https://www.gnu.org/software/bash/
Category: common
*/

/** @type LanguageFn */


function bash(hljs) {
  const VAR = {};
  const BRACED_VAR = {
    begin: /\$\{/,
    end: /\}/,
    contains: ["self", {
      begin: /:-/,
      contains: [VAR]
    } // default values
    ]
  };
  Object.assign(VAR, {
    className: 'variable',
    variants: [{
      begin: concat$3(/\$[\w\d#@][\w\d_]*/, // negative look-ahead tries to avoid matching patterns that are not
      // Perl at all like $ident$, @ident@, etc.
      `(?![\\w\\d])(?![$])`)
    }, BRACED_VAR]
  });
  const SUBST = {
    className: 'subst',
    begin: /\$\(/,
    end: /\)/,
    contains: [hljs.BACKSLASH_ESCAPE]
  };
  const HERE_DOC = {
    begin: /<<-?\s*(?=\w+)/,
    starts: {
      contains: [hljs.END_SAME_AS_BEGIN({
        begin: /(\w+)/,
        end: /(\w+)/,
        className: 'string'
      })]
    }
  };
  const QUOTE_STRING = {
    className: 'string',
    begin: /"/,
    end: /"/,
    contains: [hljs.BACKSLASH_ESCAPE, VAR, SUBST]
  };
  SUBST.contains.push(QUOTE_STRING);
  const ESCAPED_QUOTE = {
    className: '',
    begin: /\\"/
  };
  const APOS_STRING = {
    className: 'string',
    begin: /'/,
    end: /'/
  };
  const ARITHMETIC = {
    begin: /\$\(\(/,
    end: /\)\)/,
    contains: [{
      begin: /\d+#[0-9a-f]+/,
      className: "number"
    }, hljs.NUMBER_MODE, VAR]
  };
  const SH_LIKE_SHELLS = ["fish", "bash", "zsh", "sh", "csh", "ksh", "tcsh", "dash", "scsh"];
  const KNOWN_SHEBANG = hljs.SHEBANG({
    binary: `(${SH_LIKE_SHELLS.join("|")})`,
    relevance: 10
  });
  const FUNCTION = {
    className: 'function',
    begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
    returnBegin: true,
    contains: [hljs.inherit(hljs.TITLE_MODE, {
      begin: /\w[\w\d_]*/
    })],
    relevance: 0
  };
  return {
    name: 'Bash',
    aliases: ['sh', 'zsh'],
    keywords: {
      $pattern: /\b[a-z._-]+\b/,
      keyword: 'if then else elif fi for while in do done case esac function',
      literal: 'true false',
      built_in: // Shell built-ins
      // http://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
      'break cd continue eval exec exit export getopts hash pwd readonly return shift test times ' + 'trap umask unset ' + // Bash built-ins
      'alias bind builtin caller command declare echo enable help let local logout mapfile printf ' + 'read readarray source type typeset ulimit unalias ' + // Shell modifiers
      'set shopt ' + // Zsh built-ins
      'autoload bg bindkey bye cap chdir clone comparguments compcall compctl compdescribe compfiles ' + 'compgroups compquote comptags comptry compvalues dirs disable disown echotc echoti emulate ' + 'fc fg float functions getcap getln history integer jobs kill limit log noglob popd print ' + 'pushd pushln rehash sched setcap setopt stat suspend ttyctl unfunction unhash unlimit ' + 'unsetopt vared wait whence where which zcompile zformat zftp zle zmodload zparseopts zprof ' + 'zpty zregexparse zsocket zstyle ztcp'
    },
    contains: [KNOWN_SHEBANG, // to catch known shells and boost relevancy
    hljs.SHEBANG(), // to catch unknown shells but still highlight the shebang
    FUNCTION, ARITHMETIC, hljs.HASH_COMMENT_MODE, HERE_DOC, QUOTE_STRING, ESCAPED_QUOTE, APOS_STRING, VAR]
  };
}

var bash_1 = bash;

/*
Language: Shell Session
Requires: bash.js
Author: TSUYUSATO Kitsune <make.just.on@gmail.com>
Category: common
Audit: 2020
*/

/** @type LanguageFn */
function shell(hljs) {
  return {
    name: 'Shell Session',
    aliases: ['console'],
    contains: [{
      className: 'meta',
      // We cannot add \s (spaces) in the regular expression otherwise it will be too broad and produce unexpected result.
      // For instance, in the following example, it would match "echo /path/to/home >" as a prompt:
      // echo /path/to/home > t.exe
      begin: /^\s{0,3}[/~\w\d[\]()@-]*[>%$#]/,
      starts: {
        end: /[^\\](?=\s*$)/,
        subLanguage: 'bash'
      }
    }]
  };
}

var shell_1 = shell;

/**
 * @param {string} value
 * @returns {RegExp}
 * */

/**
 * @param {RegExp | string } re
 * @returns {string}
 */
function source$2(re) {
  if (!re) return null;
  if (typeof re === "string") return re;
  return re.source;
}
/**
 * @param {RegExp | string } re
 * @returns {string}
 */


function lookahead$1(re) {
  return concat$2('(?=', re, ')');
}
/**
 * @param {RegExp | string } re
 * @returns {string}
 */


function optional(re) {
  return concat$2('(', re, ')?');
}
/**
 * @param {...(RegExp | string) } args
 * @returns {string}
 */


function concat$2(...args) {
  const joined = args.map(x => source$2(x)).join("");
  return joined;
}
/**
 * Any of the passed expresssions may match
 *
 * Creates a huge this | this | that | that match
 * @param {(RegExp | string)[] } args
 * @returns {string}
 */


function either(...args) {
  const joined = '(' + args.map(x => source$2(x)).join("|") + ")";
  return joined;
}
/*
Language: HTML, XML
Website: https://www.w3.org/XML/
Category: common
Audit: 2020
*/

/** @type LanguageFn */


function xml(hljs) {
  // Element names can contain letters, digits, hyphens, underscores, and periods
  const TAG_NAME_RE = concat$2(/[A-Z_]/, optional(/[A-Z0-9_.-]*:/), /[A-Z0-9_.-]*/);
  const XML_IDENT_RE = /[A-Za-z0-9._:-]+/;
  const XML_ENTITIES = {
    className: 'symbol',
    begin: /&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/
  };
  const XML_META_KEYWORDS = {
    begin: /\s/,
    contains: [{
      className: 'meta-keyword',
      begin: /#?[a-z_][a-z1-9_-]+/,
      illegal: /\n/
    }]
  };
  const XML_META_PAR_KEYWORDS = hljs.inherit(XML_META_KEYWORDS, {
    begin: /\(/,
    end: /\)/
  });
  const APOS_META_STRING_MODE = hljs.inherit(hljs.APOS_STRING_MODE, {
    className: 'meta-string'
  });
  const QUOTE_META_STRING_MODE = hljs.inherit(hljs.QUOTE_STRING_MODE, {
    className: 'meta-string'
  });
  const TAG_INTERNALS = {
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
          end: /"/,
          contains: [XML_ENTITIES]
        }, {
          begin: /'/,
          end: /'/,
          contains: [XML_ENTITIES]
        }, {
          begin: /[^\s"'=<>`]+/
        }]
      }]
    }]
  };
  return {
    name: 'HTML, XML',
    aliases: ['html', 'xhtml', 'rss', 'atom', 'xjb', 'xsd', 'xsl', 'plist', 'wsf', 'svg'],
    case_insensitive: true,
    contains: [{
      className: 'meta',
      begin: /<![a-z]/,
      end: />/,
      relevance: 10,
      contains: [XML_META_KEYWORDS, QUOTE_META_STRING_MODE, APOS_META_STRING_MODE, XML_META_PAR_KEYWORDS, {
        begin: /\[/,
        end: /\]/,
        contains: [{
          className: 'meta',
          begin: /<![a-z]/,
          end: />/,
          contains: [XML_META_KEYWORDS, XML_META_PAR_KEYWORDS, QUOTE_META_STRING_MODE, APOS_META_STRING_MODE]
        }]
      }]
    }, hljs.COMMENT(/<!--/, /-->/, {
      relevance: 10
    }), {
      begin: /<!\[CDATA\[/,
      end: /\]\]>/,
      relevance: 10
    }, XML_ENTITIES, {
      className: 'meta',
      begin: /<\?xml/,
      end: /\?>/,
      relevance: 10
    }, {
      className: 'tag',

      /*
      The lookahead pattern (?=...) ensures that 'begin' only matches
      '<style' as a single word, followed by a whitespace or an
      ending braket. The '$' is needed for the lexeme to be recognized
      by hljs.subMode() that tests lexemes outside the stream.
      */
      begin: /<style(?=\s|>)/,
      end: />/,
      keywords: {
        name: 'style'
      },
      contains: [TAG_INTERNALS],
      starts: {
        end: /<\/style>/,
        returnEnd: true,
        subLanguage: ['css', 'xml']
      }
    }, {
      className: 'tag',
      // See the comment in the <style tag about the lookahead pattern
      begin: /<script(?=\s|>)/,
      end: />/,
      keywords: {
        name: 'script'
      },
      contains: [TAG_INTERNALS],
      starts: {
        end: /<\/script>/,
        returnEnd: true,
        subLanguage: ['javascript', 'handlebars', 'xml']
      }
    }, // we need this for now for jSX
    {
      className: 'tag',
      begin: /<>|<\/>/
    }, // open tag
    {
      className: 'tag',
      begin: concat$2(/</, lookahead$1(concat$2(TAG_NAME_RE, // <tag/>
      // <tag>
      // <tag ...
      either(/\/>/, />/, /\s/)))),
      end: /\/?>/,
      contains: [{
        className: 'name',
        begin: TAG_NAME_RE,
        relevance: 0,
        starts: TAG_INTERNALS
      }]
    }, // close tag
    {
      className: 'tag',
      begin: concat$2(/<\//, lookahead$1(concat$2(TAG_NAME_RE, />/))),
      contains: [{
        className: 'name',
        begin: TAG_NAME_RE,
        relevance: 0
      }, {
        begin: />/,
        relevance: 0,
        endsParent: true
      }]
    }]
  };
}

var xml_1 = xml;

/**
 * @param {string} value
 * @returns {RegExp}
 * */

/**
 * @param {RegExp | string } re
 * @returns {string}
 */
function source$1(re) {
  if (!re) return null;
  if (typeof re === "string") return re;
  return re.source;
}
/**
 * @param {...(RegExp | string) } args
 * @returns {string}
 */


function concat$1(...args) {
  const joined = args.map(x => source$1(x)).join("");
  return joined;
}
/*
Language: AsciiDoc
Requires: xml.js
Author: Dan Allen <dan.j.allen@gmail.com>
Website: http://asciidoc.org
Description: A semantic, text-based document format that can be exported to HTML, DocBook and other backends.
Category: markup
*/

/** @type LanguageFn */


function asciidoc(hljs) {
  const HORIZONTAL_RULE = {
    begin: '^\'{3,}[ \\t]*$',
    relevance: 10
  };
  const ESCAPED_FORMATTING = [// escaped constrained formatting marks (i.e., \* \_ or \`)
  {
    begin: /\\[*_`]/
  }, // escaped unconstrained formatting marks (i.e., \\** \\__ or \\``)
  // must ignore until the next formatting marks
  // this rule might not be 100% compliant with Asciidoctor 2.0 but we are entering undefined behavior territory...
  {
    begin: /\\\\\*{2}[^\n]*?\*{2}/
  }, {
    begin: /\\\\_{2}[^\n]*_{2}/
  }, {
    begin: /\\\\`{2}[^\n]*`{2}/
  }, // guard: constrained formatting mark may not be preceded by ":", ";" or
  // "}". match these so the constrained rule doesn't see them
  {
    begin: /[:;}][*_`](?![*_`])/
  }];
  const STRONG = [// inline unconstrained strong (single line)
  {
    className: 'strong',
    begin: /\*{2}([^\n]+?)\*{2}/
  }, // inline unconstrained strong (multi-line)
  {
    className: 'strong',
    begin: concat$1(/\*\*/, /((\*(?!\*)|\\[^\n]|[^*\n\\])+\n)+/, /(\*(?!\*)|\\[^\n]|[^*\n\\])*/, /\*\*/),
    relevance: 0
  }, // inline constrained strong (single line)
  {
    className: 'strong',
    // must not precede or follow a word character
    begin: /\B\*(\S|\S[^\n]*?\S)\*(?!\w)/
  }, // inline constrained strong (multi-line)
  {
    className: 'strong',
    // must not precede or follow a word character
    begin: /\*[^\s]([^\n]+\n)+([^\n]+)\*/
  }];
  const EMPHASIS = [// inline unconstrained emphasis (single line)
  {
    className: 'emphasis',
    begin: /_{2}([^\n]+?)_{2}/
  }, // inline unconstrained emphasis (multi-line)
  {
    className: 'emphasis',
    begin: concat$1(/__/, /((_(?!_)|\\[^\n]|[^_\n\\])+\n)+/, /(_(?!_)|\\[^\n]|[^_\n\\])*/, /__/),
    relevance: 0
  }, // inline constrained emphasis (single line)
  {
    className: 'emphasis',
    // must not precede or follow a word character
    begin: /\b_(\S|\S[^\n]*?\S)_(?!\w)/
  }, // inline constrained emphasis (multi-line)
  {
    className: 'emphasis',
    // must not precede or follow a word character
    begin: /_[^\s]([^\n]+\n)+([^\n]+)_/
  }, // inline constrained emphasis using single quote (legacy)
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
  }];
  const ADMONITION = {
    className: 'symbol',
    begin: '^(NOTE|TIP|IMPORTANT|WARNING|CAUTION):\\s+',
    relevance: 10
  };
  const BULLET_LIST = {
    className: 'bullet',
    begin: '^(\\*+|-+|\\.+|[^\\n]+?::)\\s+'
  };
  return {
    name: 'AsciiDoc',
    aliases: ['adoc'],
    contains: [// block comment
    hljs.COMMENT('^/{4,}\\n', '\\n/{4,}$', // can also be done as...
    // '^/{4,}$',
    // '^/{4,}$',
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
        begin: '^(={1,6})[ \t].+?([ \t]\\1)?$'
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
    }, BULLET_LIST, ADMONITION, ...ESCAPED_FORMATTING, ...STRONG, ...EMPHASIS, // inline smart quotes
    {
      className: 'string',
      variants: [{
        begin: "``.+?''"
      }, {
        begin: "`.+?'"
      }]
    }, // inline unconstrained emphasis
    {
      className: 'code',
      begin: /`{2}/,
      end: /(\n{2}|`{2})/
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
    }, HORIZONTAL_RULE, // images and links
    {
      begin: '(link:)?(http|https|ftp|file|irc|image:?):\\S+?\\[[^[]*?\\]',
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
}

var asciidoc_1 = asciidoc;

const IDENT_RE = '[A-Za-z$_][0-9A-Za-z$_]*';
const KEYWORDS = ["as", // for exports
"in", "of", "if", "for", "while", "finally", "var", "new", "function", "do", "return", "void", "else", "break", "catch", "instanceof", "with", "throw", "case", "default", "try", "switch", "continue", "typeof", "delete", "let", "yield", "const", "class", // JS handles these with a special rule
// "get",
// "set",
"debugger", "async", "await", "static", "import", "from", "export", "extends"];
const LITERALS = ["true", "false", "null", "undefined", "NaN", "Infinity"];
const TYPES = ["Intl", "DataView", "Number", "Math", "Date", "String", "RegExp", "Object", "Function", "Boolean", "Error", "Symbol", "Set", "Map", "WeakSet", "WeakMap", "Proxy", "Reflect", "JSON", "Promise", "Float64Array", "Int16Array", "Int32Array", "Int8Array", "Uint16Array", "Uint32Array", "Float32Array", "Array", "Uint8Array", "Uint8ClampedArray", "ArrayBuffer", "BigInt64Array", "BigUint64Array", "BigInt"];
const ERROR_TYPES = ["EvalError", "InternalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError"];
const BUILT_IN_GLOBALS = ["setInterval", "setTimeout", "clearInterval", "clearTimeout", "require", "exports", "eval", "isFinite", "isNaN", "parseFloat", "parseInt", "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent", "escape", "unescape"];
const BUILT_IN_VARIABLES = ["arguments", "this", "super", "console", "window", "document", "localStorage", "module", "global" // Node.js
];
const BUILT_INS = [].concat(BUILT_IN_GLOBALS, BUILT_IN_VARIABLES, TYPES, ERROR_TYPES);
/**
 * @param {string} value
 * @returns {RegExp}
 * */

/**
 * @param {RegExp | string } re
 * @returns {string}
 */

function source(re) {
  if (!re) return null;
  if (typeof re === "string") return re;
  return re.source;
}
/**
 * @param {RegExp | string } re
 * @returns {string}
 */


function lookahead(re) {
  return concat('(?=', re, ')');
}
/**
 * @param {...(RegExp | string) } args
 * @returns {string}
 */


function concat(...args) {
  const joined = args.map(x => source(x)).join("");
  return joined;
}
/*
Language: JavaScript
Description: JavaScript (JS) is a lightweight, interpreted, or just-in-time compiled programming language with first-class functions.
Category: common, scripting
Website: https://developer.mozilla.org/en-US/docs/Web/JavaScript
*/

/** @type LanguageFn */


function javascript(hljs) {
  /**
   * Takes a string like "<Booger" and checks to see
   * if we can find a matching "</Booger" later in the
   * content.
   * @param {RegExpMatchArray} match
   * @param {{after:number}} param1
   */
  const hasClosingTag = (match, {
    after
  }) => {
    const tag = "</" + match[0].slice(1);
    const pos = match.input.indexOf(tag, after);
    return pos !== -1;
  };

  const IDENT_RE$1 = IDENT_RE;
  const FRAGMENT = {
    begin: '<>',
    end: '</>'
  };
  const XML_TAG = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,

    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (match, response) => {
      const afterMatchIndex = match[0].length + match.index;
      const nextChar = match.input[afterMatchIndex]; // nested type?
      // HTML should not include another raw `<` inside a tag
      // But a type might: `<Array<Array<number>>`, etc.

      if (nextChar === "<") {
        response.ignoreMatch();
        return;
      } // <something>
      // This is now either a tag or a type.


      if (nextChar === ">") {
        // if we cannot find a matching closing tag, then we
        // will ignore it
        if (!hasClosingTag(match, {
          after: afterMatchIndex
        })) {
          response.ignoreMatch();
        }
      }
    }
  };
  const KEYWORDS$1 = {
    $pattern: IDENT_RE,
    keyword: KEYWORDS,
    literal: LITERALS,
    built_in: BUILT_INS
  }; // https://tc39.es/ecma262/#sec-literals-numeric-literals

  const decimalDigits = '[0-9](_?[0-9])*';
  const frac = `\\.(${decimalDigits})`; // DecimalIntegerLiteral, including Annex B NonOctalDecimalIntegerLiteral
  // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals

  const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
  const NUMBER = {
    className: 'number',
    variants: [// DecimalLiteral
    {
      begin: `(\\b(${decimalInteger})((${frac})|\\.)?|(${frac}))` + `[eE][+-]?(${decimalDigits})\\b`
    }, {
      begin: `\\b(${decimalInteger})\\b((${frac})\\b|\\.)?|(${frac})\\b`
    }, // DecimalBigIntegerLiteral
    {
      begin: `\\b(0|[1-9](_?[0-9])*)n\\b`
    }, // NonDecimalIntegerLiteral
    {
      begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"
    }, {
      begin: "\\b0[bB][0-1](_?[0-1])*n?\\b"
    }, {
      begin: "\\b0[oO][0-7](_?[0-7])*n?\\b"
    }, // LegacyOctalIntegerLiteral (does not include underscore separators)
    // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
    {
      begin: "\\b0[0-7]+n?\\b"
    }],
    relevance: 0
  };
  const SUBST = {
    className: 'subst',
    begin: '\\$\\{',
    end: '\\}',
    keywords: KEYWORDS$1,
    contains: [] // defined later

  };
  const HTML_TEMPLATE = {
    begin: 'html`',
    end: '',
    starts: {
      end: '`',
      returnEnd: false,
      contains: [hljs.BACKSLASH_ESCAPE, SUBST],
      subLanguage: 'xml'
    }
  };
  const CSS_TEMPLATE = {
    begin: 'css`',
    end: '',
    starts: {
      end: '`',
      returnEnd: false,
      contains: [hljs.BACKSLASH_ESCAPE, SUBST],
      subLanguage: 'css'
    }
  };
  const TEMPLATE_STRING = {
    className: 'string',
    begin: '`',
    end: '`',
    contains: [hljs.BACKSLASH_ESCAPE, SUBST]
  };
  const JSDOC_COMMENT = hljs.COMMENT(/\/\*\*(?!\/)/, '\\*/', {
    relevance: 0,
    contains: [{
      className: 'doctag',
      begin: '@[A-Za-z]+',
      contains: [{
        className: 'type',
        begin: '\\{',
        end: '\\}',
        relevance: 0
      }, {
        className: 'variable',
        begin: IDENT_RE$1 + '(?=\\s*(-)|$)',
        endsParent: true,
        relevance: 0
      }, // eat spaces (not newlines) so we can find
      // types or variables
      {
        begin: /(?=[^\n])\s/,
        relevance: 0
      }]
    }]
  });
  const COMMENT = {
    className: "comment",
    variants: [JSDOC_COMMENT, hljs.C_BLOCK_COMMENT_MODE, hljs.C_LINE_COMMENT_MODE]
  };
  const SUBST_INTERNALS = [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, HTML_TEMPLATE, CSS_TEMPLATE, TEMPLATE_STRING, NUMBER, hljs.REGEXP_MODE];
  SUBST.contains = SUBST_INTERNALS.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: KEYWORDS$1,
    contains: ["self"].concat(SUBST_INTERNALS)
  });
  const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
  const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([// eat recursive parens in sub expressions
  {
    begin: /\(/,
    end: /\)/,
    keywords: KEYWORDS$1,
    contains: ["self"].concat(SUBST_AND_COMMENTS)
  }]);
  const PARAMS = {
    className: 'params',
    begin: /\(/,
    end: /\)/,
    excludeBegin: true,
    excludeEnd: true,
    keywords: KEYWORDS$1,
    contains: PARAMS_CONTAINS
  };
  return {
    name: 'Javascript',
    aliases: ['js', 'jsx', 'mjs', 'cjs'],
    keywords: KEYWORDS$1,
    // this will be extended by TypeScript
    exports: {
      PARAMS_CONTAINS
    },
    illegal: /#(?![$_A-z])/,
    contains: [hljs.SHEBANG({
      label: "shebang",
      binary: "node",
      relevance: 5
    }), {
      label: "use_strict",
      className: 'meta',
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, HTML_TEMPLATE, CSS_TEMPLATE, TEMPLATE_STRING, COMMENT, NUMBER, {
      // object attr container
      begin: concat(/[{,\n]\s*/, // we need to look ahead to make sure that we actually have an
      // attribute coming up so we don't steal a comma from a potential
      // "value" container
      //
      // NOTE: this might not work how you think.  We don't actually always
      // enter this mode and stay.  Instead it might merely match `,
      // <comments up next>` and then immediately end after the , because it
      // fails to find any actual attrs. But this still does the job because
      // it prevents the value contain rule from grabbing this instead and
      // prevening this rule from firing when we actually DO have keys.
      lookahead(concat( // we also need to allow for multiple possible comments inbetween
      // the first key:value pairing
      /(((\/\/.*$)|(\/\*(\*[^/]|[^*])*\*\/))\s*)*/, IDENT_RE$1 + '\\s*:'))),
      relevance: 0,
      contains: [{
        className: 'attr',
        begin: IDENT_RE$1 + lookahead('\\s*:'),
        relevance: 0
      }]
    }, {
      // "value" container
      begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
      keywords: 'return throw case',
      contains: [COMMENT, hljs.REGEXP_MODE, {
        className: 'function',
        // we have to count the parens to make sure we actually have the
        // correct bounding ( ) before the =>.  There could be any number of
        // sub-expressions inside also surrounded by parens.
        begin: '(\\(' + '[^()]*(\\(' + '[^()]*(\\(' + '[^()]*' + '\\)[^()]*)*' + '\\)[^()]*)*' + '\\)|' + hljs.UNDERSCORE_IDENT_RE + ')\\s*=>',
        returnBegin: true,
        end: '\\s*=>',
        contains: [{
          className: 'params',
          variants: [{
            begin: hljs.UNDERSCORE_IDENT_RE,
            relevance: 0
          }, {
            className: null,
            begin: /\(\s*\)/,
            skip: true
          }, {
            begin: /\(/,
            end: /\)/,
            excludeBegin: true,
            excludeEnd: true,
            keywords: KEYWORDS$1,
            contains: PARAMS_CONTAINS
          }]
        }]
      }, {
        // could be a comma delimited list of params to a function call
        begin: /,/,
        relevance: 0
      }, {
        className: '',
        begin: /\s/,
        end: /\s*/,
        skip: true
      }, {
        // JSX
        variants: [{
          begin: FRAGMENT.begin,
          end: FRAGMENT.end
        }, {
          begin: XML_TAG.begin,
          // we carefully check the opening tag to see if it truly
          // is a tag and not a false positive
          'on:begin': XML_TAG.isTrulyOpeningTag,
          end: XML_TAG.end
        }],
        subLanguage: 'xml',
        contains: [{
          begin: XML_TAG.begin,
          end: XML_TAG.end,
          skip: true,
          contains: ['self']
        }]
      }],
      relevance: 0
    }, {
      className: 'function',
      beginKeywords: 'function',
      end: /[{;]/,
      excludeEnd: true,
      keywords: KEYWORDS$1,
      contains: ['self', hljs.inherit(hljs.TITLE_MODE, {
        begin: IDENT_RE$1
      }), PARAMS],
      illegal: /%/
    }, {
      // prevent this from getting swallowed up by function
      // since they appear "function like"
      beginKeywords: "while if switch catch for"
    }, {
      className: 'function',
      // we have to count the parens to make sure we actually have the correct
      // bounding ( ).  There could be any number of sub-expressions inside
      // also surrounded by parens.
      begin: hljs.UNDERSCORE_IDENT_RE + '\\(' + // first parens
      '[^()]*(\\(' + '[^()]*(\\(' + '[^()]*' + '\\)[^()]*)*' + '\\)[^()]*)*' + '\\)\\s*\\{',
      // end parens
      returnBegin: true,
      contains: [PARAMS, hljs.inherit(hljs.TITLE_MODE, {
        begin: IDENT_RE$1
      })]
    }, // hack: prevents detection of keywords in some circumstances
    // .keyword()
    // $keyword = x
    {
      variants: [{
        begin: '\\.' + IDENT_RE$1
      }, {
        begin: '\\$' + IDENT_RE$1
      }],
      relevance: 0
    }, {
      // ES6 class
      className: 'class',
      beginKeywords: 'class',
      end: /[{;=]/,
      excludeEnd: true,
      illegal: /[:"[\]]/,
      contains: [{
        beginKeywords: 'extends'
      }, hljs.UNDERSCORE_TITLE_MODE]
    }, {
      begin: /\b(?=constructor)/,
      end: /[{;]/,
      excludeEnd: true,
      contains: [hljs.inherit(hljs.TITLE_MODE, {
        begin: IDENT_RE$1
      }), 'self', PARAMS]
    }, {
      begin: '(get|set)\\s+(?=' + IDENT_RE$1 + '\\()',
      end: /\{/,
      keywords: "get set",
      contains: [hljs.inherit(hljs.TITLE_MODE, {
        begin: IDENT_RE$1
      }), {
        begin: /\(\)/
      }, // eat to avoid empty params
      PARAMS]
    }, {
      begin: /\$[(.]/ // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`

    }]
  };
}

var javascript_1 = javascript;

core.registerLanguage('bash', bash_1);
core.registerLanguage('shell', shell_1);
core.registerLanguage('xml', xml_1);
core.registerLanguage('asciidoc', asciidoc_1);
core.registerLanguage('javascript', javascript_1);
var md = markdown({
  html: true,
  highlight: function highlight(code, lang) {
    return core.highlightAuto(code, [lang]).value;
  }
});
md.use(markdownAttributes);
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
