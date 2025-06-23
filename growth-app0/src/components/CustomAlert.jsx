import React from 'react';
import './CustomAlert.css';

const CustomAlert = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="custom-alert-backdrop">
      <div className="custom-alert-modal">
        <div className="custom-alert-message">{message}</div>
        <button className="custom-alert-btn" onClick={onClose}>확인</button>
      </div>
    </div>
  );
};

export default CustomAlert; 