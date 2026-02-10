"""
PPT_components package for PowerPoint generation utilities.
"""

from .presentation import draw_group_boxes, add_slide_notes
from .utils import analyze_format, extract_number, format_number

__all__ = [
    'draw_group_boxes',
    'add_slide_notes',
    'analyze_format',
    'extract_number',
    'format_number'
]
