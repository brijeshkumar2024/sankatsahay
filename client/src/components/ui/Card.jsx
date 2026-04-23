import { cn } from "../../utils/cn";

export default function Card({ className, children }) {
  return <div className={cn("glass rounded-2xl p-5", className)}>{children}</div>;
}
