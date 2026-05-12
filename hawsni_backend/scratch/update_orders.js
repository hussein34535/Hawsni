const fs = require('fs');
const path = 'd:/Hawsni/hawsni_backend/views/orders.ejs';
let content = fs.readFileSync(path, 'utf8');

const target = `<div class="customer-phone">
                                                    <%= cPhone %>
                                                </div>`;

const replacement = `<div class="customer-phone" style="display: flex; align-items: center; gap: 8px;">
                                                    <%= cPhone %>
                                                    <% 
                                                       let cp = (typeof cPhone === 'string' ? cPhone : '').replace(/\\D/g, '');
                                                       if (cp.startsWith('01') && cp.length === 11) cp = '2' + cp;
                                                    %>
                                                    <a href="/admin/chat?sessionId=<%= cp %>" onclick="event.stopPropagation()" title="فتح المحادثة" style="color: #25d366; text-decoration: none;">
                                                       <i class="fab fa-whatsapp"></i>
                                                    </a>
                                                </div>`;

// Try with different line endings and spaces
if (content.includes(target)) {
    content = content.replace(target, replacement);
} else {
    // Fallback: search by partial match if exact match fails
    console.log('Exact match failed, trying partial...');
    const regex = /<div class="customer-phone">\s*<%= cPhone %>\s*<\/div>/g;
    content = content.replace(regex, replacement);
}

fs.writeFileSync(path, content, 'utf8');
console.log('File updated successfully.');
