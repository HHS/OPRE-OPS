import cx from "clsx";
// https://designsystem.digital.gov/components/pagination/#using-the-pagination-component-2
/*
General component properties:
1. The component features a maximum of seven slots.
2. Each slot can contain a navigation item or an overflow indicator.
3. The first slot is always the first page of the set.
4. If there are fewer than seven pages in the set, show only that number of slots.
5. The component should always show the first page and current page.
6. Show the next page, previous page, and last page if those pages exist.
7. Display the same number of slots for each page in the set.
 */
export const PaginationNav = ({ currentPage, setCurrentPage, items = [], itemsPerPage = 10 }) => {
    const totalPages = Math.ceil(items.length / itemsPerPage);

    console.log("totalPages", totalPages);

    const pageNumberArray = []; // 7 element array with either a page number or overflow indicator (null)

    if (totalPages < 7) {
        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            pageNumberArray.push(pageNumber);
        }
    } else {
        pageNumberArray.push(1);
        pageNumberArray.push(null);
        pageNumberArray.push(null);
        pageNumberArray.push(null);
        pageNumberArray.push(null);
        pageNumberArray.push(null);
        pageNumberArray.push(totalPages);
    }

    const pageItems = [];

    for (const pagePosition in pageNumberArray) {
        if (pageNumberArray[pagePosition] === null) {
            pageItems.push(
                <li
                    key={`page-item-${pagePosition}`}
                    className="usa-pagination__item usa-pagination__overflow"
                    aria-label="ellipsis indicating non-visible pages"
                >
                    <span>…</span>
                </li>
            );
        } else {
            pageItems.push(
                <li key={`page-item-${pagePosition}`} className="usa-pagination__item usa-pagination__page-no">
                    <a
                        className={cx(
                            "usa-pagination__button",
                            currentPage === pageNumberArray[pagePosition] && "usa-current"
                        )}
                        aria-label={`Page ${pageNumberArray[pagePosition]}`}
                        onClick={() => setCurrentPage(pageNumberArray[pagePosition])}
                    >
                        {pageNumberArray[pagePosition]}
                    </a>
                </li>
            );
        }
    }

    return (
        <nav aria-label="Pagination" className="usa-pagination">
            <ul className="usa-pagination__list">
                {currentPage !== 1 && (
                    <li key="page-item-previous" className="usa-pagination__item usa-pagination__arrow">
                        <a
                            className="usa-pagination__link usa-pagination__previous-page"
                            aria-label="Previous page"
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            <svg className="usa-icon" aria-hidden="true" role="img">
                                <use xlinkHref="/assets/img/sprite.svg#navigate_before"></use>
                            </svg>
                            <span className="usa-pagination__link-text">Previous</span>
                        </a>
                    </li>
                )}
                {pageItems}
                {currentPage !== totalPages && (
                    <li key="page-item-next" className="usa-pagination__item usa-pagination__arrow">
                        <a
                            className="usa-pagination__link usa-pagination__next-page"
                            aria-label="Next page"
                            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                        >
                            <span className="usa-pagination__link-text">Next </span>
                            <svg className="usa-icon" aria-hidden="true" role="img">
                                <use xlinkHref="/assets/img/sprite.svg#navigate_next"></use>
                            </svg>
                        </a>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default PaginationNav;
