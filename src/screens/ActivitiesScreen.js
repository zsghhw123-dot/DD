import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeishuApi } from '../hooks/useFeishuApi';
import RecordItem from '../components/RecordItem/RecordItem';
import { colors, theme, typographyUtils, colorUtils } from '../theme';

const ActivitiesScreen = ({ navigation }) => {
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);
  const { dataCache, getMonthKey, refreshMonthDataForDate, isLoading, preloadRange } = useFeishuApi(year, month);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rangeStart, setRangeStart] = useState({ y: year, m: month });
  const [rangeEnd, setRangeEnd] = useState({ y: year, m: month });
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('start');
  const [pickerYear, setPickerYear] = useState(year);
  const [pickerMonth, setPickerMonth] = useState(month);
  const [searchFocused, setSearchFocused] = useState(false);
  const monthKey = getMonthKey(year, month);
  const monthData = dataCache[monthKey]?.data || {};
  const hasData = Object.keys(monthData).length > 0;
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  React.useEffect(() => {
    if (!isLoading && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [isLoading, initialLoadDone]);

  const monthsInRange = useMemo(() => {
    const result = [];
    let y = rangeStart.y;
    let m = rangeStart.m;
    while (y < rangeEnd.y || (y === rangeEnd.y && m <= rangeEnd.m)) {
      result.push({ y, m });
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    return result;
  }, [rangeStart, rangeEnd]);

  const allRecords = useMemo(() => {
    const list = [];
    monthsInRange.forEach(({ y, m }) => {
      const monthKey = getMonthKey(y, m);
      const monthData = dataCache[monthKey]?.data || {};
      Object.keys(monthData).forEach((day) => {
        const dayActs = monthData[day]?.activities || [];
        dayActs.forEach((act) => list.push(act));
      });
    });
    return list.sort((a, b) => {
      const ta = a?.fields?.日期 || 0;
      const tb = b?.fields?.日期 || 0;
      return tb - ta;
    });
  }, [dataCache, monthsInRange, getMonthKey]);

  const filteredRecords = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    if (!q) return allRecords;
    return allRecords.filter((r) => {
      const name = (r.title || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [allRecords, searchQuery]);

  const handleRecordPress = (record) => {
    navigation?.navigate('RecordDetail', {
      recordId: record.id,
      record,
      refreshCurrentMonthData: () => refreshCurrentMonthData(new Date()),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>全部活动（本月）</Text>
        <View style={styles.searchBar}>
          <View style={[styles.searchGlassContainer, searchFocused ? styles.searchGlassContainerFocus : null]}>
            <BlurView intensity={60} tint="light" style={styles.searchGlass}>
              <View style={styles.searchRow}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="搜索类别或描述"
                  placeholderTextColor={colors.neutral[500]}
                />
                {searchQuery?.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn} activeOpacity={0.8}>
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          </View>
        </View>
        <View style={styles.rangeRow}>
          <View style={styles.rangeField}>
            <Text style={styles.rangeLabel}>起始</Text>
            <TouchableOpacity style={styles.rangeInputBox} onPress={() => { setPickerTarget('start'); setPickerYear(rangeStart.y); setPickerMonth(rangeStart.m); setShowRangePicker(true); }} activeOpacity={0.8}>
              <Text style={styles.rangeInputText}>{`${rangeStart.y}-${String(rangeStart.m).padStart(2, '0')}`}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rangeField}>
            <Text style={styles.rangeLabel}>结束</Text>
            <TouchableOpacity style={styles.rangeInputBox} onPress={() => { setPickerTarget('end'); setPickerYear(rangeEnd.y); setPickerMonth(rangeEnd.m); setShowRangePicker(true); }} activeOpacity={0.8}>
              <Text style={styles.rangeInputText}>{`${rangeEnd.y}-${String(rangeEnd.m).padStart(2, '0')}`}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={async () => {
              await preloadRange(rangeStart.y, rangeStart.m, rangeEnd.y, rangeEnd.m);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.applyBtnText}>应用</Text>
          </TouchableOpacity>
        </View>
        {showRangePicker && (
          <Modal transparent animationType="fade" visible={showRangePicker} onRequestClose={() => setShowRangePicker(false)}>
            <TouchableWithoutFeedback onPress={() => setShowRangePicker(false)}>
              <View style={styles.pickerOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.pickerSheet}>
                    <View style={styles.pickerHeader}>
                      <Text style={styles.pickerTitle}>选择年月</Text>
                      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                        <TouchableOpacity
                          style={styles.pickerAction}
                          onPress={() => setShowRangePicker(false)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.pickerActionText}>取消</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.pickerAction, { backgroundColor: colors.primary[500] }]}
                          onPress={() => {
                            if (pickerTarget === 'start') {
                              setRangeStart({ y: pickerYear, m: pickerMonth });
                            } else {
                              setRangeEnd({ y: pickerYear, m: pickerMonth });
                            }
                            setShowRangePicker(false);
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.pickerActionText, { color: colors.neutral[0] }]}>确定</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.pickerBody}>
                      <View style={styles.column}>
                        <Text style={styles.columnLabel}>年份</Text>
                        <ScrollView style={{ maxHeight: 180 }}>
                          {Array.from({ length: 8 }, (_, i) => year - 5 + i).map((yVal) => (
                            <TouchableOpacity key={`y-${yVal}`} style={[styles.item, pickerYear === yVal ? styles.itemActive : null]} onPress={() => setPickerYear(yVal)} activeOpacity={0.8}>
                              <Text style={[styles.itemText, pickerYear === yVal ? styles.itemTextActive : null]}>{yVal}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                      <View style={styles.column}>
                        <Text style={styles.columnLabel}>月份</Text>
                        <ScrollView style={{ maxHeight: 180 }}>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((mVal) => (
                            <TouchableOpacity key={`m-${mVal}`} style={[styles.item, pickerMonth === mVal ? styles.itemActive : null]} onPress={() => setPickerMonth(mVal)} activeOpacity={0.8}>
                              <Text style={[styles.itemText, pickerMonth === mVal ? styles.itemTextActive : null]}>{String(mVal).padStart(2, '0')}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
        {isLoading && !initialLoadDone ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>正在加载数据…</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || (isLoading && initialLoadDone)}
                onRefresh={async () => {
                  setRefreshing(true);
                  try {
                    await refreshMonthDataForDate(new Date(year, month - 1, 1));
                  } finally {
                    setRefreshing(false);
                  }
                }}
                tintColor={colors.primary[500]}
                colors={[colors.primary[500]]}
              />
            }
          >
            {filteredRecords.map((record) => (
              <RecordItem
                key={record.id}
                icon={record.icon}
                title={record.title}
                description={record.description}
                amount={record.amount}
                fields={record.fields || {}}
                onPress={() => handleRecordPress(record)}
              />
            ))}
            {filteredRecords.length === 0 && (
              <Text style={styles.hint}>暂无活动</Text>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.app.background,
  },
  container: {
    flex: 1,
  },
  title: {
    ...typographyUtils.getTextStyle('h3', colors.app.textPrimary),
    marginTop: theme.spacing.lg,
    marginLeft: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
  },
  listContent: {
    paddingBottom: theme.spacing.lg * 2,
  },
  searchBar: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  rangeField: {
    flex: 1,
    backgroundColor: colorUtils.withOpacity(colors.app.surfaceAlt, 0.9),
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  rangeLabel: {
    ...typographyUtils.getTextStyle('caption', colors.neutral[600]),
    marginBottom: theme.spacing.xs,
  },
  rangeInput: {
    ...typographyUtils.getTextStyle('body', colors.app.textPrimary),
  },
  rangeInputBox: {
    backgroundColor: colorUtils.withOpacity(colors.app.surface, 0.9),
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  rangeInputText: {
    ...typographyUtils.getTextStyle('body', colors.app.textPrimary),
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: colorUtils.withOpacity(colors.shadow.overlay, 0.3),
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.app.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: theme.spacing.md,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  pickerTitle: {
    ...typographyUtils.getTextStyle('h4', colors.app.textPrimary),
  },
  pickerAction: {
    backgroundColor: colors.app.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  pickerActionText: {
    ...typographyUtils.getTextStyle('button', colors.app.textPrimary),
  },
  pickerBody: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    ...typographyUtils.getTextStyle('caption', colors.neutral[600]),
    marginBottom: theme.spacing.xs,
  },
  item: {
    backgroundColor: colors.app.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  itemActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[400],
  },
  itemText: {
    ...typographyUtils.getTextStyle('body', colors.app.textPrimary),
  },
  itemTextActive: {
    ...typographyUtils.getTextStyle('body', colors.primary[700]),
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  applyBtnText: {
    ...typographyUtils.getTextStyle('button', colors.neutral[0]),
  },
  searchGlassContainer: {
    backgroundColor: colorUtils.withOpacity(colors.primary[50], 0.9),
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: theme.borderRadius.xl,
    shadowColor: colors.shadow.dark,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    padding: theme.spacing.sm,
  },
  searchGlassContainerFocus: {
    backgroundColor: colorUtils.withOpacity(colors.primary[100], 0.95),
    borderColor: colors.primary[500],
    shadowOpacity: 0.16,
    elevation: 3,
  },
  searchGlass: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  searchIcon: {
    ...typographyUtils.getTextStyle('caption', colors.neutral[500]),
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.app.textPrimary,
    paddingVertical: theme.spacing.xs,
  },
  clearBtn: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  clearBtnText: {
    ...typographyUtils.getTextStyle('caption', colors.neutral[500]),
  },
  hint: {
    ...typographyUtils.getTextStyle('body', colors.neutral[600]),
    marginTop: theme.spacing.md,
    marginLeft: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.app.background,
  },
  loadingText: {
    ...typographyUtils.getTextStyle('body', colors.neutral[600]),
    marginTop: theme.spacing.sm,
  },
});

export default ActivitiesScreen;
