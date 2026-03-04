import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/design-system/Card";
import { Button } from "@/components/ui/design-system/Button";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { ArrowRight, TrendingUp, Clock, Users } from "lucide-react";

const industries = ["All", "Healthcare", "Finance", "Legal", "Retail"];

const caseStudies = [
    {
        client: "MediCare Plus",
        industry: "Healthcare",
        title: "Patient Intake Automation",
        metric: "60% Reduction",
        metricLabel: "Wait Times",
        description: "Automated patient triage and scheduling system using custom AI agents.",
        icon: Clock,
    },
    {
        client: "FinTech Global",
        industry: "Finance",
        title: "Risk Assessment Model",
        metric: "$2M Saved",
        metricLabel: "Annual Fraud Prevention",
        description: "Real-time transaction analysis and fraud detection system.",
        icon: TrendingUp,
    },
    {
        client: "Legal Eagles LLP",
        industry: "Legal",
        title: "Contract Analysis Bot",
        metric: "3x Caseload",
        metricLabel: "Capacity Increase",
        description: "Automated document review and summary generation for paralegals.",
        icon: Users,
    },
    {
        client: "ShopTrend",
        industry: "Retail",
        title: "Personalized Shopping",
        metric: "45% Increase",
        metricLabel: "Conversion Rate",
        description: "AI-driven product recommendations and virtual styling assistant.",
        icon: TrendingUp,
    },
];

export const CaseStudies = () => {
    const [activeFilter, setActiveFilter] = useState("All");

    const filteredStudies = activeFilter === "All"
        ? caseStudies
        : caseStudies.filter(study => study.industry === activeFilter);

    return (
        <section id="case-studies" className="py-24 bg-background relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric-purple/5 rounded-full blur-3xl" />

            <div className="container px-4 md:px-6 relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="space-y-12"
                >
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="space-y-4 text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-bold font-display">
                                Real Results, <br /> Real Impact
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-xl">
                                See how industry leaders are transforming their operations with our custom AI solutions and expert talent.
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 mb-12">
                            {industries.map((industry) => (
                                <Button
                                    key={industry}
                                    variant={activeFilter === industry ? "neubrutalist" : "outline"}
                                    size="sm"
                                    onClick={() => setActiveFilter(industry)}
                                    className="rounded-full"
                                >
                                    {industry}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredStudies.map((study) => (
                                <motion.div
                                    key={study.client}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                                    transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                                >
                                    <Card tilt className="h-full hover:border-electric-purple/30 transition-all duration-300 group cursor-pointer">
                                        <CardHeader>
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-xs font-mono text-electric-purple bg-electric-purple/10 px-2.5 py-1 rounded-full border border-electric-purple/20">
                                                    {study.industry}
                                                </span>
                                                <study.icon className="h-5 w-5 text-muted-foreground group-hover:text-electric-purple transition-colors" />
                                            </div>
                                            <CardTitle className="text-xl mb-2">{study.client}</CardTitle>
                                            <CardDescription>{study.title}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-1">
                                                <p className="text-3xl font-bold text-foreground">{study.metric}</p>
                                                <p className="text-sm text-muted-foreground">{study.metricLabel}</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                                {study.description}
                                            </p>
                                            <div className="flex items-center text-sm font-medium text-electric-purple opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                                Read Case Study <ArrowRight className="ml-2 h-4 w-4" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
