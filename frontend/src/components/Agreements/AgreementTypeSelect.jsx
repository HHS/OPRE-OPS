import { useNavigate } from "react-router-dom";
import { useGetAgreementTypesQuery } from "../../api/opsAPI";
import { convertCodeForDisplay } from "../../helpers/utils";
import Select from "../UI/Form/Select";

/**
 * A select input for choosing an agreement type.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.selectedAgreementType - The currently selected agreement type.
 * @param {Function} props.onChange - The function to call when the select value changes.
 * @param {Object} [props.rest] - Any additional properties to pass to the Select component.
 * @returns {React.ReactElement} - The rendered component.
 */
export const AgreementTypeSelect = ({ selectedAgreementType, onChange, ...rest }) => {
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

export default AgreementTypeSelect;
