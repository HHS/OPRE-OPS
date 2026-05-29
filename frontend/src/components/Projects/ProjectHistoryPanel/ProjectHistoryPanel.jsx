import { useState } from "react";
import InfiniteScroll from "../../Agreements/AgreementDetails/InfiniteScroll";
import { getProjectHistoryByIdAndPage } from "../../../api/getProjectHistory";
import LogItem from "../../UI/LogItem";

/**
 * Renders a project's change history with infinite-scroll pagination.
 *
 * @component
 * @param {Object} props
 * @param {number} props.projectId
 * @returns {JSX.Element}
 */
const ProjectHistoryPanel = ({ projectId }) => {
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [stopped, setStopped] = useState(false);
    const [projectHistory, setProjectHistory] = useState([]);

    const fetchMoreData = async () => {
        if (stopped) return;
        setIsLoading(true);
        try {
            const response = await getProjectHistoryByIdAndPage(projectId, page);
            const items = response?.items ?? [];
            const count = response?.count ?? 0;
            const limit = response?.limit ?? 20;
            const offset = response?.offset ?? 0;

            if (items.length > 0) {
                setProjectHistory((prev) => {
                    const existingIds = new Set(prev.map((item) => item.id));
                    const newItems = items.filter((item) => !existingIds.has(item.id));
                    return newItems.length > 0 ? [...prev, ...newItems] : prev;
                });
            }

            if (offset + limit >= count) {
                setStopped(true);
            }
            setPage(page + 1);
        } catch (error) {
            console.error("Error loading project history:", error);
            setStopped(true);
        } finally {
            setIsLoading(false);
        }
    };

    const sortedProjectHistory = [...projectHistory].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <>
            {projectHistory.length > 0 ? (
                <div
                    className="overflow-y-scroll force-show-scrollbars"
                    style={{ height: "15rem" }}
                    data-cy="project-history-container"
                    role="region"
                    aria-live="polite"
                    aria-label="Project History"
                    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                    tabIndex={0}
                >
                    <ul
                        className="usa-list--unstyled"
                        data-cy="project-history-list"
                    >
                        {sortedProjectHistory.map((item) => (
                            <LogItem
                                key={item.id}
                                title={item.history_title}
                                createdOn={item.timestamp}
                                message={item.history_message}
                            />
                        ))}
                    </ul>
                    {!stopped && (
                        <InfiniteScroll
                            fetchMoreData={fetchMoreData}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            ) : (
                <>
                    <p className="font-12px text-base margin-top-1">No History</p>
                    {!stopped && (
                        <InfiniteScroll
                            fetchMoreData={fetchMoreData}
                            isLoading={isLoading}
                        />
                    )}
                </>
            )}
        </>
    );
};

export default ProjectHistoryPanel;
