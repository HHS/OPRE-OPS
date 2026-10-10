import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLazyGetAgreementsQuery } from "../../../../api/opsAPI";
import useAlert from "../../../../hooks/use-alert.hooks";

export const ODN_LOOKUP_STATUS = {
    IDLE: "idle",
    LOADING: "loading",
    SINGLE: "single",
    MULTIPLE: "multiple",
    NONE: "none"
};

/**
 * Encapsulates the odn (order/document number) lookup state machine: idle -> loading ->
 * single (navigates away) | multiple (shows matches) | none (shows no-match message).
 */
const useAgreementOdnLookup = () => {
    const navigate = useNavigate();
    const { setAlert } = useAlert();
    const [trigger] = useLazyGetAgreementsQuery();
    const [inputValue, setInputValue] = useState("");
    const [queriedValue, setQueriedValue] = useState("");
    const [status, setStatus] = useState(ODN_LOOKUP_STATUS.IDLE);
    const [matches, setMatches] = useState([]);
    // Guards against a slower, earlier submission resolving after a later one and
    // overwriting its result (e.g. user corrects a typo and resubmits before the
    // first lookup responds).
    const latestSubmissionRef = useRef(0);

    const handleChange = (_name, value) => {
        setInputValue(value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const trimmedValue = inputValue.trim();
        if (!trimmedValue) {
            return;
        }

        const submissionId = ++latestSubmissionRef.current;
        setQueriedValue(trimmedValue);
        setStatus(ODN_LOOKUP_STATUS.LOADING);

        try {
            const result = await trigger({ filters: { odn: [trimmedValue] }, page: 0, limit: 50 }).unwrap();
            if (submissionId !== latestSubmissionRef.current) {
                return;
            }

            const agreements = result?.agreements ?? [];
            const count = result?.count ?? 0;

            if (count === 1) {
                setStatus(ODN_LOOKUP_STATUS.SINGLE);
                navigate(`/agreements/${agreements[0].id}`);
            } else if (count > 1) {
                setMatches(agreements);
                setStatus(ODN_LOOKUP_STATUS.MULTIPLE);
            } else {
                setMatches([]);
                setStatus(ODN_LOOKUP_STATUS.NONE);
            }
        } catch (error) {
            if (submissionId !== latestSubmissionRef.current) {
                return;
            }
            console.error("Failed to look up agreement by ODN", error);
            setStatus(ODN_LOOKUP_STATUS.IDLE);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error looking up the agreement. Please try again."
            });
        }
    };

    return {
        inputValue,
        queriedValue,
        status,
        matches,
        handleChange,
        handleSubmit
    };
};

export default useAgreementOdnLookup;
