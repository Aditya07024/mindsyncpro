/**
 * roleRouter.ts — Single source of truth for post-login routing.
 *
 * Mirrors the website's gating rules:
 *  - user        → Onboarding until onboarding.completedAt, then UserTabs
 *  - therapist   → TherapistOnboarding until super-admin verifies, then TherapistTabs
 *  - org_admin   → OrgOnboarding until organisation is verified, then OrgTabs
 *  - super_admin → AdminTabs
 */
import API from './api';

export type RouteTarget = { name: string; params?: Record<string, any> };

export type TherapistGate = 'not_started' | 'pending' | 'rejected' | 'verified';
export type OrgGate = 'not_started' | 'pending' | 'rejected' | 'verified';

export function getTherapistGate(profile: any): TherapistGate {
  const tp = profile?.therapistProfile;
  if (!tp) return 'not_started';
  // Legacy accounts may only carry the boolean flag
  if (tp.verificationStatus === 'verified' || tp.verified === true) return 'verified';
  if (tp.verificationStatus === 'rejected') return 'rejected';
  // A profile counts as "submitted" only once professional details exist
  const submitted = !!(tp.qualification || tp.documents?.degreeUrl || tp.documents?.licenseUrl);
  return submitted ? 'pending' : 'not_started';
}

export async function getOrgGate(): Promise<{ gate: OrgGate; organization?: any }> {
  try {
    const res = await API.org.me();
    const org = res?.organization;
    if (!org) return { gate: 'not_started' };
    const status = org.verificationStatus;
    if (status === 'verified') return { gate: 'verified', organization: org };
    if (status === 'rejected') return { gate: 'rejected', organization: org };
    return { gate: 'pending', organization: org };
  } catch {
    // 404 "Organization not found for user" → onboarding not started
    return { gate: 'not_started' };
  }
}

/**
 * Resolve where a signed-in account should land.
 * `role` overrides profile.role (useful right after setRole()).
 */
export async function resolveRoute(
  profile: any,
  opts: { role?: string; upgradePlan?: string | null } = {},
): Promise<RouteTarget> {
  const role = opts.role || profile?.role || 'user';
  const upgradePlan = opts.upgradePlan || undefined;

  if (role === 'super_admin') return { name: 'AdminTabs' };

  if (role === 'therapist') {
    const gate = getTherapistGate(profile);
    return gate === 'verified'
      ? { name: 'TherapistTabs' }
      : { name: 'TherapistOnboarding', params: { gate } };
  }

  if (role === 'org_admin') {
    const { gate } = await getOrgGate();
    return gate === 'verified'
      ? { name: 'OrgTabs' }
      : { name: 'OrgOnboarding', params: { gate } };
  }

  // Seeker
  if (profile?.onboarding?.completedAt) {
    return { name: 'UserTabs', params: { screen: 'Home', upgradePlan } };
  }
  return { name: 'Onboarding', params: { upgradePlan } };
}

/** Fetch profile + resolve + reset the navigation stack in one call. */
export async function routeSignedInUser(
  navigation: any,
  opts: { role?: string; upgradePlan?: string | null } = {},
): Promise<RouteTarget> {
  let profile: any = null;
  try {
    profile = await API.auth.me();
  } catch (err) {
    console.warn('[roleRouter] auth.me failed, falling back to role hint', err);
  }
  const target = await resolveRoute(profile, opts);
  navigation.reset({ index: 0, routes: [target] });
  return target;
}
