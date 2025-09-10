import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, User, Mail, Shield, Loader2, Lock, Eye, EyeOff, Key, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import AuthService from '@/services/auth';

export function AdminProfile() {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const { toast } = useToast();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    email: profile?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Mettre à jour formData quand le profil change
  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || ''
      });
    }
  }, [profile]);

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'A';
  };

  const getRoleDisplay = () => {
    switch (profile?.role) {
      case 'super_admin':
        return 'Super Administrateur';
      case 'admin':
        return 'Administrateur';
      case 'teacher':
        return 'Enseignant';
      case 'accountant':
        return 'Comptable';
      default:
        return 'En attente';
    }
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le prénom est requis",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.last_name.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le nom est requis",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.email.trim()) {
      toast({
        title: "Erreur de validation",
        description: "L'email est requis",
        variant: "destructive",
      });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Erreur de validation",
        description: "Format d'email invalide",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      toast({
        title: "Erreur de validation",
        description: "Le mot de passe actuel est requis",
        variant: "destructive",
      });
      return false;
    }
    if (!passwordData.newPassword) {
      toast({
        title: "Erreur de validation",
        description: "Le nouveau mot de passe est requis",
        variant: "destructive",
      });
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Erreur de validation",
        description: "Le nouveau mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      });
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erreur de validation",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return false;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast({
        title: "Erreur de validation",
        description: "Le nouveau mot de passe doit être différent de l'ancien",
        variant: "destructive",
      });
      return false;
    }

    // Validation robuste du mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      toast({
        title: "Mot de passe faible",
        description: "Le mot de passe doit contenir au moins : 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: "Profil mis à jour avec succès",
        });
        
        setIsEditing(false);
        // Le profil sera mis à jour automatiquement par le useAuth
        
      } else {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du profil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return;

    try {
      setIsLoading(true);
      
      const { success, error } = await AuthService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (!success) {
        throw new Error(error || 'Erreur lors du changement de mot de passe');
      }

      toast({
        title: "Succès",
        description: "Mot de passe modifié avec succès",
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du changement de mot de passe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      email: profile?.email || ''
    });
    setIsEditing(false);
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "Erreur",
        description: "Le fichier ne doit pas dépasser 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_BASE_URL}/api/admin/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: "Photo de profil mise à jour avec succès",
        });
        
        // Recharger la page pour voir la nouvelle image
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'upload d\'avatar:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'upload d'avatar",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getAvatarUrl = () => {
    if (profile?.avatar_url) {
      // Si l'URL commence par /uploads, ajouter l'URL de base
      if (profile.avatar_url.startsWith('/uploads')) {
        return `${API_BASE_URL}${profile.avatar_url}`;
      }
      return profile.avatar_url;
    }
    return undefined;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour obtenir la date de création avec fallback
  const getCreationDate = () => {
    if (profile?.created_at) {
      return formatDate(profile.created_at);
    }
    // Fallback avec une date par défaut si pas de date dans le profil
    const fallbackDate = new Date('2024-01-01T00:00:00.000Z');
    return formatDate(fallbackDate.toISOString());
  };

  return (
    <div className="space-y-6">
      {/* Profil Principal */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={getAvatarUrl()} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors shadow-lg">
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Mon Profil
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {getRoleDisplay()}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                Prénom
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="firstName"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  disabled={!isEditing}
                  className={`pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Votre prénom"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Nom
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="lastName"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  disabled={!isEditing}
                  className={`pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Votre nom"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Adresse email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!isEditing}
                className={`pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="votre@email.com"
              />
            </div>
          </div>

          {/* Informations système */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Informations système
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Compte créé le</span>
                </div>
                <p className="text-sm text-blue-700 font-medium">
                  {getCreationDate()}
                </p>
              </div>
              
              {profile?.last_login && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Dernière connexion</span>
                  </div>
                  <p className="text-sm text-green-700 font-medium">
                    {formatDate(profile.last_login)}
                  </p>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Niveau d'accès</span>
                </div>
                <p className="text-sm text-blue-700 font-medium">
                  {getRoleDisplay()}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">ID Utilisateur</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  #{profile?.id || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
              >
                <User className="w-4 h-4 mr-2" />
                Modifier le profil
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Sécurité - Changement de mot de passe */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
            <Lock className="w-5 h-5 text-red-600" />
            Sécurité
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isChangingPassword ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div>
                <h3 className="font-medium text-gray-900">Mot de passe</h3>
                <p className="text-sm text-gray-600">
                  Modifiez votre mot de passe pour sécuriser votre compte
                </p>
              </div>
              <Button 
                onClick={() => setIsChangingPassword(true)}
                variant="outline"
                className="bg-white border-red-300 text-red-600 hover:bg-red-50"
              >
                <Key className="w-4 h-4 mr-2" />
                Changer le mot de passe
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                  Mot de passe actuel
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmer le nouveau mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleCancelPasswordChange}
                  disabled={isLoading}
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Modifier le mot de passe
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}