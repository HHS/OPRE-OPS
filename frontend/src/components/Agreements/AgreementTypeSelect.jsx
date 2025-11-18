import { useNavigate } from "react-router-dom";
import { useGetAgreementTypesQuery } from "../../api/opsAPI";
import { convertCodeForDisplay } from "../../helpers/utils";
import { AGREEMENT_TYPES } from "../ServicesComponents/ServicesComponents.constants";
import Select from "../UI/Form/Select";

/**
 * @component - A select input for choosing an agreement type.
 * @param {Object} props - The component props.
 * @param {string} props.selectedAgreementType - The currently selected agreement type.
 * @param {Function} props.onChange - The function to call when the select value changes.
 * @param {string} props.selectedAgreementFilter - The currently selected agreement filter.
 * @param {Object} [props.rest] - Any additional properties to pass to the Select component.
 * @returns {React.ReactElement} - The rendered component.
 */
export const AgreementTypeSelect = ({ selectedAgreementType, onChange, selectedAgreementFilter, ...rest }) => {
    const navigate = useNavigate();
    const {
        data: agreementTypes,
        error: errorAgreementTypes,
        isLoading: isLoadingAgreementTypes
    } = useGetAgreementTypesQuery({});

    if (isLoadingAgreementTypes) {
        return <div>Loading...</div>;
    }
    if (errorAgreementTypes) {
        navigate("/error");
        return;
    }

    // Filter agreement types based on selectedAgreementFilter
    let filteredAgreementTypes = agreementTypes;
    if (selectedAgreementFilter === AGREEMENT_TYPES.PARTNER) {
        filteredAgreementTypes = agreementTypes.filter(
            (type) => type === AGREEMENT_TYPES.AA || type === AGREEMENT_TYPES.IAA
        );
    }

    const agreementTypesOptions = filteredAgreementTypes.map((agreementType) => {
        return {
            label: convertCodeForDisplay("partnerAgreementTypes", agreementType),
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

export default AgreementTypeSelect;
