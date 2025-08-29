export async function generateQuiz({
    topic,
    withExplanations,
    useRetrieval
}) {
    const r = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            topic,
            withExplanations,
            useRetrieval
        })
    });
    if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Server error ${r.status}`);
    }
    return r.json();
}