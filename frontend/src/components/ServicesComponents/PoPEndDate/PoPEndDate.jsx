import DayInput from "../../UI/Form/DesiredAwardDate/DayInput";
import MonthSelect from "../../UI/Form/DesiredAwardDate/MonthSelect";
import YearInput from "../../UI/Form/DesiredAwardDate/YearInput";

function PoPEndDate({ serviceComponent, setServiceComponent }) {
    return (
        <fieldset className="usa-fieldset display-flex">
            <legend className={`usa-legend margin-top-0 }`}>Period of Performance-End</legend>
            <MonthSelect
                name="popEndMonth"
                label="Month"
                value={serviceComponent?.popEndMonth || 0}
                onChange={(name, value) => {
                    setServiceComponent({
                        ...serviceComponent,
                        popEndMonth: value
                    });
                }}
            />
            <DayInput
                name="popEndDay"
                label="Day"
                value={serviceComponent?.popEndDay || ""}
                onChange={(name, value) => {
                    setServiceComponent({
                        ...serviceComponent,
                        popEndDay: value
                    });
                }}
            />
            <YearInput
                name="popEndYear"
                label="Year"
                value={serviceComponent?.popEndYear || ""}
                onChange={(name, value) => {
                    setServiceComponent({
                        ...serviceComponent,
                        popEndYear: value
                    });
                }}
            />
        </fieldset>
    );
}

export default PoPEndDate;
