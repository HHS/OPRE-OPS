import csv
import json
import argparse


def convert_csv_to_json(inputf, outputf, keys, model_name):
    with open(inputf) as csv_f:
        reader = csv.DictReader(csv_f)
        reader.fieldnames = [name.lower() for name in reader.fieldnames]
        output_dict = []
        pk_count = 0
        for i, row in enumerate(reader):
            obj = {
                "model": model_name,
                "pk": i + 1,
                "fields": {}
            }
            for key in keys:
                obj["fields"][key] = row[key.lower()]
            
            output_dict.append(obj)
        
        output_json = json.dumps(output_dict)

        with open(outputf, "w") as json_f:
            json.dump(output_dict, json_f, indent=4)
        

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("i", help="Input file path")
    parser.add_argument("o", help="Output file path")
    parser.add_argument("model_name", help="Model name")
    parser.add_argument("keys", nargs="+", help="Columns to parse as JSON keys")
    args = parser.parse_args()

    inputf = args.i
    outputf = args.o
    model_name = "ops_site." + args.model_name
    keys = args.keys

    convert_csv_to_json(inputf, outputf, keys, model_name)


