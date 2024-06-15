import PropTypes from "prop-types";
import Select from "../UI/Select";
import { useGetAgreementTypesQuery } from "../../api/opsAPI";
import { convertCodeForDisplay } from "../../helpers/utils";

/**
 * A select input for choosing an agreement type.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.selectedAgreementType - The currently selected agreement type.
 * @param {Function} props.onChange - The function to call when the select value changes.
 * @param {Object} [props.rest] - Any additional properties to pass to the Select component. optional
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementTypeSelect = ({ selectedAgreementType, onChange, ...rest }) => {
    const {
        data: agreementTypes,
        error: errorAgreementTypes,
        isLoading: isLoadingAgreementTypes
    } = useGetAgreementTypesQuery();

    if (isLoadingAgreementTypes) {
        return <div>Loading...</div>;
    }
    if (errorAgreementTypes) {
        return <div>Oops, an error occurred</div>;
    }

    const agreementTypesOptions = agreementTypes.map((agreementType) => {
        return {
            label: convertCodeForDisplay("agreementType", agreementType),
            value: agreementType
        };
    });

    return (
        <Select
            name="agreement_type"
            label="Agreement Type"
            onChange={onChange}
            value={selectedAgreementType}
            messages={[]}
            defaultOption="-Select Agreement Type-"
            options={agreementTypesOptions}
            {...rest}
        />
    );
};

AgreementTypeSelect.propTypes = {
    selectedAgreementType: PropTypes.string,
    onChange: PropTypes.func,
    rest: PropTypes.object
};

export default AgreementTypeSelect;
