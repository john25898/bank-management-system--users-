import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  transaction_type: string;
  is_anonymous: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface UserReviewsProps {
  userId: string;
}

export const UserReviews = ({ userId }: UserReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, total: 0 });

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [userId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('user_reviews')
        .select(`
          id,
          rating,
          review_text,
          transaction_type,
          is_anonymous,
          created_at,
          profiles!reviewer_id (
            full_name,
            avatar_url
          )
        `)
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_rating', { user_uuid: userId });

      if (error) throw error;
      if (data && data.length > 0) {
        setStats({
          average: data[0].average_rating || 0,
          total: data[0].total_reviews || 0
        });
      }
    } catch (error) {
      console.error('Error fetching rating stats:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Rating Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.total > 0 ? (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.average}</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
                {renderStars(Math.round(stats.average))}
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">
                  Total Review{stats.total !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      {!review.is_anonymous && review.profiles?.avatar_url && (
                        <AvatarImage src={review.profiles.avatar_url} />
                      )}
                      <AvatarFallback>
                        {review.is_anonymous 
                          ? 'A' 
                          : review.profiles?.full_name?.charAt(0).toUpperCase() || 'U'
                        }
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {review.is_anonymous 
                              ? 'Anonymous User' 
                              : review.profiles?.full_name || 'Unknown User'
                            }
                          </span>
                          {review.transaction_type && (
                            <Badge variant="outline" className="text-xs">
                              {review.transaction_type.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm font-medium">{review.rating}/5</span>
                      </div>
                      
                      {review.review_text && (
                        <p className="text-sm text-muted-foreground">{review.review_text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};