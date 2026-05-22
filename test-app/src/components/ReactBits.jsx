import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

// ==========================================
// 1. ShinyText (은은하게 지나가는 펄 광원 텍스트 효과)
// ==========================================
const shine = keyframes`
  0% {
    background-position: 120% 0;
  }
  100% {
    background-position: -20% 0;
  }
`;

const StyledShinySpan = styled.span`
  color: ${({ $disabled }) => $disabled ? 'inherit' : 'transparent'};
  background: ${({ $disabled, $shineColor, $baseColor }) => $disabled 
    ? 'none' 
    : `linear-gradient(120deg, ${$baseColor || 'var(--sba-text-secondary, rgba(128, 128, 128, 0.6))'} 30%, ${$shineColor || 'var(--sba-text, #ffffff)'} 50%, ${$baseColor || 'var(--sba-text-secondary, rgba(128, 128, 128, 0.6))'} 70%)`
  };
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ${shine} ${({ $speed }) => $speed || '2.5s'} linear infinite;
  display: inline-block;
  font-weight: inherit;
`;

export function ShinyText({ text, speed = '2.5s', shineColor, baseColor, disabled = false, className, style }) {
  return (
    <StyledShinySpan 
      $speed={speed} 
      $shineColor={shineColor} 
      $baseColor={baseColor}
      $disabled={disabled}
      className={className}
      style={style}
    >
      {text}
    </StyledShinySpan>
  );
}

// ==========================================
// 2. DecryptedText (깜빡이는 해독 텍스트 효과)
// ==========================================
export function DecryptedText({ 
  text, 
  speed = 40, 
  maxIterations = 8, 
  className, 
  style 
}) {
  const [displayText, setDisplayText] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+?';

  useEffect(() => {
    let active = true;
    let iteration = 0;
    const targetText = text || '';
    
    const interval = setInterval(() => {
      if (!active) return;
      
      const scrambled = targetText
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          
          // 순차적 노출: 이터레이션이 특정 횟수를 지날 때마다 앞의 글자들을 고정
          if (index < iteration / maxIterations) {
            return char;
          }
          
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');
      
      setDisplayText(scrambled);
      
      if (iteration >= targetText.length * maxIterations) {
        setDisplayText(targetText);
        clearInterval(interval);
      }
      
      iteration++;
    }, speed);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [text, speed, maxIterations]);

  return <span className={className} style={style}>{displayText}</span>;
}

// ==========================================
// 3. SpotlightCard (마우스/터치 중심 광원 카드 효과)
// ==========================================
const CardWrapper = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: inherit;
  width: 100%;
  height: 100%;
`;

const SpotlightOverlay = styled.div.attrs(props => ({
  style: {
    opacity: props.$opacity,
    background: `radial-gradient(circle 140px at ${props.$x}px ${props.$y}px, var(--sba-spotlight-color, rgba(0, 102, 204, 0.12)), transparent 80%)`
  }
}))`
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 1;
  transition: opacity 0.4s ease;
`;

const CardContent = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
`;

export function SpotlightCard({ children, className, style, ...rest }) {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setCoords({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  return (
    <CardWrapper
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onTouchStart={(e) => {
        setOpacity(1);
        handleTouchMove(e);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setOpacity(0)}
      className={className}
      style={style}
      {...rest}
    >
      <SpotlightOverlay $x={coords.x} $y={coords.y} $opacity={opacity} />
      <CardContent>
        {children}
      </CardContent>
    </CardWrapper>
  );
}
