import App from "../App";
import RoundedBox from "../components/UI/RoundedBox";
import { DatePicker as CometDatePicker } from "@metrostar/comet-uswds";
import { DatePicker as TSDatePicker } from "@trussworks/react-uswds";

const Home = () => {
    return (
        <App>
            <div className="display-flex flex-justify-center">
                <RoundedBox className="padding-x-2 margin-top-2 display-inline-block text-center">
                    <h1>Date Picker Playground</h1>
                    <p>⚠️ Play with caution</p>
                </RoundedBox>
            </div>
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
        </App>
    );
};

export default Home;
