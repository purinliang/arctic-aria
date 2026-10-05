"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!sessionChecked || evaluated.current) return;
    evaluated.current = true;
    const url = new URL(window.location.href);
    if (!isDemoEntrySearch(url.search)) return;

    // Consume the request so failures and later sign-out cannot retry it.
    url.searchParams.delete("demo");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    if (!signedIn) onStart();
  }, [onStart, sessionChecked, signedIn]);
}
