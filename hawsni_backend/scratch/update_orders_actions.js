const fs = require('fs');
const path = 'd:/Hawsni/hawsni_backend/views/orders.ejs';
let content = fs.readFileSync(path, 'utf8');

const target = `<button class="btn-icon text-danger"
                                                 onclick="deleteOrder('<%= order.id %>')" title="حذف الطلب">`;

const replacement = `<% 
                                                let cleanActionPhone = (typeof cPhone === 'string' ? cPhone : '').replace(/\\D/g, '');
                                                if (cleanActionPhone.startsWith('01') && cleanActionPhone.length === 11) cleanActionPhone = '2' + cleanActionPhone;
                                             %>
                                             <a href="/admin/chat?sessionId=<%= cleanActionPhone %>" onclick="event.stopPropagation()" class="btn-icon" title="دردشة واتساب" style="color: #25d366; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">
                                                <i class="fab fa-whatsapp"></i>
                                             </a>
                                             <button class="btn-icon text-danger"
                                                 onclick="deleteOrder('<%= order.id %>')" title="حذف الطلب">`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
} else {
    console.log('Target not found, trying partial...');
    // regex for variations
    const regex = /<button class="btn-icon text-danger"\s+onclick="deleteOrder\('<%= order.id %>'\)" title="حذف الطلب">/g;
    content = content.replace(regex, replacement);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Orders actions updated.');
