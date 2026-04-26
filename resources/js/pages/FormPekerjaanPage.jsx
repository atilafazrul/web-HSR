import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { useI18n } from "../i18n";

export default function FormPekerjaanPage() {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  /* ================= STATE ================= */
  const [form, setForm] = useState({

    report_no: "",
    customer: "",
    contact_person: "",
    address: "",
    phone: "",

    brand: "",
    model: "",
    serial_no: "",
    description: "",

    start_date: "",
    completed_date: "",

    problem: "",
    service_performed: "",
    recommendation: "",

  });


  /* ================= CHANGE ================= */
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };


  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {

      const res = await api.post(
        "/form-pekerjaan/pdf",
        form,
        {
          responseType: "blob"
        }
      );

      const file = new Blob([res.data], {
        type: "application/pdf"
      });

      const url = URL.createObjectURL(file);

      window.open(url);

      alert(tr("PDF berhasil dibuat ✅", "PDF generated successfully ✅"));

    } catch (err) {

      console.error(err);
      alert(tr("Gagal membuat PDF ❌", "Failed to generate PDF ❌"));

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">

      <div className="flex items-center gap-4 mb-6">

        <h2 className="text-3xl font-bold">
          {tr("Form Service Report", "Service Report Form")}
        </h2>

      </div>


      <div className="bg-white rounded-2xl shadow p-6 border">

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <input name="report_no" onChange={handleChange} placeholder={tr("Nomor Laporan", "Report No")} className="input" />

          <input name="customer" onChange={handleChange} placeholder={tr("Pelanggan", "Customer")} className="input" />

          <input name="contact_person" onChange={handleChange} placeholder={tr("Kontak Person", "Contact Person")} className="input" />

          <input name="address" onChange={handleChange} placeholder={tr("Alamat", "Address")} className="input" />

          <input name="phone" onChange={handleChange} placeholder={tr("Telepon", "Phone")} className="input" />

          <hr />

          <input name="brand" onChange={handleChange} placeholder={tr("Merek", "Brand")} className="input" />

          <input name="model" onChange={handleChange} placeholder={tr("Model", "Model")} className="input" />

          <input name="serial_no" onChange={handleChange} placeholder={tr("Nomor Serial", "Serial No")} className="input" />

          <input name="description" onChange={handleChange} placeholder={tr("Deskripsi", "Description")} className="input" />

          <div className="grid grid-cols-2 gap-4">

            <input type="date" name="start_date" onChange={handleChange} className="input" />

            <input type="date" name="completed_date" onChange={handleChange} className="input" />

          </div>

          <hr />

          <textarea name="problem" onChange={handleChange} placeholder={tr("Deskripsi Masalah", "Problem Description")} className="input h-24" />

          <textarea name="service_performed" onChange={handleChange} placeholder={tr("Layanan yang Dikerjakan", "Service Performed")} className="input h-24" />

          <textarea name="recommendation" onChange={handleChange} placeholder={tr("Rekomendasi", "Recommendation")} className="input h-24" />


          <button
            disabled={loading}
            className="bg-blue-600 text-white py-3 rounded-xl w-full"
          >
            {loading ? tr("Membuat PDF...", "Generating PDF...") : tr("Unduh PDF", "Download PDF")}
          </button>

        </form>

      </div>

    </div>
  );
}