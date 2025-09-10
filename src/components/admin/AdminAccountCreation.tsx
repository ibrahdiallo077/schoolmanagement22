import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Mail, User, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminCreationData {
  firstName: string;
  lastName: string;
  email: string;
}

interface AdminAccountCreationProps {
  onAdminCreated?: () => void;
  onBack?: () => void;
}

export function AdminAccountCreation({ onAdminCreated, onBack }: AdminAccountCreationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AdminCreationData>({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [errors, setErrors] = useState<Partial<AdminCreationData>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AdminCreationData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour créer un compte administrateur",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');
    setErrors({});

    try {
      console.log('🔐 Création d\'un nouveau compte administrateur:', formData);

      const response = await fetch(`${API_BASE_URL}/api/auth/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: 'admin',
          activationUrl: `${window.location.origin}/first-login`
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Compte administrateur créé avec succès:', data);
        
        setSuccessMessage(`Administrateur créé avec succès !`);
        
        // Réinitialiser le formulaire
        setFormData({
          firstName: '',
          lastName: '',
          email: ''
        });

        toast({
          title: "Administrateur créé",
          description: `Le compte de ${formData.firstName} ${formData.lastName} a été créé avec succès`,
        });

        // Appeler le callback pour actualiser la liste dans le parent
        if (onAdminCreated) {
          console.log('🔄 Actualisation de la liste des admins...');
          setTimeout(() => {
            onAdminCreated();
          }, 500);
        }

      } else {
        console.error('❌ Erreur lors de la création:', data.error);
        
        if (data.error.includes('email existe déjà') || data.error.includes('email already exists')) {
          setErrors({ email: 'Cette adresse email est déjà utilisée' });
        } else {
          toast({
            title: "Erreur",
            description: data.error || 'Erreur lors de la création du compte',
            variant: "destructive",
          });
        }
      }

    } catch (error) {
      console.error('💥 Erreur lors de la création du compte:', error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de contacter le serveur. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AdminCreationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleCreateAnother = () => {
    setSuccessMessage('');
    setFormData({
      firstName: '',
      lastName: '',
      email: ''
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Bouton retour */}
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="mb-4 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border-gray-300 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste des administrateurs
          </Button>
        )}

        {/* En-tête */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Créer un Administrateur
            </h1>
            <p className="text-gray-600 mt-2">Ajoutez un nouveau compte administrateur à votre système</p>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserPlus className="w-6 h-6" />
              </div>
              Nouveau compte administrateur
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8 bg-white">
            {/* Message de succès */}
            {successMessage && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Formulaire de création */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Prénom et Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Ex: Ahmed"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`pl-12 h-12 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0 ${errors.firstName ? '!border-red-300 !focus:border-red-500 !focus:ring-red-500' : ''}`}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Ex: Benali"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`pl-12 h-12 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0 ${errors.lastName ? '!border-red-300 !focus:border-red-500 !focus:ring-red-500' : ''}`}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Adresse email <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@ecole.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-12 h-12 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0 ${errors.email ? '!border-red-300 !focus:border-red-500 !focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-2">
                  L'administrateur recevra un email pour configurer son mot de passe
                </p>
              </div>

              {/* Information sur le processus */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Processus de création
                </h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    Le compte sera créé avec un rôle "Administrateur"
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    Un email de bienvenue sera envoyé automatiquement
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    L'administrateur devra configurer son mot de passe via l'email
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    Le lien expire après 24 heures
                  </li>
                </ul>
              </div>

              {/* Boutons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Créer le compte administrateur
                    </>
                  )}
                </Button>
                
                {successMessage && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreateAnother}
                    className="bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border-gray-300 text-gray-700 px-6 py-3 h-auto"
                  >
                    Créer un autre administrateur
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}