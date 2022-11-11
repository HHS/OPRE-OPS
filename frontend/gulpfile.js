/* gulpfile.js */

/**
 * Import uswds-compile
 */
const uswds = require("@uswds/compile");

/**
 * USWDS version
 * Set the major version of USWDS you're using
 * (Current options are the numbers 2 or 3)
 */
uswds.settings.version = 3;

/**
 * Path settings
 * Set as many as you need
 */
uswds.paths.dist.css = './src/uswds/css';
uswds.paths.dist.theme = './sass/uswds';
uswds.paths.dist.img = './src/uswds/img';
uswds.paths.dist.fonts = './src/uswds/fonts';
uswds.paths.dist.js = './src/uswds/js';

/**
 * Exports
 * Add as many as you need
 */
exports.init = uswds.init;
exports.compile = uswds.compile;
exports.watch = uswds.watch;
