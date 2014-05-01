/**
 * @fileoverview The SPF bootloader (aka bootstrap script loader).
 *
 * A minimal subset of the SPF API to load scripts, designed to be inlined in
 * the document head and extended by the main SPF code.  Provides an interface
 * loosely similar to $script.js {@link https://github.com/ded/script.js/} but
 * with enhancements.
 *
 * @author nicksay@google.com (Alex Nicksay)
 */

goog.provide('spf.bootloader');

goog.require('spf');
goog.require('spf.net.scriptbeta');


// Create the bootloader API by exporting aliased functions.
/** @private {Object} */
spf.bootloader.api_ = {
  'script': {
    // The bootloader API.
    // * Load scripts.
    'load': spf.net.scriptbeta.load,
    'get': spf.net.scriptbeta.get,
    // * Wait until ready.
    'ready': spf.net.scriptbeta.ready,
    'done': spf.net.scriptbeta.done,
    // * Load in depedency order.
    'require': spf.net.scriptbeta.require,
    // * Set dependencies and paths.
    'declare': spf.net.scriptbeta.declare,
    'path': spf.net.scriptbeta.path
  }
};
// For beta builds, add an identifying flag.
if (SPF_BETA) {
  spf.bootloader.api_['beta'] = true;
}
if (!SPF_COMPILED) {
  // When not compiled, mixin the API to the existing namespace for development.
  for (var key in spf.bootloader.api_) {
    // Work around the "incomplete alias" warning.
    eval('spf[key] = spf.bootloader.api_[key]');
  }
} else {
  // When compiled for a production/debug build, isolate access to the API.
  window['spf'] = spf.bootloader.api_;
}