// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // Add styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Confirmation Dialog
function showConfirm(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
        <div class="confirm-dialog">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f39c12; margin-bottom: 1rem;"></i>
            <p style="font-size: 1.1rem; margin-bottom: 1.5rem;">${message}</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="btn btn-secondary confirm-cancel">إلغاء</button>
                <button class="btn btn-danger confirm-ok">تأكيد</button>
            </div>
        </div>
    `;

    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    const dialog = overlay.querySelector('.confirm-dialog');
    dialog.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
        animation: scaleIn 0.3s ease;
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.confirm-cancel').addEventListener('click', () => {
        overlay.remove();
    });

    overlay.querySelector('.confirm-ok').addEventListener('click', () => {
        overlay.remove();
        if (typeof onConfirm === 'function') onConfirm();
    });
}

// Image Preview
function previewImage(input, previewElement) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            previewElement.src = e.target.result;
            previewElement.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Form Validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;

    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            field.style.borderColor = '#ecf0f1';
        }
    });

    if (!isValid) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
    }

    return isValid;
}

// Delete Handler
// Delete Handler
async function handleDelete(url, itemName) {
    // 1. Ask for confirmation
    showConfirm(`هل أنت متأكد من حذف ${itemName}؟`, async () => {

        // 2. Sanitize URL (fix common issues like /products//delete)
        url = url.replace(/([^:]\/)\/+/g, "$1");

        // 3. Validation: Check if ID is likely missing
        if (url.endsWith('/delete') && (url.split('/').length < 4)) {
            // Heuristic: URL like /products/delete is too short, needs ID
            showToast('خطأ: رابط الحذف غير صحيح (رقم العنصر مفقود)', 'error');
            return;
        }

        try {
            // 4. Try Standard DELETE Request
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showToast('تم الحذف بنجاح', 'success');
                setTimeout(() => location.reload(), 1000);
            } else if (response.status === 404 || response.status === 405) {
                // 5. Fallback: Try POST with _method=DELETE (for legacy support)
                console.warn('DELETE failed, trying POST fallback...');
                const formData = new URLSearchParams();
                formData.append('_method', 'DELETE');

                const fallbackRes = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });

                if (fallbackRes.ok) {
                    showToast('تم الحذف بنجاح (Fallback)', 'success');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    const data = await fallbackRes.json().catch(() => ({}));
                    showToast(data.message || 'حدث خطأ أثناء الحذف', 'error');
                }
            } else {
                const data = await response.json().catch(() => ({}));
                showToast(data.message || 'حدث خطأ أثناء الحذف', 'error');
            }
        } catch (error) {
            console.error('Delete Error:', error);
            showToast('حدث خطأ أثناء الحذف', 'error');
        }
    });
}

// Toggle Active Status
async function toggleActive(url, currentStatus) {
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: !currentStatus })
        });

        if (response.ok) {
            showToast('تم تحديث الحالة بنجاح', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast('حدث خطأ', 'error');
        }
    } catch (error) {
        showToast('حدث خطأ', 'error');
    }
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuToggle && sidebar && overlay) {
        function toggleMenu() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        }

        menuToggle.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        // Close on link click (for mobile SPA-like feel if needed)
        sidebar.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) toggleMenu();
            });
        });
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translate(-50%, 0);
            opacity: 1;
        }
        to {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
    }
    
    @keyframes scaleIn {
        from {
            transform: scale(0.9);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
