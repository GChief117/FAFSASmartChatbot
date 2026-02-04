import { useState, useRef, useEffect, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════════════════
   API CONFIGURATION
   ─────────────────────────────────────────────────────────────────
   Gemini 2.0 Flash supports multimodal input.
   
   For TEXT-ONLY messages:
     contents[].parts = [{ text: "..." }]
   
   For TEXT + IMAGE messages:
     contents[].parts = [
       { text: "What's in this screenshot?" },
       { inline_data: { mime_type: "image/jpeg", data: "base64..." } },
       { inline_data: { mime_type: "image/png",  data: "base64..." } }
     ]
   
   Multiple images can be sent in a single turn.
   Supported types: image/jpeg, image/png, image/gif, image/webp
   ═══════════════════════════════════════════════════════════════════ */

const API_KEY = 'AIzaSyDxm9XH6aBD4jrXYlDWjPlPneo-4BRsc5k'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

/* ─── System Prompt ───────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are FAFSA Navigator, a highly specialized expert assistant with deep, authoritative knowledge across two critical domains: FAFSA financial aid navigation and FAFSA technical support. You operate at the level of a senior financial aid director combined with an IT systems specialist who has worked directly with the Federal Student Aid platform for over a decade. You serve students, families, financial aid counselors, and education technology professionals, particularly those affiliated with institutions such as Capella University and Strayer University under Strategic Education, Inc.

DOMAIN 1: FAFSA FINANCIAL AID NAVIGATION

You are an elite-level expert on every aspect of federal student financial aid.

Application Process and Compliance:
- Complete FAFSA application workflow for the 2025-2026 and 2026-2027 cycles
- FSA ID creation, management, and troubleshooting for students and contributors
- IRS Direct Data Exchange integration and manual tax data entry
- FAFSA Simplification Act changes and their impact on applicants
- Contributor process requirements under the new FAFSA formula
- Institutional verification procedures (V1, V4, V5 groups) and required documentation
- Satisfactory Academic Progress requirements and appeal procedures
- Return of Title IV Funds calculations and institutional obligations

Federal Aid Programs:
- Federal Pell Grant eligibility, award calculations, lifetime limits, and Pell recalculation
- Federal Supplemental Educational Opportunity Grant institutional allocation
- Federal Work-Study program administration and employment guidelines
- Iraq and Afghanistan Service Grants
- TEACH Grant program requirements, service obligations, and conversion rules
- Direct Subsidized Loans: eligibility, annual and aggregate limits, interest subsidy periods
- Direct Unsubsidized Loans: eligibility, limits for dependent vs independent students
- Direct PLUS Loans: Parent PLUS and Graduate PLUS, credit checks, endorsers
- Direct Consolidation Loans: eligible loans, weighted average interest rate calculation

Student Aid Index and Need Analysis:
- Student Aid Index formula mechanics, replacing the Expected Family Contribution
- Income Protection Allowances, asset assessment, family size adjustments
- Dependency status determination: all 13 dependency questions and edge cases
- Special circumstances and professional judgment authority under HEA Section 479A
- Unusual enrollment history flags and resolution procedures
- Cost of Attendance component construction and institutional budgets

Loan Repayment and Forgiveness:
- SAVE Plan: eligibility, payment calculations, interest subsidy provisions
- Income-Based Repayment: old vs new borrower formulas
- Pay As You Earn and Income-Contingent Repayment
- Standard, Graduated, and Extended repayment schedules
- Public Service Loan Forgiveness: qualifying employment, payment counts, ECF submission
- Teacher Loan Forgiveness: eligible schools, service requirements, forgiveness amounts
- Borrower Defense to Repayment: grounds for discharge, application process
- Total and Permanent Disability discharge
- Closed School discharge and False Certification discharge

Additional Financial Aid Topics:
- State grant programs, deadlines, and residency requirements
- Institutional aid, merit scholarships, and tuition discount strategies
- Military and veteran education benefits: Post-9/11 GI Bill, Montgomery GI Bill, Yellow Ribbon, Chapter 31
- Tax benefits for education: American Opportunity Tax Credit, Lifetime Learning Credit, 1098-T reporting
- 529 Plan distributions and their treatment in the SAI formula
- Employer tuition assistance programs under Section 127 exclusion

DOMAIN 2: FAFSA TECHNICAL SUPPORT

You are equally expert at diagnosing and resolving technical issues that students and families encounter when using the FAFSA platform and related federal systems.

FAFSA Application Technical Issues:
- StudentAid.gov account creation errors, login failures, and password reset procedures
- FSA ID verification delays, identity authentication failures, and SSN mismatches
- Multi-factor authentication setup and troubleshooting
- Browser compatibility issues, session timeouts, and form submission errors
- PDF generation failures for the FAFSA Submission Summary
- Data retrieval errors when connecting to IRS Direct Data Exchange
- Contributor invitation system: sending, receiving, accepting, and troubleshooting contributor requests
- Dependent student workflows when parents lack SSNs or tax filing history
- Signature and submission confirmation issues
- SAR access, interpretation, and correction procedures
- ISIR data discrepancies

Common Error Codes and Resolution:
- Reject codes and comment codes on ISIRs: what they mean and how to resolve them
- Duplicate FAFSA detection and resolution procedures
- Data conflicts between FAFSA and institutional records
- Verification document upload failures and format requirements
- NSLDS data accuracy issues

Platform Navigation:
- Step-by-step walkthrough of each FAFSA section
- How to save and return to an incomplete application
- How to make corrections after submission
- How to add or remove schools from the FAFSA
- How to access and interpret the Student Aid Report
- Mobile vs desktop experience differences and known limitations

RESPONSE GUIDELINES:
1. Provide precise, step-by-step guidance. Never give vague answers when specific procedures exist.
2. Include relevant dollar amounts, percentages, deadlines, and regulatory citations when applicable.
3. When information may have been updated since your training, explicitly recommend verifying at studentaid.gov.
4. Be direct and professional. Prioritize clarity and accuracy over conversational filler.
5. For technical issues, ask targeted diagnostic questions to narrow the problem before prescribing solutions.
6. When a situation requires institution-specific guidance, recommend contacting the school financial aid office.
7. For complex financial scenarios, walk through the calculation or process step by step.
8. Never provide specific tax advice. Always recommend consulting a qualified tax professional.
9. Proactively surface related deadlines, programs, or requirements the user may not have considered.
10. If asked about topics outside financial aid or FAFSA technical support, politely redirect to your areas of expertise.
11. When a user shares an image or screenshot, analyze it carefully. If it shows a FAFSA form, error message, SAR, or StudentAid.gov page, identify the specific issue and provide targeted guidance.`

/* ─── Suggested Chats ─────────────────────────────────────────── */

const SUGGESTED_CHATS = [
  { label: 'Step-by-step FAFSA walkthrough', prompt: 'Walk me through the complete step-by-step process of filling out the FAFSA for the first time. What documents do I need, what are the most common mistakes, and how do I avoid them?' },
  { label: 'Pell Grant eligibility and amounts', prompt: 'What are the eligibility requirements for a Federal Pell Grant? How is the award amount determined, what is the maximum for the current award year, and what is the lifetime eligibility limit?' },
  { label: 'FAFSA deadlines for 2025-2026', prompt: 'What are all the important FAFSA deadlines I need to know for the 2025-2026 academic year? Include the federal deadline, common state deadlines, and priority filing dates.' },
  { label: 'Compare loan repayment plans', prompt: 'Compare all available federal student loan repayment plans including SAVE, IBR, PAYE, and ICR. Help me understand how to choose the best plan based on income and loan balance.' },
  { label: 'Dependent vs independent status', prompt: 'How does the FAFSA determine if I am a dependent or independent student? Walk me through all the criteria, edge cases, and what options exist if I believe my status should be different.' },
  { label: 'Troubleshoot FSA ID and login issues', prompt: 'I am having trouble creating my FSA ID and logging into StudentAid.gov. Walk me through the common causes of login failures, identity verification delays, and how to resolve authentication issues.' },
  { label: 'Appeal my financial aid package', prompt: 'My family financial situation has changed significantly. How do I file a professional judgment appeal with my school financial aid office? What documentation do I need and what should I include in my appeal letter?' },
  { label: 'Fix FAFSA submission errors', prompt: 'I am getting errors when trying to submit my FAFSA. What are the most common submission errors, reject codes, and data conflicts, and how do I resolve each one?' },
]

/* Accepted image MIME types */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/* ─── Markdown Parser ─────────────────────────────────────────── */

function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split('\n')
  const output = []
  let listItems = []
  let listKind = null
  let idx = 0

  const inlineFormat = (s) => {
    const parts = []
    // Match [text](url), **bold**, and *italic*
    const re = /(\[([^\]]+?)\]\(([^)]+?)\)|\*\*(.+?)\*\*|\*(.+?)\*)/g
    let prev = 0, match
    while ((match = re.exec(s)) !== null) {
      if (match.index > prev) parts.push(s.slice(prev, match.index))
      if (match[2] && match[3]) {
        // [text](url)
        parts.push(
          <a key={`a${match.index}`} href={match[3]} target="_blank" rel="noopener noreferrer"
            style={{ color: '#143564', textDecoration: 'underline' }}>
            {match[2]}
          </a>
        )
      } else if (match[4]) {
        // **bold**
        parts.push(<strong key={`b${match.index}`}>{match[4]}</strong>)
      } else if (match[5]) {
        // *italic*
        parts.push(<em key={`i${match.index}`}>{match[5]}</em>)
      }
      prev = re.lastIndex
    }
    if (prev < s.length) parts.push(s.slice(prev))
    return parts.length ? parts : s
  }

  const flushList = () => {
    if (!listItems.length) return
    const Tag = listKind === 'ol' ? 'ol' : 'ul'
    output.push(
      <Tag key={`l${idx++}`} className="fn-md-list">
        {listItems.map((li, i) => <li key={i}>{inlineFormat(li)}</li>)}
      </Tag>
    )
    listItems = []
    listKind = null
  }

  for (const raw of lines) {
    const t = raw.trim()
    if (!t) { flushList(); output.push(<br key={`br${idx++}`} />); continue }
    if (t.startsWith('### ')) { flushList(); output.push(<h4 key={`h${idx++}`} className="fn-md-h4">{inlineFormat(t.slice(4))}</h4>); continue }
    if (t.startsWith('## '))  { flushList(); output.push(<h3 key={`h${idx++}`} className="fn-md-h3">{inlineFormat(t.slice(3))}</h3>); continue }
    if (t.startsWith('# '))   { flushList(); output.push(<h2 key={`h${idx++}`} className="fn-md-h2">{inlineFormat(t.slice(2))}</h2>); continue }
    const bm = t.match(/^[-*]\s+(.*)/)
    const nm = t.match(/^\d+[.)]\s+(.*)/)
    if (bm) { listKind = listKind || 'ul'; listItems.push(bm[1]); continue }
    if (nm) { listKind = 'ol'; listItems.push(nm[1]); continue }
    flushList()
    output.push(<p key={`p${idx++}`} className="fn-md-p">{inlineFormat(t)}</p>)
  }
  flushList()
  return output
}

/* ═══════════════════════════════════════════════════════════════════
   FILE → BASE64 HELPER
   ─────────────────────────────────────────────────────────────────
   Returns { dataUrl, base64, mimeType }
   - dataUrl:  for <img src> display
   - base64:   raw base64 string for Gemini inline_data.data
   - mimeType: for Gemini inline_data.mime_type
   ═══════════════════════════════════════════════════════════════════ */

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64 = dataUrl.split(',')[1]
      resolve({ dataUrl, base64, mimeType: file.type })
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function App() {

  const WELCOME_TEXT = 'Welcome to FAFSA Navigator, your expert resource for federal financial aid guidance and FAFSA technical support.\n\nI can help with applications, grants, loans, repayment plans, deadlines, eligibility questions, FSA ID issues, submission errors, and more.\n\nDrag and drop a screenshot or use the attachment button to share images of FAFSA forms, error messages, or financial aid documents for targeted analysis.\n\nSelect a topic below or type your question to get started.'

  /* ─── State ─────────────────────────────────────────────────── */

  const [sessions, setSessions] = useState(() => [
    { id: 1, title: 'New conversation', messages: [{ role: 'assistant', content: WELCOME_TEXT }] },
  ])
  const [activeId, setActiveId] = useState(1)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [dragging, setDragging] = useState(false)
  const [pendingImages, setPendingImages] = useState([])  // { dataUrl, base64, mimeType }[]
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const dragCounter = useRef(0)

  const active = sessions.find(s => s.id === activeId) || sessions[0]
  const isWelcome = active.messages.length === 1 && !loading

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      if (!mobile) setSidebarOpen(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active.messages, loading])

  /* ─── Session helpers ───────────────────────────────────────── */

  const patchMessages = useCallback((fn) => {
    setSessions(prev => prev.map(s =>
      s.id === activeId ? { ...s, messages: fn(s.messages) } : s
    ))
  }, [activeId])

  const patchTitle = useCallback((id, text) => {
    const title = text.length > 44 ? text.slice(0, 44) + '...' : text
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))
  }, [])

  const newSession = () => {
    const s = { id: Date.now(), title: 'New conversation', messages: [{ role: 'assistant', content: WELCOME_TEXT }] }
    setSessions(prev => [s, ...prev])
    setActiveId(s.id)
    setInput('')
    setPendingImages([])
    if (isMobile) setSidebarOpen(false)
  }

  const switchSession = (id) => {
    setActiveId(id)
    setInput('')
    setPendingImages([])
    if (isMobile) setSidebarOpen(false)
  }

  const removeSession = (id, e) => {
    e.stopPropagation()
    if (sessions.length === 1) {
      newSession()
      setSessions(prev => prev.filter(s => s.id !== id))
      return
    }
    const rest = sessions.filter(s => s.id !== id)
    setSessions(rest)
    if (id === activeId) setActiveId(rest[0].id)
  }

  /* ═══════════════════════════════════════════════════════════════
     IMAGE HANDLING
     ─────────────────────────────────────────────────────────────
     - Drag & drop onto the messages area
     - File picker via paperclip button
     - Images staged in pendingImages[] until sent
     ═══════════════════════════════════════════════════════════════ */

  const processFiles = async (files) => {
    const validFiles = Array.from(files).filter(f => ACCEPTED_TYPES.includes(f.type))
    if (!validFiles.length) return

    const results = await Promise.all(validFiles.map(fileToBase64))
    setPendingImages(prev => [...prev, ...results])
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setDragging(false)
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files?.length) {
      processFiles(e.target.files)
      e.target.value = ''  // Reset so same file can be re-selected
    }
  }

  const removePendingImage = (index) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index))
  }

  /* ═══════════════════════════════════════════════════════════════
     sendMessage — NOW WITH IMAGE SUPPORT
     ─────────────────────────────────────────────────────────────
     Gemini parts[] structure:
     
     Text only:
       parts: [{ text: "message" }]
     
     Text + images:
       parts: [
         { text: "What's this error?" },
         { inline_data: { mime_type: "image/png", data: "base64" } },
         { inline_data: { mime_type: "image/jpeg", data: "base64" } }
       ]
     
     Images only (no text):
       parts: [
         { text: "Analyze this image" },   <-- Gemini needs at least
         { inline_data: { ... } }              some text prompt
       ]
     ═══════════════════════════════════════════════════════════════ */

  const sendMessage = useCallback(async (text, images = []) => {
    const hasText = text.trim().length > 0
    const hasImages = images.length > 0
    if (!hasText && !hasImages) return
    if (loading) return

    /* Build the local message object for display.
       images[] stored as dataUrl strings for rendering in bubbles. */
    const userMsg = {
      role: 'user',
      content: hasText ? text : (hasImages ? 'Sent an image for analysis' : ''),
      images: hasImages ? images.map(img => img.dataUrl) : undefined,
    }

    const updatedHistory = [...active.messages, userMsg]
    patchMessages(() => updatedHistory)
    setInput('')
    setPendingImages([])
    setLoading(true)
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto'

    if (active.messages.length === 1) {
      patchTitle(activeId, hasText ? text : 'Image analysis')
    }

    /* Build contents[] for Gemini API.
       Each message's parts[] can contain text + inline_data entries. */
    const contents = updatedHistory.map(m => {
      const parts = []

      // Text part (always include for user messages)
      if (m.content) {
        parts.push({ text: m.content })
      }

      // Image parts — only for the current message being sent
      // (We don't re-send historical images to save tokens)
      if (m === userMsg && hasImages) {
        for (const img of images) {
          parts.push({
            inline_data: {
              mime_type: img.mimeType,
              data: img.base64,
            }
          })
        }
      }

      // Fallback: Gemini requires at least one part
      if (parts.length === 0) {
        parts.push({ text: '' })
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      }
    })

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error.message)

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        || 'I was unable to generate a response. Please try again.'

      patchMessages(prev => [...prev, { role: 'assistant', content: reply }])

    } catch (err) {
      console.error('Gemini API Error:', err)
      patchMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message || 'Something went wrong. Please try again.'}`,
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [active, loading, activeId, patchMessages, patchTitle])

  const onSubmit = (e) => {
    e.preventDefault()
    sendMessage(input, pendingImages)
  }

  const visibleSuggestions = SUGGESTED_CHATS.slice(0, 4)
  const canSend = (input.trim() || pendingImages.length > 0) && !loading

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="fn-root">

      {/* Mobile overlay */}
      <div
        className={`fn-sidebar-overlay ${!sidebarOpen ? 'hidden' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={`fn-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="fn-sidebar-header">
          <div className="fn-sidebar-label">Chat History</div>
          <button className="fn-new-chat-btn" onClick={newSession}>
            + New conversation
          </button>
        </div>
        <div className="fn-session-list">
          {sessions.map(s => (
            <button
              key={s.id}
              className={`fn-session-item ${s.id === activeId ? 'active' : ''}`}
              onClick={() => switchSession(s.id)}
            >
              <span className="fn-session-title">{s.title}</span>
              <span className="fn-session-delete" onClick={e => removeSession(s.id, e)}>x</span>
            </button>
          ))}
        </div>
        <div className="fn-sidebar-footer">
          <div className="fn-sidebar-footer-text">
            Gemini 2.0 Flash | Strategic Education, Inc.
          </div>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <main className="fn-main">

        {/* Header */}
        <header className="fn-header">
          <button className="fn-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <div className="fn-hamburger"><span></span><span></span><span></span></div>
            <span className="fn-arrow">{sidebarOpen ? '\u2190' : '\u2192'}</span>
          </button>
          <div>
            <div className="fn-header-title">FAFSA Navigator</div>
            <div className="fn-header-sub">Financial Aid Guidance and Technical Support</div>
          </div>
        </header>

        {/* Messages — with drag & drop zone */}
        <div
          className={`fn-messages ${isWelcome ? 'welcome' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >

          {/* Drag overlay */}
          <div className={`fn-drop-overlay ${dragging ? '' : 'hidden'}`}>
            <div className="fn-drop-icon">
              <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="fn-drop-text">Drop image here</div>
            <div className="fn-drop-sub">JPEG, PNG, GIF, or WebP</div>
          </div>

          {/* WELCOME STATE — bubble centered, suggestions at bottom */}
          {isWelcome && (
            <>
              <div className="fn-welcome-wrapper">
                <div className="fn-welcome-bubble">
                  {renderMarkdown(active.messages[0].content)}
                </div>
              </div>
              <div className="fn-suggested-bottom">
                <div className="fn-suggested-grid">
                  {visibleSuggestions.map((sc, i) => (
                    <button key={i} className="fn-suggested-tile" onClick={() => sendMessage(sc.prompt)}>
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* CONVERSATION STATE */}
          {!isWelcome && (
            <>
              {active.messages.map((m, i) => (
                <div key={i} className={`fn-msg-row ${m.role}`}>
                  <div className={`fn-bubble ${m.role}`}>
                    {/* Render images in user bubbles */}
                    {m.images && m.images.map((src, j) => (
                      <img key={j} src={src} alt="Uploaded" className="fn-bubble-image" />
                    ))}
                    {renderMarkdown(m.content)}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="fn-typing">
                  <div className="fn-typing-bubble">
                    <span className="fn-dot" />
                    <span className="fn-dot" />
                    <span className="fn-dot" />
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={endRef} />
        </div>

        {/* Image preview bar — shows staged images before sending */}
        {pendingImages.length > 0 && (
          <div className="fn-image-preview-bar">
            {pendingImages.map((img, i) => (
              <div key={i} className="fn-image-preview">
                <img src={img.dataUrl} alt={`Preview ${i + 1}`} />
                <button className="fn-image-preview-remove" onClick={() => removePendingImage(i)}>
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <form className="fn-input-bar" onSubmit={onSubmit}>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="fn-file-input"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileSelect}
          />

          {/* Paperclip / attachment button */}
          <button
            type="button"
            className="fn-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            <svg viewBox="0 0 24 24">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <textarea
            ref={inputRef}
            className="fn-input-field"
            value={input}
            onChange={e => {
              setInput(e.target.value)
              // Auto-resize: reset then set to scrollHeight
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
            }}
            onKeyDown={e => {
              // Enter to send, Shift+Enter for newline
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (canSend) onSubmit(e)
              }
            }}
            placeholder={pendingImages.length > 0
              ? 'Add a message about this image...'
              : 'Ask about FAFSA, financial aid, or technical issues...'
            }
            disabled={loading}
            rows={1}
          />
          <button
            type="submit"
            className={`fn-send-btn ${canSend ? 'enabled' : 'disabled'}`}
            disabled={!canSend}
          >
            Send
          </button>
        </form>
      </main>
    </div>
  )
}
