import React from "react";
import {
  FileText,
  Building,
  User,
  Phone,
  MapPin,
  Wrench,
  Package,
  Calendar,
  Check,
  Plus,
  Trash2,
} from "lucide-react";

export default function pdfForm({
  formData,
  checkboxes,
  partsList,
  serviceTypeOptions,
  onInputChange,
  onCheckboxChange,
  onPartsChange,
  onAddParts,
  onRemoveParts,
  onSubmit,
  onReset,
  loading,
  user,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* HEADER FORM CARD */}
      <div className="bg-white rounded-3xl shadow-md p-8">

        <div className="flex items-center gap-3 mb-8 pb-4 border-b">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Form Service Report</h3>
            <p className="text-gray-500 text-sm">Isi data lengkap untuk membuat dokumen service report</p>
          </div>
        </div>

        {/* CUSTOMER INFORMATION */}
        <CustomerSection
          formData={formData}
          onInputChange={onInputChange}
        />

        {/* SERVICE TYPE CHECKBOXES */}
        <ServiceTypeSection
          checkboxes={checkboxes}
          options={serviceTypeOptions}
          onChange={onCheckboxChange}
        />

        {/* EQUIPMENT INFORMATION */}
        <EquipmentSection
          formData={formData}
          onInputChange={onInputChange}
        />

        {/* PARTS REPLACEMENT TABLE */}
        <PartsReplacementSection
          partsList={partsList}
          onPartsChange={onPartsChange}
          onAddParts={onAddParts}
          onRemoveParts={onRemoveParts}
        />

        {/* PROBLEM DESCRIPTION */}
        <ProblemDescriptionSection
          formData={formData}
          onInputChange={onInputChange}
        />

        {/* SERVICE PERFORMED */}
        <ServicePerformedSection
          formData={formData}
          onInputChange={onInputChange}
        />

        {/* RECOMMENDATION */}
        <RecommendationSection
          formData={formData}
          onInputChange={onInputChange}
        />

        {/* ADMINISTRATION */}
        <AdministrationSection
          formData={formData}
          onInputChange={onInputChange}
          user={user}
        />

      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onReset}
          className="px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
        >
          Reset Form
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <FileText size={18} />
              Simpan Dokumen
            </>
          )}
        </button>
      </div>

    </form>
  );
}

// ================= SUB SECTIONS =================

function CustomerSection({ formData, onInputChange }) {
  return (
    <div className="mb-8">
      <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
        <Building size={20} />
        Customer Information
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Customer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.customer}
            onChange={(e) => onInputChange("customer", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nama customer / perusahaan"
            required
          />
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Person
          </label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => onInputChange("contact_person", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama contact person"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => onInputChange("phone", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nomor telepon"
            />
          </div>
        </div>

        {/* Address */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
            <textarea
              value={formData.address}
              onChange={(e) => onInputChange("address", e.target.value)}
              rows={2}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Alamat lengkap"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceTypeSection({ checkboxes, options, onChange }) {
  return (
    <div className="mb-8">
      <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
        <Wrench size={20} />
        Service Type
      </h4>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(options).map(([key, label]) => (
          <label
            key={key}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition border-2 ${checkboxes[key]
              ? "bg-blue-50 border-blue-500"
              : "bg-white border-gray-200 hover:border-gray-300"
              }`}
          >
            <input
              type="checkbox"
              checked={checkboxes[key]}
              onChange={() => onChange(key)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function EquipmentSection({ formData, onInputChange }) {
  return (
    <div className="mb-8">
      <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
        <Package size={20} />
        Equipment Information
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => onInputChange("brand", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Contoh: Daikin, Samsung, LG"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => onInputChange("model", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Model peralatan"
          />
        </div>

        {/* Serial No */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Serial No</label>
          <input
            type="text"
            value={formData.serial_no}
            onChange={(e) => onInputChange("serial_no", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nomor seri"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => onInputChange("start_date", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Completed Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Completed Date</label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={formData.completed_date}
              onChange={(e) => onInputChange("completed_date", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Deskripsi pekerjaan / masalah"
          />
        </div>
      </div>
    </div>
  );
}

function PartsReplacementSection({ partsList, onPartsChange, onAddParts, onRemoveParts }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Package size={20} />
          Parts Replacement
        </h4>
        <button
          type="button"
          onClick={onAddParts}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
        >
          <Plus size={16} />
          Tambah Part
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Part Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Part No</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-32">In</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-32">Out</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">Qty</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {partsList.map((part, index) => (
              <tr key={part.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-600">{part.id}.</td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={part.name}
                    onChange={(e) => onPartsChange(index, "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Nama part"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={part.part_no}
                    onChange={(e) => onPartsChange(index, "part_no", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Part No"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={part.in}
                    onChange={(e) => onPartsChange(index, "in", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                    placeholder="-"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={part.out}
                    onChange={(e) => onPartsChange(index, "out", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                    placeholder="-"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={part.qty}
                    onChange={(e) => onPartsChange(index, "qty", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                    placeholder="0"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onRemoveParts(index)}
                    disabled={partsList.length <= 1}
                    className="flex justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed mx-auto"
                    title="Hapus baris"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProblemDescriptionSection({ formData, onInputChange }) {
  return (
    <div className="mb-8">
      <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
        <FileText size={20} />
        Problem Description
      </h4>
      <textarea
        value={formData.problem_description}
        onChange={(e) => onInputChange("problem_description", e.target.value)}
        rows={4}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="Jelaskan masalah atau keluhan yang dilaporkan customer..."
      />
    </div>
  );
}

function ServicePerformedSection({ formData, onInputChange }) {
  return (
    <div className="mb-8">
      <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
        <Wrench size={20} />
        Service Performed
      </h4>
      <textarea
        value={formData.service_performed}
        onChange={(e) => onInputChange("service_performed", e.target.value)}
        rows={4}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="Jelaskan tindakan/perbaikan yang telah dilakukan..."
      />
    </div>
  );
}

function RecommendationSection({ formData, onInputChange }) {
  return (
    <div className="mb-8">
      <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
        <Check size={20} />
        Recommendation
      </h4>
      <textarea
        value={formData.recommendation}
        onChange={(e) => onInputChange("recommendation", e.target.value)}
        rows={3}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="Saran atau rekomendasi untuk perawatan selanjutnya..."
      />
    </div>
  );
}

function AdministrationSection({ formData, onInputChange, user }) {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
        <User size={20} />
        Administration
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Nama Teknisi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Teknisi <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.nama_teknisi}
              onChange={(e) => onInputChange("nama_teknisi", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            />
          </div>
        </div>

        {/* Nama Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nama Client</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.nama_client}
              onChange={(e) => onInputChange("nama_client", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Nama client"
            />
          </div>
        </div>

        {/* Kota */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kota</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.kota}
              onChange={(e) => onInputChange("kota", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Nama kota"
            />
          </div>
        </div>

        {/* Tanggal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => onInputChange("tanggal", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
