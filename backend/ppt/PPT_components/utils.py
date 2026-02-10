"""
Utility functions for data formatting and text processing.
"""

def analyze_format(text):
    """Analyze the format of a banner value string"""
    if text == '-' or not text:
        return None
    
    format_info = {
        'prefix': '',
        'suffix': '',
        'has_commas': False,
        'decimal_places': 0
    }
    
    # Find the first number in the string
    number_start = -1
    number_end = -1
    decimal_pos = -1
    for i, char in enumerate(text):
        if char.isdigit():
            if number_start == -1:
                number_start = i
            number_end = i
        elif char == '.' and number_start != -1:
            decimal_pos = i
    
    if number_start == -1:
        return None
        
    # Extract prefix and suffix
    format_info['prefix'] = text[:number_start].strip()
    format_info['suffix'] = text[number_end + 1:].strip()
    
    # Check for commas in the number portion
    number_part = text[number_start:number_end + 1]
    format_info['has_commas'] = ',' in number_part
    
    # Count decimal places
    if decimal_pos != -1:
        format_info['decimal_places'] = len(text) - decimal_pos - 1
    
    return format_info

def extract_number(text):
    """Extract number from string, removing all non-numeric characters except decimal points"""
    if text == '-' or not text:
        return 0
    # Keep only digits and decimal points
    number_str = ''.join(char for char in text if char.isdigit() or char == '.')
    try:
        # Handle case where we might have multiple decimal points
        parts = number_str.split('.')
        if len(parts) > 1:
            # Keep first part and first decimal part if multiple decimal points
            number_str = parts[0] + '.' + parts[1]
        return float(number_str) if number_str else 0
    except ValueError:
        return 0

def format_number(number, format_info):
    """Format a number according to the analyzed format"""
    if format_info is None:
        return f"{number:,.2f}"
    
    # Create the format string based on format_info
    format_str = "{:"
    if format_info["has_commas"]:
        format_str += ","
    format_str += f".{format_info['decimal_places']}f"
    format_str += "}"
    
    # Format the number and add prefix/suffix
    formatted = format_str.format(number)
    return f"{format_info['prefix']}{formatted}{format_info['suffix']}"
