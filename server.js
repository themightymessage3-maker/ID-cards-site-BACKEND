require('dotenv').config(); // To load environment variables from .env file
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const connectDB = require('./database.js'); // Import the database connection
const User = require('./models/User.js'); // Import the User model
const Order = require('./models/Order.js'); // Import the Order model
const Setting = require('./models/Setting.js'); // Import the Setting model
const Catalog = require('./models/Catalog.js'); // Import Catalog model

// Connect to Database
connectDB();

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: [
        'https://clubs21sids.vercel.app',
        'https://clubs21ids.org',
        'https://www.clubs21ids.org',
        'http://localhost:5500', // For local development if you use Live Server
        'http://127.0.0.1:5500'  // Another local development address
    ],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); // Allow requests from your frontend
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Multer for file uploads (memory storage for direct Cloudinary upload)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Cloudinary configuration
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// Basic route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// New status route for deployment verification
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running and CORS is configured correctly.', version: '1.1' });
});

// --- API ROUTES ---

// POST /api/register - User Registration
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with that email already exists.' });
    }
    user = await User.findOne({ username });
    if (user) {
        return res.status(400).json({ message: 'Username is already taken.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the new user
    user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully!' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/login - User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        // Check for user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // On successful login
        res.status(200).json({
            message: 'Login successful!',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName
            }
        });

    } catch (err) {
        console.error(err.message);
    res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/login - Admin Login
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // *** Crucial Admin Check ***
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Access Forbidden: Not an administrator.' });
        }

        // On successful admin login
        res.status(200).json({
            message: 'Admin login successful!',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });

    } catch (err) {
        console.error('Admin login error:', err.message);
    res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/user/:id - Get full user details
app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // Exclude password from result
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error(err.message);
    res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/user/account/:id - Update user account details
app.put('/api/user/account/:id', async (req, res) => {
    const { firstName, lastName, displayName, email } = req.body;

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update fields
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.displayName = displayName || user.displayName;
        user.email = email || user.email;

        await user.save();
        res.status(200).json({ message: 'Account details updated successfully.' });

    } catch (err) {
        console.error(err.message);
    res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/user/password/:id - Update user password
app.put('/api/user/password/:id', async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide both current and new passwords.' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();
        res.status(200).json({ message: 'Password updated successfully.' });

    } catch (err) {
        console.error(err.message);
    res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/user/address/:id - Update user addresses
app.put('/api/user/address/:id', async (req, res) => {
    const { billingAddress, shippingAddress } = req.body;

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (billingAddress) {
            user.billingAddress = { ...user.billingAddress, ...billingAddress };
        }
        if (shippingAddress) {
            user.shippingAddress = { ...user.shippingAddress, ...shippingAddress };
        }

        await user.save();
        res.status(200).json({ message: 'Address updated successfully.' });

    } catch (err) {
        console.error(err.message);
    res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/orders - Create a new order
app.post('/api/orders', async (req, res) => {
    const { userId, cart, total, billingAddress, shippingAddress } = req.body;

    if (!userId || !cart || !total || !billingAddress) {
        return res.status(400).json({ message: 'Missing required order information.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Ensure the user's addresses are updated from the order
        // We use Object.assign to safely merge the new address properties into the existing Mongoose subdocument
        if (billingAddress) {
            Object.assign(user.billingAddress, billingAddress);
        }
        if (shippingAddress || billingAddress) {
            Object.assign(user.shippingAddress, shippingAddress || billingAddress);
        }
        await user.save();

        const orderNumber = 'C' + (Math.floor(Math.random() * 9000000) + 1000000);

        const newOrder = new Order({
            user: userId,
            orderNumber,
            total,
            items: cart.map(item => ({
                ...item,
                // frontend uses `cardName` for cart items; fall back to `name` if present
                cardName: item.cardName || item.name,
            })),
            billingAddress: billingAddress, // Pass the address object directly
            shippingAddress: shippingAddress || billingAddress, // Use billing if shipping is absent
        });

        await newOrder.save();

        res.status(201).json({ message: 'Order placed successfully!', order: newOrder });

    } catch (err) {
        console.error('Order creation error:', err.message);
    res.status(500).json({ message: 'Server error during order creation.', error: err.message });
    }
});

// GET /api/orders/:userId - Get all orders for a user
app.get('/api/orders/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.userId }).sort({ date: -1 }); // Sort by most recent
        if (!orders) {
            return res.status(200).json([]); // Return empty array if no orders
        }
        res.status(200).json(orders);
    } catch (err) {
        console.error('Fetch orders error:', err.message);
    res.status(500).json({ message: 'Server error while fetching orders.' });
    }
});

// GET /api/order/:orderId - Get a single order by its ID
app.get('/api/order/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.status(200).json(order);
    } catch (err) {
        console.error('Fetch order error:', err.message);
    res.status(500).json({ message: 'Server error while fetching the order.' });
    }
});

// --- ADMIN API ROUTES ---

// Middleware to check for admin privileges
const isAdmin = async (req, res, next) => {
    // The user ID should be sent in a custom header from the frontend
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not provided.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Admin access required.' });
        }
        req.user = user; // Attach user to the request
        next();
    } catch (err) {
        console.error('isAdmin middleware error:', err.message);
    res.status(500).json({ message: 'Server error during authorization.' });
    }
};

// GET /api/admin/orders - Get all orders (Admin only)
app.get('/api/admin/orders', isAdmin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'username email').sort({ date: -1 });
        res.status(200).json(orders);
    } catch (err) {
        console.error('Admin fetch all orders error:', err.message);
    res.status(500).json({ message: 'Server error fetching all orders.' });
    }
});

// POST /api/admin/upload-image - Upload product image (Admin only, now uploads to Cloudinary)
app.post('/api/admin/upload-image', isAdmin, upload.single('image'), async (req, res) => {
        try {
                if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload_stream(
                    { folder: 'clubs21ids/products' },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            return res.status(500).json({ message: 'Failed to upload to Cloudinary.' });
                        }
                        res.status(201).json({ url: result.secure_url });
                    }
                );
                // Pipe the buffer to Cloudinary
                require('streamifier').createReadStream(req.file.buffer).pipe(result);
        } catch (err) {
                console.error('Upload error:', err.message);
                res.status(500).json({ message: 'Failed to upload file.' });
        }
});

// Catalog endpoints
// GET /api/catalog - public listing
app.get('/api/catalog', async (req, res) => {
    try {
        const items = await Catalog.find({}).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (err) {
        console.error('Fetch catalog error:', err.message);
        res.status(500).json({ message: 'Server error fetching catalog.' });
    }
});

// POST /api/admin/catalog - create new catalog item (admin only)
app.post('/api/admin/catalog', isAdmin, async (req, res) => {
    const { name, price, img, category, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required.' });
    try {
        const item = new Catalog({ name, price: parseFloat(price) || 0, img: img || '', category: category || '', description: description || '' });
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        console.error('Create catalog error:', err.message);
        res.status(500).json({ message: 'Server error creating catalog item.' });
    }
});

// PUT /api/admin/catalog/:id - update catalog item (admin only)
app.put('/api/admin/catalog/:id', isAdmin, async (req, res) => {
    try {
        const item = await Catalog.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        const { name, price, img, category, description } = req.body;
        item.name = name || item.name;
        item.price = typeof price !== 'undefined' ? parseFloat(price) : item.price;
        item.img = img || item.img;
        item.category = category || item.category;
        item.description = description || item.description;
        await item.save();
        res.status(200).json(item);
    } catch (err) {
        console.error('Update catalog error:', err.message);
        res.status(500).json({ message: 'Server error updating catalog item.' });
    }
});

// DELETE /api/admin/catalog/:id - delete catalog item (admin only)
app.delete('/api/admin/catalog/:id', isAdmin, async (req, res) => {
    try {
        const deleted = await Catalog.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Item not found.' });
        res.status(200).json({ message: 'Item deleted.' });
    } catch (err) {
        console.error('Delete catalog error:', err.message);
        res.status(500).json({ message: 'Server error deleting catalog item.' });
    }
});

// GET /api/settings/bitcoin-address - Get the bitcoin address
app.get('/api/settings/bitcoin-address', async (req, res) => {
    try {
        let setting = await Setting.findOne({ name: 'bitcoin_address' });
        if (!setting) {
            // If not found, create it with a default placeholder value
            setting = new Setting({ name: 'bitcoin_address', value: '1ABCDeFgHiJkLmNoPqRsTuVwXyZ123456' });
            await setting.save();
        }
        res.status(200).json({ bitcoin_address: setting.value });
    } catch (err) {
        console.error('Get bitcoin address error:', err.message);
    res.status(500).json({ message: 'Server error fetching bitcoin address.' });
    }
});

// PUT /api/admin/settings/bitcoin-address - Update the bitcoin address (Admin only)
app.put('/api/admin/settings/bitcoin-address', isAdmin, async (req, res) => {
    const { bitcoin_address } = req.body;

    if (!bitcoin_address) {
        return res.status(400).json({ message: 'Bitcoin address is required.' });
    }

    try {
        let setting = await Setting.findOne({ name: 'bitcoin_address' });
        if (setting) {
            setting.value = bitcoin_address;
        } else {
            setting = new Setting({ name: 'bitcoin_address', value: bitcoin_address });
        }
        await setting.save();
        res.status(200).json({ message: 'Bitcoin address updated successfully.', bitcoin_address: setting.value });
    } catch (err) {
        console.error('Update bitcoin address error:', err.message);
    res.status(500).json({ message: 'Server error updating bitcoin address.' });
    }
});

// PUT /api/admin/settings/admin-credentials - Update admin username/password (Admin only)
app.put('/api/admin/settings/admin-credentials', isAdmin, async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username && !newPassword) {
        return res.status(400).json({ message: 'Please provide a new username and/or new password.' });
    }

    try {
        const user = req.user; // from isAdmin middleware

        // If username is being changed, ensure it's not taken
        if (username && username !== user.username) {
            const existing = await User.findOne({ username });
            if (existing) {
                return res.status(400).json({ message: 'Username already taken.' });
            }
            user.username = username;
        }

        // If password is being changed, hash it
        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        res.status(200).json({ message: 'Admin credentials updated successfully.', user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
    } catch (err) {
        console.error('Update admin credentials error:', err.message);
        res.status(500).json({ message: 'Server error updating admin credentials.' });
    }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

