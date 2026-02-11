import { useMemo } from "react";
import ComboBox from "../../UI/Form/ComboBox";

/**
 * A comboBox for choosing Contract Number(s).
 * @param {Object} props - The component props.
 * @param {object[]} props.selectedContractNumbers - The currently selected contract numbers.
 * @param {Function} props.setSelectedContractNumbers - A function to call when the selected contract numbers change.
 * @param {Object} props.agreementFilterOptions - The filter options from API containing contract_numbers.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const ContractNumberComboBox = ({
    selectedContractNumbers,
    setSelectedContractNumbers,
    agreementFilterOptions,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = { minWidth: "22.7rem" }
}) => {
    // Transform contract_numbers string array to ComboBox format
    const contractNumberOptions = useMemo(() => {
        if (!agreementFilterOptions?.contract_numbers) return [];

        return agreementFilterOptions.contract_numbers.map((contractNumber) => ({
            id: contractNumber,
            title: contractNumber
        }));
    }, [agreementFilterOptions]);

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="contract-number-combobox-input"
                >
                    Contract #
                </label>
                <div>
                    <ComboBox
                        namespace="contract-number-combobox"
                        data={contractNumberOptions}
                        selectedData={selectedContractNumbers}
                        setSelectedData={setSelectedContractNumbers}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default ContractNumberComboBox;
