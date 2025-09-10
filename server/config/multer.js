// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// === CONFIGURATION STORAGE POUR LES AVATARS ===
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars');
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('📁 Dossier avatar créé:', uploadPath);
      }
      
      cb(null, uploadPath);
    } catch (error) {
      console.error('❌ Erreur création dossier avatar:', error.message);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      const userId = req.user?.id || 'unknown';
      const ext = path.extname(file.originalname).toLowerCase();
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
      
      const filename = `avatar-${userId}-${timestamp}${ext}`;
      
      console.log('📸 Génération nom fichier avatar:', {
        original: file.originalname,
        generated: filename,
        userId: userId
      });
      
      cb(null, filename);
    } catch (error) {
      console.error('❌ Erreur génération nom fichier:', error.message);
      cb(error);
    }
  }
});

// === CONFIGURATION POUR LES AVATARS ===
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: function (req, file, cb) {
    try {
      console.log('🔍 Validation fichier avatar:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      // Types MIME autorisés pour les images
      const allowedMimes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
      ];

      if (!allowedMimes.includes(file.mimetype)) {
        const error = new Error(`Type de fichier non autorisé: ${file.mimetype}`);
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
      }

      // Vérifier l'extension
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const fileExt = path.extname(file.originalname).toLowerCase();
      
      if (!allowedExts.includes(fileExt)) {
        const error = new Error(`Extension de fichier non autorisée: ${fileExt}`);
        error.code = 'INVALID_FILE_EXT';
        return cb(error, false);
      }

      // Vérifier le nom du champ
      if (file.fieldname !== 'avatar') {
        const error = new Error(`Nom de champ incorrect: ${file.fieldname}`);
        error.code = 'INVALID_FIELD_NAME';
        return cb(error, false);
      }

      console.log('✅ Fichier avatar validé');
      cb(null, true);

    } catch (error) {
      console.error('❌ Erreur validation fichier:', error.message);
      cb(error, false);
    }
  }
});

// === CONFIGURATION STORAGE POUR LES DOCUMENTS ===
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'documents');
      
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('📁 Dossier documents créé:', uploadPath);
      }
      
      cb(null, uploadPath);
    } catch (error) {
      console.error('❌ Erreur création dossier documents:', error.message);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname).toLowerCase();
      const nameWithoutExt = path.basename(file.originalname, ext);
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const filename = `doc-${timestamp}-${sanitizedName}${ext}`;
      
      console.log('📄 Génération nom fichier document:', {
        original: file.originalname,
        generated: filename
      });
      
      cb(null, filename);
    } catch (error) {
      console.error('❌ Erreur génération nom fichier document:', error.message);
      cb(error);
    }
  }
});

// === CONFIGURATION POUR LES DOCUMENTS ===
const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: function (req, file, cb) {
    try {
      console.log('🔍 Validation fichier document:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype
      });

      // Types de fichiers autorisés
      const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      
      if (!allowedMimes.includes(file.mimetype)) {
        const error = new Error(`Type de document non autorisé: ${file.mimetype}`);
        error.code = 'INVALID_DOCUMENT_TYPE';
        return cb(error, false);
      }

      console.log('✅ Fichier document validé');
      cb(null, true);

    } catch (error) {
      console.error('❌ Erreur validation document:', error.message);
      cb(error, false);
    }
  }
});

// === FONCTIONS UTILITAIRES ===

// Fonction pour supprimer un fichier avec gestion d'erreurs
const deleteFile = (filePath) => {
  try {
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(__dirname, '..', filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('🗑️ Fichier supprimé:', fullPath);
      return { success: true, path: fullPath };
    } else {
      console.warn('⚠️ Fichier non trouvé pour suppression:', fullPath);
      return { success: false, reason: 'FILE_NOT_FOUND', path: fullPath };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du fichier:', error.message);
    return { success: false, reason: 'DELETE_ERROR', error: error.message };
  }
};

// Fonction pour obtenir les informations d'un fichier
const getFileInfo = (filePath) => {
  try {
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
      return { exists: false };
    }

    const stats = fs.statSync(fullPath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      extension: path.extname(fullPath),
      name: path.basename(fullPath)
    };
  } catch (error) {
    console.error('❌ Erreur obtention info fichier:', error.message);
    return { exists: false, error: error.message };
  }
};

// Fonction pour nettoyer les anciens fichiers
const cleanupOldFiles = (directory, maxAgeHours = 24 * 7) => { // 7 jours par défaut
  try {
    const dirPath = path.join(__dirname, '..', 'uploads', directory);
    
    if (!fs.existsSync(dirPath)) {
      console.log('📁 Dossier non trouvé pour nettoyage:', dirPath);
      return { cleaned: 0, errors: 0 };
    }

    const files = fs.readdirSync(dirPath);
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convertir en millisecondes
    const now = Date.now();
    
    let cleaned = 0;
    let errors = 0;

    files.forEach(file => {
      try {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          cleaned++;
          console.log('🧹 Fichier ancien supprimé:', file);
        }
      } catch (error) {
        errors++;
        console.error('❌ Erreur nettoyage fichier:', file, error.message);
      }
    });

    console.log(`🧹 Nettoyage terminé: ${cleaned} fichiers supprimés, ${errors} erreurs`);
    return { cleaned, errors };

  } catch (error) {
    console.error('❌ Erreur nettoyage dossier:', error.message);
    return { cleaned: 0, errors: 1 };
  }
};

// === MIDDLEWARE DE GESTION DES ERREURS D'UPLOAD ===
const handleUploadError = (error, req, res, next) => {
  if (error) {
    console.error('💥 Erreur upload:', {
      message: error.message,
      code: error.code,
      field: error.field,
      file: req.file?.originalname
    });

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'Fichier trop volumineux',
          maxSize: '5MB pour les images, 10MB pour les documents',
          code: 'FILE_TOO_LARGE'
        });
      }
      
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Trop de fichiers',
          code: 'TOO_MANY_FILES'
        });
      }
      
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Champ de fichier inattendu',
          code: 'UNEXPECTED_FIELD'
        });
      }
    }
    
    // Erreurs personnalisées
    if (error.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        error: 'Type de fichier non autorisé',
        allowedTypes: 'Images: JPEG, PNG, GIF, WebP',
        code: 'INVALID_FILE_TYPE'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload du fichier',
      code: error.code || 'UPLOAD_ERROR'
    });
  }
  
  next();
};

// Programmer un nettoyage automatique quotidien
if (process.env.AUTO_CLEANUP === 'true') {
  setInterval(() => {
    console.log('🧹 Démarrage nettoyage automatique...');
    cleanupOldFiles('avatars', 24 * 30); // 30 jours pour les avatars
    cleanupOldFiles('documents', 24 * 7);  // 7 jours pour les documents
  }, 24 * 60 * 60 * 1000); // Tous les jours
}

module.exports = {
  uploadAvatar,
  uploadDocument,
  deleteFile,
  getFileInfo,
  cleanupOldFiles,
  handleUploadError
};