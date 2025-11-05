import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Check, Loader2, RefreshCw, Linkedin, Twitter, Send } from "lucide-react";
import { publishPost } from "@/services/temporalApi";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const PLATFORM_ICONS = {
  linkedin: Linkedin,
  x: Twitter,
  instagram: () => <span className="font-bold">IG</span>,
};

const PLATFORM_COLORS = {
  linkedin: "bg-blue-500",
  x: "bg-black",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
};

export default function CampaignView() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [publishingPost, setPublishingPost] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      // Load campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Load posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("campaign_id", id)
        .order("platform");

      if (postsError) throw postsError;
      setPosts(postsData || []);
    } catch (error) {
      console.error("Error loading campaign:", error);
      toast({
        title: "Error",
        description: "Failed to load campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  const handleSaveEdit = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ content: editContent })
        .eq("id", postId);

      if (error) throw error;

      setPosts(posts.map(p => p.id === postId ? { ...p, content: editContent } : p));
      setEditingPost(null);
      toast({
        title: "Post Updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Update Failed",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    setPublishingPost(postId);
    
    try {
      // For LinkedIn and X posts, automatically trigger the Temporal workflow
      if (post.platform === "linkedin" || post.platform === "x") {
        const result = await publishPost({
          post_id: post.id,
          platform: post.platform,
          content: post.content,
          access_token: post.platform === "linkedin" 
            ? "mock_token"  // TODO: Replace with real OAuth token from LinkedIn
            : "1973361612292493312-FdVC9Rvb5t0x1kqVZHhxJ4JeYpu3ha", // X access token
          author_urn: post.platform === "linkedin"
            ? "urn:li:person:mock"  // TODO: Fetch from LinkedIn API after OAuth
            : "VcbYQGLHzQIyNr651fFvHXDBOfpqBJxIZkoUjcqw2ZyvI", // X access token secret
          image_url: post.image_url,
          use_mock: false, // Using real API
          wait: true
        });

        if (result.status === "completed" && result.result?.success) {
          // Update database with published status
          const { error } = await supabase
            .from("posts")
            .update({ 
              status: "published",
              temporal_workflow_id: result.workflow_id
            })
            .eq("id", post.id);

          if (error) throw error;

          setPosts(posts.map(p => p.id === post.id ? { ...p, status: "published", temporal_workflow_id: result.workflow_id } : p));
          
          toast({
            title: "Post Approved & Published!",
            description: result.result.post_url 
              ? `View post on ${post.platform === 'linkedin' ? 'LinkedIn' : 'X'}` 
              : `Post published successfully to ${post.platform === 'linkedin' ? 'LinkedIn' : 'X'}`,
          });
        } else {
          throw new Error(result.result?.error || "Failed to publish post");
        }
      } else {
        // For other platforms, just update status to awaiting_approval
        const { error: updateError } = await supabase
          .from("posts")
          .update({ status: "awaiting_approval" })
          .eq("id", postId);

        if (updateError) throw updateError;

        setPosts(posts.map(p => p.id === postId ? { ...p, status: "awaiting_approval" } : p));
        
        toast({
          title: "Post Approved!",
          description: "Now you can schedule this post for publishing.",
        });
      }
    } catch (error) {
      console.error("Error approving/publishing post:", error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve and publish post",
        variant: "destructive",
      });
    } finally {
      setPublishingPost(null);
    }
  };

  const handleSchedule = async (postId: string, date: Date | undefined) => {
    if (!date) return;

    try {
      const { error } = await supabase
        .from("posts")
        .update({ 
          scheduled_at: date.toISOString(),
          status: "scheduled"
        })
        .eq("id", postId);

      if (error) throw error;

      setPosts(posts.map(p => p.id === postId ? { ...p, scheduled_at: date.toISOString(), status: "scheduled" } : p));
      
      toast({
        title: "Post Scheduled!",
        description: `Post will be published on ${format(date, "PPP 'at' p")}`,
      });
    } catch (error) {
      console.error("Error scheduling post:", error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule post",
        variant: "destructive",
      });
    }
  };

  const handlePublishToLinkedIn = async (post: any) => {
    setPublishingPost(post.id);
    
    try {
      // Using real LinkedIn API with actual credentials
      const result = await publishPost({
        post_id: post.id,
        platform: post.platform,
        content: post.content,
        access_token: "AQUntbwaRbVNuW7Dmr-Sjqtjc0jvdcfQyxORG-kQ1OQYcOV-QEXHfD_Br2kyMdmVKDSCBKhP3Bp6jr0AXsU6Ad-XHS6n-Y_Ja-5qx1qLci1UOxZKhz7Gj0LUtXa-pthi_DsBMQ7HBBwHADp2mwRsRF8d8tPlTqb5_P88F3GOVdlOGU4eARxelznIXUqL_7nvDz_VLl90ZxspcrQ46rVqnWQbCtEUrxF2q7tzoWkcWoBHyggGk9FppBrnz1AHo-ek3BezZaWbWlHmcbBdi6Sd_k4abjpv86A9DHBwBUBBaakk_QJEJ5XhgbjfcS_pdmYN1drp0vtvdm_AY96-_8uwugJ-LHrV9A",
        author_urn: "urn:li:organization:105093935", // Social Pilot Labs organization URN
        image_url: post.image_url,
        use_mock: false, // Using real LinkedIn API
        wait: true
      });

      if (result.status === "completed" && result.result?.success) {
        // Update database with published status
        const { error } = await supabase
          .from("posts")
          .update({ 
            status: "published",
            temporal_workflow_id: result.workflow_id
          })
          .eq("id", post.id);

        if (error) throw error;

        setPosts(posts.map(p => p.id === post.id ? { ...p, status: "published" } : p));
        
        toast({
          title: "Posted to LinkedIn!",
          description: result.result.post_url ? "View post on LinkedIn" : "Post published successfully",
        });
      } else {
        throw new Error(result.result?.error || "Failed to publish post");
      }
    } catch (error) {
      console.error("Error publishing to LinkedIn:", error);
      toast({
        title: "Publishing Failed",
        description: error.message || "Failed to publish post to LinkedIn",
        variant: "destructive",
      });
    } finally {
      setPublishingPost(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-6xl py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Campaign: {campaign?.idea}</h1>
          {campaign?.audience && (
            <p className="text-white/80">Audience: {campaign.audience}</p>
          )}
          {campaign?.tone && (
            <p className="text-white/80">Tone: {campaign.tone}</p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const Icon = PLATFORM_ICONS[post.platform as keyof typeof PLATFORM_ICONS];
            const isEditing = editingPost === post.id;

            return (
              <Card key={post.id} className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", PLATFORM_COLORS[post.platform as keyof typeof PLATFORM_COLORS])}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="capitalize">{post.platform}</CardTitle>
                    </div>
                    <Badge variant={post.status === "draft" ? "secondary" : post.status === "scheduled" ? "default" : "outline"}>
                      {post.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={() => handleSaveEdit(post.id)} size="sm">
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button onClick={() => setEditingPost(null)} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => handleEdit(post)} variant="outline" size="sm">
                          Edit
                        </Button>
                        {post.status === "draft" && (
                          <Button 
                            onClick={() => handleApprove(post.id)} 
                            disabled={publishingPost === post.id}
                            size="sm"
                          >
                        {publishingPost === post.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            {(post.platform === "linkedin" || post.platform === "x") ? "Approve & Publish" : "Approve"}
                          </>
                        )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {post.status === "awaiting_approval" && post.platform !== "linkedin" && post.platform !== "x" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="default" size="sm" className="w-full">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Schedule Post
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={post.scheduled_at ? new Date(post.scheduled_at) : undefined}
                          onSelect={(date) => handleSchedule(post.id, date)}
                          initialFocus
                          disabled={(date) => date < new Date()}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  {post.scheduled_at && (
                    <p className="text-xs text-muted-foreground">
                      Scheduled for: {format(new Date(post.scheduled_at), "PPP 'at' p")}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            View All Campaigns
          </Button>
        </div>
      </div>
    </div>
  );
}
