import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, ViewStyle, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, TextStyle, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme/context';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchTickets, setFilters, setPage, WinStatus } from '@/store/slices/ticketSlice';
import { Text } from "@/components/Text";
import { Header } from '@/components/Header';
import IconBack from "@assets/svg/arrow-left.svg";
import IconSort from "@assets/svg/sort.svg";
import IconCheck from "@assets/svg/check.svg";
import { ThemedStyle } from '@/theme/types';
import { TicketItem } from '@/components/Ticket/TicketItem';
import { Region } from '@/constants/lotteryTicket';
import { HomeTabScreenProps } from '@/navigators/navigationTypes';
import IconSad from "@assets/svg/sad-face.svg";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

// Mapping label sang value API
const STATUS_MAP: Record<string, WinStatus | undefined> = {
  'Tất cả': undefined,
  'Trúng thưởng': 'WIN',
  'Chưa quay': 'PENDING',
  'Không trúng': 'LOSE',
};

const REGION_MAP: Record<string, Region | undefined> = {
  'Tất cả': undefined,
  'Miền Trung': 'central',
  'Miền Nam': 'south',
  'Miền Bắc': 'north',
};

export const MyTicketScreen: React.FC<HomeTabScreenProps<'MyTicket'>> = function MyTicketScreen(_props) {
  const navigation = _props.navigation;
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const dispatch = useAppDispatch();

  // Lấy dữ liệu từ Store
  const { tickets, loading, pagination, filters } = useAppSelector(state => state.ticket);

  // 1. Ref để điều khiển Bottom Sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  // 2. Điểm dừng (Snap points): Sheet sẽ cao 30% màn hình
  const snapPoints = useMemo(() => ['30%'], []);

  // 3. Hàm đóng/mở
  const openSortSheet = () => bottomSheetRef.current?.expand();
  const closeSortSheet = () => bottomSheetRef.current?.close();

  // 4. Backdrop (Làm mờ nền khi hiện Sheet)
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ), []
  );

  const SORT_OPTIONS = [
    { label: 'Mới nhất', value: 'createdAt:desc' },
    { label: 'Cũ nhất', value: 'createdAt:asc' },
    { label: 'Trúng to nhất', value: 'weight:desc' },
  ];

  // Fetch dữ liệu mỗi khi filter hoặc page thay đổi
  useEffect(() => {
    dispatch(fetchTickets({
      page: pagination.page,
      limit: 10,
      sortBy: filters.sortBy,
      region: filters.region,
      winStatus: filters.winStatus,
    }));
  }, [pagination.page, filters, dispatch]);

  const handleFilterStatus = (label: string) => {
    dispatch(setFilters({ winStatus: STATUS_MAP[label] }));
  };

  const handleLoadMore = () => {
    // Only load more if not already loading and there are more pages
    if (!loading && pagination.page < pagination.totalPages) {
      dispatch(setPage(pagination.page + 1));
    }
  };


  const BackIcon = () => (
    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5} style={{ padding: 8 }}>
      <IconBack width={20} height={20} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <>
      <Header
        title="Lịch sử vé"
        LeftActionComponent={<BackIcon />}
        safeAreaEdges={["top"]}
        backgroundColor={colors.background}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}
      />

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Row 1: Status Filter */}
        <View style={{ height: 40, marginTop: spacing.md }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.xs }}>
            {Object.keys(STATUS_MAP).map(status => {
              const isActive = (STATUS_MAP[status] === filters.winStatus);
              return (
                <TouchableOpacity
                  key={status}
                  style={themed([$statusTab, isActive && $statusTabActive])}
                  onPress={() => handleFilterStatus(status)}
                >
                  <Text text={status} size="xs" style={{ color: isActive ? colors.surface : colors.text }} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Row 2: Sort & Region */}
        <View style={themed($sortRow)}>
          <TouchableOpacity onPress={() => openSortSheet()} style={themed($sortButton)}>
            <IconSort width={14} height={14} color={colors.text} />
            <Text text=" Sắp xếp" size="xs" weight="bold" />
          </TouchableOpacity>
        </View>

        {/* <View style={{ height: 40, marginBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.xs }}>
            {Object.keys(REGION_MAP).map(region => {
              const isActive = (REGION_MAP[region] === filters.region);
              return (
                <TouchableOpacity
                  key={region}
                  style={themed([$regionTab, isActive && $regionTabActive])}
                  onPress={() => handleFilterRegion(region)}
                >
                  <Text text={region} size="xs" style={{ color: isActive ? colors.surface : colors.palette.neutral600 }} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View> */}

        {/* Ticket List với FlatList để tối ưu hiệu năng và Loadmore */}
        <FlatList
          data={tickets}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <TicketItem ticket={item} onPress={(i) => navigation.navigate('TicketDetail', { ticketId: i._id })} />}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <IconSad width={50} height={50} color={colors.palette.neutral300} />
                <Text text="Không tìm thấy vé nào" style={{ color: colors.palette.neutral400, marginTop: 10 }} />
              </View>
            ) : null
          }
          ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} /> : null}
          onRefresh={() => dispatch(setPage(1))}
          refreshing={loading && pagination.page === 1}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // Mặc định là đóng
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.palette.neutral300 }}
      >
        <BottomSheetView style={styles.contentContainer}>
          <Text text="Sắp xếp theo" weight="bold" style={styles.title} />

          {SORT_OPTIONS.map((option) => {
            const isSelected = filters.sortBy === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.item, isSelected && { backgroundColor: colors.palette.neutral100 }]}
                onPress={() => {
                  dispatch(setFilters({ sortBy: option.value }));
                  closeSortSheet();
                }}
              >
                <Text
                  text={option.label}
                  style={[styles.itemText, isSelected && { color: '#DC2626', fontWeight: 'bold' }]}
                />
                {isSelected && <IconCheck width={18} height={18} color="#DC2626" />}
              </TouchableOpacity>
            );
          })}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

// ==========================================================
// STYLES cho MyTicketScreen.tsx
// ==========================================================

const $statusTab: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.md,
  borderRadius: spacing.xxl,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
  alignItems: "center",
  justifyContent: "center",
});

const $statusTabActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: '#DC2626', // Màu đỏ chủ đạo của app
  borderColor: '#DC2626',
});

const $regionTab: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.md,
  borderRadius: spacing.lg,
  backgroundColor: colors.palette.neutral100,
  marginRight: spacing.xs,
  alignItems: "center",
  justifyContent: "center",
});

const $regionTabActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: '#DC2626',
});

const $sortRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'flex-end',
  paddingHorizontal: spacing.md,
  marginVertical: spacing.sm,
});

const $sortButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  backgroundColor: colors.surface,
  borderRadius: spacing.sm,
  // Shadow cho nút sắp xếp
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
});

const $badgeStatusSmall: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.03)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
};

// Style cho TicketItem (Nếu bạn để chung trong file hoặc dùng tham khảo)



const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    color: '#1F2937',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  itemText: {
    fontSize: 16,
    color: '#4B5563',
  },
});