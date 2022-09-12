import argparse
import csv
import json


def convert_csv_to_json(inputf, outputf, keys, model_name):
    """
    Takes csv of model data and converts it into formatted JSON
    for fixture data.

    How to use:
    In CLI, run python csv_to_json.py <input filepath > <output filepath> <model name> <list of fields/columns to parse>

    Do not attempt to output to the existing fixture/fake_data.json file, this will
    override the existing data in that file. Instead, output to a newly created JSON
    file from which you can copy/paste the generated JSON to the fixture file.

    Sample output JSON:
    [
    {
        "model": "ops.<model_name>",
        "pk": 1,
        "fields": {
            "key1": "Test Data 1",
            "key2": "Field 2",
            "key3": [list, of, things],
            "key4": "2"
        }
    },
    {
        "model": "ops.<model_name>",
        "pk": 2,
        "fields": {
            "key1": "Test Data 2",
            "key2": "Field 2",
            "key3": [list, of, things],
            "key4": "1"
        }
    }
    ]

    :param inputf: string, file path to input csv file
    :param outputf: string, file path to output json file
    :param keys: list, fields/column names to parse as model fields
    :param model_name: string, model name to for which to build the fixture
    """
    with open(inputf) as csv_f:
        reader = csv.DictReader(csv_f)
        reader.fieldnames = [name.lower() for name in reader.fieldnames]
        output_list = []
        for i, row in enumerate(reader):
            obj = {"model": model_name, "pk": i + 1, "fields": {}}
            for key in keys:
                obj["fields"][key] = row[key.lower()]

            output_list.append(obj)

        with open(outputf, "w") as json_f:
            json.dump(output_list, json_f, indent=4)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("i", help="Input file path")
    parser.add_argument("o", help="Output file path")
    parser.add_argument("model_name", help="Model name")
    parser.add_argument(
        "keys",
        nargs="+",
        help="Columns names to parse as JSON keys \
                        (these should match model fields)",
    )
    args = parser.parse_args()

    inputf = args.i
    outputf = args.o
    model_name = "ops." + args.model_name
    keys = args.keys

    convert_csv_to_json(inputf, outputf, keys, model_name)
