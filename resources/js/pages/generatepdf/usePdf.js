import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import { useDocumentSchedule } from "../berita-acara/hooks/useDocumentSchedule";

const tr = (id, en) => {
  if (typeof window === "undefined") return id;
  return localStorage.getItem("app_language") === "en" ? en : id;
};

export const usePdf = (user, currentDivisi = "IT", projekKerjaId = null) => {
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const {
    scheduledAt,
    setScheduledAt,
    scheduling,
    handleSchedule,
    canSchedule,
  } = useDocumentSchedule(projekKerjaId, "service_report");

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
    start_time: "",
    completed_date: "",
    completed_time: "",
    description: "",
    problem_description: "",
    service_performed: "",
    recommendation: "",
    nama_teknisi: user?.name || "",
    nama_client: "",
    ttd_teknisi: "",
    ttd_klien: "",
    kota: "",
    tanggal: new Date().toISOString().split('T')[0],
  });

  // Checkbox options
  const [checkboxes, setCheckboxes] = useState({
    installation: false,
    escalation: false,
    service_contract: false,
    service: false,
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
  const [selectedItem, setSelectedItem] = useState(null);

  // ================= HANDLERS =================
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignatureChange = (field, value) => {
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
      start_time: "",
      completed_date: "",
      completed_time: "",
      description: "",
      problem_description: "",
      service_performed: "",
      recommendation: "",
      nama_teknisi: user?.name || "",
      nama_client: "",
      ttd_teknisi: "",
      ttd_klien: "",
      kota: "",
      tanggal: new Date().toISOString().split('T')[0],
    });
    setCheckboxes({
      installation: false,
      escalation: false,
      service_contract: false,
      service: false,
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

      const response = await api.get(`/service-reports?${params.toString()}`);
      const result = response.data;

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
          start_time: item.start_time,
          completed_date: item.completed_date,
          completed_time: item.completed_time,
          description: item.description,
          problem_description: item.problem_description,
          service_performed: item.service_performed,
          recommendation: item.recommendation,
          nama_teknisi: item.nama_teknisi,
          nama_client: item.nama_client,
          ttd_teknisi: item.ttd_teknisi,
          ttd_klien: item.ttd_klien,
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

  const buildSubmitData = () => {
    const selectedCheckboxes = Object.entries(checkboxes)
      .filter(([key, value]) => value)
      .map(([key]) => key);

    const partsData = partsList.filter(part =>
      part.name || part.part_no || part.in || part.out || part.qty
    ).map(part => ({
      name: part.name,
      part_no: part.part_no,
      in: part.in,
      out: part.out,
      qty: part.qty ? parseInt(part.qty) : null,
    }));

    let divisiToSend;
    if (user.role === 'super_admin') {
      divisiToSend = currentDivisi ? currentDivisi.toUpperCase() : 'SERVICE';
    } else if (user.role === 'admin') {
      divisiToSend = user.divisi ? user.divisi.toUpperCase() : 'SERVICE';
    } else {
      divisiToSend = user.divisi ? user.divisi.toUpperCase() : 'SERVICE';
    }

    return {
      ...formData,
      ttd_teknisi: formData.ttd_teknisi || null,
      ttd_klien: formData.ttd_klien || null,
      checkboxes: selectedCheckboxes,
      partsList: partsData,
      divisi: divisiToSend,
      user_id: user?.id,
    };
  };

  const handleScheduleGenerate = (formElement) => {
    if (isEditing) {
      alert(tr(
        "Jadwalkan generate hanya untuk dokumen baru.",
        "Scheduled generate is only available for new documents."
      ));
      return;
    }

    if (!formData.customer || !formData.nama_teknisi) {
      alert(tr("Harap lengkapi field wajib (Customer, Nama Teknisi)!", "Please fill required fields (Customer, Technician Name)!"));
      return;
    }

    handleSchedule(buildSubmitData(), formElement);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    // Validasi dasar
    if (!formData.customer || !formData.nama_teknisi) {
      alert(tr("Harap lengkapi field wajib (Customer, Nama Teknisi)!", "Please fill required fields (Customer, Technician Name)!"));
      return;
    }

    setLoading(true);

    try {
      const submitData = buildSubmitData();

      let response;
      if (isEditing && editId) {
        response = await api.put(`/service-reports/${editId}`, submitData);
      } else {
        response = await api.post("/service-reports", submitData);
      }

      const result = response.data;

      if (response.status === 200 || response.status === 201) {
        alert(isEditing ? tr("Dokumen berhasil diperbarui!", "Document updated successfully!") : tr("Dokumen berhasil disimpan!", "Document saved successfully!"));
        resetForm();
        setIsEditing(false);
        setEditId(null);
        setActiveTab("history");
        // Refresh history
        await fetchHistory();
      } else {
        // Show detailed error for debugging
        console.error("Validation errors:", result.errors);
        const errorMsg = result.errors
          ? Object.entries(result.errors).map(([field, msgs]) => `${field}: ${msgs.join(', ')}`).join('\n')
          : (result.message || tr("Gagal menyimpan data", "Failed to save data"));
        alert(tr("Validasi gagal:\n", "Validation failed:\n") + errorMsg);
      }

    } catch (error) {
      console.error("Error submitting:", error);
      alert(tr("Terjadi error saat menyimpan data", "An error occurred while saving data"));
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item) => {
    setSelectedItem(item);
  };

  const closeViewModal = () => {
    setSelectedItem(null);
  };

  // ================= EDIT FUNCTIONALITY =================
  const handleEdit = async (item) => {
    try {
      const response = await api.get(`/service-reports/${item.id}`);
      const result = response.data;

      if (result.success) {
        const data = result.data;

        setFormData({
          customer: data.customer || "",
          contact_person: data.contact_person || "",
          phone: data.phone || "",
          address: data.address || "",
          brand: data.brand || "",
          model: data.model || "",
          serial_no: data.serial_no || "",
          start_date: data.start_date ? data.start_date.split('T')[0] : "",
          start_time: data.start_time || "",
          completed_date: data.completed_date ? data.completed_date.split('T')[0] : "",
          completed_time: data.completed_time || "",
          description: data.description || "",
          problem_description: data.problem_description || "",
          service_performed: data.service_performed || "",
          recommendation: data.recommendation || "",
          nama_teknisi: data.nama_teknisi || "",
          nama_client: data.nama_client || "",
          ttd_teknisi: data.ttd_teknisi || "",
          ttd_klien: data.ttd_klien || "",
          kota: data.kota || "",
          tanggal: data.tanggal ? data.tanggal.split('T')[0] : new Date().toISOString().split('T')[0],
        });

        const types = data.service_types || data.serviceTypes || [];
        const typeKeys = types.map(t => t.type);
        const newCheckboxes = {
          installation: typeKeys.includes('installation'),
          escalation: typeKeys.includes('escalation'),
          service_contract: typeKeys.includes('service_contract'),
          service: typeKeys.includes('service'),
          training: typeKeys.includes('training'),
          kso: typeKeys.includes('kso'),
          preventive_maintenance: typeKeys.includes('preventive_maintenance'),
          on_call: typeKeys.includes('on_call'),
          update: typeKeys.includes('update'),
          warranty: typeKeys.includes('warranty'),
          demo_backup: typeKeys.includes('demo_backup'),
        };
        setCheckboxes(newCheckboxes);

        const parts = data.parts || [];
        if (parts.length > 0) {
          const mappedParts = parts.map((part, index) => ({
            id: index + 1,
            name: part.part_name || "",
            part_no: part.part_no || "",
            in: part.in || "",
            out: part.out || "",
            qty: part.qty || "",
          }));
          setPartsList(mappedParts);
        } else {
          setPartsList([{ id: 1, name: "", part_no: "", in: "", out: "", qty: "" }]);
        }

        setEditId(item.id);
        setIsEditing(true);
        setActiveTab("form");
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Error fetching report detail:", error);
      alert(tr("Gagal memuat data untuk diedit", "Failed to load data for editing"));
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    resetForm();
  };

  const handleGeneratePDF = async (item) => {
    // Generate PDF using server-side dompdf
    try {
      // Build URL with auth parameters
      const params = new URLSearchParams();
      if (user?.id) params.append('user_id', user.id);
      if (user?.role) params.append('user_role', user.role);

      const response = await api.get(`/service-reports/${item.id}/pdf?${params.toString()}`, {
        responseType: 'blob'
      });

      if (response.status === 200) {
        // Download the PDF file
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ServiceReport_${item.report_number || item.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(tr("Gagal generate PDF", "Failed to generate PDF"));
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(tr("Terjadi error saat generate PDF", "An error occurred while generating PDF"));
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
    service: "Service",
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
    selectedItem,
    setSelectedItem,
    isEditing,
    editId,

    // Handlers
    handleInputChange,
    handleSignatureChange,
    handleCheckboxChange,
    handlePartsChange,
    handleAddParts,
    handleRemoveParts,
    resetForm,
    handleSubmit,
    handleView,
    closeViewModal,
    handleGeneratePDF,
    handleEdit,
    cancelEdit,
    fetchHistory,
    scheduledAt,
    setScheduledAt,
    scheduling,
    handleScheduleGenerate,
    canSchedule,
  };
};
