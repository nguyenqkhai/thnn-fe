import React from 'react';

const InputField = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  required = false,
  placeholder = '',
  autoComplete = 'on',
  className = ''
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                    focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out
                    ${className}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </div>
    </div>
  );
};

export default InputField;