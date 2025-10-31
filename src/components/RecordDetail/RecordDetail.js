import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RecordDetail = ({ route }) => {
  const { record } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Detail</Text>
      <View style={styles.recordInfo}>
        <Text style={styles.label}>Icon:</Text>
        <Text style={styles.value}>{record.icon}</Text>
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.label}>Title:</Text>
        <Text style={styles.value}>{record.title}</Text>
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.label}>Description:</Text>
        <Text style={styles.value}>{record.description}</Text>
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.label}>Amount:</Text>
        <Text style={styles.value}>{record.amount}¥</Text>
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.label}>Fields:</Text>
        <Text style={styles.value}>{new Date(record.fields.日期).toLocaleDateString()}</Text>
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.label}>Fields:</Text>
        <Text style={styles.value}>{JSON.stringify(record.fields)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5fcf9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  recordInfo: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  value: {
    flex: 1,
  },
});

export default RecordDetail;