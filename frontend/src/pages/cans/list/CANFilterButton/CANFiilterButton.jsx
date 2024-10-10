import React from "react";
import Modal from "react-modal";
import FilterButton from "../../../../components/UI/FilterButton";
import CANActivePeriodComboBox from "../../../../components/CANs/CANActivePeriodComboBox";
import CANTransferComboBox from "../../../../components/CANs/CANTransferComboBox";
/**
 * @typedef {Object} DataProps
 * @property {number} id - The identifier of the data item
 * @property {string | number} title - The title of the data item
 */

/**
 * A filter for CANs list.
 * @param {Object} props - The component props.
 * @param {DataProps[]} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The CAN filter button.
 */
export const CANFilterButton = ({ filters, setFilters }) => {
    const [activePeriod, setActivePeriod] = React.useState([]);
    const [transfer, setTransfer] = React.useState([]);

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    React.useEffect(() => {
        setActivePeriod(filters.activePeriod);
    }, [filters.activePeriod]);

    React.useEffect(() => {
        setTransfer(filters.transfer);
    }, [filters.transfer]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                activePeriod: activePeriod,
                transfer: transfer
            };
        });
    };
    const resetFilter = () => {
        setFilters({
            activePeriod: [],
            transfer: []
        });
        setActivePeriod([]);
        setTransfer([]);
    };

    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = "usa-legend font-sans-3xs margin-top-0 padding-bottom-1 text-base-dark";

    const fieldsetList = [
        <fieldset
            key="field-1"
            className={fieldStyles}
        >
            <CANActivePeriodComboBox
                activePeriod={activePeriod}
                setActivePeriod={setActivePeriod}
                legendClassname={legendStyles}
            />
        </fieldset>,
        <fieldset
            key="field-2"
            className={fieldStyles}
        >
            <CANTransferComboBox
                transfer={transfer}
                setTransfer={setTransfer}
                legendClassname={legendStyles}
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
