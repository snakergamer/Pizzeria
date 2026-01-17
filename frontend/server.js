const express = require('express');
const path = require('path');
const session = require('express-session');
const http = require('http');

const app = express();
const PORT = 8080;
const BACKEND_URL = 'http://localhost:3000/api'; // Updated to use /api prefix

function fetchFromBackend(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || { 'Content-Type': 'application/json' }
        };

        const req = http.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: parsedData
                    });
                } catch (e) {
                    console.error("Error parsing JSON from backend:", data); // Log raw data for debug
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

// Ensure views directory is correct
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
}));

// Middleware to expose session user to all views
// Middleware to expose session user to all views
app.use((req, res, next) => {
    // Expose directly for compatibility with explicit generic views
    res.locals.username = req.session.username;
    res.locals.email = req.session.email;

    // Also keep user object if needed by some views
    res.locals.user = {
        username: req.session.username,
        email: req.session.email
    };
    res.locals.role = req.session.role; // Expose role
    next();
});

// --- ROUTES ---

app.get('/', (req, res) => {
    if (req.session.loggedin) {
        return res.redirect('/tienda');
    }
    res.render('login', { error: null });
});

app.get('/login', (req, res) => {
    if (req.session.loggedin) {
        return res.redirect('/tienda');
    }
    res.render('login', { error: null });
});

app.get('/register', (req, res) => {
    if (req.session.loggedin) {
        return res.redirect('/tienda');
    }
    res.render('register', { error: null });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/login`, {
            method: 'POST',
            body: { email, password }
        });

        if (result.ok) {
            req.session.loggedin = true;
            req.session.userId = result.data.user.id;
            req.session.username = result.data.user.username;
            req.session.email = result.data.user.email;
            req.session.role = result.data.user.role; // Save role

            if (result.data.user.role === 'admin') {
                res.redirect('/admin');
            } else {
                res.redirect('/tienda');
            }
        } else {
            res.render('login', { error: result.data.message || 'Error de login' });
        }
    } catch (err) {
        res.render('login', { error: 'Error de conexión' });
    }
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/register`, {
            method: 'POST',
            body: { username, email, password }
        });

        if (result.ok) {
            // Auto login
            req.session.loggedin = true;
            req.session.userId = result.data.user.id;
            req.session.username = result.data.user.username;
            req.session.email = result.data.user.email;
            req.session.role = result.data.user.role || 'user';
            res.redirect('/tienda');
        } else {
            res.render('register', { error: result.data.message });
        }
    } catch (err) {
        res.render('register', { error: 'Error de conexión' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/tienda', async (req, res) => {
    if (!req.session.loggedin) return res.redirect('/');
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/products`);
        res.render('index', { products: result.data.products });
    } catch (err) {
        res.send("Error cargando productos");
    }
});

app.get('/perfil', async (req, res) => {
    if (!req.session.loggedin) return res.redirect('/');
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/profile/${req.session.userId}`);
        res.render('perfil', { user: result.data.user, history: result.data.history });
    } catch (err) {
        res.send("Error cargando perfil");
    }
});

app.post('/perfil/update', async (req, res) => {
    if (!req.session.loggedin) return res.redirect('/');
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/profile/${req.session.userId}`, {
            method: 'PUT',
            body: req.body
        });
        if (result.ok) {
            req.session.username = result.data.user.username;
            res.redirect('/perfil');
        } else {
            res.send("Error actualizando perfil");
        }
    } catch (err) {
        res.send("Error de conexión");
    }
});

app.get('/carrito', async (req, res) => {
    if (!req.session.loggedin) return res.redirect('/');
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/cart/${req.session.userId}`);
        res.render('carrito', { cartItems: result.data.items, total: result.data.total });
    } catch (err) {
        res.render('carrito', { cartItems: [], total: 0 });
    }
});

app.post('/carrito/add', async (req, res) => {
    if (!req.session.loggedin) return res.redirect('/');
    try {
        await fetchFromBackend(`${BACKEND_URL}/cart`, {
            method: 'POST',
            body: {
                user_id: req.session.userId,
                product_id: req.body.product_id,
                quantity: req.body.quantity
            }
        });
        res.redirect('/tienda'); // Redirect back to store after adding
    } catch (err) {
        res.redirect('/tienda');
    }
});

app.get('/carrito/remove/:id', async (req, res) => {
    if (!req.session.loggedin) return res.redirect('/');
    try {
        await fetchFromBackend(`${BACKEND_URL}/cart/${req.params.id}/user/${req.session.userId}`, {
            method: 'DELETE'
        });
        res.redirect('/carrito');
    } catch (err) {
        res.redirect('/carrito');
    }
});

app.post('/comprar', async (req, res) => {
    if (!req.session.loggedin) return res.redirect('/');
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/checkout`, {
            method: 'POST',
            body: { user_id: req.session.userId }
        });
        if (result.ok) {
            res.redirect('/tienda?status=success');
        } else {
            res.redirect('/carrito');
        }
    } catch (err) {
        res.redirect('/carrito');
    }
});

// --- ADMIN ROUTES ---

app.get('/admin', async (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') return res.redirect('/tienda');
    try {
        // Reuse product endpoint, but render admin view
        const result = await fetchFromBackend(`${BACKEND_URL}/products`);
        res.render('admin', { products: result.data.products });
    } catch (err) {
        res.send("Error cargando panel admin");
    }
});

app.post('/admin/add', async (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') return res.redirect('/tienda');
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/admin/add`, {
            method: 'POST',
            body: req.body
        });

        if (result.ok && result.data.status === 'success') {
            res.redirect(`/admin?status=success&message=${encodeURIComponent(result.data.message)}`);
        } else {
            const msg = result.data.message || "Error al agregar producto";
            res.redirect(`/admin?status=error&message=${encodeURIComponent(msg)}`);
        }
    } catch (err) {
        res.redirect('/admin?status=error&message=Error+de+conexión');
    }
});

app.get('/admin/delete/:id', async (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') return res.redirect('/tienda');
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/admin/delete/${req.params.id}`, {
            method: 'DELETE'
        });

        if (result.ok && result.data.status === 'success') {
            res.redirect(`/admin?status=success&message=${encodeURIComponent(result.data.message)}`);
        } else {
            const msg = result.data.message || "Error al eliminar producto";
            res.redirect(`/admin?status=error&message=${encodeURIComponent(msg)}`);
        }
    } catch (err) {
        res.redirect('/admin?status=error&message=Error+de+conexión');
    }
});

app.post('/admin/restock', async (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') return res.redirect('/tienda');
    try {
        // req.body should contain product_id and amount
        const result = await fetchFromBackend(`${BACKEND_URL}/admin/restock/${req.body.product_id}`, {
            method: 'POST',
            body: { amount: req.body.amount }
        });

        if (result.ok && result.data.status === 'success') {
            res.redirect(`/admin?status=success&message=${encodeURIComponent(result.data.message)}`);
        } else {
            const msg = result.data.message || "Error al reponer stock";
            res.redirect(`/admin?status=error&message=${encodeURIComponent(msg)}`);
        }
    } catch (err) {
        res.redirect('/admin?status=error&message=Error+de+conexión');
    }
});


app.listen(PORT, () => {
    console.log(`Frontend running on http://localhost:${PORT}`);
});
