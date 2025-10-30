import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RecordItem = ({ icon, title, description, amount }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>{amount}¥</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    fontSize: 18,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#888',
  },
  amountContainer: {
    paddingLeft: 10,
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
  },
});

export default RecordItem;