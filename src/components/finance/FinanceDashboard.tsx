import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Users, CreditCard, 
  Target, AlertTriangle, Plus, ArrowUpRight, ArrowDownRight,
  PieChart, BarChart3, Wallet, Activity, X,
  RefreshCw, Eye, Clock, 
  Calculator, Percent, Award, AlertCircle,
  GraduationCap, Landmark, Loader2,
  AlertOctagon, Gauge, Database,
  Signal, Shield, PiggyBank, ShoppingCart,
  WifiOff, CheckCircle, Info, DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ComposedChart, Area, AreaChart, Legend
} from 'recharts';

import useFinance from '../../hooks/useFinance';
import TransactionInjectionForm from './TransactionInjectionForm';

interface FinanceDashboardProps {
  className?: string;
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ className = '' }) => {
  // ✅ Hook finance avec configuration anti-429
  const finance = useFinance(
    { 
      autoRefresh: true,
      refreshInterval: 90000, // ✅ 90 secondes pour éviter 429
      enableCache: true
    },
    { 
      transactionFilters: { limit: 20 }, // ✅ Réduit pour éviter surcharge
      manualTransactionLimit: 10,
      manualTransactionType: 'all'
    }
  );
  
  // États locaux
  const [showInjectionForm, setShowInjectionForm] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [injectionType, setInjectionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');

  // ✅ DONNÉES RÉELLES EXTRAITES DU BACKEND (Compatible avec finance.js)
  const realTimeData = useMemo(() => {
    // Données du dashboard (route /dashboard)
    const dashboard = finance.dashboard;
    const capital = finance.capital;
    const statistics = finance.statistics;

    if (dashboard && dashboard.statistics) {
      const stats = dashboard.statistics;
      
      return {
        // ✅ Capital actuel (route /capital/current)
        currentBalance: capital?.current_balance || dashboard.financial_health?.current_balance || 0,
        formattedCurrentBalance: capital?.formatted_balance || dashboard.financial_health?.formatted_balance || '0 FG',
        
        // ✅ Statistiques détaillées (route /dashboard)
        totalStudentPayments: stats.total_student_payments || 0,
        totalStaffSalaries: stats.total_staff_salaries || 0,
        totalGeneralExpenses: stats.total_general_expenses || 0,
        totalManualIncome: stats.total_manual_income || 0,
        totalManualExpenses: stats.total_manual_expenses || 0,
        
        // ✅ Versions formatées
        formattedStudentPayments: stats.formatted_student_payments || finance.formatGNF(stats.total_student_payments || 0),
        formattedStaffSalaries: stats.formatted_staff_salaries || finance.formatGNF(stats.total_staff_salaries || 0),
        formattedGeneralExpenses: stats.formatted_general_expenses || finance.formatGNF(stats.total_general_expenses || 0),
        
        // ✅ Totaux calculés
        totalIncome: (stats.total_student_payments || 0) + (stats.total_manual_income || 0),
        totalExpenses: (stats.total_staff_salaries || 0) + (stats.total_general_expenses || 0) + (stats.total_manual_expenses || 0),
        
        // ✅ Métadonnées
        totalTransactions: stats.total_transactions || 0,
        lastUpdated: dashboard.metadata?.generated_at || new Date().toISOString(),
        
        // ✅ Santé financière
        healthScore: dashboard.financial_health?.score || 0,
        healthLevel: dashboard.financial_health?.level || 'critical',
        monthlyFlow: dashboard.financial_health?.monthly_flow || 0,
        formattedMonthlyFlow: dashboard.financial_health?.formatted_monthly_flow || '0 FG'
      };
    }
    
    // ✅ Fallback avec données minimales
    return {
      currentBalance: finance.currentBalance || 0,
      formattedCurrentBalance: finance.formattedBalance || '0 FG',
      totalStudentPayments: 0,
      totalStaffSalaries: 0,
      totalGeneralExpenses: 0,
      totalManualIncome: 0,
      totalManualExpenses: 0,
      formattedStudentPayments: '0 FG',
      formattedStaffSalaries: '0 FG',
      formattedGeneralExpenses: '0 FG',
      totalIncome: 0,
      totalExpenses: 0,
      totalTransactions: finance.totalTransactions || 0,
      lastUpdated: new Date().toISOString(),
      healthScore: 0,
      healthLevel: 'critical' as const,
      monthlyFlow: 0,
      formattedMonthlyFlow: '0 FG'
    };
  }, [finance.dashboard, finance.capital, finance.statistics, finance.currentBalance, finance.formattedBalance, finance.totalTransactions, finance.formatGNF]);

  // ✅ DONNÉES POUR LES GRAPHIQUES - BASÉES SUR LES VRAIES DONNÉES
  const chartData = useMemo(() => {
    // Priorité 1: Données d'évolution du backend
    if (finance.dashboard?.evolution && finance.dashboard.evolution.length > 0) {
      return finance.dashboard.evolution.slice(-6);
    }
    
    // Priorité 2: Générer à partir des transactions réelles
    if (finance.transactions && finance.transactions.length > 0) {
      const monthlyData: { [key: string]: { income: number; expenses: number; month: string; year: number } } = {};
      
      finance.transactions.forEach(tx => {
        const date = new Date(tx.date || tx.transaction_date || '');
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0, month: monthLabel, year };
        }
        
        if (tx.type === 'INCOME') {
          monthlyData[monthKey].income += tx.amount;
        } else {
          monthlyData[monthKey].expenses += tx.amount;
        }
      });
      
      const sortedData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([key, data]) => ({
          period_label: data.month,
          income: data.income,
          expenses: data.expenses,
          net_flow: data.income - data.expenses,
          formatted_income: finance.formatGNF(data.income),
          formatted_expenses: finance.formatGNF(data.expenses),
          formatted_net_flow: finance.formatGNF(data.income - data.expenses),
          net_flow_positive: (data.income - data.expenses) > 0
        }));
      
      if (sortedData.length > 0) {
        return sortedData;
      }
    }
    
    // Priorité 3: Point unique basé sur les totaux actuels
    const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'short' });
    return [{
      period_label: currentMonth,
      income: realTimeData.totalIncome,
      expenses: realTimeData.totalExpenses,
      net_flow: realTimeData.totalIncome - realTimeData.totalExpenses,
      formatted_income: finance.formatGNF(realTimeData.totalIncome),
      formatted_expenses: finance.formatGNF(realTimeData.totalExpenses),
      formatted_net_flow: finance.formatGNF(realTimeData.totalIncome - realTimeData.totalExpenses),
      net_flow_positive: (realTimeData.totalIncome - realTimeData.totalExpenses) > 0
    }];
  }, [finance.dashboard, finance.transactions, realTimeData, finance.formatGNF]);

  // ✅ MÉTRIQUES CALCULÉES
  const metrics = useMemo(() => {
    const netBalance = realTimeData.totalIncome - realTimeData.totalExpenses;
    const profitMargin = realTimeData.totalIncome > 0 ? ((netBalance / realTimeData.totalIncome) * 100) : 0;
    
    return {
      netBalance,
      profitMargin,
      formattedIncome: finance.formatGNF(realTimeData.totalIncome),
      formattedExpenses: finance.formatGNF(realTimeData.totalExpenses),
      formattedNetBalance: finance.formatGNF(netBalance)
    };
  }, [realTimeData, finance.formatGNF]);

  // ✅ COMPOSANT DE CARTE MÉTRIQUE COMPACTE (Taille réduite)
  const CompactMetricCard = ({ 
    title, 
    value, 
    subtitle,
    icon: Icon, 
    gradient,
    onClick
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ComponentType<any>;
    gradient: string;
    onClick?: () => void;
  }) => (
    <div 
      className={`relative overflow-hidden rounded-lg p-3 shadow-md border border-white/20 hover:shadow-lg transition-all duration-300 ${gradient} ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Icon className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div className="text-white">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wide">{title}</p>
          <p className="text-sm font-bold mt-1">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  // ✅ FONCTION POUR OUVRIR LE FORMULAIRE D'INJECTION
  const openInjectionForm = (type: 'INCOME' | 'EXPENSE') => {
    setInjectionType(type);
    setShowInjectionForm(true);
  };

  // ✅ GESTION DES ÉTATS DE CHARGEMENT ET D'ERREUR
  if (finance.isLoading && !finance.dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Chargement des données...</h3>
            <p className="text-gray-600">Récupération depuis la base de données</p>
          </div>
        </div>
      </div>
    );
  }

  if (finance.hasAnyError && !finance.dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <WifiOff className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Erreur de connexion</h3>
            <p className="text-red-600 mb-4">
              {finance.error || 'Le serveur backend n\'est pas accessible'}
            </p>
            <button 
              onClick={() => finance.refresh()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${className}`}>
      {/* ✅ HEADER AVEC STATUT */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Landmark className="w-5 h-5 text-white" />
                </div>
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  finance.connectionStatus === 'connected' ? 'bg-green-500' : 
                  finance.connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Finance Dashboard
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-green-700 font-medium">Base réelle</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Database className="w-3 h-3" />
                    <span>Txs: {realTimeData.totalTransactions}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>MAJ: {new Date(realTimeData.lastUpdated).toLocaleTimeString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => finance.refresh()}
                disabled={finance.isAnyLoading}
                className="flex items-center space-x-2 px-3 py-2 bg-white/70 hover:bg-white/90 text-gray-700 rounded-lg transition-all duration-200 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${finance.isAnyLoading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>

              <button 
                onClick={() => openInjectionForm('INCOME')}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
              
              <button 
                onClick={() => openInjectionForm('EXPENSE')}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all duration-200 font-medium shadow-lg"
              >
                <DollarSign className="w-4 h-4" />
                <span>Retirer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ✅ ALERTES BASÉES SUR LES VRAIES DONNÉES */}
        {(realTimeData.currentBalance < 0 || realTimeData.healthLevel === 'critical') && (
          <div className="mb-6 space-y-3">
            {realTimeData.currentBalance < 0 && (
              <div className="p-3 rounded-lg border-l-4 border-red-500 bg-red-50 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-red-900 text-sm">Capital négatif</h4>
                      <p className="text-xs text-red-700">Déficit de {finance.formatGNF(Math.abs(realTimeData.currentBalance))}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => openInjectionForm('INCOME')}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Injecter capital
                  </button>
                </div>
              </div>
            )}
            
            {realTimeData.healthLevel === 'critical' && realTimeData.currentBalance >= 0 && (
              <div className="p-3 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 shadow-md">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 text-sm">Situation financière critique</h4>
                    <p className="text-xs text-yellow-700">Score de santé: {realTimeData.healthScore}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ CARTES MÉTRIQUES PRINCIPALES - TAILLE RÉDUITE */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <CompactMetricCard
            title="Capital Actuel"
            value={realTimeData.formattedCurrentBalance}
            subtitle={`Score: ${realTimeData.healthScore}%`}
            icon={Wallet}
            gradient="bg-gradient-to-br from-blue-600 to-blue-700"
          />
          
          <CompactMetricCard
            title="Revenus Totaux"
            value={metrics.formattedIncome}
            subtitle="Toutes sources"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-emerald-600 to-emerald-700"
          />
          
          <CompactMetricCard
            title="Dépenses Totales"
            value={metrics.formattedExpenses}
            subtitle="Toutes catégories"
            icon={CreditCard}
            gradient="bg-gradient-to-br from-red-600 to-red-700"
          />

          <CompactMetricCard
            title="Performance"
            value={`${metrics.profitMargin.toFixed(1)}%`}
            subtitle="Marge bénéficiaire"
            icon={Target}
            gradient="bg-gradient-to-br from-purple-600 to-purple-700"
          />
        </div>

        {/* ✅ TOTAUX PAR SOURCE - CARTES COMPACTES */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Sources de Revenus et Dépenses
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <CompactMetricCard
              title="Paiements Étudiants"
              value={realTimeData.formattedStudentPayments}
              subtitle="Frais scolarité"
              icon={GraduationCap}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />

            <CompactMetricCard
              title="Salaires Personnel"
              value={realTimeData.formattedStaffSalaries}
              subtitle="Masse salariale"
              icon={Users}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />

            <CompactMetricCard
              title="Dépenses Générales"
              value={realTimeData.formattedGeneralExpenses}
              subtitle="Fonctionnement"
              icon={ShoppingCart}
              gradient="bg-gradient-to-br from-red-500 to-red-600"
            />

            <CompactMetricCard
              title="Transactions Manuelles"
              value={finance.formatGNF(realTimeData.totalManualIncome - realTimeData.totalManualExpenses)}
              subtitle="Injections/Retraits"
              icon={Shield}
              gradient="bg-gradient-to-br from-green-500 to-green-600"
              onClick={() => setShowInjectionForm(true)}
            />
          </div>
        </div>

        {/* ✅ SECTION PRINCIPALE AVEC GRAPHIQUES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graphique d'évolution */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Évolution Financière
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Données réelles ({chartData.length} points)</span>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period_label" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 8px 20px -5px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()} FG`,
                    name === 'income' ? 'Revenus' :
                    name === 'expenses' ? 'Dépenses' :
                    name === 'net_flow' ? 'Flux Net' : name
                  ]}
                />
                <Legend />
                
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  fill="url(#incomeGradient)" 
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Revenus"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  fill="url(#expenseGradient)" 
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Dépenses"
                />
                <Line 
                  type="monotone" 
                  dataKey="net_flow" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                  name="Flux Net"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Panneau activité récente */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Activité Récente</h3>
              <button 
                onClick={() => setShowTransactionDetails(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>Voir tout</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {finance.transactions?.slice(0, 6)?.map((tx, index) => (
                <div key={tx.transaction_id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {tx.category?.includes('tudiant') || tx.category?.includes('Paiement') ? <GraduationCap className="w-3 h-3" /> :
                       tx.category?.includes('Salaire') ? <Users className="w-3 h-3" /> :
                       tx.category?.includes('Capital') || tx.category?.includes('initial') ? <PiggyBank className="w-3 h-3" /> :
                       <ShoppingCart className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="font-medium text-xs text-gray-900">{tx.entity_name}</p>
                      <p className="text-xs text-gray-500">{tx.category}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-xs ${
                    tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{tx.formatted_amount || finance.formatGNF(tx.amount)}
                  </span>
                </div>
              )) || [
                <div key="no-data" className="text-center py-4 text-gray-500">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">Aucune transaction récente</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Les transactions apparaîtront ici
                  </p>
                </div>
              ]}
            </div>
          </div>
        </div>

        {/* ✅ RÉSUMÉ EXÉCUTIF AVEC DONNÉES RÉELLES */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 border border-blue-100/50 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Award className="w-5 h-5 mr-2 text-blue-600" />
              Résumé Exécutif
            </h3>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Base réelle</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>MAJ: {new Date(realTimeData.lastUpdated).toLocaleTimeString('fr-FR')}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white/70 backdrop-blur-sm rounded-lg shadow-md border border-white/20">
              <div className="text-lg font-bold text-blue-600 mb-1">
                {realTimeData.formattedStudentPayments}
              </div>
              <div className="text-xs text-gray-600 font-medium">Paiements Étudiants</div>
              <div className="text-xs text-gray-500 mt-1">Revenus principaux</div>
            </div>
            
            <div className="text-center p-3 bg-white/70 backdrop-blur-sm rounded-lg shadow-md border border-white/20">
              <div className="text-lg font-bold text-purple-600 mb-1">
                {realTimeData.formattedStaffSalaries}
              </div>
              <div className="text-xs text-gray-600 font-medium">Salaires Personnel</div>
              <div className="text-xs text-gray-500 mt-1">Masse salariale</div>
            </div>
            
            <div className="text-center p-3 bg-white/70 backdrop-blur-sm rounded-lg shadow-md border border-white/20">
              <div className="text-lg font-bold text-red-600 mb-1">
                {realTimeData.formattedGeneralExpenses}
              </div>
              <div className="text-xs text-gray-600 font-medium">Dépenses Générales</div>
              <div className="text-xs text-gray-500 mt-1">Fonctionnement</div>
            </div>
            
            <div className="text-center p-3 bg-white/70 backdrop-blur-sm rounded-lg shadow-md border border-white/20">
              <div className="text-lg font-bold text-indigo-600 mb-1">
                {realTimeData.formattedCurrentBalance}
              </div>
              <div className="text-xs text-gray-600 font-medium">Capital Actuel</div>
              <div className="text-xs text-gray-500 mt-1">
                {realTimeData.healthLevel === 'excellent' ? '🎉 Excellent' :
                 realTimeData.healthLevel === 'good' ? '✅ Bon' :
                 realTimeData.healthLevel === 'warning' ? '⚠️ Attention' : '🚨 Critique'}
              </div>
            </div>
          </div>
          
          {/* ✅ Indicateurs de performance */}
          <div className="mt-4 pt-3 border-t border-blue-100">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-sm font-semibold text-gray-900">Flux Net</div>
                <div className={`text-lg font-bold ${metrics.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.formattedNetBalance}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Marge</div>
                <div className={`text-lg font-bold ${metrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.profitMargin.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Santé</div>
                <div className={`text-lg font-bold ${
                  realTimeData.healthScore >= 80 ? 'text-green-600' :
                  realTimeData.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {realTimeData.healthScore}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MODAL DÉTAILS DES TRANSACTIONS */}
      {showTransactionDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-lg rounded-xl p-6 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Historique des Transactions - {finance.transactions?.length || 0} transactions
              </h3>
              <button 
                onClick={() => setShowTransactionDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {finance.transactions?.slice(0, 20)?.map((tx, index) => (
                <div key={tx.transaction_id || index} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-white/20 hover:shadow-lg transition-all">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {tx.category?.includes('tudiant') || tx.category?.includes('Paiement') ? <GraduationCap className="w-5 h-5" /> :
                       tx.category?.includes('Salaire') ? <Users className="w-5 h-5" /> :
                       tx.category?.includes('Capital') || tx.category?.includes('initial') ? <PiggyBank className="w-5 h-5" /> :
                       <ShoppingCart className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{tx.entity_name}</p>
                      <p className="text-sm text-gray-600">{tx.category}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{tx.formatted_date}</span>
                        <span>•</span>
                        <span>{tx.method || tx.payment_method || 'Non spécifié'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-lg ${
                      tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{tx.formatted_amount || finance.formatGNF(tx.amount)}
                    </span>
                    <div className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                      tx.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type === 'INCOME' ? 'Revenus' : 'Dépenses'}
                    </div>
                  </div>
                </div>
              )) || [
                <div key="no-data" className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Aucune transaction trouvée</p>
                  <p className="text-sm">Les transactions apparaîtront ici une fois chargées</p>
                </div>
              ]}
            </div>
            
            {/* ✅ Actions rapides */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowTransactionDetails(false);
                    openInjectionForm('INCOME');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter Revenus</span>
                </button>
                <button
                  onClick={() => {
                    setShowTransactionDetails(false);
                    openInjectionForm('EXPENSE');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Ajouter Dépense</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FORMULAIRE D'INJECTION UNIFIÉ */}
      <TransactionInjectionForm
        isOpen={showInjectionForm}
        onClose={() => setShowInjectionForm(false)}
        initialType={injectionType}
        onSuccess={(response) => {
          console.log('✅ Transaction injectée avec succès:', response);
          
          // ✅ Rafraîchissement optimisé avec délai
          setTimeout(() => {
            finance.refresh();
          }, 1500);
          
          // ✅ Notification visuelle (optionnelle)
          if (response.transaction) {
            const type = response.transaction.type;
            const amount = response.transaction.formatted_amount;
            console.log(`💰 ${type === 'INCOME' ? 'Ajout' : 'Retrait'} de ${amount} effectué avec succès`);
          }
        }}
        onError={(error) => {
          console.error('❌ Erreur lors de l\'injection:', error);
          
          // ✅ Gestion d'erreur optimisée
          if (error.message?.includes('429')) {
            console.warn('⚠️ Rate limiting détecté, retry automatique dans 3 secondes...');
            setTimeout(() => {
              finance.refresh();
            }, 3000);
          }
        }}
      />
    </div>
  );
};

export default FinanceDashboard;