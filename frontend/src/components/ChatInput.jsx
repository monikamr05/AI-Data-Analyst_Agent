import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  function submit(event) {
    event?.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  }

  return (
    <form className="chat-input" onSubmit={submit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask a question about your data... (Enter to send, Shift+Enter for a new line)"
        rows={2}
        disabled={disabled}
      />
      <button className="btn btn-primary" type="submit" disabled={disabled || !text.trim()}>
        {disabled ? "Analyzing..." : "Send"}
      </button>
    </form>
  );
}
