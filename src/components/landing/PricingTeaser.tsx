import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/design-system/Card";
import { Button } from "@/components/ui/design-system/Button";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/animations";
import { Check, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const tiers = [
    {
        name: "Starter",
        price: "$10k - $25k",
        description: "Single-agent deployment for specific workflows.",
        features: ["1 Custom AI Agent", "Standard Integration", "Email Support", "30-Day Warranty"],
        cta: "Start Project",
        variant: "outline" as const,
    },
    {
        name: "Growth",
        price: "$50k - $100k",
        description: "Multi-agent ecosystem for department-wide automation.",
        features: ["3-5 Custom Agents", "Advanced Integrations", "Priority Support", "Training & Onboarding"],
        cta: "Scale Up",
        variant: "neubrutalist" as const,
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Full-scale AI infrastructure and strategic talent placement.",
        features: ["Unlimited Agents", "Custom LLM Fine-tuning", "Dedicated Account Manager", "SLA & 24/7 Support"],
        cta: "Contact Sales",
        variant: "outline" as const,
    },
];

import { useChat } from "@/context/ChatContext";

export const PricingTeaser = () => {
    const { openChat } = useChat();
    const navigate = useNavigate();

    const handlePlanClick = (planName: string) => {
        // Navigate to login page with plan info
        navigate(`/login?plan=${encodeURIComponent(planName)}`);
    };

    return (
        <section id="pricing" className="py-24 bg-background relative">
            <div className="container px-4 md:px-6">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerChildren}
                    className="space-y-12"
                >
                    <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto space-y-4">
                        <h2 className="text-3xl md:text-5xl font-bold font-display">
                            Transparent Investment
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Choose the model that fits your growth stage. No hidden fees, just clear value.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {tiers.map((tier) => (
                            <motion.div key={tier.name} variants={fadeInUp} className="h-full">
                                <Card className={`h-full flex flex-col ${tier.popular ? 'border-electric-purple shadow-[8px_8px_0px_0px_rgba(139,92,246,0.3)]' : ''}`}>
                                    <CardHeader>
                                        <CardTitle className="text-2xl">{tier.name}</CardTitle>
                                        <CardDescription>{tier.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-6">
                                        <div className="text-3xl font-bold">{tier.price}</div>
                                        <ul className="space-y-3">
                                            {tier.features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-electric-purple" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            variant={tier.variant}
                                            className="w-full"
                                            onClick={() => handlePlanClick(tier.name)}
                                        >
                                            {tier.cta}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div variants={fadeInUp} className="text-center">
                        <p className="text-muted-foreground mb-4">Need a custom solution?</p>
                        <Button
                            variant="ghost"
                            className="gap-2"
                            onClick={openChat}
                        >
                            <MessageSquare className="h-4 w-4" />
                            Get Custom Quote via AI Assistant
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
