import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface StatBlockProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  delay?: number;
  className?: string;
}

/**
 * Animated statistic display (QW11 groundwork, part of F4)
 */
export const StatBlock: React.FC<StatBlockProps> = ({
  icon: Icon,
  value,
  label,
  delay = 0,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={clsx('text-center', className)}
    >
      <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div className="text-3xl font-serif font-bold text-primary-800 mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </motion.div>
  );
};

export default StatBlock;
