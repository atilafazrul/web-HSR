import { useState, useEffect } from "react";

export const usePdf = (user, currentDivisi = "IT") => {
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchingHistory, setFetchingHistory] = useState(true);

  // ================= FORM STATE =================
  const [formData, setFormData] = useState({
    customer: "",
    contact_person: "",
    phone: "",
    address: "",
    brand: "",
    model: "",
    serial_no: "",
    start_date: "",
    completed_date: "",
    description: "",
    problem_description: "",
    service_performed: "",
    recommendation: "",
    nama_teknisi: user?.name || "",
    nama_client: "",
    kota: "",
    tanggal: new Date().toISOString().split('T')[0],
  });

  // Checkbox options
  const [checkboxes, setCheckboxes] = useState({
    installation: false,
    escalation: false,
    service_contract: false,
    training: false,
    kso: false,
    preventive_maintenance: false,
    on_call: false,
    update: false,
    warranty: false,
    demo_backup: false,
  });

  // Parts Replacement Table
  const [partsList, setPartsList] = useState([
    { id: 1, name: "", part_no: "", in: "", out: "", qty: "" },
  ]);

  // ================= HISTORY DATA =================
  const [historyData, setHistoryData] = useState([]);

  // ================= HANDLERS =================
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => {
    setCheckboxes(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePartsChange = (index, field, value) => {
    const updated = [...partsList];
    updated[index][field] = value;
    setPartsList(updated);
  };

  const handleAddParts = () => {
    setPartsList([
      ...partsList,
      { id: partsList.length + 1, name: "", part_no: "", in: "", out: "", qty: "" }
    ]);
  };

  const handleRemoveParts = (index) => {
    if (partsList.length > 1) {
      const updated = partsList.filter((_, i) => i !== index);
      updated.forEach((item, i) => item.id = i + 1);
      setPartsList(updated);
    }
  };

  const resetForm = () => {
    setFormData({
      customer: "",
      contact_person: "",
      phone: "",
      address: "",
      brand: "",
      model: "",
      serial_no: "",
      start_date: "",
      completed_date: "",
      description: "",
      problem_description: "",
      service_performed: "",
      recommendation: "",
      nama_teknisi: user?.name || "",
      nama_client: "",
      kota: "",
      tanggal: new Date().toISOString().split('T')[0],
    });
    setCheckboxes({
      installation: false,
      escalation: false,
      service_contract: false,
      training: false,
      kso: false,
      preventive_maintenance: false,
      on_call: false,
      update: false,
      warranty: false,
      demo_backup: false,
    });
    setPartsList([
      { id: 1, name: "", part_no: "", in: "", out: "", qty: "" }
    ]);
  };

  // ================= FETCH HISTORY FROM API =================
  const fetchHistory = async () => {
    if (!user?.id) return;

    setFetchingHistory(true);
    try {
      // Build URL parameters
      const params = new URLSearchParams();
      params.append('user_id', user.id);
      params.append('user_role', user.role);

      // Role-based divisi filter:
      // - super_admin: kirim parameter divisi untuk filter (opsional)
      // - admin: kirim user_divisi agar backend filter sesuai divisi admin
      // - user biasa (it/service/sales/kontraktor): otomatis filter by user_id di backend
      if (user.role === 'super_admin' && currentDivisi) {
        // Super admin bisa filter by divisi yang sedang dilihat
        params.append('divisi', currentDivisi.toUpperCase());
      } else if (user.role === 'admin' && user.divisi) {
        // Admin: kirim divisi miliknya agar backend filter sesuai divisi
        params.append('user_divisi', user.divisi);
      }
      // Untuk role lain (it/service/sales/kontraktor), backend otomatis filter by user_id

      const response = await fetch(`/api/service-reports?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        // Map backend data to frontend format
        const mappedData = result.data.map((item) => ({
          id: item.id,
          customer: item.customer,
          contact_person: item.contact_person,
          phone: item.phone,
          address: item.address,
          brand: item.brand,
          model: item.model,
          serial_no: item.serial_no,
          start_date: item.start_date,
          completed_date: item.completed_date,
          description: item.description,
          problem_description: item.problem_description,
          service_performed: item.service_performed,
          recommendation: item.recommendation,
          nama_teknisi: item.nama_teknisi,
          nama_client: item.nama_client,
          kota: item.kota,
          tanggal: item.tanggal,
          divisi: item.divisi,
          status: item.status,
          created_at: item.created_at,
        }));
        setHistoryData(mappedData);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setFetchingHistory(false);
    }
  };

  // Load history when component mount
  useEffect(() => {
    fetchHistory();
  }, [user?.id, currentDivisi]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    // Validasi dasar
    if (!formData.customer || !formData.nama_teknisi) {
      alert("Harap lengkapi field wajib (Customer, Nama Teknisi)!");
      return;
    }

    setLoading(true);

    try {
      // Prepare data for submission - convert checkboxes to array of true values
      const selectedCheckboxes = Object.entries(checkboxes)
        .filter(([key, value]) => value)
        .map(([key]) => key);

      // Prepare parts list
      const partsData = partsList.filter(part =>
        part.name || part.part_no || part.in || part.out || part.qty
      ).map(part => ({
        name: part.name,
        part_no: part.part_no,
        in: part.in,
        out: part.out,
        qty: part.qty ? parseInt(part.qty) : null,
      }));

      // Role-based divisi selection:
      // - super_admin: gunakan currentDivisi (bisa pilih divisi apa saja)
      // - admin: gunakan divisi milik user (user.divisi)
      // - user biasa (it/service/sales/kontraktor): gunakan divisi milik user
      let divisiToSend;
      if (user.role === 'super_admin') {
        divisiToSend = currentDivisi.toUpperCase();
      } else if (user.role === 'admin') {
        // Admin menggunakan divisi miliknya
        divisiToSend = user.divisi ? user.divisi.toUpperCase() : 'SERVICE';
      } else {
        // User biasa, gunakan divisi milik user
        divisiToSend = user.divisi ? user.divisi.toUpperCase() : 'SERVICE';
      }

      const submitData = {
        ...formData,
        checkboxes: selectedCheckboxes,
        partsList: partsData,
        divisi: divisiToSend,
        user_id: user?.id,
      };

      const response = await fetch("/api/service-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Dokumen berhasil disimpan!");
        resetForm();
        setActiveTab("history");
        // Refresh history
        await fetchHistory();
      } else {
        // Show detailed error for debugging
        console.error("Validation errors:", result.errors);
        const errorMsg = result.errors
          ? Object.entries(result.errors).map(([field, msgs]) => `${field}: ${msgs.join(', ')}`).join('\n')
          : (result.message || "Gagal menyimpan data");
        alert("Validasi gagal:\n" + errorMsg);
      }

    } catch (error) {
      console.error("Error submitting:", error);
      alert("Terjadi error saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item) => {
    console.log("View item:", item);
    alert(`Lihat detail:\nCustomer: ${item.customer}\nContact Person: ${item.contact_person || '-'}\nBrand: ${item.brand}\nModel: ${item.model}`);
  };

  const handleGeneratePDF = async (item) => {
    // Generate PDF using server-side dompdf
    try {
      // Build URL with auth parameters
      const params = new URLSearchParams();
      if (user?.id) params.append('user_id', user.id);
      if (user?.role) params.append('user_role', user.role);

      const response = await fetch(`/api/service-reports/${item.id}/pdf?${params.toString()}`, {
        method: 'GET',
      });

      if (response.ok) {
        // Download the PDF file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ServiceReport_${item.report_number || item.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Gagal generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi error saat generate PDF');
    }
  };

  // ================= FILTERED HISTORY =================
  const filteredHistory = historyData.filter(item =>
    item.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nama_teknisi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ================= SERVICE TYPE OPTIONS =================
  const serviceTypeOptions = {
    installation: "Installation",
    escalation: "Escalation",
    service_contract: "Service Contract",
    training: "Training",
    kso: "KSO",
    preventive_maintenance: "Preventive Maintenance",
    on_call: "On Call",
    update: "Update",
    warranty: "Warranty",
    demo_backup: "Demo/Back up",
  };

  return {
    // State
    activeTab,
    setActiveTab,
    loading,
    searchTerm,
    setSearchTerm,
    formData,
    checkboxes,
    partsList,
    historyData,
    filteredHistory,
    fetchingHistory,
    serviceTypeOptions,

    // Handlers
    handleInputChange,
    handleCheckboxChange,
    handlePartsChange,
    handleAddParts,
    handleRemoveParts,
    resetForm,
    handleSubmit,
    handleView,
    handleGeneratePDF,
    fetchHistory,
  };
};
