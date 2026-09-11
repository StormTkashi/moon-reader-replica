import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";

const SHOWN_KEY = "splash-shown";

export function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(SHOWN_KEY);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(SHOWN_KEY, "1");
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15"
          >
            <BookOpen className="h-10 w-10 text-primary" />
          </motion.div>
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AnimatedText
              text="teste"
              textClassName="text-5xl font-bold mb-1"
              underlineClassName="text-primary"
              underlineDuration={1.4}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
