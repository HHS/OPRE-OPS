import { useState, useEffect } from "react";
import { useLazyGetAgreementsQuery } from "../api/opsAPI";

/**
 * Custom hook to fetch ALL agreements by making multiple paginated requests using RTK Query
 * @param {Object} params - Optional query parameters
 * @param {Object} params.filters - Filter parameters
 * @param {boolean} params.onlyMy - Only fetch user's agreements
 * @param {string} params.sortConditions - Sort conditions
 * @param {boolean} params.sortDescending - Sort direction
 * @returns {{ agreements: Array, isLoading: boolean, isError: boolean, error: any }}
 */
export const useGetAllAgreements = (params = {}) => {
    const [allAgreements, setAllAgreements] = useState([]);
    const [isLoadingAll, setIsLoadingAll] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorObj, setErrorObj] = useState(null);

    // Lazy query trigger for fetching all pages
    const [getAgreementsTrigger] = useLazyGetAgreementsQuery();

    useEffect(() => {
        let cancelled = false;

        const fetchAllPages = async () => {
            try {
                const limit = 50;

                const firstPageResponse = await getAgreementsTrigger({
                    filters: params.filters || {},
                    onlyMy: params.onlyMy || false,
                    sortConditions: params.sortConditions || "",
                    sortDescending: params.sortDescending || false,
                    page: 0,
                    limit
                }).unwrap();

                if (cancelled) return;

                const { agreements: firstPageAgreements, count } = firstPageResponse;
                const totalPages = Math.ceil(count / limit);

                if (totalPages <= 1) {
                    if (!cancelled) {
                        setAllAgreements(firstPageAgreements);
                        setIsLoadingAll(false);
                    }
                    return;
                }

                const fetchPromises = [];
                for (let page = 1; page < totalPages; page++) {
                    fetchPromises.push(
                        getAgreementsTrigger({
                            filters: params.filters || {},
                            onlyMy: params.onlyMy || false,
                            sortConditions: params.sortConditions || "",
                            sortDescending: params.sortDescending || false,
                            page,
                            limit
                        }).unwrap()
                    );
                }

                const allResponses = await Promise.all(fetchPromises);

                if (!cancelled) {
                    const allRemainingAgreements = allResponses.flatMap((response) => response?.agreements || []);
                    const combinedAgreements = [...firstPageAgreements, ...allRemainingAgreements];
                    setAllAgreements(combinedAgreements);
                    setIsLoadingAll(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setHasError(true);
                    setErrorObj(err);
                    setIsLoadingAll(false);
                }
            }
        };

        fetchAllPages();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAgreementsTrigger, JSON.stringify(params.filters), params.onlyMy, params.sortConditions, params.sortDescending]);

    return {
        agreements: allAgreements,
        isLoading: isLoadingAll,
        isError: hasError,
        error: errorObj
    };
};
