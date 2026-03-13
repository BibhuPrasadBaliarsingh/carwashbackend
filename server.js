const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const User = require('./models/User');
const Package = require('./models/Package');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://carwash.onrender.com"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auto-create admin user on startup
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@aquawash.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@aquawash.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin user created: admin@aquawash.com / admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

// Auto-create default packages on startup
const createDefaultPackages = async () => {
  try {
    const packageCount = await Package.countDocuments();
    
    if (packageCount === 0) {
      const defaultPackages = [
        {
          name: 'Basic Wash',
          description: 'Exterior wash and vacuum',
          price: 15,
          validityMonths: 1,
          servicesIncluded: ['Exterior Wash', 'Interior Vacuum', 'Tire Cleaning'],
          isActive: true
        },
        {
          name: 'Premium Wash',
          description: 'Full interior and exterior detail',
          price: 35,
          validityMonths: 1,
          servicesIncluded: ['Exterior Wash', 'Interior Vacuum', 'Seat Cleaning', 'Dashboard Polish', 'Tire Dressing'],
          isActive: true
        },
        {
          name: 'Deluxe Detailing',
          description: 'Complete car spa treatment',
          price: 75,
          validityMonths: 1,
          servicesIncluded: ['Full Exterior Detail', 'Full Interior Detail', 'Leather Conditioning', 'Engine Cleaning', 'Clay Treatment'],
          isActive: true
        },
        {
          name: 'Basic AMC',
          description: 'Annual maintenance contract - 4 washes',
          price: 200,
          validityMonths: 12,
          servicesIncluded: ['Basic Wash', '4 Times per Year', 'Free Pickup'],
          isActive: true
        },
        {
          name: 'Premium AMC',
          description: 'Annual maintenance contract - 12 washes',
          price: 500,
          validityMonths: 12,
          servicesIncluded: ['Premium Wash', 'Monthly Wash', 'Free Pickup & Delivery', 'Priority Booking'],
          isActive: true
        }
      ];
      
      await Package.insertMany(defaultPackages);
      console.log('✅ Default packages created');
    } else {
      console.log('✅ Packages already exist');
    }
  } catch (error) {
    console.error('❌ Error creating packages:', error.message);
  }
};

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/jobsheets', require('./routes/jobSheetRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Base route for testing
app.get('/', (req, res) => {
  res.send('Car Wash API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  await createAdminUser();
  await createDefaultPackages();
});

