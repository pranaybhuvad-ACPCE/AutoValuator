import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"inquiry_messages">;

function reportDatabaseError(action: string, error: { code?: string; message: string; details?: string; hint?: string }) {
  if (import.meta.env.DEV) {
    // Database errors can echo submitted values or URLs. Remove URL and credential-like text,
    // and never log the message body, session, or request headers.
    const sanitize = (value: string | undefined) => value
      ?.replace(/https?:\/\/[^\s"'`]+/gi, "[URL]")
      .replace(/\b(?:Bearer\s+)?(?:sb_publishable_[\w-]+|eyJ[\w-]+\.[\w-]+\.[\w-]+)\b/gi, "[REDACTED CREDENTIAL]")
      .slice(0, 1000);
    console.error(`[inquiry-messages] ${action} failed`, {
      code: error.code,
      message: sanitize(error.message),
      details: sanitize(error.details),
      hint: sanitize(error.hint),
    });
  }
}

function getSendErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "42P01" || error.code === "PGRST205") {
    return "Messaging is not set up in the database yet. Apply the inquiry messages migration, then try again.";
  }
  if (error.code === "42501" || error.code === "PGRST301") {
    return "Your account could not send a message in this conversation. Confirm you’re signed in as its Buyer or Seller.";
  }
  if (error.code === "23514") return "Messages must contain 1–2,000 non-space characters.";
  if (error.code === "23503") return "This inquiry or its listing is no longer available.";
  return "Your message couldn’t be sent. Check your connection and try again.";
}

export function InquiryConversation({
  inquiryId, initialMessage, initialCreatedAt, buyerId, userId, otherParticipantLabel,
}: {
  inquiryId: string;
  initialMessage: string;
  initialCreatedAt: string;
  buyerId: string;
  userId: string;
  otherParticipantLabel: "Buyer" | "Seller";
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadMessages = useCallback(async () => {
    setError("");
    const { data, error: queryError } = await supabase.from("inquiry_messages")
      .select("id, inquiry_id, sender_id, message, created_at")
      .eq("inquiry_id", inquiryId).order("created_at", { ascending: true }).order("id", { ascending: true });
    if (queryError) {
      reportDatabaseError("Load", queryError);
      setError(queryError.code === "42P01" || queryError.code === "PGRST205"
        ? "Messaging is not set up in the database yet. Apply the inquiry messages migration, then try again."
        : "Conversation history couldn’t be loaded. Check your access and try again.");
    }
    else setMessages(data ?? []);
    setLoading(false);
  }, [inquiryId]);

  useEffect(() => { void loadMessages(); }, [loadMessages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanMessage = draft.trim();
    if (!cleanMessage) { setError("Enter a message before sending."); return; }
    if (cleanMessage.length > 2000) { setError("Messages must be 2,000 characters or fewer."); return; }
    setSending(true);
    setError("");
    setNotice("");
    const { data, error: insertError } = await supabase.from("inquiry_messages")
      .insert({ inquiry_id: inquiryId, message: cleanMessage })
      .select("id, inquiry_id, sender_id, message, created_at").single();
    setSending(false);
    if (insertError) {
      reportDatabaseError("Send", insertError);
      setError(getSendErrorMessage(insertError));
    }
    else {
      setMessages((current) => [...current, data]);
      setDraft("");
      setNotice("Message sent.");
    }
  };

  return <div className="space-y-3 rounded-xl border bg-card p-4">
    <h3 className="flex items-center gap-2 text-sm font-semibold"><MessageSquare className="h-4 w-4 text-primary" />Conversation</h3>
    <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg bg-muted/30 p-3" aria-live="polite">
      <MessageBubble senderId={buyerId} currentUserId={userId} otherParticipantLabel={otherParticipantLabel} message={initialMessage} createdAt={initialCreatedAt} initial />
      {loading ? <p className="flex items-center gap-2 py-3 text-xs text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Loading conversation…</p>
        : messages.map((item) => <MessageBubble key={item.id} senderId={item.sender_id} currentUserId={userId} otherParticipantLabel={otherParticipantLabel} message={item.message} createdAt={item.created_at} />)}
      {!loading && messages.length === 0 && <p className="text-xs text-muted-foreground">No replies yet.</p>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-600">{notice}</p>}
    <form onSubmit={(event) => void sendMessage(event)} className="space-y-2">
      <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={3} placeholder="Write a reply…" aria-label="Your reply" disabled={sending} />
      <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{draft.length}/2,000</span><Button type="submit" size="sm" disabled={sending}>{sending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{sending ? "Sending…" : "Send"}</Button></div>
    </form>
  </div>;
}

function MessageBubble({ senderId, currentUserId, otherParticipantLabel, message, createdAt, initial = false }: {
  senderId: string; currentUserId: string; otherParticipantLabel: "Buyer" | "Seller"; message: string; createdAt: string; initial?: boolean;
}) {
  const mine = senderId === currentUserId;
  const who = mine ? "You" : otherParticipantLabel;
  return <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"}`}>
      <p className={`mb-1 text-xs font-semibold ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{who}{initial ? " · Inquiry" : ""}</p>
      <p className="whitespace-pre-wrap break-words leading-5">{message}</p>
      <time className={`mt-1 block text-right text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`} dateTime={createdAt}>{new Date(createdAt).toLocaleString()}</time>
    </div>
  </div>;
}
