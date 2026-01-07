import React from 'react';
import { View, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/theme/context';
import { Ticket } from '@/store/slices/ticketSlice'; // Import type từ slice đã tạo

// Icons
import IconTicket from "@assets/svg/my-ticket.svg";
import IconSad from "@assets/svg/sad-face.svg";
import IconTrophy from "@assets/svg/trophy.svg";
import LoadingIcon from '@/components/LoadingIcon';
import { Text } from '../Text';
import { ThemedStyle } from '@/theme/types';
import { getDay, parse } from 'date-fns';

interface TicketItemProps {
  ticket: Ticket;
  onPress?: (ticket: Ticket) => void;
}

export const TicketItem = ({ ticket, onPress }: TicketItemProps) => {
  const { themed, theme: { colors, spacing } } = useAppTheme();

  const days = ['CN', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayOfWeek = days[getDay(parse(ticket.date, 'dd-MM-yyyy', new Date()))];

  const isWin = ticket.winStatus === 'WIN';
  const isPending = ticket.winStatus === 'PENDING';
  const isLost = ticket.winStatus === 'LOSE';

  const regionLabel = {
    north: 'Miền Bắc',
    central: 'Miền Trung',
    south: 'Miền Nam'
  }[ticket.region];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(ticket)}
      style={themed([$cardBase, isWin ? $cardWin : $cardNormal])}
    >
      {/* 1. Card Header - Giữ nguyên logic cũ */}
      <View style={themed([$cardHeader, isWin && { borderBottomColor: 'rgba(0,0,0,0.05)' }])}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={[themed($iconBox), { backgroundColor: isWin ? 'rgba(255,255,255,0.4)' : (isPending ? '#EFF6FF' : '#F3F4F6') }]}>
            {isWin ? <IconTrophy width={20} height={20} color="#B45309" /> :
              <IconTicket width={20} height={20} color={isPending ? '#3B82F6' : '#9CA3AF'} />}
          </View>
          <View style={{ marginLeft: spacing.sm }}>
            <Text text={regionLabel} size="xxs" weight="medium" style={{ color: isWin ? '#B45309' : colors.textDim }} />
            <Text text={ticket.station} weight="bold" size="md" style={{ color: isLost ? '#a66532ff' : colors.palette.primary400 }} />
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <View style={isWin ? themed($dateBadgeWin) : themed($tagDate)}>
            <Text text={`${dayOfWeek}, ${ticket.date}`} size="xs" weight="bold" style={{ color: isWin ? '#78350F' : colors.text }} />
          </View>

          <View style={{ marginTop: 4 }}>
            {isWin && <Text text={`🏆 ${ticket.winDetails.join(', ')}`} weight="bold" size="sm" style={{ color: '#DC2626' }} />}
            {isPending && (
              <View style={themed($badgeStatusSmall)}>
                <LoadingIcon />
                <Text text=" ĐANG CHỜ" weight="bold" size="xs" style={{ color: '#2563EB' }} />
              </View>
            )}
            {isLost && (
              <View style={themed($badgeStatusSmall)}>
                <IconSad width={22} height={22} color={colors.textDim} />
                <Text text=" KHÔNG TRÚNG" weight="bold" size="xs" style={{ color: colors.textDim }} />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 2. Body - Cập nhật màu sắc và gạch ngang nét đứt */}
      <View style={themed($cardBody)}>
        <Text text="MÃ DỰ THƯỞNG" size="xxs" weight="medium" style={{ color: isWin ? '#B45309' : colors.palette.neutral500, letterSpacing: 1 }} />

        <View style={{ position: 'relative', marginTop: spacing.xs }}>
          <Text
            text={ticket.code}
            size="xxl"
            weight="bold"
            style={[
              { letterSpacing: 2 },
              isWin ? { color: colors.tint } : { color: colors.tint },
              isLost && { opacity: 0.8 }
            ]}
          />

          {/* Thanh gạch ngang nét đứt cho vé LOSE */}
          {isLost && (
            <View
              style={{
                position: 'absolute',
                top: '55%', // Căn giữa dòng chữ
                left: -4,
                right: -4,
                borderBottomWidth: 2,
                borderColor: colors.palette.neutral400,
                borderStyle: 'dashed',
                opacity: 0.6
              }}
            />
          )}
        </View>

        {isLost && <Text text="X" style={themed($watermarkLost)} />}
      </View>

      {/* 3. Footer - Canh chỉnh Message dài */}
      <View style={themed($cardFooter)}>
        <View style={themed($messageContainer)}>
          <Text
            text={ticket.message}
            size="xxs"
            numberOfLines={2} // Cho phép hiển thị tối đa 2 dòng nếu quá dài
            style={{
              color: isWin ? '#B45309' : colors.palette.neutral500,
              fontStyle: 'italic',
              lineHeight: 18,
              textAlign: 'center'
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Cập nhật Styles
const $messageContainer: ViewStyle = {
  width: '100%',
  paddingHorizontal: 8,
  marginTop: 4,
  borderTopWidth: 1,
  borderTopColor: 'rgba(0,0,0,0.03)',
  paddingTop: 8,
};

const $cardFooter: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center'
};
// Styles kế thừa từ thiết kế của bạn nhưng tinh chỉnh lại
const $cardBase: ViewStyle = { borderRadius: 16, paddingHorizontal: 16, marginBottom: 12, elevation: 3, shadowOpacity: 0.1, paddingVertical: 12 };
const $cardNormal: ViewStyle = { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F3F4F6' };
const $cardWin: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: '#f9e050ff', borderWidth: 1, borderColor: '#F59E0B'

});
const $cardHeader: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 10,
  borderStyle: 'dashed',
  borderColor: colors.palette.neutral300,
});
const $iconBox: ViewStyle = { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' };
const $tagDate: ViewStyle = { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 };
const $dateBadgeWin: ViewStyle = { backgroundColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 };
const $cardBody: ViewStyle = { alignItems: 'center', paddingVertical: 12, position: 'relative', overflow: 'hidden' };
const $badgeStatusSmall: ViewStyle = { flexDirection: 'row', alignItems: 'center' };
const $watermarkLost: TextStyle = { position: 'absolute', fontSize: 80, fontWeight: '900', color: '#000', opacity: 0.05, right: -10, top: -10 };