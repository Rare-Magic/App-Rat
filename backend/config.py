import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_DIR = os.path.join(BASE_DIR, 'input')
PROCESS_DIR = os.path.join(BASE_DIR, 'process')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')

INPUT_CURRENT = 'current'
MAPPING_FILENAME = 'Mapping-file.xlsx'
PROCESS_CSV = 'process.csv'

# Minimum application count for L2 to appear in Gartner summary (only L2s with count > N)
GARTNER_MIN_L2_COUNT = int(os.environ.get('GARTNER_MIN_L2_COUNT', '1'))

# Expected input file columns (any filename allowed; columns must match these names, case/space normalized)
INPUT_COLUMNS = [
    'SysID', 'Applications Name', 'Install Type', 'Tier',
    'Application Type', 'Description', 'Health', 'Spend'
]

# Mapping file columns
MAPPING_COLUMNS = ['SysID', 'L1', 'L2', 'Gartner Mapping', 'Market Leaders']
