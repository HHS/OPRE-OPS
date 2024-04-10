import App from "../App";
import React from "react";
import RoundedBox from "../components/UI/RoundedBox";
import DatePicker from "../components/UI/USWDS/DatePicker";
import { DatePicker as CometDatePicker } from "@metrostar/comet-uswds";
import { DatePicker as TSDatePicker } from "@trussworks/react-uswds";
import "./DatePickerPage.css";

const Home = () => {
    const [date, setDate] = React.useState(null);

    return (
        <App>
            <div className="display-flex flex-justify-center">
                <RoundedBox className="padding-x-2 margin-top-2 display-inline-block text-center">
                    <h1>Date Picker Playground</h1>
                    <p>⚠️ Play with caution</p>
                </RoundedBox>
            </div>
            <DatePicker
                id="vanilla"
                label="Vanilla USWDS"
                name="vanilla"
                hint="mm/dd/yyyy"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                isRequired={true}
                isRequiredNoShow={true}
            />
            <div className="usa-form-group">
                <label
                    className="usa-label"
                    htmlFor="date-picker-1"
                    id="appointment-date-label"
                >
                    Comet Date Picker
                </label>
                <div
                    className="usa-hint"
                    id="appointment-date-hint"
                >
                    mm/dd/yyyy
                </div>
                <CometDatePicker
                    aria-describedby="appointment-date-label appointment-date-hint"
                    id="date-picker-1"
                    name="date-picker-1"
                />
            </div>
            <div className="usa-form-group">
                <label
                    className="usa-label"
                    htmlFor="appointment-date"
                    id="appointment-date-label"
                >
                    TrussWorks Date Picker
                </label>
                <div
                    className="usa-hint"
                    id="appointment-date-hint"
                >
                    mm/dd/yyyy
                </div>
                <TSDatePicker
                    aria-describedby="appointment-date-hint"
                    aria-labelledby="appointment-date-label"
                    id="appointment-date"
                    name="appointment-date"
                />
            </div>
            <div className="usa-form-group">
                <label
                    className="usa-label"
                    htmlFor="html-native"
                    id="html-native-label"
                >
                    HTML Native
                </label>
                <input
                    type="date"
                    name="html-native"
                    id="html-native"
                />
            </div>
        </App>
    );
};

export default Home;
