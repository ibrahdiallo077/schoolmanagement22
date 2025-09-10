// src/hooks/usePhotoUpload.ts
import { useState, useCallback, useRef } from 'react';

interface PhotoUploadState {
  photo?: File;
  preview?: string;
  loading: boolean;
  error: string | null;
  dragActive: boolean;
}

interface PhotoUploadOptions {
  maxSize?: number;
  acceptedTypes?: string[];
  onUpload?: (file: File, preview: string) => void;
  onError?: (error: string) => void;
  onRemove?: () => void;
}

// Configuration par défaut
const DEFAULT_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  errorMessages: {
    photoTooLarge: 'La photo ne doit pas dépasser 5MB',
    photoInvalidType: 'Format de photo invalide. Utilisez JPG, PNG ou WebP'
  }
};

export const usePhotoUpload = (options: PhotoUploadOptions = {}) => {
  const {
    maxSize = DEFAULT_CONFIG.maxSize,
    acceptedTypes = DEFAULT_CONFIG.acceptedTypes,
    onUpload,
    onError,
    onRemove
  } = options;

  const [state, setState] = useState<PhotoUploadState>({
    loading: false,
    error: null,
    dragActive: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Valider un fichier
  const validateFile = useCallback((file: File): string | null => {
    // Vérifier le type
    if (!acceptedTypes.includes(file.type)) {
      return DEFAULT_CONFIG.errorMessages.photoInvalidType;
    }

    // Vérifier la taille
    if (file.size > maxSize) {
      return DEFAULT_CONFIG.errorMessages.photoTooLarge;
    }

    return null;
  }, [maxSize, acceptedTypes]);

  // Traiter l'upload d'un fichier
  const processFile = useCallback((file: File) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    // Valider le fichier
    const validationError = validateFile(file);
    if (validationError) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: validationError
      }));
      onError?.(validationError);
      return;
    }

    // Créer un FileReader pour générer l'aperçu
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      
      setState(prev => ({
        ...prev,
        photo: file,
        preview,
        loading: false,
        error: null
      }));

      onUpload?.(file, preview);
    };

    reader.onerror = () => {
      const error = 'Erreur lors de la lecture du fichier';
      setState(prev => ({
        ...prev,
        loading: false,
        error
      }));
      onError?.(error);
    };

    reader.readAsDataURL(file);
  }, [validateFile, onUpload, onError]);

  // Upload via input file
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input pour permettre de sélectionner le même fichier
    if (e.target) {
      e.target.value = '';
    }
  }, [processFile]);

  // Ouvrir le sélecteur de fichier
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, dragActive: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Ne désactiver que si on sort vraiment de la zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setState(prev => ({ ...prev, dragActive: false }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setState(prev => ({ ...prev, dragActive: false }));

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Supprimer la photo
  const removePhoto = useCallback(() => {
    setState(prev => ({
      ...prev,
      photo: undefined,
      preview: undefined,
      error: null
    }));
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onRemove?.();
  }, [onRemove]);

  // Définir une photo depuis l'extérieur (par exemple depuis un URL)
  const setPhoto = useCallback((file: File, preview: string) => {
    setState(prev => ({
      ...prev,
      photo: file,
      preview,
      error: null
    }));
  }, []);

  // Définir une erreur
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Vérifier si une photo est sélectionnée
  const hasPhoto = Boolean(state.photo && state.preview);

  // Obtenir l'aperçu de la photo
  const getPreview = useCallback(() => {
    return state.preview;
  }, [state.preview]);

  // Obtenir les informations du fichier
  const getFileInfo = useCallback(() => {
    if (!state.photo) return null;

    return {
      name: state.photo.name,
      size: state.photo.size,
      type: state.photo.type,
      lastModified: state.photo.lastModified,
      formattedSize: formatFileSize(state.photo.size)
    };
  }, [state.photo]);

  return {
    // État
    photo: state.photo,
    preview: state.preview,
    loading: state.loading,
    error: state.error,
    dragActive: state.dragActive,
    hasPhoto,

    // Méthodes
    handleFileSelect,
    openFileSelector,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    removePhoto,
    setPhoto,
    setError,
    getPreview,
    getFileInfo,
    processFile,

    // Ref pour l'input
    fileInputRef
  };
};

// Utilitaire pour formater la taille des fichiers
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Hook simplifié pour une utilisation basique
export const useSimplePhotoUpload = () => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const uploadPhoto = useCallback((file: File, previewUrl: string) => {
    setPhoto(file);
    setPreview(previewUrl);
  }, []);

  const removePhoto = useCallback(() => {
    setPhoto(null);
    setPreview(null);
  }, []);

  const photoUpload = usePhotoUpload({
    onUpload: uploadPhoto,
    onRemove: removePhoto
  });

  return {
    ...photoUpload,
    photo,
    preview
  };
};

export default usePhotoUpload;