import React, { FC, useMemo } from 'react';
import { motion } from 'framer-motion';

export const NeuralNetwork: FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  const nodes = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2,
      connections: Array.from({ length: 3 }).map(() => Math.floor(Math.random() * 15))
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Connections */}
        {nodes.map(node => 
          node.connections.map(targetId => (
            <motion.line
              key={`${node.id}-${targetId}`}
              x1={node.x}
              y1={node.y}
              x2={nodes[targetId].x}
              y2={nodes[targetId].y}
              stroke="var(--accent)"
              strokeWidth="0.1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: isActive ? [0, 1, 0] : 0.5,
                opacity: isActive ? [0, 0.5, 0] : 0.2
              }}
              transition={{ 
                repeat: Infinity, 
                duration: Math.random() * 3 + 2,
                delay: Math.random() * 2
              }}
            />
          ))
        )}

        {/* Nodes */}
        {nodes.map(node => (
          <motion.circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={node.size / 10}
            fill="var(--accent)"
            animate={{
              r: isActive ? [node.size/10, (node.size/10) * 2, node.size/10] : node.size/10,
              opacity: isActive ? [0.3, 1, 0.3] : 0.4
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: Math.random() * 2
            }}
          />
        ))}
      </svg>
      
      {/* Background radial gradient mask */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-background-base to-background-base" />
    </div>
  );
};
