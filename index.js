// Price mapping for hairstyles (in Euros)
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

// Housecall extra charges (hidden from UI but used for deposit calculation)
const housecallFee = 30; // Flat fee for housecall

// Load appointments from storage
let appointments = [];
let notifications = [];

// API Configuration - Update this to your backend URL when deployed
const API_URL = '/api/create-checkout';

// DOM elements
const bookingsListEl = document.getElementById('bookingsList');
const notifListEl = document.getElementById('notifList');
const notifCountEl = document.getElementById('notifCount');
const colorToggleBtn = document.getElementById('colorToggleBtn');
const toggleText = document.getElementById('toggleThemeText');
const refreshBtn = document.getElementById('refreshBtn');
const appointmentCountSpan = document.getElementById('appointmentCount');
const loadingOverlay = document.getElementById('loadingOverlay');
const hairstyleSelect = document.getElementById('hairstyle');
const serviceTypeSelect = document.getElementById('serviceType');
const addressField = document.getElementById('addressField');
const depositAmountText = document.getElementById('depositAmountText');
const priceBreakdownDiv = document.getElementById('priceBreakdown');
const totalAmountDiv = document.getElementById('totalAmount');

// Show/hide address field based on service type
function toggleAddressField() {
    const serviceType = serviceTypeSelect?.value;
    if (serviceType === 'housecall') {
        addressField.style.display = 'block';
        document.getElementById('address').required = true;
    } else {
        addressField.style.display = 'none';
        document.getElementById('address').required = false;
    }
    updatePriceDisplay();
}

serviceTypeSelect?.addEventListener('change', toggleAddressField);

// Update price display
function updatePriceDisplay() {
    const hairstyle = hairstyleSelect?.value;
    const serviceType = serviceTypeSelect?.value;
    
    if (hairstyle && hairstylePrices[hairstyle]) {
        const basePrice = hairstylePrices[hairstyle];
        const extraFee = (serviceType === 'housecall') ? housecallFee : 0;
        const totalPrice = basePrice + extraFee;
        const depositAmount = totalPrice * 0.2;
        
        let serviceText = "Studio Visit";
        if (serviceType === 'housecall') serviceText = "Housecall";
        
        let breakdownHtml = `<div class="breakdown-item">Hairstyle: €${basePrice}</div>`;
        if (serviceType === 'housecall') {
            breakdownHtml += `<div class="breakdown-item">${serviceText}: +€${housecallFee}</div>`;
        }
        breakdownHtml += `<div class="breakdown-item highlight">Total: €${totalPrice}</div>`;
        
        priceBreakdownDiv.innerHTML = breakdownHtml;
        totalAmountDiv.innerHTML = `Deposit (20%): <strong>€${depositAmount.toFixed(2)}</strong>`;
        depositAmountText.innerHTML = `20% deposit required to secure your booking`;
    } else {
        priceBreakdownDiv.innerHTML = `<div class="breakdown-item">Select a hairstyle to see price</div>`;
        totalAmountDiv.innerHTML = ``;
        depositAmountText.innerHTML = `Select hairstyle to see deposit amount`;
    }
}

hairstyleSelect?.addEventListener('change', updatePriceDisplay);
serviceTypeSelect?.addEventListener('change', updatePriceDisplay);

// Load appointments (no demo data)
function loadAppointments() {
    const saved = localStorage.getItem('hairdressing_appointments');
    if (saved) {
        appointments = JSON.parse(saved);
    } else {
        appointments = []; // Empty - no demo appointment
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

// Get service type display name
function getServiceTypeDisplay(serviceType) {
    if (serviceType === 'studio') return '📍 Studio Visit';
    return '🏠 Housecall';
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
        const serviceDisplay = getServiceTypeDisplay(apt.serviceType);
        
        return `
            <div class="booking-card">
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
                ${apt.address ? `<div class="booking-details"><span><i class="fas fa-map-pin"></i> ${escapeHtml(apt.address.substring(0, 50))}${apt.address.length > 50 ? '...' : ''}</span></div>` : ''}
                <div class="deposit-badge">💰 Deposit: €${apt.depositAmount} paid (20%)</div>
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
    
    const msg = `🔔 REMINDER: ${apt.name}, your ${apt.hairstyle} appointment is on ${apt.date} at ${apt.time}. Total: €${apt.totalPrice}, Deposit paid: €${apt.depositAmount}. See you! 💇‍♀️`;
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
                const msg = `⏰ REMINDER: ${apt.name}, your ${apt.hairstyle} appointment is in ${hoursBefore} hour(s) at ${apt.time}!`;
                addNotification(msg);
                
                if (!apt.reminderHistory) apt.reminderHistory = [];
                apt.reminderHistory.push(reminderKey);
                saveAppointments();
            }
        }
    });
}

// Check for successful payment after redirect
function checkPaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const tempBooking = sessionStorage.getItem('temp_booking');
    
    if (status === 'paid' && tempBooking) {
        const bookingData = JSON.parse(tempBooking);
        
        appointments.push(bookingData);
        saveAppointments();
        renderAppointments();
        
        addNotification(`🎉 BOOKING CONFIRMED! ${bookingData.name}, your ${bookingData.hairstyle} is scheduled for ${bookingData.date} at ${bookingData.time}`);
        addNotification(`💰 20% deposit (€${bookingData.depositAmount.toFixed(2)}) paid successfully! Remaining €${(bookingData.totalPrice - bookingData.depositAmount).toFixed(2)} due on day.`);
        
        sessionStorage.removeItem('temp_booking');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Create booking and redirect to SumUp
async function createBooking(e) {
    e.preventDefault();
    
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
    
    // Validate address for housecall
    if (serviceType === 'housecall' && !address) {
        addNotification('❌ Please enter your full address for housecall service');
        return;
    }
    
    const selectedDate = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (selectedDate < now) {
        addNotification('⚠️ Please choose a future date');
        return;
    }
    
    // Calculate prices
    const basePrice = hairstylePrices[hairstyle] || 70;
    const extraFee = (serviceType === 'housecall') ? housecallFee : 0;
    const totalPrice = basePrice + extraFee;
    const depositAmount = totalPrice * 0.2;
    
    const bookingData = {
        id: 'temp_' + Date.now(),
        name, email, phone, serviceType, address: address || '',
        hairstyle, duration, date, time,
        reminderHours: parseInt(reminderHours),
        notes, depositPaid: false,
        totalPrice, depositAmount,
        reminderHistory: [],
        createdAt: new Date().toISOString()
    };
    
    // Store temp booking
    sessionStorage.setItem('temp_booking', JSON.stringify(bookingData));
    
    // Show loading overlay
    loadingOverlay.classList.add('show');
    
    try {
        // Call your backend to create SumUp checkout
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: depositAmount,
                currency: 'EUR',
                customerName: name,
                customerEmail: email,
                description: `20% deposit for ${hairstyle} - ${serviceType === 'studio' ? 'Studio' : 'Housecall'} - Total €${totalPrice}`,
                successUrl: `${window.location.origin}${window.location.pathname}?status=paid`,
                cancelUrl: `${window.location.origin}${window.location.pathname}?status=cancelled`
            })
        });
        
        const data = await response.json();
        
        if (data.checkoutUrl) {
            // Redirect to SumUp payment page
            window.location.href = data.checkoutUrl;
        } else {
            throw new Error('No checkout URL received');
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        addNotification('❌ Unable to process payment. Please try again or contact us directly.');
        loadingOverlay.classList.remove('show');
        sessionStorage.removeItem('temp_booking');
    }
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
    document.getElementById('modalServiceType').value = apt.serviceType;
    document.getElementById('modalAddress').value = apt.address || '';
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
        const newServiceType = document.getElementById('modalServiceType').value;
        const newHairstyle = document.getElementById('modalHairstyle').value;
        
        const basePrice = hairstylePrices[newHairstyle] || 70;
        const extraFee = (newServiceType === 'housecall') ? housecallFee : 0;
        const totalPrice = basePrice + extraFee;
        const depositAmount = totalPrice * 0.2;
        
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
            totalPrice: totalPrice,
            depositAmount: depositAmount
        };
        
        saveAppointments();
        renderAppointments();
        addNotification(`✏️ Appointment updated for ${appointments[index].name}. New total: €${totalPrice}, Deposit: €${depositAmount}`);
        closeModal();
    }
}

function closeModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
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

window.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    if (e.target === modal) closeModal();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAppointments();
    initThemeToggle();
    initNotificationPanel();
    checkReminders();
    checkPaymentSuccess();
    updatePriceDisplay();
    toggleAddressField();
    addNotification('🌸 Welcome to Hair Stylist Dublin & Drogheda!');
    
    const form = document.getElementById('hairBookingForm');
    if (form) {
        form.addEventListener('submit', createBooking);
    }
});

// Check reminders every 30 seconds
setInterval(checkReminders, 30000);