import React, { useState, useMemo } from "react";
import { generateQuiz } from "./api.js";

export default function App() {
  const [topic, setTopic] = useState("Photosynthesis");
  const [withExplanations, setWithExplanations] = useState(false);
  const [useRetrieval, setUseRetrieval] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");
  const [score, setScore] = useState(null);
  const [answers, setAnswers] = useState({});

  const providerText = useMemo(() => {
    return "Provider set in server/.env (MOCK, OPENAI, ANTHROPIC, or OLLAMA)";
  }, []);

  const onGenerate = async () => {
    setError("");
    setQuiz(null);
    setScore(null);
    setAnswers({});
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }
    try {
      const data = await generateQuiz({
        topic: topic.trim(),
        withExplanations,
        useRetrieval,
      });
      setQuiz(data.quiz);
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const onSubmit = () => {
    if (!quiz) return;
    let correct = 0;
    const detail = [];
    quiz.questions.forEach((q) => {
      const chosen = answers[q.id];
      const right = q.correct_label;
      if (chosen === right) correct++;
      detail.push({ id: q.id, chosen, right, explanation: q.explanation });
    });
    setScore({ total: quiz.questions.length, correct, detail });
  };

  return (
    <div className="wrap">
      <h1>AI-Powered Knowledge Quiz Builder</h1>
      <p className="muted">
        Enter a topic, generate 5 A–D multiple-choice questions, then submit to
        see your score.
      </p>

      <div className="row">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Ancient Rome"
        />
        <label>
          <input
            type="checkbox"
            checked={withExplanations}
            onChange={(e) => setWithExplanations(e.target.checked)}
          />{" "}
          Explanations
        </label>
        <label>
          <input
            type="checkbox"
            checked={useRetrieval}
            onChange={(e) => setUseRetrieval(e.target.checked)}
          />{" "}
          Use retrieval
        </label>
        <button onClick={onGenerate}>Generate</button>
      </div>

      <div className="muted" style={{ marginTop: 8 }}>
        {providerText}
      </div>
      {useRetrieval && (
        <div className="muted" style={{ marginTop: 4 }}>
          Content may include summaries from{" "}
          <a
            href="https://www.wikipedia.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia®
          </a>
          (licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY-SA 4.0
          </a>
          ) and structured data from{" "}
          <a
            href="https://www.wikidata.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikidata
          </a>{" "}
          (CC0).
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {quiz && (
        <div className="quiz">
          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="question">
              <div className="stem">
                <span className="qnum">Q{idx + 1}.</span> {q.stem}
              </div>
              <div className="options">
                {q.options.map((o) => (
                  <label key={o.label}>
                    <input
                      type="radio"
                      name={q.id}
                      value={o.label}
                      checked={answers[q.id] === o.label}
                      onChange={() =>
                        setAnswers((a) => ({ ...a, [q.id]: o.label }))
                      }
                    />
                    <span>
                      {o.label}) {o.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button onClick={onSubmit}>Submit</button>
        </div>
      )}

      {score && (
        <div className="result">
          <strong>Score:</strong> {score.correct}/{score.total}
          {score.detail.map((d, idx) => {
            const isCorrect = d.chosen === d.right;
            return (
              <p
                key={d.id}
                className={isCorrect ? "answer-correct" : "answer-wrong"}
              >
                <strong>Q{idx + 1}</strong>: You chose{" "}
                <code>{d.chosen || "—"}</code>. Correct: <code>{d.right}</code>
                {d.explanation ? (
                  <div className="explanation">{d.explanation}</div>
                ) : null}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
