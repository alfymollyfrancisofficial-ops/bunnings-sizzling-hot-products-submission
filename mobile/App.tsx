import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform,
} from 'react-native';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './src/apollo';
import { DailyHistoryScreen } from './src/screens/DailyHistoryScreen';
import { ThreeDayWindowScreen } from './src/screens/ThreeDayWindowScreen';

type Tab = 'period' | 'history';

// Simple tab switcher with useState. Could use react-navigation here
// but for two screens it's overkill.
export default function App() {
  const [tab, setTab] = useState<Tab>('period');

  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#0F8438" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sizzling Hot Products</Text>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, tab === 'period' && styles.tabActive]}
            onPress={() => setTab('period')}
          >
            <Text style={[styles.tabText, tab === 'period' && styles.tabTextActive]}>
              Past 3 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
              Daily History
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {tab === 'period' ? <ThreeDayWindowScreen /> : <DailyHistoryScreen />}
        </View>
      </SafeAreaView>
    </ApolloProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { backgroundColor: '#0F8438', paddingHorizontal: 16, paddingVertical: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#E25822' },
  tabText: { fontSize: 14, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#1A1A1A' },
  body: { flex: 1 },
});
