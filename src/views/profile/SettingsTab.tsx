import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Crown, Zap, ExternalLink, CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SubscriptionDetails } from '@/hooks/useSubscription';

interface SettingsTabProps {
  subscription: SubscriptionDetails | null;
  subscriptionLoading: boolean;
  createPortalSession: () => Promise<{ url: string } | null>;
}

export function SettingsTab({ subscription, subscriptionLoading, createPortalSession }: SettingsTabProps) {
  const router = useRouter();
  const [openingPortal, setOpeningPortal] = useState(false);

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const result = await createPortalSession();
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
    } finally {
      setOpeningPortal(false);
    }
  };

  const getTierBadge = () => {
    if (!subscription) return null;
    const tierConfig: Record<string, { label: string; color: string; icon: any }> = {
      free_trial: { label: 'Free Trial', color: 'bg-info/10 text-info', icon: Clock },
      pro: { label: 'Pro', color: 'bg-primary/10 text-primary', icon: Crown },
      enterprise: { label: 'Enterprise', color: 'bg-warning/10 text-warning', icon: Zap },
    };
    const config = tierConfig[subscription.tier] || tierConfig.free_trial;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} border-0 font-semibold`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </div>
            {getTierBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscriptionLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : subscription ? (
            <>
              {/* Current Plan Info */}
              <div className="bg-muted rounded-lg p-4 border-2 border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {subscription.tier === 'free_trial' ? 'Free Trial' :
                       subscription.tier === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {subscription.status === 'trialing' && subscription.timeRemaining && (
                        <>
                          {subscription.timeRemaining.days > 0
                            ? `${subscription.timeRemaining.days} days remaining`
                            : subscription.timeRemaining.hours > 0
                            ? `${subscription.timeRemaining.hours} hours remaining`
                            : 'Trial expires soon'}
                        </>
                      )}
                      {subscription.status === 'active' && 'Active subscription'}
                      {subscription.status === 'past_due' && 'Payment past due'}
                      {subscription.status === 'canceled' && 'Subscription cancelled'}
                      {subscription.status === 'expired' && 'Subscription expired'}
                    </p>
                  </div>
                  {subscription.tier === 'free_trial' && (
                    <Button onClick={() => router.push('/pricing')}>
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  )}
                </div>

                {subscription.status === 'trialing' && subscription.timeRemaining && subscription.timeRemaining.days <= 3 && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 mt-4">
                    <p className="text-amber-800 text-sm font-medium">
                      Your trial ends {subscription.timeRemaining.days === 0
                        ? 'today'
                        : `in ${subscription.timeRemaining.days} day${subscription.timeRemaining.days !== 1 ? 's' : ''}`}.
                      Upgrade now to keep your access!
                    </p>
                  </div>
                )}

                {subscription.status === 'past_due' && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mt-4">
                    <p className="text-red-800 text-sm font-medium">
                      Your payment failed. Please update your payment method to continue using Pro features.
                    </p>
                  </div>
                )}
              </div>

              {/* Usage Meters */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Usage This Period</h3>
                <div className="space-y-4">
                  <UsageMeter label="Searches" used={subscription.usage.searches} limit={subscription.limits.searches} />
                  <UsageMeter label="Contact Enrichments" used={subscription.usage.candidatesEnriched} limit={subscription.limits.candidatesEnriched} />
                  <UsageMeter label="AI Calls" used={subscription.usage.aiCalls} limit={subscription.limits.aiCalls} />
                </div>
              </div>

              {/* Manage Subscription Button */}
              {subscription.tier !== 'free_trial' && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleManageSubscription}
                    disabled={openingPortal}
                    variant="outline"
                  >
                    {openingPortal ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Manage Subscription
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Update payment method, view invoices, or cancel subscription
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No subscription found</p>
              <Button onClick={() => router.push('/pricing')}>
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="destructive">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">
          {used} / {limit ?? 'Unlimited'}
        </span>
      </div>
      <Progress
        value={limit ? (used / limit) * 100 : 0}
        className="h-2"
      />
    </div>
  );
}
