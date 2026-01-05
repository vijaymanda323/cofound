const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body,query, validationResult } = require('express-validator');
const Document = require('../models/Document');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, JPG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

// Upload document
router.post('/upload', auth, upload.single('document'), [
  body('documentType').optional().isIn(['profile', 'verification', 'education', 'work', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { documentType = 'other' } = req.body;
    const currentUserId = req.user.id;

    // Create document record
    const document = new Document({
      userId: currentUserId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: path.extname(req.file.originalname).substring(1).toLowerCase(),
      fileSize: req.file.size,
      filePath: req.file.path,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      documentType
    });

    await document.save();

    // If verification document, update profile
    if (documentType === 'verification') {
      await Profile.findOneAndUpdate(
        { userId: currentUserId },
        { $push: { verificationDocuments: document._id } }
      );
    }

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        fileName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        fileUrl: document.fileUrl,
        documentType: document.documentType,
        verificationStatus: document.verificationStatus,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    
    // Clean up uploaded file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ message: error.message });
    }
    
    if (error.message.includes('File too large')) {
      return res.status(400).json({ message: 'File size exceeds maximum limit' });
    }
    
    res.status(500).json({ message: 'Server error uploading document' });
  }
});

// Get user's documents
router.get('/', auth, [
  query('documentType').optional().isIn(['profile', 'verification', 'education', 'work', 'other']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentType, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user.id;

    const query = { userId: currentUserId, isActive: true };
    if (documentType) {
      query.documentType = documentType;
    }

    const documents = await Document.find(query)
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const formattedDocuments = documents.map(doc => ({
      id: doc._id,
      fileName: doc.originalName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl,
      documentType: doc.documentType,
      verificationStatus: doc.verificationStatus,
      isVerified: doc.isVerified,
      uploadedAt: doc.uploadedAt
    }));

    res.json({
      documents: formattedDocuments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Document.countDocuments(query)
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific document
router.get('/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const currentUserId = req.user.id;

    const document = await Document.findOne({
      _id: documentId,
      userId: currentUserId,
      isActive: true
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      document: {
        id: document._id,
        fileName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        fileUrl: document.fileUrl,
        documentType: document.documentType,
        verificationStatus: document.verificationStatus,
        verificationNotes: document.verificationNotes,
        isVerified: document.isVerified,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const currentUserId = req.user.id;

    const document = await Document.findOne({
      _id: documentId,
      userId: currentUserId,
      isActive: true
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '../uploads/documents', document.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from profile if verification document
    if (document.documentType === 'verification') {
      await Profile.findOneAndUpdate(
        { userId: currentUserId },
        { $pull: { verificationDocuments: document._id } }
      );
    }

    // Soft delete document record
    document.isActive = false;
    await document.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update document type
router.put('/:documentId', auth, [
  body('documentType').isIn(['profile', 'verification', 'education', 'work', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentId } = req.params;
    const { documentType } = req.body;
    const currentUserId = req.user.id;

    const document = await Document.findOne({
      _id: documentId,
      userId: currentUserId,
      isActive: true
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Remove from old profile category if verification
    if (document.documentType === 'verification') {
      await Profile.findOneAndUpdate(
        { userId: currentUserId },
        { $pull: { verificationDocuments: document._id } }
      );
    }

    // Update document type
    document.documentType = documentType;
    await document.save();

    // Add to new profile category if verification
    if (documentType === 'verification') {
      await Profile.findOneAndUpdate(
        { userId: currentUserId },
        { $push: { verificationDocuments: document._id } }
      );
    }

    res.json({
      message: 'Document type updated successfully',
      document: {
        id: document._id,
        fileName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        fileUrl: document.fileUrl,
        documentType: document.documentType,
        verificationStatus: document.verificationStatus,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get document statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const [totalDocuments, verificationDocuments, verifiedDocuments] = await Promise.all([
      Document.countDocuments({ userId: currentUserId, isActive: true }),
      Document.countDocuments({ userId: currentUserId, documentType: 'verification', isActive: true }),
      Document.countDocuments({ userId: currentUserId, isVerified: true, isActive: true })
    ]);

    res.json({
      stats: {
        totalDocuments,
        verificationDocuments,
        verifiedDocuments
      }
    });
  } catch (error) {
    console.error('Document stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
