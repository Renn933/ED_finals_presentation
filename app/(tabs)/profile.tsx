import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  signOut,
} from '@/lib/auth';

import {
  supabase,
} from '@/lib/supabase';

import {
  getProfile,
} from '@/lib/profiles';

type ProfileData = {
  id: string;
  email: string;
  full_name: string | null;
  role:
    | 'student'
    | 'teacher'
    | 'admin';
};

export default function ProfileScreen() {

  const router =
    useRouter();

  const [
    profile,
    setProfile,
  ] = useState<ProfileData | null>(
    null
  );

  const [
    userEmail,
    setUserEmail,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);


  // ============================================
  // LOAD PROFILE
  // ============================================

  async function loadProfile() {

    try {

      setLoading(true);

      console.log(
        'PROFILE: Loading authenticated user...'
      );

      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();


      if (userError) {

        console.log(
          'PROFILE: USER ERROR:',
          userError.message
        );

        setProfile(null);
        return;
      }


      if (!user) {

        console.log(
          'PROFILE: NO USER'
        );

        setProfile(null);
        return;
      }


      console.log(
        'PROFILE: USER:',
        user.email
      );


      setUserEmail(
        user.email ?? ''
      );


      // ========================================
      // GET PROFILE FROM DATABASE
      // ========================================

      const result =
        await getProfile(
          user.id
        );


      if (result.error) {

        console.log(
          'PROFILE: DATABASE ERROR:',
          result.error.message
        );

        setProfile(null);
        return;
      }


      if (!result.data) {

        console.log(
          'PROFILE: PROFILE NOT FOUND'
        );

        setProfile(null);
        return;
      }


      console.log(
        'PROFILE: PROFILE LOADED:',
        result.data
      );


      setProfile(
        result.data
      );

    } catch (error: any) {

      console.log(
        'PROFILE: EXCEPTION:',
        error?.message
      );

      setProfile(null);

    } finally {

      setLoading(false);

    }
  }


  // ============================================
  // LOAD WHEN SCREEN OPENS
  // ============================================

  useFocusEffect(
    useCallback(() => {

      loadProfile();

    }, [])
  );


  // ============================================
  // LOGOUT
  // ============================================

  async function handleLogout() {

    if (loggingOut) {
      return;
    }


    try {

      console.log(
        'LOGOUT BUTTON PRESSED'
      );


      setLoggingOut(true);


      const result =
        await signOut();


      if (result.error) {

        console.log(
          'Logout error:',
          result.error.message
        );


        setLoggingOut(false);


        Alert.alert(
          'Logout Error',
          result.error.message
        );


        return;
      }


      console.log(
        'LOGOUT COMPLETED'
      );

    } catch (error: any) {

      console.log(
        'Logout exception:',
        error?.message
      );


      setLoggingOut(false);


      Alert.alert(
        'Logout Error',
        error?.message ??
          'Unable to logout.'
      );
    }
  }


  // ============================================
  // LOADING
  // ============================================

  if (loading) {

    return (
      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.center}
        >

          <ActivityIndicator
            size="large"
            color="#2563eb"
          />

          <Text
            style={styles.loadingText}
          >
            Loading profile...
          </Text>

        </View>

      </SafeAreaView>
    );
  }


  // ============================================
  // PROFILE VALUES
  // ============================================

  const fullName =
    profile?.full_name ??
    'User';


  const email =
    profile?.email ??
    userEmail ??
    '';


  const role =
    profile?.role ??
    'student';


  // ============================================
  // PROFILE SCREEN
  // ============================================

  return (
    <SafeAreaView
      style={styles.container}
    >

      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >

        {/* ================================== */}
        {/* PROFILE HEADER */}
        {/* ================================== */}

        <View
          style={styles.header}
        >

          <View
            style={styles.avatar}
          >

            <Ionicons
              name="person"
              size={48}
              color="#2563eb"
            />

          </View>


          <Text
            style={styles.name}
          >
            {fullName}
          </Text>


          <Text
            style={styles.role}
          >
            {role.toUpperCase()}
          </Text>

        </View>


        {/* ================================== */}
        {/* PERSONAL INFORMATION */}
        {/* ================================== */}

        <View
          style={styles.card}
        >

          <Text
            style={styles.cardTitle}
          >
            Personal Information
          </Text>


          {/* FULL NAME */}

          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.label}
            >
              Full Name
            </Text>

            <Text
              style={styles.value}
            >
              {fullName}
            </Text>

          </View>


          <View
            style={styles.divider}
          />


          {/* EMAIL */}

          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.label}
            >
              Email
            </Text>

            <Text
              style={styles.value}
            >
              {email}
            </Text>

          </View>


          <View
            style={styles.divider}
          />


          {/* ACCOUNT TYPE */}

          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.label}
            >
              Account Type
            </Text>

            <Text
              style={[
                styles.value,
                styles.roleValue,
              ]}
            >
              {role.toUpperCase()}
            </Text>

          </View>

        </View>


        {/* ================================== */}
        {/* LOGOUT */}
        {/* ================================== */}

        <Pressable
          style={[
            styles.logoutButton,
            loggingOut &&
              styles.disabledButton,
          ]}
          onPress={
            handleLogout
          }
          disabled={loggingOut}
        >

          {loggingOut ? (

            <>

              <ActivityIndicator
                color="#fff"
                size="small"
              />

              <Text
                style={styles.logoutText}
              >
                LOGGING OUT...
              </Text>

            </>

          ) : (

            <>

              <Ionicons
                name="log-out-outline"
                size={22}
                color="#fff"
              />

              <Text
                style={styles.logoutText}
              >
                LOGOUT
              </Text>

            </>

          )}

        </Pressable>

      </ScrollView>

    </SafeAreaView>
  );
}


// ============================================
// STYLES
// ============================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        '#f5f7fb',
    },


    content: {
      padding: 16,
      paddingBottom: 40,
    },


    center: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#f5f7fb',
    },


    loadingText: {
      marginTop: 12,
      color: '#64748b',
      fontSize: 15,
    },


    // ========================================
    // HEADER
    // ========================================

    header: {
      backgroundColor:
        '#2563eb',

      alignItems:
        'center',

      paddingTop: 30,

      paddingBottom: 30,

      borderRadius: 18,

      marginBottom: 18,
    },


    avatar: {
      width: 90,

      height: 90,

      borderRadius: 45,

      backgroundColor:
        '#ffffff',

      justifyContent:
        'center',

      alignItems:
        'center',

      marginBottom: 14,
    },


    name: {
      color: '#ffffff',

      fontSize: 26,

      fontWeight: '800',

      textAlign: 'center',
    },


    role: {
      color: '#dbeafe',

      fontSize: 14,

      fontWeight: '700',

      marginTop: 6,
    },


    // ========================================
    // CARD
    // ========================================

    card: {
      backgroundColor:
        '#ffffff',

      borderRadius: 18,

      padding: 22,

      marginBottom: 18,

      elevation: 3,

      shadowColor:
        '#000000',

      shadowOpacity: 0.08,

      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 3,
      },
    },


    cardTitle: {
      fontSize: 22,

      fontWeight: '800',

      color: '#111827',

      marginBottom: 22,
    },


    // ========================================
    // INFORMATION
    // ========================================

    infoRow: {
      paddingVertical: 10,
    },


    label: {
      fontSize: 14,

      color: '#64748b',

      marginBottom: 7,
    },


    value: {
      fontSize: 17,

      fontWeight: '600',

      color: '#111827',
    },


    roleValue: {
      color: '#2563eb',
    },


    divider: {
      height: 1,

      backgroundColor:
        '#e5e7eb',

      marginVertical: 4,
    },


    // ========================================
    // LOGOUT
    // ========================================

    logoutButton: {
      minHeight: 58,

      backgroundColor:
        '#dc2626',

      borderRadius: 12,

      flexDirection: 'row',

      justifyContent:
        'center',

      alignItems:
        'center',

      gap: 10,

      marginBottom: 20,
    },


    disabledButton: {
      opacity: 0.6,
    },


    logoutText: {
      color: '#ffffff',

      fontSize: 16,

      fontWeight: '800',
    },

  });