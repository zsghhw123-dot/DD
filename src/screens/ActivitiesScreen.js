import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeishuApi } from '../hooks/useFeishuApi';
import RecordItem from '../components/RecordItem/RecordItem';
import { colors, theme, typographyUtils } from '../theme';

const ActivitiesScreen = ({ navigation }) => {
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);
  const { dataCache, getMonthKey, refreshCurrentMonthData, isLoading } = useFeishuApi(year, month);
  const [refreshing, setRefreshing] = useState(false);
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
                  await refreshCurrentMonthData(new Date(year, month - 1, 1));
                } finally {
                  setRefreshing(false);
                }
              }}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          }
        >
            {allRecords.map((record) => (
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
            {allRecords.length === 0 && (
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
