import App from "../App";
import DateRangePicker from "../components/UI/USWDS/DateRangePicker";
import DatePicker from "../components/UI/USWDS/DatePicker";

const DateRangePickerPage = () => {
    return (
        <App>
            <div className="display-flex flex-justify-center">
                <DateRangePicker id="date-range-picker">
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
                </DateRangePicker>
            </div>
        </App>
    );
};

export default DateRangePickerPage;
