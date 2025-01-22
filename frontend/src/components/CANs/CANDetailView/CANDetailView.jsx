import React from "react";
import InfiniteScroll from "../../Agreements/AgreementDetails/InfiniteScroll";
import LogItem from "../../UI/LogItem";
import Tag from "../../UI/Tag";
import Term from "../../UI/Term";
import TermTag from "../../UI/Term/TermTag";
/**
 * @typedef {Object} CANDetailViewProps
 * @property {string} description
 * @property {string} number
 * @property {string} nickname
 * @property {string} portfolioName
 * @property {import("../../Users/UserTypes").SafeUser[]} teamLeaders
 * @property {string} divisionDirectorFullName
 * @property {string} divisionName
 * @property {import("../../CANs/CANTypes").CanHistoryItem[]} canHistoryItems
 */
/**
 * This component needs to wrapped in a <dl> element.
 * @component - Renders a term with a tag.
 * @param {CANDetailViewProps} props - The properties passed to the component.
 * @returns {JSX.Element} - The rendered component.
 */
const CANDetailView = ({
    canHistoryItems = [],
    description,
    number,
    nickname,
    portfolioName,
    teamLeaders,
    divisionDirectorFullName,
    divisionName
}) => {
    const [isLoading, setIsLoading] = React.useState(false);

    return (
        <div className="grid-row font-12px">
            {/* // NOTE: Left Column */}
            <div
                className="grid-col"
                data-cy="details-left-col"
            >
                <dl>
                    <Term
                        name="Description"
                        value={description}
                    />
                </dl>
                <section data-cy="history">
                    <h3 className="text-base-dark margin-top-3 text-normal font-12px">History</h3>
                    <div
                        className="overflow-y-scroll force-show-scrollbars"
                        style={{ height: "15rem" }}
                    >
                        {canHistoryItems.length > 0 ? (
                            <ul
                                className="usa-list--unstyled"
                                data-cy="can-history-list"
                            >
                                {canHistoryItems.map((canHistoryItem) => (
                                    <LogItem
                                        key={canHistoryItem.id}
                                        title={canHistoryItem.history_title}
                                        createdOn={canHistoryItem.timestamp}
                                        message={canHistoryItem.history_message}
                                    />
                                ))}
                                <InfiniteScroll
                                    fetchMoreData={() => {
                                        setIsLoading(true);
                                    }}
                                    isLoading={isLoading}
                                />
                            </ul>
                        ) : (
                            <p>No History</p>
                        )}
                    </div>
                </section>
            </div>
            {/* // NOTE: Right Column */}
            <div
                className="grid-col"
                data-cy="details-right-col"
            >
                <dl>
                    <TermTag
                        term="CAN"
                        description={number}
                    />
                    <TermTag
                        term="Nickname"
                        description={nickname}
                    />
                    <TermTag
                        term="Portfolio"
                        description={portfolioName}
                    />
                    <TermTag
                        term="Division"
                        description={divisionName}
                    />
                </dl>
                <dl>
                    <dt className="margin-0 text-base-dark margin-top-3">Team Leader</dt>
                    {teamLeaders &&
                        teamLeaders.length > 0 &&
                        teamLeaders.map((teamLeader) => (
                            <dd
                                key={teamLeader.id}
                                className="margin-0 margin-top-1 margin-bottom-2"
                            >
                                <Tag
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={teamLeader.full_name}
                                />
                            </dd>
                        ))}
                    <TermTag
                        term="Division Director"
                        description={divisionDirectorFullName}
                    />
                </dl>
            </div>
        </div>
    );
};

export default CANDetailView;
