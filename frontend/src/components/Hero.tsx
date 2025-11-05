import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Users, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
      <div className="absolute top-20 left-20 w-64 h-64 bg-secondary/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={logo} 
            alt="SocialPilot Logo" 
            className="w-24 h-24 drop-shadow-lg animate-bounce"
          />
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          From Idea to
          <span className="block bg-gradient-to-r from-secondary to-white bg-clip-text text-transparent">
            Multi-Platform Posts
          </span>
          <span className="block text-4xl md:text-5xl mt-2 text-secondary/90">
            in Seconds
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
          AI-powered workflow automation that transforms a single campaign idea into 
          ready-to-publish content across LinkedIn, X, and Instagram with human approval.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            variant="hero" 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/campaigns/new')}
          >
            Start Creating Campaigns
            <ArrowRight className="ml-2" />
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-primary">
            Watch Demo
          </Button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">AI-Powered Content</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
            <Users className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">Multi-Platform Publishing</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
            <Calendar className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">Smart Scheduling</span>
          </div>
        </div>

        {/* Social Proof */}
        <p className="text-white/70 text-sm">
          Trusted by 10,000+ creators and marketing teams worldwide
        </p>
      </div>
    </section>
  );
};