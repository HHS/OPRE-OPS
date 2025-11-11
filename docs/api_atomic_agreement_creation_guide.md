# API Guide: Atomic Agreement Creation

## Overview

The POST `/api/v1/agreements/` endpoint supports atomic creation of agreements with nested budget line items and services components in a single API call. All operations are performed within a single database transaction, ensuring atomicity - if any part fails, the entire operation is rolled back.

## Table of Contents

1. [Basic Concepts](#basic-concepts)
2. [Request Structure](#request-structure)
3. [Reference Mechanism](#reference-mechanism)
4. [Examples](#examples)
5. [Error Handling](#error-handling)
6. [Backward Compatibility](#backward-compatibility)

---

## Basic Concepts

### Nested Entity Creation

You can now create the following entities in one atomic operation:
- **Agreement** (required)
- **Budget Line Items** (optional array)
- **Services Components** (optional array)

### Why Atomic Creation?

**Before** (3 separate API calls):
```
POST /api/v1/agreements/           → Create agreement
POST /api/v1/services-components/  → Create base period
POST /api/v1/budget-line-items/    → Create BLI linked to base period
```

**After** (1 atomic API call):
```
POST /api/v1/agreements/  → Create agreement + SCs + BLIs together
```

**Benefits**:
- **Atomicity**: All-or-nothing - no partial data if something fails
- **Performance**: Fewer network round-trips
- **Simplicity**: Simpler client code
- **Consistency**: Immediate linking between BLIs and SCs

---

## Request Structure

### Standard Agreement Request (Unchanged)

```json
POST /api/v1/agreements/
{
  "name": "My Agreement",
  "agreement_type": "CONTRACT",
  "project_id": 1000,
  "agreement_reason": "NEW_REQ",
  ...other agreement fields
}
```

### Extended Request with Nested Entities

```json
POST /api/v1/agreements/
{
  "name": "My Agreement",
  "agreement_type": "CONTRACT",
  "project_id": 1000,
  "agreement_reason": "NEW_REQ",

  "services_components": [
    {
      "ref": "base_period",
      "number": 1,
      "optional": false,
      "description": "Base Period - Year 1"
    }
  ],

  "budget_line_items": [
    {
      "line_description": "Year 1 Personnel",
      "amount": 500000.00,
      "can_id": 500,
      "status": "PLANNED",
      "services_component_ref": "base_period"
    }
  ]
}
```

### Field Descriptions

#### `budget_line_items` (array, optional)
Array of budget line items to create with the agreement.

**Fields**:
- All standard budget line item fields **except** `agreement_id` (set automatically)
- `services_component_ref` (string, optional): Reference to a services component being created in this request
- `services_component_id` (integer, optional): Reference to an existing services component by database ID
- **Cannot have both** `services_component_ref` and `services_component_id`

#### `services_components` (array, optional)
Array of services components to create with the agreement.

**Fields**:
- All standard services component fields **except** `agreement_id` (set automatically)
- `ref` (string, optional): Temporary reference ID for this SC. Used by BLIs to reference it via `services_component_ref`. Defaults to array index if omitted.

---

## Reference Mechanism

### Budget Line Items ↔ Services Components Linking

Budget line items can reference services components in two ways:

#### 1. Reference an Existing SC (`services_component_id`)

Use this when referencing a services component that already exists in the database:

```json
{
  "budget_line_items": [
    {
      "line_description": "Budget",
      "amount": 500000.00,
      "can_id": 500,
      "status": "PLANNED",
      "services_component_id": 42  // Existing SC database ID
    }
  ]
}
```

#### 2. Reference a New SC (`services_component_ref`)

Use this when referencing a services component being created in the **same request**:

```json
{
  "services_components": [
    {
      "ref": "base_period",  // ← Temporary reference ID
      "number": 1,
      "optional": false
    }
  ],
  "budget_line_items": [
    {
      "line_description": "Budget",
      "amount": 500000.00,
      "can_id": 500,
      "status": "PLANNED",
      "services_component_ref": "base_period"  // ← References SC above
    }
  ]
}
```

### Default References (Numeric Index)

If you don't provide an explicit `ref` field on a services component, its **array index** (as a string) is used:

```json
{
  "services_components": [
    {"number": 1, "optional": false},  // ref = "0"
    {"number": 2, "optional": true}    // ref = "1"
  ],
  "budget_line_items": [
    {
      "line_description": "Base Period Budget",
      "amount": 500000.00,
      "can_id": 500,
      "services_component_ref": "0"  // References first SC
    },
    {
      "line_description": "Option 1 Budget",
      "amount": 525000.00,
      "can_id": 501,
      "services_component_ref": "1"  // References second SC
    }
  ]
}
```

---

## Examples

### Example 1: Simple Agreement (No Nested Entities)

**Backward compatibility** - existing code continues to work:

```bash
curl -X POST http://localhost:8080/api/v1/agreements/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Simple Contract",
    "agreement_type": "CONTRACT",
    "project_id": 1000,
    "agreement_reason": "NEW_REQ",
    "description": "A simple agreement without nested entities"
  }'
```

**Response**:
```json
{
  "message": "Agreement created",
  "id": 123,
  "budget_line_items_created": 0,
  "services_components_created": 0
}
```

---

### Example 2: Agreement with Budget Line Items Only

```bash
curl -X POST http://localhost:8080/api/v1/agreements/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Multi-Year Grant",
    "agreement_type": "GRANT",
    "project_id": 1000,
    "agreement_reason": "NEW_REQ",
    "foa": "HHS-2025-ACF-OPRE-FR-0001",
    "budget_line_items": [
      {
        "line_description": "Year 1 Research",
        "amount": 750000.00,
        "can_id": 500,
        "status": "PLANNED",
        "date_needed": "2025-10-01"
      },
      {
        "line_description": "Year 2 Research",
        "amount": 800000.00,
        "can_id": 501,
        "status": "PLANNED",
        "date_needed": "2026-10-01"
      }
    ]
  }'
```

**Response**:
```json
{
  "message": "Agreement created with 2 budget line items",
  "id": 124,
  "budget_line_items_created": 2,
  "services_components_created": 0
}
```

---

### Example 3: Agreement with Services Components Only

```bash
curl -X POST http://localhost:8080/api/v1/agreements/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Multi-Period Contract",
    "agreement_type": "CONTRACT",
    "project_id": 1000,
    "agreement_reason": "NEW_REQ",
    "contract_number": "75FCMC18D0030",
    "services_components": [
      {
        "ref": "base",
        "number": 1,
        "optional": false,
        "description": "Base Period - FY25",
        "period_start": "2025-10-01",
        "period_end": "2026-09-30"
      },
      {
        "ref": "option_1",
        "number": 2,
        "optional": true,
        "description": "Option Year 1 - FY26",
        "period_start": "2026-10-01",
        "period_end": "2027-09-30"
      }
    ]
  }'
```

**Response**:
```json
{
  "message": "Agreement created with 2 services components",
  "id": 125,
  "budget_line_items_created": 0,
  "services_components_created": 2
}
```

---

### Example 4: Full Atomic Creation (BLIs Reference New SCs)

This is the main use case - create an agreement with services components and budget line items that reference them:

```bash
curl -X POST http://localhost:8080/api/v1/agreements/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full Multi-Year Contract",
    "agreement_type": "CONTRACT",
    "project_id": 1000,
    "agreement_reason": "NEW_REQ",
    "contract_number": "75FCMC18D0030",
    "vendor": "Acme Corporation",
    "services_components": [
      {
        "ref": "base_period",
        "number": 1,
        "optional": false,
        "description": "Base Period - FY25",
        "period_start": "2025-10-01",
        "period_end": "2026-09-30"
      },
      {
        "ref": "option_year_1",
        "number": 2,
        "optional": true,
        "description": "Option Year 1 - FY26",
        "period_start": "2026-10-01",
        "period_end": "2027-09-30"
      },
      {
        "ref": "option_year_2",
        "number": 3,
        "optional": true,
        "description": "Option Year 2 - FY27",
        "period_start": "2027-10-01",
        "period_end": "2028-09-30"
      }
    ],
    "budget_line_items": [
      {
        "line_description": "Base Period Budget",
        "amount": 1000000.00,
        "can_id": 500,
        "status": "PLANNED",
        "date_needed": "2025-10-01",
        "services_component_ref": "base_period",
        "comments": "Funding for base period"
      },
      {
        "line_description": "Option Year 1 Budget",
        "amount": 1050000.00,
        "can_id": 501,
        "status": "PLANNED",
        "date_needed": "2026-10-01",
        "services_component_ref": "option_year_1",
        "comments": "Funding for option year 1 with 5% increase"
      },
      {
        "line_description": "Option Year 2 Budget",
        "amount": 1102500.00,
        "can_id": 502,
        "status": "PLANNED",
        "date_needed": "2027-10-01",
        "services_component_ref": "option_year_2",
        "comments": "Funding for option year 2 with 5% increase"
      }
    ]
  }'
```

**Response**:
```json
{
  "message": "Agreement created with 3 budget line items and 3 services components",
  "id": 126,
  "budget_line_items_created": 3,
  "services_components_created": 3
}
```

---

### Example 5: Mixed References (New SCs + Existing SCs + No SC)

```bash
curl -X POST http://localhost:8080/api/v1/agreements/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mixed Reference Contract",
    "agreement_type": "CONTRACT",
    "project_id": 1000,
    "agreement_reason": "NEW_REQ",
    "services_components": [
      {
        "ref": "new_sc",
        "number": 1,
        "optional": false,
        "description": "Newly created services component"
      }
    ],
    "budget_line_items": [
      {
        "line_description": "BLI referencing new SC",
        "amount": 500000.00,
        "can_id": 500,
        "status": "PLANNED",
        "services_component_ref": "new_sc"
      },
      {
        "line_description": "BLI referencing existing SC",
        "amount": 300000.00,
        "can_id": 501,
        "status": "PLANNED",
        "services_component_id": 1
      },
      {
        "line_description": "BLI with no SC reference",
        "amount": 200000.00,
        "can_id": 502,
        "status": "PLANNED"
      }
    ]
  }'
```

**Response**:
```json
{
  "message": "Agreement created with 3 budget line items and 1 services component",
  "id": 127,
  "budget_line_items_created": 3,
  "services_components_created": 1
}
```

---

### Example 6: Using Default Numeric References

```bash
curl -X POST http://localhost:8080/api/v1/agreements/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Numeric Reference Contract",
    "agreement_type": "CONTRACT",
    "project_id": 1000,
    "agreement_reason": "NEW_REQ",
    "services_components": [
      {
        "number": 1,
        "optional": false,
        "description": "First SC (ref=0)"
      },
      {
        "number": 2,
        "optional": true,
        "description": "Second SC (ref=1)"
      }
    ],
    "budget_line_items": [
      {
        "line_description": "Budget for first SC",
        "amount": 500000.00,
        "can_id": 500,
        "status": "PLANNED",
        "services_component_ref": "0"
      },
      {
        "line_description": "Budget for second SC",
        "amount": 525000.00,
        "can_id": 501,
        "status": "PLANNED",
        "services_component_ref": "1"
      }
    ]
  }'
```

**Response**:
```json
{
  "message": "Agreement created with 2 budget line items and 2 services components",
  "id": 128,
  "budget_line_items_created": 2,
  "services_components_created": 2
}
```

---

## Error Handling

### Transaction Atomicity

**All operations are atomic**. If any part fails, the entire transaction is rolled back - **no partial data is created**.

### Error Scenarios

#### 1. Invalid `services_component_ref`

**Request**:
```json
{
  "name": "Error Example",
  "agreement_type": "CONTRACT",
  "project_id": 1000,
  "services_components": [
    {"ref": "base_period", "number": 1, "optional": false}
  ],
  "budget_line_items": [
    {
      "line_description": "Budget",
      "amount": 500000.00,
      "can_id": 500,
      "services_component_ref": "nonexistent_ref"
    }
  ]
}
```

**Response**: 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": {
    "services_component_ref": [
      "Invalid services_component_ref 'nonexistent_ref'. No services component with that reference exists in the request. Available references: ['base_period']"
    ]
  }
}
```

**Result**: **Nothing created** - agreement, services components, and budget line items all rolled back.

---

#### 2. Invalid CAN ID

**Request**:
```json
{
  "name": "Error Example",
  "agreement_type": "CONTRACT",
  "project_id": 1000,
  "budget_line_items": [
    {
      "line_description": "Valid BLI",
      "amount": 500000.00,
      "can_id": 500
    },
    {
      "line_description": "Invalid BLI",
      "amount": 525000.00,
      "can_id": 99999
    }
  ]
}
```

**Response**: 404 Not Found
```json
{
  "message": "CAN with id 99999 not found"
}
```

**Result**: **Nothing created** - agreement and budget line items rolled back, even though the first BLI was valid.

---

#### 3. Both `services_component_id` and `services_component_ref`

**Request**:
```json
{
  "name": "Error Example",
  "agreement_type": "CONTRACT",
  "project_id": 1000,
  "services_components": [
    {"ref": "base", "number": 1, "optional": false}
  ],
  "budget_line_items": [
    {
      "line_description": "Budget",
      "amount": 500000.00,
      "can_id": 500,
      "services_component_id": 42,
      "services_component_ref": "base"
    }
  ]
}
```

**Response**: 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": {
    "budget_line_items": [
      "Cannot specify both services_component_id and services_component_ref"
    ]
  }
}
```

**Result**: **Nothing created** - validation fails before any database operations.

---

## Backward Compatibility

### Existing Code Works Unchanged

The atomic creation feature is **100% backward compatible**. Existing code that creates agreements without nested entities continues to work:

```javascript
// Old code - still works!
const response = await fetch('/api/v1/agreements/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Agreement',
    agreement_type: 'CONTRACT',
    project_id: 1000,
    agreement_reason: 'NEW_REQ'
  })
});
```

### Optional Fields

- `budget_line_items`: Omitting this field (or passing an empty array) creates an agreement with no budget line items
- `services_components`: Omitting this field (or passing an empty array) creates an agreement with no services components

### Response Format

The response format has been **extended** but remains **backward compatible**:

**Old Response** (still included):
```json
{
  "message": "Agreement created",
  "id": 123
}
```

**New Response** (extended):
```json
{
  "message": "Agreement created with 2 budget line items and 1 services component",
  "id": 123,
  "budget_line_items_created": 2,
  "services_components_created": 1
}
```

Old clients can ignore the new fields `budget_line_items_created` and `services_components_created`.

---

## When to Use Atomic Creation

### ✅ Use Atomic Creation When:

1. **Creating agreements with known budget line items** - you have all the data upfront
2. **Creating multi-period contracts** - base period + option periods with associated budget
3. **Bulk data imports** - ETL processes that need transactional guarantees
4. **Simplified client code** - fewer API calls means simpler code
5. **Performance matters** - reducing network round-trips
6. **Atomicity required** - need all-or-nothing guarantees

### ❌ Don't Use Atomic Creation When:

1. **Interactive wizards** - user creates agreement first, then adds BLIs later
2. **Incremental data entry** - data isn't available all at once
3. **Complex validation workflows** - need to validate agreement before allowing BLIs
4. **Existing patterns work fine** - no need to change working code

---

## Best Practices

### 1. Use Meaningful `ref` Values

**Good**:
```json
{"ref": "base_period", ...}
{"ref": "option_year_1", ...}
{"ref": "option_year_2", ...}
```

**Avoid** (rely on numeric defaults only when necessary):
```json
{} // ref="0"
{} // ref="1"
```

### 2. Group Related BLIs with SCs

Structure your request to make relationships clear:

```json
{
  "services_components": [
    {"ref": "base_period", ...}
  ],
  "budget_line_items": [
    // All BLIs for base period
    {..., "services_component_ref": "base_period"},
    {..., "services_component_ref": "base_period"}
  ]
}
```

### 3. Validate Data Client-Side First

Catch validation errors before making the API call:
- Ensure all `services_component_ref` values match a `ref` in `services_components`
- Ensure `can_id` values exist
- Don't specify both `services_component_id` and `services_component_ref`

### 4. Handle Errors Gracefully

Always handle the possibility of a 400 or 404 response:

```javascript
try {
  const response = await createAgreement(data);
  console.log(`Created agreement ${response.id}`);
} catch (error) {
  if (error.status === 400) {
    // Validation error - show user-friendly message
    showValidationErrors(error.body.errors);
  } else if (error.status === 404) {
    // Referenced entity not found
    showError('Referenced data not found');
  } else {
    // Unexpected error
    showError('Failed to create agreement');
  }
}
```

### 5. Log Creation Counts

Use the response counts for logging/analytics:

```javascript
const response = await createAgreement(data);
console.log(`Created agreement ${response.id} ` +
            `with ${response.budget_line_items_created} BLIs ` +
            `and ${response.services_components_created} SCs`);
```

---

## Technical Details

### Implementation Location

- **API Resource**: `backend/ops_api/ops/resources/agreements.py:164-280` (`AgreementListAPI.post()`)
- **Service Layer**: `backend/ops_api/ops/services/agreements.py:96-234` (`AgreementsService.create()`)
- **Schemas**:
  - `backend/ops_api/ops/schemas/agreements.py:58-72` (`NestedBudgetLineItemRequestSchema`)
  - `backend/ops_api/ops/schemas/services_component.py:57-103` (`NestedServicesComponentRequestSchema`)

### Transaction Management

- Uses explicit transaction handling with try-except
- Calls `db.session.rollback()` on any error
- All operations within a single transaction
- Services components created **before** budget line items (so BLIs can reference them)

### Performance Considerations

- **Single transaction**: All operations committed together
- **Flush after each SC creation**: Required to get SC IDs for BLI references
- **No N+1 queries**: Optimized for batch operations
- **Recommended limit**: Up to 100 nested entities per request

---

## Support

For questions or issues:
- **GitHub Issues**: https://github.com/OPRE/opre-ops/issues
- **Documentation**: See `docs/atomic_agreement_creation_implementation_plan.md`
- **Tests**: See `backend/ops_api/tests/ops/services/test_agreements.py`
