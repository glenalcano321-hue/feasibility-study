
# Read the HTML file
with open('paste.txt', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Display first 3000 characters to understand the structure
print("File length:", len(html_content))
print("\nFirst 3000 characters:")
print(html_content[:3000])
