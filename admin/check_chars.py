import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:\\Users\\Victor Andre\\Desktop\\altos articulos sistema\\admin\\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the broken circled numbers (â' = ① , â'¢ = ③, â'£ = ④)
# These are UTF-8 sequences that were partially decoded incorrectly.
# ① = U+2460 = 0xE2 0x91 0xA0 in UTF-8
# ② = U+2461
# ③ = U+2462
# ④ = U+2463

# The broken versions visible in the file:
broken = [
    ('â\u2019 ', '① '),   # â' followed by space -> ①
    ('â\u2019\u00a0', '① '),  # variants
    ('â\u2019Â ', '① '),
    ('\u00e2\u2019 ', '① '),
]

# Let's print lines 2154-2162 first to see exactly what's there
lines = text.split('\n')
for i in range(2153, 2163):
    print(f'L{i+1}: {repr(lines[i])}')
