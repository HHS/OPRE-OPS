---
name: sync-openapi
description: Sync, update, and validate the OpenAPI specification (backend/openapi.yml) against the Flask API routes. Use whenever endpoints have been added, changed, or removed, or when the user mentions API docs, swagger, OpenAPI, endpoint documentation, "update the spec", or has just added/modified a route or resource class. Also use when checking for drift between the code and the spec.
argument-hint: "[endpoint-path | --branch | --all]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
disable-model-invocation: true
---

# Sync OpenAPI Specification

You are responsible for keeping `backend/openapi.yml` in sync with the Flask API routes defined in `backend/ops_api/ops/urls.py` and their implementations.

## Resource Locations

Most resource classes live in `backend/ops_api/ops/resources/`, but some are in other locations:
- **Standard resources**: `backend/ops_api/ops/resources/*.py` (33 files)
- **Document API**: `backend/ops_api/ops/document/api.py` (separate module with `DocumentItemAPI`, `DocumentListAPI`)
- **Version API**: `backend/ops_api/ops/utils/version.py`
- **Health Check**: `backend/ops_api/ops/resources/health_check.py`

When looking up a resource class, check `views.py` imports first — they'll tell you the exact module path.

## How to Determine Scope

Interpret `$ARGUMENTS` to decide what to sync:

### 1. Specific Endpoint: `$ARGUMENTS` is a path like `/agreements/` or `lookups/agreement-types`

- Focus only on that endpoint path
- Find the corresponding route in `backend/ops_api/ops/urls.py`
- Find its resource class (check `views.py` imports — may be in `resources/`, `document/`, or `utils/`)
- Update or add the entry in `backend/openapi.yml`

### 2. Current Branch: `$ARGUMENTS` is `--branch` or empty/not provided

- Run `git diff main...HEAD --name-only` to find files changed on this branch
- Filter for changes in:
  - `backend/ops_api/ops/urls.py` (route changes)
  - `backend/ops_api/ops/resources/` (endpoint implementation changes)
  - `backend/ops_api/ops/document/` (document API changes)
  - `backend/ops_api/ops/views.py` (view registration changes)
  - `backend/ops_api/ops/schemas/` (schema changes that affect request/response shapes)
  - `backend/models/` (model changes that affect response schemas)
- For each changed route or resource, check if `backend/openapi.yml` needs updating
- Report which endpoints need attention and update them

### 3. Full Sync: `$ARGUMENTS` is `--all` or `--sync`

- Parse ALL routes from `backend/ops_api/ops/urls.py`
- Parse ALL paths from `backend/openapi.yml`
- Compare the two sets and report:
  - **Missing from openapi.yml**: Routes in urls.py with no corresponding openapi path
  - **Extra in openapi.yml**: Paths in openapi.yml with no corresponding route in urls.py
  - **Potentially stale**: Paths that exist in both but where the resource implementation has changed
  - **Trailing slash mismatches**: Paths where urls.py and openapi.yml disagree on trailing slashes (e.g., `/portfolios/` vs `/portfolios`)
- Print a summary count: "X routes in urls.py, Y paths in openapi.yml, Z missing, W extra"
- Ask the user which endpoints to update, then proceed

## How to Sync an Endpoint

For each endpoint that needs syncing, follow these steps:

### Step 1: Read the Route Definition

Read `backend/ops_api/ops/urls.py` to find the URL rule, e.g.:
```python
api_bp.add_url_rule("/agreements/<int:id>", view_func=AGREEMENT_ITEM_API_VIEW_FUNC)
```

### Step 2: Find the View Function

Read `backend/ops_api/ops/views.py` to find the view function and its resource class:
```python
AGREEMENT_ITEM_API_VIEW_FUNC = AgreementItemAPI.as_view("agreements-item", Agreement)
```

### Step 3: Read the Resource Implementation

Read the resource class (usually in `backend/ops_api/ops/resources/`, but check the import in `views.py` — some live in `document/api.py` or `utils/`) to understand:
- Which HTTP methods are implemented (GET, POST, PUT, PATCH, DELETE)
- Request parameters (query params, path params, request body)
- Response structure and status codes
- Authorization requirements (`@is_authorized` decorator)

### Step 4: Check the Model/Schema

If the resource uses a model or schema, read it to understand the response shape:
- Models in `backend/models/`
- Schemas in `backend/ops_api/ops/schemas/`

### Step 5: Update openapi.yml

Add or update the path entry in `backend/openapi.yml` following the existing conventions:
- Use the same YAML formatting style as existing entries
- Include `tags`, `operationId`, `description`, `parameters`, `responses`
- Use `$ref` for shared schemas where they exist in the `components` section
- Convert Flask URL params like `<int:id>` to OpenAPI `{id}` format
- Add trailing slashes to match Flask routes (e.g., `/agreements/` not `/agreements`)
- Include example responses where practical

### Path Naming Convention

Flask route `<int:id>` maps to OpenAPI `{id}`. Match the parameter name used in the Flask route.

URL prefix `/api/v1` is already defined in `servers:` - do NOT include it in paths.

**Trailing slashes**: Always check the actual Flask route in `urls.py` — some paths have trailing slashes and some don't. The openapi.yml path must match the Flask route exactly. Watch for existing inconsistencies (e.g., openapi.yml says `/portfolios` but urls.py says `/portfolios/`) and fix them when you encounter them.

## Validation

After making changes, run the validation script:

```bash
./backend/validate_openapi.sh
```

Report the validation results to the user. If there are errors:
1. Fix YAML syntax issues immediately
2. For Spectral/Redocly warnings, explain them and ask the user if they want them fixed
3. For Swagger CLI errors, these indicate structural problems that must be fixed

## Important Notes

- The openapi.yml file is ~8200+ lines. Use targeted edits, not full rewrites.
- Preserve existing formatting and indentation (2-space YAML indent).
- When adding new paths, insert them in a logical position near related endpoints.
- The `security` section at the bottom applies globally - individual endpoints don't need it unless they differ.
- Tags group endpoints in documentation - reuse existing tags or propose new ones.
- Check the `components/schemas` section before defining inline schemas - reuse where possible.
