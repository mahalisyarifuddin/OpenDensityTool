
import re
import json
import urllib.request

def parse_blocks():
    url = "https://www.unicode.org/Public/latest/ucd/Blocks.txt"
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching Blocks.txt: {e}")
        return []

    ranges = []
    for line in data.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue

        # Format: Start Code..End Code; Block Name
        match = re.match(r'([0-9A-F]+)\.\.([0-9A-F]+);\s*(.+)', line)
        if match:
            start = int(match.group(1), 16)
            end = int(match.group(2), 16)
            name = match.group(3)
            ranges.append([start, end, name])
    return ranges

if __name__ == "__main__":
    ranges = parse_blocks()
    print(json.dumps(ranges))
