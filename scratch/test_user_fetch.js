const fetch = require('node-fetch');

fetch("https://hwasibackend.vercel.app/orders/3bad5166-7207-4fa8-ab25-850e32f659c3/bosta-ship", {
  "headers": {
    "accept": "*/*",
    "accept-language": "ar,ar-EG;q=0.9,en-EG;q=0.8,en;q=0.7,de;q=0.6",
    "content-type": "application/json",
    "cookie": "admin_token=eyJhbGciOiJIUzI1NiIsImtpZCI6IitMZHJZS3B3amc5bzNOTUsiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2JkZ3drY2Vuem1ldXZ3bWNqaGZpLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzYzgwZDZjNi02NjhiLTRjNzMtYTc3OS1jNmFmODRlZmZhMGYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc2NDgwMDUzLCJpYXQiOjE3NzY0NzY0NTMsImVtYWlsIjoiaHVzc2VpbmgyNzExQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJodXNzZWluaDI3MTFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Imhhc3ZqIGR6dmdqIiwicGhvbmUiOiIrMjAxMDE2MjcwMzk3IiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJyb2xlIjoidXNlciIsInN1YiI6IjNjODBkNmM2LTY2OGItNGM3My1hNzc5LWM2YWY4NGVmZmEwZiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzc1OTM2Njk2fV0sInNlc3Npb25faWQiOiJhNmY3NWY0ZC03YjY2LTQ0N2UtODhmMi04ZjFjNzE4NzdmMGEiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.yfqU0PvJos1pI7SsCrcqCCU7LGmOi4yz4Ww58D1e8e4", // used old one from top as it wasn't provided in the last snippet
    "sec-ch-ua": "\"Google Chrome\";v=\"147\", \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"147\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
  },
  "body": "{\"size\":\"MEDIUM\",\"allowToOpenPackage\":true}",
  "method": "POST",
  "mode": "cors"
}).then(r=>r.text()).then(console.log).catch(console.error);
