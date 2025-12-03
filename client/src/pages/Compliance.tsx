import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  ExternalLink,
  FileText,
  Calendar,
  Bell,
  TrendingUp,
  Info,
} from 'lucide-react';

export default function Compliance() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [activeSection, setActiveSection] = useState<string>('all');

  const { data: dashboard, isLoading, refetch } = trpc.compliance.getDashboard.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const { data: checklists } = trpc.compliance.getChecklists.useQuery({});
  
  const updateStatusMutation = trpc.compliance.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedItem(null);
      setNotes('');
    },
  });

  const handleStatusUpdate = async (
    complianceId: string,
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        tenantId: tenantId!,
        complianceId,
        status,
        notes: notes || undefined,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'skipped':
        return <Circle className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: { variant: 'default', className: 'bg-green-100 text-green-800' },
      in_progress: { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      not_started: { variant: 'outline', className: '' },
      skipped: { variant: 'secondary', className: '' },
    };

    const config = variants[status] || variants.not_started;

    return (
      <Badge {...config}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'text-red-600';
    if (daysUntil <= 7) return 'text-orange-600';
    if (daysUntil <= 14) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading compliance dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const checklist = checklists?.[0]; // Get the first active checklist

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Compliance Tracker</h1>
          <p className="text-gray-600 mt-1">
            Stay on top of business requirements, tax deadlines, and regulatory compliance
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dashboard?.stats.completionRate || 0}%</div>
              <Progress value={dashboard?.stats.completionRate || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {dashboard?.stats.completed || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                of {dashboard?.stats.total || 0} items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {dashboard?.stats.inProgress || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">items being worked on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {dashboard?.stats.overdue || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">need immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        {dashboard?.upcomingDeadlines && dashboard.upcomingDeadlines.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <CardTitle>Upcoming Deadlines</CardTitle>
              </div>
              <CardDescription>Important dates in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.upcomingDeadlines.slice(0, 5).map((deadline) => (
                  <div
                    key={deadline.compliance.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{deadline.compliance.itemId}</p>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(deadline.compliance.nextDueDate!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-right ${getPriorityColor(deadline.daysUntilDue)}`}>
                      <p className="font-bold">{deadline.daysUntilDue} days</p>
                      <p className="text-xs">remaining</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Checklist */}
        {checklist && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{checklist.title}</CardTitle>
                  <CardDescription>
                    Version {checklist.version} • {checklist.region}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" onValueChange={setActiveSection}>
                <TabsList>
                  <TabsTrigger value="all">All Items</TabsTrigger>
                  {checklist.sections.map((section: any) => (
                    <TabsTrigger key={section.id} value={section.id}>
                      {section.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                  {checklist.sections.map((section: any) => (
                    <div key={section.id} className="space-y-3">
                      <div className="border-b pb-2">
                        <h3 className="font-semibold text-lg">{section.title}</h3>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                      {section.items.map((item: any) => {
                        const complianceItem = dashboard?.status.find(
                          (s) => s.itemId === item.id
                        );
                        return (
                          <Card key={item.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <div className="mt-1">
                                  {getStatusIcon(complianceItem?.status || 'not_started')}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-semibold">{item.label}</h4>
                                      {getStatusBadge(complianceItem?.status || 'not_started')}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-3">{item.details}</p>
                                  {item.note && (
                                    <div className="flex items-start gap-2 p-2 bg-blue-50 rounded text-sm mb-3">
                                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-blue-900">{item.note}</span>
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    {complianceItem?.status !== 'completed' && (
                                      <>
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => setSelectedItem(complianceItem)}
                                            >
                                              Update Status
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Update Compliance Status</DialogTitle>
                                              <DialogDescription>{item.label}</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                              <Textarea
                                                placeholder="Add notes (optional)..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={4}
                                              />
                                              <div className="flex gap-2">
                                                <Button
                                                  onClick={() =>
                                                    handleStatusUpdate(
                                                      complianceItem?.id!,
                                                      'in_progress'
                                                    )
                                                  }
                                                  variant="outline"
                                                >
                                                  Mark In Progress
                                                </Button>
                                                <Button
                                                  onClick={() =>
                                                    handleStatusUpdate(
                                                      complianceItem?.id!,
                                                      'completed'
                                                    )
                                                  }
                                                >
                                                  Mark Complete
                                                </Button>
                                              </div>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      </>
                                    )}
                                    {item.link && (
                                      <Button size="sm" variant="ghost" asChild>
                                        <a
                                          href={item.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ExternalLink className="w-4 h-4 mr-1" />
                                          Learn More
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
                </TabsContent>

                {checklist.sections.map((section: any) => (
                  <TabsContent key={section.id} value={section.id} className="space-y-3 mt-4">
                    <div className="border-b pb-2 mb-4">
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                    {/* Same item rendering as "all" tab */}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

