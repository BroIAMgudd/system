import React from 'react';
// import './Notification.css';

const Notification = ({ title, text, color, onClose }) => {
  return (
    <div className={`${color} notif`}>
      <div className="notif-header">
        <div className='notif-title'>{title}</div>
        <i className="notif-close fa-solid fa-xmark fa-lg" onClick={onClose}></i>
      </div>
      <div className="notif-text">{text}</div>
    </div>
  );
};

export default Notification;
