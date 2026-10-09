"use client";

import { useEffect, useRef, useState } from "react";
import { isDemoEntrySearch } from "../demo-entry";

export function useDemoEntry({
  sessionChecked,
  signedIn,
  onStart,
}: {
  sessionChecked: boolean;
  signedIn: boolean;
  onStart: () => void;
}) {
  const evaluated = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionChecked || evaluated.current) return;
    evaluated.current = true;
    const url = new URL(window.location.href);
    if (isDemoEntrySearch(url.search)) {
      // Consume the request so failures and later sign-out cannot retry it.
      url.searchParams.delete("demo");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
      if (!signedIn) onStart();
    }
    // Synchronize the external URL handoff with auth visibility before revealing it.
    setReady(true);
  }, [onStart, sessionChecked, signedIn]);

  return ready;
}
