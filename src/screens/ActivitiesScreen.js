import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeishuApi } from '../hooks/useFeishuApi';
import RecordItem from '../components/RecordItem/RecordItem';
import { colors, theme, typographyUtils, colorUtils } from '../theme';

const ActivitiesScreen = ({ navigation }) => {
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);
  const { dataCache, getMonthKey, refreshMonthDataForDate, isLoading } = useFeishuApi(year, month);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const monthKey = getMonthKey(year, month);
  const monthData = dataCache[monthKey] || {};
  const hasData = Object.keys(monthData).length > 0;
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  React.useEffect(() => {
    if (!isLoading && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [isLoading, initialLoadDone]);

  const allRecords = useMemo(() => {
    const monthKey = getMonthKey(year, month);
    const monthData = dataCache[monthKey] || {};
    const list = [];
    Object.keys(monthData).forEach((day) => {
      const dayActs = monthData[day]?.activities || [];
      dayActs.forEach((act) => list.push(act));
    });
    return list.sort((a, b) => {
      const ta = a?.fields?.日期 || 0;
      const tb = b?.fields?.日期 || 0;
      return tb - ta;
    });
  }, [dataCache, year, month, getMonthKey]);

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
        {isLoading && !initialLoadDone ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>正在加载数据…</Text>
          </View>
        ) : (
        <ScrollView
          style={styles.list}
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
  searchBar: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
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
