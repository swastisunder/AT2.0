import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Atom } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const sarcasticMessages = [
  "👀 Dark mode exists, you know.",
  "Your eyes are crying. Just sayin'. 🌞",
  "I can see you squinting. 😎",
  "This is light mode. You're on your own. 🌞",
  "Dark mode is literally one click away. 👆",
  "Who hurt you? Dark mode is right there.",
  "You're still in light mode? Bold choice. 🤡",
  "Real pirates use dark mode. 🏴‍☠️",
  "Your eyes called. They want dark mode.",
  "I'm not saying you need dark mode... but I'm not NOT saying it. 👀",
  "The moon is jealous right now. 🌙",
  "Dark mode is free. Just saying. 💸",
  "Your battery is crying in light mode. 🔋",
  "I bet you stare at the sun too. ☀️",
  "Dark mode: exists. You: ignore. 🤷",
  "☀️ Congratulations, you've chosen the brightest timeline.",
  "I can hear your retinas screaming from here. 😬",
  "This is why we can't have nice dark things.",
  "Your screen is basically a flashlight now. 🔦",
  "Are you trying to communicate with the sun? 🌻",
  "I'd offer you sunglasses, but I'm just code. 🕶️",
  "Light mode? In this economy?",
  "You must really enjoy replacing your monitor bulbs.",
  "Every pixel in light mode files a complaint. 📄",
  "Dark mode called. It misses you.",
];

const playfulDarkMessages = [
  "🌙 Welcome to the dark side. Your eyes thank you.",
  "🖤 Ahh, much better. Your retinas are applauding.",
  "✨ Dark mode engaged. Productivity +10%.",
  "🌌 You've chosen wisely. The night is strong with this one.",
  "😌 Thank you for saving your eyes. They'll remember this.",
  "🦉 Wise move. Even owls approve.",
  "💡 Light is overrated. Darkness is where the magic happens.",
  "🎉 Dark mode activated. Your screen just got cooler.",
  "🌃 Smooth move. Your battery and eyes are both smiling.",
  "☕ Dark mode on. Coffee taste better in the dark, too.",
  "🕶️ Smooth operator. The dark suits you.",
  "🌒 Your screen just exhaled.",
  "🔮 The void welcomes you with open arms.",
  "🖤 Ah, silence for your eyeballs.",
  "🌟 Stars align. Dark mode on.",
  "🦇 You've gone full night mode. Respect.",
  "📉 Brightness dropped. Vibes rose.",
  "🌑 Even the moon is jealous of your setup.",
  "🎧 Dark mode: the lofi of themes.",
  "🪄 Presto! Your screen is now a calm cave.",
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const stored = window.localStorage.getItem("atomictask-theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [darkMessage, setDarkMessage] = useState("");
  const [showDarkMessage, setShowDarkMessage] = useState(false);
  const darkTimerRef = useRef(null);
  const lightIntervalRef = useRef(null);
  const prevIsDarkRef = useRef(isDark);


  // Scroll listener
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Light mode: show a random message immediately, then rotate every 60 seconds
  useEffect(() => {
    if (!isDark) {
      // Hide any dark message immediately
      const hideDarkMessageTimer = window.setTimeout(
        () => setShowDarkMessage(false),
        0,
      );
      if (darkTimerRef.current) clearTimeout(darkTimerRef.current);

      const showRandomLightMessage = () => {
        const randomIndex = Math.floor(
          Math.random() * sarcasticMessages.length,
        );
        setMessage(sarcasticMessages[randomIndex]);
        setShowMessage(true);
      };

      // Show first message immediately
      showRandomLightMessage();

      // Set up interval to change message every 60 seconds
      lightIntervalRef.current = setInterval(showRandomLightMessage, 60000);

      return () => {
        clearTimeout(hideDarkMessageTimer);
        if (lightIntervalRef.current) {
          clearInterval(lightIntervalRef.current);
          lightIntervalRef.current = null;
        }
      };
    }
    return undefined;
  }, [isDark]);

  // Dark mode transition: show a new playful message, disappear after 5 seconds
  useEffect(() => {
    const wasDark = prevIsDarkRef.current;
    prevIsDarkRef.current = isDark;

    if (wasDark !== isDark) {
      if (isDark) {
        // Switched to dark mode
        if (darkTimerRef.current) clearTimeout(darkTimerRef.current);
        const showDarkMessageTimer = window.setTimeout(() => {
          const randomIndex = Math.floor(
            Math.random() * playfulDarkMessages.length,
          );
          setDarkMessage(playfulDarkMessages[randomIndex]);
          setShowDarkMessage(true);
        }, 0);
        darkTimerRef.current = setTimeout(() => {
          setShowDarkMessage(false);
        }, 5000); // 5 seconds
        return () => {
          clearTimeout(showDarkMessageTimer);
          if (darkTimerRef.current) clearTimeout(darkTimerRef.current);
        };
      } else {
        // Switched to light mode – handled by the previous effect
      }
    }

    return () => {
      if (darkTimerRef.current) clearTimeout(darkTimerRef.current);
    };
  }, [isDark]);

  const links = [
    ["Habit", "#habits"],
    ["Task", "#ai-tasks"],
    ["How It Works", "#how-it-works"],
    ["Pricing", "#pricing"],
  ];

  return (
    <div className="sticky top-4 z-50 flex w-full flex-col items-center px-4 transition-all duration-300">
      <nav
        className={`
          flex w-full items-center justify-between gap-3 rounded-full border border-border/80 bg-background/80 px-5 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300
          ${isScrolled ? "max-w-[860px] py-2" : "max-w-[1000px] py-2.5"}
        `}
        aria-label="Primary navigation"
      >
        {/* Brand */}
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2 font-heading text-lg font-semibold tracking-tight text-foreground no-underline transition-opacity hover:opacity-70"
        >
          <Atom className="size-5 text-[var(--accent-atomic)]" />
          <span>AtomicTask</span>
        </Link>

        {/* Center links */}
        {links.length > 0 && (
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 sm:flex">
            {links.map(([label, href]) =>
              href.startsWith("#") ? (
                <a
                  key={label}
                  href={href}
                  className="relative text-sm font-semibold text-muted-foreground no-underline transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[var(--accent-atomic)] after:transition-transform after:duration-200 hover:after:scale-x-100"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  to={href}
                  className="relative text-sm font-semibold text-muted-foreground no-underline transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[var(--accent-atomic)] after:transition-transform after:duration-200 hover:after:scale-x-100"
                >
                  {label}
                </Link>
              ),
            )}
          </div>
        )}

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-3">
          <ThemeToggle onThemeChange={(theme) => setIsDark(theme === "dark")} />

          <Link
            to="/login"
            className="hidden text-sm font-semibold text-muted-foreground no-underline transition-colors hover:text-foreground sm:block"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="flex items-center gap-1.5 rounded-full bg-[var(--accent-atomic)] px-4 py-2 text-sm font-extrabold text-[var(--accent-atomic-foreground)] no-underline transition-all duration-200 hover:brightness-105 active:scale-95"
          >
            Get started
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </nav>

      {/* Message container */}
      <div
        className={`mt-2 w-full ${isScrolled ? "max-w-[760px]" : "max-w-[1000px]"} pr-5 text-right h-6 overflow-hidden`}
      >
        {isDark ? (
          <p
            className={`text-xs font-medium text-accent-atomic transition-opacity duration-300 ${
              showDarkMessage ? "opacity-100" : "opacity-0"
            }`}
          >
            {darkMessage}
          </p>
        ) : (
          <p
            className={`text-xs text-muted-foreground/60 italic transition-opacity duration-500 hover:text-muted-foreground/90 ${
              showMessage ? "opacity-100" : "opacity-0"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
