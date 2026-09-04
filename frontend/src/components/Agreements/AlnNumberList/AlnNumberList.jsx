import icons from "../../../uswds/img/sprite.svg";
import { ALN_NUMBER_OPTIONS } from "../AlnNumbersComboBox/AlnNumbersComboBox.constants";

/**
 * @component - Renders a list of selected ALN Numbers with remove buttons.
 * @param {Object} props - The component props.
 * @param {string[]} props.selectedAlnNumbers - The selected ALN Number ids.
 * @param {(alnNumber: string) => void} props.removeAlnNumber - Called with an ALN id to remove it.
 * @returns {React.ReactElement} - The rendered component.
 */
const AlnNumberList = ({ selectedAlnNumbers, removeAlnNumber }) => {
    const AlnTag = ({ alnId }) => {
        const option = ALN_NUMBER_OPTIONS.find((opt) => opt.id === alnId);
        const label = option ? option.title : alnId;

        return (
            <div
                className="font-12px height-205 radius-md bg-brand-primary-light display-flex flex-align-center"
                style={{ width: "fit-content", padding: "5px" }}
            >
                {label}
                <button
                    type="button"
                    className="usa-button--unstyled height-2 width-2 text-primary-dark margin-left-05"
                    onClick={() => removeAlnNumber(alnId)}
                    aria-label={`Remove ${label}`}
                >
                    <svg
                        className="height-2 width-2"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <use href={`${icons}#cancel`}></use>
                    </svg>
                </button>
            </div>
        );
    };

    return selectedAlnNumbers?.length > 0 ? (
        <ul className="add-list-reset">
            {[...selectedAlnNumbers]
                .sort((a, b) => parseFloat(a) - parseFloat(b))
                .map((alnId) => (
                    <li
                        key={alnId}
                        className="margin-top-105"
                    >
                        <AlnTag alnId={alnId} />
                    </li>
                ))}
        </ul>
    ) : (
        <p>No ALN numbers</p>
    );
};

export default AlnNumberList;
