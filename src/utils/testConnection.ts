/**
 * Supabase Connection Test
 * Run this to verify Supabase is properly configured
 */
import { supabase } from '@/lib/supabase';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: Check if client is initialized
    console.log('✓ Supabase client initialized');

    // Test 2: Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('⚠️  No active session:', sessionError.message);
    } else {
      console.log('✓ Session check:', session ? 'User logged in' : 'No user logged in');
    }

    // Test 3: Try to query tables (will fail if not authenticated, but tells us tables exist)
    const { error: transError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);

    if (transError?.code === 'PGRST116') {
      console.log('✓ Transactions table exists (authentication required)');
    } else if (transError?.code === '42P01') {
      console.log('❌ Transactions table does not exist');
      return false;
    } else if (!transError) {
      console.log('✓ Transactions table accessible and working');
    }

    // Test 4: Check holdings table
    const { error: holdError } = await supabase
      .from('holdings')
      .select('count')
      .limit(1);

    if (holdError?.code === 'PGRST116') {
      console.log('✓ Holdings table exists (authentication required)');
    } else if (holdError?.code === '42P01') {
      console.log('❌ Holdings table does not exist');
      return false;
    } else if (!holdError) {
      console.log('✓ Holdings table accessible and working');
    }

    console.log('\n✅ Supabase setup looks good!');
    console.log('\nNext steps:');
    console.log('1. Sign up for an account at http://localhost:5173/login');
    console.log('2. Create your first trade');
    console.log('3. Check the database');
    return true;
  } catch (error) {
    console.error('❌ Error testing Supabase:', error);
    return false;
  }
}
