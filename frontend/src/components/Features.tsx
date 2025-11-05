import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, CheckCircle, Clock, BarChart3, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Content Generation",
    description: "Transform a single idea into platform-optimized posts for LinkedIn, X, and Instagram with AI that understands each platform's best practices.",
    color: "text-primary"
  },
  {
    icon: CheckCircle,
    title: "Human-in-the-Loop Approval",
    description: "Maintain control with an approval workflow. Review, edit, or regenerate content before it goes live across your channels.",
    color: "text-secondary"
  },
  {
    icon: Clock,
    title: "Temporal Scheduling",
    description: "Durable, fault-tolerant scheduling with automatic retries. Schedule posts hours or days ahead with confidence.",
    color: "text-accent"
  },
  {
    icon: BarChart3,
    title: "Engagement Analytics",
    description: "Track performance across all platforms with comprehensive metrics including likes, comments, shares, and reach.",
    color: "text-primary"
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Reliability",
    description: "Built on Temporal workflows for maximum uptime and fault tolerance. Your campaigns run smoothly even when things go wrong.",
    color: "text-secondary"
  },
  {
    icon: Zap,
    title: "Lightning Fast Workflow",
    description: "From concept to published content in under 60 seconds. Streamline your social media process like never before.",
    color: "text-accent"
  }
];

export const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Powerful Features for
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Modern Social Media Teams
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to scale your social media presence with AI-powered automation
            and enterprise-grade reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-gradient-card border-border shadow-card hover:shadow-primary transition-all duration-300 hover:-translate-y-2 group"
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};