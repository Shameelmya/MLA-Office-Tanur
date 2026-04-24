import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, User, LogOut, Plus, Search, Filter, BarChart3, 
  Clock, CheckCircle, AlertTriangle, FileText, Calendar, 
  MapPin, Phone, MessageSquare, Printer, Settings, Check, 
  Send, ArrowDownUp, X, Edit, Trash2, Eye, Shield, 
  ChevronRight, Lock, Activity, UserX, CalendarPlus, Zap, FileOutput, Database, Download, Upload, AlertOctagon, Scissors, List
} from 'lucide-react';

// --- FIREBASE INTEGRATION ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";

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
const getColRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);
const getDocRef = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

// --- UTILS & INITIAL DATA ---
const generateId = () => `TAN-${Math.floor(10000 + Math.random() * 90000)}`;
const generateUid = () => Math.random().toString(36).substring(2, 9);
const getNow = () => new Date().toISOString();
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};
const formatWhatsAppNumber = (phone) => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
};

const DEFAULT_CATEGORIES = ['Invitation', 'Road Complaint', 'Help Request', 'Personal Complaint', 'Confidential Info', 'Others'];
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
  { arabic: "إِنَّ ٱللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا۟ ٱلْأَمَـٰنَـٰتِ إِلَىٰٓ أَهْلِهَا وَإِذَا حَكَمْتُم بَيْنَ ٱلنَّاسِ أَن تَحْكُمُوا۟ بِٱلْعَدْلِ", malayalam: "തീർച്ചയായും അമാനത്തുകൾ (ബാധ്യതകൾ) അതിൻ്റെ അവകാശികൾക്ക് കൊടുത്തു വീട്ടണമെന്നും, ജനങ്ങൾക്കിടയിൽ തീർപ്പുകൽപ്പിക്കുകയാണെങ്കിൽ നീതിയോടെ വേണം തീർപ്പുകൽപ്പിക്കാനെന്നും അല്ലാഹു നിങ്ങളോട് കൽപ്പിക്കുന്നു. (ഖുർആൻ 4:58)" },
  { arabic: "ٱعْدِلُوا۟ هُوَ أَقْرَبُ لِلتَّقْوَىٰ", malayalam: "നിങ്ങൾ നീതി പാലിക്കുക; അതാണ് ഭക്തിയോട് ഏറ്റവും അടുത്തത്. (ഖുർആൻ 5:8)" },
  { arabic: "وَأَحْسِنُوٓا۟ ۛ إِنَّ ٱللَّهَ يُحِبُّ ٱلْمُحْسِنِينَ", malayalam: "നിങ്ങൾ ജനങ്ങൾക്ക് നന്മ ചെയ്യുക. നന്മ ചെയ്യുന്നവരെ തീർച്ചയായും അല്ലാഹു ഇഷ്ടപ്പെടുന്നു. (ഖുർആൻ 2:195)" },
  { arabic: "وَتَعَاوَنُوا۟ عَلَى ٱلْبِرِّ وَٱلتَّقْوَىٰ ۖ وَلَا تَعَاوَنُوا۟ عَلَى ٱلْإِثْمِ وَٱلْعُدْوَٰنِ", malayalam: "പുണ്യത്തിലും ഭക്തിയിലും നിങ്ങൾ പരസ്പരം സഹായിക്കുക. പാപത്തിലും അതിക്രമത്തിലും നിങ്ങൾ പരസ്പരം സഹായിക്കരുത്. (ഖുർആൻ 5:2)" },
  { arabic: "فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًۭا يَرَهُۥ وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّۭا يَرَهُۥ", malayalam: "അപ്രകാരം ആരെങ്കിലും ഒരണുമണിത്തൂക്കം നന്മചെയ്താൽ അവനത് കാണും. ആരെങ്കിലും ഒരണുമണിത്തൂക്കം തിന്മചെയ്താൽ അവനതും കാണും. (ഖുർആൻ 99:7-8)" },
  { arabic: "ٱدْفَعْ بِٱلَّتِى هِىَ أَحْسَنُ فَإِذَا ٱلَّذِى بَيْنَكَ وَبَيْنَهُۥ عَدَٰوَةٌۭ كَأَنَّهُۥ وَلِىٌّ حَمِيمٌۭ", malayalam: "ഏറ്റവും നല്ലതേതാണോ അതുകൊണ്ട് നീ തിന്മയെ പ്രതിരോധിക്കുക. അപ്പോൾ നിന്നോട് ശത്രുതയുള്ളവൻ പോലും നിൻ്റെ ഉറ്റമിത്രത്തെപ്പോലെയായിത്തീരും. (ഖുർആൻ 41:34)" },
  { arabic: "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱتَّقُوا۟ ٱللَّهَ وَقُولُوا۟ قَوْلًۭا سَدِيدًۭا", malayalam: "സത്യവിശ്വാസികളേ, നിങ്ങൾ അല്ലാഹുവെ സൂക്ഷിക്കുകയും, നേരായ വാക്ക് പറയുകയും ചെയ്യുക. (ഖുർആൻ 33:70)" },
  { arabic: "وَأَوْفُوا۟ بِٱلْعَهْدِ ۖ إِنَّ ٱلْعَهْدَ كَانَ مَسْـُٔولًۭا", malayalam: "നിങ്ങൾ കരാറുകൾ (ഏറ്റെടുത്ത ബാധ്യതകൾ) പാലിക്കുക. തീർച്ചയായും കരാറുകളെപ്പറ്റി നിങ്ങളോട് ചോദിക്കപ്പെടുന്നതാണ്. (ഖുർആൻ 17:34)" },
  { arabic: "وَعِبَادُ ٱلرَّحْمَـٰنِ ٱلَّذِينَ يَمْشُونَ عَلَى ٱلْأَرْضِ هَوْنًۭا وَإِذَا خَاطَبَهُمُ ٱلْجَـٰهِلُونَ قَالُوا۟ سَلَـٰمًۭا", malayalam: "ഭൂമിയിലൂടെ വിനയത്തോടെ നടക്കുന്നവരും, അവിവേകികൾ തങ്ങളോട് സംസാരിച്ചാൽ സമാധാനപരമായി മറുപടി നൽകുന്നവരുമാകുന്നു കാരുണ്യവാനായ അല്ലാഹുവിൻ്റെ ദാസന്മാർ. (ഖുർആൻ 25:63)" },
  { arabic: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ", malayalam: "ജനങ്ങളിൽ ഏറ്റവും ഉത്തമൻ ജനങ്ങൾക്ക് ഏറ്റവും ഉപകാരം ചെയ്യുന്നവനാണ്. (ഹദീസ്)" },
  { arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ", malayalam: "നിൻ്റെ സഹോദരൻ്റെ മുഖത്ത് നോക്കി നീ പുഞ്ചിരിക്കുന്നത് ഒരു ധർമ്മമാണ് (സ്വദഖ). (ഹദീസ്)" },
  { arabic: "يَسِّرُوا وَلا تُعَسِّرُوا، وَبَشِّرُوا وَلا تُنَفِّرُوا", malayalam: "നിങ്ങൾ ജനങ്ങൾക്ക് കാര്യങ്ങൾ എളുപ്പമാക്കിക്കൊടുക്കുക, പ്രയാസകരമാക്കരുത്. സന്തോഷവാർത്ത അറിയിക്കുക, വെറുപ്പിക്കരുത്. (ഹദീസ്)" }
];

// --- COMPONENTS ---

const TimelineIcon = ({ type }) => {
  switch(type) {
    case 'created': return <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Plus size={12}/></div>;
    case 'received': return <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Check size={12}/></div>;
    case 'update': return <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Activity size={12}/></div>;
    case 'completed': return <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><CheckCircle size={12}/></div>;
    case 'reverted': return <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><ArrowDownUp size={12}/></div>;
    default: return <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><FileText size={12}/></div>;
  }
};

const AwarenessGraph = ({ total, completed }) => {
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
};

const LiveClock = ({ className }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className={`flex items-center gap-1.5 ${className || ''}`}>
      <Calendar size={14} className="hidden sm:block opacity-70" />
      <span>{time.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
      <Clock size={14} className="hidden sm:block ml-1 opacity-70" />
      <span className="tracking-widest font-mono text-sm">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
    </span>
  );
};

// Main App Component
export default function App() {
  const [fbUser, setFbUser] = useState(null);
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState(null);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [designations, setDesignations] = useState(DEFAULT_DESIGNATIONS);
  const [backupMeta, setBackupMeta] = useState({ lastBackup: null, lastBackupType: null, lastImport: null });
  
  // View states
  const [viewingTask, setViewingTask] = useState(null);

  // Print states
  const [taskToPrint, setTaskToPrint] = useState(null);
  const [taskDetailsToPrint, setTaskDetailsToPrint] = useState(null);
  const [masterReportConfig, setMasterReportConfig] = useState(null);
  const [citizenDirectoryToPrint, setCitizenDirectoryToPrint] = useState(null);

  // Download states
  const [taskToDownload, setTaskToDownload] = useState(null);
  const [taskDetailsToDownload, setTaskDetailsToDownload] = useState(null);
  const [masterReportConfigToDownload, setMasterReportConfigToDownload] = useState(null);
  const [citizenDirectoryToDownload, setCitizenDirectoryToDownload] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Firebase Auth Error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setFbUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!fbUser) return;
    const savedUser = localStorage.getItem('mla_currentUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    const unsubTasks = onSnapshot(getColRef('tasks'), (snap) => setTasks(snap.docs.map(doc => doc.data())), (err) => console.error("Tasks fetch error:", err));
    const unsubUsers = onSnapshot(getColRef('users'), (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        DEFAULT_USERS.forEach(u => batch.set(getDocRef('users', u.id), u));
        batch.commit().catch(e => console.error("Batch init error", e));
      } else setUsers(snap.docs.map(doc => doc.data()));
    }, (err) => console.error("Users fetch error:", err));

    const unsubSettings = onSnapshot(getDocRef('settings', 'globals'), (snap) => {
      if (!snap.exists()) {
        setDoc(getDocRef('settings', 'globals'), { categories: DEFAULT_CATEGORIES, designations: DEFAULT_DESIGNATIONS }).catch(e => console.error(e));
      } else {
        if(snap.data().categories) setCategories(snap.data().categories);
        if(snap.data().designations) setDesignations(snap.data().designations);
      }
    });

    const unsubBackupMeta = onSnapshot(getDocRef('settings', 'backupMeta'), (snap) => { if (snap.exists()) setBackupMeta(snap.data()); });

    return () => { unsubTasks(); unsubUsers(); unsubSettings(); unsubBackupMeta(); };
  }, [fbUser]);

  // Native Print Engine Listener
  useEffect(() => { 
    if (taskToPrint || taskDetailsToPrint || masterReportConfig || citizenDirectoryToPrint) {
      const timer = setTimeout(() => window.print(), 300); 
      return () => clearTimeout(timer);
    }
  }, [taskToPrint, taskDetailsToPrint, masterReportConfig, citizenDirectoryToPrint]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setTaskToPrint(null);
      setTaskDetailsToPrint(null);
      setMasterReportConfig(null);
      setCitizenDirectoryToPrint(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Direct PDF Download Engine via html2pdf
  useEffect(() => {
    const downloadState = taskToDownload || taskDetailsToDownload || masterReportConfigToDownload || citizenDirectoryToDownload;
    if (!downloadState) return;

    const targetId = taskToDownload ? 'dl-ack-slip' : 
                     taskDetailsToDownload ? 'dl-details-report' :
                     masterReportConfigToDownload ? 'dl-master-report' :
                     citizenDirectoryToDownload ? 'dl-citizen-dir' : null;
                     
    const filename = taskToDownload ? `Acknowledge_${taskToDownload.id}` : 
                     taskDetailsToDownload ? `Detailed_Report_${taskDetailsToDownload.id}` :
                     masterReportConfigToDownload ? `Master_Performance_Report` :
                     citizenDirectoryToDownload ? `Citizen_Directory` : 'Document';

    const generatePDF = () => {
      const el = document.getElementById(targetId);
      if(!el) return;
      const opt = {
        margin:       10,
        filename:     `${filename}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      window.html2pdf().set(opt).from(el).save().then(() => {
        setTaskToDownload(null);
        setTaskDetailsToDownload(null);
        setMasterReportConfigToDownload(null);
        setCitizenDirectoryToDownload(null);
      });
    };

    if (window.html2pdf) {
      setTimeout(generatePDF, 300); // Allow DOM to render hidden elements first
    } else {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => setTimeout(generatePDF, 300);
      document.head.appendChild(script);
    }
  }, [taskToDownload, taskDetailsToDownload, masterReportConfigToDownload, citizenDirectoryToDownload]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('mla_currentUser', JSON.stringify(user));
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setImpersonatedUser(null);
    localStorage.removeItem('mla_currentUser');
  };

  const addTask = async (newTask) => await setDoc(getDocRef('tasks', newTask.id), newTask);
  const updateTask = async (taskId, updates) => await updateDoc(getDocRef('tasks', taskId), updates);
  const deleteTask = async (taskId) => {
    if(window.confirm('Are you sure you want to completely delete this record?')) {
      await deleteDoc(getDocRef('tasks', taskId));
      return true;
    }
    return false;
  };
  const updateUserDoc = async (userId, field, value) => await updateDoc(getDocRef('users', userId), { [field]: value });
  
  const addCategory = async (newCat) => await setDoc(getDocRef('settings', 'globals'), { categories: [...categories, newCat] }, { merge: true });
  const addDesignation = async (newDesig) => await setDoc(getDocRef('settings', 'globals'), { designations: [...designations, newDesig] }, { merge: true });
  const updateBackupMeta = async (updates) => await setDoc(getDocRef('settings', 'backupMeta'), updates, { merge: true });

  const liveCurrentUser = currentUser ? users.find(u => u.id === currentUser.id) : null;
  
  useEffect(() => {
    if (currentUser && liveCurrentUser && !liveCurrentUser.enabled && liveCurrentUser.role !== 'admin') {
      handleLogout();
      alert("Your account has been temporarily disabled by the Super Admin.");
    }
  }, [liveCurrentUser, currentUser]);

  const activeUser = impersonatedUser || liveCurrentUser;
  const isImpersonating = !!impersonatedUser;

  if (!activeUser) return <LoginScreen onLogin={handleLogin} users={users} />;

  return (
    <>
      {/* PERFECT PRINT & OFF-SCREEN CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          @media print {
             @page { margin: 15mm; size: A4 portrait; }
             body, html { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Inter', sans-serif; background: white; margin: 0; padding: 0; }
             .print-hidden { display: none !important; }
             .print-block { display: block !important; }
             .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          }
      ` }} />

      {/* --- PRINT COMPONENTS (Visible Only to Print Engine) --- */}
      {taskToPrint && <PrintAcknowledgeSlip task={taskToPrint} mode="print" />}
      {taskDetailsToPrint && <PrintTaskDetailsReport task={taskDetailsToPrint} users={users} mode="print" />}
      {masterReportConfig && <PrintMasterReport config={masterReportConfig} tasks={tasks} users={users} categories={categories} mode="print" />}
      {citizenDirectoryToPrint && <PrintCitizenDirectory citizens={citizenDirectoryToPrint} mode="print" />}
      
      {/* --- DOWNLOAD COMPONENTS (Rendered Off-Screen for PDF Capture) --- */}
      {taskToDownload && <PrintAcknowledgeSlip task={taskToDownload} id="dl-ack-slip" mode="download" />}
      {taskDetailsToDownload && <PrintTaskDetailsReport task={taskDetailsToDownload} users={users} id="dl-details-report" mode="download" />}
      {masterReportConfigToDownload && <PrintMasterReport config={masterReportConfigToDownload} tasks={tasks} users={users} categories={categories} id="dl-master-report" mode="download" />}
      {citizenDirectoryToDownload && <PrintCitizenDirectory citizens={citizenDirectoryToDownload} id="dl-citizen-dir" mode="download" />}

      {/* --- MODAL FOR VIEW DETAILS --- */}
      {viewingTask && <TaskDetailsModal task={tasks.find(t => t.id === viewingTask.id) || viewingTask} onClose={() => setViewingTask(null)} updateTask={updateTask} deleteTask={deleteTask} users={users} triggerDetailsPrint={setTaskDetailsToPrint} triggerDownloadPDF={setTaskDetailsToDownload} currentUser={activeUser} />}

      {/* --- MAIN APP WRAPPER --- */}
      <div className={`min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col print-hidden`}>
        <header className={`${isImpersonating ? 'bg-gradient-to-r from-red-900 to-orange-800' : 'bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-900'} text-white shadow-md transition-colors`}>
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm shadow-inner">
                {isImpersonating ? <Shield size={20} className="text-white animate-pulse" /> : <User size={20} className="text-white" />}
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-wide">PK Navas MLA Office</h1>
                <p className="text-xs text-blue-100 font-medium tracking-wider uppercase">{isImpersonating ? `ACTING AS: ${activeUser.name}` : activeUser.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isImpersonating && <button onClick={() => setImpersonatedUser(null)} className="hidden sm:flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded border border-white/30 transition-colors font-bold">Exit Profile</button>}
              <div className="hidden md:flex items-center text-sm text-blue-100 bg-white/10 px-4 py-1.5 rounded-full border border-white/10"><LiveClock /></div>
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm bg-red-500/90 hover:bg-red-600 transition-colors px-4 py-2 rounded-lg font-bold shadow-sm"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></button>
            </div>
          </div>
        </header>

        <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {activeUser.role === 'admin' ? (
            <AdminDashboard tasks={tasks} updateTask={updateTask} deleteTask={deleteTask} categories={categories} designations={designations} users={users} updateUserDoc={updateUserDoc} setImpersonatedUser={setImpersonatedUser} triggerPrint={setTaskToPrint} triggerDownloadPDF={setTaskToDownload} triggerDetailsPrint={setTaskDetailsToPrint} triggerDetailsDownload={setTaskDetailsToDownload} triggerViewDetails={setViewingTask} addTask={addTask} addCategory={addCategory} addDesignation={addDesignation} triggerMasterReport={setMasterReportConfig} triggerMasterDownload={setMasterReportConfigToDownload} backupMeta={backupMeta} updateBackupMeta={updateBackupMeta} triggerCitizenPrint={setCitizenDirectoryToPrint} triggerCitizenDownload={setCitizenDirectoryToDownload} />
          ) : (
            <OfficerDashboard user={activeUser} tasks={tasks} updateTask={updateTask} deleteTask={deleteTask} categories={categories} designations={designations} users={users} addTask={addTask} addCategory={addCategory} addDesignation={addDesignation} triggerPrint={setTaskToPrint} triggerDownloadPDF={setTaskToDownload} triggerDetailsPrint={setTaskDetailsToPrint} triggerDetailsDownload={setTaskDetailsToDownload} triggerViewDetails={setViewingTask} isAdminOverride={currentUser.role === 'admin'} />
          )}
        </main>
        
        <footer className="pb-6 pt-2 text-center text-[10px] font-black text-slate-400 tracking-widest uppercase">
          &copy; {new Date().getFullYear()} PK Navas MLA Office Management System. All Rights Reserved.
        </footer>
      </div>
    </>
  );
}

// --- LOGIN SCREEN ---
const LoginScreen = ({ onLogin, users }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setQuoteIndex((prev) => (prev + 1) % ISLAMIC_QUOTES.length), 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (password === selectedUser.pass) onLogin(selectedUser);
    else setError('Incorrect password');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@300;400;500;600;700&family=Scheherazade+New:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      ` }} />
      <div className="w-full bg-slate-900 text-center py-4 px-4 shadow-md z-20 flex items-center justify-center min-h-[80px] lg:min-h-[90px]">
        <div key={quoteIndex} className="animate-in fade-in duration-1000 max-w-6xl mx-auto flex flex-col items-center gap-2">
          <p className="text-base md:text-lg lg:text-xl text-blue-100 leading-tight drop-shadow-sm" dir="rtl" style={{ fontFamily: "'Scheherazade New', serif" }}>
            {ISLAMIC_QUOTES[quoteIndex].arabic}
          </p>
          <p className="text-xs md:text-sm lg:text-base font-normal text-slate-300 tracking-wide" style={{ fontFamily: "'Anek Malayalam', sans-serif" }}>
            {ISLAMIC_QUOTES[quoteIndex].malayalam}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden flex flex-col md:flex-row">
          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-10 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-20 -top-20 opacity-10"><Shield size={300}/></div>
            <div className="relative z-10">
              <div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-white/20 backdrop-blur-md"><Users size={40} className="text-white" /></div>
              <h1 className="text-4xl font-black mb-3 leading-tight">MLA Office<br/>Management</h1>
              <p className="text-blue-200 text-lg font-medium tracking-wide mb-6">PK Navas • Tanur Constituency</p>
              <div className="inline-block bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm">
                <LiveClock className="text-blue-50 text-sm font-bold tracking-wide" />
              </div>
            </div>
            <div className="mt-12 hidden md:block relative z-10"><p className="text-sm text-blue-200/60 font-bold tracking-wider">&copy; {new Date().getFullYear()} SECURE SYSTEM</p></div>
          </div>

          <div className="p-8 md:p-12 md:w-3/5 bg-slate-50 relative">
            {!selectedUser ? (
              <div>
                <h2 className="text-2xl font-black text-slate-800 mb-6">Select Staff Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {users.map(user => {
                    return (
                      <button key={user.id} disabled={!user.enabled} onClick={() => { setSelectedUser(user); setError(''); setPassword(''); }} className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 relative overflow-hidden ${!user.enabled ? 'opacity-40 grayscale bg-slate-100 border-slate-200 cursor-not-allowed' : user.role === 'admin' ? 'bg-blue-50 border-blue-200 hover:border-blue-500 hover:shadow-md' : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'}`}>
                        {!user.enabled && <div className="absolute top-3 right-3 text-slate-400"><Lock size={16}/></div>}
                        <div className={`p-3 rounded-xl shadow-sm shrink-0 ${user.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{user.role === 'admin' ? <Shield size={24} /> : <User size={24} />}</div>
                        <div>
                          <p className="font-black text-slate-800 text-lg leading-tight">{user.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{user.role === 'admin' ? 'Super Admin' : 'Officer Login'}</p>
                        </div>
                      </button>
                    );
                  })}
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
                  <div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-xl font-medium tracking-widest" placeholder="••••••••" autoFocus />
                    {error && <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5 font-bold"><AlertTriangle size={16}/> {error}</p>}
                  </div>
                  <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2">Secure Login <ChevronRight size={20}/></button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMBINED OFFICER DASHBOARD ---
const OfficerDashboard = ({ user, tasks, updateTask, deleteTask, categories, designations, users, addTask, addCategory, addDesignation, triggerPrint, triggerDownloadPDF, triggerDetailsPrint, triggerDetailsDownload, triggerViewDetails, isAdminOverride }) => {
  const [activeTab, setActiveTab] = useState(user.canInput ? 'input' : 'tasks');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-fit">
        {user.canInput && <button onClick={() => setActiveTab('input')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'input' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>Register New Input</button>}
        <button onClick={() => setActiveTab('tasks')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>My Assigned Works</button>
        <button onClick={() => setActiveTab('direct')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'direct' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Zap size={16}/> Assignments from MLA</button>
        {user.canInput && <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>History & Reports</button>}
      </div>

      {activeTab === 'input' && user.canInput && <InputFormTab addTask={addTask} categories={categories} designations={designations} addCategory={addCategory} addDesignation={addDesignation} users={users} triggerPrint={triggerPrint} triggerDownloadPDF={triggerDownloadPDF} creator={user} />}
      {activeTab === 'tasks' && <WorkerTab user={user} tasks={tasks} updateTask={updateTask} isAdminOverride={isAdminOverride} taskTypeFilter="input" triggerViewDetails={triggerViewDetails} />}
      {activeTab === 'direct' && <WorkerTab user={user} tasks={tasks} updateTask={updateTask} isAdminOverride={isAdminOverride} taskTypeFilter="direct" triggerViewDetails={triggerViewDetails} />}
      {activeTab === 'history' && user.canInput && <AllTasksHistoryTab tasks={tasks} categories={categories} triggerPrint={triggerPrint} triggerDownloadPDF={triggerDownloadPDF} triggerDetailsPrint={triggerDetailsPrint} triggerDetailsDownload={triggerDetailsDownload} triggerViewDetails={triggerViewDetails} currentUser={user} updateTask={updateTask} deleteTask={deleteTask} users={users} />}
    </div>
  );
};

// --- SUB-TABS ---
const InputFormTab = ({ addTask, categories, designations, addCategory, addDesignation, users, triggerPrint, triggerDownloadPDF, creator }) => {
  const initForm = {
    types: [], category: '', newCategory: '', programDate: '', subject: '',
    personal: { name: '', designation: '', newDesignation: '', gender: '', referralPerson: '', mobileNumber: '', whatsappNumber: '', houseName: '', place: '', postOffice: '', pinCode: '', localBody: '', otherLocalBody: '', wardNumber: '' },
    description: '', assignedTo: [], deadline: ''
  };
  const [form, setForm] = useState(initForm);
  const [showNewCat, setShowNewCat] = useState(false);
  const [showNewDesig, setShowNewDesig] = useState(false);
  const [sendWaMsg, setSendWaMsg] = useState(true);
  const [sendWaMsgSame, setSendWaMsgSame] = useState(false);
  const [lastTask, setLastTask] = useState(null);

  const isInvitation = form.category === 'Invitation';

  const handlePersChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, personal: { ...prev.personal, [name]: value } };
      if (name === 'mobileNumber' && sendWaMsgSame) updated.personal.whatsappNumber = value;
      return updated;
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    let finalCat = form.category;
    if (showNewCat && form.newCategory) {
      if (!categories.includes(form.newCategory)) addCategory(form.newCategory);
      finalCat = form.newCategory;
    }

    let finalDesig = form.personal.designation;
    if (showNewDesig && form.personal.newDesignation) {
      if (!designations.includes(form.personal.newDesignation)) addDesignation(form.personal.newDesignation);
      finalDesig = form.personal.newDesignation;
    }

    const finalLocalBody = form.personal.localBody === 'Other' ? form.personal.otherLocalBody : form.personal.localBody;
    
    let finalAssignedTo = form.assignedTo;
    if(isInvitation) finalAssignedTo = ['admin']; 

    if (!finalCat || form.types.length === 0 || finalAssignedTo.length === 0) return alert("Select Type, Category, and Assignees.");
    if (!form.subject.trim()) return alert("Subject is required.");

    const taskId = generateId();
    const finalPersonalDetails = { ...form.personal, designation: finalDesig, localBody: finalLocalBody };
    delete finalPersonalDetails.newDesignation;
    delete finalPersonalDetails.otherLocalBody;

    const newTask = {
      id: taskId, types: form.types, category: finalCat, personalDetails: finalPersonalDetails, taskType: 'input',
      subject: form.subject, description: form.description, assignedTo: finalAssignedTo, deadline: form.deadline || null, programDate: isInvitation ? form.programDate : null,
      status: 'Pending', priority: 'Medium', officerStatuses: {},
      createdAt: getNow(), createdBy: creator.name,
      timeline: [{ id: generateUid(), type: 'created', time: getNow(), by: creator.name, text: 'Input Registered' }]
    };

    addTask(newTask);
    setLastTask(newTask);
    
    if (sendWaMsg && (finalPersonalDetails.whatsappNumber || finalPersonalDetails.mobileNumber)) {
      const waNum = formatWhatsAppNumber(finalPersonalDetails.whatsappNumber || finalPersonalDetails.mobileNumber);
      if (waNum) {
        const msg = `പ്രിയപ്പെട്ട ${finalPersonalDetails.name},\n\nതാങ്കൾ പി.കെ നവാസ് എം.എൽ.എ യുടെ ഓഫീസുമായി ബന്ധപ്പെട്ടതിന് നന്ദി. നിങ്ങളുടെ അപേക്ഷ/പരാതി ഔദ്യോഗികമായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്.\n\n*റഫറൻസ് ഐഡി:* ${taskId}\n\nകൂടുതൽ വിവരങ്ങൾക്ക് ഈ നമ്പറിൽ ബന്ധപ്പെടാവുന്നതാണ്.\n\nസ്നേഹത്തോടെ,\nഎം.എൽ.എ ഓഫീസ്, താനൂർ.`;
        window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    }
  };

  if (lastTask) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-lg text-center max-w-2xl mx-auto border border-green-200">
        <CheckCircle size={60} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-green-800 mb-2">Input Registered</h2>
        <div className="bg-slate-50 p-6 rounded-xl my-6 inline-block border border-slate-200">
          <p className="text-sm font-bold text-slate-500 uppercase">Reference ID</p>
          <p className="text-4xl font-black text-slate-800 tracking-widest">{lastTask.id}</p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <button onClick={() => triggerPrint(lastTask)} className="px-5 py-3 bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-900 transition-colors"><Printer size={18}/> Print Slip</button>
          <button onClick={() => triggerDownloadPDF(lastTask)} className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors"><Download size={18}/> Download PDF</button>
          <button onClick={() => setLastTask(null)} className="px-5 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors"><Plus size={18}/> New Input</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 grid md:grid-cols-2 gap-10">
        <div>
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-lg"><Filter className="text-blue-600"/> Input Type *</h3>
          <div className="flex flex-wrap gap-3">
            {INPUT_TYPES.map(type => (
              <label key={type} className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border transition-all font-bold text-sm ${form.types.includes(type) ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <input type="checkbox" checked={form.types.includes(type)} onChange={() => setForm({ ...form, types: form.types.includes(type) ? form.types.filter(t => t !== type) : [...form.types, type] })} className="w-4 h-4 text-blue-600 rounded" />
                {type}
              </label>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-lg"><FileText className="text-blue-600"/> Category *</h3>
          {!showNewCat ? (
            <div className="space-y-3">
              <select required value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 bg-white">
                <option value="">Select Category...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewCat(true)} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg"><Plus size={16}/> Custom Category</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input type="text" required placeholder="New category name" value={form.newCategory} onChange={(e) => setForm({...form, newCategory: e.target.value})} className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-bold outline-none focus:border-blue-500" />
              <button type="button" onClick={() => setShowNewCat(false)} className="px-4 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100">Cancel</button>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 border-b border-slate-100">
        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg"><User className="text-blue-600"/> Citizen Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>Full Name *</span></label>
             <input required name="name" value={form.personal.name} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" />
          </div>
          <div>
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>Designation</span></label>
             {!showNewDesig ? (
                <div className="flex gap-2">
                  <select name="designation" value={form.personal.designation} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all">
                    <option value="">Select Designation...</option>
                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowNewDesig(true)} className="bg-blue-50 text-blue-600 px-3 rounded-xl hover:bg-blue-100"><Plus size={16}/></button>
                </div>
             ) : (
                <div className="flex gap-2">
                  <input type="text" name="newDesignation" placeholder="New Designation" value={form.personal.newDesignation} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none" />
                  <button type="button" onClick={() => { setShowNewDesig(false); setForm(prev => ({...prev, personal: {...prev.personal, newDesignation: ''}})); }} className="px-3 bg-red-50 text-red-600 rounded-xl"><X size={16}/></button>
                </div>
             )}
          </div>
          <div>
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>Gender</span></label>
             <select name="gender" value={form.personal.gender} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all">
               <option value="">Select Gender...</option>
               <option value="Male">Male</option>
               <option value="Female">Female</option>
               <option value="Other">Other</option>
             </select>
          </div>
          <div>
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>Referral Person</span></label>
             <input name="referralPerson" value={form.personal.referralPerson} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" />
          </div>
          <div>
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2"><span>Mobile Number *</span></label>
             <input required name="mobileNumber" value={form.personal.mobileNumber} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" />
          </div>
          <div>
             <label className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                <span>WhatsApp Number</span>
                <label className="flex items-center gap-1 cursor-pointer text-blue-600 normal-case tracking-normal text-[10px] font-bold">
                    <input type="checkbox" checked={sendWaMsgSame} onChange={(e) => {
                      const checked = e.target.checked;
                      setSendWaMsgSame(checked);
                      if (checked) setForm(prev => ({...prev, personal: {...prev.personal, whatsappNumber: prev.personal.mobileNumber}}));
                    }} className="rounded w-3 h-3"/> Same as Mobile
                </label>
             </label>
             <input name="whatsappNumber" value={form.personal.whatsappNumber} onChange={handlePersChange} disabled={sendWaMsgSame} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60" />
          </div>
          
          <div><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">House Name</label><input name="houseName" value={form.personal.houseName} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
          <div><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Place Name</label><input name="place" value={form.personal.place} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
          <div><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Post Office</label><input name="postOffice" value={form.personal.postOffice} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
          <div><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">PIN Code</label><input name="pinCode" value={form.personal.pinCode} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
          <div>
             <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Local Body</label>
             <select name="localBody" value={form.personal.localBody} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all">
               <option value="">Select Local Body...</option>
               {LOCAL_BODIES.map(lb => <option key={lb} value={lb}>{lb}</option>)}
             </select>
             {form.personal.localBody === 'Other' && (
               <input type="text" name="otherLocalBody" placeholder="Specify local body..." value={form.personal.otherLocalBody} onChange={handlePersChange} className="w-full mt-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" />
             )}
          </div>
          <div><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ward Number</label><input name="wardNumber" value={form.personal.wardNumber} onChange={handlePersChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" /></div>
        </div>
      </div>

      <div className="p-8 bg-slate-50/50">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <div className="mb-6">
              <h3 className="font-black text-slate-800 mb-2 flex items-center gap-2 text-lg"><MessageSquare className="text-blue-600"/> Subject (Short) *</h3>
              <input required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-white" placeholder="Briefly state the subject..." />
            </div>
            
            <div>
              <h3 className="font-black text-slate-800 mb-2 flex items-center gap-2 text-lg"><FileText className="text-blue-600"/> Detailed Description (Optional)</h3>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium h-32 outline-none focus:border-blue-500 bg-white" placeholder="Write full details here if necessary..."></textarea>
            </div>

            {isInvitation && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <label className="block text-xs font-black text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-2"><CalendarPlus size={16}/> Program Date</label>
                <input type="datetime-local" required value={form.programDate} onChange={(e) => setForm({...form, programDate: e.target.value})} className="w-full px-4 py-3 border border-blue-300 rounded-xl font-bold outline-none focus:border-blue-500 bg-white" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-lg"><Users className="text-blue-600"/> Assign To *</h3>
            {isInvitation ? (
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center gap-3 text-indigo-800 font-bold mb-6">
                <Shield size={24} /> Auto-Assigned exclusively to PK Navas
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {users.map(u => (
                  <label key={u.id} className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all font-bold text-sm ${form.assignedTo.includes(u.id) ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    <input type="checkbox" checked={form.assignedTo.includes(u.id)} onChange={() => setForm({ ...form, assignedTo: form.assignedTo.includes(u.id) ? form.assignedTo.filter(id => id !== u.id) : [...form.assignedTo, u.id] })} className="w-4 h-4 text-indigo-600 rounded" />
                    {u.name}
                  </label>
                ))}
              </div>
            )}
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-lg"><Calendar className="text-blue-600"/> Deadline</h3>
            <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({...form, deadline: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      <div className="p-8 border-t border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-6">
        <label className="flex items-center gap-3 cursor-pointer bg-green-50 px-5 py-3 rounded-xl border border-green-200">
          <input type="checkbox" checked={sendWaMsg} onChange={(e) => setSendWaMsg(e.target.checked)} className="w-5 h-5 text-green-600 rounded" />
          <span className="font-bold text-green-800 flex items-center gap-2"><Send size={16}/> Auto-Send Malayalam WhatsApp</span>
        </label>
        <button type="submit" className="w-full md:w-auto bg-slate-900 hover:bg-black text-white font-black py-4 px-10 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2"><Check size={24} /> Submit Input</button>
      </div>
    </form>
  );
};

const WorkerTab = ({ user, tasks, updateTask, isAdminOverride, taskTypeFilter, triggerViewDetails }) => {
  const [search, setSearch] = useState('');
  const myAssigned = tasks.filter(t => t.assignedTo.includes(user.id) && (t.taskType || 'input') === taskTypeFilter);
  const myTotalAssigned = tasks.filter(t => t.assignedTo.includes(user.id));
  const compStat = myTotalAssigned.filter(t => t.officerStatuses && t.officerStatuses[user.id] === 'Completed').length;
  
  const filtered = myAssigned.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) || 
    t.personalDetails.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.subject||'').toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    (t.personalDetails.mobileNumber||'').includes(search)
  ).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const todo = filtered.filter(t => t.status !== 'Unsolved' && (!t.officerStatuses[user.id] || t.officerStatuses[user.id] === 'Pending'));
  const inProg = filtered.filter(t => t.status !== 'Unsolved' && (t.officerStatuses[user.id] === 'Received' || t.officerStatuses[user.id] === 'In Progress'));
  const comp = filtered.filter(t => t.status !== 'Unsolved' && t.officerStatuses[user.id] === 'Completed');
  const unsolved = filtered.filter(t => t.status === 'Unsolved');

  return (
    <div className="space-y-6">
      <AwarenessGraph total={myTotalAssigned.length} completed={compStat} />
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search tasks by subject, name, ID, mobile..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Column title="New / Pending" count={todo.length} color="slate">
          {todo.map(t => <WorkerTaskCard key={t.id} task={t} user={user} updateTask={updateTask} isAdminOverride={isAdminOverride} triggerViewDetails={triggerViewDetails} />)}
        </Column>
        <Column title="In Progress" count={inProg.length} color="blue">
          {inProg.map(t => <WorkerTaskCard key={t.id} task={t} user={user} updateTask={updateTask} isAdminOverride={isAdminOverride} triggerViewDetails={triggerViewDetails} />)}
        </Column>
        <Column title="Completed" count={comp.length} color="green">
          {comp.map(t => <WorkerTaskCard key={t.id} task={t} user={user} updateTask={updateTask} isAdminOverride={isAdminOverride} triggerViewDetails={triggerViewDetails} />)}
          {unsolved.length > 0 && <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-300">
            <h4 className="font-bold text-slate-500 mb-4 uppercase tracking-widest text-xs text-center">Unsolved / Closed</h4>
            {unsolved.map(t => <WorkerTaskCard key={t.id} task={t} user={user} updateTask={updateTask} isUnsolved isAdminOverride={isAdminOverride} triggerViewDetails={triggerViewDetails} />)}
          </div>}
        </Column>
      </div>
    </div>
  );
};

const Column = ({ title, count, color, children }) => {
  const colorMap = { slate: 'border-slate-200 text-slate-700 bg-slate-100', blue: 'border-blue-200 text-blue-700 bg-blue-100', green: 'border-green-200 text-green-700 bg-green-100' };
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col h-[800px] overflow-hidden">
      <h3 className="font-bold text-lg mb-4 flex items-center justify-between pb-3 border-b border-slate-200"><span className="text-slate-800">{title}</span><span className={`text-xs px-2.5 py-1 rounded-full font-black border ${colorMap[color]}`}>{count}</span></h3>
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 custom-scrollbar">{children}{React.Children.count(children) === 0 && <div className="text-center text-sm font-medium text-slate-400 mt-10">No tasks here</div>}</div>
    </div>
  );
};

const WorkerTaskCard = ({ task, user, updateTask, isUnsolved, isAdminOverride, triggerViewDetails }) => {
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

  const deleteUpdate = (uid) => { if(window.confirm('Delete this update?')) updateTask(task.id, { timeline: task.timeline.filter(tl => tl.id !== uid) }); };

  const myUpdates = task.timeline.filter(tl => tl.type === 'update' && (tl.by === user.name || isAdminOverride)).sort((a,b)=> new Date(b.time) - new Date(a.time));

  const generateGCalLink = () => {
    if(!task.programDate) return '#';
    const s = new Date(task.programDate);
    const e = new Date(s.getTime() + 60*60*1000);
    const fmt = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
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
              <button onClick={() => setShowProgressModal(true)} className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-black hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"><Activity size={16}/> {status === 'Received' ? 'Start Progress' : 'Add Update'}</button>
              {status === 'In Progress' && <button onClick={() => changeStatus('Completed')} className="w-full bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-black hover:bg-green-600 transition-colors shadow-sm flex items-center justify-center gap-2"><CheckCircle size={16}/> Mark Completed</button>}
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
              <span className="font-bold text-amber-800 mr-1">{new Date(up.time).toLocaleDateString('en-IN')}:</span> {up.text}
              <button onClick={()=>deleteUpdate(up.id)} className="absolute right-1 top-1/2 -translate-y-1/2 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 p-1"><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
      )}
      {showProgressModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center"><h3 className="font-black text-lg">Enter Progress Update</h3><button onClick={() => setShowProgressModal(false)}><X size={20}/></button></div>
            <div className="p-6"><textarea autoFocus value={updateText} onChange={e=>setUpdateText(e.target.value)} placeholder="What step did you take?..." className="w-full px-4 py-3 border border-slate-300 rounded-xl font-medium outline-none focus:border-blue-500 h-32"></textarea><button onClick={handleSaveUpdate} className="w-full mt-4 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition-colors">Save Update</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const AllTasksHistoryTab = ({ tasks, categories, triggerPrint, triggerDetailsPrint, triggerViewDetails, triggerDownloadPDF, currentUser, updateTask, deleteTask, users }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  
  const filtered = tasks.filter(t => 
    (catFilter === 'All' || t.category === catFilter || (catFilter === 'Direct Assignment' && t.taskType === 'direct')) && 
    (
      t.id.toLowerCase().includes(search.toLowerCase()) || 
      t.personalDetails.name.toLowerCase().includes(search.toLowerCase()) || 
      (t.subject||'').toLowerCase().includes(search.toLowerCase()) ||
      (t.personalDetails.mobileNumber||'').includes(search)
    )
  ).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex gap-4 flex-wrap">
        <input type="text" placeholder="Search history by Subject, Name, ID, Mobile..." value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 min-w-[250px] px-4 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:border-blue-500" />
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-xl font-medium outline-none bg-white">
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="Direct Assignment">Direct Assignments</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
          <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase text-xs tracking-widest font-black"><tr><th className="px-4 py-3">ID & Date</th><th className="px-4 py-3">Subject & Citizen</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 font-medium">
                <td className="px-4 py-3"><span className="font-black text-slate-800">{t.id}</span><br/><span className="text-xs text-slate-400">{formatDate(t.createdAt)}</span></td>
                <td className="px-4 py-3"><span className="font-bold text-slate-800 max-w-[200px] truncate block">{t.subject || '-'}</span><span className="text-xs text-slate-500">{t.personalDetails.name} • {t.personalDetails.mobileNumber}</span></td>
                <td className="px-4 py-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{t.category}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-black uppercase ${t.status==='Completed'?'bg-green-100 text-green-700':t.status==='In Progress'?'bg-amber-100 text-amber-700':t.status==='Unsolved'?'bg-slate-200 text-slate-500':'bg-red-100 text-red-700'}`}>{t.status}</span></td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <button onClick={()=>triggerPrint(t)} title="Print Slip" className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Printer size={18}/></button>
                  <button onClick={()=>{ triggerDownloadPDF(t); }} title="Download Slip PDF" className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"><Download size={18}/></button>
                  {(currentUser.role === 'admin' || currentUser.canSeeReports) && (
                    <button onClick={()=>{ triggerViewDetails(t); }} title="Detailed Report" className="text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"><FileText size={18}/></button>
                  )}
                  {(currentUser.role === 'admin' || t.status === 'Pending') && (
                    <button onClick={async ()=>{ await deleteTask(t.id); }} title="Delete Input" className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-slate-500">No records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// --- SUPER ADMIN DASHBOARD ---
const AdminDashboard = ({ tasks, updateTask, deleteTask, categories, designations, users, updateUserDoc, setImpersonatedUser, triggerPrint, triggerDetailsPrint, triggerViewDetails, triggerDownloadPDF, triggerMasterReport, addTask, addCategory, addDesignation, backupMeta, updateBackupMeta, triggerCitizenPrint, triggerCitizenDownload }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const total = tasks.filter(t=>t.taskType!=='direct').length;
  const comp = tasks.filter(t=>t.taskType!=='direct' && t.status==='Completed').length;
  const pend = tasks.filter(t=>t.taskType!=='direct' && t.status==='Pending').length;
  
  const uniqueVisitors = useMemo(() => {
    const phones = new Set();
    tasks.forEach(t => {
      if (t.taskType !== 'direct' && t.personalDetails?.mobileNumber) {
        phones.add(t.personalDetails.mobileNumber.replace(/\D/g, ''));
      }
    });
    return phones.size;
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-fit print-hidden">
        <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>Global Overview</button>
        <button onClick={() => setActiveTab('input')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'input' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Plus size={16}/> Register Input</button>
        <button onClick={() => setActiveTab('citizens')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'citizens' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Users size={16}/> Citizen Info</button>
        <button onClick={() => setActiveTab('direct')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'direct' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Zap size={16}/> Direct Assignments</button>
        <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Eye size={16}/> Manage Officers</button>
        <button onClick={() => setActiveTab('settings')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Settings size={16}/> Permissions</button>
        <button onClick={() => setActiveTab('database')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'database' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Database size={16}/> DB & Backup</button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h2 className="text-xl font-black text-slate-800">Analytics Dashboard</h2>
              <p className="text-sm font-medium text-slate-500">System wide tracking</p>
            </div>
            <button onClick={() => setReportModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow flex items-center gap-2 transition-colors">
              <FileOutput size={18}/> Generate Master Report
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Inputs" value={total} color="blue" icon={<FileText size={24}/>}/>
            <StatCard title="Total Visitors" value={uniqueVisitors} color="indigo" icon={<Users size={24}/>}/>
            <StatCard title="Completed" value={comp} color="green" icon={<CheckCircle size={24}/>}/>
            <StatCard title="Pending" value={pend} color="red" icon={<Clock size={24}/>}/>
          </div>
          <AdminGlobalView tasks={tasks.filter(t=>(t.taskType||'input')==='input')} updateTask={updateTask} deleteTask={deleteTask} users={users} triggerPrint={triggerPrint} triggerDetailsPrint={triggerDetailsPrint} triggerViewDetails={triggerViewDetails} categories={categories} />
        </div>
      )}

      {activeTab === 'input' && <InputFormTab addTask={addTask} categories={categories} designations={designations} addCategory={addCategory} addDesignation={addDesignation} users={users} triggerPrint={triggerPrint} triggerDownloadPDF={triggerDownloadPDF} creator={users.find(u=>u.role==='admin')} />}
      {activeTab === 'citizens' && <AdminCitizenDirectory tasks={tasks} triggerCitizenPrint={triggerCitizenPrint} triggerDownloadPDF={triggerCitizenDownload} />}
      {activeTab === 'direct' && <AdminDirectAssignments users={users} tasks={tasks} addTask={addTask} triggerPrint={triggerPrint} triggerDetailsPrint={triggerDetailsPrint} triggerViewDetails={triggerViewDetails} updateTask={updateTask} deleteTask={deleteTask} />}

      {activeTab === 'users' && (
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 animate-in fade-in">
          <div className="text-center max-w-2xl mx-auto mb-10"><Shield size={48} className="text-indigo-600 mx-auto mb-4"/><h2 className="text-3xl font-black text-slate-800 mb-2">Officer Directory & Access</h2><p className="text-slate-500 font-medium text-lg">Contact officers directly or securely enter their profile to manage tasks on their behalf.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {users.filter(u=>u.role!=='admin').map(u => (
              <div key={u.id} className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl hover:border-indigo-300 transition-all group flex flex-col items-center text-center shadow-sm relative">
                <div className="flex gap-2 mb-3">
                  <a href={`tel:${u.phone}`} className="bg-white border border-slate-200 p-2 rounded-full text-slate-600 hover:text-blue-600 hover:bg-blue-50 shadow-sm"><Phone size={16}/></a>
                  {u.whatsapp && <a href={`https://wa.me/${formatWhatsAppNumber(u.whatsapp)}`} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 p-2 rounded-full text-slate-600 hover:text-green-600 hover:bg-green-50 shadow-sm"><MessageSquare size={16}/></a>}
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 mb-4 shadow"><User size={32}/></div>
                <h3 className="font-black text-slate-800 text-lg mb-4">{u.name}</h3>
                <button onClick={() => setImpersonatedUser(u)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-100 px-4 py-2 rounded-lg hover:bg-indigo-200 w-full">Enter Profile</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && <AdminSettings users={users} updateUserDoc={updateUserDoc} />}
      {activeTab === 'database' && <AdminDatabase tasks={tasks} users={users} backupMeta={backupMeta} updateBackupMeta={updateBackupMeta} />}
      
      {reportModalOpen && <ReportConfigModal onClose={()=>setReportModalOpen(false)} onGenerate={(config) => { setReportModalOpen(false); triggerMasterReport(config); }} triggerDownloadPDF={(config) => { setReportModalOpen(false); triggerMasterDownload(config); }} />}
    </div>
  );
};

// Admin Citizen Directory
const AdminCitizenDirectory = ({ tasks, triggerCitizenPrint, triggerDownloadPDF }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('visits'); 
  
  const citizensData = useMemo(() => {
    const map = new Map();
    tasks.forEach(t => {
      if (t.taskType === 'direct') return;
      const phone = t.personalDetails?.mobileNumber;
      if (!phone) return;
      if (!map.has(phone)) {
        map.set(phone, { ...t.personalDetails, visits: 1, lastVisit: t.createdAt });
      } else {
        const ex = map.get(phone);
        ex.visits += 1;
        if (new Date(t.createdAt) > new Date(ex.lastVisit)) ex.lastVisit = t.createdAt;
      }
    });
    return Array.from(map.values()).sort((a,b) => {
      if (sortBy === 'visits') return b.visits - a.visits;
      if (sortBy === 'recent') return new Date(b.lastVisit) - new Date(a.lastVisit);
      return a.name.localeCompare(b.name);
    }).filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.mobileNumber.includes(search) || (c.place||'').toLowerCase().includes(search.toLowerCase()));
  }, [tasks, search, sortBy]);

  const handleDownloadCSV = () => {
    const headers = ['Name', 'Designation', 'Gender', 'Mobile Number', 'WhatsApp', 'House Name', 'Place', 'Post Office', 'PIN Code', 'Local Body', 'Ward', 'Total Visits', 'Last Visit'];
    const rows = citizensData.map(c => [
      c.name, c.designation||'-', c.gender||'-', c.mobileNumber, c.whatsappNumber||'-', c.houseName||'-', c.place||'-', c.postOffice||'-', c.pinCode||'-', (c.localBody || c.panchayat || '-'), c.wardNumber||'-', c.visits, formatDate(c.lastVisit)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(f=>`"${f}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Citizen_Directory_${new Date().toISOString()}.csv`);
    link.click();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Users className="text-teal-600"/> Citizen Visit Directory</h2>
          <p className="text-slate-500 font-medium mt-1">Track frequency of citizen visits based on registered mobile numbers.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadCSV} className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-teal-200"><List size={16}/> Export CSV</button>
          <button onClick={() => triggerCitizenPrint(citizensData)} className="bg-slate-800 text-white hover:bg-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"><Printer size={16}/> Print PDF</button>
          <button onClick={() => triggerDownloadPDF(citizensData)} className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"><Download size={16}/></button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by Name, Mobile, Place..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-2 bg-white border border-slate-200 rounded-lg font-medium outline-none focus:border-teal-500" />
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-teal-500">
          <option value="visits">Sort by Most Visits</option>
          <option value="recent">Sort by Most Recent</option>
          <option value="name">Sort Alphabetically</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
          <thead className="bg-slate-100 border-y border-slate-200 text-slate-500 uppercase text-xs tracking-widest font-black">
            <tr>
              <th className="px-4 py-3">Citizen Name & Desig.</th>
              <th className="px-4 py-3">Contact Info</th>
              <th className="px-4 py-3">Location / Address</th>
              <th className="px-4 py-3 text-center">Total Visits</th>
              <th className="px-4 py-3">Last Visit Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {citizensData.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="font-bold text-slate-800 text-base">{c.name}</span>
                  {c.gender && <span className="text-[10px] text-slate-500 ml-2">({c.gender})</span>}
                  {c.designation && <span className="block text-xs text-teal-600 font-bold uppercase tracking-wider">{c.designation}</span>}
                </td>
                <td className="px-4 py-3 font-medium text-slate-600"><span className="flex items-center gap-1.5"><Phone size={12}/> {c.mobileNumber}</span>{c.whatsappNumber && <span className="flex items-center gap-1.5 mt-1 text-green-600"><MessageSquare size={12}/> {c.whatsappNumber}</span>}</td>
                <td className="px-4 py-3 text-xs font-medium text-slate-500">
                  <span className="block text-slate-700 font-bold">{c.place || '-'}, PO: {c.postOffice || '-'}, PIN: {c.pinCode || '-'}, {c.localBody || c.panchayat || '-'}</span>
                  {c.houseName && <span>{c.houseName} </span>} {c.wardNumber && <span>(Ward: {c.wardNumber})</span>}
                </td>
                <td className="px-4 py-3 text-center"><span className="bg-slate-800 text-white font-black px-3 py-1 rounded-full">{c.visits}</span></td>
                <td className="px-4 py-3 text-xs font-bold text-slate-500">{formatDate(c.lastVisit)}</td>
              </tr>
            ))}
            {citizensData.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-slate-500 font-medium">No citizens match search criteria.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Print Citizen Directory
const PrintCitizenDirectory = ({ citizens, id, mode }) => {
  const wrapperClass = mode === 'print' ? 'hidden print:block w-full bg-white text-black font-sans min-h-screen' : 'absolute top-[-9999px] left-[-9999px] w-[210mm] bg-white text-black font-sans print-hidden';
  return (
    <div id={id} className={wrapperClass}>
      <div className="p-8 mx-auto bg-white">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-widest mb-1 text-slate-800">PK Navas MLA Office</h1>
          <h2 className="text-lg font-semibold text-slate-500 uppercase tracking-widest">Citizen Directory & Visit Log</h2>
          <p className="mt-2 text-xs text-slate-400">Generated: {new Date().toLocaleString('en-IN')}</p>
        </div>
        <table className="w-full text-xs border-collapse mb-8" style={{ border: '1px solid #cbd5e1' }}>
          <thead>
            <tr className="bg-slate-100 text-left uppercase tracking-wider text-slate-600">
              <th className="p-2" style={{ border: '1px solid #cbd5e1' }}>Name & Designation</th>
              <th className="p-2" style={{ border: '1px solid #cbd5e1' }}>Contact</th>
              <th className="p-2" style={{ border: '1px solid #cbd5e1' }}>Location</th>
              <th className="p-2 text-center" style={{ border: '1px solid #cbd5e1' }}>Visits</th>
            </tr>
          </thead>
          <tbody>
            {citizens.map((c,i) => (
              <tr key={i} className="break-inside-avoid">
                <td className="p-2" style={{ border: '1px solid #cbd5e1' }}>
                  <strong className="text-sm block">{c.name} {c.gender && `(${c.gender})`}</strong>
                  {c.designation && <span className="text-[10px] text-slate-500 uppercase">{c.designation}</span>}
                </td>
                <td className="p-2" style={{ border: '1px solid #cbd5e1' }}><strong className="block">{c.mobileNumber}</strong>{c.whatsappNumber && <span>WA: {c.whatsappNumber}</span>}</td>
                <td className="p-2" style={{ border: '1px solid #cbd5e1' }}>
                  <strong>{c.place || '-'}, PO: {c.postOffice || '-'}, PIN: {c.pinCode || '-'}, {c.localBody || c.panchayat || '-'}</strong><br/>
                  <span className="text-[10px]">{c.houseName}</span>
                </td>
                <td className="p-2 text-center font-bold text-sm" style={{ border: '1px solid #cbd5e1' }}>{c.visits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminSettings = ({ users, updateUserDoc }) => {
  const handleToggle = (id, field) => {
    const u = users.find(u => u.id === id);
    updateUserDoc(id, field, !u[field]);
  };
  const handleChange = (id, field, value) => updateUserDoc(id, field, value);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in">
      <div className="mb-8 border-b border-slate-100 pb-6"><h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Settings className="text-indigo-600"/> Security & Contacts</h2></div>
      <div className="space-y-6">
        {users.filter(u => u.role !== 'admin').map(u => (
          <div key={u.id} className={`p-6 rounded-2xl border transition-all ${!u.enabled ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center justify-between"><span className="font-black text-lg text-slate-800">{u.id.toUpperCase()}</span><button onClick={() => handleToggle(u.id, 'enabled')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${u.enabled ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{u.enabled ? 'Disable' : 'Enable'}</button></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Display Name</label><input type="text" value={u.name} onChange={e=>handleChange(u.id, 'name', e.target.value)} disabled={!u.enabled} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold outline-none focus:border-indigo-500 disabled:bg-slate-100"/></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Password</label><input type="text" value={u.pass} onChange={e=>handleChange(u.id, 'pass', e.target.value)} disabled={!u.enabled} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 outline-none focus:border-indigo-500 disabled:bg-slate-100"/></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Phone Number</label><input type="text" value={u.phone} onChange={e=>handleChange(u.id, 'phone', e.target.value)} disabled={!u.enabled} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold outline-none focus:border-indigo-500"/></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">WhatsApp Number</label><input type="text" value={u.whatsapp} onChange={e=>handleChange(u.id, 'whatsapp', e.target.value)} disabled={!u.enabled} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold outline-none focus:border-indigo-500"/></div>
                </div>
              </div>
              <div className="flex-1 w-full lg:w-auto bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Capabilities</h4>
                <label className="flex items-center justify-between cursor-pointer"><span className="text-sm font-bold text-slate-700">Can Input</span><input type="checkbox" checked={u.canInput} onChange={()=>handleToggle(u.id, 'canInput')} className="w-4 h-4"/></label>
                <label className="flex items-center justify-between cursor-pointer"><span className="text-sm font-bold text-slate-700">Detailed Reports</span><input type="checkbox" checked={u.canSeeReports} onChange={()=>handleToggle(u.id, 'canSeeReports')} className="w-4 h-4"/></label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Database & Backup Management (Manual JSON Export/Import & Reset)
const AdminDatabase = ({ tasks, users, backupMeta, updateBackupMeta }) => {
  const [backupTarget, setBackupTarget] = useState('all');
  const [resetTarget, setResetTarget] = useState('all');
  const [resetText, setResetText] = useState('');
  
  const handleBackup = async () => {
    const exportData = backupTarget === 'all' ? tasks : tasks.filter(t => t.assignedTo.includes(backupTarget));
    if (exportData.length === 0) return alert("No data to backup for this selection.");

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `MLA_Backup_${backupTarget}_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    const targetName = backupTarget === 'all' ? 'All Data' : users.find(u=>u.id===backupTarget)?.name;
    await updateBackupMeta({ lastBackup: getNow(), lastBackupType: targetName });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) return alert("Invalid Backup File Format.");
        if (!window.confirm(`Are you sure you want to import ${data.length} records? This will overwrite existing records with the same Reference IDs.`)) {
          e.target.value = null; // reset input
          return;
        }

        let count = 0;
        for (const task of data) {
          // Validating it has an ID before overwriting
          if (task.id) {
            await setDoc(getDocRef('tasks', task.id), task);
            count++;
          }
        }
        await updateBackupMeta({ lastImport: getNow(), lastImportCount: count });
        alert(`Successfully imported and updated ${count} records!`);
        e.target.value = null;
      } catch(err) {
        alert("Error parsing JSON file. Make sure it's a valid backup file.");
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    const targetName = resetTarget === 'all' ? 'All' : users.find(u=>u.id===resetTarget)?.name;
    const expectedPhrase = resetTarget === 'all' ? 'Delete Data All' : `Delete Data of ${targetName}`;
    
    if (resetText !== expectedPhrase) {
      return alert(`Verification text does not match! You must type exactly:\n${expectedPhrase}`);
    }

    if (!window.confirm(`CRITICAL WARNING: This will permanently erase data. Are you absolutely sure?`)) return;

    const tasksToDelete = resetTarget === 'all' ? tasks : tasks.filter(t => t.assignedTo.includes(resetTarget));
    let count = 0;
    for (const t of tasksToDelete) {
       await deleteDoc(getDocRef('tasks', t.id));
       count++;
    }
    
    setResetText('');
    alert(`Successfully deleted ${count} records.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Backup Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-6"><Download className="text-blue-600"/> Data Backup (Export JSON)</h2>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Select Data to Backup</label>
            <select value={backupTarget} onChange={e=>setBackupTarget(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 mb-4">
              <option value="all">Entire Database (All Officers & Admin)</option>
              {users.map(u => <option key={u.id} value={u.id}>Only {u.name}'s Data</option>)}
            </select>
            <button onClick={handleBackup} className="bg-blue-600 text-white font-black py-3 px-6 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow">
              <Download size={18}/> Generate & Download JSON
            </button>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 h-full flex flex-col justify-center">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Last Backup Information</p>
            {backupMeta?.lastBackup ? (
              <>
                <p className="font-bold text-blue-900 text-lg">{formatDate(backupMeta.lastBackup)}</p>
                <p className="text-sm font-medium text-blue-700">Type: <span className="font-bold">{backupMeta.lastBackupType}</span></p>
              </>
            ) : <p className="font-bold text-blue-900">No previous backups recorded.</p>}
          </div>
        </div>
      </div>

      {/* Import Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-6"><Upload className="text-indigo-600"/> Data Restore (Import JSON)</h2>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Upload JSON File</label>
            <input type="file" accept=".json" onChange={handleImport} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><AlertTriangle size={12}/> If importing duplicated IDs, existing records will be perfectly overwritten without loss of new data.</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 h-full flex flex-col justify-center">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Last Import Information</p>
            {backupMeta?.lastImport ? (
              <>
                <p className="font-bold text-indigo-900 text-lg">{formatDate(backupMeta.lastImport)}</p>
                <p className="text-sm font-medium text-indigo-700">Records Restored: <span className="font-bold">{backupMeta.lastImportCount}</span></p>
              </>
            ) : <p className="font-bold text-indigo-900">No previous imports recorded.</p>}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-3xl shadow-sm border-2 border-red-200 p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 scale-150 text-red-600"><AlertOctagon size={200}/></div>
        <h2 className="text-2xl font-black text-red-700 flex items-center gap-2 mb-6 relative z-10"><AlertOctagon className="text-red-600"/> Danger Zone: Data Erasure</h2>
        
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <label className="text-xs font-black text-red-500 uppercase tracking-widest block mb-2">Select Data to Delete Permanently</label>
              <select value={resetTarget} onChange={e=>setResetTarget(e.target.value)} className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl font-bold text-red-900 outline-none focus:ring-2 focus:ring-red-500 mb-6">
                <option value="all">Entire Database (All Officers & Admin)</option>
                {users.map(u => <option key={u.id} value={u.id}>Only {u.name}'s Data</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-red-500 uppercase tracking-widest block mb-2">
                Type <span className="font-mono bg-red-200 px-1 text-red-800">{resetTarget === 'all' ? 'Delete Data All' : `Delete Data of ${users.find(u=>u.id===resetTarget)?.name}`}</span> to confirm:
              </label>
              <input type="text" value={resetText} onChange={e=>setResetText(e.target.value)} placeholder="Strict verification text..." className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl font-bold text-red-900 outline-none focus:ring-2 focus:ring-red-500 mb-4" />
              <button onClick={handleReset} className="w-full bg-red-600 text-white font-black py-3 px-6 rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 shadow">
                <Trash2 size={18}/> PERMANENTLY DELETE DATA
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

// Report Config Modal
const ReportConfigModal = ({ onClose, onGenerate, triggerDownloadPDF }) => {
  const [range, setRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handleGenerate = (isDownload) => {
    const conf = { range, customStart, customEnd };
    if (isDownload) triggerDownloadPDF(conf);
    else onGenerate(conf);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
          <h3 className="font-black text-lg flex items-center gap-2"><FileOutput size={20}/> Generate Master Report</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Time Duration</label>
            <select value={range} onChange={e=>setRange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All Time</option>
              <option value="1week">Last 1 Week</option>
              <option value="1month">Last 1 Month</option>
              <option value="6months">Last 6 Months</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
          {range === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black text-slate-500 uppercase">From</label><input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="w-full border p-2 rounded-lg font-bold text-sm"/></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase">To</label><input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="w-full border p-2 rounded-lg font-bold text-sm"/></div>
            </div>
          )}
          <div className="flex gap-3">
             <button onClick={() => handleGenerate(false)} className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow transition-colors"><Printer size={18}/> Print</button>
             <button onClick={() => handleGenerate(true)} className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-black flex items-center justify-center gap-2 shadow transition-colors"><Download size={18}/> PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
};


// Admin Direct Assignment Panel
const AdminDirectAssignments = ({ users, tasks, addTask, triggerPrint, triggerDetailsPrint, triggerViewDetails, updateTask, deleteTask }) => {
  const [desc, setDesc] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  
  const handleAssign = async (e) => {
    e.preventDefault();
    if(!desc || assignedTo.length===0) return alert("Fill description and select assignee");
    const newTask = {
      id: generateId(), types: ['Direct Assignment'], category: 'Direct Assignment', taskType: 'direct',
      subject: 'MLA Assignment',
      personalDetails: { name: 'Internal Assignment', mobileNumber: 'N/A' },
      description: desc, assignedTo, status: 'Pending', officerStatuses: {}, priority: 'High',
      createdAt: getNow(), createdBy: 'PK Navas', timeline: [{ id: generateUid(), type: 'created', time: getNow(), by: 'PK Navas', text: 'Assignment Created' }]
    };
    await addTask(newTask); setDesc(''); setAssignedTo([]);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAssign} className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl shadow-sm">
        <h3 className="text-xl font-black text-indigo-900 mb-4 flex items-center gap-2"><Zap size={20}/> Create Direct Assignment</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <textarea required value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Write details of the assignment..." className="w-full p-4 rounded-xl border border-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500 h-32 font-medium"></textarea>
          <div>
            <p className="text-sm font-black text-indigo-800 uppercase mb-3">Assign To Officers:</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {users.filter(u=>u.role!=='admin').map(u => (
                <label key={u.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-indigo-100 cursor-pointer text-sm font-bold text-indigo-900"><input type="checkbox" checked={assignedTo.includes(u.id)} onChange={()=>setAssignedTo(prev=>prev.includes(u.id)?prev.filter(id=>id!==u.id):[...prev, u.id])} className="rounded text-indigo-600"/> {u.name}</label>
              ))}
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl shadow hover:bg-indigo-700">Assign Work</button>
          </div>
        </div>
      </form>
      <AdminGlobalView tasks={tasks.filter(t=>t.taskType==='direct')} updateTask={updateTask} deleteTask={deleteTask} users={users} triggerPrint={triggerPrint} triggerDetailsPrint={triggerDetailsPrint} triggerViewDetails={triggerViewDetails} categories={['Direct Assignment']} />
    </div>
  );
};


const StatCard = ({ title, value, color, icon }) => {
  const cMap = { 
    blue: 'bg-blue-50 text-blue-600 border-blue-200', 
    green: 'bg-green-50 text-green-600 border-green-200', 
    amber: 'bg-amber-50 text-amber-600 border-amber-200', 
    red: 'bg-red-50 text-red-600 border-red-200', 
    slate: 'bg-slate-100 text-slate-600 border-slate-300',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200' 
  };
  return (
    <div className={`p-6 rounded-2xl border ${cMap[color]} relative overflow-hidden shadow-sm flex flex-col justify-between`}>
      <div className="absolute -right-4 -top-4 opacity-10 scale-150">{icon}</div><div className="bg-white/60 w-fit p-3 rounded-xl backdrop-blur-sm mb-4 shadow-sm">{icon}</div>
      <div><p className="text-4xl font-black tracking-tight">{value}</p><p className="text-xs font-black uppercase tracking-widest mt-1 opacity-80">{title}</p></div>
    </div>
  );
};

const AdminGlobalView = ({ tasks, updateTask, deleteTask, users, triggerPrint, triggerDetailsPrint, triggerViewDetails, categories }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const filtered = tasks.filter(t => 
    (catFilter === 'All' || t.category === catFilter || (catFilter === 'Direct Assignment' && t.taskType === 'direct')) && 
    (
      t.id.toLowerCase().includes(search.toLowerCase()) || 
      (t.subject||'').toLowerCase().includes(search.toLowerCase()) || 
      t.personalDetails.name.toLowerCase().includes(search.toLowerCase()) || 
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.personalDetails.mobileNumber||'').includes(search)
    )
  ).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  
  const toggleUnsolved = (task) => updateTask(task.id, { status: task.status === 'Unsolved' ? 'Pending' : 'Unsolved' });
  const togglePriority = (task) => {
    const p = ['Low', 'Medium', 'High'];
    const next = p[(p.indexOf(task.priority || 'Medium') + 1) % 3];
    updateTask(task.id, { priority: next });
  };

  const getPriorityColor = (priority) => {
    if (priority === 'High') return 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200';
    if (priority === 'Low') return 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200';
    return 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200';
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return 'text-green-600';
    if (status === 'In Progress') return 'text-amber-600';
    if (status === 'Unsolved') return 'text-slate-500';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search entries by Subject, Name, ID, Mobile..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500" /></div>
        {categories && (
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="px-4 py-2.5 border border-slate-300 rounded-xl font-medium outline-none bg-white focus:ring-2 focus:ring-blue-500 min-w-[150px]">
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(t => (
          <div key={t.id} className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col transition-all relative overflow-hidden ${t.status === 'Unsolved' ? 'border-slate-300 bg-slate-50 opacity-75 grayscale' : 'border-slate-200 hover:shadow-md hover:border-blue-300'}`}>
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

            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-2 mt-auto">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">Assigned:</span>
                <span className="font-black text-slate-700 text-right truncate max-w-[120px]" title={t.assignedTo.map(id => users.find(u=>u.id===id)?.name || id).join(', ')}>
                  {t.assignedTo.map(id => users.find(u=>u.id===id)?.name || id).join(', ')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">Status:</span>
                <span className={`font-black uppercase tracking-wider ${getStatusColor(t.status)}`}>{t.status}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">Priority:</span>
                <button onClick={() => togglePriority(t)} className={`font-black uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${getPriorityColor(t.priority || 'Medium')}`}>
                  {t.priority || 'Medium'}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button onClick={() => triggerViewDetails(t)} className="flex-1 bg-slate-800 text-white font-bold py-2 rounded-xl text-xs hover:bg-black transition-colors">Details</button>
              <button onClick={() => toggleUnsolved(t)} className={`px-3 rounded-xl border flex items-center justify-center transition-colors ${t.status==='Unsolved' ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`} title={t.status==='Unsolved' ? "Reopen" : "Mark Unsolved"}>{t.status==='Unsolved' ? <Activity size={14}/> : <UserX size={14}/>}</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full py-10 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-200">No records found.</div>}
      </div>
    </div>
  );
};

const TaskDetailsModal = ({ task, onClose, updateTask, deleteTask, users, triggerDetailsPrint, triggerDownloadPDF }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(task);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const saveEdit = async () => { 
    await updateTask(task.id, editForm); 
    setIsEditing(false); 
  };
  
  const handleEditChange = (field, value, isPersonal = false) => {
    if (isPersonal) {
      setEditForm(prev => ({ ...prev, personalDetails: { ...prev.personalDetails, [field]: value } }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const delUpd = async (uid) => { 
    if(window.confirm('Delete this timeline update?')) { 
      const newTl = task.timeline.filter(t => t.id !== uid); 
      await updateTask(task.id, { timeline: newTl }); 
      setEditForm({...editForm, timeline: newTl}); 
    } 
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 py-10 overflow-y-auto print-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* FIXED HEADER */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
          <div><h2 className="text-2xl font-black">Input Profile</h2><p className="text-slate-400 font-bold tracking-widest text-xs uppercase mt-1">ID: {task.id}</p></div>
          <div className="flex gap-3">
            <button onClick={() => triggerDetailsPrint(task)} title="Print Complete Report" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"><Printer size={18}/> Print</button>
            <button onClick={() => triggerDownloadPDF(task)} title="Download PDF" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"><Download size={18}/> PDF</button>
            <button onClick={async () => { if(await deleteTask(task.id)) onClose(); }} title="Delete Input" className="bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors"><Trash2 size={20}/></button>
            <button onClick={onClose} title="Close (Esc)" className="bg-white/10 hover:bg-white/30 px-4 py-2 rounded-lg text-white border border-white/20 flex items-center gap-2 font-bold transition-colors"><X size={20}/> Close</button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto bg-slate-50">
          {/* Left Column: Details */}
          <div className="p-8 md:w-1/2 border-r border-slate-200 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-xl text-slate-800">Master Data</h3>
              <button onClick={() => setIsEditing(!isEditing)} className={`font-bold text-sm flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isEditing ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                {isEditing ? <><X size={14}/> Cancel</> : <><Edit size={14}/> Edit All</>}
              </button>
            </div>
            
            {isEditing ? (
              <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-inner">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Citizen Name</label><input type="text" value={editForm.personalDetails.name} onChange={e=>handleEditChange('name', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg font-bold outline-none focus:border-blue-500"/></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Designation</label><input type="text" value={editForm.personalDetails.designation || ''} onChange={e=>handleEditChange('designation', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg outline-none focus:border-blue-500"/></div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gender</label>
                    <select value={editForm.personalDetails.gender || ''} onChange={e=>handleEditChange('gender', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg font-bold outline-none focus:border-blue-500">
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Referral Person</label><input type="text" value={editForm.personalDetails.referralPerson || ''} onChange={e=>handleEditChange('referralPerson', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg font-bold outline-none focus:border-blue-500"/></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mobile</label><input type="text" value={editForm.personalDetails.mobileNumber} onChange={e=>handleEditChange('mobileNumber', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg font-bold outline-none focus:border-blue-500"/></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">WhatsApp</label><input type="text" value={editForm.personalDetails.whatsappNumber || ''} onChange={e=>handleEditChange('whatsappNumber', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg outline-none focus:border-blue-500"/></div>
                  <div className="col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">House Name</label><input type="text" value={editForm.personalDetails.houseName || ''} onChange={e=>handleEditChange('houseName', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg outline-none focus:border-blue-500"/></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Place Name</label><input type="text" value={editForm.personalDetails.place || ''} onChange={e=>handleEditChange('place', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg outline-none focus:border-blue-500"/></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Post Office</label><input type="text" value={editForm.personalDetails.postOffice || ''} onChange={e=>handleEditChange('postOffice', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg outline-none focus:border-blue-500"/></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PIN Code</label><input type="text" value={editForm.personalDetails.pinCode || ''} onChange={e=>handleEditChange('pinCode', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg outline-none focus:border-blue-500"/></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Local Body</label>
                    <input type="text" value={editForm.personalDetails.localBody || editForm.personalDetails.panchayat || ''} onChange={e=>handleEditChange('localBody', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg outline-none focus:border-blue-500"/>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ward Number</label><input type="text" value={editForm.personalDetails.wardNumber || ''} onChange={e=>handleEditChange('wardNumber', e.target.value, true)} className="w-full border border-slate-300 p-2 rounded-lg outline-none focus:border-blue-500"/></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</label>
                    <select value={editForm.priority || 'Medium'} onChange={e=>handleEditChange('priority', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg font-bold outline-none focus:border-blue-500">
                      <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                    </select>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                    <select value={editForm.status} onChange={e=>handleEditChange('status', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg font-bold outline-none focus:border-blue-500">
                      <option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Unsolved">Unsolved</option>
                    </select>
                  </div>
                  <div className="col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject</label><input type="text" value={editForm.subject} onChange={e=>handleEditChange('subject', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg font-bold outline-none focus:border-blue-500"/></div>
                  <div className="col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label><textarea value={editForm.description} onChange={e=>handleEditChange('description', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg h-24 outline-none focus:border-blue-500"></textarea></div>
                </div>
                <button onClick={saveEdit} className="w-full bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition-colors shadow">Save Changes</button>
              </div>
            ) : (
              <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject & Category</p><p className="font-black text-slate-800 text-xl leading-tight mb-1">{task.subject || 'N/A'}</p><p className="font-bold text-slate-600 text-sm"><span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] mr-2">{task.types.join(', ')}</span> {task.category}</p></div>
                
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Citizen Information</p>
                  <p className="font-black text-slate-800 text-lg">
                    {task.personalDetails.name}
                    {task.personalDetails.gender && <span className="text-xs text-slate-500 font-bold ml-2">({task.personalDetails.gender})</span>}
                  </p>
                  {task.personalDetails.designation && <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{task.personalDetails.designation}</p>}
                  <p className="font-bold text-slate-600 mt-2 flex items-center gap-2"><Phone size={14}/> {task.personalDetails.mobileNumber}</p>
                  <p className="font-medium text-slate-500 text-sm mt-2 flex gap-2 items-start"><MapPin size={14} className="shrink-0 mt-0.5"/> 
                    <span>
                      {task.personalDetails.houseName ? `${task.personalDetails.houseName}, ` : ''}
                      {task.personalDetails.place || '-'}, PO: {task.personalDetails.postOffice || '-'}, PIN: {task.personalDetails.pinCode || '-'}<br/>
                      {task.personalDetails.localBody || task.personalDetails.panchayat || '-'}<br/>Ward: {task.personalDetails.wardNumber || 'N/A'}
                    </span>
                  </p>
                  {task.personalDetails.referralPerson && <p className="font-bold text-slate-700 mt-3 text-sm bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-200">Referred by: {task.personalDetails.referralPerson}</p>}
                </div>
                
                {task.description && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
                    <p className="font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap text-sm leading-relaxed">{task.description}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p><p className="font-black text-slate-800 text-lg uppercase">{task.status}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</p><p className="font-black text-slate-800 text-lg uppercase">{task.priority || 'Medium'}</p></div>
                  <div className="col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Officers</p><p className="font-bold text-slate-700 text-sm">{task.assignedTo.map(id => users.find(u=>u.id===id)?.name || id).join(', ')}</p></div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Timeline */}
          <div className="p-8 md:w-1/2 bg-white">
            <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><Activity className="text-blue-600"/> Action Timeline</h3>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-8">
              {task.timeline.map((ev) => (
                <div key={ev.id} className="relative pl-6">
                  <div className="absolute -left-[13px] top-0 bg-white border-2 border-white rounded-full"><TimelineIcon type={ev.type} /></div>
                  <div className="flex justify-between items-start bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{formatDate(ev.time)} • {formatTime(ev.time)}</p>
                      <p className="font-bold text-slate-800 text-sm">{ev.text}</p>
                      <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase tracking-wider">By: {ev.by}</p>
                    </div>
                    {ev.type === 'update' && !isEditing && <button onClick={()=>delUpd(ev.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={14}/></button>}
                  </div>
                </div>
              ))}
              {task.timeline.length === 0 && <p className="text-slate-400 font-medium italic pl-6">No actions recorded yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PrintTaskDetailsReport = ({ task, users, id, mode }) => {
  const wrapperClass = mode === 'print' ? 'hidden print:block w-full bg-white text-black font-sans' : 'absolute top-[-9999px] left-[-9999px] w-[210mm] bg-white text-black font-sans print-hidden';
  return (
    <div id={id} className={wrapperClass}>
       <div className="p-10 mx-auto w-full max-w-[210mm] text-sm">
          <div className="border-b-2 border-slate-800 pb-4 mb-8 text-center break-inside-avoid">
              <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900">PK Navas MLA Office</h1>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Detailed Input Report</h2>
          </div>
          
          <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200 break-inside-avoid">
             <div><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Reference ID</p><p className="text-xl font-black text-slate-900">{task.id}</p></div>
             <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Date Received</p><p className="text-lg font-bold text-slate-800">{formatDate(task.createdAt)}</p></div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
             <div>
                <h3 className="text-sm font-black mb-3 uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1">Subject & Category</h3>
                <p className="font-bold text-slate-800 text-lg mb-1">{task.subject || 'N/A'}</p>
                <p className="font-bold text-slate-600"><span className="bg-slate-200 px-2 py-0.5 rounded text-xs mr-2">{task.types.join(', ')}</span> {task.category}</p>
             </div>
             <div>
                <h3 className="text-sm font-black mb-3 uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1">Citizen Details</h3>
                <p className="font-bold text-slate-800 text-base">{task.personalDetails.name} {task.personalDetails.gender && `(${task.personalDetails.gender})`}</p>
                {task.personalDetails.designation && <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{task.personalDetails.designation}</p>}
                <p className="font-medium text-slate-600 mt-1">{task.personalDetails.mobileNumber}</p>
                <p className="font-medium text-slate-500 text-sm mt-1">{task.personalDetails.houseName ? `${task.personalDetails.houseName}, ` : ''}{task.personalDetails.place || '-'}, PO: {task.personalDetails.postOffice || '-'}, PIN: {task.personalDetails.pinCode || '-'}, {task.personalDetails.localBody || task.personalDetails.panchayat || '-'}</p>
                {task.personalDetails.referralPerson && <p className="font-bold text-slate-700 mt-2 text-sm">Referred by: {task.personalDetails.referralPerson}</p>}
             </div>
          </div>

          {task.description && (
             <div className="mb-8 break-inside-avoid">
                <h3 className="text-sm font-black mb-3 uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1">Description</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                   {task.description}
                </div>
             </div>
          )}

          <div className="mb-8 break-inside-avoid">
             <h3 className="text-sm font-black mb-3 uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1">Assignments & Status</h3>
             <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl">
                 <div><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Assigned To</p><p className="font-bold text-slate-800 text-sm mt-1">{task.assignedTo.map(id => users.find(u=>u.id===id)?.name || id).join(', ')}</p></div>
                 <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Priority / Status</p>
                    <p className="font-black text-slate-900 text-lg uppercase mt-1">{task.priority || 'Medium'} / {task.status}</p>
                 </div>
             </div>
          </div>

          <div className="mt-4">
             <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 break-inside-avoid">Complete Action Timeline</h3>
             <div className="">
               {task.timeline.map((ev) => (
                 <div key={ev.id} className="flex gap-4 items-start border-l-2 border-slate-300 pl-4 py-3 break-inside-avoid">
                   <div className="w-1/4 shrink-0">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{formatDate(ev.time)}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">By: {ev.by}</p>
                   </div>
                   <div className="w-3/4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-800 text-sm">{ev.text}</p>
                   </div>
                 </div>
               ))}
               {task.timeline.length === 0 && <p className="text-slate-400 font-medium italic">No actions recorded.</p>}
             </div>
          </div>

          <div className="mt-12 pt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 break-inside-avoid">
            *** End of Document ***
          </div>
       </div>
    </div>
  );
};

const PrintAcknowledgeSlip = ({ task, id, mode }) => {
  const wrapperClass = mode === 'print' ? 'hidden print:flex w-full bg-white text-black font-sans min-h-screen flex-col' : 'absolute top-[-9999px] left-[-9999px] w-[210mm] min-h-[297mm] bg-white text-black font-sans flex flex-col print-hidden';
  return (
    <div id={id} className={wrapperClass}>
      {/* 75% Top - Office Copy */}
      <div className="flex-[3] p-10 flex flex-col relative box-border border-b-2 border-dashed border-slate-400">
         <div className="text-center border-b-2 border-slate-800 pb-4 mb-6 shrink-0">
            <h1 className="text-2xl font-black tracking-widest uppercase text-slate-900">PK Navas MLA Office</h1>
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase mt-1">Official Office Copy</h2>
         </div>

         <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 border border-slate-200 rounded-lg shrink-0">
             <div><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Reference ID</p><p className="text-xl font-black text-slate-900">{task.id}</p></div>
             <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Date</p><p className="text-base font-bold text-slate-800">{formatDate(task.createdAt)}</p></div>
         </div>

         <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-6 shrink-0">
             <div><span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider mb-1">Citizen Name</span> <strong className="text-base">{task.personalDetails.name}</strong> {task.personalDetails.designation && <span className="text-[10px] bg-slate-200 px-1 rounded ml-1 uppercase">{task.personalDetails.designation}</span>}</div>
             <div><span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider mb-1">Contact</span> <strong>{task.personalDetails.mobileNumber}</strong></div>
             <div><span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider mb-1">Referral</span> <strong>{task.personalDetails.referralPerson || '-'}</strong></div>
             <div><span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider mb-1">Address</span> <strong>{task.personalDetails.place || '-'}, PO: {task.personalDetails.postOffice || '-'}, PIN: {task.personalDetails.pinCode || '-'}, {task.personalDetails.localBody || task.personalDetails.panchayat || '-'}</strong></div>
         </div>

         <div className="mb-4 shrink-0">
            <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider mb-1">Category & Type</span>
            <div className="font-bold text-slate-800"><span className="bg-slate-200 px-2 py-0.5 rounded text-xs mr-2">{task.types.join(', ')}</span> {task.category}</div>
         </div>

         <div className="mb-6 flex-1 min-h-[100px] flex flex-col overflow-hidden">
            <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider mb-1">Subject & Description</span>
            <div className="font-bold text-slate-800 mb-2">{task.subject || '-'}</div>
            {task.description && <div className="p-3 border border-slate-200 bg-slate-50 rounded-lg text-xs whitespace-pre-wrap flex-1 overflow-hidden text-ellipsis">{task.description}</div>}
         </div>

         <div className="mt-auto flex justify-between pt-8 shrink-0">
            <div className="text-center"><div className="w-40 border-t-2 border-slate-800 pt-2 font-bold uppercase text-[10px] tracking-widest">Citizen Sign</div></div>
            <div className="text-center"><div className="w-40 border-t-2 border-slate-800 pt-2 font-bold uppercase text-[10px] tracking-widest">Office Seal & Sign</div></div>
         </div>
         <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 bg-white px-4 text-slate-400 flex items-center gap-2"><Scissors size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Cut Here</span></div>
      </div>

      {/* 25% Bottom - Citizen Copy */}
      <div className="flex-1 p-10 bg-slate-50 flex flex-col justify-center box-border">
         <div className="flex justify-between items-start mb-4">
             <div>
                <h1 className="text-xl font-black tracking-widest uppercase text-slate-900">PK Navas MLA Office</h1>
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mt-1">Citizen Token</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ref ID</p>
                <p className="text-xl font-black text-slate-900 bg-white border border-slate-300 shadow-sm px-3 py-1 rounded-lg">{task.id}</p>
             </div>
         </div>
         <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-xs mb-4">
             <div><span className="text-slate-500 font-bold">Name:</span> <strong className="text-sm block">{task.personalDetails.name}</strong></div>
             <div><span className="text-slate-500 font-bold">Date:</span> <strong className="block">{formatDate(task.createdAt)}</strong></div>
             <div><span className="text-slate-500 font-bold">Category:</span> <strong className="block">{task.category}</strong></div>
             <div className="truncate"><span className="text-slate-500 font-bold">Subject:</span> <strong className="block truncate">{task.subject}</strong></div>
         </div>
         <p className="text-[11px] text-center text-slate-500 font-medium italic mt-auto border-t border-slate-200 pt-4">Thank you for visiting. Your request has been securely registered.</p>
      </div>
    </div>
  );
};

// --- PRINT MASTER REPORT ---
const PrintMasterReport = ({ config, tasks, users, categories, id, mode }) => {
  // 1. Filter tasks by date range
  const filteredTasks = useMemo(() => {
    let now = new Date();
    let past = new Date();
    if (config.range === '1week') past.setDate(now.getDate() - 7);
    if (config.range === '1month') past.setMonth(now.getMonth() - 1);
    if (config.range === '6months') past.setMonth(now.getMonth() - 6);
    
    return tasks.filter(t => {
      const d = new Date(t.createdAt);
      if (config.range === 'custom') {
        const start = config.customStart ? new Date(config.customStart) : new Date(0);
        const end = config.customEnd ? new Date(config.customEnd) : new Date();
        end.setHours(23,59,59);
        return d >= start && d <= end;
      }
      if (config.range !== 'all') return d >= past;
      return true;
    }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, config]);

  // 2. Global Stats
  const total = filteredTasks.length;
  const comp = filteredTasks.filter(t => t.status === 'Completed').length;
  const inprog = filteredTasks.filter(t => t.status === 'In Progress').length;
  const pend = filteredTasks.filter(t => t.status === 'Pending').length;
  const overdue = filteredTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'Completed').length;

  // 3. Category Stats
  const catStats = categories.map(cat => ({
    name: cat, count: filteredTasks.filter(t => t.category === cat).length
  })).sort((a,b)=>b.count-a.count);

  // 4. Staff Performance
  const staffPerf = users.filter(u=>u.role!=='admin').map(u => {
    const assigned = filteredTasks.filter(t => t.assignedTo.includes(u.id));
    const uComp = assigned.filter(t => t.officerStatuses && t.officerStatuses[u.id] === 'Completed').length;
    const rate = assigned.length ? ((uComp / assigned.length) * 100).toFixed(0) : 0;
    return { name: u.name, total: assigned.length, completed: uComp, rate: Number(rate) };
  }).sort((a,b)=>b.rate - a.rate);
  
  const topPerf = staffPerf.length && staffPerf[0].total > 0 ? staffPerf[0].name : 'N/A';

  const rangeLabel = { all: 'All Time', '1week': 'Last 7 Days', '1month': 'Last 30 Days', '6months': 'Last 6 Months', custom: `Custom Range (${config.customStart} to ${config.customEnd})` };

  const wrapperClass = mode === 'print' ? 'hidden print:block w-full bg-white text-black font-sans' : 'absolute top-[-9999px] left-[-9999px] w-[210mm] bg-white text-black font-sans print-hidden';

  return (
    <div id={id} className={wrapperClass}>
      <div className="max-w-[210mm] mx-auto bg-white p-8">
        {/* Header */}
        <div className="text-center border-b-4 border-slate-800 pb-4 mb-6 break-inside-avoid">
          <h1 className="text-3xl font-black uppercase tracking-widest mb-1">MLA Office - Tanur</h1>
          <h2 className="text-lg font-bold text-slate-600 uppercase tracking-widest">Master Performance Report</h2>
          <p className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-wider"><strong>Period:</strong> {rangeLabel[config.range]} | <strong>Generated:</strong> {new Date().toLocaleString('en-IN')}</p>
        </div>

        {/* Global Summary */}
        <div className="break-inside-avoid">
          <h3 className="text-sm font-black bg-slate-100 p-2 uppercase tracking-widest mb-4 text-center rounded border border-slate-200">Global Overview</h3>
          <div className="grid grid-cols-5 gap-2 mb-8 text-center">
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50"><p className="text-2xl font-black">{total}</p><p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mt-1">Total Inputs</p></div>
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50"><p className="text-2xl font-black">{comp}</p><p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mt-1">Completed</p></div>
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50"><p className="text-2xl font-black">{inprog}</p><p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mt-1">In Progress</p></div>
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50"><p className="text-2xl font-black">{pend}</p><p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mt-1">Pending</p></div>
            <div className="border border-slate-300 rounded-lg p-3 bg-white"><p className="text-2xl font-black">{overdue}</p><p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mt-1">Overdue</p></div>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="break-inside-avoid">
          <h3 className="text-sm font-black bg-slate-100 p-2 uppercase tracking-widest mb-4 text-center rounded border border-slate-200">Staff Performance Analytics</h3>
          <div className="mb-4 text-center">
            <p className="font-bold text-sm">Top Performing Officer: <span className="font-black ml-1 text-xs uppercase tracking-wider border border-slate-800 px-2 py-1 rounded">{topPerf}</span></p>
          </div>
          <table className="w-full text-sm border-collapse mb-8" style={{ border: '1px solid #cbd5e1' }}>
            <thead>
              <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px]">
                <th className="p-3 text-left font-black" style={{ border: '1px solid #cbd5e1' }}>Officer Name</th>
                <th className="p-3 text-center font-black" style={{ border: '1px solid #cbd5e1' }}>Assigned</th>
                <th className="p-3 text-center font-black" style={{ border: '1px solid #cbd5e1' }}>Completed</th>
                <th className="p-3 text-center font-black" style={{ border: '1px solid #cbd5e1' }}>Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {staffPerf.map((s,i) => (
                <tr key={i} className="bg-white">
                  <td className="p-3 font-bold" style={{ border: '1px solid #cbd5e1' }}>{s.name}</td>
                  <td className="p-3 text-center" style={{ border: '1px solid #cbd5e1' }}>{s.total}</td>
                  <td className="p-3 text-center" style={{ border: '1px solid #cbd5e1' }}>{s.completed}</td>
                  <td className="p-3 text-center font-black" style={{ border: '1px solid #cbd5e1' }}>{s.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Categories */}
        <div className="break-inside-avoid">
          <h3 className="text-sm font-black bg-slate-100 p-2 uppercase tracking-widest mb-4 text-center rounded border border-slate-200">Input Categories Breakdown</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8">
            {catStats.filter(c=>c.count>0).map((c,i) => (
              <div key={i} className="flex justify-between border-b border-slate-200 py-1 text-sm font-semibold">
                <span className="text-slate-600">{c.name}</span><span className="font-black">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <h3 className="text-sm font-black bg-slate-100 p-2 uppercase tracking-widest mb-4 text-center rounded border border-slate-200 break-inside-avoid">Detailed Records Highlight</h3>
        <table className="w-full text-[10px] border-collapse" style={{ border: '1px solid #cbd5e1' }}>
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider">
              <th className="p-2 text-left font-black" style={{ border: '1px solid #cbd5e1' }}>ID & Date</th>
              <th className="p-2 text-left font-black" style={{ border: '1px solid #cbd5e1' }}>Subject / Citizen</th>
              <th className="p-2 text-left font-black" style={{ border: '1px solid #cbd5e1' }}>Assigned To</th>
              <th className="p-2 text-center font-black" style={{ border: '1px solid #cbd5e1' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(t => (
              <tr key={t.id} className="bg-white break-inside-avoid">
                <td className="p-2 whitespace-nowrap" style={{ border: '1px solid #cbd5e1' }}><strong className="block text-slate-800">{t.id}</strong><span className="text-slate-500">{formatDate(t.createdAt)}</span></td>
                <td className="p-2" style={{ border: '1px solid #cbd5e1' }}><strong className="block text-slate-800 truncate max-w-[200px]">{t.subject || 'No Subject'}</strong><span className="text-slate-500">{t.personalDetails.name}</span></td>
                <td className="p-2 text-slate-700 font-semibold" style={{ border: '1px solid #cbd5e1' }}>{t.assignedTo.map(id => users.find(u=>u.id===id)?.name).join(', ')}</td>
                <td className="p-2 text-center font-bold" style={{ border: '1px solid #cbd5e1' }}>{t.status}</td>
              </tr>
            ))}
            {filteredTasks.length === 0 && <tr><td colSpan="4" className="p-4 text-center italic text-slate-500 font-medium" style={{ border: '1px solid #cbd5e1' }}>No records found in this date range.</td></tr>}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-12 pt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 break-inside-avoid">
          *** End of Master Report ***
        </div>
      </div>
    </div>
  );
};
