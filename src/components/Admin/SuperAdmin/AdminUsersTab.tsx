import React, { useState, useEffect } from 'react';
import { AdminUser } from '../../../types';
import { storageService } from '../../../services/storage';
import { firestoreAdminsService } from '../../../services/firebase';
import { UserCheck, Plus, Trash2, Edit2, Shield, UserX, CheckCircle2, Cloud } from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>(() => storageService.getAdminUsers());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminUser>>({
    name: '',
    email: '',
    role: 'Coordinator',
    status: 'Active',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sync with Firestore admins collection
    firestoreAdminsService.getAllAdmins().then((cloudAdmins) => {
      if (cloudAdmins && cloudAdmins.length > 0) {
        setAdmins(cloudAdmins);
      }
    }).catch(() => {});
  }, []);

  const refresh = () => {
    setAdmins(storageService.getAdminUsers());
  };

  const handleSave = () => {
    setError(null);
    if (!form.name || !form.email) {
      setError('Please provide administrator name and institutional email.');
      return;
    }

    try {
      if (editingId) {
        storageService.updateAdminUser(editingId, form);
        firestoreAdminsService.saveAdmin({
          id: editingId,
          name: form.name,
          email: form.email,
          role: form.role || 'Coordinator',
          status: form.status || 'Active',
          createdAt: new Date().toISOString(),
        }).catch(() => {});
        setEditingId(null);
      } else {
        const newAdmin = storageService.addAdminUser({
          name: form.name,
          email: form.email,
          role: form.role || 'Coordinator',
          status: form.status || 'Active',
        });
        firestoreAdminsService.saveAdmin(newAdmin).catch(() => {});
      }
      refresh();
      setForm({ name: '', email: '', role: 'Coordinator', status: 'Active' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setError(msg);
    }
  };

  const handleDelete = (id: string) => {
    setError(null);
    try {
      storageService.deleteAdminUser(id);
      firestoreAdminsService.deleteAdmin(id).catch(() => {});
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot delete admin account';
      setError(msg);
    }
  };

  const handleToggleStatus = (admin: AdminUser) => {
    const nextStatus = admin.status === 'Active' ? 'Suspended' : 'Active';
    storageService.updateAdminUser(admin.id, { status: nextStatus });
    refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Administrator Accounts & Access Control (RBAC)
            </h2>
            <p className="text-xs text-slate-500">
              Manage authorized faculty conveners, student editors, and coordinators who can access the administration dashboard.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {editingId ? 'Modify Admin User' : 'Provision New Administrator'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dr. M. Sreenivasa Rao"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. admin.uhv@nbkrist.org"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Permission Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="Super Admin">Super Admin (Full System Control)</option>
                <option value="Content Editor">Content Editor (Website & Announcements)</option>
                <option value="Coordinator">Coordinator (Members & QR Management)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: '', email: '', role: 'Coordinator', status: 'Active' });
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingId ? 'Update Admin' : 'Save Admin User'}</span>
            </button>
          </div>
        </div>

        {/* Existing Admins Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{adm.name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{adm.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        adm.role === 'Super Admin'
                          ? 'bg-purple-100 text-purple-800'
                          : adm.role === 'Content Editor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {adm.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        adm.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {adm.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(adm.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(adm)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                        title={adm.status === 'Active' ? 'Suspend' : 'Reactivate'}
                      >
                        {adm.status === 'Active' ? (
                          <UserX className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(adm.id);
                          setForm(adm);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                        title="Edit Admin"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(adm.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                        title="Delete Admin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
