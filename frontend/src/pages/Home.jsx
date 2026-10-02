import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import BuyToken from '../components/BuyToken';
import MessageHotbot from '../components/MessageHotbot';
import BuiltDifferent from '../components/BuiltDifferent';
import WhereverYouTrade from '../components/WhereverYouTrade';
import Strategy from '../components/Strategy';
import SpecialistJobs from '../components/SpecialistJobs';
import BuiltOnClawPump from '../components/BuiltOnClawPump';
import MeetTeam from '../components/MeetTeam';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <BuyToken />
        <MessageHotbot />
        <BuiltDifferent />
        <WhereverYouTrade />
        <Strategy />
        <SpecialistJobs />
        <BuiltOnClawPump />
        <MeetTeam />
      </main>
      <Footer />
    </div>
  );
}
