import suite from './src/components/BudgetLineItems/BudgetLinesForm/suite.js';

// Test validation for zero amount (should fail)
const testData = {
    servicesComponentId: 1,
    selectedCan: { id: 1, number: 'G123456' },
    enteredAmount: 0, // This should fail validation
    needByDate: '12/31/2025'
};

const result = suite(testData, []); // Empty roles (not super user)

console.log('Test Data:', testData);
console.log('Has Errors:', result.hasErrors());
console.log('Amount Errors:', result.getErrors('enteredAmount'));
console.log('All Errors:', result.getErrors());
