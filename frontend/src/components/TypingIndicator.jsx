export default function TypingIndicator() {
  return (
    <div className="message-row message-assistant">
      <div className="avatar" aria-hidden="true">AI</div>
      <div className="bubble bubble-typing" aria-label="Assistant is typing">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}
