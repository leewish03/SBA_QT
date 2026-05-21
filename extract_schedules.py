import csv
import json

def csv_to_json(csv_path):
    data = []
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(dict(row))
    return data

if __name__ == "__main__":
    sba_plan = csv_to_json("../SBA_QT-4.1/data/sba_reading_plan.csv")
    qt_plan = csv_to_json("../SBA_QT-4.1/data/qt_plan.csv")
    
    with open("./public/fallback_schedule.json", "w", encoding="utf-8") as f:
        json.dump({
            "reading_plan": sba_plan,
            "qt_plan": qt_plan
        }, f, ensure_ascii=False, indent=2)
    print("Exported schedules to fallback_schedule.json")
