import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronRight, Shield, Bell, Lock, CircleHelp as HelpCircle, FileText, LogOut, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const settingsGroups = [
  {
    title: 'Security',
    items: [
      { icon: Lock, label: 'Password & PIN' },
      { icon: Shield, label: 'Two-Factor Authentication' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications' },
    ],
  },
  {
    title: 'Support & Legal',
    items: [
      { icon: HelpCircle, label: 'Help Center' },
      { icon: FileText, label: 'Terms of Service' },
      { icon: FileText, label: 'Privacy Policy' },
    ],
  },
];

const teamMembers = [
  {
    name: 'Frank Bosire',
    role: 'Lead Developer',
    bio: 'I lead the development of VaultPay, shaping its overall architecture and guiding the direction of the platform. My focus is on ensuring that VaultPay is a scalable, secure, and high-performance system that meets the needs of modern buyers and sellers. I am dedicated to building a platform that establishes trust and makes digital transactions safer.',
  },
  {
    name: 'Cynthia Obure',
    role: 'Senior Developer',
    bio: 'I am responsible for VaultPay\'s back-end infrastructure and database systems. My work involves designing and optimizing the platform\'s architecture to ensure fast, efficient, and secure transaction processing. I specialize in creating robust, scalable systems that can handle large volumes of transactions while ensuring data integrity and security.',
  },
  {
    name: 'Grace Thang\'wa',
    role: 'Front-End Developer',
    bio: 'I lead the creation of VaultPay\'s user interface, focusing on crafting a seamless and engaging user experience. My goal is to design a visually appealing, intuitive, and easy-to-navigate platform that ensures users can interact with VaultPay effortlessly, whether they\'re on mobile or desktop.',
  },
  {
    name: 'Daniel Njogu',
    role: 'Back-End Developer',
    bio: 'I oversee the technical infrastructure of VaultPay, focusing on optimizing the system\'s performance and security. I ensure that all data is securely processed and stored, and I design the underlying systems that make the platform fast, reliable, and scalable to handle increasing user demand.',
  },
  {
    name: 'Peter Gekonge',
    role: 'QA Specialist & Developer',
    bio: 'I ensure VaultPay operates flawlessly by leading rigorous testing efforts to guarantee a bug-free and seamless user experience. Beyond QA, I also specialize in system improvements, collaborating with the development team to enhance the platform\'s features, optimize performance, and ensure its security.',
  },
];

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [showAbout, setShowAbout] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsGroups.map((group, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <View style={styles.card}>
              {group.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < group.items.length - 1 && styles.settingItemBorder,
                  ]}>
                  <View style={styles.settingLeft}>
                    <item.icon size={20} color="#0A1D3F" />
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  <ChevronRight size={20} color="#0A1D3F" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.aboutButton}
            onPress={() => setShowAbout(!showAbout)}>
            <View style={styles.aboutButtonContent}>
              <Text style={styles.aboutButtonText}>About VaultPay</Text>
              <ChevronDown
                size={20}
                color="#0A1D3F"
                style={{
                  transform: [{ rotate: showAbout ? '180deg' : '0deg' }],
                }}
              />
            </View>
          </TouchableOpacity>

          {showAbout && (
            <View style={styles.aboutContent}>
              <Text style={styles.aboutText}>
                VaultPay is a secure platform designed to ensure that buyers and sellers can engage in transactions with complete trust. As social media platforms like TikTok and Instagram fuel the growth of small businesses and online selling, VaultPay provides a reliable and transparent way to complete these transactions. We hold funds securely until both parties fulfill their obligations, offering peace of mind and security for everyone involved.
              </Text>

              <Text style={styles.teamTitle}>Meet Our Team</Text>
              
              {teamMembers.map((member, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.teamMember}
                  onPress={() => setExpandedMember(expandedMember === member.name ? null : member.name)}>
                  <View style={styles.teamMemberHeader}>
                    <View>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                    </View>
                    <ChevronDown
                      size={20}
                      color="#0A1D3F"
                      style={{
                        transform: [{ rotate: expandedMember === member.name ? '180deg' : '0deg' }],
                      }}
                    />
                  </View>
                  {expandedMember === member.name && (
                    <Text style={styles.memberBio}>{member.bio}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={20} color="#0A1D3F" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
    paddingTop: 40,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#0A1D3F',
  },
  aboutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aboutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aboutButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0A1D3F',
  },
  aboutContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aboutText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#0A1D3F',
    lineHeight: 22,
  },
  teamTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0A1D3F',
    marginTop: 24,
    marginBottom: 16,
  },
  teamMember: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  teamMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0A1D3F',
  },
  memberRole: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8895A7',
    marginTop: 2,
  },
  memberBio: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#0A1D3F',
    marginTop: 12,
    lineHeight: 22,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 100,
  },
  logoutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0A1D3F',
  },
});