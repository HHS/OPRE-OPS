/* gulpfile.js */

/**
 * Import uswds-compile
 */
import { settings, paths, init, compile, watch } from "@uswds/compile";

/**
 * USWDS version
 * Set the major version of USWDS you're using
 * (Current options are the numbers 2 or 3)
 */
settings.version = 3;

/**
 * Path settings
 * Set as many as you need
 */
paths.dist.css = "./src/uswds/css";
paths.dist.theme = "./sass/uswds";
paths.dist.img = "./src/uswds/img";
paths.dist.fonts = "./src/uswds/fonts";
paths.dist.js = "./src/uswds/js";

export { init, compile, watch };
