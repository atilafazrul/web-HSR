import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

// ================= RECHARTS =================
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from "recharts";

// ================= DATA MOCK PER PRODUK =================
const SALES_DATA = [
  { name: "Mediser", target: 85000000, actual: 72000000 },
  { name: "MedImage", target: 120000000, actual: 95000000 },
  { name: "MedHIS", target: 200000000, actual: 185000000 },
  { name: "MKS", target: 50000000, actual: 55000000 },
  { name: "Conexa", target: 75000000, actual: 40000000 }
];

// ================= DATA MOCK BULANAN =================
const MONTHLY_DATA = [
  { month: "Jan", target: 45000000, actual: 42000000 },
  { month: "Feb", target: 48000000, actual: 45000000 },
  { month: "Mar", target: 52000000, actual: 58000000 },
  { month: "Apr", target: 50000000, actual: 47000000 },
  { month: "Mei", target: 55000000, actual: 62000000 },
  { month: "Jun", target: 58000000, actual: 55000000 },
  { month: "Jul", target: 60000000, actual: 65000000 },
  { month: "Ags", target: 57000000, actual: 53000000 },
  { month: "Sep", target: 62000000, actual: 68000000 },
  { month: "Okt", target: 65000000, actual: 70000000 },
  { month: "Nov", target: 70000000, actual: 75000000 },
  { month: "Des", target: 75000000, actual: 80000000 }
];

// ================= PALET WARNA DONUT =================
const DONUT_COLORS = [
  "#3B82F6", // blue-500
  "#06B6D4", // cyan-500
  "#6366F1", // indigo-500
  "#0EA5E9", // sky-500
  "#8B5CF6"  // violet-500
];

// ================= FORMAT RUPIAH =================
const formatRupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// ================= CUSTOM TOOLTIP =================
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-gray-700">
            {entry.name}:
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatRupiah(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ================= CUSTOM DONUT TOOLTIP =================
const DonutTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const total = SALES_DATA.reduce((sum, item) => sum + item.actual, 0);
  const percentage = ((data.payload.actual / total) * 100).toFixed(1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-sm font-medium text-gray-700">
          {data.payload.name}:
        </span>
      </div>
      <div className="mt-1 text-sm font-bold text-gray-900">
        {formatRupiah(data.payload.actual)}
      </div>
      <div className="text-xs text-gray-500">
        {percentage}% dari total
      </div>
    </div>
  );
};

// ================= CUSTOM LINE TOOLTIP =================
const LineTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-gray-700">
            {entry.name}:
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatRupiah(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ================= MAIN COMPONENT =================
const TargetPage = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [selectedProduct, setSelectedProduct] = useState("Semua Produk");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : "/admin";

  const products = ["Semua Produk", ...SALES_DATA.map(p => p.name)];

  return (
    <div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`${basePath}/sales`)}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
          >
            ← Kembali
          </button>

          <div>
            <h2 className="text-3xl font-bold">Target Penjualan</h2>
            <p className="text-gray-500">
              Dashboard monitoring performa penjualan produk
            </p>
          </div>
        </div>

        {/* PRODUCT DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-lg transition min-w-[160px] justify-between"
          >
            <span className="text-sm font-medium text-gray-700">{selectedProduct}</span>
            <ChevronDown
              size={16}
              className={`text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              {products.map((product) => (
                <button
                  key={product}
                  onClick={() => {
                    setSelectedProduct(product);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition ${
                    selectedProduct === product
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {product}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Total Target"
          value={SALES_DATA.reduce((sum, item) => sum + item.target, 0)}
          color="blue"
        />
        <SummaryCard
          title="Total Actual"
          value={SALES_DATA.reduce((sum, item) => sum + item.actual, 0)}
          color="green"
        />
        <SummaryCard
          title="Selisih"
          value={SALES_DATA.reduce((sum, item) => sum + (item.actual - item.target), 0)}
          color={SALES_DATA.reduce((sum, item) => sum + item.actual, 0) >=
            SALES_DATA.reduce((sum, item) => sum + item.target, 0)
            ? "green" : "red"}
        />
        <SummaryCard
          title="% Pencapaian"
          value={
            ((SALES_DATA.reduce((sum, item) => sum + item.actual, 0) /
              SALES_DATA.reduce((sum, item) => sum + item.target, 0)) * 100).toFixed(1)
          }
          suffix="%"
          color="purple"
        />
      </div>

      {/* CHARTS ROW 1 - 2 COLUMN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* CHART KIRI - GROUPED BAR */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Target vs Actual per Produk
          </h3>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={SALES_DATA}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="center"
                wrapperStyle={{ paddingBottom: "12px" }}
                iconType="circle"
              />
              <Bar
                dataKey="target"
                name="Target"
                fill="#94A3B8"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="actual"
                name="Actual"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CHART KANAN - DONUT */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Kontribusi Penjualan per Produk
          </h3>

          <ResponsiveContainer width="100%" height={320}>
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={SALES_DATA.map(item => ({
                  name: item.name,
                  value: item.actual
                }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                cornerRadius={4}
                dataKey="value"
              >
                <Tooltip content={<DonutTooltip />} />
                {SALES_DATA.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* LEGEND DONUT */}
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {SALES_DATA.map((item, index) => {
              const total = SALES_DATA.reduce((sum, d) => sum + d.actual, 0);
              const percentage = ((item.actual / total) * 100).toFixed(1);

              return (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: DONUT_COLORS[index] }}
                  />
                  <span className="text-xs text-gray-600">
                    {item.name} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CHART ROW 2 - LINE CHART FULL WIDTH */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Trend Penjualan Bulanan (All Products)
          </h3>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={MONTHLY_DATA}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <Tooltip content={<LineTooltip />} />
            <Legend
              verticalAlign="top"
              align="center"
              wrapperStyle={{ paddingBottom: "12px" }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "#94A3B8", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: "#3B82F6", r: 4 }}
              activeDot={{ r: 6, stroke: "#2563EB", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* SUMMARY BULANAN */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Rata-rata Target/Bulan</p>
            <p className="text-lg font-bold text-gray-700">
              {formatRupiah(MONTHLY_DATA.reduce((sum, item) => sum + item.target, 0) / 12)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Rata-rata Actual/Bulan</p>
            <p className="text-lg font-bold text-blue-600">
              {formatRupiah(MONTHLY_DATA.reduce((sum, item) => sum + item.actual, 0) / 12)}
            </p>
          </div>
        </div>
      </div>

      {/* TABLE DETAIL */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Detail Per Produk
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Produk</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Target</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actual</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Selisih</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Pencapaian</th>
              </tr>
            </thead>
            <tbody>
              {SALES_DATA.map((item) => {
                const selisih = item.actual - item.target;
                const persentase = ((item.actual / item.target) * 100).toFixed(1);
                const isAchieved = item.actual >= item.target;

                return (
                  <tr key={item.name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatRupiah(item.target)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-blue-600">
                      {formatRupiah(item.actual)}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${selisih >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                      {selisih >= 0 ? "+" : ""}{formatRupiah(selisih)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${isAchieved
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}>
                        {persentase}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

// ================= SUMMARY CARD COMPONENT =================
const SummaryCard = ({ title, value, suffix = "", color }) => {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "💰" },
    green: { bg: "bg-green-50", text: "text-green-600", icon: "✓" },
    red: { bg: "bg-red-50", text: "text-red-600", icon: "⚠" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "%" }
  };

  const { bg, text, icon } = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${text}`}>
            {typeof value === "number" ? formatRupiah(value) : value}
            {suffix}
          </p>
        </div>
        <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default TargetPage;
