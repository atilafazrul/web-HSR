// Helper function to format date to Indonesian format
export const formatDateToIndonesian = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
};

// Helper function to get day name from date
export const getDayName = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
};

/** Parse Indonesian or ISO date string to YYYY-MM-DD for <input type="date"> */
export const parseDateToInput = (dateStr) => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const months = {
    Januari: "01",
    Februari: "02",
    Maret: "03",
    April: "04",
    Mei: "05",
    Juni: "06",
    Juli: "07",
    Agustus: "08",
    September: "09",
    Oktober: "10",
    November: "11",
    Desember: "12",
  };

  const parts = String(dateStr).split(" ");
  if (parts.length === 3 && months[parts[1]]) {
    const day = parts[0].padStart(2, "0");
    return `${parts[2]}-${months[parts[1]]}-${day}`;
  }

  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
};

// Helper function to format ISO date for display
export const formatDate = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
