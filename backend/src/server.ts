import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import dns from 'dns';

// Fix for Node.js native fetch IPv6 timeout issues
dns.setDefaultResultOrder('ipv4first');

import authRoutes from './routes/authRoutes';
import masterDataRoutes from './routes/masterDataRoutes';
import workOrderRoutes, { uploadRouter } from './routes/workOrderRoutes';
import notificationRoutes from './routes/notificationRoutes';
import coalTransportRoutes from './routes/coalTransportRoutes';
import p2hRoutes from './routes/p2hRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup static file serving untuk folder uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Root
app.get('/', (req, res) => {
  res.send('GACT Portal API is running! (Clean Architecture)');
});

// Routes
app.use('/api', authRoutes);
app.use('/api', masterDataRoutes);
app.use('/api/work-orders', notificationRoutes); // /api/work-orders/notifications
app.use('/api/work-orders', workOrderRoutes);
app.use('/api', uploadRouter); // /api/upload-signature
app.use('/api/coal-transport', coalTransportRoutes);
app.use('/api/coal-transport/p2h', p2hRoutes);

// Jalankan Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
