import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Zap,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Shield,
  Rocket,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Smart CRM',
      description: 'Manage clients and leads with AI-powered insights and automated follow-ups.',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Easy Scheduling',
      description: 'Let clients book appointments 24/7 with automatic reminders.',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: 'Quick Invoicing',
      description: 'Create professional invoices in seconds and get paid faster.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI Assistant',
      description: 'Get personalized business advice and content generation powered by AI.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Automation',
      description: 'Automate repetitive tasks and save 10+ hours per week.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Analytics',
      description: 'Track your business performance with real-time insights.',
    },
  ];

  const pricing = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      features: [
        'Up to 50 contacts',
        'Basic CRM',
        'Simple scheduling',
        '5 invoices/month',
        'Community support',
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Starter',
      price: '$39',
      description: 'For growing professionals',
      features: [
        '500 contacts',
        'AI business analyst',
        'Unlimited invoices',
        'Payment processing',
        'Email support',
      ],
      cta: 'Start 14-Day Trial',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$99',
      description: 'Full AI automation',
      features: [
        'Unlimited contacts',
        'Advanced AI features',
        'Marketing automation',
        'Analytics dashboard',
        'Priority support',
      ],
      cta: 'Start 14-Day Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$299',
      description: 'For teams and agencies',
      features: [
        'Everything in Pro',
        'Multi-user access',
        'White-label options',
        'API access',
        'Dedicated support',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Open-Source AI
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Run Your Business Like a Pro
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered tools built for creative professionals and small businesses.
            Get the same capabilities as big corporations, without the big price tag.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/onboarding">
              <Button size="lg" className="text-lg px-8">
                <Rocket className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need in One Place
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Why Creative Professionals Love Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div>
                <div className="text-4xl font-bold mb-2">10+</div>
                <div className="text-blue-100">Hours saved per week</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">3x</div>
                <div className="text-blue-100">Faster client response</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">$0</div>
                <div className="text-blue-100">Expensive AI API costs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600">
              Start free and upgrade as you grow. No hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${
                  plan.popular ? 'border-blue-600 border-2 shadow-xl' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== '$0' && <span className="text-gray-600">/month</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/onboarding">
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-none">
          <CardContent className="p-12 text-center">
            <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join creative professionals who are saving time, getting more clients,
              and growing their businesses with AI-powered tools.
            </p>
            <Link to="/onboarding">
              <Button size="lg" className="text-lg px-8">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="mb-2">
            Built with ❤️ using open-source AI models from Hugging Face
          </p>
          <p className="text-sm">
            © 2025 Vertical SaaS Framework. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

