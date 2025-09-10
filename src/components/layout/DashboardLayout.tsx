import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { Button } from "@/components/ui/button";
import { useNotificationCounter } from '@/hooks/useNotificationCounter';
import { Bell, Search, Menu, X, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  TrendingUp,
  GraduationCap,
  UserCog,
  Calendar,
  Wallet,
  BarChart3,
  TrendingDown,
  Shield,
  Crown,
  User,
  Settings,
  LogOut
} from "lucide-react";

// Plus besoin d'import - utilisation directe du chemin public

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Menu items (même configuration que AppSidebar)
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
  {
    title: "Paiements Salaires",
    url: "/staff-payments",
    icon: Wallet,
    category: "salary"
  },
  {
    title: "Finance",
    url: "/finance",
    icon: BarChart3,
    category: "finance_unified",
    requiresSuperAdmin: true
  },
  {
    title: "Dépenses",
    url: "/expenses",
    icon: TrendingDown,
    category: "finance"
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    category: "system"
  }
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hook pour le compteur de notifications - AJOUTÉ
  const { unreadCount, urgentCount, hasUnread, hasUrgent, badgeColor, refresh } = useNotificationCounter();

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
        return 'Super Administrateur';
      case 'admin':
        return 'Administrateur';
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

  const handleMobileNavigation = (url: string) => {
    navigate(url);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    signOut();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  // Fonction pour naviguer vers les notifications avec refresh - MODIFIÉE
  const handleNotificationsClick = () => {
    navigate('/notifications');
    // Rafraîchir les compteurs après navigation
    setTimeout(() => {
      refresh();
    }, 500);
  };

  const getItemStyle = (url: string, category: string) => {
    const isActive = location.pathname === url || 
                    (url !== '/' && location.pathname.startsWith(url));
    
    const categoryColors = {
      main: 'emerald',
      academic: 'orange',
      salary: 'amber',
      finance: 'blue',
      finance_unified: 'purple',
      system: 'indigo'
    };
    
    const color = categoryColors[category] || 'emerald';
    
    if (isActive) {
      return {
        className: `bg-${color}-100 text-${color}-800 border-l-4 border-${color}-600`,
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

  const getVisibleMenuItems = () => {
    return allMenuItems.filter(item => {
      if (item.requiresSuperAdmin) {
        return isSuperAdmin;
      }
      return true;
    });
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        {/* Sidebar pour desktop */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Menu mobile innovant - Overlay full screen */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                      <img 
                        src="/assets/images/logo-markaz.png"
                        alt="Markaz Ubayd Ibn Kab" 
                        className="w-6 h-6 object-contain" 
                        onError={(e) => {
                          // ✅ AJOUT : Fallback en cas d'erreur de chargement
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      {/* ✅ AJOUT : Fallback avec icône */}
                      <BookOpen className="w-6 h-6 text-white hidden" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Haramain
                      </h2>
                      <p className="text-xs text-gray-600">الحرمين</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {getVisibleMenuItems().map((item) => {
                    const itemStyle = getItemStyle(item.url, item.category);
                    
                    return (
                      <button
                        key={item.title}
                        onClick={() => handleMobileNavigation(item.url)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${itemStyle.className}`}
                        style={itemStyle.style}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-white">
                {/* User Profile */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage 
                      src={getAvatarUrl()} 
                      alt={`Photo de ${getDisplayName()}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-emerald-500 text-white font-semibold text-xs">
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

                {/* Action Buttons */}
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-gray-700 hover:bg-gray-100"
                    onClick={() => handleMobileNavigation('/profile')}
                  >
                    <User className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span>Mon Profil</span>
                  </Button>

                  {isSuperAdmin && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-purple-700 hover:bg-purple-50"
                      onClick={() => handleMobileNavigation('/settings')}
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
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Menu mobile - Simple button */}
                <div className="md:hidden">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-700 hover:bg-slate-100 p-2"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </div>
                
                {/* Trigger pour desktop */}
                <div className="hidden md:block">
                  <SidebarTrigger className="hover:bg-slate-100 text-slate-700" />
                </div>
                
                {/* Barre de recherche */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher dans Markaz Ubayd Ibn Kab..."
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 w-64 lg:w-80 bg-white/80 text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Recherche mobile */}
                <Button variant="ghost" size="sm" className="sm:hidden hover:bg-slate-100">
                  <Search className="w-5 h-5 text-slate-700" />
                </Button>
                
                {/* Notifications avec badge dynamique - CORRIGÉ */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative hover:bg-slate-100"
                  onClick={handleNotificationsClick}
                >
                  <Bell className="w-5 h-5 text-slate-700" />
                  {hasUnread && (
                    <span 
                      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-lg ${
                        hasUrgent ? 'animate-pulse' : ''
                      }`}
                      style={{ backgroundColor: badgeColor }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {hasUrgent && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  )}
                </Button>
                
                {/* Profil utilisateur */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={getAvatarUrl()} 
                      alt={`Photo de ${getDisplayName()}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">
                      {getUserRole()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}