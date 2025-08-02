const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Veritabanı aç / oluştur
const db = new sqlite3.Database('./diary.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('SQLite DB bağlı.');
    }
});

// Tablo oluştur (yoksa)
db.run(`
CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT NOT NULL,
    tags TEXT,
    date TEXT NOT NULL
)
`);

// Tüm günlükleri listele
app.get('/entries', (req, res) => {
    db.all(`SELECT * FROM entries ORDER BY date DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // tags JSON array olarak geri yollanacak
        const data = rows.map(row => ({
            id: row.id,
            author: row.author,
            title: row.title,
            content: row.content,
            mood: row.mood,
            tags: row.tags ? JSON.parse(row.tags) : [],
            date: row.date
        }));
        res.json(data);
    });
});

// Yeni günlük ekle
app.post('/entries', (req, res) => {
    const { author, title, content, mood, tags, date } = req.body;
    if (!author || !title || !content || !mood || !date) {
        return res.status(400).json({ error: "Gerekli alanlar eksik." });
    }
    const tagsString = JSON.stringify(tags || []);
    const sql = `INSERT INTO entries (author, title, content, mood, tags, date) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [author, title, content, mood, tagsString, date];
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
    });
});

// Günlük sil (isteğe bağlı)
app.delete('/entries/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM entries WHERE id = ?`, id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ deletedID: id });
    });
});

app.listen(port, () => {
    console.log(`Server çalışıyor http://localhost:${port}`);
});
