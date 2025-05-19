import json
import sys
import uuid
from datetime import datetime


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
            result = {
                "ruleId": rule_id,
                "level": map_severity(severity),
                "message": {"text": name},
                "locations": [
                    {
                        "physicalLocation": {
                            "artifactLocation": {
                                "uri": uri
                            }
                        },
                        "logicalLocations": [
                            {
                                "kind": "url",
                                "name": uri
                            }
                        ]
                    }
                ]
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
    if len(sys.argv) != 3:
        print("Usage: python zap_json_to_sarif.py input.json output.sarif")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    with open(input_path, "r") as f:
        zap_data = json.load(f)

    sarif_data = zap_json_to_sarif(zap_data)

    with open(output_path, "w") as f:
        json.dump(sarif_data, f, indent=2)

    print(f"Converted {input_path} to SARIF at {output_path}")

if __name__ == "__main__":
    main()
