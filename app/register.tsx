import { useState } from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
} from 'react-native';

import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
import { signUp } from '@/lib/auth';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(
        email.trim(),
        password,
        {
          full_name: fullName.trim(),
          role: role,
        }
      );

      if (authError) {
        setError(authError.message);
      } else if (data.session) {
        router.replace('/(tabs)');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios' ? 'padding' : 'height'
        }
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 0 : 20
        }
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Header title="QR Attendance" />
            </View>

            <Text style={styles.title}>
              Create Account
            </Text>

            <Text style={styles.subtitle}>
              Register to start recording attendance
            </Text>

            {success ? (
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>
                  Check your email!
                </Text>

                <Text style={styles.successText}>
                  We sent a confirmation link to {email}.
                  Click the link to verify your account,
                  then come back and sign in.
                </Text>

                <Link
                  href="/login"
                  style={styles.link}
                >
                  Back to Sign In
                </Link>
              </View>
            ) : (
              <View style={styles.form}>

                {/* FULL NAME */}
                <Text style={styles.label}>
                  Full Name
                </Text>

                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={
                    COLORS.greyBlue
                  }
                  autoCapitalize="words"
                  editable={!loading}
                />

                {/* ACCOUNT TYPE */}
                <Text style={styles.label}>
                  Account Type
                </Text>

                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'student' &&
                        styles.roleButtonActive,
                    ]}
                    onPress={() =>
                      setRole('student')
                    }
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        role === 'student' &&
                          styles.roleTextActive,
                      ]}
                    >
                      Student
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'teacher' &&
                        styles.roleButtonActive,
                    ]}
                    onPress={() =>
                      setRole('teacher')
                    }
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        role === 'teacher' &&
                          styles.roleTextActive,
                      ]}
                    >
                      Teacher
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* EMAIL */}
                <Text style={styles.label}>
                  Email
                </Text>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@school.edu"
                  placeholderTextColor={
                    COLORS.greyBlue
                  }
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />

                {/* PASSWORD */}
                <Text style={styles.label}>
                  Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={
                    COLORS.greyBlue
                  }
                  secureTextEntry
                  editable={!loading}
                />

                {/* CONFIRM PASSWORD */}
                <Text
                  style={[
                    styles.label,
                    styles.confirmLabel,
                  ]}
                >
                  Confirm Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={
                    COLORS.greyBlue
                  }
                  secureTextEntry
                  editable={!loading}
                />

                {error && (
                  <Text style={styles.error}>
                    {error}
                  </Text>
                )}

                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color={COLORS.green}
                    style={styles.loader}
                  />
                ) : (
                  <AppButton
                    theme="primary"
                    title="Sign Up"
                    icon="person-add-outline"
                    onPress={handleRegister}
                  />
                )}
              </View>
            )}

            {!success && (
              <Link
                href="/login"
                style={styles.link}
              >
                Already have an account? Sign In
              </Link>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  headerContainer: {
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'left',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.greyBlue,
    textAlign: 'left',
    marginBottom: 32,
  },

  form: {
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: 6,
    marginTop: 10,
  },

  /* Extra space before Confirm Password */
  confirmLabel: {
    marginTop: 24,
  },

  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.ink,
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  roleButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },

  roleButtonActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  roleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.greyBlue,
  },

  roleTextActive: {
    color: '#FFFFFF',
  },

  error: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: 'left',
    marginTop: 12,
    marginBottom: 4,
  },

  loader: {
    marginVertical: 16,
  },

  link: {
    fontSize: 14,
    color: COLORS.green,
    textAlign: 'center',
    fontWeight: '600',
  },

  successContainer: {
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },

  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
    textAlign: 'left',
  },

  successText: {
    fontSize: 14,
    color: COLORS.greyBlue,
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 16,
  },
});