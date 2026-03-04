import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

const technologies = [
    { name: "OpenAI", icon: "🧠" },
    { name: "Anthropic", icon: "🤖" },
    { name: "Google Cloud", icon: "☁️" },
    { name: "Vercel", icon: "▲" },
    { name: "React", icon: "⚛️" },
    { name: "Tailwind", icon: "🎨" },
    { name: "Python", icon: "🐍" },
    { name: "TensorFlow", icon: "📊" },
    { name: "Next.js", icon: "N" },
    { name: "TypeScript", icon: "TS" },
    { name: "PostgreSQL", icon: "🐘" },
    { name: "Redis", icon: "🔴" },
    { name: "Docker", icon: "🐳" },
    { name: "Kubernetes", icon: "☸️" },
    { name: "Stripe", icon: "💳" },
    { name: "Sentry", icon: "👀" },
];

const MarqueeRow = ({ direction = "left", speed = 30 }: { direction?: "left" | "right"; speed?: number }) => {
    const items = [...technologies, ...technologies]; // Double for seamless loop

    return (
        <div className="relative overflow-hidden py-2">
            <motion.div
                className="flex gap-4 w-max"
                animate={{
                    x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
                }}
                transition={{
                    x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: speed,
                        ease: "linear",
                    },
                }}
            >
                {items.map((tech, i) => (
                    <div
                        key={`${tech.name}-${i}`}
                        className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm hover:border-electric-purple/30 hover:bg-card/50 transition-all duration-300 group cursor-default select-none"
                    >
                        <span className="text-2xl filter grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110">
                            {tech.icon}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                            {tech.name}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export const TechStack = () => {
    return (
        <section id="tech-stack" className="py-24 relative overflow-hidden bg-background">
            {/* Gradient ambient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-electric-purple/8 via-transparent to-transparent" />

            <div className="container px-4 md:px-6 relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="text-center max-w-3xl mx-auto mb-12"
                >
                    <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
                        Powered by Modern Intelligence
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        We leverage the most advanced AI models and robust infrastructure to build scalable, future-proof solutions.
                    </p>
                </motion.div>
            </div>

            {/* Full-width marquee (breaks container) */}
            <div className="space-y-3">
                <MarqueeRow direction="left" speed={35} />
                <MarqueeRow direction="right" speed={40} />
            </div>
        </section>
    );
};
