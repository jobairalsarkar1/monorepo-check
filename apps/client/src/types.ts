interface Review {
  id: string;
  targetType: string;
  targetName: string;
  rating: number;
  title: string | null;
  comment: string;
  authorName: string;
  authorEmail: string | null;
  verified: boolean;
  likes: number;
  image: string | null;
  createdAt: string;
}

export interface ReviewsResponse {
  success: boolean;
  data: Review[];
  page: number;
  limit: number;
  total_reviews: number;
  hasMore: boolean;
  nextPage: number | null;
  prevPage: number | null;
}