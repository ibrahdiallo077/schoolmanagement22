import React from 'react';
import { User } from 'lucide-react';
import { SuperAdminProfile } from '@/components/admin/SuperAdminProfile';
import { AdminProfile } from '@/components/admin/AdminProfile';
import { usePermissions } from '@/hooks/useAuth';

export function ProfilePage() {
  const { isSuperAdmin } = usePermissions();

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-school-primary to-school-steel rounded-2xl shadow-lg">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-school-primary to-school-steel bg-clip-text text-transparent">
            Mon Profil
          </h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles et vos préférences</p>
        </div>
      </div>

      {/* ✅ Afficher le bon composant selon le rôle */}
      {isSuperAdmin ? <SuperAdminProfile /> : <AdminProfile />}
    </div>
  );
}