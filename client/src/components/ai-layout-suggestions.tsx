import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Table2,
  Lightbulb,
  Target,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LayoutSuggestion {
  recommendedTemplate: 'standard' | 'executive' | 'detailed';
  layout: {
    includeCharts: boolean;
    includeTrendAnalysis: boolean;
    includeComplianceMetrics: boolean;
    includeStationComparison: boolean;
    prioritySections: string[];
  };
  reasoning: string;
  visualizations: {
    type: 'bar' | 'pie' | 'line' | 'table';
    title: string;
    description: string;
  }[];
  keyInsights: string[];
}

interface AILayoutSuggestionsProps {
  inspectionId: string;
  onApplySuggestions?: (suggestions: LayoutSuggestion) => void;
}

const visualizationIcons = {
  bar: BarChart3,
  pie: PieChart,
  line: LineChart,
  table: Table2
};

const templateColors = {
  standard: "bg-blue-100 text-blue-800",
  executive: "bg-purple-100 text-purple-800",
  detailed: "bg-green-100 text-green-800"
};

export function AILayoutSuggestions({ inspectionId, onApplySuggestions }: AILayoutSuggestionsProps) {
  const { toast } = useToast();
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);

  const {
    data: suggestions,
    isLoading,
    error,
    refetch
  } = useQuery<LayoutSuggestion>({
    queryKey: [`/api/inspections/${inspectionId}/ai-suggestions`],
    enabled: !!inspectionId,
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/inspections/${inspectionId}/ai-suggestions`, {});
    },
    onSuccess: () => {
      toast({
        title: "AI Analysis Complete",
        description: "Layout suggestions have been generated based on your inspection data.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApplySuggestion = (suggestionType: string) => {
    if (suggestions && onApplySuggestions) {
      onApplySuggestions(suggestions);
      setAppliedSuggestions(prev => [...prev, suggestionType]);
      toast({
        title: "Suggestion Applied",
        description: `${suggestionType} suggestion has been applied to your report configuration.`,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 text-blue-500" size={20} />
            AI Layout Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin mr-2" size={20} />
            Analyzing inspection data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !suggestions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 text-blue-500" size={20} />
            AI Layout Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Unable to generate suggestions at the moment.</p>
            <Button 
              onClick={() => generateSuggestionsMutation.mutate()}
              disabled={generateSuggestionsMutation.isPending}
            >
              {generateSuggestionsMutation.isPending ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" size={16} />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 text-blue-500" size={20} />
            AI Layout Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Get AI-powered recommendations for your report layout.</p>
            <Button 
              onClick={() => generateSuggestionsMutation.mutate()}
              disabled={generateSuggestionsMutation.isPending}
            >
              {generateSuggestionsMutation.isPending ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" size={16} />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="mr-2 text-blue-500" size={20} />
            AI Layout Suggestions
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => generateSuggestionsMutation.mutate()}
            disabled={generateSuggestionsMutation.isPending}
          >
            <RefreshCw className="mr-2" size={16} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recommended Template */}
        <div>
          <h4 className="font-medium mb-3 flex items-center">
            <Target className="mr-2 text-green-600" size={16} />
            Recommended Template
          </h4>
          <div className="flex items-center gap-3">
            <Badge className={templateColors[suggestions.recommendedTemplate as keyof typeof templateColors]}>
              {suggestions.recommendedTemplate.charAt(0).toUpperCase() + suggestions.recommendedTemplate.slice(1)} Template
            </Badge>
            <Button
              size="sm"
              onClick={() => handleApplySuggestion('template')}
              disabled={appliedSuggestions.includes('template')}
            >
              {appliedSuggestions.includes('template') ? (
                <>
                  <CheckCircle className="mr-1" size={14} />
                  Applied
                </>
              ) : (
                'Apply Template'
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">{suggestions.reasoning}</p>
        </div>

        <Separator />

        {/* Key Insights */}
        {suggestions.keyInsights.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <Lightbulb className="mr-2 text-yellow-600" size={16} />
              Key Insights
            </h4>
            <ul className="space-y-2">
              {suggestions.keyInsights.map((insight: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Recommended Visualizations */}
        {suggestions.visualizations.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <TrendingUp className="mr-2 text-purple-600" size={16} />
              Recommended Visualizations
            </h4>
            <div className="space-y-3">
              {suggestions.visualizations.map((viz: any, index: number) => {
                const IconComponent = visualizationIcons[viz.type as keyof typeof visualizationIcons];
                return (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <IconComponent className="mr-2 text-blue-600" size={16} />
                        <span className="font-medium text-sm">{viz.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {viz.type.charAt(0).toUpperCase() + viz.type.slice(1)} Chart
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{viz.description}</p>
                  </div>
                );
              })}
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleApplySuggestion('visualizations')}
                disabled={appliedSuggestions.includes('visualizations')}
              >
                {appliedSuggestions.includes('visualizations') ? (
                  <>
                    <CheckCircle className="mr-1" size={14} />
                    Applied
                  </>
                ) : (
                  'Apply All Visualizations'
                )}
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Layout Preferences */}
        <div>
          <h4 className="font-medium mb-3">Layout Preferences</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Include Charts</span>
              <Badge variant={suggestions.layout.includeCharts ? "default" : "secondary"}>
                {suggestions.layout.includeCharts ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Trend Analysis</span>
              <Badge variant={suggestions.layout.includeTrendAnalysis ? "default" : "secondary"}>
                {suggestions.layout.includeTrendAnalysis ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Compliance Metrics</span>
              <Badge variant={suggestions.layout.includeComplianceMetrics ? "default" : "secondary"}>
                {suggestions.layout.includeComplianceMetrics ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Station Comparison</span>
              <Badge variant={suggestions.layout.includeStationComparison ? "default" : "secondary"}>
                {suggestions.layout.includeStationComparison ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
          <Button
            size="sm"
            className="w-full mt-3"
            onClick={() => handleApplySuggestion('layout')}
            disabled={appliedSuggestions.includes('layout')}
          >
            {appliedSuggestions.includes('layout') ? (
              <>
                <CheckCircle className="mr-1" size={14} />
                Applied
              </>
            ) : (
              'Apply Layout Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AILayoutSuggestions;