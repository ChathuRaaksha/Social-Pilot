import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Linkedin } from "lucide-react";

const teamMembers = [
  {
    name: "Praneet Kala",
    role: "Workflow Automation Specialist",
    description: "Expert in streamlining complex business processes and implementing AI-driven automation solutions.",
    image: "/assets/praneet-kala.jpg", // We'll add real photos later
    linkedin: "https://linkedin.com/in/praneet-kala-0b165678",
    delay: 0
  },
  {
    name: "Jady Pamella",
    role: "AI, Cybersecurity & IT Consultant",
    description: "Specialized in AI security frameworks and protecting intelligent systems from emerging threats.",
    image: "/assets/jady-pamella.jpg",
    linkedin: "https://linkedin.com/in/jadypamella",
    delay: 0.1
  },
  {
    name: "Siqi Xiang",
    role: "AI Master's Student & Ex-Strategy Analyst",
    description: "Bridging strategic business insights with cutting-edge AI research and implementation.",
    image: "/assets/siqi-xiang.jpg",
    linkedin: "https://linkedin.com/in/siqi-xiang",
    delay: 0.2
  },
  {
    name: "Elena Wei",
    role: "Security & Risk Operation Analyst",
    description: "Ensuring robust security protocols and risk management for AI-powered systems.",
    image: "/assets/elena-wei.jpg",
    linkedin: "https://linkedin.com/in/zhicong-wei",
    delay: 0.3
  },
  {
    name: "Supun Chathuranga",
    role: "Senior Fullstack Software Engineer",
    description: "Building scalable, high-performance applications that power our AI automation platform.",
    image: "/assets/supun-chathuranga.jpg",
    linkedin: "https://linkedin.com/in/supun-chathuranga-190372148",
    delay: 0.4
  },
  {
    name: "Ziqing Zhang",
    role: "Info System MSc Student",
    description: "Researching advanced information systems and their application in AI workflow management.",
    image: "/assets/ziqing-zhang.jpg",
    linkedin: "https://linkedin.com/in/ziqing-z-109395326",
    delay: 0.5
  }
];

const stats = [
  {
    number: "6+",
    label: "Team Members",
    delay: 0.6
  },
  {
    number: "30+",
    label: "Years Combined Experience",
    delay: 0.7
  },
  {
    number: "7",
    label: "Specialization Areas",
    delay: 0.8
  },
  {
    number: "100%",
    label: "Commitment to Innovation",
    delay: 0.9
  }
];

export const Team = () => {
  return (
    <section className="py-24 bg-gradient-card">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Meet Our Team
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A diverse group of experts passionate about revolutionizing how AI systems 
            understand and utilize workflows for better social media automation.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto mb-20">
          {teamMembers.map((member, index) => (
            <div 
              key={index} 
              className="group text-center animate-fade-in"
              style={{ animationDelay: `${member.delay}s` }}
            >
              <Avatar className="w-32 h-32 mx-auto mb-6 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 group-hover:scale-105">
                <AvatarImage 
                  src={member.image} 
                  alt={member.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-bold bg-gradient-primary text-white">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="text-xl font-bold text-foreground mb-2">
                {member.name}
              </h3>
              
              <p className="text-primary font-medium mb-4">
                {member.role}
              </p>
              
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-sm mx-auto">
                {member.description}
              </p>
              
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-200 hover:scale-105"
              >
                <Linkedin size={18} />
                <span className="text-sm font-medium">Connect</span>
              </a>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${stat.delay}s` }}
            >
              <div className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};