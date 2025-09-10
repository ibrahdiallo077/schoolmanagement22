import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Crown, Eye, EyeOff, User, Lock, AlertCircle, BookOpen,
  // ✨ ICONES pour sessions robustes (simplifiés)
  Wifi, WifiOff, CheckCircle
} from 'lucide-react';
import { 
  useAuth, 
  // ✨ HOOKS pour sessions robustes
  useNetworkStatus, 
  useSessionInfo 
} from '../../hooks/useAuth';


const LoginPage = () => {
  // États existants
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // ✨ ÉTATS simplifiés pour sessions robustes
  const [connectionQuality, setConnectionQuality] = useState<'stable' | 'unstable' | 'offline'>('stable');
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const navigate = useNavigate();
  const { signIn, verifyEmail, getConnectionStatus } = useAuth();
  
  // ✨ HOOKS pour surveillance
  const networkStatus = useNetworkStatus();

  // ✨ Détection automatique qualité connexion (silencieuse)
  useEffect(() => {
    const detectConnectionQuality = async () => {
      try {
        const status = await getConnectionStatus();
        setConnectionQuality(status.connectionQuality);
        
        // Auto-activer "Se souvenir" pour connexions très instables seulement
        if (status.connectionQuality === 'offline') {
          setRememberMe(true);
        }
      } catch (error) {
        // Silencieux
      }
    };

    detectConnectionQuality();
  }, [getConnectionStatus]);

  // Vérification automatique pour première connexion (conservée)
  useEffect(() => {
    const checkFirstLogin = async () => {
      if (email && email.includes('@')) {
        try {
          const result = await verifyEmail(email.toLowerCase());
          if (result.user?.is_first_login) {
            navigate('/first-login-email');
          }
        } catch (err) {
          // Silencieux
        }
      }
    };

    const timeoutId = setTimeout(checkFirstLogin, 1000);
    return () => clearTimeout(timeoutId);
  }, [email, navigate, verifyEmail]);

  // ✨ FONCTION SIMPLIFIÉE : Connexion avec sessions robustes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn(email.toLowerCase(), password, rememberMe);
      
      if (result.requiresFirstLogin) {
        navigate('/first-login-email', { 
          state: { email: email.toLowerCase() } 
        });
      } else if (result.error) {
        setLoginAttempts(prev => prev + 1);
        
        // ✨ Gestion simplifiée des erreurs
        if (result.error.includes('réseau') || result.error.includes('serveur')) {
          setError(`${result.error}. Activez "Se souvenir de moi" pour les connexions instables.`);
        } else if (result.error === 'Email ou mot de passe incorrect') {
          setError('Email ou mot de passe incorrect');
          
          if (loginAttempts >= 2) {
            setError('Email ou mot de passe incorrect. Contactez un administrateur si le problème persiste.');
          }
        } else {
          setError(result.error);
        }
      } else if (result.success) {
        // Redirection silencieuse
        navigate('/');
      }
    } catch (err: any) {
      setLoginAttempts(prev => prev + 1);
      
      if (!networkStatus.isOnline) {
        setError('Connexion internet requise. Vérifiez votre réseau et réessayez.');
      } else {
        setError(err.message || 'Erreur de connexion au serveur');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✨ Indicateur réseau discret
  const getNetworkIndicator = () => {
    if (!networkStatus.isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        text: 'Hors ligne'
      };
    }
    
    return {
      icon: Wifi,
      color: 'text-green-500',
      text: 'En ligne'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 flex overflow-hidden">
      {/* Section gauche - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-sm">
          {/* En-tête avec logo */}
          <div className="text-center mb-6">
            <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 rounded-full shadow-2xl flex items-center justify-center mx-auto mb-4 border-4 border-white/30 backdrop-blur-sm">
              <img 
                src="/assets/images/logo-markaz.png"
                alt="Logo Markaz Ubayd Ibn Kab" 
                className="w-20 h-20 rounded-full object-cover shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center hidden">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-700 to-green-600 bg-clip-text text-transparent mb-2 leading-tight">
              Haramain
            </h1>
            <p className="text-emerald-700 text-lg font-bold mb-4 tracking-wide">الحرمين</p>
            <p className="text-gray-700 text-sm font-semibold">Je suis</p>
          </div>

          {/* ✨ Indicateur de réseau discret */}
          {!networkStatus.isOnline && (
            <div className="mb-4 p-2 rounded-lg border bg-red-50 border-red-200 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-600">
                Connexion internet requise
              </span>
            </div>
          )}

          {/* Sélection de rôle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`flex-1 p-2.5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                selectedRole === 'admin'
                  ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md'
              }`}
            >
              <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center shadow-md ${
                selectedRole === 'admin' 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}>
                <Shield className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <div className="text-center">
                <p className={`font-semibold text-xs ${selectedRole === 'admin' ? 'text-emerald-700' : 'text-gray-700'}`}>
                  Admin
                </p>
                <p className="text-xs text-gray-500">Gestion</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('super_admin')}
              className={`flex-1 p-2.5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                selectedRole === 'super_admin'
                  ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-200 hover:shadow-md'
              }`}
            >
              <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center shadow-md ${
                selectedRole === 'super_admin' 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}>
                <Crown className={`w-4 h-4 ${selectedRole === 'super_admin' ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <div className="text-center">
                <p className={`font-semibold text-xs ${selectedRole === 'super_admin' ? 'text-purple-700' : 'text-gray-700'}`}>
                  Super Admin
                </p>
                <p className="text-xs text-gray-500">Complet</p>
              </div>
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Message d'erreur */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-3 flex items-start gap-3 shadow-sm">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-red-700 text-sm block">{error}</span>
                  {loginAttempts > 1 && (
                    <span className="text-red-600 text-xs mt-1 block">
                      Tentative {loginAttempts}/5
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Message de connexion */}
            {isLoading && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-emerald-700 text-sm">
                  Connexion en cours...
                </span>
              </div>
            )}

            {/* Champs Email et Mot de passe */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-emerald-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-sm"
                  placeholder="votre@email.com"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-emerald-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-sm"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-emerald-400 hover:text-emerald-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-emerald-400 hover:text-emerald-600" />
                  )}
                </button>
              </div>
            </div>

            {/* ✨ "Se souvenir de moi" SIMPLIFIÉ */}
            <div className="flex items-center justify-between">
              <label className="flex items-center group cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 bg-gray-100 border-gray-300 rounded focus:ring-emerald-400 group-hover:border-emerald-400 transition-colors"
                  />
                  {rememberMe && (
                    <CheckCircle className="w-4 h-4 text-emerald-500 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <span className="ml-2 text-sm text-gray-600 group-hover:text-emerald-600 transition-colors font-medium">
                  Se souvenir de moi
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* ✨ BOUTON DE CONNEXION SIMPLIFIÉ */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white py-2.5 px-4 rounded-xl font-semibold hover:from-emerald-700 hover:via-teal-700 hover:to-green-700 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connexion...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Se connecter
                  {/* ✨ SEULE indication pour session longue */}
                  {rememberMe && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      Session longue
                    </span>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Première connexion */}
          <div className="mt-4">
            <Link
              to="/first-login-email"
              className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-emerald-300 text-emerald-700 py-2.5 px-4 rounded-xl font-semibold hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              <User className="w-4 h-4" />
              Première connexion
            </Link>
          </div>

          {/* ✨ Footer SIMPLIFIÉ et professionnel */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500">
              <strong>Admin :</strong> Compte créé par le Super Administrateur
            </p>
            
            {/* Statut réseau minimaliste */}
            <div className="flex items-center justify-center gap-2 text-xs">
              {(() => {
                const indicator = getNetworkIndicator();
                return (
                  <>
                    <div className={`w-2 h-2 rounded-full ${networkStatus.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`font-medium ${indicator.color}`}>
                      {indicator.text}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ✨ Section droite - MARKETING PROFESSIONNEL */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 items-center justify-center p-8 relative overflow-hidden">
        {/* Motifs de fond animés */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white rounded-full animate-pulse animation-delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-16 h-16 bg-white rounded-full animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative z-10 text-center text-white max-w-md">
          <div className="mb-6">
            {/* ✨ Titre simple et élégant */}
            <h2 className="text-3xl font-bold mb-3 leading-tight">
              Plateforme de Gestion Scolaire
            </h2>
            <p className="text-lg text-emerald-100 mb-4 leading-relaxed">
              Découvrez une gestion d'école moderne qui automatise votre quotidien et libère votre potentiel pédagogique.
            </p>
          </div>

          {/* Image du Coran avec design compact */}
          <div className="relative mb-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              
              <div className="relative bg-gradient-to-br from-yellow-200 via-orange-300 to-red-400 rounded-2xl p-1 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-1.5 shadow-lg overflow-hidden">
                  <img 
                    src="/assets/images/coran.jpg"
                    alt="Coran ouvert" 
                    className="w-full h-32 object-cover rounded-lg shadow-inner"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="w-full h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center hidden">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ✨ Verset coranique CENTRÉ et compact */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/30 shadow-xl">
            {/* ✨ Titre centré */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-emerald-200" />
              <h3 className="font-semibold text-emerald-100 text-sm text-center">
                Coran - Sourate Al-Alaq (96:1)
              </h3>
            </div>
            <p className="text-lg font-bold mb-2 leading-relaxed text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
              اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ
            </p>
            <p className="text-emerald-100 text-xs italic text-center">
              "Lis au nom de ton Seigneur qui a créé"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;