import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  TrendingDown, 
  UserCog,
  FileText,
  Bell,
  Settings,
  LogOut,
  Shield,
  Crown,
  User,
  Calendar,
  GraduationCap,
  DollarSign,
  Wallet,
  TrendingUp,
  PiggyBank,
  BookOpen,
  Award,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, usePermissions } from '@/hooks/useAuth';



// Menu unifié - Version simplifiée avec un seul onglet pour les progrès étudiants
const allMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    category: "main"
  },
  {
    title: "Étudiants",
    url: "/students",
    icon: Users,
    category: "main"
  },
  {
    title: "Paiements Étudiants",
    url: "/student-payments",
    icon: DollarSign,
    category: "main"
  },
  // 📚 SIMPLIFIÉ : Un seul onglet "Progrès étudiants" - Tout sera affiché sur le dashboard
  {
    title: "Progrès étudiants",
    url: "/academic-progress",
    icon: TrendingUp,
    category: "academic"
  },
  {
    title: "Classes",
    url: "/classes",
    icon: GraduationCap,
    category: "main"
  },
  {
    title: "Personnel",
    url: "/staff",
    icon: UserCog,
    category: "main"
  },
  {
    title: "Année scolaire",
    url: "/school-years",
    icon: Calendar,
    category: "main"
  },
  // Paiements Salaires
  {
    title: "Paiements Salaires",
    url: "/staff-payments",
    icon: Wallet,
    category: "salary"
  },
  // Finance (nom simplifié) - AVEC icône maintenant
  {
    title: "Finance",
    url: "/finance",
    icon: BarChart3, // ✅ Ajout d'une icône appropriée pour les finances
    category: "finance_unified",
    requiresSuperAdmin: true
  },
  // Finances & Administration traditionnelles
  {
    title: "Dépenses",
    url: "/expenses",
    icon: TrendingDown,
    category: "finance"
  },
  // Rapports supprimé
  // Notifications (sans badge ni symbole)
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    category: "system"
  }
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, isLoading } = useAuth();
  const { isSuperAdmin } = usePermissions();

  const handleLogout = async () => {
    console.log('🚪 Déconnexion...');
    signOut();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.first_name) {
      return profile.first_name[0].toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    return 'Utilisateur';
  };

  const getUserRole = () => {
    const role = profile?.role;
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'teacher':
        return 'Professeur';
      case 'accountant':
        return 'Comptable';
      default:
        return 'Utilisateur';
    }
  };

  const getAvatarUrl = () => {
    if (!profile?.avatar_url) return undefined;
    let avatarUrl = profile.avatar_url;
    if (avatarUrl.startsWith('/uploads')) {
      avatarUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${avatarUrl}`;
    }
    return avatarUrl;
  };

  const getItemStyle = (url: string, category: string) => {
    const isActive = location.pathname === url || 
                    (url !== '/' && location.pathname.startsWith(url));
    
    // Couleur de base selon la catégorie
    const categoryColors = {
      main: 'emerald',
      academic: 'orange', // 📚 Couleur pour les progrès étudiants
      salary: 'amber',
      finance: 'blue',
      finance_unified: 'purple',
      system: 'indigo'
    };
    
    const color = categoryColors[category] || 'emerald';
    
    if (isActive) {
      return {
        className: `bg-${color}-100 text-${color}-800 border-l-4 border-${color}-600 shadow-sm`,
        style: {
          backgroundColor: color === 'emerald' ? '#d1fae5' :
                         color === 'orange' ? '#fed7aa' :
                         color === 'amber' ? '#fef3c7' :
                         color === 'blue' ? '#dbeafe' :
                         color === 'purple' ? '#ede9fe' : 
                         color === 'indigo' ? '#e0e7ff' : '#f3f4f6',
          color: color === 'emerald' ? '#065f46' :
                 color === 'orange' ? '#9a3412' :
                 color === 'amber' ? '#92400e' :
                 color === 'blue' ? '#1e40af' :
                 color === 'purple' ? '#6b21a8' : 
                 color === 'indigo' ? '#3730a3' : '#374151',
          borderLeft: `4px solid ${
            color === 'emerald' ? '#059669' :
            color === 'orange' ? '#ea580c' :
            color === 'amber' ? '#d97706' :
            color === 'blue' ? '#2563eb' :
            color === 'purple' ? '#7c3aed' : 
            color === 'indigo' ? '#4f46e5' : '#6b7280'
          }`
        }
      };
    }
    
    return {
      className: 'hover:bg-gray-50 text-gray-700 hover:text-gray-900',
      style: {}
    };
  };

  // Filtrer les éléments selon les permissions
  const getVisibleMenuItems = () => {
    return allMenuItems.filter(item => {
      // Si l'item nécessite super admin, vérifier les permissions
      if (item.requiresSuperAdmin) {
        return isSuperAdmin;
      }
      // Sinon, afficher tous les autres items
      return true;
    });
  };

  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      <SidebarHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
            <img 
              src="/assets/images/logo-markaz.png"
              alt="Markaz Ubayd Ibn Kab" 
              className="w-8 h-8 object-contain rounded-full" 
              onError={(e) => {
                // ✅ AJOUT : Fallback en cas d'erreur de chargement
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* ✅ AJOUT : Fallback avec icône */}
            <BookOpen className="w-8 h-8 text-white hidden" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Haramain
            </h2>
            <p className="text-sm text-gray-600 font-medium">الحرمين</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {getVisibleMenuItems().map((item) => {
                const itemStyle = getItemStyle(item.url, item.category);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`transition-all duration-200 rounded-lg ${itemStyle.className}`}
                      style={itemStyle.style}
                    >
                      <button
                        onClick={() => navigate(item.url)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        {/* ✅ CORRECTION : Afficher l'icône pour tous les éléments maintenant */}
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm flex-1">{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ✅ SUPPRESSION de la section supplémentaire - Tout sera sur le dashboard */}
        {/* Plus de sous-menus, tout sera accessible directement depuis le dashboard principal */}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200">
        {/* User Profile Section */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage 
              src={getAvatarUrl()} 
              alt={`Photo de ${getDisplayName()}`}
              className="object-cover"
            />
            <AvatarFallback className="bg-emerald-500 text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-gray-900">
              {getDisplayName()}
            </p>
            <div className="flex items-center gap-1">
              {isSuperAdmin ? (
                <Crown className="w-3 h-3 text-purple-600 flex-shrink-0" />
              ) : (
                <Shield className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              )}
              <span className={`text-xs font-medium truncate ${isSuperAdmin ? 'text-purple-600' : 'text-emerald-600'}`}>
                {getUserRole()}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-gray-700 hover:bg-gray-100"
            onClick={() => navigate('/profile')}
          >
            <User className="w-4 h-4 mr-3 flex-shrink-0" />
            <span>Mon Profil</span>
          </Button>

          {isSuperAdmin && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-purple-700 hover:bg-purple-50"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-4 h-4 mr-3 flex-shrink-0" />
              <span>Paramètres</span>
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
            <span>Se déconnecter</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}