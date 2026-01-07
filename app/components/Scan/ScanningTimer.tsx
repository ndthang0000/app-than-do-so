import React, { useState, useEffect, memo } from 'react';
import { View, ViewStyle } from 'react-native';
import { Text } from '../Text';

interface ScanningTimerProps {
  isActive: boolean;
  maxTime: number; // 15
  onTimeout: () => void;
  style: any
}

export const ScanningTimer = memo(({ isActive, maxTime, onTimeout, style }: ScanningTimerProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      setElapsed(0); // Reset khi bắt đầu scan mới
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
      }, 100); // Cập nhật mỗi 100ms
    }

    return () => clearInterval(interval);
  }, [isActive, maxTime, onTimeout]);

  if (!isActive) return null;

  // Tính toán màu sắc dựa trên tiến độ
  const isWarning = elapsed > maxTime * 0.7; // Cảnh báo khi qua 70% thời gian

  return (
    <View style={[$timerContainer, style]}>
      <Text
        // Hiển thị 1 chữ số thập phân (VD: 1.2s, 1.4s)
        text={`${elapsed.toFixed(1)}s / ${maxTime}s`}
        size="xxs"
        weight="bold"
        style={{ color: isWarning ? '#EF4444' : '#10B981' }}
      />
      {/* Thanh progress bar nhỏ chạy phía dưới số giây (optional) */}
      <View style={$progressBarBase}>
        <View style={[$progressBarActive, { width: `${(elapsed / maxTime) * 100}%` }]} />
      </View>
    </View>
  );
});

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