import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Users, User, LogOut, Plus, Search, Filter, 
  Clock, CheckCircle, AlertTriangle, FileText, Calendar, 
  MapPin, Phone, MessageSquare, Printer, Settings, Check, 
  Send, ArrowDownUp, X, Edit, Trash2, Eye, Shield, 
  ChevronRight, Lock, Activity, UserX, CalendarPlus, Zap, FileOutput, Database, Download, Upload, AlertOctagon, Scissors, List, Bell, Paperclip, ExternalLink
} from 'lucide-react';

// --- FIREBASE INTEGRATION ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, writeBatch, getDocs } from "firebase/firestore";
// Storage dependencies removed to optimize for external R2/B2 attachments

const fallbackConfig = {
  apiKey: "AIzaSyBG-E6BiZURXhJWYkEPz1VdhyWh7d_5Lqo",
  authDomain: "mla-office-tanur.firebaseapp.com",
  projectId: "mla-office-tanur",
  storageBucket: "mla-office-tanur.firebasestorage.app",
  messagingSenderId: "281012204033",
  appId: "1:281012204033:web:c50d355795431123728600"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : fallbackConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mla-office-tanur';

// Safe references using the mandatory path structure
function getColRef(colName) { return collection(db, 'artifacts', appId, 'public', 'data', colName); }
function getDocRef(colName, docId) { return doc(db, 'artifacts', appId, 'public', 'data', colName, docId); }

// --- UTILS & INITIAL DATA ---
const generateId = (tasksList = []) => {
  const tanIds = tasksList
    .map(t => t.id)
    .filter(id => /^TAN44\d+$/.test(id))
    .map(id => parseInt(id.replace('TAN44', ''), 10));

  if (tanIds.length === 0) return 'TAN44001';
  const maxId = Math.max(...tanIds);
  const nextId = maxId + 1;
  const paddedNum = String(nextId).padStart(3, '0');
  return `TAN44${paddedNum}`;
};

const generateUid = () => Math.random().toString(36).substring(2, 9);
const getNow = () => new Date().toISOString();
const getNextDayISO = () => new Date(Date.now() + 86400000).toISOString();

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatWhatsAppNumber = (phone) => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
};

const DEFAULT_CATEGORIES = ['Invitation', 'Road Complaint', 'Help Request', 'Personal Complaint', 'Confidential Info'];
const DEFAULT_DESIGNATIONS = ['Citizen', 'Panchayath President', 'Panchayath Secretary', 'Ward Member', 'Asha Worker', 'Political Leader', 'Others'];
const INPUT_TYPES = ['Letter', 'Phone Call', 'Direct Visit', 'WhatsApp Message', 'Email', 'Others'];
const LOCAL_BODIES = ['Tanur Municipality', 'Tanalur Panchayath', 'Ozhur Panchayath', 'Cheriyamundam Panchayath', 'Ponmundam Panchayath', 'Niramaruthur Panchayath', 'Other'];

const DEFAULT_USERS = [
  { id: 'admin', name: 'PK Navas (MLA)', role: 'admin', pass: 'Navas@2026', enabled: true, canInput: true, canSeeReports: true, phone: '', whatsapp: '' },
  { id: 'off1', name: 'Officer 1', role: 'officer', pass: 'Input@2026', enabled: true, canInput: true, canSeeReports: false, phone: '', whatsapp: '' },
  { id: 'off2', name: 'Officer 2', role: 'officer', pass: 'Off2@2026', enabled: true, canInput: false, canSeeReports: false, phone: '', whatsapp: '' },
  { id: 'off3', name: 'Officer 3', role: 'officer', pass: 'Off3@2026', enabled: true, canInput: false, canSeeReports: false, phone: '', whatsapp: '' },
  { id: 'off4', name: 'Officer 4', role: 'officer', pass: 'Off4@2026', enabled: true, canInput: false, canSeeReports: false, phone: '', whatsapp: '' },
  { id: 'off5', name: 'Officer 5', role: 'officer', pass: 'Off5@2026', enabled: true, canInput: false, canSeeReports: false, phone: '', whatsapp: '' },
];

const ISLAMIC_QUOTES = [
  { arabic: "إِنَّ ٱللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا۟ ٱلْأَمَـٰنَـٰتِ إِلَىٰٓ أَهْلِهَا وَإِذَا حَکَمْتُم بَيْنَ ٱلنَّاسِ أَن تَحْکُمُوا۟ بِٱلْعَدْلِ", malayalam: "തീർച്ചയായും അമാനത്തുകൾ (ബാധ്യതകൾ) അതിൻ്റെ അവകാശികൾക്ക് കൊടുത്തു വീട്ടണമെന്നും, ജനങ്ങൾക്കിടയിൽ തീർപ്പുകൽപ്പിക്കുകയാണെങ്കിൽ നീതിയോടെ വേണം തീർപ്പുകൽപ്പിക്കാനെന്നും അല്ലാഹു നിങ്ങളോട് കൽപ്പിക്കുന്നു. (ഖുർആൻ 4:58)" },
  { arabic: "ٱعْدِلُوا۟ هُوَ أَقْرَبُ lِلتَّقْوَىٰ", malayalam: "നിങ്ങൾ നീതി പാലിക്കുക; അതാണ് ഭക്തിയോട് ഏറ്റവും അടുത്തത്. (ഖുർആൻ 5:8)" },
  { arabic: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ", malayalam: "ജനങ്ങളിൽ ഏറ്റവും ഉത്തമൻ ജനങ്ങൾക്ക് ഏറ്റവും ഉപകാരം ചെയ്യുന്നവനാണ്. (ഹദീസ്)" }
];

// --- CORE FILTER HOOK (Memory & Cache Optimized) ---
const useFilteredTasks = (allTasks, globalFilters, searchStr, catFilter) => {
  return useMemo(() => {
    let result = allTasks;

    // 1. Status Filter
    if (globalFilters.status === 'Active') {
      result = result.filter(t => t.status !== 'Completed' && t.status !== 'Unsolved');
    } else if (globalFilters.status !== 'All') {
      result = result.filter(t => t.status === globalFilters.status);
    }

    // 2. Date Filter
    if (globalFilters.dateRange !== 'all') {
      const cutoff = new Date();
      if (globalFilters.dateRange === '7days') cutoff.setDate(cutoff.getDate() - 7);
      else if (globalFilters.dateRange === '1month') cutoff.setMonth(cutoff.getMonth() - 1);
      else if (globalFilters.dateRange === '6months') cutoff.setMonth(cutoff.getMonth() - 6);
      else if (globalFilters.dateRange === '1year') cutoff.setFullYear(cutoff.getFullYear() - 1);
      
      result = result.filter(t => new Date(t.createdAt) >= cutoff);
    }

    // 3. Category Filter
    if (catFilter && catFilter !== 'All') {
      if (catFilter === 'Direct Assignment') result = result.filter(t => t.taskType === 'direct');
      else result = result.filter(t => t.category === catFilter);
    }

    // 4. Search Filter
    if (searchStr) {
      const s = searchStr.toLowerCase();
      result = result.filter(t =>
        t.id.toLowerCase().includes(s) ||
        (t.personalDetails?.name || '').toLowerCase().includes(s) ||
        (t.subject || '').toLowerCase().includes(s) ||
        (t.personalDetails?.mobileNumber || '').includes(s)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allTasks, globalFilters, searchStr, catFilter]);
};

// --- COMPONENTS ---

// Custom Searchable Dropdown Component for Categories
const SearchableCategorySelect = React.memo(({ categories, selected, onChange, onAddNewClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const sortedAndFiltered = useMemo(() => {
    return categories.filter(c => c.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.localeCompare(b));
  }, [categories, search]);

  useEffect(() => {
    function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div onClick={() => setIsOpen(!isOpen)} className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white cursor-pointer flex justify-between items-center shadow-sm hover:border-slate-400 transition-all text-sm">
        <span className={selected ? "text-slate-800" : "text-slate-400"}>{selected || "Select or Search Category..."}</span>
        <Filter size={16} className="text-slate-400" />
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-500 bg-white" onClick={e => e.stopPropagation()} />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {sortedAndFiltered.map(c => (
              <div key={c} onClick={() => { onChange(c); setIsOpen(false); setSearch(''); }} className={`px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex justify-between items-center ${selected === c ? 'bg-blue-50 text-blue-700' : ''}`}>
                <span>{c}</span>{selected === c && <Check size={14} className="text-blue-600" />}
              </div>
            ))}
            {sortedAndFiltered.length === 0 && <div className="px-4 py-3 text-sm text-slate-400 font-medium text-center">No categories found</div>}
          </div>
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-center">
            <button type="button" onClick={(e) => { e.stopPropagation(); onAddNewClick(); setIsOpen(false); }} className="w-full text-xs font-bold text-blue-600 flex items-center justify-center gap-1 hover:text-blue-800 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Plus size={14}/> Add Custom Category
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

function TimelineIcon({ type }) {
  switch(type) {
    case 'created': return <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Plus size={12}/></div>;
    case 'received': return <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Check size={12}/></div>;
    case 'update': return <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Activity size={12}/></div>;
    case 'completed': return <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><CheckCircle size={12}/></div>;
    case 'reverted': return <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><ArrowDownUp size={12}/></div>;
    case 'transfer': return <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0"><Users size={12}/></div>;
    case 'deadline': return <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"><Clock size={12}/></div>;
    default: return <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><FileText size={12}/></div>;
  }
}

const AwarenessGraph = React.memo(({ total, completed }) => {
  const pending = total - completed;
  const compPercent = total === 0 ? 0 : (completed / total) * 100;
  const pendPercent = total === 0 ? 0 : (pending / total) * 100;
  return (
    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">My Progress Overview</span>
        <div className="flex gap-4">
          <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle size={12}/> Completed: {completed}</span>
          <span className="text-xs font-bold text-red-600 flex items-center gap-1"><Clock size={12}/> Pending: {pending}</span>
        </div>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${compPercent}%` }}></div>
        <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${pendPercent}%` }}></div>
      </div>
    </div>
  );
});

function LiveClock({ className }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(timer); }, []);
  return (
    <span className={`flex items-center gap-1.5 ${className || ''}`}>
      <Calendar size={14} className="hidden sm:block opacity-70" />
      <span>{time.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
      <Clock size={14} className="hidden sm:block ml-1 opacity-70" />
      <span className="tracking-widest font-mono text-sm">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
    </span>
  );
}

function PDFCaptureWrapper({ id, children }) {
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/95 overflow-auto print-hidden">
      <div className="flex flex-col items-center justify-start min-h-screen py-10 min-w-[900px]">
        <div className="mb-6 text-center">
          <Download size={48} className="text-indigo-400 animate-bounce mx-auto mb-2" />
          <h2 className="text-white text-xl font-bold tracking-widest uppercase">Generating Document</h2>
          <p className="text-slate-300 text-sm font-medium">Exporting with precise page margins...</p>
        </div>
        <div className="shadow-2xl rounded-sm overflow-hidden bg-white mx-auto flex justify-center">
          <div id={id} className="bg-white text-black text-left" style={{ width: '700px', padding: '40px 50px', boxSizing: 'border-box', margin: '0 auto' }}>
            <div className="font-sans">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Print Sub-Components (Acknowledge, Details, Master, Officer, Citizen) remain untouched in logic structure.
function PrintAcknowledgeSlip({ task }) {
  return (
    <div className="w-full bg-white text-black font-sans">
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-1 text-black">PK Navas MLA Office</h1>
        <h2 className="text-lg font-semibold text-gray-700 uppercase tracking-widest">Acknowledgement Slip</h2>
      </div>
      <div className="mb-6 flex justify-between items-start">
        <div className="w-1/2 pr-4"><p className="text-sm font-bold text-gray-500 uppercase mb-1">Reference ID</p><p className="text-2xl font-bold text-black tracking-widest">{task.id}</p></div>
        <div className="w-1/2 pl-4 text-right"><p className="text-sm font-bold text-gray-500 uppercase mb-1">Date & Time</p><p className="text-base font-bold text-black">{formatDate(task.createdAt)}</p><p className="text-sm text-gray-700">{formatTime(task.createdAt)}</p></div>
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-bold text-black uppercase border-b border-gray-400 pb-1 mb-2">Citizen Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="font-bold text-gray-700">Name:</span> {task.personalDetails.name}</div>
          <div><span className="font-bold text-gray-700">Mobile:</span> {task.personalDetails.mobileNumber}</div>
          {task.personalDetails.place && <div className="col-span-2 mt-1"><span className="font-bold text-gray-700">Address:</span> {[task.personalDetails.houseName, task.personalDetails.place, task.personalDetails.localBody].filter(Boolean).join(', ')}</div>}
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-bold text-black uppercase border-b border-gray-400 pb-1 mb-2">Input Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3"><div><span className="font-bold text-gray-700">Category:</span> {task.category}</div><div><span className="font-bold text-gray-700">Type:</span> {task.types.join(', ')}</div></div>
        <div className="mb-4"><span className="font-bold text-gray-700 block mb-1">Subject:</span><p className="font-bold text-black text-base">{task.subject}</p></div>
        {task.description && (<div className="mt-3"><span className="font-bold text-gray-700 block mb-1">Detailed Description:</span><div className="text-sm text-gray-800 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed font-medium">{task.description}</div></div>)}
      </div>
      <div className="text-center text-sm text-gray-600 mt-10 pt-4 border-t border-gray-300"><p>Please keep this reference ID for future tracking.</p><p className="font-bold mt-1 text-black">Thank you for contacting the MLA Office.</p></div>
    </div>
  );
}

function PrintTaskDetailsReport({ task, users }) {
  return (
    <div className="w-full bg-white text-black font-sans">
      <div className="text-center border-b-2 border-black pb-4 mb-6"><h1 className="text-2xl font-bold uppercase tracking-widest mb-1 text-black">PK Navas MLA Office</h1><h2 className="text-lg font-semibold text-gray-700 uppercase tracking-widest">Detailed Task Report</h2></div>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300"><div className="w-1/2"><p className="text-xs font-bold text-gray-500 uppercase">Task ID</p><p className="text-xl font-bold text-black">{task.id}</p></div><div className="w-1/2 text-right"><p className="text-xs font-bold text-gray-500 uppercase">Current Status</p><p className="text-lg font-bold uppercase text-black">{task.status}</p></div></div>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase text-black border-b border-gray-400 pb-1 mb-2">Citizen Info</h3>
          <p className="mb-1 text-sm"><strong>Name:</strong> {task.personalDetails.name} {task.personalDetails.gender && `(${task.personalDetails.gender})`}</p>
          <p className="mb-1 text-sm"><strong>Mobile:</strong> {task.personalDetails.mobileNumber}</p>
          {task.personalDetails.whatsappNumber && <p className="mb-1 text-sm"><strong>WhatsApp:</strong> {task.personalDetails.whatsappNumber}</p>}
          <p className="mb-1 text-sm"><strong>Address:</strong> {[task.personalDetails.houseName, task.personalDetails.place, task.personalDetails.postOffice, task.personalDetails.localBody].filter(Boolean).join(', ')}</p>
        </div>
        <div>
           <h3 className="text-sm font-bold uppercase text-black border-b border-gray-400 pb-1 mb-2">Task Meta</h3>
           <p className="mb-1 text-sm"><strong>Category:</strong> {task.category}</p>
           <p className="mb-1 text-sm"><strong>Type:</strong> {task.types.join(', ')}</p>
           <p className="mb-1 text-sm"><strong>Created:</strong> {formatDate(task.createdAt)} {formatTime(task.createdAt)}</p>
           <p className="mb-1 text-sm"><strong>Assigned To:</strong> {task.assignedTo.map(id => users.find(u=>u.id===id)?.name || id).join(', ')}</p>
        </div>
      </div>
      <div className="mb-6 break-inside-avoid">
        <h3 className="text-sm font-bold uppercase text-black border-b border-gray-400 pb-1 mb-2">Subject & Details</h3>
        <p className="font-bold text-base mb-2 text-black">{task.subject}</p>
        {task.description && <p className="text-sm text-gray-800 whitespace-pre-wrap">{task.description}</p>}
        {task.attachment && <p className="text-sm text-gray-700 font-bold mt-2 italic">Note: Document attached in system ({task.attachment.name})</p>}
        {task.attachments && task.attachments.length > 0 && <p className="text-sm text-gray-700 font-bold mt-2 italic">Note: {task.attachments.length} Document(s) attached in system.</p>}
      </div>
      <div className="break-inside-avoid">
        <h3 className="text-sm font-bold uppercase text-black border-b border-gray-400 pb-1 mb-2">Timeline & Updates</h3>
        <div className="space-y-2 mt-3">
          {task.timeline.map((item, idx) => (
            <div key={idx} className="text-sm flex gap-4 pb-2">
              <div className="w-32 shrink-0 text-xs font-bold text-gray-600">{formatDate(item.time)}<br/>{formatTime(item.time)}</div>
              <div className="text-gray-800"><span className="font-bold text-black">{item.by}:</span> {item.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrintMasterReport({ config, tasks, users, categories }) {
  let filteredTasks = tasks.filter(t => t.taskType !== 'direct');
  const now = new Date();
  if (config.range === '1week') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredTasks = filteredTasks.filter(t => new Date(t.createdAt) >= start);
  } else if (config.range === '1month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    filteredTasks = filteredTasks.filter(t => new Date(t.createdAt) >= start);
  } else if (config.range === '6months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    filteredTasks = filteredTasks.filter(t => new Date(t.createdAt) >= start);
  } else if (config.range === 'custom' && config.customStart && config.customEnd) {
    const start = new Date(config.customStart);
    const end = new Date(config.customEnd);
    end.setHours(23, 59, 59, 999);
    filteredTasks = filteredTasks.filter(t => new Date(t.createdAt) >= start && new Date(t.createdAt) <= end);
  }

  const total = filteredTasks.length;
  const comp = filteredTasks.filter(t => t.status === 'Completed').length;
  const pend = filteredTasks.filter(t => t.status === 'Pending').length;
  const inprog = filteredTasks.filter(t => t.status === 'In Progress').length;
  const unsolv = filteredTasks.filter(t => t.status === 'Unsolved').length;

  const sortedCategories = [...categories].sort((a,b)=>a.localeCompare(b));

  return (
    <div className="w-full bg-white text-black font-sans">
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-1 text-black">PK Navas MLA Office</h1>
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">Master Performance Report</h2>
        <p className="mt-2 text-sm text-gray-600 font-bold">Period: {config.range === 'all' ? 'All Time' : config.range === '1week' ? 'Last 7 Days' : config.range === '1month' ? 'Last 30 Days' : config.range === '6months' ? 'Last 6 Months' : `${formatDate(config.customStart)} to ${formatDate(config.customEnd)}`}</p>
      </div>
      <div className="grid grid-cols-5 gap-2 mb-8 text-center border-b border-gray-300 pb-6">
        <div><p className="text-xs font-bold uppercase text-gray-600 mb-1">Total</p><p className="text-2xl font-bold text-black">{total}</p></div>
        <div><p className="text-xs font-bold uppercase text-gray-600 mb-1">Completed</p><p className="text-2xl font-bold text-black">{comp}</p></div>
        <div><p className="text-xs font-bold uppercase text-gray-600 mb-1">In Progress</p><p className="text-2xl font-bold text-black">{inprog}</p></div>
        <div><p className="text-xs font-bold uppercase text-gray-600 mb-1">Pending</p><p className="text-2xl font-bold text-black">{pend}</p></div>
        <div><p className="text-xs font-bold uppercase text-gray-600 mb-1">Unsolved</p><p className="text-2xl font-bold text-black">{unsolv}</p></div>
      </div>
      <h3 className="text-sm font-bold uppercase text-black border-b border-gray-400 pb-1 mb-3">Category Breakdown</h3>
      <table className="w-full text-sm border-collapse mb-8">
        <thead><tr className="border-b-2 border-black"><th className="py-2 text-left font-bold text-black">Category</th><th className="py-2 text-center font-bold text-black">Total</th><th className="py-2 text-center font-bold text-black">Completed</th><th className="py-2 text-center font-bold text-black">Pending</th></tr></thead>
        <tbody>
          {sortedCategories.map(cat => {
            const catTasks = filteredTasks.filter(t => t.category === cat);
            if(catTasks.length === 0) return null;
            return (
              <tr key={cat} className="break-inside-avoid border-b border-gray-300">
                <td className="py-2 text-black">{cat}</td><td className="py-2 text-center text-black">{catTasks.length}</td><td className="py-2 text-center text-black">{catTasks.filter(t=>t.status==='Completed').length}</td><td className="py-2 text-center text-black">{catTasks.filter(t=>t.status==='Pending').length}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <h3 className="text-sm font-bold uppercase text-black border-b border-gray-400 pb-1 mb-3 break-inside-avoid">Officer Workload</h3>
      <table className="w-full text-sm border-collapse break-inside-avoid">
        <thead><tr className="border-b-2 border-black"><th className="py-2 text-left font-bold text-black">Officer Name</th><th className="py-2 text-center font-bold text-black">Assigned</th><th className="py-2 text-center font-bold text-black">Completed By Them</th></tr></thead>
        <tbody>
          {users.filter(u=>u.role !== 'admin').map(u => {
            const assigned = filteredTasks.filter(t => t.assignedTo.includes(u.id));
            const done = assigned.filter(t => t.officerStatuses && t.officerStatuses[u.id] === 'Completed');
            return (
              <tr key={u.id} className="border-b border-gray-300"><td className="py-2 text-black">{u.name}</td><td className="py-2 text-center text-black">{assigned.length}</td><td className="py-2 text-center text-black">{done.length}</td></tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
}

function PrintOfficerReport({ config, tasks }) {
  const officer = config.officer;
  let filteredTasks = tasks.filter(t => t.assignedTo.includes(officer.id));
  const now = new Date();
  if (config.range === '1week') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredTasks = filteredTasks.filter(t => new Date(t.createdAt) >= start);
  } else if (config.range === '1month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    filteredTasks = filteredTasks.filter(t => new Date(t.createdAt) >= start);
  } else if (config.range === '6months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    filteredTasks = filteredTasks.filter(t => new Date(t.createdAt) >= start);
  } else if (config.range === 'custom' && config.customStart && config.customEnd) {
    const start = new Date(config.customStart);
    const end = new Date(config.customEnd);
    end.setHours(23, 59, 59, 999);
    filteredTasks = filteredTasks.filter(t => new Date(t.createdAt) >= start && new Date(t.createdAt) <= end);
  }

  const total = filteredTasks.length;
  const comp = filteredTasks.filter(t => t.officerStatuses[officer.id] === 'Completed').length;
  const inprog = filteredTasks.filter(t => t.officerStatuses[officer.id] === 'In Progress' || t.officerStatuses[officer.id] === 'Received').length;
  const pend = total - comp - inprog;

  return (
    <div className="w-full bg-white text-black font-sans">
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-1 text-black">PK Navas MLA Office</h1>
        <h2 className="text-lg font-semibold text-gray-700 uppercase tracking-widest">Officer Performance Report</h2>
        <h3 className="text-xl font-bold mt-1 text-black">{officer.name}</h3>
        <p className="mt-1 text-sm text-gray-600 font-bold">Period: {config.range === 'all' ? 'All Time' : config.range === '1week' ? 'Last 7 Days' : config.range === '1month' ? 'Last 30 Days' : config.range === '6months' ? 'Last 6 Months' : `${formatDate(config.customStart)} to ${formatDate(config.customEnd)}`}</p>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-8 text-center border-b border-gray-300 pb-6">
        <div><p className="text-xs font-bold uppercase text-gray-600 mb-1">Assigned</p><p className="text-2xl font-bold text-black">{total}</p></div>
        <div><p className="text-xs font-bold uppercase text-gray-600 mb-1">Completed</p><p className="text-2xl font-bold text-black">{comp}</p></div>
        <div><p className="text-xs font-bold uppercase text-gray-600 mb-1">In Progress</p><p className="text-2xl font-bold text-black">{inprog}</p></div>
        <div><p className="text-xs font-bold uppercase text-gray-600 mb-1">Pending</p><p className="text-2xl font-bold text-black">{pend}</p></div>
      </div>
      <h3 className="text-sm font-bold uppercase text-black border-b border-gray-400 pb-1 mb-3">Detailed Task List</h3>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="border-b-2 border-black"><th className="py-2 text-left font-bold text-black">Ref ID & Date</th><th className="py-2 text-left font-bold text-black">Subject & Citizen</th><th className="py-2 text-center font-bold text-black">Category</th><th className="py-2 text-center font-bold text-black">Status</th></tr></thead>
        <tbody>
          {filteredTasks.map(t => (
            <tr key={t.id} className="break-inside-avoid border-b border-gray-300">
              <td className="py-2 align-top"><span className="text-black font-bold block">{t.id}</span><span className="text-gray-600 text-xs block mt-1">{formatDate(t.createdAt)}</span></td>
              <td className="py-2 align-top"><span className="text-black font-bold block mb-1">{t.subject}</span><span className="text-gray-700">{t.personalDetails?.name}</span></td>
              <td className="py-2 text-center align-top text-black">{t.category}</td>
              <td className="py-2 text-center align-top text-black">{t.officerStatuses[officer.id] || 'Pending'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PrintCitizenDirectory({ citizens }) {
  return (
    <div className="w-full bg-white text-black font-sans">
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-1 text-black">PK Navas MLA Office</h1>
        <h2 className="text-lg font-bold text-gray-700 uppercase tracking-widest">Citizen Directory & Visit Log</h2>
        <p className="mt-1 text-xs text-gray-600 font-bold">Generated: {new Date().toLocaleString('en-IN')}</p>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="border-b-2 border-black text-black"><th className="py-2 text-left font-bold">Name & Designation</th><th className="py-2 text-left font-bold">Contact</th><th className="py-2 text-left font-bold">Location</th><th className="py-2 text-center font-bold">Visits</th></tr></thead>
        <tbody>
          {citizens.map((c,i) => (
            <tr key={i} className="break-inside-avoid border-b border-gray-300">
              <td className="py-2 align-top"><span className="block font-bold text-black">{c.name} {c.gender && `(${c.gender})`}</span>{c.designation && <span className="text-xs text-gray-600 uppercase block mt-1">{c.designation}</span>}</td>
              <td className="py-2 align-top"><span className="block text-black">{c.mobileNumber}</span>{c.whatsappNumber && <span className="text-gray-600 text-xs block mt-1">WA: {c.whatsappNumber}</span>}</td>
              <td className="py-2 align-top text-black"><span className="block mb-1">{c.place || '-'}, PO: {c.postOffice || '-'}, PIN: {c.pinCode || '-'}, {c.localBody || c.panchayat || '-'}</span><span className="text-xs text-gray-600">{c.houseName}</span></td>
              <td className="py-2 text-center align-top font-bold text-black">{c.visits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Task Details Modal (For viewing anywhere)
function TaskDetailsModal({ task, onClose, updateTask, deleteTask, users, categories, triggerDetailsPrint, triggerDownloadPDF, currentUser, triggerConfirm }) {
  if (!task) return null;
  const [newUpdate, setNewUpdate] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(task);
  const [editingTimelineId, setEditingTimelineId] = useState(null);
  const [timelineEditText, setTimelineEditText] = useState('');

  useEffect(() => { setEditData(task); }, [task]);
  
  const handleAddUpdate = () => {
    if(!newUpdate.trim()) return;
    const ev = { id: generateUid(), type: 'update', time: getNow(), by: currentUser.name, text: newUpdate };
    updateTask(task.id, { timeline: [...task.timeline, ev] });
    setNewUpdate('');
  };

  const handleSaveEdit = async () => {
    let updatedTimeline = [...task.timeline];
    const oldAssigned = [...task.assignedTo].sort().join(',');
    const newAssigned = [...editData.assignedTo].sort().join(',');
    
    if (oldAssigned !== newAssigned) {
      const newNames = editData.assignedTo.map(id => users.find(u => u.id === id)?.name || id).join(', ');
      updatedTimeline.push({ id: generateUid(), type: 'transfer', time: getNow(), by: currentUser.name, text: `Task reassigned to: ${newNames || 'Nobody'}` });
    }
    await updateTask(task.id, { subject: editData.subject, description: editData.description, status: editData.status, priority: editData.priority, category: editData.category, assignedTo: editData.assignedTo, timeline: updatedTimeline });
    setIsEditMode(false);
  };

  const handleDeleteTimelineItem = (itemId) => {
    triggerConfirm("Confirm Note Deletion", "Are you sure you want to delete this timeline entry?", async () => { await updateTask(task.id, { timeline: task.timeline.filter(t => t.id !== itemId) }); }, true, "Delete Entry");
  };

  const saveTimelineEdit = async (item) => {
    const updatedTimeline = task.timeline.map(t => t.id === item.id ? { ...t, text: timelineEditText } : t);
    await updateTask(task.id, { timeline: updatedTimeline });
    setEditingTimelineId(null);
  };

  const isAssigned = task.assignedTo.includes(currentUser.id);
  const isAdmin = currentUser.role === 'admin';
  const sortedCategories = useMemo(() => { return [...categories].sort((a,b)=> a.localeCompare(b)); }, [categories]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto animate-in slide-in-from-right flex flex-col shadow-2xl">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center sticky top-0 z-10">
          <div><h2 className="text-xl font-black flex items-center gap-2"><FileText size={20}/> Task Details</h2><p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-1">Ref: {task.id}</p></div>
          <div className="flex items-center gap-3">
             {isAdmin && (
               isEditMode ? (
                 <><button onClick={handleSaveEdit} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"><Check size={14}/> Save</button><button onClick={() => { setIsEditMode(false); setEditData(task); }} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"><X size={14}/> Cancel</button></>
               ) : (
                 <button onClick={() => setIsEditMode(true)} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"><Edit size={14}/> Edit Task</button>
               )
             )}
             {!isEditMode && (
               <><button onClick={() => triggerDetailsPrint(task)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white" title="Print Details"><Printer size={18}/></button><button onClick={() => triggerDownloadPDF(task)} className="p-2 bg-indigo-900 hover:bg-indigo-800 rounded-lg transition-colors text-indigo-200 hover:text-white" title="Download PDF"><Download size={18}/></button></>
             )}
             <button onClick={onClose} className="p-2 bg-red-500/20 hover:bg-red-500 rounded-lg transition-colors text-red-200 hover:text-white ml-2"><X size={20}/></button>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1">
          <div className="flex flex-wrap gap-4 justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
             <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Status</p>
                {isEditMode ? (
                  <select value={editData.status} onChange={e=>setEditData({...editData, status: e.target.value})} className="border border-slate-300 rounded p-1 text-sm font-bold bg-white outline-none">
                    <option value="Pending">Pending</option><option value="Received">Received</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Unsolved">Unsolved</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1 rounded font-black text-sm uppercase tracking-wider ${task.status==='Completed'?'bg-green-100 text-green-700':task.status==='In Progress'?'bg-amber-100 text-amber-700':task.status==='Unsolved'?'bg-slate-200 text-slate-500':'bg-red-100 text-red-700'}`}>{task.status}</span>
                )}
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Created On</p><p className="font-bold text-slate-800">{formatDate(task.createdAt)}</p><p className="text-xs font-semibold text-slate-500">{formatTime(task.createdAt)}</p>
             </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div>
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2"><User size={16} className="text-blue-600"/> Citizen Profile</h3>
               <div className="space-y-3 text-sm">
                 <p><span className="font-bold text-slate-500">Name:</span> <span className="font-bold text-slate-800">{task.personalDetails.name}</span> {task.personalDetails.gender && `(${task.personalDetails.gender})`}</p>
                 {task.personalDetails.designation && <p><span className="font-bold text-slate-500">Desig:</span> {task.personalDetails.designation}</p>}
                 {task.personalDetails.referralPerson && <p><span className="font-bold text-slate-500">Ref:</span> {task.personalDetails.referralPerson}</p>}
                 <p className="flex items-center gap-2"><span className="font-bold text-slate-500">Mobile:</span> <a href={`tel:${task.personalDetails.mobileNumber}`} className="font-bold text-blue-600 hover:underline">{task.personalDetails.mobileNumber}</a></p>
                 {task.personalDetails.whatsappNumber && <p className="flex items-center gap-2"><span className="font-bold text-slate-500">WA:</span> <a href={`https://wa.me/${formatWhatsAppNumber(task.personalDetails.whatsappNumber)}`} target="_blank" rel="noreferrer" className="font-bold text-green-600 hover:underline">{task.personalDetails.whatsappNumber}</a></p>}
                 <p className="pt-2"><span className="font-bold text-slate-500 block mb-1">Address:</span> <span className="font-medium text-slate-700">{[task.personalDetails.houseName, task.personalDetails.place, task.personalDetails.postOffice, task.personalDetails.pinCode, task.personalDetails.localBody, task.personalDetails.wardNumber ? `Ward ${task.personalDetails.wardNumber}` : ''].filter(Boolean).join(', ')}</span></p>
               </div>
            </div>
            <div>
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2"><FileText size={16} className="text-indigo-600"/> Task Details</h3>
               <div className="space-y-3 text-sm">
                 <p className="flex items-center gap-2"><span className="font-bold text-slate-500">Category:</span> 
                   {isEditMode ? (
                     <select value={editData.category} onChange={e=>setEditData({...editData, category: e.target.value})} className="border border-slate-300 rounded p-1 text-xs font-bold bg-white outline-none w-full max-w-[200px]">
                        {sortedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        {task.taskType === 'direct' && <option value="Direct Assignment">Direct Assignment</option>}
                     </select>
                   ) : (<span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">{task.category}</span>)}
                 </p>
                 <p><span className="font-bold text-slate-500">Source:</span> {task.types.join(', ')}</p>
                 <p className="flex items-center gap-2"><span className="font-bold text-slate-500">Priority:</span> 
                   {isEditMode ? (
                     <select value={editData.priority} onChange={e=>setEditData({...editData, priority: e.target.value})} className="border border-slate-300 rounded p-1 text-xs font-bold bg-white outline-none">
                        <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                     </select>
                   ) : (<span className={`font-bold ${task.priority==='High'?'text-red-600':task.priority==='Low'?'text-slate-600':'text-amber-600'}`}>{task.priority || 'Medium'}</span>)}
                 </p>
                 {task.programDate && <p><span className="font-bold text-slate-500">Event Date:</span> <span className="font-bold text-indigo-600">{formatDate(task.programDate)} {formatTime(task.programDate)}</span></p>}
                 <div className="pt-2">
                   <span className="font-bold text-slate-500 block mb-1">Assigned Officers:</span>
                   {isEditMode ? (
                     <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 p-2 rounded border border-slate-200">
                       {users.map(u => (
                         <label key={u.id} className="flex items-center gap-1 text-xs cursor-pointer font-bold text-slate-700">
                           <input type="checkbox" checked={editData.assignedTo.includes(u.id)} onChange={e => {
                             const newAssigned = e.target.checked ? [...editData.assignedTo, u.id] : editData.assignedTo.filter(id => id !== u.id);
                             setEditData({...editData, assignedTo: newAssigned});
                           }} className="rounded text-indigo-600 w-3 h-3" /> {u.name}
                         </label>
                       ))}
                     </div>
                   ) : (
                     <div className="flex flex-col gap-1">
                       {task.assignedTo.map(id => {
                         const name = users.find(u=>u.id===id)?.name || id;
                         const stat = task.officerStatuses[id] || 'Pending';
                         return <div key={id} className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded text-xs"><span className="font-bold">{name}</span><span className={`font-black uppercase tracking-wider ${stat==='Completed'?'text-green-600':stat==='In Progress'?'text-amber-600':'text-red-500'}`}>{stat}</span></div>
                       })}
                     </div>
                   )}
                 </div>
               </div>
            </div>
          </div>

          <div>
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
               <span>Subject & Description</span>
               <div className="flex gap-2 flex-wrap">
                 {task.attachment && (
                   <a href={task.attachment.url} target="_blank" rel="noreferrer" className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold hover:bg-indigo-200 transition-colors normal-case tracking-normal"><ExternalLink size={14}/> View Attached Link</a>
                 )}
                 {task.attachments?.map((att, idx) => (
                   <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold hover:bg-indigo-200 transition-colors normal-case tracking-normal"><ExternalLink size={14}/> Link {idx + 1}</a>
                 ))}
               </div>
             </h3>
             {isEditMode ? (<input type="text" value={editData.subject} onChange={e=>setEditData({...editData, subject: e.target.value})} className="w-full font-black text-lg text-slate-800 mb-2 border border-slate-300 rounded p-2 outline-none focus:border-indigo-500" />) : (<p className="font-black text-lg text-slate-800 mb-2">{task.subject}</p>)}
             {isEditMode ? (<textarea value={editData.description} onChange={e=>setEditData({...editData, description: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 whitespace-pre-wrap outline-none focus:border-indigo-500 h-32" />) : (task.description && <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 whitespace-pre-wrap">{task.description}</div>)}
          </div>

          <div>
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2"><Activity size={16} className="text-green-600"/> Progress Timeline</h3>
             <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {task.timeline.map((item) => (
                  <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10"><TimelineIcon type={item.type} /></div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md relative">
                      <div className="flex items-center justify-between space-x-2 mb-1"><div className="font-black text-slate-800 text-sm">{item.by}</div><div className="text-[10px] font-bold text-slate-400">{formatDate(item.time)} {formatTime(item.time)}</div></div>
                      {editingTimelineId === item.id ? (
                        <div className="mt-2 flex flex-col gap-2">
                           <textarea value={timelineEditText} onChange={e=>setTimelineEditText(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-indigo-500 h-20"/>
                           <div className="flex gap-2 justify-end"><button onClick={() => setEditingTimelineId(null)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded">Cancel</button><button onClick={() => saveTimelineEdit(item)} className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded">Save</button></div>
                        </div>
                      ) : (<div className="text-sm font-medium text-slate-600">{item.text}</div>)}
                      {isAdmin && !isEditMode && editingTimelineId !== item.id && (
                         <div className="mt-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingTimelineId(item.id); setTimelineEditText(item.text); }} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded hover:bg-blue-100 flex items-center gap-1"><Edit size={10}/> Edit</button>
                            <button onClick={() => handleDeleteTimelineItem(item.id)} className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded hover:bg-red-100 flex items-center gap-1"><Trash2 size={10}/> Delete</button>
                         </div>
                      )}
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {(isAssigned || isAdmin) && task.status !== 'Completed' && task.status !== 'Unsolved' && !isEditMode && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mt-8">
               <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><MessageSquare size={16}/> Add Progress Note</h4>
               <div className="flex gap-2">
                 <input type="text" value={newUpdate} onChange={e=>setNewUpdate(e.target.value)} placeholder="Type update here..." className="flex-1 px-4 py-2 rounded-lg border border-blue-300 outline-none focus:ring-2 focus:ring-blue-500" onKeyDown={e => e.key === 'Enter' && handleAddUpdate()} />
                 <button onClick={handleAddUpdate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">Post</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// --- MAIN APP COMPONENT ---
export default function App() {
  const [fbUser, setFbUser] = useState(null);
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState(null);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  
  // Archiving Architecture: Split Active (Realtime) & Archived (On-Demand) to save Firebase Free Tier reads
  const [activeTasks, setActiveTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const hasFetchedArchive = useRef(false);
  const [isFetchingArchive, setIsFetchingArchive] = useState(false);

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [designations, setDesignations] = useState(DEFAULT_DESIGNATIONS);
  const [backupMeta, setBackupMeta] = useState({ lastBackup: null, lastBackupType: null, lastImport: null });
  
  const [globalFilters, setGlobalFilters] = useState({ dateRange: '7days', status: 'Active' });

  // Custom Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', cancelText: 'Cancel', isDanger: false });
  const triggerConfirm = useCallback((title, message, onConfirm, isDanger = false, confirmText = 'Confirm') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmModal(prev => ({ ...prev, isOpen: false })); }, confirmText, cancelText: 'Cancel', isDanger });
  }, []);

  // View states
  const [viewingTask, setViewingTask] = useState(null);
  const [taskToPrint, setTaskToPrint] = useState(null);
  const [taskToDownload, setTaskToDownload] = useState(null);
  const [taskDetailsToDownload, setTaskDetailsToDownload] = useState(null);
  const [masterReportConfigToDownload, setMasterReportConfigToDownload] = useState(null);
  const [citizenDirectoryToDownload, setCitizenDirectoryToDownload] = useState(null);
  const [officerReportToDownload, setOfficerReportToDownload] = useState(null);

  // Authentication & Initial Bootstrap
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) { console.error("Firebase Auth Error:", err); }
    };
    initAuth();
    return onAuthStateChanged(auth, setFbUser);
  }, []);

  // Load Archive function
  const loadArchive = useCallback(async () => {
    if (hasFetchedArchive.current || isFetchingArchive) return;
    setIsFetchingArchive(true);
    try {
      const snap = await getDocs(getColRef('archived_tasks'));
      setArchivedTasks(snap.docs.map(d => d.data()));
      hasFetchedArchive.current = true;
    } catch (e) { console.error("Failed to load archive:", e); }
    setIsFetchingArchive(false);
  }, [isFetchingArchive]);

  // Fetch Archive triggers based on global UI filters to save loads
  useEffect(() => {
    if (globalFilters.status !== 'Active' || globalFilters.dateRange === 'all' || globalFilters.dateRange === '1year' || globalFilters.dateRange === '6months') {
      loadArchive();
    }
  }, [globalFilters.status, globalFilters.dateRange, loadArchive]);

  // Realtime Listeners (Only active/tiny collections)
  useEffect(() => {
    if (!fbUser) return;
    const savedUser = localStorage.getItem('mla_currentUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    // Listen ONLY to active tasks for extreme cost optimization
    const unsubTasks = onSnapshot(getColRef('tasks'), (snap) => setActiveTasks(snap.docs.map(doc => doc.data())), (err) => console.error(err));
    const unsubUsers = onSnapshot(getColRef('users'), (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        DEFAULT_USERS.forEach(u => batch.set(getDocRef('users', u.id), u));
        batch.commit().catch(e => console.error("Batch init error", e));
      } else setUsers(snap.docs.map(doc => doc.data()));
    }, (err) => console.error(err));
    const unsubSettings = onSnapshot(getDocRef('settings', 'globals'), (snap) => {
      if (!snap.exists()) setDoc(getDocRef('settings', 'globals'), { categories: DEFAULT_CATEGORIES, designations: DEFAULT_DESIGNATIONS }).catch(e => console.error(e));
      else { if(snap.data().categories) setCategories(snap.data().categories); if(snap.data().designations) setDesignations(snap.data().designations); }
    });
    const unsubBackupMeta = onSnapshot(getDocRef('settings', 'backupMeta'), (snap) => { if (snap.exists()) setBackupMeta(snap.data()); });

    return () => { unsubTasks(); unsubUsers(); unsubSettings(); unsubBackupMeta(); };
  }, [fbUser]);

  // Consolidate Active and Archive to pass down safely (useMemo avoids infinite renders)
  const allTasks = useMemo(() => [...activeTasks, ...archivedTasks], [activeTasks, archivedTasks]);

  // Print Handlers
  useEffect(() => { if (taskToPrint) { const timer = setTimeout(() => window.print(), 300); return () => clearTimeout(timer); } }, [taskToPrint]);
  useEffect(() => { const h = () => setTaskToPrint(null); window.addEventListener('afterprint', h); return () => window.removeEventListener('afterprint', h); }, []);

  // PDF Generator Engine
  useEffect(() => {
    const downloadState = taskToDownload || taskDetailsToDownload || masterReportConfigToDownload || citizenDirectoryToDownload || officerReportToDownload;
    if (!downloadState) return;

    const targetId = taskToDownload ? 'dl-ack-slip' : taskDetailsToDownload ? 'dl-details-report' : masterReportConfigToDownload ? 'dl-master-report' : officerReportToDownload ? 'dl-officer-report' : citizenDirectoryToDownload ? 'dl-citizen-dir' : null;
    const filename = taskToDownload ? `Acknowledge_${taskToDownload.id}` : taskDetailsToDownload ? `Detailed_Report_${taskDetailsToDownload.id}` : masterReportConfigToDownload ? `Master_Performance_Report` : officerReportToDownload ? `Officer_Report_${officerReportToDownload.officer.name}` : citizenDirectoryToDownload ? `Citizen_Directory` : 'Document';

    const generatePDF = () => {
      const el = document.getElementById(targetId);
      if(!el) { cleanDownloadState(); return; }
      setTimeout(() => {
        const opt = { margin: [15, 15, 15, 15], filename: `${filename}.pdf`, image: { type: 'jpeg', quality: 1.0 }, html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0, windowWidth: 850 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } };
        window.html2pdf().set(opt).from(el).save().then(() => cleanDownloadState()).catch(err => { console.error(err); cleanDownloadState(); });
      }, 800);
    };

    const cleanDownloadState = () => { setTaskToDownload(null); setTaskDetailsToDownload(null); setMasterReportConfigToDownload(null); setCitizenDirectoryToDownload(null); setOfficerReportToDownload(null); };

    if (window.html2pdf) generatePDF();
    else {
      const oldDefine = window.define; window.define = undefined;
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => { window.define = oldDefine; generatePDF(); };
      document.head.appendChild(script);
    }
  }, [taskToDownload, taskDetailsToDownload, masterReportConfigToDownload, citizenDirectoryToDownload, officerReportToDownload]);

  const handleLogin = (user) => { setCurrentUser(user); localStorage.setItem('mla_currentUser', JSON.stringify(user)); };
  const handleLogout = () => { setCurrentUser(null); setImpersonatedUser(null); localStorage.removeItem('mla_currentUser'); };

  const addTask = useCallback(async (newTask) => {
    // New tasks always start active
    await setDoc(getDocRef('tasks', newTask.id), newTask);
  }, []);

  const updateTask = useCallback(async (taskId, updates) => {
    const currentTask = allTasks.find(t => t.id === taskId);
    if (!currentTask) return;
    
    const merged = { ...currentTask, ...updates };
    const wasArchived = currentTask.status === 'Completed' || currentTask.status === 'Unsolved';
    const willBeArchived = merged.status === 'Completed' || merged.status === 'Unsolved';

    if (!wasArchived && willBeArchived) {
      // Archive the task explicitly
      await setDoc(getDocRef('archived_tasks', taskId), merged);
      await deleteDoc(getDocRef('tasks', taskId));
      setArchivedTasks(prev => [...prev, merged]);
    } else if (wasArchived && !willBeArchived) {
      // Unarchive the task explicitly
      await setDoc(getDocRef('tasks', taskId), merged);
      await deleteDoc(getDocRef('archived_tasks', taskId));
      setArchivedTasks(prev => prev.filter(t => t.id !== taskId));
    } else {
      // Normal update
      const targetCol = willBeArchived ? 'archived_tasks' : 'tasks';
      await updateDoc(getDocRef(targetCol, taskId), updates);
      if (willBeArchived) setArchivedTasks(prev => prev.map(t => t.id === taskId ? merged : t));
    }
  }, [allTasks]);
  
  const deleteTask = useCallback((taskId) => {
    const isArchived = archivedTasks.some(t => t.id === taskId);
    triggerConfirm("CRITICAL: Delete Task Input", "Are you absolutely sure you want to completely delete this task record?", async () => {
      try {
        await deleteDoc(getDocRef(isArchived ? 'archived_tasks' : 'tasks', taskId));
        if (isArchived) setArchivedTasks(prev => prev.filter(t => t.id !== taskId));
        setViewingTask(null);
      } catch (err) { console.error("Delete task failed:", err); }
    }, true, "Delete Task");
  }, [archivedTasks, triggerConfirm]);

  const updateUserDoc = async (userId, field, value) => await updateDoc(getDocRef('users', userId), { [field]: value });
  const addCategory = async (newCat) => await setDoc(getDocRef('settings', 'globals'), { categories: [...categories, newCat] }, { merge: true });
  const addDesignation = async (newDesig) => await setDoc(getDocRef('settings', 'globals'), { designations: [...designations, newDesig] }, { merge: true });
  const updateBackupMeta = async (updates) => await setDoc(getDocRef('settings', 'backupMeta'), updates, { merge: true });
  const addUser = async (newUser) => await setDoc(getDocRef('users', newUser.id), newUser);
  const deleteUserAcct = (userId) => {
    triggerConfirm("CRITICAL: Delete Officer Profile", `Are you sure you want to permanently delete this profile?`, async () => {
      try { await deleteDoc(getDocRef('users', userId)); } catch (err) { console.error(err); }
    }, true, "Delete Officer");
  };

  const liveCurrentUser = currentUser ? users.find(u => u.id === currentUser.id) : null;
  useEffect(() => {
    if (currentUser && liveCurrentUser && !liveCurrentUser.enabled && liveCurrentUser.role !== 'admin') {
      handleLogout(); triggerConfirm("Account Suspended", "Your account has been temporarily disabled.", () => {}, true, "Okay");
    }
  }, [liveCurrentUser, currentUser, triggerConfirm]);

  const activeUser = impersonatedUser || liveCurrentUser;
  const isImpersonating = !!impersonatedUser;

  if (!activeUser) return <LoginScreen onLogin={handleLogin} users={users} />;

  // Common UI global filter injection
  const GlobalFilterBar = () => (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center w-fit mb-6 text-sm">
       <span className="font-black text-slate-800 flex items-center gap-1.5"><Filter size={16} className="text-indigo-600"/> View Mode:</span>
       <select value={globalFilters.status} onChange={e => setGlobalFilters(p => ({...p, status: e.target.value}))} className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-700 outline-none bg-white focus:border-indigo-500 transition-all">
         <option value="Active">Active Actions</option>
         <option value="Pending">Pending Only</option>
         <option value="Completed">Completed Only</option>
         <option value="Unsolved">Unsolved Only</option>
         <option value="All">All Statuses</option>
       </select>
       <select value={globalFilters.dateRange} onChange={e => setGlobalFilters(p => ({...p, dateRange: e.target.value}))} className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-700 outline-none bg-white focus:border-indigo-500 transition-all">
         <option value="7days">Last 7 Days</option>
         <option value="1month">Last Month</option>
         <option value="6months">Last 6 Months</option>
         <option value="1year">Last Year</option>
         <option value="all">All Time</option>
       </select>
       {isFetchingArchive && <span className="text-xs font-bold text-indigo-500 animate-pulse ml-2 flex items-center gap-1"><Database size={14}/> Fetching Archive...</span>}
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&family=Scheherazade+New:wght@400;700&display=swap');
          @media print {
             @page { margin: 15mm; size: A4 portrait; }
             body, html { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Inter', sans-serif; background: white; margin: 0; padding: 0; }
             .print-hidden { display: none !important; }
             .print-block { display: block !important; }
             .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      ` }} />

      {taskToPrint && <div className="hidden print:block w-full bg-white text-black font-sans"><PrintAcknowledgeSlip task={taskToPrint} /></div>}
      {taskToDownload && <PDFCaptureWrapper id="dl-ack-slip"><PrintAcknowledgeSlip task={taskToDownload} /></PDFCaptureWrapper>}
      {taskDetailsToDownload && <PDFCaptureWrapper id="dl-details-report"><PrintTaskDetailsReport task={taskDetailsToDownload} users={users} /></PDFCaptureWrapper>}
      {masterReportConfigToDownload && <PDFCaptureWrapper id="dl-master-report"><PrintMasterReport config={masterReportConfigToDownload} tasks={allTasks} users={users} categories={categories} /></PDFCaptureWrapper>}
      {officerReportToDownload && <PDFCaptureWrapper id="dl-officer-report"><PrintOfficerReport config={officerReportToDownload} tasks={allTasks} /></PDFCaptureWrapper>}
      {citizenDirectoryToDownload && <PDFCaptureWrapper id="dl-citizen-dir"><PrintCitizenDirectory citizens={citizenDirectoryToDownload} /></PDFCaptureWrapper>}

      {viewingTask && !taskToPrint && <TaskDetailsModal task={allTasks.find(t => t.id === viewingTask.id) || viewingTask} onClose={() => setViewingTask(null)} updateTask={updateTask} deleteTask={deleteTask} users={users} categories={categories} triggerDetailsPrint={(task) => setTaskDetailsToDownload(task)} triggerDownloadPDF={setTaskDetailsToDownload} currentUser={activeUser} triggerConfirm={triggerConfirm} />}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 print-hidden">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4"><div className={`p-3 rounded-full shrink-0 ${confirmModal.isDanger ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{confirmModal.isDanger ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}</div><h3 className="text-xl font-black text-slate-800 leading-tight">{confirmModal.title}</h3></div>
              <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">{confirmModal.cancelText || 'Cancel'}</button>
                <button onClick={confirmModal.onConfirm} className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-colors ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{confirmModal.confirmText || 'Confirm'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col print-hidden relative z-10 ${taskToPrint ? 'hidden' : 'flex'}`}>
        <header className={`${isImpersonating ? 'bg-gradient-to-r from-red-900 to-orange-800' : 'bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-900'} text-white shadow-md transition-colors`}>
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm shadow-inner">{isImpersonating ? <Shield size={20} className="text-white animate-pulse" /> : <User size={20} className="text-white" />}</div>
              <div><h1 className="font-bold text-lg leading-tight tracking-wide">PK Navas MLA Office</h1><p className="text-xs text-blue-100 font-medium tracking-wider uppercase">{isImpersonating ? `ACTING AS: ${activeUser.name}` : activeUser.name}</p></div>
            </div>
            <div className="flex items-center gap-4">
              {isImpersonating && <button onClick={() => setImpersonatedUser(null)} className="hidden sm:flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded border border-white/30 transition-colors font-bold">Exit Profile</button>}
              <div className="hidden md:flex items-center text-sm text-blue-100 bg-white/10 px-4 py-1.5 rounded-full border border-white/10"><LiveClock /></div>
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm bg-red-500/90 hover:bg-red-600 transition-colors px-4 py-2 rounded-lg font-bold shadow-sm"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></button>
            </div>
          </div>
        </header>

        <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <GlobalFilterBar />
          {activeUser.role === 'admin' ? (
            <AdminDashboard tasks={allTasks} updateTask={updateTask} deleteTask={deleteTask} categories={categories} designations={designations} users={users} updateUserDoc={updateUserDoc} addUser={addUser} deleteUser={deleteUserAcct} setImpersonatedUser={setImpersonatedUser} triggerPrint={setTaskToPrint} triggerDownloadPDF={setTaskToDownload} triggerDetailsPrint={(task) => setTaskDetailsToDownload(task)} triggerDetailsDownload={setTaskDetailsToDownload} triggerViewDetails={setViewingTask} addTask={addTask} addCategory={addCategory} addDesignation={addDesignation} triggerMasterReport={(config) => setMasterReportConfigToDownload(config)} triggerMasterDownload={setMasterReportConfigToDownload} triggerOfficerReport={(config) => setOfficerReportToDownload(config)} triggerOfficerDownload={setOfficerReportToDownload} backupMeta={backupMeta} updateBackupMeta={updateBackupMeta} triggerCitizenPrint={(data) => setCitizenDirectoryToDownload(data)} triggerCitizenDownload={setCitizenDirectoryToDownload} triggerConfirm={triggerConfirm} globalFilters={globalFilters} loadArchive={loadArchive} />
          ) : (
            <OfficerDashboard user={activeUser} tasks={allTasks} updateTask={updateTask} deleteTask={deleteTask} categories={categories} designations={designations} users={users} addTask={addTask} addCategory={addCategory} addDesignation={addDesignation} triggerPrint={setTaskToPrint} triggerDownloadPDF={setTaskToDownload} triggerDetailsPrint={(task) => setTaskDetailsToDownload(task)} triggerDetailsDownload={setTaskDetailsToDownload} triggerViewDetails={setViewingTask} isAdminOverride={currentUser.role === 'admin'} triggerConfirm={triggerConfirm} globalFilters={globalFilters} />
          )}
        </main>
        <footer className="pb-6 pt-2 text-center text-[10px] font-black text-slate-400 tracking-widest uppercase">&copy; {new Date().getFullYear()} PK Navas MLA Office Management System. All Rights Reserved.</footer>
      </div>
    </>
  );
}

// --- LOGIN SCREEN ---
function LoginScreen({ onLogin, users }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setQuoteIndex((prev) => (prev + 1) % ISLAMIC_QUOTES.length), 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleLoginSubmit = (e) => { e.preventDefault(); if (password === selectedUser.pass) onLogin(selectedUser); else setError('Incorrect password'); };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col relative z-10">
      <div className="w-full bg-slate-900 text-center py-4 px-4 shadow-md z-20 flex items-center justify-center min-h-[80px] lg:min-h-[90px]">
        <div key={quoteIndex} className="animate-in fade-in duration-1000 max-w-6xl mx-auto flex flex-col items-center gap-2">
          <p className="text-base md:text-lg lg:text-xl text-blue-100 leading-tight drop-shadow-sm" dir="rtl" style={{ fontFamily: "'Scheherazade New', serif" }}>{ISLAMIC_QUOTES[quoteIndex].arabic}</p>
          <p className="text-xs md:text-sm lg:text-base font-normal text-slate-300 tracking-wide" style={{ fontFamily: "'Anek Malayalam', sans-serif" }}>{ISLAMIC_QUOTES[quoteIndex].malayalam}</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden flex flex-col md:flex-row">
          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-10 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-20 -top-20 opacity-10"><Shield size={300}/></div>
            <div className="relative z-10"><div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-white/20 backdrop-blur-md"><Users size={40} className="text-white" /></div><h1 className="text-4xl font-black mb-3 leading-tight">MLA Office<br/>Management</h1><p className="text-blue-200 text-lg font-medium tracking-wide mb-6">PK Navas • Tanur Constituency</p><div className="inline-block bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm"><LiveClock className="text-blue-50 text-sm font-bold tracking-wide" /></div></div>
            <div className="mt-12 hidden md:block relative z-10"><p className="text-sm text-blue-200/60 font-bold tracking-wider">&copy; {new Date().getFullYear()} SECURE SYSTEM</p></div>
          </div>
          <div className="p-8 md:p-12 md:w-3/5 bg-slate-50 relative">
            {!selectedUser ? (
              <div>
                <h2 className="text-2xl font-black text-slate-800 mb-6">Select Staff Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {users.map(user => (
                    <button key={user.id} disabled={!user.enabled} onClick={() => { setSelectedUser(user); setError(''); setPassword(''); }} className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 relative overflow-hidden ${!user.enabled ? 'opacity-40 grayscale bg-slate-100 border-slate-200 cursor-not-allowed' : user.role === 'admin' ? 'bg-blue-50 border-blue-200 hover:border-blue-500 hover:shadow-md' : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'}`}>
                      {!user.enabled && <div className="absolute top-3 right-3 text-slate-400"><Lock size={16}/></div>}
                      <div className={`p-3 rounded-xl shadow-sm shrink-0 ${user.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{user.role === 'admin' ? <Shield size={24} /> : <User size={24} />}</div>
                      <div><p className="font-black text-slate-800 text-lg leading-tight">{user.name}</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{user.role === 'admin' ? 'Super Admin' : 'Officer Login'}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center animate-in fade-in">
                <button onClick={() => setSelectedUser(null)} className="text-sm text-blue-600 hover:text-blue-800 mb-8 flex items-center gap-1 font-bold w-fit bg-blue-50 px-3 py-1.5 rounded-md">Back to profiles</button>
                <div className="flex items-center gap-5 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className={`p-4 rounded-2xl shadow-inner ${selectedUser.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{selectedUser.role === 'admin' ? <Shield size={32} /> : <User size={32} />}</div>
                  <div><h2 className="text-3xl font-black text-slate-800 tracking-tight">{selectedUser.name}</h2><p className="text-slate-500 font-medium">Enter your secure passcode</p></div>
                </div>
                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  <div><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-xl font-medium tracking-widest" placeholder="••••••••" autoFocus />{error && <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5 font-bold"><AlertTriangle size={16}/> {error}</p>}</div>
                  <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2">Secure Login <ChevronRight size={20}/></button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentAlertsTab({ user, tasks, jumpToTask }) {
  const myAssigned = tasks.filter(t => t.assignedTo.includes(user.id) && t.status !== 'Completed' && t.status !== 'Unsolved').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pending = myAssigned.filter(t => !t.deadline || new Date(t.deadline) >= new Date());
  const overdue = myAssigned.filter(t => t.deadline && new Date(t.deadline) < new Date());

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 relative overflow-hidden shadow-sm">
        <div className="absolute -right-10 -top-10 opacity-5 scale-150 text-red-600"><AlertOctagon size={300}/></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-red-700 flex items-center gap-3 mb-6"><Bell className="animate-pulse"/> URGENT & PENDING ACTIONS</h2>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center"><span className="text-5xl font-black text-amber-500 tracking-tighter">{pending.length}</span><span className="text-xs font-black text-amber-700 uppercase tracking-widest mt-2">Active / Pending</span></div>
            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center"><span className="text-5xl font-black text-red-600 tracking-tighter">{overdue.length}</span><span className="text-xs font-black text-red-800 uppercase tracking-widest mt-2">Overdue</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden relative z-10">
          <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
            <thead className="bg-red-50/50 border-b border-red-100 text-red-800 uppercase text-[10px] tracking-widest font-black"><tr><th className="px-6 py-4">Reference ID & Deadline</th><th className="px-6 py-4">Subject</th><th className="px-6 py-4 text-center">Action</th></tr></thead>
            <tbody className="divide-y divide-red-50">
              {myAssigned.map(t => {
                const isOverdue = t.deadline && new Date(t.deadline) < new Date();
                return (
                  <tr key={t.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-4"><span className="font-black text-slate-800 bg-slate-100 px-2 py-1 rounded text-xs">{t.id}</span>{t.deadline && <span className={`block mt-2 text-[10px] font-bold uppercase tracking-wider ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}><Clock size={10} className="inline mr-1"/>{formatDate(t.deadline)} {formatTime(t.deadline)}</span>}</td>
                    <td className="px-6 py-4"><span className="font-bold text-slate-800 text-base block truncate max-w-[300px]">{t.subject}</span><span className="text-xs text-slate-500 font-medium">{t.category}</span></td>
                    <td className="px-6 py-4 text-center"><button onClick={() => jumpToTask(t.taskType === 'direct' ? 'direct' : 'tasks', t.id)} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-4 py-2 rounded-lg transition-colors text-xs uppercase tracking-wider">Show Task</button></td>
                  </tr>
                );
              })}
              {myAssigned.length === 0 && <tr><td colSpan="3" className="text-center py-10 text-slate-500 font-bold">You have no pending assignments. Great job!</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OfficerDashboard({ user, tasks, updateTask, deleteTask, categories, designations, users, addTask, addCategory, addDesignation, triggerPrint, triggerDownloadPDF, triggerDetailsPrint, triggerDetailsDownload, triggerViewDetails, isAdminOverride, triggerConfirm, globalFilters }) {
  const [activeTab, setActiveTab] = useState('alerts');
  const [searchStr, setSearchStr] = useState('');

  const jumpToTask = (tab, taskId) => { setSearchStr(taskId); setActiveTab(tab); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-fit">
        <button onClick={() => { setActiveTab('alerts'); setSearchStr(''); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'alerts' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Bell size={16}/> Recent Assignments</button>
        <button onClick={() => { setActiveTab('tasks'); setSearchStr(''); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>My Assigned Works</button>
        <button onClick={() => { setActiveTab('direct'); setSearchStr(''); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'direct' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Zap size={16}/> Assignments from MLA</button>
        {user.canInput && <button onClick={() => setActiveTab('input')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'input' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>Register New Input</button>}
        {user.canInput && <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>History & Reports</button>}
      </div>

      {activeTab === 'alerts' && <RecentAlertsTab user={user} tasks={tasks} jumpToTask={jumpToTask} />}
      {activeTab === 'tasks' && <WorkerTab user={user} tasks={tasks} globalFilters={globalFilters} updateTask={updateTask} isAdminOverride={isAdminOverride} taskTypeFilter="input" triggerViewDetails={triggerViewDetails} initialSearch={searchStr} triggerConfirm={triggerConfirm} />}
      {activeTab === 'direct' && <WorkerTab user={user} tasks={tasks} globalFilters={globalFilters} updateTask={updateTask} isAdminOverride={isAdminOverride} taskTypeFilter="direct" triggerViewDetails={triggerViewDetails} initialSearch={searchStr} triggerConfirm={triggerConfirm} />}
      {activeTab === 'input' && user.canInput && <InputFormTab tasks={tasks} addTask={addTask} categories={categories} designations={designations} users={users} triggerPrint={triggerPrint} triggerDownloadPDF={triggerDownloadPDF} creator={user} addCategory={addCategory} addDesignation={addDesignation} />}
      {activeTab === 'history' && user.canInput && <AllTasksHistoryTab tasks={tasks} globalFilters={globalFilters} categories={categories} triggerPrint={triggerPrint} triggerDownloadPDF={triggerDownloadPDF} triggerDetailsPrint={triggerDetailsPrint} triggerDetailsDownload={triggerDetailsDownload} triggerViewDetails={triggerViewDetails} currentUser={user} updateTask={updateTask} deleteTask={deleteTask} users={users} />}
    </div>
  );
}

function InputFormTab({ tasks, addTask, categories, designations, addCategory, addDesignation, users, triggerPrint, triggerDownloadPDF, creator }) {
  const initForm = { types: [], category: '', newCategory: '', programDate: '', subject: '', customDeadline: '', attachmentLinks: [''], personal: { name: '', designation: '', newDesignation: '', gender: '', referralPerson: '', mobileNumber: '', whatsappNumber: '', houseName: '', place: '', postOffice: '', pinCode: '', localBody: '', otherLocalBody: '', wardNumber: '' }, description: '', assignedTo: [] };
  const [form, setForm] = useState(initForm);
  const [showNewCat, setShowNewCat] = useState(false);
  const [showNewDesig, setShowNewDesig] = useState(false);
  const [sendWaMsg, setSendWaMsg] = useState(true);
  const [sendWaMsgSame, setSendWaMsgSame] = useState(false);
  const [lastTask, setLastTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoFilledMessage, setAutoFilledMessage] = useState('');
  const [formError, setFormError] = useState({ field: '', msg: '' });

  const isInvitation = form.category === 'Invitation';

  const scrollToField = (id, msg) => {
    setFormError({ field: id, msg });
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-red-400', 'rounded-xl', 'transition-all'); setTimeout(() => el.classList.remove('ring-2', 'ring-red-400', 'rounded-xl'), 3000); }
    setTimeout(() => setFormError({ field: '', msg: '' }), 5000);
  };

  const handlePersChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, personal: { ...prev.personal, [name]: value } };
      if (name === 'mobileNumber' && sendWaMsgSame) updated.personal.whatsappNumber = value;
      return updated;
    });
  };

  const handleMobileBlur = () => {
    const clean = form.personal.mobileNumber.replace(/\D/g, '');
    if (clean.length >= 10) {
      const match = tasks.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).find(t => t.personalDetails?.mobileNumber?.replace(/\D/g, '') === clean);
      if (match) {
        setForm(f => ({ ...f, personal: { ...f.personal, name: match.personalDetails.name || f.personal.name, designation: match.personalDetails.designation || f.personal.designation, gender: match.personalDetails.gender || f.personal.gender, houseName: match.personalDetails.houseName || f.personal.houseName, place: match.personalDetails.place || f.personal.place, postOffice: match.personalDetails.postOffice || f.personal.postOffice, pinCode: match.personalDetails.pinCode || f.personal.pinCode, localBody: match.personalDetails.localBody || f.personal.localBody, wardNumber: match.personalDetails.wardNumber || f.personal.wardNumber, whatsappNumber: match.personalDetails.whatsappNumber || f.personal.whatsappNumber } }));
        setAutoFilledMessage(`✓ Data loaded from previous visit on ${formatDate(match.createdAt)}`);
        setTimeout(() => setAutoFilledMessage(''), 5000);
      }
    }
  };
  
  const handleAddCustomCategory = async () => { if (form.newCategory && !categories.includes(form.newCategory)) { await addCategory(form.newCategory); setForm({...form, category: form.newCategory}); setShowNewCat(false); } };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError({ field: '', msg: '' }); if(isSubmitting) return;
    if (form.types.length === 0) return scrollToField('field-types', 'Please select an Input Type.');

    let finalCat = form.category;
    if (showNewCat && form.newCategory) { if (!categories.includes(form.newCategory)) await addCategory(form.newCategory); finalCat = form.newCategory; }
    if (!finalCat) return scrollToField('field-category', 'Please select a Category.');
    if (!form.personal.mobileNumber) return scrollToField('field-mobileNumber', 'Mobile Number is mandatory.');
    if (!form.personal.name) return scrollToField('field-name', 'Full Name is mandatory.');
    if (!form.subject.trim()) return scrollToField('field-subject', 'Subject is mandatory.');

    const finalLocalBody = form.personal.localBody === 'Other' ? form.personal.otherLocalBody : form.personal.localBody;
    let finalAssignedTo = form.assignedTo; if(isInvitation) finalAssignedTo = ['admin']; 
    if (finalAssignedTo.length === 0) return scrollToField('field-assignedTo', 'Please assign this to at least one officer.');

    let finalDesig = form.personal.designation;
    if (showNewDesig && form.personal.newDesignation) { if (!designations.includes(form.personal.newDesignation)) { await addDesignation(form.personal.newDesignation); } finalDesig = form.personal.newDesignation; }

    setIsSubmitting(true);
    const taskId = generateId(tasks);
    const finalPersonalDetails = { ...form.personal, designation: finalDesig, localBody: finalLocalBody }; delete finalPersonalDetails.newDesignation; delete finalPersonalDetails.otherLocalBody;

    const defaultDeadline = getNextDayISO();
    const finalDeadline = form.customDeadline ? new Date(form.customDeadline).toISOString() : defaultDeadline;
    const deadlineMsg = form.customDeadline ? `Custom deadline set to ${formatDate(finalDeadline)} ${formatTime(finalDeadline)}` : `Default deadline set to ${formatDate(defaultDeadline)} ${formatTime(defaultDeadline)}`;

    const attachmentsData = form.attachmentLinks
      .filter(link => link.trim())
      .map((link, idx) => ({ name: `External Document Link ${idx + 1}`, url: link.trim(), type: 'link' }));

    const newTask = {
      id: taskId, types: form.types, category: finalCat, personalDetails: finalPersonalDetails, taskType: 'input', subject: form.subject, description: form.description, assignedTo: finalAssignedTo, deadline: finalDeadline, programDate: isInvitation ? form.programDate : null,
      status: 'Pending', priority: 'Medium', officerStatuses: {}, attachment: null, attachments: attachmentsData, createdAt: getNow(), createdBy: creator.name, createdByUid: creator.id, timeline: [{ id: generateUid(), type: 'created', time: getNow(), by: creator.name, text: `Input Registered. ${deadlineMsg}` }]
    };

    await addTask(newTask);
    setIsSubmitting(false); setLastTask(newTask);
    
    if (sendWaMsg && (finalPersonalDetails.whatsappNumber || finalPersonalDetails.mobileNumber)) {
      const waNum = formatWhatsAppNumber(finalPersonalDetails.whatsappNumber || finalPersonalDetails.mobileNumber);
      if (waNum) {
        const waMessage = `പ്രിയപ്പെട്ട ${finalPersonalDetails.name},\n\nതാങ്കൾ പി.കെ നവാസ് എം.എൽ.എ യുടെ ഓഫീസുമായി ബന്ധപ്പെട്ടതിന് നന്ദി. നിങ്ങളുടെ അപേക്ഷ/പരാതി ഔദ്യോഗികമായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്.\n\n*വിഷയം:* ${form.subject}\n*റഫറൻസ് ഐഡി:* ${taskId}\n\n\nസ്നേഹത്തോടെ,\nഎം.എൽ.എ ഓഫീസ്, താനൂർ.ഫോൺ: 9037032002`;
        window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(waMessage)}`, '_blank');
      }
    }
  };

  if (lastTask) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-lg text-center max-w-2xl mx-auto border border-green-200 animate-in zoom-in-95">
        <CheckCircle size={60} className="text-green-500 mx-auto mb-4" /><h2 className="text-3xl font-black text-green-800 mb-2">Input Registered Successfully</h2>
        <div className="bg-slate-50 p-6 rounded-xl my-6 inline-block border border-slate-200"><p className="text-sm font-bold text-slate-500 uppercase">Reference ID</p><p className="text-4xl font-black text-slate-800 tracking-widest">{lastTask.id}</p></div>
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <button onClick={() => triggerPrint(lastTask)} className="px-5 py-3 bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-900 transition-colors"><Printer size={18}/> Print Slip</button>
          <button onClick={() => triggerDownloadPDF(lastTask)} className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors"><Download size={18}/> Download PDF</button>
          <button onClick={() => { setLastTask(null); setForm(initForm); setSendWaMsgSame(false); }} className="px-5 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors"><Plus size={18}/> Register New Input</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 grid md:grid-cols-2 gap-10">
        <div id="field-types" className="p-2 -m-2">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-lg"><Filter className="text-blue-600"/> Input Type * {formError.field === 'field-types' && <span className="text-red-500 text-xs animate-pulse bg-red-100 px-2 py-1 rounded ml-auto">{formError.msg}</span>}</h3>
          <div className="grid grid-cols-2 gap-3">
            {INPUT_TYPES.map(type => (
              <label key={type} className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border transition-all font-bold text-sm ${form.types.includes(type) ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <input type="radio" name="inputTypeRadio" checked={form.types.includes(type)} onChange={() => setForm({ ...form, types: [type] })} className="w-4 h-4 text-blue-600 focus:ring-blue-500" /><span>{type}</span>
              </label>
            ))}
          </div>
        </div>
        <div id="field-category" className="p-2 -m-2">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-lg"><FileText className="text-blue-600"/> Category * {formError.field === 'field-category' && <span className="text-red-500 text-xs animate-pulse bg-red-100 px-2 py-1 rounded ml-auto">{formError.msg}</span>}</h3>
          {!showNewCat ? (<SearchableCategorySelect categories={categories} selected={form.category} onChange={(value) => setForm({...form, category: value})} onAddNewClick={() => setShowNewCat(true)} />) : (
            <div className="flex flex-col gap-2">
              <input type="text" autoFocus placeholder="Type new category name..." value={form.newCategory} onChange={(e) => setForm({...form, newCategory: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold outline-none focus:border-blue-500" />
              <div className="flex gap-2"><button type="button" onClick={handleAddCustomCategory} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Save & Select</button><button type="button" onClick={() => setShowNewCat(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Cancel</button></div>
            </div>
          )}
        </div>
      </div>
      <div className="p-8 border-b border-slate-100 relative">
        <div className="flex justify-between items-center mb-6"><h3 className="font-black text-slate-800 flex items-center gap-2 text-lg"><User className="text-blue-600"/> Citizen Details</h3>{autoFilledMessage && <span className="text-xs font-black bg-green-100 text-green-700 px-3 py-1 rounded-full animate-in fade-in">{autoFilledMessage}</span>}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div id="field-mobileNumber" className="p-2 -m-2">
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>Mobile Number *</span>{formError.field === 'field-mobileNumber' && <span className="text-red-500 normal-case tracking-normal font-bold animate-pulse">{formError.msg}</span>}</label>
             <input required name="mobileNumber" value={form.personal.mobileNumber} onChange={handlePersChange} onBlur={handleMobileBlur} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="Enter to auto-fill..." />
          </div>
          <div id="field-name" className="p-2 -m-2">
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>Full Name *</span>{formError.field === 'field-name' && <span className="text-red-500 normal-case tracking-normal font-bold animate-pulse">{formError.msg}</span>}</label>
             <input required name="name" value={form.personal.name} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" />
          </div>
          <div>
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>WhatsApp Number</span><label className="flex items-center gap-1 cursor-pointer text-blue-600 normal-case tracking-normal text-[10px] font-bold"><input type="checkbox" checked={sendWaMsgSame} onChange={(e) => { const c = e.target.checked; setSendWaMsgSame(c); if(c) setForm(prev => ({...prev, personal: {...prev.personal, whatsappNumber: prev.personal.mobileNumber}})); }} className="rounded w-3 h-3"/> Same as Mobile</label></label>
             <input name="whatsappNumber" value={form.personal.whatsappNumber} onChange={handlePersChange} disabled={sendWaMsgSame} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60" />
          </div>
          <div>
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>Designation</span></label>
             {!showNewDesig ? (<div className="flex gap-2"><select name="designation" value={form.personal.designation} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all"><option value="">Select Designation...</option>{designations.map(d => <option key={d} value={d}>{d}</option>)}</select><button type="button" onClick={() => setShowNewDesig(true)} className="bg-blue-50 text-blue-600 px-3 rounded-xl hover:bg-blue-100"><Plus size={16}/></button></div>) : (<div className="flex gap-2"><input type="text" name="newDesignation" placeholder="New Designation" value={form.personal.newDesignation} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none" /><button type="button" onClick={() => { setShowNewDesig(false); setForm(prev => ({...prev, personal: {...prev.personal, newDesignation: ''}})); }} className="px-3 bg-red-50 text-red-600 rounded-xl"><X size={16}/></button></div>)}
          </div>
          <div>
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>Gender</span></label>
             <select name="gender" value={form.personal.gender} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all"><option value="">Select Gender...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
          </div>
          <div><label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>Referral Person</span></label><input name="referralPerson" value={form.personal.referralPerson} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
          <div><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">House Name</label><input name="houseName" value={form.personal.houseName} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
          <div><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Place Name</label><input name="place" value={form.personal.place} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
          <div><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Post Office</label><input name="postOffice" value={form.personal.postOffice} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
          <div><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">PIN Code</label><input name="pinCode" value={form.personal.pinCode} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
          <div>
             <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Local Body</label>
             <select name="localBody" value={form.personal.localBody} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all"><option value="">Select Local Body...</option>{LOCAL_BODIES.map(lb => <option key={lb} value={lb}>{lb}</option>)}</select>
             {form.personal.localBody === 'Other' && (<input type="text" name="otherLocalBody" placeholder="Specify local body..." value={form.personal.otherLocalBody} onChange={handlePersChange} className="w-full mt-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" />)}
          </div>
          <div><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ward Number</label><input name="wardNumber" value={form.personal.wardNumber} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
        </div>
      </div>
      <div className="p-8 bg-slate-50/50">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <div id="field-subject" className="mb-6 p-2 -m-2"><h3 className="font-black text-slate-800 mb-2 flex justify-between items-center text-lg"><span className="flex items-center gap-2"><MessageSquare className="text-blue-600"/> Subject (Short) *</span>{formError.field === 'field-subject' && <span className="text-red-500 text-xs animate-pulse bg-red-100 px-2 py-1 rounded">{formError.msg}</span>}</h3><input required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-white" placeholder="Briefly state the subject..." /></div>
            <div className="mb-6"><h3 className="font-black text-slate-800 mb-2 flex items-center gap-2 text-lg"><FileText className="text-blue-600"/> Detailed Description (Optional)</h3><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium h-32 outline-none focus:border-blue-500 bg-white" placeholder="Write full details here if necessary..."></textarea></div>
            <div className="mb-6 p-5 bg-white border border-slate-300 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm"><ExternalLink className="text-indigo-600"/> Attach Document Links (Optional)</h3>
                <button type="button" onClick={() => setForm({...form, attachmentLinks: [...form.attachmentLinks, '']})} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 flex items-center gap-1 transition-colors"><Plus size={14}/> Add Link</button>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-3">Paste a link to Google Drive, OneDrive, or any other external document.</p>
              <div className="space-y-3">
                {form.attachmentLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="url" value={link} onChange={e => { const newLinks = [...form.attachmentLinks]; newLinks[idx] = e.target.value; setForm({...form, attachmentLinks: newLinks}); }} className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 bg-white" placeholder="https://drive.google.com/..." />
                    {form.attachmentLinks.length > 1 && (
                      <button type="button" onClick={() => { const newLinks = form.attachmentLinks.filter((_, i) => i !== idx); setForm({...form, attachmentLinks: newLinks}); }} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"><X size={16}/></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {isInvitation && (<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"><label className="block text-xs font-black text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-2"><CalendarPlus size={16}/> Program Date</label><input type="datetime-local" required value={form.programDate} onChange={(e) => setForm({...form, programDate: e.target.value})} className="w-full px-4 py-3 border border-blue-300 rounded-xl font-bold outline-none focus:border-blue-500 bg-white" /></div>)}
          </div>
          <div id="field-assignedTo" className="p-2 -m-2">
            <h3 className="font-black text-slate-800 mb-4 flex justify-between items-center text-lg"><span className="flex items-center gap-2"><Users className="text-blue-600"/> Assign To *</span>{formError.field === 'field-assignedTo' && <span className="text-red-500 text-xs animate-pulse bg-red-100 px-2 py-1 rounded">{formError.msg}</span>}</h3>
            {isInvitation ? (<div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center gap-3 text-indigo-800 font-bold mb-6"><Shield size={24} /> Auto-Assigned exclusively to PK Navas</div>) : (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {users.map(u => (<label key={u.id} className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all font-bold text-sm ${form.assignedTo.includes(u.id) ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}><input type="checkbox" checked={form.assignedTo.includes(u.id)} onChange={() => setForm({ ...form, assignedTo: form.assignedTo.includes(u.id) ? form.assignedTo.filter(id => id !== u.id) : [...form.assignedTo, u.id] })} className="w-4 h-4 text-indigo-600 rounded" />{u.name}</label>))}
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl"><label className="block text-xs font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={16}/> Target Deadline (Optional)</label><input type="datetime-local" value={form.customDeadline} onChange={(e) => setForm({...form, customDeadline: e.target.value})} className="w-full px-4 py-3 border border-amber-300 rounded-xl font-bold outline-none focus:border-amber-500 bg-white text-sm" /><p className="text-[10px] font-bold text-amber-600 mt-2">If left blank, deadline defaults to exactly 24 hours from now.</p></div>
          </div>
        </div>
      </div>
      <div className="p-8 border-t border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-6">
        <label className="flex items-center gap-3 cursor-pointer bg-green-50 px-5 py-3 rounded-xl border border-green-200"><input type="checkbox" checked={sendWaMsg} onChange={(e) => setSendWaMsg(e.target.checked)} className="w-5 h-5 text-green-600 rounded" /><span className="font-bold text-green-800 flex items-center gap-2"><Send size={16}/> Auto-Send Malayalam WhatsApp</span></label>
        <button type="submit" disabled={isSubmitting} className={`w-full md:w-auto font-black py-4 px-10 rounded-xl shadow-lg transition-transform transform ${isSubmitting ? 'bg-slate-500 cursor-not-allowed opacity-80' : 'bg-slate-900 hover:bg-black hover:-translate-y-1'} text-white text-lg flex items-center justify-center gap-2`}>{isSubmitting ? 'Uploading & Submitting...' : <><Check size={24} /> Submit Input</>}</button>
      </div>
    </form>
  );
}

function WorkerTab({ user, tasks, globalFilters, updateTask, isAdminOverride, taskTypeFilter, triggerViewDetails, initialSearch, triggerConfirm }) {
  const [search, setSearch] = useState('');
  useEffect(() => { if (initialSearch) setSearch(initialSearch); }, [initialSearch]);
  
  // Memoized local logic combined with global filters for max performance
  const myAssignedAll = useMemo(() => tasks.filter(t => t.assignedTo.includes(user.id)), [tasks, user.id]);
  const compStat = useMemo(() => myAssignedAll.filter(t => t.officerStatuses && t.officerStatuses[user.id] === 'Completed').length, [myAssignedAll, user.id]);
  
  const filtered = useFilteredTasks(myAssignedAll, globalFilters, search, null);
  const typeFiltered = useMemo(() => filtered.filter(t => (t.taskType || 'input') === taskTypeFilter), [filtered, taskTypeFilter]);

  const todo = typeFiltered.filter(t => t.status !== 'Unsolved' && (!t.officerStatuses[user.id] || t.officerStatuses[user.id] === 'Pending'));
  const inProg = typeFiltered.filter(t => t.status !== 'Unsolved' && (t.officerStatuses[user.id] === 'Received' || t.officerStatuses[user.id] === 'In Progress'));
  const comp = typeFiltered.filter(t => t.status !== 'Unsolved' && t.officerStatuses[user.id] === 'Completed');
  const unsolved = typeFiltered.filter(t => t.status === 'Unsolved');

  return (
    <div className="space-y-6">
      <AwarenessGraph total={myAssignedAll.length} completed={compStat} />
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search tasks by subject, name, ID, mobile..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Column title="New / Pending" count={todo.length} color="slate">
          {todo.map(t => <WorkerTaskCard key={t.id} task={t} user={user} updateTask={updateTask} isAdminOverride={isAdminOverride} triggerViewDetails={triggerViewDetails} triggerConfirm={triggerConfirm} />)}
        </Column>
        <Column title="In Progress" count={inProg.length} color="blue">
          {inProg.map(t => <WorkerTaskCard key={t.id} task={t} user={user} updateTask={updateTask} isAdminOverride={isAdminOverride} triggerViewDetails={triggerViewDetails} triggerConfirm={triggerConfirm} />)}
        </Column>
        <Column title="Completed" count={comp.length} color="green">
          {comp.map(t => <WorkerTaskCard key={t.id} task={t} user={user} updateTask={updateTask} isAdminOverride={isAdminOverride} triggerViewDetails={triggerViewDetails} triggerConfirm={triggerConfirm} />)}
          {unsolved.length > 0 && <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-300">
            <h4 className="font-bold text-slate-500 mb-4 uppercase tracking-widest text-xs text-center">Unsolved / Closed</h4>
            {unsolved.map(t => <WorkerTaskCard key={t.id} task={t} user={user} updateTask={updateTask} isUnsolved isAdminOverride={isAdminOverride} triggerViewDetails={triggerViewDetails} triggerConfirm={triggerConfirm} />)}
          </div>}
        </Column>
      </div>
    </div>
  );
}

function Column({ title, count, color, children }) {
  const colorMap = { slate: 'border-slate-200 text-slate-700 bg-slate-100', blue: 'border-blue-200 text-blue-700 bg-blue-100', green: 'border-green-200 text-green-700 bg-green-100' };
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col h-[800px] overflow-hidden">
      <h3 className="font-bold text-lg mb-4 flex items-center justify-between pb-3 border-b border-slate-200"><span className="text-slate-800">{title}</span><span className={`text-xs px-2.5 py-1 rounded-full font-black border ${colorMap[color]}`}>{count}</span></h3>
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 custom-scrollbar">{children}{React.Children.count(children) === 0 && <div className="text-center text-sm font-medium text-slate-400 mt-10">No tasks here</div>}</div>
    </div>
  );
}

// Wrapping card in React.memo for extreme list rendering optimization
const WorkerTaskCard = React.memo(({ task, user, updateTask, isUnsolved, isAdminOverride, triggerViewDetails, triggerConfirm }) => {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [updateText, setUpdateText] = useState('');
  
  const status = task.officerStatuses[user.id] || 'Pending';

  const changeStatus = (newStatus, customTimelineEvent = null) => {
    const newOffStat = { ...task.officerStatuses, [user.id]: newStatus };
    const allAssigned = task.assignedTo.map(id => newOffStat[id] || 'Pending');
    let globStat = task.status;
    if (newStatus === 'Completed') globStat = allAssigned.every(s => s === 'Completed') ? 'Completed' : 'In Progress';
    else if (newStatus === 'In Progress' || newStatus === 'Received') if (globStat === 'Pending') globStat = 'In Progress';

    const ev = customTimelineEvent || { id: generateUid(), type: newStatus.toLowerCase(), time: getNow(), by: user.name, text: `Marked as ${newStatus}` };
    updateTask(task.id, { officerStatuses: newOffStat, status: globStat, timeline: [...task.timeline, ev] });
  };

  const handleSaveUpdate = () => {
    if(!updateText.trim()) return;
    const ev = { id: generateUid(), type: 'update', time: getNow(), by: user.name, text: updateText };
    if (status !== 'In Progress') changeStatus('In Progress', ev);
    else updateTask(task.id, { timeline: [...task.timeline, ev] });
    setUpdateText(''); setShowProgressModal(false);
  };

  const deleteUpdate = (uid) => { triggerConfirm("Delete Timeline Note", "Are you sure you want to delete this specific progress entry from the history?", () => { updateTask(task.id, { timeline: task.timeline.filter(tl => tl.id !== uid) }); }, true, "Delete Update"); };

  const myUpdates = task.timeline.filter(tl => tl.type === 'update' && (tl.by === user.name || isAdminOverride)).sort((a,b)=> new Date(b.time) - new Date(a.time));

  const generateGCalLink = () => {
    if(!task.programDate) return '#';
    const s = new Date(task.programDate); const e = new Date(s.getTime() + 60*60*1000); const fmt = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const det = `Inviter: ${task.personalDetails.name}\nPhone: ${task.personalDetails.mobileNumber}\nRef ID: ${task.id}\n\nSubject: ${task.subject}\n${task.description}`;
    const loc = `${task.personalDetails.place || ''}, ${task.personalDetails.panchayat || ''}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Invitation:+${encodeURIComponent(task.subject)}&dates=${fmt(s)}/${fmt(e)}&details=${encodeURIComponent(det)}&location=${encodeURIComponent(loc)}`;
  };

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border ${isUnsolved ? 'border-slate-300 opacity-60 bg-slate-50 grayscale' : status === 'Pending' ? 'border-red-200' : 'border-slate-200'} relative`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-2">
          <span className="bg-slate-800 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">{task.id}</span>
          <span className={`${task.taskType==='direct'?'bg-indigo-50 text-indigo-800 border-indigo-200':'bg-blue-50 text-blue-800 border-blue-200'} text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wide truncate max-w-[120px]`}>{task.category}</span>
        </div>
        <span className="text-xs font-bold text-slate-400">{formatDate(task.createdAt)}</span>
      </div>
      <h4 className="font-bold text-slate-800 text-base mb-1 line-clamp-2">{task.subject || task.personalDetails.name}</h4>
      <p className="text-xs font-black text-indigo-600 mb-2 uppercase tracking-widest">{task.personalDetails.name} {task.personalDetails.referralPerson && `(Ref: ${task.personalDetails.referralPerson})`}</p>
      <p className="text-xs font-medium text-slate-500 mb-3">{task.personalDetails.mobileNumber} • {task.personalDetails.place || 'No place'}</p>
      {task.description && <div className="bg-slate-50 p-3 rounded-xl text-sm font-medium text-slate-700 line-clamp-3 border border-slate-100 mb-3 whitespace-pre-wrap" title={task.description}>{task.description}</div>}

      {(task.attachment || (task.attachments && task.attachments.length > 0)) && (
        <div className="mb-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-900 truncate">
            <ExternalLink size={14} className="shrink-0 text-indigo-600" />
            <span className="text-xs font-bold truncate" title={task.attachments?.length > 0 ? `${task.attachments.length} Attached Links` : task.attachment?.name}>{task.attachments?.length > 0 ? `${task.attachments.length} Attached Links` : task.attachment?.name}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {task.attachment && <a href={task.attachment.url} target="_blank" rel="noreferrer" className="shrink-0 px-3 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-[10px] font-black text-center uppercase tracking-wider transition-colors flex items-center justify-center gap-1"><Eye size={10} /> View</a>}
            {task.attachments?.map((att, idx) => (
              <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="shrink-0 px-3 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-[10px] font-black text-center uppercase tracking-wider transition-colors flex items-center justify-center gap-1"><Eye size={10} /> Link {idx + 1}</a>
            ))}
          </div>
        </div>
      )}

      {task.category === 'Invitation' && task.programDate && (
        <a href={generateGCalLink()} target="_blank" rel="noreferrer" className="mb-4 block bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold px-3 py-2 rounded-xl text-xs text-center flex items-center justify-center gap-2 transition-colors">
          <CalendarPlus size={16}/> Add to Google Calendar
        </a>
      )}

      {!isUnsolved && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          {status === 'Pending' && <button onClick={() => changeStatus('Received')} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-colors w-full">Receive Task</button>}
          {(status === 'Received' || status === 'In Progress') && (
            <div className="w-full space-y-2">
              <button onClick={() => setShowProgressModal(true)} className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-black hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                <Activity size={16}/> {status === 'Received' ? 'Start Progress' : 'Add Progress Update'}
              </button>
              <button onClick={() => { triggerConfirm("Confirm Task Completion", `Are you sure you want to mark task ID ${task.id} as completely solved?`, () => changeStatus('Completed'), false, "Mark Completed"); }} className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-black transition-colors shadow-sm flex items-center justify-center gap-2">
                <CheckCircle size={16}/> Mark Completed
              </button>
            </div>
          )}
          {status === 'Completed' && <button onClick={() => changeStatus('In Progress', {id: generateUid(), type: 'reverted', time: getNow(), by: user.name, text: 'Reverted to Progress'})} className="w-full bg-orange-100 text-orange-700 border border-orange-300 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"><ArrowDownUp size={14}/> Revert to Progress</button>}
        </div>
      )}

      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
        <button onClick={() => triggerViewDetails(task)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"><Eye size={14}/> View Full Details</button>
      </div>

      {myUpdates.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Progress</p>
          {myUpdates.slice(0, 2).map(up => (
            <div key={up.id} className="bg-amber-50 p-2 rounded-lg border border-amber-100 text-xs font-medium text-slate-700 relative group pr-6 line-clamp-2">
              <span className="font-bold text-amber-800 mr-1">{formatDate(up.time)}:</span> {up.text}
              <button onClick={()=>deleteUpdate(up.id)} className="absolute right-1 top-1/2 -translate-y-1/2 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 p-1"><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
      )}
      {showProgressModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center"><h3 className="font-black text-lg">Enter Progress Update</h3><button onClick={() => setShowProgressModal(false)}><X size={20}/></button></div>
            <div className="p-6"><textarea autoFocus value={updateText} onChange={e=>setUpdateText(e.target.value)} placeholder="What step did you take?..." className="w-full px-4 py-3 border border-slate-300 rounded-xl font-medium outline-none focus:border-blue-500 h-32"></textarea><button onClick={handleSaveUpdate} className="w-full mt-4 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition-colors">Save Update</button></div>
          </div>
        </div>
      )}
    </div>
  );
});

function AllTasksHistoryTab({ tasks, globalFilters, categories, triggerPrint, triggerDownloadPDF, triggerDetailsPrint, triggerDetailsDownload, triggerViewDetails, currentUser, updateTask, deleteTask, users }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(50); // DOM Pagination Limit
  
  const sortedCategories = useMemo(() => { return [...categories].sort((a,b)=>a.localeCompare(b)); }, [categories]);

  const filtered = useFilteredTasks(tasks, globalFilters, search, catFilter);
  const displayed = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  
  const handleSendWA = (t) => {
    const num = t.personalDetails?.whatsappNumber || t.personalDetails?.mobileNumber;
    const waNum = formatWhatsAppNumber(num);
    if (!waNum) { alert('No valid mobile number found for this citizen.'); return; }
    const waMessage = `പ്രിയപ്പെട്ട ${t.personalDetails.name},\n\nതാങ്കൾ പി.കെ നവാസ് എം.എൽ.എ യുടെ ഓഫീസുമായി ബന്ധപ്പെട്ടതിന് നന്ദി. നിങ്ങളുടെ അപേക്ഷ/പരാതി ഔദ്യോഗികമായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്.\n\n*വിഷയം:* ${t.subject}\n*റഫറൻസ് ഐഡി:* ${t.id}\n\n\nസ്നേഹത്തോടെ,\nഎം.എൽ.എ ഓഫീസ്, താനൂർ.ഫോൺ: 9037032002`;
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(waMessage)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex gap-4 flex-wrap">
        <input type="text" placeholder="Search history by Subject, Name, ID, Mobile..." value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 min-w-[250px] px-4 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:border-blue-500" />
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-xl font-medium outline-none bg-white font-bold text-slate-700">
          <option value="All">All Categories</option>
          {sortedCategories.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="Direct Assignment">Direct Assignments</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
          <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase text-xs tracking-widest font-black"><tr><th className="px-4 py-3">ID & Date</th><th className="px-4 py-3">Subject & Citizen</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {displayed.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 font-medium">
                <td className="px-4 py-3"><span className="font-black text-slate-800">{t.id}</span><br/><span className="text-xs text-slate-400">{formatDate(t.createdAt)}</span></td>
                <td className="px-4 py-3"><span className="font-bold text-slate-800 max-w-[200px] truncate block">{t.subject || '-'}</span><span className="text-xs text-slate-500">{t.personalDetails.name} • {t.personalDetails.mobileNumber}</span></td>
                <td className="px-4 py-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{t.category}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-black uppercase ${t.status==='Completed'?'bg-green-100 text-green-700':t.status==='In Progress'?'bg-amber-100 text-amber-700':t.status==='Unsolved'?'bg-slate-200 text-slate-500':'bg-red-100 text-red-700'}`}>{t.status}</span></td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <button onClick={()=>{ triggerViewDetails(t); }} title="Detailed Report" className="text-slate-600 hover:bg-slate-200 p-2 rounded-lg transition-colors bg-slate-100"><Eye size={16}/></button>
                  <button onClick={() => handleSendWA(t)} title="Send WhatsApp Acknowledgement" className="text-green-600 hover:bg-green-100 p-2 rounded-lg transition-colors bg-green-50"><Send size={16}/></button>
                  <button onClick={()=>triggerPrint(t)} title="Print Slip" className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors bg-blue-50"><Printer size={16}/></button>
                  <button onClick={()=>{ triggerDownloadPDF(t); }} title="Download Slip PDF" className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-colors bg-indigo-50"><Download size={16}/></button>
                  {(currentUser.role === 'admin' || t.status === 'Pending') && (
                    <button onClick={()=>{ deleteTask(t.id); }} title="Delete Input" className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors bg-red-50"><Trash2 size={16}/></button>
                  )}
                </td>
              </tr>
            ))}
            {displayed.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-slate-500">No records found.</td></tr>}
          </tbody>
        </table>
        {visibleCount < filtered.length && (
          <div className="py-4 text-center">
            <button onClick={() => setVisibleCount(v => v + 50)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-sm transition-colors shadow-sm">Load More Records ({filtered.length - visibleCount} remaining)</button>
          </div>
        )}
      </div>
    </div>
  );
}


// --- SUPER ADMIN DASHBOARD ---
function AdminDashboard({ tasks, updateTask, deleteTask, categories, designations, users, updateUserDoc, addUser, deleteUser, setImpersonatedUser, triggerPrint, triggerDownloadPDF, triggerDetailsPrint, triggerDetailsDownload, triggerViewDetails, triggerMasterReport, triggerMasterDownload, triggerOfficerReport, triggerOfficerDownload, addTask, addCategory, addDesignation, backupMeta, updateBackupMeta, triggerCitizenPrint, triggerCitizenDownload, triggerConfirm, globalFilters, loadArchive }) {
  const [activeTab, setActiveTab] = useState('alerts');
  const [globalSearch, setGlobalSearch] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [officerModalOpen, setOfficerModalOpen] = useState(null);

  const jumpToTask = (tab, taskId) => { setGlobalSearch(taskId); setActiveTab(tab === 'tasks' ? 'overview' : tab); };

  const analyticsTasks = useFilteredTasks(tasks, globalFilters, '', null);
  const total = useMemo(() => analyticsTasks.filter(t=>t.taskType!=='direct').length, [analyticsTasks]);
  const comp = useMemo(() => analyticsTasks.filter(t=>t.taskType!=='direct' && t.status==='Completed').length, [analyticsTasks]);
  const pend = useMemo(() => analyticsTasks.filter(t=>t.taskType!=='direct' && t.status==='Pending').length, [analyticsTasks]);
  
  const uniqueVisitors = useMemo(() => {
    const phones = new Set();
    analyticsTasks.forEach(t => { if (t.taskType !== 'direct' && t.personalDetails?.mobileNumber) phones.add(t.personalDetails.mobileNumber.replace(/\D/g, '')); });
    return phones.size;
  }, [analyticsTasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-fit print-hidden">
        <button onClick={() => { setActiveTab('alerts'); setGlobalSearch(''); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'alerts' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Bell size={16}/> Recent Assignments</button>
        <button onClick={() => { setActiveTab('overview'); setGlobalSearch(''); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>Global Overview</button>
        <button onClick={() => { setActiveTab('input'); setGlobalSearch(''); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'input' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Plus size={16}/> Register Input</button>
        <button onClick={() => { setActiveTab('citizens'); setGlobalSearch(''); loadArchive(); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'citizens' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Users size={16}/> Citizen Info</button>
        <button onClick={() => { setActiveTab('direct'); setGlobalSearch(''); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'direct' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Zap size={16}/> Direct Assignments</button>
        <button onClick={() => { setActiveTab('users'); setGlobalSearch(''); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Eye size={16}/> Manage Officers</button>
        <button onClick={() => { setActiveTab('database'); setGlobalSearch(''); loadArchive(); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'database' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Database size={16}/> DB & Backup</button>
      </div>

      {activeTab === 'alerts' && <RecentAlertsTab user={users.find(u=>u.role==='admin')} tasks={tasks} jumpToTask={jumpToTask} />}
      
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div><h2 className="text-xl font-black text-slate-800">Analytics Dashboard</h2><p className="text-sm font-medium text-slate-500">System wide tracking for active filters</p></div>
            <button onClick={() => { setReportModalOpen(true); loadArchive(); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow flex items-center gap-2 transition-colors">
              <FileOutput size={18}/> Generate Master Report
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Inputs" value={total} color="blue" icon={<FileText size={24}/>}/>
            <StatCard title="Total Visitors" value={uniqueVisitors} color="indigo" icon={<Users size={24}/>}/>
            <StatCard title="Completed" value={comp} color="green" icon={<CheckCircle size={24}/>}/>
            <StatCard title="Pending" value={pend} color="red" icon={<Clock size={24}/>}/>
          </div>
          <AdminGlobalView tasks={tasks.filter(t=>(t.taskType||'input')==='input')} globalFilters={globalFilters} updateTask={updateTask} deleteTask={deleteTask} users={users} triggerPrint={triggerPrint} triggerDetailsPrint={triggerDetailsPrint} triggerViewDetails={triggerViewDetails} triggerDownloadPDF={triggerDownloadPDF} triggerDetailsDownload={triggerDetailsDownload} categories={categories} initialSearch={globalSearch} triggerConfirm={triggerConfirm} />
        </div>
      )}

      {activeTab === 'input' && <InputFormTab tasks={tasks} addTask={addTask} categories={categories} designations={designations} addCategory={addCategory} addDesignation={addDesignation} users={users} triggerPrint={triggerPrint} triggerDownloadPDF={triggerDownloadPDF} creator={users.find(u=>u.role==='admin')} />}
      {activeTab === 'citizens' && <AdminCitizenDirectory tasks={tasks} triggerCitizenPrint={triggerCitizenPrint} triggerDownloadPDF={triggerCitizenDownload} />}
      {activeTab === 'direct' && <AdminDirectAssignments users={users} tasks={tasks} globalFilters={globalFilters} addTask={addTask} triggerPrint={triggerPrint} triggerDetailsPrint={triggerDetailsPrint} triggerViewDetails={triggerViewDetails} triggerDownloadPDF={triggerDownloadPDF} triggerDetailsDownload={triggerDetailsDownload} updateTask={updateTask} deleteTask={deleteTask} initialSearch={globalSearch} triggerConfirm={triggerConfirm} />}
      {activeTab === 'users' && <AdminSettings users={users} updateUserDoc={updateUserDoc} addUser={addUser} deleteUser={deleteUser} setImpersonatedUser={setImpersonatedUser} setOfficerModalOpen={setOfficerModalOpen} loadArchive={loadArchive} />}
      {activeTab === 'database' && <AdminDatabase tasks={tasks} users={users} backupMeta={backupMeta} updateBackupMeta={updateBackupMeta} triggerConfirm={triggerConfirm} />}
      
      {reportModalOpen && <ReportConfigModal onClose={()=>setReportModalOpen(false)} onGenerate={(config) => { setReportModalOpen(false); triggerMasterReport(config); }} triggerDownloadPDF={(config) => { setReportModalOpen(false); triggerMasterDownload(config); }} />}
      {officerModalOpen && <OfficerReportConfigModal officer={officerModalOpen} onClose={()=>setOfficerModalOpen(null)} onGenerate={(config) => { setOfficerModalOpen(null); triggerOfficerReport(config); }} triggerDownloadPDF={(config) => { setOfficerModalOpen(null); triggerOfficerDownload(config); }} />}
    </div>
  );
}

function AdminCitizenDirectory({ tasks, triggerCitizenPrint, triggerDownloadPDF }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('visits'); 
  const [visibleCount, setVisibleCount] = useState(50);
  
  const citizensData = useMemo(() => {
    const map = new Map();
    tasks.forEach(t => {
      if (t.taskType === 'direct') return;
      const phone = t.personalDetails?.mobileNumber;
      if (!phone) return;
      if (!map.has(phone)) map.set(phone, { ...t.personalDetails, visits: 1, lastVisit: t.createdAt });
      else {
        const ex = map.get(phone); ex.visits += 1;
        if (new Date(t.createdAt) > new Date(ex.lastVisit)) ex.lastVisit = t.createdAt;
      }
    });
    return Array.from(map.values()).sort((a,b) => {
      if (sortBy === 'visits') return b.visits - a.visits;
      if (sortBy === 'recent') return new Date(b.lastVisit) - new Date(a.lastVisit);
      return a.name.localeCompare(b.name);
    }).filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.mobileNumber.includes(search) || (c.place||'').toLowerCase().includes(search.toLowerCase()));
  }, [tasks, search, sortBy]);

  const displayed = useMemo(() => citizensData.slice(0, visibleCount), [citizensData, visibleCount]);

  const handleDownloadCSV = () => {
    const headers = ['Name', 'Designation', 'Gender', 'Mobile Number', 'WhatsApp', 'House Name', 'Place', 'Post Office', 'PIN Code', 'Local Body', 'Ward', 'Total Visits', 'Last Visit'];
    const rows = citizensData.map(c => [ c.name, c.designation||'-', c.gender||'-', c.mobileNumber, c.whatsappNumber||'-', c.houseName||'-', c.place||'-', c.postOffice||'-', c.pinCode||'-', (c.localBody || c.panchayat || '-'), c.wardNumber||'-', c.visits, formatDate(c.lastVisit) ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(f=>`"${f}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.setAttribute('href', url); link.setAttribute('download', `Citizen_Directory_${new Date().toISOString()}.csv`); link.click();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div><h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Users className="text-teal-600"/> Citizen Visit Directory</h2><p className="text-slate-500 font-medium mt-1">Track frequency of citizen visits based on registered mobile numbers.</p></div>
        <div className="flex gap-2">
          <button onClick={handleDownloadCSV} className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-teal-200"><List size={16}/> Export CSV</button>
          <button onClick={() => triggerCitizenPrint(citizensData)} className="bg-slate-800 text-white hover:bg-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"><Printer size={16}/> Print</button>
          <button onClick={() => triggerDownloadPDF(citizensData)} className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"><Download size={16}/> PDF</button>
        </div>
      </div>
      <div className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search by Name, Mobile, Place..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-2 bg-white border border-slate-200 rounded-lg font-medium outline-none focus:border-teal-500" /></div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-teal-500"><option value="visits">Sort by Most Visits</option><option value="recent">Sort by Most Recent</option><option value="name">Sort Alphabetically</option></select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
          <thead className="bg-slate-100 border-y border-slate-200 text-slate-500 uppercase text-xs tracking-widest font-black"><tr><th className="px-4 py-3">Citizen Name & Desig.</th><th className="px-4 py-3">Contact Info</th><th className="px-4 py-3">Location / Address</th><th className="px-4 py-3 text-center">Total Visits</th><th className="px-4 py-3">Last Visit Date</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {displayed.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3"><span className="font-bold text-slate-800 text-base">{c.name}</span>{c.gender && <span className="text-[10px] text-slate-500 ml-2">({c.gender})</span>}{c.designation && <span className="block text-xs text-teal-600 font-bold uppercase tracking-wider">{c.designation}</span>}</td>
                <td className="px-4 py-3 font-medium text-slate-600"><span className="flex items-center gap-1.5"><Phone size={12}/> {c.mobileNumber}</span>{c.whatsappNumber && <span className="flex items-center gap-1.5 mt-1 text-green-600"><MessageSquare size={12}/> {c.whatsappNumber}</span>}</td>
                <td className="px-4 py-3 text-xs font-medium text-slate-500"><span className="block text-slate-700 font-bold">{c.place || '-'}, PO: {c.postOffice || '-'}, PIN: {c.pinCode || '-'}, {c.localBody || c.panchayat || '-'}</span>{c.houseName && <span>{c.houseName} </span>} {c.wardNumber && <span>(Ward: {c.wardNumber})</span>}</td>
                <td className="px-4 py-3 text-center"><span className="bg-slate-800 text-white font-black px-3 py-1 rounded-full">{c.visits}</span></td>
                <td className="px-4 py-3 text-xs font-bold text-slate-500">{formatDate(c.lastVisit)}</td>
              </tr>
            ))}
            {displayed.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-slate-500 font-medium">No citizens match search criteria.</td></tr>}
          </tbody>
        </table>
        {visibleCount < citizensData.length && (
          <div className="py-4 text-center">
            <button onClick={() => setVisibleCount(v => v + 50)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-sm transition-colors shadow-sm">Load More Directory ({citizensData.length - visibleCount} remaining)</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminSettings({ users, updateUserDoc, addUser, deleteUser, setImpersonatedUser, setOfficerModalOpen, loadArchive }) {
  const [newOffForm, setNewOffForm] = useState({ name: '', pass: '', phone: '', whatsapp: '', canInput: false, canSeeReports: false });

  const handleToggle = (id, field) => { const u = users.find(u => u.id === id); updateUserDoc(id, field, !u[field]); };
  const handleChange = (id, field, value) => updateUserDoc(id, field, value);

  const handleAddOfficer = async (e) => {
    e.preventDefault(); if (!newOffForm.name || !newOffForm.pass) return alert("Name and password are required.");
    const newId = 'off_' + generateUid();
    const newUser = { id: newId, role: 'officer', enabled: true, name: newOffForm.name, pass: newOffForm.pass, phone: newOffForm.phone, whatsapp: newOffForm.whatsapp, canInput: newOffForm.canInput, canSeeReports: newOffForm.canSeeReports };
    await addUser(newUser); setNewOffForm({ name: '', pass: '', phone: '', whatsapp: '', canInput: false, canSeeReports: false }); alert("New officer successfully created.");
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in">
      <div className="mb-8 border-b border-slate-100 pb-6"><h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Users className="text-indigo-600"/> Manage Officers & Permissions</h2></div>
      <div className="space-y-6 mb-10">
        {users.map(u => (
          <div key={u.id} className={`p-6 rounded-2xl border transition-all relative ${!u.enabled ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
            {u.role === 'admin' && <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-1 rounded uppercase">ADMIN</div>}
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center justify-between"><span className="font-black text-lg text-slate-800">{u.name}</span>{u.role !== 'admin' && <button onClick={() => handleToggle(u.id, 'enabled')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${u.enabled ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{u.enabled ? 'Disable' : 'Enable'}</button>}</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Display Name</label><input type="text" value={u.name} onChange={e=>handleChange(u.id, 'name', e.target.value)} disabled={!u.enabled} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold outline-none focus:border-indigo-500 disabled:bg-slate-100"/></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Password</label><input type="text" value={u.pass} onChange={e=>handleChange(u.id, 'pass', e.target.value)} disabled={!u.enabled} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 outline-none focus:border-indigo-500 disabled:bg-slate-100"/></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Phone Number</label><input type="text" value={u.phone} onChange={e=>handleChange(u.id, 'phone', e.target.value)} disabled={!u.enabled} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold outline-none focus:border-indigo-500"/></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">WhatsApp Number</label><input type="text" value={u.whatsapp} onChange={e=>handleChange(u.id, 'whatsapp', e.target.value)} disabled={!u.enabled} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold outline-none focus:border-indigo-500"/></div>
                </div>
              </div>
              <div className="flex-1 w-full lg:w-auto flex flex-col gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Capabilities</h4>
                  <label className="flex items-center justify-between cursor-pointer"><span className="text-sm font-bold text-slate-700">Can Input</span><input type="checkbox" checked={u.canInput} onChange={()=>handleToggle(u.id, 'canInput')} disabled={u.role==='admin'} className="w-4 h-4 disabled:opacity-50"/></label>
                  <label className="flex items-center justify-between cursor-pointer"><span className="text-sm font-bold text-slate-700">Detailed Reports</span><input type="checkbox" checked={u.canSeeReports} onChange={()=>handleToggle(u.id, 'canSeeReports')} disabled={u.role==='admin'} className="w-4 h-4 disabled:opacity-50"/></label>
                </div>
                <div className="flex flex-wrap gap-2">
                   {u.role !== 'admin' && <button onClick={() => setImpersonatedUser(u)} className="flex-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 py-2 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">Enter Profile</button>}
                   <button onClick={() => { loadArchive(); setOfficerModalOpen(u); }} className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 border border-slate-300 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"><FileOutput size={12}/> Report</button>
                   {u.role !== 'admin' && <button onClick={() => deleteUser(u.id)} className="flex-1 text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"><Trash2 size={12}/> Delete</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl">
        <h3 className="text-lg font-black text-indigo-900 mb-4 flex items-center gap-2"><Plus size={18}/> Create New Officer</h3>
        <form onSubmit={handleAddOfficer} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div><label className="text-[10px] font-bold text-indigo-700 uppercase block mb-1">Display Name</label><input required type="text" value={newOffForm.name} onChange={e=>setNewOffForm({...newOffForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Officer 6" /></div>
          <div><label className="text-[10px] font-bold text-indigo-700 uppercase block mb-1">Password</label><input required type="text" value={newOffForm.pass} onChange={e=>setNewOffForm({...newOffForm, pass: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Secure Password" /></div>
          <div className="col-span-1 md:col-span-2 flex items-center gap-4 bg-white p-2 rounded-lg border border-indigo-200">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-indigo-900"><input type="checkbox" checked={newOffForm.canInput} onChange={e=>setNewOffForm({...newOffForm, canInput: e.target.checked})} className="rounded text-indigo-600"/> Can Input</label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-indigo-900"><input type="checkbox" checked={newOffForm.canSeeReports} onChange={e=>setNewOffForm({...newOffForm, canSeeReports: e.target.checked})} className="rounded text-indigo-600"/> Reports Access</label>
            <button type="submit" className="ml-auto bg-indigo-600 text-white px-4 py-1.5 rounded-md font-bold text-sm hover:bg-indigo-700 transition-colors">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminDatabase({ tasks, users, backupMeta, updateBackupMeta, triggerConfirm }) {
  const [backupTarget, setBackupTarget] = useState('all');
  const [resetTarget, setResetTarget] = useState('all');
  const [resetText, setResetText] = useState('');

  const handleBackup = async () => {
    const exportData = backupTarget === 'all' ? tasks : tasks.filter(t => t.assignedTo.includes(backupTarget));
    if (exportData.length === 0) return alert("No data to backup for this selection.");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", `MLA_Backup_${backupTarget}_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove();
    const targetName = backupTarget === 'all' ? 'All Data' : users.find(u=>u.id===backupTarget)?.name;
    await updateBackupMeta({ lastBackup: getNow(), lastBackupType: targetName });
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result); if (!Array.isArray(data)) return alert("Invalid Backup File Format.");
        triggerConfirm("Confirm File Import", `Are you sure you want to restore ${data.length} records into your database? Note that files with existing matching IDs will be rewritten.`, async () => {
          let count = 0;
          for (const task of data) {
            if (task.id) {
               const targetCol = (task.status === 'Completed' || task.status === 'Unsolved') ? 'archived_tasks' : 'tasks';
               await setDoc(getDocRef(targetCol, task.id), task); count++; 
            }
          }
          await updateBackupMeta({ lastImport: getNow(), lastImportCount: count });
          alert(`Successfully imported and updated ${count} records!`);
        }, false, "Import Data");
        e.target.value = null;
      } catch(err) { alert("Error parsing JSON file. Make sure it's a valid backup file."); e.target.value = null; }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    const targetName = resetTarget === 'all' ? 'All' : users.find(u=>u.id===resetTarget)?.name;
    const expectedPhrase = resetTarget === 'all' ? 'Delete Data All' : `Delete Data of ${targetName}`;
    if (resetText !== expectedPhrase) return alert(`Verification text does not match! You must type exactly:\n${expectedPhrase}`);
    triggerConfirm("PERMANENT DATABASE ERASE WARNING", `You are performing a highly critical action. Erasing ${targetName} data is permanent. Are you absolutely certain you want to proceed?`, async () => {
      const tasksToDelete = resetTarget === 'all' ? tasks : tasks.filter(t => t.assignedTo.includes(resetTarget));
      let count = 0;
      for (const t of tasksToDelete) {
         const targetCol = (t.status === 'Completed' || t.status === 'Unsolved') ? 'archived_tasks' : 'tasks';
         await deleteDoc(getDocRef(targetCol, t.id)); count++;
      }
      setResetText(''); alert(`Successfully cleared ${count} records from database.`);
    }, true, "Permanently Erase");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-6"><Download className="text-blue-600"/> Data Backup (Export JSON)</h2>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Select Data to Backup</label><select value={backupTarget} onChange={e=>setBackupTarget(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 mb-4"><option value="all">Entire Database (All Officers & Admin)</option>{users.map(u => <option key={u.id} value={u.id}>Only {u.name}'s Data</option>)}</select><button onClick={handleBackup} className="bg-blue-600 text-white font-black py-3 px-6 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow"><Download size={18}/> Generate & Download JSON</button></div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 h-full flex flex-col justify-center"><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Last Backup Information</p>{backupMeta?.lastBackup ? (<><p className="font-bold text-blue-900 text-lg">{formatDate(backupMeta.lastBackup)}</p><p className="text-sm font-medium text-blue-700">Type: <span className="font-bold">{backupMeta.lastBackupType}</span></p></>) : <p className="font-bold text-blue-900">No previous backups recorded.</p>}</div>
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-6"><Upload className="text-indigo-600"/> Data Restore (Import JSON)</h2>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Upload JSON File</label><input type="file" accept=".json" onChange={handleImport} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" /><p className="text-xs font-medium text-slate-500 flex items-center gap-1"><AlertTriangle size={12}/> If importing duplicated IDs, existing records will be perfectly overwritten without loss of new data.</p></div>
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 h-full flex flex-col justify-center"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Last Import Information</p>{backupMeta?.lastImport ? (<><p className="font-bold text-indigo-900 text-lg">{formatDate(backupMeta.lastImport)}</p><p className="text-sm font-medium text-indigo-700">Records Restored: <span className="font-bold">{backupMeta.lastImportCount}</span></p></>) : <p className="font-bold text-indigo-900">No previous imports recorded.</p>}</div>
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border-2 border-red-200 p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 scale-150 text-red-600"><AlertOctagon size={200}/></div><h2 className="text-2xl font-black text-red-700 flex items-center gap-2 mb-6 relative z-10"><AlertOctagon className="text-red-600"/> Danger Zone: System Erase</h2>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 relative z-10">
          <label className="text-xs font-black text-red-500 uppercase tracking-widest block mb-2">Select Data to Delete Permanently</label>
          <select value={resetTarget} onChange={e=>setResetTarget(e.target.value)} className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl font-bold text-red-900 outline-none focus:ring-2 focus:ring-red-500 mb-6"><option value="all">Entire Database (All Officers & Admin)</option>{users.map(u => <option key={u.id} value={u.id}>Only {u.name}'s Data</option>)}</select>
          <label className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">Type <span className="font-mono bg-red-200 px-1 text-red-800">{resetTarget === 'all' ? 'Delete Data All' : `Delete Data of ${users.find(u=>u.id===resetTarget)?.name}`}</span> to confirm:</label>
          <input type="text" value={resetText} onChange={e=>setResetText(e.target.value)} placeholder="Strict verification text..." className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl font-bold text-red-900 outline-none focus:ring-2 focus:ring-red-500 mb-4" />
          <button onClick={handleReset} className="w-full bg-red-600 text-white font-black py-3 px-6 rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 shadow"><Trash2 size={18}/> PERMANENTLY DELETE DATA</button>
        </div>
      </div>
    </div>
  );
}

function ReportConfigModal({ onClose, onGenerate, triggerDownloadPDF }) {
  const [range, setRange] = useState('all'); const [customStart, setCustomStart] = useState(''); const [customEnd, setCustomEnd] = useState('');
  const handleGenerate = (isDownload) => { const conf = { range, customStart, customEnd }; if (isDownload) triggerDownloadPDF(conf); else onGenerate(conf); };
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center"><h3 className="font-black text-lg flex items-center gap-2"><FileOutput size={20}/> Generate Master Report</h3><button onClick={onClose}><X size={20}/></button></div>
        <div className="p-6 space-y-6">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Time Duration</label>
            <select value={range} onChange={e=>setRange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option value="all">All Time</option><option value="1week">Last 1 Week</option><option value="1month">Last 1 Month</option><option value="6months">Last 6 Months</option><option value="custom">Custom Date Range</option></select>
          </div>
          {range === 'custom' && (<div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black text-slate-500 uppercase">From</label><input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="w-full border p-2 rounded-lg font-bold text-sm"/></div><div><label className="text-[10px] font-black text-slate-500 uppercase">To</label><input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="w-full border p-2 rounded-lg font-bold text-sm"/></div></div>)}
          <div className="flex gap-3"><button onClick={() => handleGenerate(false)} className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow transition-colors"><Printer size={18}/> Print</button><button onClick={() => handleGenerate(true)} className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-black flex items-center justify-center gap-2 shadow transition-colors"><Download size={18}/> PDF</button></div>
        </div>
      </div>
    </div>
  );
}

function OfficerReportConfigModal({ officer, onClose, onGenerate, triggerDownloadPDF }) {
  const [range, setRange] = useState('all'); const [customStart, setCustomStart] = useState(''); const [customEnd, setCustomEnd] = useState('');
  const handleGenerate = (isDownload) => { const conf = { officer, range, customStart, customEnd }; if (isDownload) triggerDownloadPDF(conf); else onGenerate(conf); };
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center"><h3 className="font-black text-lg flex items-center gap-2"><FileOutput size={20}/> Officer Report: {officer.name}</h3><button onClick={onClose}><X size={20}/></button></div>
        <div className="p-6 space-y-6">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Time Duration</label>
            <select value={range} onChange={e=>setRange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option value="all">All Time</option><option value="1week">Last 1 Week</option><option value="1month">Last 1 Month</option><option value="6months">Last 6 Months</option><option value="custom">Custom Date Range</option></select>
          </div>
          {range === 'custom' && (<div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black text-slate-500 uppercase">From</label><input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="w-full border p-2 rounded-lg font-bold text-sm"/></div><div><label className="text-[10px] font-black text-slate-500 uppercase">To</label><input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="w-full border p-2 rounded-lg font-bold text-sm"/></div></div>)}
          <div className="flex gap-3"><button onClick={() => handleGenerate(false)} className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow transition-colors"><Printer size={18}/> Print</button><button onClick={() => handleGenerate(true)} className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-black flex items-center justify-center gap-2 shadow transition-colors"><Download size={18}/> PDF</button></div>
        </div>
      </div>
    </div>
  );
}

function AdminDirectAssignments({ users, tasks, globalFilters, addTask, triggerPrint, triggerDetailsPrint, triggerViewDetails, triggerDownloadPDF, triggerDetailsDownload, updateTask, deleteTask, initialSearch, triggerConfirm }) {
  const [desc, setDesc] = useState(''); const [assignedTo, setAssignedTo] = useState([]);
  const handleAssign = async (e) => {
    e.preventDefault(); if(!desc || assignedTo.length===0) return alert("Fill description and select assignee");
    const taskId = generateId(tasks);
    const newTask = { id: taskId, types: ['Direct Assignment'], category: 'Direct Assignment', taskType: 'direct', subject: 'MLA Assignment', personalDetails: { name: 'Internal Assignment', mobileNumber: 'N/A' }, description: desc, assignedTo, status: 'Pending', priority: 'High', officerStatuses: {}, createdAt: getNow(), createdBy: 'PK Navas', createdByUid: 'admin', timeline: [{ id: generateUid(), type: 'created', time: getNow(), by: 'PK Navas', text: 'Direct Assignment Created' }] };
    await addTask(newTask); setDesc(''); setAssignedTo([]);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAssign} className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl shadow-sm">
        <h3 className="text-xl font-black text-indigo-900 mb-4 flex items-center gap-2"><Zap size={20}/> Create Direct Assignment</h3>
        <div className="grid md:grid-cols-2 gap-6"><textarea required value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Write details of the assignment..." className="w-full p-4 rounded-xl border border-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500 h-32 font-medium"></textarea><div><p className="text-sm font-black text-indigo-800 uppercase mb-3">Assign To Officers:</p><div className="grid grid-cols-2 gap-2 mb-4">{users.map(u => (<label key={u.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-indigo-100 cursor-pointer text-sm font-bold text-indigo-900"><input type="checkbox" checked={assignedTo.includes(u.id)} onChange={()=>setAssignedTo(prev=>prev.includes(u.id)?prev.filter(id=>id!==u.id):[...prev, u.id])} className="rounded text-indigo-600"/> {u.name}</label>))}</div><button type="submit" className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl shadow hover:bg-indigo-700">Assign Work</button></div></div>
      </form>
      <AdminGlobalView tasks={tasks.filter(t=>t.taskType==='direct')} globalFilters={globalFilters} updateTask={updateTask} deleteTask={deleteTask} users={users} triggerPrint={triggerPrint} triggerDetailsPrint={triggerDetailsPrint} triggerViewDetails={triggerViewDetails} triggerDownloadPDF={triggerDownloadPDF} triggerDetailsDownload={triggerDetailsDownload} categories={['Direct Assignment']} initialSearch={initialSearch} triggerConfirm={triggerConfirm} />
    </div>
  );
}

const StatCard = React.memo(({ title, value, color, icon }) => {
  const cMap = { blue: 'bg-blue-50 text-blue-600 border-blue-200', green: 'bg-green-50 text-green-600 border-green-200', amber: 'bg-amber-50 text-amber-600 border-amber-200', red: 'bg-red-50 text-red-600 border-red-200', slate: 'bg-slate-100 text-slate-600 border-slate-300', indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
  return (
    <div className={`p-6 rounded-2xl border ${cMap[color]} relative overflow-hidden shadow-sm flex flex-col justify-between`}>
      <div className="absolute -right-4 -top-4 opacity-10 scale-150">{icon}</div><div className="bg-white/60 w-fit p-3 rounded-xl backdrop-blur-sm mb-4 shadow-sm">{icon}</div>
      <div><p className="text-4xl font-black tracking-tight">{value}</p><p className="text-xs font-black uppercase tracking-widest mt-1 opacity-80">{title}</p></div>
    </div>
  );
});

function AdminGlobalView({ tasks, globalFilters, updateTask, deleteTask, users, triggerPrint, triggerDetailsPrint, triggerViewDetails, triggerDownloadPDF, triggerDetailsDownload, categories, initialSearch, triggerConfirm }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(50); // Pagination Limit DOM render count

  useEffect(() => { if(initialSearch) setSearch(initialSearch); }, [initialSearch]);

  const filtered = useFilteredTasks(tasks, globalFilters, search, catFilter);
  const displayed = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const toggleUnsolved = useCallback((task) => updateTask(task.id, { status: task.status === 'Unsolved' ? 'Pending' : 'Unsolved' }), [updateTask]);
  const togglePriority = useCallback((task) => {
    const p = ['Low', 'Medium', 'High'];
    updateTask(task.id, { priority: p[(p.indexOf(task.priority || 'Medium') + 1) % 3] });
  }, [updateTask]);

  const sortedCategories = useMemo(() => { return [...categories].sort((a,b)=>a.localeCompare(b)); }, [categories]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search entries by Subject, Name, ID, Mobile..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500" /></div>
        {categories && (<select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="px-4 py-2.5 border border-slate-300 rounded-xl font-medium outline-none bg-white focus:ring-2 focus:ring-blue-500 min-w-[150px] font-bold text-slate-700"><option value="All">All Categories</option>{sortedCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayed.map(t => <AdminTaskCard key={t.id} t={t} users={users} toggleUnsolved={toggleUnsolved} togglePriority={togglePriority} triggerViewDetails={triggerViewDetails} deleteTask={deleteTask} /> )}
        {displayed.length === 0 && <div className="col-span-full py-10 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-200">No records found.</div>}
      </div>
      {visibleCount < filtered.length && (
         <div className="py-4 text-center">
            <button onClick={() => setVisibleCount(v => v + 50)} className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full font-bold text-sm transition-colors shadow-sm">Load More ({filtered.length - visibleCount} remaining)</button>
         </div>
      )}
    </div>
  );
}

// Extracted for performance (React.memo avoids re-rendering every card on unrelated state updates)
const AdminTaskCard = React.memo(({ t, users, toggleUnsolved, togglePriority, triggerViewDetails, deleteTask }) => {
  const getPriorityColor = (p) => { if (p === 'High') return 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'; if (p === 'Low') return 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'; return 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'; };
  const getStatusColor = (s) => { if (s === 'Completed') return 'text-green-600'; if (s === 'In Progress') return 'text-amber-600'; if (s === 'Unsolved') return 'text-slate-500'; return 'text-red-600'; };

  return (
    <div className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col transition-all relative overflow-hidden ${t.status === 'Unsolved' ? 'border-slate-300 bg-slate-50 opacity-75 grayscale' : 'border-slate-200 hover:shadow-md hover:border-blue-300'}`}>
      {t.status === 'Unsolved' && <div className="absolute top-4 right-4 bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase z-10"><Lock size={10} className="inline mr-1"/>Unsolved</div>}
      
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${t.taskType === 'direct' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-50 text-blue-800'}`}>{t.id}</span>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 block leading-tight">{formatDate(t.createdAt)}</span>
          <span className="text-[9px] font-semibold text-slate-400 block leading-tight">{formatTime(t.createdAt)}</span>
        </div>
      </div>

      <div className="mb-2 border-b border-slate-100 pb-2">
        <h3 className="font-black text-slate-800 text-base leading-tight mb-1">{t.personalDetails.name}</h3>
        {t.personalDetails.designation && <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{t.personalDetails.designation}</p>}
        <div className="flex gap-2 mt-2">
          <a href={`tel:${t.personalDetails.mobileNumber}`} className="bg-slate-100 p-1.5 rounded-lg text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"><Phone size={14}/></a>
          {t.personalDetails.whatsappNumber && <a href={`https://wa.me/${formatWhatsAppNumber(t.personalDetails.whatsappNumber)}`} target="_blank" rel="noreferrer" className="bg-slate-100 p-1.5 rounded-lg text-slate-600 hover:bg-green-100 hover:text-green-600 transition-colors"><MessageSquare size={14}/></a>}
        </div>
      </div>

      <div className="mb-3">
        <p className="font-bold text-slate-800 text-sm line-clamp-2" title={t.subject}>{t.subject || 'No Subject'}</p>
        <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{t.category}</p>
      </div>

      {(t.attachment || (t.attachments && t.attachments.length > 0)) && (
        <div className="mb-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-900 truncate"><ExternalLink size={14} className="shrink-0 text-indigo-600" /><span className="text-xs font-bold truncate" title={t.attachments?.length > 0 ? `${t.attachments.length} Attached Links` : t.attachment?.name}>{t.attachments?.length > 0 ? `${t.attachments.length} Attached Links` : t.attachment?.name}</span></div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {t.attachment && <a href={t.attachment.url} target="_blank" rel="noreferrer" className="shrink-0 px-3 bg-indigo-600 hover:bg-indigo-700 text-white py-1 rounded text-[10px] font-black text-center uppercase tracking-wider transition-colors flex items-center justify-center gap-1"><Eye size={10}/> View</a>}
            {t.attachments?.map((att, idx) => (
               <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="shrink-0 px-3 bg-indigo-600 hover:bg-indigo-700 text-white py-1 rounded text-[10px] font-black text-center uppercase tracking-wider transition-colors flex items-center justify-center gap-1"><Eye size={10}/> L{idx+1}</a>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-2 mt-auto">
        <div className="flex justify-between items-center text-xs"><span className="text-slate-500 font-bold">Assigned:</span><span className="font-black text-slate-700 text-right truncate max-w-[120px]" title={t.assignedTo.map(id => users.find(u=>u.id===id)?.name || id).join(', ')}>{t.assignedTo.map(id => users.find(u=>u.id===id)?.name || id).join(', ')}</span></div>
        <div className="flex justify-between items-center text-xs"><span className="text-slate-500 font-bold">Status:</span><span className={`font-black uppercase tracking-wider ${getStatusColor(t.status)}`}>{t.status}</span></div>
        <div className="flex justify-between items-center text-xs"><span className="text-slate-500 font-bold">Priority:</span><button onClick={() => togglePriority(t)} className={`font-black uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${getPriorityColor(t.priority || 'Medium')}`}>{t.priority || 'Medium'}</button></div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex gap-2">
        <button onClick={() => triggerViewDetails(t)} className="flex-1 bg-slate-800 text-white font-bold py-2 rounded-xl text-xs hover:bg-black transition-colors flex items-center justify-center gap-1"><Eye size={14}/> Details</button>
        <button onClick={() => toggleUnsolved(t)} className={`px-3 rounded-xl border flex items-center justify-center transition-colors ${t.status==='Unsolved' ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`} title={t.status==='Unsolved' ? "Reopen" : "Mark Unsolved"}>{t.status==='Unsolved' ? <Activity size={14}/> : <UserX size={14}/>}</button>
        <button onClick={() => deleteTask(t.id)} className="px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Delete Permanent"><Trash2 size={14}/></button>
      </div>
    </div>
  );
});
