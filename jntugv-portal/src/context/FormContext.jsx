import { useEffect, useRef, useState } from 'react'
import { FormContext } from './FormContextObject'
import { submitApplication } from '../lib/api'

const DRAFT_DB_NAME = 'jntugv-admissions-drafts'
const DRAFT_STORE_NAME = 'drafts'
const DRAFT_KEY = 'IIBMP-2026'

const todayValue = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createInitialData = () => ({
  programme: {
    applied: '',
    eligibility: [],
    exams: {
      ap: { hallTicket: '', rank: '' },
      tg: { hallTicket: '', rank: '' },
      jee: { hallTicket: '', rank: '' },
      others: { examName: '', hallTicket: '', rank: '' },
    },
  },
  personal: {
    name: '',
    fatherName: '',
    motherName: '',
    dob: '',
    placeOfBirth: '',
    gender: '',
    category: '',
    maritalStatus: '',
    nationality: 'Indian',
    religion: '',
    aadharNumber: '',
    passportNumber: '',
    landline: '',
    mobile: '',
    altMobile: '',
    email: '',
    address: '',
    idMark1: '',
    idMark2: '',
    photo: '',
    signature: '',
  },
  education: [
    { id: 1, examination: 'SSC / 10th', year: '', classDivision: '', marksGrade: '', institution: '', stateStudied: '', subjects: '', certificateFile: null },
    { id: 2, examination: 'Intermediate / 12th', year: '', classDivision: '', marksGrade: '', institution: '', stateStudied: '', subjects: '', certificateFile: null },
    { id: 3, examination: '', year: '', classDivision: '', marksGrade: '', institution: '', stateStudied: '', subjects: '', certificateFile: null },
  ],
  documents: {
    doc_ap_rank: null,
    doc_tg_rank: null,
    doc_jee_rank: null,
    doc_others: null,
    other_doc_title: '',
    doc_aadhar: null,
    doc_caste: null,
  },
  payments: [
    { fee: '', txn_ref: '', txn_date: '', mode: '', status: '', proofFile: null },
    { fee: '', txn_ref: '', txn_date: '', mode: '', status: '', proofFile: null },
  ],
  paymentStatus: '',
  transactionId: '',
  paymentDate: '',
  declaration: {
    station: '',
    date: todayValue(),
    agreed: false,
  },
})

const serializeDocuments = (documents) => Object.fromEntries(
  Object.entries(documents).map(([key, value]) => [key, value])
)

const fileToPayload = (file) => new Promise((resolve, reject) => {
  if (!(file instanceof File)) {
    resolve(file)
    return
  }

  const reader = new FileReader()
  reader.onload = () => resolve({
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl: reader.result,
  })
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const createSubmissionPayload = async (data) => ({
  ...data,
  admissionYear: '2026',
  processCode: 'IIBMP',
  education: await Promise.all(data.education.map(async row => ({
    ...row,
    certificateFile: await fileToPayload(row.certificateFile),
  }))),
  payments: await Promise.all(data.payments.map(async payment => ({
    ...payment,
    proofFile: await fileToPayload(payment.proofFile),
  }))),
  documents: Object.fromEntries(
    await Promise.all(Object.entries(serializeDocuments(data.documents)).map(async ([key, value]) => [key, await fileToPayload(value)]))
  ),
})

const openDraftDb = () => new Promise((resolve, reject) => {
  if (!window.indexedDB) {
    reject(new Error('Draft storage is not available in this browser'))
    return
  }

  const request = window.indexedDB.open(DRAFT_DB_NAME, 1)
  request.onupgradeneeded = () => {
    const db = request.result
    if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
      db.createObjectStore(DRAFT_STORE_NAME)
    }
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error || new Error('Unable to open draft storage'))
})

const draftTransaction = async (mode, callback) => {
  const db = await openDraftDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFT_STORE_NAME, mode)
    const store = transaction.objectStore(DRAFT_STORE_NAME)
    const request = callback(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Draft storage request failed'))
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      reject(transaction.error || new Error('Draft storage transaction failed'))
    }
  })
}

const loadDraft = () => draftTransaction('readonly', store => store.get(DRAFT_KEY))

const persistDraft = (payload) => draftTransaction('readwrite', store => store.put(payload, DRAFT_KEY))

const removeDraft = () => draftTransaction('readwrite', store => store.delete(DRAFT_KEY))

const formatDraftTime = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function FormProvider({ children }) {
  const [data, setData] = useState(createInitialData)
  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [regNo, setRegNo] = useState('')
  const [submissionError, setSubmissionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draftStatus, setDraftStatus] = useState('Checking saved draft...')
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState('')
  const [hasSavedDraft, setHasSavedDraft] = useState(false)
  const draftReadyRef = useRef(false)
  const autosaveTimerRef = useRef(null)

  const update = (fields) => setData(prev => ({ ...prev, ...fields }))
  const updateData = (nextData) => setData(nextData)

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const saveDraft = async (nextData = data, nextStepValue = currentStep, mode = 'manual') => {
    setDraftStatus(mode === 'auto' ? 'Autosaving draft...' : 'Saving draft...')
    const savedAt = new Date().toISOString()

    await persistDraft({
      data: nextData,
      currentStep: nextStepValue,
      savedAt,
    })

    setLastDraftSavedAt(savedAt)
    setHasSavedDraft(true)
    setDraftStatus(`Draft saved ${formatDraftTime(savedAt)}`)
  }

  useEffect(() => {
    let cancelled = false

    const restoreDraft = async () => {
      try {
        const draft = await loadDraft()
        if (cancelled) return

        if (draft?.data) {
          setData(draft.data)
          setCurrentStep(Number(draft.currentStep) || 1)
          setLastDraftSavedAt(draft.savedAt || '')
          setHasSavedDraft(true)
          setDraftStatus(`Draft restored${draft.savedAt ? ` from ${formatDraftTime(draft.savedAt)}` : ''}`)
        } else {
          setDraftStatus('Draft protection ready')
        }
      } catch (error) {
        if (!cancelled) {
          setDraftStatus(error.message || 'Draft storage unavailable')
        }
      } finally {
        draftReadyRef.current = true
      }
    }

    restoreDraft()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!draftReadyRef.current || submitted) return undefined

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      saveDraft(data, currentStep, 'auto').catch(error => {
        setDraftStatus(error.message || 'Unable to autosave draft')
      })
    }, 900)

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [data, currentStep, submitted])

  const updateEducation = (index, field, value) => {
    setData(prev => {
      const education = [...prev.education]
      education[index] = { ...education[index], [field]: value }
      return { ...prev, education }
    })
  }

  const addEducationRow = () => {
    setData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { id: Date.now(), examination: '', year: '', classDivision: '', marksGrade: '', institution: '', stateStudied: '', subjects: '', certificateFile: null },
      ],
    }))
  }

  const removeEducationRow = (id) => {
    setData(prev => {
      if (prev.education.length <= 1) return prev
      return { ...prev, education: prev.education.filter((row, index) => row.id !== id && index !== id) }
    })
  }

  const updatePayment = (index, field, value) => {
    setData(prev => {
      const payments = [...(prev.payments || [])]
      payments[index] = { ...payments[index], [field]: value }
      return { ...prev, payments }
    })
  }

  const addPaymentRow = () => {
    setData(prev => ({
      ...prev,
      payments: [...(prev.payments || []), { fee: '', txn_ref: '', txn_date: '', mode: '', status: '', proofFile: null }],
    }))
  }

  const removePaymentRow = (index) => {
    setData(prev => ({ ...prev, payments: (prev.payments || []).filter((_, i) => i !== index) }))
  }

  const updateDocument = (key, value) => {
    setData(prev => ({ ...prev, documents: { ...prev.documents, [key]: value } }))
  }

  const submitForm = async () => {
    setSubmissionError('')
    setIsSubmitting(true)

    try {
      const result = await submitApplication(await createSubmissionPayload(data))
      setRegNo(result.registrationNo)
      setSubmitted(true)
      await removeDraft().catch(() => {})
      setHasSavedDraft(false)
      setDraftStatus('Submitted application saved on server')
      return result
    } catch (error) {
      setSubmissionError(error.message || 'Unable to submit application')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setData(createInitialData())
    setCurrentStep(1)
    setSubmitted(false)
    setRegNo('')
    setSubmissionError('')
    setIsSubmitting(false)
    setHasSavedDraft(false)
    setLastDraftSavedAt('')
    setDraftStatus('Draft cleared')
    removeDraft().catch(() => {})
  }

  return (
    <FormContext.Provider value={{
      data,
      update,
      updateData,
      currentStep,
      setCurrentStep,
      nextStep,
      prevStep,
      updateEducation,
      addEducationRow,
      removeEducationRow,
      updatePayment,
      addPaymentRow,
      removePaymentRow,
      updateDocument,
      submitted,
      submitForm,
      saveDraft,
      resetForm,
      regNo,
      submissionError,
      isSubmitting,
      draftStatus,
      lastDraftSavedAt,
      hasSavedDraft,
    }}>
      {children}
    </FormContext.Provider>
  )
}
