import pandas as pd
import os
from config import INPUT_DIR, PROCESS_DIR, OUTPUT_DIR, INPUT_COLUMNS, MAPPING_COLUMNS, MAPPING_FILENAME, PROCESS_CSV, INPUT_CURRENT, GARTNER_MIN_L2_COUNT


def _norm(s):
    return (s or '').strip().lower().replace(' ', '').replace('_', '')


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
    # Normalize to expected names (handle typos / variations)
    mapping_norm = {_norm(e): e for e in MAPPING_COLUMNS}
    rename = {}
    for raw in df.columns:
        key = _norm(raw)
        if key in mapping_norm:
            rename[raw] = mapping_norm[key]
        elif key.replace('p', '') == _norm('Gartner Mapping').replace('p', ''):  # Gartner Mappig
            rename[raw] = 'Gartner Mapping'

    df = df.rename(columns=rename)
    for col in MAPPING_COLUMNS:
        if col not in df.columns:
            raise ValueError(f'Mapping file missing column: {col}. Found: {list(df.columns)}')
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
    merged.to_csv(out_path, index=False)
    # Pivot: L1 | Applications count | Spend
    merged['Spend'] = pd.to_numeric(merged['Spend'], errors='coerce').fillna(0)
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
    """Add Gartner Mapping and Market Leaders to process.csv; return filtered pivot."""
    csv_path = os.path.join(PROCESS_DIR, PROCESS_CSV)
    if not os.path.isfile(csv_path):
        raise FileNotFoundError('process/process.csv not found. Run Map CMDB first.')
    process_df = pd.read_csv(csv_path)
    mapping = read_mapping()
    mapping_sub = mapping[['SysID', 'Gartner Mapping', 'Market Leaders']].copy()
    merged = process_df.merge(mapping_sub, on='SysID', how='left')
    merged['Gartner Mapping'] = merged['Gartner Mapping'].fillna('N/A')
    merged['Market Leaders'] = merged['Market Leaders'].fillna('N/A')
    merged.to_csv(csv_path, index=False)

    # Pivot: L1 | L2 | top 5 application names by spend | Market leaders (by L2)
    # Filter: L2 with count > N, and Gartner Mapping != N/A
    merged['Spend'] = pd.to_numeric(merged['Spend'], errors='coerce').fillna(0)
    app_name_col = None
    for c in merged.columns:
        if _norm(c) == _norm('Applications Name'):
            app_name_col = c
            break
    if not app_name_col:
        app_name_col = merged.columns[1] if len(merged.columns) > 1 else merged.columns[0]
    l2_counts = merged.groupby(['L1', 'L2']).size().reset_index(name='_count')
    l2_gartner = merged.groupby(['L1', 'L2'])['Gartner Mapping'].first().reset_index()
    l2_merged = l2_counts.merge(l2_gartner, on=['L1', 'L2'])
    l2_merged = l2_merged[
        (l2_merged['_count'] > GARTNER_MIN_L2_COUNT) &
        (l2_merged['Gartner Mapping'].astype(str).str.strip().str.upper() != 'N/A') &
        (l2_merged['Gartner Mapping'].notna()) &
        (l2_merged['Gartner Mapping'].astype(str).str.strip() != '')
    ]
    rows = []
    for _, r in l2_merged.iterrows():
        l1, l2 = r['L1'], r['L2']
        subset = merged[(merged['L1'] == l1) & (merged['L2'] == l2)]
        top5 = subset.nlargest(5, 'Spend')[app_name_col].astype(str).tolist()
        market_leaders = subset['Market Leaders'].iloc[0] if len(subset) else ''
        rows.append({
            'l1': l1,
            'l2': l2,
            'top5AppNames': top5,
            'marketLeaders': str(market_leaders) if pd.notna(market_leaders) else ''
        })

    # Write output.csv: pivot L1 | L2 | Count of apps
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    pivot_out = merged.groupby(['L1', 'L2'], dropna=False).size().reset_index(name='Count of apps')
    pivot_out.to_csv(os.path.join(OUTPUT_DIR, 'output.csv'), index=False)

    return rows
