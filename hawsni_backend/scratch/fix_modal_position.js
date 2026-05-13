const fs = require('fs');
const path = 'd:/Hawsni/hawsni_backend/views/orders.ejs';
let content = fs.readFileSync(path, 'utf8');

// Remove the modal HTML + script that was wrongly appended after footer
const wrongModalStart = "\n<!-- Edit Order Modal -->";
const wrongScriptEnd = "</script>\n";

const startIdx = content.lastIndexOf(wrongModalStart);
if (startIdx !== -1) {
    const endIdx = content.lastIndexOf(wrongScriptEnd);
    if (endIdx !== -1) {
        content = content.substring(0, startIdx) + content.substring(endIdx + wrongScriptEnd.length);
    }
}

// Now inject BEFORE the footer include
const footerTag = `<%- include('partials/footer') %>`;
const modalAndScript = `<!-- Edit Order Modal -->
<div id="editOrderModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:99999; align-items:center; justify-content:center;">
    <div style="background:#fff; padding:25px; border-radius:15px; width:90%; max-width:500px; position:relative; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <h3 style="margin:0; color:#0E4435; font-size:1.1rem;">✏️ تعديل بيانات الطلب</h3>
            <button onclick="closeEditModal()" style="background:none; border:none; font-size:26px; cursor:pointer; color:#999; line-height:1;">&times;</button>
        </div>
        <form id="editOrderForm" onsubmit="submitOrderEdit(event)">
            <input type="hidden" id="edit-order-id">
            <div style="margin-bottom:14px;">
                <label style="display:block; margin-bottom:5px; font-weight:700; font-size:0.85rem; color:#475569;">اسم العميل</label>
                <input type="text" id="edit-customer-name" style="width:100%; height:44px; padding:0 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:0.95rem; box-sizing:border-box;" required>
            </div>
            <div style="margin-bottom:14px;">
                <label style="display:block; margin-bottom:5px; font-weight:700; font-size:0.85rem; color:#475569;">رقم الهاتف</label>
                <input type="text" id="edit-customer-phone" style="width:100%; height:44px; padding:0 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:0.95rem; box-sizing:border-box;" required>
            </div>
            <div style="margin-bottom:14px;">
                <label style="display:block; margin-bottom:5px; font-weight:700; font-size:0.85rem; color:#475569;">العنوان</label>
                <textarea id="edit-customer-address" style="width:100%; height:80px; padding:10px 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:0.95rem; resize:vertical; box-sizing:border-box;"></textarea>
            </div>
            <div style="margin-bottom:14px;">
                <label style="display:block; margin-bottom:5px; font-weight:700; font-size:0.85rem; color:#475569;">الإجمالي (ج.م)</label>
                <input type="number" id="edit-order-total" step="0.01" style="width:100%; height:44px; padding:0 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:0.95rem; box-sizing:border-box;" required>
            </div>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button type="submit" id="edit-submit-btn" style="flex:1; background:#0E4435; color:#fff; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.95rem;">حفظ التعديلات</button>
                <button type="button" onclick="closeEditModal()" style="flex:1; background:#f1f5f9; color:#475569; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.95rem;">إلغاء</button>
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

// Close when clicking outside
document.getElementById('editOrderModal').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
});

async function submitOrderEdit(event) {
    event.preventDefault();
    const id = document.getElementById('edit-order-id').value;
    const btn = document.getElementById('edit-submit-btn');
    const data = {
        customerName: document.getElementById('edit-customer-name').value,
        customerPhone: document.getElementById('edit-customer-phone').value,
        customerAddress: document.getElementById('edit-customer-address').value,
        total: document.getElementById('edit-order-total').value
    };

    btn.innerText = 'جاري الحفظ...';
    btn.disabled = true;

    try {
        const response = await fetch('/admin/orders/' + id + '/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert('✅ تم تحديث بيانات الطلب بنجاح');
            window.location.reload();
        } else {
            alert('❌ خطأ: ' + result.message);
            btn.innerText = 'حفظ التعديلات';
            btn.disabled = false;
        }
    } catch (err) {
        console.error('Update Error:', err);
        alert('❌ حدث خطأ في الاتصال');
        btn.innerText = 'حفظ التعديلات';
        btn.disabled = false;
    }
}
</script>

`;

if (content.includes(footerTag)) {
    content = content.replace(footerTag, modalAndScript + footerTag);
    console.log('Modal correctly placed BEFORE footer.');
} else {
    console.log('Footer tag not found! Appending at end...');
    content += modalAndScript;
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done.');
