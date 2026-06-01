import { fn } from "storybook/test";
import FilterButton from "./FilterButton";

export default {
    title: "UI/FilterButton",
    component: FilterButton,
    parameters: {
        docs: {
            description: {
                component:
                    "Filter icon button that opens a modal with filter fieldsets. " +
                    "Includes Apply and Reset actions for managing table filters."
            }
        }
    },
    decorators: [
        (Story) => (
            <div id="root">
                <Story />
            </div>
        )
    ],
    args: {
        applyFilter: fn(),
        resetFilter: fn(),
        setShowModal: fn(),
        fieldsetList: [
            <fieldset
                key="status"
                className="usa-fieldset margin-bottom-2"
            >
                <legend className="usa-legend text-bold">Status</legend>
                <div className="usa-checkbox">
                    <input
                        className="usa-checkbox__input"
                        id="filter-draft"
                        type="checkbox"
                        name="status"
                        value="draft"
                    />
                    <label
                        className="usa-checkbox__label"
                        htmlFor="filter-draft"
                    >
                        Draft
                    </label>
                </div>
                <div className="usa-checkbox">
                    <input
                        className="usa-checkbox__input"
                        id="filter-planned"
                        type="checkbox"
                        name="status"
                        value="planned"
                    />
                    <label
                        className="usa-checkbox__label"
                        htmlFor="filter-planned"
                    >
                        Planned
                    </label>
                </div>
            </fieldset>
        ]
    }
};

/** Default closed state — only the filter icon button is visible. */
export const Default = {
    args: {
        showModal: false
    }
};

/** Disabled filter button. */
export const Disabled = {
    args: {
        showModal: false,
        disabled: true
    }
};
