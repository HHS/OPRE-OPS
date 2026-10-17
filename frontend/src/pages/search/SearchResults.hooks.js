import { useEffect, useRef } from "react";
import { createSearchParams, useSearchParams } from "react-router-dom";
import { useSearchAgreementsQuery } from "../../api/opsAPI";
import { ITEMS_PER_PAGE } from "../../constants";

/**
 * State for the /search?q=&page= results page. The query and page live in the URL so Back,
 * reload and shared links reproduce the results. A blank/missing q sends no request.
 */
const useSearchResults = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const q = (searchParams.get("q") ?? "").trim();
    const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const currentPage = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

    const {
        currentData: data,
        isFetching,
        isError
    } = useSearchAgreementsQuery(
        { q, limit: ITEMS_PER_PAGE, offset: (currentPage - 1) * ITEMS_PER_PAGE },
        { skip: !q }
    );

    // currentData (not data) so rows from a previous query/page never show under the new heading.
    const results = data?.data ?? [];
    const count = data?.count ?? 0;
    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

    const setCurrentPage = (page) => {
        setSearchParams(createSearchParams({ q, page: String(page) }));
    };

    // A page past the end (stale link, shrunken results) would show an empty table: jump to the last page.
    useEffect(() => {
        if (data && count > 0 && currentPage > totalPages) {
            setSearchParams(createSearchParams({ q, page: String(totalPages) }), { replace: true });
        }
    }, [data, count, currentPage, totalPages, q, setSearchParams]);

    // Move focus to the heading once results load so keyboard / screen-reader users land on them.
    const headingRef = useRef(null);
    useEffect(() => {
        if (data) {
            headingRef.current?.focus();
        }
    }, [data]);

    return { q, results, count, totalPages, currentPage, setCurrentPage, isFetching, isError, headingRef };
};

export default useSearchResults;
