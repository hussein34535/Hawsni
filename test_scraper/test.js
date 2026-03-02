const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function test() {
    try {
        const { data } = await axios.get('https://eg.angazny.com/product/viewproduct/2750', {
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-language': 'ar,ar-EG;q=0.9,en-EG;q=0.8,en;q=0.7,de;q=0.6',
                'cookie': 'cw_conversation=eyJhbGciOiJIUzI1NiJ9.eyJzb3VyY2VfaWQiOiI3ZGVjNTExZi00ODUyLTQ0MzItOWNkZS04ZGYwNTg2OWYzYTciLCJpbmJveF9pZCI6MX0.BhIG3FsZIuRsrKXZbDBKZdUsVVvkvLVgd-u_4VlNYDw; cw_user_V7c5dGGTBn8BiyhK5QUuuMqo=8397310bd345116ce0a9549d59f0d85a; XSRF-TOKEN=eyJpdiI6Ii9RSDhlOHZCR0JkSW5yc1YzUjRWV1E9PSIsInZhbHVlIjoiUnRGS0FEREJ3ak5maEY5OUp5U3ZpZzAyRE9KR3NWWERLSzZydTRlNzgzRzRwcUYrWi9taERIamlqNkJydHZSRFZ2bk5SQ1d4NlpydnErOWhJUThKRGoyd1AwSmZtRUlhTWpuTEg2QlR1Y0k1eEpoV3dPTlJBNHRvQm9leUJrcXciLCJtYWMiOiI0NmNmN2E3NjI1ZTg1MzBlZDZlM2Q0ZTZmNWVlNGQyYzhlODRkYWYzM2MzYTE3NThlMWMzMTc3ZmIxY2YzNTA1IiwidGFnIjoiIn0%3D; angazny_session=eyJpdiI6Imh0eTV6eFJIQXdvNHp0bElPcnc2K3c9PSIsInZhbHVlIjoiNWMzZU1LUGE0ZVB2V25DYitZU2RHRnd5TzRSanZoOWJ0NnlUMGU2K3d6TmZ5MEZxNmFORE9RR3FIRWpMZkhKME1IekYwSzQyRmtJVXNBQWJBY3ZLNXlDM3Zxc3dsOWZkOUtWQjc1RjNHTjZtQW9qUXBQaWVuQXdycFBIZ2VLbDgiLCJtYWMiOiJiMmMxZjAwZmQ3YzA5MmZhMTRiYzAyMTNiMDAxNzJlY2RiNzkwODhhZGE1M2QzYmViNTQ2MmExNjk1MTRlMDExIiwidGFnIjoiIn0%3D',
                'dnt': '1',
                'priority': 'u=0, i',
                'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
            }
        });
        fs.writeFileSync('page.html', data);
        const $ = cheerio.load(data);

        console.log("=== Title ===");
        console.log("h1:", $('h1').text().trim());
        console.log("h2:", $('h2').text().trim());
        console.log("h3:", $('h3').text().trim());
        console.log("h4:", $('h4').first().text().trim());
        console.log(".prodect-text:", $('.prodect-text').text().trim());
        console.log(".product-title:", $('.product-title').text().trim());

        console.log("\n=== Price ===");
        console.log(".price:", $('.price').text().trim());
        console.log(".product-price:", $('.product-price').text().trim());
        console.log(".amount:", $('.amount').text().trim());

        console.log("\n=== Description ===");
        console.log("#description:", $('#description').text().trim().substring(0, 50));
        console.log(".description:", $('.description').text().trim().substring(0, 50));
        console.log(".component-What:", $('.component-What').text().trim().substring(0, 50));
        let maxText = "";
        let maxClass = "";
        $('div').each((i, el) => {
            const text = $(el).text().trim();
            if (text.includes('وصف') || text.includes('تفاصيل') || text.includes('Description') || text.includes('المقاسات')) {
                if (text.length > 50 && $(el).attr('class')) {
                    if (text.length > maxText.length) {
                        maxText = text;
                        maxClass = $(el).attr('class');
                    }
                }
            }
        });
        console.log(`Largest descriptor div class: ${maxClass}`);

        console.log("\n=== Images ===");
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            if (src && (src.includes('upload') || src.includes('product') || src.includes('imgs'))) {
                console.log(src);
            }
        });

        console.log("\n=== Tables ===");
        $('table').each((i, el) => {
            console.log("Table class:", $(el).attr('class'));
            const rows = $(el).find('tr');
            rows.each((j, tr) => {
                if (j < 3) {
                    const cols = $(tr).find('td, th').map((k, td) => $(td).text().trim()).get();
                    console.log("  Row:", cols.join(' | '));
                }
            });
        });

        console.log("\n=== OG Meta Tags ===");
        console.log("og:title", $('meta[property="og:title"]').attr('content'));
        console.log("og:description", $('meta[property="og:description"]').attr('content'));
        console.log("og:image", $('meta[property="og:image"]').attr('content'));

    } catch (e) {
        console.error(e.message);
    }
}
test();
