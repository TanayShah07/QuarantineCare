import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity, Users, LayoutDashboard, Thermometer, Stethoscope,
  ClipboardCheck, ChartNoAxesCombined, Plus, Search, Bell,
  Menu, X, HeartPulse, BedDouble, CheckCircle2,
  AlertTriangle, UserRound, ChevronRight
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

const FEVER_THRESHOLD = 37.5
const CAPACITY = 74

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const dateOffset = days => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const initialPatients = [
  { id: 'QC001', name: 'Aarav Mehta', age: 32, gender: 'Male', room: '101', admission: dateOffset(-4), readings: [-3,-2,-1,0].map((n,i)=>({date:dateOffset(n),temperature:[37.2,37.0,36.8,36.7][i],by:'Nurse'})), visits: [dateOffset(-3),dateOffset(-2),dateOffset(-1),dateOffset(0)], notes: 'Responding well to treatment.', outcome: 'Active' },
  { id: 'QC002', name: 'Ananya Shah', age: 26, gender: 'Female', room: '102', admission: dateOffset(-3), readings: [-2,-1,0].map((n,i)=>({date:dateOffset(n),temperature:[38.5,38.1,37.8][i],by:'Nurse'})), visits: [dateOffset(-2),dateOffset(0)], notes: 'Continue monitoring fever.', outcome: 'Active' },
  { id: 'QC003', name: 'Rohan Patel', age: 41, gender: 'Male', room: '103', admission: dateOffset(-5), readings: [-2,-1,0].map((n,i)=>({date:dateOffset(n),temperature:[36.8,36.7,36.6][i],by:'Nurse'})), visits: [dateOffset(-2),dateOffset(-1)], notes: 'Stable condition.', outcome: 'Active' },
  { id: 'QC004', name: 'Priya Desai', age: 29, gender: 'Female', room: '104', admission: dateOffset(-2), readings: [-1,0].map((n,i)=>({date:dateOffset(n),temperature:[39.1,38.8][i],by:'Nurse'})), visits: [], notes: 'Under observation.', outcome: 'Active' },
  { id: 'QC005', name: 'Kabir Joshi', age: 35, gender: 'Male', room: '105', admission: dateOffset(-6), readings: [-2,-1,0].map((n,i)=>({date:dateOffset(n),temperature:[36.7,36.6,36.5][i],by:'Nurse'})), visits: [dateOffset(-2),dateOffset(-1),dateOffset(0)], notes: 'Recovery progressing.', outcome: 'Active' },
  { id: 'QC006', name: 'Ishita Rao', age: 24, gender: 'Female', room: '106', admission: dateOffset(-1), readings: [], visits: [], notes: 'New admission.', outcome: 'Active' },
  { id: 'QC007', name: 'Dev Malhotra', age: 48, gender: 'Male', room: '107', admission: dateOffset(-3), readings: [-2,-1,0].map((n,i)=>({date:dateOffset(n),temperature:[37.4,37.2,37.0][i],by:'Nurse'})), visits: [dateOffset(-2),dateOffset(0)], notes: 'Monitor temperature.', outcome: 'Active' },
  { id: 'QC008', name: 'Meera Iyer', age: 31, gender: 'Female', room: '108', admission: dateOffset(-7), readings: [-2,-1,0].map((n,i)=>({date:dateOffset(n),temperature:[36.6,36.5,36.4][i],by:'Nurse'})), visits: [dateOffset(-2),dateOffset(-1),dateOffset(0)], notes: 'Stable.', outcome: 'Active' }
].map(p => ({...p, temps: p.readings.map(r=>r.temperature)}))

const getData = () => {
  try {
    const saved = localStorage.getItem('qc_patients')
    if (!saved) return initialPatients
    const parsed = JSON.parse(saved)
    return parsed.map(p => ({
      ...p,
      readings: Array.isArray(p.readings) ? p.readings :
        (p.temps || []).map((temperature,i)=>({date:dateOffset(-((p.temps || []).length-1-i)),temperature,by:'Legacy record'})),
      visits: Array.isArray(p.visits) ? p.visits : [],
      dischargeRecommended: Boolean(p.dischargeRecommended)
    }))
  } catch {
    return initialPatients
  }
}

const hasReadingToday = p => (p.readings || []).some(r => r.date === today())
const hasVisitToday = p => (p.visits || []).includes(today())
const feverFree = p => {
  // Three complete calendar days must have passed without fever.
  // Today's reading is still required separately before the doctor visit.
  const requiredFullDays = [dateOffset(-3), dateOffset(-2), dateOffset(-1)]
  return requiredFullDays.every(date => {
    const reading = (p.readings || []).find(r => r.date === date)
    return Boolean(reading && Number(reading.temperature) < FEVER_THRESHOLD)
  })
}

const menu = [
  ['Dashboard', LayoutDashboard],
  ['Patients', Users],
  ['Temperature Tracking', Thermometer],
  ['Doctor Rounds', Stethoscope],
  ['Discharges', ClipboardCheck],
  ['Analytics', ChartNoAxesCombined]
]

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}

export default function App() {
  const [patients, setPatients] = useState(getData)
  const [role, setRole] = useState('Administrator')
  const [page, setPage] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState('')
  const [mobile, setMobile] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({})
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    localStorage.setItem('qc_patients', JSON.stringify(patients))
  }, [patients])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const active = patients.filter(p => p.outcome === 'Active')
  const discharged = patients.filter(p => p.outcome === 'Discharged')
  const mortality = patients.filter(p => p.outcome === 'Deceased').length
  const pendingTemp = active.filter(p => !hasReadingToday(p))
  const pendingVisit = active.filter(p => !hasVisitToday(p))
  const recommended = active.filter(p => p.dischargeRecommended)
  const eligible = active.filter(p => feverFree(p) && !p.dischargeRecommended)
  const occupancy = active.length
  const totalOutcomes = discharged.length + mortality
  const mortalityRate = totalOutcomes ? mortality / totalOutcomes * 100 : 0
  const survivalRate = totalOutcomes ? discharged.length / totalOutcomes * 100 : 0

  const notify = message => setToast(message)
  const update = (id, fn) => setPatients(old => old.map(p => p.id === id ? fn(p) : p))

  const filtered = useMemo(() => active.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'All' ||
      (filter === 'Pending temperature' && !hasReadingToday(p)) ||
      (filter === 'Pending visit' && !hasVisitToday(p)) ||
      (filter === 'Discharge eligible' && feverFree(p))
    return matchesSearch && matchesFilter
  }), [patients, search, filter])

  const recordTemp = () => {
    const patient = patients.find(p => p.id === selected)
    const value = Number(form.temperature)
    if (!patient) return notify('Patient not found.')
    if (form.temperature === '' || !Number.isFinite(value) || value < 30 || value > 45) {
      return notify('Enter a valid temperature between 30°C and 45°C.')
    }
    if (hasReadingToday(patient)) return notify('Temperature already recorded today.')
    update(selected, p => {
      const readings = [...(p.readings || []), { date: today(), temperature: value, by: role, recordedAt: new Date().toISOString() }]
      return { ...p, readings, temps: readings.map(r => r.temperature), dischargeRecommended: false }
    })
    setModal('')
    setForm({})
    notify('Temperature recorded successfully.')
  }

  const recordVisit = () => {
    const patient = patients.find(p => p.id === selected)
    if (!patient) return notify('Patient not found.')
    if (!hasReadingToday(patient)) return notify('Record today’s temperature before completing the doctor visit.')
    if (hasVisitToday(patient)) return notify('A doctor visit is already recorded for today.')
    if (!form.notes?.trim()) return notify('Please add treatment notes.')
    update(selected, p => ({
      ...p,
      visits: [...(p.visits || []), today()],
      notes: form.notes.trim(),
      visitHistory: [...(p.visitHistory || []), { date: today(), notes: form.notes.trim(), by: role }]
    }))
    setModal('')
    setForm({})
    notify('Doctor visit recorded successfully.')
  }

  const addPatient = () => {
    if (!['Administrator', 'Nurse'].includes(role)) return notify('Only a nurse or administrator can register a patient.')
    if (!form.name?.trim() || !form.age || !form.gender) return notify('Please complete all required fields.')
    const age = Number(form.age)
    if (!Number.isInteger(age) || age < 1 || age > 120) return notify('Enter a valid age between 1 and 120.')
    if (occupancy >= CAPACITY) return notify('Facility capacity reached. No beds available.')
    const roomNumber = Array.from({ length: CAPACITY }, (_, i) => 101 + i)
      .find(n => !active.some(p => p.room === String(n)))
    if (!roomNumber) return notify('No room is currently available.')
    const id = `QC${String(Date.now()).slice(-6)}`
    const patient = {
      id, name: form.name.trim(), age, gender: form.gender, room: String(roomNumber),
      admission: today(), readings: [], temps: [], visits: [], visitHistory: [],
      notes: 'New admission.', outcome: 'Active', dischargeRecommended: false
    }
    setPatients(old => [...old, patient])
    setModal('')
    setForm({})
    notify(`Patient registered. Room ${roomNumber} assigned.`)
  }

  const recommendDischarge = id => {
    const patient = patients.find(p => p.id === id)
    if (role !== 'Doctor') return notify('Only a doctor can recommend discharge.')
    if (!patient || patient.outcome !== 'Active') return notify('Active patient record not found.')
    if (!feverFree(patient)) return notify('Patient needs three full consecutive calendar days without fever.')
    if (!hasVisitToday(patient)) return notify('Complete today’s doctor visit before recommending discharge.')
    update(id, p => ({
      ...p,
      dischargeRecommended: true,
      dischargeRecommendedBy: role,
      dischargeRecommendedDate: today()
    }))
    setModal('')
    notify('Discharge recommendation sent to administration.')
  }

  const discharge = id => {
    const patient = patients.find(p => p.id === id)
    if (role !== 'Administrator') return notify('Only an administrator can confirm discharge.')
    if (!patient?.dischargeRecommended) return notify('Doctor recommendation is required before discharge.')
    if (!window.confirm(`Confirm discharge of ${patient.name}?`)) return
    update(id, p => ({ ...p, outcome: 'Discharged', dischargeDate: today() }))
    setModal('')
    notify('Patient discharged. Room released.')
  }

  const markDeceased = id => {
    const patient = patients.find(p => p.id === id)
    if (role !== 'Administrator') return notify('Only an administrator can record this outcome.')
    if (!patient || patient.outcome !== 'Active') return notify('Active patient record not found.')
    if (!window.confirm(`Record ${patient.name} as deceased?`)) return
    update(id, p => ({ ...p, outcome: 'Deceased', outcomeDate: today() }))
    setModal('')
    notify('Patient outcome recorded.')
  }

  const Card = ({ title, value, sub, icon: Icon, color = '#2563eb' }) => (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-xs text-slate-400 mt-2">{sub}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: color + '15', color }}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  )

  const Button = ({ children, onClick, secondary = false, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
        disabled ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
        secondary ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' :
        'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {children}
    </button>
  )

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white'

  const openDetails = patient => {
    setSelected(patient.id)
    setModal('details')
  }
  const selectedPatient = patients.find(p => p.id === selected)

  const PatientTable = ({ items = filtered }) => (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h3 className="font-bold">Patient records</h3>
          <p className="text-xs text-slate-400 mt-1">{items.length} patients listed</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input className="border rounded-xl py-2 pl-9 pr-3 text-sm w-52 outline-none" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['Patient', 'ID / Room', 'Latest temperature', "Today's status", 'Action'].map(x => (
                <th className="px-4 py-3 font-semibold whitespace-nowrap" key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(p => {
              const latest = [...(p.readings || [])].sort((a,b)=>b.date.localeCompare(a.date))[0]
              return (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3"><b>{p.name}</b><p className="text-xs text-slate-400">{p.age} years · {p.gender}</p></td>
                  <td className="px-4 py-3"><b>{p.id}</b><p className="text-xs text-slate-400">Room {p.room}</p></td>
                  <td className="px-4 py-3">{latest ? `${latest.temperature}°C` : 'Not recorded'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${hasReadingToday(p) ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {hasReadingToday(p) ? 'Measured' : 'Pending measurement'}
                    </span>
                  </td>
                  <td className="px-4 py-3"><button onClick={() => openDetails(p)} className="text-blue-600 font-semibold hover:underline">View details</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p className="p-8 text-center text-slate-400">No patients found.</p>}
    </div>
  )

  const dashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Good day, {role}!</h2>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening at your facility today.</p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Active patients" value={occupancy} sub="Out of 74 available beds" icon={Users} />
        <Card title="Available beds" value={CAPACITY - occupancy} sub="Current facility capacity" icon={BedDouble} color="#10b981" />
        <Card title="Pending measurements" value={pendingTemp.length} sub="Patients awaiting temperature" icon={Thermometer} color="#d97706" />
        <Card title="Pending doctor visits" value={pendingVisit.length} sub="Patients awaiting review" icon={Stethoscope} color="#8b5cf6" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between mb-5">
            <div><h3 className="font-bold">Patient workflow</h3><p className="text-xs text-slate-400 mt-1">Daily operational overview</p></div>
            <Activity className="text-blue-600" />
          </div>
          {[
            ['Temperature recorded', active.filter(hasReadingToday).length, occupancy, '#2563eb'],
            ['Doctor visit completed', active.filter(hasVisitToday).length, occupancy, '#10b981'],
            ['Awaiting discharge', recommended.length, occupancy, '#8b5cf6']
          ].map(([name, n, total, color]) => (
            <div key={name} className="mb-6">
              <div className="flex justify-between text-sm mb-2"><span>{name}</span><b>{n}/{total}</b></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: (total ? n / total * 100 : 0) + '%', background: color }} /></div>
            </div>
          ))}
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold mb-4">Attention required</h3>
          {[
            ['Measurements pending', pendingTemp.length, Thermometer],
            ['Doctor visits pending', pendingVisit.length, Stethoscope],
            ['Discharge recommendations', recommended.length, ClipboardCheck]
          ].map(([title, count, Icon]) => (
            <div key={title} className="flex items-center gap-3 py-3 border-b last:border-0">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icon size={18} /></div>
              <div className="flex-1"><p className="text-sm font-medium">{title}</p></div><b>{count}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center"><h3 className="font-bold">Recent patient records</h3><button onClick={() => setPage('Patients')} className="text-sm text-blue-600">View all →</button></div>
      <PatientTable items={active.slice(0, 5)} />
    </div>
  )

  const pageContent = () => {
    if (page === 'Dashboard') return dashboard()

    if (page === 'Patients') return (
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div><h2 className="text-2xl font-bold">Patient Management</h2><p className="text-sm text-slate-500 mt-1">Manage admissions and patient information.</p></div>
          {['Administrator', 'Nurse'].includes(role) && <Button onClick={() => { setForm({}); setModal('add') }}><Plus size={17} /> Add patient</Button>}
        </div>
        <PatientTable />
      </div>
    )

    if (page === 'Temperature Tracking') return (
      <div className="space-y-5">
        <div><h2 className="text-2xl font-bold">Temperature Tracking</h2><p className="text-sm text-slate-500 mt-1">Record and monitor daily patient temperatures.</p></div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Pending measurements" value={pendingTemp.length} sub="Patients yet to be measured today" icon={Thermometer} color="#d97706" />
          <Card title="Completed measurements" value={active.length - pendingTemp.length} sub="Daily readings recorded" icon={CheckCircle2} color="#10b981" />
        </div>
        <PatientTable items={active} />
      </div>
    )

    if (page === 'Doctor Rounds') return (
      <div className="space-y-5">
        <div><h2 className="text-2xl font-bold">Doctor Rounds</h2><p className="text-sm text-slate-500 mt-1">Review patients and record medical visits.</p></div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">Routine doctor visits require today's temperature reading to be recorded first.</div>
        <PatientTable items={active.filter(p => !hasVisitToday(p))} />
      </div>
    )

    if (page === 'Discharges') return (
      <div className="space-y-5">
        <div><h2 className="text-2xl font-bold">Discharge Management</h2><p className="text-sm text-slate-500 mt-1">Review doctor recommendations and manage patient discharge.</p></div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
          <b>Discharge eligibility:</b> A patient must have recorded temperatures below {FEVER_THRESHOLD}°C for three full consecutive calendar days, followed by today's temperature measurement and a completed doctor visit today, before discharge can be recommended.
        </div>
        <h3 className="font-bold">Patients meeting the fever-free criterion</h3>
        {eligible.length === 0 && <div className="bg-white border rounded-xl p-6 text-center text-slate-400">No patients currently meet the eligibility criterion.</div>}
        {eligible.map(p => (
          <div key={p.id} className="bg-white border rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <b>{p.name}</b>
              <p className="text-xs text-slate-400">{p.id} · Room {p.room}</p>
              <p className="text-xs text-amber-700 mt-1">
                {hasVisitToday(p) ? 'Fever-free requirement met and today’s doctor visit completed' : 'Fever-free requirement met; today’s doctor visit is still required'}
              </p>
            </div>
            {role === 'Doctor' ? (
              <Button
                onClick={() => recommendDischarge(p.id)}
                disabled={!hasVisitToday(p)}
              >
                Recommend discharge
              </Button>
            ) : (
              <span className="text-sm text-slate-500">
                {role === 'Nurse' ? 'Awaiting doctor review' : 'Awaiting doctor recommendation'}
              </span>
            )}
          </div>
        ))}
        <h3 className="font-bold pt-3">Pending doctor recommendations ({recommended.length})</h3>
        {recommended.length === 0 && <div className="bg-white border rounded-xl p-6 text-center text-slate-400">No pending discharge recommendations.</div>}
        {recommended.map(p => (
          <div key={p.id} className="bg-white border rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
            <div><b>{p.name}</b><p className="text-xs text-slate-400">{p.id} · Room {p.room}</p><p className="text-xs text-green-700 mt-1">Recommended by {p.dischargeRecommendedBy} on {p.dischargeRecommendedDate}</p></div>
            {role === 'Administrator' ? <Button onClick={() => discharge(p.id)}>Confirm discharge</Button> : <span className="text-sm text-green-700">Awaiting administration</span>}
          </div>
        ))}
        <h3 className="font-bold pt-3">Previously discharged patients ({discharged.length})</h3>
        {discharged.map(p => (
          <div key={p.id} className="bg-white border rounded-xl p-4 flex justify-between">
            <div><b>{p.name}</b><p className="text-xs text-slate-400">{p.id} · Room {p.room}</p></div>
            <span className="text-green-700 text-sm">Discharged</span>
          </div>
        ))}
      </div>
    )

    if (page === 'Analytics') return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Facility performance and patient outcomes.</p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card
            title="Survival rate"
            value={totalOutcomes ? survivalRate.toFixed(1) + '%' : 'N/A'}
            sub="Facility benchmark: 85%"
            icon={HeartPulse}
            color="#10b981"
          />
          <Card
            title="Mortality rate"
            value={totalOutcomes ? mortalityRate.toFixed(1) + '%' : 'N/A'}
            sub="Facility benchmark: 15%"
            icon={Activity}
            color="#ef4444"
          />
          <Card
            title="Completed outcomes"
            value={totalOutcomes}
            sub="Discharged + deceased patients"
            icon={ClipboardCheck}
          />
          <Card
            title="Currently admitted"
            value={occupancy}
            sub={`Out of ${CAPACITY} beds`}
            icon={Users}
            color="#2563eb"
          />
        </div>

        {totalOutcomes > 0 && totalOutcomes < 10 && (
          <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold">Limited outcome data</p>
              <p className="text-sm mt-1">
                These percentages are calculated from only {totalOutcomes} completed
                {totalOutcomes === 1 ? ' patient outcome' : ' patient outcomes'}.
                The rates are mathematically correct, but this small sample is not
                enough to establish a reliable facility-wide performance trend.
              </p>
            </div>
          </div>
        )}

        {totalOutcomes >= 10 && mortalityRate > 15 && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 flex gap-2">
            <AlertTriangle className="shrink-0" />
            Mortality rate exceeds the expected 15% benchmark.
          </div>
        )}

        <div className="bg-white border rounded-2xl p-5">
          <h3 className="font-bold">Outcome benchmark comparison</h3>
          <p className="text-sm text-slate-500 mt-1">
            Reference targets: 85% survival and 15% mortality.
          </p>
          <div className="grid sm:grid-cols-2 gap-5 mt-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Survival</span>
                <b>{totalOutcomes ? survivalRate.toFixed(1) + '%' : 'No data'} <span className="text-slate-400 font-normal">/ 85% target</span></b>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalOutcomes ? Math.min(survivalRate, 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Mortality</span>
                <b>{totalOutcomes ? mortalityRate.toFixed(1) + '%' : 'No data'} <span className="text-slate-400 font-normal">/ 15% target</span></b>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalOutcomes ? Math.min(mortalityRate, 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white p-5 rounded-2xl border">
            <h3 className="font-bold mb-4">Patient outcomes</h3>
            <div className="h-64">
              {totalOutcomes ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Survived / discharged', value: discharged.length },
                        { name: 'Deceased', value: mortality }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {['#10b981', '#ef4444'].map(c => <Cell fill={c} key={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-400 pt-20">No completed outcomes available yet.</p>
              )}
            </div>
            <div className="flex justify-around text-sm text-slate-600">
              <span>Discharged: <b>{discharged.length}</b></span>
              <span>Deceased: <b>{mortality}</b></span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border">
            <h3 className="font-bold mb-4">Facility occupancy</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: 'Occupied', count: occupancy },
                  { name: 'Available', count: CAPACITY - occupancy }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    )
    return null
  }

  return (
    <div className="min-h-screen flex">
      {mobile && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobile(false)} />}
      <aside className={`fixed lg:static z-50 inset-y-0 left-0 w-64 bg-[#101d35] text-white flex flex-col transition-transform ${mobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-blue-500 p-2 rounded-xl"><HeartPulse size={23} /></div>
          <div><b className="text-lg">QuarantineCare</b><p className="text-xs text-slate-400">Facility Management</p></div>
          <button className="ml-auto lg:hidden" onClick={() => setMobile(false)}><X /></button>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 px-6 mt-7 mb-3">Main menu</p>
        <nav className="px-3 space-y-1">
          {menu.map(([name, Icon]) => (
            <button key={name} onClick={() => { setPage(name); setMobile(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${page === name ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}>
              <Icon size={19} />{name}{page === name && <ChevronRight className="ml-auto" size={16} />}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t border-white/10">
          <div className="flex items-center gap-3"><div className="bg-blue-500/20 rounded-full p-2"><UserRound size={18} /></div><div><p className="text-sm font-semibold">{role}</p></div></div>
          <p className="text-xs text-slate-500 mt-4">QuarantineCare v1.0</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobile(true)}><Menu /></button>
            <div><p className="font-semibold text-sm">{page}</p><p className="text-xs text-slate-400">Facility operations / {page}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <select className="border rounded-xl px-3 py-2 text-sm bg-white" value={role} onChange={e => { setRole(e.target.value); setPage('Dashboard') }}>
                <option>Administrator</option><option>Nurse</option><option>Doctor</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 hidden md:block">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <button
              type="button"
              onClick={() => setPage('Discharges')}
              title={`${recommended.length} pending discharge recommendations`}
              className="relative bg-slate-100 hover:bg-slate-200 p-2 rounded-full"
            >
              <Bell size={18} />
              {recommended.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {recommended.length}
                </span>
              )}
            </button>
          </div>
        </header>
        <div className="p-5 lg:p-8 max-w-[1500px] mx-auto">{pageContent()}</div>
      </main>

      {toast && <div className="fixed bottom-5 right-5 z-[80] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm">{toast}</div>}

      {modal && (
        <div className="fixed inset-0 bg-slate-950/50 z-[70] flex items-center justify-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) setModal('') }}>
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            <div className="flex justify-between p-5 border-b">
              <h3 className="font-bold text-lg">{modal === 'add' ? 'Register new patient' : modal === 'temp' ? 'Record temperature' : modal === 'visit' ? 'Record doctor visit' : 'Patient details'}</h3>
              <button onClick={() => setModal('')}><X /></button>
            </div>
            <div className="p-5 space-y-4">
              {modal === 'add' && (
                <>
                  <Field label="Patient full name"><input className={inputClass} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter patient name" /></Field>
                  <Field label="Age"><input type="number" min="1" max="120" className={inputClass} value={form.age || ''} onChange={e => setForm({ ...form, age: e.target.value })} /></Field>
                  <Field label="Gender"><select className={inputClass} value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
                  <Button onClick={addPatient}>Register patient</Button>
                </>
              )}

              {modal === 'details' && selectedPatient && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 p-3 rounded-xl"><p className="text-slate-400">Patient ID</p><b>{selectedPatient.id}</b></div>
                    <div className="bg-slate-50 p-3 rounded-xl"><p className="text-slate-400">Room</p><b>{selectedPatient.room}</b></div>
                  </div>
                  <p><b>{selectedPatient.name}</b> · {selectedPatient.age} years · {selectedPatient.gender}</p>
                  <p className="text-sm text-slate-500">Admitted: {selectedPatient.admission}</p>
                  <h4 className="font-semibold">Temperature history</h4>
                  {[...(selectedPatient.readings || [])].sort((a,b)=>a.date.localeCompare(b.date)).map((r,i)=>(
                    <div key={`${r.date}-${i}`} className="flex justify-between text-sm border-b py-2">
                      <span>{r.date}</span><b>{r.temperature}°C</b>
                    </div>
                  ))}
                  {selectedPatient.readings?.length === 0 && <p className="text-sm text-slate-400">No temperature readings recorded.</p>}
                  <h4 className="font-semibold">Doctor notes</h4>
                  <p className="text-sm text-slate-600">{selectedPatient.notes || 'No notes yet.'}</p>
                  <div className="flex flex-wrap gap-2">
                    {role === 'Nurse' && !hasReadingToday(selectedPatient) && (
                      <Button onClick={() => { setModal('temp'); setForm({}) }}><Thermometer size={16} /> Record temperature</Button>
                    )}
                    {role === 'Nurse' && hasReadingToday(selectedPatient) && <span className="text-sm text-green-700">Today's temperature has been recorded.</span>}
                    {role === 'Doctor' && !hasVisitToday(selectedPatient) && (
                      <Button disabled={!hasReadingToday(selectedPatient)} onClick={() => { setModal('visit'); setForm({ notes: '' }) }}>Record visit</Button>
                    )}
                    {role === 'Doctor' && hasVisitToday(selectedPatient) && <span className="text-sm text-green-700">Today's doctor visit is complete.</span>}
                    {role === 'Doctor' && (
                      <Button secondary disabled={!feverFree(selectedPatient) || !hasVisitToday(selectedPatient) || selectedPatient.dischargeRecommended} onClick={() => recommendDischarge(selectedPatient.id)}>
                        {selectedPatient.dischargeRecommended ? 'Discharge recommended' : 'Recommend discharge'}
                      </Button>
                    )}
                    {role === 'Administrator' && selectedPatient.dischargeRecommended && (
                      <Button onClick={() => discharge(selectedPatient.id)}>Confirm discharge</Button>
                    )}
                    {role === 'Administrator' && (
                      <Button secondary onClick={() => markDeceased(selectedPatient.id)}>Record deceased</Button>
                    )}
                    {role === 'Doctor' && <p className="w-full text-xs text-slate-500">Discharge requires three full consecutive fever-free days, today's temperature measurement, and today's completed doctor visit.</p>}
                  </div>
                </>
              )}

              {modal === 'temp' && (
                <>
                  <p className="text-sm text-slate-500">Patient: {patients.find(p => p.id === selected)?.name}</p>
                  <Field label="Temperature (°C)">
                    <input type="number" step="0.1" className={inputClass} value={form.temperature ?? ''} onChange={e => setForm({ ...form, temperature: e.target.value })} placeholder="e.g. 37.2" />
                  </Field>
                  <p className="text-xs text-slate-400">Only one routine reading per patient per calendar day is allowed.</p>
                  <Button onClick={recordTemp}>Save temperature</Button>
                </>
              )}

              {modal === 'visit' && (
                <>
                  <p className="text-sm text-slate-500">Patient: {patients.find(p => p.id === selected)?.name}</p>
                  <Field label="Treatment notes">
                    <textarea className={inputClass} rows="4" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Enter observations and treatment notes..." />
                  </Field>
                  <Button onClick={recordVisit}>Complete doctor visit</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}