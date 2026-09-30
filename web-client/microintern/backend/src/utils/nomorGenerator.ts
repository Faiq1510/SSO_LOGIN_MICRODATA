import { localDayjs } from "./date";

const ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export const resolveTemplate = (template: string, countDb: number, nomorAwal: number): string => {
  const d = localDayjs();
  const nextNumber = Math.max(nomorAwal - 1, countDb) + 1;
  const padded = nextNumber.toString().padStart(3, "0");
  return template
    .replace("{no}", padded)
    .replace("{tahun}", d.year().toString())
    .replace("{bulan_romawi}", ROMAWI[d.month()])
    .replace("{bulan}", (d.month() + 1).toString().padStart(2, "0"));
};
