import React, { useRef } from 'react';
import { Check, Upload, X } from 'lucide-react';
import { useForm } from '../context/useForm';
import './InlineDocumentUpload.css';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function InlineDocumentUpload({
  docKey,
  label,
  required = true,
  gridColumn,
}) {
  const { data, updateDocument } = useForm();
  const inputRef = useRef(null);
  const file = data.documents[docKey];

  const handleFile = (event) => {
    const nextFile = event.target.files[0];
    if (!nextFile) return;
    if (nextFile.size > MAX_FILE_SIZE) {
      alert('File exceeds 2MB limit.');
      event.target.value = '';
      return;
    }
    updateDocument(docKey, nextFile);
  };

  return (
    <div className="inline-upload-field" style={gridColumn ? { gridColumn } : undefined}>
      <div className="inline-upload-label">
        {label} {required && <span className="required-star">*</span>}
      </div>
      <div className={`inline-upload-control ${file ? 'uploaded' : ''}`}>
        <button type="button" className="inline-upload-button" onClick={() => inputRef.current.click()}>
          {file ? <Check size={18} /> : <Upload size={18} />}
          <span>{file ? file.name : 'Upload file'}</span>
        </button>
        {file && (
          <button
            type="button"
            className="inline-upload-remove"
            onClick={() => updateDocument(docKey, null)}
            aria-label={`Remove ${label}`}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <span className="inline-upload-hint">PDF / JPG / PNG - Max 2MB</span>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={handleFile} />
    </div>
  );
}
