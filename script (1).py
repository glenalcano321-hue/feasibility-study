
# Read the full HTML file to convert to TSX
with open('paste.txt', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Since this is a complete HTML file with embedded styles and scripts,
# I'll create a comprehensive TSX conversion
print("HTML file loaded successfully")
print(f"Total length: {len(html_content)} characters")

# Check if it has script tags
import re
has_scripts = bool(re.search(r'<script[^>]*>.*?</script>', html_content, re.DOTALL))
has_styles = bool(re.search(r'<style[^>]*>.*?</style>', html_content, re.DOTALL))

print(f"Has scripts: {has_scripts}")
print(f"Has styles: {has_styles}")

# Extract key sections
style_match = re.search(r'<style[^>]*>(.*?)</style>', html_content, re.DOTALL)
script_match = re.search(r'<script[^>]*>(?!.*firebase)(.*?)</script>', html_content, re.DOTALL)

if style_match:
    print(f"\nStyles found: {len(style_match.group(1))} characters")
if script_match:
    print(f"Scripts found: Yes")
