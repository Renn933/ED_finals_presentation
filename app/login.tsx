import {
  Link,
} from 'expo-router';

import {
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  signIn,
} from '@/lib/auth';

export default function LoginScreen() {
  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  async function handleLogin() {
    console.log(
      '=========================='
    );

    console.log(
      'LOGIN BUTTON PRESSED'
    );

    console.log(
      'EMAIL:',
      email
    );

    setError('');

    /*
     * ============================
     * VALIDATION
     * ============================
     */
    if (!email.trim()) {
      setError(
        'Please enter your email.'
      );
      return;
    }

    if (!password) {
      setError(
        'Please enter your password.'
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * ============================
       * SUPABASE LOGIN
       * ============================
       */
      const result =
        await signIn(
          email.trim(),
          password
        );

      console.log(
        'SIGN IN RESULT:',
        result
      );

      if (result.error) {
        console.log(
          'LOGIN FAILED:',
          result.error.message
        );

        setError(
          result.error.message
        );

        return;
      }

      const loggedInUser =
        result.data?.user;

      const session =
        result.data?.session;

      if (!loggedInUser) {
        setError(
          'Login succeeded, but no user was returned.'
        );

        return;
      }

      if (!session) {
        setError(
          'Login succeeded, but no session was created.'
        );

        return;
      }

      console.log(
        'LOGIN SUCCESS'
      );

      console.log(
        'USER:',
        loggedInUser.email
      );

      console.log(
        'SESSION EXISTS:',
        !!session
      );

      /*
       * DO NOT manually navigate here.
       *
       * app/_layout.tsx will detect the
       * authenticated user, load the role,
       * and redirect automatically.
       */
    } catch (error: any) {
      console.log(
        'LOGIN SCREEN ERROR:',
        error?.message
      );

      setError(
        error?.message ??
          'Something went wrong while logging in.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.container
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={styles.card}
          >
            <Text
              style={styles.logo}
            >
              QR-ATT
            </Text>

            <Text
              style={styles.title}
            >
              Welcome Back
            </Text>

            <Text
              style={styles.subtitle}
            >
              Login to your account
            </Text>

            <View
              style={styles.form}
            >
              <Text
                style={styles.label}
              >
                Email
              </Text>

              <TextInput
                value={email}
                onChangeText={
                  setEmail
                }
                placeholder="Enter your email"
                placeholderTextColor="#999999"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
                style={styles.input}
              />

              <Text
                style={styles.label}
              >
                Password
              </Text>

              <TextInput
                value={password}
                onChangeText={
                  setPassword
                }
                placeholder="Enter your password"
                placeholderTextColor="#999999"
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
                style={styles.input}
              />

              {error ? (
                <View
                  style={styles.errorBox}
                >
                  <Text
                    style={styles.errorText}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={
                  handleLogin
                }
                disabled={loading}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed &&
                    styles.buttonPressed,
                  loading &&
                    styles.buttonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator
                    color="#ffffff"
                  />
                ) : (
                  <Text
                    style={
                      styles.loginButtonText
                    }
                  >
                    LOGIN
                  </Text>
                )}
              </Pressable>

              <View
                style={styles.registerRow}
              >
                <Text
                  style={
                    styles.registerText
                  }
                >
                  Don't have an account?
                </Text>

                <Link
                  href="/register"
                  asChild
                >
                  <Pressable>
                    <Text
                      style={
                        styles.registerLink
                      }
                    >
                      Register
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  keyboard: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  logo: {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 8,
  },

  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 30,
  },

  form: {
    width: '100%',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
  },

  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },

  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },

  loginButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  registerText: {
    color: '#6b7280',
    fontSize: 14,
  },

  registerLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 5,
  },
});