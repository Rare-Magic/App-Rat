import pandas as pd
import os
from config import (
    INPUT_DIR, PROCESS_DIR, OUTPUT_DIR, OUTPUT_CSV, INPUT_COLUMNS,
    MAPPING_COLUMNS_REQUIRED, MAPPING_FILENAME, MAPPING_COLUMN_RECOMMENDED_GARTNER,
    GARTNER_MAPPING_CSV, GARTNER_MAPPING_COLUMNS,
    PROCESS_CSV, INPUT_CURRENT, GARTNER_MIN_L2_COUNT,
)


def _norm(s):
    return (s or '').strip().lower().replace(' ', '').replace('_', '')


def _read_csv_safe(path, **kwargs):
    """Read CSV robustly.

    - Detects gzip files by magic header (0x1f, 0x8b) and uses compression='gzip'.
    - Otherwise, tries utf-8, utf-8-sig, latin-1, cp1252 encodings to avoid codec errors.
    """
    try:
        with open(path, 'rb') as fh:
            magic = fh.read(2)
        if magic == b'\x1f\x8b':
            # gzip-compressed CSV
            return pd.read_csv(path, compression='gzip', **kwargs)
    except OSError:
        pass

    for encoding in ('utf-8', 'utf-8-sig', 'latin-1', 'cp1252'):
        try:
            return pd.read_csv(path, encoding=encoding, **kwargs)
        except UnicodeDecodeError:
            continue
    return pd.read_csv(path, encoding='latin-1', **kwargs)


def normalize_columns(df, expected):
    """Normalize column names: strip whitespace, case-insensitive match to expected."""
    rename = {}
    expected_norm = {_norm(e): e for e in expected}
    for raw_col in df.columns:
        key = _norm(raw_col)
        if key in expected_norm:
            rename[raw_col] = expected_norm[key]
    return df.rename(columns=rename)


def get_current_input_path():
    """Return path to current input file (any extension)."""
    for ext in ('.xlsx', '.xls', '.csv'):
        p = os.path.join(INPUT_DIR, INPUT_CURRENT + ext)
        if os.path.isfile(p):
            return p
    return None


def read_input_file(path):
    """Read Excel or CSV into DataFrame with normalized columns."""
    if path.endswith('.csv'):
        df = pd.read_csv(path)
    else:
        df = pd.read_excel(path, engine='openpyxl' if path.endswith('.xlsx') else 'xlrd')
    df = normalize_columns(df, INPUT_COLUMNS)
    missing = [c for c in INPUT_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f'Missing required columns: {missing}')
    return df


def read_mapping():
    """Read Mapping file from process/; normalize column names (e.g. Gartner Mappig -> Gartner Mapping)."""
    path = os.path.join(PROCESS_DIR, MAPPING_FILENAME)
    if not os.path.isfile(path):
        raise FileNotFoundError(f'Mapping file not found: {path}')
    df = pd.read_excel(path, engine='openpyxl')
    df.columns = [c.strip() for c in df.columns]
    all_mapping_cols = MAPPING_COLUMNS_REQUIRED + [MAPPING_COLUMN_RECOMMENDED_GARTNER]
    mapping_norm = {_norm(e): e for e in all_mapping_cols}
    rename = {}
    for raw in df.columns:
        key = _norm(raw)
        if key in mapping_norm:
            rename[raw] = mapping_norm[key]
        elif key.replace('p', '') == _norm('Gartner Mapping').replace('p', ''):  # Gartner Mappig
            rename[raw] = 'Gartner Mapping'

    df = df.rename(columns=rename)
    for col in MAPPING_COLUMNS_REQUIRED:
        if col not in df.columns:
            raise ValueError(f'Mapping file missing column: {col}. Found: {list(df.columns)}')
    if MAPPING_COLUMN_RECOMMENDED_GARTNER not in df.columns:
        df[MAPPING_COLUMN_RECOMMENDED_GARTNER] = ''
    return df


def read_gartner_mapping():
    """Read Gartner mapping from process/ as a normal Excel or CSV file.

    Preferred file is ``Gartner-mapping.xlsx`` (easy to edit in Excel).
    If that doesn't exist, falls back to ``Gartner-mapping.csv``.

    Expected columns:
      Category, Sub-Category, Gartner Mapping, Market Leaders, Recommended Gartner Apps

    Key for joining with process data is Sub-Category.
    """
    # Prefer Excel for easier manual editing
    xlsx_path = os.path.join(PROCESS_DIR, 'Gartner-mapping.xlsx')
    csv_path = os.path.join(PROCESS_DIR, GARTNER_MAPPING_CSV)

    if os.path.isfile(xlsx_path):
        df = pd.read_excel(xlsx_path, engine='openpyxl')
    elif os.path.isfile(csv_path):
        df = _read_csv_safe(csv_path)
    else:
        raise FileNotFoundError(
            f'Gartner mapping file not found. Expected either {xlsx_path} or {csv_path}.'
        )
    df.columns = [c.strip() for c in df.columns]

    # Normalize column names, allowing legacy L1/L2 as aliases for Category/Sub-Category
    expected_norm = {_norm(e): e for e in GARTNER_MAPPING_COLUMNS}
    rename = {}
    for raw in df.columns:
        key = _norm(raw)
        # Direct match on expected names
        if key in expected_norm:
            rename[raw] = expected_norm[key]
        # Legacy aliases: L1 -> Category, L2 -> Sub-Category
        elif key == _norm('L1'):
            rename[raw] = 'Category'
        elif key == _norm('L2'):
            rename[raw] = 'Sub-Category'

    df = df.rename(columns=rename)

    # Category is useful for readability but not strictly required, since we already
    # know Category from process.csv. We only require the join key (Sub-Category)
    # and the Gartner fields.
    required = ['Sub-Category', 'Gartner Mapping', 'Market Leaders', MAPPING_COLUMN_RECOMMENDED_GARTNER]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f'Gartner mapping file missing required columns: {missing}. Found: {list(df.columns)}')

    # If Category is missing in the mapping file, it will be taken from process.csv later.
    if 'Category' not in df.columns:
        df['Category'] = ''
    return df


def upload_summary(df):
    """Compute Application Type | Count | Total Spend."""
    if 'Application Type' not in df.columns or 'Spend' not in df.columns:
        return []
    df = df.copy()
    df['Spend'] = pd.to_numeric(df['Spend'], errors='coerce').fillna(0)
    g = df.groupby('Application Type', dropna=False).agg(
        count=('Application Type', 'size'),
        totalSpend=('Spend', 'sum')
    ).reset_index()
    out = []
    for _, row in g.iterrows():
        out.append({
            'applicationType': str(row['Application Type']),
            'count': int(row['count']),
            'totalSpend': float(row['totalSpend']),
        })
    return out


def map_cmdb():
    """Join input with Mapping on SysID, add L1/L2, write process/process.csv, return pivot."""
    path = get_current_input_path()
    if not path:
        raise FileNotFoundError('No input file found in input/')
    inp = read_input_file(path)
    mapping = read_mapping()
    mapping_sub = mapping[['SysID', 'L1', 'L2']].copy()
    merged = inp.merge(mapping_sub, on='SysID', how='left')
    merged['L1'] = merged['L1'].fillna('N/A')
    merged['L2'] = merged['L2'].fillna('N/A')
    out_path = os.path.join(PROCESS_DIR, PROCESS_CSV)
    merged.rename(columns={'L1': 'Category', 'L2': 'Sub-Category'}).to_csv(out_path, index=False)

    # output.csv for PPT: Category, Sub-Category, Count, Banner Value (sum of Spend per Category-Sub-Category)
    merged['Spend'] = pd.to_numeric(merged['Spend'], errors='coerce').fillna(0)
    pivot = merged.groupby(['L1', 'L2'], dropna=False).agg(
        Count=('L1', 'size'),
        SpendSum=('Spend', 'sum')
    ).reset_index()
    pivot['Banner Value'] = pivot['SpendSum'].apply(lambda x: f'${int(round(x))}' if pd.notna(x) else '-')
    pivot = pivot[['L1', 'L2', 'Count', 'Banner Value']].rename(columns={'L1': 'Category', 'L2': 'Sub-Category'})
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    pivot.to_csv(OUTPUT_CSV, index=False)

    # Pivot for API response: L1 | Applications count | Spend
    g = merged.groupby('L1', dropna=False).agg(
        applicationsCount=('L1', 'size'),
        spend=('Spend', 'sum')
    ).reset_index()
    out = []
    for _, row in g.iterrows():
        out.append({
            'l1': str(row['L1']),
            'applicationsCount': int(row['applicationsCount']),
            'spend': float(row['spend']),
        })
    return out


def map_gartner():
    """Add Gartner Mapping, Market Leaders, Recommended Gartner Apps to process.csv using Gartner-mapping.csv (key = Sub-Category); return filtered pivot."""
    csv_path = os.path.join(PROCESS_DIR, PROCESS_CSV)
    if not os.path.isfile(csv_path):
        raise FileNotFoundError('process/process.csv not found. Run Map CMDB first.')
    process_df = _read_csv_safe(csv_path)
    # process.csv uses Category, Sub-Category (or legacy L1, L2)
    cat_col = 'Category' if 'Category' in process_df.columns else 'L1'
    sub_col = 'Sub-Category' if 'Sub-Category' in process_df.columns else 'L2'
    gartner_df = read_gartner_mapping()
    gartner_sub = gartner_df[['Sub-Category', 'Gartner Mapping', 'Market Leaders', MAPPING_COLUMN_RECOMMENDED_GARTNER]].drop_duplicates(subset=['Sub-Category'])
    # Ensure same dtype for merge key (avoid object vs float64 when CSV has empty/numeric cells)
    process_df[sub_col] = process_df[sub_col].astype(str).str.strip()
    gartner_sub['Sub-Category'] = gartner_sub['Sub-Category'].astype(str).str.strip()
    # Use same key name for merge (process may have 'Sub-Category' or legacy 'L2')
    gartner_sub = gartner_sub.rename(columns={'Sub-Category': sub_col})
    merged = process_df.merge(gartner_sub, on=sub_col, how='left')
    merged['Gartner Mapping'] = merged['Gartner Mapping'].fillna('N/A')
    merged['Market Leaders'] = merged['Market Leaders'].fillna('')
    merged[MAPPING_COLUMN_RECOMMENDED_GARTNER] = merged[MAPPING_COLUMN_RECOMMENDED_GARTNER].fillna('')
    merged.to_csv(csv_path, index=False)

    # Pivot: Category | Sub-Category | top 5 application names by spend | Recommended Gartner Apps | Market leaders
    # Filter: Sub-Category with count > N, and Gartner Mapping != N/A
    merged['Spend'] = pd.to_numeric(merged['Spend'], errors='coerce').fillna(0)
    app_name_col = None
    for c in merged.columns:
        if _norm(c) == _norm('Applications Name'):
            app_name_col = c
            break
    if not app_name_col:
        app_name_col = merged.columns[1] if len(merged.columns) > 1 else merged.columns[0]
    l2_counts = merged.groupby([cat_col, sub_col]).size().reset_index(name='_count')
    l2_gartner = merged.groupby([cat_col, sub_col]).agg({
        'Gartner Mapping': 'first',
        'Market Leaders': 'first',
        MAPPING_COLUMN_RECOMMENDED_GARTNER: 'first',
    }).reset_index()
    l2_merged = l2_counts.merge(l2_gartner, on=[cat_col, sub_col])
    l2_merged = l2_merged[
        (l2_merged['_count'] > GARTNER_MIN_L2_COUNT) &
        (l2_merged['Gartner Mapping'].astype(str).str.strip().str.upper() != 'N/A') &
        (l2_merged['Gartner Mapping'].notna()) &
        (l2_merged['Gartner Mapping'].astype(str).str.strip() != '')
    ]
    rows = []
    for _, r in l2_merged.iterrows():
        cat_val, sub_val = r[cat_col], r[sub_col]
        subset = merged[(merged[cat_col] == cat_val) & (merged[sub_col] == sub_val)]
        top5 = subset.nlargest(5, 'Spend')[app_name_col].astype(str).tolist()
        market_leaders = subset['Market Leaders'].iloc[0] if len(subset) else ''
        rec_gartner = subset[MAPPING_COLUMN_RECOMMENDED_GARTNER].iloc[0] if len(subset) else ''
        rows.append({
            'l1': cat_val,
            'l2': sub_val,
            'top5AppNames': top5,
            'recommendedGartnerApps': str(rec_gartner).strip() if pd.notna(rec_gartner) else '',
            'marketLeaders': str(market_leaders) if pd.notna(market_leaders) else '',
        })

    return rows
