import App from "../App";
import DateRangePickerWrapper from "../components/UI/USWDS/DateRangePickerWrapper";
import DatePicker from "../components/UI/USWDS/DatePicker";

const DateRangePickerPage = () => {
    return (
        <App>
            <div className="display-flex flex-justify-center">
                <DateRangePickerWrapper id="date-range-picker">
                    <DatePicker
                        id="event-date-start"
                        name="event-date-start"
                        label="Event start date"
                        aria-describedby="event-date-start-label event-date-start-hint"
                    />

                    <DatePicker
                        id="event-date-end"
                        name="event-date-end"
                        label="Event end date"
                        aria-describedby="event-date-end-label event-date-end-hint"
                    />
                </DateRangePickerWrapper>
            </div>
        </App>
    );
};

export default DateRangePickerPage;
