import { fn } from "storybook/test";
import DatePicker from "../DatePicker/DatePicker";
import DateRangePickerWrapper from "./DateRangePickerWrapper";

export default {
    title: "UI/USWDS/DateRangePickerWrapper",
    component: DateRangePickerWrapper,
    parameters: {
        docs: {
            description: {
                component:
                    "Wraps two USWDS DatePicker components to coordinate date range selection. " +
                    "Uses USWDS date-range-picker JavaScript for constraint enforcement. " +
                    "See also: [USWDS Date Range Picker](https://designsystem.digital.gov/components/date-range-picker/)"
            }
        }
    }
};

export const Default = {
    render: () => (
        <DateRangePickerWrapper id="fiscal-year-range">
            <DatePicker
                id="start-date"
                name="start-date"
                label="Start Date"
                onChange={fn()}
            />
            <DatePicker
                id="end-date"
                name="end-date"
                label="End Date"
                onChange={fn()}
            />
        </DateRangePickerWrapper>
    )
};

export const WithConstraints = {
    render: () => (
        <DateRangePickerWrapper
            id="fy2025-range"
            className="margin-top-2"
        >
            <DatePicker
                id="period-start"
                name="period-start"
                label="Period of Performance Start"
                minDate="2024-10-01"
                maxDate="2025-09-30"
                onChange={fn()}
            />
            <DatePicker
                id="period-end"
                name="period-end"
                label="Period of Performance End"
                minDate="2024-10-01"
                maxDate="2025-09-30"
                onChange={fn()}
            />
        </DateRangePickerWrapper>
    )
};
