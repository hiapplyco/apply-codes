import { Button } from "@/components/ui/design-system/Button";
import { motion } from "framer-motion";
import { slideInLeft, slideInRight } from "@/lib/animations";
import { Bot, Users, ArrowRight, CheckCircle2 } from "lucide-react";

export const DualServices = () => {
    return (
        <section id="services" className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden">

            {/* AI Agent Development Panel */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-full lg:w-1/2 bg-background border-b lg:border-b-0 lg:border-r border-border p-8 md:p-12 lg:p-24 flex flex-col justify-center relative group"
            >
                <div className="absolute inset-0 bg-electric-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 space-y-6">
                    <div className="h-12 w-12 rounded-xl bg-electric-purple/10 flex items-center justify-center text-electric-purple mb-4">
                        <Bot className="h-6 w-6" />
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display">
                        Build Intelligent<br />
                        <span className="text-electric-purple">AI Agents</span>
                    </h2>

                    <p className="text-lg text-muted-foreground max-w-md">
                        Custom-trained neural networks designed to automate your specific business workflows with 24/7 reliability.
                    </p>

                    <ul className="space-y-3">
                        {['24/7 Availability', 'Instant Scalability', 'Zero Error Rate'].map((item) => (
                            <li key={item} className="flex items-center gap-2 font-medium">
                                <div className="h-1.5 w-1.5 rounded-full bg-electric-purple" />
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
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-full lg:w-1/2 bg-background p-8 md:p-12 lg:p-24 flex flex-col justify-center relative group"
            >
                <div className="absolute inset-0 bg-electric-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 space-y-6">
                    <div className="h-12 w-12 rounded-xl bg-electric-cyan/10 flex items-center justify-center text-electric-cyan mb-4">
                        <Users className="h-6 w-6" />
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display">
                        Hire Human<br />
                        <span className="text-electric-cyan">Experts</span>
                    </h2>

                    <p className="text-lg text-muted-foreground max-w-md">
                        Top 1% of specialized talent to manage your AI fleet, handle complex strategy, and provide creative direction.
                    </p>

                    <ul className="space-y-3">
                        {['Strategic Oversight', 'Creative Direction', 'Complex Problem Solving'].map((item) => (
                            <li key={item} className="flex items-center gap-2 font-medium">
                                <div className="h-1.5 w-1.5 rounded-full bg-electric-cyan" />
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
