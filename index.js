// ============================================
// HAIR STYLIST BOOKING SYSTEM
// WITH FORMSPREE BACKEND INTEGRATION
// ============================================

// Prices for hairstyles
const hairstylePrices = {
    "BOHO BRAIDS": 80,
    "Knotless braids": 80,
    "Twist braids": 80,
    "Braids": 70,
    "Cornrows": 30,
    "Island twist": 80,
    "French curls": 70,
    "Bantu braids": 70,
    "Tyla / half cornrow and braids": 70,
    "Box braids": 80,
    "Sewin": 70,
    "Wig installations": 60
};

// Your Revolut payment link
const REVOLUT_LINK = "https://revolut.me/a_alamuoloyede";

// Formspree endpoint
const FORMSPREE_URL = "https://formspree.io/f/xykaelob";

// Store appointments
let appointments = [];
let notifications = [];

// ============================================
// LOAD & SAVE APPOINTMENTS
// ============================================

function loadAppointments() {
    const saved = localStorage.getItem('hair_appointments');
    if (saved) {
        appointments = JSON.parse(saved);
    } else {
        appointments = [];
    }
    renderAppointments();
    updateCount();
}

function saveAppointments() {
    localStorage.setItem('hair_appointments', JSON.stringify(appointments));
    updateCount();
}

function updateCount() {
    const countSpan = document.getElementById('appointmentCount');
    if (countSpan) countSpan.innerText = appointments.length;
}

// ============================================
// SEND TO FORMSPREE BACKEND
// ============================================

async function sendToFormspree(bookingData) {
    const formData = new FormData();
    formData.append('name', bookingData.name);
    formData.append('email', bookingData.email);
    formData.append('phone', bookingData.phone);
    formData.append('serviceType', bookingData.serviceType === 'studio' ? 'Studio Visit' : 'Housecall');
    formData.append('address', bookingData.address || 'N/A');
    formData.append('hairstyle', bookingData.hairstyle);
    formData.append('duration', bookingData.duration);
    formData.append('date', bookingData.date);
    formData.append('time', bookingData.time);
    formData.append('reminderHours', bookingData.reminderHours);
    formData.append('notes', bookingData.notes || 'None');
    formData.append('totalPrice', `€${bookingData.totalPrice}`);
    formData.append('depositAmount', `€${bookingData.depositAmount}`);
    formData.append('bookingId', bookingData.id);
    formData.append('_replyto', bookingData.email);
    
    try {
        const response = await fetch(FORMSPREE_URL, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
            addNotification('📧 Booking details sent to your email and dashboard!');
            console.log('Formspree submission successful');
        } else {
            console.log('Formspree submission failed:', response.status);
        }
    } catch (error) {
        console.log('Formspree error:', error);
    }
}

// ============================================
// RENDER APPOINTMENTS
// ============================================

function renderAppointments() {
    const container = document.getElementById('bookingsList');
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = '<div class="empty-state">✨ No appointments yet.<br>Book your braids or wig style!</div>';
        return;
    }
    
    container.innerHTML = '';
    
    appointments.forEach(apt => {
        const aptDate = new Date(apt.date);
        const formattedDate = aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const serviceDisplay = apt.serviceType === 'studio' ? '📍 Studio Visit' : '🏠 Housecall';
        
        let statusClass = 'pending';
        let statusText = 'Awaiting Payment';
        
        if (apt.depositPaid) {
            statusClass = 'paid';
            statusText = 'Deposit Paid ✓';
        } else if (apt.paymentFailed) {
            statusClass = 'failed';
            statusText = 'Payment Failed';
        }
        
        const card = document.createElement('div');
        card.className = `booking-card ${statusClass}`;
        card.innerHTML = `
            <div class="booking-name">
                <span>💇 ${escapeHtml(apt.name)}</span>
                <span class="booking-hairstyle">${escapeHtml(apt.hairstyle)}</span>
            </div>
            <div class="booking-details">
                <span><i class="fas ${apt.serviceType === 'studio' ? 'fa-building' : 'fa-home'}"></i> ${serviceDisplay}</span>
                <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                <span><i class="fas fa-clock"></i> ${apt.time}</span>
            </div>
            <div class="booking-details">
                <span><i class="fas fa-hourglass"></i> ${apt.duration}</span>
                <span><i class="fas fa-euro-sign"></i> Total: €${apt.totalPrice}</span>
            </div>
            ${apt.address ? `<div class="booking-details"><span><i class="fas fa-map-pin"></i> ${escapeHtml(apt.address.substring(0, 50))}</span></div>` : ''}
            <div class="deposit-badge ${statusClass}">💰 ${statusText} (€${apt.depositAmount})</div>
            <div class="booking-actions">
                ${!apt.depositPaid ? `
                    ${!apt.paymentFailed ? `<button class="confirm-btn" data-id="${apt.id}"><i class="fas fa-check-circle"></i> Confirm Payment</button>` : ''}
                    <button class="resend-link-btn" data-id="${apt.id}"><i class="fas fa-envelope"></i> Resend Link</button>
                    ${!apt.paymentFailed ? `<button class="fail-payment-btn" data-id="${apt.id}"><i class="fas fa-times-circle"></i> Mark Failed</button>` : ''}
                ` : ''}
                <button class="edit-btn" data-id="${apt.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn" data-id="${apt.id}"><i class="fas fa-trash"></i> Delete</button>
                <button class="reminder-btn" data-id="${apt.id}"><i class="fas fa-bell"></i> Remind</button>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Add event listeners
    document.querySelectorAll('.confirm-btn').forEach(btn => {
        btn.addEventListener('click', (e) => confirmPayment(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.resend-link-btn').forEach(btn => {
        btn.addEventListener('click', (e) => resendPaymentLink(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.fail-payment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => markPaymentFailed(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openEditModal(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteAppointment(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.reminder-btn').forEach(btn => {
        btn.addEventListener('click', (e) => sendReminder(btn.getAttribute('data-id')));
    });
}

// ============================================
// NOTIFICATIONS
// ============================================

function addNotification(message) {
    const notif = {
        id: Date.now(),
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    notifications.unshift(notif);
    if (notifications.length > 20) notifications.pop();
    
    const container = document.getElementById('notifList');
    if (container) {
        if (notifications.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #aaa;">No notifications</div>';
        } else {
            container.innerHTML = notifications.map(n => `
                <div class="notif-item">
                    <div>📨 ${escapeHtml(n.message)}</div>
                    <div class="notif-time">${n.time}</div>
                </div>
            `).join('');
        }
    }
    
    const countSpan = document.getElementById('notifCount');
    if (countSpan) countSpan.innerText = notifications.length;
    console.log('NOTIFICATION:', message);
}

// ============================================
// PAYMENT & BOOKING FUNCTIONS
// ============================================

function updateDepositDisplay() {
    const hairstyleSelect = document.getElementById('hairstyle');
    const depositText = document.getElementById('depositAmountText');
    const hairstyle = hairstyleSelect?.value;
    
    if (hairstyle && hairstylePrices[hairstyle]) {
        const price = hairstylePrices[hairstyle];
        const deposit = price * 0.2;
        depositText.innerHTML = `20% deposit: €${deposit.toFixed(2)} (Total: €${price})`;
    } else {
        depositText.innerHTML = 'Select a hairstyle to see deposit';
    }
}

function toggleAddressField() {
    const serviceType = document.getElementById('serviceType')?.value;
    const addressField = document.getElementById('addressField');
    if (serviceType === 'housecall') {
        addressField.style.display = 'block';
    } else {
        addressField.style.display = 'none';
    }
}

function createBooking(event) {
    event.preventDefault();
    
    const name = document.getElementById('clientName')?.value.trim();
    const email = document.getElementById('clientEmail')?.value.trim();
    const phone = document.getElementById('clientPhone')?.value.trim();
    const serviceType = document.getElementById('serviceType')?.value;
    const address = document.getElementById('address')?.value.trim();
    const hairstyle = document.getElementById('hairstyle')?.value;
    const duration = document.getElementById('duration')?.value;
    const date = document.getElementById('appointmentDate')?.value;
    const time = document.getElementById('appointmentTime')?.value;
    const reminderHours = document.getElementById('reminderHours')?.value;
    const notes = document.getElementById('notes')?.value;
    
    if (!name || !email || !phone || !date || !time || !hairstyle) {
        addNotification('❌ Please fill all required fields');
        return;
    }
    
    if (serviceType === 'housecall' && !address) {
        addNotification('❌ Please enter your address for housecall');
        return;
    }
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        addNotification('⚠️ Please choose a future date');
        return;
    }
    
    const basePrice = hairstylePrices[hairstyle];
    const depositAmount = basePrice * 0.2;
    const bookingId = 'APT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const newBooking = {
        id: bookingId,
        name: name,
        email: email,
        phone: phone,
        serviceType: serviceType,
        address: address || '',
        hairstyle: hairstyle,
        duration: duration,
        date: date,
        time: time,
        reminderHours: parseInt(reminderHours),
        notes: notes,
        depositPaid: false,
        paymentFailed: false,
        totalPrice: basePrice,
        depositAmount: depositAmount,
        reminderHistory: [],
        createdAt: new Date().toISOString()
    };
    
    appointments.push(newBooking);
    saveAppointments();
    renderAppointments();
    
    // Send to Formspree backend
    sendToFormspree(newBooking);
    
    addNotification(`📝 Booking created for ${name} - ${hairstyle} on ${date} at ${time}`);
    addNotification(`💰 Please send €${depositAmount.toFixed(2)} deposit via Revolut: ${REVOLUT_LINK}`);
    addNotification(`📝 Reference: ${bookingId}`);
    addNotification(`📧 Booking details sent to your email!`);
    
    window.open(REVOLUT_LINK, '_blank');
    
    document.getElementById('hairBookingForm').reset();
    document.getElementById('serviceType').value = 'studio';
    document.getElementById('address').value = '';
    toggleAddressField();
    updateDepositDisplay();
}

function confirmPayment(id) {
    const apt = appointments.find(a => a.id === id);
    if (apt && !apt.depositPaid) {
        apt.depositPaid = true;
        apt.paymentFailed = false;
        saveAppointments();
        renderAppointments();
        addNotification(`✅ CONFIRMED! ${apt.name} paid €${apt.depositAmount} deposit via Revolut`);
    }
}

function markPaymentFailed(id) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    
    apt.paymentFailed = true;
    saveAppointments();
    renderAppointments();
    addNotification(`❌ Payment marked as FAILED for ${apt.name}`);
}

function resendPaymentLink(id) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    
    if (apt.paymentFailed) {
        apt.paymentFailed = false;
        saveAppointments();
        renderAppointments();
    }
    
    addNotification(`📧 Resending payment link to ${apt.name}`);
    addNotification(`💰 Please send €${apt.depositAmount.toFixed(2)} deposit via Revolut: ${REVOLUT_LINK}`);
    window.open(REVOLUT_LINK, '_blank');
}

function sendReminder(id) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    
    const status = apt.depositPaid ? `Deposit paid: €${apt.depositAmount}` : `⚠️ Pending payment: €${apt.depositAmount} via ${REVOLUT_LINK}`;
    addNotification(`🔔 REMINDER: ${apt.name}, your ${apt.hairstyle} on ${apt.date} at ${apt.time}. ${status}`);
}

function deleteAppointment(id) {
    const apt = appointments.find(a => a.id === id);
    if (apt && confirm(`Delete appointment for ${apt.name}?`)) {
        appointments = appointments.filter(a => a.id !== id);
        saveAppointments();
        renderAppointments();
        addNotification(`🗑️ Deleted appointment for ${apt.name}`);
    }
}

// ============================================
// EDIT MODAL FUNCTIONS
// ============================================

function openEditModal(id) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    
    document.getElementById('modalEditId').value = apt.id;
    document.getElementById('modalName').value = apt.name;
    document.getElementById('modalEmail').value = apt.email;
    document.getElementById('modalPhone').value = apt.phone;
    document.getElementById('modalServiceType').value = apt.serviceType;
    document.getElementById('modalAddress').value = apt.address || '';
    document.getElementById('modalHairstyle').value = apt.hairstyle;
    document.getElementById('modalDuration').value = apt.duration;
    document.getElementById('modalDate').value = apt.date;
    document.getElementById('modalTime').value = apt.time;
    document.getElementById('modalReminderHours').value = apt.reminderHours;
    document.getElementById('modalNotes').value = apt.notes || '';
    
    document.getElementById('editModal').style.display = 'block';
}

function saveEdit() {
    const id = document.getElementById('modalEditId').value;
    const index = appointments.findIndex(a => a.id === id);
    
    if (index !== -1) {
        const newHairstyle = document.getElementById('modalHairstyle').value;
        const newServiceType = document.getElementById('modalServiceType').value;
        const basePrice = hairstylePrices[newHairstyle] || 70;
        
        appointments[index] = {
            ...appointments[index],
            name: document.getElementById('modalName').value,
            email: document.getElementById('modalEmail').value,
            phone: document.getElementById('modalPhone').value,
            serviceType: newServiceType,
            address: document.getElementById('modalAddress').value,
            hairstyle: newHairstyle,
            duration: document.getElementById('modalDuration').value,
            date: document.getElementById('modalDate').value,
            time: document.getElementById('modalTime').value,
            reminderHours: parseInt(document.getElementById('modalReminderHours').value),
            notes: document.getElementById('modalNotes').value,
            totalPrice: basePrice,
            depositAmount: basePrice * 0.2
        };
        
        saveAppointments();
        renderAppointments();
        addNotification(`✏️ Updated appointment for ${appointments[index].name}`);
        closeModal();
    }
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// ============================================
// THEME TOGGLE
// ============================================

function initThemeToggle() {
    let isAlt = false;
    const btn = document.getElementById('colorToggleBtn');
    const text = document.getElementById('toggleThemeText');
    
    btn?.addEventListener('click', () => {
        isAlt = !isAlt;
        if (isAlt) {
            document.body.classList.add('alternate');
            text.innerText = 'Rose blush';
        } else {
            document.body.classList.remove('alternate');
            text.innerText = 'Purple dusk';
        }
        addNotification(`🎨 Theme changed to ${isAlt ? 'Purple Dusk' : 'Rose Blush'}`);
    });
}

// ============================================
// NOTIFICATION PANEL
// ============================================

function initNotificationPanel() {
    const panel = document.getElementById('notifPanel');
    const openBtn = document.getElementById('openNotifBtn');
    const closeBtn = document.getElementById('closeNotifBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    
    openBtn?.addEventListener('click', () => panel.classList.toggle('open'));
    closeBtn?.addEventListener('click', () => panel.classList.remove('open'));
    refreshBtn?.addEventListener('click', () => {
        renderAppointments();
        addNotification('🔄 Refreshed');
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadAppointments();
    initThemeToggle();
    initNotificationPanel();
    updateDepositDisplay();
    toggleAddressField();
    
    document.getElementById('hairBookingForm')?.addEventListener('submit', createBooking);
    document.getElementById('serviceType')?.addEventListener('change', toggleAddressField);
    document.getElementById('hairstyle')?.addEventListener('change', updateDepositDisplay);
    
    document.querySelector('.close-modal')?.addEventListener('click', closeModal);
    document.getElementById('cancelModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('saveEditBtn')?.addEventListener('click', saveEdit);
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('editModal');
        if (e.target === modal) closeModal();
    });
    
    addNotification('🌸 Welcome to Hair Stylist Dublin & Drogheda!');
    addNotification('📧 All bookings will be sent to your email and Formspree dashboard!');
});