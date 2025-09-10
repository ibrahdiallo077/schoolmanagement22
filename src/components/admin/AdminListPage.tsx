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
  AlertTriangle,
  Crown,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const AdminListPage: React.FC = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'admin' as 'admin' | 'super_admin'
  });

  const [createFormData, setCreateFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchTerm]);

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

    setFilteredAdmins(filtered);
  };

  const handleCreateAdmin = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/auth/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: createFormData.firstName,
          lastName: createFormData.lastName,
          email: createFormData.email,
          role: 'admin',
          activationUrl: `${window.location.origin}/first-login`
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Administrateur créé avec succès');
        toast({
          title: "Administrateur créé",
          description: `Le compte de ${createFormData.firstName} ${createFormData.lastName} a été créé avec succès`,
        });
        await loadAdmins();
        setShowCreateDialog(false);
        setCreateFormData({ firstName: '', lastName: '', email: '' });
      } else {
        throw new Error(data.error || 'Erreur lors de la création');
      }
    } catch (error: any) {
      console.error('💥 Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liste des Administrateurs</h1>
          <p className="text-gray-600 mt-1">Gérez les comptes et permissions des administrateurs</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Admin
        </Button>
      </div>

      {/* Carte principale */}
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              Administrateurs ({admins.length})
            </CardTitle>
            <Button 
              onClick={loadAdmins}
              variant="secondary"
              size="sm"
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 bg-white">
          {/* Barre de recherche - FORCÉE EN BLANC */}
          <div className="max-w-md mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un administrateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
              />
            </div>
          </div>

          {/* Liste des administrateurs */}
          {isLoading && admins.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
              <p className="text-gray-500">Chargement des administrateurs...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAdmins.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun administrateur trouvé</h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'Aucun administrateur ne correspond à votre recherche'
                      : 'Commencez par créer votre premier administrateur'
                    }
                  </p>
                </div>
              ) : (
                filteredAdmins.map((admin) => (
                  <div key={admin.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors bg-white">
                    <div className="flex items-center justify-between">
                      
                      {/* Informations administrateur */}
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Avatar et nom */}
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={admin.avatar_url} alt={`${admin.first_name} ${admin.last_name}`} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-600">
                              {getAdminInitials(admin)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-gray-900">{admin.first_name} {admin.last_name}</h3>
                            {getRoleBadge(admin.role)}
                          </div>
                        </div>
                        
                        {/* Email */}
                        <div className="hidden md:block">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{admin.email}</span>
                          </div>
                        </div>
                        
                        {/* Date de création */}
                        <div className="hidden lg:block">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{new Date(admin.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditAdmin(admin)}
                          className="bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border-gray-300 text-gray-700"
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
                            className="bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 border-gray-300 text-gray-700"
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

      {/* Dialog de création - INPUTS FORCÉS EN BLANC */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Créer un administrateur</DialogTitle>
            <DialogDescription className="text-gray-600">
              Créez un nouveau compte administrateur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Prénom</Label>
                <Input
                  value={createFormData.firstName}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Ahmed"
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
                />
              </div>
              <div>
                <Label className="text-gray-700">Nom</Label>
                <Input
                  value={createFormData.lastName}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Benali"
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Email</Label>
              <Input
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@ecole.com"
                className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateAdmin}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoading ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification - INPUTS FORCÉS EN BLANC */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Modifier l'administrateur</DialogTitle>
            <DialogDescription className="text-gray-600">
              Modifiez les informations de {editingAdmin?.first_name} {editingAdmin?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Prénom</Label>
                <Input
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
                />
              </div>
              <div>
                <Label className="text-gray-700">Nom</Label>
                <Input
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Email</Label>
              <Input
                type="email"
                value={editFormData.email}
                disabled
                className="bg-gray-50 border-gray-300 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
            </div>

            <div>
              <Label className="text-gray-700">Rôle</Label>
              <Select 
                value={editFormData.role} 
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value as 'admin' | 'super_admin' }))}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="super_admin">Super Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveAdmin}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Supprimer l'administrateur
            </DialogTitle>
            <DialogDescription className="text-gray-600">
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
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDeleteAdmin}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminListPage;