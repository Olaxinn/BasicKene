let currentFilter = 'all';
let currentCalendarDate = new Date();

// Tanışma tarihi (bu tarihi değiştirin!)
const meetingDate = new Date('2025-02-21'); // YYYY-MM-DD formatında

function updateLoveCounter() {
    const today = new Date();
    const timeDiff = today.getTime() - meetingDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    const counter = document.getElementById('loveCounter');
    if (counter) {
        counter.textContent = `💕 Birlikte ${daysDiff} gün`;
    }
}

// Filter functions
function filterEntries(mood) {
    currentFilter = mood;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    displayEntries();
}

function filterEntriesByMood(entries, mood) {
    if (mood === 'all') return entries;
    if (mood === 'favorites') return entries.filter(entry => entry.isFavorite);
    return entries.filter(entry => entry.mood === mood);
}

// Modal functions
function showNewEntryForm() {
    const modal = document.getElementById('newEntryModal');
    modal.classList.add('show');
    document.getElementById('entryTitle').focus();
    document.body.style.overflow = 'hidden';
}

function hideNewEntryForm() {
    const modal = document.getElementById('newEntryModal');
    modal.classList.remove('show');
    
    const form = document.getElementById('diaryForm');
    form.reset();
    delete form.dataset.editId;
    
    // Başlığı sıfırla
    document.querySelector('#newEntryModal .modal-title').textContent = '✨ Yeni Günlük';
    
    document.body.style.overflow = 'auto';
}

// Calendar Modal functions
function showCalendarModal() {
    document.getElementById('calendarModal').classList.add('show');
    generateCalendar();
    document.body.style.overflow = 'hidden';
}

function hideCalendarModal() {
    document.getElementById('calendarModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

function generateCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Özel günleri al
    const specialDays = JSON.parse(localStorage.getItem('specialDays') || '[]');
    
    // Weekday headers
    const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    weekdays.forEach(day => {
        const weekdayElement = document.createElement('div');
        weekdayElement.className = 'calendar-weekday';
        weekdayElement.textContent = day;
        calendarGrid.appendChild(weekdayElement);
    });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDay = firstDay.getDay();
    if (startDay === 0) startDay = 7;
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 2; i >= 0; i--) {
        const day = prevMonth.getDate() - i;
        const dayElement = createCalendarDay(day, 'other-month');
        calendarGrid.appendChild(dayElement);
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createCalendarDay(day);
        
        if (year === today.getFullYear() && 
            month === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Özel gün kontrolü
        const dayDate = new Date(year, month, day).toISOString().split('T')[0];
        const hasSpecialDay = specialDays.some(special => special.date === dayDate);
        if (hasSpecialDay) {
            dayElement.classList.add('special-day');
        }
        
        calendarGrid.appendChild(dayElement);
    }
    
    // Next month days
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells + 7;
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createCalendarDay(day, 'other-month');
        calendarGrid.appendChild(dayElement);
    }
}

function createCalendarDay(day, className = '') {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${className}`;
    dayElement.textContent = day;
    
    // Sadece bu ayın günlerine tıklama özelliği ekle
    if (!className.includes('other-month')) {
        dayElement.addEventListener('click', function() {
            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth();
            const selectedDate = new Date(year, month, day);
            showSpecialDayFormForDate(selectedDate);
        });
    }
    
    return dayElement;
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    generateCalendar();
}

// Modal close on outside click
document.addEventListener('DOMContentLoaded', function() {
    displayEntries();
    
    const calendarModal = document.getElementById('calendarModal');
    if (calendarModal) {
        calendarModal.addEventListener('click', function(e) {
            if (e.target === this) hideCalendarModal();
        });
    }
});

// Save diary entry
async function saveDiary(event) {
  event.preventDefault();

  const form = document.getElementById('diaryForm');
  const editId = form.dataset.editId;

  const entryData = {
    title: document.getElementById('entryTitle').value,
    content: document.getElementById('entryContent').value,
    mood: document.getElementById('entryMood').value,
    author: document.getElementById('entryAuthor').value,
    tags: document.getElementById('entryTags').value.split(',').map(t => t.trim()).filter(t => t),
    date: new Date().toLocaleDateString('tr-TR'),
    isFavorite: false
  };

  try {
    let res;
    if (editId) {
      res = await fetch(`http://localhost:3000/entries/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });
      delete form.dataset.editId;
      showNotification('Günlük güncellendi! ✏️');
    } else {
      res = await fetch('http://localhost:3000/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });
      showNotification('Günlük kaydedildi! 💕');
    }

    if (res.ok) {
      hideNewEntryForm();
      displayEntries();
    } else {
      showNotification('İşlem başarısız oldu!');
    }
  } catch (error) {
    console.error('Kayıt hatası:', error);
    showNotification('Sunucu hatası!');
  }
}
async function fetchEntries() {
  try {
    const response = await fetch('http://localhost:3000/entries'); // Backend URL
    if (!response.ok) throw new Error('Sunucudan veri alınamadı');
    
    const entries = await response.json();
    const grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    
    if (entries.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">Henüz günlük yok</div>
          <p>İlk günlüğünüzü yazmaya başlayın!</p>
        </div>`;
      return;
    }
    
    const entriesHTML = entries.map(entry => `
      <div class="diary-entry" onclick="showEntryDetail(${entry.id})">
        <div class="entry-header">
          <div>
            <div class="entry-title">${entry.title}</div>
            <div class="entry-date">${entry.date} • ${entry.author === 'ozan' ? '👨 Ozan' : entry.author === 'emine' ? '👩 Emine' : entry.author}</div>
          </div>
          <div class="entry-mood">${getMoodEmoji(entry.mood)}</div>
        </div>
        <div class="entry-content">${entry.content}</div>
        <div class="entry-footer">
          <div class="entry-tags">${entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
          <div class="entry-actions" onclick="event.stopPropagation()">
            <button onclick="toggleFavorite(${entry.id})" class="favorite-btn">
              ${entry.isFavorite ? '⭐' : '☆'}
            </button>
            <button onclick="editEntry(${entry.id})" class="edit-btn">✏️</button>
            <button onclick="deleteEntry(${entry.id})" class="delete-btn">🗑️</button>
          </div>
        </div>
      </div>`).join('');
    
    grid.innerHTML = entriesHTML;
  } catch (err) {
    console.error(err);
  }
}

function getMoodEmoji(mood) {
    const moods = { 'happy': '😊', 'love': '❤️', 'sad': '😢', 'excited': '🎉' };
    return moods[mood] || '😊';
}

async function deleteEntry(id) {
  if (!confirm('Bu günlüğü silmek istediğinizden emin misiniz?')) return;

  try {
    const res = await fetch(`http://localhost:3000/entries/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      showNotification('Günlük silindi');
      displayEntries(); 
    } else {
      showNotification('Silme işlemi başarısız oldu');
    }
  } catch (error) {
    console.error('Silme hatası:', error);
    showNotification('Sunucu hatası!');
  }
}


function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 100px; right: 20px; z-index: 1000;
        background: rgba(156, 39, 176, 0.9);
        color: white; padding: 0.75rem 1rem; border-radius: 6px;
        font-size: 0.875rem; font-weight: 500;
        box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

async function toggleFavorite(id) {
  try {
    const resGet = await fetch(`http://localhost:3000/entries/${id}`);
    if (!resGet.ok) return;
    const entry = await resGet.json();

    const updatedEntry = { ...entry, isFavorite: !entry.isFavorite };

    const resPut = await fetch(`http://localhost:3000/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEntry)
    });

    if (resPut.ok) {
      showNotification(updatedEntry.isFavorite ? 'Favorilere eklendi! ⭐' : 'Favorilerden çıkarıldı');
      displayEntries();
    }
  } catch (error) {
    console.error('Favori güncelleme hatası:', error);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    updateLoveCounter();
    displayEntries();
    
    // Her gün sayacı güncelle
    setInterval(updateLoveCounter, 24 * 60 * 60 * 1000);
});
document.getElementById('newEntryModal').addEventListener('click', function(e) {
    if (e.target === this) hideNewEntryForm();
});

// Special Day functions
function showSpecialDayForm() {
    const modal = document.getElementById('specialDayModal');
    modal.classList.add('show');
    document.getElementById('specialDayTitle').focus();
    document.body.style.overflow = 'hidden';
}

function hideSpecialDayForm() {
    const modal = document.getElementById('specialDayModal');
    modal.classList.remove('show');
    document.getElementById('specialDayForm').reset();
    document.body.style.overflow = 'auto';
}

function saveSpecialDay(event) {
    event.preventDefault();
    
    const specialDay = {
        id: Date.now(),
        title: document.getElementById('specialDayTitle').value,
        date: document.getElementById('specialDayDate').value,
        type: document.getElementById('specialDayType').value,
        note: document.getElementById('specialDayNote').value,
        timestamp: new Date()
    };
    
    let specialDays = JSON.parse(localStorage.getItem('specialDays') || '[]');
    specialDays.push(specialDay);
    localStorage.setItem('specialDays', JSON.stringify(specialDays));
    
    hideSpecialDayForm();
    displaySpecialDays();
    showNotification('Özel gün eklendi! 🎉');
}

function displaySpecialDays() {
    const specialDays = JSON.parse(localStorage.getItem('specialDays') || '[]');
    const grid = document.getElementById('entriesGrid');
    
    if (specialDays.length > 0) {
        const specialDaysHTML = specialDays.map(day => `
            <div class="speci/al-day-item">
                <div class="special-day-header">
                    <div class="special-day-title">${day.title}</div>
                    <div class="special-day-actions">
                        <div class="special-day-type">${getSpecialDayEmoji(day.type)}</div>
                        <button onclick="deleteSpecialDay(${day.id})" class="delete-special-btn">🗑️</button>
                    </div>
                </div>
                <div class="special-day-date">${formatDate(day.date)}</div>
                ${day.note ? `<div class="special-day-note">${day.note}</div>` : ''}
            </div>
        `).join('');
        
        grid.innerHTML = specialDaysHTML;
    } else {
        grid.innerHTML = '';
    }
}

function getSpecialDayEmoji(type) {
    const types = {
        'anniversary': '💕',
        'birthday': '🎂',
        'holiday': '🎄',
        'special': '✨',
        'celebration': '🎉'
    };
    return types[type] || '🎉';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function showSpecialDayFormForDate(selectedDate) {
    hideCalendarModal();
    
    // Tarihi form'a otomatik doldur
    const dateString = selectedDate.toISOString().split('T')[0];
    
    const modal = document.getElementById('specialDayModal');
    modal.classList.add('show');
    document.getElementById('specialDayDate').value = dateString;
    document.getElementById('specialDayTitle').focus();
    document.body.style.overflow = 'hidden';
}

function deleteSpecialDay(id) {
    if (confirm('Bu özel günü silmek istediğinizden emin misiniz?')) {
        let specialDays = JSON.parse(localStorage.getItem('specialDays') || '[]');
        specialDays = specialDays.filter(day => day.id !== id);
        localStorage.setItem('specialDays', JSON.stringify(specialDays));
        displaySpecialDays();
        generateCalendar(); // Takvimi güncelle
        showNotification('Özel gün silindi');
    }
}

function editEntry(id) {
    const entries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    const entry = entries.find(entry => entry.id === id);
    
    if (entry) {
        document.getElementById('entryTitle').value = entry.title;
        document.getElementById('entryContent').value = entry.content;
        document.getElementById('entryMood').value = entry.mood;
        document.getElementById('entryAuthor').value = entry.author || '';
        document.getElementById('entryTags').value = entry.tags.join(', ');
        
        const form = document.getElementById('diaryForm');
        form.dataset.editId = id;
        
        showNewEntryForm();
        document.querySelector('#newEntryModal .modal-title').textContent = '✏️ Günlük Düzenle';
    }
}

// Entry detail functions
function showEntryDetail(id) {
    const entries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    const entry = entries.find(entry => entry.id === id);
    
    if (entry) {
        const detailContent = document.getElementById('entryDetailContent');
        const authorDisplay = entry.author === 'ozan' ? '👨 Ozan' : 
                             entry.author === 'emine' ? '👩 Emine' : 
                             entry.author || 'Bilinmeyen';
        
        detailContent.innerHTML = `
            <div class="detail-entry-header">
                <div>
                    <div class="detail-entry-title">${entry.title}</div>
                    <div class="detail-entry-meta">${entry.date} • ${authorDisplay}</div>
                </div>
                <div class="entry-mood" style="font-size: 2rem;">${getMoodEmoji(entry.mood)}</div>
            </div>
            
            <div class="detail-entry-content">${entry.content}</div>
            
            <div class="detail-entry-footer">
                <div class="entry-tags">
                    ${entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="entry-actions">
                    <button onclick="toggleFavorite(${entry.id})" class="favorite-btn">
                        ${entry.isFavorite ? '⭐' : '☆'}
                    </button>
                    <button onclick="editEntry(${entry.id})" class="edit-btn">✏️</button>
                    <button onclick="deleteEntry(${entry.id})" class="delete-btn">🗑️</button>
                </div>
            </div>
        `;
        
        document.getElementById('entryDetailModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideEntryDetail() {
    document.getElementById('entryDetailModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + N = Yeni günlük
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            showNewEntryForm();
        }
        
        // ESC = Modal kapat
        if (e.key === 'Escape') {
            hideNewEntryForm();
            hideEntryDetail();
            hideCalendarModal();
            hideSpecialDayForm();
        }
        
        // Ctrl/Cmd + K = Arama odakla
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    });
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterEntriesBySearch(searchTerm);
    });
}

function filterEntriesBySearch(searchTerm) {
    const entries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    const filteredEntries = entries.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.content.toLowerCase().includes(searchTerm) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    
    displayFilteredEntries(filteredEntries);
}

function displayFilteredEntries(entries) {
    const grid = document.getElementById('entriesGrid');
    
    if (entries.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">Arama sonucu bulunamadı</div>
                <p>Farklı kelimeler deneyin</p>
            </div>
        `;
        return;
    }
    
    const entriesHTML = entries.map(entry => `
        <div class="diary-entry" onclick="showEntryDetail(${entry.id})">
            <div class="entry-header">
                <div>
                    <div class="entry-title">${entry.title}</div>
                    <div class="entry-date">${entry.date}${entry.author ? ' • ' + (entry.author === 'ozan' ? '👨 Ozan' : entry.author === 'emine' ? '👩 Emine' : entry.author) : ''}</div>
                </div>
                <div class="entry-mood">${getMoodEmoji(entry.mood)}</div>
            </div>
            <div class="entry-content">${entry.content}</div>
            <div class="entry-footer">
                <div class="entry-tags">
                    ${entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="entry-actions" onclick="event.stopPropagation()">
                    <button onclick="toggleFavorite(${entry.id})" class="favorite-btn">
                        ${entry.isFavorite ? '⭐' : '☆'}
                    </button>
                    <button onclick="editEntry(${entry.id})" class="edit-btn">✏️</button>
                    <button onclick="deleteEntry(${entry.id})" class="delete-btn">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
    
    grid.innerHTML = entriesHTML;
}

// Sayfa yüklendiğinde giriş kontrolü
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Giriş kontrolü
    if (!checkAuth()) return;
    
    updateLoveCounter();
    displayEntries();
    setupSearch();
    setupKeyboardShortcuts();
    
    setInterval(updateLoveCounter, 24 * 60 * 60 * 1000);
});
