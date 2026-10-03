import React, { useState, useEffect } from 'react';
import { Search, Plus, Database, User, Phone, MapPin, Check, AlertCircle } from 'lucide-react';
import { fetchCustomers, createCustomer } from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [formKey, setFormKey] = useState('');
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formZip, setFormZip] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomers(search);
      setCustomers(data);
    } catch (err) {
      console.warn('API unavailable, fallback sample data used', err);
      setCustomers([
        {
          id: 1,
          customer_key: 'CUST-1049',
          name: 'Johnathan D. Doe',
          normalized_name: 'JOHNATHAN D DOE',
          address: '742 Evergreen Terrace',
          normalized_address: '742 EVERGREEN TER',
          zip_code: '97477-0021',
          normalized_zip: '97477',
          phone: '541-555-0199',
          normalized_phone: '5415550199'
        },
        {
          id: 2,
          customer_key: 'CUST-2081',
          name: 'Acme Industrial Holdings, LLC',
          normalized_name: 'ACME INDUSTRIAL HOLDINGS LLC',
          address: '1200 South Industrial Parkway, Suite 400',
          normalized_address: '1200 S INDUSTRIAL PKWY STE 400',
          zip_code: '78701',
          normalized_zip: '78701',
          phone: '512-555-4432',
          normalized_phone: '5125554432'
        },
        {
          id: 3,
          customer_key: 'CUST-3104',
          name: 'Katherine M. Vance-Smith',
          normalized_name: 'KATHERINE M VANCESMITH',
          address: '450 Ocean View Drive',
          normalized_address: '450 OCEAN VIEW DR',
          zip_code: '92651',
          normalized_zip: '92651',
          phone: '949-555-8810',
          normalized_phone: '9495558810'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formKey || !formName || !formAddress || !formZip) {
      setFormError('Key, Name, Address, and ZIP are required');
      return;
    }

    try {
      await createCustomer({
        customer_key: formKey,
        name: formName,
        address: formAddress,
        zip_code: formZip,
        phone: formPhone
      });
      setShowAddModal(false);
      setFormKey('');
      setFormName('');
      setFormAddress('');
      setFormZip('');
      setFormPhone('');
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-400" />
            Customer Canonical Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Internal master accounts with automated deterministic data normalization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 text-xs font-semibold transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by customer key, name, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-[#121622] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      {/* Customer Registry Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0e111a] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#121622] border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Customer Key</th>
                <th className="py-3 px-4">Raw Name</th>
                <th className="py-3 px-4">Normalized Name</th>
                <th className="py-3 px-4">Address (Raw &amp; Norm)</th>
                <th className="py-3 px-4">ZIP</th>
                <th className="py-3 px-4">Phone (10-Digit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {customers.map((c) => (
                <tr key={c.id || c.customer_key} className="hover:bg-[#141825] transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-cyan-400">
                    {c.customer_key}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">
                    {c.normalized_name || c.name.toUpperCase()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-300">{c.address}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      &rarr; {c.normalized_address || c.address.toUpperCase()}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className="text-white">{c.zip_code}</span>
                    {c.normalized_zip && c.normalized_zip !== c.zip_code && (
                      <span className="text-slate-400 ml-1">({c.normalized_zip})</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {c.normalized_phone || c.phone || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#121622] p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Add Customer Record</h3>
            {formError && (
              <div className="mb-4 rounded-lg bg-red-950/60 border border-red-800 p-2.5 text-xs text-red-300 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Customer Key (e.g. CUST-5510)</label>
                <input
                  type="text"
                  required
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-slate-700 bg-[#0e111a] px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400">Customer Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-slate-700 bg-[#0e111a] px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400">Street Address</label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-slate-700 bg-[#0e111a] px-3 py-1.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">ZIP Code</label>
                  <input
                    type="text"
                    required
                    value={formZip}
                    onChange={(e) => setFormZip(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-slate-700 bg-[#0e111a] px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-slate-700 bg-[#0e111a] px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-[#1a202d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 px-4 py-1.5 text-white font-medium hover:bg-cyan-500"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
