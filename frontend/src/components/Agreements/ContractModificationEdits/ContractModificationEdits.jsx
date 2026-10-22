import { useGetAgreementContractModificationEditsByIdQuery } from "../../../api/opsAPI";
import ContractModificationEditCard from "./ContractModificationEditCard";

/**
 * "Contract Modifications" section of the Award & Modifications tab. Lists the approved
 * edits made in OPS since the agreement was awarded that still require a contract
 * modification to update the actual contract (OPS-3072). Edits stay listed until the
 * user starts the modification. Renders nothing while loading or when there are no edits.
 *
 * @component
 * @param {Object} props
 * @param {number} props.agreementId
 * @returns {React.ReactElement | null}
 */
const ContractModificationEdits = ({ agreementId }) => {
    const {
        data: edits,
        isLoading,
        isError
    } = useGetAgreementContractModificationEditsByIdQuery(agreementId, {
        skip: !agreementId,
        refetchOnMountOrArgChange: true
    });

    if (isLoading || (!isError && !edits?.length)) {
        return null;
    }

    let content;
    if (isError) {
        content = <div>Error loading edits that require a contract modification.</div>;
    } else {
        content = (
            <ul
                className="usa-list--unstyled display-flex flex-column"
                style={{ gap: "1rem" }}
            >
                {edits.map((edit) => (
                    <li key={edit.id}>
                        <ContractModificationEditCard edit={edit} />
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <section
            className="margin-bottom-6"
            data-cy="contract-modifications-section"
        >
            <h2 className="font-sans-lg">Contract Modifications</h2>
            <p className="font-sans-sm line-height-body-5">
                After an agreement has been awarded, it will require a Contract Modification in order to make changes or
                to execute planned budget lines as-is. If edits have been made in OPS since the agreement was awarded,
                they will be displayed below as a reference. When you are ready to execute a modification, click Start
                Modification below.
            </p>
            <h3 className="font-sans-3xs text-normal text-base-dark margin-bottom-3">
                Edits That Require a Contract Modification
            </h3>
            {content}
        </section>
    );
};

export default ContractModificationEdits;
