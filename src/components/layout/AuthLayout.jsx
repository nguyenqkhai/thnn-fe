import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({
  children,
  title,
  subtitle,
  subtitleLinkText,
  subtitleLinkTo,
  imageSrc = "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
}) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600">
                {subtitle}{' '}
                {subtitleLinkText && subtitleLinkTo && (
                  <Link to={subtitleLinkTo} className="font-medium text-indigo-600 hover:text-indigo-500">
                    {subtitleLinkText}
                  </Link>
                )}
              </p>
            )}
          </div>

          <div className="mt-8">
            <div className="mt-6">
              {children}
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={imageSrc}
          alt="Background"
        />
      </div>
    </div>
  );
};

export default AuthLayout;