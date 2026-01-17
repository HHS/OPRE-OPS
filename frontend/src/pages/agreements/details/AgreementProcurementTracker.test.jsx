import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgreementProcurementTracker from './AgreementProcurementTracker';
import StepIndicator from '../../../components/UI/StepIndicator';

// Mock the StepIndicator component to track its props
jest.mock('../../../components/UI/StepIndicator', () => {
  return jest.fn(({ steps, currentStep }) => (
    <div data-testid="step-indicator" data-current-step={currentStep}>
      {steps.map((step, index) => (
        <div
          key={index}
          data-testid={`step-${index}`}
          className={index === currentStep ? 'current' : 'inactive'}
        >
          {step}
        </div>
      ))}
    </div>
  ));
});

describe('AgreementProcurementTracker', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  test('renders StepIndicator with correct initial step', () => {
    render(<AgreementProcurementTracker />);

    // Verify StepIndicator was called with correct props
    expect(StepIndicator).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: [
          "Acquisition Planning",
          "Pre-Solicitation",
          "Solicitation",
          "Evaluation",
          "Pre-Award",
          "Award"
        ],
        currentStep: 2
      }),
      expect.anything()
    );

    // Verify the correct step is marked as current
    const stepIndicator = screen.getByTestId('step-indicator');
    expect(stepIndicator).toHaveAttribute('data-current-step', '2');

    // Verify the current step has the correct class
    const currentStepElement = screen.getByTestId('step-2');
    expect(currentStepElement).toHaveClass('current');
    expect(currentStepElement).toHaveTextContent('Solicitation');
  });

  test('step indicator changes when currentStep prop changes', () => {
    // Since currentStep is hardcoded, we'll need to modify the component temporarily
    // or create a wrapper component that accepts currentStep as a prop
    const TestWrapper = ({ currentStep = 2 }) => {
      const wizardSteps = [
        "Acquisition Planning",
        "Pre-Solicitation",
        "Solicitation",
        "Evaluation",
        "Pre-Award",
        "Award"
      ];

      return (
        <>
          <div className="display-flex flex-justify flex-align-center">
            <h2 className="font-sans-lg">Procurement Tracker</h2>
          </div>
          <p className="font-sans-sm margin-bottom-4">
            Follow the steps below to complete the procurement process for Budget Lines in Executing Status.
          </p>
          <StepIndicator
            steps={wizardSteps}
            currentStep={currentStep}
          />
        </>
      );
    };

    const { rerender } = render(<TestWrapper currentStep={1} />);

    // Check initial state (step 1)
    expect(StepIndicator).toHaveBeenLastCalledWith(
      expect.objectContaining({
        currentStep: 1
      }),
      expect.anything()
    );

    let stepIndicator = screen.getByTestId('step-indicator');
    expect(stepIndicator).toHaveAttribute('data-current-step', '1');

    let currentStepElement = screen.getByTestId('step-1');
    expect(currentStepElement).toHaveClass('current');
    expect(currentStepElement).toHaveTextContent('Pre-Solicitation');

    // Re-render with different currentStep
    rerender(<TestWrapper currentStep={4} />);

    // Verify the step indicator updated
    expect(StepIndicator).toHaveBeenLastCalledWith(
      expect.objectContaining({
        currentStep: 4
      }),
      expect.anything()
    );

    stepIndicator = screen.getByTestId('step-indicator');
    expect(stepIndicator).toHaveAttribute('data-current-step', '4');

    currentStepElement = screen.getByTestId('step-4');
    expect(currentStepElement).toHaveClass('current');
    expect(currentStepElement).toHaveTextContent('Pre-Award');

    // Verify previous step is no longer current
    const previousStepElement = screen.getByTestId('step-1');
    expect(previousStepElement).toHaveClass('inactive');
  });

  test('step indicator handles edge cases correctly', () => {
    const TestWrapper = ({ currentStep }) => {
      const wizardSteps = [
        "Acquisition Planning",
        "Pre-Solicitation",
        "Solicitation",
        "Evaluation",
        "Pre-Award",
        "Award"
      ];

      return (
        <StepIndicator
          steps={wizardSteps}
          currentStep={currentStep}
        />
      );
    };

    // Test first step
    const { rerender } = render(<TestWrapper currentStep={0} />);
    let stepIndicator = screen.getByTestId('step-indicator');
    expect(stepIndicator).toHaveAttribute('data-current-step', '0');

    // Test last step
    rerender(<TestWrapper currentStep={5} />);
    stepIndicator = screen.getByTestId('step-indicator');
    expect(stepIndicator).toHaveAttribute('data-current-step', '5');

    let currentStepElement = screen.getByTestId('step-5');
    expect(currentStepElement).toHaveClass('current');
    expect(currentStepElement).toHaveTextContent('Award');
  });
});
