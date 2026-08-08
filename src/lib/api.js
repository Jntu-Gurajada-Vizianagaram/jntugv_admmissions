const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const ADMIN_TOKEN_KEY = 'jntugv_admin_token';

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) || '';
export const setAdminToken = (token) => localStorage.setItem(ADMIN_TOKEN_KEY, token);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);

const request = async (path, options = {}) => {
  const token = getAdminToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return payload;
};

export const adminLogin = async (credentials) => {
  const result = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  setAdminToken(result.token);
  return result;
};

export const requestAdminPasswordReset = (payload) => request('/api/admin/password-reset-request', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const validateAdminPasswordReset = (token) => (
  request(`/api/admin/password-reset?${new URLSearchParams({ token }).toString()}`)
);

export const completeAdminPasswordReset = (payload) => request('/api/admin/password-reset', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const getAdminSession = () => {
  if (!getAdminToken()) {
    return Promise.resolve({ user: null });
  }
  return request('/api/admin/session');
};

export const submitApplication = (application) => request('/api/applications', {
  method: 'POST',
  body: JSON.stringify({ year: '2026', processCode: 'IIBMP', application }),
});

export const getApplicationStatus = (registrationNo) => (
  request(`/api/applications/${encodeURIComponent(registrationNo)}`)
);

export const getAdmissionSchema = (year = '2026', processCode = 'IIBMP') => (
  request(`/api/schemas/${encodeURIComponent(year)}/${encodeURIComponent(processCode)}`)
);

export const saveApplicantDraft = (payload) => request('/api/applicant/drafts', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const registerApplicant = (payload) => request('/api/applicant/register', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const applicantLogin = (credentials) => request('/api/applicant/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
});

export const listAdminApplications = ({ year = '2026', processCode = 'IIBMP', search = '', status = '' } = {}) => {
  const params = new URLSearchParams({ year, processCode });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  return request(`/api/admin/applications?${params.toString()}`);
};

export const listAdminDrafts = ({ year = '2026', processCode = 'IIBMP', search = '' } = {}) => {
  const params = new URLSearchParams({ year, processCode });
  if (search) params.set('search', search);
  return request(`/api/admin/applicant-drafts?${params.toString()}`);
};

export const listAdminApplicationReports = async ({ year = '2026', processCode = 'IIBMP', search = '' } = {}) => {
  const params = new URLSearchParams({ year, processCode });
  if (search) params.set('search', search);
  try {
    return await request(`/api/admin/application-reports?${params.toString()}`);
  } catch (error) {
    if (error.status !== 404) throw error;
    const [applicationsResult, draftsResult] = await Promise.all([
      listAdminApplications({ year, processCode, search }),
      listAdminDrafts({ year, processCode, search }).catch(() => ({ drafts: [] })),
    ]);
    return {
      year,
      processCode,
      reports: [
        ...(draftsResult.drafts || []).map(draft => ({
          referenceNo: draft.applicantId,
          name: draft.candidateName || '',
          phoneNumber: draft.candidateMobile || '',
          email: draft.candidateEmail || '',
          year,
          processCode,
          programme: '',
          category: '',
          currentStep: draft.currentStep ?? null,
          applicationStatus: 'Under Process',
          verificationStatus: '',
          activityDate: draft.savedAt || '',
        })),
        ...(applicationsResult.applications || []).map(application => ({
          referenceNo: application.registrationNo,
          name: application.candidateName || '',
          phoneNumber: application.mobile || '',
          email: application.email || '',
          year: application.year || year,
          processCode: application.processCode || processCode,
          programme: application.programme || '',
          category: application.category || '',
          currentStep: null,
          applicationStatus: 'Submitted',
          verificationStatus: application.status || '',
          activityDate: application.submittedAt || '',
        })),
      ].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate)),
    };
  }
};

export const getAdminApplication = (registrationNo) => (
  request(`/api/admin/applications/${encodeURIComponent(registrationNo)}`)
);

export const updateAdminApplication = (registrationNo, payload) => request(`/api/admin/applications/${encodeURIComponent(registrationNo)}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
});

export const listVerificationOfficers = () => request('/api/admin/officers');

export const createVerificationOfficer = (payload) => request('/api/admin/officers', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const updateVerificationOfficer = (id, payload) => request(`/api/admin/officers/${encodeURIComponent(id)}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
});
