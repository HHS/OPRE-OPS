---
name: azure-log-analytics-kql
description: Use when writing a KQL query against this app's Azure Log Analytics workspace to investigate Container App backend/frontend logs — production incidents, request/response tracing, or any query returning a SYN0002 parse error, an empty result you didn't expect, or a count that looks too low for the time range.
---

# Azure Log Analytics KQL for OPRE-OPS Container App Logs

## Overview

This repo's Container App console logs live in **two separate tables that must both be queried**, and the raw log lines are Python dict-repr text, not JSON. Getting either of those wrong doesn't error — it silently returns an incomplete or wrong result. This skill covers the two tables, the reserved-word trap, and how to write an extraction regex against the log format without guessing.

**Companion skill:** for general resource-health checks, service-type triage flow, and the AppLens/Monitor MCP tooling, use `azure:azure-diagnostics` first if you're not sure the problem is even KQL-shaped. This skill is for once you're writing the query.

## The two-table trap

Container App console logs land in a **native** table and a **legacy custom (`_CL`) table**, and both currently hold real data — which one has your incident depends on when it happened. The column names are different between them:

| | Native table | Custom `_CL` table |
|---|---|---|
| Table name | `ContainerAppConsoleLogs` | `ContainerAppConsoleLogs_CL` |
| App name column | `ContainerAppName` | `ContainerAppName_s` |
| Log text column | `Log` | `Log_s` |

**Querying only one of them doesn't error — it just silently undercounts or returns nothing**, which is far more dangerous than a syntax error. Any query touching a time range you're not 100% sure is entirely on one side of the cutover must `union` both, aliasing columns to a common name:

```kql
union isfuzzy=true
    (ContainerAppConsoleLogs    | where ContainerAppName    == '<container-app-name>' | project TimeGenerated, Log),
    (ContainerAppConsoleLogs_CL | where ContainerAppName_s   == '<container-app-name>' | project TimeGenerated, Log=Log_s)
| where TimeGenerated > ago(7d)
```

Never mix the two conventions on one table (e.g. `Log_s` on the native table, or `ContainerAppName` on the `_CL` table) — that's a column-not-found error at best, and the two naming schemes are easy to cross when working from memory.

Container App **Jobs** (scheduled/one-off tasks, not the always-on app) populate `ContainerName` instead of `ContainerAppName` — filter jobs on that column, and note the Monitor MCP tool's app-listing commands only enumerate Apps, not Jobs.

## Reserved words break `summarize`/`extend` aliases

`first` and `last` are KQL reserved words. Using them as column aliases produces a parse error pointing at an unrelated-looking offset (`SYN0002`, "Query could not be parsed at 'first'"), not an obvious "reserved word" message. Use `firstSeen`/`lastSeen`, `earliestSeen`/`latestSeen`, or similar instead:

```kql
| summarize n = count(), firstSeen = min(TimeGenerated), lastSeen = max(TimeGenerated) by Method, UrlPath
```

If you hit `SYN0002` at a token that looks like an ordinary identifier, suspect a reserved word first before re-reading the rest of the query for typos.

## Discover the log line shape before writing an extraction regex

The log text is a Python dict `repr()` (single-quoted, unescaped nested quotes), not JSON — `parse_json()` will not work on it, and a regex written from memory of "roughly what the line looks like" is a common source of an `extract()` that silently returns empty for every row. Before writing the real query, histogram the actual line shapes over a small sample:

```kql
ContainerAppConsoleLogs
| where ContainerAppName == '<container-app-name>'
| where TimeGenerated > ago(1h)
| extend shape = substring(replace_regex(Log, @'[0-9]', '#'), 0, 140)
| summarize n = count(), example = take_any(substring(Log, 0, 400)) by shape
| order by n desc
```

This collapses every digit to `#` so lines that only differ by IDs/timestamps group together, and gives you a real example to copy the exact quoting from — write the `extract()` regex against that, not from memory.

## Request/response correlation

Backend logs pair `Request:`/`Response:` lines per HTTP call via a short correlation id right after the log level:

```
2026-09-28 13:33:00 | INFO | f6267c19 | ops_api.ops:_log_safe:350 | Request: {'method': 'PATCH', 'url': '...', ...}
2026-09-28 13:33:01 | INFO | f6267c19 | ops_api.ops:_log_safe:350 | Response: {..., 'status_code': 400, 'json': '...', ...}
```

Extract the correlation id with `extract(@"\|\s*INFO\s*\|\s*([0-9a-f]+)\s*\|", 1, Log)`, then `summarize` request/response timestamps or fields by that id. To pull a specific field's value out of the dict-repr text (e.g. `status_code`, or a payload field), match up to the next comma-or-brace: `extract(@"'field_name': ([^,}]+)", 1, Log)` — this returns the raw repr (e.g. `'NON_SEVERABLE'` with quotes still attached, or `None` as literal text) since it isn't real JSON.

## Preferred invocation

Use the `azure` plugin's `mcp__plugin_azure_azure__monitor` tool with `command: "monitor_workspace_log_query"`, passing the workspace by name — no GUID lookup needed. `first`/`last` as parameter names in the tool call itself are fine; the reserved-word issue is only inside the KQL query text.

## Quick reference

| Symptom | Cause | Fix |
|---|---|---|
| `SYN0002`, parse error at what looks like a normal word | Reserved word used as an alias | Rename (`firstSeen` not `first`) |
| Query runs, count looks too low for the time range | Only queried one of the two log tables | `union isfuzzy=true` both, aliasing to common column names |
| `extract()` always returns empty | Regex guessed instead of matched against a real line | Histogram shapes first (see above), copy quoting exactly |
| Column not found on a table you queried before | Used the other table's column-naming convention | Native table: `Log`/`ContainerAppName`. `_CL` table: `Log_s`/`ContainerAppName_s` |
