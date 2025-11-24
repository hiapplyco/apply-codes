import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="bg-background border-t border-border py-12">
      <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-xl font-bold font-display">Apply, Co.</span>
          <p className="text-sm text-muted-foreground">
            © 2025 Apply, Co. All rights reserved.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
          <Leaf className="h-3 w-3" />
          <span>Carbon Neutral</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
