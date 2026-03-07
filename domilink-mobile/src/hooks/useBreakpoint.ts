import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const getBreakpoint = (width: number): Breakpoint => {
  if (width >= 1024) return 'desktop';
  if (width >= 640) return 'tablet';
  return 'mobile';
};

export const useBreakpoint = () => {
  const [dims, setDims] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDims(window);
    });
    return () => sub?.remove();
  }, []);

  const bp = getBreakpoint(dims.width);
  const isWeb = Platform.OS === 'web';
  const isDesktop = bp === 'desktop';
  const isTablet  = bp === 'tablet';
  const isMobile  = bp === 'mobile';

  return {
    width: dims.width,
    height: dims.height,
    breakpoint: bp,
    isWeb,
    isDesktop,
    isTablet,
    isMobile,
    isLarge: isWeb && (isDesktop || isTablet),
  };
};
