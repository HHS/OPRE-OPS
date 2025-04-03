import cx from "clsx";
import { useEffect, useState } from "react";
import styles from "./PaginationNav.module.scss";

/**
 * The PaginationNav component provides pagination for a table
 * ref: https://designsystem.digital.gov/components/pagination/
 * @param {object} props - The component props.
 * @param {number} [props.currentPage] - The current page number.
 * @param {Function} [props.setCurrentPage] - A function to call to set the current page.
 * @param {object[]} [props.items] - An array of objects to paginate over.
 * @param {number} [props.itemsPerPage] - The number of items to show per page.
 * @param {number} [props.totalPages] - The number of items to show per page.
 * @returns {React.JSX.Element} - The rendered component.
 * General component properties:
 * 1. The component features a maximum of seven slots.
 * 2. Each slot can contain a navigation item or an overflow indicator.
 * 3. The first slot is always the first page of the set.
 * 4. If there are fewer than seven pages in the set, show only that number of slots.
 * 5. The component should always show the first page and current page.
 * 6. Show the next page, previous page, and last page if those pages exist.
 * 7. Display the same number of slots for each page in the set.
 **/
export const PaginationNav = ({ currentPage, setCurrentPage, items = [], itemsPerPage = 10, totalPages }) => {
    const [pageNumberArray, setPageNumberArray] = useState([]); // 7 element array with either a page number or overflow indicator (null)
    totalPages = totalPages? totalPages : Math.ceil(items.length / itemsPerPage);
    useEffect(() => {
        setCurrentPage(1);
    }, [items, setCurrentPage]);

    useEffect(() => {
        const tmpPageNumberArray = [];
        if (totalPages < 7) {
            for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
                tmpPageNumberArray.push(pageNumber);
            }
        } else {
            tmpPageNumberArray.push(1);
            if (currentPage <= 5) {
                for (let pageNumber = 2; pageNumber <= 5; pageNumber++) {
                    tmpPageNumberArray.push(pageNumber);
                }
                tmpPageNumberArray.push(null);
            } else if (currentPage >= totalPages - 4) {
                tmpPageNumberArray.push(null);
                for (let pageNumber = totalPages - 4; pageNumber < totalPages; pageNumber++) {
                    tmpPageNumberArray.push(pageNumber);
                }
            } else {
                tmpPageNumberArray.push(null);
                for (let pageNumber = currentPage - 1; pageNumber <= currentPage + 1; pageNumber++) {
                    tmpPageNumberArray.push(pageNumber);
                }
                tmpPageNumberArray.push(null);
            }

            tmpPageNumberArray.push(totalPages);
        }
        setPageNumberArray(tmpPageNumberArray);
    }, [currentPage, totalPages]);

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
                <li
                    key={`page-item-${pagePosition}`}
                    className="usa-pagination__item usa-pagination__page-no cursor-pointer"
                >
                    <button
                        className={cx(
                            "usa-pagination__button",
                            currentPage === pageNumberArray[pagePosition] && "usa-current"
                        )}
                        aria-label={`Page ${pageNumberArray[pagePosition]}`}
                        onClick={() => setCurrentPage(pageNumberArray[pagePosition])}
                    >
                        {pageNumberArray[pagePosition]}
                    </button>
                </li>
            );
        }
    }

    return (
        <nav
            aria-label="Pagination"
            className="usa-pagination"
        >
            <ul className="usa-pagination__list">
                <li
                    key="page-item-previous"
                    className={cx(
                        "usa-pagination__item usa-pagination__arrow cursor-pointer",
                        currentPage === 1 && styles.hideElement
                    )}
                >
                    <button
                        className="usa-pagination__link usa-pagination__previous-page"
                        aria-label="Previous page"
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        <svg
                            className="usa-icon"
                            aria-hidden="true"
                            role="img"
                        >
                            <use xlinkHref="/assets/img/sprite.svg#navigate_before"></use>
                        </svg>
                        <span className="usa-pagination__link-text">Previous</span>
                    </button>
                </li>
                {pageItems}
                <li
                    key="page-item-next"
                    className="usa-pagination__item usa-pagination__arrow cursor-pointer"
                >
                    <button
                        className={cx(
                            "usa-pagination__link usa-pagination__next-page",
                            (currentPage === totalPages || totalPages === 0) && styles.hideElement
                        )}
                        aria-label="Next page"
                        onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                    >
                        <span className="usa-pagination__link-text">Next </span>
                        <svg
                            className="usa-icon"
                            aria-hidden="true"
                            role="img"
                        >
                            <use xlinkHref="/assets/img/sprite.svg#navigate_next"></use>
                        </svg>
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default PaginationNav;
