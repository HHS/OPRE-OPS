import { useGetDivisionQuery } from "../../../api/opsAPI";
import Tag from "../../../components/UI/Tag";
import Term from "../../../components/UI/Term";
import TermTag from "../../../components/UI/Term/TermTag";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";

/**
    @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
*/

/**
 * @typedef {Object} CanDetailProps
 * @property {CAN} can
 */

/**
 * @component - The CAN detail page.
 * @param {CanDetailProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanDetail = ({ can }) => {
    const canDivisionId = can.portfolio.division_id;
    const { data: division, isSuccess } = useGetDivisionQuery(canDivisionId);
    const divisionDirectorFullName = useGetUserFullNameFromId(isSuccess ? division.division_director_id : null);

    return (
        <article>
            <h2>CAN Details</h2>
            <div className="grid-row font-12px">
                {/* // NOTE: Left Column */}
                <div
                    className="grid-col"
                    data-cy="details-left-col"
                >
                    <dl>
                        <Term
                            name="Description"
                            value={can?.description || "TBD"}
                        />
                    </dl>
                    <section data-cy="history">
                        <h3 className="text-base-dark margin-top-3 text-normal font-12px">History</h3>
                        <p>Not yet implemented</p>
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
                            description={can.number}
                        />
                        <TermTag
                            term="Nickname"
                            description={can.nick_name}
                        />
                        <TermTag
                            term="Portfolio"
                            description={can.portfolio?.name}
                        />
                    </dl>
                    <dl>
                        <dt className="margin-0 text-base-dark margin-top-3">Team Leaders</dt>
                        {can.portfolio?.team_leaders &&
                            can.portfolio?.team_leaders.length > 0 &&
                            can.portfolio.team_leaders.map((teamLeader) => (
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
        </article>
    );
};

export default CanDetail;
