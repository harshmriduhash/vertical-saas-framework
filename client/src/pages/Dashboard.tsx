import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Users,
  DollarSign,
  Calendar,
  FileText,
  MessageSquare,
} from 'lucide-react';

export default function Dashboard() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  const { data: tenant, isLoading: tenantLoading } = trpc.tenant.get.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const { data: insights, isLoading: insightsLoading } = trpc.ai.getInsights.useQuery(
    { tenantId: tenantId!, status: 'new' },
    { enabled: !!tenantId }
  );

  const updateInsightMutation = trpc.ai.updateInsightStatus.useMutation();

  const handleInsightAction = async (insightId: string, status: 'viewed' | 'in_progress' | 'dismissed') => {
    try {
      await updateInsightMutation.mutateAsync({
        tenantId: tenantId!,
        insightId,
        status,
      });
      // Refetch insights
      window.location.reload();
    } catch (error) {
      console.error('Failed to update insight:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'efficiency_opportunity':
        return <Zap className="w-5 h-5" />;
      case 'revenue_prediction':
        return <TrendingUp className="w-5 h-5" />;
      case 'client_churn_risk':
        return <AlertCircle className="w-5 h-5" />;
      case 'automation_suggestion':
        return <Sparkles className="w-5 h-5" />;
      case 'growth_opportunity':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getModuleIcon = (moduleType: string) => {
    switch (moduleType) {
      case 'crm':
        return <Users className="w-5 h-5" />;
      case 'scheduling':
        return <Calendar className="w-5 h-5" />;
      case 'invoicing':
        return <DollarSign className="w-5 h-5" />;
      case 'ai_assistant':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  if (tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tenant) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Workspace Not Found</h2>
          <p className="text-gray-600">The workspace you're looking for doesn't exist or you don't have access.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{tenant.tenant.name}</h1>
            <p className="text-gray-600 mt-1">
              {tenant.tenant.businessType.replace('_', ' ')} • {tenant.tenant.subscriptionTier} plan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={tenant.tenant.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
              {tenant.tenant.subscriptionStatus}
            </Badge>
            {tenant.tenant.subscriptionStatus === 'trial' && tenant.tenant.trialEndsAt && (
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                Trial ends {new Date(tenant.tenant.trialEndsAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">Start adding contacts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">Appointments this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">New recommendations</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Section */}
        {insights && insights.length > 0 && (
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <CardTitle>AI-Powered Insights</CardTitle>
              </div>
              <CardDescription>
                Personalized recommendations to help you grow your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight) => (
                  <Card key={insight.id} className={`border ${getPriorityColor(insight.priority)}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">{getInsightIcon(insight.insightType)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {insight.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-4">{insight.description}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleInsightAction(insight.id, 'in_progress')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Take Action
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleInsightAction(insight.id, 'dismissed')}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enabled Modules */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tools</CardTitle>
            <CardDescription>
              Features enabled for your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tenant.modules.map((module) => (
                <Card key={module.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-3">
                      {getModuleIcon(module.moduleType)}
                    </div>
                    <h4 className="font-semibold capitalize">
                      {module.moduleType.replace('_', ' ')}
                    </h4>
                    <Badge variant="secondary" className="mt-2">
                      Active
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Complete these steps to make the most of your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="flex-1">Complete onboarding</span>
                <Badge variant="secondary">Done</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                <span className="flex-1">Add your first contact</span>
                <Button size="sm" variant="outline">Start</Button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                <span className="flex-1">Create your first invoice</span>
                <Button size="sm" variant="outline">Start</Button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                <span className="flex-1">Set up your booking calendar</span>
                <Button size="sm" variant="outline">Start</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

