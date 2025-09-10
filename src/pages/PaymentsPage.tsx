import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Euro, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Search, 
  Filter, 
  Plus,
  Download,
  FileText,
  Edit,
  Trash2,
  User,
  History
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Payment {
  id: string;
  student: string;
  studentId: number;
  amount: number;
  period: string;
  type: string;
  method: string;
  date: string;
  status: 'Payé' | 'En attente' | 'En retard';
  receiptNumber: string;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  level: string;
  school: string;
  status: string;
}

export function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showStudentHistory, setShowStudentHistory] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const { toast } = useToast();

  // Données simulées pour les étudiants
  const students: Student[] = [
    {
      id: 1,
      firstName: "Ahmed",
      lastName: "Ben Ali",
      level: "6ème",
      school: "École Primaire Al Nour",
      status: "Orphelin"
    },
    {
      id: 2,
      firstName: "Fatima",
      lastName: "Zahra",
      level: "CM2",
      school: "École Publique Centre",
      status: "Normal"
    },
    {
      id: 3,
      firstName: "Mohamed",
      lastName: "Khalil",
      level: "5ème",
      school: "École Privée Excellence",
      status: "Normal"
    }
  ];

  // Données simulées pour les paiements
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: "REC-2025-001",
      student: "Ahmed Ben Ali",
      studentId: 1,
      amount: 250,
      period: "Juin 2025",
      type: "scolarité",
      method: "espèces",
      date: "01/06/2025",
      status: "Payé",
      receiptNumber: "REC-2025-001"
    },
    {
      id: "REC-2025-002",
      student: "Fatima Zahra",
      studentId: 2,
      amount: 180,
      period: "Juin 2025",
      type: "scolarité",
      method: "virement",
      date: "02/06/2025",
      status: "En attente",
      receiptNumber: "REC-2025-002"
    },
    {
      id: "REC-2025-003",
      student: "Mohamed Khalil",
      studentId: 3,
      amount: 300,
      period: "Juin 2025",
      type: "pension",
      method: "chèque",
      date: "02/06/2025",
      status: "Payé",
      receiptNumber: "REC-2025-003"
    },
    {
      id: "REC-2025-004",
      student: "Ahmed Ben Ali",
      studentId: 1,
      amount: 200,
      period: "Mai 2025",
      type: "scolarité",
      method: "espèces",
      date: "01/05/2025",
      status: "Payé",
      receiptNumber: "REC-2025-004"
    },
    {
      id: "REC-2025-005",
      student: "Ahmed Ben Ali",
      studentId: 1,
      amount: 150,
      period: "Avril 2025",
      type: "transport",
      method: "espèces",
      date: "01/04/2025",
      status: "Payé",
      receiptNumber: "REC-2025-005"
    }
  ]);

  const stats = {
    totalRevenue: 1080,
    paidThisMonth: 730,
    pending: 180,
    late: 170,
    transactions: payments.length
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    const matchesPeriod = selectedPeriod === 'all' || payment.period === selectedPeriod;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const handleNewPayment = () => {
    setEditingPayment(null);
    setShowPaymentForm(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowPaymentForm(true);
  };

  const handleDeletePayment = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    toast({
      title: "Paiement supprimé",
      description: "Le paiement a été supprimé avec succès",
    });
  };

  const handleSavePayment = (paymentData: any) => {
    if (editingPayment) {
      setPayments(prev => prev.map(p => p.id === editingPayment.id ? { ...paymentData, id: editingPayment.id } : p));
      toast({
        title: "Paiement modifié",
        description: "Le paiement a été mis à jour avec succès",
      });
    } else {
      setPayments(prev => [...prev, paymentData]);
      toast({
        title: "Paiement ajouté",
        description: "Le nouveau paiement a été enregistré avec succès",
      });
    }
    setShowPaymentForm(false);
    setEditingPayment(null);
  };

  const handleShowStudentHistory = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudentForHistory(student);
      setShowStudentHistory(true);
    }
  };

  const getStudentPayments = (studentId: number) => {
    return payments.filter(p => p.studentId === studentId);
  };

  const getStudentTotalPaid = (studentId: number) => {
    return payments
      .filter(p => p.studentId === studentId && p.status === 'Payé')
      .reduce((total, p) => total + p.amount, 0);
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'scolarité': 'Frais de scolarité',
      'pension': 'Pension complète',
      'demi-pension': 'Demi-pension',
      'transport': 'Transport',
      'uniforme': 'Uniforme',
      'fournitures': 'Fournitures scolaires',
      'activités': 'Activités extra-scolaires',
      'autre': 'Autre'
    };
    return types[type] || type;
  };

  const getMethodLabel = (method: string) => {
    const methods: { [key: string]: string } = {
      'espèces': 'Espèces',
      'chèque': 'Chèque',
      'virement': 'Virement bancaire',
      'carte': 'Carte bancaire',
      'mobile': 'Paiement mobile'
    };
    return methods[method] || method;
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête moderne */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-gradient-to-r from-indigo-100 via-purple-50 to-cyan-100 rounded-2xl border border-indigo-200 shadow-lg">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-indigo-600" />
            Gestion des Paiements
          </h1>
          <p className="text-gray-700 mt-1">Suivi des recettes et paiements étudiants</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-indigo-200 hover:bg-indigo-50">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button 
            onClick={handleNewPayment}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Nouveau Paiement
          </Button>
        </div>
      </div>

      {/* Statistiques modernes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="school-card-indigo shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Recettes totales</p>
                <p className="text-3xl font-bold text-indigo-900">{stats.totalRevenue} €</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white shadow-lg">
                <Euro className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Payé ce mois</p>
                <p className="text-3xl font-bold text-green-900">{stats.paidThisMonth} €</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="school-card-cyan shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">En attente</p>
                <p className="text-3xl font-bold text-cyan-900">{stats.pending} €</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl text-white shadow-lg">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">En retard</p>
                <p className="text-3xl font-bold text-orange-900">{stats.late} €</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white shadow-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="school-card-purple shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Transactions</p>
                <p className="text-3xl font-bold text-purple-900">{stats.transactions}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white shadow-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="bg-gradient-to-r from-slate-50 to-indigo-50 border-indigo-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-600 w-4 h-4" />
              <Input
                placeholder="Rechercher par étudiant ou numéro de reçu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-200 bg-white/80"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px] border-indigo-300 focus:ring-indigo-200 bg-white/80">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="Payé">Payé</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="En retard">En retard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px] border-indigo-300 focus:ring-indigo-200 bg-white/80">
                <SelectValue placeholder="Toutes périodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes périodes</SelectItem>
                <SelectItem value="Juin 2025">Juin 2025</SelectItem>
                <SelectItem value="Mai 2025">Mai 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des paiements */}
      <Card className="bg-gradient-to-br from-white to-slate-50 border-indigo-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200">
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <FileText className="w-5 h-5" />
            Historique des Paiements ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 border-b border-indigo-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-indigo-800">Reçu</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-indigo-800">Étudiant</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-indigo-800">Montant</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-indigo-800">Période</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-indigo-800">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-indigo-800">Méthode</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-indigo-800">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-indigo-800">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-indigo-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-700">{payment.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{payment.student}</p>
                          <p className="text-sm text-gray-500">ID: #{payment.studentId}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleShowStudentHistory(payment.studentId)}
                          className="hover:bg-indigo-100 hover:text-indigo-700"
                          title="Voir l'historique de l'étudiant"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{payment.amount} €</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        {payment.period}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getTypeLabel(payment.type)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getMethodLabel(payment.method)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{payment.date}</td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={payment.status === 'Payé' ? 'default' : payment.status === 'En attente' ? 'secondary' : 'destructive'}
                        className={
                          payment.status === 'Payé' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          payment.status === 'En attente' ? 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200' :
                          'bg-red-100 text-red-800 hover:bg-red-200'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="hover:bg-indigo-100 hover:text-indigo-700">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="hover:bg-purple-100 hover:text-purple-700"
                          onClick={() => handleEditPayment(payment)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le paiement {payment.receiptNumber} ? 
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeletePayment(payment.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de paiement */}
      <PaymentForm
        open={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        payment={editingPayment}
        onSave={handleSavePayment}
        students={students}
      />

      {/* Dialog pour l'historique de l'étudiant */}
      <Dialog open={showStudentHistory} onOpenChange={setShowStudentHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <User className="w-6 h-6 text-indigo-600" />
              Historique des paiements - {selectedStudentForHistory?.firstName} {selectedStudentForHistory?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStudentForHistory && (
            <div className="space-y-6">
              {/* Informations de l'étudiant */}
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nom complet</p>
                      <p className="font-medium">{selectedStudentForHistory.firstName} {selectedStudentForHistory.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Niveau</p>
                      <p className="font-medium">{selectedStudentForHistory.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">École</p>
                      <p className="font-medium">{selectedStudentForHistory.school}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total payé</p>
                      <p className="font-medium text-green-600">{getStudentTotalPaid(selectedStudentForHistory.id)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des paiements de l'étudiant */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Historique des paiements ({getStudentPayments(selectedStudentForHistory.id).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reçu</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Montant</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Période</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Méthode</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getStudentPayments(selectedStudentForHistory.id).map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-indigo-700">{payment.receiptNumber}</td>
                            <td className="px-4 py-3 text-sm font-semibold">{payment.amount} €</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{payment.period}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">{getTypeLabel(payment.type)}</td>
                            <td className="px-4 py-3 text-sm">{getMethodLabel(payment.method)}</td>
                            <td className="px-4 py-3 text-sm">{payment.date}</td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant={payment.status === 'Payé' ? 'default' : payment.status === 'En attente' ? 'secondary' : 'destructive'}
                                className={
                                  payment.status === 'Payé' ? 'bg-green-100 text-green-800' :
                                  payment.status === 'En attente' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {payment.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
