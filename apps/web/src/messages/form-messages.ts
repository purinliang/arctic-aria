export const englishFormMessages = {
  datePicker: {
    monthNames: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    shortMonthNames: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    weekdayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    previousMonth: "Previous month",
    nextMonth: "Next month",
    clearDate: "Clear date",
    monthYear: (monthName: string, year: number) => `${monthName} ${year}`,
    dateValue: (shortMonthName: string, day: number, year: number) =>
      `${shortMonthName} ${day}, ${year}`,
  },
  timePicker: {
    hour: "Hour",
    minute: "Minute",
    periodLabels: {
      AM: "AM",
      PM: "PM",
    },
    quickMinutes: "Quick minutes",
    done: "Done",
    clear: "Clear",
    value: (hour12: number, minute: number, period: string) =>
      `${hour12}:${String(minute).padStart(2, "0")} ${period}`,
  },
};

export type FormMessages = typeof englishFormMessages;
export type DatePickerMessages = FormMessages["datePicker"];
export type TimePickerMessages = FormMessages["timePicker"];

export const simplifiedChineseFormMessages: FormMessages = {
  datePicker: {
    monthNames: [
      "一月",
      "二月",
      "三月",
      "四月",
      "五月",
      "六月",
      "七月",
      "八月",
      "九月",
      "十月",
      "十一月",
      "十二月",
    ],
    shortMonthNames: [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ],
    weekdayNames: ["日", "一", "二", "三", "四", "五", "六"],
    previousMonth: "上个月",
    nextMonth: "下个月",
    clearDate: "清除日期",
    monthYear: (monthName, year) => `${year}年${monthName}`,
    dateValue: (shortMonthName, day, year) => `${year}年${shortMonthName}${day}日`,
  },
  timePicker: {
    hour: "小时",
    minute: "分钟",
    periodLabels: {
      AM: "上午",
      PM: "下午",
    },
    quickMinutes: "快速分钟",
    done: "完成",
    clear: "清除",
    value: (hour12, minute, period) =>
      `${period} ${hour12}:${String(minute).padStart(2, "0")}`,
  },
};
