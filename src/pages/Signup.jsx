import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Signup = () => {
  const [role, setRole] = useState('Doctor');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      login({
        name: e.target.fullName.value,
        role,
        email: e.target.email.value
      });
      setLoading(false);
      navigate('/');
    }, 1500);
  };

  const roles = [
    { name: 'Doctor', icon: ShieldCheck },
    { name: 'Assistant', icon: Briefcase },
    { name: 'Patient', icon: User }
  ];

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Create Account</h2>
        <p className="text-slate-500 mt-2">Join SmartMed to manage your healthcare facility.</p>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-2xl">
        {roles.map((r) => (
          <button
            key={r.name}
            onClick={() => setRole(r.name)}
            type="button"
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl text-xs font-bold transition-all gap-1 ${
              role === r.name 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <r.icon size={16} />
            {r.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input 
          id="fullName"
          label="Full Name" 
          placeholder="e.g. John Doe" 
          icon={User} 
          required
        />
        <Input 
          id="email"
          label="Email Address" 
          placeholder="admin@smartmed.com" 
          icon={Mail} 
          type="email"
          required
        />
        <Input 
          id="password"
          label="Password" 
          placeholder="••••••••" 
          icon={Lock} 
          type="password"
          required
        />
        
        {role === 'Doctor' && (
          <Input 
            id="specialty"
            label="Medical Specialty" 
            placeholder="e.g. Cardiology" 
            icon={ShieldCheck}
          />
        )}

        <div className="pt-2 text-[11px] text-slate-400 text-center px-4 leading-relaxed">
          By signing up, you agree to our <a href="#" className="font-bold text-slate-600 hover:underline">Terms of Service</a> and <a href="#" className="font-bold text-slate-600 hover:underline">Privacy Policy</a>.
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          isLoading={loading}
          icon={ArrowRight}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          Already have an account? <Link to="/auth/login" className="font-bold text-primary hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
