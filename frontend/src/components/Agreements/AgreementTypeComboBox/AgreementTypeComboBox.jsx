import { convertCodeForDisplay } from "../../../helpers/utils";
import ComboBox from "../../UI/Form/ComboBox";
import { AgreementType } from "../../../pages/agreements/agreements.constants";

/**
 * A comboBox for choosing Agreement Type(s).
 * @param {Object} props - The component props.
 * @param {object[]} props.selectedAgreementTypes - The currently selected agreement types.
 * @param {Function} props.setSelectedAgreementTypes - A function to call when the selected agreement types change.
 * @param {string[]} props.agreementTypeOptions - An array of agreement type options.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementTypeComboBox = ({
    selectedAgreementTypes,
    setSelectedAgreementTypes,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    agreementTypeOptions = Object.values(AgreementType)
}) => {
    const typeOptions = agreementTypeOptions.map((type, index) => {
        const typeOption = {
            id: index + 1,
            title: convertCodeForDisplay("agreementType", type),
            type: type
        };
        return typeOption;
    });

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="agreement-type-combobox-input"
                >
                    Agreement Type
                </label>
                <div>
                    <ComboBox
                        namespace="agreement-type-combobox"
                        data={typeOptions}
                        selectedData={selectedAgreementTypes}
                        setSelectedData={setSelectedAgreementTypes}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default AgreementTypeComboBox;
