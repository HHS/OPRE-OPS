import ComboBox from "../../UI/Form/ComboBox";

function SpecialTopicComboBox({
    specialPopulations,
    setSpecialPopulations,
    legendClassName = "usa-label margin-top-0"
}) {
    const data = [
        {
            id: 1,
            title: "COVID-19",
            status: " COVID_19"
        },
        {
            id: 2,
            title: "Race Equity",
            status: "RACE_EQUITY"
        },
        {
            id: 3,
            title: "Indigenous/Tribal/Native American populations",
            status: "INDIGENOUS_TRIBAL_NATIVE_AMERICAN_POPULATIONS"
        },
        {
            id: 4,
            title: "Hispanic/Latino populations",
            status: "HISPANIC_LATINO_POPULATIONS"
        },
        {
            id: 5,
            title: "African American populations",
            status: "AFRICAN_AMERICAN_POPULATIONS"
        },
        {
            id: 6,
            title: "LGBTQI+ populations",
            status: "LGBTQ+_POPULATIONS"
        }
    ];
    return (
        <div className="display-flex flex-column width-full">
            <label
                className={legendClassName}
                htmlFor="research-type-combobox-input"
            >
                Special Topic/Population Studied
            </label>
            <p className="usa-hint margin-top-neg-2px margin-bottom-1">Select all that apply</p>
            <ComboBox
                selectedData={specialPopulations}
                setSelectedData={setSpecialPopulations}
                namespace="research-type-combobox"
                data={data}
                defaultString="not implemented yet"
                isMulti={true}
            />
        </div>
    );
}

export default SpecialTopicComboBox;
