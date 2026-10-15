import {
  useEffect,
  useState,
} from 'react';

import type {
  Session,
  User,
} from '@supabase/supabase-js';

import { supabase } from './supabase';


// ============================================
// TYPES
// ============================================

export type UserRole =
  | 'student'
  | 'teacher'
  | 'admin';

export type SignUpProfile = {
  full_name: string;
  role: 'student' | 'teacher';
};

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};


// ============================================
// GLOBAL STATE
// ============================================

let globalSession: Session | null = null;

let globalUser: User | null = null;

let globalLoading = true;


// ============================================
// LISTENERS
// ============================================

const listeners = new Set<
  () => void
>();


function notify() {

  console.log(
    'AUTH: NOTIFYING LISTENERS:',
    listeners.size
  );

  listeners.forEach(
    (listener) => listener()
  );
}


// ============================================
// SET AUTH
// ============================================

export function setAuth(
  session: Session | null
) {

  globalSession = session;

  globalUser =
    session?.user ?? null;

  globalLoading = false;

  console.log(
    'SET AUTH:',
    globalUser?.email ?? 'NO USER'
  );

  notify();
}


// ============================================
// USE AUTH
// ============================================

export function useAuth(): AuthState {

  const [
    state,
    setState,
  ] = useState({

    session:
      globalSession,

    user:
      globalUser,

    loading:
      globalLoading,

  });


  useEffect(() => {

    function update() {

      console.log(
        'USE AUTH: STATE UPDATED'
      );


      setState({

        session:
          globalSession,

        user:
          globalUser,

        loading:
          globalLoading,

      });
    }


    listeners.add(
      update
    );


    // Get latest state immediately

    update();


    return () => {

      listeners.delete(
        update
      );

    };

  }, []);


  return state;
}


// ============================================
// INITIALIZE AUTH
// ============================================

export async function initializeAuth() {

  console.log(
    '=========================='
  );

  console.log(
    'INITIALIZING AUTH'
  );


  try {

    const {
      data,
      error,
    } =
      await supabase.auth.getSession();


    if (error) {

      console.log(
        'AUTH ERROR:',
        error.message
      );


      setAuth(null);

      return;
    }


    console.log(
      'SESSION:',
      data.session
        ? 'FOUND'
        : 'NONE'
    );


    console.log(
      'USER:',
      data.session?.user?.email ??
        'NONE'
    );


    setAuth(
      data.session ?? null
    );


    console.log(
      'AUTH INITIALIZED'
    );


  } catch (error: any) {

    console.log(
      'AUTH EXCEPTION:',
      error?.message
    );


    setAuth(null);

  }
}


// ============================================
// SIGN UP
// ============================================

export async function signUp(
  email: string,
  password: string,
  profile: SignUpProfile
) {

  console.log(
    'SIGN UP STARTED'
  );


  console.log(
    'SIGN UP EMAIL:',
    email
  );


  console.log(
    'SIGN UP NAME:',
    profile.full_name
  );


  console.log(
    'SIGN UP ROLE:',
    profile.role
  );


  try {

    // ----------------------------------------
    // CREATE SUPABASE AUTH USER
    // ----------------------------------------

    const {
      data,
      error,
    } =
      await supabase.auth.signUp({

        email,

        password,

        options: {

          data: {

            full_name:
              profile.full_name,

            role:
              profile.role,

          },

        },

      });


    if (error) {

      console.log(
        'SIGN UP ERROR:',
        error.message
      );


      return {

        data,

        error,

      };
    }


    // ----------------------------------------
    // CHECK USER
    // ----------------------------------------

    if (!data.user) {

      console.log(
        'SIGN UP ERROR: USER NOT CREATED'
      );


      return {

        data,

        error:
          new Error(
            'User account was not created.'
          ),

      };
    }


    console.log(
      'AUTH USER CREATED:',
      data.user.id
    );


    // ----------------------------------------
    // CREATE PROFILE
    // ----------------------------------------

    const {
      error: profileError,
    } =
      await supabase
        .from('profiles')
        .upsert(

          {

            id:
              data.user.id,

            email:
              email.trim(),

            full_name:
              profile.full_name.trim(),

            role:
              profile.role,

          },

          {

            onConflict:
              'id',

          }

        );


    if (profileError) {

      console.log(
        'PROFILE CREATION ERROR:',
        profileError.message
      );


      return {

        data,

        error:
          profileError,

      };
    }


    console.log(
      'PROFILE CREATED SUCCESSFULLY'
    );


    console.log(
      'PROFILE NAME:',
      profile.full_name
    );


    console.log(
      'PROFILE ROLE:',
      profile.role
    );


    // ----------------------------------------
    // SET SESSION IF AVAILABLE
    // ----------------------------------------

    if (data.session) {

      setAuth(
        data.session
      );

    }


    console.log(
      'SIGN UP SUCCESS'
    );


    return {

      data,

      error: null,

    };


  } catch (error: any) {

    console.log(
      'SIGN UP EXCEPTION:',
      error?.message
    );


    return {

      data: {

        user: null,

        session: null,

      },

      error,

    };

  }
}


// ============================================
// SIGN IN
// ============================================

export async function signIn(
  email: string,
  password: string
) {

  console.log(
    'LOGIN STARTED'
  );


  console.log(
    'EMAIL:',
    email
  );


  try {

    const {
      data,
      error,
    } =
      await supabase.auth
        .signInWithPassword({

          email,

          password,

        });


    if (error) {

      console.log(
        'LOGIN ERROR:',
        error.message
      );


      setAuth(null);


      return {

        data,

        error,

      };

    }


    console.log(
      'LOGIN SUCCESS'
    );


    console.log(
      'USER:',
      data.user?.email
    );


    console.log(
      'USER ID:',
      data.user?.id
    );


    console.log(
      'SESSION EXISTS:',
      !!data.session
    );


    if (data.session) {

      setAuth(
        data.session
      );

    }


    return {

      data,

      error: null,

    };


  } catch (error: any) {

    console.log(
      'LOGIN EXCEPTION:',
      error?.message
    );


    setAuth(null);


    return {

      data: {

        user: null,

        session: null,

      },

      error,

    };

  }
}


// ============================================
// SIGN OUT
// ============================================

export async function signOut() {

  console.log(
    '=========================='
  );

  console.log(
    'LOGOUT STARTED'
  );


  try {

    // ----------------------------------------
    // SIGN OUT FROM SUPABASE FIRST
    // ----------------------------------------

    console.log(
      'SIGNING OUT FROM SUPABASE...'
    );


    const {
      error,
    } =
      await supabase.auth.signOut();


    // ----------------------------------------
    // CHECK SUPABASE ERROR
    // ----------------------------------------

    if (error) {

      console.log(
        'SUPABASE LOGOUT ERROR:',
        error.message
      );


      return {

        error,

      };

    }


    // ----------------------------------------
    // CLEAR LOCAL AUTH STATE
    // ----------------------------------------

    console.log(
      'SUPABASE LOGOUT SUCCESS'
    );


    setAuth(null);


    console.log(
      'LOCAL AUTH STATE CLEARED'
    );


    console.log(
      'LOGOUT SUCCESS'
    );


    return {

      error: null,

    };


  } catch (error: any) {

    console.log(
      'LOGOUT EXCEPTION:',
      error?.message
    );


    // Make sure local state is cleared
    // if an unexpected exception occurs.

    setAuth(null);


    return {

      error,

    };

  }
}


// ============================================
// AUTH LISTENER
// ============================================

export function subscribeAuth() {

  const {
    data,
  } =
    supabase.auth.onAuthStateChange(

      (
        event,
        session
      ) => {

        console.log(
          'AUTH EVENT:',
          event
        );


        console.log(
          'AUTH USER:',
          session?.user?.email ??
            'NONE'
        );


        setAuth(
          session ?? null
        );

      }

    );


  return data;
}