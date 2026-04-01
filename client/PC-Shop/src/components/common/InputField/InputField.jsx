import React from 'react';

const InputField = ({ label, id, name, type = 'text', placeholder, value, onChange, icon, required }) => {
  return (
    <div className="input-group">
      <label htmlFor={id}>{label}</label>
      <div className="input-icon-wrapper">
        <input
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="glow-input"
        />
        {icon && React.cloneElement(icon, { className: "input-icon" })}
      </div>
    </div>
  );
};

export default InputField;
