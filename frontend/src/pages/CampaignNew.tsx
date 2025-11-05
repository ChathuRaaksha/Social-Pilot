import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { generatePosts, pollWorkflowStatus } from "@/services/temporalApi";

export default function CampaignNew() {
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Enhanced validation
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only JPEG, PNG, WebP, and GIF images are allowed",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleGenerate = async () => {
    const trimmedIdea = idea.trim();
    
    // Enhanced input validation
    if (!trimmedIdea) {
      toast({
        title: "Idea Required",
        description: "Please enter a campaign idea to generate posts.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedIdea.length > 2000) {
      toast({
        title: "Idea Too Long",
        description: "Campaign idea must be less than 2000 characters.",
        variant: "destructive",
      });
      return;
    }

    if (audience.trim().length > 500) {
      toast({
        title: "Audience Too Long",
        description: "Target audience must be less than 500 characters.",
        variant: "destructive",
      });
      return;
    }

    if (tone.trim().length > 200) {
      toast({
        title: "Tone Too Long",
        description: "Tone must be less than 200 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload image if provided
      let imageUrl: string | null = null;
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `anonymous-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('campaign-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create campaign without user_id (anonymous mode)
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          idea: idea.trim(),
          audience: audience.trim() || null,
          tone: tone.trim() || null,
          status: "draft",
        })
        .select()
        .single();

      if (campaignError) {
        console.error("Campaign creation error:", campaignError);
        throw new Error(`Failed to create campaign: ${campaignError.message}`);
      }

      // Generate posts via Temporal API
      const platforms = ["linkedin", "x", "instagram"];
      const workflowResponse = await generatePosts({
        idea: idea.trim(),
        audience: audience.trim() || undefined,
        tone: tone.trim() || undefined,
        image: imageUrl || undefined,
        platforms,
        wait: true,
        timeout_seconds: 30,
      });

      // Handle different workflow statuses
      let generatedPosts: Record<string, string> = {};
      
      if (workflowResponse.status === "completed" && workflowResponse.result) {
        // Posts generated successfully - result is { Platform: content }
        generatedPosts = workflowResponse.result;
      } else if (workflowResponse.status === "running") {
        // Workflow is still running, poll for results
        toast({
          title: "Processing...",
          description: "Your posts are being generated. Please wait...",
        });

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 20; // Max 20 attempts (20 seconds with 1s timeout each)
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
          
          const pollResult = await pollWorkflowStatus(
            workflowResponse.workflow_id,
            workflowResponse.run_id,
            1
          );
          
          if (pollResult.status === "completed" && pollResult.result) {
            generatedPosts = pollResult.result;
            break;
          } else if (pollResult.status === "failed") {
            throw new Error(pollResult.error || "Workflow failed");
          }
          
          attempts++;
        }

        if (Object.keys(generatedPosts).length === 0) {
          throw new Error("Workflow timed out. Please try again.");
        }
      } else if (workflowResponse.status === "failed") {
        throw new Error(workflowResponse.error || "Failed to generate posts");
      } else {
        throw new Error("Unexpected workflow status: " + workflowResponse.status);
      }

      // Transform the result format from { Platform: content } to posts array
      // Map platform names to match database enum (lowercase)
      const platformMap: Record<string, string> = {
        'Linkedin': 'linkedin',
        'X': 'x',
        'Twitter': 'x',
        'Instagram': 'instagram',
        'Facebook': 'facebook'
      };

      const postsToInsert = Object.entries(generatedPosts).map(([platform, content]) => ({
        campaign_id: campaign.id,
        platform: platformMap[platform] || platform.toLowerCase(),
        content: content,
        image_url: imageUrl,
        status: "draft" as const,
        temporal_workflow_id: workflowResponse.workflow_id,
      }));

      const { error: insertError } = await supabase
        .from("posts")
        .insert(postsToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Campaign Created!",
        description: `Generated ${postsToInsert.length} posts for approval.`,
      });

      // Navigate to campaign page
      navigate(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate campaign posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-3xl py-12">
        <Card className="shadow-hero">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              Create New Campaign
            </CardTitle>
            <CardDescription>
              Describe your campaign idea and we'll generate platform-optimized posts for LinkedIn, X, and Instagram.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="idea">Campaign Idea *</Label>
              <Textarea
                id="idea"
                placeholder="e.g., Launch our new AI productivity tool that helps teams save 10 hours per week"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Be specific about what you want to communicate
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience (optional)</Label>
              <Input
                id="audience"
                placeholder="e.g., Tech startup founders, Remote teams, Small business owners"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone (optional)</Label>
              <Input
                id="tone"
                placeholder="e.g., Professional, Casual, Enthusiastic, Informative"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image (optional)</Label>
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-md p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="image" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload an image (max 5MB)
                    </span>
                  </label>
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !idea.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Posts...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Campaign Posts
                </>
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              This will create 3 posts (LinkedIn, X, Instagram) that you can review and approve
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
