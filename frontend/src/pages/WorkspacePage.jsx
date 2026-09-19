import { useCallback, useEffect, useRef, useState } from "react";
import ChatInput from "../components/ChatInput.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import SuggestedQuestions from "../components/SuggestedQuestions.jsx";
import TypingIndicator from "../components/TypingIndicator.jsx";
import { askQuestion, fetchSuggestedQuestions } from "../services/api.js";
import { addRun } from "../services/history.js";

export default function WorkspacePage({ dataset, pendingQuestion, takePendingQuestion, onHistoryChange }) {
  const [suggested, setSuggested] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const bottomRef = useRef(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        text:
          `I've loaded "${dataset.name}". Ask me anything about it, ` +
          "or pick one of the suggested questions to get going.",
      },
    ]);
    setLoadError("");
    fetchSuggestedQuestions(dataset.id)
      .then((data) => setSuggested(data.questions || []))
      .catch(() => setSuggested([]));
  }, [dataset]);

  const sendQuestion = useCallback(
    async (rawQuestion) => {
      const text = rawQuestion.trim();
      if (!text || loading) return;

      setMessages((prev) => [...prev, { role: "user", text }]);
      setLoading(true);

      try {
        const history = messagesRef.current
          .filter((m) => !m.error)
          .slice(-6)
          .map((m) => ({ role: m.role, text: m.text }));
        const reply = await askQuestion(dataset.id, text, history);

        const assistantMsg = {
          role: "assistant",
          text: reply.answer || "Here is what I found:",
          table: reply.result?.type === "table" ? reply.result : null,
          value: reply.result?.type === "value" ? reply.result.value : null,
          chart: reply.chart,
          code: reply.code,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        addRun({
          question: text,
          datasetName: dataset.name,
          answer: assistantMsg.text,
          result: reply.result,
          chart: reply.chart,
          code: reply.code,
        });
        onHistoryChange?.();
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: err.message,
            error: true,
            retryQuestion: err.code === "quota_exhausted" ? text : null,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [dataset, loading, onHistoryChange]
  );

  // Consume a question handed over from the dashboard. The take is
  // synchronous (ref-based) so StrictMode's double effect run can't
  // deliver the same question twice.
  useEffect(() => {
    if (!pendingQuestion) return;
    const question = takePendingQuestion();
    if (question) sendQuestion(question);
  }, [pendingQuestion, takePendingQuestion, sendQuestion]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="workspace-layout">
      <section className="card chat-panel">
        <div className="chat-head">
          <p className="micro-label">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v3M18.4 5.6 16 8M21 12h-3M5.6 5.6 8 8M3 12h3M8 16c0 2.2 1.8 4 4 4s4-1.8 4-4m-7-3-1-1m7 1 1-1" />
            </svg>
            ASK AI WORKSPACE
          </p>
          <span className="muted small">Context: {dataset.name}</span>
        </div>

        <div className="chat-scroll">
          {messages.map((m, i) => (
            <ChatMessage
              key={i}
              message={m}
              onRetry={m.retryQuestion ? () => sendQuestion(m.retryQuestion) : undefined}
            />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && suggested.length > 0 && (
          <SuggestedQuestions
            questions={suggested.slice(0, 4)}
            onPick={sendQuestion}
            disabled={loading}
          />
        )}
        {loadError && <div className="alert alert-error">{loadError}</div>}
        <ChatInput onSend={sendQuestion} disabled={loading} />
      </section>
    </div>
  );
}
