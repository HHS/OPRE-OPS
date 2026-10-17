import { Link } from "react-router-dom";
import App from "../../App";
import HighlightedText from "../../components/UI/Header/HeaderSearch/HighlightedText";
import { getMatchedField } from "../../components/UI/Header/HeaderSearch/HeaderSearch.helpers";
import PaginationNav from "../../components/UI/PaginationNav/PaginationNav";
import Table from "../../components/UI/Table";
import { convertCodeForDisplay } from "../../helpers/utils";
import useSearchResults from "./SearchResults.hooks";

const TABLE_HEADINGS = [
    { heading: "Agreement", value: "" },
    { heading: "Type", value: "" },
    { heading: "Matched on", value: "" }
];

/**
 * Full results for the header agreement search: every agreement whose ODN, title or nickname
 * contains the query. Each agreement links to its details page.
 * @component
 * @returns {React.ReactElement} The rendered page.
 */
const SearchResults = () => {
    const { q, results, count, totalPages, currentPage, setCurrentPage, isFetching, isError, headingRef } =
        useSearchResults();

    let body;
    if (!q) {
        body = <p data-cy="search-results-prompt">Enter an ODN, agreement title, or nickname to search.</p>;
    } else if (isError) {
        body = (
            <p
                role="alert"
                data-cy="search-results-error"
            >
                There was an error searching for agreements. Please try again.
            </p>
        );
    } else if (isFetching && results.length === 0) {
        body = (
            <p
                role="status"
                data-cy="search-results-loading"
            >
                Searching…
            </p>
        );
    } else if (count === 0) {
        body = (
            <p
                role="status"
                data-cy="search-results-empty"
            >
                No agreements match &quot;{q}&quot;. Try an ODN, agreement title, or nickname.
            </p>
        );
    } else {
        body = (
            <>
                <p
                    role="status"
                    className="margin-top-0"
                    data-cy="search-results-count"
                >
                    {count} {count === 1 ? "agreement" : "agreements"} matching &quot;{q}&quot;
                </p>
                <Table
                    tableHeadings={TABLE_HEADINGS}
                    sortable={false}
                >
                    {results.map((agreement) => {
                        const matched = getMatchedField(agreement, q);
                        return (
                            <tr
                                key={agreement.id}
                                data-cy="search-result-row"
                            >
                                <td>
                                    <Link
                                        to={`/agreements/${agreement.id}`}
                                        className="text-primary"
                                    >
                                        {agreement.name}
                                    </Link>
                                </td>
                                <td>{convertCodeForDisplay("agreementType", agreement.agreement_type)}</td>
                                <td>
                                    {matched.label}:{" "}
                                    <HighlightedText
                                        text={matched.value}
                                        query={q}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </Table>
                {totalPages > 1 && (
                    <div className="margin-top-3">
                        <PaginationNav
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            totalPages={totalPages}
                        />
                    </div>
                )}
            </>
        );
    }

    return (
        <App breadCrumbName="Search">
            <h1
                ref={headingRef}
                tabIndex={-1}
                style={{ outline: "none" }}
                className="margin-0 margin-bottom-205 text-brand-primary font-sans-2xl"
            >
                Search results
            </h1>
            {body}
        </App>
    );
};

export default SearchResults;
