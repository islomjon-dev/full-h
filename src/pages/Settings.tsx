import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { Save, Sun, Moon, TestTube, Check, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { settings, updateSettings, activityLogs } = useData();
  const { theme, toggleTheme } = useTheme();
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });

  const [business, setBusiness] = useState({
    brandName: settings?.brandName || 'IBROHIM OKA CHORSU',
    receiptFooter: settings?.receiptFooter || 'Rahmat!',
    telegramBotToken: settings?.telegramBotToken || '',
    telegramChatId: settings?.telegramChatId || ''
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName, lastName: user.lastName, phone: user.phone, email: user.email });
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      setBusiness({
        brandName: settings.brandName || 'IBROHIM OKA CHORSU',
        receiptFooter: settings.receiptFooter || 'Rahmat!',
        telegramBotToken: settings.telegramBotToken || '',
        telegramChatId: settings.telegramChatId || ''
      });
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    await updateProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveBusiness = async () => {
    await updateSettings(business);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestTelegram = async () => {
    if (!business.telegramBotToken || !business.telegramChatId) {
      setTestStatus('error');
      setTestMessage("Bot token va Chat ID kiriting");
      return;
    }

    setTestStatus('testing');
    try {
      const response = await fetch(`https://api.telegram.org/bot${business.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: business.telegramChatId,
          text: '✅ HISSOB - IBROHIM OKA CHORSU\nTelegram ulanish muvaffaqiyatli test qilindi!'
        })
      });
      const data = await response.json();
      if (data.ok) {
        setTestStatus('success');
        setTestMessage('Test xabar muvaffaqiyatli yuborildi!');
      } else {
        setTestStatus('error');
        setTestMessage(data.description || "Xatolik yuz berdi");
      }
    } catch {
      setTestStatus('error');
      setTestMessage("Tarmoq xatoligi");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Sozlamalar</h1>

      {saved && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
          <Check size={16} /> Saqlandi!
        </div>
      )}

      {/* Profile */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-semibold mb-4">Profil</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ism</label>
              <input type="text" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Familiya</label>
              <input type="text" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
          </div>
          <button onClick={handleSaveProfile} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
            <Save size={14} /> Saqlash
          </button>
        </div>
      </div>

      {/* Business/Receipt */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-semibold mb-4">Biznes va Chek</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Brend nomi</label>
            <input type="text" value={business.brandName} onChange={e => setBusiness(b => ({ ...b, brandName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Chek footer matni</label>
            <input type="text" value={business.receiptFooter} onChange={e => setBusiness(b => ({ ...b, receiptFooter: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
          </div>
          <button onClick={handleSaveBusiness} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
            <Save size={14} /> Saqlash
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-semibold mb-4">Mavzu</h2>
        <div className="flex gap-3">
          <button onClick={() => theme === 'dark' && toggleTheme()}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
              theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600'
            }`}>
            <Sun size={20} /> <span className="text-sm font-medium">Yorug'</span>
          </button>
          <button onClick={() => theme === 'light' && toggleTheme()}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
              theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600'
            }`}>
            <Moon size={20} /> <span className="text-sm font-medium">Qorong'i</span>
          </button>
        </div>
      </div>

      {/* Telegram */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-semibold mb-4">Telegram integratsiya</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Bot Token</label>
            <input type="text" value={business.telegramBotToken} onChange={e => setBusiness(b => ({ ...b, telegramBotToken: e.target.value }))}
              placeholder="123456:ABC-DEF..." className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Chat ID</label>
            <input type="text" value={business.telegramChatId} onChange={e => setBusiness(b => ({ ...b, telegramChatId: e.target.value }))}
              placeholder="-1001234567890" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveBusiness} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
              <Save size={14} /> Saqlash
            </button>
            <button onClick={handleTestTelegram} disabled={testStatus === 'testing'}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 disabled:opacity-50">
              <TestTube size={14} /> {testStatus === 'testing' ? 'Tekshirilmoqda...' : 'Test'}
            </button>
          </div>
          {testStatus === 'success' && (
            <div className="p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
              <Check size={14} /> {testMessage}
            </div>
          )}
          {testStatus === 'error' && (
            <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={14} /> {testMessage}
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Bot yaratish: @BotFather → /newbot → token oling. Chat ID: guruhga @userinfobot qo'shing yoki shaxsiy chat ID'ni oling.
          </p>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-semibold mb-4">Faoliyat tarixi</h2>
        {activityLogs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Faoliyat yo'q</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {activityLogs.slice(0, 50).map(log => (
              <div key={log.id} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-700/30 rounded text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                <div className="flex-1">
                  <p className="font-medium">{log.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.createdAt).toLocaleString('uz-UZ')} · {log.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
