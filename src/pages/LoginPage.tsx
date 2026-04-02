import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  user: any;
  loading: boolean;
  email: string;
  password: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    email: '',
    password: ''
  });
  const [isSignUp, setIsSignUp] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthState(prev => ({ ...prev, user, loading: false }));
        navigate('/');
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    checkUser();

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setAuthState(prev => ({ ...prev, user: session.user }));
        navigate('/');
      }
    });

    return () => subscription?.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState(prev => ({ ...prev, loading: true }));

    const { error } = await supabase.auth.signUp({
      email: authState.email,
      password: authState.password
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Account created! Check your email to confirm.',
        variant: 'default'
      });
      setAuthState(prev => ({ ...prev, email: '', password: '' }));
      setIsSignUp(false);
    }
    setAuthState(prev => ({ ...prev, loading: false }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState(prev => ({ ...prev, loading: true }));

    const { error } = await supabase.auth.signInWithPassword({
      email: authState.email,
      password: authState.password
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Signed in successfully!',
        variant: 'default'
      });
    }
    setAuthState(prev => ({ ...prev, loading: false }));
  };

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
          <CardDescription>
            {isSignUp
              ? 'Create a new account to start trading'
              : 'Sign in to your paper trading account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={authState.email}
              onChange={(e) => setAuthState(prev => ({ ...prev, email: e.target.value }))}
              disabled={authState.loading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={authState.password}
              onChange={(e) => setAuthState(prev => ({ ...prev, password: e.target.value }))}
              disabled={authState.loading}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={authState.loading}
            >
              {authState.loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          <Button
            variant="link"
            className="w-full mt-4"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={authState.loading}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
