async function test() {
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer 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',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://hawsni.com',
            'X-Title': 'Hawsni Scraper'
        },
        body: JSON.stringify({
            model: "arcee-ai/trinity-large-preview:free",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Say hello!" }
            ]
        })
    });

    console.log("Status:", aiResponse.status);
    const text = await aiResponse.text();
    console.log("Body:", text);
}

test();
