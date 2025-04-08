import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, Clipboard } from 'react-native';
import { ChevronRight, Phone, Mail, Shield, Camera, MapPin, Copy } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user } = useAuth();
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopyVaultId = async () => {
    if (user?.vaultId) {
      try {
        if (Platform.OS === 'web') {
          await navigator.clipboard.writeText(user.vaultId);
        } else {
          await Clipboard.setString(user.vaultId);
        }
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
              </Text>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user?.name || 'Guest'}</Text>
          <View style={styles.vaultIdContainer}>
            <Text style={styles.vaultId}>{user?.vaultId || 'No VID assigned'}</Text>
            {user?.vaultId && (
              <TouchableOpacity onPress={handleCopyVaultId}>
                {copyFeedback ? (
                  <Text style={styles.copiedText}>Copied!</Text>
                ) : (
                  <Copy size={16} color="#8895A7" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <TouchableOpacity style={[styles.infoItem, styles.infoItemBorder]}>
              <View style={styles.infoLeft}>
                <Mail size={20} color="#0A1D3F" />
                <View>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#0A1D3F" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.infoItem, styles.infoItemBorder]}>
              <View style={styles.infoLeft}>
                <Phone size={20} color="#0A1D3F" />
                <View>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#0A1D3F" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <MapPin size={20} color="#0A1D3F" />
                <View>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{user?.location || 'Not set'}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#0A1D3F" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { marginBottom: Platform.OS === 'ios' ? 100 : 80 }]}>
          <Text style={styles.sectionTitle}>Account Verification</Text>
          <TouchableOpacity style={styles.verificationCard}>
            <View style={styles.verificationLeft}>
              <Shield size={24} color="#0A1D3F" />
              <View style={styles.verificationTextContainer}>
                <Text style={styles.verificationTitle}>Complete KYC</Text>
                <Text style={styles.verificationDesc}>Verify your identity to unlock all features</Text>
              </View>
            </View>
            <ChevronRight size={24} color="#0A1D3F" />
          </TouchableOpacity>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0A1D3F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    color: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#0A1D3F',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: '#0A1D3F',
    marginBottom: 8,
  },
  vaultIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
  },
  vaultId: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#8895A7',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#8895A7',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  infoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
  },
  infoValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#0A1D3F',
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: width < 380 ? 12 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width < 380 ? 8 : 16,
    flex: 1,
  },
  verificationTextContainer: {
    flex: 1,
  },
  verificationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: width < 380 ? 14 : 16,
    color: '#0A1D3F',
    marginBottom: 4,
  },
  verificationDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: width < 380 ? 12 : 14,
    color: '#8895A7',
  },
  copiedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#10B981',
  },
});