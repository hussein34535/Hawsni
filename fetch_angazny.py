import requests
from bs4 import BeautifulSoup

url = 'https://eg.angazny.com/product/viewproduct/2750'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'Accept-Language': 'ar,ar-EG;q=0.9,en-EG;q=0.8,en;q=0.7,de;q=0.6',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
}
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

print("Title:")
h1 = soup.find('h1')
if h1: print('h1:', h1.text.strip())
for h in soup.find_all(['h2', 'h3', 'h4']):
    if 'product' in h.get('class', []) or 'title' in h.get('class', []):
        print(h.name, h.get('class'), h.text.strip())

print("\nPrice:")
for p in soup.find_all(lambda tag: tag.name in ['span', 'div', 'p'] and any(c in tag.get('class', []) for c in ['price', 'amount', 'product-price'])):
    print(p.name, p.get('class'), p.text.strip())

print("\nImages:")
for img in soup.find_all('img'):
    src = img.get('src', '')
    if 'product' in src or 'upload' in src or 'imgs' in src:
        print(src)

print("\nDescription:")
desc = soup.find(id='description') or soup.find(class_='description') or soup.find(class_='product-details')
if desc: print(desc.text.strip()[:200])

print("\nTables (for variants):")
for t in soup.find_all('table'):
    print(t.get('class'))
    for row in t.find_all('tr')[:2]:
        print("Row:", [c.text.strip() for c in row.find_all(['td', 'th'])])
