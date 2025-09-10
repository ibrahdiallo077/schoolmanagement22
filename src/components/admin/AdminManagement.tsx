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
  Calendar,
  Settings,
  RefreshCw,
  Search,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  Clock,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  active: boolean;
}

export function AdminManagementPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'super_admin'>('all');

  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'admin' as 'admin' | 'super_admin'
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchTerm, statusFilter, roleFilter]);

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Chargement des administrateurs...');

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/admins`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ Administrateurs chargés:', data.admins);
        setAdmins(data.admins || []);
      } else {
        console.error('❌ Erreur lors du chargement:', data.error);
        toast({
          title: "Erreur",
          description: data.error || "Impossible de charger les administrateurs",
          variant: "destructive",
        });
      }
    } catch (error) {
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
    let filtered = [...admins];

    if (searchTerm) {
      filtered = filtered.filter(admin => 
        admin.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(admin => {
        switch (statusFilter) {
          case 'active':
            return admin.active && !admin.is_first_login;
          case 'pending':
            return admin.is_first_login;
          case 'inactive':
            return !admin.active;
          default:
            return true;
        }
      });
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(admin => admin.role === roleFilter);
    }

    setFilteredAdmins(filtered);
  };

  const handleEditAdmin = (admin: Admin) => {
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
      console.log('📝 Modification de l\'admin:', editingAdmin.id);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/auth/admins/${editingAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Admin modifié avec succès');
        toast({
          title: "Administrateur modifié",
          description: "Les informations ont été mises à jour avec succès",
        });
        await loadAdmins();
        setShowEditDialog(false);
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

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/auth/admins/${deletingAdmin.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Admin supprimé avec succès');
        toast({
          title: "Administrateur supprimé",
          description: "L'administrateur a été supprimé avec succès",
          variant: "destructive"
        });
        await loadAdmins();
        setShowDeleteDialog(false);
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

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/auth/resend-first-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          adminId,
          activationUrl: `${window.location.origin}/first-login`
        }),
      });

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

  // Callback appelé quand un admin est créé
  const handleAdminCreated = async () => {
    console.log('🔄 Admin créé, actualisation de la liste...');
    await loadAdmins();
    toast({
      title: "Liste actualisée",
      description: "La liste des administrateurs a été mise à jour",
    });
  };

  // Callback pour revenir à la liste
  const handleBackToList = () => {
    setShowCreateForm(false);
    // Recharger la liste au retour
    loadAdmins();
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
    if (!admin.active) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          <XCircle className="w-3 h-3 mr-1" />
          Inactif
        </Badge>
      );
    }
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
        return admins.filter(admin => admin.active && !admin.is_first_login).length;
      case 'pending':
        return admins.filter(admin => admin.is_first_login).length;
      case 'inactive':
        return admins.filter(admin => !admin.active).length;
      default:
        return admins.length;
    }
  };

  // Affichage du formulaire de création
  if (showCreateForm) {
    return (
      <AdminAccountCreation 
        onAdminCreated={handleAdminCreated}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stats-card-indigo">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Total</p>
                <p className="text-2xl font-bold text-indigo-900">{admins.length}</p>
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

        <Card className="stats-card-red">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Inactifs</p>
                <p className="text-2xl font-bold text-red-900">{getStatusCount('inactive')}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
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
              Gestion des Administrateurs
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={loadAdmins}
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
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
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

          {/* Liste des admins en format horizontal */}
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
                </div>
              ) : (
                filteredAdmins.map((admin) => (
                  <div key={admin.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      {/* Informations de l'admin en format horizontal */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                        {/* Nom complet */}
                        <div>
                          <span className="text-sm font-medium text-gray-600">Nom complet</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={admin.avatar_url} alt={`${admin.first_name} ${admin.last_name}`} />
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                                {getAdminInitials(admin)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-gray-900 font-medium">{admin.first_name} {admin.last_name}</p>
                          </div>
                        </div>
                        
                        {/* Email */}
                        <div>
                          <span className="text-sm font-medium text-gray-600">Email</span>
                          <p className="text-gray-900 flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {admin.email}
                          </p>
                        </div>
                        
                        {/* Date création */}
                        <div>
                          <span className="text-sm font-medium text-gray-600">Date création</span>
                          <p className="text-gray-900 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(admin.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        
                        {/* Rôle et statut */}
                        <div>
                          <span className="text-sm font-medium text-gray-600">Rôle & Statut</span>
                          <div className="flex gap-2 mt-1">
                            {getRoleBadge(admin.role)}
                            {getStatusBadge(admin)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
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
                          variant="outline" 
                          onClick={() => handleEditAdmin(admin)}
                          className="bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {admin.role !== 'super_admin' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setDeletingAdmin(admin);
                              setShowDeleteDialog(true);
                            }}
                            className="bg-white hover:bg-red-50 hover:text-red-600 border-gray-300"
                            title="Supprimer"
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
              Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cet administrateur ?
            </DialogDescription>
          </DialogHeader>

          {deletingAdmin && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>{deletingAdmin.first_name} {deletingAdmin.last_name}</strong> ({deletingAdmin.email}) sera définitivement supprimé.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
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