import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGetDivisionQuery } from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import CANDetailView from "../../../components/CANs/CANDetailView";
import CANDetailForm from "../../../components/CANs/CANDetailForm";
import React from "react";

/**
    @typedef {import("../../../components/Users/UserTypes").SafeUser} SafeUser
*/

/**
 * @typedef {Object} CanDetailProps
 * @property {number} canId
 * @property {string} description
 * @property {string} number
 * @property {string} nickname
 * @property {string} portfolioName
 * @property {number} portfolioId
 * @property {SafeUser[]} teamLeaders
 * @property {number} divisionId
 * @property {number} fiscalYear
 * @property {boolean} isBudgetTeamMember
 */

/**
 * @component - The CAN detail page.
 * @param {CanDetailProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanDetail = ({
    canId,
    description,
    number,
    nickname,
    portfolioName,
    portfolioId,
    teamLeaders,
    divisionId,
    fiscalYear,
    isBudgetTeamMember
}) => {
    const { data: division, isSuccess } = useGetDivisionQuery(divisionId);
    const divisionDirectorFullName = useGetUserFullNameFromId(isSuccess ? division.division_director_id : null);
    const [isEditMode, setIsEditMode] = React.useState(false);

    const currentFiscalYear = getCurrentFiscalYear();
    const showButton = isBudgetTeamMember && fiscalYear === Number(currentFiscalYear);

    return (
        <article>
            <div className="display-flex flex-justify">
                <h2>{!isEditMode ? "CAN Details" : "Edit CAN Details"}</h2>
                {showButton && (
                    <button
                        id="edit"
                        className="hover:text-underline cursor-pointer"
                        onClick={() => {
                            setIsEditMode(!isEditMode);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faPen}
                            size="2x"
                            className="text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                            title="edit"
                            data-position="top"
                        />
                        <span className="text-primary">Edit</span>
                    </button>
                )}
            </div>
            {isEditMode ? (
                <CANDetailForm
                    canId={canId}
                    number={number}
                    portfolioId={portfolioId}
                />
            ) : (
                <CANDetailView
                    description={description}
                    number={number}
                    nickname={nickname}
                    portfolioName={portfolioName}
                    teamLeaders={teamLeaders}
                    divisionDirectorFullName={divisionDirectorFullName}
                />
            )}
        </article>
    );
};

export default CanDetail;
