import React from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet, RefreshControl,
} from 'react-native';
import { gql, useQuery } from '@apollo/client';
import { ProductCard } from '../components/ProductCard';

const DAILY_HISTORY_QUERY = gql`
  query DailyTopProductHistory {
    dailyTopProductHistory {
      date
      product { productId productName sales }
    }
  }
`;

interface Data {
  dailyTopProductHistory: Array<{
    date: string;
    product: { productId: string; productName: string; sales: number } | null;
  }>;
}

export const DailyHistoryScreen: React.FC = () => {
  const { data, loading, error, refetch } = useQuery<Data>(DAILY_HISTORY_QUERY);

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F8438" />
        <Text style={styles.statusText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn't reach the API</Text>
        <Text style={styles.errorBody}>{error.message}</Text>
        <Text style={styles.errorHint}>Is the GraphQL server running on port 4000?</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
    >
      <Text style={styles.title}>Daily top sellers</Text>
      <Text style={styles.intro}>
        The top sizzling hot product per day, after deduplication and cancellations.
      </Text>
      {data?.dailyTopProductHistory.map(day =>
        day.product ? (
          <ProductCard
            key={day.date}
            subtitle={day.date}
            productName={day.product.productName}
            sales={day.product.sales}
          />
        ) : (
          <View key={day.date} style={styles.emptyDay}>
            <Text style={styles.subtitle}>{day.date}</Text>
            <Text style={styles.emptyDayText}>No sales</Text>
          </View>
        )
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F5F5F5' },
  statusText: { marginTop: 12, color: '#666' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  intro: { fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 },
  subtitle: { fontSize: 12, color: '#666', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  emptyDay: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18, marginVertical: 8,
    borderLeftWidth: 4, borderLeftColor: '#CCC',
  },
  emptyDayText: { color: '#999', marginTop: 6 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#C0392B', marginBottom: 8 },
  errorBody: { color: '#444', textAlign: 'center', marginBottom: 16 },
  errorHint: { color: '#888', fontSize: 13, textAlign: 'center' },
});
