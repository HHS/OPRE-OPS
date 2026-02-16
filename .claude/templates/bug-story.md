# Bug Fix Story Template

## Bug Overview

**Ticket:** [TICKET-NUMBER]
**Title:** [Brief bug description]
**Severity:** [Critical/High/Medium/Low]
**Priority:** [P0/P1/P2/P3]

## Bug Description

### What's Broken
[Clear description of the bug]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Impact
- **Users Affected:** [Who is impacted by this bug]
- **Workaround:** [Is there a workaround? If so, describe it]
- **Business Impact:** [How does this affect the business/users]

## Reproduction Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Observe incorrect behavior]

### Environment
- **Browser/Device:** [Where does this occur]
- **User Role:** [What permissions/role needed to reproduce]
- **Data State:** [Any specific data conditions needed]

### Reproduction Rate
[Always/Sometimes/Rarely - and under what conditions]

## Root Cause Analysis

### Investigation
[Describe how you investigated the bug]

### Root Cause
[What is causing the bug - be specific about the code/logic issue]

### Why It Wasn't Caught
- [ ] Missing test coverage
- [ ] Edge case not considered
- [ ] Regression from recent change
- [ ] Integration issue between components
- [ ] Other: [explanation]

### Related Issues
- [Link to related bugs or tickets]

## Fix Implementation

### Solution Approach
[Describe the fix at a high level]

### Files to Modify
- `path/to/file.js` - [What needs to change]
- `path/to/file.test.js` - [Test updates/additions]

### Code Changes

**Before:**
```javascript
// Current problematic code
```

**After:**
```javascript
// Fixed code
```

### Implementation Steps

1. **Step 1**: [Description]
   - [Sub-task]

2. **Step 2**: [Description]
   - [Sub-task]

3. **Step 3**: [Description]
   - [Sub-task]

## Testing Strategy

### Regression Tests
- [ ] Add test for this specific bug
- [ ] Verify existing tests still pass
- [ ] Test related functionality for regressions

### Test Cases
- [ ] Test the exact reproduction steps
- [ ] Test edge cases around the fix
- [ ] Test [related scenario 1]
- [ ] Test [related scenario 2]

### Manual Verification
- [ ] Verify fix in development
- [ ] Verify fix in staging
- [ ] Test the original reproduction steps
- [ ] Test with different user roles/permissions
- [ ] Test with different data states

## Validation

### Code Quality
- [ ] All tests pass (including new regression tests)
- [ ] ESLint passes
- [ ] Prettier formatting applied
- [ ] Code coverage maintained or improved
- [ ] Pre-commit hooks pass

### Functional Validation
- [ ] Bug is fixed in all reproduction scenarios
- [ ] No new bugs introduced
- [ ] Existing functionality works as expected
- [ ] Performance not negatively impacted

## Regression Prevention

### New Tests Added
- [Describe the tests added to prevent this from happening again]

### Process Improvements
- [ ] Add missing test coverage for this area
- [ ] Add validation to prevent this class of bugs
- [ ] Update development checklist
- [ ] Document gotcha/pitfall for future developers

## Rollout Plan

### Deployment Strategy
- [ ] Can this be deployed immediately?
- [ ] Does this need a staged rollout?
- [ ] Are there any deployment risks?

### Rollback Plan
[If the fix causes issues, how do we roll back?]

### Monitoring
- [ ] Add monitoring/logging for this area
- [ ] Set up alerts if the issue recurs
- [ ] Track metrics: [what to measure]

## Notes

### Open Questions
- [ ] [Any questions that need answering]

### Related Work
- [Other tickets that should be addressed]

### References
- [Link to error logs]
- [Link to user reports]
- [Link to related documentation]
