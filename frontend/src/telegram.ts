export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  MainButton?: {
    show: () => void;
    hide: () => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean }) => void;
    onClick: (handler: () => void) => void;
    offClick: (handler: () => void) => void;
  };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (handler: () => void) => void;
    offClick: (handler: () => void) => void;
  };
  colorScheme?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
};

export function getTelegram(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  const tg = (window as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
  return tg;
}
