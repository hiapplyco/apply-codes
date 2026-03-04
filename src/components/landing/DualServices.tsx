import { Button } from "@/components/ui/design-system/Button";
import { motion } from "framer-motion";
import { Bot, Users } from "lucide-react";

export const DualServices = () => {
    return (
        <section id="services" className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden">

            {/* AI Agent Development Panel */}
            <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
                className="w-full lg:w-1/2 bg-background border-b lg:border-b-0 lg:border-r border-border/40 p-8 md:p-12 lg:p-24 flex flex-col justify-center relative group"
            >
                {/* Shimmer sweep — diagonal gradient that animates on hover */}
                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_25%,rgba(139,92,246,0.06)_40%,rgba(139,92,246,0.12)_50%,rgba(139,92,246,0.06)_60%,transparent_75%)] bg-[length:200%_100%] opacity-0 group-hover:opacity-100 group-hover:animate-shimmer-sweep transition-opacity duration-500 pointer-events-none" />
                {/* Ambient glow orbs */}
                <div className="absolute inset-0 bg-gradient-to-br from-electric-purple/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-electric-purple/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <div className="h-12 w-12 rounded-2xl bg-electric-purple/10 flex items-center justify-center text-electric-purple mb-4 border border-electric-purple/20 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-shadow duration-500">
                        <Bot className="h-6 w-6" />
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display">
                        Build Intelligent<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-purple to-violet-400">AI Agents</span>
                    </h2>

                    <p className="text-lg text-muted-foreground max-w-md">
                        Custom-trained neural networks designed to automate your specific business workflows with 24/7 reliability.
                    </p>

                    <ul className="space-y-3">
                        {['24/7 Availability', 'Instant Scalability', 'Zero Error Rate'].map((item) => (
                            <li key={item} className="flex items-center gap-3 font-medium">
                                <div className="h-1.5 w-1.5 rounded-full bg-electric-purple shadow-[0_0_6px_rgba(139,92,246,0.6)]" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <Button variant="neubrutalist" className="w-full sm:w-fit">
                        Build Your Agent
                    </Button>
                </div>
            </motion.div>

            {/* Human Recruitment Panel */}
            <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
                className="w-full lg:w-1/2 bg-background p-8 md:p-12 lg:p-24 flex flex-col justify-center relative group"
            >
                {/* Shimmer sweep — cyan variant */}
                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_25%,rgba(6,182,212,0.06)_40%,rgba(6,182,212,0.12)_50%,rgba(6,182,212,0.06)_60%,transparent_75%)] bg-[length:200%_100%] opacity-0 group-hover:opacity-100 group-hover:animate-shimmer-sweep transition-opacity duration-500 pointer-events-none" />
                {/* Ambient glow orbs */}
                <div className="absolute inset-0 bg-gradient-to-bl from-electric-cyan/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-electric-cyan/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <div className="h-12 w-12 rounded-2xl bg-electric-cyan/10 flex items-center justify-center text-electric-cyan mb-4 border border-electric-cyan/20 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-shadow duration-500">
                        <Users className="h-6 w-6" />
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display">
                        Hire Human<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-teal-400">Experts</span>
                    </h2>

                    <p className="text-lg text-muted-foreground max-w-md">
                        Top 1% of specialized talent to manage your AI fleet, handle complex strategy, and provide creative direction.
                    </p>

                    <ul className="space-y-3">
                        {['Strategic Oversight', 'Creative Direction', 'Complex Problem Solving'].map((item) => (
                            <li key={item} className="flex items-center gap-3 font-medium">
                                <div className="h-1.5 w-1.5 rounded-full bg-electric-cyan shadow-[0_0_6px_rgba(103,232,249,0.6)]" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <Button variant="neubrutalist-cyan" className="w-full sm:w-fit">
                        Find Experts
                    </Button>
                </div>
            </motion.div>
        </section>
    );
};
