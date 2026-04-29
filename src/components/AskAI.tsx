import { useState, useRef, useEffect } from "react";

// ─── Markdown renderer for AI responses ──────────────────────────────────────
function FormatAI({ text }: { text: string }) {
  const renderInline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} className="font-semibold text-slate-800">{p.slice(2,-2)}</strong>
        : p
    );

  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];
  let numbered: string[] = [];

  const flushBullets = () => {
    if (bullets.length) {
      out.push(<ul key={out.length} className="list-disc list-inside space-y-0.5 my-1 pl-1">{bullets.map((b,i)=><li key={i}>{renderInline(b)}</li>)}</ul>);
      bullets = [];
    }
  };
  const flushNumbered = () => {
    if (numbered.length) {
      out.push(<ol key={out.length} className="list-decimal list-inside space-y-0.5 my-1 pl-1">{numbered.map((n,i)=><li key={i}>{renderInline(n)}</li>)}</ol>);
      numbered = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushBullets(); flushNumbered(); continue; }
    if (/^#{1,3}\s/.test(line)) {
      flushBullets(); flushNumbered();
      out.push(<p key={out.length} className="font-semibold text-slate-800 mt-2 mb-0.5">{renderInline(line.replace(/^#{1,3}\s/,""))}</p>);
    } else if (/^[-*•]\s+/.test(line)) {
      flushNumbered();
      bullets.push(line.replace(/^[-*•]\s+/,""));
    } else if (/^\d+\.\s+/.test(line)) {
      flushBullets();
      numbered.push(line.replace(/^\d+\.\s+/,""));
    } else {
      flushBullets(); flushNumbered();
      out.push(<p key={out.length} className="my-0.5 leading-relaxed">{renderInline(line)}</p>);
    }
  }
  flushBullets(); flushNumbered();
  return <>{out}</>;
}

// ─── AskAI chat widget ────────────────────────────────────────────────────────
export type AskAISuggestion = { label: string; question: string };

export default function AskAI({ context, placeholder, trigger, suggestions, onConversationChange }: {
  context: string;
  placeholder?: string;
  // Parent can fire a one-shot question by setting trigger.text and bumping nonce.
  trigger?: { text: string; nonce: number };
  // Optional chip row above the input — each chip fires its question on click.
  // Disappears once the conversation has started so it doesn't compete for space.
  suggestions?: AskAISuggestion[];
  // Notifies the parent when the conversation is non-empty. Lets the surrounding
  // chrome (e.g. Clear button) reflect "you have something to lose" state.
  onConversationChange?: (hasConversation: boolean) => void;
}) {
  const [q,setQ]=useState("");
  const [msgs,setMsgs]=useState<{role:string;content:string}[]>([]);
  const [loading,setLoading]=useState(false);
  const bot=useRef<HTMLDivElement>(null);

  useEffect(()=>{ bot.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);
  useEffect(()=>{ onConversationChange?.(msgs.length > 0); }, [msgs.length, onConversationChange]);

  const ask=async(override?:string)=>{
    const u=(override ?? q).trim();
    if(!u||loading)return;
    if(!override) setQ("");
    setMsgs(m=>[...m,{role:"user",content:u}]); setLoading(true);
    const sys=`You are the CoreTechX AI operations assistant for Circl (Australia). ~5,000 active Commitments, ~20,000/month. The platform uses Commitment confidence scores (0-1), pre-computed shadow plans, and a 4-level autonomy ladder. Agents earn autonomy through measured accuracy. Hard limits (financial >$1k, WHS, legal, enterprise client comms, police/fire) are permanently Level 1. Workflow configuration allows authorised users to adjust autonomy levels per step per job type, with audit logging. All changes require a reason and are immutable once logged.\nContext: ${context}\nAnswer directly, under 150 words.`;
    let reply: string;
    try {
      const res = await fetch("/api/anthropic", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1000,system:sys,messages:[...msgs.map(m=>({role:m.role,content:m.content})),{role:"user",content:u}]})});
      const d = await res.json();
      const text = d?.content?.find((b:{type:string;text:string})=>b.type==="text")?.text;
      if (text) {
        reply = text;
      } else {
        // Surface API errors verbatim so config issues (bad key, wrong model, etc.) are diagnosable.
        const apiErr = d?.error?.message ?? d?.error ?? `HTTP ${res.status}`;
        const apiType = d?.error?.type ? ` (${d.error.type})` : "";
        reply = `⚠ AI error${apiType}: ${apiErr}`;
        console.error("AskAI: API returned non-content response", d);
      }
    } catch (e) {
      reply = `⚠ Could not reach /api/anthropic — ${e instanceof Error ? e.message : "network error"}`;
      console.error("AskAI: fetch threw", e);
    }
    setMsgs(m=>[...m,{role:"assistant",content:reply}]);
    setLoading(false);
  };

  // Fire a prefilled question whenever the parent bumps trigger.nonce.
  useEffect(()=>{
    if(trigger?.text) void ask(trigger.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[trigger?.nonce]);

  return (
    <div>
      <div className="overflow-y-auto space-y-2 mb-3 pr-1" style={{maxHeight:"160px"}}>
        {msgs.length===0&&<p className="text-slate-400 text-xs italic">{placeholder||"Ask..."}</p>}
        {msgs.map((m,i)=>(
          <div key={i} className={`text-sm rounded-lg px-3 py-2 ${m.role==="user"?"bg-slate-100 text-slate-800 ml-6":"bg-[#e0f7ff] text-slate-700 mr-6 border border-[#00BDFE]/30"}`}>
            <span className="font-semibold text-xs uppercase tracking-wide opacity-60 block mb-1">{m.role==="user"?"You":"CoreTechX AI"}</span>
            {m.role==="assistant" ? <FormatAI text={m.content}/> : m.content}
          </div>
        ))}
        {loading&&<div className="bg-[#e0f7ff] border border-[#00BDFE]/30 rounded-lg px-3 py-2 text-[#0099d4] text-sm mr-6 animate-pulse">Thinking...</div>}
        <div ref={bot}/>
      </div>
      {/* Suggestion chips — only shown before the conversation starts */}
      {suggestions && suggestions.length > 0 && msgs.length === 0 && !loading && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.map((s,i)=>(
            <button
              key={i}
              onClick={()=>void ask(s.question)}
              title={s.question}
              className="text-[11px] bg-[#e0f7ff] hover:bg-[#00BDFE] hover:text-white text-[#0077a8] border border-[#00BDFE]/30 rounded-full px-2.5 py-1 font-medium transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-white text-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-[#00BDFE]"
          placeholder={placeholder||"Ask..."}
          value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&ask()}
        />
        <button
          onClick={()=>ask()}
          disabled={loading||!q.trim()}
          className="bg-[#00BDFE] hover:bg-[#0099d4] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
