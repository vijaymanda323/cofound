import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// Onboarding Context
const OnboardingContext = createContext();

// Initial state
const initialState = {
  goal: '',
  role: '',
  equityRange: '',
  skills: [],
  industries: [],
  experience: '',
  bio: '',
  education: '',
  linkedinProfile: '',
  isStep1Complete: false,
  isStep2Complete: false,
  isLoading: false,
  error: null,
};

// Reducer
const onboardingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_GOAL':
      return {
        ...state,
        goal: action.payload,
        isStep1Complete: !!action.payload,
      };
    case 'SET_ROLE':
      return {
        ...state,
        role: action.payload.role,
        equityRange: action.payload.equityRange,
      };
    case 'SET_SKILLS':
      return { ...state, skills: action.payload };
    case 'SET_INDUSTRIES':
      return { ...state, industries: action.payload };
    case 'SET_EXPERIENCE':
      return { ...state, experience: action.payload };
    case 'SET_BIO':
      return { ...state, bio: action.payload };
    case 'SET_EDUCATION':
      return { ...state, education: action.payload };
    case 'SET_LINKEDIN_PROFILE':
      return { ...state, linkedinProfile: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET':
      return initialState;
    case 'VALIDATE_STEP2':
      return {
        ...state,
        isStep2Complete: !!(
          state.role &&
          state.skills.length > 0 &&
          state.industries.length > 0
        ),
      };
    default:
      return state;
  }
};

// Provider
export const OnboardingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  // Load saved onboarding data
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        const savedData = await SecureStore.getItemAsync('onboardingData');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          Object.keys(parsed).forEach(key => {
            if (key !== 'isLoading' && key !== 'error') {
              dispatch({ type: `SET_${key.toUpperCase()}`, payload: parsed[key] });
            }
          });
        }
      } catch (error) {
        console.error('Error loading onboarding data:', error);
      }
    };
    loadOnboardingData();
  }, []);

  // Save onboarding data
  const saveOnboardingData = async () => {
    try {
      const dataToSave = {
        goal: state.goal,
        role: state.role,
        equityRange: state.equityRange,
        skills: state.skills,
        industries: state.industries,
        experience: state.experience,
        bio: state.bio,
        education: state.education,
        linkedinProfile: state.linkedinProfile,
      };
      await SecureStore.setItemAsync('onboardingData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  // Auto-save when relevant data changes
  useEffect(() => {
    if (state.goal || state.role) {
      saveOnboardingData();
    }
  }, [state.goal, state.role, state.skills, state.industries]);

  const actions = {
    setGoal: (goal) => dispatch({ type: 'SET_GOAL', payload: goal }),
    setRole: (role, equityRange) => dispatch({ type: 'SET_ROLE', payload: { role, equityRange } }),
    setSkills: (skills) => dispatch({ type: 'SET_SKILLS', payload: skills }),
    setIndustries: (industries) => dispatch({ type: 'SET_INDUSTRIES', payload: industries }),
    setExperience: (experience) => dispatch({ type: 'SET_EXPERIENCE', payload: experience }),
    setBio: (bio) => dispatch({ type: 'SET_BIO', payload: bio }),
    setEducation: (education) => dispatch({ type: 'SET_EDUCATION', payload: education }),
    setLinkedInProfile: (linkedinProfile) => dispatch({ type: 'SET_LINKEDIN_PROFILE', payload: linkedinProfile }),
    setLoading: (isLoading) => dispatch({ type: 'SET_LOADING', payload: isLoading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    validateStep2: () => dispatch({ type: 'VALIDATE_STEP2' }),
    reset: () => dispatch({ type: 'RESET' }),
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Hook
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingContext;
