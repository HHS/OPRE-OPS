const uswds = require("@uswds/compile");

/**
 * USWDS version
 * Set the version of USWDS you're using (2 or 3)
 */

uswds.settings.version = 3;

/**
 * Path settings
 * Set as many as you need
 */

uswds.paths.dist.js = "./src/uswds/js/";
uswds.paths.dist.css = "./src/uswds/css/";
uswds.paths.dist.sass = "./src/uswds/sass/";
uswds.paths.dist.fonts = "./src/uswds/fonts/";
uswds.paths.dist.theme = "./src/uswds/theme/";
uswds.paths.dist.img = "./src/uswds/img/";

/**
 * Exports
 * Add as many as you need
 */

exports.init = uswds.init;
exports.compile = uswds.compile;
