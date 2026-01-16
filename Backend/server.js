const express = require('express');
const app = express();
const PORT = 3000;
const connection = require('./config/dbconfig.js');

app.use(express.json());

app.get('/api/health', (req, res) => {
    connection.query('SELECT 1', (err, results) => {
        if (err) {
            console.error('❌ Error de conexión a BD:', err);
            return res.status(500).json({
                status: 'error',
                message: 'No hay conexión a la base de datos',
                error: err.message
            });
        }
        console.log('✅ Conexión a BD OK');
        res.json({
            status: 'ok',
            message: '¡BD conectada!',
            timestamp: new Date().toISOString()
        });
    });
});

app.get('/api/debug/usuarios', (req, res) => {
    connection.query('SELECT id, username, email FROM usuarios', (err, results) => {
        if (err) {
            return res.status(500).json({
                message: 'Error al obtener usuarios',
                error: err.message
            });
        }
        res.json({
            total: results.length,
            usuarios: results
        });
    });
});

app.get('/', (req, res) => {
    res.json({ message: '¡API funcionando!' });
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    
    console.log('📝 Solicitud POST /api/register:', { username, email, password: '***' });
    
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
    
    const User = require('./models/userModel.js');
    const user = new User({
        username: username,
        email: email,
        password: password
    });
    
    console.log('💾 Intentando guardar usuario en BD...');
    
    User.create(user, (err, data) => {
        if (err) {
            console.error('❌ ERROR EN User.create:', err);
            console.error('❌ Código de error:', err.code);
            console.error('❌ Mensaje de error:', err.message);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "El usuario o correo ya existen" });
            }
            return res.status(500).json({ message: err.message || "Error al registrar usuario" });
        }
        
        console.log('✅ Usuario guardado en BD:', { id: data.id, username: data.username, email: data.email });
        
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: data.id,
                username: data.username,
                email: data.email,
                purchase_count: 0
            }
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔑 Intento de login:', { email });
    
    if (!email || !password) {
        return res.status(400).json({
            message: 'Email y contraseña requeridos'
        });
    }
    
    const User = require('./models/userModel.js');
    
    User.findByEmail(email, (err, user) => {
        if (err) {
            console.error('❌ Error en findByEmail:', err);
            if (err.kind === "not_found") {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
            return res.status(500).json({ message: err.message || "Error al buscar usuario" });
        }
        
        if (!user) {
            console.warn('⚠️ Usuario no encontrado:', email);
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        console.log('✅ Usuario encontrado:', user.username);
        console.log('🔍 Contraseña BD:', user.password);
        console.log('🔍 Contraseña ingresada:', password);
        
        if (user.password === password) {
            console.log('✅ Contraseña correcta');
            res.json({
                message: 'Login exitoso',
                token: 'fake-jwt-token-' + user.id,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    purchase_count: user.purchase_count
                }
            });
        } else {
            console.log('❌ Contraseña incorrecta');
            res.status(401).json({
                message: 'Credenciales incorrectas'
            });
        }
    });
});

app.get('/api/profile/:id', (req, res) => {
    const User = require('./models/userModel.js');
    const userId = req.params.id;
    
    User.findById(userId, (err, user) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
            return res.status(500).json({ message: err.message || "Error al obtener perfil" });
        }
        
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            purchase_count: user.purchase_count,
            created_at: user.created_at
        });
    });
});

app.put('/api/profile/:id', (req, res) => {
    const { username, email, password } = req.body;
    const userId = req.params.id;
    
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
    
    const User = require('./models/userModel.js');
    const user = new User({
        username: username,
        email: email,
        password: password
    });
    
    User.update(userId, user, (err, data) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "El usuario o correo ya existen" });
            }
            return res.status(500).json({ message: err.message || "Error al actualizar perfil" });
        }
        
        res.json({
            message: 'Perfil actualizado exitosamente',
            user: {
                id: userId,
                username: username,
                email: email
            }
        });
    });
});

app.get('/api/products', (req, res) => {
    const Product = require('./models/productModel.js');
    
    Product.getAll((err, data) => {
        if (err) {
            return res.status(500).json({
                message: err.message || 'Error al obtener productos'
            });
        }
        
        res.json({
            products: data || []
        });
    });
});

app.get('/api/products/:id', (req, res) => {
    const Product = require('./models/productModel.js');
    const productId = parseInt(req.params.id);
    
    Product.getAll((err, products) => {
        if (err) {
            return res.status(500).json({
                message: err.message || 'Error al obtener productos'
            });
        }
        
        const product = (products || []).find(p => p.id === productId);
        
        if (!product) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }
        
        res.json(product);
    });
});

app.post('/api/cart', (req, res) => {
    const { user_id, product_id, quantity } = req.body;
    
    console.log('🛒 Solicitud POST /api/cart:', { user_id, product_id, quantity });
    
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
    
    const Cart = require('./models/cartModel.js');
    const cartItem = new Cart({
        user_id: user_id,
        product_id: product_id,
        quantity: quantity
    });
    
    console.log('📦 Agregando item al carrito:', cartItem);
    
    Cart.addToCart(cartItem, (err, data) => {
        if (err) {
            console.error('❌ Error en Cart.addToCart:', err);
            return res.status(500).json({
                message: err.message || 'Error al agregar al carrito'
            });
        }
        console.log('✅ Item agregado al carrito:', data);
        res.status(201).json({
            message: 'Producto agregado al carrito',
            cartItem: data
        });
    });
});

app.get('/api/cart/:userId', (req, res) => {
    const Cart = require('./models/cartModel.js');
    const userId = req.params.userId;
    
    console.log('📦 Obteniendo carrito para usuario:', userId);
    
    Cart.getCartByUserId(userId, (err, data) => {
        if (err) {
            console.error('❌ Error en Cart.getCartByUserId:', err);
            return res.status(500).json({
                message: err.message || 'Error al obtener carrito'
            });
        }
        
        let total = 0;
        if (data && data.length > 0) {
            total = data.reduce((sum, item) => sum + parseFloat(item.total), 0);
        }
        
        // Asegurar que total sea un número válido
        total = parseFloat(total.toFixed(2));
        console.log('✅ Carrito obtenido:', { items: data?.length || 0, total });
        
        res.json({
            items: data || [],
            total: total
        });
    });
});

app.delete('/api/cart/:id/user/:userId', (req, res) => {
    const Cart = require('./models/cartModel.js');
    const cartId = req.params.id;
    
    console.log('🗑️ Eliminando del carrito, ID:', cartId);
    
    Cart.removeFromCart(cartId, (err, data) => {
        if (err) {
            console.error('❌ Error en Cart.removeFromCart:', err);
            return res.status(500).json({
                message: err.message || 'Error al eliminar del carrito'
            });
        }
        console.log('✅ Item eliminado del carrito');
        res.json({
            message: 'Producto eliminado del carrito'
        });
    });
});

app.delete('/api/cart/clear/:userId', (req, res) => {
    const Cart = require('./models/cartModel.js');
    const userId = req.params.userId;
    
    Cart.clearCart(userId, (err, data) => {
        if (err) {
            return res.status(500).json({
                message: err.message || 'Error al vaciar carrito'
            });
        }
        res.json({
            message: 'Carrito vaciado exitosamente'
        });
    });
});

app.post('/api/checkout', (req, res) => {
    const { user_id } = req.body;
    
    console.log('💳 Checkout iniciado para usuario:', user_id);
    
    if (!user_id) {
        return res.status(400).json({
            message: 'user_id es requerido'
        });
    }
    
    const Cart = require('./models/cartModel.js');
    
    Cart.getCartByUserId(user_id, (err, cartItems) => {
        if (err) {
            console.error('❌ Error al obtener carrito:', err);
            return res.status(500).json({
                message: err.message || 'Error al procesar compra'
            });
        }
        
        if (!cartItems || cartItems.length === 0) {
            console.warn('⚠️ Carrito vacío para usuario:', user_id);
            return res.status(400).json({
                message: 'El carrito está vacío'
            });
        }
        
        console.log('✅ Carrito obtenido con', cartItems.length, 'items');
        
        let total = 0;
        cartItems.forEach(item => {
            total += parseFloat(item.total) || 0;
        });
        total = parseFloat(total.toFixed(2));
        
        console.log('💰 Total de compra:', total);
        
        connection.query(
            'INSERT INTO ventas (user_id, total_amount, items) VALUES (?, ?, ?)',
            [user_id, total, JSON.stringify(cartItems)],
            (err, result) => {
                if (err) {
                    console.error('❌ Error al insertar venta:', err);
                    return res.status(500).json({
                        message: err.message || 'Error al guardar compra'
                    });
                }
                
                console.log('✅ Venta creada, ID:', result.insertId);
                
                // Vaciar carrito después de compra exitosa
                Cart.clearCart(user_id, (clearErr, clearResult) => {
                    if (clearErr) {
                    } else {
                        console.log('✅ Carrito vaciado');
                    }
                    
                    res.json({
                        message: 'Compra realizada exitosamente',
                        sale: {
                            id: result.insertId,
                            user_id: user_id,
                            total_amount: total,
                            items: cartItems,
                            purchase_date: new Date().toISOString()
                        }
                    });
                });
            }
        );
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