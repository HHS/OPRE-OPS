import { fn } from "storybook/test";
import FilterTags from "./FilterTags";

export default {
    title: "UI/FilterTags",
    component: FilterTags,
    parameters: {
        docs: {
            description: {
                component:
                    "Removable filter pills showing active filters. Each tag has an X button that calls removeFilter."
            }
        }
    },
    args: {
        removeFilter: fn()
    }
};

/** Single active filter tag. */
export const SingleTag = {
    args: {
        tagsList: [{ filter: "status", tagText: "Draft" }]
    }
};

/** Multiple active filter tags. */
export const MultipleTags = {
    args: {
        tagsList: [
            { filter: "status", tagText: "Draft" },
            { filter: "type", tagText: "Contract" },
            { filter: "fy", tagText: "FY 2025" }
        ]
    }
};

/** No active filters — renders nothing. */
export const Empty = {
    args: {
        tagsList: []
    }
};
