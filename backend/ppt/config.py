"""
Configuration for PPT generation. Paths point to project output/ and backend/ppt/PPT_components/.
"""
from pathlib import Path

# Project root (App-Rat)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / "output"
PPT_DIR = Path(__file__).resolve().parent
PPT_COMPONENTS_DIR = PPT_DIR / "PPT_components"

INPUT_CSV_PATH = OUTPUT_DIR / "output.csv"
OUTPUT_PPT_PATH = OUTPUT_DIR / "output.pptx"
DEFAULT_THEME_PATH = PPT_COMPONENTS_DIR / "Template.pptx"

TEMPLATE_SLIDE_IDX = 0
SOURCE_TEXT = "Client CMDB Data"

# Shape settings (inches)
RECT_WIDTH = 1.32
RECT_HEIGHT = 0.28
OVAL_SIZE = 0.28
OVERLAP = 0.14
PILL_SPACING = 0.32
GROUP_MARGIN = 0.05
TOP_MARGIN = 1.5
LEFT_MARGIN = 0.0
BOTTOM_MARGIN = 0.1
RIGHT_MARGIN = 0.0
BOXES_PER_ROW_FIRST = 4
BOXES_PER_ROW_OTHER = 3

COLOR_RANGES = {
    # 0–6 apps
    "Green": (0, 6, "287819"),
    # 7–12 apps
    "Yellow": (7, 12, "E18719"),
    # >12 apps
    "Red": (13, 999, "A52323")
}
COLOR_MAP = {
    "Green": "287819",
    "Yellow": "E18719",
    "Red": "A52323",
    "White": "FFFFFF"
}

EXPECTED_COLUMNS = ["Category", "Sub-Category", "Count", "Banner Value"]

TEXT_SHORTENING_MAP = {
    "Software Development & Management": "Software Dev. & Management",
    "Cloud Services & SaaS Management": "Cloud Services & SaaS Mgmt.",
    "IT Service Management & Support": "IT Service Mgmt. & Support",
    "Performance, Training & Change Management": "Perf, Training & Change Mgmt.",
    "Security Education & Awareness": "Security Edu. & Awareness",
    "Internal Communication & Employee Engagement": "Internal Comm. & Employee Engmt.",
    "Customer Engagement & Digital Experience": "Cust. Engagement & Digital Experience",
    "Brand, Product & E-commerce Management": "Brand, Product & E-Comm Mgmt."
}

FONT_NAME = "Arial"
PILL_TEXT_FONT_SIZE = 8
LEGEND_FONT_SIZE = 10
GROUP_LABEL_FONT_SIZE = 10
SLIDE_TITLE = "Application Rationalization Heatmap"

CONVERT_TO_MILLIONS = True
COST_DECIMAL_PLACES = 1
COST_PREFIX = "$"
COST_SUFFIX = "M"
TEXT_WIDTH_FACTOR = 0.6

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
