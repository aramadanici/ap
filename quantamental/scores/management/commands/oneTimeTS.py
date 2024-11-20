import csv
from datetime import datetime

from django.core.management.base import BaseCommand
from scores.models import Performance  # Replace 'myapp' with your actual app name


def import_books(file_path):
    with open(file_path, "r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            Performance.objects.create(
                symbol=row["symbol"], date=row["date"], close=row["close"]
            )


if __name__ == "__main__":
    csv_file_path = "Z:/14_Personal_Data/a.ramadani/ap/quantamental/static/data/sqlitestudiotest.csv"  # Replace with your actual file path
    import_books(csv_file_path)
