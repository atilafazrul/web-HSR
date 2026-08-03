import React from "react";
import { digitsOnly, formatRibuanId } from "../../../../utils/formatRupiahInput";

/**
 * Input nominal Rupiah dengan pemisah ribuan (10.000).
 * onChange menerima string sudah diformat.
 */
export function RupiahInput({
  value,
  onChange,
  className = "",
  placeholder = "0",
  required = false,
  name,
  id,
  disabled = false,
}) {
  const handleChange = (e) => {
    onChange?.(formatRibuanId(digitsOnly(e.target.value)));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      id={id}
      value={value ?? ""}
      onChange={handleChange}
      className={`tabular-nums ${className}`}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoComplete="off"
    />
  );
}
