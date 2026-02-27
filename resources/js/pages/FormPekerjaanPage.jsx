import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function FormPekerjaanPage() {

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

      const res = await axios.post(
        "http://127.0.0.1:8000/api/form-pekerjaan/pdf",
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

      alert("PDF berhasil dibuat ✅");

    } catch (err) {

      console.error(err);
      alert("Gagal membuat PDF ❌");

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">

      <div className="flex items-center gap-4 mb-6">

        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 px-4 py-2 rounded-lg"
        >
          ← Kembali
        </button>

        <h2 className="text-3xl font-bold">
          Form Service Report
        </h2>

      </div>


      <div className="bg-white rounded-2xl shadow p-6 border">

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <input name="report_no" onChange={handleChange} placeholder="Report No" className="input" />

          <input name="customer" onChange={handleChange} placeholder="Customer" className="input" />

          <input name="contact_person" onChange={handleChange} placeholder="Contact Person" className="input" />

          <input name="address" onChange={handleChange} placeholder="Address" className="input" />

          <input name="phone" onChange={handleChange} placeholder="Phone" className="input" />

          <hr />

          <input name="brand" onChange={handleChange} placeholder="Brand" className="input" />

          <input name="model" onChange={handleChange} placeholder="Model" className="input" />

          <input name="serial_no" onChange={handleChange} placeholder="Serial No" className="input" />

          <input name="description" onChange={handleChange} placeholder="Description" className="input" />

          <div className="grid grid-cols-2 gap-4">

            <input type="date" name="start_date" onChange={handleChange} className="input" />

            <input type="date" name="completed_date" onChange={handleChange} className="input" />

          </div>

          <hr />

          <textarea name="problem" onChange={handleChange} placeholder="Problem Description" className="input h-24" />

          <textarea name="service_performed" onChange={handleChange} placeholder="Service Performed" className="input h-24" />

          <textarea name="recommendation" onChange={handleChange} placeholder="Recommendation" className="input h-24" />


          <button
            disabled={loading}
            className="bg-blue-600 text-white py-3 rounded-xl w-full"
          >
            {loading ? "Membuat PDF..." : "Download PDF"}
          </button>

        </form>

      </div>

    </div>
  );
}