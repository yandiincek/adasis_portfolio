import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  createP2H,
  getAllP2H,
  getP2HById,
  reviewP2H
} from '../controllers/p2hController';

const router = express.Router();

// Setup Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'p2h-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// P2H Routes
router.get('/', getAllP2H);
router.post('/', upload.single('gambar'), createP2H);
router.get('/:id', getP2HById);
router.put('/:id/review', reviewP2H);

export default router;
