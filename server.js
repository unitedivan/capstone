const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const PORT = 3000;

// Storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// Fake database (JSON file)
const DB_FILE = "db.json";

// Helper to read DB
function readDB() {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE));
}

// Helper to write DB
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ➕ Add commission
app.post("/commissions", upload.single("audio"), (req, res) => {
    const { title, price } = req.body;

    if (!title || !price || !req.file) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const commissions = readDB();

    const newCommission = {
        id: Date.now(),
        title,
        price,
        audio: `/uploads/${req.file.filename}`
    };

    commissions.push(newCommission);
    writeDB(commissions);

    res.json(newCommission);
});

// 📥 Get all commissions
app.get("/commissions", (req, res) => {
    res.json(readDB());
});

// ❌ Delete commission
app.delete("/commissions/:id", (req, res) => {
    let commissions = readDB();

    commissions = commissions.filter(c => c.id != req.params.id);
    writeDB(commissions);

    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));