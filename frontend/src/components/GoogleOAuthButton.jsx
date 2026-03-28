import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const GoogleOAuthButton = () => {
  const { googleAuth } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Decode the JWT to extract user info
      const decoded = jwtDecode(credentialResponse.credential);
      
      const userData = {
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        profilePicture: decoded.picture,
      };

      // Call googleAuth from AuthContext
      await googleAuth(
        userData.googleId,
        userData.email,
        userData.name,
        userData.profilePicture
      );

      // Navigate to dashboard on success
      navigate('/');
    } catch (error) {
      console.error('Google authentication error:', error);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="dark"
        size="large"
        width="320"
      />
    </div>
  );
};
