// Load appointments from storage
let appointments = [];
let notifications = [];

// DOM elements
const bookingsListEl = document.getElementById('bookingsList');
const notifListEl = document.getElementById('notifList');
const notifCountEl = document.getElementById('notifCount');
const colorToggleBtn = document.getElementById('colorToggleBtn');
const toggleText = document.getElementById('toggleThemeText');
const refreshBtn = document.getElementById('refreshBtn');

// Load saved appointments
function loadAppointments() {
    const saved = localStorage.getItem('hairdressing_appointments');
    if (saved) {
        appointments = JSON.parse(saved);
    } else {
        // Demo appointment
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        appointments = [{
            id: 'demo1',
            name: 'Sarah Miller',
            email: 'sarah@example.com',
            phone: '555-1234',
            service: "Women's Haircut",
            duration: '1 hour',
            date: tomorrow.toISOString().split('T')[0],
            time: '11:00',
            reminderHours: 3,
            stylist: 'Sarah',
            notes: 'First time client',
            reminderHistory: [],
            createdAt: new Date().toISOString()
        }];
        saveAppointments();
    }
    renderAppointments();
}

function saveAppointments() {
    localStorage.setItem('hairdressing_appointments', JSON.stringify(appointments));
}

// Render appointments to sidebar
function renderAppointments() {
    if (!bookingsListEl) return;
    
    if (appointments.length === 0) {
        bookingsListEl.innerHTML = '<div class="empty-state">✨ No appointments yet.<br>Book your first session!</div>';
        return;
    }
    
    bookingsListEl.innerHTML = appointments.map(apt => {
        const aptDate = new Date(apt.date);
        const formattedDate = aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        return `
            <div class="booking-card">
                <div class="booking-name">
                    <span>💇 ${escapeHtml(apt.name)}</span>
                    <span class="booking-service">${escapeHtml(apt.service)}</span>
                </div>
                <div class="booking-details">
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                    <span><i class="fas fa-clock"></i> ${apt.time}</span>
                    <span><i class="fas fa-user-check"></i> ${escapeHtml(apt.stylist)}</span>
                </div>
                <div class="booking-details">
                    <span><i class="fas fa-hourglass"></i> ${apt.duration}</span>
                    <span><i class="fas fa-bell"></i> Reminder: ${apt.reminderHours}h before</span>
                </div>
                <div class="booking-actions">
                    <button class="edit-btn" data-id="${apt.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn" data-id="${apt.id}"><i class="fas fa-trash"></i> Delete</button>
                    <button class="reminder-btn" data-id="${apt.id}"><i class="fas fa-bell"></i> Remind</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners
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
    
    const msg = `🔔 REMINDER: ${apt.name}, your appointment is on ${apt.date} at ${apt.time}. See you at the salon! 💇`;
    addNotification(msg);
    addNotification(`✅ Reminder sent to ${apt.name}`);
    
    if (!apt.reminderHistory) apt.reminderHistory = [];
    apt.reminderHistory.push(`manual_${Date.now()}`);
    saveAppointments();
}

// Check for automatic reminders
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
                const msg = `⏰ REMINDER: ${apt.name}, your appointment is in ${hoursBefore} hour(s) at ${apt.time}!`;
                addNotification(msg);
                
                if (!apt.reminderHistory) apt.reminderHistory = [];
                apt.reminderHistory.push(reminderKey);
                saveAppointments();
            }
        }
    });
}

// Create new booking
function createBooking(e) {
    e.preventDefault();
    
    const name = document.getElementById('clientName')?.value.trim();
    const email = document.getElementById('clientEmail')?.value.trim();
    const phone = document.getElementById('clientPhone')?.value.trim();
    const duration = document.getElementById('duration')?.value;
    const date = document.getElementById('appointmentDate')?.value;
    const time = document.getElementById('appointmentTime')?.value;
    const reminderHours = document.getElementById('reminderHours')?.value;
    const stylist = document.getElementById('stylist')?.value;
    const notes = document.getElementById('notes')?.value;
    
    if (!name || !email || !phone || !date || !time) {
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
    
    const newId = 'apt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    const newAppointment = {
        id: newId,
        name: name,
        email: email,
        phone: phone,
        service: "Hair Service",
        duration: duration,
        date: date,
        time: time,
        reminderHours: parseInt(reminderHours),
        stylist: stylist,
        notes: notes,
        reminderHistory: [],
        createdAt: new Date().toISOString()
    };
    
    appointments.push(newAppointment);
    saveAppointments();
    renderAppointments();
    
    // Clear form
    document.getElementById('hairBookingForm')?.reset();
    
    addNotification(`✅ Booking confirmed! ${name}, your appointment is scheduled for ${date} at ${time}`);
    addNotification(`🔔 You'll receive a reminder ${reminderHours} hour(s) before`);
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
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('editModal');
    if (!modal) {
        createModal();
        modal = document.getElementById('editModal');
    }
    
    // Populate modal fields
    document.getElementById('modalEditId').value = apt.id;
    document.getElementById('modalName').value = apt.name;
    document.getElementById('modalEmail').value = apt.email;
    document.getElementById('modalPhone').value = apt.phone;
    document.getElementById('modalDuration').value = apt.duration;
    document.getElementById('modalDate').value = apt.date;
    document.getElementById('modalTime').value = apt.time;
    document.getElementById('modalReminderHours').value = apt.reminderHours;
    document.getElementById('modalStylist').value = apt.stylist;
    document.getElementById('modalNotes').value = apt.notes || '';
    
    modal.style.display = 'block';
}

// Create modal dynamically
function createModal() {
    const modalHTML = `
        <div id="editModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Appointment</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="modalEditId">
                    <div class="input-field">
                        <label>Full Name</label>
                        <input type="text" id="modalName" placeholder="Full name">
                    </div>
                    <div class="input-field">
                        <label>Email</label>
                        <input type="email" id="modalEmail" placeholder="Email">
                    </div>
                    <div class="input-field">
                        <label>Phone</label>
                        <input type="tel" id="modalPhone" placeholder="Phone">
                    </div>
                    <div class="row-2">
                        <div class="input-field">
                            <label>Duration</label>
                            <select id="modalDuration">
                                <option value="30 min">30 min - Quick Cut</option>
                                <option value="1 hour">1 hour - Standard Cut</option>
                                <option value="1.5 hours">1.5 hours - Color</option>
                                <option value="2 hours">2 hours - Color + Cut</option>
                            </select>
                        </div>
                        <div class="input-field">
                            <label>Reminder Hours</label>
                            <select id="modalReminderHours">
                                <option value="1">1 hour before</option>
                                <option value="3">3 hours before</option>
                                <option value="6">6 hours before</option>
                                <option value="24">1 day before</option>
                            </select>
                        </div>
                    </div>
                    <div class="row-2">
                        <div class="input-field">
                            <label>Date</label>
                            <input type="date" id="modalDate">
                        </div>
                        <div class="input-field">
                            <label>Time</label>
                            <input type="time" id="modalTime">
                        </div>
                    </div>
                    <div class="input-field">
                        <label>Stylist</label>
                        <select id="modalStylist">
                            <option value="Any">Any Stylist</option>
                            <option value="Sarah">Sarah (Senior)</option>
                            <option value="Jessica">Jessica (Color Expert)</option>
                            <option value="Maria">Maria (Cuts)</option>
                            <option value="David">David (Men's Specialist)</option>
                        </select>
                    </div>
                    <div class="input-field">
                        <label>Notes</label>
                        <textarea id="modalNotes" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-save" id="saveEditBtn">Save Changes</button>
                    <button class="btn-cancel-modal" id="cancelModalBtn">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('editModal')) closeModal();
    });
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
            duration: document.getElementById('modalDuration').value,
            date: document.getElementById('modalDate').value,
            time: document.getElementById('modalTime').value,
            reminderHours: parseInt(document.getElementById('modalReminderHours').value),
            stylist: document.getElementById('modalStylist').value,
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
            toggleText.innerText = 'LOML';
        }
        addNotification(`🎨 Theme changed to ${isAlt ? 'Purple' : 'Pink'}`);
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAppointments();
    initThemeToggle();
    initNotificationPanel();
    checkReminders();
    addNotification('🌸 Welcome to Aliyah\'s Salon!');
    
    const form = document.getElementById('hairBookingForm');
    if (form) {
        form.addEventListener('submit', createBooking);
    }
});

// Check reminders every 30 seconds
setInterval(checkReminders, 30000);