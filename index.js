// Load appointments from storage
let appointments = [];
let notifications = [];
let pendingBooking = null;

// DOM elements
const bookingsListEl = document.getElementById('bookingsList');
const notifListEl = document.getElementById('notifList');
const notifCountEl = document.getElementById('notifCount');
const colorToggleBtn = document.getElementById('colorToggleBtn');
const toggleText = document.getElementById('toggleThemeText');
const refreshBtn = document.getElementById('refreshBtn');
const appointmentCountSpan = document.getElementById('appointmentCount');

// Load appointments
function loadAppointments() {
    const saved = localStorage.getItem('hairdressing_appointments');
    if (saved) {
        appointments = JSON.parse(saved);
    } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        appointments = [{
            id: 'demo1',
            name: 'Sarah Miller',
            email: 'sarah@example.com',
            phone: '0851234567',
            location: 'Dublin',
            hairstyle: 'Box braids',
            duration: '3.5 hours',
            date: tomorrow.toISOString().split('T')[0],
            time: '11:00',
            reminderHours: 3,
            notes: 'First time client, medium length',
            depositPaid: true,
            reminderHistory: [],
            createdAt: new Date().toISOString()
        }];
        saveAppointments();
    }
    renderAppointments();
    updateAppointmentCount();
}

function saveAppointments() {
    localStorage.setItem('hairdressing_appointments', JSON.stringify(appointments));
    updateAppointmentCount();
}

function updateAppointmentCount() {
    if (appointmentCountSpan) {
        appointmentCountSpan.innerText = appointments.length;
    }
}

// Render appointments
function renderAppointments() {
    if (!bookingsListEl) return;
    
    if (appointments.length === 0) {
        bookingsListEl.innerHTML = '<div class="empty-state">✨ No appointments yet.<br>Book your braids or wig style!</div>';
        return;
    }
    
    bookingsListEl.innerHTML = appointments.map(apt => {
        const aptDate = new Date(apt.date);
        const formattedDate = aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        return `
            <div class="booking-card">
                <div class="booking-name">
                    <span>💇 ${escapeHtml(apt.name)}</span>
                    <span class="booking-hairstyle">${escapeHtml(apt.hairstyle)}</span>
                </div>
                <div class="booking-details">
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(apt.location)}</span>
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                    <span><i class="fas fa-clock"></i> ${apt.time}</span>
                </div>
                <div class="booking-details">
                    <span><i class="fas fa-hourglass"></i> ${apt.duration}</span>
                </div>
                <div class="deposit-badge">💰 Deposit Paid</div>
                <div class="booking-actions">
                    <button class="edit-btn" data-id="${apt.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn" data-id="${apt.id}"><i class="fas fa-trash"></i> Delete</button>
                    <button class="reminder-btn" data-id="${apt.id}"><i class="fas fa-bell"></i> Remind</button>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            openEditModal(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            deleteAppointment(id);
        });
    });
    
    document.querySelectorAll('.reminder-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            sendManualReminder(id);
        });
    });
}

// Add notification
function addNotification(message) {
    const notif = {
        id: Date.now(),
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    notifications.unshift(notif);
    if (notifications.length > 20) notifications.pop();
    
    if (notifListEl) {
        if (notifications.length === 0) {
            notifListEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #aaa;">No notifications yet</div>';
        } else {
            notifListEl.innerHTML = notifications.map(n => `
                <div class="notif-item">
                    <div>📨 ${escapeHtml(n.message)}</div>
                    <div class="notif-time">${n.time}</div>
                </div>
            `).join('');
        }
    }
    
    if (notifCountEl) notifCountEl.innerText = notifications.length;
    console.log('[NOTIFICATION]', message);
}

// Send manual reminder
function sendManualReminder(id) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    
    const msg = `🔔 REMINDER: ${apt.name}, your ${apt.hairstyle} appointment is on ${apt.date} at ${apt.time} in ${apt.location}. See you! 💇‍♀️`;
    addNotification(msg);
    addNotification(`✅ Reminder sent to ${apt.name}`);
    
    if (!apt.reminderHistory) apt.reminderHistory = [];
    apt.reminderHistory.push(`manual_${Date.now()}`);
    saveAppointments();
}

// Check reminders
function checkReminders() {
    const now = new Date();
    
    appointments.forEach(apt => {
        if (!apt.date || !apt.time) return;
        
        const aptDateTime = new Date(`${apt.date}T${apt.time}`);
        if (isNaN(aptDateTime)) return;
        
        const hoursBefore = parseInt(apt.reminderHours);
        const reminderTime = new Date(aptDateTime.getTime() - (hoursBefore * 60 * 60 * 1000));
        const timeDiff = now - reminderTime;
        
        if (timeDiff >= 0 && timeDiff < 15 * 60 * 1000) {
            const reminderKey = `${apt.id}_${hoursBefore}_${apt.date}`;
            const alreadySent = apt.reminderHistory && apt.reminderHistory.includes(reminderKey);
            
            if (!alreadySent) {
                const msg = `⏰ REMINDER: ${apt.name}, your ${apt.hairstyle} appointment is in ${hoursBefore} hour(s) at ${apt.time} in ${apt.location}!`;
                addNotification(msg);
                
                if (!apt.reminderHistory) apt.reminderHistory = [];
                apt.reminderHistory.push(reminderKey);
                saveAppointments();
            }
        }
    });
}

// Open Payment Modal
function openPaymentModal(bookingData) {
    pendingBooking = bookingData;
    
    document.getElementById('paymentHairstyle').textContent = bookingData.hairstyle;
    document.getElementById('paymentDepositText').innerHTML = '20% Deposit Required';
    
    document.getElementById('cardName').value = '';
    document.getElementById('cardNumber').value = '';
    document.getElementById('cardExpiry').value = '';
    document.getElementById('cardCvv').value = '';
    
    const paymentModal = document.getElementById('paymentModal');
    paymentModal.style.display = 'block';
}

// Process Payment
function processPayment() {
    const cardName = document.getElementById('cardName')?.value.trim();
    const cardNumber = document.getElementById('cardNumber')?.value.trim();
    const cardExpiry = document.getElementById('cardExpiry')?.value.trim();
    const cardCvv = document.getElementById('cardCvv')?.value.trim();
    
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        addNotification('❌ Please fill in all payment details');
        return;
    }
    
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 15 || cleanCardNumber.length > 16) {
        addNotification('❌ Please enter a valid card number');
        return;
    }
    
    if (!cardExpiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
        addNotification('❌ Please enter valid expiry date (MM/YY)');
        return;
    }
    
    if (!cardCvv.match(/^\d{3,4}$/)) {
        addNotification('❌ Please enter valid CVV');
        return;
    }
    
    addNotification('💳 Processing payment...');
    
    setTimeout(() => {
        addNotification(`✅ Payment successful! 20% deposit confirmed`);
        
        const newId = 'apt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        
        const newAppointment = {
            id: newId,
            ...pendingBooking,
            depositPaid: true,
            reminderHistory: [],
            createdAt: new Date().toISOString()
        };
        
        delete newAppointment.depositAmount;
        
        appointments.push(newAppointment);
        saveAppointments();
        renderAppointments();
        
        addNotification(`🎉 BOOKING CONFIRMED! ${pendingBooking.name}, your ${pendingBooking.hairstyle} is scheduled for ${pendingBooking.date} at ${pendingBooking.time} in ${pendingBooking.location}`);
        addNotification(`🔔 You'll receive a reminder ${pendingBooking.reminderHours} hour(s) before`);
        
        closePaymentModal();
        
        document.getElementById('hairBookingForm')?.reset();
        document.getElementById('location').value = 'Dublin';
        
        pendingBooking = null;
    }, 1500);
}

// Create booking - opens payment page
function createBooking(e) {
    e.preventDefault();
    
    const name = document.getElementById('clientName')?.value.trim();
    const email = document.getElementById('clientEmail')?.value.trim();
    const phone = document.getElementById('clientPhone')?.value.trim();
    const location = document.getElementById('location')?.value;
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
    
    const selectedDate = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (selectedDate < now) {
        addNotification('⚠️ Please choose a future date');
        return;
    }
    
    const bookingData = {
        name, email, phone, location, hairstyle, duration,
        date, time, reminderHours: parseInt(reminderHours),
        notes
    };
    
    openPaymentModal(bookingData);
}

// Delete appointment
function deleteAppointment(id) {
    if (confirm('Are you sure you want to delete this appointment?')) {
        const apt = appointments.find(a => a.id === id);
        appointments = appointments.filter(a => a.id !== id);
        saveAppointments();
        renderAppointments();
        addNotification(`🗑️ Deleted appointment for ${apt.name}`);
    }
}

// Open Edit Modal
function openEditModal(id) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    
    document.getElementById('modalEditId').value = apt.id;
    document.getElementById('modalName').value = apt.name;
    document.getElementById('modalEmail').value = apt.email;
    document.getElementById('modalPhone').value = apt.phone;
    document.getElementById('modalLocation').value = apt.location;
    document.getElementById('modalHairstyle').value = apt.hairstyle;
    document.getElementById('modalDuration').value = apt.duration;
    document.getElementById('modalDate').value = apt.date;
    document.getElementById('modalTime').value = apt.time;
    document.getElementById('modalReminderHours').value = apt.reminderHours;
    document.getElementById('modalNotes').value = apt.notes || '';
    
    const modal = document.getElementById('editModal');
    modal.style.display = 'block';
}

// Save edit
function saveEdit() {
    const id = document.getElementById('modalEditId').value;
    const index = appointments.findIndex(a => a.id === id);
    
    if (index !== -1) {
        appointments[index] = {
            ...appointments[index],
            name: document.getElementById('modalName').value,
            email: document.getElementById('modalEmail').value,
            phone: document.getElementById('modalPhone').value,
            location: document.getElementById('modalLocation').value,
            hairstyle: document.getElementById('modalHairstyle').value,
            duration: document.getElementById('modalDuration').value,
            date: document.getElementById('modalDate').value,
            time: document.getElementById('modalTime').value,
            reminderHours: parseInt(document.getElementById('modalReminderHours').value),
            notes: document.getElementById('modalNotes').value
        };
        
        saveAppointments();
        renderAppointments();
        addNotification(`✏️ Appointment updated for ${appointments[index].name}`);
        closeModal();
    }
}

function closeModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
}

// Format card inputs
function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value;
}

function formatExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    input.value = value;
}

// Theme toggle
function initThemeToggle() {
    let isAlt = false;
    colorToggleBtn?.addEventListener('click', () => {
        isAlt = !isAlt;
        if (isAlt) {
            document.body.classList.add('alternate');
            toggleText.innerText = 'Purple';
        } else {
            document.body.classList.remove('alternate');
            toggleText.innerText = 'Rose blush';
        }
        addNotification(`🎨 Theme changed to ${isAlt ? 'Purple' : 'Rose Blush'}`);
    });
}

// Notification panel
function initNotificationPanel() {
    const panel = document.getElementById('notifPanel');
    const openBtn = document.getElementById('openNotifBtn');
    const closeBtn = document.getElementById('closeNotifBtn');
    
    openBtn?.addEventListener('click', () => {
        panel.classList.toggle('open');
    });
    
    closeBtn?.addEventListener('click', () => {
        panel.classList.remove('open');
    });
    
    refreshBtn?.addEventListener('click', () => {
        checkReminders();
        renderAppointments();
        addNotification('🔄 Manual refresh complete');
    });
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Event listeners
document.querySelector('.close-modal')?.addEventListener('click', closeModal);
document.getElementById('cancelModalBtn')?.addEventListener('click', closeModal);
document.getElementById('saveEditBtn')?.addEventListener('click', saveEdit);
document.querySelector('.close-payment-modal')?.addEventListener('click', closePaymentModal);
document.getElementById('cancelPaymentBtn')?.addEventListener('click', closePaymentModal);
document.getElementById('confirmPaymentBtn')?.addEventListener('click', processPayment);

const cardNumberInput = document.getElementById('cardNumber');
const cardExpiryInput = document.getElementById('cardExpiry');

cardNumberInput?.addEventListener('input', () => formatCardNumber(cardNumberInput));
cardExpiryInput?.addEventListener('input', () => formatExpiry(cardExpiryInput));

window.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    const paymentModal = document.getElementById('paymentModal');
    if (e.target === modal) closeModal();
    if (e.target === paymentModal) closePaymentModal();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAppointments();
    initThemeToggle();
    initNotificationPanel();
    checkReminders();
    addNotification('🌸 Welcome to Hair Stylist Dublin & Drogheda! 20% deposit required to book.');
    
    const form = document.getElementById('hairBookingForm');
    if (form) {
        form.addEventListener('submit', createBooking);
    }
});

// Check reminders every 30 seconds
setInterval(checkReminders, 30000);