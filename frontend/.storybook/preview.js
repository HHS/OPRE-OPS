import "../src/uswds/css/styles.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}
