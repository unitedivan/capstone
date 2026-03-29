const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;
const DB_FILE = path.join(ROOT_DIR, "db.json");

const MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};

function defaultDB() {
    return {
        users: [],
        commissions: []
    };
}

function ensureDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB(), null, 2));
    }
}

function readDB() {
    ensureDB();

    try {
        const raw = fs.readFileSync(DB_FILE, "utf8");
        const parsed = JSON.parse(raw);

        return {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            commissions: Array.isArray(parsed.commissions) ? parsed.commissions : []
        };
    } catch (error) {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB(), null, 2));
        return defaultDB();
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function sanitizeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        specialties: user.specialties,
        joinedAt: user.joinedAt
    };
}

function sendJSON(res, statusCode, payload) {
    res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
    res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(text);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;

            if (body.length > 1_000_000) {
                reject(new Error("Request body too large."));
                req.destroy();
            }
        });

        req.on("end", () => {
            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(new Error("Invalid JSON body."));
            }
        });

        req.on("error", reject);
    });
}

function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (error, content) => {
        if (error) {
            sendText(res, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Not found" : "Server error");
            return;
        }

        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
    });
}

function serveStatic(req, res, pathname) {
    const requestedPath = pathname === "/" ? "/index.html" : pathname;
    const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(ROOT_DIR, normalizedPath);

    if (!filePath.startsWith(ROOT_DIR)) {
        sendText(res, 403, "Forbidden");
        return;
    }

    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) {
            sendText(res, 404, "Not found");
            return;
        }

        serveFile(res, filePath);
    });
}

async function handleRequest(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const { pathname } = requestUrl;

    try {
        if (req.method === "GET" && pathname === "/api/health") {
            sendJSON(res, 200, { ok: true });
            return;
        }

        if (req.method === "POST" && pathname === "/api/auth/signup") {
            const { name, email, password } = await readBody(req);

            if (!name || !email || !password) {
                sendJSON(res, 400, { error: "Name, email, and password are required." });
                return;
            }

            const db = readDB();
            const normalizedEmail = String(email).trim().toLowerCase();
            const existingUser = db.users.find((user) => user.email === normalizedEmail);

            if (existingUser) {
                sendJSON(res, 409, { error: "An account with that email already exists." });
                return;
            }

            const user = {
                id: Date.now(),
                name: String(name).trim(),
                email: normalizedEmail,
                password: String(password),
                bio: "New artist on CreateNConnect.",
                specialties: ["Digital Illustration", "Commissions"],
                joinedAt: new Date().toISOString()
            };

            db.users.push(user);
            writeDB(db);
            sendJSON(res, 201, { user: sanitizeUser(user) });
            return;
        }

        if (req.method === "POST" && pathname === "/api/auth/login") {
            const { email, password } = await readBody(req);

            if (!email || !password) {
                sendJSON(res, 400, { error: "Email and password are required." });
                return;
            }

            const db = readDB();
            const normalizedEmail = String(email).trim().toLowerCase();
            const user = db.users.find(
                (entry) => entry.email === normalizedEmail && entry.password === String(password)
            );

            if (!user) {
                sendJSON(res, 401, { error: "Invalid email or password." });
                return;
            }

            sendJSON(res, 200, { user: sanitizeUser(user) });
            return;
        }

        if (req.method === "GET" && pathname.startsWith("/api/users/")) {
            const userId = pathname.split("/").pop();
            const db = readDB();
            const user = db.users.find((entry) => String(entry.id) === String(userId));

            if (!user) {
                sendJSON(res, 404, { error: "User not found." });
                return;
            }

            sendJSON(res, 200, { user: sanitizeUser(user) });
            return;
        }

        if (req.method === "DELETE" && pathname.startsWith("/api/users/")) {
            const userId = pathname.split("/").pop();
            const db = readDB();
            const nextUsers = db.users.filter((entry) => String(entry.id) !== String(userId));

            if (nextUsers.length === db.users.length) {
                sendJSON(res, 404, { error: "User not found." });
                return;
            }

            db.users = nextUsers;
            writeDB(db);
            sendJSON(res, 200, { success: true });
            return;
        }

        if (req.method === "GET" && pathname === "/api/commissions") {
            const db = readDB();
            const commissions = [...db.commissions].sort((a, b) => b.id - a.id);
            sendJSON(res, 200, { commissions });
            return;
        }

        if (req.method === "POST" && pathname === "/api/commissions") {
            const { title, artist, price, image } = await readBody(req);

            if (!title || !artist || !price) {
                sendJSON(res, 400, { error: "Title, artist, and price are required." });
                return;
            }

            const numericPrice = Number(price);
            if (Number.isNaN(numericPrice) || numericPrice < 0) {
                sendJSON(res, 400, { error: "Price must be a valid positive number." });
                return;
            }

            const db = readDB();
            const commission = {
                id: Date.now(),
                title: String(title).trim(),
                artist: String(artist).trim(),
                price: numericPrice,
                image: image && String(image).trim()
                    ? String(image).trim()
                    : `https://picsum.photos/seed/${Date.now()}/400/300`
            };

            db.commissions.push(commission);
            writeDB(db);
            sendJSON(res, 201, { commission });
            return;
        }

        if (req.method === "DELETE" && pathname.startsWith("/api/commissions/")) {
            const commissionId = pathname.split("/").pop();
            const db = readDB();
            const nextCommissions = db.commissions.filter(
                (commission) => String(commission.id) !== String(commissionId)
            );

            if (nextCommissions.length === db.commissions.length) {
                sendJSON(res, 404, { error: "Commission not found." });
                return;
            }

            db.commissions = nextCommissions;
            writeDB(db);
            sendJSON(res, 200, { success: true });
            return;
        }

        if (req.method === "GET") {
            serveStatic(req, res, pathname);
            return;
        }

        sendText(res, 405, "Method not allowed");
    } catch (error) {
        sendJSON(res, 400, { error: error.message || "Request failed." });
    }
}

ensureDB();

function createServer() {
    return http.createServer((req, res) => {
        handleRequest(req, res);
    });
}

const server = createServer();

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = {
    PORT,
    createServer,
    defaultDB,
    handleRequest,
    readDB,
    sanitizeUser,
    writeDB
};
