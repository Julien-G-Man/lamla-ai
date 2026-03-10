'use client';

import { GoogleLogin } from '@react-oauth/google';

interface GoogleSignInButtonProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
}

const GoogleSignInButton = ({ onSuccess, onError }: GoogleSignInButtonProps) => {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        if (credentialResponse.credential) {
          onSuccess(credentialResponse.credential);
        }
      }}
      onError={onError}
    />
  );
};

export default GoogleSignInButton;
