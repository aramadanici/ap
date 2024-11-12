import csv
import logging

from django.core.management.base import BaseCommand
from scores.models import Id  # Adjust the import path according to your app structure

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Load data from CSV file into Id model'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the CSV file')

    def handle(self, *args, **options):
        file_path = options['file_path']
        self.load_data(file_path)

    def load_data(self, file_path):
        with open(file_path, 'r') as file:
            reader = csv.reader(file, delimiter=';')
            objects_to_create = []
            for i, row in enumerate(reader, start=1):
                try:
                    code, name, isin = [col.strip() for col in row]
                    obj = Id(code=code, name=name, isin=isin)
                    objects_to_create.append(obj)
                except ValueError:
                    logger.error(f"Error parsing row {i}: {row}")
            if objects_to_create:
                Id.objects.bulk_create(objects_to_create)
                self.stdout.write(self.style.SUCCESS(f"Successfully inserted {len(objects_to_create)} rows"))
