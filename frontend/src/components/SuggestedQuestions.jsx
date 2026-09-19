export default function SuggestedQuestions({ questions, onPick, disabled }) {
  if (!questions?.length) return null;
  return (
    <section className="card suggestions">
      <h4>Try asking</h4>
      <div className="suggestion-chips">
        {questions.map((q) => (
          <button
            key={q}
            type="button"
            className="chip chip-button"
            disabled={disabled}
            onClick={() => onPick(q)}
            title={q}
          >
            {q}
          </button>
        ))}
      </div>
    </section>
  );
}
