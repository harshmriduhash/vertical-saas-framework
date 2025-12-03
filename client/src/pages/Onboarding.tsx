import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, Target, Zap } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'photographer', label: 'Photographer', icon: '📸' },
  { value: 'musician', label: 'Musician', icon: '🎵' },
  { value: 'artist', label: 'Artist', icon: '🎨' },
  { value: 'content_creator', label: 'Content Creator', icon: '✍️' },
  { value: 'real_estate_agent', label: 'Real Estate Agent', icon: '🏠' },
  { value: 'designer', label: 'Designer', icon: '🎭' },
  { value: 'writer', label: 'Writer', icon: '📝' },
  { value: 'consultant', label: 'Consultant', icon: '💼' },
  { value: 'other', label: 'Other', icon: '⭐' },
];

const COMMON_CHALLENGES = [
  'Managing client relationships',
  'Scheduling and appointments',
  'Creating and sending invoices',
  'Marketing and social media',
  'Following up with leads',
  'Tracking projects and deadlines',
  'Managing finances',
  'Creating content',
];

const COMMON_GOALS = [
  'Get more clients',
  'Save time on admin tasks',
  'Increase revenue',
  'Improve client communication',
  'Automate repetitive work',
  'Better organize my business',
  'Scale my operations',
  'Focus more on creative work',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [challenges, setChallenges] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [customChallenge, setCustomChallenge] = useState('');
  const [customGoal, setCustomGoal] = useState('');

  const createTenantMutation = trpc.tenant.create.useMutation();
  const analyzeBusinessMutation = trpc.ai.analyzeBusinessNeeds.useMutation();

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleChallenge = (challenge: string) => {
    setChallenges(prev =>
      prev.includes(challenge)
        ? prev.filter(c => c !== challenge)
        : [...prev, challenge]
    );
  };

  const toggleGoal = (goal: string) => {
    setGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Create tenant
      const result = await createTenantMutation.mutateAsync({
        name: businessName,
        businessType: businessType as any,
        subscriptionTier: 'free',
      });

      // Analyze business needs with AI
      setAnalyzing(true);
      const allChallenges = [...challenges];
      if (customChallenge) allChallenges.push(customChallenge);
      
      const allGoals = [...goals];
      if (customGoal) allGoals.push(customGoal);

      await analyzeBusinessMutation.mutateAsync({
        tenantId: result.tenantId,
        currentChallenges: allChallenges,
        goals: allGoals,
      });

      // Navigate to dashboard
      navigate(`/dashboard/${result.tenantId}`);
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return businessName.trim().length > 0 && businessType.length > 0;
      case 2:
        return challenges.length > 0 || customChallenge.trim().length > 0;
      case 3:
        return goals.length > 0 || customGoal.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-2xl">Welcome to Your AI-Powered Business</CardTitle>
            </div>
            <span className="text-sm text-gray-500">Step {step} of 4</span>
          </div>
          <CardDescription>
            Let's set up your personalized workspace in just a few minutes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <Label htmlFor="businessName">What's your business name?</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Sarah's Photography Studio"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>What type of business do you run?</Label>
                <RadioGroup value={businessType} onValueChange={setBusinessType} className="mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    {BUSINESS_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={type.value} id={type.value} />
                        <Label
                          htmlFor={type.value}
                          className="flex items-center gap-2 cursor-pointer font-normal"
                        >
                          <span className="text-xl">{type.icon}</span>
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 2: Challenges */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-orange-600" />
                <Label className="text-lg">What challenges are you facing?</Label>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select all that apply. This helps us recommend the right tools for you.
              </p>

              <div className="space-y-3">
                {COMMON_CHALLENGES.map((challenge) => (
                  <div key={challenge} className="flex items-center space-x-2">
                    <Checkbox
                      id={challenge}
                      checked={challenges.includes(challenge)}
                      onCheckedChange={() => toggleChallenge(challenge)}
                    />
                    <Label htmlFor={challenge} className="font-normal cursor-pointer">
                      {challenge}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Label htmlFor="customChallenge">Other challenge (optional)</Label>
                <Textarea
                  id="customChallenge"
                  placeholder="Describe any other challenges you're facing..."
                  value={customChallenge}
                  onChange={(e) => setCustomChallenge(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-green-600" />
                <Label className="text-lg">What are your goals?</Label>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Tell us what you want to achieve, and we'll help you get there.
              </p>

              <div className="space-y-3">
                {COMMON_GOALS.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={goals.includes(goal)}
                      onCheckedChange={() => toggleGoal(goal)}
                    />
                    <Label htmlFor={goal} className="font-normal cursor-pointer">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Label htmlFor="customGoal">Other goal (optional)</Label>
                <Textarea
                  id="customGoal"
                  placeholder="Describe any other goals you have..."
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review & Complete */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Almost There!</h3>
                <p className="text-gray-600">
                  Our AI is ready to analyze your needs and set up your perfect workspace.
                </p>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold">Business:</span> {businessName}
                    </div>
                    <div>
                      <span className="font-semibold">Type:</span>{' '}
                      {BUSINESS_TYPES.find(t => t.value === businessType)?.label}
                    </div>
                    <div>
                      <span className="font-semibold">Challenges:</span> {challenges.length + (customChallenge ? 1 : 0)} identified
                    </div>
                    <div>
                      <span className="font-semibold">Goals:</span> {goals.length + (customGoal ? 1 : 0)} set
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  What happens next?
                </h4>
                <ul className="text-sm space-y-2 text-gray-700">
                  <li>✓ AI analyzes your business needs</li>
                  <li>✓ Recommends the best tools for you</li>
                  <li>✓ Sets up your personalized dashboard</li>
                  <li>✓ Creates automation suggestions</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
            >
              Back
            </Button>

            {step < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {analyzing ? 'Analyzing with AI...' : 'Setting up...'}
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

