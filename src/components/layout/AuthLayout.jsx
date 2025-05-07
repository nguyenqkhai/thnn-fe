import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({
  children,
  title,
  subtitle,
  subtitleLinkText,
  subtitleLinkTo
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">
              {subtitle}{' '}
              {subtitleLinkText && subtitleLinkTo && (
                <Link to={subtitleLinkTo} className="font-medium text-blue-600 hover:text-blue-500">
                  {subtitleLinkText}
                </Link>
              )}
            </p>
          )}
        </div>

        <div className="mt-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;