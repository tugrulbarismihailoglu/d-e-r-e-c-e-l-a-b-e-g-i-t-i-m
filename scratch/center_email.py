import os
import re

files = [
    'index.html',
    'giris/index.html',
    'kayit/index.html',
    'odeme/index.html',
    'panel/index.html',
    'bilgi/index.html',
    'kurslar/verimlilik-optimizasyonu/index.html',
    'kurslar/calisma-rotasyonlari/index.html',
    'kurslar/zaman-yonetimi/index.html',
    'kurslar/uclu-paket/index.html'
]

base_path = '/Users/tugrulbaris/Desktop/DereceLab'

# Regex pattern to match the Left Section of the footer
# It captures:
# 1. Indentation of the outer div (group 1)
# 2. Image src attribute value (group 2)
# 3. Indentation of the span/inner divs (group 3)
pattern = re.compile(
    r'(?P<indent>\s*)<!--\s*Left\s+Section:\s*Logo\s*&\s*Social\s*-->\s*'
    r'<div\s+class="flex\s+flex-col\s+items-center\s+gap-2">\s*'
    r'<div\s+class="font-black\s+text-2xl\s+text-neutral-900\s+tracking-tighter\s+cursor-pointer"\s+'
    r'onclick="window\.scrollTo\(\{top:\s*0,\s*behavior:\s*\'smooth\'\}\)">\s*'
    r'<div\s+class="flex\s+items-center\s+gap-0\.5">\s*'
    r'<img\s+alt="DereceLab\s+Logo"\s+class="w-10\s+h-10\s+object-contain\s+mr-1"\s+src="(?P<src>[^"]+)">\s*'
    r'<span>DereceLab</span>\s*'
    r'</div>\s*'
    r'</div>\s*'
    r'<span\s+class="text-xs\s+text-gray-500\s+font-medium\s+mt-2">iletisim@derecelab\.com</span>\s*'
    r'</div>',
    re.IGNORECASE
)

for file_rel_path in files:
    full_path = os.path.join(base_path, file_rel_path)
    if not os.path.exists(full_path):
        print(f"Skipping missing file: {file_rel_path}")
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = pattern.search(content)
    if match:
        indent = match.group('indent')
        src = match.group('src')
        
        replacement = (
            f"{indent}<!-- Left Section: Logo & Social -->\n"
            f"{indent}<div class=\"flex flex-col items-center gap-2 text-center\">\n"
            f"{indent}  <div class=\"font-black text-2xl text-neutral-900 tracking-tighter cursor-pointer\"\n"
            f"{indent}    onclick=\"window.scrollTo({{top: 0, behavior: 'smooth'}})\">\n"
            f"{indent}    <div class=\"flex items-center justify-center gap-0.5\">\n"
            f"{indent}      <img alt=\"DereceLab Logo\" class=\"w-10 h-10 object-contain mr-1\" src=\"{src}\">\n"
            f"{indent}      <span>DereceLab</span>\n"
            f"{indent}    </div>\n"
            f"{indent}  </div>\n"
            f"{indent}  <span class=\"text-xs text-gray-500 font-medium mt-1\">iletisim@derecelab.com</span>\n"
            f"{indent}</div>"
        )
        
        new_content = content[:match.start()] + replacement + content[match.end():]
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully centered email in: {file_rel_path}")
    else:
        # Let's try matching a slightly more lenient pattern if there is tabs or other whitespace
        # We can also fallback to manual replacement if needed, but this regex is pretty robust
        print(f"Failed to match pattern in: {file_rel_path}")
