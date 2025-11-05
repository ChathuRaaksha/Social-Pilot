import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer className="bg-accent text-accent-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <img src={logo} alt="SocialPilot" className="w-8 h-8" />
            <span className="text-xl font-bold">SocialPilot</span>
          </div>
          <p className="text-accent-foreground/80 text-center md:text-right">
            © 2025 SocialPilot. Built with ❤️ by SU Heroes
          </p>
        </div>
      </div>
    </footer>
  );
};