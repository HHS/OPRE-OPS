import { useState } from "react";
import ContainerModal from "../../../../components/UI/Modals/ContainerModal";
import icons from "../../../../uswds/img/sprite.svg";
import AgreementOdnLookup from "./AgreementOdnLookup";

/**
 * A secondary action, next to Export/Filters, that opens a modal for finding an agreement
 * by its exact order/document number (ODN). Deliberately not a persistent search bar — ODN
 * lookup is a power-user/edge-case shortcut, not the primary way users browse agreements.
 * @component
 * @returns {React.ReactElement} - The rendered component.
 */
export const AgreementOdnLookupButton = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button
                type="button"
                style={{ fontSize: "16px" }}
                className="usa-button--unstyled text-primary display-flex flex-align-end cursor-pointer"
                data-cy="agreement-odn-lookup-trigger"
                onClick={() => setShowModal(true)}
            >
                <svg
                    className="height-2 width-2 margin-right-05"
                    style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                >
                    <use href={`${icons}#search`}></use>
                </svg>
                <span>Find by ODN</span>
            </button>

            {showModal && (
                <ContainerModal
                    heading="Find Agreement by ODN"
                    description="Enter an agreement's exact order/document number (ODN) — the Purchase Order Number for Contracts, the Task Order Number for Assisted Acquisitions, or the Grant Number for Grants."
                    setShowModal={setShowModal}
                    cancelButtonText="Close"
                    modalClassName="maxw-desktop"
                >
                    <AgreementOdnLookup />
                </ContainerModal>
            )}
        </>
    );
};

export default AgreementOdnLookupButton;
