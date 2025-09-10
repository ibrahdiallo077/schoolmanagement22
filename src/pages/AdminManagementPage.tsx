import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  UserPlus, 
  Edit, 
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  Settings,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  Clock,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/useAuth';
import { AdminAccountCreation } from '@/components/admin/AdminAccountCreation';

interface Admin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  role: 'super_admin' | 'admin';
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  is_first_login: boolean;
  is_active: boolean;
}

export function AdminManagementPage() {
  const { toast } = useToast();
  const { isSuperAdmin, userRole } = usePermissions();
  
  // ⚠️ PROTECTION SUPER ADMIN - Empêcher l'accès aux admins normaux
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto py-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Accès Refusé
            </h1>
            <p className="text-muted-foreground">Cette page est réservée aux Super Administrateurs</p>
          </div>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Permissions insuffisantes</strong>
            <br />
            Seuls les Super Administrateurs peuvent gérer les comptes administrateurs.
            <br />
            Votre rôle actuel : <span className="font-semibold">{userRole === 'admin' ? 'Administrateur' : userRole}</span>
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Retour
          </Button>
        </div>
      </div>
    );
  }

  // ✅ Code existant pour les Super Admins
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'super_admin'>('all');

  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'admin' as 'admin' | 'super_admin'
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fonction utilitaire pour récupérer le token
  const getAuthToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };

  // Fonction utilitaire pour les headers avec authentification
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchTerm, statusFilter, roleFilter]);

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Chargement des administrateurs actifs...');

      const token = getAuthToken();
      
      if (!token) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour voir cette page",
          variant: "destructive",
        });
        return;
      }

      // ✅ Utiliser la nouvelle route protégée
      const response = await fetch(`${API_BASE_URL}/api/admin/admins`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 403) {
          toast({
            title: "Accès refusé",
            description: "Seuls les Super Administrateurs peuvent accéder à cette fonctionnalité",
            variant: "destructive",
          });
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ Administrateurs actifs chargés depuis l\'API:', data.admins);
        
        // Mapper les données correctement
        const mappedAdmins = data.admins.map((admin: any) => ({
          ...admin,
          id: admin.id.toString(),
          is_active: admin.is_active
        }));
        
        console.log('📊 Admins mappés:', mappedAdmins);
        setAdmins(mappedAdmins);
        
        // Force le filtrage après chargement
        setTimeout(() => filterAdmins(), 100);
      } else {
        console.error('❌ Erreur lors du chargement:', data.error);
        toast({
          title: "Erreur",
          description: data.error || "Impossible de charger les administrateurs",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('💥 Erreur lors du chargement des admins:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAdmins = () => {
    console.log('🔍 Début du filtrage des admins...');
    console.log('📋 Admins avant filtrage:', admins.length);
    console.log('⚙️ Filtres actifs:', { searchTerm, statusFilter, roleFilter });
    
    let filtered = [...admins];

    // Filtrer par statut (uniquement active et pending maintenant)
    if (statusFilter !== 'all') {
      console.log('🔍 Filtrage par statut:', statusFilter);
      filtered = filtered.filter(admin => {
        switch (statusFilter) {
          case 'active':
            const isActive = admin.is_active && !admin.is_first_login;
            console.log(`👤 ${admin.first_name} ${admin.last_name} - Active: ${isActive}`);
            return isActive;
          case 'pending':
            const isPending = admin.is_first_login;
            console.log(`👤 ${admin.first_name} ${admin.last_name} - Pending: ${isPending}`);
            return isPending;
          default:
            return true;
        }
      });
    }

    // Filtrer par terme de recherche
    if (searchTerm) {
      console.log('🔍 Filtrage par recherche:', searchTerm);
      filtered = filtered.filter(admin => 
        admin.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par rôle
    if (roleFilter !== 'all') {
      console.log('🔍 Filtrage par rôle:', roleFilter);
      filtered = filtered.filter(admin => admin.role === roleFilter);
    }

    console.log('✅ Admins après filtrage:', filtered.length);
    
    setFilteredAdmins(filtered);
  };

  const handleEditAdmin = (admin: Admin) => {
    console.log('✏️ Édition de l\'admin:', admin);
    setEditingAdmin(admin);
    setEditFormData({
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      role: admin.role
    });
    setShowEditDialog(true);
  };

  const handleSaveAdmin = async () => {
    if (!editingAdmin) return;

    try {
      setIsLoading(true);
      console.log('📝 Modification de l\'admin:', editingAdmin.id, editFormData);

      const token = getAuthToken();
      
      if (!token) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour effectuer cette action",
          variant: "destructive",
        });
        return;
      }

      // ✅ Utiliser la nouvelle route protégée
      const response = await fetch(`${API_BASE_URL}/api/admin/admins/${editingAdmin.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          first_name: editFormData.first_name.trim(),
          last_name: editFormData.last_name.trim(),
          role: editFormData.role
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 403) {
          toast({
            title: "Permissions insuffisantes",
            description: "Vous n'avez pas les droits pour effectuer cette action",
            variant: "destructive",
          });
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ Admin modifié avec succès');
        toast({
          title: "Administrateur modifié",
          description: "Les informations ont été mises à jour avec succès",
        });
        
        // Fermer la dialog avant de recharger
        setShowEditDialog(false);
        setEditingAdmin(null);
        
        // Recharger les données depuis l'API
        await loadAdmins();
      } else {
        throw new Error(data.error || 'Erreur lors de la modification');
      }
    } catch (error: any) {
      console.error('💥 Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;

    try {
      setIsLoading(true);
      console.log('🗑️ Suppression de l\'admin:', deletingAdmin.id);

      const token = getAuthToken();
      
      if (!token) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour effectuer cette action",
          variant: "destructive",
        });
        return;
      }

      // ✅ Utiliser la nouvelle route protégée
      const response = await fetch(`${API_BASE_URL}/api/admin/admins/${deletingAdmin.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 403) {
          toast({
            title: "Permissions insuffisantes",
            description: "Seuls les super administrateurs peuvent supprimer des comptes",
            variant: "destructive",
          });
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ Admin supprimé avec succès');
        toast({
          title: "Administrateur supprimé",
          description: "L'administrateur a été supprimé avec succès",
          variant: "destructive"
        });
        
        // Fermer la dialog avant de recharger
        setShowDeleteDialog(false);
        setDeletingAdmin(null);
        
        // Recharger les données depuis l'API
        await loadAdmins();
      } else {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('💥 Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendFirstLoginLink = async (adminId: string, adminEmail: string) => {
    try {
      console.log('📧 Renvoi du lien de première connexion pour:', adminEmail);

      const token = getAuthToken();
      
      if (!token) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour effectuer cette action",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/resend-first-login`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          adminId,
          activationUrl: `${window.location.origin}/first-login`
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ Lien de première connexion renvoyé');
        toast({
          title: "Lien renvoyé",
          description: `Un nouveau lien de configuration a été envoyé à ${adminEmail}`,
        });
      } else {
        throw new Error(data.error || 'Erreur lors du renvoi du lien');
      }
    } catch (error: any) {
      console.error('💥 Erreur lors du renvoi:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du renvoi du lien",
        variant: "destructive",
      });
    }
  };

  const getAdminInitials = (admin: Admin) => {
    return `${admin.first_name[0] || ''}${admin.last_name[0] || ''}`.toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    return role === 'super_admin' ? (
      <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <Crown className="w-3 h-3 mr-1" />
        Super Admin
      </Badge>
    ) : (
      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    );
  };

  const getStatusBadge = (admin: Admin) => {
    if (admin.is_first_login) {
      return (
        <Badge variant="outline" className="border-blue-300 text-blue-600 bg-blue-50">
          <Clock className="w-3 h-3 mr-1" />
          En attente
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-green-300 text-green-600 bg-green-50">
        <CheckCircle className="w-3 h-3 mr-1" />
        Actif
      </Badge>
    );
  };

  const getStatusCount = (status: string) => {
    switch (status) {
      case 'active':
        return admins.filter(admin => admin.is_active && !admin.is_first_login).length;
      case 'pending':
        return admins.filter(admin => admin.is_first_login).length;
      default:
        return admins.length; // Tous les admins (qui sont tous actifs maintenant)
    }
  };

  // Fonction pour forcer le rafraîchissement
  const forceRefresh = async () => {
    console.log('🔄 Rafraîchissement forcé...');
    setAdmins([]);
    setFilteredAdmins([]);
    await loadAdmins();
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateForm(false);
              // Recharger après création
              loadAdmins();
            }}
            className="mb-4 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Retour à la liste
          </Button>
        </div>
        <AdminAccountCreation />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques - 3 cartes seulement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stats-card-indigo">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Total</p>
                <p className="text-2xl font-bold text-indigo-900">{getStatusCount('all')}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Actifs</p>
                <p className="text-2xl font-bold text-green-900">{getStatusCount('active')}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">En attente</p>
                <p className="text-2xl font-bold text-blue-900">{getStatusCount('pending')}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carte principale */}
      <Card className="border-0 shadow-xl modern-card-gradient">
        <CardHeader className="school-header-gradient text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              Gestion des Administrateurs ({filteredAdmins.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={forceRefresh}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button 
                onClick={() => setShowCreateForm(true)}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Nouvel Admin
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">Tous les actifs</SelectItem>
                  <SelectItem value="active">Actifs confirmés</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Liste des admins */}
          {isLoading && admins.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Chargement des administrateurs...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAdmins.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
                      ? 'Aucun administrateur trouvé avec ces critères'
                      : 'Aucun administrateur trouvé'
                    }
                  </p>
                  {/* Debug info en développement */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 text-xs text-gray-400">
                      <p>Total: {admins.length} | Filtrés: {filteredAdmins.length}</p>
                      <p>Filtres: {statusFilter} / {roleFilter} / "{searchTerm}"</p>
                    </div>
                  )}
                </div>
              ) : (
                filteredAdmins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={admin.avatar_url} alt={`${admin.first_name} ${admin.last_name}`} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                          {getAdminInitials(admin)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{admin.first_name} {admin.last_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          {admin.email}
                        </div>
                        {admin.username && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-3 h-3" />
                            @{admin.username}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRoleBadge(admin.role)}
                      {getStatusBadge(admin)}
                      <div className="text-xs text-gray-500 text-right min-w-0">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Créé le {new Date(admin.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        {admin.last_login && (
                          <div>Dernière connexion: {new Date(admin.last_login).toLocaleDateString('fr-FR')}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {admin.is_first_login && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleResendFirstLoginLink(admin.id, admin.email)}
                            className="bg-white hover:bg-blue-50 hover:text-blue-700 border-blue-200"
                            title="Renvoyer le lien de configuration"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditAdmin(admin)}
                          className="bg-white hover:bg-blue-100 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {admin.role !== 'super_admin' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setDeletingAdmin(admin);
                              setShowDeleteDialog(true);
                            }}
                            className="bg-white hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de modification */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="w-5 h-5 text-blue-600" />
              Modifier l'administrateur
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations de {editingAdmin?.first_name} {editingAdmin?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">Prénom</Label>
                <Input
                  id="editFirstName"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Nom</Label>
                <Input
                  id="editLastName"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled
                className="bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
            </div>

            <div>
              <Label htmlFor="editRole">Rôle</Label>
              <Select 
                value={editFormData.role} 
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value as 'admin' | 'super_admin' }))}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="super_admin">Super Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveAdmin}
                disabled={isLoading}
                className="btn-school-primary"
              >
                <Settings className="w-4 h-4 mr-2" />
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Supprimer l'administrateur
            </DialogTitle>
            <DialogDescription>
              Cette action va désactiver l'administrateur. Êtes-vous sûr de vouloir continuer ?
            </DialogDescription>
          </DialogHeader>

          {deletingAdmin && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>{deletingAdmin.first_name} {deletingAdmin.last_name}</strong> ({deletingAdmin.email}) sera supprimé.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDeleteAdmin}
              disabled={isLoading}
              className="btn-school-danger"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}