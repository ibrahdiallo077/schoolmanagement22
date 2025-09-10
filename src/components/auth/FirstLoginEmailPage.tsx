import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoMarkaz from '../../assets/images/logo-markaz.png';
import coranImage from '../../assets/images/coran.jpg';

const FirstLoginEmailPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, generateFirstLoginToken } = useAuth();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  // Remplacez la fonction handleSubmit dans FirstLoginEmailPage.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email) {
    setError('Veuillez saisir votre adresse email');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError('Veuillez saisir une adresse email valide');
    return;
  }

  setIsLoading(true);
  setError('');
  setSuccess('');

  try {
    // Étape 1: Vérifier que l'email existe
    const emailCheck = await verifyEmail(email.toLowerCase());
    if (emailCheck.error) {
      setError(emailCheck.error);
      return;
    }

    console.log('✅ Email vérifié:', emailCheck);

    // Étape 2: Essayer de générer le token (l'API backend vérifiera is_first_login)
    const tokenResult = await generateFirstLoginToken(email.toLowerCase());
    
    if (tokenResult.error) {
      // Si l'API retourne une erreur spécifique pour compte déjà activé
      if (tokenResult.error.includes('déjà configuré') || tokenResult.error.includes('déjà activé')) {
        setError('Ce compte est déjà activé. Utilisez la page de connexion normale.');
      } else {
        setError(tokenResult.error);
      }
      return;
    }

    if (tokenResult.token) {
      setSuccess('Lien généré avec succès ! Redirection...');
      setTimeout(() => {
        navigate(`/first-login?token=${tokenResult.token}&email=${encodeURIComponent(email)}`);
      }, 1500);
    } else {
      setError('Erreur lors de la génération du token');
    }

  } catch (err) {
    console.error('❌ Erreur:', err);
    setError('Erreur de connexion au serveur.');
  } finally {
    setIsLoading(false);
  }
};

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
              <Mail className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Haramain</h1>
          <p className="text-white text-sm font-semibold mb-2">الحرمين</p>
          <div className="bg-white/20 rounded-full px-4 py-1 inline-block border border-white/30">
            <p className="text-white text-sm font-medium">Première connexion</p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-white/50">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-3">
            Configuration du compte
          </h2>
          <p className="text-sm text-center text-gray-600 mb-5">
            Entrez votre email pour configurer votre mot de passe
          </p>

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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-emerald-500 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="ex: votre@email.com"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div className="text-xs text-gray-500 border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="mb-1 font-medium">Étapes de configuration :</p>
              <ul className="space-y-1">
                <li>• Vérification de votre email</li>
                <li>• Configuration de votre mot de passe</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Vérification...
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginEmailPage;
