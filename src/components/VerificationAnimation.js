import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VerificationAnimation = ({ status = 'idle', message, className }) => {
  return (
    <div className={`verification-animation ${className || ''}`}>
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <LoadingAnimation key="loading" message={message || 'Verifying...'} />
        )}
        {status === 'success' && (
          <SuccessAnimation key="success" message={message || 'Verification successful!'} />
        )}
      </AnimatePresence>
    </div>
  );
};

const LoadingAnimation = ({ message }) => {
  return (
    <motion.div
      className="loading-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <div className="loading-spinner">
        <motion.div
          className="spinner-ring"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      <motion.p 
        className="loading-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
};

const SuccessAnimation = ({ message }) => {
  return (
    <motion.div
      className="success-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="success-icon"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          opacity: 1
        }}
        transition={{ 
          duration: 0.6,
          times: [0, 0.6, 1]
        }}
      >
        <div className="success-circle" />
        <svg viewBox="0 0 24 24" fill="none" className="checkmark">
          <motion.path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </svg>
      </motion.div>
      <motion.p 
        className="success-text"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
};

export default VerificationAnimation; 