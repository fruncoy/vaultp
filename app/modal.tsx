import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight, ArrowDownLeft, X, Search, ChevronRight, Clock, Shield, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { findUserByVaultId, saveTransaction, generateTransactionId, updateUser, TransactionCondition, generateVTID } from '@/utils/storage';
import { useAuth } from '@/hooks/useAuth';

const MIN_CONDITIONS = 1;
const DEFAULT_TIME_LIMIT = 48; // Default 48 hours

export default function TransactionModal() {
  const router = useRouter();
  const { user, updateUser: updateAuthUser } = useAuth();
  const [step, setStep] = useState('initial');
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState('');
  const [receiver, setReceiver] = useState<any>(null);
  const [conditions, setConditions] = useState<TransactionCondition[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [timeLimit, setTimeLimit] = useState(DEFAULT_TIME_LIMIT.toString());
  const [searchError, setSearchError] = useState('');

  const handleSearch = async () => {
    setSearchError('');
    if (!searchQuery.trim()) {
      setSearchError('Please enter a VaultID');
      return;
    }
    
    try {
      const foundUser = await findUserByVaultId(searchQuery.trim());
      if (foundUser && foundUser.id !== user?.id) {
        setReceiver(foundUser);
        setStep('amount');
        setSearchError('');
      } else if (foundUser?.id === user?.id) {
        setSearchError('You cannot send money to yourself');
      } else {
        setSearchError('User not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('An error occurred while searching');
    }
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    
    const condition: TransactionCondition = {
      description: newCondition.trim(),
      completed: false
    };
    
    setConditions([...conditions, condition]);
    setNewCondition('');
  };

  const removeCondition = (index: number) => {
    if (conditions.length <= MIN_CONDITIONS) {
      Alert.alert('Cannot remove condition', 'At least one condition is required');
      return;
    }
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const validateTransaction = () => {
    if (conditions.length < MIN_CONDITIONS) {
      Alert.alert('Add Conditions', 'Please add at least one condition');
      return false;
    }

    const timeLimitNum = parseInt(timeLimit);
    if (isNaN(timeLimitNum) || timeLimitNum < 1) {
      Alert.alert('Invalid Time Limit', 'Please enter a valid time limit');
      return false;
    }

    return true;
  };

  const handleSendMoney = async () => {
    if (!user || !receiver || !amount) return;

    if (!validateTransaction()) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (numAmount > (user.balance || 0)) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance for this transaction');
      return;
    }

    try {
      const [transactionId, vtid] = await Promise.all([
        generateTransactionId(),
        generateVTID()
      ]);

      const transaction = {
        transactionId,
        vtid,
        senderId: user.id,
        receiverId: receiver.id,
        amount: numAmount,
        status: 'pending',
        conditions,
        timeLimit: parseInt(timeLimit),
        timestamp: Date.now(),
        orderReceived: false
      };

      // Update sender's balance
      const newSenderBalance = (user.balance || 0) - numAmount;
      await updateUser(user.id, { balance: newSenderBalance });
      updateAuthUser({ balance: newSenderBalance });

      // Save the transaction
      await saveTransaction(transaction);

      // Navigate to history page
      router.push('/(tabs)/history');
      
    } catch (error) {
      console.error('Transaction error:', error);
      Alert.alert('Transaction Failed', 'Failed to create transaction');
    }
  };

  const renderInitialStep = () => (
    <View style={styles.content}>
      <TouchableOpacity style={styles.option} onPress={() => setStep('send')}>
        <View style={[styles.iconContainer, { backgroundColor: '#E8F5FF' }]}>
          <ArrowUpRight size={24} color="#0A1D3F" />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Send Money</Text>
          <Text style={styles.optionDescription}>
            Send money securely through escrow
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => setStep('receive')}>
        <View style={[styles.iconContainer, { backgroundColor: '#E8FFF1' }]}>
          <ArrowDownLeft size={24} color="#00C48C" />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Request Money</Text>
          <Text style={styles.optionDescription}>
            Request money with custom conditions
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSearchStep = () => (
    <View style={styles.content}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#8895A7" />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter VaultID"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8895A7"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      {searchError ? (
        <Text style={styles.errorText}>{searchError}</Text>
      ) : null}

      {receiver && (
        <View style={styles.receiverCard}>
          <Text style={styles.receiverName}>{receiver.name}</Text>
          <Text style={styles.receiverVaultId}>{receiver.vaultId}</Text>
        </View>
      )}
    </View>
  );

  const renderAmountStep = () => (
    <ScrollView style={styles.content}>
      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>KSH</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          placeholderTextColor="#8895A7"
        />
      </View>

      <View style={styles.conditionsContainer}>
        <Text style={styles.conditionsTitle}>Conditions Checklist</Text>
        <Text style={styles.conditionsDescription}>
          Add conditions that need to be met before releasing the funds. These should match what you've already agreed upon via WhatsApp or call.
        </Text>
        
        <View style={styles.addConditionContainer}>
          <TextInput
            style={styles.conditionInput}
            placeholder="Add a condition..."
            value={newCondition}
            onChangeText={setNewCondition}
            placeholderTextColor="#8895A7"
          />
          <TouchableOpacity 
            style={[styles.addButton, !newCondition.trim() && styles.buttonDisabled]} 
            onPress={addCondition}
            disabled={!newCondition.trim()}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {conditions.map((condition, index) => (
          <View key={index} style={styles.conditionItem}>
            <Text style={styles.conditionText}>{condition.description}</Text>
            <TouchableOpacity
              onPress={() => removeCondition(index)}
              style={styles.removeButton}>
              <Trash2 size={20} color="#FF4B55" />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.timeLimit}>
          <View style={styles.timeLimitHeader}>
            <Clock size={20} color="#0A1D3F" />
            <Text style={styles.timeLimitTitle}>Time Limit (hours)</Text>
          </View>
          <TextInput
            style={styles.timeLimitInput}
            value={timeLimit}
            onChangeText={setTimeLimit}
            keyboardType="number-pad"
            placeholder="24"
            placeholderTextColor="#8895A7"
          />
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.sendButton,
          (!amount || parseFloat(amount) <= 0) && styles.buttonDisabled
        ]}
        onPress={handleSendMoney}
        disabled={!amount || parseFloat(amount) <= 0}>
        <Text style={styles.sendButtonText}>Send Money</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {step === 'initial' ? 'New Transaction' : 
           step === 'send' ? 'Send Money' :
           step === 'receive' ? 'Request Money' :
           step === 'amount' ? 'Transaction Details' : 'Select Recipient'}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            if (step !== 'initial') {
              setStep('initial');
            } else {
              router.back();
            }
          }}>
          <X size={24} color="#0A1D3F" />
        </TouchableOpacity>
      </View>

      {step === 'initial' && renderInitialStep()}
      {(step === 'send' || step === 'receive') && renderSearchStep()}
      {step === 'amount' && renderAmountStep()}
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
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0A1D3F',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0A1D3F',
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
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
  },
  searchButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FF4B55',
    marginTop: 8,
  },
  receiverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  receiverName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0A1D3F',
    marginBottom: 4,
  },
  receiverVaultId: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 32,
  },
  currencySymbol: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#0A1D3F',
  },
  amountInput: {
    fontFamily: 'Inter-Bold',
    fontSize: Platform.OS === 'web' ? 48 : 32,
    color: '#0A1D3F',
    minWidth: Platform.OS === 'web' ? 150 : 120,
    textAlign: 'center',
  },
  conditionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  conditionsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0A1D3F',
  },
  conditionsDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
    lineHeight: 20,
  },
  addConditionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  conditionInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#0A1D3F',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0A1D3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
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
    fontSize: 16,
    color: '#0A1D3F',
    marginRight: 12,
  },
  removeButton: {
    padding: 4,
  },
  timeLimit: {
    marginTop: 8,
  },
  timeLimitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timeLimitTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#0A1D3F',
  },
  timeLimitInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#0A1D3F',
  },
  sendButton: {
    backgroundColor: '#0A1D3F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  sendButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});