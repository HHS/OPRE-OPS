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
    argTypes: {
        tag1Filter: {
            control: "text",
            description: "Tag 1 filter key (leave empty to omit)",
            table: { category: "Tag 1" }
        },
        tag1Text: { control: "text", description: "Tag 1 display text", table: { category: "Tag 1" } },
        tag2Filter: {
            control: "text",
            description: "Tag 2 filter key (leave empty to omit)",
            table: { category: "Tag 2" }
        },
        tag2Text: { control: "text", description: "Tag 2 display text", table: { category: "Tag 2" } },
        tag3Filter: {
            control: "text",
            description: "Tag 3 filter key (leave empty to omit)",
            table: { category: "Tag 3" }
        },
        tag3Text: { control: "text", description: "Tag 3 display text", table: { category: "Tag 3" } }
    },
    args: {
        removeFilter: fn()
    },
    render: ({ tag1Filter, tag1Text, tag2Filter, tag2Text, tag3Filter, tag3Text, removeFilter }) => {
        const tagsList = [
            tag1Filter && { filter: tag1Filter, tagText: tag1Text },
            tag2Filter && { filter: tag2Filter, tagText: tag2Text },
            tag3Filter && { filter: tag3Filter, tagText: tag3Text }
        ].filter(Boolean);
        return (
            <FilterTags
                tagsList={tagsList}
                removeFilter={removeFilter}
            />
        );
    }
};

/** Single active filter tag. */
export const SingleTag = {
    args: {
        tag1Filter: "status",
        tag1Text: "Draft",
        tag2Filter: "",
        tag2Text: "",
        tag3Filter: "",
        tag3Text: ""
    }
};

/** Multiple active filter tags. */
export const MultipleTags = {
    args: {
        tag1Filter: "status",
        tag1Text: "Draft",
        tag2Filter: "type",
        tag2Text: "Contract",
        tag3Filter: "fy",
        tag3Text: "FY 2025"
    }
};

/** No active filters — renders nothing. */
export const Empty = {
    args: {
        tag1Filter: "",
        tag1Text: "",
        tag2Filter: "",
        tag2Text: "",
        tag3Filter: "",
        tag3Text: ""
    }
};
