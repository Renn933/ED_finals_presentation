import { supabase } from './supabase';


// ============================================
// TYPES
// ============================================

export type UserRole =
  | 'student'
  | 'teacher'
  | 'admin';


export type Profile = {

  id: string;

  email: string;

  full_name: string | null;

  role: UserRole;

};


// ============================================
// GET PROFILE
// ============================================

export async function getProfile(
  userId: string
) {

  try {

    console.log(
      'GET PROFILE:',
      userId
    );


    const {
      data,
      error,
    } =
      await supabase
        .from('profiles')
        .select(
          'id,email,full_name,role'
        )
        .eq(
          'id',
          userId
        )
        .maybeSingle();


    if (error) {

      console.log(
        'GET PROFILE ERROR:',
        error.message
      );


      return {

        data: null,

        error,

      };
    }


    console.log(
      'GET PROFILE SUCCESS:',
      data
    );


    return {

      data:
        data as Profile | null,

      error: null,

    };

  } catch (error: any) {

    console.log(
      'GET PROFILE EXCEPTION:',
      error?.message
    );


    return {

      data: null,

      error,

    };
  }
}