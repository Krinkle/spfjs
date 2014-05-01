/**
 * @fileoverview Functions for dynamically loading scripts without blocking.
 * By nesting multiple calls in callback parameters, execution order of
 * the scripts can be preserved as well.
 *
 * Single script example:
 * spf.net.scripts.load(url, function() {
 *   doSomethingAfterOneScriptIsLoaded();
 * });
 *
 * Multiple script example, preserving execution order of the scripts:
 * spf.net.scripts.load(url1, function() {
 *   spf.net.scripts.load(url2, function() {
 *     doSomethingAfterTwoScriptsAreLoadedInOrder();
 *   });
 * });
 *
 * @author nicksay@google.com (Alex Nicksay)
 */

goog.provide('spf.net.scripts');

goog.require('spf.debug');
goog.require('spf.net.resources');
goog.require('spf.string');
goog.require('spf.tracing');


/**
 * Marks all existing script URL elements in the document as loaded.
 */
spf.net.scripts.mark = function() {
  spf.net.resources.mark(spf.net.resources.Type.JS);
};


/**
 * Evaluates a script text by dynamically creating an element and appending it
 * to the document.  A callback can be specified to execute once the script
 * has been loaded.
 *
 * @param {string} text The text of the script.
 * @param {Function=} opt_callback Callback function to execute when the
 *     script is loaded.
 * @return {undefined}
 */
spf.net.scripts.eval = function(text, opt_callback) {
  text = spf.string.trim(text);
  if (text) {
    if (window.execScript) {
      // For IE, reach global scope using execScript to avoid a bug where
      // indirect eval is treated as direct eval.
      window.execScript(text);
    } else if (spf.string.startsWith(text, 'use strict', 1)) {
      // For strict mode, reach global scope using the slower script injection
      // method.
      var scriptEl = document.createElement('script');
      scriptEl.text = text;
      // Place the scripts in the head instead of the body to avoid errors when
      // called from the head in the first place.
      var targetEl = document.getElementsByTagName('head')[0] || document.body;
      targetEl.appendChild(scriptEl);
      targetEl.removeChild(scriptEl);
    } else {
      // Otherwise, use indirect eval to reach global scope.
      (0, eval)(text);
    }
  }
  if (opt_callback) {
    opt_callback();
  }
};


/**
 * Loads a script URL by dynamically creating an element and appending it to
 * the document.
 *
 * - Subsequent calls to load the same URL will not reload the script.  This
 *   is done by giving each script a unique element id based on the URL and
 *   checking for it prior to loading.  To reload a script, unload it first.
 *   {@link #unload}
 *
 * - A callback can be specified to execute once the script has loaded.  The
 *   callback will be execute each time, even if the script is not reloaded.
 *
 * - A name can be specified to identify the same script at different URLs.
 *   (For example, "main-A.js" and "main-B.js" are both "main".)  If a name
 *   is specified, all other scripts with the same name will be unloaded
 *   before the callback is executed.  This allows switching between
 *   versions of the same script at different URLs.
 *
 * @param {string} url Url of the script.
 * @param {Function=} opt_callback Callback function to execute when the
 *     script is loaded.
 * @param {string=} opt_name Name to identify the script independently
 *     of the URL.
 * @return {Element} The dynamically created script element.
 */
spf.net.scripts.load = function(url, opt_callback, opt_name) {
  return spf.net.resources.load(spf.net.resources.Type.JS, url,
                                opt_callback, opt_name);
};


/**
 * "Unloads" a script URL by finding a previously created element and
 * removing it from the document.  This will allow a URL to be loaded again
 * if needed.
 *
 * NOTE: Unloading a script will prevent execution of ALL pending callbacks
 * but is NOT guaranteed to stop the browser loading a pending URL.
 *
 * @param {string} url Url of the script.
 */
spf.net.scripts.unload = function(url) {
  spf.debug.warn('unloading script, canceling ALL pending callbacks',
                 'url=', url);
  spf.net.resources.unload(spf.net.resources.Type.JS, url);
};


/**
 * "Ignores" a script load by canceling execution of a pending callback.
 *
 * @param {string} url Url of the script.
 * @param {Function} callback Callback function to cancel.
 */
spf.net.scripts.ignore = function(url, callback) {
  spf.net.resources.ignore(spf.net.resources.Type.JS, url, callback);
};


/**
 * Prefetchs a script URL; the script will be requested but not loaded.
 * Use to prime the browser cache and avoid needing to request the script when
 * subsequently loaded.  See {@link #load}.
 *
 * @param {string} url Url of the script.
 */
spf.net.scripts.prefetch = function(url) {
  spf.net.resources.prefetch(spf.net.resources.Type.JS, url);
};


if (spf.tracing.ENABLED) {
  (function() {
    spf.net.scripts.eval = spf.tracing.instrument(
        spf.net.scripts.eval, 'spf.net.scripts.eval');
    spf.net.scripts.load = spf.tracing.instrument(
        spf.net.scripts.load, 'spf.net.scripts.load');
    spf.net.scripts.unload = spf.tracing.instrument(
        spf.net.scripts.unload, 'spf.net.scripts.unload');
    spf.net.scripts.ignore = spf.tracing.instrument(
        spf.net.scripts.ignore, 'spf.net.scripts.ignore');
    spf.net.scripts.prefetch = spf.tracing.instrument(
        spf.net.scripts.prefetch, 'spf.net.scripts.prefetch');
  })();
}