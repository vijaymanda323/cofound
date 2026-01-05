import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// Auth Context
const AuthContext = createContext();

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isLoading: false,
        isAuthenticated: !!action.payload 
      };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        token: null, 
        isLoading: false,
        isAuthenticated: false 
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Initial State
const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Load token and user on app start
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const token = await SecureStore.getItemAsync('authToken');
        
        if (token) {
          setAuthToken(token);
          dispatch({ type: 'SET_TOKEN', payload: token });
          
          // Verify token and get user data
          const response = await axios.get('/auth/me');
          
          if (response.data.user) {
            dispatch({ type: 'SET_USER', payload: response.data.user });
          } else {
            // Token invalid, clear it
            await SecureStore.deleteItemAsync('authToken');
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth loading error:', error);
        await SecureStore.deleteItemAsync('authToken');
        dispatch({ type: 'LOGOUT' });
      }
    };

    loadAuthData();
  }, []);

  // Login function
  const login = async (identifier, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await axios.post('/auth/login', {
        identifier,
        password,
      });

      const { token, user } = response.data;

      // Store token securely
      await SecureStore.setItemAsync('authToken', token);
      
      // Set token in axios headers
      setAuthToken(token);
      
      // Update state
      dispatch({ type: 'SET_TOKEN', payload: token });
      dispatch({ type: 'SET_USER', payload: user });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (email, password, phone) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      console.log('Attempting registration for:', email);
      
      const response = await axios.post('/auth/register', {
        email,
        password,
        ...(phone && phone.trim() ? { phone } : {}),
      });

      console.log('Registration response:', response.data);

      const { token, user } = response.data;

      // Store token securely
      await SecureStore.setItemAsync('authToken', token);
      
      // Set token in axios headers
      setAuthToken(token);
      
      // Update state
      dispatch({ type: 'SET_TOKEN', payload: token });
      dispatch({ type: 'SET_USER', payload: user });

      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Verify OTP function
  const verifyOTP = async (identifier, code, purpose) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await axios.post('/auth/verify-otp', {
        identifier,
        code,
        purpose,
      });

      const { user } = response.data;
      
      // Update user data in state
      dispatch({ type: 'SET_USER', payload: user });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'OTP verification failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Resend OTP function
  const resendOTP = async (identifier, purpose) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });

      await axios.post('/auth/resend-otp', {
        identifier,
        purpose,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Update registration step
  const updateRegistrationStep = async (step) => {
    try {
      await axios.put('/auth/registration-step', { step });
      
      // Update local user state
      if (state.user) {
        dispatch({ 
          type: 'SET_USER', 
          payload: { ...state.user, registrationStep: step } 
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update registration step';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Remove token from secure storage
      await SecureStore.deleteItemAsync('authToken');
      
      // Clear axios headers
      setAuthToken(null);
      
      // Clear state
      dispatch({ type: 'LOGOUT' });

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      dispatch({ type: 'LOGOUT' });
      return { success: true };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    verifyOTP,
    resendOTP,
    updateRegistrationStep,
    logout,
    clearError,
    setAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
