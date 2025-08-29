export function validateQuiz(payload) {
    const errors = [];
    if (!payload || typeof payload !== 'object') return {
        is_valid: false,
        errors: ['Payload not object']
    };
    if (!payload.topic || typeof payload.topic !== 'string') errors.push("Missing/invalid 'topic'");
    const qs = payload.questions;
    if (!Array.isArray(qs) || qs.length !== 5) errors.push("'questions' must have exactly 5 items");
    if (errors.length) return {
        is_valid: false,
        errors
    };

    const ids = new Set();
    const stems = new Set();
    for (let i = 0; i < qs.length; i++) {
        const q = qs[i];
        if (typeof q !== 'object') {
            errors.push(`Q${i+1} not object`);
            continue;
        }
        if (!q.id || ids.has(q.id)) errors.push(`Q${i+1} missing/duplicate id`);
        else ids.add(q.id);
        if (!q.stem || String(q.stem).trim().length < 8) errors.push(`Q${i+1} stem missing/short`);
        const ops = q.options;
        if (!Array.isArray(ops) || ops.length !== 4) errors.push(`Q${i+1} must have 4 options`);
        const labels = new Set();
        (ops || []).forEach(o => {
            if (!o || typeof o !== 'object') errors.push(`Q${i+1} has non-object option`);
            if (!['A', 'B', 'C', 'D'].includes(o.label)) errors.push(`Q${i+1} invalid label ${o.label}`);
            if (labels.has(o.label)) errors.push(`Q${i+1} duplicate option label ${o.label}`);
            else labels.add(o.label);
            if (!o.text || !String(o.text).trim()) errors.push(`Q${i+1} empty text for ${o.label}`);
        });
        if (!['A', 'B', 'C', 'D'].includes(q.correct_label)) errors.push(`Q${i+1} invalid correct_label`);
    }
    return {
        is_valid: errors.length === 0,
        errors
    };
}