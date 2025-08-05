import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ReportLayoutSuggestion {
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

export async function generateReportLayoutSuggestions(inspectionData: {
  area: string;
  observations: any;
  stationCode: string;
  inspectionDate: string;
  status: string;
  subject: string;
}): Promise<ReportLayoutSuggestion> {
  try {
    const prompt = `
You are an expert in railway inspection reporting and data visualization. Analyze the following Northern Railway inspection data and suggest the optimal report layout and structure.

Inspection Data:
- Area: ${inspectionData.area}
- Station: ${inspectionData.stationCode}
- Subject: ${inspectionData.subject}
- Status: ${inspectionData.status}
- Date: ${inspectionData.inspectionDate}
- Observations: ${JSON.stringify(inspectionData.observations, null, 2)}

Based on this data, provide recommendations for:
1. Which template would be most appropriate (standard/executive/detailed)
2. What visualizations would be most effective
3. Key insights that should be highlighted
4. Layout priorities for maximum impact

Consider factors like:
- Complexity and volume of observations
- Type of deficiencies found
- Urgency level
- Target audience (field officers vs management)
- Data patterns and trends

Respond with JSON in this exact format:
{
  "recommendedTemplate": "standard|executive|detailed",
  "layout": {
    "includeCharts": boolean,
    "includeTrendAnalysis": boolean,
    "includeComplianceMetrics": boolean,
    "includeStationComparison": boolean,
    "prioritySections": ["section1", "section2", ...]
  },
  "reasoning": "Detailed explanation of recommendations",
  "visualizations": [
    {
      "type": "bar|pie|line|table",
      "title": "Chart title",
      "description": "What this visualization shows"
    }
  ],
  "keyInsights": ["insight1", "insight2", ...]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert railway inspection analyst specializing in data visualization and report optimization for Northern Railway operations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and provide defaults
    return {
      recommendedTemplate: result.recommendedTemplate || 'standard',
      layout: {
        includeCharts: result.layout?.includeCharts ?? true,
        includeTrendAnalysis: result.layout?.includeTrendAnalysis ?? false,
        includeComplianceMetrics: result.layout?.includeComplianceMetrics ?? true,
        includeStationComparison: result.layout?.includeStationComparison ?? false,
        prioritySections: result.layout?.prioritySections || ['observations', 'action_taken']
      },
      reasoning: result.reasoning || 'Standard layout recommended based on inspection data.',
      visualizations: result.visualizations || [],
      keyInsights: result.keyInsights || []
    };
  } catch (error) {
    console.error("Error generating AI layout suggestions:", error);
    
    // Fallback suggestions based on inspection area
    return {
      recommendedTemplate: 'standard',
      layout: {
        includeCharts: inspectionData.area === 'catering',
        includeTrendAnalysis: false,
        includeComplianceMetrics: true,
        includeStationComparison: false,
        prioritySections: ['observations', 'action_taken']
      },
      reasoning: 'Standard template recommended. AI service temporarily unavailable.',
      visualizations: inspectionData.area === 'catering' ? [
        {
          type: 'bar',
          title: 'Compliance Overview',
          description: 'Overview of compliance status across different criteria'
        }
      ] : [],
      keyInsights: ['Manual review recommended for detailed analysis']
    };
  }
}

export async function analyzeInspectionTrends(inspections: any[]): Promise<{
  trends: string[];
  recommendations: string[];
  criticalAreas: string[];
}> {
  try {
    const prompt = `
Analyze the following Northern Railway inspection data to identify trends, patterns, and areas requiring attention:

Inspection Data:
${JSON.stringify(inspections.slice(0, 10), null, 2)}

Provide analysis in JSON format:
{
  "trends": ["trend1", "trend2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "criticalAreas": ["area1", "area2", ...]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a railway operations analyst specializing in inspection trend analysis and operational improvements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error analyzing inspection trends:", error);
    return {
      trends: ['Analysis temporarily unavailable'],
      recommendations: ['Manual review recommended'],
      criticalAreas: ['Review required']
    };
  }
}