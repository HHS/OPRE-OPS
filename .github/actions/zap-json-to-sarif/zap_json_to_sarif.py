import argparse
import json
import sys
import uuid
from datetime import datetime
from pathlib import Path


def _safe_path(raw_path: str) -> Path:
    """argparse ``type=`` helper: reject paths that escape the CWD.

    The script runs inside a GitHub Actions checkout with fixed paths passed by
    the workflow, but we harden it anyway so a misconfigured caller (or anyone
    running the script locally) can't accidentally read or write outside the
    project tree via ``..`` or absolute-path arguments.
    """
    cwd = Path.cwd().resolve()
    resolved = (cwd / raw_path).resolve()
    try:
        resolved.relative_to(cwd)
    except ValueError:
        raise argparse.ArgumentTypeError(f"Path escapes CWD: {raw_path!r}")
    return resolved


def zap_json_to_sarif(zap_json):
    sarif = {
        "version": "2.1.0",
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": "OWASP ZAP",
                        "informationUri": "https://www.zaproxy.org/",
                        "rules": []
                    }
                },
                "results": []
            }
        ]
    }

    rule_ids = {}
    results = []
    rules = []

    for alert in zap_json.get("site", [{}])[0].get("alerts", []):
        rule_id = alert["pluginid"]
        name = alert["name"]
        severity = alert["riskdesc"].split(" ")[0].lower()
        description = alert["desc"]
        help_uri = alert.get("reference", "")

        if rule_id not in rule_ids:
            rule = {
                "id": rule_id,
                "name": name,
                "shortDescription": {"text": name},
                "fullDescription": {"text": description},
                "helpUri": help_uri or "https://www.zaproxy.org/",
                "properties": {
                    "severity": severity
                }
            }
            rule_ids[rule_id] = True
            rules.append(rule)

        for instance in alert.get("instances", []):
            uri = instance.get("uri", "unknown")
            evidence = instance.get("evidence", "")

            # For DAST scans, use a placeholder file since findings are about
            # runtime behavior, not specific source files
            result = {
                "ruleId": rule_id,
                "level": map_severity(severity),
                "message": {
                    "text": f"{name} - {uri}"
                },
                "locations": [
                    {
                        "physicalLocation": {
                            "artifactLocation": {
                                "uri": "DAST-Findings.md",
                                "uriBaseId": "%SRCROOT%"
                            },
                            "region": {
                                "startLine": 1,
                                "startColumn": 1
                            }
                        },
                        "logicalLocations": [
                            {
                                "kind": "url",
                                "name": uri
                            }
                        ]
                    }
                ],
                "properties": {
                    "scanned_url": uri
                }
            }
            if evidence:
                result["partialFingerprints"] = {
                    "evidence": str(uuid.uuid5(uuid.NAMESPACE_URL, evidence))
                }
            results.append(result)

    sarif["runs"][0]["tool"]["driver"]["rules"] = rules
    sarif["runs"][0]["results"] = results
    return sarif

def map_severity(severity):
    return {
        "high": "error",
        "medium": "warning",
        "low": "note",
        "informational": "note"
    }.get(severity.lower(), "none")

def main():
    parser = argparse.ArgumentParser(description="Convert OWASP ZAP JSON to SARIF.")
    # The _safe_path type hook rejects any argument that resolves outside the
    # CWD before argparse opens the files. This breaks Snyk's sys.argv → open()
    # taint flow: the flow now runs sys.argv → _safe_path → Path → argparse,
    # and only after the allow-list check does argparse open the file.
    parser.add_argument(
        "input",
        type=_safe_path,
        help="Path to ZAP JSON report (must be inside CWD).",
    )
    parser.add_argument(
        "output",
        type=_safe_path,
        help="Path to write SARIF output (must be inside CWD).",
    )
    args = parser.parse_args()

    with args.input.open("r") as f:
        zap_data = json.load(f)

    sarif_data = zap_json_to_sarif(zap_data)

    # Serialize to a string first so the write no longer touches the tainted
    # sys.argv → json.dump sink that Snyk's path-traversal rule tracks. The
    # write goes through Path.write_text after the _safe_path allow-list check
    # at argument-parse time.
    args.output.write_text(json.dumps(sarif_data, indent=2))

    print(f"Converted {args.input} to SARIF at {args.output}")

if __name__ == "__main__":
    main()
