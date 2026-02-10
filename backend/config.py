import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_DIR = os.path.join(BASE_DIR, 'input')
PROCESS_DIR = os.path.join(BASE_DIR, 'process')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')
OUTPUT_CSV = os.path.join(OUTPUT_DIR, 'output.csv')
OUTPUT_PPTX = os.path.join(OUTPUT_DIR, 'output.pptx')
GARTNER_EXCEL = os.path.join(OUTPUT_DIR, 'gartner_export.xlsx')

INPUT_CURRENT = 'current'
MAPPING_FILENAME = 'Mapping-file.xlsx'
GARTNER_MAPPING_CSV = 'Gartner-mapping.csv'
PROCESS_CSV = 'process.csv'

# Minimum application count for L2 to appear in Gartner summary (only L2s with count > N)
GARTNER_MIN_L2_COUNT = int(os.environ.get('GARTNER_MIN_L2_COUNT', '1'))

# Expected input file columns (any filename allowed; columns must match these names, case/space normalized)
INPUT_COLUMNS = [
    'SysID', 'Applications Name', 'Install Type', 'Tier',
    'Application Type', 'Description', 'Health', 'Spend'
]

# Mapping file columns (required for mapping)
MAPPING_COLUMNS_REQUIRED = ['SysID', 'L1', 'L2', 'Gartner Mapping', 'Market Leaders']
# Optional column from Mapping-file.xlsx (if present, used in Gartner mapping and export)
MAPPING_COLUMN_RECOMMENDED_GARTNER = 'Recommended Gartner Apps'

# Gartner-mapping.csv columns (used when user clicks Gartner Leaders Mapping; key = Sub-Category)
GARTNER_MAPPING_COLUMNS = [
    'Category', 'Sub-Category', 'Gartner Mapping', 'Market Leaders', 'Recommended Gartner Apps'
]
