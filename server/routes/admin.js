// server/routes/admin.js - Routes administrateur avec gestion Super Admin
const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { uploadAvatar, handleUploadError } = require('../config/multer');
const { isValidEmail, sanitizeText } = require('../utils/validation');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const router = express.Router();

console.log('👑 Module admin.js chargé avec routes Super Admin');

// === UTILITAIRES ===

// Générer un nom d'utilisateur unique
const generateUsername = async (firstName, lastName) => {
  const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z.]/g, '');
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const result = await query('SELECT id FROM admin_users WHERE username = $1', [username]);
    if (result.rows.length === 0) break;
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
};

// Hasher un mot de passe
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// === UPLOAD AVATAR ===
router.post('/upload-avatar', authenticateToken, (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('📸 Upload avatar pour utilisateur:', userId);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    // Construire l'URL de l'avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    console.log('📁 Fichier uploadé:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      avatarUrl: avatarUrl
    });

    // Mettre à jour l'URL de l'avatar dans la base de données
    const updateResult = await query(
      'UPDATE admin_users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING avatar_url',
      [avatarUrl, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    console.log('✅ Avatar mis à jour avec succès');

    res.json({
      success: true,
      message: 'Avatar uploadé avec succès',
      avatarUrl: avatarUrl,
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('💥 Erreur upload avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload de l\'avatar'
    });
  }
});

// === SUPPRIMER AVATAR ===
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🗑️ Suppression avatar pour utilisateur:', userId);

    // Récupérer l'avatar actuel
    const userResult = await query(
      'SELECT avatar_url FROM admin_users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const currentAvatarUrl = userResult.rows[0].avatar_url;

    // Supprimer l'avatar de la base de données
    await query(
      'UPDATE admin_users SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    // TODO: Supprimer le fichier physique si nécessaire
    if (currentAvatarUrl && !currentAvatarUrl.startsWith('http')) {
      const { deleteFile } = require('../config/multer');
      deleteFile(currentAvatarUrl);
    }

    console.log('✅ Avatar supprimé avec succès');

    res.json({
      success: true,
      message: 'Avatar supprimé avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur suppression avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'avatar'
    });
  }
});

// === OBTENIR PROFIL ADMIN ===
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      `SELECT id, username, email, first_name, last_name, role, avatar_url, 
              phone, date_of_birth, last_login, created_at 
       FROM admin_users 
       WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Profil non trouvé'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      profile: user
    });

  } catch (error) {
    console.error('💥 Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

// === METTRE À JOUR PROFIL ===
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone, date_of_birth } = req.body;

    console.log('📝 Mise à jour profil pour utilisateur:', userId);

    // Validation basique
    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'Prénom et nom requis'
      });
    }

    // Mettre à jour le profil
    const updateResult = await query(
      `UPDATE admin_users 
       SET first_name = $1, last_name = $2, phone = $3, date_of_birth = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING id, username, email, first_name, last_name, role, avatar_url, phone, date_of_birth`,
      [first_name.trim(), last_name.trim(), phone?.trim() || null, date_of_birth || null, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    console.log('✅ Profil mis à jour avec succès');

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      profile: updateResult.rows[0]
    });

  } catch (error) {
    console.error('💥 Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// === STATISTIQUES ADMIN ===
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Récupération des statistiques admin');

    // Compter les utilisateurs
    const usersCount = await query('SELECT COUNT(*) as count FROM admin_users WHERE is_active = true');
    
    // Compter les étudiants (si la table existe)
    let studentsCount = { rows: [{ count: 0 }] };
    try {
      studentsCount = await query('SELECT COUNT(*) as count FROM students');
    } catch (e) {
      console.log('Table students non trouvée');
    }

    // Compter le staff (si la table existe)
    let staffCount = { rows: [{ count: 0 }] };
    try {
      staffCount = await query('SELECT COUNT(*) as count FROM staff');
    } catch (e) {
      console.log('Table staff non trouvée');
    }

    const stats = {
      users: parseInt(usersCount.rows[0].count),
      students: parseInt(studentsCount.rows[0].count),
      staff: parseInt(staffCount.rows[0].count),
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('💥 Erreur récupération stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// ============================================
// === ROUTES SUPER ADMINISTRATEUR UNIQUEMENT ===
// ============================================

// === LISTER LES ADMINISTRATEURS (Super Admin uniquement) ===
router.get('/admins', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    console.log('👑 Liste des administrateurs demandée par:', req.user.email);

    const adminsResult = await query(`
      SELECT id, username, email, first_name, last_name, role, avatar_url,
             is_first_login, is_active, last_login, created_at, updated_at
      FROM admin_users 
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    console.log(`✅ ${adminsResult.rows.length} administrateurs trouvés`);

    res.json({
      success: true,
      admins: adminsResult.rows
    });

  } catch (error) {
    console.error('💥 Erreur chargement admins:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement des administrateurs'
    });
  }
});

// === CRÉER UN ADMINISTRATEUR (Super Admin uniquement) ===
router.post('/admins', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { email, firstName, lastName, role = 'admin' } = req.body;

    console.log('➕ Création admin par:', req.user.email);
    console.log('📋 Données reçues:', { email, firstName, lastName, role });

    // Validation des données
    if (!email || !firstName || !lastName) {
      console.log('❌ Validation échouée - données manquantes');
      return res.status(400).json({
        success: false,
        error: 'Email, prénom et nom requis'
      });
    }

    if (!isValidEmail(email)) {
      console.log('❌ Email invalide:', email);
      return res.status(400).json({
        success: false,
        error: 'Format d\'email invalide'
      });
    }

    if (!['admin', 'super_admin'].includes(role)) {
      console.log('❌ Rôle invalide:', role);
      return res.status(400).json({
        success: false,
        error: 'Rôle invalide'
      });
    }

    // Utiliser une transaction pour s'assurer de la cohérence
    const result = await transaction(async (client) => {
      // Vérifier si l'email existe déjà
      const existingUser = await client.query(
        'SELECT id, email, is_active FROM admin_users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        console.log('❌ Email déjà utilisé:', email, existingUser.rows[0]);
        if (existingUser.rows[0].is_active) {
          throw new Error('Un compte actif avec cet email existe déjà');
        } else {
          throw new Error('Un compte avec cet email a été supprimé. Contactez le support pour le restaurer.');
        }
      }

      // Générer un username unique
      const username = await generateUsername(firstName, lastName);
      console.log('📝 Username généré:', username);

      // Créer l'utilisateur avec un mot de passe temporaire
      const tempPassword = crypto.randomUUID();
      const hashedTempPassword = await hashPassword(tempPassword);

      console.log('💾 Insertion en base...');
      const userResult = await client.query(`
        INSERT INTO admin_users (
          username, email, first_name, last_name, role, 
          password_hash, is_first_login, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, true, true, CURRENT_TIMESTAMP)
        RETURNING id, username, email, first_name, last_name, role, created_at
      `, [username, email.toLowerCase(), sanitizeText(firstName), sanitizeText(lastName), role, hashedTempPassword]);

      const newUser = userResult.rows[0];
      console.log('✅ Utilisateur créé:', newUser);

      return { user: newUser, tempPassword };
    });

    console.log('✅ Admin créé avec succès:', result.user.email);

    res.json({
      success: true,
      message: 'Administrateur créé avec succès',
      admin: result.user
    });

  } catch (error) {
    console.error('💥 Erreur création admin:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la création de l\'administrateur'
    });
  }
});

// === MODIFIER UN ADMINISTRATEUR (Super Admin uniquement) ===
router.put('/admins/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const adminId = req.params.id;
    const { first_name, last_name, role, email } = req.body;

    console.log(`✏️ Modification admin ID: ${adminId} par ${req.user.email}`);
    console.log('📝 Données reçues:', { first_name, last_name, role, email });

    // Validation
    if (!first_name || !last_name || !role) {
      console.log('❌ Validation échouée - données manquantes');
      return res.status(400).json({
        success: false,
        error: 'Prénom, nom et rôle sont requis'
      });
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rôle invalide'
      });
    }

    // Vérifier que l'admin existe et est actif
    const existingAdmin = await query(
      'SELECT id, email FROM admin_users WHERE id = $1 AND is_active = true',
      [adminId]
    );

    if (existingAdmin.rows.length === 0) {
      console.log('❌ Admin non trouvé:', adminId);
      return res.status(404).json({
        success: false,
        error: 'Administrateur non trouvé'
      });
    }

    console.log('✅ Admin trouvé:', existingAdmin.rows[0]);

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (email && email !== existingAdmin.rows[0].email) {
      console.log('🔍 Vérification unicité email:', email);
      
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Format d\'email invalide'
        });
      }

      const emailExists = await query(
        'SELECT id FROM admin_users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), adminId]
      );

      if (emailExists.rows.length > 0) {
        console.log('❌ Email déjà utilisé:', email);
        return res.status(409).json({
          success: false,
          error: 'Un utilisateur avec cet email existe déjà'
        });
      }
    }

    // Mettre à jour l'administrateur
    console.log('📝 Mise à jour admin...');
    const updatedAdmin = await query(`
      UPDATE admin_users 
      SET first_name = $1, last_name = $2, role = $3, 
          email = COALESCE($4, email), updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND is_active = true
      RETURNING id, email, username, first_name, last_name, role, avatar_url, updated_at
    `, [
      sanitizeText(first_name), 
      sanitizeText(last_name), 
      role, 
      email ? email.toLowerCase() : null, 
      adminId
    ]);

    if (updatedAdmin.rows.length === 0) {
      console.log('❌ Échec mise à jour - admin peut-être supprimé');
      return res.status(404).json({
        success: false,
        error: 'Impossible de modifier cet administrateur'
      });
    }

    console.log('✅ Administrateur modifié avec succès:', updatedAdmin.rows[0]);

    res.json({
      success: true,
      message: 'Administrateur modifié avec succès',
      admin: updatedAdmin.rows[0]
    });

  } catch (error) {
    console.error('💥 Erreur modification admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification de l\'administrateur'
    });
  }
});

// === SUPPRIMER UN ADMINISTRATEUR (Super Admin uniquement) ===
router.delete('/admins/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const adminId = req.params.id;
    const currentUserId = req.user.id;

    console.log(`🗑️ Suppression admin ID: ${adminId} par ${req.user.email}`);

    // Empêcher l'auto-suppression
    if (parseInt(adminId) === parseInt(currentUserId)) {
      console.log('❌ Tentative auto-suppression bloquée');
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Vérifier que l'admin existe et est actif
    const existingAdmin = await query(
      'SELECT id, email, first_name, last_name FROM admin_users WHERE id = $1 AND is_active = true',
      [adminId]
    );

    if (existingAdmin.rows.length === 0) {
      console.log('❌ Admin non trouvé pour suppression:', adminId);
      return res.status(404).json({
        success: false,
        error: 'Administrateur non trouvé'
      });
    }

    const admin = existingAdmin.rows[0];
    console.log('✅ Admin trouvé pour suppression:', admin);

    // Utiliser une transaction pour supprimer proprement
    const result = await transaction(async (client) => {
      // Supprimer les tokens de réinitialisation liés (si la table existe)
      try {
        await client.query(
          'DELETE FROM password_reset_tokens WHERE user_id = $1',
          [adminId]
        );
      } catch (e) {
        console.log('Table password_reset_tokens non trouvée ou erreur:', e.message);
      }

      // Supprimer l'administrateur (suppression logique)
      const deleteResult = await client.query(
        'UPDATE admin_users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, first_name, last_name',
        [adminId]
      );

      return deleteResult.rows[0];
    });

    console.log('✅ Administrateur supprimé avec succès');

    res.json({
      success: true,
      message: 'Administrateur supprimé avec succès',
      deleted_admin: result
    });

  } catch (error) {
    console.error('💥 Erreur suppression admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'administrateur'
    });
  }
});

console.log('👑 Routes admin configurées avec gestion Super Admin');

module.exports = router;