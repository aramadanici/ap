import csv

from django.core.management.base import BaseCommand
from scores.models import (  # Adjust the import path according to your app structure
    Id,
    Sector,
)


class Command(BaseCommand):
    help = 'Load data from CSV file into Sector model'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the CSV file')

    def handle(self, *args, **options):
        file_path = options['file_path']
        self.load_data(file_path)

    def load_data(self, file_path):
        with open(file_path, 'r') as file:
            reader = csv.reader(file, delimiter=';')
            objects_to_create = []
            for row in reader:
                try:
                    id_code, sector, industry, gic_sector, gic_group, gic_industry, gic_subindustry = row
                    
                    # Fetch or create the Id instance
                    id_instance, created = Id.objects.get_or_create(code=id_code)

                    # Create Sector instance and assign foreign key
                    sector_instance = Sector(
                        code=id_instance,
                        sector=sector,
                        industry=industry,
                        gicSector=gic_sector,
                        gicGroup=gic_group,
                        gicIndustry=gic_industry,
                        gicSubIndustry=gic_subindustry
                    )
                    objects_to_create.append(sector_instance)
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error processing row: {row}. {e}"))
            if objects_to_create:
                Sector.objects.bulk_create(objects_to_create)
                self.stdout.write(self.style.SUCCESS(f"Successfully inserted {len(objects_to_create)} rows"))
