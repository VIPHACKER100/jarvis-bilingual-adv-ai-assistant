import React, { FC } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'rectangle' | 'circle' | 'text';
  className?: string;
}

export const Skeleton: FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  variant = 'rectangle',
  className = ''
}) => {
  const borderRadius = variant === 'circle' ? '50%' : variant === 'text' ? '4px' : '8px';

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius
      }}
    />
  );
};
