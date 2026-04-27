import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login = () => {
  const [role, setRole] = useState('Doctor');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      login({
        name: role === 'Doctor' ? 'Dr. Gregory House' : role === 'Assistant' ? 'Lisa Cuddy' : 'John Patient',
        role,
        email: 'user@smartmed.com'
      });
      setLoading(false);
      navigate('/');
    }, 1500);
  };

  const roles = [
    { name: 'Doctor', icon: User },
    { name: 'Assistant', icon: User },
    { name: 'Patient', icon: User }
  ];

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Welcome Back</h2>
        <p className="text-slate-500 mt-2">Please enter your details to sign in.</p>
      </div>

      <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-2xl">
        {roles.map((r) => (
          <button
            key={r.name}
            onClick={() => setRole(r.name)}
            className={`flex-1 flex items-center justify-center py-2 rounded-xl text-sm font-semibold transition-all ${
              role === r.name 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <Input 
          label="Email Address" 
          placeholder="admin@smartmed.com" 
          icon={Mail} 
          type="email"
          required
        />
        <Input 
          label="Password" 
          placeholder="••••••••" 
          icon={Lock} 
          type="password"
          required
        />
        
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20" />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>
          <a href="#" className="text-sm font-semibold text-primary hover:underline">Forgot password?</a>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          isLoading={loading}
          icon={ArrowRight}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          Don't have an account? <Link to="/auth/signup" className="font-bold text-primary hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
