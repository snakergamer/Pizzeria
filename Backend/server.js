const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: '¡API funcionando!' });
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ 
            message: 'Todos los campos son requeridos' 
        });
    }
    
    if (!/^[A-Za-z0-9]+$/.test(username)) {
        return res.status(400).json({
            message: 'El nombre de usuario solo puede contener letras y números'
        });
    }
    
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
            message: 'El nombre de usuario debe tener entre 3 y 20 caracteres'
        });
    }
    
    if (!email.includes('@gmail.com') && !email.includes('@hotmail.com')) {
        return res.status(400).json({
            message: 'Solo se permiten correos @gmail.com o @hotmail.com'
        });
    }
    
    if (password.length < 8 || password.length > 12) {
        return res.status(400).json({
            message: 'La contraseña debe tener entre 8 y 12 caracteres'
        });
    }
    
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

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            message: 'Email y contraseña requeridos'
        });
    }
    
    if (password === "wrongpass") {
        return res.status(401).json({
            message: 'Credenciales incorrectas'
        });
    }
    
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

app.get('/api/profile/:id', (req, res) => {
    res.json({
        id: parseInt(req.params.id),
        username: 'UsuarioDemo',
        email: 'demo@gmail.com',
        purchase_count: 5,
        created_at: '2024-01-01'
    });
});

app.put('/api/profile/:id', (req, res) => {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({
            message: 'El nombre de usuario es requerido'
        });
    }
    
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
            message: 'El nombre de usuario debe tener entre 3 y 20 caracteres'
        });
    }
    
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

app.get('/api/products', (req, res) => {
    res.json({
        products: [
            { id: 1, name: 'Peperoni', price: 150.00, stock: 50 },
            { id: 2, name: 'Hawaiana', price: 180.00, stock: 40 },
            { id: 3, name: 'Al Pastor', price: 200.00, stock: 30 }
        ]
    });
});

app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    
    const products = [
        { id: 1, name: 'Peperoni', price: 150.00, stock: 50 },
        { id: 2, name: 'Hawaiana', price: 180.00, stock: 40 },
        { id: 3, name: 'Al Pastor', price: 200.00, stock: 30 }
    ];
    
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        return res.status(404).json({
            message: 'Producto no encontrado'
        });
    }
    
    res.json(product);
});

app.post('/api/cart', (req, res) => {
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
    
    const cartItemId = Date.now();
    
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

app.get('/api/cart/:userId', (req, res) => {
    res.json({
        items: [
            { id: 1, product_id: 1, name: 'Peperoni', price: 150.00, quantity: 2 },
            { id: 2, product_id: 2, name: 'Hawaiana', price: 180.00, quantity: 1 }
        ],
        total: 480.00
    });
});

app.delete('/api/cart/:id/user/:userId', (req, res) => {
    res.json({
        message: 'Producto eliminado del carrito'
    });
});

app.delete('/api/cart/clear/:userId', (req, res) => {
    res.json({
        message: 'Carrito vaciado exitosamente'
    });
});

app.post('/api/checkout', (req, res) => {
    const { user_id } = req.body;
    
    if (!user_id) {
        return res.status(400).json({
            message: 'user_id es requerido'
        });
    }
    
    if (parseInt(user_id) === 2) {
        return res.status(400).json({
            message: 'El carrito está vacío'
        });
    }
    
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

app.get('/api/purchases/:userId', (req, res) => {
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

app.listen(PORT, () => {
    console.log(`✅ Servidor API PIZZERÍA corriendo en: http://localhost:${PORT}`);
});