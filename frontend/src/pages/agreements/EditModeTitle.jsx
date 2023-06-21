/**
 * Renders the title for the Create Agreement flow based on whether the component is in edit mode.
 *
 * @param {Object} props - The component props.
 * @param {boolean} props.isEditMode - A flag indicating whether the component is in edit mode.
 * @returns {JSX.Element} - The rendered component.
 */
export const EditModeTitle = ({ isEditMode }) => {
    return (
        <>
            {isEditMode ? (
                <>
                    <h1 className="font-sans-lg">Edit Agreement</h1>
                    <p>Follow the steps to edit an agreement</p>
                </>
            ) : (
                <>
                    <h1 className="font-sans-lg">Create New Agreement</h1>
                    <p>Follow the steps to create an agreement</p>
                </>
            )}
        </>
    );
};

export default EditModeTitle;
