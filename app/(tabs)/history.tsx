import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Clock, CircleCheck, Timer, CircleAlert, ArrowUpRight, ArrowDownRight, Bell } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { getTransactions, findUserByVaultId, Transaction, User, updateTransaction, updateUser, markTransactionAsRead } from '@/utils/storage';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
  const router = useRouter();
  const { user, updateUser: updateAuthUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    const allTransactions = await getTransactions();
    const userTransactions = allTransactions.filter(
      t => t.senderId === user.id || t.receiverId === user.id
    );

    const userIds = new Set(userTransactions.flatMap(t => [t.senderId, t.receiverId]));
    const userDetails: Record<string, User> = {};
    
    for (const id of userIds) {
      const userInfo = await findUserByVaultId(id);
      if (userInfo) {
        userDetails[id] = userInfo;
      }
    }

    setUsers(userDetails);
    setTransactions(userTransactions);
    
    // Count unread transactions
    const unreadCount = (user.unreadTransactions || []).length;
    setUnreadCount(unreadCount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Timer size={24} color="#F59E0B" />;
      case 'completed':
        return <CircleCheck size={24} color="#10B981" />;
      case 'accepted':
        return <CircleCheck size={24} color="#6366F1" />;
      case 'cancelled':
        return <CircleAlert size={24} color="#DC2626" />;
      default:
        return <Clock size={24} color="#8895A7" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FEF3C7';
      case 'completed':
        return '#D1FAE5';
      case 'accepted':
        return '#E0E7FF';
      case 'cancelled':
        return '#FEE2E2';
      default:
        return '#F3F4F6';
    }
  };

  const formatAmount = (amount: number) => {
    return `KSH ${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getTimeRemaining = (transaction: Transaction) => {
    if (transaction.status === 'completed' || transaction.status === 'cancelled') {
      return 'Transaction closed';
    }

    const endTime = (transaction.acceptedAt || transaction.timestamp) + (transaction.timeLimit * 60 * 60 * 1000);
    const remaining = endTime - Date.now();
    
    if (remaining <= 0) return 'Time expired';
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const handleAcceptTransaction = async (transaction: Transaction) => {
    try {
      // Update transaction status and acceptance time
      await updateTransaction(transaction.transactionId, {
        status: 'accepted',
        acceptedAt: Date.now()
      });

      // Mark as read
      if (user) {
        await markTransactionAsRead(user.id, transaction.transactionId);
      }

      // Refresh transactions
      loadTransactions();
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error accepting transaction:', error);
      Alert.alert('Error', 'Failed to accept transaction');
    }
  };

  const handleOrderReceived = async (transaction: Transaction) => {
    try {
      await updateTransaction(transaction.transactionId, { orderReceived: true });

      // If all conditions are met, complete the transaction
      const allConditionsMet = transaction.conditions.every(c => c.completed);
      if (allConditionsMet) {
        await updateTransaction(transaction.transactionId, { status: 'completed' });

        // Release funds to receiver
        const receiver = users[transaction.receiverId];
        if (receiver) {
          const newBalance = receiver.balance + transaction.amount;
          await updateUser(receiver.id, { balance: newBalance });
        }
      }

      // Refresh transactions
      loadTransactions();
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error marking order received:', error);
      Alert.alert('Error', 'Failed to mark order as received');
    }
  };

  const handleCancelTransaction = async (transaction: Transaction) => {
    try {
      // Can only cancel if time limit has expired and transaction is not completed
      const endTime = (transaction.acceptedAt || transaction.timestamp) + (transaction.timeLimit * 60 * 60 * 1000);
      if (Date.now() < endTime) {
        Alert.alert('Cannot Cancel', 'Time limit has not expired yet');
        return;
      }

      await updateTransaction(transaction.transactionId, { status: 'cancelled' });

      // Return funds to sender
      const sender = users[transaction.senderId];
      if (sender) {
        const newBalance = sender.balance + transaction.amount;
        await updateUser(sender.id, { balance: newBalance });
        if (sender.id === user?.id) {
          updateAuthUser({ balance: newBalance });
        }
      }

      // Refresh transactions
      loadTransactions();
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      Alert.alert('Error', 'Failed to cancel transaction');
    }
  };

  const handleConditionToggle = async (transaction: Transaction, conditionIndex: number) => {
    try {
      const newConditions = [...transaction.conditions];
      newConditions[conditionIndex].completed = !newConditions[conditionIndex].completed;

      await updateTransaction(transaction.transactionId, { conditions: newConditions });

      // Check if all conditions are met and order is received
      const allConditionsMet = newConditions.every(c => c.completed);
      if (allConditionsMet && transaction.orderReceived) {
        await updateTransaction(transaction.transactionId, { status: 'completed' });

        // Release funds to receiver
        const receiver = users[transaction.receiverId];
        if (receiver) {
          const newBalance = receiver.balance + transaction.amount;
          await updateUser(receiver.id, { balance: newBalance });
        }
      }

      // Refresh transactions
      loadTransactions();
      setSelectedTransaction({
        ...transaction,
        conditions: newConditions
      });
    } catch (error) {
      console.error('Error toggling condition:', error);
      Alert.alert('Error', 'Failed to update condition');
    }
  };

  const filteredTransactions = transactions.filter(transaction => 
    activeTab === 'sent' ? transaction.senderId === user?.id : transaction.receiverId === user?.id
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Bell size={20} color="#FFFFFF" />
            <Text style={styles.unreadCount}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}>
          <ArrowUpRight size={20} color={activeTab === 'sent' ? '#0A1D3F' : '#8895A7'} />
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>Sent</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}>
          <ArrowDownRight size={20} color={activeTab === 'received' ? '#0A1D3F' : '#8895A7'} />
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>Received</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No {activeTab} transactions yet</Text>
            </View>
          ) : (
            filteredTransactions.map((transaction) => {
              const otherParty = users[activeTab === 'sent' ? transaction.receiverId : transaction.senderId];
              const isUnread = user?.unreadTransactions?.includes(transaction.transactionId);
              
              return (
                <TouchableOpacity
                  key={transaction.transactionId}
                  style={[
                    styles.transactionCard,
                    { backgroundColor: getStatusColor(transaction.status) },
                    isUnread && styles.unreadCard
                  ]}
                  onPress={() => {
                    setSelectedTransaction(transaction);
                    if (isUnread && user) {
                      markTransactionAsRead(user.id, transaction.transactionId);
                      loadTransactions();
                    }
                  }}>
                  <View style={styles.transactionIcon}>
                    {getStatusIcon(transaction.status)}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>
                      {activeTab === 'sent' ? `Sent to ${otherParty?.name}` : `Received from ${otherParty?.name}`}
                    </Text>
                    <Text style={styles.vtid}>
                      VTID: {transaction.vtid}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.timestamp)}
                    </Text>
                    <Text style={styles.timeRemaining}>
                      {getTimeRemaining(transaction)}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[
                      styles.amount,
                      { color: activeTab === 'sent' ? '#FF4B55' : '#10B981' }
                    ]}>
                      {activeTab === 'sent' ? '- ' : '+ '}{formatAmount(transaction.amount)}
                    </Text>
                    <Text style={styles.status}>{transaction.status}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {selectedTransaction && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transaction Details</Text>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalLabel}>VTID:</Text>
              <Text style={styles.modalValue}>{selectedTransaction.vtid}</Text>
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalLabel}>Amount:</Text>
              <Text style={styles.modalValue}>{formatAmount(selectedTransaction.amount)}</Text>
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalLabel}>Status:</Text>
              <Text style={styles.modalValue}>{selectedTransaction.status}</Text>
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalLabel}>Time Remaining:</Text>
              <Text style={styles.modalValue}>{getTimeRemaining(selectedTransaction)}</Text>
            </View>

            <Text style={styles.conditionsTitle}>Conditions:</Text>
            {selectedTransaction.conditions.map((condition, index) => (
              <TouchableOpacity
                key={index}
                style={styles.conditionItem}
                onPress={() => {
                  if (selectedTransaction.senderId === user?.id && 
                      selectedTransaction.status === 'accepted') {
                    handleConditionToggle(selectedTransaction, index);
                  }
                }}
                disabled={selectedTransaction.senderId !== user?.id || 
                         selectedTransaction.status !== 'accepted'}>
                <Text style={styles.conditionText}>{condition.description}</Text>
                <View style={[styles.checkbox, condition.completed && styles.checkboxChecked]}>
                  {condition.completed && <CircleCheck size={16} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            ))}

            {/* Action Buttons */}
            {selectedTransaction.receiverId === user?.id && 
             selectedTransaction.status === 'pending' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAcceptTransaction(selectedTransaction)}>
                <Text style={styles.actionButtonText}>Accept Transaction</Text>
              </TouchableOpacity>
            )}

            {selectedTransaction.senderId === user?.id && 
             selectedTransaction.status === 'accepted' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleOrderReceived(selectedTransaction)}>
                <Text style={styles.actionButtonText}>Mark Order Received</Text>
              </TouchableOpacity>
            )}

            {selectedTransaction.senderId === user?.id && 
             selectedTransaction.status === 'accepted' && 
             Date.now() >= (selectedTransaction.acceptedAt || selectedTransaction.timestamp) + 
                          (selectedTransaction.timeLimit * 60 * 60 * 1000) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancelTransaction(selectedTransaction)}>
                <Text style={styles.actionButtonText}>Cancel Transaction</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setSelectedTransaction(null)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#E8F5FF',
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#8895A7',
  },
  activeTabText: {
    color: '#0A1D3F',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
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
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  unreadCard: {
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0A1D3F',
    marginBottom: 4,
  },
  vtid: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#6366F1',
    marginBottom: 4,
  },
  transactionDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
  },
  timeRemaining: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#8895A7',
    marginTop: 4,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  status: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#8895A7',
    textTransform: 'capitalize',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#0A1D3F',
    marginBottom: 16,
  },
  modalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
  },
  modalValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#0A1D3F',
  },
  conditionsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0A1D3F',
    marginTop: 16,
    marginBottom: 12,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  conditionText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#0A1D3F',
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8895A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  actionButton: {
    backgroundColor: '#0A1D3F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  closeModalButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  closeModalText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#0A1D3F',
  },
});