import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const galleryDir = path.join(__dirname, '../../uploads/galleries');
    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
    }
    cb(null, galleryDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

interface GalleryData {
  id: string;
  sectionName: string;
  photos: Array<{
    filename: string;
    caption: string;
    timestamp: Date;
  }>;
  createdAt: Date;
}

// In-memory storage (use database in production)
const galleries: Map<string, GalleryData> = new Map();

export const uploadGallery = upload.array('photos') as any;

export async function createPhotoGallery(req: Request, res: Response) {
  try {
    const { galleryId, sectionName } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const photos = files.map((file, index) => ({
      filename: file.filename,
      caption: req.body[`caption_${index}`] || '',
      timestamp: new Date()
    }));

    const galleryData: GalleryData = {
      id: galleryId,
      sectionName,
      photos,
      createdAt: new Date()
    };

    galleries.set(galleryId, galleryData);

    res.json({ 
      success: true, 
      galleryId,
      photoCount: photos.length 
    });

  } catch (error) {
    console.error('Error creating photo gallery:', error);
    res.status(500).json({ error: 'Failed to create photo gallery' });
  }
}

export async function getPhotoGallery(req: Request, res: Response) {
  try {
    const { galleryId } = req.params;
    const gallery = galleries.get(galleryId);

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    // Generate photo URLs
    const photosWithUrls = gallery.photos.map(photo => ({
      ...photo,
      url: `/uploads/galleries/${photo.filename}`
    }));

    res.json({
      ...gallery,
      photos: photosWithUrls
    });

  } catch (error) {
    console.error('Error getting photo gallery:', error);
    res.status(500).json({ error: 'Failed to get photo gallery' });
  }
}