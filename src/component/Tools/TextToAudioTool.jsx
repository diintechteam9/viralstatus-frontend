import React, { useMemo, useState } from 'react'

import  {API_BASE_URL } from '../../config';

const TextToAudioTool = () => {
  const tabs = useMemo(() => ([
    { id: 'elevenlab', label: 'Eleven Lab', accent: '#2563eb' },
    { id: 'lmnt', label: 'LMNT', accent: '#2563eb' },
    { id: 'servam', label: 'Servam', accent: '#2563eb' }
  ]), [])

  const [activeTabId, setActiveTabId] = useState('elevenlab')
  const [inputText, setInputText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0], [activeTabId, tabs])

  const handleGenerate = async () => {
    setErrorMessage('')
    setAudioUrl('')
    if (!inputText.trim()) {
      setErrorMessage('Please enter some text to generate audio.')
      return
    }
    setIsGenerating(true)

    try {
      if (activeTabId === 'elevenlab') {
        const res = await fetch(`${API_BASE_URL}/api/videocard/elevenlabs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to generate audio with Eleven Labs')
        }
        const data = await res.json()
        if (data && data.audio) {
          setAudioUrl(`data:audio/mp3;base64,${data.audio}`)
        } else {
          throw new Error('Invalid response from Eleven Labs')
        }
      } else if (activeTabId === 'lmnt') {
        const res = await fetch(`${API_BASE_URL}/api/videocard/lmnt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to generate audio with LMNT')
        }
        const data = await res.json()
        if (data && data.audio) {
          setAudioUrl(`data:audio/mp3;base64,${data.audio}`)
        } else {
          throw new Error('Invalid response from LMNT')
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/videocard/sarvam`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to generate audio with Sarvam')
        }
        const data = await res.json()
        if (data && data.audio) {
          setAudioUrl(`data:audio/mp3;base64,${data.audio}`)
        } else {
          throw new Error('Invalid response from Sarvam')
        }
      }
    } catch (e) {
      setErrorMessage(e.message || 'Failed to generate audio.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Styles (kept inline for component encapsulation)
  const containerStyle = { maxWidth: 1260, margin: '24px auto', padding: 0 }

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
  }

  const headerStyle = {
    padding: '16px 20px',
    background: '#f8fafc',
    borderBottom: '1px solid #e5e7eb',
    color: '#111827',
    fontWeight: 700,
    fontSize: 16
  }

  const tabbarStyle = { display: 'flex', gap: 8, padding: 12, background: '#ffffff', borderBottom: '1px solid #e5e7eb' }

  const tabStyle = (isActive, accent) => ({
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    color: isActive ? '#1e3a8a' : '#374151',
    background: isActive ? '#e0f2fe' : '#ffffff',
    border: '1px solid #e5e7eb'
  })

  const bodyStyle = { padding: 20, display: 'grid', gridTemplateColumns: '1fr', gap: 16 }

  const labelStyle = { fontSize: 13, color: '#4b5563', fontWeight: 600 }

  const textareaStyle = {
    width: '100%',
    minHeight: 140,
    borderRadius: 10,
    padding: 12,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    color: '#111827',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.5
  }

  const actionRowStyle = { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }

  const buttonStyle = {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #2563eb',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    color: '#ffffff',
    background: '#2563eb'
  }

  const helperTextStyle = { fontSize: 12, color: '#6b7280' }

  const errorStyle = { color: '#b91c1c', fontSize: 13, fontWeight: 600 }

  const audioCardStyle = { marginTop: 8, padding: 16, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb' }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>Text to Speech</div>

        <div style={tabbarStyle}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              style={tabStyle(activeTabId === tab.id, tab.accent)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={bodyStyle}>
          <div>
            <div style={labelStyle}>Input Text for {activeTab.label}</div>
            <textarea
              style={textareaStyle}
              placeholder={`Type what you want ${activeTab.label} to say…`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          <div style={actionRowStyle}>
            <button onClick={handleGenerate} style={buttonStyle} disabled={isGenerating}>
              {isGenerating ? 'Generating…' : 'Generate Audio'}
            </button>
            <span style={helperTextStyle}>
              {isGenerating ? 'Synthesizing high‑quality audio…' : 'Preview will appear below after generation.'}
            </span>
          </div>

          {errorMessage ? (
            <div style={errorStyle}>{errorMessage}</div>
          ) : null}

          {audioUrl ? (
            <div style={audioCardStyle}>
              <div style={{ marginBottom: 8, fontWeight: 700, color: '#1f2937' }}>Preview</div>
              <audio controls src={audioUrl} style={{ width: '100%' }} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default TextToAudioTool
