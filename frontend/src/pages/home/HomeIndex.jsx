import { isHomepageRedesignEnabled } from "../../helpers/featureFlags";
import BenefitsGrid from "./BenefitsGrid";
import HomeLanding from "./HomeLanding";

/**
 * @component - Index route for the Home layout ("/"). Renders the redesigned landing
 * content when the homepage redesign flag is on, otherwise the legacy benefits grid.
 * Lives at the index route so navigating to child routes (/release-notes, /next) does
 * not also render this content.
 * @returns {React.ReactElement} The homepage index content.
 */
const HomeIndex = () => (isHomepageRedesignEnabled() ? <HomeLanding /> : <BenefitsGrid />);

export default HomeIndex;
