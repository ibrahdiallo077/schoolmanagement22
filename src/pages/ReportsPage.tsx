
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Users,
  Euro,
  FileText,
  PieChart,
  Activity
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Pie } from 'recharts';

export function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState('2025');

  // Données simulées pour les graphiques
  const monthlyData = [
    { month: 'Jan', recettes: 28500, depenses: 22000, etudiants: 120 },
    { month: 'Fév', recettes: 30200, depenses: 23500, etudiants: 125 },
    { month: 'Mar', recettes: 29800, depenses: 21800, etudiants: 128 },
    { month: 'Avr', recettes: 31500, depenses: 24200, etudiants: 132 },
    { month: 'Mai', recettes: 32100, depenses: 25600, etudiants: 135 },
    { month: 'Juin', recettes: 33000, depenses: 26800, etudiants: 138 },
  ];

  const expenseCategories = [
    { name: 'Salaires', value: 15600, color: '#7B68EE' },
    { name: 'Charges', value: 4200, color: '#6495ED' },
    { name: 'Pédagogie', value: 3800, color: '#87CEFA' },
    { name: 'Maintenance', value: 2890, color: '#4B9CD3' },
    { name: 'Fournitures', value: 2450, color: '#9370DB' },
  ];

  const paymentTrends = [
    { month: 'Jan', aJour: 85, enRetard: 15 },
    { month: 'Fév', aJour: 88, enRetard: 12 },
    { month: 'Mar', aJour: 82, enRetard: 18 },
    { month: 'Avr', aJour: 90, enRetard: 10 },
    { month: 'Mai', aJour: 87, enRetard: 13 },
    { month: 'Juin', aJour: 92, enRetard: 8 },
  ];

  const reportStats = {
    totalRevenue: 184600,
    totalExpenses: 143800,
    netProfit: 40800,
    totalStudents: 138,
    averagePayment: 235,
    paymentRate: 92
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec gradient turquoise-violet école */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 school-header-gradient rounded-xl shadow-2xl text-white">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-white" />
            Rapports et Analyses
          </h1>
          <p className="text-cyan-100 mt-1">Tableaux de bord et statistiques détaillées</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px] border-white/30 bg-white/10 backdrop-blur-sm text-white focus:ring-white/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensuel</SelectItem>
              <SelectItem value="quarterly">Trimestriel</SelectItem>
              <SelectItem value="yearly">Annuel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] border-white/30 bg-white/10 backdrop-blur-sm text-white focus:ring-white/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Button className="gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 shadow-lg">
            <Download className="w-4 h-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Indicateurs clés avec design école */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-0 school-card-cyan shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Recettes Totales</p>
                <p className="text-2xl font-bold text-cyan-900">{reportStats.totalRevenue.toLocaleString()} €</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-cyan-600" />
                  <span className="text-sm text-cyan-600">+8.5% vs mois dernier</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg">
                <Euro className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 school-card-blue shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Dépenses Totales</p>
                <p className="text-2xl font-bold text-blue-900">{reportStats.totalExpenses.toLocaleString()} €</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600">-2.1% vs mois dernier</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 school-card-purple shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#7B68EE]">Bénéfice Net</p>
                <p className="text-2xl font-bold text-[#7B68EE]">{reportStats.netProfit.toLocaleString()} €</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-[#7B68EE]" />
                  <span className="text-sm text-[#7B68EE]">+22.1% vs mois dernier</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#7B68EE] to-[#6495ED] rounded-xl text-white shadow-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques analytiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des recettes et dépenses */}
        <Card className="bg-gradient-to-br from-white to-cyan-50 border-cyan-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-700">
              <BarChart3 className="w-5 h-5" />
              Évolution Recettes vs Dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #87CEFA', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="recettes" fill="#87CEFA" name="Recettes" radius={[4, 4, 0, 0]} />
                <Bar dataKey="depenses" fill="#6495ED" name="Dépenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des dépenses */}
        <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <PieChart className="w-5 h-5" />
              Répartition des Dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  dataKey="value"
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #6495ED', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Analyse des paiements et évolution des étudiants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taux de paiement */}
        <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Activity className="w-5 h-5" />
              Taux de Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={paymentTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #7B68EE', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="aJour" 
                  stroke="#7B68EE" 
                  strokeWidth={3}
                  name="Paiements à jour (%)"
                  dot={{ fill: '#7B68EE', strokeWidth: 2, r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="enRetard" 
                  stroke="#FF6B6B" 
                  strokeWidth={3}
                  name="Paiements en retard (%)"
                  dot={{ fill: '#FF6B6B', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statistiques détaillées */}
        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <FileText className="w-5 h-5" />
              Statistiques Détaillées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg border border-cyan-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-700" />
                  <span className="font-medium text-gray-900">Total Étudiants</span>
                </div>
                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                  {reportStats.totalStudents}
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Euro className="w-5 h-5 text-blue-700" />
                  <span className="font-medium text-gray-900">Paiement Moyen</span>
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {reportStats.averagePayment} €
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-700" />
                  <span className="font-medium text-gray-900">Taux de Paiement</span>
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                  {reportStats.paymentRate}%
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Marge Bénéficiaire</span>
                </div>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  {((reportStats.netProfit / reportStats.totalRevenue) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rapports prédéfinis */}
      <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-purple-50 border-b border-cyan-200">
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <FileText className="w-5 h-5" />
            Rapports Prédéfinis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col gap-2 border-cyan-300 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:border-cyan-500">
              <BarChart3 className="w-6 h-6 text-cyan-600" />
              <span className="font-medium">Rapport Financier</span>
              <span className="text-xs text-gray-500">Recettes et dépenses</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col gap-2 border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-500">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Rapport Étudiants</span>
              <span className="text-xs text-gray-500">Inscriptions et présence</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col gap-2 border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:border-purple-500">
              <Euro className="w-6 h-6 text-purple-600" />
              <span className="font-medium">Rapport Paiements</span>
              <span className="text-xs text-gray-500">Statuts et retards</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col gap-2 border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-slate-50 hover:border-indigo-500">
              <Calendar className="w-6 h-6 text-indigo-600" />
              <span className="font-medium">Rapport Mensuel</span>
              <span className="text-xs text-gray-500">Synthèse complète</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
