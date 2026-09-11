import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  textClassName?: string;
  underlineClassName?: string;
  underlinePath?: string;
  underlineHoverPath?: string;
  underlineDuration?: number;
}

const AnimatedText = React.forwardRef<HTMLDivElement, AnimatedTextProps>(
  (
    {
      text,
      textClassName,
      underlineClassName,
      underlinePath = "M 0,10 Q 75,0 150,10 Q 225,20 300,10",
      underlineHoverPath = "M 0,10 Q 75,20 150,10 Q 225,0 300,10",
      underlineDuration = 1.5,
      className,
      ...props
    },
    ref
  ) => {
    const pathVariants: Variants = {
      hidden: { pathLength: 0, opacity: 0 },
      visible: {
        pathLength: 1,
        opacity: 1,
        transition: { duration: underlineDuration, ease: "easeInOut" },
      },
    };

    return (
      <div ref={ref} className={cn("flex flex-col items-center", className)} {...props}>
        <h1 className={cn("text-4xl font-bold mb-2", textClassName)}>{text}</h1>
        <motion.svg
          width="100%"
          height="20"
          viewBox="0 0 300 20"
          initial="hidden"
          animate="visible"
          className={cn("stroke-current", underlineClassName)}
        >
          <motion.path
            d={underlinePath}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            variants={pathVariants}
            whileHover={{ d: underlineHoverPath }}
          />
        </motion.svg>
      </div>
    );
  }
);

AnimatedText.displayName = "AnimatedText";

export { AnimatedText };
