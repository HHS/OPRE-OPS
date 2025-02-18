import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGetDivisionQuery } from "../../../api/opsAPI";
import CANDetailForm from "../../../components/CANs/CANDetailForm";
import CANDetailView from "../../../components/CANs/CANDetailView/CANDetailView";
import { NO_DATA } from "../../../constants.js";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";

/**
    @typedef {import("../../../components/Users/UserTypes").SafeUser} SafeUser
*/

/**
 * @typedef {Object} CanDetailProps
 * @property {number} canId
 * @property {string} description
 * @property {string} canNumber
 * @property {string} nickname
 * @property {string} portfolioName
 * @property {number} portfolioId
 * @property {SafeUser[]} teamLeaders
 * @property {number} divisionId
 * @property {number} fiscalYear
 * @property {boolean} isBudgetTeamMember
 * @property {boolean} isEditMode
 * @property {() => void} toggleEditMode
 */

/**
 * @component - The CAN detail page.
 * @param {CanDetailProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanDetail = ({
    canId,
    description,
    canNumber,
    nickname,
    portfolioName,
    portfolioId,
    teamLeaders,
    divisionId,
    fiscalYear,
    isBudgetTeamMember,
    isEditMode,
    toggleEditMode
}) => {
    const { data: division, isSuccess } = useGetDivisionQuery(divisionId);
    const divisionDirectorFullName = useGetUserFullNameFromId(isSuccess ? division.division_director_id : null);
    const currentFiscalYear = getCurrentFiscalYear();
    const showButton = isBudgetTeamMember && fiscalYear === Number(currentFiscalYear);
    const divisionName = division?.display_name ?? NO_DATA;

    return (
        <article>
            <div className="display-flex flex-justify">
                <h2>{!isEditMode ? "CAN Details" : "Edit CAN Details"}</h2>
                {showButton && !isEditMode && (
                    <button
                        id="edit"
                        className="hover:text-underline cursor-pointer"
                        onClick={toggleEditMode}
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
                    canNumber={canNumber}
                    portfolioId={portfolioId}
                    canNickname={nickname}
                    canDescription={description}
                    toggleEditMode={toggleEditMode}
                />
            ) : (
                <CANDetailView
                    canId={canId}
                    description={description}
                    number={canNumber}
                    nickname={nickname}
                    portfolioName={portfolioName}
                    teamLeaders={teamLeaders}
                    divisionDirectorFullName={divisionDirectorFullName}
                    divisionName={divisionName}
                    fiscalYear={fiscalYear}
                />
            )}
        </article>
    );
};

export default CanDetail;
