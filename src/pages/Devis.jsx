import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faHelmetSafety,
  faSprayCanSparkles,
  faKey,
  faSolarPanel,
  faSeedling,
  faPaw,
  faTree,
  faTruckRampBox,
  faUser,
  faBriefcase,
  faBuildingUser,
  faPeopleGroup,
  faArrowRight,
  faArrowLeft,
  faCheck,
  faCircleCheck,
  faCloudArrowUp,
  faXmark,
  faPaperPlane,
  faLock,
  faEye,
  faEyeSlash,
  faShieldHalved,
  faEnvelopeOpenText,
  faUtensils,
  faCouch,
  faBed,
  faShower,
  faToilet,
  faLaptop,
  faRoad,
  faDoorOpen,
  faWarehouse,
  faEllipsis,
  faPlus,
  faMinus,
  faLightbulb,
  faCamera,
} from '@fortawesome/free-solid-svg-icons'
import TopBar from '../components/layout/TopBar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { meApi } from '../lib/api.js'

const stepKeys = ['prestation', 'details', 'photos', 'coordonnees', 'compte']

const services = [
  { key: 'bureaux', icon: faBuilding },
  { key: 'apresChantier', icon: faHelmetSafety },
  { key: 'facades', icon: faSprayCanSparkles },
  { key: 'conciergerie', icon: faKey },
  { key: 'garages', icon: faWarehouse },
  { key: 'photovoltaique', icon: faSolarPanel },
  { key: 'arrosage', icon: faSeedling },
  { key: 'animaux', icon: faPaw },
  { key: 'jardins', icon: faTree },
  { key: 'debarras', icon: faTruckRampBox },
]

const audiences = [
  { key: 'particulier', icon: faUser },
  { key: 'entreprise', icon: faBriefcase },
  { key: 'proImmo', icon: faBuildingUser },
  { key: 'association', icon: faPeopleGroup },
]

const frequencies = ['unique', 'hebdo', 'bimensuel', 'mensuel']

// Which detail fields to show at step 2 per service. Order matters — controls
// the render order in the form. Fields listed here that don't apply to the
// service (e.g. rooms for animaux) are simply not rendered.
const SERVICE_STEP2_FIELDS = {
  bureaux: ['surface', 'rooms', 'frequency', 'startDate', 'notes'],
  apresChantier: ['surface', 'rooms', 'startDate', 'notes'],
  facades: ['surface', 'startDate', 'notes'],
  conciergerie: ['surface', 'buildingUnits', 'frequency', 'startDate', 'notes'],
  garages: ['surface', 'parkingSpaces', 'frequency', 'startDate', 'notes'],
  photovoltaique: ['panelCount', 'roofType', 'startDate', 'notes'],
  arrosage: ['plantCount', 'plantLocation', 'visitFrequency', 'startDate', 'endDate', 'notes'],
  animaux: ['petType', 'petCount', 'visitsPerDay', 'startDate', 'endDate', 'notes'],
  jardins: ['surface', 'frequency', 'startDate', 'notes'],
  debarras: ['volume', 'locationType', 'startDate', 'notes'],
}

// Required-to-proceed fields for step 2 per service. Frequency is handled
// separately (only enforced when audience is not 'particulier' AND the service
// supports it).
const SERVICE_REQUIRED = {
  bureaux: ['surface'],
  apresChantier: ['surface'],
  facades: ['surface'],
  conciergerie: ['surface'],
  garages: ['surface'],
  photovoltaique: ['panelCount'],
  arrosage: ['plantCount', 'endDate'],
  animaux: ['petType', 'petCount', 'endDate'],
  jardins: ['surface'],
  debarras: ['volume'],
}

const PLANT_LOCATIONS = ['interieur', 'balcon', 'jardin', 'mixte']
const VISIT_FREQUENCIES = ['quotidien', 'deuxJours', 'deuxParSemaine', 'ponctuel']
// Cats & small animals only — see PET_TYPES in lib/devisConfig.js.
const PET_TYPES = ['chat', 'petit', 'autre']
const VISITS_PER_DAY = ['1', '2']
const ROOF_TYPES = ['plat', 'incline', 'tuile']
const LOCATION_TYPES = ['cave', 'grenier', 'appartement', 'bureau', 'garage', 'autre']

const ROOM_TYPES = [
  { key: 'cuisine', icon: faUtensils },
  { key: 'salon', icon: faCouch },
  { key: 'chambre', icon: faBed },
  { key: 'sdb', icon: faShower },
  { key: 'toilette', icon: faToilet },
  { key: 'bureau', icon: faLaptop },
  { key: 'couloir', icon: faRoad },
  { key: 'entree', icon: faDoorOpen },
  { key: 'balcon', icon: faTree },
  { key: 'cave', icon: faWarehouse },
  { key: 'autre', icon: faEllipsis },
]
const ROOM_BY_KEY = Object.fromEntries(ROOM_TYPES.map((r) => [r.key, r]))

const DEVIS_DRAFT_KEY = 'nzo-devis-draft'

export default function Devis() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signup, user, verifyEmail, resendVerificationCode } = useAuth()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  // Inline email verification (only used when a guest signs up while creating
  // a devis — the backend blocks account activation until the 6-digit code is
  // entered, so we surface a small inline step instead of redirecting away
  // and losing the in-memory File objects the user already picked).
  const [awaitingCode, setAwaitingCode] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [resendInfo, setResendInfo] = useState(null)
  const [form, setForm] = useState({
    service: '',
    audience: '',
    surface: '',
    frequency: '',
    startDate: '',
    endDate: '',
    notes: '',
    photos: [],
    // rooms: array of { key, count }. Photos kept separately in roomPhotos
    // so that File objects don't bloat the rooms state.
    rooms: [],
    // roomPhotos: { [roomKey]: [{ file, url, name }] }
    roomPhotos: {},
    // Service-specific fields — only some are relevant per service. Sent to
    // the backend as `serviceDetails` when submitting.
    panelCount: '',
    roofType: '',
    plantCount: '',
    plantLocation: '',
    visitFrequency: '',
    petType: '',
    petCount: '',
    visitsPerDay: '',
    buildingUnits: '',
    parkingSpaces: '',
    volume: '',
    locationType: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    siret: '',
    representativeRole: '',
    address: '',
    city: '',
    postalCode: '',
    consent: false,
    password: '',
    passwordConfirm: '',
  })

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  // When switching to "particulier" (or no audience yet), clear any previously
  // picked forfait — the field will be hidden and we don't want stale state.
  useEffect(() => {
    if (form.audience === 'particulier' && form.frequency) {
      setForm((prev) => ({ ...prev, frequency: '' }))
    }
  }, [form.audience])
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Prefill contact fields from the connected user (firstName/lastName/email/phone/audience).
  // Only fill fields that are still empty so the user can override after editing.
  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || user.firstName || '',
      lastName: prev.lastName || user.lastName || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone || '',
      company: prev.company || user.company || '',
      siret: prev.siret || user.siret || '',
      representativeRole: prev.representativeRole || user.representativeRole || '',
      audience: prev.audience || user.accountType || prev.audience,
    }))
  }, [user])

  const passwordsMatch =
    form.password.length > 0 &&
    form.passwordConfirm.length > 0 &&
    form.password === form.passwordConfirm

  // Fields to show at step 2 for the picked service. Falls back to the
  // office fields until a service is selected.
  const stepFields = SERVICE_STEP2_FIELDS[form.service] || SERVICE_STEP2_FIELDS.bureaux
  const hasField = (f) => stepFields.includes(f)

  // Particuliers submit one-off requests (no forfait selector); businesses
  // pick a recurring forfait — but only for services that support a cadence.
  // Absence-based services (arrosage, animaux) and one-shot ones (photovoltaique,
  // debarras) don't show the forfait picker.
  const showsForfait =
    form.audience && form.audience !== 'particulier' && hasField('frequency')

  const canNext = () => {
    if (step === 0) return form.service && form.audience
    if (step === 1) {
      const required = SERVICE_REQUIRED[form.service] || ['surface']
      const allRequired = required.every((f) => String(form[f] || '').trim())
      return allRequired && (!showsForfait || form.frequency)
    }
    if (step === 2) return true
    if (step === 3) {
      const baseOk = form.firstName && form.lastName && form.email && form.consent
      // Business accounts must provide the entity name (siret/role remain optional).
      if (showsForfait) return baseOk && !!form.company.trim()
      return baseOk
    }
    if (step === 4) {
      // When already connected, no account creation needed — step 5 is just a confirmation.
      if (user) return true
      return form.password.length >= 8 && passwordsMatch
    }
    return false
  }

  const handleFiles = (files) => {
    const arr = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 8 - form.photos.length)
      .map((file) => ({ file, url: URL.createObjectURL(file), name: file.name }))
    update({ photos: [...form.photos, ...arr] })
  }

  const removePhoto = (i) => {
    URL.revokeObjectURL(form.photos[i].url)
    update({ photos: form.photos.filter((_, idx) => idx !== i) })
  }

  const onDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  // --- Rooms (step 2) -----------------------------------------------------
  const toggleRoom = (key) => {
    const existing = form.rooms.find((r) => r.key === key)
    if (existing) {
      // Remove room + clean up its photos object URLs
      const cleanedPhotos = { ...form.roomPhotos }
      ;(cleanedPhotos[key] || []).forEach((p) => URL.revokeObjectURL(p.url))
      delete cleanedPhotos[key]
      update({
        rooms: form.rooms.filter((r) => r.key !== key),
        roomPhotos: cleanedPhotos,
      })
    } else {
      update({ rooms: [...form.rooms, { key, count: 1 }] })
    }
  }

  const setRoomCount = (key, delta) => {
    update({
      rooms: form.rooms.map((r) =>
        r.key === key ? { ...r, count: Math.max(1, Math.min(50, r.count + delta)) } : r,
      ),
    })
  }

  // --- Per-room photos (step 3) -------------------------------------------
  const handleRoomFiles = (key, files) => {
    const existing = form.roomPhotos[key] || []
    const arr = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 8 - existing.length)
      .map((file) => ({ file, url: URL.createObjectURL(file), name: file.name }))
    update({
      roomPhotos: { ...form.roomPhotos, [key]: [...existing, ...arr] },
    })
  }

  const removeRoomPhoto = (key, i) => {
    const list = form.roomPhotos[key] || []
    URL.revokeObjectURL(list[i].url)
    update({
      roomPhotos: { ...form.roomPhotos, [key]: list.filter((_, idx) => idx !== i) },
    })
  }

  const onRoomDrop = (key) => (e) => {
    e.preventDefault()
    handleRoomFiles(key, e.dataTransfer.files)
  }

  const finalizeDevis = async () => {
    const uploadFiles = async (list) => {
      const files = (list || []).map((p) => p.file).filter(Boolean)
      if (files.length === 0) return []
      const res = await meApi.uploadPhotos(files)
      return (res.items || []).map((it) => it.url)
    }
    const photoUrls = await uploadFiles(form.photos)
    const roomsWithUrls = []
    for (const { key, count } of form.rooms) {
      const urls = await uploadFiles(form.roomPhotos[key])
      roomsWithUrls.push({ key, count, photos: urls })
    }

    const detailFields = [
      'endDate',
      'panelCount',
      'roofType',
      'plantCount',
      'plantLocation',
      'visitFrequency',
      'petType',
      'petCount',
      'visitsPerDay',
      'buildingUnits',
      'parkingSpaces',
      'volume',
      'locationType',
    ]
    const serviceDetails = {}
    for (const f of detailFields) {
      if (hasField(f) && form[f] !== '' && form[f] != null) {
        serviceDetails[f] = form[f]
      }
    }

    await meApi.createDevis({
      service: form.service,
      audience: form.audience,
      surface: hasField('surface') ? Number(form.surface) || 0 : 0,
      frequency: showsForfait ? form.frequency : 'unique',
      startDate: form.startDate || undefined,
      notes: form.notes,
      address: form.address,
      postalCode: form.postalCode,
      city: form.city,
      photos: photoUrls,
      rooms: roomsWithUrls,
      serviceDetails,
    })

    setSubmitted(true)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setResendInfo(null)
    setSubmitting(true)
    try {
      // Path A — logged in: go straight to devis creation.
      if (user) {
        await finalizeDevis()
        return
      }

      // Path B — code was already sent, this submit is the verification step.
      if (awaitingCode) {
        if (verifyCode.trim().length !== 6) {
          throw new Error('Merci de saisir les 6 chiffres du code reçu par email.')
        }
        await verifyEmail({ email: form.email, code: verifyCode.trim() })
        setAwaitingCode(false)
        setVerifyCode('')
        await finalizeDevis()
        return
      }

      // Path C — first submit as guest: create the account, then wait for code.
      const result = await signup({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        accountType: form.audience || 'particulier',
        phone: form.phone,
        company: form.company || undefined,
        siret: form.siret || undefined,
        representativeRole: form.representativeRole || undefined,
      })

      if (result?.requiresVerification) {
        setAwaitingCode(true)
        return
      }

      // Legacy path (backend without verification): finalize immediately.
      await finalizeDevis()
    } catch (err) {
      setSubmitError(err.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  const onResendCode = async () => {
    setSubmitError(null)
    setResendInfo(null)
    try {
      await resendVerificationCode({ email: form.email })
      setResendInfo(`Un nouveau code a été envoyé à ${form.email}.`)
    } catch (err) {
      setSubmitError(err.message || 'Impossible de renvoyer le code.')
    }
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 transition focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20'
  const labelClass = 'block text-sm font-semibold text-primary'

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <Navbar />

      <main className="py-10 md:py-14 lg:py-16">
        <div className="container max-w-4xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary-700">
              <span className="h-0.5 w-4 bg-secondary-500" />
              {t('devis.eyebrow')}
            </div>
            <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-primary md:text-3xl lg:text-4xl">
              {t('devis.title')}
            </h1>
            <p className="mt-3 text-sm font-medium text-gray-600 md:text-base">
              {t('devis.subtitle')}
            </p>
            {user && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3.5 py-1.5 text-xs font-semibold text-accent-700">
                <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                {t('devis.connectedNotice', {
                  defaultValue: 'Connecté en tant que {{name}} — vos infos sont préremplies.',
                  name: `${user.firstName} ${user.lastName}`,
                })}
              </div>
            )}
          </div>

          <div className="mt-10">
            <div className="text-center text-xs font-bold uppercase tracking-wider text-secondary-600">
              {t('devis.stepCounter', { current: step + 1, total: stepKeys.length })}
            </div>
            <ol className="mt-4 flex items-start justify-between gap-2">
              {stepKeys.map((k, i) => {
                const isCompleted = i < step
                const isActive = i === step
                return (
                  <li key={k} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      <span
                        className={`h-px flex-1 ${i === 0 ? 'invisible' : isCompleted || isActive ? 'bg-secondary' : 'bg-gray-200'}`}
                      />
                      <button
                        type="button"
                        onClick={() => i < step && setStep(i)}
                        disabled={i > step}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                          isCompleted
                            ? 'cursor-pointer bg-secondary text-white shadow-md shadow-secondary/30 hover:bg-secondary-700'
                            : isActive
                              ? 'bg-secondary text-white shadow-md shadow-secondary/30'
                              : 'bg-white text-gray-400 ring-1 ring-gray-200'
                        }`}
                      >
                        {isCompleted ? (
                          <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                        ) : (
                          i + 1
                        )}
                      </button>
                      <span
                        className={`h-px flex-1 ${i === stepKeys.length - 1 ? 'invisible' : isCompleted ? 'bg-secondary' : 'bg-gray-200'}`}
                      />
                    </div>
                    <span
                      className={`mt-2 text-[11px] font-bold uppercase tracking-wider md:text-xs ${
                        isActive
                          ? 'text-primary'
                          : isCompleted
                            ? 'text-secondary-600'
                            : 'text-gray-400'
                      }`}
                    >
                      {t(`devis.steps.${k}`)}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>

          <form
            onSubmit={onSubmit}
            className="mt-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-10"
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30">
                  <FontAwesomeIcon icon={faEnvelopeOpenText} className="h-7 w-7" />
                </span>
                <h2 className="mt-5 text-xl font-bold text-primary md:text-2xl">
                  {user
                    ? t('devis.success.connectedTitle', { defaultValue: 'Devis envoyé !' })
                    : t('devis.success.title')}
                </h2>
                <p className="mt-3 max-w-md text-sm font-medium text-gray-600 md:text-base">
                  {user
                    ? t('devis.success.connectedMessage', {
                        defaultValue:
                          "Votre demande a bien été enregistrée. Vous pouvez suivre son avancement depuis votre espace client.",
                      })
                    : t('devis.success.message')}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary-50 px-3 py-1 text-xs font-bold text-secondary-700">
                  <FontAwesomeIcon icon={faEnvelopeOpenText} className="h-3 w-3" />
                  {form.email}
                </div>
                <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
                  <Link to="/espace-client/devis" className="btn-primary px-6 py-3 text-sm">
                    {user
                      ? t('devis.success.viewMyQuotes', { defaultValue: 'Voir mes devis' })
                      : t('devis.success.ctaLogin')}
                    <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                  </Link>
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-primary hover:text-primary"
                  >
                    {t('devis.success.cta')}
                  </a>
                </div>
              </div>
            ) : (
              <>
                {step === 0 && (
                  <div>
                    <h2 className="text-center text-xl font-bold text-primary md:text-2xl">
                      {t('devis.step1.title')}
                    </h2>
                    <p className="mt-2 text-center text-sm font-medium text-gray-500">
                      {t('devis.step1.subtitle')}
                    </p>

                    <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {services.map(({ key, icon }) => {
                        const active = form.service === key
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => update({ service: key })}
                            className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition ${
                              active
                                ? 'border-secondary bg-secondary/5 shadow-md shadow-secondary/10'
                                : 'border-gray-200 bg-white hover:border-secondary/40 hover:bg-secondary-50/40'
                            }`}
                          >
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                                active ? 'bg-secondary text-white' : 'bg-secondary-50 text-secondary'
                              }`}
                            >
                              <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                            </span>
                            <span className="text-sm font-bold leading-tight text-primary">
                              {t(`services.${key}.title`)}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <h3 className="mt-9 text-base font-bold text-primary md:text-lg">
                      {t('devis.step1.audienceTitle')}
                    </h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                      {audiences.map(({ key, icon }) => {
                        const active = form.audience === key
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => update({ audience: key })}
                            className={`flex flex-col items-center rounded-xl border-2 p-5 text-center transition ${
                              active
                                ? 'border-secondary bg-secondary/5 shadow-md shadow-secondary/10'
                                : 'border-gray-200 bg-white hover:border-secondary/40 hover:bg-secondary-50/40'
                            }`}
                          >
                            <span
                              className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                                active ? 'bg-secondary text-white' : 'bg-secondary-50 text-secondary'
                              }`}
                            >
                              <FontAwesomeIcon icon={icon} className="h-5 w-5" />
                            </span>
                            <span className="mt-3 text-sm font-bold text-primary">
                              {t(`devis.audiences.${key}.label`)}
                            </span>
                            <span className="mt-1 text-xs font-medium text-gray-500">
                              {t(`devis.audiences.${key}.hint`)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h2 className="text-center text-xl font-bold text-primary md:text-2xl">
                      {t('devis.step2.title')}
                    </h2>
                    <p className="mt-2 text-center text-sm font-medium text-gray-500">
                      {t('devis.step2.subtitle')}
                    </p>

                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                      {hasField('surface') && (
                        <div>
                          <label htmlFor="surface" className={labelClass}>
                            {t(`devis.fields.surface_${form.service}`, {
                              defaultValue: t('devis.fields.surface'),
                            })}{' '}
                            *
                          </label>
                          <div className="relative mt-2">
                            <input
                              id="surface"
                              type="number"
                              min="1"
                              required
                              value={form.surface}
                              onChange={(e) => update({ surface: e.target.value })}
                              className={`${inputClass} pr-12`}
                              placeholder="80"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-gray-400">
                              m²
                            </span>
                          </div>
                        </div>
                      )}

                      {hasField('panelCount') && (
                        <div>
                          <label htmlFor="panelCount" className={labelClass}>
                            {t('devis.fields.panelCount')} *
                          </label>
                          <input
                            id="panelCount"
                            type="number"
                            min="1"
                            required
                            value={form.panelCount}
                            onChange={(e) => update({ panelCount: e.target.value })}
                            className={`mt-2 ${inputClass}`}
                            placeholder="20"
                          />
                        </div>
                      )}

                      {hasField('roofType') && (
                        <div>
                          <label className={labelClass}>{t('devis.fields.roofType')}</label>
                          <select
                            value={form.roofType}
                            onChange={(e) => update({ roofType: e.target.value })}
                            className={`mt-2 ${inputClass}`}
                          >
                            <option value="">—</option>
                            {ROOF_TYPES.map((r) => (
                              <option key={r} value={r}>
                                {t(`devis.roofTypes.${r}`)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {hasField('plantCount') && (
                        <div>
                          <label htmlFor="plantCount" className={labelClass}>
                            {t('devis.fields.plantCount')} *
                          </label>
                          <input
                            id="plantCount"
                            type="number"
                            min="1"
                            required
                            value={form.plantCount}
                            onChange={(e) => update({ plantCount: e.target.value })}
                            className={`mt-2 ${inputClass}`}
                            placeholder="8"
                          />
                        </div>
                      )}

                      {hasField('plantLocation') && (
                        <div>
                          <label className={labelClass}>
                            {t('devis.fields.plantLocation')}
                          </label>
                          <select
                            value={form.plantLocation}
                            onChange={(e) => update({ plantLocation: e.target.value })}
                            className={`mt-2 ${inputClass}`}
                          >
                            <option value="">—</option>
                            {PLANT_LOCATIONS.map((p) => (
                              <option key={p} value={p}>
                                {t(`devis.plantLocations.${p}`)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {hasField('visitFrequency') && (
                        <div className="sm:col-span-2">
                          <label className={labelClass}>
                            {t('devis.fields.visitFrequency')}
                          </label>
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {VISIT_FREQUENCIES.map((v) => {
                              const active = form.visitFrequency === v
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => update({ visitFrequency: v })}
                                  className={`rounded-xl border-2 p-3 text-xs font-bold transition md:text-sm ${
                                    active
                                      ? 'border-secondary bg-secondary/5 text-secondary'
                                      : 'border-gray-200 bg-white text-gray-700 hover:border-secondary/40'
                                  }`}
                                >
                                  {t(`devis.visitFrequencies.${v}`)}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {hasField('petType') && (
                        <div>
                          <label className={labelClass}>{t('devis.fields.petType')} *</label>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {PET_TYPES.map((p) => {
                              const active = form.petType === p
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => update({ petType: p })}
                                  className={`rounded-xl border-2 p-3 text-xs font-bold transition md:text-sm ${
                                    active
                                      ? 'border-secondary bg-secondary/5 text-secondary'
                                      : 'border-gray-200 bg-white text-gray-700 hover:border-secondary/40'
                                  }`}
                                >
                                  {t(`devis.petTypes.${p}`)}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {hasField('petCount') && (
                        <div>
                          <label htmlFor="petCount" className={labelClass}>
                            {t('devis.fields.petCount')} *
                          </label>
                          <input
                            id="petCount"
                            type="number"
                            min="1"
                            required
                            value={form.petCount}
                            onChange={(e) => update({ petCount: e.target.value })}
                            className={`mt-2 ${inputClass}`}
                            placeholder="1"
                          />
                        </div>
                      )}

                      {hasField('visitsPerDay') && (
                        <div className="sm:col-span-2">
                          <label className={labelClass}>
                            {t('devis.fields.visitsPerDay')}
                          </label>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {VISITS_PER_DAY.map((v) => {
                              const active = form.visitsPerDay === v
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => update({ visitsPerDay: v })}
                                  className={`rounded-xl border-2 p-3 text-xs font-bold transition md:text-sm ${
                                    active
                                      ? 'border-secondary bg-secondary/5 text-secondary'
                                      : 'border-gray-200 bg-white text-gray-700 hover:border-secondary/40'
                                  }`}
                                >
                                  {t(`devis.visitsPerDay.${v}`)}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {hasField('buildingUnits') && (
                        <div>
                          <label htmlFor="buildingUnits" className={labelClass}>
                            {t('devis.fields.buildingUnits')}
                          </label>
                          <input
                            id="buildingUnits"
                            type="number"
                            min="1"
                            value={form.buildingUnits}
                            onChange={(e) => update({ buildingUnits: e.target.value })}
                            className={`mt-2 ${inputClass}`}
                            placeholder="12"
                          />
                        </div>
                      )}

                      {hasField('parkingSpaces') && (
                        <div>
                          <label htmlFor="parkingSpaces" className={labelClass}>
                            {t('devis.fields.parkingSpaces')}
                          </label>
                          <input
                            id="parkingSpaces"
                            type="number"
                            min="1"
                            value={form.parkingSpaces}
                            onChange={(e) => update({ parkingSpaces: e.target.value })}
                            className={`mt-2 ${inputClass}`}
                            placeholder="30"
                          />
                        </div>
                      )}

                      {hasField('volume') && (
                        <div>
                          <label htmlFor="volume" className={labelClass}>
                            {t('devis.fields.volume')} *
                          </label>
                          <div className="relative mt-2">
                            <input
                              id="volume"
                              type="number"
                              min="1"
                              required
                              value={form.volume}
                              onChange={(e) => update({ volume: e.target.value })}
                              className={`${inputClass} pr-12`}
                              placeholder="10"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-gray-400">
                              m³
                            </span>
                          </div>
                        </div>
                      )}

                      {hasField('locationType') && (
                        <div>
                          <label className={labelClass}>
                            {t('devis.fields.locationType')}
                          </label>
                          <select
                            value={form.locationType}
                            onChange={(e) => update({ locationType: e.target.value })}
                            className={`mt-2 ${inputClass}`}
                          >
                            <option value="">—</option>
                            {LOCATION_TYPES.map((l) => (
                              <option key={l} value={l}>
                                {t(`devis.locationTypes.${l}`)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {hasField('startDate') && (
                        <div>
                          <label htmlFor="startDate" className={labelClass}>
                            {t(`devis.fields.startDate_${form.service}`, {
                              defaultValue: t('devis.fields.startDate'),
                            })}
                          </label>
                          <input
                            id="startDate"
                            type="date"
                            value={form.startDate}
                            onChange={(e) => update({ startDate: e.target.value })}
                            className={`mt-2 ${inputClass}`}
                          />
                        </div>
                      )}

                      {hasField('endDate') && (
                        <div>
                          <label htmlFor="endDate" className={labelClass}>
                            {t('devis.fields.endDate')} *
                          </label>
                          <input
                            id="endDate"
                            type="date"
                            required
                            value={form.endDate}
                            onChange={(e) => update({ endDate: e.target.value })}
                            className={`mt-2 ${inputClass}`}
                          />
                        </div>
                      )}

                      {showsForfait && hasField('frequency') && (
                        <div className="sm:col-span-2">
                          <label className={labelClass}>
                            {t('devis.fields.forfait', { defaultValue: 'Forfait' })} *
                          </label>
                          <p className="mt-1 text-xs font-medium text-gray-500">
                            {t('devis.fields.forfaitHint', {
                              defaultValue:
                                'Choisissez la cadence d\'intervention adaptée à votre activité.',
                            })}
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {frequencies.map((f) => {
                              const active = form.frequency === f
                              return (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => update({ frequency: f })}
                                  className={`rounded-xl border-2 p-3 text-xs font-bold transition md:text-sm ${
                                    active
                                      ? 'border-secondary bg-secondary/5 text-secondary'
                                      : 'border-gray-200 bg-white text-gray-700 hover:border-secondary/40'
                                  }`}
                                >
                                  {t(`devis.frequencies.${f}`)}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {hasField('rooms') && (
                      <div className="sm:col-span-2">
                        <label className={labelClass}>
                          {t('devis.fields.rooms', { defaultValue: 'Pièces à nettoyer' })}
                        </label>
                        <p className="mt-1 text-xs font-medium text-gray-500">
                          {t('devis.fields.roomsHint', {
                            defaultValue:
                              'Sélectionnez les pièces concernées et indiquez le nombre pour chacune.',
                          })}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                          {ROOM_TYPES.map(({ key, icon }) => {
                            const room = form.rooms.find((r) => r.key === key)
                            const active = !!room
                            return (
                              <div
                                key={key}
                                className={`flex flex-col items-center rounded-xl border-2 p-3 transition ${
                                  active
                                    ? 'border-secondary bg-secondary/5 shadow-md shadow-secondary/10'
                                    : 'border-gray-200 bg-white hover:border-secondary/40 hover:bg-secondary-50/40'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleRoom(key)}
                                  className="flex w-full flex-col items-center text-center"
                                >
                                  <span
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                                      active
                                        ? 'bg-secondary text-white'
                                        : 'bg-secondary-50 text-secondary'
                                    }`}
                                  >
                                    <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                                  </span>
                                  <span className="mt-2 text-xs font-bold text-primary">
                                    {t(`devis.rooms.${key}`, { defaultValue: key })}
                                  </span>
                                </button>
                                {active && (
                                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white px-1.5 py-1 ring-1 ring-secondary/30">
                                    <button
                                      type="button"
                                      onClick={() => setRoomCount(key, -1)}
                                      disabled={room.count <= 1}
                                      className="flex h-6 w-6 items-center justify-center rounded-full text-secondary transition hover:bg-secondary-50 disabled:opacity-30"
                                      aria-label="−"
                                    >
                                      <FontAwesomeIcon icon={faMinus} className="h-2.5 w-2.5" />
                                    </button>
                                    <span className="min-w-[1.25rem] text-center text-xs font-bold text-primary">
                                      {room.count}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setRoomCount(key, +1)}
                                      className="flex h-6 w-6 items-center justify-center rounded-full text-secondary transition hover:bg-secondary-50"
                                      aria-label="+"
                                    >
                                      <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      )}

                      {hasField('notes') && (
                      <div className="sm:col-span-2">
                        <label htmlFor="notes" className={labelClass}>
                          {t('devis.fields.notes')}
                        </label>
                        <textarea
                          id="notes"
                          rows={4}
                          value={form.notes}
                          onChange={(e) => update({ notes: e.target.value })}
                          placeholder={t('devis.fields.notesPlaceholder')}
                          className={`mt-2 resize-y ${inputClass}`}
                        />
                      </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-center text-xl font-bold text-primary md:text-2xl">
                      {t('devis.step3.title')}
                    </h2>
                    <p className="mt-2 text-center text-sm font-medium text-gray-500">
                      {t('devis.step3.subtitle')}
                    </p>

                    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
                        <FontAwesomeIcon icon={faLightbulb} className="h-4 w-4" />
                      </span>
                      <div className="leading-tight">
                        <div className="text-sm font-bold text-amber-900">
                          {t('devis.step3.tipTitle', {
                            defaultValue: 'Conseil — des photos claires accélèrent votre devis',
                          })}
                        </div>
                        <p className="mt-1 text-xs font-medium text-amber-800">
                          {t('devis.step3.tipText', {
                            defaultValue:
                              'Prenez des photos bien éclairées, sans flou, sous plusieurs angles. Cela nous permet d\'estimer plus précisément la surface, l\'état des sols/murs et le matériel nécessaire.',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Per-room photo sections (only for rooms selected at step 2) */}
                    {form.rooms.length > 0 && (
                      <div className="mt-7 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-700">
                          {t('devis.step3.byRoom', { defaultValue: 'Photos par pièce' })}
                        </h3>
                        {form.rooms.map(({ key, count }) => {
                          const { icon } = ROOM_BY_KEY[key] || {}
                          const photos = form.roomPhotos[key] || []
                          return (
                            <div
                              key={key}
                              className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5"
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary">
                                  {icon && <FontAwesomeIcon icon={icon} className="h-4 w-4" />}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-bold text-primary">
                                    {t(`devis.rooms.${key}`, { defaultValue: key })}
                                    <span className="ml-2 text-xs font-semibold text-gray-400">
                                      × {count}
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-medium text-gray-500">
                                    {t('devis.step3.roomHint', {
                                      defaultValue: '{{count}} photos max',
                                      count: 8,
                                    })}
                                  </div>
                                </div>
                                <label
                                  htmlFor={`photos-${key}`}
                                  className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-secondary-700"
                                >
                                  <FontAwesomeIcon icon={faCamera} className="h-3 w-3" />
                                  {t('devis.step3.addPhotos', { defaultValue: 'Ajouter' })}
                                  <input
                                    id={`photos-${key}`}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="sr-only"
                                    onChange={(e) => handleRoomFiles(key, e.target.files)}
                                  />
                                </label>
                              </div>

                              {photos.length === 0 ? (
                                <label
                                  htmlFor={`photos-${key}`}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={onRoomDrop(key)}
                                  className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center transition hover:border-secondary hover:bg-secondary-50/40"
                                >
                                  <FontAwesomeIcon icon={faCloudArrowUp} className="h-5 w-5 text-gray-400" />
                                  <span className="mt-2 text-xs font-medium text-gray-500">
                                    {t('devis.step3.dropRoom', {
                                      defaultValue: 'Glissez ou cliquez pour ajouter',
                                    })}
                                  </span>
                                </label>
                              ) : (
                                <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                                  {photos.map((p, i) => (
                                    <li
                                      key={i}
                                      className="group relative overflow-hidden rounded-lg ring-1 ring-gray-200"
                                    >
                                      <img
                                        src={p.url}
                                        alt={p.name}
                                        className="aspect-square w-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeRoomPhoto(key, i)}
                                        aria-label="Supprimer"
                                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                                      >
                                        <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* General photos zone (always present) */}
                    <div className="mt-7">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-700">
                        {t('devis.step3.general', { defaultValue: 'Photos générales' })}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-gray-500">
                        {t('devis.step3.generalHint', {
                          defaultValue: 'Plans d\'ensemble, extérieur, accès — tout ce qui aide à comprendre les lieux.',
                        })}
                      </p>
                      <label
                        htmlFor="photos"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDrop}
                        className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-secondary hover:bg-secondary-50/40"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                          <FontAwesomeIcon icon={faCloudArrowUp} className="h-5 w-5" />
                        </span>
                        <div className="mt-3 text-sm font-bold text-primary">
                          {t('devis.step3.dropTitle')}
                        </div>
                        <div className="mt-1 text-xs font-medium text-gray-500">
                          {t('devis.step3.dropHint')}
                        </div>
                        <input
                          id="photos"
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(e) => handleFiles(e.target.files)}
                        />
                      </label>

                      {form.photos.length > 0 && (
                        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                          {form.photos.map((p, i) => (
                            <li
                              key={i}
                              className="group relative overflow-hidden rounded-lg ring-1 ring-gray-200"
                            >
                              <img
                                src={p.url}
                                alt={p.name}
                                className="aspect-square w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                aria-label="Supprimer"
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                              >
                                <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <p className="mt-5 text-center text-xs font-medium text-gray-500">
                      {t('devis.step3.optional')}
                    </p>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="text-center text-xl font-bold text-primary md:text-2xl">
                      {t('devis.step4.title')}
                    </h2>
                    <p className="mt-2 text-center text-sm font-medium text-gray-500">
                      {t('devis.step4.subtitle')}
                    </p>

                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="firstName" className={labelClass}>
                          {t('contact.fields.firstName')} *
                        </label>
                        <input
                          id="firstName"
                          required
                          value={form.firstName}
                          onChange={(e) => update({ firstName: e.target.value })}
                          className={`mt-2 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className={labelClass}>
                          {t('contact.fields.lastName')} *
                        </label>
                        <input
                          id="lastName"
                          required
                          value={form.lastName}
                          onChange={(e) => update({ lastName: e.target.value })}
                          className={`mt-2 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className={labelClass}>
                          {t('contact.fields.email')} *
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => update({ email: e.target.value })}
                          className={`mt-2 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className={labelClass}>
                          {t('contact.fields.phone')}
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => update({ phone: e.target.value })}
                          className={`mt-2 ${inputClass}`}
                        />
                      </div>

                      {form.audience && form.audience !== 'particulier' && (
                        <>
                          <div className="sm:col-span-2">
                            <label htmlFor="company" className={labelClass}>
                              {t('signup.business.company', {
                                defaultValue: "Nom de l'entreprise / association",
                              })}{' '}
                              *
                            </label>
                            <input
                              id="company"
                              required
                              value={form.company}
                              onChange={(e) => update({ company: e.target.value })}
                              placeholder="Régie Léman SA"
                              className={`mt-2 ${inputClass}`}
                            />
                          </div>
                          <div>
                            <label htmlFor="siret" className={labelClass}>
                              {t('signup.business.siret', {
                                defaultValue: 'SIRET / N° entreprise',
                              })}
                            </label>
                            <input
                              id="siret"
                              value={form.siret}
                              onChange={(e) => update({ siret: e.target.value })}
                              placeholder="CHE-123.456.789"
                              className={`mt-2 ${inputClass}`}
                            />
                          </div>
                          <div>
                            <label htmlFor="representativeRole" className={labelClass}>
                              {t('signup.business.role', {
                                defaultValue: 'Fonction du représentant',
                              })}
                            </label>
                            <input
                              id="representativeRole"
                              value={form.representativeRole}
                              onChange={(e) =>
                                update({ representativeRole: e.target.value })
                              }
                              placeholder="Directeur, Gérant…"
                              className={`mt-2 ${inputClass}`}
                            />
                          </div>
                        </>
                      )}

                      <div className="sm:col-span-2">
                        <label htmlFor="address" className={labelClass}>
                          {t('devis.fields.address')}
                        </label>
                        <input
                          id="address"
                          value={form.address}
                          onChange={(e) => update({ address: e.target.value })}
                          className={`mt-2 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label htmlFor="postalCode" className={labelClass}>
                          {t('devis.fields.postalCode')}
                        </label>
                        <input
                          id="postalCode"
                          value={form.postalCode}
                          onChange={(e) => update({ postalCode: e.target.value })}
                          className={`mt-2 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label htmlFor="city" className={labelClass}>
                          {t('devis.fields.city')}
                        </label>
                        <input
                          id="city"
                          value={form.city}
                          onChange={(e) => update({ city: e.target.value })}
                          className={`mt-2 ${inputClass}`}
                        />
                      </div>

                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-xs font-medium text-gray-600 sm:col-span-2">
                        <input
                          type="checkbox"
                          required
                          checked={form.consent}
                          onChange={(e) => update({ consent: e.target.checked })}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        <span>
                          {t('contact.consent')} <span className="text-accent">*</span>
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {step === 4 && user && (
                  <div>
                    <h2 className="text-center text-xl font-bold text-primary md:text-2xl">
                      {t('devis.step5.connectedTitle', { defaultValue: 'Prêt à envoyer votre devis' })}
                    </h2>
                    <p className="mt-2 text-center text-sm font-medium text-gray-500">
                      {t('devis.step5.connectedSubtitle', {
                        defaultValue: 'Votre devis sera lié à votre compte et accessible depuis votre espace client.',
                      })}
                    </p>

                    <div className="mt-7 rounded-2xl border border-accent/30 bg-accent/5 p-5 text-center">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/30">
                        <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" />
                      </span>
                      <div className="mt-3 text-sm font-bold text-primary">
                        {t('devis.step5.connectedAs', {
                          defaultValue: 'Connecté en tant que {{name}}',
                          name: `${user.firstName} ${user.lastName}`,
                        })}
                      </div>
                      <div className="mt-1 text-xs font-medium text-gray-600">{user.email}</div>
                    </div>

                    <Link
                      to="/espace-client"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 text-xs font-bold text-secondary transition hover:text-secondary-700"
                    >
                      {t('devis.step5.goToSpace', { defaultValue: 'Voir mon espace client' })} →
                    </Link>
                  </div>
                )}

                {step === 4 && !user && (
                  <div>
                    <h2 className="text-center text-xl font-bold text-primary md:text-2xl">
                      {t('devis.step5.title')}
                    </h2>
                    <p className="mt-2 text-center text-sm font-medium text-gray-500">
                      {t('devis.step5.subtitle')}
                    </p>

                    <div className="mt-7 rounded-2xl border border-secondary-100 bg-secondary-50/40 p-4 md:p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-white">
                          <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4" />
                        </span>
                        <div className="leading-tight">
                          <div className="text-sm font-bold text-primary">
                            {t('devis.step5.infoTitle')}
                          </div>
                          <p className="mt-1 text-xs font-medium text-gray-600">
                            {t('devis.step5.info')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor="accountEmail" className={labelClass}>
                          {t('devis.step5.emailLabel')}
                        </label>
                        <input
                          id="accountEmail"
                          type="email"
                          value={form.email}
                          readOnly
                          className={`mt-2 ${inputClass} cursor-not-allowed bg-gray-50 text-gray-500`}
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className={labelClass}>
                          {t('devis.step5.passwordLabel')} *
                        </label>
                        <div className="relative mt-2">
                          <FontAwesomeIcon
                            icon={faLock}
                            className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            id="password"
                            type={showPwd ? 'text' : 'password'}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={form.password}
                            onChange={(e) => update({ password: e.target.value })}
                            placeholder={t('devis.step5.passwordPlaceholder')}
                            className={`${inputClass} pl-11 pr-12`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd((v) => !v)}
                            aria-label={t(showPwd ? 'devis.step5.hidePwd' : 'devis.step5.showPwd')}
                            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-primary"
                          >
                            <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="passwordConfirm" className={labelClass}>
                          {t('devis.step5.passwordConfirmLabel')} *
                        </label>
                        <div className="relative mt-2">
                          <FontAwesomeIcon
                            icon={faLock}
                            className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            id="passwordConfirm"
                            type={showPwd ? 'text' : 'password'}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={form.passwordConfirm}
                            onChange={(e) => update({ passwordConfirm: e.target.value })}
                            placeholder={t('devis.step5.passwordPlaceholder')}
                            className={`${inputClass} pl-11`}
                          />
                        </div>
                        {form.passwordConfirm.length > 0 && !passwordsMatch && (
                          <p className="mt-1.5 text-xs font-semibold text-red-500">
                            {t('devis.step5.mismatch')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center text-xs font-medium text-gray-600 sm:flex-row sm:justify-center sm:text-left">
                      <FontAwesomeIcon icon={faEnvelopeOpenText} className="h-3.5 w-3.5 text-secondary" />
                      <span>{t('devis.step5.verifyHint')}</span>
                    </div>

                    <p className="mt-5 text-center text-xs font-medium text-gray-500">
                      {t('devis.step5.haveAccount')}{' '}
                      <Link to="/login" className="font-bold text-secondary transition hover:text-secondary-700">
                        {t('devis.step5.loginLink')}
                      </Link>
                    </p>
                  </div>
                )}

                {awaitingCode && !user && (
                  <div className="mt-6 rounded-2xl border-2 border-accent/30 bg-accent/5 p-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-700">
                        <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-primary">
                          Un code à 6 chiffres a été envoyé à {form.email}
                        </div>
                        <div className="mt-1 text-xs font-medium text-gray-600">
                          Saisissez-le pour valider votre compte et envoyer votre devis.
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="w-full flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-primary shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                      <button
                        type="button"
                        onClick={onResendCode}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-white px-4 py-3 text-xs font-bold text-primary transition hover:border-accent hover:text-accent-700"
                      >
                        Renvoyer le code
                      </button>
                    </div>
                    {resendInfo && (
                      <div className="mt-3 text-xs font-semibold text-emerald-700">
                        {resendInfo}
                      </div>
                    )}
                  </div>
                )}

                {submitError && (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {submitError}
                  </div>
                )}

                <div className="mt-9 flex flex-col-reverse items-center justify-between gap-3 border-t border-gray-100 pt-7 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0 || awaitingCode}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
                    {t('devis.prev')}
                  </button>

                  {step < stepKeys.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => canNext() && setStep((s) => s + 1)}
                      disabled={!canNext()}
                      className="btn-primary px-7 py-3 text-sm disabled:opacity-50 disabled:hover:bg-accent"
                    >
                      {t('devis.next')}
                      <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting || (awaitingCode && verifyCode.length !== 6) || (!awaitingCode && !canNext())}
                      className="btn-primary px-7 py-3 text-sm disabled:opacity-50 disabled:hover:bg-accent"
                    >
                      {awaitingCode
                        ? 'Valider le code et envoyer'
                        : t('devis.step5.submit')}
                      <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
