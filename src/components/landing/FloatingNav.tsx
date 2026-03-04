import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/design-system/Button";
import { Home, Layers, Users, MessageSquare } from "lucide-react";

import { useChat } from "@/context/ChatContext";

export const FloatingNav = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { toggleChat } = useChat();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
        e.preventDefault();
        if (href === "#") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (href === "#chat") {
            toggleChat();
        } else {
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    const navItems = [
        { name: "Home", icon: Home, href: "#" },
        { name: "Services", icon: Layers, href: "#services" },
        { name: "Case Studies", icon: Users, href: "#case-studies" },
        { name: "Chat", icon: MessageSquare, href: "#chat" },
    ];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4"
                >
                    <div
                        className="flex items-center gap-2 p-2 rounded-2xl bg-background/70 backdrop-blur-xl border border-border/40 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                        onMouseEnter={() => setIsExpanded(true)}
                        onMouseLeave={() => setIsExpanded(false)}
                    >
                        <div className="flex items-center gap-1">
                            <div
                                className="h-8 w-8 rounded-full bg-gradient-to-br from-electric-purple to-violet-600 flex items-center justify-center text-white font-bold font-display cursor-pointer shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            >
                                A
                            </div>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.span
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: "auto", opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden whitespace-nowrap font-bold font-display pr-2 cursor-pointer"
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    >
                                        Apply, Co.
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-6 w-px bg-border/40 mx-1" />

                        <nav className="flex items-center gap-1">
                            {navItems.map((item) => (
                                <Button
                                    key={item.name}
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-white/10"
                                    title={item.name}
                                    onClick={(e) => scrollToSection(e, item.href)}
                                >
                                    <item.icon className="h-4 w-4" />
                                </Button>
                            ))}
                        </nav>

                        <div className="h-6 w-px bg-border/40 mx-1" />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full px-4 mr-1 hover:bg-white/10"
                            onClick={() => window.location.href = '/login'}
                        >
                            Login
                        </Button>

                        <Button
                            variant="neubrutalist"
                            size="sm"
                            className="rounded-full px-4"
                            onClick={(e) => scrollToSection(e, "#pricing")}
                        >
                            Get Started
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
