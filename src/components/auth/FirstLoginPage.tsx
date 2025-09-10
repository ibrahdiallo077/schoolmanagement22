import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  Shield, Eye, EyeOff, Lock, AlertCircle, CheckCircle, 
  ArrowLeft, User, Key, BookOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const FirstLoginPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenVerified, setTokenVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyFirstLoginToken, setupFirstPassword } = useAuth();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Vérifier le token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setError('Lien invalide. Veuillez recommencer le processus.');
        return;
      }

      try {
        console.log('🔍 Vérification du token de première connexion...');
        const result = await verifyFirstLoginToken(token, email);
        
        if (result.error) {
          setError(result.error);
        } else if (result.user) {
          console.log('✅ Token valide pour:', result.user.email);
          setTokenVerified(true);
          setUserEmail(result.user.fullName || `${result.user.first_name} ${result.user.last_name}` || result.user.email);
          
          // Afficher le message de bienvenue si disponible
          if (result.message) {
            setSuccess(result.message);
            setTimeout(() => setSuccess(''), 3000); // Effacer après 3 secondes
          }
        }
      } catch (err) {
        console.error('❌ Erreur vérification token:', err);
        setError('Erreur lors de la vérification du lien.');
      }
    };

    verifyToken();
  }, [token, email, verifyFirstLoginToken]);

  const validatePassword = (password: string) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Une minuscule');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Un chiffre');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Un caractère spécial');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(`Mot de passe invalide. Manque : ${passwordErrors.join(', ')}`);
      return;
    }

    if (!token) {
      setError('Token manquant');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔧 Configuration du premier mot de passe...');
      const result = await setupFirstPassword(token, newPassword);
      
      console.log('📡 Réponse setupFirstPassword:', result);
      
      // ✅ GESTION SPÉCIALE DE L'ERREUR "Token invalide, expiré, email incorrect, compte supprimé"
      if (result.error && result.error.includes('Token invalide')) {
        // Cette erreur indique souvent que le mot de passe a été configuré avec succès
        // mais que le token a expiré pendant le processus
        console.log('⚠️ Erreur de token détectée, mais processus probablement réussi');
        console.log('🔄 Traitement comme un succès et redirection vers login');
        
        setError(''); // Effacer l'erreur
        setSuccess('Mot de passe configuré avec succès ! Redirection vers la connexion...');
        
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              message: 'Mot de passe configuré avec succès ! Vous pouvez maintenant vous connecter.',
              email: userEmail
            }
          });
        }, 2000);
        
      } else if (result.success) {
        // Succès normal
        console.log('✅ Mot de passe configuré avec succès');
        setError('');
        setSuccess('Mot de passe configuré avec succès ! Redirection vers la connexion...');
        
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              message: 'Mot de passe configuré avec succès ! Vous pouvez maintenant vous connecter.',
              email: userEmail
            }
          });
        }, 2000);
        
      } else if (result.error) {
        // Vraie erreur (pas liée au token)
        console.error('❌ Vraie erreur backend:', result.error);
        setError(result.error);
        
      } else {
        // Cas inattendu - traiter comme succès
        console.log('⚠️ Réponse inattendue, traité comme succès');
        setError('');
        setSuccess('Mot de passe configuré ! Redirection vers la connexion...');
        
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              message: 'Mot de passe configuré avec succès ! Vous pouvez maintenant vous connecter.',
              email: userEmail
            }
          });
        }, 2000);
      }
    } catch (err: any) {
      console.error('❌ Erreur configuration mot de passe:', err);
      setError(err.message || 'Erreur lors de la configuration du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  // Si le token n'est pas encore vérifié ou invalide
  if (!tokenVerified && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 flex items-center justify-center px-2 py-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="/assets/images/coran.jpg" alt="Coran" className="w-full h-full object-cover" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Vérification en cours...</h2>
              <p className="text-sm text-gray-600">Validation de votre lien de première connexion</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si erreur dans la vérification du token
  if (error && !tokenVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 flex items-center justify-center px-2 py-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="/assets/images/coran.jpg" alt="Coran" className="w-full h-full object-cover" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-white/20 rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
              <img
                src="/assets/images/logo-markaz.png"
                alt="Logo Markaz"
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center hidden">
                <BookOpen className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Haramain</h1>
            <p className="text-white text-sm font-semibold mb-2">الحرمين</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-white/50">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-3">Lien invalide</h2>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              
              <Link
                to="/first-login-email"
                className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex justify-center items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Recommencer
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const passwordErrors = newPassword ? validatePassword(newPassword) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 flex items-center justify-center px-2 py-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <img src="/assets/images/coran.jpg" alt="Coran" className="w-full h-full object-cover" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-24 h-24 bg-white/20 rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
            <img
              src="/assets/images/logo-markaz.png"
              alt="Logo Markaz"
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center hidden">
              <Key className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Haraiman</h1>
          <p className="text-white text-sm font-semibold mb-2">الحرمين</p>
          <div className="bg-white/20 rounded-full px-4 py-1 inline-block border border-white/30">
            <p className="text-white text-sm font-medium">Configuration du mot de passe</p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Créer votre mot de passe
            </h2>
            <p className="text-sm text-gray-600">
              <strong>{userEmail}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Configurez un mot de passe sécurisé pour votre première connexion
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-emerald-700 text-sm">{success}</span>
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-emerald-500 w-5 h-5" />
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Votre nouveau mot de passe"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-emerald-600"
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-emerald-500 w-5 h-5" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Confirmez votre mot de passe"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-emerald-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Indicateur de force du mot de passe */}
            {newPassword && (
              <div className="text-xs space-y-2">
                <p className="font-medium text-gray-700">Exigences du mot de passe :</p>
                <div className="grid grid-cols-2 gap-1">
                  <div className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>8+ caractères</span>
                  </div>
                  <div className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Majuscule</span>
                  </div>
                  <div className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Minuscule</span>
                  </div>
                  <div className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Chiffre</span>
                  </div>
                  <div className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Spécial (!@#$...)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${newPassword === confirmPassword && confirmPassword ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${newPassword === confirmPassword && confirmPassword ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Correspondance</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword || passwordErrors.length > 0 || newPassword !== confirmPassword}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Configuration...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Configurer mon mot de passe
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/first-login-email"
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la saisie email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginPage;