import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../src/store";

// Global styles — match the import order in src/index.jsx
import "../src/uswds/css/styles.css";
import "../src/index.css";

/**
 * Global decorator: wraps every story with a Redux Provider backed by a
 * freshly-created store. Individual stories can supply `parameters.store`
 * with a `preloadedState` object to seed specific slice data.
 *
 * @param {Function} Story - The story component
 * @param {Object} context - Storybook story context
 * @returns {JSX.Element}
 */
const withReduxProvider = (Story, context) => {
    const preloadedState = context.parameters?.store?.preloadedState ?? {};
    const store = setupStore(preloadedState);
    return (
        <Provider store={store}>
            <Story />
        </Provider>
    );
};

/**
 * Global decorator: wraps every story with MemoryRouter so components that
 * use useNavigate / Link / useLocation work without a full browser router.
 * Individual stories that need a specific initial route can set
 * `parameters.reactRouter.initialEntries`.
 *
 * @param {Function} Story - The story component
 * @param {Object} context - Storybook story context
 * @returns {JSX.Element}
 */
const withRouter = (Story, context) => {
    const initialEntries = context.parameters?.reactRouter?.initialEntries ?? ["/"];
    return (
        <MemoryRouter initialEntries={initialEntries}>
            <Story />
        </MemoryRouter>
    );
};

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
    tags: ["autodocs"],
    decorators: [withReduxProvider, withRouter],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        },
        a11y: {
            // 'todo'  – surface a11y violations in the Storybook UI panel only
            // 'error' – fail CI on violations (tighten this in Phase 5)
            // 'off'   – skip entirely
            test: "todo"
        }
    }
};

export default preview;
