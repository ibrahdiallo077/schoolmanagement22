import React, { useState } from 'react';
import { 
  Users, 
  Euro, 
  TrendingUp, 
  AlertTriangle, 
  BookOpen, 
  GraduationCap, 
  Heart,
  Home,
  School,
  CreditCard,
  UserCheck,
  Calendar,
  Bell,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  Clock,
  Target,
  Award,
  ChevronRight,
  Zap,
  DollarSign,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const Index = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // TODO: Remplacer ces données statiques par des données de la base de données
  const stats = [
    {
      title: "Total Étudiants",
      value: "245",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      bgGradient: "from-blue-50/90 via-cyan-50/90 to-teal-50/90",
      iconBg: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700",
      description: "vs mois dernier",
      glowColor: "shadow-blue-500/20"
    },
    {
      title: "Paiements à Jour",
      value: "198",
      subValue: "/245",
      change: "+5.1%",
      trend: "up",
      icon: UserCheck,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      bgGradient: "from-emerald-50/90 via-teal-50/90 to-cyan-50/90",
      iconBg: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700",
      description: "80.8% de taux",
      glowColor: "shadow-emerald-500/20"
    },
    {
      title: "Recettes Mensuelles",
      value: "45 680 €",
      change: "+12.3%",
      trend: "up",
      icon: Euro,
      gradient: "from-violet-500 via-purple-500 to-indigo-500",
      bgGradient: "from-violet-50/90 via-purple-50/90 to-indigo-50/90",
      iconBg: "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700",
      description: "Objectif: 50k €",
      glowColor: "shadow-violet-500/20"
    },
    {
      title: "Solde Actuel",
      value: "16 740 €",
      change: "+3.8%",
      trend: "up",
      icon: TrendingUp,
      gradient: "from-rose-500 via-pink-500 to-purple-500",
      bgGradient: "from-rose-50/90 via-pink-50/90 to-purple-50/90",
      iconBg: "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700",
      description: "Bénéfice net",
      glowColor: "shadow-rose-500/20"
    }
  ];

  const categoryStats = [
    {
      title: "Étudiants Orphelins",
      value: "32",
      icon: Heart,
      gradient: "from-pink-500 via-rose-500 to-red-500",
      bgGradient: "from-pink-50/90 via-rose-50/90 to-red-50/90",
      iconBg: "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700",
      percentage: 13,
      glowColor: "shadow-pink-500/20"
    },
    {
      title: "Internes",
      value: "89",
      icon: Home,
      gradient: "from-indigo-500 via-blue-500 to-cyan-500",
      bgGradient: "from-indigo-50/90 via-blue-50/90 to-cyan-50/90",
      iconBg: "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700",
      percentage: 36,
      glowColor: "shadow-indigo-500/20"
    },
    {
      title: "Externes",
      value: "156",
      icon: School,
      gradient: "from-teal-500 via-cyan-500 to-blue-500",
      bgGradient: "from-teal-50/90 via-cyan-50/90 to-blue-50/90",
      iconBg: "bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700",
      percentage: 64,
      glowColor: "shadow-teal-500/20"
    }
  ];

  const alerts = [
    { 
      type: "urgent", 
      message: "15 paiements en retard", 
      count: 15,
      action: "Voir la liste",
      icon: AlertTriangle,
      gradient: "from-red-500 via-rose-500 to-pink-500",
      bgGradient: "from-red-50/95 via-rose-50/95 to-pink-50/95",
      borderColor: "border-red-200/60",
      glowColor: "shadow-red-500/25"
    },
    { 
      type: "info", 
      message: "3 nouveaux employés à enregistrer", 
      count: 3,
      action: "Gérer",
      icon: Users,
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      bgGradient: "from-blue-50/95 via-indigo-50/95 to-purple-50/95",
      borderColor: "border-blue-200/60",
      glowColor: "shadow-blue-500/25"
    },
    { 
      type: "warning", 
      message: "Budget dépenses dépassé de 5%", 
      count: 1,
      action: "Analyser",
      icon: TrendingDown,
      gradient: "from-amber-500 via-orange-500 to-red-500",
      bgGradient: "from-amber-50/95 via-orange-50/95 to-red-50/95",
      borderColor: "border-amber-200/60",
      glowColor: "shadow-amber-500/25"
    }
  ];

  const recentPayments = [
    { id: 1, student: "Ahmed Ben Ali", amount: 250, date: "2025-06-01", status: "paid", type: "Scolarité" },
    { id: 2, student: "Fatima Zahra", amount: 180, date: "2025-06-02", status: "pending", type: "Cantine" },
    { id: 3, student: "Mohamed Khalil", amount: 300, date: "2025-06-02", status: "paid", type: "Scolarité" },
    { id: 4, student: "Aisha Mansouri", amount: 220, date: "2025-06-03", status: "late", type: "Transport" }
  ];

  const quickActions = [
    { 
      title: "Ajouter Étudiant", 
      icon: Users, 
      gradient: "from-violet-500 to-purple-600", 
      path: "/students",
      bgGlow: "hover:shadow-violet-500/30"
    },
    { 
      title: "Nouveau Paiement", 
      icon: CreditCard, 
      gradient: "from-emerald-500 to-teal-600", 
      path: "/payments",
      bgGlow: "hover:shadow-emerald-500/30"
    },
    { 
      title: "Planifier Cours", 
      icon: Calendar, 
      gradient: "from-blue-500 to-cyan-600", 
      path: "/schedule",
      bgGlow: "hover:shadow-blue-500/30"
    },
    { 
      title: "Générer Rapport", 
      icon: FileText, 
      gradient: "from-orange-500 to-pink-600", 
      path: "/reports",
      bgGlow: "hover:shadow-orange-500/30"
    }
  ];

  const upcomingEvents = [
    { 
      title: "Réunion Personnel", 
      time: "14:00", 
      date: "Aujourd'hui", 
      type: "meeting",
      attendees: 12,
      color: "from-blue-500 to-indigo-600"
    },
    { 
      title: "Examen Tajwid", 
      time: "09:00", 
      date: "Demain", 
      type: "exam",
      students: 45,
      color: "from-purple-500 to-violet-600"
    },
    { 
      title: "Visite Parents", 
      time: "16:00", 
      date: "Vendredi", 
      type: "visit",
      families: 8,
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const objectives = [
    { title: "Inscriptions ce mois", current: 198, target: 250, percentage: 79, color: "from-blue-500 to-cyan-500" },
    { title: "Taux de présence", current: 92, target: 95, percentage: 97, color: "from-emerald-500 to-teal-500" },
    { title: "Satisfaction parents", current: 4.7, target: 5.0, percentage: 94, color: "from-violet-500 to-purple-500" }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-1 sm:p-2 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 min-h-screen">
      {/* Header ultra-moderne avec glassmorphism */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-cyan-600/10 backdrop-blur-3xl rounded-3xl"></div>
        <div className="relative bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl">
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Tableau de Bord
                </h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg font-medium">
                  Vue d'ensemble de votre école moderne • {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-1 shadow-lg">
                {['day', 'week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                      selectedPeriod === period
                        ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-md'
                    }`}
                  >
                    {period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}
                  </button>
                ))}
              </div>
              <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm font-bold">
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes avec effet néon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {alerts.map((alert, index) => (
          <Card key={index} className={`relative overflow-hidden border-0 ${alert.glowColor} shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 transform`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${alert.bgGradient} opacity-95`}></div>
            <div className={`absolute inset-0 bg-gradient-to-r ${alert.gradient} opacity-10`}></div>
            <CardContent className="relative p-4 sm:p-5 lg:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                    <alert.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-700" />
                    <div className={`absolute inset-0 bg-gradient-to-r ${alert.gradient} opacity-20 rounded-2xl`}></div>
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base lg:text-lg text-gray-800">{alert.message}</p>
                    <p className="text-gray-600 text-xs sm:text-sm font-medium">Action requise immédiatement</p>
                  </div>
                </div>
                <Badge className={`bg-gradient-to-r ${alert.gradient} text-white border-0 shadow-lg font-bold`}>
                  {alert.count}
                </Badge>
              </div>
              <Button 
                size="sm" 
                className={`bg-gradient-to-r ${alert.gradient} hover:opacity-90 text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-300 font-bold`}
              >
                {alert.action}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistiques principales avec effet glassmorphism */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`relative overflow-hidden border-0 ${stat.glowColor} shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 group transform bg-white/60 backdrop-blur-xl`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient}`}></div>
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 lg:p-4 rounded-2xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-500 shadow-lg backdrop-blur-sm`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>
                <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-gradient-to-r ${stat.gradient} text-white text-xs font-bold shadow-lg`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <h3 className="text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2">{stat.title}</h3>
                <div className="flex items-baseline gap-1">
                  <p className="text-lg sm:text-2xl lg:text-3xl font-black text-gray-900">{stat.value}</p>
                  {stat.subValue && <span className="text-sm sm:text-lg lg:text-xl text-gray-600 font-bold">{stat.subValue}</span>}
                </div>
                <p className="text-xs text-gray-600 mt-1 sm:mt-2 font-medium">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Répartition avec progress bars animées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {categoryStats.map((stat, index) => (
          <Card key={index} className={`relative overflow-hidden border-0 ${stat.glowColor} shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 group transform bg-white/70 backdrop-blur-xl`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient}`}></div>
            <CardContent className="relative p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className={`p-3 sm:p-4 rounded-2xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-500 shadow-lg backdrop-blur-sm`}>
                  <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-700 text-xs sm:text-sm font-bold">{stat.title}</h3>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 font-bold">Pourcentage</span>
                  <span className="font-black text-gray-900">{stat.percentage}%</span>
                </div>
                <div className="relative">
                  <Progress value={stat.percentage} className="h-3 bg-white/50 backdrop-blur-sm" />
                  <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-80 rounded-full`} style={{width: `${stat.percentage}%`}}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section principale avec design futuriste */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        
        {/* Paiements récents */}
        <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
          <CardHeader className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white p-4 sm:p-5 lg:p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-600/20"></div>
            <CardTitle className="relative flex items-center gap-3 text-sm sm:text-base lg:text-lg font-bold">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              Paiements Récents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="relative overflow-hidden p-3 sm:p-4 bg-gradient-to-r from-gray-50/90 via-blue-50/90 to-cyan-50/90 rounded-2xl border border-white/50 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-lg">
                      {payment.student.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base">{payment.student}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-600 font-medium">{payment.date}</p>
                        <Badge variant="outline" className="text-xs font-bold border-blue-200 text-blue-700">{payment.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm sm:text-base lg:text-lg text-gray-900">{payment.amount} €</p>
                    <Badge className={`text-xs font-bold ${
                      payment.status === 'paid' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                      payment.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                      'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                    }`}>
                      {payment.status === 'paid' ? 'Payé' :
                       payment.status === 'pending' ? 'En attente' : 'En retard'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            <Button className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <Eye className="w-4 h-4 mr-2" />
              Voir tous les paiements
            </Button>
          </CardContent>
        </Card>

        {/* Événements à venir */}
        <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
          <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white p-4 sm:p-5 lg:p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20"></div>
            <CardTitle className="relative flex items-center gap-3 text-sm sm:text-base lg:text-lg font-bold">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              Événements à Venir
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="relative overflow-hidden p-4 bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-cyan-50/90 rounded-2xl border border-emerald-200/50 backdrop-blur-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base">{event.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-xs text-gray-600 font-medium">{event.time} - {event.date}</span>
                    </div>
                  </div>
                  <Badge className={`text-xs font-bold bg-gradient-to-r ${event.color} text-white shadow-md`}>
                    {event.type === 'meeting' ? 'Réunion' :
                     event.type === 'exam' ? 'Examen' : 'Visite'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-2 font-medium">
                  {event.attendees && `${event.attendees} participants`}
                  {event.students && `${event.students} étudiants`}
                  {event.families && `${event.families} familles`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Objectifs et Actions rapides */}
        <div className="space-y-4 sm:space-y-6">
          {/* Objectifs */}
          <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white p-4 sm:p-5 lg:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-pink-600/20"></div>
              <CardTitle className="relative flex items-center gap-3 text-sm sm:text-base lg:text-lg font-bold">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                Objectifs du Mois
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4">
              {objectives.map((obj, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-bold text-gray-700">{obj.title}</span>
                    <span className="text-xs sm:text-sm text-gray-600 font-bold">
                      {obj.current}/{obj.target}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={obj.percentage} className="h-3 bg-gray-200/50 backdrop-blur-sm" />
                    <div className={`absolute inset-0 bg-gradient-to-r ${obj.color} opacity-90 rounded-full`} style={{width: `${obj.percentage}%`}}></div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 font-medium">{obj.percentage}% atteint</span>
                    <Award className={`w-4 h-4 ${obj.percentage >= 90 ? 'text-yellow-500' : 'text-gray-400'}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="flex items-center gap-3 text-gray-800 text-sm sm:text-base lg:text-lg font-bold">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-yellow-500" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`h-16 sm:h-20 lg:h-24 flex flex-col items-center gap-2 hover:shadow-2xl transition-all duration-500 hover:scale-110 border-0 bg-white/80 backdrop-blur-sm ${action.bgGlow} transform`}
                  >
                    <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${action.gradient} text-white shadow-lg`}>
                      <action.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-700 text-center leading-tight">{action.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section bonus - Statistiques avancées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-purple-50/90 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-2">Cours Aujourd'hui</h3>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">12</p>
            <p className="text-xs text-gray-600 font-medium">Classes actives</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50/90 via-teal-50/90 to-cyan-50/90 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-2">Diplômés</h3>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">68</p>
            <p className="text-xs text-gray-600 font-medium">Cette année</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-violet-50/90 via-purple-50/90 to-pink-50/90 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-2">Notifications</h3>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">5</p>
            <p className="text-xs text-gray-600 font-medium">Non lues</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50/90 via-pink-50/90 to-red-50/90 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-2">Récompenses</h3>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">23</p>
            <p className="text-xs text-gray-600 font-medium">Ce mois</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;