import { Card, CardContent } from "@/components/ui/design-system/Card";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/animations";

const technologies = [
    { name: "OpenAI", category: "LLM", icon: "🧠" },
    { name: "Anthropic", category: "LLM", icon: "🤖" },
    { name: "Google Cloud", category: "Cloud", icon: "☁️" },
    { name: "Vercel", category: "Deployment", icon: "▲" },
    { name: "React", category: "Frontend", icon: "⚛️" },
    { name: "Tailwind", category: "Styling", icon: "🎨" },
    { name: "Python", category: "Backend", icon: "🐍" },
    { name: "TensorFlow", category: "ML", icon: "📊" },
    { name: "Next.js", category: "Framework", icon: "N" },
    { name: "TypeScript", category: "Language", icon: "TS" },
    { name: "PostgreSQL", category: "Database", icon: "🐘" },
    { name: "Redis", category: "Cache", icon: "🔴" },
    { name: "Docker", category: "DevOps", icon: "🐳" },
    { name: "Kubernetes", category: "Orchestration", icon: "☸️" },
    { name: "Stripe", category: "Payments", icon: "💳" },
    { name: "Sentry", category: "Monitoring", icon: "👀" },
];

export const TechStack = () => {
    return (
        <section id="tech-stack" className="py-24 relative overflow-hidden bg-background">
            {/* Gradient Mesh Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-electric-purple/10 via-background to-background" />

            <div className="container px-4 md:px-6 relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerChildren}
                    className="space-y-12"
                >
                    <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
                            Powered by Modern Intelligence
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            We leverage the most advanced AI models and robust infrastructure to build scalable, future-proof solutions.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerChildren}
                        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4"
                    >
                        {technologies.map((tech) => (
                            <motion.div key={tech.name} variants={fadeInUp}>
                                <Card tilt className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-electric-cyan/50 transition-colors cursor-pointer group">
                                    <CardContent className="p-4 flex flex-col items-center justify-center gap-3 h-32">
                                        <span className="text-4xl group-hover:scale-110 transition-transform duration-300 filter grayscale group-hover:grayscale-0">
                                            {tech.icon}
                                        </span>
                                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                            {tech.name}
                                        </span>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
