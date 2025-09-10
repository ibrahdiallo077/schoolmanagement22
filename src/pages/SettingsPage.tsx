import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, UserPlus, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/useAuth';
import { AdminAccountCreation } from '@/components/admin/AdminAccountCreation';
import AdminListPage from '@/components/admin/AdminListPage';

export function SettingsPage() {
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
            Seuls les Super Administrateurs peuvent accéder aux paramètres système.
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

  // ✅ ACCÈS AUTORISÉ - Afficher la page avec SEULEMENT la gestion des admins
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-school-primary to-school-steel rounded-2xl shadow-lg">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-school-primary to-school-steel bg-clip-text text-transparent">
            Paramètres Super Administrateur
          </h1>
          <p className="text-muted-foreground">Gérez les comptes administrateurs du système</p>
        </div>
      </div>

      {/* 🔥 MODIFICATION : Onglets avec meilleure visibilité */}
      <Tabs defaultValue="admins" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[500px] bg-gray-100 border shadow-sm p-1 rounded-lg">
          <TabsTrigger 
            value="admins" 
            className="flex items-center gap-2 rounded-md py-2.5 px-4 text-gray-600 font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm hover:text-gray-800"
          >
            <UserPlus className="w-4 h-4" />
            Créer Admin
          </TabsTrigger>
          <TabsTrigger 
            value="adminlist" 
            className="flex items-center gap-2 rounded-md py-2.5 px-4 text-gray-600 font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm hover:text-gray-800"
          >
            <Shield className="w-4 h-4" />
            Liste des Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <AdminAccountCreation />
        </TabsContent>

        <TabsContent value="adminlist">
          <AdminListPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}