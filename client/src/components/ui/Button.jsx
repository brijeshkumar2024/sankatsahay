import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export default function Button({ className, children, variant = "default", ...props }) {
  const variants = {
    default: "bg-live text-bg border border-live/60 hover:brightness-110",
    danger: "bg-alert text-text border border-alert/70 shadow-danger hover:brightness-110",
    ghost: "glass border border-border text-text hover:bg-white/10"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        "h-14 min-w-32 rounded-xl px-5 font-semibold tracking-wide transition duration-200",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
