export interface CourseSuggestion {
  id: string;
  type: string;
  title: string;
  content: string;
  reasoning: string;
  confidence: number;
  actionable: boolean;
  metadata?: any;
}

export interface CourseAnalysis {
  completeness: {
    score: number;
    missingElements: string[];
    recommendations: string[];
  };
  quality: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  marketability: {
    score: number;
    competitiveness: string;
    targetAudience: string[];
    pricingRecommendation: string;
  };
  seo: {
    score: number;
    keywords: string[];
    optimizations: string[];
  };
}
