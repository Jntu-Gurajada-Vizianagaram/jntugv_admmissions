import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useForm } from '../../context/useForm'
import { collectMessages, optionalTextFormat } from '../../utils/validation'
import './Step4Documents.css'

const EXAM_DOCS = {
  ap: { key: 'doc_ap_rank', label: 'AP-EAPCET-2026 Rank Card' },
  tg: { key: 'doc_tg_rank', label: 'TG-EAPCET-2026 Rank Card' },
  jee: { key: 'doc_jee_rank', label: 'JEE (MAINS) Rank Card' },
}

const MAX_FILE_SIZE = 2 * 1024 * 1024

function RequiredStar({ required }) {
  return required ? <span className="required-star"> *</span> : null
}

function DocItem({ docKey, label, num, required = true }) {
  const { data, updateDocument } = useForm()
  const inputRef = useRef()
  const file = data.documents[docKey]

  const handleFile = (f) => {
    if (!f) return
    if (f.size > MAX_FILE_SIZE) {
      alert('File exceeds 2MB limit.')
      return
    }
    updateDocument(docKey, f)
  }

  return (
    <div className="doc-upload-item">
      <div className="doc-header">
        <span className="doc-num">{num}</span>
        <span className="doc-name">{label}<RequiredStar required={required} /></span>
      </div>
      <div
        className={`doc-upload-zone ${file ? 'uploaded' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          handleFile(e.dataTransfer.files[0])
        }}
      >
        <span className="doc-icon">{file ? 'Uploaded' : 'Attach'}</span>
        <span className="doc-text">{file ? file.name : 'Click or drag file here'}</span>
        <span className="doc-hint">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'PDF / JPG / PNG - Max 2MB'}</span>
        {file && (
          <button
            className="doc-remove"
            type="button"
            onClick={e => { e.stopPropagation(); updateDocument(docKey, null) }}
            aria-label={`Remove ${label}`}
            title={`Remove ${label}`}
          >
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}

export default function Step4Documents({ onNext, onBack }) {
  const { data, updateDocument } = useForm()
  const [showErrors, setShowErrors] = useState(false)
  const selectedRankDocs = data.programme.eligibility
    .filter(key => EXAM_DOCS[key])
    .map(key => EXAM_DOCS[key])
  const requiresCaste = data.personal.category && data.personal.category !== 'OC'
  const othersRequired = false

  const requiredDocs = [
    ...selectedRankDocs.map(doc => doc.key),
    'doc_aadhar',
    ...(requiresCaste ? ['doc_caste'] : []),
    ...(othersRequired ? ['doc_others'] : []),
  ]

  const validationMessages = () => {
    const messages = requiredDocs.map((key) => {
      const selectedDoc = [...selectedRankDocs, { key: 'doc_aadhar', label: 'Aadhar Card Copy' }, { key: 'doc_caste', label: 'Caste / Category Certificate' }, { key: 'doc_others', label: 'Other Competitive Exam Proof' }]
        .find(doc => doc.key === key)
      return data.documents[key] ? '' : `${selectedDoc?.label || key} upload is required.`
    })

    messages.push(optionalTextFormat(data.documents.other_doc_title, 'Other document title'))

    return collectMessages(messages)
  }

  const errors = validationMessages()
  const canContinue = errors.length === 0

  const handleNext = () => {
    if (!canContinue) {
      setShowErrors(true)
      return
    }
    onNext()
  }

  let docNum = 1

  return (
    <div className="form-step-anim">
      <div className="step-header">
        <h3 className="step-title">Step 4: Additional Documents</h3>
        <p className="step-desc">Upload rank cards, Aadhaar, caste/category certificate, and other supporting documents here.</p>
      </div>

      {showErrors && (
        <div className="step-error">
          <strong>Please correct the following:</strong>
          <ul className="step-error-list">
            {errors.map(error => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="form-card">
        <div className="form-card-title"><span className="form-card-num">4</span>Additional Documents</div>
        <div className="docs-grid">
          {selectedRankDocs.map(doc => (
            <DocItem key={doc.key} docKey={doc.key} label={doc.label} num={docNum++} required />
          ))}

          <DocItem docKey="doc_aadhar" label="Aadhar Card Copy" num={docNum++} required />
          <DocItem docKey="doc_caste" label="Caste / Category Certificate (if applicable)" num={docNum++} required={requiresCaste} />

          <div className="doc-upload-item">
            <div className="doc-header">
              <span className="doc-num">{docNum++}</span>
              <span className="doc-name">Other Supporting Document (Optional)</span>
            </div>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder={othersRequired ? 'Document title / description *' : 'Document title / description'}
                value={data.documents.other_doc_title}
                onChange={e => updateDocument('other_doc_title', e.target.value)}
              />
            </div>
            <DocItem docKey="doc_others" label="Other Supporting Document" num="-" required={othersRequired} />
          </div>
        </div>
      </div>

      <div className="step-nav">
        <button type="button" className="btn btn-outline" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={handleNext}>Next: Fee Payment</button>
      </div>
    </div>
  )
}
