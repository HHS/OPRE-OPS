import DayInput from "../../UI/Form/DesiredAwardDate/DayInput";
import MonthSelect from "../../UI/Form/DesiredAwardDate/MonthSelect";
import YearInput from "../../UI/Form/DesiredAwardDate/YearInput";

function PoPStartDate({ serviceComponent, setServiceComponent }) {
    return (
        <fieldset className="usa-fieldset display-flex">
            <legend className={`usa-legend margin-top-0 }`}>Period of Performance-Start</legend>
            <MonthSelect
                name="popStartMonth"
                label="Month"
                value={serviceComponent?.popStartMonth || 0}
                onChange={(name, value) => {
                    setServiceComponent({
                        ...serviceComponent,
                        popStartMonth: value
                    });
                }}
            />
            <DayInput
                name="popStartDay"
                label="Day"
                value={serviceComponent?.popStartDay || ""}
                onChange={(name, value) => {
                    setServiceComponent({
                        ...serviceComponent,
                        popStartDay: value
                    });
                }}
            />
            <YearInput
                name="popStartYear"
                label="Year"
                value={serviceComponent?.popStartYear || ""}
                onChange={(name, value) => {
                    setServiceComponent({
                        ...serviceComponent,
                        popStartYear: value
                    });
                }}
            />
        </fieldset>
    );
}

export default PoPStartDate;
