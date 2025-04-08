import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Shield, TrendingUp, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { findUserByVaultId, getTransactions } from '@/utils/storage';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [transactionStats, setTransactionStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    trustScore: 100
  });
  
  const calculateTrustScore = (stats: { total: number; completed: number; cancelled: number }) => {
    if (stats.total === 0) return 100; // Default score for new users
    
    // Base score calculation
    const successRate = (stats.completed / stats.total) * 100;
    const failureRate = (stats.cancelled / stats.total) * 100;
    
    // Trust score formula:
    // - Start with base 100
    // - Add up to 50 points based on number of completed transactions (max at 20 transactions)
    // - Add up to 50 points based on success rate
    // - Subtract up to 50 points based on failure rate
    
    const completedBonus = Math.min(50, (stats.completed / 20) * 50);
    const successBonus = (successRate / 100) * 50;
    const failurePenalty = (failureRate / 100) * 50;
    
    let score = 100 + completedBonus + successBonus - failurePenalty;
    
    // Ensure score stays within 0-200 range
    return Math.min(200, Math.max(0, Math.round(score)));
  };

  useEffect(() => {
    loadTransactionStats();
  }, []);

  const loadTransactionStats = async () => {
    if (!user) return;

    const transactions = await getTransactions();
    const userTransactions = transactions.filter(
      t => t.senderId === user.id || t.receiverId === user.id
    );

    const stats = {
      total: userTransactions.length,
      completed: userTransactions.filter(t => t.status === 'completed').length,
      pending: userTransactions.filter(t => t.status === 'pending').length,
      cancelled: userTransactions.filter(t => t.status === 'cancelled').length,
      trustScore: 100
    };

    stats.trustScore = calculateTrustScore(stats);
    setTransactionStats(stats);
  };

  const handleSearch = async () => {
    setSearchError('');
    setSearchResult(null);
    
    if (!searchQuery.trim()) {
      setSearchError('Please enter a VaultID');
      return;
    }

    try {
      const foundUser = await findUserByVaultId(searchQuery.trim());
      if (foundUser && foundUser.id !== user?.id) {
        setSearchResult(foundUser);
        setSearchError('');
      } else if (foundUser?.id === user?.id) {
        setSearchError('This is your own VaultID');
      } else {
        setSearchError('User not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('An error occurred while searching');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.trustScoreCard}>
          <View style={styles.trustScoreHeader}>
            <Shield size={24} color="#0A1D3F" />
            <Text style={styles.trustScoreTitle}>Trust Score</Text>
          </View>
          <Text style={styles.trustScoreValue}>{transactionStats.trustScore}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${transactionStats.trustScore}%` }]} />
          </View>
          <Text style={styles.trustScoreDesc}>
            Based on {transactionStats.total} total transactions
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#E8F5FF' }]}>
              <Text style={styles.statValue}>{transactionStats.total}</Text>
              <Text style={styles.statLabel}>Total Transactions</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.statValue}>{transactionStats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.statValue}>{transactionStats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.statValue}>{transactionStats.cancelled}</Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        <View style={styles.graphsContainer}>
          <View style={styles.graphCard}>
            <View style={styles.graphHeader}>
              <Text style={styles.graphTitle}>Money Flow</Text>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <ArrowUpRight size={16} color="#10B981" />
                  <Text style={styles.legendText}>Sent</Text>
                </View>
                <View style={styles.legendItem}>
                  <ArrowDownRight size={16} color="#6366F1" />
                  <Text style={styles.legendText}>Received</Text>
                </View>
              </View>
            </View>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transaction data yet</Text>
            </View>
          </View>

          <View style={styles.graphCard}>
            <Text style={styles.graphTitle}>Transaction Types</Text>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transaction types yet</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Find Users</Text>
          <View style={styles.searchContainer}>
            <Search size={20} color="#8895A7" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by VaultID"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setSearchError('');
                setSearchResult(null);
              }}
              placeholderTextColor="#8895A7"
            />
          </View>
          
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>

          {searchError ? (
            <Text style={styles.errorText}>{searchError}</Text>
          ) : null}

          {searchResult ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultName}>{searchResult.name}</Text>
              <Text style={styles.resultVaultId}>{searchResult.vaultId}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#0A1D3F',
    paddingTop: Platform.OS === 'web' ? 20 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  trustScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trustScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  trustScoreTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0A1D3F',
  },
  trustScoreValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: '#0A1D3F',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  trustScoreDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
  },
  statsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#0A1D3F',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#0A1D3F',
  },
  graphsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  graphCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  graphTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0A1D3F',
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#8895A7',
  },
  emptyState: {
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
  },
  searchSection: {
    marginBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0A1D3F',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#0A1D3F',
  },
  searchButton: {
    backgroundColor: '#0A1D3F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  searchButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorText: {
    color: '#DC2626',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  resultName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0A1D3F',
    marginBottom: 4,
  },
  resultVaultId: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
  },
});