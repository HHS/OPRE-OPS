import { fn } from "storybook/test";
import DatePicker from "./DatePicker";

export default {
    title: "UI/USWDS/DatePicker",
    component: DatePicker,
    parameters: {
        docs: {
            description: {
                component:
                    "Wraps the USWDS date picker with OPS-specific behavior: error messages, required indicators, " +
                    "disabled state, and min/max date constraints. " +
                    "See also: [USWDS Date Picker](https://designsystem.digital.gov/components/date-picker/)"
            },
            story: {
                inline: false,
                height: "500px"
            }
        }
    },
    argTypes: {
        id: { control: "text" },
        name: { control: "text" },
        label: { control: "text" },
        hint: { control: "text" },
        messages: { control: "object" },
        isRequired: { control: "boolean" },
        isDisabled: { control: "boolean" },
        pending: { control: "boolean" }
    }
};

export const Default = {
    args: {
        id: "award-date",
        name: "award-date",
        label: "Award Date",
        onChange: fn()
    }
};

export const WithMinMaxDates = {
    args: {
        id: "obligation-date",
        name: "obligation-date",
        label: "Obligation Date",
        hint: "Must be within the current fiscal year",
        minDate: "2025-10-01",
        maxDate: "2026-09-30",
        onChange: fn()
    }
};

export const Required = {
    args: {
        id: "start-date",
        name: "start-date",
        label: "Start Date",
        isRequired: true,
        onChange: fn()
    }
};

export const WithErrors = {
    args: {
        id: "end-date",
        name: "end-date",
        label: "End Date",
        messages: ["End date must be after start date"],
        onChange: fn()
    }
};

export const Disabled = {
    args: {
        id: "locked-date",
        name: "locked-date",
        label: "Locked Date",
        value: "2025-06-15",
        isDisabled: true,
        onChange: fn()
    }
};
