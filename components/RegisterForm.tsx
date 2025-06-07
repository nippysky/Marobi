// components/RegisterForm.tsx
"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { getCurrentUser, User } from '@/lib/session';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface RegisterFormProps {
  onSuccess: (user: User) => void;
  onSwitch: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitch }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // TODO: replace with real registration API
      const user = await getCurrentUser();
      if (!user) throw new Error('Registration failed');
      toast.success('Registered!');
      onSuccess(user);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Label htmlFor="reg-name">Full Name</Label>
      <Input
        id="reg-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Label htmlFor="reg-email">Email</Label>
      <Input
        id="reg-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Label htmlFor="reg-pass">Password</Label>
      <Input
        id="reg-pass"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Label htmlFor="reg-confirm">Confirm Password</Label>
      <Input
        id="reg-confirm"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Registering…' : 'Register'}
      </Button>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-green-600 hover:underline"
        >
          Log In
        </button>
      </p>
    </form>
  );
};
