import React, { useState, useEffect } from 'react';
import { useAvatarRefresh } from '../hooks/useAuth';

interface SmartAvatarProps {
  src?: string;
  alt?: string;
  className?: string;
  size?: number;
  fallback?: string;
  onClick?: () => void;
}

export const SmartAvatar: React.FC<SmartAvatarProps> = ({
  src,
  alt = 'Avatar',
  className = '',
  size = 40,
  fallback = '👤',
  onClick
}) => {
  const { avatarUrl, forceRefresh } = useAvatarRefresh();
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Utiliser l'URL avec cache-busting du hook ou celle passée en prop
  const finalSrc = avatarUrl || src;

  useEffect(() => {
    if (finalSrc) {
      setImageError(false);
      setLoading(true);
      
      // Précharger l'image pour éviter les flickers
      const img = new Image();
      img.onload = () => {
        setLoading(false);
        setImageError(false);
      };
      img.onerror = () => {
        setLoading(false);
        setImageError(true);
      };
      img.src = finalSrc;
    }
  }, [finalSrc]);

  const handleError = () => {
    setImageError(true);
    setLoading(false);
    
    // Essayer de forcer un refresh après une erreur
    setTimeout(() => {
      forceRefresh();
    }, 2000);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Par défaut, forcer un refresh de l'avatar
      forceRefresh();
    }
  };

  if (imageError || !finalSrc) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 rounded-full ${className}`}
        style={{ width: size, height: size }}
        onClick={handleClick}
        title="Cliquer pour rafraîchir"
      >
        <span className="text-gray-500 text-sm">{fallback}</span>
      </div>
    );
  }

  return (
    <div className="relative" onClick={handleClick}>
      {loading && (
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full ${className}`}
          style={{ width: size, height: size }}
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      <img
        src={finalSrc}
        alt={alt}
        className={`rounded-full object-cover cursor-pointer ${className} ${loading ? 'opacity-0' : 'opacity-100'}`}
        style={{ width: size, height: size }}
        onError={handleError}
        onLoad={() => setLoading(false)}
        title="Cliquer pour rafraîchir"
        // Attributs pour forcer le refresh
        key={finalSrc} // Force un re-render quand l'URL change
      />
    </div>
  );
};

// 4. ✅ UTILISATION DANS VOS COMPOSANTS
// Remplacez vos <img> d'avatar par :

// Avant :
// <img src={profile?.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full" />

// Après :
// <SmartAvatar 
//   src={profile?.avatar_url} 
//   size={32} 
//   className="border-2 border-white"
//   fallback="👤"
// />

// 5. ✅ CSS ANTI-CACHE (Optionnel)
// Ajoutez à votre CSS global :

/* Anti-cache pour les avatars */
.avatar-no-cache {
  /* Empêcher le cache */
  cache-control: no-cache;
  pragma: no-cache;
  expires: 0;
}

/* Animation pour les changements d'avatar */
.avatar-transition {
  transition: opacity 0.3s ease-in-out;
}

.avatar-loading {
  opacity: 0.5;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}