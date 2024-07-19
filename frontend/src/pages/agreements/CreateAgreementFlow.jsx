import React from "react";

/**
 * This is a React component that handles the flow of creating an agreement.
 *
 * @component
 * @param {Object} props - The properties that define the component.
 * @param {React.ReactNode} props.children - The child components to be rendered within this component.
 * @param {function} props.onFinish - The function to be called when the flow is finished.
 *
 * @example
 * <CreateAgreementFlow onFinish={handleFinish}>
 *   <ChildComponent />
 * </CreateAgreementFlow>
 *
 * @returns {React.ReactNode}} - The rendered component.
 */
const CreateAgreementFlow = ({ children, onFinish }) => {
    const [formData, setFormData] = React.useState({});
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const wizardSteps = ["Project", "Agreement", "Services Components & Budget Lines"];

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentIndex]);

    const goBack = (stepData) => {
        const previousIndex = currentIndex - 1;
        const updatedData = {
            ...formData,
            ...stepData
        };
        if (previousIndex >= 0) {
            setCurrentIndex(previousIndex);
        }
        setFormData(updatedData);
    };

    const goToNext = (stepData) => {
        const nextIndex = currentIndex + 1;
        const updatedData = {
            ...formData,
            ...stepData
        };

        if (nextIndex < children.length) {
            setCurrentIndex(nextIndex);
        } else {
            onFinish(updatedData);
        }
        setFormData(updatedData);
    };

    const currentChild = React.Children.toArray(children)[currentIndex];

    if (React.isValidElement(currentChild)) {
        return React.cloneElement(currentChild, {
            goToNext,
            goBack,
            wizardSteps,
            currentStep: currentIndex + 1,
            formData
        });
    }

    return currentChild;
};

export default CreateAgreementFlow;
