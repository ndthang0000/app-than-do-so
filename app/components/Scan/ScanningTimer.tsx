import React, { useState, useEffect, memo, forwardRef, useImperativeHandle } from 'react';
import { View, ViewStyle } from 'react-native';
import { Text } from '../Text';

interface ScanningTimerProps {
  isActive: boolean;
  maxTime: number;
  onTimeout: () => void;
  style?: any;
}

// Định nghĩa interface cho Ref
export interface ScanningTimerRef {
  getElapsed: () => number;
}

export const ScanningTimer = memo(forwardRef<ScanningTimerRef, ScanningTimerProps>((props, ref) => {
  const { isActive, maxTime, onTimeout, style } = props;
  const [elapsed, setElapsed] = useState(0);

  // Expose giá trị elapsed ra cho component cha
  useImperativeHandle(ref, () => ({
    getElapsed: () => elapsed,
  }));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      setElapsed(0);
      interval = setInterval(() => {
        setElapsed((prev) => {
          const nextValue = prev + 0.1;
          if (nextValue >= maxTime) {
            clearInterval(interval);
            onTimeout();
            return maxTime;
          }
          return nextValue;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isActive, maxTime, onTimeout]);

  if (!isActive) return null;

  const isWarning = elapsed > maxTime * 0.7;

  return (
    <View style={[$timerContainer, style]}>
      <Text
        text={`${elapsed.toFixed(1)}s / ${maxTime}s`}
        size="xxs"
        weight="bold"
        style={{ color: isWarning ? '#EF4444' : '#10B981' }}
      />
      <View style={$progressBarBase}>
        <View style={[$progressBarActive, { width: `${(elapsed / maxTime) * 100}%` }]} />
      </View>
    </View>
  );
}));

const $timerContainer: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 8,
  backgroundColor: 'rgba(0,0,0,0.6)',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
};

const $progressBarBase: ViewStyle = {
  width: 60,
  height: 2,
  backgroundColor: 'rgba(255,255,255,0.2)',
  marginTop: 4,
  borderRadius: 2,
  overflow: 'hidden',
};

const $progressBarActive: ViewStyle = {
  height: '100%',
  backgroundColor: '#10B981',
};