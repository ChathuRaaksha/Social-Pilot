import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Sparkles, Eye, Calendar, BarChart } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: MessageSquare,
    title: "Share Your Idea",
    description: "Type in your campaign concept, product launch, or content theme. Just a few words are enough to get started.",
    color: "bg-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary"
  },
  {
    step: "02", 
    icon: Sparkles,
    title: "AI Generates Content",
    description: "Our AI creates platform-specific posts optimized for LinkedIn's professional tone, X's brevity, and Instagram's visual appeal.",
    color: "bg-secondary",
    iconBg: "bg-secondary/10", 
    iconColor: "text-secondary"
  },
  {
    step: "03",
    icon: Eye,
    title: "Review & Approve",
    description: "Preview all generated content, make edits if needed, or regenerate posts until they're perfect for your brand voice.",
    color: "bg-accent",
    iconBg: "bg-accent/10",
    iconColor: "text-accent"
  },
  {
    step: "04",
    icon: Calendar,
    title: "Schedule & Publish",
    description: "Set your timing or publish immediately. Our fault-tolerant system ensures your content goes live exactly when planned.",
    color: "bg-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary"
  },
  {
    step: "05",
    icon: BarChart,
    title: "Track Performance",
    description: "Monitor engagement across all platforms with detailed analytics to understand what resonates with your audience.",
    color: "bg-secondary",
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary"
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-24 pb-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How SocialPilot
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Transforms Your Workflow
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From idea to published content in 5 simple steps. No complex setup, no learning curve.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-30 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Number */}
                <div className="flex justify-center mb-6">
                  <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-lg">{step.step}</span>
                  </div>
                </div>

                <Card className="bg-card border-border shadow-card hover:shadow-primary transition-all duration-300 hover:-translate-y-2 text-center h-full">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className={`w-12 h-12 rounded-lg ${step.iconBg} flex items-center justify-center`}>
                        <step.icon className={`w-6 h-6 ${step.iconColor}`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};