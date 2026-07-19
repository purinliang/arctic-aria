import type { BuiltInMemoryCategoryKey } from "@/features/dashboard/types";

type MemoryExperienceKey = "fallback" | BuiltInMemoryCategoryKey;

export type MemoryExperienceMessages = Record<
  MemoryExperienceKey,
  {
    cancelDone: string;
    doneTimes: {
      one: string;
      other: string;
    };
    lastDone: string;
    markDone: string;
    neverDone: string;
  }
>;

export const englishMemoryExperienceMessages: MemoryExperienceMessages = {
  fallback: {
    lastDone: "Last experienced {date}",
    neverDone: "Never experienced",
    doneTimes: {
      one: "Experienced {count} time",
      other: "Experienced {count} times",
    },
    markDone: "Mark {title} as experienced",
    cancelDone: "Cancel experience record for {title}",
  },
  cuisine: {
    lastDone: "Last tasted {date}",
    neverDone: "Never tasted",
    doneTimes: {
      one: "Tasted {count} time",
      other: "Tasted {count} times",
    },
    markDone: "Mark {title} as tasted",
    cancelDone: "Cancel taste record for {title}",
  },
  sightseeing: {
    lastDone: "Last visited {date}",
    neverDone: "Never visited",
    doneTimes: {
      one: "Visited {count} time",
      other: "Visited {count} times",
    },
    markDone: "Mark {title} as visited",
    cancelDone: "Cancel visit record for {title}",
  },
  movie: {
    lastDone: "Last watched {date}",
    neverDone: "Never watched",
    doneTimes: {
      one: "Watched {count} time",
      other: "Watched {count} times",
    },
    markDone: "Mark {title} as watched",
    cancelDone: "Cancel watch record for {title}",
  },
  anime: {
    lastDone: "Last watched {date}",
    neverDone: "Never watched",
    doneTimes: {
      one: "Watched {count} time",
      other: "Watched {count} times",
    },
    markDone: "Mark {title} as watched",
    cancelDone: "Cancel watch record for {title}",
  },
  book: {
    lastDone: "Last read {date}",
    neverDone: "Never read",
    doneTimes: {
      one: "Read {count} time",
      other: "Read {count} times",
    },
    markDone: "Mark {title} as read",
    cancelDone: "Cancel read record for {title}",
  },
  music: {
    lastDone: "Last listened to {date}",
    neverDone: "Never listened to",
    doneTimes: {
      one: "Listened {count} time",
      other: "Listened {count} times",
    },
    markDone: "Mark {title} as listened to",
    cancelDone: "Cancel listening record for {title}",
  },
  game: {
    lastDone: "Last played {date}",
    neverDone: "Never played",
    doneTimes: {
      one: "Played {count} time",
      other: "Played {count} times",
    },
    markDone: "Mark {title} as played",
    cancelDone: "Cancel play record for {title}",
  },
  shopping: {
    lastDone: "Last shopped {date}",
    neverDone: "Never shopped",
    doneTimes: {
      one: "Shopped {count} time",
      other: "Shopped {count} times",
    },
    markDone: "Mark {title} as shopped",
    cancelDone: "Cancel shopping record for {title}",
  },
};

export const simplifiedChineseMemoryExperienceMessages: MemoryExperienceMessages = {
  fallback: {
    lastDone: "上次体验 {date}",
    neverDone: "从未体验",
    doneTimes: {
      one: "体验 {count} 次",
      other: "体验 {count} 次",
    },
    markDone: "将 {title} 标记为已体验",
    cancelDone: "取消 {title} 的体验状态",
  },
  cuisine: {
    lastDone: "上次品尝 {date}",
    neverDone: "从未品尝",
    doneTimes: {
      one: "品尝 {count} 次",
      other: "品尝 {count} 次",
    },
    markDone: "将 {title} 标记为已品尝",
    cancelDone: "取消 {title} 的品尝状态",
  },
  sightseeing: {
    lastDone: "上次游览 {date}",
    neverDone: "从未游览",
    doneTimes: {
      one: "游览 {count} 次",
      other: "游览 {count} 次",
    },
    markDone: "将 {title} 标记为已游览",
    cancelDone: "取消 {title} 的游览状态",
  },
  movie: {
    lastDone: "上次观看 {date}",
    neverDone: "从未观看",
    doneTimes: {
      one: "观看 {count} 次",
      other: "观看 {count} 次",
    },
    markDone: "将 {title} 标记为已观看",
    cancelDone: "取消 {title} 的观看状态",
  },
  anime: {
    lastDone: "上次观看 {date}",
    neverDone: "从未观看",
    doneTimes: {
      one: "观看 {count} 次",
      other: "观看 {count} 次",
    },
    markDone: "将 {title} 标记为已观看",
    cancelDone: "取消 {title} 的观看状态",
  },
  book: {
    lastDone: "上次阅读 {date}",
    neverDone: "从未阅读",
    doneTimes: {
      one: "阅读 {count} 次",
      other: "阅读 {count} 次",
    },
    markDone: "将 {title} 标记为已阅读",
    cancelDone: "取消 {title} 的阅读状态",
  },
  music: {
    lastDone: "上次听过 {date}",
    neverDone: "从未听过",
    doneTimes: {
      one: "听过 {count} 次",
      other: "听过 {count} 次",
    },
    markDone: "将 {title} 标记为已听过",
    cancelDone: "取消 {title} 的听过状态",
  },
  game: {
    lastDone: "上次游玩 {date}",
    neverDone: "从未游玩",
    doneTimes: {
      one: "游玩 {count} 次",
      other: "游玩 {count} 次",
    },
    markDone: "将 {title} 标记为已游玩",
    cancelDone: "取消 {title} 的游玩状态",
  },
  shopping: {
    lastDone: "上次购物 {date}",
    neverDone: "从未购物",
    doneTimes: {
      one: "购物 {count} 次",
      other: "购物 {count} 次",
    },
    markDone: "将 {title} 标记为已购物",
    cancelDone: "取消 {title} 的购物状态",
  },
};
