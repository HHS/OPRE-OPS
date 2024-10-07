import React from "react";
import Modal from "react-modal";
import FilterButton from "../../../../components/UI/FilterButton";
import CANActivePeriodComboBox from "../../../../components/CANs/CANActivePeriodComboBox";

/**
 * A filter for CANs list.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The CAN filter button.
 */
export const CANFilterButton = ({ filters, setFilters }) => {
    const [activePeriod, setActivePeriod] = React.useState([]);

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    React.useEffect(() => {
        setActivePeriod(filters.activePeriod);
    }, [filters.activePeriod]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                activePeriod: activePeriod
            };
        });
    };

    const resetFilter = () => {
        setFilters({
            activePeriod: []
        });
        setActivePeriod([]);
    };

    const fieldStyles = "usa-fieldset margin-bottom-205";

    const fieldsetList = [
        <fieldset
            key="field-1"
            className={fieldStyles}
        >
            <CANActivePeriodComboBox
                activePeriod={activePeriod}
                setActivePeriod={setActivePeriod}
                overrideStyles={{ width: "187px" }}
            />
        </fieldset>
    ];

    Modal.setAppElement("#root");

    return (
        <FilterButton
            applyFilter={applyFilter}
            resetFilter={resetFilter}
            fieldsetList={fieldsetList}
        />
    );
};

export default CANFilterButton;
