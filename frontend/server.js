const express = require('express');
const path = require('path');
const session = require('express-session');
const http = require('http');

const app = express();
const PORT = 8080;
const BACKEND_URL = 'http://localhost:3000';

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
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
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

app.get('/', (req, res) => {
    res.render('login', { 
        title: 'Login - Pizzería',
        showHeader: false,
        error: null,
        success: null
    });
});

app.get('/register', (req, res) => {
    res.render('register', { 
        title: 'Registro - Pizzería',
        showHeader: false,
        error: null,
        success: null
    });
});

app.post('/login', async (req, res) => {
    console.log('🔑 Datos recibidos en /login:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.render('login', {
            title: 'Login - Pizzería',
            showHeader: false,
            error: 'El correo y la contraseña son requeridos',
            success: null
        });
    }
    
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { email, password }
        });
        
        if (result.ok && result.data.user) {
            req.session.loggedin = true;
            req.session.userId = result.data.user.id;
            req.session.username = result.data.user.username;
            req.session.email = result.data.user.email;
            
            console.log('✅ Login exitoso:', result.data.user.username);
            res.redirect('/tienda');
        } else {
            return res.render('login', {
                title: 'Login - Pizzería',
                showHeader: false,
                error: result.data.message || 'Correo o contraseña incorrectos',
                success: null
            });
        }
    } catch (err) {
        console.error('❌ Error en login:', err);
        return res.render('login', {
            title: 'Login - Pizzería',
            showHeader: false,
            error: 'Error al conectar con el servidor',
            success: null
        });
    }
});

app.post('/register', async (req, res) => {
    console.log('📝 Solicitud POST /register:', { username: req.body.username, email: req.body.email });
    
    const { username, email, password, confirm } = req.body;
    
    if (!username || !email || !password || !confirm) {
        return res.render('register', {
            title: 'Registro - Pizzería',
            showHeader: false,
            error: 'Todos los campos son requeridos',
            success: null
        });
    }
    
    if (password !== confirm) {
        return res.render('register', {
            title: 'Registro - Pizzería',
            showHeader: false,
            success: null,
            error: 'Las contraseñas no coinciden'
        });
    }
    
    try {
        console.log('📤 Enviando solicitud al backend...');
        const result = await fetchFromBackend(`${BACKEND_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { username, email, password }
        });
        
        console.log('📥 Respuesta del backend:', { status: result.status, ok: result.ok, message: result.data.message });
        
        if (result.ok && result.data.user) {
            console.log('✅ Usuario registrado exitosamente:', result.data.user.username);
            
            return res.render('login', {
                title: 'Login - Pizzería',
                showHeader: false,
                error: null,
                success: '¡Usuario registrado! Ahora inicia sesión.'
            });
        } else {
            console.warn('⚠️ Error en registro:', result.data.message);
            return res.render('register', {
                title: 'Registro - Pizzería',
                showHeader: false,
                error: result.data.message || 'Error al registrar',
                success: null
            });
        }
    } catch (err) {
        console.error('❌ Error en registro:', err);
        return res.render('register', {
            title: 'Registro - Pizzería',
            showHeader: false,
            error: 'Error al conectar con el servidor',
            success: null
        });
    }
});

app.post('/logout', (req, res) => {
    console.log('👋 Usuario cerró sesión');
    req.session.loggedin = false;
    req.session.destroy();
    res.redirect('/');
});

app.get('/logout', (req, res) => {
    console.log('👋 Usuario cerró sesión');
    req.session.loggedin = false;
    req.session.destroy();
    res.redirect('/');
});

app.get('/tienda', async (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/');
    }
    
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/api/products`);
        const products = result.data.products || [];
        
        const user = {
            id: req.session.userId,
            username: req.session.username,
            email: req.session.email
        };
        
        res.render('index', { 
            title: 'Tienda - Pizzería',
            user: user,
            products: products,
            showHeader: true
        });
    } catch (err) {
        console.error('❌ Error al cargar productos:', err);
        res.render('index', { 
            title: 'Tienda - Pizzería',
            user: {
                username: req.session.username,
                email: req.session.email
            },
            products: [],
            showHeader: true,
            error: 'Error al cargar los productos'
        });
    }
});

app.get('/home', (req, res) => {
    res.redirect('/tienda');
});

app.get('/perfil', (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/');
    }
    
    const user = {
        id: req.session.userId,
        username: req.session.username,
        email: req.session.email
    };
    
    res.render('perfil', { 
        title: 'Perfil - Pizzería',
        user: user,
        showHeader: true
    });
});

app.get('/profile', (req, res) => {
    res.redirect('/perfil');
});

app.get('/carrito', async (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/');
    }
    
    console.log('📦 Obteniendo carrito para usuario:', req.session.userId);
    
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/api/cart/${req.session.userId}`);
        
        console.log('📊 Carrito obtenido:', { items: result.data.items?.length || 0, total: result.data.total });
        
        const cartItems = result.data.items || [];
        const total = result.data.total || 0;
        
        const user = {
            id: req.session.userId,
            username: req.session.username
        };
        
        res.render('carrito', { 
            title: 'Carrito - Pizzería',
            user: user,
            showHeader: true,
            cartItems: cartItems,
            total: total
        });
    } catch (err) {
        console.error('❌ Error al cargar carrito:', err);
        res.render('carrito', { 
            title: 'Carrito - Pizzería',
            user: {
                id: req.session.userId,
                username: req.session.username
            },
            showHeader: true,
            cartItems: [],
            total: 0
        });
    }
});

app.post('/carrito/add', async (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/');
    }
    
    const { product_id, quantity } = req.body;
    console.log('🛒 Solicitud POST /carrito/add:', { product_id, quantity });
    console.log('👤 Usuario:', req.session.userId);
    
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/api/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                user_id: req.session.userId,
                product_id: parseInt(product_id),
                quantity: parseInt(quantity) || 1
            }
        });
        
        console.log('📦 Respuesta del backend:', { status: result.status, ok: result.ok });
        
        if (result.ok) {
            console.log('✅ Producto añadido al carrito');
            res.redirect('/carrito');
        } else {
            console.error('❌ Error:', result.data.message);
            res.redirect('/tienda');
        }
    } catch (err) {
        console.error('❌ Error al añadir al carrito:', err);
        res.redirect('/tienda');
    }
});

app.get('/cart', (req, res) => {
    res.redirect('/carrito');
});

app.get('/carrito/remove/:id', async (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/');
    }
    
    console.log('🗑️ Eliminando del carrito:', req.params.id);
    
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/api/cart/${req.params.id}/user/${req.session.userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (result.ok) {
            console.log('✅ Producto eliminado del carrito');
        } else {
            console.error('❌ Error:', result.data.message);
        }
        res.redirect('/carrito');
    } catch (err) {
        console.error('❌ Error al eliminar del carrito:', err);
        res.redirect('/carrito');
    }
});

app.post('/comprar', async (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/');
    }
    
    console.log('💳 Procesando compra para usuario:', req.session.userId);
    
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/api/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { user_id: req.session.userId }
        });
        
        if (result.ok) {
            console.log('✅ Compra realizada exitosamente');
            res.redirect('/tienda?status=success');
        } else {
            console.error('❌ Error en compra:', result.data.message);
            res.render('carrito', {
                title: 'Carrito - Pizzería',
                user: { id: req.session.userId, username: req.session.username },
                showHeader: true,
                cartItems: [],
                total: 0,
                error: result.data.message || 'Error al procesar la compra'
            });
        }
    } catch (err) {
        console.error('❌ Error al procesar compra:', err);
        res.redirect('/carrito');
    }
});

app.post('/perfil/update', async (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/');
    }
    
    const { username, email, password } = req.body;
    
    console.log('✏️ Actualizando perfil:', { username, email });
    
    try {
        const result = await fetchFromBackend(`${BACKEND_URL}/api/profile/${req.session.userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: { username, email, password }
        });
        
        if (result.ok) {
            req.session.username = username;
            req.session.email = email;
            
            console.log('✅ Perfil actualizado exitosamente');
            res.render('perfil', {
                title: 'Perfil - Pizzería',
                user: {
                    id: req.session.userId,
                    username: req.session.username,
                    email: req.session.email
                },
                showHeader: true,
                success: 'Perfil actualizado exitosamente'
            });
        } else {
            console.error('❌ Error al actualizar:', result.data.message);
            res.render('perfil', {
                title: 'Perfil - Pizzería',
                user: {
                    id: req.session.userId,
                    username: req.session.username,
                    email: req.session.email
                },
                showHeader: true,
                error: result.data.message || 'Error al actualizar perfil'
            });
        }
    } catch (err) {
        console.error('❌ Error al actualizar perfil:', err);
        res.render('perfil', {
            title: 'Perfil - Pizzería',
            user: {
                id: req.session.userId,
                username: req.session.username,
                email: req.session.email
            },
            showHeader: true,
            error: 'Error al conectar con el servidor'
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Frontend EJS corriendo en: http://localhost:${PORT}`);
    
    setTimeout(() => {
        console.log('🔍 Verificando conexión a backend...');
        const http = require('http');
        const req = http.get('http://localhost:3000/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.status === 'ok') {
                        console.log('✅ Backend y Base de Datos conectados correctamente');
                    } else {
                        console.warn('⚠️ Backend respondió pero hay problemas con BD');
                    }
                } catch (e) {
                    console.warn('⚠️ Error al verificar backend');
                }
            });
        });
        req.on('error', () => {
            console.error('❌ NO SE PUEDE CONECTAR AL BACKEND (puerto 3000)');
            console.error('❌ Asegúrate de que el backend esté ejecutándose');
        });
    }, 500);
    
    console.log('📋 Rutas disponibles:');
    console.log('   GET  /              (Login)');
    console.log('   GET  /register      (Registro)');
    console.log('   POST /login         ← IMPORTANTE!');
    console.log('   POST /register      ← IMPORTANTE!');
    console.log('   GET  /logout        (Cerrar sesión)');
    console.log('   POST /logout        (Cerrar sesión)');
    console.log('   GET  /tienda        (Tienda/Inicio)');
    console.log('   GET  /perfil        (Perfil usuario)');
    console.log('   POST /perfil/update ← IMPORTANTE! (Actualizar perfil)');
    console.log('   GET  /carrito       (Carrito de compras)');
    console.log('   POST /carrito/add   ← IMPORTANTE! (Añadir al carrito)');
    console.log('   GET  /carrito/remove/:id (Eliminar del carrito)');
    console.log('   POST /comprar       ← IMPORTANTE! (Procesar compra)');
});
