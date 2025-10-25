import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
        Home
      </Link>
      <Link to="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
        Categories
      </Link>
      <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
        About
      </Link>
      <Button asChild size="sm" className="mt-2 md:mt-0">
        <Link to="/create-post">
          <PlusCircle className="w-4 h-4 mr-2" /> New Post
        </Link>
      </Button>
    </div>
  );

  return (
    <header className="border-b border-muted sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="container flex items-center justify-between py-3">
        {/* Logo / Title */}
        <Link to="/" className="font-bold text-lg md:text-xl tracking-tight">
          MyBlog
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <NavLinks />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
