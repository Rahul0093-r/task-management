// Mock authentication for testing when Firebase is not configured
export const mockCreateUserWithEmailAndPassword = async (email, password) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock user data
  const mockUser = {
    user: {
      uid: 'mock-user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0]
    }
  };
  
  return mockUser;
};

export const mockSignInWithEmailAndPassword = async (email, password) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock user data
  const mockUser = {
    user: {
      uid: 'mock-user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0]
    }
  };
  
  return mockUser;
};

// Check if we should use mock auth (when Firebase is not configured)
export const shouldUseMockAuth = () => {
  // You can toggle this based on your needs
  return false; // Set to false when Firebase is properly configured
};
