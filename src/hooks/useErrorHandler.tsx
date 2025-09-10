
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Erreur${context ? ` dans ${context}` : ''}:`, error);

    let errorMessage = "Une erreur inattendue s'est produite";
    let title = "Erreur";

    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Gestion spécifique des erreurs Supabase
    if (error?.code) {
      switch (error.code) {
        case 'PGRST301':
          title = "Accès refusé";
          errorMessage = "Vous n'avez pas les permissions nécessaires pour cette action";
          break;
        case 'PGRST116':
          title = "Données non trouvées";
          errorMessage = "Les données demandées n'ont pas été trouvées";
          break;
        case '23505':
          title = "Conflit de données";
          errorMessage = "Ces données existent déjà dans le système";
          break;
        case '23503':
          title = "Référence invalide";
          errorMessage = "Impossible de supprimer - des données sont liées à cet élément";
          break;
        default:
          if (error.message.includes('violates row-level security')) {
            title = "Accès refusé";
            errorMessage = "Vous n'avez pas l'autorisation d'accéder à ces données";
          }
      }
    }

    // Gestion des erreurs réseau
    if (errorMessage.includes('fetch')) {
      title = "Erreur de connexion";
      errorMessage = "Vérifiez votre connexion internet et réessayez";
    }

    // Gestion des erreurs d'authentification
    if (errorMessage.includes('Invalid login credentials') || 
        errorMessage.includes('invalid email or password')) {
      title = "Erreur de connexion";
      errorMessage = "Email ou mot de passe incorrect";
    }

    toast({
      title,
      description: errorMessage,
      variant: "destructive",
    });

    return { title, message: errorMessage };
  }, [toast]);

  const handleSuccess = useCallback((message: string, title: string = "Succès") => {
    toast({
      title,
      description: message,
    });
  }, [toast]);

  return { handleError, handleSuccess };
}
