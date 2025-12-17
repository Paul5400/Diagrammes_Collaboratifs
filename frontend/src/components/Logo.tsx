
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  const dimensions = {
    sm: 20,
    md: 32,
    lg: 40
  };

  const textClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const radiusStyles = {
    sm: { borderRadius: '4px' },
    md: { borderRadius: '8px' },
    lg: { borderRadius: '12px' }
  };

  return (
    <Link 
      href="/" 
      className={`flex items-center gap-2 font-semibold tracking-tight hover:opacity-80 transition-opacity ${className}`}
    >
      <Image 
        src="/logo.png" 
        alt="Logo" 
        width={dimensions[size]} 
        height={dimensions[size]} 
        style={radiusStyles[size]}
      />
      {showText && <span className={textClasses[size]}>Diagrammer</span>}
    </Link>
  );
}
