import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../context/AuthContext';

const inputStyle = { width: '100%', padding: '8px 12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontSize: 14, boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 13, color: '#8b949e', marginBottom: 6, fontWeight: 600 };
const sectionStyle = { marginBottom: 24 };

export default function ProblemForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    tags: '',
    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
    codeStubs: [{ language: 'python3', starterCode: '', driverCode: '' }],
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/admin/problems/${id}`)
      .then(r => {
        const p = r.data;
        setForm({
          title: p.title,
          description: p.description,
          difficulty: p.difficulty,
          tags: (p.tags || []).join(', '),
          testCases: p.testCases?.length ? p.testCases : [{ input: '', expectedOutput: '', isHidden: false }],
          codeStubs: p.codeStubs?.length ? p.codeStubs : [{ language: 'python3', starterCode: '', driverCode: '' }],
        });
      })
      .catch(() => setError('Failed to load problem'))
      .finally(() => setLoading(false));
  }, [id]);

  function updateField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function updateTestCase(i, field, value) {
    setForm(f => {
      const tc = [...f.testCases];
      tc[i] = { ...tc[i], [field]: value };
      return { ...f, testCases: tc };
    });
  }

  function removeTestCase(i) {
    setForm(f => ({ ...f, testCases: f.testCases.filter((_, idx) => idx !== i) }));
  }

  function addTestCase() {
    setForm(f => ({ ...f, testCases: [...f.testCases, { input: '', expectedOutput: '', isHidden: false }] }));
  }

  function updateStub(i, field, value) {
    setForm(f => {
      const stubs = [...f.codeStubs];
      stubs[i] = { ...stubs[i], [field]: value };
      return { ...f, codeStubs: stubs };
    });
  }

  function removeStub(i) {
    setForm(f => ({ ...f, codeStubs: f.codeStubs.filter((_, idx) => idx !== i) }));
  }

  function addStub() {
    setForm(f => ({ ...f, codeStubs: [...f.codeStubs, { language: 'python3', starterCode: '', driverCode: '' }] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (isEdit) {
        await api.put(`/admin/problems/${id}`, payload);
      } else {
        await api.post('/admin/problems', payload);
      }
      navigate('/admin/problems');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
      setSaving(false);
    }
  }

  if (loading) return <div style={{ color: '#8b949e' }}>Loading...</div>;

  const languages = ['python3', 'javascript', 'java', 'cpp', 'c', 'go', 'ruby', 'rust', 'csharp', 'php', 'swift', 'scala', 'r', 'bash', 'pascal'];

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#e6edf3' }}>
        {isEdit ? 'Edit Problem' : 'New Problem'}
      </h1>
      {error && <div style={{ color: '#f85149', marginBottom: 16, padding: '8px 12px', background: '#1a0a0a', borderRadius: 6, border: '1px solid #f85149' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={sectionStyle}>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={form.title} onChange={e => updateField('title', e.target.value)} required />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Description (Markdown)</label>
          <textarea style={{ ...inputStyle, height: 200, resize: 'vertical' }} value={form.description} onChange={e => updateField('description', e.target.value)} required />
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Difficulty</label>
            <select style={inputStyle} value={form.difficulty} onChange={e => updateField('difficulty', e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input style={inputStyle} value={form.tags} onChange={e => updateField('tags', e.target.value)} placeholder="array, hashmap, dynamic-programming" />
          </div>
        </div>

        {/* Test Cases */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Test Cases</label>
            <button type="button" onClick={addTestCase} style={{ padding: '4px 10px', background: '#1f2937', border: '1px solid #30363d', borderRadius: 4, color: '#58a6ff', cursor: 'pointer', fontSize: 13 }}>
              + Add Test Case
            </button>
          </div>
          {form.testCases.map((tc, i) => (
            <div key={i} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#8b949e', fontWeight: 600 }}>Test Case {i + 1}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ fontSize: 13, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={tc.isHidden} onChange={e => updateTestCase(i, 'isHidden', e.target.checked)} />
                    Hidden
                  </label>
                  {form.testCases.length > 1 && (
                    <button type="button" onClick={() => removeTestCase(i)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: 13 }}>Remove</button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Input</label>
                  <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={tc.input} onChange={e => updateTestCase(i, 'input', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Expected Output</label>
                  <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={tc.expectedOutput} onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Code Stubs */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Starter Code Stubs</label>
            <button type="button" onClick={addStub} style={{ padding: '4px 10px', background: '#1f2937', border: '1px solid #30363d', borderRadius: 4, color: '#58a6ff', cursor: 'pointer', fontSize: 13 }}>
              + Add Stub
            </button>
          </div>
          {form.codeStubs.map((stub, i) => (
            <div key={i} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <select style={{ ...inputStyle, width: 160 }} value={stub.language} onChange={e => updateStub(i, 'language', e.target.value)}>
                  {languages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                {form.codeStubs.length > 1 && (
                  <button type="button" onClick={() => removeStub(i)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: 13 }}>Remove</button>
                )}
              </div>
              <label style={labelStyle}>Starter Code (shown to user)</label>
              <textarea style={{ ...inputStyle, height: 120, resize: 'vertical', fontFamily: 'JetBrains Mono, monospace' }} value={stub.starterCode} onChange={e => updateStub(i, 'starterCode', e.target.value)} />
              <label style={{ ...labelStyle, marginTop: 10 }}>Driver Code (hidden — parses input, calls function, prints result)</label>
              <textarea style={{ ...inputStyle, height: 80, resize: 'vertical', fontFamily: 'JetBrains Mono, monospace' }} placeholder="e.g. n = int(input())\nprint(solve(n))" value={stub.driverCode || ''} onChange={e => updateStub(i, 'driverCode', e.target.value)} rows={4} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '10px 24px', background: saving ? '#1f2937' : '#238636', border: 'none', borderRadius: 6, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Problem'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/problems')}
            style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #30363d', borderRadius: 6, color: '#8b949e', cursor: 'pointer', fontSize: 14 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
