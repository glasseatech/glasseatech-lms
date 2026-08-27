import React from 'react';
import { motion } from 'motion/react';

export default function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={`bg-neutral-light/5 rounded-2xl ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
    />
  );
}
