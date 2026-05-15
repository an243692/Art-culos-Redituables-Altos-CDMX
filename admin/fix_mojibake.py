import sys
import re

def fix_mojibake(text):
    mapping = {
        'Ã¡': 'á',
        'Ã©': 'é',
        'Ã\xad': 'í',  # \xad is the byte for soft hyphen, but wait... Ã­ is \xc3\xad which is \xc3\xad in latin1
        'Ã³': 'ó',
        'Ãº': 'ú',
        'Ã±': 'ñ',
        'Ã\x81': 'Á',
        'Ã\x89': 'É',
        'Ã\x8d': 'Í',
        'Ã\x93': 'Ó',
        'Ã\x9a': 'Ú',
        'Ã\x91': 'Ñ',
        'â€”': '—',
        'Â¿': '¿',
        'Â¡': '¡',
        'Â°': '°',
        'Â´': '´',
        'Â¨': '¨',
        'Ã¼': 'ü',
        'Ã\x9c': 'Ü',
        'â€œ': '“',
        'â€\x9d': '”',
        'â€˜': '‘',
        'â€™': '’',
        'â€¢': '•',
        'â€¦': '…',
        'Â': ' '
    }
    # Be careful with the 'Ã­'. It is actually "Ã" followed by "xad"
    # Actually it's easier to just decode via cp1252 to utf-8 where possible.
    
    # We will find substrings that are garbled
    # Actually, let's just do a manual replace, but use the correct literal characters.
    
    # Let's read the file as bytes, then decode as utf-8, then write a regex that matches
    # typical utf8 sequences interpreted as cp1252.
    pass

with open('c:\\Users\\Victor Andre\\Desktop\\altos articulos sistema\\admin\\index.html', 'rb') as f:
    content = f.read()
    text = content.decode('utf-8')

# A reliable way: we can convert the whole string to bytes using cp1252, and then decode with utf-8.
# But there might be some characters that are ALREADY valid utf-8 and weren't double encoded.
# The user's file has some correct and some incorrect? No, it's usually all incorrect.

def fix_string(s):
    try:
        # Encode back to cp1252 to get original bytes, then decode as utf-8
        bytes_cp1252 = s.encode('cp1252')
        return bytes_cp1252.decode('utf-8')
    except:
        return s

# We can replace substrings matching utf8-mojibake pattern
# UTF-8 encoded sequences interpreted as cp1252 are sequences of characters in the cp1252 range.
# For example, Spanish characters take 2 bytes in UTF-8, which start with \xc3.
# In cp1252, \xc3 is Ã.
# So anything starting with Ã followed by another cp1252 character is a strong candidate.
# â is \xe2, which is the start of 3-byte utf-8 sequences (like dashes, quotes).

def replace_mojibake(match):
    mojibake = match.group(0)
    try:
        return mojibake.encode('cp1252').decode('utf-8')
    except:
        return mojibake

pattern = re.compile(r'[Ãâ][\x80-\xff]+')
fixed_text = pattern.sub(replace_mojibake, text)

# Just to handle Â
fixed_text = fixed_text.replace('Â ', ' ')

with open('c:\\Users\\Victor Andre\\Desktop\\altos articulos sistema\\admin\\index.html', 'wb') as f:
    f.write(fixed_text.encode('utf-8'))

print("Done. Replaced mojibake.")
