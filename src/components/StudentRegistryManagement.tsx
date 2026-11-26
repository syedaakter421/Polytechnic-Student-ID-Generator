import React, { useState, useEffect, useMemo } from 'react';
import { safeFetch } from '../lib/fetchUtils';
import {
  FileUp,
  Search,
  Check,
  X,
  Trash2,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Database,
  Clock
} from 'lucide-react';

interface RegistryRecord {
  id?: string;
  roll_number: string;
  reg_number: string;
  full_name_en: string;
  technology?: string | null;
  source_file?: string | null;
  is_registered?: boolean;
  created_at?: string;
}

export default function StudentRegistryManagement() {
  const [records, setRecords] = useState<RegistryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissingError, setTableMissingError] = useState<string | null>(null);

  // Upload & Parse State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);

  // Parsed Preview State
  const [previewRecords, setPreviewRecords] = useState<RegistryRecord[]>([]);
  const [previewFileName, setPreviewFileName] = useState('');
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);

  // Manual Entry State
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualForm, setManualForm] = useState({
    roll_number: '',
    reg_number: '',
    full_name_en: ''
  });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setTableMissingError(null);
    try {
      const data = await safeFetch('/api/admin/registry');
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.message?.includes('verified_student_records') || err.message?.includes('SQL')) {
        setTableMissingError(err.message);
      } else {
        setStatusBanner({ type: 'error', message: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleParseFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setStatusBanner({ type: 'error', message: 'একটি PDF বা CSV ফাইল নির্বাচন করুন।' });
      return;
    }

    setParsing(true);
    setStatusBanner(null);
    setParseWarnings([]);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await safeFetch('/api/admin/registry/parse-pdf', {
        method: 'POST',
        body: formData
      });
      setPreviewRecords(Array.isArray(res.records) ? res.records : []);
      setPreviewFileName(res.fileName || selectedFile.name);
      setParseWarnings(Array.isArray(res.warnings) ? res.warnings : []);
      if (res.records?.length > 0) {
        setStatusBanner({
          type: 'success',
          message: `${res.records.length} জন শিক্ষার্থীর তথ্য পাওয়া গেছে।`
        });
      }
    } catch (err: any) {
      setStatusBanner({ type: 'error', message: err.message });
    } finally {
      setParsing(false);
    }
  };

  const handlePreviewChange = (idx: number, field: keyof RegistryRecord, value: string) => {
    setPreviewRecords((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleRemovePreviewRow = (idx: number) => {
    setPreviewRecords((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmBulkSave = async () => {
    if (previewRecords.length === 0) return;
    setSavingBulk(true);
    setStatusBanner(null);
    try {
      const res = await safeFetch('/api/admin/registry/bulk-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: previewRecords,
          source_file: previewFileName
        })
      });
      setStatusBanner({ type: 'success', message: res.message });
      setPreviewRecords([]);
      setParseWarnings([]);
      setSelectedFile(null);
      await fetchRecords();
    } catch (err: any) {
      setStatusBanner({ type: 'error', message: err.message });
    } finally {
      setSavingBulk(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSaving(true);
    setStatusBanner(null);
    try {
      const res = await safeFetch('/api/admin/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm)
      });
      setStatusBanner({ type: 'success', message: res.message });
      setManualForm({
        roll_number: '',
        reg_number: '',
        full_name_en: ''
      });
      setShowManualForm(false);
      await fetchRecords();
    } catch (err: any) {
      setStatusBanner({ type: 'error', message: err.message });
    } finally {
      setManualSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await safeFetch(`/api/admin/registry/${id}`, { method: 'DELETE' });
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setStatusBanner({ type: 'success', message: res?.message || 'রেকর্ড মুছে ফেলা হয়েছে।' });
    } catch (err: any) {
      setStatusBanner({ type: 'error', message: err.message });
    }
  };

  const registeredCount = useMemo(
    () => records.filter((r) => r.is_registered).length,
    [records]
  );

  const pendingCount = records.length - registeredCount;

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.roll_number.toLowerCase().includes(q) ||
        r.reg_number.toLowerCase().includes(q) ||
        r.full_name_en.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {tableMissingError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center gap-3 font-bengali text-sm">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <span>{tableMissingError}</span>
        </div>
      )}

      {statusBanner && (
        <div
          className={`px-4 py-3.5 rounded-2xl flex items-center justify-between gap-3 font-bengali text-sm border ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusBanner.type === 'success' ? <Check size={17} /> : <X size={17} />}
            <span>{statusBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="p-1 opacity-60 hover:opacity-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gov-green/10 text-gov-green flex items-center justify-center shrink-0">
            <Database size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 font-bengali">মোট রেকর্ড</p>
            <p className="text-2xl font-black text-slate-800">{records.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 font-bengali">সাইন আপ সম্পন্ন</p>
            <p className="text-2xl font-black text-slate-800">{registeredCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 font-bengali">সাইন আপ বাকি</p>
            <p className="text-2xl font-black text-slate-800">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Upload Card */}
      <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-black font-bengali text-slate-800">
            PDF / CSV আপলোড
          </h2>
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs font-bengali transition-all"
          >
            <Plus size={15} />
            {showManualForm ? 'বন্ধ করুন' : 'একক এন্ট্রি'}
          </button>
        </div>

        {showManualForm && (
          <form
            onSubmit={handleManualSubmit}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Name (English)"
                value={manualForm.full_name_en}
                onChange={(e) => setManualForm({ ...manualForm, full_name_en: e.target.value })}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-gov-green"
              />
              <input
                type="text"
                required
                placeholder="Roll"
                value={manualForm.roll_number}
                onChange={(e) => setManualForm({ ...manualForm, roll_number: e.target.value })}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-gov-green"
              />
              <input
                type="text"
                required
                placeholder="Registration"
                value={manualForm.reg_number}
                onChange={(e) => setManualForm({ ...manualForm, reg_number: e.target.value })}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-gov-green"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={manualSaving}
                className="px-5 py-2 bg-gov-green text-white rounded-xl font-bold text-xs font-bengali hover:bg-gov-green-dark disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {manualSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        )}

        <form onSubmit={handleParseFile} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <label className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-gov-green bg-slate-50 cursor-pointer transition-all">
            <FileUp size={18} className="text-gov-green shrink-0" />
            <span className="text-sm font-medium text-slate-600 truncate font-bengali">
              {selectedFile ? selectedFile.name : 'PDF বা CSV ফাইল নির্বাচন করুন'}
            </span>
            <input
              type="file"
              accept=".pdf,.csv,application/pdf,text/csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={parsing || !selectedFile}
            className="px-6 py-3 bg-gov-green text-white rounded-2xl font-bold font-bengali text-sm shadow-md shadow-gov-green/15 hover:bg-gov-green-dark transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 shrink-0"
          >
            {parsing ? <Loader2 size={17} className="animate-spin" /> : <FileUp size={17} />}
            {parsing ? 'প্রসেস হচ্ছে...' : 'প্রিভিউ দেখুন'}
          </button>
        </form>

        {parseWarnings.length > 0 && (
          <div className="space-y-2">
            {parseWarnings.map((w, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bengali flex items-center gap-2"
              >
                <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Preview Table */}
        {previewRecords.length > 0 && (
          <div className="border border-emerald-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-4">
              <span className="font-black text-emerald-900 font-bengali text-sm">
                প্রিভিউ ({previewRecords.length} জন)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRecords([]);
                    setParseWarnings([]);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold font-bengali hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkSave}
                  disabled={savingBulk}
                  className="px-5 py-2 rounded-xl bg-gov-green text-white text-xs font-black font-bengali hover:bg-gov-green-dark disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {savingBulk ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {savingBulk ? 'সেভ হচ্ছে...' : 'ডাটাবেজে সেভ করুন'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase font-bold sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Roll</th>
                    <th className="px-4 py-2.5">Reg</th>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {previewRecords.map((row, idx) => (
                    <tr key={`${row.roll_number}-${idx}`} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={row.roll_number}
                          onChange={(e) => handlePreviewChange(idx, 'roll_number', e.target.value)}
                          className="w-28 px-2.5 py-1 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={row.reg_number}
                          onChange={(e) => handlePreviewChange(idx, 'reg_number', e.target.value)}
                          className="w-36 px-2.5 py-1 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={row.full_name_en}
                          onChange={(e) => handlePreviewChange(idx, 'full_name_en', e.target.value)}
                          className="w-full min-w-[200px] px-2.5 py-1 border border-slate-200 rounded-lg text-xs"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemovePreviewRow(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stored Registry Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-black font-bengali text-slate-800">
            শিক্ষার্থী তালিকা ({filteredRecords.length})
          </h3>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="নাম বা রোল খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bengali outline-none focus:border-gov-green w-full sm:w-60"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-14 text-center text-slate-400 font-bengali flex items-center justify-center gap-2 text-sm">
              <Loader2 size={18} className="animate-spin" /> লোড হচ্ছে...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-14 text-center text-slate-400 font-bengali text-sm">
              কোনো তথ্য পাওয়া যায়নি
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Roll</th>
                  <th className="px-5 py-3.5">Reg</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id || rec.roll_number} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-800">{rec.full_name_en}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">{rec.roll_number}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{rec.reg_number}</td>
                    <td className="px-5 py-3">
                      {rec.is_registered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-bengali bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={12} /> সক্রিয়
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-bengali bg-slate-100 text-slate-500">
                          <Clock size={12} /> বাকি
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {rec.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id!)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
