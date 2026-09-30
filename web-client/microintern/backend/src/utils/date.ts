import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Jakarta");

export const getLocalDateString = (date: string | Date | number | dayjs.Dayjs | null | undefined = dayjs()): string => {
  return dayjs(date).tz("Asia/Jakarta").format("YYYY-MM-DD");
};

export const localDayjs = (date?: string | Date | number | dayjs.Dayjs | null | undefined) => {
  return dayjs(date).tz("Asia/Jakarta");
};

export { dayjs };
