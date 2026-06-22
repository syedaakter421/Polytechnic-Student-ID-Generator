import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

interface ThreeDScrollProps {
  children: React.ReactNode;
  delay?: number;
}

export default function ThreeDScroll({ children, delay = 0 }: ThreeDScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateXMouse, setRotateXMouse] = useState(0);
  const [rotateYMouse, setRotateYMouse] = useState(0);

  // Scroll 3D linking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Dynamic 3D tilt/rotation on scroll (perspectives and scale)
  const scrollRotateX = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [12, 0, 0, -12]);
  const scrollScale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.93, 1, 1, 0.93]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.5, 1, 1, 0.5]);

  // Smoothen the animations to give a fluid premium feel
  const smoothScrollRotateX = useSpring(scrollRotateX, { damping: 25, stiffness: 120 });
  const smoothScrollScale = useSpring(scrollScale, { damping: 25, stiffness: 120 });
  const smoothScrollOpacity = useSpring(scrollOpacity, { damping: 25, stiffness: 120 });

  // Mouse hover 3D interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    // Map mouse position to narrow degree limits
    const degreesX = -(mouseY / height) * 12; // Max 12 degrees
    const degreesY = (mouseX / width) * 12;

    setRotateXMouse(degreesX);
    setRotateYMouse(degreesY);
  };

  const handleMouseLeave = () => {
    setRotateXMouse(0);
    setRotateYMouse(0);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative will-change-transform"
      style={{
        perspective: 1200,
      }}
    >
      <motion.div
        style={{
          rotateX: smoothScrollRotateX,
          scale: smoothScrollScale,
          opacity: smoothScrollOpacity,
        }}
        className="w-full h-full"
      >
        <motion.div
          animate={{
            rotateX: rotateXMouse,
            rotateY: rotateYMouse,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            transformStyle: 'preserve-3d',
          }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
