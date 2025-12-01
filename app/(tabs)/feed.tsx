import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  SafeAreaView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Types ---
interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  providers: number;
  avgRating: number;
  category: string;
}

interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
}

interface Provider {
  id: number;
  name: string;
  title: string;
  location: string;
  experience: string;
  specialties: string[];
  hourlyRate: string;
  rating: number;
  reviews: number;
  verified: boolean;
  about?: string;
  services?: string[];
  languages?: string[];
  availability?: string;
  reviews_detail?: Review[];
  portfolio?: string[]; 
}

// --- Data ---
const featuredCategories: ServiceCategory[] = [
  { id: 'cleaning', title: 'House Cleaning', description: 'Professional cleaning services', icon: '🧹', providers: 156, avgRating: 4.8, category: 'cleaning' },
  { id: 'childcare', title: 'Child Care', description: 'Trusted nannies and babysitters', icon: '👶', providers: 89, avgRating: 4.9, category: 'childcare' },
  { id: 'eldercare', title: 'Elder Care', description: 'Compassionate care for seniors', icon: '👴', providers: 67, avgRating: 4.7, category: 'eldercare' }
];

const moreCategories: ServiceCategory[] = [
  { id: 'cooking', title: 'Personal Chef', description: 'Home cooking and meal prep', icon: '👩‍🍳', providers: 43, avgRating: 4.6, category: 'cooking' },
  { id: 'maintenance', title: 'Home Maintenance', description: 'Repairs and maintenance', icon: '🔧', providers: 124, avgRating: 4.5, category: 'maintenance' },
  { id: 'gardening', title: 'Garden Care', description: 'Landscaping maintenance', icon: '🌱', providers: 78, avgRating: 4.4, category: 'gardening' },
  { id: 'handyman', title: 'Handyman', description: 'All-around repair experts', icon: '🛠️', providers: 52, avgRating: 4.7, category: 'maintenance' }
];

// FIXED: Added missing data for cooking, maintenance, and gardening
const serviceProviders: Record<string, Provider[]> = {
  cleaning: [
    {
      id: 1, name: "Maria Santos", title: "Professional House Cleaner", location: "Barangay Poblacion, Argao", 
      experience: "5 years experience", specialties: ["Deep cleaning", "Move-in/out"], hourlyRate: "₱350/hour", rating: 4.9, reviews: 127, verified: true,
      about: "Hi! I'm Maria, a dedicated house cleaner with 5 years of experience. I take pride in transforming homes into spotless spaces.",
      services: ["Regular cleaning", "Deep cleaning", "Post-construction"], availability: "Mon-Sat, 8 AM - 6 PM",
      reviews_detail: [
        { author: "Jennifer L.", rating: 5, date: "2 weeks ago", text: "Maria is absolutely fantastic! She cleaned our condo perfectly." },
        { author: "Robert K.", rating: 5, date: "1 month ago", text: "Always on time and thorough." }
      ],
      portfolio: ["#ddd6fe", "#dcfce7", "#fef3c7"] 
    },
    {
      id: 2, name: "Ana Rodriguez", title: "Residential Cleaning Specialist", location: "Barangay Looc, Argao", 
      experience: "3 years experience", specialties: ["Apartment cleaning", "Office cleaning"], hourlyRate: "₱300/hour", rating: 4.7, reviews: 89, verified: true,
      about: "Professional cleaner specializing in apartment and small office spaces.",
      services: ["Apartment cleaning", "Small office cleaning"], availability: "Tue-Sun, 9 AM - 7 PM",
      reviews_detail: [{ author: "Mike T.", rating: 5, date: "1 week ago", text: "Efficient and knows exactly what needs attention." }]
    }
  ],
  childcare: [
    {
      id: 4, name: "Jessica Reyes", title: "Professional Nanny", location: "Taguig City", 
      experience: "6 years experience", specialties: ["Infant care", "Toddler dev"], hourlyRate: "₱250/hour", rating: 4.9, reviews: 95, verified: true,
      about: "Passionate childcare provider. I believe in nurturing each child's unique personality.",
      services: ["Infant care", "Toddler supervision", "Light tutoring"], availability: "Mon-Fri, 7 AM - 8 PM",
      reviews_detail: [{ author: "Lisa P.", rating: 5, date: "3 days ago", text: "She's incredibly patient and creative." }]
    }
  ],
  eldercare: [
     {
      id: 6, name: "Grace Martinez", title: "Senior Care Companion", location: "Manila", 
      experience: "8 years experience", specialties: ["Companionship", "Medication"], hourlyRate: "₱280/hour", rating: 4.9, reviews: 78, verified: true,
      about: "Dedicated senior care professional focusing on dignity and independence.",
      reviews_detail: [{ author: "Roberto F.", rating: 5, date: "4 days ago", text: "My mother looks forward to her visits." }]
    }
  ],
  cooking: [
    {
      id: 10, name: "Chef Marco", title: "Private Home Chef", location: "Cebu City", 
      experience: "10 years experience", specialties: ["Filipino Cuisine", "Meal Prep"], hourlyRate: "₱500/hour", rating: 4.8, reviews: 42, verified: true,
      about: "Culinary graduate with a passion for healthy, home-cooked meals.",
      services: ["Weekly meal prep", "Private dinners"], availability: "Mon-Fri, 10 AM - 7 PM",
      reviews_detail: [{ author: "Sarah J.", rating: 5, date: "1 week ago", text: "His adobo is the best I've ever tasted!" }]
    }
  ],
  maintenance: [
    {
      id: 11, name: "Kuya Jun", title: "Expert Handyman", location: "Mandaue City", 
      experience: "15 years experience", specialties: ["Plumbing", "Electrical"], hourlyRate: "₱400/hour", rating: 4.9, reviews: 156, verified: true,
      about: "No job is too small. I fix leaks, wires, and broken furniture.",
      services: ["Plumbing repairs", "Electrical checks", "Furniture assembly"], availability: "Mon-Sat, 7 AM - 5 PM",
      reviews_detail: [{ author: "Ben T.", rating: 5, date: "3 days ago", text: "Fixed my sink in 20 minutes." }]
    }
  ],
  gardening: [
    {
      id: 12, name: "Green Thumbs PH", title: "Landscape Artist", location: "Talisay", 
      experience: "4 years experience", specialties: ["Lawn mowing", "Plant care"], hourlyRate: "₱300/hour", rating: 4.5, reviews: 23, verified: true,
      about: "We make your garden bloom. Specialized in tropical plants.",
      services: ["Lawn maintenance", "Tree trimming"], availability: "Sat-Sun, 6 AM - 4 PM",
      reviews_detail: [{ author: "Carla M.", rating: 4, date: "1 month ago", text: "Very hardworking team." }]
    }
  ],
  // Handyman maps to 'maintenance' category ID in your logic, but if ID is 'handyman' we need this:
  handyman: [
    {
      id: 13, name: "Rico's Repairs", title: "General Repairs", location: "Lapu-Lapu", 
      experience: "7 years experience", specialties: ["Carpentry", "Painting"], hourlyRate: "₱350/hour", rating: 4.7, reviews: 67, verified: true,
      about: "Fast and reliable repairs for your home.",
      reviews_detail: [{ author: "John D.", rating: 5, date: "2 weeks ago", text: "Very professional." }]
    }
  ]
};

// --- Helper Components ---

const Avatar = ({ name, size = 50, color = '#3b82f6' }: { name: string, size?: number, color?: string }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: 'bold' }}>{initials}</Text>
    </View>
  );
};

// --- Main Screen Component ---

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State
  const [view, setView] = useState<'home' | 'providers' | 'profile'>('home');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);
  const [searchText, setSearchText] = useState('');
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{text: string, type: 'sent' | 'received'}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (view === 'profile') {
          setView('providers');
          return true;
        } else if (view === 'providers') {
          setView('home'); 
          return true;
        } else {
          // Optional: Remove this if you don't want the app to close on back press
          BackHandler.exitApp();
          return true;
        }
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [view])
  );


  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
    setView('home');
  };

  const handleServicePress = (serviceId: string) => {
    setActiveServiceId(serviceId);
    setView('providers');
  };

  const handleProviderPress = (provider: Provider) => {
    setCurrentProvider(provider);
    setView('profile');
  };

  const getFilteredServices = () => {
    let services = [...featuredCategories, ...moreCategories];
    if (searchText) {
      services = services.filter(s => s.title.toLowerCase().includes(searchText.toLowerCase()));
    } else if (activeCategory !== 'all') {
      services = services.filter(s => s.category === activeCategory);
    }
    return services;
  };

  const getProvidersForService = () => {
    if (!activeServiceId) return [];
    // Fallback to empty array if key doesn't exist
    return serviceProviders[activeServiceId] || [];
  };

  const openChat = () => {
    setChatMessages([{ text: `Hello! I'm ${currentProvider?.name}. How can I help you today?`, type: 'received' }]);
    setIsChatOpen(true);
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const newMessages = [...chatMessages, { text, type: 'sent' as const }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let response = "That's a great question! Let me provide you with more details.";
      const lower = text.toLowerCase();
      if (lower.includes('rate') || lower.includes('cost')) response = `My rate is ${currentProvider?.hourlyRate}.`;
      else if (lower.includes('available') || lower.includes('when')) response = `I'm generally available ${currentProvider?.availability || 'Mon-Sat'}.`;
      else if (lower.includes('book')) response = "Great! Let me know your preferred time.";

      setChatMessages(prev => [...prev, { text: response, type: 'received' }]);
      setIsTyping(false);
    }, 1500);
  };


  const renderHome = () => {
    const displayedServices = getFilteredServices();
    const categories = ['all', 'cleaning', 'childcare', 'eldercare', 'cooking', 'maintenance', 'gardening'];

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoPlaceholder}><Text>🏠</Text></View>
            <Text style={styles.logoText}>ServiceSnap</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchBar}
            placeholder="Search for services..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => handleCategoryPress(cat)}
            >
              <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.contentPadding}>
          <Text style={styles.sectionTitle}>
            {searchText ? 'Search Results' : (activeCategory === 'all' ? 'All Services' : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Services`)}
          </Text>
          
          <View style={styles.gridContainer}>
            {displayedServices.map(service => (
              <TouchableOpacity key={service.id} style={styles.serviceCard} onPress={() => handleServicePress(service.id)}>
                <Text style={styles.serviceIcon}>{service.icon}</Text>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
                <View style={styles.serviceStats}>
                  <Text style={styles.statsText}>{service.providers} pros</Text>
                  <Text style={styles.statsText}>⭐ {service.avgRating}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderProviderList = () => {
    const providers = getProvidersForService();
    // Safety check for title
    const serviceTitle = [...featuredCategories, ...moreCategories].find(s => s.id === activeServiceId)?.title || 'Service';

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('home')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#3b82f6" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{serviceTitle}</Text>
          <View style={{width: 60}} /> 
        </View>
        
        <ScrollView style={styles.contentPadding}>
          <Text style={styles.subtitle}>{providers.length} verified professionals</Text>
          {providers.length === 0 ? (
             <View style={{padding: 20, alignItems: 'center'}}>
               <Text style={{color: '#9ca3af'}}>No providers available for this category yet.</Text>
             </View>
          ) : (
            providers.map(provider => (
              <TouchableOpacity key={provider.id} style={styles.providerCard} onPress={() => handleProviderPress(provider)}>
                <View style={styles.providerHeader}>
                  <Avatar name={provider.name} />
                  <View style={styles.providerInfo}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                      <Text style={styles.providerName}>{provider.name}</Text>
                      <Ionicons name="checkmark-circle" size={16} color="#3b82f6" style={{marginLeft: 4}} />
                    </View>
                    <Text style={styles.providerRole}>{provider.experience}</Text>
                    <Text style={styles.providerLoc}>📍 {provider.location}</Text>
                  </View>
                </View>
                <View style={styles.providerMeta}>
                  <Text style={styles.rating}>⭐ {provider.rating} ({provider.reviews})</Text>
                  <Text style={styles.rate}>{provider.hourlyRate}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.btnOutline} onPress={() => { setCurrentProvider(provider); openChat(); }}>
                    <Text style={styles.btnOutlineText}>Contact</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => handleProviderPress(provider)}>
                    <Text style={styles.btnPrimaryText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const renderProfile = () => {
    if (!currentProvider) return null;
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={() => setView('providers')} style={styles.absBackBtn}>
              <View style={{flexDirection:'row', alignItems:'center', padding: 8, backgroundColor:'rgba(255,255,255,0.8)', borderRadius:8}}>
                <Ionicons name="chevron-back" size={24} color="#3b82f6" />
                <Text style={styles.backBtnText}>Back</Text>
              </View>
            </TouchableOpacity>
            
            <View style={{alignItems: 'center', marginTop: 20}}>
              <Avatar name={currentProvider.name} size={100} />
              
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12}}>
                <Text style={styles.profileNameLarge}>{currentProvider.name}</Text>
                {currentProvider.verified && (
                  <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                )}
              </View>

              <Text style={styles.profileTitle}>{currentProvider.title}</Text>
              
              <View style={styles.profileStatsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>⭐ {currentProvider.rating}</Text>
                  <Text style={styles.statLabel}>{currentProvider.reviews} reviews</Text>
                </View>
                <View style={styles.statItem}>
                   <Text style={styles.statVal}>💼 {currentProvider.experience.split(' ')[0]}</Text>
                   <Text style={styles.statLabel}>Years</Text>
                </View>
                <View style={styles.statItem}>
                   <Text style={styles.statVal}>{currentProvider.hourlyRate}</Text>
                   <Text style={styles.statLabel}>Rate</Text>
                </View>
              </View>

              <View style={styles.profileActions}>
                {/* FIXED: Changed to Alert to prevent crash on missing route */}
                <TouchableOpacity 
                  style={[styles.btnPrimary, {flex: 1, marginRight: 8}]} 
                  onPress={() => Alert.alert("Coming Soon", "The booking feature is under development.")}
                >
                   <Text style={styles.btnPrimaryText}>Book Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnOutline, {flex: 1}]} onPress={openChat}>
                   <Text style={styles.btnOutlineText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>About Me</Text>
            <Text style={styles.bodyText}>{currentProvider.about}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Services</Text>
            {currentProvider.services?.map((s, i) => (
              <Text key={i} style={styles.listItem}>• {s}</Text>
            ))}
          </View>
          
          <View style={styles.section}>
             <Text style={styles.sectionHeader}>Portfolio</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false}>
               {(currentProvider.portfolio || ['#eee', '#eee']).map((color, i) => (
                 <View key={i} style={[styles.portfolioItem, { backgroundColor: color }]}>
                    <Text style={{opacity:0.5}}>Image {i+1}</Text>
                 </View>
               ))}
             </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Reviews</Text>
            {currentProvider.reviews_detail?.map((review, i) => (
              <View key={i} style={styles.reviewItem}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                   <Text style={styles.reviewAuthor}>{review.author}</Text>
                   <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                <Text style={{color:'#fbbf24'}}>{"⭐".repeat(review.rating)}</Text>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // --- Render Chat Modal ---
  const renderChat = () => (
    <Modal visible={isChatOpen} animationType="slide" transparent={true}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <View style={[styles.chatContainer, { marginBottom: insets.bottom }]}>
          <View style={styles.chatHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Avatar name={currentProvider?.name || 'Provider'} size={40} />
              <View style={{marginLeft: 10}}>
                <Text style={styles.chatName}>{currentProvider?.name}</Text>
                <Text style={styles.chatStatus}>Online</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsChatOpen(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.messagesArea} 
            ref={messagesEndRef}
            onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({animated: true})}
          >
            {chatMessages.map((msg, i) => (
              <View key={i} style={[
                styles.messageBubble, 
                msg.type === 'sent' ? styles.sentBubble : styles.receivedBubble
              ]}>
                <Text style={msg.type === 'sent' ? styles.sentText : styles.receivedText}>{msg.text}</Text>
              </View>
            ))}
            {isTyping && (
              <Text style={styles.typingIndicator}>{currentProvider?.name} is typing...</Text>
            )}
          </ScrollView>

          <View style={styles.inputArea}>
            <TextInput 
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type a message..."
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => sendChatMessage(chatInput)}>
              <Text style={{color: 'white'}}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={{flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : insets.top}}>
      <StatusBar barStyle="dark-content" />
      {view === 'home' && renderHome()}
      {view === 'providers' && renderProviderList()}
      {view === 'profile' && renderProfile()}
      {renderChat()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 16, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoPlaceholder: { width: 32, height: 32, marginRight: 8, justifyContent:'center', alignItems:'center' },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#004242' },
  
  searchContainer: { padding: 16, backgroundColor: '#fff' },
  searchBar: { backgroundColor: '#f3f4f6', borderRadius: 24, padding: 12, paddingLeft: 20, fontSize: 16 },
  
  categoryScroll: { backgroundColor: '#fff', paddingLeft: 16, paddingBottom: 12, maxHeight: 60 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 10, height: 36 },
  categoryChipActive: { backgroundColor: '#3b82f6' },
  categoryChipText: { color: '#4b5563', fontWeight: '600' },
  categoryChipTextActive: { color: '#fff' },

  contentPadding: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#111' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  serviceCard: { width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  serviceIcon: { fontSize: 32, marginBottom: 12 },
  serviceTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  serviceDesc: { fontSize: 12, color: '#6b7280', marginBottom: 8, height: 32 },
  serviceStats: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },
  statsText: { fontSize: 12, color: '#9ca3af' },

  // Provider List Styles
  backBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 8,
    marginLeft: -8 
  },
  backBtnText: { 
    color: '#3b82f6', 
    fontSize: 16, 
    fontWeight: '600',
    marginLeft: 4 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111', 
    flex: 1, 
    textAlign: 'center' 
  },
  
  subtitle: { color: '#6b7280', marginBottom: 16 },
  providerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  providerHeader: { flexDirection: 'row', marginBottom: 12 },
  providerInfo: { marginLeft: 12, flex: 1 },
  providerName: { fontSize: 16, fontWeight: '700' },
  verifiedBadge: { color: '#3b82f6', fontWeight: 'bold' },
  providerRole: { color: '#6b7280', fontSize: 14 },
  providerLoc: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  providerMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: '#f9fafb', padding: 8, borderRadius: 8 },
  rating: { fontWeight: '600', color: '#f59e0b' },
  rate: { fontWeight: '700', color: '#10b981' },
  actionRow: { flexDirection: 'row', gap: 10 },
  btnPrimary: { backgroundColor: '#3b82f6', padding: 10, borderRadius: 8, alignItems: 'center', flex: 1 },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
  btnOutline: { borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, alignItems: 'center', flex: 1 },
  btnOutlineText: { color: '#374151', fontWeight: '600' },

  // Profile Styles
  profileHeader: { backgroundColor: '#fff', padding: 20, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowOpacity: 0.05, elevation: 2 },
  absBackBtn: { position: 'absolute', top: 16, left: 16, zIndex: 10 },
  profileNameLarge: { fontSize: 24, fontWeight: 'bold' },
  profileTitle: { color: '#3b82f6', fontSize: 16, marginBottom: 16 },
  profileStatsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statVal: { fontWeight: 'bold', fontSize: 16 },
  statLabel: { color: '#9ca3af', fontSize: 12 },
  profileActions: { flexDirection: 'row', width: '100%' },
  section: { padding: 20, backgroundColor: '#fff', marginTop: 12 },
  sectionHeader: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  bodyText: { color: '#4b5563', lineHeight: 22 },
  listItem: { color: '#4b5563', marginBottom: 6 },
  portfolioItem: { width: 120, height: 120, borderRadius: 12, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  reviewItem: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 16 },
  reviewAuthor: { fontWeight: '600' },
  reviewDate: { color: '#9ca3af', fontSize: 12 },
  reviewText: { color: '#4b5563', marginTop: 4 },

  // Chat Styles
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatContainer: { height: '80%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  chatName: { fontWeight: 'bold', fontSize: 16 },
  chatStatus: { color: '#10b981', fontSize: 12 },
  closeBtn: { fontSize: 24, color: '#9ca3af', padding: 4 },
  messagesArea: { flex: 1, padding: 16 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
  sentBubble: { backgroundColor: '#3b82f6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  receivedBubble: { backgroundColor: '#f3f4f6', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  sentText: { color: '#fff' },
  receivedText: { color: '#1f2937' },
  typingIndicator: { fontSize: 12, color: '#9ca3af', marginLeft: 8, marginBottom: 10, fontStyle: 'italic' },
  quickReplies: { maxHeight: 50, paddingHorizontal: 16, marginBottom: 8 },
  chip: { backgroundColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, height: 32 },
  chipText: { fontSize: 12, color: '#4b5563' },
  inputArea: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row' },
  chatInput: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' }
});