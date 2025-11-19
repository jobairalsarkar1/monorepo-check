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

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  company: { name: string };
  address: { city: string };
};