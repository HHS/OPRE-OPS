import Tag from "../../UI/Tag";
import Term from "../../UI/Term";
import TermTag from "../../UI/Term/TermTag";
import CanHistoryPanel from "../CANHistoryPanel";
/**
 * @typedef {Object} CANDetailViewProps
 * @property {string} description
 * @property {string} number
 * @property {string} nickname
 * @property {string} portfolioName
 * @property {import("../../Users/UserTypes").SafeUser[]} teamLeaders
 * @property {string} divisionDirectorFullName
 * @property {string} divisionName
 * @property {number} canId
 * @property {number} fiscalYear
 */
/**
 * This component needs to wrapped in a <dl> element.
 * @component - Renders a term with a tag.
 * @param {CANDetailViewProps} props - The properties passed to the component.
 * @returns {JSX.Element} - The rendered component.
 */
const CANDetailView = ({
    canId,
    description,
    fiscalYear,
    number,
    nickname,
    portfolioName,
    teamLeaders,
    divisionDirectorFullName,
    divisionName
}) => {
    return (
        <div
            className="grid-row font-12px"
            style={{ columnGap: "82px" }}
        >
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
                    <CanHistoryPanel canId={canId} fiscalYear={fiscalYear} />
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
