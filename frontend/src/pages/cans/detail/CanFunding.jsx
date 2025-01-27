import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import CANBudgetByFYCard from "../../../components/CANs/CANBudgetByFYCard/CANBudgetByFYCard";
import CANBudgetForm from "../../../components/CANs/CANBudgetForm";
import CANFundingInfoCard from "../../../components/CANs/CANFundingInfoCard";
import CANFundingReceivedForm from "../../../components/CANs/CANFundingReceivedForm";
import CANFundingReceivedTable from "../../../components/CANs/CANFundingReceivedTable";
import Accordion from "../../../components/UI/Accordion";
import ReceivedFundingCard from "../../../components/UI/Cards/BudgetCard/ReceivedFundingCard";
import CurrencyCard from "../../../components/UI/Cards/CurrencyCard";
import ConfirmationModal from "../../../components/UI/Modals/index.js";
import RoundedBox from "../../../components/UI/RoundedBox";
import useCanFunding from "./CanFunding.hooks.js";

/**
 * @typedef {import("../../../components/CANs/CANTypes").FundingDetails} FundingDetails
 * @typedef {import("../../../components/CANs/CANTypes").FundingBudget} FundingBudget
 * @typedef {import("../../../components/CANs/CANTypes").FundingReceived} FundingReceived
 */

/**
 * @typedef {Object} welcomeModal
 * @property {string} heading
 * @property {string} actionButtonText
 * @property {string} secondaryButtonText
 * @property {() => void} handleConfirm
 * @property {boolean} showModal
 */

/**
 * @typedef {Object} CanFundingProps
 * @property {number} canId
 * @property {string} canNumber
 * @property {number} [currentFiscalYearFundingId]
 * @property {FundingDetails} [funding]
 * @property {FundingBudget[]} fundingBudgets
 * @property {number} fiscalYear
 * @property {string} totalFunding
 * @property {string} receivedFunding
 * @property {FundingReceived[]} fundingReceived data for table
 * @property {boolean} isBudgetTeamMember
 * @property {boolean} isEditMode
 * @property {() => void} toggleEditMode
 * @property {() => void} deleteFundingReceived
 * @property {string} carryForwardFunding,
 * @property {welcomeModal} welcomeModal
 * @property {() => void} setWelcomeModal
 */

/**
 * @component - The CAN Funding component.
 * @param {CanFundingProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanFunding = ({
    canId,
    canNumber,
    currentFiscalYearFundingId,
    funding,
    fundingBudgets,
    fiscalYear,
    totalFunding,
    receivedFunding,
    fundingReceived,
    isBudgetTeamMember,
    isEditMode,
    toggleEditMode,
    carryForwardFunding,
    welcomeModal,
    setWelcomeModal
}) => {
    const {
        handleAddBudget,
        handleAddFundingReceived,
        handleCancel,
        handleSubmit,
        modalProps,
        runValidate,
        cn,
        res,
        setShowModal,
        showButton,
        showModal,
        budgetForm,
        handleEnteredBudgetAmount,
        fundingReceivedForm,
        handleEnteredFundingReceivedAmount,
        handleEnteredNotes,
        totalReceived,
        enteredFundingReceived,
        populateFundingReceivedForm,
        cancelFundingReceived,
        deleteFundingReceived,
        deletedFundingReceivedIds
    } = useCanFunding(
        canId,
        canNumber,
        totalFunding,
        fiscalYear,
        isBudgetTeamMember,
        isEditMode,
        toggleEditMode,
        setWelcomeModal,
        receivedFunding,
        fundingReceived,
        currentFiscalYearFundingId
    );

    if (!funding) {
        return <div>No funding information available for this CAN.</div>;
    }

    const showCarryForwardCard = funding.active_period !== 1 && fiscalYear > funding.fiscal_year;

    return (
        <div>
            {+totalFunding === 0 && welcomeModal.showModal && (
                <ConfirmationModal
                    heading={welcomeModal.heading}
                    setShowModal={setWelcomeModal}
                    actionButtonText={welcomeModal.actionButtonText}
                    handleConfirm={welcomeModal.handleConfirm}
                />
            )}
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <div className="display-flex flex-justify">
                <h2>{!isEditMode ? "CAN Funding" : `Review FY ${fiscalYear} Funding Information`}</h2>
                {showButton && (
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
            <p>
                {!isEditMode
                    ? "The summary below shows the funding for this CAN for the select fiscal year."
                    : "Review the new FY Funding Information for this CAN."}
            </p>
            <CANFundingInfoCard
                funding={funding}
                fiscalYear={fiscalYear}
            />
            {!isEditMode ? (
                <section
                    id="cards"
                    className="margin-bottom-4"
                >
                    <div className="display-flex flex-justify margin-top-4">
                        <ReceivedFundingCard
                            title={`FY ${fiscalYear} Funding Received YTD`}
                            totalReceived={receivedFunding}
                            totalFunding={totalFunding}
                        />
                        <CANBudgetByFYCard fundingBudgets={fundingBudgets} />
                    </div>
                    <div className="margin-top-05">
                        <p className="font-12px text-base-dark margin-0">
                            * For multi-year CANs, the total budget will display in the first year, and the
                            carry-forward will display in every year after
                        </p>
                        <p className="font-12px text-base-dark margin-0">
                            * TBD means the FY Budget has not yet been entered by the Budget Team
                        </p>
                    </div>
                </section>
            ) : (
                <div>
                    <section
                        id="can-budget-form-section"
                        className="margin-bottom-8"
                    >
                        <h2>{`Add FY ${fiscalYear} CAN Budget`}</h2>
                        <p>{`Enter the FY ${fiscalYear} CAN Budget that teams will utilize for planning. For Multi-Year CANs, the Previous FYs Carry-Forward will display for you to review and enter as-is or edit, if needed.`}</p>
                        <div className="display-flex flex-justify margin-top-4">
                            <div
                                className="border-right-1px border-base-light"
                                style={{ minWidth: "46%" }}
                            >
                                {showCarryForwardCard && (
                                    <RoundedBox
                                        className="font-12px"
                                        style={{ minHeight: "69px", width: "313px", padding: "17px 0 0 13px" }}
                                        id="carry-forward-card"
                                    >
                                        <p className="margin-0 text-base-dark">Previous FYs Carry Forward</p>
                                        <CurrencyFormat
                                            value={carryForwardFunding}
                                            displayType="text"
                                            thousandSeparator={true}
                                            decimalScale={2}
                                            fixedDecimalScale={true}
                                            prefix="$ "
                                        />
                                    </RoundedBox>
                                )}
                                <CANBudgetForm
                                    showCarryForwardCard={showCarryForwardCard}
                                    totalFunding={
                                        budgetForm.submittedAmount ? budgetForm.submittedAmount : totalFunding
                                    }
                                    budgetAmount={budgetForm.enteredAmount}
                                    cn={cn}
                                    res={res}
                                    fiscalYear={fiscalYear}
                                    handleAddBudget={handleAddBudget}
                                    runValidate={runValidate}
                                    setBudgetAmount={handleEnteredBudgetAmount}
                                />
                            </div>
                            <CurrencyCard
                                amount={+budgetForm.submittedAmount}
                                dataCy="can-budget-fy-card"
                                headerText={`FY ${fiscalYear} CAN Budget`}
                            />
                        </div>
                    </section>
                    <section
                        id="can-funding-received-form-section"
                        className="margin-bottom-4"
                    >
                        <h2>{`Add FY ${fiscalYear} Funding Received YTD`}</h2>
                        <p>{`Add funding received towards the Total FY ${fiscalYear} Budget or come back to add funding later. Funding Received means the money is in OPRE's hands and ready to spend against.`}</p>
                        <div className="display-flex flex-justify margin-top-4">
                            <div
                                className="border-right-1px border-base-light"
                                style={{ minWidth: "46%" }}
                            >
                                <CANFundingReceivedForm
                                    receivedFundingAmount={fundingReceivedForm.enteredAmount}
                                    setReceivedFundingAmount={handleEnteredFundingReceivedAmount}
                                    handleSubmit={handleAddFundingReceived}
                                    isEditing={fundingReceivedForm.isEditing}
                                    setNotes={handleEnteredNotes}
                                    notes={fundingReceivedForm.enteredNotes}
                                    cn={cn}
                                    res={res}
                                    runValidate={runValidate}
                                    cancelFundingReceived={cancelFundingReceived}
                                />
                            </div>
                            <ReceivedFundingCard
                                title={`FY ${fiscalYear} Funding Received YTD`}
                                totalReceived={totalReceived.toString() || "0"}
                                totalFunding={budgetForm.submittedAmount}
                            />
                        </div>
                    </section>
                </div>
            )}
            <Accordion
                heading="Funding Received YTD"
                level={2}
            >
                {enteredFundingReceived.length === 0 ? (
                    <p className="text-center">No funding received data available for this CAN.</p>
                ) : (
                    <CANFundingReceivedTable
                        fundingReceived={enteredFundingReceived}
                        totalFunding={totalFunding}
                        isEditMode={isEditMode}
                        populateFundingReceivedForm={populateFundingReceivedForm}
                        deleteFundingReceived={deleteFundingReceived}
                    />
                )}
            </Accordion>
            {isEditMode && (
                <div className="grid-row flex-justify-end margin-top-8">
                    <button
                        className="usa-button usa-button--unstyled margin-right-2"
                        data-cy="cancel-button"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        id="save-changes"
                        className="usa-button"
                        disabled={
                            !budgetForm.isSubmitted &&
                            !fundingReceivedForm.isSubmitted &&
                            !deletedFundingReceivedIds.length
                        }
                        data-cy="save-btn"
                        onClick={(e) => handleSubmit(e)}
                    >
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
};

export default CanFunding;
