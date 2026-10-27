/** Normalize common Indian mobile formats to +91 followed by ten digits. */
export function normalizeIndianMobile(value: string): string | null {
  const compact = value.trim().replace(/[\s()-]/g, "");
  if (!/^\+?\d+$/.test(compact)) return null;

  let nationalNumber = compact;
  if (/^\+91[6-9]\d{9}$/.test(compact)) nationalNumber = compact.slice(3);
  else if (/^91[6-9]\d{9}$/.test(compact)) nationalNumber = compact.slice(2);
  else if (/^0[6-9]\d{9}$/.test(compact)) nationalNumber = compact.slice(1);

  return /^[6-9]\d{9}$/.test(nationalNumber) ? `+91${nationalNumber}` : null;
}
