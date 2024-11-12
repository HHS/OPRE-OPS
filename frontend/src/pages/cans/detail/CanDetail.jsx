import { useGetDivisionQuery } from "../../../api/opsAPI";
import Tag from "../../../components/UI/Tag";
import Term from "../../../components/UI/Term";
import TermTag from "../../../components/UI/Term/TermTag";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";

/**
    @typedef {import("../../../components/Users/UserTypes").SafeUser} SafeUser
*/

/**
 * @typedef {Object} CanDetailProps
 * @property {string} description
 * @property {string} number
 * @property {string} nickname
 * @property {string} portfolioName
 * @property {SafeUser[]} teamLeaders
 * @property {number} divisionId
 */

/**
 * @component - The CAN detail page.
 * @param {CanDetailProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanDetail = ({ description, number, nickname, portfolioName, teamLeaders, divisionId }) => {
    const { data: division, isSuccess } = useGetDivisionQuery(divisionId);
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
                            value={description}
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
        </article>
    );
};

export default CanDetail;
