import { useState, useEffect, useCallback } from "react";
import { getUserCredits, onCreditsUpdated, UserCredits } from "../lib/storage";

/**
 * Hook to get and subscribe to real-time credit updates for a user.
 * Automatically re-renders when credits are updated from any component.
 */
export const useCredits = (userId: string) => {
  const [credits, setCredits] = useState<UserCredits | null>(() => 
    userId ? getUserCredits(userId) : null
  );

  const refreshCredits = useCallback(() => {
    if (userId) {
      setCredits(getUserCredits(userId));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setCredits(null);
      return;
    }

    // Initial fetch
    setCredits(getUserCredits(userId));

    // Subscribe to updates
    const unsubscribe = onCreditsUpdated((updatedUserId, updatedCredits) => {
      if (updatedUserId === userId) {
        setCredits(updatedCredits);
      }
    });

    return unsubscribe;
  }, [userId]);

  return { credits, refreshCredits };
};

/**
 * Hook to subscribe to ALL credit updates (useful for dashboards showing multiple users)
 */
export const useAllCreditsUpdates = (onUpdate: (userId: string, credits: UserCredits) => void) => {
  useEffect(() => {
    const unsubscribe = onCreditsUpdated(onUpdate);
    return unsubscribe;
  }, [onUpdate]);
};
