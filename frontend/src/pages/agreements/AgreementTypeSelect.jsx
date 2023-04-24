import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAgreementTypesList, setSelectedAgreementType } from "./createAgreementSlice";
import { getAgreementTypes } from "../../api/getAgreements";

export const AgreementTypeSelect = () => {
    const dispatch = useDispatch();
    const agreementTypes = useSelector((state) => state.createAgreement.agreement_types_list);
    const selectedAgreementType = useSelector((state) => state.createAgreement.agreement.selected_agreement_type);

    // On component load, get AgreementTypes from API, and set returned list in State
    useEffect(() => {
        const getAgreementTypesAndSetState = async () => {
            dispatch(setAgreementTypesList(await getAgreementTypes()));
        };

        getAgreementTypesAndSetState().catch(console.error);

        return () => {
            dispatch(setAgreementTypesList([]));
        };
    }, [dispatch]);

    const onChangeAgreementTypeSelection = (agreementType) => {
        if (agreementType === "0") {
            dispatch(setSelectedAgreementType(null));
            return;
        }

        dispatch(setSelectedAgreementType(agreementType));
    };

    return (
        <>
            <label className="usa-label" htmlFor="options">
                Agreement Type
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="options"
                    id="options"
                    onChange={(e) => onChangeAgreementTypeSelection(e.target.value || 0)}
                    value={selectedAgreementType}
                    required
                >
                    <option value={0}>- Select Agreement Type -</option>
                    {agreementTypes.map((type, index) => (
                        <option key={index + 1} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
};

export default AgreementTypeSelect;
