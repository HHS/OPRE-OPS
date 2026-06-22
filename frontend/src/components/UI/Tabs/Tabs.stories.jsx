import Tabs from "./Tabs";

export default {
    title: "UI/Tabs",
    component: Tabs,
    parameters: {
        docs: {
            description: {
                component:
                    "Navigation-driven tab bar using React Router. The active tab is determined by " +
                    "matching `location.pathname` to the tab's `pathName`. Clicking a tab calls `navigate(pathName)`."
            }
        }
    }
};

const defaultPaths = [
    { label: "Agreement", pathName: "/agreements/1" },
    { label: "Budget Lines", pathName: "/agreements/1/budget-lines" },
    { label: "Research", pathName: "/agreements/1/research" }
];

export const Default = {
    args: {
        paths: defaultPaths
    },
    parameters: {
        reactRouter: { initialEntries: ["/agreements/1"] }
    }
};

export const SecondTabActive = {
    args: {
        paths: defaultPaths
    },
    parameters: {
        reactRouter: { initialEntries: ["/agreements/1/budget-lines"] }
    }
};

export const WithRightContent = {
    args: {
        paths: defaultPaths,
        rightContent: (
            <button
                type="button"
                className="usa-button usa-button--unstyled font-sans-2xs"
            >
                Export CSV
            </button>
        )
    },
    parameters: {
        reactRouter: { initialEntries: ["/agreements/1"] }
    }
};

export const ManyTabs = {
    args: {
        paths: [
            { label: "Overview", pathName: "/project/1/overview" },
            { label: "Agreements", pathName: "/project/1/agreements" },
            { label: "Budget Lines", pathName: "/project/1/budget-lines" },
            { label: "CANs", pathName: "/project/1/cans" },
            { label: "Research", pathName: "/project/1/research" },
            { label: "History", pathName: "/project/1/history" }
        ]
    },
    parameters: {
        reactRouter: { initialEntries: ["/project/1/overview"] }
    }
};
