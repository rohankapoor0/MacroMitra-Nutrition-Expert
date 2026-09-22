import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-32 py-12">
      {/* Hero Section */}
      <section className="flex flex-col xl:flex-row items-center gap-16 px-6 pt-12">
        <div className="flex-1 space-y-10">
          <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full">
            <span className="label-tier text-primary">Precision Nutrition</span>
          </div>
          <h1 className="display-lg tracking-tighter text-on-surface">
            Master Your<br/>Health with<br/>
            <span className="text-primary italic">Clinical Accuracy.</span>
          </h1>
          <p className="text-on-surface/50 text-xl max-w-xl leading-relaxed font-semibold">
            Stop guessing your macros. MacroMitra uses advanced physiological modeling to create a bespoke nutrition path designed specifically for your unique metabolism.
          </p>
          <div className="flex flex-wrap gap-6 pt-4">
            <button 
              onClick={() => navigate('/calculator')}
              className="bg-primary hover:bg-primary-container text-white font-black uppercase tracking-widest px-10 py-5 rounded-full shadow-2xl shadow-green-900/20 hover:scale-[1.05] transition-all active:scale-95"
            >
              Start Your Journey
            </button>
            <button className="bg-surface-container-low hover:bg-slate-200 text-on-surface font-black uppercase tracking-widest px-10 py-5 rounded-full transition-all">
              Learn How It Works
            </button>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <div className="absolute inset-x-[-10%] inset-y-[-10%] bg-primary/5 rounded-full blur-[100px]" />
          <div className="relative rounded-[3rem] overflow-hidden shadow-ambient border-8 border-white group">
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1000&fit=crop&q=90" 
              alt="Elite Athlete" 
              className="w-full h-auto object-cover transform transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
          <div className="absolute bottom-10 left-[-40px] bg-white p-6 rounded-2xl shadow-ambient border border-outline-variant/10 max-w-[200px] animate-bounce-slow">
             <div className="flex items-center space-x-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-primary" />
               <span className="text-[10px] font-black uppercase tracking-widest">Live Metabolism</span>
             </div>
             <p className="text-xs font-bold leading-tight">Optimizing calorie intake for muscle recovery...</p>
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="text-center space-y-4 px-6 max-w-3xl mx-auto">
        <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Crafted for Excellence</h2>
        <p className="text-on-surface/50 font-medium">Our ecosystem integrates every facet of your nutritional biology into a single, elegant dashboard.</p>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
        {[
          { 
            icon: '🧮', 
            label: 'Precision Calculator', 
            desc: 'Advanced algorithms that go beyond BMI, calculating your exact metabolic needs based on activity, age, and lean mass.',
            to: '/calculator',
            color: 'bg-green-50'
          },
          { 
            icon: '🍱', 
            label: 'Personalized Meal Plans', 
            desc: 'Dynamic recipes that adapt to your macro requirements in real-time, ensuring you never have to settle for boring food.',
            to: '/meals',
            color: 'bg-red-50'
          },
          { 
            icon: '📈', 
            label: 'Progress Tracking', 
            desc: 'Visualize your evolution with beautiful data visualizations that highlight trends in body composition and energy levels.',
            to: '/database', // Mapping DB to progress tracking concept for now
            color: 'bg-blue-50'
          }
        ].map((item) => (
          <button 
            key={item.label}
            onClick={() => navigate(item.to)}
            className="bg-surface-container-lowest p-10 rounded-[2.5rem] shadow-ambient hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 border border-outline-variant/10 text-left group"
          >
            <div className={`w-14 h-14 ${item.color} rounded-[1.25rem] flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <h3 className="text-xl font-black mb-4 group-hover:text-primary transition-colors">{item.label}</h3>
            <p className="text-on-surface/50 text-sm leading-relaxed mb-8">{item.desc}</p>
            <span className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-0 group-hover:opacity-100 transition-all">
              Initialize <span>→</span>
            </span>
          </button>
        ))}
      </section>

      {/* Social Proof */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12 px-12 border-y border-outline-variant/10 py-16">
        {[
          { val: '2.4M', label: 'Meals Tracked' },
          { val: '98%', label: 'Success Rate' },
          { val: '4.9/5', label: 'User Rating' }
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-black tracking-tighter mb-1">{stat.val}</p>
            <p className="label-tier opacity-50">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* CTA Section */}
      <section className="mx-6">
        <div className="bg-primary rounded-[3rem] p-16 md:p-24 relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl text-white font-black tracking-tighter leading-none">
                Ready to unlock<br/>your full potential?
              </h2>
              <button 
                onClick={() => navigate('/calculator')}
                className="bg-white text-on-surface font-black uppercase tracking-widest px-12 py-5 rounded-full hover:scale-105 transition-all shadow-2xl active:scale-95"
              >
                Join MacroMitra Now
              </button>
            </div>
            <div className="max-w-xs space-y-6 italic">
              <p className="text-white/80 text-lg font-medium leading-relaxed">
                "MacroMitra changed the way I view food. It’s no longer about restriction; it’s about fueling my body with the exact precision it deserves."
              </p>
              <div className="flex items-center justify-center md:justify-start space-x-3">
                 <div className="w-10 h-10 rounded-full bg-white/20" />
                 <span className="text-white font-black uppercase tracking-widest text-[10px]">Sarah J., Elite Athlete</span>
              </div>
            </div>
          </div>
          {/* Abstract decoration */}
          <div className="absolute top-[-20%] right-[-10%] text-[20rem] opacity-5 transform rotate-45">🥦</div>
        </div>
      </section>
    </div>
  );
};

export default Home;
