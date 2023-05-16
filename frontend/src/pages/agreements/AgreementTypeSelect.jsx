import { useGetAgreementTypesQuery } from "../../api/opsAPI";
import { convertCodeForDisplay } from "../../helpers/utils";

export const AgreementTypeSelect = ({ selectedAgreementType, setSelectedAgreementType }) => {
    const {
        data: agreementTypes,
        error: errorAgreementTypes,
        isLoading: isLoadingAgreementTypes,
    } = useGetAgreementTypesQuery();

    if (isLoadingAgreementTypes) {
        return <div>Loading...</div>;
    }
    if (errorAgreementTypes) {
        return <div>Oops, an error occurred</div>;
    }

    const handleChange = (e) => {
        const { value } = e.target;
        setSelectedAgreementType(value);
    };

    return (
        <>
            <label className="usa-label margin-top-205" htmlFor="agreement-type-options">
                Agreement Type
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="agreement-type-options"
                    id="agreement-type-options"
                    onChange={handleChange}
                    value={selectedAgreementType || ""}
                    required
                >
                    <option value={0}>- Select Agreement Type -</option>
                    {agreementTypes.map((type, index) => (
                        <option key={index + 1} value={type}>
                            {convertCodeForDisplay('AgreementType', type)}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
};

export default AgreementTypeSelect;
