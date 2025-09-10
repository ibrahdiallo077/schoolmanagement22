import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building, 
  Calendar, 
  FileText,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  // Upload,
  Save,
  Check,
  GraduationCap,
  CreditCard,
  UserCheck,
  // Camera,
  X,
  AlertCircle,
  Info,
  Users,
  Award
} from 'lucide-react';

// ===== INTERFACES COMPLÈTES =====
interface StaffFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | '';
  position: string;
  department: string;
  hireDate: string;
  qualifications: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  salary: string;
  paymentMethod: string;
  bankAccount: string;
  status: 'active' | 'inactive';
  contractType: string;
  notes: string;
  // profilePhoto?: File;
  // photoUrl?: string;
}

interface WizardProps {
  mode?: 'create' | 'edit';
  staffId?: string;
  initialData?: any;
  onSuccess?: (staff: any) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

// ===== OPTIONS DE SÉLECTION =====
const POSITION_OPTIONS = [
  { value: 'teacher', label: '👨‍🏫 Enseignant(e)' },
  { value: 'admin', label: '👨‍💼 Administrateur/trice' },
  { value: 'secretary', label: '📋 Secrétaire' },
  { value: 'accountant', label: '💰 Comptable' },
  { value: 'guard', label: '👮‍♂️ Gardien(ne)' },
  { value: 'cook', label: '👨‍🍳 Cuisinier(ère)' },
  { value: 'cleaner', label: '🧹 Agent(e) d\'entretien' },
  { value: 'driver', label: '🚗 Chauffeur' },
  { value: 'nurse', label: '👩‍⚕️ Infirmier(ère)' },
  { value: 'librarian', label: '📚 Bibliothécaire' },
  { value: 'it_support', label: '💻 Support informatique' },
  { value: 'maintenance', label: '🔧 Maintenance' }
];

const DEPARTMENT_OPTIONS = [
  { value: 'education', label: '🎓 Éducation' },
  { value: 'administration', label: '🏢 Administration' },
  { value: 'finance', label: '💰 Finance' },
  { value: 'security', label: '🛡️ Sécurité' },
  { value: 'food_service', label: '🍽️ Restauration' },
  { value: 'maintenance', label: '🔧 Maintenance' },
  { value: 'transport', label: '🚗 Transport' },
  { value: 'health', label: '⚕️ Santé' },
  { value: 'library', label: '📚 Bibliothèque' },
  { value: 'it', label: '💻 Informatique' }
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank_transfer', label: '🏦 Virement bancaire' },
  { value: 'cash', label: '💵 Espèces' },
  { value: 'mobile_money', label: '📱 Mobile Money' }
];

const CONTRACT_TYPE_OPTIONS = [
  { value: 'cdi', label: '📋 CDI - Contrat à Durée Indéterminée' },
  { value: 'cdd', label: '📄 CDD - Contrat à Durée Déterminée' }
];

// ===== COMPOSANT INPUTFIELD =====
const InputField: React.FC<{
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{value: string, label: string}>;
  rows?: number;
  icon?: React.ReactNode;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}> = ({ 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  required = false,
  options,
  rows,
  icon,
  help,
  value,
  onChange,
  error,
  disabled = false
}) => {
  if (options) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
              {icon}
            </div>
          )}
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 appearance-none bg-white ${
              error ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <option value="">Sélectionner...</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        {help && !error && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            {help}
          </p>
        )}
        {error && (
          <p className="text-red-500 text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    );
  }

  const Component = rows ? 'textarea' : 'input';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}
        <Component
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          autoComplete="off"
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none disabled:bg-gray-100 ${
            error ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        />
      </div>
      {help && !error && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {help}
        </p>
      )}
      {error && (
        <p className="text-red-500 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

// ===== COMPOSANT GENDER SELECTOR =====
const GenderSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}> = ({ value, onChange, error, disabled = false }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      Genre <span className="text-red-500">*</span>
    </label>
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onChange('male')}
        disabled={disabled}
        className={`flex-1 py-3 px-4 border rounded-xl transition-all duration-200 disabled:opacity-50 ${
          value === 'male'
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        👨 Masculin
      </button>
      <button
        type="button"
        onClick={() => onChange('female')}
        disabled={disabled}
        className={`flex-1 py-3 px-4 border rounded-xl transition-all duration-200 disabled:opacity-50 ${
          value === 'female'
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        👩 Féminin
      </button>
    </div>
    {error && (
      <p className="text-red-500 text-sm flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

// // ===== COMPOSANT PHOTO UPLOAD CORRIGÉ =====
// const PhotoUpload: React.FC<{
//   photoPreview: string;
//   onPhotoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
//   onRemovePhoto: () => void;
//   error?: string;
//   disabled?: boolean;
// }> = ({ photoPreview, onPhotoChange, onRemovePhoto, error, disabled = false }) => (
//   <div className="space-y-4">
//     <label className="block text-sm font-medium text-gray-700">
//       Photo de profil
//     </label>
    
//     <div className="flex items-center space-x-6">
//       <div className="relative">
//         {photoPreview ? (
//           <div className="relative">
//             <img
//               src={photoPreview}
//               alt="Aperçu"
//               className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
//               onError={(e) => {
//                 console.error('❌ Erreur chargement image:', photoPreview);
//                 // Fallback vers avatar par défaut en cas d'erreur
//                 const target = e.target as HTMLImageElement;
//                 target.style.display = 'none';
//                 const parent = target.parentElement;
//                 if (parent) {
//                   const fallback = document.createElement('div');
//                   fallback.className = 'w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center border-4 border-gray-200';
//                   fallback.innerHTML = '<span class="text-white text-2xl">👤</span>';
//                   parent.appendChild(fallback);
//                 }
//               }}
//             />
//             <button
//               type="button"
//               onClick={onRemovePhoto}
//               disabled={disabled}
//               className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
//             >
//               <X className="w-4 h-4" />
//             </button>
//           </div>
//         ) : (
//           <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
//             <Camera className="w-8 h-8 text-gray-400" />
//           </div>
//         )}
//       </div>
      
//       <div className="flex-1">
//         <input
//           type="file"
//           accept="image/*"
//           onChange={onPhotoChange}
//           disabled={disabled}
//           className="hidden"
//           id="photo-upload"
//         />
//         <label
//           htmlFor="photo-upload"
//           className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${
//             disabled ? 'opacity-50 cursor-not-allowed' : ''
//           }`}
//         >
//           <Upload className="w-4 h-4 mr-2" />
//           Choisir une photo
//         </label>
//         <p className="text-xs text-gray-500 mt-1">
//           PNG, JPG, GIF jusqu'à 5MB
//         </p>
//         {photoPreview && photoPreview.startsWith('blob:') && (
//           <p className="text-xs text-orange-600 mt-1">
//             ⚠️ Photo temporaire - sera uploadée lors de la sauvegarde
//           </p>
//         )}
//       </div>
//     </div>
    
//     {error && (
//       <p className="text-red-500 text-sm flex items-center gap-1">
//         <AlertCircle className="w-4 h-4" />
//         {error}
//       </p>
//     )}
//   </div>
// );

// ===== MOCK TOAST =====
const useToast = () => ({
  toast: ({ title, description }: any) => {
    console.log('🎉 Toast:', title, description);
    
    // Créer une notification visuelle
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-md transform transition-all duration-300 ease-in-out';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="text-2xl">✅</span>
        <div>
          <div class="font-bold text-lg">${title}</div>
          <div class="text-sm opacity-90">${description}</div>
        </div>
      </div>
    `;
    
    // Animation d'entrée
    notification.style.transform = 'translateX(100%)';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Suppression automatique
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
});

// ===== COMPOSANT PRINCIPAL =====
const StaffEnrollmentWizard: React.FC<WizardProps> = ({
  mode = 'create',
  staffId,
  initialData,
  onSuccess,
  onCancel,
  onError
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  
  // ===== ÉTAT DU FORMULAIRE =====
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    position: '',
    department: '',
    hireDate: '',
    qualifications: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    salary: '',
    paymentMethod: '',
    bankAccount: '',
    status: 'active',
    contractType: '',
    notes: '',
    // photoUrl: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  // const [photoPreview, setPhotoPreview] = useState<string>('');

  // ===== INITIALISATION DONNÉES EN MODE ÉDITION =====
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      console.log('📝 Initialisation mode édition:', initialData);
      
      setFormData({
        firstName: initialData.firstName || initialData.first_name || '',
        lastName: initialData.lastName || initialData.last_name || '',
        dateOfBirth: initialData.dateOfBirth || initialData.date_of_birth || '',
        gender: initialData.gender || '',
        position: initialData.position || '',
        department: initialData.department || '',
        hireDate: initialData.hireDate || initialData.hire_date || '',
        qualifications: initialData.qualifications || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        emergencyContact: initialData.emergencyContact || initialData.emergency_contact || '',
        emergencyPhone: initialData.emergencyPhone || initialData.emergency_phone || '',
        salary: initialData.salary?.toString() || '',
        paymentMethod: initialData.paymentMethod || initialData.payment_method || '',
        bankAccount: initialData.bankAccount || initialData.bank_account || '',
        status: initialData.status || 'active',
        contractType: initialData.contractType || initialData.contract_type || '',
        notes: initialData.notes || '',
        // photoUrl: initialData.photoUrl || initialData.photo_url || ''
      });
      
      // // Définir preview avec URL existante
      // if (initialData.photo_url || initialData.photoUrl) {
      //   const photoUrl = initialData.photo_url || initialData.photoUrl;
      //   console.log('📸 Photo existante trouvée:', photoUrl);
      //   setPhotoPreview(photoUrl);
      // }
    }
  }, [mode, initialData]);

  // ===== GESTIONNAIRE CHANGEMENT CHAMP =====
  const handleFieldChange = (field: keyof StaffFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur si elle existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ===== CONFIGURATION DES ÉTAPES =====
  const getSteps = () => [
    {
      id: 1,
      title: 'Identité',
      subtitle: currentStep > 1 ? 'Complété' : currentStep === 1 ? 'En cours' : 'Verrouillé',
      icon: <User className="w-5 h-5" />,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending'
    },
    {
      id: 2,
      title: 'Professionnel',
      subtitle: currentStep > 2 ? 'Complété' : currentStep === 2 ? 'En cours' : 'Verrouillé',
      icon: <GraduationCap className="w-5 h-5" />,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending'
    },
    {
      id: 3,
      title: 'Contact',
      subtitle: currentStep > 3 ? 'Complété' : currentStep === 3 ? 'En cours' : 'Verrouillé',
      icon: <Users className="w-5 h-5" />,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending'
    },
    {
      id: 4,
      title: 'Paiement',
      subtitle: currentStep > 4 ? 'Complété' : currentStep === 4 ? 'En cours' : 'Verrouillé',
      icon: <CreditCard className="w-5 h-5" />,
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'pending'
    },
    {
      id: 5,
      title: 'Finaliser',
      subtitle: currentStep > 5 ? 'Complété' : currentStep === 5 ? 'En cours' : 'Verrouillé',
      icon: <UserCheck className="w-5 h-5" />,
      status: currentStep > 5 ? 'completed' : currentStep === 5 ? 'current' : 'pending'
    }
  ];

  // ===== VALIDATION DES ÉTAPES =====
    // Fixed validation function in StaffEnrollmentWizard.tsx

// Replace the existing validateStep function with this corrected version:

const validateStep = (step: number): boolean => {
  const stepErrors: Record<string, string> = {};
  
  switch (step) {
    case 1:
      if (!formData.firstName.trim()) stepErrors.firstName = 'Le prénom est requis';
      if (!formData.lastName.trim()) stepErrors.lastName = 'Le nom est requis';
      if (!formData.dateOfBirth) stepErrors.dateOfBirth = 'La date de naissance est requise';
      if (!formData.gender) stepErrors.gender = 'Le genre est requis';
      break;
      
    case 2:
      if (!formData.position.trim()) stepErrors.position = 'Le poste est requis';
      if (!formData.department.trim()) stepErrors.department = 'Le département est requis';
      if (!formData.hireDate) stepErrors.hireDate = 'La date d\'embauche est requise';
      if (!formData.contractType.trim()) stepErrors.contractType = 'Le type de contrat est requis';
      break;
      
    case 3:
      // FIXED: More flexible phone validation
      if (!formData.phone.trim()) {
        stepErrors.phone = 'Le téléphone est requis';
      } else {
        const cleanPhone = formData.phone.replace(/[\s\-\+\(\)]/g, '');
        if (cleanPhone.length < 8 || cleanPhone.length > 15 || !/^\d+$/.test(cleanPhone)) {
          stepErrors.phone = 'Format de téléphone invalide (8-15 chiffres)';
        }
      }
      
      if (!formData.email.trim()) {
        stepErrors.email = 'L\'email est requis';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        stepErrors.email = 'Format d\'email invalide';
      }
      
      if (!formData.address.trim()) stepErrors.address = 'L\'adresse est requise';
      break;
      
    case 4:
      if (!formData.salary.trim()) {
        stepErrors.salary = 'Le salaire est requis';
      } else if (isNaN(Number(formData.salary)) || Number(formData.salary) <= 0) {
        stepErrors.salary = 'Le salaire doit être un nombre positif';
      }
      break;
  }

  setErrors(stepErrors);
  return Object.keys(stepErrors).length === 0;
};
  // ===== NAVIGATION =====
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || step === currentStep + 1) {
      setCurrentStep(step);
    }
  };

  // // ===== GESTION PHOTO =====
  // const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   console.log('📸 Nouvelle photo sélectionnée:', file.name, file.size, file.type);

  //   if (!file.type.startsWith('image/')) {
  //     setErrors(prev => ({ ...prev, photo: 'Veuillez sélectionner un fichier image' }));
  //     return;
  //   }

  //   if (file.size > 5 * 1024 * 1024) {
  //     setErrors(prev => ({ ...prev, photo: 'La taille de l\'image ne peut pas dépasser 5MB' }));
  //     return;
  //   }

  //   // Stocker le fichier et créer un aperçu
  //   setFormData(prev => ({ ...prev, profilePhoto: file }));

  //   const reader = new FileReader();
  //   reader.onload = (e) => {
  //     if (e.target?.result) {
  //       const preview = e.target.result as string;
  //       console.log('📸 Aperçu photo créé');
  //       setPhotoPreview(preview);
  //     }
  //   };
  //   reader.readAsDataURL(file);

  //   // Effacer l'erreur si elle existe
  //   if (errors.photo) {
  //     setErrors(prev => {
  //       const newErrors = { ...prev };
  //       delete newErrors.photo;
  //       return newErrors;
  //     });
  //   }
  // };

  // const removePhoto = () => {
  //   console.log('🗑️ Suppression photo');
  //   setFormData(prev => ({ 
  //     ...prev, 
  //     profilePhoto: undefined,
  //     photoUrl: ''
  //   }));
  //   setPhotoPreview('');
    
  //   // Reset input file
  //   const fileInput = document.querySelector('#photo-upload') as HTMLInputElement;
  //   if (fileInput) {
  //     fileInput.value = '';
  //   }
  // };

  // ===== SOUMISSION =====
  // ===== GESTIONNAIRE D'ANNULATION =====
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      console.log('Annulation du formulaire');
    }
  };

  // ===== SOUMISSION =====
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    
    try {
      console.log('💾 === PRÉPARATION SAUVEGARDE ===');
      console.log('📋 Données formulaire:', formData);
      console.log('📄 Type contrat:', formData.contractType);

      // Préparer les données avec mapping correct
      const staffData = {
        id: staffId || `STAFF-${Date.now().toString().slice(-6)}`,
        staff_number: staffId ? initialData?.staff_number : `STAFF-${Date.now().toString().slice(-6)}`,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        position: formData.position,
        department: formData.department,
        salary: parseInt(formData.salary) || 0,
        status: formData.status,
        hire_date: formData.hireDate,
        address: formData.address.trim(),
        emergency_contact: formData.emergencyContact.trim(),
        emergency_phone: formData.emergencyPhone.trim(),
        qualifications: formData.qualifications.trim(),
        payment_method: formData.paymentMethod,
        bank_account: formData.bankAccount.trim(),
        contract_type: formData.contractType,
        notes: formData.notes.trim(),
        initials: `${formData.firstName[0]}${formData.lastName[0]}`,
        created_at: initialData?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        photo_url: null // Pas de photo
      };

      console.log('📤 Données finales à envoyer:', staffData);

      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: mode === 'edit' ? "✏️ Modification réussie !" : "🎉 Personnel ajouté !",
        description: `${staffData.first_name} ${staffData.last_name} a été ${mode === 'edit' ? 'modifié(e)' : 'ajouté(e)'} avec succès.`
      });

      if (onSuccess) {
        onSuccess(staffData);
      } else {
        console.log('✅ Personnel sauvegardé avec succès');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde';
      console.error('❌ Erreur sauvegarde:', errorMessage);
      if (onError) {
        onError(errorMessage);
      } else {
        toast({
          title: "❌ Erreur",
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDU DES ÉTAPES =====
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations personnelles</h2>
              <p className="text-gray-600">Saisissez les informations d'identité du personnel</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Prénom"
                name="firstName"
                placeholder="Prénom de l'employé"
                required
                icon={<User className="w-4 h-4" />}
                value={formData.firstName}
                onChange={(value) => handleFieldChange('firstName', value)}
                error={errors.firstName}
                disabled={loading}
              />
              
              <InputField
                label="Nom de famille"
                name="lastName"
                placeholder="Nom de famille"
                required
                icon={<User className="w-4 h-4" />}
                value={formData.lastName}
                onChange={(value) => handleFieldChange('lastName', value)}
                error={errors.lastName}
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Date de naissance"
                name="dateOfBirth"
                type="date"
                required
                icon={<Calendar className="w-4 h-4" />}
                value={formData.dateOfBirth}
                onChange={(value) => handleFieldChange('dateOfBirth', value)}
                error={errors.dateOfBirth}
                disabled={loading}
              />
              
              <GenderSelector
                value={formData.gender}
                onChange={(value) => handleFieldChange('gender', value)}
                error={errors.gender}
                disabled={loading}
              />
            </div>
            
            {/* <PhotoUpload
              photoPreview={photoPreview}
              onPhotoChange={handlePhotoChange}
              onRemovePhoto={removePhoto}
              error={errors.photo}
              disabled={loading}
            /> */}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations professionnelles</h2>
              <p className="text-gray-600">Définissez le rôle et les responsabilités</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Poste"
                name="position"
                placeholder="Sélectionner le poste"
                required
                options={POSITION_OPTIONS}
                icon={<Briefcase className="w-4 h-4" />}
                value={formData.position}
                onChange={(value) => handleFieldChange('position', value)}
                error={errors.position}
                disabled={loading}
              />
              
              <InputField
                label="Département"
                name="department"
                placeholder="Sélectionner le département"
                required
                options={DEPARTMENT_OPTIONS}
                icon={<Building className="w-4 h-4" />}
                value={formData.department}
                onChange={(value) => handleFieldChange('department', value)}
                error={errors.department}
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Date d'embauche"
                name="hireDate"
                type="date"
                required
                icon={<Calendar className="w-4 h-4" />}
                value={formData.hireDate}
                onChange={(value) => handleFieldChange('hireDate', value)}
                error={errors.hireDate}
                disabled={loading}
              />
              
              <InputField
                label="Type de contrat"
                name="contractType"
                placeholder="Sélectionner le type de contrat"
                required
                options={CONTRACT_TYPE_OPTIONS}
                icon={<FileText className="w-4 h-4" />}
                value={formData.contractType}
                onChange={(value) => handleFieldChange('contractType', value)}
                error={errors.contractType}
                disabled={loading}
                help="CDI pour un emploi permanent, CDD pour un emploi temporaire"
              />
            </div>
            
            <InputField
              label="Qualifications"
              name="qualifications"
              placeholder="Diplômes, certifications, compétences spéciales..."
              rows={3}
              icon={<Award className="w-4 h-4" />}
              value={formData.qualifications}
              onChange={(value) => handleFieldChange('qualifications', value)}
              disabled={loading}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations de contact</h2>
              <p className="text-gray-600">Coordonnées et contact d'urgence</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Téléphone"
                name="phone"
                type="tel"
                placeholder="+224 6XX XXX XXX"
                required
                icon={<Phone className="w-4 h-4" />}
                value={formData.phone}
                onChange={(value) => handleFieldChange('phone', value)}
                error={errors.phone}
                disabled={loading}
              />
              
              <InputField
                label="Email"
                name="email"
                type="email"
                placeholder="email@exemple.com"
                required
                icon={<Mail className="w-4 h-4" />}
                value={formData.email}
                onChange={(value) => handleFieldChange('email', value)}
                error={errors.email}
                disabled={loading}
              />
            </div>
            
            <InputField
              label="Adresse complète"
              name="address"
              placeholder="Quartier, Commune, Conakry..."
              required
              icon={<MapPin className="w-4 h-4" />}
              value={formData.address}
              onChange={(value) => handleFieldChange('address', value)}
              error={errors.address}
              disabled={loading}
            />
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Contact d'urgence
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Nom du contact"
                  name="emergencyContact"
                  placeholder="Nom complet du contact d'urgence"
                  icon={<Users className="w-4 h-4" />}
                  value={formData.emergencyContact}
                  onChange={(value) => handleFieldChange('emergencyContact', value)}
                  disabled={loading}
                />
                
                <InputField
                  label="Téléphone d'urgence"
                  name="emergencyPhone"
                  type="tel"
                  placeholder="+224 6XX XXX XXX"
                  icon={<Phone className="w-4 h-4" />}
                  value={formData.emergencyPhone}
                  onChange={(value) => handleFieldChange('emergencyPhone', value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations de paiement</h2>
              <p className="text-gray-600">Salaire et modalités de paiement</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <InputField
                label="Salaire mensuel"
                name="salary"
                type="number"
                placeholder="Montant en francs guinéens"
                required
                icon={<span className="text-xs font-light mr-1">GNF</span>}
                help="Montant en francs guinéens (GNF)"
                value={formData.salary}
                onChange={(value) => handleFieldChange('salary', value)}
                error={errors.salary}
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Mode de paiement"
                name="paymentMethod"
                placeholder="Sélectionner le mode"
                options={PAYMENT_METHOD_OPTIONS}
                icon={<CreditCard className="w-4 h-4" />}
                value={formData.paymentMethod}
                onChange={(value) => handleFieldChange('paymentMethod', value)}
                disabled={loading}
              />
              
              <InputField
                label="Numéro de compte/mobile"
                name="bankAccount"
                placeholder="Numéro de compte bancaire ou mobile money"
                icon={<CreditCard className="w-4 h-4" />}
                value={formData.bankAccount}
                onChange={(value) => handleFieldChange('bankAccount', value)}
                disabled={loading}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Finalisation</h2>
              <p className="text-gray-600">Vérifiez et complétez les informations</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Résumé des informations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nom complet:</span>
                      <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de naissance:</span>
                      <span className="font-medium">{formData.dateOfBirth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Genre:</span>
                      <span className="font-medium">
                        {formData.gender === 'male' ? 'Masculin' : formData.gender === 'female' ? 'Féminin' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Poste:</span>
                      <span className="font-medium">
                        {POSITION_OPTIONS.find(p => p.value === formData.position)?.label || formData.position}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Département:</span>
                      <span className="font-medium">
                        {DEPARTMENT_OPTIONS.find(d => d.value === formData.department)?.label || formData.department}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type de contrat:</span>
                      <span className="font-medium">
                        {CONTRACT_TYPE_OPTIONS.find(c => c.value === formData.contractType)?.label || formData.contractType}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Téléphone:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date d'embauche:</span>
                      <span className="font-medium">{formData.hireDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salaire:</span>
                      <span className="font-medium">{Number(formData.salary).toLocaleString()} GNF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mode de paiement:</span>
                      <span className="font-medium">
                        {PAYMENT_METHOD_OPTIONS.find(p => p.value === formData.paymentMethod)?.label || formData.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Statut de l'employé
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('status', 'active')}
                    disabled={loading}
                    className={`flex-1 py-3 px-4 border rounded-xl transition-all duration-200 disabled:opacity-50 ${
                      formData.status === 'active'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    ✅ Actif
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('status', 'inactive')}
                    disabled={loading}
                    className={`flex-1 py-3 px-4 border rounded-xl transition-all duration-200 disabled:opacity-50 ${
                      formData.status === 'inactive'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    ❌ Inactif
                  </button>
                </div>
              </div>
            </div>
            
            <InputField
              label="Notes supplémentaires"
              name="notes"
              placeholder="Informations complémentaires, observations..."
              rows={3}
              icon={<FileText className="w-4 h-4" />}
              value={formData.notes}
              onChange={(value) => handleFieldChange('notes', value)}
              disabled={loading}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // ===== RENDU PRINCIPAL =====
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Container principal */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          {/* En-tête avec étapes - Design amélioré avec dégradé */}
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white p-6 relative overflow-hidden">
            {/* Pattern de fond décoratif */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleCancel}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                  title="Retour"
                >
                  <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">
                      {mode === 'edit' ? 'Modifier le Personnel' : 'Nouveau Personnel'}
                    </h1>
                    <p className="text-white/90 text-sm">
                      {mode === 'edit' ? 'Mettre à jour les informations' : 'Ajouter un nouvel employé à votre équipe'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-xl transition-all duration-200 border border-white/30 font-medium"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Annuler</span>
                </button>
                
                <div className="text-right">
                  <div className="text-2xl font-bold">Étape {currentStep}/5</div>
                  <div className="text-sm text-white/80">
                    {getSteps().find(s => s.id === currentStep)?.title}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Barre de progression horizontale - Design amélioré */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              {getSteps().map((step, index) => (
                <div key={step.id} className="flex flex-col items-center relative cursor-pointer flex-1 group"
                     onClick={() => goToStep(step.id)}>
                  
                  {/* Ligne de connexion avec dégradé */}
                  {index < getSteps().length - 1 && (
                    <div className={`absolute top-6 left-1/2 w-full h-1 rounded-full transition-all duration-500 ${
                      step.status === 'completed' 
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm' 
                        : 'bg-gray-200'
                    }`} style={{ transform: 'translateX(25%)' }} />
                  )}
                  
                  {/* Cercle d'étape avec effet glassmorphism */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold relative z-10 transition-all duration-300 group-hover:scale-110 shadow-lg ${
                    step.status === 'completed' 
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200' 
                      : step.status === 'current' 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-300 ring-4 ring-emerald-200/50' 
                      : 'bg-gradient-to-br from-gray-300 to-gray-400 group-hover:from-gray-400 group-hover:to-gray-500'
                  }`}>
                    {step.status === 'completed' ? (
                      <Check className="w-6 h-6 drop-shadow-sm" />
                    ) : (
                      <span className="drop-shadow-sm">{step.id}</span>
                    )}
                  </div>
                  
                  {/* Informations de l'étape */}
                  <div className="mt-3 text-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-2 transition-all duration-300 ${
                      step.status === 'current' 
                        ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 shadow-sm border border-emerald-200/50' 
                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                    }`}>
                      {React.cloneElement(step.icon as React.ReactElement, {
                        className: "w-5 h-5"
                      })}
                    </div>
                    <div className={`text-sm font-semibold transition-all duration-300 ${
                      step.status === 'current' 
                        ? 'text-gray-900' 
                        : 'text-gray-500 group-hover:text-gray-700'
                    }`}>
                      {step.title}
                    </div>
                    <div className={`text-xs transition-all duration-300 ${
                      step.status === 'current' 
                        ? 'text-emerald-600 font-medium' 
                        : 'text-gray-400'
                    }`}>
                      {step.subtitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contenu de l'étape avec fond amélioré */}
          <div className="p-8 min-h-[600px] bg-gradient-to-br from-white to-gray-50/30">
            {renderStepContent()}
          </div>

          {/* Boutons de navigation avec design amélioré */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200/50">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-white hover:border-gray-400 transition-all duration-200 disabled:opacity-50 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Précédent
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={loading}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-emerald-200 transform hover:scale-105"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-emerald-200 transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {mode === 'edit' ? 'Mettre à jour' : 'Enregistrer le personnel'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffEnrollmentWizard;