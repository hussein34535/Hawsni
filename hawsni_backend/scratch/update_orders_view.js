const fs = require('fs');
const path = 'd:/Hawsni/hawsni_backend/views/orders.ejs';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Edit button to the action cell
const actionTarget = `<button class="btn-icon text-danger"`;
const editButton = `<button class="btn-icon" onclick="openEditModal('<%= order.id %>', '<%= cName.replace(/'/g, "\\'") %>', '<%= cPhone.replace(/'/g, "\\'") %>', '<%= cAddr.replace(/\\n|\\r/g, ' ').replace(/'/g, "\\'") %>', '<%= order.total %>')" title="تعديل الطلب" style="color: var(--info);">
                                                <i class="fas fa-edit"></i>
                                             </button>\n                                             `;

if (content.includes(actionTarget)) {
    // Only replace the first occurrence in the template if we are doing a broad search, 
    // but here it's inside a loop. This is why replace_file_content is better if we have the right content.
    // However, since it's a template, we can just replace the string.
    content = content.replace(actionTarget, editButton + actionTarget);
}

// 2. Add the Modal at the end of the file (before script or footer)
const modalHtml = `
<!-- Edit Order Modal -->
<div id="editOrderModal" class="modal">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h3>تعديل بيانات الطلب</h3>
            <button class="close-btn" onclick="closeEditModal()">&times;</button>
        </div>
        <form id="editOrderForm" onsubmit="submitOrderEdit(event)">
            <input type="hidden" id="edit-order-id">
            <div style="margin-bottom: 15px;">
                <label style="display:block; margin-bottom:5px; font-weight:bold;">اسم العميل</label>
                <input type="text" id="edit-customer-name" class="status-select" style="width:100%; height:40px; padding:0 10px;" required>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display:block; margin-bottom:5px; font-weight:bold;">رقم الهاتف</label>
                <input type="text" id="edit-customer-phone" class="status-select" style="width:100%; height:40px; padding:0 10px;" required>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display:block; margin-bottom:5px; font-weight:bold;">العنوان</label>
                <textarea id="edit-customer-address" class="status-select" style="width:100%; height:80px; padding:10px;" required></textarea>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display:block; margin-bottom:5px; font-weight:bold;">إجمالي المبلغ (ج.م)</label>
                <input type="number" id="edit-order-total" class="status-select" style="width:100%; height:40px; padding:0 10px;" required>
            </div>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button type="submit" class="btn btn-primary" style="flex:1;">حفظ التعديلات</button>
                <button type="button" class="btn btn-secondary" onclick="closeEditModal()" style="flex:1;">إلغاء</button>
            </div>
        </form>
    </div>
</div>

<script>
function openEditModal(id, name, phone, address, total) {
    document.getElementById('edit-order-id').value = id;
    document.getElementById('edit-customer-name').value = name;
    document.getElementById('edit-customer-phone').value = phone;
    document.getElementById('edit-customer-address').value = address;
    document.getElementById('edit-order-total').value = total;
    document.getElementById('editOrderModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editOrderModal').style.display = 'none';
}

async function submitOrderEdit(event) {
    event.preventDefault();
    const id = document.getElementById('edit-order-id').value;
    const data = {
        customerName: document.getElementById('edit-customer-name').value,
        customerPhone: document.getElementById('edit-customer-phone').value,
        customerAddress: document.getElementById('edit-customer-address').value,
        total: document.getElementById('edit-order-total').value
    };

    try {
        const response = await fetch(\`/admin/orders/\${id}/update\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': '<%= typeof csrfToken !== "undefined" ? csrfToken : "" %>'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            alert('تم التحديث بنجاح');
            window.location.reload();
        } else {
            alert('خطأ: ' + result.message);
        }
    } catch (err) {
        console.error('Update Error:', err);
        alert('حدث خطأ أثناء الاتصال بالسيرفر');
    }
}
</script>
`;

if (!content.includes('id="editOrderModal"')) {
    content = content.replace('</body>', modalHtml + '\n</body>');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Orders view updated successfully.');
