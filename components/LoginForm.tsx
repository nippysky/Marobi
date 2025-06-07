// components/LoginForm.tsx
"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { getCurrentUser, User } from '@/lib/session';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  onSuccess: (user: User) => void;
  onSwitch: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: replace with real auth API
      const user = await getCurrentUser();
      if (!user) throw new Error('Invalid credentials');
      toast.success('Logged in!');
      onSuccess(user);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Label htmlFor="login-email">Email</Label>
      <Input
        id="login-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Label htmlFor="login-password">Password</Label>
      <Input
        id="login-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logging in…' : 'Log In'}
      </Button>

      <p className="text-center text-sm">
        Don’t have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-green-600 hover:underline"
        >
          Register
        </button>
      </p>
    </form>
  );
};


