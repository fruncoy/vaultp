import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name || 'Guest'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            KSH {(user?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.balanceSubtext}>Available for transactions</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5FF' }]}>
                <ArrowDownLeft size={24} color="#0A1D3F" />
              </View>
              <Text style={styles.actionText}>Add Money</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFE8E8' }]}>
                <ArrowUpRight size={24} color="#FF4B55" />
              </View>
              <Text style={styles.actionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions yet</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => router.push('/modal')}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A1D3F',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  name: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginTop: 4,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#0A1D3F',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
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
  balanceLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
  },
  balanceAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#0A1D3F',
    marginVertical: 8,
  },
  balanceSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#8895A7',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#0A1D3F',
  },
  transactionsSection: {
    marginBottom: 100,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0A1D3F',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#8895A7',
  },
  fabButton: {
    position: 'absolute',
    bottom: 84,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A1D3F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});