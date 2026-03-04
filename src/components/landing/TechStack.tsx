import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

// Simple Icons CDN: https://simpleicons.org
// URL pattern: https://cdn.simpleicons.org/[slug]
const ICON_CDN = "https://cdn.simpleicons.org";

interface TechItem {
    name: string;
    slug: string;
}

// Row 1: AI, ML, Cloud & Infrastructure
const row1: TechItem[] = [
    { name: "Anthropic", slug: "anthropic" },
    { name: "Google Gemini", slug: "googlegemini" },
    { name: "Meta", slug: "meta" },
    { name: "Hugging Face", slug: "huggingface" },
    { name: "TensorFlow", slug: "tensorflow" },
    { name: "PyTorch", slug: "pytorch" },
    { name: "LangChain", slug: "langchain" },
    { name: "Firebase", slug: "firebase" },
    { name: "Google Cloud", slug: "googlecloud" },
    { name: "Amazon", slug: "amazon" },
    { name: "Vercel", slug: "vercel" },
    { name: "Docker", slug: "docker" },
    { name: "Kubernetes", slug: "kubernetes" },
    { name: "Supabase", slug: "supabase" },
    { name: "Grafana", slug: "grafana" },
    { name: "Datadog", slug: "datadog" },
];

// Row 2: Languages, Frameworks, Data & Tools
const row2: TechItem[] = [
    { name: "React", slug: "react" },
    { name: "TypeScript", slug: "typescript" },
    { name: "Python", slug: "python" },
    { name: "Node.js", slug: "nodedotjs" },
    { name: "Next.js", slug: "nextdotjs" },
    { name: "Tailwind CSS", slug: "tailwindcss" },
    { name: "PostgreSQL", slug: "postgresql" },
    { name: "Redis", slug: "redis" },
    { name: "MongoDB", slug: "mongodb" },
    { name: "Elasticsearch", slug: "elasticsearch" },
    { name: "Stripe", slug: "stripe" },
    { name: "Sentry", slug: "sentry" },
    { name: "GitHub", slug: "github" },
    { name: "Figma", slug: "figma" },
    { name: "Notion", slug: "notion" },
    { name: "Linear", slug: "linear" },
];

const MarqueeRow = ({ items, direction = "left", speed = 30 }: { items: TechItem[]; direction?: "left" | "right"; speed?: number }) => {
    const doubled = [...items, ...items]; // Seamless loop

    return (
        <div className="relative overflow-hidden py-2">
            {/* Fade masks on edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

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
                {doubled.map((tech, i) => (
                    <div
                        key={`${tech.slug}-${i}`}
                        className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm hover:border-electric-purple/30 hover:bg-card/50 transition-all duration-300 group/item cursor-default select-none"
                    >
                        <img
                            src={`${ICON_CDN}/${tech.slug}`}
                            alt={tech.name}
                            width={20}
                            height={20}
                            loading="lazy"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            className="h-5 w-5 [filter:brightness(0)_invert(1)] opacity-40 group-hover/item:[filter:none] group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-300"
                        />
                        <span className="text-sm font-medium text-muted-foreground group-hover/item:text-foreground transition-colors whitespace-nowrap">
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
                <MarqueeRow items={row1} direction="left" speed={40} />
                <MarqueeRow items={row2} direction="right" speed={45} />
            </div>
        </section>
    );
};
