import { HfInference } from '@huggingface/inference';

/**
 * AI Service Layer using Hugging Face open-source models
 * Cost-effective alternative to OpenAI/Anthropic for customer savings
 */

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Default models - can be configured per tenant
const DEFAULT_MODELS = {
  chat: 'meta-llama/Llama-3.2-3B-Instruct', // Fast, efficient for chat
  analysis: 'mistralai/Mistral-7B-Instruct-v0.2', // Good for business analysis
  embeddings: 'sentence-transformers/all-MiniLM-L6-v2', // For semantic search
  summarization: 'facebook/bart-large-cnn', // Document summarization
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BusinessAnalysisInput {
  businessType: string;
  currentChallenges: string[];
  goals: string[];
  currentTools?: string[];
}

export interface BusinessAnalysisResult {
  insights: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: Array<{
    module: string;
    reason: string;
    expectedImpact: string;
  }>;
  automationOpportunities: Array<{
    task: string;
    effort: string;
    impact: string;
  }>;
}

/**
 * Chat with AI assistant
 */
export async function chat(
  messages: ChatMessage[],
  model: string = DEFAULT_MODELS.chat
): Promise<string> {
  try {
    const response = await hf.chatCompletion({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
  } catch (error) {
    console.error('[AI Service] Chat error:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Analyze business and provide insights
 */
export async function analyzeBusinessNeeds(
  input: BusinessAnalysisInput
): Promise<BusinessAnalysisResult> {
  const prompt = `You are a business consultant AI. Analyze this business and provide actionable insights.

Business Type: ${input.businessType}
Current Challenges: ${input.currentChallenges.join(', ')}
Goals: ${input.goals.join(', ')}
Current Tools: ${input.currentTools?.join(', ') || 'None'}

Provide a JSON response with:
1. insights: Array of business insights with type, title, description, and priority
2. recommendations: Array of recommended modules/features with reasons
3. automationOpportunities: Array of tasks that can be automated

Focus on practical, actionable advice for a creative professional or small business owner.`;

  try {
    const response = await hf.chatCompletion({
      model: DEFAULT_MODELS.analysis,
      messages: [
        {
          role: 'system',
          content: 'You are an expert business consultant specializing in helping creative professionals and small businesses optimize their operations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Try to parse JSON response, fallback to structured format
    try {
      return JSON.parse(content);
    } catch {
      // If AI doesn't return valid JSON, create a structured response
      return parseBusinessAnalysisFromText(content, input);
    }
  } catch (error) {
    console.error('[AI Service] Business analysis error:', error);
    throw new Error('Failed to analyze business needs');
  }
}

/**
 * Generate content (emails, messages, social posts)
 */
export async function generateContent(
  type: 'email' | 'social' | 'message',
  context: {
    purpose: string;
    tone?: 'professional' | 'casual' | 'friendly';
    audience?: string;
    keyPoints?: string[];
  }
): Promise<string> {
  const tone = context.tone || 'professional';
  const prompt = `Generate a ${tone} ${type} for the following purpose:

Purpose: ${context.purpose}
${context.audience ? `Audience: ${context.audience}` : ''}
${context.keyPoints ? `Key Points: ${context.keyPoints.join(', ')}` : ''}

Generate only the content, without any additional explanation.`;

  try {
    const response = await hf.chatCompletion({
      model: DEFAULT_MODELS.chat,
      messages: [
        {
          role: 'system',
          content: `You are a professional copywriter helping create ${type} content.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[AI Service] Content generation error:', error);
    throw new Error('Failed to generate content');
  }
}

/**
 * Analyze invoice/payment patterns for insights
 */
export async function analyzeFinancialPatterns(
  invoiceData: Array<{
    total: number;
    status: string;
    issueDate: Date;
    dueDate: Date;
  }>
): Promise<{
  insights: string[];
  predictions: {
    nextMonthRevenue: number;
    confidence: number;
  };
  recommendations: string[];
}> {
  const totalRevenue = invoiceData
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);
  
  const avgInvoice = totalRevenue / invoiceData.length;
  const overdueCount = invoiceData.filter(i => i.status === 'overdue').length;

  const prompt = `Analyze these financial metrics and provide insights:

Total Revenue: $${totalRevenue.toFixed(2)}
Number of Invoices: ${invoiceData.length}
Average Invoice: $${avgInvoice.toFixed(2)}
Overdue Invoices: ${overdueCount}

Provide:
1. Key insights about the financial health
2. Revenue prediction for next month
3. Recommendations for improvement

Format as JSON with: insights (array), predictions (object with nextMonthRevenue and confidence), recommendations (array)`;

  try {
    const response = await hf.chatCompletion({
      model: DEFAULT_MODELS.analysis,
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst helping small businesses understand their finances.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(content);
    } catch {
      // Fallback with basic analysis
      return {
        insights: [
          `Total revenue: $${totalRevenue.toFixed(2)}`,
          `Average invoice value: $${avgInvoice.toFixed(2)}`,
          overdueCount > 0 ? `${overdueCount} overdue invoices need attention` : 'All invoices are current',
        ],
        predictions: {
          nextMonthRevenue: avgInvoice * invoiceData.length * 1.1,
          confidence: 0.7,
        },
        recommendations: [
          'Set up automated payment reminders',
          'Consider offering early payment discounts',
          'Review pricing strategy quarterly',
        ],
      };
    }
  } catch (error) {
    console.error('[AI Service] Financial analysis error:', error);
    throw new Error('Failed to analyze financial patterns');
  }
}

/**
 * Identify automation opportunities based on user behavior
 */
export async function identifyAutomationOpportunities(
  activityLog: Array<{
    action: string;
    frequency: number;
    timeSpent: number;
  }>
): Promise<Array<{
  task: string;
  currentEffort: string;
  automationPotential: 'high' | 'medium' | 'low';
  suggestedSolution: string;
}>> {
  const sortedActivities = activityLog
    .sort((a, b) => (b.frequency * b.timeSpent) - (a.frequency * a.timeSpent))
    .slice(0, 5);

  const prompt = `Analyze these repetitive tasks and suggest automation opportunities:

${sortedActivities.map((a, i) => 
  `${i + 1}. ${a.action} - Done ${a.frequency} times, ${a.timeSpent} minutes each`
).join('\n')}

For each task, provide:
- task: The task name
- currentEffort: Time/effort description
- automationPotential: high/medium/low
- suggestedSolution: Specific automation recommendation

Format as JSON array.`;

  try {
    const response = await hf.chatCompletion({
      model: DEFAULT_MODELS.analysis,
      messages: [
        {
          role: 'system',
          content: 'You are a business automation expert helping identify opportunities to save time.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 600,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    try {
      return JSON.parse(content);
    } catch {
      // Fallback with basic recommendations
      return sortedActivities.map(activity => ({
        task: activity.action,
        currentEffort: `${activity.frequency} times per month, ${activity.timeSpent} min each`,
        automationPotential: activity.frequency > 10 ? 'high' : 'medium' as const,
        suggestedSolution: 'Set up automated workflow to handle this task',
      }));
    }
  } catch (error) {
    console.error('[AI Service] Automation analysis error:', error);
    throw new Error('Failed to identify automation opportunities');
  }
}

/**
 * Helper function to parse business analysis from unstructured text
 */
function parseBusinessAnalysisFromText(
  text: string,
  input: BusinessAnalysisInput
): BusinessAnalysisResult {
  // Basic fallback structure based on business type
  const moduleRecommendations: Record<string, string[]> = {
    photographer: ['crm', 'scheduling', 'invoicing', 'website_builder', 'file_storage'],
    musician: ['crm', 'scheduling', 'marketing', 'website_builder', 'email_campaigns'],
    artist: ['crm', 'invoicing', 'website_builder', 'marketing', 'file_storage'],
    content_creator: ['crm', 'analytics', 'marketing', 'ai_assistant', 'email_campaigns'],
    real_estate_agent: ['crm', 'scheduling', 'marketing', 'analytics', 'ai_assistant'],
  };

  const recommendedModules = moduleRecommendations[input.businessType as keyof typeof moduleRecommendations] || 
    ['crm', 'scheduling', 'invoicing'];

  return {
    insights: [
      {
        type: 'efficiency_opportunity',
        title: 'Streamline Client Communication',
        description: 'Centralize all client interactions in one place to save time and improve response rates.',
        priority: 'high',
      },
      {
        type: 'automation_suggestion',
        title: 'Automate Follow-ups',
        description: 'Set up automated email sequences for new leads to increase conversion rates.',
        priority: 'medium',
      },
    ],
    recommendations: recommendedModules.map(module => ({
      module,
      reason: `Essential for ${input.businessType} business operations`,
      expectedImpact: 'Saves 5-10 hours per week',
    })),
    automationOpportunities: [
      {
        task: 'Client follow-up emails',
        effort: 'Low',
        impact: 'High',
      },
      {
        task: 'Invoice reminders',
        effort: 'Low',
        impact: 'Medium',
      },
    ],
  };
}

/**
 * Generate embeddings for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await hf.featureExtraction({
      model: DEFAULT_MODELS.embeddings,
      inputs: text,
    });

    // Handle different response types
    if (Array.isArray(response)) {
      if (response.length > 0 && Array.isArray(response[0])) {
        return response[0] as number[];
      }
      return response as number[];
    }
    return [];
  } catch (error) {
    console.error('[AI Service] Embedding generation error:', error);
    throw new Error('Failed to generate embedding');
  }
}

