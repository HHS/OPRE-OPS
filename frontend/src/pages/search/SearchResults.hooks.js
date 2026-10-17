import { useEffect, useRef } from "react";
import { createSearchParams, useSearchParams } from "react-router-dom";
import { useSearchAgreementsQuery } from "../../api/opsAPI";
import { MAX_SEARCH_LENGTH } from "../../components/UI/Header/HeaderSearch/HeaderSearch.helpers";
import { ITEMS_PER_PAGE } from "../../constants";

// The API rejects (HTTP 400) a q over MAX_SEARCH_LENGTH or containing NUL, and an offset past PostgreSQL's
// bigint range. The URL is user-editable, so clamp what it can send instead of showing an unrecoverable error.
const MAX_PAGE = 100000;

/**
 * State for the /search?q=&page= results page. The query and page live in the URL so Back,
 * reload and shared links reproduce the results. A blank/missing q sends no request.
 */
const useSearchResults = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const q = (searchParams.get("q") ?? "").replaceAll("\u0000", "").slice(0, MAX_SEARCH_LENGTH).trim();
    const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const currentPage = Number.isInteger(pageParam) && pageParam > 0 && pageParam <= MAX_PAGE ? pageParam : 1;

    const {
        currentData: data,
        isFetching,
        isError,
        refetch
    } = useSearchAgreementsQuery(
        { q, limit: ITEMS_PER_PAGE, offset: (currentPage - 1) * ITEMS_PER_PAGE },
        // The endpoint has no cache tags, so agreement edits never invalidate it: always refetch on mount
        // or when the query/page changes instead of reusing rows cached within keepUnusedDataFor.
        { skip: !q, refetchOnMountOrArgChange: true }
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

    // Move focus to the heading once results load so keyboard / screen-reader users land on them, but
    // only if focus is still on the page content (or nowhere): never pull it out of the header search
    // box or any other control the user has since moved to, e.g. while typing the next query.
    const headingRef = useRef(null);
    useEffect(() => {
        const heading = headingRef.current;
        if (!data || !heading) {
            return;
        }
        const active = document.activeElement;
        const content = heading.closest("main") ?? heading.parentElement;
        if (!active || active === document.body || content?.contains(active)) {
            heading.focus();
        }
    }, [data]);

    // The Try again button unmounts while the retry loads: park focus on the heading so a failed retry
    // doesn't leave keyboard users on <body>.
    const retry = () => {
        headingRef.current?.focus();
        refetch();
    };

    return { q, results, count, totalPages, currentPage, setCurrentPage, isFetching, isError, retry, headingRef };
};

export default useSearchResults;
