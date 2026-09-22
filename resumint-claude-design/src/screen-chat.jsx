const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Chat screen — primary post-onboarding view. Conversational construction of profile.

function ChatScreen({ user, onGenerate, onAttach, onNav }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: `¡Hola, ${user.name.split(" ")[0]}! Vamos a construir tu CV. Puedes contarme sobre tu experiencia o subir un documento.` },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  function send() {
    const v = input.trim(); if (!v) return;
    const newMsgs = [...messages, { role: "user", text: v }];
    setMessages(newMsgs);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const replies = [
        "Anotado. ¿En qué año iniciaste en ese rol y cuánto tiempo estuviste?",
        "¿Cuáles fueron tus principales logros o responsabilidades ahí?",
        "Entendido. ¿Qué herramientas o tecnologías usabas día a día?",
        "Perfecto. ¿Tienes alguna certificación o formación que quieras destacar?",
      ];
      setMessages(m => [...m, { role: "ai", text: replies[m.length % replies.length] }]);
    }, 1100);
  }

  const starters = [
    "Mi experiencia laboral",
    "Mis estudios",
    "Mis habilidades técnicas",
    "Un logro importante",
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 120px)", maxWidth: 980, margin: "0 auto",
      gap: 16,
    }}>
      {/* action strip */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Button variant="secondary" leftIcon={<Ic.paperclip size={16} />} onClick={onAttach}>
          Adjuntar documento
        </Button>
        <Button variant="dark" leftIcon={<Ic.sparkles size={16} />} onClick={onGenerate}>
          Generar CV
        </Button>
        <div style={{ flex: 1 }} />
        <Badge tone="lav" leftIcon={<Ic.sparkles size={12} />}>Asistente Claude</Badge>
      </div>

      {/* chat area */}
      <Card style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        {/* header */}
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--lav)", color: "var(--blue)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Ic.sparkles size={18} /></div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--deep)", fontSize: 14.5 }}>Asistente IA</div>
            <div style={{ fontSize: 12, color: "var(--mute)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block", marginRight: 6 }} />
              Listo para ayudarte
            </div>
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="scroll" style={{
          flex: 1, overflowY: "auto", padding: "28px 24px",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          {messages.map((m, i) => <MessageBubble key={i} msg={m} user={user} />)}
          {typing && <MessageBubble msg={{ role: "ai", typing: true }} user={user} />}

          {messages.length === 1 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12.5, color: "var(--mute)", marginBottom: 10, paddingLeft: 48 }}>
                Puedes empezar por...
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingLeft: 48 }}>
                {starters.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="focus-ring" style={{
                    padding: "8px 14px", borderRadius: 999,
                    border: "1px solid var(--line)", background: "var(--surface)",
                    color: "var(--deep)", fontSize: 13, cursor: "pointer",
                    transition: "all .15s var(--ease)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface)"}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* input */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 10,
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 14, padding: "10px 10px 10px 16px",
            boxShadow: "var(--sh-1)",
          }}>
            <textarea
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Escribe tu mensaje..."
              rows={1}
              style={{
                flex: 1, border: "none", outline: "none", resize: "none",
                fontSize: 14, color: "var(--ink)", maxHeight: 120,
                fontFamily: "inherit", padding: "6px 0", background: "transparent",
              }} />
            <button onClick={onAttach} title="Adjuntar PDF" className="focus-ring" style={{
              width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line)",
              background: "var(--surface)", color: "var(--mute)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><Ic.paperclip size={16} /></button>
            <button onClick={send} disabled={!input.trim()} className="focus-ring" style={{
              width: 36, height: 36, borderRadius: 10, border: "none",
              background: input.trim() ? "var(--blue)" : "var(--line)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() ? "pointer" : "not-allowed",
              transition: "background .15s var(--ease)",
            }}><Ic.send size={16} /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MessageBubble({ msg, user }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", gap: 12,
      flexDirection: isUser ? "row-reverse" : "row",
      animation: "fadeUp .24s var(--ease)",
    }}>
      {isUser ? (
        <Avatar src={user.photo} name={user.name} size={36} />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "var(--lav)", color: "var(--blue)",
          display: "flex", alignItems: "center", justifyContent: "center", flex: "none",
        }}><Ic.sparkles size={18} /></div>
      )}
      <div style={{
        maxWidth: "68%",
        background: isUser ? "var(--blue)" : "var(--surface-2)",
        color: isUser ? "#fff" : "var(--ink)",
        border: isUser ? "none" : "1px solid var(--line)",
        padding: "12px 16px", borderRadius: 14,
        borderTopLeftRadius: isUser ? 14 : 4,
        borderTopRightRadius: isUser ? 4 : 14,
        fontSize: 14, lineHeight: 1.55,
      }}>
        {msg.typing ? <TypingDots /> : msg.text}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, padding: "4px 0" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "var(--mute)",
          animation: `fadeUp .9s ease-in-out ${i*.15}s infinite alternate`,
        }} />
      ))}
    </span>
  );
}

window.ChatScreen = ChatScreen;
