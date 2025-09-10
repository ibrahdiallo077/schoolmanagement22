
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Plus, 
  Search, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  X,
  Send,
  Users,
  Mail,
  MessageSquare
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationForm } from '@/components/forms/NotificationForm';

export function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Rappel de paiement - Juin 2025",
      message: "Cher parent, nous vous rappelons que le paiement pour le mois de juin est dû. Merci de régulariser votre situation.",
      type: "payment",
      priority: "high",
      recipients: ["Tous les parents en retard"],
      status: "sent",
      sentAt: "2025-06-01T10:00:00",
      createdAt: "2025-06-01T09:30:00",
      sentBy: "Système",
      readCount: 12,
      totalRecipients: 15
    },
    {
      id: 2,
      title: "Réunion parents-professeurs",
      message: "Une réunion parents-professeurs aura lieu le 15 juin à 18h00 en salle de conférence. Votre présence est souhaitée.",
      type: "meeting",
      priority: "medium",
      recipients: ["Tous les parents"],
      status: "scheduled",
      scheduledFor: "2025-06-10T08:00:00",
      createdAt: "2025-06-05T14:20:00",
      sentBy: "Direction",
      readCount: 0,
      totalRecipients: 138
    },
    {
      id: 3,
      title: "Absence prolongée - Ahmed Ben Ali",
      message: "L'étudiant Ahmed Ben Ali est absent depuis 3 jours consécutifs. Veuillez contacter la famille.",
      type: "alert",
      priority: "high",
      recipients: ["Direction", "Enseignant responsable"],
      status: "read",
      sentAt: "2025-06-03T11:15:00",
      createdAt: "2025-06-03T11:15:00",
      sentBy: "Système",
      readCount: 2,
      totalRecipients: 2
    },
    {
      id: 4,
      title: "Nouvelle inscription validée",
      message: "Une nouvelle inscription a été validée pour Fatima Zahra en classe CM2.",
      type: "info",
      priority: "low",
      recipients: ["Administration"],
      status: "sent",
      sentAt: "2025-06-02T16:45:00",
      createdAt: "2025-06-02T16:45:00",
      sentBy: "Système",
      readCount: 3,
      totalRecipients: 3
    }
  ]);

  const notificationStats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    pending: notifications.filter(n => n.status === 'scheduled').length,
    read: notifications.filter(n => n.status === 'read').length,
    totalRecipientsReached: notifications.reduce((sum, n) => sum + (n.totalRecipients || 0), 0)
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSaveNotification = (notificationData: any) => {
    setNotifications(prev => [...prev, notificationData]);
    setShowAddForm(false);
  };

  const handleDeleteNotification = (notificationId: number) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <AlertTriangle className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'alert':
        return <Bell className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'payment':
        return <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300">Paiement</Badge>;
      case 'meeting':
        return <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300">Réunion</Badge>;
      case 'alert':
        return <Badge className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300">Alerte</Badge>;
      case 'info':
        return <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300">Info</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300">Envoyé</Badge>;
      case 'scheduled':
        return <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300">Programmé</Badge>;
      case 'read':
        return <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300">Lu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white">Haute</Badge>;
      case 'medium':
        return <Badge className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white">Moyenne</Badge>;
      case 'low':
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">Faible</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec gradient turquoise-violet */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-gradient-to-r from-cyan-100 via-blue-100 to-purple-100 rounded-xl border border-cyan-200 shadow-lg">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] bg-clip-text text-transparent flex items-center gap-2">
            <Bell className="w-8 h-8 text-[#7B68EE]" />
            Centre de Notifications
          </h1>
          <p className="text-gray-700 mt-1">Gestion des communications et alertes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-[#7B68EE]/50 text-[#7B68EE] hover:bg-gradient-to-r hover:from-[#7B68EE]/10 hover:to-[#6495ED]/10 shadow-md">
            <Settings className="w-4 h-4" />
            Paramètres
          </Button>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="gap-2 bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] hover:from-[#6B58DE] to-[#3B8CC3] shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Notification
          </Button>
        </div>
      </div>

      {/* Statistiques des notifications avec design moderne */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#7B68EE] bg-gradient-to-br from-white to-[#7B68EE]/5 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#7B68EE] to-[#6495ED] rounded-xl text-white shadow-lg">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{notificationStats.total}</p>
                <p className="text-sm text-gray-600">Total notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{notificationStats.sent}</p>
                <p className="text-sm text-gray-600">Envoyées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{notificationStats.pending}</p>
                <p className="text-sm text-gray-600">Programmées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl text-white shadow-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-600">{notificationStats.read}</p>
                <p className="text-sm text-gray-600">Lues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{notificationStats.totalRecipientsReached}</p>
                <p className="text-sm text-gray-600">Destinataires</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche avec design amélioré */}
      <Card className="bg-gradient-to-r from-white to-[#7B68EE]/5 border-[#7B68EE]/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7B68EE] w-4 h-4" />
                <Input
                  placeholder="Rechercher par titre ou contenu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/80 shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px] border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] shadow-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="payment">Paiement</SelectItem>
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="alert">Alerte</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px] border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] shadow-sm">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="sent">Envoyé</SelectItem>
                  <SelectItem value="scheduled">Programmé</SelectItem>
                  <SelectItem value="read">Lu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des notifications avec design moderne */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <Card key={notification.id} className="bg-gradient-to-r from-white to-gray-50/50 border-l-4 border-l-[#7B68EE] hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#7B68EE]/10 to-[#6495ED]/10 rounded-lg">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        {getPriorityBadge(notification.priority)}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{notification.message}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{notification.recipients.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(notification.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {notification.sentAt && (
                      <div className="flex items-center gap-1">
                        <Send className="w-4 h-4" />
                        <span>Envoyé le {new Date(notification.sentAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {notification.readCount !== undefined && notification.totalRecipients && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{notification.readCount}/{notification.totalRecipients} lu(s)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex gap-2">
                    {getTypeBadge(notification.type)}
                    {getStatusBadge(notification.status)}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="hover:bg-red-100 text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulaire de nouvelle notification */}
      <NotificationForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSave={handleSaveNotification}
      />
    </div>
  );
}
