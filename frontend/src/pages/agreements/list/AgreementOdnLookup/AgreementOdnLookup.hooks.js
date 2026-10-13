import { useEffect, useRef, useState } from "react";
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

// Server-enforced max per request (AgreementRequestSchema validates limit <= 50). An exact-match
// ODN lookup should essentially never exceed this, but if it does, fetch every remaining page so
// "multiple matches" genuinely shows all matches, not just the first page's worth.
const PAGE_LIMIT = 50;

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

    // If the modal is closed (unmounting this component) while a lookup is still in
    // flight, invalidate it so its eventual resolution can't call navigate()/setAlert()
    // or set state on an instance the user has already dismissed — e.g. a user who
    // closed the lookup should never be redirected by a request they walked away from.
    useEffect(() => {
        return () => {
            latestSubmissionRef.current = -1;
        };
    }, []);

    const handleChange = (_name, value) => {
        setInputValue(value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const trimmedValue = inputValue.trim();
        // Drop an exact-duplicate resubmission of the query already in flight (e.g. mashing
        // Find/Enter on an unchanged value) to avoid a wasted request. A *different* value is
        // still allowed to supersede a pending submission immediately — latestSubmissionRef
        // below ensures only the newest result is ever used, so a user correcting a typo
        // doesn't have to wait for the stale request to resolve first.
        if (!trimmedValue || (status === ODN_LOOKUP_STATUS.LOADING && trimmedValue === queriedValue)) {
            return;
        }

        const submissionId = ++latestSubmissionRef.current;
        setQueriedValue(trimmedValue);
        setStatus(ODN_LOOKUP_STATUS.LOADING);

        try {
            const result = await trigger({ filters: { odn: [trimmedValue] }, page: 0, limit: PAGE_LIMIT }).unwrap();
            if (submissionId !== latestSubmissionRef.current) {
                return;
            }

            let agreements = result?.agreements ?? [];
            const count = result?.count ?? 0;

            if (count === 1 && agreements[0]) {
                setStatus(ODN_LOOKUP_STATUS.SINGLE);
                navigate(`/agreements/${agreements[0].id}`);
            } else if (count === 1) {
                // Backend reported exactly one match but returned no row for it (e.g. the
                // agreement was deleted between the count and the page fetch) — treat as no
                // match rather than throwing on agreements[0].id and showing a scary generic
                // error for what's actually "nothing to find."
                setMatches([]);
                setStatus(ODN_LOOKUP_STATUS.NONE);
            } else if (count > 1) {
                if (count > agreements.length) {
                    const totalPages = Math.ceil(count / PAGE_LIMIT);
                    // allSettled rather than all: a transient failure on one later page (an
                    // edge case to begin with — PAGE_LIMIT above explains an ODN matching
                    // >50 agreements should essentially never happen) shouldn't throw away
                    // the matches already fetched from page 0 and any other page that did
                    // succeed.
                    const remainingPageResults = await Promise.allSettled(
                        Array.from({ length: totalPages - 1 }, (_, index) =>
                            trigger({
                                filters: { odn: [trimmedValue] },
                                page: index + 1,
                                limit: PAGE_LIMIT
                            }).unwrap()
                        )
                    );
                    if (submissionId !== latestSubmissionRef.current) {
                        return;
                    }
                    const failedPages = remainingPageResults.filter((page) => page.status === "rejected");
                    if (failedPages.length > 0) {
                        console.error(
                            `Failed to fetch ${failedPages.length} of ${totalPages - 1} additional ODN match page(s)`,
                            failedPages.map((page) => page.reason)
                        );
                    }
                    agreements = agreements.concat(
                        remainingPageResults
                            .filter((page) => page.status === "fulfilled")
                            .flatMap((page) => page.value?.agreements ?? [])
                    );
                }
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
