const express = require('express');
const app = express();
const PORT = 3000;

// Middleware para JSON
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: '¡API funcionando!' });
});

// ========== USUARIOS ==========
// POST /api/register
app.post('/api/register', (req, res) => {
    console.log('📝 Registro recibido:', req.body);
    
    const { username, email, password } = req.body;
    
    // Validaciones según casos de prueba
    if (!username || !email || !password) {
        return res.status(400).json({ 
            message: 'Todos los campos son requeridos' 
        });
    }
    
    // CP02: Debug username con símbolos (juan_123)
    if (!/^[A-Za-z0-9]+$/.test(username)) {
        return res.status(400).json({
            message: 'El nombre de usuario solo puede contener letras y números'
        });
    }
    
    // CP01 & CP17: Validar longitud username
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
            message: 'El nombre de usuario debe tener entre 3 y 20 caracteres'
        });
    }
    
    // CP03: Debug email no válido (yahoo.com)
    if (!email.includes('@gmail.com') && !email.includes('@hotmail.com')) {
        return res.status(400).json({
            message: 'Solo se permiten correos @gmail.com o @hotmail.com'
        });
    }
    
    // CP04: Debug password corta
    if (password.length < 8 || password.length > 12) {
        return res.status(400).json({
            message: 'La contraseña debe tener entre 8 y 12 caracteres'
        });
    }
    
    // CP01: Registro exitoso
    res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
            id: 1,
            username: username,
            email: email,
            purchase_count: 0
        }
    });
});

// POST /api/login
app.post('/api/login', (req, res) => {
    console.log('🔐 Login recibido:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            message: 'Email y contraseña requeridos'
        });
    }
    
    // CP06: Debug login con credenciales incorrectas
    // Solo devuelve error si el password es EXACTAMENTE "wrongpass"
    if (password === "wrongpass") {
        return res.status(401).json({
            message: 'Credenciales incorrectas'
        });
    }
    
    // CP05: Login exitoso (para cualquier otra contraseña)
    res.json({
        message: 'Login exitoso',
        token: 'fake-jwt-token-12345',
        user: {
            id: 1,
            username: 'UsuarioDemo',
            email: email,
            purchase_count: 3
        }
    });
});

// GET /api/profile/:id
app.get('/api/profile/:id', (req, res) => {
    console.log('👤 Perfil solicitado para ID:', req.params.id);
    
    // CP15: Obtener perfil exitoso
    res.json({
        id: parseInt(req.params.id),
        username: 'UsuarioDemo',
        email: 'demo@gmail.com',
        purchase_count: 5,
        created_at: '2024-01-01'
    });
});

// PUT /api/profile/:id
app.put('/api/profile/:id', (req, res) => {
    console.log('✏️ Actualizando perfil:', req.params.id, req.body);
    
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({
            message: 'El nombre de usuario es requerido'
        });
    }
    
    // CP17: Debug username inválido (muy corto)
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
            message: 'El nombre de usuario debe tener entre 3 y 20 caracteres'
        });
    }
    
    // CP16: Actualizar perfil exitoso
    res.json({
        message: 'Perfil actualizado exitosamente',
        user: {
            id: parseInt(req.params.id),
            username: username,
            email: 'demo@gmail.com',
            purchase_count: 5
        }
    });
});

// ========== PRODUCTOS ==========
// GET /api/products
app.get('/api/products', (req, res) => {
    console.log('🍕 Productos solicitados');
    
    // CP07: Listar productos exitoso
    res.json({
        products: [
            { id: 1, name: 'Peperoni', price: 150.00, stock: 50 },
            { id: 2, name: 'Hawaiana', price: 180.00, stock: 40 },
            { id: 3, name: 'Al Pastor', price: 200.00, stock: 30 }
        ]
    });
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    console.log('📦 Producto solicitado ID:', productId);
    
    const products = [
        { id: 1, name: 'Peperoni', price: 150.00, stock: 50 },
        { id: 2, name: 'Hawaiana', price: 180.00, stock: 40 },
        { id: 3, name: 'Al Pastor', price: 200.00, stock: 30 }
    ];
    
    const product = products.find(p => p.id === productId);
    
    // CP09: Debug producto no encontrado (ID 999)
    if (!product) {
        return res.status(404).json({
            message: 'Producto no encontrado'
        });
    }
    
    // CP08: Obtener producto específico exitoso
    res.json(product);
});

// ========== CARRITO ==========
// POST /api/cart
app.post('/api/cart', (req, res) => {
    console.log('🛒 Agregando al carrito:', req.body);
    
    const { user_id, product_id, quantity } = req.body;
    
    if (!user_id || !product_id || !quantity) {
        return res.status(400).json({
            message: 'user_id, product_id y quantity son requeridos'
        });
    }
    
    if (quantity <= 0) {
        return res.status(400).json({
            message: 'La cantidad debe ser mayor a 0'
        });
    }
    
    // CP11: Debug sin stock (cantidad 100 para producto con stock 50)
    const products = [
        { id: 1, name: 'Peperoni', price: 150.00, stock: 50 },
        { id: 2, name: 'Hawaiana', price: 180.00, stock: 40 },
        { id: 3, name: 'Al Pastor', price: 200.00, stock: 30 }
    ];
    
    const product = products.find(p => p.id === product_id);
    
    if (product && quantity > product.stock) {
        return res.status(400).json({
            message: `Stock insuficiente. Solo hay ${product.stock} disponibles`
        });
    }
    
    // CP10: Agregar al carrito exitoso
    const cartItemId = Date.now();
    
    // Simular diferentes productos según product_id
    let productName, productPrice;
    switch(product_id) {
        case 1:
            productName = 'Peperoni';
            productPrice = 150.00;
            break;
        case 2:
            productName = 'Hawaiana';
            productPrice = 180.00;
            break;
        case 3:
            productName = 'Al Pastor';
            productPrice = 200.00;
            break;
        default:
            productName = 'Producto';
            productPrice = 0;
    }
    
    res.status(201).json({
        message: 'Producto agregado al carrito',
        cartItem: {
            id: cartItemId,
            user_id: user_id,
            product_id: product_id,
            quantity: quantity,
            name: productName,
            price: productPrice
        }
    });
});

// GET /api/cart/:userId
app.get('/api/cart/:userId', (req, res) => {
    console.log('🛍️ Carrito solicitado para usuario:', req.params.userId);
    
    // CP12: Ver carrito exitoso
    res.json({
        items: [
            { id: 1, product_id: 1, name: 'Peperoni', price: 150.00, quantity: 2 },
            { id: 2, product_id: 2, name: 'Hawaiana', price: 180.00, quantity: 1 }
        ],
        total: 480.00
    });
});

// DELETE /api/cart/:id/user/:userId
app.delete('/api/cart/:id/user/:userId', (req, res) => {
    console.log('🗑️ Eliminando item del carrito:', req.params);
    
    // CP18: Eliminar item del carrito exitoso
    res.json({
        message: 'Producto eliminado del carrito'
    });
});

// DELETE /api/cart/clear/:userId
app.delete('/api/cart/clear/:userId', (req, res) => {
    console.log('🧹 Vaciar carrito usuario:', req.params.userId);
    
    // CP19: Vaciar carrito exitoso
    res.json({
        message: 'Carrito vaciado exitosamente'
    });
});

// ========== VENTAS ==========
// POST /api/checkout
app.post('/api/checkout', (req, res) => {
    console.log('💰 Checkout recibido:', req.body);
    
    const { user_id } = req.body;
    
    if (!user_id) {
        return res.status(400).json({
            message: 'user_id es requerido'
        });
    }
    
    // CP14: Debug checkout con carrito vacío (user_id = 2)
    if (parseInt(user_id) === 2) {
        return res.status(400).json({
            message: 'El carrito está vacío'
        });
    }
    
    // CP13: Checkout exitoso (user_id = 1)
    const saleId = Date.now();
    
    res.json({
        message: 'Compra realizada exitosamente',
        sale: {
            id: saleId,
            user_id: user_id,
            total_amount: 480.00,
            items: [
                { product_id: 1, name: 'Peperoni', quantity: 2, price: 150.00 },
                { product_id: 2, name: 'Hawaiana', quantity: 1, price: 180.00 }
            ],
            purchase_date: new Date().toISOString()
        }
    });
});

// GET /api/purchases/:userId
app.get('/api/purchases/:userId', (req, res) => {
    console.log('📊 Compras usuario:', req.params.userId);
    
    // CP20: Ver historial de compras exitoso
    res.json([
        {
            id: 1,
            user_id: parseInt(req.params.userId),
            total_amount: 480.00,
            purchase_date: '2024-01-15T10:30:00.000Z',
            items: JSON.stringify([
                { product_id: 1, name: 'Peperoni', quantity: 2, price: 150.00 }
            ])
        },
        {
            id: 2,
            user_id: parseInt(req.params.userId),
            total_amount: 200.00,
            purchase_date: '2024-01-10T14:20:00.000Z',
            items: JSON.stringify([
                { product_id: 3, name: 'Al Pastor', quantity: 1, price: 200.00 }
            ])
        }
    ]);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor API PIZZERÍA corriendo en: http://localhost:${PORT}`);
    console.log('📋 CASOS DE PRUEBA CONFIGURADOS:');
    console.log('   CP01  POST /api/register - Registro exitoso');
    console.log('   CP02  POST /api/register - Debug username símbolos');
    console.log('   CP03  POST /api/register - Debug email no válido');
    console.log('   CP04  POST /api/register - Debug password corta');
    console.log('   CP05  POST /api/login   - Login exitoso');
    console.log('   CP06  POST /api/login   - Debug credenciales incorrectas (password: "wrongpass")');
    console.log('   CP07  GET  /api/products - Listar productos');
    console.log('   CP08  GET  /api/products/:id - Producto específico');
    console.log('   CP09  GET  /api/products/999 - Debug producto no existe');
    console.log('   CP10  POST /api/cart - Agregar al carrito');
    console.log('   CP11  POST /api/cart - Debug sin stock (quantity: 100)');
    console.log('   CP12  GET  /api/cart/:userId - Ver carrito');
    console.log('   CP13  POST /api/checkout - Checkout exitoso (user_id: 1)');
    console.log('   CP14  POST /api/checkout - Debug carrito vacío (user_id: 2)');
    console.log('   CP15  GET  /api/profile/:id - Obtener perfil');
    console.log('   CP16  PUT  /api/profile/:id - Actualizar perfil');
    console.log('   CP17  PUT  /api/profile/:id - Debug username inválido');
    console.log('   CP18  DELETE /api/cart/:id/user/:userId - Eliminar item');
    console.log('   CP19  DELETE /api/cart/clear/:userId - Vaciar carrito');
    console.log('   CP20  GET  /api/purchases/:userId - Historial compras');
});