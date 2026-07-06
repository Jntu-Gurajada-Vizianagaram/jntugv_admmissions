import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import './ProgressBar.css';

export default function ProgressBar({ currentStep, totalSteps }) {
  const steps = [
    'Programme',
    'Personal Info',
    'Qualifications',
    'Documents',
    'Payment',
    'Review'
  ];

  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="progress-container">
      <div className="progress-bar-bg">
        <motion.div 
          className="progress-bar-fill" 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      
      <div className="progress-steps">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div 
              key={stepNum} 
              className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <motion.div 
                className="step-circle"
                initial={false}
                animate={{
                  backgroundColor: isActive || isCompleted ? 'var(--accent-blue)' : '#e2e8f0',
                  color: isActive || isCompleted ? '#ffffff' : '#64748b',
                  scale: isActive ? 1.1 : 1
                }}
              >
                {isCompleted ? <Check size={16} /> : stepNum}
              </motion.div>
              <span className="step-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
