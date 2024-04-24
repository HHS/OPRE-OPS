import React from "react";
import App from "../App";
import DateRangePickerWrapper from "../components/UI/USWDS/DateRangePickerWrapper";
import DatePicker from "../components/UI/USWDS/DatePicker";

const DateRangePickerPage = () => {
    const [startDate, setStartDate] = React.useState(null);
    const [endDate, setEndDate] = React.useState(null);

    return (
        <App>
            <div className="display-flex flex-justify-center">
                <DateRangePickerWrapper id="date-range-picker">
                    <DatePicker
                        id="event-date-start"
                        name="event-date-start"
                        label="Event start date"
                        aria-describedby="event-date-start-label event-date-start-hint"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                    />

                    <DatePicker
                        id="event-date-end"
                        name="event-date-end"
                        label="Event end date"
                        aria-describedby="event-date-end-label event-date-end-hint"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                    />
                </DateRangePickerWrapper>
            </div>
        </App>
    );
};

export default DateRangePickerPage;
