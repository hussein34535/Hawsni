const fs = require('fs');
const path = 'd:/Hawsni/hawsni_backend/views/orders.ejs';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Edit button to the action cell (more specific matching)
const actionTarget = '<button class="btn-icon text-danger"';
const editButton = `<button class="btn-icon" onclick="openEditModal('<%= order.id %>', '<%= cName.replace(/'/g, "\\'") %>', '<%= cPhone.replace(/'/g, "\\'") %>', '<%= (cAddr || "").replace(/\\n|\\r/g, " ").replace(/'/g, "\\'") %>', '<%= order.total %>')" title="تعديل الطلب" style="color: var(--info);">
                                                <i class="fas fa-edit"></i>
                                             </button>\n                                             `;

if (content.includes(actionTarget) && !content.includes('openEditModal')) {
    content = content.replace(actionTarget, editButton + actionTarget);
}

// 2. Add the Modal at the end of the file
const modalHtml = `
<!-- Edit Order Modal -->
<div id="editOrderModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;">
    <div class="modal-content" style="background:#fff; padding:25px; border-radius:15px; width:90%; max-width:500px; position:relative; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <h3 style="margin:0; color:var(--brand-primary);">تعديل بيانات الطلب</h3>
            <button onclick="closeEditModal()" style="background:none; border:none; font-size:24px; cursor:pointer; color:#999;">&times;</button>
        </div>
        <form id="editOrderForm" onsubmit="submitOrderEdit(event)">
            <input type="hidden" id="edit-order-id">
            <div style="margin-bottom:15px;">
                <label style="display:block; margin-bottom:5px; font-weight:bold; font-size:0.9rem;">اسم العميل</label>
                <input type="text" id="edit-customer-name" style="width:100%; height:45px; padding:0 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:1rem;" required>
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block; margin-bottom:5px; font-weight:bold; font-size:0.9rem;">رقم الهاتف</label>
                <input type="text" id="edit-customer-phone" style="width:100%; height:45px; padding:0 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:1rem;" required>
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block; margin-bottom:5px; font-weight:bold; font-size:0.9rem;">العنوان بالتفصيل</label>
                <textarea id="edit-customer-address" style="width:100%; height:90px; padding:12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:1rem; resize:vertical;" required></textarea>
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block; margin-bottom:5px; font-weight:bold; font-size:0.9rem;">إجمالي المبلغ (ج.م)</label>
                <input type="number" id="edit-order-total" style="width:100%; height:45px; padding:0 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:1rem;" required>
            </div>
            <div style="display:flex; gap:12px; margin-top:25px;">
                <button type="submit" class="btn" style="flex:1; background:var(--brand-primary); color:#fff; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">حفظ التعديلات</button>
                <button type="button" onclick="closeEditModal()" class="btn" style="flex:1; background:#f1f5f9; color:#475569; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">إلغاء</button>
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

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = 'جاري الحفظ...';
    btn.disabled = true;

    try {
        const response = await fetch(\`/admin/orders/\${id}/update\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'تم التحديث',
                text: 'تم تحديث بيانات الطلب بنجاح',
                timer: 1500,
                showConfirmButton: false
            }).then(() => window.location.reload());
        } else {
            Swal.fire('خطأ', result.message, 'error');
        }
    } catch (err) {
        console.error('Update Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالسيرفر', 'error');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editOrderModal');
    if (event.target == modal) {
        closeEditModal();
    }
}
</script>
`;

if (!content.includes('id="editOrderModal"')) {
    content += modalHtml;
}

fs.writeFileSync(path, content, 'utf8');
console.log('Orders view updated with Modal at the end.');
