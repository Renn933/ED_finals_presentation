import {
  Stack,
  usePathname,
  useRouter,
} from 'expo-router';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  Session,
  User,
} from '@supabase/supabase-js';

import {
  supabase,
} from '@/lib/supabase';

import {
  getProfile,
} from '@/lib/profiles';


export default function RootLayout() {

  const router =
    useRouter();

  const pathname =
    usePathname();


  // ========================================
  // AUTH STATE
  // ========================================

  const [
    session,
    setSession,
  ] =
    useState<Session | null>(
      null
    );


  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null
    );


  const [
    authLoading,
    setAuthLoading,
  ] =
    useState(true);


  // ========================================
  // ROLE
  // ========================================

  const [
    role,
    setRole,
  ] =
    useState<string | null>(
      null
    );


  const [
    roleLoading,
    setRoleLoading,
  ] =
    useState(false);


  // ========================================
  // INITIALIZE SUPABASE AUTH
  // ========================================

  useEffect(() => {

    let mounted = true;


    async function initialize() {

      console.log(
        'ROOT: INITIALIZING AUTH'
      );


      try {

        const {
          data,
          error,
        } =
          await supabase.auth
            .getSession();


        if (!mounted) {
          return;
        }


        if (error) {

          console.log(
            'ROOT: AUTH ERROR:',
            error.message
          );


          setSession(null);

          setUser(null);

          setAuthLoading(false);

          return;
        }


        console.log(
          'ROOT: SESSION:',
          data.session
            ? 'FOUND'
            : 'NONE'
        );


        console.log(
          'ROOT: USER:',
          data.session?.user?.email ??
            'NONE'
        );


        setSession(
          data.session
        );


        setUser(
          data.session?.user ??
            null
        );


        setAuthLoading(false);


        console.log(
          'ROOT: AUTH READY'
        );

      } catch (error: any) {

        console.log(
          'ROOT: AUTH EXCEPTION:',
          error?.message
        );


        if (mounted) {

          setSession(null);

          setUser(null);

          setAuthLoading(false);

        }

      }
    }


    initialize();


    // ======================================
    // AUTH STATE LISTENER
    // ======================================

    const {
      data:
        authListener,
    } =
      supabase.auth
        .onAuthStateChange(
          (
            event,
            newSession
          ) => {

            console.log(
              'ROOT: AUTH EVENT:',
              event
            );


            console.log(
              'ROOT: AUTH USER:',
              newSession?.user?.email ??
                'NONE'
            );


            setSession(
              newSession
            );


            setUser(
              newSession?.user ??
                null
            );


            setAuthLoading(
              false
            );

          }
        );


    return () => {

      mounted = false;

      authListener.subscription
        .unsubscribe();

    };

  }, []);


  // ========================================
  // LOAD USER PROFILE
  // ========================================

  useEffect(() => {

    let mounted = true;


    async function loadProfile() {

      // ------------------------------------
      // NO USER
      // ------------------------------------

      if (!user) {

        console.log(
          'ROOT: NO USER'
        );


        setRole(null);

        setRoleLoading(false);

        return;
      }


      // ------------------------------------
      // USER EXISTS
      // ------------------------------------

      console.log(
        'ROOT: LOADING PROFILE'
      );


      console.log(
        'ROOT: USER:',
        user.email
      );


      setRoleLoading(true);


      try {

        const result =
          await getProfile(
            user.id
          );


        if (!mounted) {
          return;
        }


        if (result.error) {

          console.log(
            'ROOT: PROFILE ERROR:',
            result.error.message
          );


          setRole(null);

          return;
        }


        if (!result.data) {

          console.log(
            'ROOT: PROFILE NOT FOUND'
          );


          setRole(null);

          return;
        }


        console.log(
          'ROOT: PROFILE FOUND'
        );


        console.log(
          'ROOT: ROLE:',
          result.data.role
        );


        setRole(
          result.data.role
        );

      } catch (error: any) {

        console.log(
          'ROOT: PROFILE EXCEPTION:',
          error?.message
        );


        if (mounted) {

          setRole(null);

        }

      } finally {

        if (mounted) {

          setRoleLoading(
            false
          );

        }

      }

    }


    loadProfile();


    return () => {

      mounted = false;

    };

  }, [user]);


  // ========================================
  // NAVIGATION
  // ========================================

  useEffect(() => {

    if (authLoading) {
      return;
    }


    if (roleLoading) {
      return;
    }


    console.log(
      'ROOT: NAVIGATION CHECK'
    );


    console.log(
      'ROOT: USER:',
      user?.email ?? 'NONE'
    );


    console.log(
      'ROOT: ROLE:',
      role ?? 'NONE'
    );


    console.log(
      'ROOT: PATH:',
      pathname
    );


    const isLogin =
      pathname === '/login';


    const isRegister =
      pathname === '/register';


    const isAuthPage =
      isLogin ||
      isRegister;


    // ======================================
    // USER IS NOT LOGGED IN
    // ======================================

    if (!user) {

      if (!isAuthPage) {

        console.log(
          'ROOT: REDIRECTING TO LOGIN'
        );


        router.replace(
          '/login'
        );

      }


      return;
    }


    // ======================================
    // USER LOGGED IN BUT ROLE NOT READY
    // ======================================

    if (!role) {

      console.log(
        'ROOT: WAITING FOR ROLE'
      );


      return;
    }


    // ======================================
    // USER IS ON LOGIN/REGISTER
    // ======================================

    if (isAuthPage) {

      console.log(
        'ROOT: REDIRECTING USER'
      );


      if (role === 'admin') {

        router.replace(
          '/(tabs)/admin'
        );

      } else if (
        role === 'teacher'
      ) {

        router.replace(
          '/(tabs)/teacher'
        );

      } else {

        router.replace(
          '/(tabs)'
        );

      }


      return;
    }

  }, [
    authLoading,
    roleLoading,
    user,
    role,
    pathname,
  ]);


  // ========================================
  // LOADING SCREEN
  // ========================================

  if (
    authLoading ||
    roleLoading
  ) {

    return (

      <View
        style={
          styles.loadingContainer
        }
      >

        <ActivityIndicator
          size="large"
        />


        <Text
          style={
            styles.loadingText
          }
        >
          Loading QR-ATT...
        </Text>

      </View>

    );

  }


  // ========================================
  // ROUTER
  // ========================================

  return (

    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >

      <Stack.Screen
        name="login"
      />

      <Stack.Screen
        name="register"
      />

      <Stack.Screen
        name="(tabs)"
      />

    </Stack>

  );

}


// ============================================
// STYLES
// ============================================

const styles =
  StyleSheet.create({

    loadingContainer: {

      flex: 1,

      justifyContent:
        'center',

      alignItems:
        'center',

      backgroundColor:
        '#ffffff',

    },


    loadingText: {

      marginTop: 12,

      fontSize: 16,

      color:
        '#555555',

    },

  });