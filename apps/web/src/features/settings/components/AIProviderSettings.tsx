"use client";

// Settings Page - AI Provider Panel.
import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, FlaskConical, LoaderCircle, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { PasswordInput } from "@/components/forms/input-field";
import { SelectInput } from "@/components/forms/selection-field";
import { List } from "@/components/list";
import { Panel } from "@/components/panel";
import { SettingsControlRow } from "@/components/settings-control-row";
import { controlGapClass } from "@/components/spacing";
import { Switch } from "@/components/switch";
import { useFeatureAction } from "@/components/use-feature-action";
import type { FeatureActionOptions } from "@/components/use-feature-action";
import type { AIProviderMessages } from "@/messages/ai-provider-messages";
import { getAIProviderSettings, saveAIProviderSettings, testAIProvider } from "../ai-provider-actions";
import { defaultAIProviderStatus } from "../ai-provider";
import type { AIProviderStatus } from "../ai-provider";

export function AIProviderSettings({ darkMode, messages, showSuccessNotification, ...options }: Omit<FeatureActionOptions, "resultMessages"> & {
  darkMode: boolean;
  messages: AIProviderMessages;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const invoke = useFeatureAction({ ...options, resultMessages: messages.resultMessages });
  const invokeRef = useRef(invoke);
  useEffect(() => { invokeRef.current = invoke; }, [invoke]);
  const [status, setStatus] = useState<AIProviderStatus>(defaultAIProviderStatus);
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setAPIKey] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<"load" | "save" | "test" | "remove" | null>("load");
  const busy = useRef(false);
  const mounted = useRef(false);

  const load = useCallback(async () => {
    const result = await invokeRef.current(getAIProviderSettings);
    if (!mounted.current) return;
    if (result) { setStatus(result); setEnabled(result.enabled); setLoaded(true); }
    setPending(null);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => { mounted.current = false; };
  }, [load]);

  async function perform(kind: "save" | "test" | "remove") {
    if (busy.current || !loaded) return;
    busy.current = true;
    setPending(kind);
    try {
      if (kind === "test") {
        const result = await invoke(() => testAIProvider(apiKey || undefined));
        if (result && mounted.current) showSuccessNotification(messages.tested, messages.title);
      } else {
        const result = await invoke(() => saveAIProviderSettings({
          provider: "google_gemini", enabled: kind === "remove" ? false : enabled,
          apiKey: kind === "remove" ? undefined : apiKey, removeKey: kind === "remove",
        }));
        if (result && mounted.current) {
          setStatus(result); setEnabled(result.enabled); setAPIKey("");
          showSuccessNotification(messages.saved, messages.title);
        }
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(null);
    }
  }

  return (
    <Panel darkMode={darkMode} className="min-w-0">
      <CardHeader darkMode={darkMode} icon={<Bot size={18} aria-hidden="true" />}
        title={messages.title} description={messages.description} />
      <List darkMode={darkMode}>
        <SettingsControlRow darkMode={darkMode} title={messages.enabled}
          control={<fieldset disabled={!loaded || pending !== null}>
            <Switch darkMode={darkMode} label={messages.enabled} checked={enabled} onChange={setEnabled} />
          </fieldset>} />
        <SettingsControlRow darkMode={darkMode} title={messages.provider}
          control={<SelectInput darkMode={darkMode} disabled value="google_gemini" onChange={() => {}}
            aria-label={messages.provider} options={[{ value: "google_gemini", label: "Google Gemini" }]} />} />
        <SettingsControlRow darkMode={darkMode} title={messages.apiKey}
          support={pending === "load" ? messages.loading : status.hasKey ? messages.savedKey : messages.noKey}
          control={<div className={`flex w-full min-w-0 items-center ${controlGapClass}`}>
            <div className="min-w-0 flex-1"><PasswordInput darkMode={darkMode} value={apiKey}
              aria-label={messages.apiKey} autoComplete="new-password" maxLength={256} spellCheck={false}
              placeholder={status.hasKey ? messages.replacePlaceholder : messages.placeholder}
              disabled={!loaded || pending !== null} onChange={event => setAPIKey(event.target.value)} /></div>
            {status.hasKey ? <Button darkMode={darkMode} tone="ghost" size="icon"
              title={messages.remove} aria-label={messages.remove} disabled={pending !== null}
              onClick={() => void perform("remove")}><Trash2 size={16} aria-hidden="true" /></Button> : null}
          </div>} />
        <SettingsControlRow darkMode={darkMode} title={null}
          control={<div className={`flex ${controlGapClass}`}>
            {!loaded && pending === null ? <Button darkMode={darkMode} tone="secondary" onClick={() => { setPending("load"); void load(); }}>
              <RefreshCw size={16} aria-hidden="true" />{messages.retry}</Button> : null}
            <Button darkMode={darkMode} tone="secondary" disabled={!loaded || pending !== null || (!apiKey.trim() && !status.hasKey)}
              icon={<FlaskConical size={16} aria-hidden="true" />}
              loading={pending === "test"} loadingIcon={<LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              onClick={() => void perform("test")}>
              {messages.test}</Button>
            <Button darkMode={darkMode} tone="primary" disabled={!loaded || pending !== null || (!apiKey.trim() && enabled === status.enabled)}
              icon={<Save size={16} aria-hidden="true" />}
              loading={pending === "save"} loadingIcon={<LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              onClick={() => void perform("save")}>
              {messages.save}</Button>
          </div>} />
      </List>
    </Panel>
  );
}
