import { useGetAgreementReasonsQuery } from "../../api/opsAPI";
import { useDispatch } from "react-redux";

export const AgreementReasonSelect = ({
    selectedAgreementReason,
    setSelectedAgreementReason,
    setAgreementIncumbent,
}) => {
    const dispatch = useDispatch();

    const {
        data: agreementReasons,
        error: errorAgreementReasons,
        isLoading: isLoadingAgreementReasons,
    } = useGetAgreementReasonsQuery();

    if (isLoadingAgreementReasons) {
        return <div>Loading...</div>;
    }
    if (errorAgreementReasons) {
        return <div>Oops, an error occurred</div>;
    }

    const handleChange = (e) => {
        const { value } = e.target;

        if (value === "NEW_REQ") {
            dispatch(setAgreementIncumbent(null));
        }

        setSelectedAgreementReason(value);
    };

    return (
        <fieldset className="usa-fieldset">
            <label className="usa-label margin-top-0" htmlFor="reason-for-agreement-select">
                Reason for Agreement
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="reason-for-agreement-select"
                    id="reason-for-agreement-select"
                    onChange={handleChange}
                    value={selectedAgreementReason || ""}
                    required
                >
                    <option value={0}>- Select Agreement Reason -</option>
                    {agreementReasons.map((reason, index) => (
                        <option key={index + 1} value={reason}>
                            {reason}
                        </option>
                    ))}
                </select>
            </div>
        </fieldset>
    );
};

export default AgreementReasonSelect;
