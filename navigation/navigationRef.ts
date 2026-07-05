// navigation/navigationRef.ts
// Module-level navigation handle so non-component code (push-notification taps)
// can navigate. If the tree isn't ready yet (cold start from a notification),
// the intent is stashed and flushed from NavigationContainer's onReady.
import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let pending: { name: string; params?: object } | null = null;

export function navigateFromNotification(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.navigate({ name, params }));
  } else {
    pending = { name, params };
  }
}

export function flushPendingNavigation() {
  if (pending && navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.navigate({ name: pending.name, params: pending.params }));
    pending = null;
  }
}
