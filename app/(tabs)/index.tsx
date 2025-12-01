// app/index.tsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Animated, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './.././firebase';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function IndexPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  
  const [login, setLogin] = useState({ email: '', password: '' });
  const [signup, setSignup] = useState({ name: '', contact: '', email: '', location: '', password: '', password2: '' });
  const [msg, setMsg] = useState({ login: '', signup: '' });
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);

  const passwordInputRef = useRef<TextInput>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: tab === 'login' ? 0 : 1,
      duration: 300,
      useNativeDriver: false, 
    }).start();
  }, [tab]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '-50%']
  });

  async function handleLogin() {
    try {
      await signInWithEmailAndPassword(auth, login.email, login.password);
      setMsg(m => ({ ...m, login: 'Welcome back!' }));
      setTimeout(() => {
        router.replace('/(tabs)/feed');
      }, 700);
    } catch (e) {
      const err = e as any;
      setMsg(m => ({ ...m, login: err.message || 'Login failed' }));
    }
  }

  async function handleSignup() {
    if (signup.password !== signup.password2) {
      setMsg(m => ({ ...m, signup: 'Passwords do not match' })); return;
    }
    if (!signup.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setMsg(m => ({ ...m, signup: 'Enter a valid email' })); return;
    }
    if (signup.password.length < 8) {
      setMsg(m => ({ ...m, signup: 'Password must be at least 8 characters' })); return;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, signup.email, signup.password);
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: signup.name });
        }
        await setDoc(doc(db, "users", userCredential.user.uid), {
            name: signup.name,
            contactNumber: signup.contact,
            email: signup.email,
            location: signup.location,
            role: 'family',
            createdAt: new Date()
        });
      setMsg(m => ({ ...m, signup: 'Account created! Redirecting...' }));
      setTimeout(() => {
        router.replace('/service-intent');
      }, 400);
    } catch (e) {
        const err = e as any;
      setMsg(m => ({ ...m, signup: err.message || 'Signup failed' }));
    }
  }

  function resetSignupForm() {
    setSignup({ name: '', contact: '', email: '', location: '', password: '', password2: '' });
    setMsg(m => ({ ...m, signup: '' }));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#e5e7eb' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>ServiceSnap</Text>
              <Text style={styles.subtitle}>Log in or create a new account to get started.</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
                  onPress={() => setTab('login')}
                  accessibilityRole="tab">
                  <Text style={tab === 'login' ? styles.tabBtnTextActive : styles.tabBtnText}>Log in</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'signup' && styles.tabBtnActive]}
                  onPress={() => setTab('signup')}
                  accessibilityRole="tab">
                  <Text style={tab === 'signup' ? styles.tabBtnTextActive : styles.tabBtnText}>Sign up</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sceneContainer}>
                <Animated.View style={[styles.slidingTrack, { transform: [{ translateX }] }]}>
                  
                  {/* LOGIN */}
                  <View style={styles.page}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      autoCapitalize="none"
                      placeholder="E-mail"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      value={login.email}
                      onChangeText={text => setLogin(l => ({ ...l, email: text }))}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordField}>
                      <TextInput
                        ref={passwordInputRef}
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        placeholder="Password"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry={!showLoginPass}
                        value={login.password}
                        onChangeText={text => setLogin(l => ({ ...l, password: text }))}
                        returnKeyType="go"
                        onSubmitEditing={handleLogin}
                      />
                      <TouchableOpacity
                        style={styles.toggleBtn}
                        onPress={() => setShowLoginPass(s => !s)}
                      >
                        <Ionicons 
                          name={showLoginPass ? "eye-off" : "eye"} 
                          size={24} 
                          color="#9ca3af" 
                        />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
                      <Text style={styles.btnText}>Log in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert("Reset password functionality is not implemented in this demo.")}>
                      <Text style={styles.forgotText}>Forgot your password?</Text>
                    </TouchableOpacity>
                    {!!msg.login && <Text style={[styles.msg, styles.msgOk]}>{msg.login}</Text>}
                  </View>

                  {/* SIGNUP */}
                  <View style={styles.page}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Name"
                      placeholderTextColor="#9ca3af"
                      value={signup.name}
                      onChangeText={text => setSignup(f => ({ ...f, name: text }))}
                    />
                    <Text style={styles.label}>Contact Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Contact Number"
                      placeholderTextColor="#9ca3af"
                      keyboardType='numeric'
                      maxLength={11}
                      value={signup.contact}
                      onChangeText={text => {
                        const sanitized = text.replace (/[^0-9]/g, '');
                        setSignup (f => ({ ...f, contact: sanitized}));
                      }}   
                    />
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      value={signup.email}
                      onChangeText={text => setSignup(f => ({ ...f, email: text }))}
                    />
                    <Text style={styles.label}>Location</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Your City or Address"
                      placeholderTextColor="#9ca3af"
                      value={signup.location}
                      onChangeText={text => setSignup(f => ({ ...f, location: text }))}
                    />
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordField}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        placeholder="At least 8 characters"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry={!showSignupPass}
                        value={signup.password}
                        onChangeText={text => setSignup(f => ({ ...f, password: text }))}
                      />
                      <TouchableOpacity
                        style={styles.toggleBtn}
                        onPress={() => setShowSignupPass(s => !s)}
                      >
                        <Ionicons 
                          name={showSignupPass ? "eye-off" : "eye"} 
                          size={24} 
                          color="#9ca3af" 
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.label}>Confirm password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Repeat password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={true}
                      value={signup.password2}
                      onChangeText={text => setSignup(f => ({ ...f, password2: text }))}
                    />
                    <View style={styles.actions}>
                      <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]} onPress={handleSignup}>
                        <Text style={styles.btnText}>Create account</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.ghostBtn, { flex: 1, marginTop: 0 }]} onPress={resetSignupForm}>
                        <Text style={styles.btnText}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                    {!!msg.signup && <Text style={[styles.msg, styles.msgOk]}>{msg.signup}</Text>}
                  </View>

                </Animated.View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { color: '#4b5563', textAlign: 'center', fontSize: 16 },
  
  card: {
    backgroundColor: '#828283',
    borderRadius: 24, 
    padding: 24,
    shadowColor: "#000", 
    shadowOpacity: 0.15, 
    shadowRadius: 20, 
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  
  tabs: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tabBtn: { flex: 1, backgroundColor: '#334155', borderColor: '#475569', borderWidth: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabBtnText: { color: '#9aa2b1', fontWeight: '500' },
  tabBtnTextActive: { color: '#fff', fontWeight: '700' },
  
  sceneContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  slidingTrack: {
    flexDirection: 'row',
    width: '200%',
  },
  page: {
    width: '50%',
    paddingHorizontal: 2,
  },

  label: { fontSize: 14, color: '#f3f4f6', marginBottom: 6, fontWeight: '600', marginTop: 12 },
  input: { 
    backgroundColor: '#0f172a', 
    color: '#fff', 
    borderWidth: 1, 
    borderColor: '#4b5563', 
    borderRadius: 12, 
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16
  },
  passwordField: { position: 'relative', flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  toggleBtn: { position: 'absolute', right: 0, padding: 14, height: '100%', justifyContent: 'center' },
  
  actions: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 24, marginBottom: 8 },
  
  primaryBtn: { 
    backgroundColor: '#3b82f6', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 24,
    width: '100%' 
  },
  
  ghostBtn: { 
    borderColor: '#475569', 
    borderWidth: 1, 
    backgroundColor: 'transparent', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
  },
  
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  forgotText: { fontSize: 14, color: '#3b82f6', textDecorationLine: 'underline', marginBottom: 10, marginTop: 20, textAlign: 'center' },
  msg: { fontSize: 14, padding: 12, borderRadius: 10, marginTop: 16, overflow: 'hidden', textAlign: 'center' },
  msgOk: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981', color: '#d1fae5', borderWidth: 1 }
});