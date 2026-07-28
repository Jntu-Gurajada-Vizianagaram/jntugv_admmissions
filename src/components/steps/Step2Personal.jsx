import React, { useRef, useState } from 'react';
import { useForm } from '../../context/useForm';
import {
  collectMessages,
  digits,
  emailFormat,
  mobileNumber,
  nameFormat,
  optionalDigitsRange,
  optionalTextFormat,
  passportFormat,
  required,
  textFormat,
} from '../../utils/validation';
import CalendarInput from '../CalendarInput';
import CustomSelect from '../CustomSelect';
import InlineDocumentUpload from '../InlineDocumentUpload';
import './Step2Personal.css';
import './Step3Academics.css';

const MAX_PHOTO_FILE_SIZE = 200 * 1024;
const MAX_SIGNATURE_FILE_SIZE = 70 * 1024;
const DOB_MIN = '1980-01-01';
const DOB_MAX = '2010-12-31';
const DOB_INITIAL_VIEW = '2008-01-01';

const UPPERCASE_FIELDS = new Set([
  'name',
  'fatherName',
  'motherName',
  'placeOfBirth',
  'nationality',
  'religion',
  'passportNumber',
  'address',
  'idMark1',
  'idMark2',
]);

const normalizePersonalValue = (name, value) => {
  if (['aadharNumber'].includes(name)) return value.replace(/\D/g, '').slice(0, 12);
  if (['mobile', 'altMobile'].includes(name)) return value.replace(/\D/g, '').slice(0, 10);
  if (name === 'landline') return value.replace(/\D/g, '').slice(0, 15);
  if (name === 'passportNumber') return value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 12);
  return UPPERCASE_FIELDS.has(name) ? value.toUpperCase() : value;
};

export default function Step2Personal({ onNext, onBack }) {
  const { data, updateData } = useForm();
  const [showErrors, setShowErrors] = useState(false);
  const photoRef = useRef();
  const sigRef = useRef();

  const handleChange = (event) => {
    const { name, value } = event.target;
    updateData({
      ...data,
      personal: {
        ...data.personal,
        [name]: normalizePersonalValue(name, value),
      },
    });
  };

  const handleFile = (field) => (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const maxSize = field === 'photo' ? MAX_PHOTO_FILE_SIZE : MAX_SIGNATURE_FILE_SIZE;
    const maxSizeLabel = field === 'photo' ? '200 KB' : '70 KB';
    if (file.size > maxSize) {
      alert(`File must be less than ${maxSizeLabel}`);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      updateData({
        ...data,
        personal: { ...data.personal, [field]: ev.target.result },
      });
    };
    reader.readAsDataURL(file);
  };

  const renderFloatingInput = (name, label, type = 'text', gridCol = '1 / -1', required = true) => (
    <div className="form-group-floating" style={{ gridColumn: gridCol }}>
      <input
        type={type}
        className="form-input-floating"
        name={name}
        placeholder=" "
        value={data.personal[name]}
        onChange={handleChange}
        style={UPPERCASE_FIELDS.has(name) ? { textTransform: 'uppercase' } : undefined}
        required={required}
      />
      <label className="form-label-floating">{label} {required && <span className="required-star">*</span>}</label>
    </div>
  );

  const renderSelect = (name, label, options) => (
    <CustomSelect
      name={name}
      label={label}
      value={data.personal[name]}
      options={options}
      onChange={handleChange}
      required
      gridColumn="span 1"
    />
  );

  const requiresCaste = data.personal.category && data.personal.category !== 'OC';
  const dobOutOfRange = data.personal.dob && (data.personal.dob < DOB_MIN || data.personal.dob > DOB_MAX);
  const validationMessages = () => collectMessages([
    nameFormat(data.personal.name, 'Candidate name'),
    nameFormat(data.personal.fatherName, "Father's / guardian's name"),
    nameFormat(data.personal.motherName, "Mother's name"),
    required(data.personal.dob, 'Date of birth is required.'),
    dobOutOfRange ? 'Date of birth must be between 01-01-1980 and 31-12-2010.' : '',
    textFormat(data.personal.placeOfBirth, 'Place of birth'),
    required(data.personal.gender, 'Gender is required.'),
    required(data.personal.category, 'Category is required.'),
    required(data.personal.maritalStatus, 'Marital status is required.'),
    textFormat(data.personal.nationality, 'Nationality'),
    optionalTextFormat(data.personal.religion, 'Religion'),
    digits(data.personal.aadharNumber, 'Aadhaar card number', 12),
    data.documents.doc_aadhar ? '' : 'Aadhaar card copy upload is required.',
    requiresCaste && !data.documents.doc_caste ? 'Caste / category certificate upload is required for non-OC category.' : '',
    passportFormat(data.personal.passportNumber),
    optionalDigitsRange(data.personal.landline, 'Land line number', 6, 15),
    mobileNumber(data.personal.mobile, 'Mobile number'),
    mobileNumber(data.personal.altMobile, 'Alternative mobile number'),
    emailFormat(data.personal.email),
    textFormat(data.personal.address, 'Address for correspondence'),
    textFormat(data.personal.idMark1, 'Identification mark 1'),
    textFormat(data.personal.idMark2, 'Identification mark 2'),
    data.personal.photo ? '' : 'Passport photo upload is required.',
    data.personal.signature ? '' : 'Signature upload is required.',
  ]);

  const errors = validationMessages();
  const canContinue = errors.length === 0;

  const handleNext = () => {
    if (!canContinue) {
      setShowErrors(true);
      return;
    }
    onNext();
  };

  return (
    <div className="form-step-anim">
      <div className="step-header">
        <h3 className="step-title">Step 2: Personal Details</h3>
        <p className="step-desc">Complete every required field marked with * and upload photo/signature.</p>
      </div>

      {showErrors && (
        <div className="step-error">
          <strong>Please correct the following:</strong>
          <ul className="step-error-list">
            {errors.map(error => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="form-layout-split">
        <div className="form-fields-grid">
          {renderFloatingInput('name', 'Name of the Candidate (As per SSC)')}
          {renderFloatingInput('fatherName', "Father's Name / Guardian's Name", 'text', 'span 1')}
          {renderFloatingInput('motherName', "Mother's Name", 'text', 'span 1')}
          <CalendarInput
            name="dob"
            label="Date of Birth"
            value={data.personal.dob}
            onChange={handleChange}
            required
            min={DOB_MIN}
            max={DOB_MAX}
            initialViewDate={DOB_INITIAL_VIEW}
            showToday={false}
            gridColumn="span 1"
          />
          {renderFloatingInput('placeOfBirth', 'Place of Birth', 'text', 'span 1')}
          {renderSelect('gender', 'Gender', ['Male', 'Female', 'Other'])}
          {renderSelect('maritalStatus', 'Marital Status', ['Single', 'Married'])}
          {renderSelect('category', 'Category', ['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'BC-E', 'SC', 'ST'])}
          {requiresCaste && (
            <InlineDocumentUpload
              docKey="doc_caste"
              label="Caste / Category Certificate"
              gridColumn="span 1"
            />
          )}
          {renderFloatingInput('nationality', 'Nationality', 'text', 'span 1')}
          {renderFloatingInput('religion', 'Religion (Optional)', 'text', 'span 1', false)}
          {renderFloatingInput('aadharNumber', 'Aadhar Card Number', 'text', 'span 1')}
          <InlineDocumentUpload docKey="doc_aadhar" label="Aadhar Card Copy" gridColumn="span 1" />
          {renderFloatingInput('passportNumber', 'Passport Number (Optional)', 'text', 'span 1', false)}
          {renderFloatingInput('landline', 'Land Line Number (Optional)', 'tel', 'span 1', false)}
          {renderFloatingInput('mobile', 'Mobile Number', 'tel', 'span 1')}
          {renderFloatingInput('altMobile', 'Alternative Mobile Number', 'tel', 'span 1')}
          {renderFloatingInput('email', 'Email Address', 'email', 'span 1')}

          <div className="form-group-floating" style={{ gridColumn: '1 / -1' }}>
            <textarea
              className="form-input-floating"
              name="address"
              placeholder=" "
              rows="3"
              value={data.personal.address}
              onChange={handleChange}
              style={{ paddingTop: '1.5rem', resize: 'vertical', textTransform: 'uppercase' }}
              required
            />
            <label className="form-label-floating">Address for Correspondence <span className="required-star">*</span></label>
          </div>

          {renderFloatingInput('idMark1', 'Identification Mark-1', 'text', 'span 1')}
          {renderFloatingInput('idMark2', 'Identification Mark-2', 'text', 'span 1')}
        </div>

        <div className="upload-sidebar">
          <div className="upload-box" onClick={() => photoRef.current.click()}>
            <div className="upload-preview">
              {data.personal.photo ? <img src={data.personal.photo} alt="Photo" /> : <span>Photo <span className="required-star">*</span></span>}
            </div>
            <p className="upload-hint">Passport Photo (JPG, Max 200 KB)</p>
            <input ref={photoRef} type="file" accept="image/jpeg, image/jpg" hidden onChange={handleFile('photo')} />
          </div>

          <div className="upload-box" onClick={() => sigRef.current.click()}>
            <div className="upload-preview sig-preview">
              {data.personal.signature ? <img src={data.personal.signature} alt="Signature" /> : <span>Signature <span className="required-star">*</span></span>}
            </div>
            <p className="upload-hint">Signature (JPG, Max 70 KB)</p>
            <input ref={sigRef} type="file" accept="image/jpeg, image/jpg" hidden onChange={handleFile('signature')} />
          </div>
        </div>
      </div>

      <div className="step-nav">
        <button type="button" className="btn btn-outline" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={handleNext}>Next: Qualifications</button>
      </div>
    </div>
  );
}
