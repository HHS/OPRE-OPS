import ComboBox from "../../UI/Form/ComboBox";

const CANActivePeriodComboBox = ({
    activePeriod,
    setActivePeriod,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {}
}) => {
    const periods = [
        { id: 1, title: "1 Year" },
        { id: 2, title: "2 Year" },
        { id: 3, title: "3 Year" },
        { id: 4, title: "4 Year" },
        { id: 5, title: "5 Year" }
    ];

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="can-active-period-combobox-input"
                >
                    Fiscal Year
                </label>
                <div>
                    <ComboBox
                        namespace="can-active-period-combobox"
                        data={periods}
                        selectedData={activePeriod}
                        setSelectedData={setActivePeriod}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default CANActivePeriodComboBox;
