import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  registerUser,
  verifyUserEmail,
  loginUser,
  loginWithGoogleApi,
  getCurrentUser,
  uploadProfilePhotoApi,
  updateAvatarApi,
  addSavedPlan,
  removeSavedPlan
} from '../services/api';

const AuthContext = createContext();

const TOKEN_KEY = 'sanchay_auth_token';
const USER_KEY = 'sanchay_auth_user';
const GUEST_USAGE_KEY = 'sanchay_guest_fms_count';
const MAX_FREE_GUEST_USES = 2;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [savedPlanIds, setSavedPlanIds] = useState(() => new Set(user?.saved_plans || []));
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register' | 'verify' | 'limit_reached'
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');
  const [pendingVerifyCodePreview, setPendingVerifyCodePreview] = useState('');

  // 2-Use Guest Limit Tracker
  const [guestUsageCount, setGuestUsageCount] = useState(() => {
    const saved = localStorage.getItem(GUEST_USAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sync saved plan IDs whenever user object updates
  useEffect(() => {
    if (user?.saved_plans) {
      setSavedPlanIds(new Set(user.saved_plans));
    } else {
      setSavedPlanIds(new Set());
    }
  }, [user]);

  // Refresh user profile on mount if token exists
  useEffect(() => {
    if (token) {
      setIsLoadingUser(true);
      getCurrentUser(token)
        .then(userData => {
          if (userData && !userData.unauthorized) {
            setUser(userData);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
          } else if (userData?.unauthorized) {
            // ONLY log out if backend explicitly rejected token (401)
            logout();
          }
          // If null (network error / backend not running), keep cached profile from localStorage
        })
        .catch(() => {
          // Keep cached profile on network error
        })
        .finally(() => setIsLoadingUser(false));
    }
  }, [token]);

  const openAuthModal = useCallback((mode = 'login', email = '', codePreview = '') => {
    setAuthModalMode(mode);
    if (email) setPendingVerifyEmail(email);
    if (codePreview) setPendingVerifyCodePreview(codePreview);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const saveAuthSession = (authToken, userProfile) => {
    setToken(authToken);
    setUser(userProfile);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userProfile));
    if (userProfile?.saved_plans) {
      setSavedPlanIds(new Set(userProfile.saved_plans));
    }
  };

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res.status === 'unverified') {
      openAuthModal('verify', res.email, res.verification_code_preview);
      return { unverified: true, email: res.email };
    }
    if (res.token && res.user) {
      saveAuthSession(res.token, res.user);
      closeAuthModal();
    }
    return res;
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    if (res.status === 'pending_verification') {
      openAuthModal('verify', res.email, res.verification_code_preview);
    }
    return res;
  };

  const verifyEmail = async (email, code) => {
    const res = await verifyUserEmail({ email, code });
    if (res.token && res.user) {
      saveAuthSession(res.token, res.user);
      closeAuthModal();
    }
    return res;
  };

  const loginWithGoogle = async (googleData = {}) => {
    const defaultData = {
      email: googleData.email || 'citizen.sanchay@gmail.com',
      name: googleData.name || 'Verified Citizen',
      age: googleData.age || 28,
      gender: googleData.gender || 'female',
      profession: googleData.profession || 'Self-Employed',
      mobile: googleData.mobile || '9876543210'
    };
    const res = await loginWithGoogleApi(defaultData);
    if (res.token && res.user) {
      saveAuthSession(res.token, res.user);
      closeAuthModal();
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSavedPlanIds(new Set());
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const uploadProfilePhoto = async (photoData) => {
    if (!token) throw new Error('Authentication required.');
    const res = await uploadProfilePhotoApi(token, photoData);
    if (res.user) {
      setUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return res;
  };

  const changeAvatar = async (avatarId) => {
    if (!token) throw new Error('Authentication required.');
    const res = await updateAvatarApi(token, avatarId);
    if (res.user) {
      setUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return res;
  };

  // Saved Plans Management
  const addToMyPlans = async (schemeId) => {
    if (!schemeId) return false;
    if (!token && !user) {
      openAuthModal('login');
      return false;
    }

    const idStr = String(schemeId);
    // Optimistically update local state & storage
    const currentList = Array.from(savedPlanIds || user?.saved_plans || []);
    const updatedPlans = currentList.includes(idStr) ? currentList : [...currentList, idStr];
    setSavedPlanIds(new Set(updatedPlans));
    setUser(prev => {
      const updatedUser = prev ? { ...prev, saved_plans: updatedPlans } : { saved_plans: updatedPlans };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });

    if (token) {
      try {
        const res = await addSavedPlan(schemeId, token);
        if (res?.saved_plans) {
          setSavedPlanIds(new Set(res.saved_plans));
          setUser(prev => {
            const updatedUser = prev ? { ...prev, saved_plans: res.saved_plans } : prev;
            if (updatedUser) localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            return updatedUser;
          });
        }
      } catch (err) {
        console.warn('Backend addSavedPlan offline, persisted locally:', err);
      }
    }
    return true;
  };

  const removeFromMyPlans = async (schemeId) => {
    if (!schemeId) return false;
    const idStr = String(schemeId).toLowerCase();
    const currentList = Array.from(savedPlanIds || user?.saved_plans || []);
    const updatedPlans = currentList.filter(id => {
      const curLower = String(id).toLowerCase();
      if (curLower === idStr) return false;
      const m1 = curLower.match(/\d+/);
      const m2 = idStr.match(/\d+/);
      if (m1 && m2 && m1[0] === m2[0] && (curLower.includes('lic') || idStr.includes('lic'))) return false;
      return true;
    });

    setSavedPlanIds(new Set(updatedPlans));
    setUser(prev => {
      const updatedUser = prev ? { ...prev, saved_plans: updatedPlans } : { saved_plans: updatedPlans };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });

    if (token) {
      try {
        const res = await removeSavedPlan(schemeId, token);
        if (res?.saved_plans) {
          setSavedPlanIds(new Set(res.saved_plans));
          setUser(prev => {
            const updatedUser = prev ? { ...prev, saved_plans: res.saved_plans } : prev;
            if (updatedUser) localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            return updatedUser;
          });
        }
      } catch (err) {
        console.warn('Backend removeSavedPlan offline, removed locally:', err);
      }
    }
    return true;
  };

  const isPlanSaved = (schemeId) => {
    if (!schemeId) return false;
    if (savedPlanIds.has(schemeId)) return true;
    const sLower = String(schemeId).toLowerCase();
    for (const id of savedPlanIds) {
      const idLower = String(id).toLowerCase();
      if (idLower === sLower) return true;
      const numMatch = idLower.match(/\d+/);
      const targetMatch = sLower.match(/\d+/);
      if (numMatch && targetMatch && numMatch[0] === targetMatch[0]) {
        if (idLower.includes('lic') || sLower.includes('lic')) return true;
      }
    }
    return false;
  };

  // Find My Schemes 2-use guest limit logic
  const canUseFindMySchemes = () => {
    if (token && user) return true; // Logged-in users have unlimited usage
    return guestUsageCount < MAX_FREE_GUEST_USES;
  };

  const recordFindMySchemesUsage = () => {
    if (token && user) return; // No limit for logged-in users
    const nextCount = guestUsageCount + 1;
    setGuestUsageCount(nextCount);
    localStorage.setItem(GUEST_USAGE_KEY, nextCount.toString());
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isLoadingUser,
        savedPlanIds,
        isAuthModalOpen,
        authModalMode,
        pendingVerifyEmail,
        pendingVerifyCodePreview,
        guestUsageCount,
        maxFreeGuestUses: MAX_FREE_GUEST_USES,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        verifyEmail,
        loginWithGoogle,
        logout,
        uploadProfilePhoto,
        changeAvatar,
        addToMyPlans,
        removeFromMyPlans,
        isPlanSaved,
        canUseFindMySchemes,
        recordFindMySchemesUsage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
