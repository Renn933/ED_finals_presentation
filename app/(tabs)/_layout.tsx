import {
  Tabs,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  View,
} from 'react-native';

import {
  supabase,
} from '@/lib/supabase';

import {
  getProfile,
} from '@/lib/profiles';


export default function TabsLayout() {

  const [
    userId,
    setUserId,
  ] =
    useState<string | null>(
      null
    );


  const [
    role,
    setRole,
  ] =
    useState<string | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  // ========================================
  // LOAD CURRENT USER
  // ========================================

  useEffect(() => {

    let mounted = true;


    async function loadUser() {

      console.log(
        'TABS: Loading authenticated user'
      );


      try {

        const {
          data,
          error,
        } =
          await supabase.auth.getUser();


        if (!mounted) {
          return;
        }


        if (error) {

          console.log(
            'TABS: USER ERROR:',
            error.message
          );


          setUserId(null);

          setRole(null);

          setLoading(false);

          return;
        }


        if (!data.user) {

          console.log(
            'TABS: NO USER'
          );


          setUserId(null);

          setRole(null);

          setLoading(false);

          return;
        }


        console.log(
          'TABS: USER:',
          data.user.email
        );


        setUserId(
          data.user.id
        );


        // ----------------------------------
        // LOAD PROFILE
        // ----------------------------------

        console.log(
          'TABS: Loading profile'
        );


        const profileResult =
          await getProfile(
            data.user.id
          );


        if (!mounted) {
          return;
        }


        if (
          profileResult.error
        ) {

          console.log(
            'TABS: PROFILE ERROR:',
            profileResult.error.message
          );


          setRole(null);

        } else if (
          profileResult.data
        ) {

          console.log(
            'TABS: ROLE:',
            profileResult.data.role
          );


          setRole(
            profileResult.data.role
          );

        } else {

          console.log(
            'TABS: PROFILE NOT FOUND'
          );


          setRole(null);

        }

      } catch (error: any) {

        console.log(
          'TABS: EXCEPTION:',
          error?.message
        );


        if (mounted) {

          setUserId(null);

          setRole(null);

        }

      } finally {

        if (mounted) {

          setLoading(false);

        }

      }

    }


    loadUser();


    // ======================================
    // AUTH LISTENER
    // ======================================

    const {
      data:
        authListener,
    } =
      supabase.auth
        .onAuthStateChange(
          async (
            event,
            session
          ) => {

            console.log(
              'TABS: AUTH EVENT:',
              event
            );


            if (
              !session?.user
            ) {

              setUserId(null);

              setRole(null);

              setLoading(false);

              return;
            }


            console.log(
              'TABS: AUTH USER:',
              session.user.email
            );


            setUserId(
              session.user.id
            );


            try {

              const profileResult =
                await getProfile(
                  session.user.id
                );


              if (!mounted) {
                return;
              }


              if (
                profileResult.data
              ) {

                setRole(
                  profileResult.data.role
                );

              } else {

                setRole(null);

              }

            } catch (error) {

              console.log(
                'TABS: AUTH PROFILE ERROR:',
                error
              );

              setRole(null);

            }

            setLoading(false);

          }
        );


    return () => {

      mounted = false;

      authListener.subscription
        .unsubscribe();

    };

  }, []);


  // ========================================
  // LOADING
  // ========================================

  if (loading) {

    return (

      <View
        style={{
          flex: 1,

          justifyContent:
            'center',

          alignItems:
            'center',

          backgroundColor:
            '#ffffff',
        }}
      >

        <ActivityIndicator
          size="large"
          color="#6c48ac"
        />

      </View>

    );

  }


  // ========================================
  // TABS
  // ========================================

  return (

    <Tabs
      screenOptions={{

        headerShown: false,

        tabBarActiveTintColor:
          '#6c48ac',

        tabBarInactiveTintColor:
          '#888888',

      }}
    >

      {/* ================================
          STUDENT HOME
      ================================= */}

      <Tabs.Screen

        name="index"

        options={{

          title: 'Home',

          href:
            role === 'student'
              ? '/(tabs)'
              : null,

          tabBarIcon: ({
            color,
            size,
          }) => (

            <Ionicons
              name="home-outline"
              color={color}
              size={size}
            />

          ),

        }}

      />


      {/* ================================
          STUDENT SCAN
      ================================= */}

      <Tabs.Screen

        name="scan"

        options={{

          title: 'Scan',

          href:
            role === 'student'
              ? '/(tabs)/scan'
              : null,

          tabBarIcon: ({
            color,
            size,
          }) => (

            <Ionicons
              name="qr-code-outline"
              color={color}
              size={size}
            />

          ),

        }}

      />


      {/* ================================
          STUDENT HISTORY
      ================================= */}

      <Tabs.Screen

        name="history"

        options={{

          title: 'History',

          href:
            role === 'student'
              ? '/(tabs)/history'
              : null,

          tabBarIcon: ({
            color,
            size,
          }) => (

            <Ionicons
              name="time-outline"
              color={color}
              size={size}
            />

          ),

        }}

      />


      {/* ================================
          STUDENT PROFILE
      ================================= */}

      <Tabs.Screen

        name="profile"

        options={{

          title: 'Profile',

          href:
            role === 'student'
              ? '/(tabs)/profile'
              : null,

          tabBarIcon: ({
            color,
            size,
          }) => (

            <Ionicons
              name="person-outline"
              color={color}
              size={size}
            />

          ),

        }}

      />


      {/* ================================
          TEACHER
      ================================= */}

      <Tabs.Screen

        name="teacher"

        options={{

          title: 'Teacher',

          href:
            role === 'teacher'
              ? '/(tabs)/teacher'
              : null,

          tabBarIcon: ({
            color,
            size,
          }) => (

            <Ionicons
              name="school-outline"
              color={color}
              size={size}
            />

          ),

        }}

      />


      {/* ================================
          ADMIN
      ================================= */}

      <Tabs.Screen

        name="admin"

        options={{

          title: 'Admin',

          href:
            role === 'admin'
              ? '/(tabs)/admin'
              : null,

          tabBarIcon: ({
            color,
            size,
          }) => (

            <Ionicons
              name="settings-outline"
              color={color}
              size={size}
            />

          ),

        }}

      />

    </Tabs>

  );

}